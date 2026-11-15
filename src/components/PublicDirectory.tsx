import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Star, 
  BookOpen, 
  MapPin, 
  Grid, 
  AlertCircle
} from 'lucide-react';
import { AlumniProfile, AlumniProfileModal } from './AlumniProfileModal';
import { FeaturedAlumniStrip } from './FeaturedAlumniStrip';
import { AlumniByStateView } from './AlumniByStateView';
import { EBookGeneratorModal } from './EBookGeneratorModal';
import { PortraitCardModal } from './PortraitCardModal';
import { NIGERIAN_STATES, INDUSTRIES, COHORTS } from '../constants/options';

interface PublicDirectoryProps {
  onOpenSubmissionForm?: () => void;
  onOpenPortraitCard?: (alumni: AlumniProfile) => void;
}

export const PublicDirectory: React.FC<PublicDirectoryProps> = ({
  onOpenSubmissionForm,
}) => {
  const [alumni, setAlumni] = useState<AlumniProfile[]>([]);
  const [featured, setFeatured] = useState<AlumniProfile[]>([]);
  const [stateCounts, setStateCounts] = useState<Record<string, number>>({});
  const [settings, setSettings] = useState<{ directory_public: number; ebook_public: number }>({
    directory_public: 1,
    ebook_public: 0,
  });

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [cohortFilter, setCohortFilter] = useState('all');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');

  const [activeView, setActiveView] = useState<'grid' | 'states'>('grid');
  const [selectedProfile, setSelectedProfile] = useState<AlumniProfile | null>(null);
  const [portraitAlumni, setPortraitAlumni] = useState<AlumniProfile | null>(null);
  const [isEBookModalOpen, setIsEBookModalOpen] = useState(false);

  useEffect(() => {
    fetchDirectory();
  }, [cohortFilter, industryFilter, stateFilter]);

  // Log directory view once per user session
  useEffect(() => {
    try {
      const hasLogged = sessionStorage.getItem('aspire_logged_dir_view');
      if (!hasLogged) {
        fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'directory_view' }),
        }).catch(() => {});
        sessionStorage.setItem('aspire_logged_dir_view', '1');
      }
    } catch {}
  }, []);

  const handleSelectProfile = (item: AlumniProfile) => {
    setSelectedProfile(item);
    try {
      fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'profile_view',
          cohort_year: item.cohort_year,
          alumni_id: item.id,
        }),
      }).catch(() => {});
    } catch {}
  };

  const fetchDirectory = async () => {
    setLoading(true);
    try {
      const url = new URL('/api/alumni', window.location.origin);
      if (cohortFilter !== 'all') url.searchParams.set('cohort', cohortFilter);
      if (industryFilter !== 'all') url.searchParams.set('industry', industryFilter);
      if (stateFilter !== 'all') url.searchParams.set('state', stateFilter);
      if (searchQuery.trim()) url.searchParams.set('q', searchQuery.trim());

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setAlumni(data.alumni || []);
        setFeatured(data.featured || []);
        setStateCounts(data.stateCounts || {});
        if (data.settings) setSettings(data.settings);
      }
    } catch (err) {
      console.warn('Failed to fetch alumni directory:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAlumni = alumni.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const fullName = `${item.first_name} ${item.surname}`.toLowerCase();
    const industry = (item.industry || '').toLowerCase();
    const state = (item.state || '').toLowerCase();
    const role = (item.role || '').toLowerCase();
    return (
      fullName.includes(q) ||
      industry.includes(q) ||
      state.includes(q) ||
      role.includes(q)
    );
  });

  if (settings.directory_public === 0) {
    return (
      <div className="max-w-lg mx-auto py-20 px-4 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-amber-50 text-brand-gold flex items-center justify-center">
          <Star className="w-8 h-8 fill-brand-gold" />
        </div>
        <h2 className="font-serif-title text-3xl font-bold text-brand-charcoal">
          Directory Temporarily Private
        </h2>
        <p className="text-sm text-brand-charcoal/70 leading-relaxed">
          The Aspire for Excellence Foundation Alumni Directory is currently undergoing scheduled updates. Please check back shortly or register your profile below.
        </p>
        {onOpenSubmissionForm && (
          <button
            onClick={onOpenSubmissionForm}
            className="px-5 py-2.5 rounded-xl bg-brand-teal text-white font-bold text-xs"
          >
            Submit Alumni Profile
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-teal-tint text-brand-teal border border-brand-teal/20">
          <Star className="w-3.5 h-3.5 fill-brand-gold text-brand-gold" />
          <span>Aspire for Excellence Foundation</span>
        </div>

        <h1 className="font-serif-title text-3xl sm:text-4xl md:text-5xl font-bold text-brand-charcoal tracking-tight">
          Alumni Directory & Yearbook
        </h1>

        <p className="font-serif-title text-xl sm:text-2xl italic text-brand-teal max-w-2xl mx-auto">
          "Meet the alumni who came before you."
        </p>

        <p className="text-xs sm:text-sm text-brand-charcoal/70 max-w-lg mx-auto leading-relaxed">
          Celebrating scholars, fellows, and leaders across industries in Nigeria and across the globe.
        </p>

        {/* Download E-Book Button (Visible ONLY when enabled by admin per blueprint) */}
        {settings.ebook_public === 1 && (
          <div className="pt-2">
            <button
              onClick={() => setIsEBookModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-brand-teal hover:bg-brand-teal-dark text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg"
            >
              <BookOpen className="w-4 h-4 text-brand-gold" />
              Download Alumni E-Book (PDF)
            </button>
          </div>
        )}
      </div>

      {/* Featured Alumni Strip (Section 6.9) */}
      {featured.length > 0 && (
        <FeaturedAlumniStrip 
          featured={featured} 
          onSelect={(item) => handleSelectProfile(item)} 
        />
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-brand-teal/10 space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by alumni name, industry, role, or state..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/40 bg-brand-cream/40"
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            <select
              value={cohortFilter}
              onChange={(e) => setCohortFilter(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-2.5 rounded-2xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
            >
              <option value="all">All Cohorts</option>
              {COHORTS.map((c) => (
                <option key={c} value={c}>Cohort {c}</option>
              ))}
            </select>

            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="flex-1 sm:flex-none max-w-[170px] px-3 py-2.5 rounded-2xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/40 truncate"
            >
              <option value="all">All Industries</option>
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>

            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="flex-1 sm:flex-none max-w-[150px] px-3 py-2.5 rounded-2xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/40 truncate"
            >
              <option value="all">All States</option>
              {NIGERIAN_STATES.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>

            <div className="flex items-center gap-1 border border-gray-200 p-1 rounded-2xl bg-brand-cream/60">
              <button
                type="button"
                onClick={() => setActiveView('grid')}
                className={`p-1.5 rounded-xl transition-colors ${
                  activeView === 'grid' 
                    ? 'bg-brand-teal text-white shadow-xs' 
                    : 'text-gray-500 hover:text-brand-teal'
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setActiveView('states')}
                className={`p-1.5 rounded-xl transition-colors ${
                  activeView === 'states' 
                    ? 'bg-brand-teal text-white shadow-xs' 
                    : 'text-gray-500 hover:text-brand-teal'
                }`}
                title="State Distribution View"
              >
                <MapPin className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {(cohortFilter !== 'all' || industryFilter !== 'all' || stateFilter !== 'all' || searchQuery) && (
          <div className="flex items-center justify-between text-xs text-brand-charcoal/70 pt-1">
            <span>
              Showing {filteredAlumni.length} {filteredAlumni.length === 1 ? 'alumnus' : 'alumni'}
            </span>
            <button
              onClick={() => {
                setCohortFilter('all');
                setIndustryFilter('all');
                setStateFilter('all');
                setSearchQuery('');
              }}
              className="text-brand-teal font-semibold hover:underline"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* VIEW 1: STATE TILES */}
      {activeView === 'states' && (
        <AlumniByStateView
          stateCounts={stateCounts}
          selectedState={stateFilter}
          onSelectState={(st) => {
            setStateFilter(st);
            setActiveView('grid');
          }}
        />
      )}

      {/* VIEW 2: ALUMNI CARD GRID */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-brand-teal border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-brand-charcoal/60">Loading alumni directory...</p>
        </div>
      ) : filteredAlumni.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center space-y-3 border border-dashed border-gray-200">
          <AlertCircle className="w-10 h-10 text-brand-teal/40 mx-auto" />
          <h3 className="font-serif-title text-xl font-bold text-brand-charcoal">
            No alumni match your search
          </h3>
          <p className="text-xs text-brand-charcoal/60 max-w-sm mx-auto">
            Try adjusting your search keywords, cohort year, or state filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAlumni.map((item) => (
            <div
              key={item.id}
              onClick={() => handleSelectProfile(item)}
              className="bg-white rounded-2xl p-5 shadow-xs hover:shadow-md transition-all border border-brand-teal/10 hover:border-brand-teal/40 cursor-pointer flex flex-col items-center text-center justify-between h-[230px] group"
            >
              <div className="relative mt-1">
                <img
                  src={item.photo_key ? `/api/photo/${item.photo_key}` : `/api/photo/${item.id}.jpg`}
                  alt={`${item.first_name} ${item.surname}`}
                  className="w-20 h-20 rounded-full object-cover border-2 border-brand-gold/60 group-hover:scale-105 transition-transform bg-brand-cream"
                />
                {item.featured === 1 && (
                  <span className="absolute bottom-0 right-0 bg-brand-gold text-white p-0.5 rounded-full shadow-xs">
                    <Star className="w-3 h-3 fill-white" />
                  </span>
                )}
              </div>

              <div className="space-y-1 w-full px-1">
                <h3 className="font-serif-title font-bold text-base text-brand-charcoal truncate group-hover:text-brand-teal transition-colors">
                  {item.first_name} {item.surname}
                </h3>
                
                <div className="flex justify-center">
                  <span className="cohort-badge bg-brand-teal text-white text-[10px] px-2.5 py-0.5 rounded-full">
                    COHORT {item.cohort_year}
                  </span>
                </div>
              </div>

              <div className="w-full pt-1 border-t border-gray-100">
                <span className="text-[11px] text-brand-charcoal/70 truncate block font-medium">
                  {item.industry}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detailed Profile Modal */}
      {selectedProfile && (
        <AlumniProfileModal
          alumni={selectedProfile}
          onClose={() => setSelectedProfile(null)}
          onOpenPortraitCard={(alum) => setPortraitAlumni(alum)}
        />
      )}

      {/* Social Portrait Card Modal */}
      {portraitAlumni && (
        <PortraitCardModal
          alumni={portraitAlumni}
          onClose={() => setPortraitAlumni(null)}
        />
      )}

      {/* E-Book Generator Modal */}
      {isEBookModalOpen && (
        <EBookGeneratorModal
          alumni={alumni}
          onClose={() => setIsEBookModalOpen(false)}
        />
      )}
    </div>
  );
};
