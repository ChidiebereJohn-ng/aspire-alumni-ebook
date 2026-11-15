import { Env, AlumniRecord, SettingsRecord } from '../types';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  const q = url.searchParams.get('q')?.trim().toLowerCase() || '';
  const cohortParam = url.searchParams.get('cohort');
  const industryParam = url.searchParams.get('industry');
  const stateParam = url.searchParams.get('state');

  try {
    // 1. Fetch settings to verify if directory is public
    const settings = await env.DB.prepare('SELECT * FROM settings WHERE id = 1').first<SettingsRecord>();

    // 2. Fetch state counts for the interactive State Tiles view (Section 6.10)
    const stateCountsResult = await env.DB.prepare(`
      SELECT state, COUNT(*) as count
      FROM alumni
      WHERE deleted_at IS NULL AND status = 'approved'
      GROUP BY state
    `).all<{ state: string; count: number }>();

    const stateCounts: Record<string, number> = {};
    for (const row of stateCountsResult.results) {
      if (row.state) {
        stateCounts[row.state] = row.count;
      }
    }

    // 3. Fetch featured alumni (Section 6.9)
    const featuredResult = await env.DB.prepare(`
      SELECT * FROM alumni
      WHERE deleted_at IS NULL AND status = 'approved' AND featured = 1
      ORDER BY updated_at DESC
      LIMIT 10
    `).all<AlumniRecord>();

    // 4. Build dynamic query for approved alumni grid
    let query = `
      SELECT * FROM alumni
      WHERE deleted_at IS NULL AND status = 'approved'
    `;
    const params: any[] = [];

    if (cohortParam && cohortParam !== 'all') {
      query += ` AND cohort_year = ?`;
      params.push(parseInt(cohortParam, 10));
    }

    if (industryParam && industryParam !== 'all') {
      query += ` AND industry = ?`;
      params.push(industryParam);
    }

    if (stateParam && stateParam !== 'all') {
      query += ` AND state = ?`;
      params.push(stateParam);
    }

    query += ` ORDER BY cohort_year DESC, surname ASC`;

    const result = await env.DB.prepare(query).bind(...params).all<AlumniRecord>();

    // Apply live search filter and privacy masking
    let records = result.results;
    if (q) {
      records = records.filter((item) => {
        const fullName = `${item.first_name} ${item.surname}`.toLowerCase();
        const role = (item.role || '').toLowerCase();
        const employer = item.hide_employer ? '' : (item.employer || '').toLowerCase();
        const city = item.hide_city ? '' : (item.city || '').toLowerCase();
        const state = (item.state || '').toLowerCase();
        const industry = (item.industry || '').toLowerCase();
        return (
          fullName.includes(q) ||
          role.includes(q) ||
          employer.includes(q) ||
          city.includes(q) ||
          state.includes(q) ||
          industry.includes(q)
        );
      });
    }

    // Mask privacy fields on public output
    const sanitize = (item: AlumniRecord) => ({
      id: item.id,
      surname: item.surname,
      first_name: item.first_name,
      photo_key: item.photo_key,
      city: item.hide_city ? null : item.city,
      state: item.state,
      employer: item.hide_employer ? null : item.employer,
      role: item.role,
      industry: item.industry,
      cohort_year: item.cohort_year,
      advice: item.advice,
      linkedin_url: item.linkedin_url,
      featured: item.featured,
      country: item.country,
      hide_employer: item.hide_employer,
      hide_city: item.hide_city,
      created_at: item.created_at,
    });

    const publicAlumni = records.map(sanitize);
    const publicFeatured = featuredResult.results.map(sanitize);

    // Record directory view event (non-blocking)
    try {
      await env.DB.prepare(`
        INSERT INTO events (type, created_at) VALUES ('directory_view', CURRENT_TIMESTAMP)
      `).run();
    } catch (e) {
      // Ignore analytics failures
    }

    return new Response(
      JSON.stringify({
        success: true,
        settings: {
          directory_public: settings?.directory_public ?? 1,
          ebook_public: settings?.ebook_public ?? 0,
        },
        alumni: publicAlumni,
        featured: publicFeatured,
        stateCounts,
        total: publicAlumni.length,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=15, stale-while-revalidate=60',
        },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
