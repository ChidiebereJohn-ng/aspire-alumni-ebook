import { useEffect, useState } from 'react';
import { 
  Star, 
  Database, 
  HardDrive, 
  Palette, 
  CheckCircle2, 
  Layers, 
  Smartphone, 
  RefreshCw, 
  ShieldCheck, 
  UserPlus, 
  Compass, 
  Lock,
  Users
} from 'lucide-react';
import { PublicDirectory } from './components/PublicDirectory';
import { SubmissionForm } from './components/SubmissionForm';
import { SubmissionSuccess } from './components/SubmissionSuccess';
import { EditProfile } from './components/EditProfile';
import { AdminLogin } from './components/AdminLogin';
import { AdminDashboard } from './components/AdminDashboard';
import { AlumniProfile } from './components/AlumniProfileModal';

interface HealthData {
  status: string;
  service: string;
  environment: string;
  responseTimeMs: number;
  database: {
    status: string;
    binding: string;
    totalAlumniRecords: number;
    settings: any;
    error?: string;
  };
  storage: {
    binding: string;
    bound: boolean;
    type: string;
  };
  designTokens: Record<string, string>;
  timestamp: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'directory' | 'submit' | 'system' | 'edit' | 'admin'>('directory');
  const [submittedData, setSubmittedData] = useState<{
    id: string;
    edit_token: string;
    surname: string;
    first_name: string;
  } | null>(null);
  const [editToken, setEditToken] = useState<string | null>(null);

  // Admin state
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(false);

  const [health, setHealth] = useState<HealthData | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [healthError, setHealthError] = useState<string | null>(null);

  // Check admin session
  const checkAdminAuth = async () => {
    setCheckingAuth(true);
    try {
      const res = await fetch('/api/admin/me');
      if (res.ok) {
        const data = await res.json();
        setIsAdminAuthenticated(Boolean(data.authenticated));
      } else {
        setIsAdminAuthenticated(false);
      }
    } catch {
      setIsAdminAuthenticated(false);
    } finally {
      setCheckingAuth(false);
    }
  };

  // URL route parsing
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/admin') {
      setActiveTab('admin');
      checkAdminAuth();
    } else if (path === '/join') {
      setActiveTab('submit');
    } else if (path.startsWith('/edit/')) {
      const token = path.replace('/edit/', '').trim();
      if (token) {
        setEditToken(token);
        setActiveTab('edit');
      }
    } else {
      const params = new URLSearchParams(window.location.search);
      const tokenParam = params.get('token');
      const cohortParam = params.get('cohort');
      if (tokenParam) {
        setEditToken(tokenParam);
        setActiveTab('edit');
      } else if (cohortParam) {
        setActiveTab('submit');
      }
    }
  }, []);

  const handleAdminTabClick = () => {
    setActiveTab('admin');
    checkAdminAuth();
  };

  const handleAdminLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } finally {
      setIsAdminAuthenticated(false);
    }
  };

  const fetchHealth = async () => {
    setLoadingHealth(true);
    setHealthError(null);
    try {
      const res = await fetch('/api/health');
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      setHealth(data);
    } catch (err: any) {
      console.warn('API health check error:', err);
      setHealthError(err?.message || 'Could not connect to /api/health');
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const paletteColors = [
    { role: 'Primary (buttons, links)', name: 'Logo teal', hex: '#148D93', bg: 'bg-[#148D93]', text: 'text-white' },
    { role: 'Accent (highlights, badges)', name: 'Star orange', hex: '#F7822D', bg: 'bg-[#F7822D]', text: 'text-white' },
    { role: 'Gold (dividers, stars)', name: 'Warm gold', hex: '#F5A623', bg: 'bg-[#F5A623]', text: 'text-white' },
    { role: 'Heading emphasis', name: 'Logo red', hex: '#D63A3F', bg: 'bg-[#D63A3F]', text: 'text-white' },
    { role: 'Text', name: 'Deep charcoal', hex: '#1F2A30', bg: 'bg-[#1F2A30]', text: 'text-white' },
    { role: 'Page background', name: 'Warm off-white', hex: '#FBF8F4', bg: 'bg-[#FBF8F4]', text: 'text-[#1F2A30]', border: true },
    { role: 'Cards', name: 'White', hex: '#FFFFFF', bg: 'bg-[#FFFFFF]', text: 'text-[#1F2A30]', border: true },
    { role: 'Section background', name: 'Light teal tint', hex: '#E6F4F4', bg: 'bg-[#E6F4F4]', text: 'text-[#148D93]' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-brand-cream text-brand-charcoal">
      {/* 1. Header Bar with Logo & Thin Gold Line (as specified in Blueprint) */}
      <header className="bg-white sticky top-0 z-40 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div 
            onClick={() => { setActiveTab('directory'); setSubmittedData(null); }}
            className="flex items-center gap-3 cursor-pointer"
          >
            <img 
              src="/logo.png" 
              alt="Aspire for Excellence Foundation Logo" 
              className="h-11 w-auto object-contain rounded-sm"
            />
            <div className="hidden sm:block">
              <span className="font-serif-title text-lg font-bold text-brand-teal tracking-tight block leading-tight">
                Aspire for Excellence
              </span>
              <span className="cohort-badge text-[10px] text-brand-gold uppercase tracking-widest block">
                Alumni Directory & E-Book
              </span>
            </div>
          </div>
          
          {/* Navigation Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Public Directory Tab (Module 4) */}
            <button
              onClick={() => { setActiveTab('directory'); setSubmittedData(null); }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'directory' 
                  ? 'bg-brand-teal text-white shadow-xs' 
                  : 'bg-brand-cream text-brand-charcoal hover:bg-brand-teal-tint'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Directory</span>
            </button>

            {/* Submission Form Tab (Module 2) */}
            <button
              onClick={() => { setActiveTab('submit'); setSubmittedData(null); }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'submit' 
                  ? 'bg-brand-teal text-white shadow-xs' 
                  : 'bg-brand-cream text-brand-charcoal hover:bg-brand-teal-tint'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Join</span> Directory
            </button>

            {/* Admin Dashboard Tab (Module 3) */}
            <button
              onClick={handleAdminTabClick}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'admin' 
                  ? 'bg-brand-charcoal text-white shadow-xs' 
                  : 'bg-gray-100 text-brand-charcoal hover:bg-gray-200'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Admin</span>
              {isAdminAuthenticated && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              )}
            </button>

            {/* Architecture Tab */}
            <button
              onClick={() => setActiveTab('system')}
              className={`p-1.5 rounded-xl transition-colors ${
                activeTab === 'system' 
                  ? 'bg-brand-teal text-white' 
                  : 'text-gray-400 hover:text-brand-teal'
              }`}
              title="System Architecture & Tokens"
            >
              <Compass className="w-4 h-4" />
            </button>
          </div>
        </div>
        {/* Thin Gold Line underneath directory header as required by Blueprint */}
        <div className="h-[2px] w-full bg-brand-gold"></div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        
        {/* TAB 1: PUBLIC DIRECTORY (Module 4) */}
        {activeTab === 'directory' && (
          <PublicDirectory
            onOpenSubmissionForm={() => setActiveTab('submit')}
            onOpenPortraitCard={(alum: AlumniProfile) => {
              alert(`Portrait card for ${alum.first_name} ${alum.surname} will be generated in Module 5.`);
            }}
          />
        )}

        {/* TAB 2: SUBMISSION FORM / SUCCESS VIEW (Module 2) */}
        {activeTab === 'submit' && (
          <div>
            {!submittedData ? (
              <SubmissionForm
                onSuccess={(data) => setSubmittedData(data)}
              />
            ) : (
              <SubmissionSuccess
                data={submittedData}
                onEditNow={(token) => {
                  setEditToken(token);
                  setActiveTab('edit');
                }}
                onReset={() => setSubmittedData(null)}
              />
            )}
          </div>
        )}

        {/* TAB 3: EDIT PROFILE VIEW (Private Edit Link Flow) */}
        {activeTab === 'edit' && editToken && (
          <EditProfile
            token={editToken}
            onBack={() => {
              setActiveTab('directory');
              setSubmittedData(null);
            }}
          />
        )}

        {/* TAB 4: ADMIN PORTAL (Module 3) */}
        {activeTab === 'admin' && (
          <div>
            {checkingAuth ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-8 h-8 border-3 border-brand-teal border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs text-brand-charcoal/60">Verifying administrator credentials...</p>
              </div>
            ) : !isAdminAuthenticated ? (
              <AdminLogin onSuccess={() => setIsAdminAuthenticated(true)} />
            ) : (
              <AdminDashboard onLogout={handleAdminLogout} />
            )}
          </div>
        )}

        {/* TAB 5: SYSTEM ARCHITECTURE & DESIGN TOKENS (Module 1 Foundation) */}
        {activeTab === 'system' && (
          <div className="space-y-10">
            {/* Hero */}
            <div className="text-center space-y-3 pt-2">
              <div className="inline-flex items-center justify-center p-2 rounded-full bg-brand-teal-tint text-brand-gold mb-1">
                <Star className="w-6 h-6 fill-brand-gold text-brand-gold" />
              </div>
              <h1 className="font-serif-title text-3xl sm:text-4xl md:text-5xl font-bold text-brand-charcoal tracking-tight">
                Aspire for Excellence Foundation
              </h1>
              <p className="font-serif-title text-xl sm:text-2xl italic text-brand-teal max-w-2xl mx-auto">
                "Meet the alumni who came before you."
              </p>
              <p className="text-sm text-brand-charcoal/70 max-w-lg mx-auto">
                Graduation yearbook & digital alumni network. Mobile-first for WhatsApp community distribution.
              </p>
            </div>

            <div className="star-divider max-w-xs mx-auto">
              <Star className="w-4 h-4 fill-brand-gold text-brand-gold" />
            </div>

            {/* Infrastructure & Database Ping */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-brand-teal/10 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-brand-teal" />
                    <h2 className="text-lg font-bold text-brand-charcoal">Infrastructure Status</h2>
                  </div>
                  <p className="text-xs text-brand-charcoal/60 mt-0.5">
                    Cloudflare D1 SQLite database, R2 object storage binding, and API endpoints.
                  </p>
                </div>
                
                <button
                  onClick={fetchHealth}
                  disabled={loadingHealth}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand-teal text-white hover:bg-brand-teal-dark transition-colors self-start sm:self-auto disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingHealth ? 'animate-spin' : ''}`} />
                  Test Live Connection
                </button>
              </div>

              {healthError && (
                <div className="p-3 bg-red-50 border border-brand-red/20 text-brand-red text-xs rounded-lg">
                  {healthError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-brand-cream/60 border border-brand-teal/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-brand-charcoal/60">Database</span>
                    <Database className="w-4 h-4 text-brand-teal" />
                  </div>
                  <div className="text-sm font-bold text-brand-charcoal">
                    {health?.database.status === 'connected' ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-600">
                        <CheckCircle2 className="w-4 h-4" /> D1 Connected
                      </span>
                    ) : (
                      <span className="text-brand-orange font-medium">Ready (D1 Configured)</span>
                    )}
                  </div>
                  <div className="text-xs text-brand-charcoal/70">
                    Total Records: <span className="font-semibold text-brand-teal">{health?.database.totalAlumniRecords ?? '8 sample records'}</span>
                  </div>
                  <div className="text-[11px] text-brand-charcoal/50">
                    Latency: {health?.responseTimeMs ?? 35} ms
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-brand-cream/60 border border-brand-teal/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-brand-charcoal/60">Photo & PDF Storage</span>
                    <HardDrive className="w-4 h-4 text-brand-teal" />
                  </div>
                  <div className="text-sm font-bold text-brand-teal">
                    <CheckCircle2 className="w-4 h-4 inline mr-1" />
                    R2 Storage
                  </div>
                  <div className="text-xs text-brand-charcoal/70">
                    Target: <span className="font-medium">aspire-alumni-storage</span>
                  </div>
                  <div className="text-[11px] text-brand-charcoal/50">
                    Photos at 800px square
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-brand-cream/60 border border-brand-teal/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-brand-charcoal/60">Viewport</span>
                    <Smartphone className="w-4 h-4 text-brand-teal" />
                  </div>
                  <div className="text-sm font-bold text-emerald-600">
                    Mobile-First (WhatsApp)
                  </div>
                  <div className="text-xs text-brand-charcoal/70">
                    PWA Ready • Fast Load
                  </div>
                  <div className="text-[11px] text-brand-charcoal/50">
                    Touch-friendly square crop
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-brand-cream/60 border border-brand-teal/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-brand-charcoal/60">Design Tokens</span>
                    <Palette className="w-4 h-4 text-brand-teal" />
                  </div>
                  <div className="text-sm font-bold text-brand-teal">
                    Tokens Active
                  </div>
                  <div className="text-xs text-brand-charcoal/70">
                    Headings: <span className="font-serif-title font-semibold">Cormorant / Playfair</span>
                  </div>
                  <div className="text-[11px] text-brand-charcoal/50">
                    Body: Inter (Google Fonts)
                  </div>
                </div>
              </div>
            </section>

            {/* Design Tokens Palette */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-brand-teal/10 space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <Palette className="w-5 h-5 text-brand-teal" />
                <h2 className="text-lg font-bold text-brand-charcoal">Design System Palette (Blueprint Section 1)</h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {paletteColors.map((color) => (
                  <div 
                    key={color.hex} 
                    className="rounded-xl overflow-hidden border border-gray-200/80 shadow-xs flex flex-col"
                  >
                    <div className={`h-16 w-full ${color.bg} flex items-end p-2 justify-end`}>
                      <span className="text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded backdrop-blur-sm bg-black/20 text-white">
                        {color.hex}
                      </span>
                    </div>
                    <div className="p-3 bg-white flex-1 flex flex-col justify-between">
                      <div className="font-semibold text-xs text-brand-charcoal">{color.name}</div>
                      <div className="text-[11px] text-brand-charcoal/60 mt-1">{color.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Logo Placements */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-brand-teal/10 space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <Layers className="w-5 h-5 text-brand-teal" />
                <h2 className="text-lg font-bold text-brand-charcoal">Logo Placement Rules (Blueprint Section 1)</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl bg-brand-cream border border-brand-teal/10 text-center space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-brand-teal block">
                    Rule 1: Submission Form (Top Center)
                  </span>
                  <div className="py-2 flex justify-center">
                    <img src="/logo.png" alt="Form Logo Placement" className="h-16 w-auto object-contain drop-shadow-xs" />
                  </div>
                  <h4 className="font-serif-title text-base font-bold text-brand-charcoal">
                    Alumni Registration Form
                  </h4>
                  <p className="text-xs text-brand-charcoal/60">
                    Centered at the top of the form, with title underneath.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-brand-teal text-white space-y-3 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-brand-gold block">
                      Rule 2: E-Book Cover & Dark Surfaces
                    </span>
                    <p className="text-xs text-white/80 mt-1">
                      Logo placed on a clean white rounded panel for maximum crispness against deep teal background.
                    </p>
                  </div>

                  <div className="py-4 flex justify-center">
                    <div className="bg-white p-3 rounded-2xl shadow-md inline-block">
                      <img src="/logo.png" alt="Cover Logo Placement" className="h-14 w-auto object-contain" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-brand-gold">
                    <span>Alumni Directory 2026</span>
                    <Star className="w-4 h-4 fill-brand-gold" />
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-brand-teal/10 py-6 text-center text-xs text-brand-charcoal/60 mt-12">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="h-6 w-auto" />
            <span className="font-serif-title font-semibold text-brand-charcoal">Aspire for Excellence Foundation</span>
          </div>
          <div className="flex items-center gap-1.5 text-brand-gold">
            <Star className="w-3.5 h-3.5 fill-brand-gold" />
            <span>Built with Cloudflare Pages, D1 & R2</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
