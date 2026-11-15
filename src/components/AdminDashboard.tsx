import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  EyeOff, 
  Trash2, 
  RefreshCw, 
  LogOut, 
  Search, 
  Star, 
  BookOpen, 
  AlertTriangle, 
  RotateCcw, 
  Edit3, 
  ToggleLeft, 
  ToggleRight, 
  Briefcase,
  MapPin,
  Calendar,
  X
} from 'lucide-react';
import { NIGERIAN_STATES, INDUSTRIES, COHORTS } from '../constants/options';

interface AdminDashboardProps {
  onLogout: () => void;
}

interface AlumniItem {
  id: string;
  surname: string;
  first_name: string;
  photo_key: string | null;
  city: string | null;
  state: string | null;
  employer: string | null;
  role: string | null;
  industry: string | null;
  cohort_year: number;
  advice: string | null;
  status: 'pending' | 'approved' | 'hidden';
  edit_token: string;
  consent: number;
  linkedin_url?: string | null;
  hide_employer?: number;
  hide_city?: number;
  featured?: number;
  country?: string;
  removed_at?: string | null;
  deleted_at?: string | null;
  source?: 'form' | 'import';
  created_at: string;
  is_duplicate?: boolean;
  duplicate_matched_id?: string | null;
}

interface DashboardStats {
  pending_count: number;
  approved_count: number;
  hidden_count: number;
  deleted_count: number;
  total_active: number;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [view, setView] = useState<'pending' | 'all' | 'approved' | 'hidden' | 'deleted'>('pending');
  const [cohortFilter, setCohortFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [items, setItems] = useState<AlumniItem[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [cohortCounts, setCohortCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Settings
  const [directoryPublic, setDirectoryPublic] = useState(true);
  const [ebookPublic, setEbookPublic] = useState(false);
  const [updatingSettings, setUpdatingSettings] = useState(false);

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<AlumniItem | null>(null);
  const [editFields, setEditFields] = useState<any>({});
  const [savingEdit, setSavingEdit] = useState(false);

  // Message notifications
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  useEffect(() => {
    fetchSettings();
    fetchAlumni();
  }, [view, cohortFilter]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setDirectoryPublic(Boolean(data.settings.directory_public));
          setEbookPublic(Boolean(data.settings.ebook_public));
        }
      }
    } catch (err) {
      console.warn('Failed to load settings:', err);
    }
  };

  const handleToggleSettings = async (field: 'directory' | 'ebook') => {
    setUpdatingSettings(true);
    const newDir = field === 'directory' ? !directoryPublic : directoryPublic;
    const newEbook = field === 'ebook' ? !ebookPublic : ebookPublic;

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directory_public: newDir, ebook_public: newEbook }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDirectoryPublic(Boolean(data.settings.directory_public));
        setEbookPublic(Boolean(data.settings.ebook_public));
        showFeedback('success', `${field === 'directory' ? 'Directory' : 'E-Book'} visibility updated.`);
      }
    } catch {
      showFeedback('error', 'Failed to update master setting.');
    } finally {
      setUpdatingSettings(false);
    }
  };

  const fetchAlumni = async () => {
    setLoading(true);
    try {
      const url = new URL('/api/admin/alumni', window.location.origin);
      url.searchParams.set('view', view);
      if (cohortFilter !== 'all') {
        url.searchParams.set('cohort', cohortFilter);
      }

      const res = await fetch(url.toString());
      if (res.status === 401) {
        onLogout();
        return;
      }
      const data = await res.json();
      if (data.success) {
        setItems(data.items || []);
        setStats(data.stats || null);
        setCohortCounts(data.cohortCounts || {});
      }
    } catch (err) {
      console.warn('Error fetching alumni:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string, id: string, extraFields?: any) => {
    setActionLoadingId(id);
    try {
      const res = await fetch('/api/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, id, fields: extraFields }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showFeedback('success', data.message || 'Action executed successfully.');
        fetchAlumni();
      } else {
        showFeedback('error', data.error || 'Failed to perform action.');
      }
    } catch (err: any) {
      showFeedback('error', err.message || 'Action failed.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const openEditModal = (item: AlumniItem) => {
    setEditingItem(item);
    setEditFields({
      surname: item.surname,
      first_name: item.first_name,
      city: item.city || '',
      state: item.state || 'Lagos',
      employer: item.employer || '',
      role: item.role || '',
      industry: item.industry || 'Technology & Software',
      cohort_year: item.cohort_year,
      advice: item.advice || '',
      linkedin_url: item.linkedin_url || '',
      hide_employer: Boolean(item.hide_employer),
      hide_city: Boolean(item.hide_city),
    });
  };

  const saveEditModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setSavingEdit(true);

    try {
      await handleAction('update', editingItem.id, editFields);
      setEditingItem(null);
    } finally {
      setSavingEdit(false);
    }
  };

  // Filter items by search query
  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const fullName = `${item.first_name} ${item.surname}`.toLowerCase();
    const employer = (item.employer || '').toLowerCase();
    const role = (item.role || '').toLowerCase();
    const state = (item.state || '').toLowerCase();
    return fullName.includes(q) || employer.includes(q) || role.includes(q) || state.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Top Bar: Title, Master Toggles, and Logout */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-brand-teal/10 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h1 className="font-serif-title text-2xl sm:text-3xl font-bold text-brand-charcoal">
                Foundation Admin Console
              </h1>
            </div>
            <p className="text-xs text-brand-charcoal/60 mt-0.5">
              Review and approve submissions, manage directory visibility, and monitor cohort entries.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchAlumni()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-brand-cream hover:bg-brand-teal-tint text-brand-teal transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-red-50 hover:bg-red-100 text-brand-red transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Master Toggles & E-Book Generator Trigger */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          {/* Master Toggle: Directory Public */}
          <div className="p-4 rounded-2xl bg-brand-cream/60 border border-brand-teal/10 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-charcoal block">
                Public Directory
              </span>
              <span className="text-[11px] text-brand-charcoal/60 block mt-0.5">
                {directoryPublic ? 'Live to Public' : 'Offline / Hidden'}
              </span>
            </div>
            <button
              onClick={() => handleToggleSettings('directory')}
              disabled={updatingSettings}
              className="text-brand-teal hover:scale-105 transition-transform"
            >
              {directoryPublic ? (
                <ToggleRight className="w-8 h-8 text-brand-teal" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-gray-400" />
              )}
            </button>
          </div>

          {/* Master Toggle: E-Book Public */}
          <div className="p-4 rounded-2xl bg-brand-cream/60 border border-brand-teal/10 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-charcoal block">
                E-Book Download
              </span>
              <span className="text-[11px] text-brand-charcoal/60 block mt-0.5">
                {ebookPublic ? 'Downloads Enabled' : 'Disabled / Internal'}
              </span>
            </div>
            <button
              onClick={() => handleToggleSettings('ebook')}
              disabled={updatingSettings}
              className="text-brand-teal hover:scale-105 transition-transform"
            >
              {ebookPublic ? (
                <ToggleRight className="w-8 h-8 text-brand-teal" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-gray-400" />
              )}
            </button>
          </div>

          {/* Generate E-Book Quick Trigger */}
          <div className="p-4 rounded-2xl bg-brand-teal-tint/50 border border-brand-teal/20 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-teal block">
                E-Book Editions
              </span>
              <span className="text-[11px] text-brand-charcoal/60 block mt-0.5">
                Full edition & single cohort
              </span>
            </div>
            <button
              onClick={() => showFeedback('success', 'E-Book generator ready in Module 5.')}
              className="px-3 py-1.5 rounded-xl bg-brand-teal text-white font-bold text-xs hover:bg-brand-teal-dark transition-colors flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Generate
            </button>
          </div>
        </div>
      </div>

      {/* Cohort Counts Bar (Blueprint Section 2: "Count of entries per cohort") */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-brand-teal/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-charcoal flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-brand-teal" />
            Active Entries Per Cohort
          </span>
          <span className="text-xs text-brand-charcoal/60">
            Total Active: <strong>{stats?.total_active ?? 0}</strong>
          </span>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {COHORTS.map((yr) => {
            const count = cohortCounts[String(yr)] || 0;
            const isSelected = cohortFilter === String(yr);
            return (
              <button
                key={yr}
                onClick={() => setCohortFilter(isSelected ? 'all' : String(yr))}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  isSelected 
                    ? 'bg-brand-teal text-white shadow-xs font-bold' 
                    : 'bg-brand-cream hover:bg-brand-teal-tint text-brand-charcoal'
                }`}
              >
                <span className="cohort-badge">Cohort {yr}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isSelected ? 'bg-white text-brand-teal' : 'bg-gray-200 text-brand-charcoal'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
          {cohortFilter !== 'all' && (
            <button
              onClick={() => setCohortFilter('all')}
              className="text-xs text-brand-teal hover:underline self-center ml-2 font-semibold"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Toast Feedback Notification */}
      {feedback && (
        <div className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-center gap-2 ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Main Queue Tabs & Search Filter */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tab Selection */}
          <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-2">
            <button
              onClick={() => setView('pending')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                view === 'pending'
                  ? 'bg-brand-teal text-white shadow-sm'
                  : 'bg-white text-brand-charcoal hover:bg-brand-teal-tint'
              }`}
            >
              <span>Pending Queue</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                view === 'pending' ? 'bg-white text-brand-teal' : 'bg-brand-orange text-white'
              }`}>
                {stats?.pending_count ?? 0}
              </span>
            </button>

            <button
              onClick={() => setView('approved')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                view === 'approved'
                  ? 'bg-brand-teal text-white shadow-sm'
                  : 'bg-white text-brand-charcoal hover:bg-brand-teal-tint'
              }`}
            >
              <span>Approved Directory</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                view === 'approved' ? 'bg-white text-brand-teal' : 'bg-gray-100 text-gray-700'
              }`}>
                {stats?.approved_count ?? 0}
              </span>
            </button>

            <button
              onClick={() => setView('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                view === 'all'
                  ? 'bg-brand-teal text-white shadow-sm'
                  : 'bg-white text-brand-charcoal hover:bg-brand-teal-tint'
              }`}
            >
              <span>All Active</span>
              <span className="text-[10px]">({stats?.total_active ?? 0})</span>
            </button>

            <button
              onClick={() => setView('hidden')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                view === 'hidden'
                  ? 'bg-brand-teal text-white shadow-sm'
                  : 'bg-white text-brand-charcoal hover:bg-brand-teal-tint'
              }`}
            >
              <span>Hidden</span>
              <span className="text-[10px]">({stats?.hidden_count ?? 0})</span>
            </button>

            {/* Recently Deleted 30 Days Tab */}
            <button
              onClick={() => setView('deleted')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                view === 'deleted'
                  ? 'bg-brand-red text-white shadow-sm'
                  : 'bg-white text-brand-red hover:bg-red-50'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Recently Deleted</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                view === 'deleted' ? 'bg-white text-brand-red' : 'bg-red-100 text-brand-red'
              }`}>
                {stats?.deleted_count ?? 0}
              </span>
            </button>
          </div>

          {/* Quick Search Input */}
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by name, employer..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-teal/40 bg-white"
            />
          </div>
        </div>

        {/* Recently Deleted Notice */}
        {view === 'deleted' && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Recently Deleted (30-Day Window)</p>
              <p className="text-amber-800 mt-0.5">
                Entries remain here for 30 days before permanent expiration. You can restore any entry back to the pending queue with one click.
              </p>
            </div>
          </div>
        )}

        {/* Entries Grid */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-brand-teal border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-brand-charcoal/60">Loading queue items...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center space-y-3 border border-dashed border-gray-200">
            <CheckCircle2 className="w-12 h-12 text-brand-teal/40 mx-auto" />
            <h3 className="font-serif-title text-xl font-bold text-brand-charcoal">
              No entries found
            </h3>
            <p className="text-xs text-brand-charcoal/60 max-w-sm mx-auto">
              There are currently no records matching this filter view.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`bg-white rounded-2xl p-5 shadow-xs border transition-shadow hover:shadow-md flex flex-col justify-between space-y-4 ${
                  item.is_duplicate 
                    ? 'border-amber-300 ring-2 ring-amber-100' 
                    : item.featured 
                    ? 'border-brand-gold/60' 
                    : 'border-brand-teal/10'
                }`}
              >
                <div className="space-y-3">
                  {/* Duplicate Alert Banner (Section 6.2) */}
                  {item.is_duplicate && (
                    <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-center gap-1.5 font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Possible Duplicate (Name & Cohort Match)</span>
                    </div>
                  )}

                  {/* Top card row: Avatar, Name, Cohort Badge */}
                  <div className="flex items-start gap-3">
                    <img
                      src={item.photo_key ? `/api/photo/${item.photo_key}` : `/api/photo/${item.id}.jpg`}
                      alt={`${item.first_name} ${item.surname}`}
                      className="w-14 h-14 rounded-full object-cover border-2 border-brand-gold/50 shrink-0 bg-brand-cream"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="font-serif-title font-bold text-base text-brand-charcoal truncate">
                          {item.surname}, {item.first_name}
                        </h3>
                        <button
                          type="button"
                          onClick={() => handleAction('toggle_featured', item.id)}
                          title="Toggle Featured Alumni"
                          className="p-1 hover:bg-brand-cream rounded-full transition-colors"
                        >
                          <Star className={`w-4 h-4 ${
                            item.featured 
                              ? 'fill-brand-gold text-brand-gold' 
                              : 'text-gray-300 hover:text-brand-gold'
                          }`} />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="cohort-badge text-[10px] bg-brand-teal text-white px-2 py-0.5 rounded">
                          Cohort {item.cohort_year}
                        </span>
                        <span className="text-[11px] text-brand-charcoal/60 truncate">
                          {item.industry}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Career & Location */}
                  <div className="space-y-1 text-xs text-brand-charcoal/80 pt-1">
                    {(item.role || item.employer) && (
                      <div className="flex items-center gap-1.5 truncate">
                        <Briefcase className="w-3.5 h-3.5 text-brand-teal shrink-0" />
                        <span className="truncate">
                          {item.role} {item.role && item.employer ? '•' : ''} {item.employer}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-brand-charcoal/60">
                      <MapPin className="w-3.5 h-3.5 text-brand-teal shrink-0" />
                      <span>{item.city ? `${item.city}, ` : ''}{item.state}</span>
                    </div>
                  </div>

                  {/* Advice Quote snippet if any */}
                  {item.advice && (
                    <p className="text-[11px] italic text-brand-charcoal/70 bg-brand-cream/60 p-2.5 rounded-xl border border-gray-100 line-clamp-2">
                      "{item.advice}"
                    </p>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2 text-xs">
                  {view === 'deleted' ? (
                    // Recently deleted actions
                    <div className="flex items-center justify-between w-full gap-2">
                      <button
                        onClick={() => handleAction('restore', item.id)}
                        disabled={actionLoadingId === item.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Restore
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Permanently delete this entry? This cannot be undone.')) {
                            handleAction('permanent_delete', item.id);
                          }
                        }}
                        disabled={actionLoadingId === item.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-brand-red hover:bg-red-50 text-xs font-semibold transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Purge
                      </button>
                    </div>
                  ) : (
                    // Standard queue actions
                    <>
                      <div className="flex items-center gap-1">
                        {item.status !== 'approved' && (
                          <button
                            onClick={() => handleAction('approve', item.id)}
                            disabled={actionLoadingId === item.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Approve
                          </button>
                        )}
                        {item.status === 'approved' && (
                          <button
                            onClick={() => handleAction('hide', item.id)}
                            disabled={actionLoadingId === item.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-brand-charcoal text-xs font-medium transition-colors"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                            Hide
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-brand-cream hover:bg-brand-teal-tint text-brand-teal text-xs font-semibold transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          if (confirm(`Move ${item.first_name} ${item.surname} to Recently Deleted?`)) {
                            handleAction('delete', item.id);
                          }
                        }}
                        disabled={actionLoadingId === item.id}
                        className="p-1.5 rounded-xl text-gray-400 hover:text-brand-red hover:bg-red-50 transition-colors"
                        title="Delete (Move to Recently Deleted)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-serif-title font-bold text-xl text-brand-charcoal">
                Edit Alumni: {editingItem.first_name} {editingItem.surname}
              </h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={saveEditModal} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-brand-charcoal">Surname</label>
                  <input
                    type="text"
                    required
                    value={editFields.surname}
                    onChange={(e) => setEditFields({ ...editFields, surname: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-brand-charcoal">First Name</label>
                  <input
                    type="text"
                    required
                    value={editFields.first_name}
                    onChange={(e) => setEditFields({ ...editFields, first_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-brand-charcoal">Cohort</label>
                  <select
                    value={editFields.cohort_year}
                    onChange={(e) => setEditFields({ ...editFields, cohort_year: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white"
                  >
                    {COHORTS.map((c) => (
                      <option key={c} value={c}>Cohort {c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-brand-charcoal">Industry</label>
                  <select
                    value={editFields.industry}
                    onChange={(e) => setEditFields({ ...editFields, industry: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white"
                  >
                    {INDUSTRIES.map((ind) => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-brand-charcoal">Role</label>
                  <input
                    type="text"
                    value={editFields.role}
                    onChange={(e) => setEditFields({ ...editFields, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-brand-charcoal">Employer</label>
                  <input
                    type="text"
                    value={editFields.employer}
                    onChange={(e) => setEditFields({ ...editFields, employer: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-brand-charcoal">State</label>
                  <select
                    value={editFields.state}
                    onChange={(e) => setEditFields({ ...editFields, state: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white"
                  >
                    {NIGERIAN_STATES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-brand-charcoal">City</label>
                  <input
                    type="text"
                    value={editFields.city}
                    onChange={(e) => setEditFields({ ...editFields, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-brand-charcoal">Advice</label>
                <textarea
                  rows={2}
                  maxLength={300}
                  value={editFields.advice}
                  onChange={(e) => setEditFields({ ...editFields, advice: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 rounded-xl bg-brand-teal text-white font-bold text-xs hover:bg-brand-teal-dark flex items-center gap-1.5"
                >
                  {savingEdit && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
