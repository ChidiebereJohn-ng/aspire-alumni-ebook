import React, { useState, useEffect } from 'react';
import { Eye, Users, Download, Clock, RefreshCw, BarChart2, ShieldCheck, ArrowUpRight } from 'lucide-react';

interface StatsOverview {
  directory_views: number;
  directory_views_7d: number;
  profile_views: number;
  profile_views_7d: number;
  ebook_downloads: number;
  ebook_downloads_7d: number;
  total_approved: number;
  total_pending: number;
}

interface CohortStat {
  cohort_year: number;
  total_submissions: number;
  approved_count: number;
  pending_count: number;
  hidden_count: number;
  profile_views: number;
  ebook_downloads: number;
}

interface DailyTimelineItem {
  day: string;
  directory_views: number;
  profile_views: number;
  ebook_downloads: number;
}

export const AdminStatsView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<StatsOverview | null>(null);
  const [cohorts, setCohorts] = useState<CohortStat[]>([]);
  const [timeline, setTimeline] = useState<DailyTimelineItem[]>([]);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/stats');
      if (!res.ok) throw new Error('Failed to load stats data.');
      const data = await res.json();
      if (data.success && data.stats) {
        setOverview(data.stats.overview);
        setCohorts(data.stats.cohorts || []);
        setTimeline(data.stats.timeline || []);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-8 h-8 border-3 border-brand-teal border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-brand-charcoal/60">Loading foundation analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-brand-red/20 rounded-2xl text-center space-y-3">
        <p className="text-xs font-semibold text-brand-red">{error}</p>
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-brand-teal text-white rounded-xl text-xs font-semibold hover:bg-brand-teal-dark"
        >
          Try Again
        </button>
      </div>
    );
  }

  const totalSubmissions = (overview?.total_approved || 0) + (overview?.total_pending || 0);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Bar for Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-brand-teal/10 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-brand-teal" />
            <h2 className="font-serif-title text-xl font-bold text-brand-charcoal">
              Foundation Metrics & Engagement
            </h2>
          </div>
          <p className="text-xs text-brand-charcoal/60 mt-0.5">
            Real-time aggregate counts for submissions, directory traffic, and publications.
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand-cream hover:bg-brand-teal-tint text-brand-teal border border-brand-teal/20 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Stats
        </button>
      </div>

      {/* 4 Core Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Directory Views */}
        <div className="bg-white rounded-2xl p-5 border border-brand-teal/10 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-brand-charcoal/60">
            <span className="text-[11px] font-bold uppercase tracking-wider">Directory Views</span>
            <div className="p-2 rounded-xl bg-brand-teal-tint text-brand-teal">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold font-serif-title text-brand-charcoal">
            {overview?.directory_views ?? 0}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+{overview?.directory_views_7d ?? 0} in past 7 days</span>
          </div>
        </div>

        {/* Metric 2: Profile Views */}
        <div className="bg-white rounded-2xl p-5 border border-brand-teal/10 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-brand-charcoal/60">
            <span className="text-[11px] font-bold uppercase tracking-wider">Profile Views</span>
            <div className="p-2 rounded-xl bg-brand-cream text-brand-gold">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold font-serif-title text-brand-charcoal">
            {overview?.profile_views ?? 0}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+{overview?.profile_views_7d ?? 0} in past 7 days</span>
          </div>
        </div>

        {/* Metric 3: E-Book Downloads */}
        <div className="bg-white rounded-2xl p-5 border border-brand-teal/10 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-brand-charcoal/60">
            <span className="text-[11px] font-bold uppercase tracking-wider">E-Book Downloads</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Download className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold font-serif-title text-brand-charcoal">
            {overview?.ebook_downloads ?? 0}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+{overview?.ebook_downloads_7d ?? 0} in past 7 days</span>
          </div>
        </div>

        {/* Metric 4: Total Submissions & Pending */}
        <div className="bg-white rounded-2xl p-5 border border-brand-teal/10 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-brand-charcoal/60">
            <span className="text-[11px] font-bold uppercase tracking-wider">Alumni Records</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold font-serif-title text-brand-charcoal">
            {totalSubmissions}
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-emerald-700 font-semibold">{overview?.total_approved ?? 0} Approved</span>
            <span className="text-gray-300">•</span>
            <span className="text-amber-600 font-semibold">{overview?.total_pending ?? 0} Pending</span>
          </div>
        </div>
      </div>

      {/* Cohort Breakdown Table */}
      <div className="bg-white rounded-2xl p-5 border border-brand-teal/10 shadow-xs space-y-4">
        <div>
          <h3 className="font-serif-title text-lg font-bold text-brand-charcoal">
            Submissions & Activity per Cohort
          </h3>
          <p className="text-xs text-brand-charcoal/60 mt-0.5">
            Graduated cohorts 2021 to 2025 and graduating cohort 2026.
          </p>
        </div>

        <div className="overflow-x-auto border border-gray-100 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-cream/60 text-brand-charcoal font-semibold border-b border-gray-200">
              <tr>
                <th className="p-3">Cohort</th>
                <th className="p-3">Total Alumni</th>
                <th className="p-3">Approved</th>
                <th className="p-3">Pending</th>
                <th className="p-3">Profile Views</th>
                <th className="p-3">E-Book Downloads</th>
                <th className="p-3 text-right">Approval Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cohorts.map((row) => {
                const approvalRate = row.total_submissions > 0
                  ? Math.round((row.approved_count / row.total_submissions) * 100)
                  : 0;

                return (
                  <tr key={row.cohort_year} className="hover:bg-brand-cream/30 transition-colors">
                    <td className="p-3 font-semibold text-brand-teal whitespace-nowrap">
                      Cohort {row.cohort_year}
                    </td>
                    <td className="p-3 font-bold text-brand-charcoal">{row.total_submissions}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-semibold text-[11px]">
                        {row.approved_count}
                      </span>
                    </td>
                    <td className="p-3">
                      {row.pending_count > 0 ? (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md font-semibold text-[11px]">
                          {row.pending_count}
                        </span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>
                    <td className="p-3 text-brand-charcoal/80 font-medium">{row.profile_views}</td>
                    <td className="p-3 text-brand-charcoal/80 font-medium">{row.ebook_downloads}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-brand-teal h-full rounded-full"
                            style={{ width: `${approvalRate}%` }}
                          />
                        </div>
                        <span className="font-semibold text-brand-charcoal w-9 text-right">
                          {approvalRate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7-Day Activity Trends */}
      {timeline.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-brand-teal/10 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif-title text-lg font-bold text-brand-charcoal">
                Daily Activity (Past 7 Days)
              </h3>
              <p className="text-xs text-brand-charcoal/60 mt-0.5">
                Directory visits and alumni profile interactions.
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1 text-brand-teal font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-teal" /> Directory
              </span>
              <span className="flex items-center gap-1 text-brand-gold font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-gold" /> Profiles
              </span>
              <span className="flex items-center gap-1 text-amber-600 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600" /> Downloads
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
            {timeline.map((item) => (
              <div
                key={item.day}
                className="p-3 bg-brand-cream/50 rounded-xl border border-brand-teal/10 text-center space-y-1.5"
              >
                <span className="text-[10px] font-bold uppercase text-brand-charcoal/60 block">
                  {new Date(item.day).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })}
                </span>
                <div className="space-y-0.5 text-xs font-semibold">
                  <div className="text-brand-teal" title="Directory Views">
                    👁️ {item.directory_views}
                  </div>
                  <div className="text-brand-gold" title="Profile Views">
                    👤 {item.profile_views}
                  </div>
                  <div className="text-amber-600" title="Downloads">
                    📥 {item.ebook_downloads}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Privacy Guarantee Card */}
      <div className="p-4 rounded-2xl bg-brand-teal-tint/40 border border-brand-teal/20 flex items-start gap-3 text-xs text-brand-charcoal/80">
        <ShieldCheck className="w-5 h-5 text-brand-teal shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-brand-teal">Privacy-Compliant Analytics (NDPA 2023)</p>
          <p className="text-brand-charcoal/70 leading-relaxed">
            All counts above are strictly aggregate metrics. No individual visitor identifiers, IP addresses, tracking cookies, or browser fingerprints are captured or stored.
          </p>
        </div>
      </div>
    </div>
  );
};
