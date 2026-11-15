import { Env, AlumniRecord } from '../../types';
import { DEFAULT_SESSION_SECRET, verifyAdminSession } from '../../utils/auth';

function parseCsv(text: string): Record<string, string>[] {
  const lines: string[] = [];
  let currentLine = '';
  let insideQuote = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (insideQuote && text[i + 1] === '"') {
        currentLine += '"';
        i++; // skip next quote
      } else {
        insideQuote = !insideQuote;
      }
    } else if ((char === '\n' || char === '\r') && !insideQuote) {
      if (char === '\r' && text[i + 1] === '\n') {
        i++;
      }
      if (currentLine.trim().length > 0) {
        lines.push(currentLine);
      }
      currentLine = '';
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim().length > 0) {
    lines.push(currentLine);
  }

  if (lines.length < 2) return [];

  const splitRow = (row: string): string[] => {
    const cells: string[] = [];
    let cell = '';
    let inQuote = false;
    for (let i = 0; i < row.length; i++) {
      const c = row[i];
      if (c === '"') {
        if (inQuote && row[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuote = !inQuote;
        }
      } else if (c === ',' && !inQuote) {
        cells.push(cell.trim());
        cell = '';
      } else {
        cell += c;
      }
    }
    cells.push(cell.trim());
    return cells;
  };

  const rawHeaders = splitRow(lines[0]);
  const normalizeHeader = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, '');

  const headerMap: Record<number, string> = {};
  rawHeaders.forEach((h, idx) => {
    const norm = normalizeHeader(h);
    if (['surname', 'lastname', 'familyname'].includes(norm)) headerMap[idx] = 'surname';
    else if (['firstname', 'first', 'givenname'].includes(norm)) headerMap[idx] = 'first_name';
    else if (['cohort', 'cohortyear', 'year', 'class'].includes(norm)) headerMap[idx] = 'cohort_year';
    else if (['industry', 'sector'].includes(norm)) headerMap[idx] = 'industry';
    else if (['role', 'title', 'jobtitle', 'position'].includes(norm)) headerMap[idx] = 'role';
    else if (['employer', 'company', 'organization', 'organisation'].includes(norm)) headerMap[idx] = 'employer';
    else if (['city', 'town'].includes(norm)) headerMap[idx] = 'city';
    else if (['state', 'province', 'region'].includes(norm)) headerMap[idx] = 'state';
    else if (['country'].includes(norm)) headerMap[idx] = 'country';
    else if (['advice', 'quote', 'wordsofwisdom'].includes(norm)) headerMap[idx] = 'advice';
    else if (['linkedin', 'linkedinurl', 'profilelink'].includes(norm)) headerMap[idx] = 'linkedin_url';
  });

  const parsedRows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitRow(lines[i]);
    const rowObj: Record<string, string> = {};
    cells.forEach((val, idx) => {
      const field = headerMap[idx];
      if (field) {
        rowObj[field] = val;
      }
    });
    // Require at least a name
    if (rowObj.surname || rowObj.first_name) {
      parsedRows.push(rowObj);
    }
  }

  return parsedRows;
}

function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const cookieHeader = request.headers.get('Cookie');
  const sessionSecret = env.ADMIN_SESSION_SECRET || DEFAULT_SESSION_SECRET;

  const isValid = await verifyAdminSession(cookieHeader, sessionSecret);
  if (!isValid) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = (await request.json()) as any;
    const { action } = body;

    if (action === 'preview') {
      const csvText = body.csvText || '';
      if (!csvText.trim()) {
        return new Response(JSON.stringify({ success: false, error: 'CSV data is empty.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const rows = parseCsv(csvText);
      if (rows.length === 0) {
        return new Response(JSON.stringify({ success: false, error: 'No valid rows found in CSV.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Fetch all non-deleted alumni to compare against
      const existingAlumni = await env.DB.prepare(`
        SELECT id, surname, first_name, cohort_year, industry, role, employer, city, state, country, advice, linkedin_url
        FROM alumni
        WHERE deleted_at IS NULL
      `).all<{
        id: string;
        surname: string;
        first_name: string;
        cohort_year: number;
        industry: string;
        role: string;
        employer: string;
        city: string;
        state: string;
        country: string;
        advice: string;
        linkedin_url: string;
      }>();

      const existing = existingAlumni.results || [];

      let countNew = 0;
      let countDuplicate = 0;
      let countPossible = 0;

      const previewRows = rows.map((row, index) => {
        const surname = (row.surname || '').trim();
        const firstName = (row.first_name || '').trim();
        const cohort = parseInt(row.cohort_year || '2026', 10) || 2026;

        const cleanSurname = surname.toLowerCase();
        const cleanFirst = firstName.toLowerCase();
        const fullName = `${cleanSurname} ${cleanFirst}`;

        let status: 'new' | 'duplicate' | 'possible_duplicate' = 'new';
        let matchedId: string | null = null;
        let matchedName: string | null = null;
        let matchedCohort: number | null = null;
        let reason = '';
        let decision: 'skip' | 'update' | 'import' = 'import';

        // 1. Check exact match: surname + first_name + cohort_year
        const exactMatch = existing.find(
          (ex) =>
            ex.surname.trim().toLowerCase() === cleanSurname &&
            ex.first_name.trim().toLowerCase() === cleanFirst &&
            ex.cohort_year === cohort
        );

        if (exactMatch) {
          status = 'duplicate';
          matchedId = exactMatch.id;
          matchedName = `${exactMatch.first_name} ${exactMatch.surname}`;
          matchedCohort = exactMatch.cohort_year;
          reason = `Exact match in Cohort ${cohort}`;
          decision = 'skip';
          countDuplicate++;
        } else {
          // 2. Check same name in different cohort
          const diffCohortMatch = existing.find(
            (ex) =>
              ex.surname.trim().toLowerCase() === cleanSurname &&
              ex.first_name.trim().toLowerCase() === cleanFirst
          );

          if (diffCohortMatch) {
            status = 'possible_duplicate';
            matchedId = diffCohortMatch.id;
            matchedName = `${diffCohortMatch.first_name} ${diffCohortMatch.surname}`;
            matchedCohort = diffCohortMatch.cohort_year;
            reason = `Same name in Cohort ${diffCohortMatch.cohort_year}`;
            decision = 'skip';
            countPossible++;
          } else {
            // 3. Check 1-letter typo in same cohort
            const typoMatch = existing.find((ex) => {
              if (ex.cohort_year !== cohort) return false;
              const exFullName = `${ex.surname.trim().toLowerCase()} ${ex.first_name.trim().toLowerCase()}`;
              return levenshteinDistance(fullName, exFullName) <= 1;
            });

            if (typoMatch) {
              status = 'possible_duplicate';
              matchedId = typoMatch.id;
              matchedName = `${typoMatch.first_name} ${typoMatch.surname}`;
              matchedCohort = typoMatch.cohort_year;
              reason = `Possible typo of ${typoMatch.first_name} ${typoMatch.surname}`;
              decision = 'skip';
              countPossible++;
            } else {
              status = 'new';
              decision = 'import';
              countNew++;
            }
          }
        }

        return {
          tempId: `row_${index}`,
          data: {
            surname,
            first_name: firstName,
            cohort_year: cohort,
            industry: row.industry || '',
            role: row.role || '',
            employer: row.employer || '',
            city: row.city || '',
            state: row.state || '',
            country: row.country || 'Nigeria',
            advice: row.advice || '',
            linkedin_url: row.linkedin_url || '',
          },
          status,
          matchedId,
          matchedName,
          matchedCohort,
          reason,
          decision,
        };
      });

      return new Response(
        JSON.stringify({
          success: true,
          previewRows,
          summary: {
            total: previewRows.length,
            newCount: countNew,
            duplicateCount: countDuplicate,
            possibleCount: countPossible,
          },
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'commit') {
      const items = (body.items || []) as Array<{
        tempId: string;
        data: Record<string, any>;
        decision: 'skip' | 'update' | 'import';
        matchedId?: string;
      }>;

      if (items.length === 0) {
        return new Response(JSON.stringify({ success: false, error: 'No items to process.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      let importedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;

      const statements: D1PreparedStatement[] = [];

      for (const item of items) {
        if (item.decision === 'skip') {
          skippedCount++;
          continue;
        }

        if (item.decision === 'update' && item.matchedId) {
          statements.push(
            env.DB.prepare(`
              UPDATE alumni
              SET
                surname = COALESCE(NULLIF(?, ''), surname),
                first_name = COALESCE(NULLIF(?, ''), first_name),
                industry = COALESCE(NULLIF(?, ''), industry),
                role = COALESCE(NULLIF(?, ''), role),
                employer = COALESCE(NULLIF(?, ''), employer),
                city = COALESCE(NULLIF(?, ''), city),
                state = COALESCE(NULLIF(?, ''), state),
                country = COALESCE(NULLIF(?, ''), country),
                advice = COALESCE(NULLIF(?, ''), advice),
                linkedin_url = COALESCE(NULLIF(?, ''), linkedin_url),
                updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `).bind(
              item.data.surname || '',
              item.data.first_name || '',
              item.data.industry || '',
              item.data.role || '',
              item.data.employer || '',
              item.data.city || '',
              item.data.state || '',
              item.data.country || 'Nigeria',
              item.data.advice || '',
              item.data.linkedin_url || '',
              item.matchedId
            )
          );
          updatedCount++;
        } else if (item.decision === 'import') {
          const newId = crypto.randomUUID();
          const editToken = crypto.randomUUID().replace(/-/g, '');

          statements.push(
            env.DB.prepare(`
              INSERT INTO alumni (
                id, surname, first_name, photo_key, city, state, country,
                employer, role, industry, cohort_year, advice,
                status, edit_token, consent, linkedin_url,
                source, created_at, updated_at
              ) VALUES (
                ?, ?, ?, NULL, ?, ?, ?,
                ?, ?, ?, ?, ?,
                'pending', ?, 1, ?,
                'import', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
              )
            `).bind(
              newId,
              item.data.surname || '',
              item.data.first_name || '',
              item.data.city || '',
              item.data.state || '',
              item.data.country || 'Nigeria',
              item.data.employer || '',
              item.data.role || '',
              item.data.industry || '',
              parseInt(item.data.cohort_year || '2026', 10) || 2026,
              item.data.advice || '',
              editToken,
              item.data.linkedin_url || ''
            )
          );
          importedCount++;
        }
      }

      if (statements.length > 0) {
        // Run in batches of 50 to stay well under D1 limits
        const chunkSize = 50;
        for (let i = 0; i < statements.length; i += chunkSize) {
          const chunk = statements.slice(i, i + chunkSize);
          await env.DB.batch(chunk);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          importedCount,
          updatedCount,
          skippedCount,
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ success: false, error: 'Invalid action.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
