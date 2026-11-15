import { Env, SettingsRecord } from '../../types';
import { DEFAULT_SESSION_SECRET, verifyAdminSession } from '../../utils/auth';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { params, request, env } = context;
  const scope = params.scope as string;

  try {
    // 1. Check settings
    const settings = await env.DB.prepare('SELECT * FROM settings WHERE id = 1').first<SettingsRecord>();
    const isPublic = settings?.ebook_public === 1;

    // Check if admin is requesting
    const cookieHeader = request.headers.get('Cookie');
    const sessionSecret = env.ADMIN_SESSION_SECRET || DEFAULT_SESSION_SECRET;
    const isAdmin = await verifyAdminSession(cookieHeader, sessionSecret);

    if (!isPublic && !isAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: 'E-Book publication is currently private.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Fetch latest edition for scope
    let ebook;
    if (scope === 'all') {
      ebook = await env.DB.prepare('SELECT * FROM ebooks WHERE scope = "all" ORDER BY generated_at DESC LIMIT 1').first();
    } else {
      ebook = await env.DB.prepare('SELECT * FROM ebooks WHERE scope = ? ORDER BY generated_at DESC LIMIT 1').bind(scope).first();
    }

    // Track download event
    try {
      await env.DB.prepare(`
        INSERT INTO events (type, cohort_year, created_at)
        VALUES ('ebook_download', ?, CURRENT_TIMESTAMP)
      `).bind(scope !== 'all' ? parseInt(scope, 10) : null).run();
    } catch {}

    return new Response(JSON.stringify({ success: true, ebook }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
