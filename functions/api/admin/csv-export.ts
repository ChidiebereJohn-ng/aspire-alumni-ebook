import { Env, AlumniRecord } from '../../types';
import { DEFAULT_SESSION_SECRET, verifyAdminSession } from '../../utils/auth';

function escapeCsvCell(value: any): string {
  if (value === null || value === undefined) return '""';
  const str = String(value);
  // If string contains comma, quote, or newline, escape quotes and wrap in quotes
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

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

  const url = new URL(request.url);
  const cohort = url.searchParams.get('cohort');
  const status = url.searchParams.get('status');

  try {
    let query = `SELECT * FROM alumni WHERE deleted_at IS NULL`;
    const params: any[] = [];

    if (cohort && cohort !== 'all') {
      query += ` AND cohort_year = ?`;
      params.push(parseInt(cohort, 10));
    }

    if (status && status !== 'all') {
      query += ` AND status = ?`;
      params.push(status);
    }

    query += ` ORDER BY cohort_year DESC, surname ASC, first_name ASC`;

    const records = await env.DB.prepare(query).bind(...params).all<AlumniRecord>();

    const headers = [
      'ID',
      'Surname',
      'First Name',
      'Cohort Year',
      'Industry',
      'Role',
      'Employer',
      'City',
      'State',
      'Country',
      'Advice Quote',
      'LinkedIn URL',
      'Status',
      'Featured',
      'Hide Employer',
      'Hide City',
      'Source',
      'Created At',
    ];

    const rows = (records.results || []).map((row) => [
      row.id,
      row.surname,
      row.first_name,
      row.cohort_year,
      row.industry || '',
      row.role || '',
      row.employer || '',
      row.city || '',
      row.state || '',
      row.country || 'Nigeria',
      row.advice || '',
      row.linkedin_url || '',
      row.status,
      row.featured ? 'Yes' : 'No',
      row.hide_employer ? 'Yes' : 'No',
      row.hide_city ? 'Yes' : 'No',
      row.source || 'form',
      row.created_at || '',
    ]);

    const csvContent = [
      headers.map(escapeCsvCell).join(','),
      ...rows.map((r) => r.map(escapeCsvCell).join(',')),
    ].join('\r\n');

    const today = new Date().toISOString().slice(0, 10);
    const filename = `aspire_alumni_export_${today}.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
