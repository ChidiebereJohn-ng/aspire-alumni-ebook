import { Env } from '../../types';
import { SESSION_COOKIE_NAME } from '../../utils/auth';

export const onRequestPost: PagesFunction<Env> = async () => {
  const expiredCookie = `${SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict`;
  return new Response(JSON.stringify({ success: true, message: 'Logged out.' }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': expiredCookie,
    },
  });
};
