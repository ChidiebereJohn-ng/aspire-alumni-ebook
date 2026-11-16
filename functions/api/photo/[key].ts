import { Env } from '../../types';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { params, env } = context;
  const key = params.key as string;

  if (!key) {
    return new Response('Not found', { status: 404 });
  }

  // 1. Try reading from Cloudflare R2
  if (env.STORAGE) {
    try {
      const object = await env.STORAGE.get(`photos/${key}`);
      if (object) {
        const headers = new Headers();
        headers.set('Content-Type', object.httpMetadata?.contentType || 'image/jpeg');
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        headers.set('ETag', object.httpEtag);
        headers.set('Access-Control-Allow-Origin', '*');
        return new Response(object.body, { headers });
      }
    } catch (err) {
      console.warn('R2 get error:', err);
    }
  }

  // 2. Try reading from Cloudflare D1 database (persisted directly in D1)
  if (env.DB) {
    try {
      const cleanKey = key.replace(/\.jpg$/i, '');
      const row: any = await env.DB.prepare(
        'SELECT content_type, data FROM photos WHERE key = ? OR key = ? OR key = ? LIMIT 1'
      ).bind(key, `${cleanKey}.jpg`, cleanKey).first();

      if (row && row.data) {
        let base64 = row.data as string;
        if (base64.includes(',')) {
          base64 = base64.split(',')[1];
        }
        const binaryStr = atob(base64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }

        return new Response(bytes, {
          headers: {
            'Content-Type': row.content_type || 'image/jpeg',
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    } catch (d1Err) {
      console.warn('D1 photo fetch error:', d1Err);
    }
  }

  // 3. Fallback: Generate an elegant brand-colored SVG avatar with star motif
  const initials = key.slice(0, 2).toUpperCase();
  const svg = `
    <svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#148D93" />
          <stop offset="100%" stop-color="#0E6B70" />
        </linearGradient>
      </defs>
      <rect width="400" height="400" fill="url(#grad)" />
      <circle cx="200" cy="160" r="70" fill="#E6F4F4" fill-opacity="0.3" />
      <path d="M100 340 C100 260, 300 260, 300 340 Z" fill="#E6F4F4" fill-opacity="0.3" />
      <polygon points="200,80 205,95 220,95 208,105 212,120 200,110 188,120 192,105 180,95 195,95" fill="#F5A623" />
    </svg>
  `;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
