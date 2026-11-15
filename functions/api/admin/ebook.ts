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
    const list = await env.DB.prepare('SELECT * FROM ebooks ORDER BY generated_at DESC').all();
    return new Response(JSON.stringify({ success: true, ebooks: list.results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

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
    const body: any = await request.json();
    const { edition_name, scope } = body;

    const id = `ebook_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const pdfKey = `ebooks/${scope}_${Date.now()}.pdf`;

    await env.DB.prepare(`
      INSERT INTO ebooks (id, edition_name, scope, pdf_key, generated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      id,
      edition_name || `Edition ${new Date().getFullYear()}`,
      scope || 'all',
      pdfKey
    ).run();

    return new Response(JSON.stringify({ success: true, id, pdf_key: pdfKey }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
