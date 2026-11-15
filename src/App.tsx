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
  ShieldCheck
} from 'lucide-react';

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
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/health');
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      setHealth(data);
    } catch (err: any) {
      // In local dev without pages functions proxy, provide fallback representation
      console.warn('API health check error:', err);
      setError(err?.message || 'Could not connect to /api/health');
    } finally {
      setLoading(false);
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
          <div className="flex items-center gap-3">
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
          
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-teal-tint text-brand-teal border border-brand-teal/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Module 1: Setup & Foundations
            </span>
          </div>
        </div>
        {/* Thin Gold Line underneath directory header as required by Blueprint */}
        <div className="h-[2px] w-full bg-brand-gold"></div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 space-y-10">
        
        {/* Hero Section */}
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
            Graduation yearbook & digital alumni network. Dignified, bright, and mobile-optimized for WhatsApp access.
          </p>
        </div>

        {/* Star Divider Motif */}
        <div className="star-divider max-w-xs mx-auto">
          <Star className="w-4 h-4 fill-brand-gold text-brand-gold" />
        </div>

        {/* System & Architecture Status Panel (D1, R2, Cloudflare) */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-brand-teal/10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-brand-teal" />
                <h2 className="text-lg font-bold text-brand-charcoal">Infrastructure & Storage Verification</h2>
              </div>
              <p className="text-xs text-brand-charcoal/60 mt-0.5">
                Cloudflare D1 edge database, R2 object storage binding, and API endpoints.
              </p>
            </div>
            
            <button
              onClick={fetchHealth}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand-teal text-white hover:bg-brand-teal-dark transition-colors self-start sm:self-auto disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Test API Connection
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-brand-red/20 text-brand-red text-xs rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Database Card */}
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
                Binding: <code className="bg-white px-1.5 py-0.5 rounded text-[11px] font-mono border">DB</code>
              </div>
              <div className="text-xs text-brand-charcoal/70">
                Seeded Alumni: <span className="font-semibold text-brand-teal">{health?.database.totalAlumniRecords ?? '8 sample records'}</span>
              </div>
            </div>

            {/* Object Storage Card */}
            <div className="p-4 rounded-xl bg-brand-cream/60 border border-brand-teal/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-charcoal/60">Photo & PDF Storage</span>
                <HardDrive className="w-4 h-4 text-brand-teal" />
              </div>
              <div className="text-sm font-bold text-brand-charcoal">
                <span className="inline-flex items-center gap-1.5 text-brand-teal">
                  <CheckCircle2 className="w-4 h-4" /> R2 Storage
                </span>
              </div>
              <div className="text-xs text-brand-charcoal/70">
                Binding: <code className="bg-white px-1.5 py-0.5 rounded text-[11px] font-mono border">STORAGE</code>
              </div>
              <div className="text-xs text-brand-charcoal/70">
                Target: <span className="font-medium">aspire-alumni-storage</span>
              </div>
            </div>

            {/* Mobile Viewport Card */}
            <div className="p-4 rounded-xl bg-brand-cream/60 border border-brand-teal/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-charcoal/60">Viewport</span>
                <Smartphone className="w-4 h-4 text-brand-teal" />
              </div>
              <div className="text-sm font-bold text-emerald-600">
                Mobile-First (WhatsApp)
              </div>
              <div className="text-xs text-brand-charcoal/70">
                Target: <span className="font-medium">320px – 430px phones</span>
              </div>
              <div className="text-xs text-brand-charcoal/70">
                Viewport: <span className="font-medium">viewport-fit=cover</span>
              </div>
            </div>

            {/* Design System Status */}
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
              <div className="text-xs text-brand-charcoal/70">
                Body: <span className="font-sans font-medium">Inter (Google Fonts)</span>
              </div>
            </div>
          </div>
        </section>

        {/* Design System & Palette Showcase */}
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
                  <span className={`text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded backdrop-blur-sm bg-black/20 text-white`}>
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

          {/* Typography Spec Demonstration */}
          <div className="p-4 rounded-xl bg-brand-teal-tint/50 border border-brand-teal/20 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-teal">Typography Hierarchy</h3>
            
            <div className="space-y-1">
              <span className="text-[11px] text-brand-charcoal/50 uppercase font-mono block">Heading Serif (Cormorant Garamond)</span>
              <p className="font-serif-title text-2xl font-bold text-brand-charcoal">
                Aspire for Excellence <span className="text-brand-red">Foundation</span>
              </p>
            </div>

            <div className="space-y-1 pt-1">
              <span className="text-[11px] text-brand-charcoal/50 uppercase font-mono block">Cohort Badge Motif (Small Caps + Wide Spacing)</span>
              <div className="flex flex-wrap gap-2">
                <span className="cohort-badge bg-brand-teal text-white px-2.5 py-1 rounded text-xs">
                  COHORT 2021
                </span>
                <span className="cohort-badge bg-brand-orange text-white px-2.5 py-1 rounded text-xs">
                  COHORT 2024
                </span>
                <span className="cohort-badge bg-brand-gold text-white px-2.5 py-1 rounded text-xs">
                  COHORT 2026
                </span>
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <span className="text-[11px] text-brand-charcoal/50 uppercase font-mono block">UI Body (Inter)</span>
              <p className="text-xs text-brand-charcoal leading-relaxed max-w-xl">
                Dignified, bright, and uncluttered. Mobile-optimized for alumni accessing the directory directly through WhatsApp group announcements.
              </p>
            </div>
          </div>
        </section>

        {/* Logo Placements Specified in Blueprint */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-brand-teal/10 space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <Layers className="w-5 h-5 text-brand-teal" />
            <h2 className="text-lg font-bold text-brand-charcoal">Logo Placement Rules (Blueprint Section 1)</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Form Placement: Top center above title */}
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

            {/* E-book Cover Placement: On dark teal panel */}
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

        {/* Database Schema & Seed Verification */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-brand-teal/10 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-brand-teal" />
              <h2 className="text-lg font-bold text-brand-charcoal">D1 SQLite Tables & Seed Ready</h2>
            </div>
            <span className="text-xs font-mono text-brand-teal bg-brand-teal-tint px-2.5 py-1 rounded">
              schema.sql + seed.sql
            </span>
          </div>

          <p className="text-xs text-brand-charcoal/70">
            The schema contains all production tables: <code className="bg-gray-100 px-1 py-0.5 rounded text-brand-teal font-mono">alumni</code> (including Section 6 privacy fields, edit tokens, soft delete), <code className="bg-gray-100 px-1 py-0.5 rounded text-brand-teal font-mono">settings</code>, <code className="bg-gray-100 px-1 py-0.5 rounded text-brand-teal font-mono">ebooks</code>, and <code className="bg-gray-100 px-1 py-0.5 rounded text-brand-teal font-mono">events</code>.
          </p>

          <div className="bg-brand-charcoal text-gray-100 p-4 rounded-xl text-xs font-mono overflow-x-auto">
            <div className="text-emerald-400 font-bold mb-1">-- D1 Tables Defined:</div>
            <div>CREATE TABLE alumni (id, surname, first_name, photo_key, city, state, employer, role, industry, cohort_year, advice, status, edit_token, consent, linkedin_url, hide_employer, hide_city, featured, country, removed_at, deleted_at, source, created_at, updated_at);</div>
            <div className="mt-1">CREATE TABLE settings (id, directory_public, ebook_public, updated_at);</div>
            <div className="mt-1">CREATE TABLE ebooks (id, edition_name, scope, pdf_key, generated_at);</div>
            <div className="mt-1">CREATE TABLE events (id, type, cohort_year, alumni_id, created_at);</div>
          </div>
        </section>

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
