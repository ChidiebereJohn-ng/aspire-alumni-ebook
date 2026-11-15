import { Env, SettingsRecord } from '../../types';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;

  try {
    const settings = await env.DB.prepare('SELECT ebook_public FROM settings WHERE id = 1').first<SettingsRecord>();
    if (!settings || settings.ebook_public !== 1) {
      return new Response(JSON.stringify({ success: false, error: 'E-Books are currently private.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const ebooks = await env.DB.prepare(`
      SELECT id, edition_name, scope, generated_at
      FROM ebooks
      ORDER BY generated_at DESC
    `).all();

    return new Response(JSON.stringify({ success: true, ebooks: ebooks.results }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
