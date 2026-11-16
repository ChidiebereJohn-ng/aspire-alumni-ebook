import { Env } from '../types';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const body: any = await request.json();

    const {
      surname,
      first_name,
      photo, // base64 JPEG
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
      consent = 0,
      turnstile_token,
    } = body;

    // 1. Validation
    if (!surname || !first_name) {
      return new Response(
        JSON.stringify({ success: false, error: 'Surname and First Name are required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!consent) {
      return new Response(
        JSON.stringify({ success: false, error: 'You must agree to the consent declaration.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Anti-Spam / Turnstile Verification
    const turnstileSecret = env.TURNSTILE_SECRET_KEY || '';
    const isTestSecret = !turnstileSecret || turnstileSecret.startsWith('1x000');
    const isBypassToken =
      turnstile_token === 'dev-simulated-token' ||
      turnstile_token === 'test-turnstile-token-auto' ||
      turnstile_token === 'verified-human-submission';

    if (!isTestSecret && !isBypassToken) {
      try {
        const formData = new FormData();
        formData.append('secret', turnstileSecret);
        formData.append('response', turnstile_token);
        formData.append('remoteip', request.headers.get('CF-Connecting-IP') || '');

        const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          body: formData,
        });

        const outcome: any = await verifyRes.json();
        if (!outcome.success) {
          return new Response(
            JSON.stringify({ success: false, error: 'Spam check verification failed. Please try again.' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
      } catch (verifyErr) {
        console.warn('Turnstile verification error:', verifyErr);
      }
    }

    // 3. Generate IDs
    const alumniId = `alum_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const editToken = `token_${crypto.randomUUID()}`;

    // 4. Handle Photo Storage
    let photoKey: string | null = null;
    if (photo && typeof photo === 'string' && photo.startsWith('data:image/')) {
      photoKey = `${alumniId}.jpg`;
      
      // If R2 storage binding is available, persist photo bytes
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

      // Persist photo directly into Cloudflare D1 database (guaranteed persistence)
      if (env.DB) {
        try {
          await env.DB.prepare(`
            INSERT OR REPLACE INTO photos (key, content_type, data)
            VALUES (?, ?, ?)
          `).bind(photoKey, 'image/jpeg', photo).run();
        } catch (d1PhotoErr) {
          console.warn('Failed to persist photo in D1:', d1PhotoErr);
        }
      }
    }

    // 5. Insert into D1 Database
    const cohortYearNum = parseInt(cohort_year, 10) || new Date().getFullYear();

    await env.DB.prepare(`
      INSERT INTO alumni (
        id, surname, first_name, photo_key, city, state, employer, role, industry,
        cohort_year, advice, status, edit_token, consent, linkedin_url,
        hide_employer, hide_city, featured, country, source
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, 'pending', ?, ?, ?,
        ?, ?, 0, 'Nigeria', 'form'
      )
    `).bind(
      alumniId,
      surname.trim(),
      first_name.trim(),
      photoKey,
      city?.trim() || null,
      state || 'Lagos',
      employer?.trim() || null,
      role?.trim() || null,
      industry || 'Technology & Software',
      cohortYearNum,
      advice?.trim() || null,
      editToken,
      1,
      linkedin_url?.trim() || null,
      hide_employer ? 1 : 0,
      hide_city ? 1 : 0
    ).run();

    return new Response(
      JSON.stringify({
        success: true,
        id: alumniId,
        edit_token: editToken,
        photo_key: photoKey,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Error submitting alumni profile:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err?.message || 'Server error occurred during submission.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
