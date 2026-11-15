import { Env, AlumniRecord } from '../../types';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { params, env } = context;
  const token = params.token as string;

  if (!token) {
    return new Response(JSON.stringify({ success: false, error: 'Token is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const record = await env.DB.prepare('SELECT * FROM alumni WHERE edit_token = ?').bind(token).first<AlumniRecord>();

    if (!record) {
      return new Response(JSON.stringify({ success: false, error: 'Alumni record not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, alumni: record }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  const { params, request, env } = context;
  const token = params.token as string;

  if (!token) {
    return new Response(JSON.stringify({ success: false, error: 'Token is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const record = await env.DB.prepare('SELECT * FROM alumni WHERE edit_token = ?').bind(token).first<AlumniRecord>();

    if (!record) {
      return new Response(JSON.stringify({ success: false, error: 'Alumni record not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body: any = await request.json();
    const {
      surname,
      first_name,
      photo,
      city,
      state,
      employer,
      role,
      industry,
      cohort_year,
      advice,
      linkedin_url,
      hide_employer = 0,
      hide_city = 0,
    } = body;

    let photoKey = record.photo_key;

    // Handle updated photo
    if (photo && typeof photo === 'string' && photo.startsWith('data:image/')) {
      photoKey = `${record.id}.jpg`;
      if (env.STORAGE) {
        try {
          const base64Data = photo.split(',')[1];
          const binaryStr = atob(base64Data);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }

          await env.STORAGE.put(`photos/${photoKey}`, bytes, {
            httpMetadata: { contentType: 'image/jpeg' },
          });
        } catch (r2Err) {
          console.warn('Failed to upload photo to R2 storage:', r2Err);
        }
      }
    }

    const cohortYearNum = parseInt(cohort_year, 10) || record.cohort_year;

    await env.DB.prepare(`
      UPDATE alumni SET
        surname = ?,
        first_name = ?,
        photo_key = ?,
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
      WHERE edit_token = ?
    `).bind(
      surname?.trim() || record.surname,
      first_name?.trim() || record.first_name,
      photoKey,
      city !== undefined ? city.trim() : record.city,
      state || record.state,
      employer !== undefined ? employer.trim() : record.employer,
      role !== undefined ? role.trim() : record.role,
      industry || record.industry,
      cohortYearNum,
      advice !== undefined ? advice.trim() : record.advice,
      linkedin_url !== undefined ? linkedin_url.trim() : record.linkedin_url,
      hide_employer ? 1 : 0,
      hide_city ? 1 : 0,
      token
    ).run();

    return new Response(JSON.stringify({ success: true, photo_key: photoKey }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { params, env } = context;
  const token = params.token as string;

  if (!token) {
    return new Response(JSON.stringify({ success: false, error: 'Token is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Soft remove: set removed_at and status = 'hidden' per Section 6.7
    const res = await env.DB.prepare(`
      UPDATE alumni SET
        status = 'hidden',
        removed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE edit_token = ?
    `).bind(token).run();

    if (res.meta.changes === 0) {
      return new Response(JSON.stringify({ success: false, error: 'Record not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, message: 'Alumni profile removed from directory' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
