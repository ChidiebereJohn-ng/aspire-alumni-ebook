import { Env } from '../types';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const body = (await request.json()) as {
      type: string;
      cohort_year?: number;
      alumni_id?: string;
    };

    const validTypes = ['ebook_download', 'directory_view', 'profile_view'];
    if (!body || !validTypes.includes(body.type)) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid event type.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cohortYear = body.cohort_year ? parseInt(String(body.cohort_year), 10) : null;
    const alumniId = body.alumni_id || null;

    await env.DB.prepare(`
      INSERT INTO events (type, cohort_year, alumni_id, created_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(body.type, cohortYear, alumniId).run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
