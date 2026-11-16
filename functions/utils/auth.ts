export const SESSION_COOKIE_NAME = 'aspire_admin_session';
export const DEFAULT_ADMIN_PASSWORD = '@ASPIRE_@';
export const DEFAULT_SESSION_SECRET = 'aspire-alumni-secret-encryption-key-2026';

// Helper to sign data using HMAC-SHA256
async function sign(data: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Generate secure session cookie
export async function createAdminToken(secret: string): Promise<{ token: string; maxAge: number }> {
  const timestamp = Date.now();
  const maxAge = 60 * 60 * 24 * 7; // 7 days
  const expires = timestamp + maxAge * 1000;
  const payload = `admin:${expires}`;
  const signature = await sign(payload, secret);
  const token = `${btoa(payload)}.${signature}`;
  return { token, maxAge };
}

// Verify session cookie
export async function verifyAdminSession(
  cookieHeader: string | null,
  secret: string
): Promise<boolean> {
  if (!cookieHeader) return false;

  // Extract session cookie
  const cookies = cookieHeader.split(';').map((c) => c.trim());
  const sessionCookie = cookies.find((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`));
  if (!sessionCookie) return false;

  const rawValue = sessionCookie.substring(SESSION_COOKIE_NAME.length + 1);
  const parts = rawValue.split('.');
  if (parts.length !== 2) return false;

  try {
    const payload = atob(parts[0]);
    const expectedSig = await sign(payload, secret);
    if (expectedSig !== parts[1]) return false;

    const [role, expiresStr] = payload.split(':');
    if (role !== 'admin') return false;

    const expires = parseInt(expiresStr, 10);
    if (isNaN(expires) || Date.now() > expires) return false;

    return true;
  } catch {
    return false;
  }
}
