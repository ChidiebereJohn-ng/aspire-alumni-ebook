import { Env } from '../types';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;
  const startTime = Date.now();

  let dbStatus = 'disconnected';
  let totalAlumni = 0;
  let settings = null;
  let dbError = null;

  try {
    if (env.DB) {
      const countResult = await env.DB.prepare('SELECT COUNT(*) as total FROM alumni').first<{ total: number }>();
      totalAlumni = countResult?.total ?? 0;

      const settingsResult = await env.DB.prepare('SELECT * FROM settings WHERE id = 1').first();
      settings = settingsResult;

      dbStatus = 'connected';
    } else {
      dbStatus = 'missing_binding';
    }
  } catch (err: any) {
    dbStatus = 'error';
    dbError = err?.message || String(err);
  }

  const r2Bound = Boolean(env.STORAGE);

  return new Response(
    JSON.stringify(
      {
        status: 'online',
        service: 'Aspire for Excellence Foundation — Alumni Directory & E-Book API',
        environment: env.ENVIRONMENT || 'development',
        responseTimeMs: Date.now() - startTime,
        database: {
          status: dbStatus,
          binding: 'DB',
          totalAlumniRecords: totalAlumni,
          settings,
          error: dbError,
        },
        storage: {
          binding: 'STORAGE',
          bound: r2Bound,
          type: 'Cloudflare R2 Object Storage',
        },
        designTokens: {
          primary: '#148D93',
          accent: '#F7822D',
          gold: '#F5A623',
          red: '#D63A3F',
          charcoal: '#1F2A30',
          cream: '#FBF8F4',
        },
        timestamp: new Date().toISOString(),
      },
      null,
      2
    ),
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    }
  );
};
