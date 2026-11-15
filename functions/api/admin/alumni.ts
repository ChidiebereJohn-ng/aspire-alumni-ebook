import { Env, AlumniRecord } from '../../types';
import { DEFAULT_SESSION_SECRET, verifyAdminSession } from '../../utils/auth';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const cookieHeader = request.headers.get('Cookie');
  const sessionSecret = env.ADMIN_SESSION_SECRET || DEFAULT_SESSION_SECRET;

  const isValid = await verifyAdminSession(cookieHeader, sessionSecret);
  if (!isValid) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized. Please login.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(request.url);
  const view = url.searchParams.get('view') || 'pending'; // 'pending' | 'all' | 'approved' | 'hidden' | 'deleted'
  const cohortFilter = url.searchParams.get('cohort');

  try {
    // 1. Fetch counts & metrics
    const statsQuery = await env.DB.prepare(`
      SELECT
        COUNT(CASE WHEN deleted_at IS NULL AND status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN deleted_at IS NULL AND status = 'approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN deleted_at IS NULL AND status = 'hidden' THEN 1 END) as hidden_count,
        COUNT(CASE WHEN deleted_at IS NOT NULL AND deleted_at >= datetime('now', '-30 days') THEN 1 END) as deleted_count,
        COUNT(CASE WHEN deleted_at IS NULL THEN 1 END) as total_active
      FROM alumni
    `).first<{
      pending_count: number;
      approved_count: number;
      hidden_count: number;
      deleted_count: number;
      total_active: number;
    }>();

    // 2. Fetch counts per cohort
    const cohortCountsResult = await env.DB.prepare(`
      SELECT cohort_year, COUNT(*) as count
      FROM alumni
      WHERE deleted_at IS NULL
      GROUP BY cohort_year
      ORDER BY cohort_year DESC
    `).all<{ cohort_year: number; count: number }>();

    const cohortCounts: Record<string, number> = {};
    for (const row of cohortCountsResult.results) {
      cohortCounts[String(row.cohort_year)] = row.count;
    }

    // 3. Query items based on selected view
    let query = '';
    const params: any[] = [];

    if (view === 'deleted') {
      query = `SELECT * FROM alumni WHERE deleted_at IS NOT NULL AND deleted_at >= datetime('now', '-30 days')`;
    } else if (view === 'pending') {
      query = `SELECT * FROM alumni WHERE deleted_at IS NULL AND status = 'pending'`;
    } else if (view === 'approved') {
      query = `SELECT * FROM alumni WHERE deleted_at IS NULL AND status = 'approved'`;
    } else if (view === 'hidden') {
      query = `SELECT * FROM alumni WHERE deleted_at IS NULL AND status = 'hidden'`;
    } else {
      // 'all' active entries
      query = `SELECT * FROM alumni WHERE deleted_at IS NULL`;
    }

    if (cohortFilter && cohortFilter !== 'all') {
      query += ` AND cohort_year = ?`;
      params.push(parseInt(cohortFilter, 10));
    }

    query += ` ORDER BY created_at DESC`;

    const records = await env.DB.prepare(query).bind(...params).all<AlumniRecord>();

    // 4. Duplicate Check Logic (Blueprint Section 6.2):
    // "A duplicate is the same surname, first name, and cohort, ignoring capitalization and extra spaces.
    // Form submissions that match an existing entry are flagged in the pending queue with a link to the original."
    const allActive = await env.DB.prepare(
      `SELECT id, surname, first_name, cohort_year FROM alumni WHERE deleted_at IS NULL`
    ).all<{ id: string; surname: string; first_name: string; cohort_year: number }>();

    const activeList = allActive.results || [];

    const items = records.results.map((item) => {
      const cleanSurname = item.surname.trim().toLowerCase();
      const cleanFirst = item.first_name.trim().toLowerCase();

      // Find another active record with exact same surname, first name, and cohort
      const exactMatch = activeList.find(
        (ex) =>
          ex.id !== item.id &&
          ex.surname.trim().toLowerCase() === cleanSurname &&
          ex.first_name.trim().toLowerCase() === cleanFirst &&
          ex.cohort_year === item.cohort_year
      );

      // Find another active record with same surname, first name in a different cohort
      const diffCohortMatch = !exactMatch
        ? activeList.find(
            (ex) =>
              ex.id !== item.id &&
              ex.surname.trim().toLowerCase() === cleanSurname &&
              ex.first_name.trim().toLowerCase() === cleanFirst
          )
        : null;

      return {
        ...item,
        is_duplicate: !!exactMatch,
        duplicate_matched_id: exactMatch ? exactMatch.id : null,
        is_possible_duplicate: !exactMatch && !!diffCohortMatch,
        duplicate_possible_reason: diffCohortMatch ? `Same name in Cohort ${diffCohortMatch.cohort_year}` : null,
        duplicate_possible_id: diffCohortMatch ? diffCohortMatch.id : null,
      };
    });

    return new Response(
      JSON.stringify({
        success: true,
        stats: statsQuery,
        cohortCounts,
        items,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
