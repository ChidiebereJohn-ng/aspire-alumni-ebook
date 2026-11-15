import { Env } from '../../types';
import { 
  DEFAULT_ADMIN_PASSWORD, 
  DEFAULT_SESSION_SECRET, 
  SESSION_COOKIE_NAME, 
  createAdminToken 
} from '../../utils/auth';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const { password } = (await request.json()) as any;
    const adminPassword = env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
    const sessionSecret = env.ADMIN_SESSION_SECRET || DEFAULT_SESSION_SECRET;

    if (!password || password !== adminPassword) {
      return new Response(
        JSON.stringify({ success: false, error: 'Incorrect administrator password.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { token, maxAge } = await createAdminToken(sessionSecret);

    // Set HttpOnly, Secure, SameSite=Strict cookie
    const isHttps = request.url.startsWith('https');
    const cookieHeader = `${SESSION_COOKIE_NAME}=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Strict${isHttps ? '; Secure' : ''}`;

    return new Response(
      JSON.stringify({ success: true, message: 'Authentication successful.' }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': cookieHeader,
        },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || 'Login error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
