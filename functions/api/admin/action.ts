import { Env } from '../../types';
import { DEFAULT_SESSION_SECRET, verifyAdminSession } from '../../utils/auth';

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
    const { action, id, fields } = body;

    if (!id && action !== 'bulk') {
      return new Response(JSON.stringify({ success: false, error: 'ID is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (action === 'approve') {
      await env.DB.prepare(`
        UPDATE alumni SET status = 'approved', deleted_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).bind(id).run();
      return new Response(JSON.stringify({ success: true, message: 'Alumni approved.' }));
    }

    if (action === 'hide') {
      await env.DB.prepare(`
        UPDATE alumni SET status = 'hidden', updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).bind(id).run();
      return new Response(JSON.stringify({ success: true, message: 'Alumni hidden.' }));
    }

    // Soft Delete (30-day restorable window)
    if (action === 'delete') {
      await env.DB.prepare(`
        UPDATE alumni SET deleted_at = CURRENT_TIMESTAMP, status = 'hidden', updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).bind(id).run();
      return new Response(JSON.stringify({ success: true, message: 'Moved to Recently Deleted.' }));
    }

    // Restore from Recently Deleted
    if (action === 'restore') {
      await env.DB.prepare(`
        UPDATE alumni SET deleted_at = NULL, status = 'pending', updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).bind(id).run();
      return new Response(JSON.stringify({ success: true, message: 'Entry restored.' }));
    }

    // Permanent Delete
    if (action === 'permanent_delete') {
      await env.DB.prepare(`DELETE FROM alumni WHERE id = ?`).bind(id).run();
      return new Response(JSON.stringify({ success: true, message: 'Entry permanently removed.' }));
    }

    // Toggle Featured Status
    if (action === 'toggle_featured') {
      const current = await env.DB.prepare('SELECT featured FROM alumni WHERE id = ?').bind(id).first<{ featured: number }>();
      const newFeatured = current?.featured === 1 ? 0 : 1;
      await env.DB.prepare('UPDATE alumni SET featured = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .bind(newFeatured, id).run();
      return new Response(JSON.stringify({ success: true, featured: newFeatured }));
    }

    // Edit on behalf of alumni
    if (action === 'update' && fields) {
      const {
        surname,
        first_name,
        city,
        state,
        employer,
        role,
        industry,
        cohort_year,
        advice,
        linkedin_url,
        hide_employer,
        hide_city,
      } = fields;

      await env.DB.prepare(`
        UPDATE alumni SET
          surname = ?,
          first_name = ?,
          city = ?,
          state = ?,
          employer = ?,
          role = ?,
          industry = ?,
          cohort_year = ?,
          advice = ?,
          linkedin_url = ?,
          hide_employer = ?,
          hide_city = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        surname,
        first_name,
        city || null,
        state || 'Lagos',
        employer || null,
        role || null,
        industry || 'Technology & Software',
        Number(cohort_year),
        advice || null,
        linkedin_url || null,
        hide_employer ? 1 : 0,
        hide_city ? 1 : 0,
        id
      ).run();

      return new Response(JSON.stringify({ success: true, message: 'Alumni record updated.' }));
    }

    return new Response(JSON.stringify({ success: false, error: 'Unknown action.' }), { status: 400 });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
