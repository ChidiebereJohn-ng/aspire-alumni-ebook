import { Env } from '../../types';
import { DEFAULT_SESSION_SECRET, verifyAdminSession } from '../../utils/auth';

export const onRequestGet: PagesFunction<Env> = async (context) => {
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
    // 1. Overall Event Totals (All time & Last 7 Days)
    const eventTotalsQuery = await env.DB.prepare(`
      SELECT
        COUNT(CASE WHEN type = 'directory_view' THEN 1 END) as directory_views,
        COUNT(CASE WHEN type = 'profile_view' THEN 1 END) as profile_views,
        COUNT(CASE WHEN type = 'ebook_download' THEN 1 END) as ebook_downloads,
        COUNT(CASE WHEN type = 'directory_view' AND created_at >= datetime('now', '-7 days') THEN 1 END) as directory_views_7d,
        COUNT(CASE WHEN type = 'profile_view' AND created_at >= datetime('now', '-7 days') THEN 1 END) as profile_views_7d,
        COUNT(CASE WHEN type = 'ebook_download' AND created_at >= datetime('now', '-7 days') THEN 1 END) as ebook_downloads_7d
      FROM events
    `).first<{
      directory_views: number;
      profile_views: number;
      ebook_downloads: number;
      directory_views_7d: number;
      profile_views_7d: number;
      ebook_downloads_7d: number;
    }>();

    // 2. Submissions Breakdown by Cohort (from alumni table)
    const cohortAlumniQuery = await env.DB.prepare(`
      SELECT
        cohort_year,
        COUNT(*) as total_submissions,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'hidden' THEN 1 END) as hidden_count
      FROM alumni
      WHERE deleted_at IS NULL
      GROUP BY cohort_year
      ORDER BY cohort_year DESC
    `).all<{
      cohort_year: number;
      total_submissions: number;
      approved_count: number;
      pending_count: number;
      hidden_count: number;
    }>();

    // 3. Event Breakdown by Cohort (profile views & ebook downloads per cohort)
    const cohortEventsQuery = await env.DB.prepare(`
      SELECT
        cohort_year,
        COUNT(CASE WHEN type = 'profile_view' THEN 1 END) as profile_views,
        COUNT(CASE WHEN type = 'ebook_download' THEN 1 END) as ebook_downloads
      FROM events
      WHERE cohort_year IS NOT NULL
      GROUP BY cohort_year
    `).all<{
      cohort_year: number;
      profile_views: number;
      ebook_downloads: number;
    }>();

    // Merge cohort statistics
    const eventMap: Record<number, { profile_views: number; ebook_downloads: number }> = {};
    for (const row of cohortEventsQuery.results || []) {
      eventMap[row.cohort_year] = {
        profile_views: row.profile_views || 0,
        ebook_downloads: row.ebook_downloads || 0,
      };
    }

    const cohortStats = (cohortAlumniQuery.results || []).map((row) => ({
      cohort_year: row.cohort_year,
      total_submissions: row.total_submissions,
      approved_count: row.approved_count,
      pending_count: row.pending_count,
      hidden_count: row.hidden_count,
      profile_views: eventMap[row.cohort_year]?.profile_views || 0,
      ebook_downloads: eventMap[row.cohort_year]?.ebook_downloads || 0,
    }));

    // 4. Daily timeline for the last 7 days
    const dailyTimelineQuery = await env.DB.prepare(`
      SELECT
        date(created_at) as day,
        COUNT(CASE WHEN type = 'directory_view' THEN 1 END) as directory_views,
        COUNT(CASE WHEN type = 'profile_view' THEN 1 END) as profile_views,
        COUNT(CASE WHEN type = 'ebook_download' THEN 1 END) as ebook_downloads
      FROM events
      WHERE created_at >= datetime('now', '-7 days')
      GROUP BY day
      ORDER BY day ASC
    `).all<{
      day: string;
      directory_views: number;
      profile_views: number;
      ebook_downloads: number;
    }>();

    // 5. Total pending submissions across all cohorts
    const totalPendingQuery = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM alumni WHERE deleted_at IS NULL AND status = 'pending'
    `).first<{ count: number }>();

    // 6. Total approved alumni
    const totalApprovedQuery = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM alumni WHERE deleted_at IS NULL AND status = 'approved'
    `).first<{ count: number }>();

    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          overview: {
            directory_views: eventTotalsQuery?.directory_views || 0,
            directory_views_7d: eventTotalsQuery?.directory_views_7d || 0,
            profile_views: eventTotalsQuery?.profile_views || 0,
            profile_views_7d: eventTotalsQuery?.profile_views_7d || 0,
            ebook_downloads: eventTotalsQuery?.ebook_downloads || 0,
            ebook_downloads_7d: eventTotalsQuery?.ebook_downloads_7d || 0,
            total_approved: totalApprovedQuery?.count || 0,
            total_pending: totalPendingQuery?.count || 0,
          },
          cohorts: cohortStats,
          timeline: dailyTimelineQuery.results || [],
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
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
