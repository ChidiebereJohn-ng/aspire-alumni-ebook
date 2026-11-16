import React, { useEffect } from 'react';
import { 
  X, 
  MapPin, 
  Briefcase, 
  Linkedin, 
  Star, 
  Award,
  Sparkles
} from 'lucide-react';

export interface AlumniProfile {
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
  linkedin_url?: string | null;
  featured?: number;
  leadership_role?: 'lead_mentor' | 'team' | null;
  leadership_title?: string | null;
  hide_employer?: number;
  hide_city?: number;
}

interface AlumniProfileModalProps {
  alumni: AlumniProfile | null;
  onClose: () => void;
  onOpenPortraitCard?: (alumni: AlumniProfile) => void;
}

export const AlumniProfileModal: React.FC<AlumniProfileModalProps> = ({
  alumni,
  onClose,
  onOpenPortraitCard,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!alumni) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-brand-teal/20 relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative Header Banner */}
        <div className="h-28 bg-gradient-to-r from-brand-teal via-[#127F85] to-brand-teal-dark relative p-4 flex items-start justify-between">
          <div className="flex items-center gap-1.5 text-brand-gold text-xs font-semibold">
            <Star className="w-4 h-4 fill-brand-gold" />
            <span>Aspire Fellow • Class of {alumni.cohort_year}</span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Avatar & Main Info */}
        <div className="px-6 pb-6 pt-0 relative">
          {/* Overlapping Avatar */}
          <div className="-mt-14 mb-4 flex items-end justify-between">
            <div className="relative">
              <img
                src={alumni.photo_key ? `/api/photo/${alumni.photo_key}` : `/api/photo/${alumni.id}.jpg`}
                alt={`${alumni.first_name} ${alumni.surname}`}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-white shadow-md bg-brand-cream"
              />
              {alumni.featured === 1 && (
                <span 
                  className="absolute bottom-1 right-1 bg-brand-gold text-white p-1 rounded-full shadow-xs"
                  title="Featured Alumni"
                >
                  <Star className="w-4 h-4 fill-white" />
                </span>
              )}
            </div>

            <span className="cohort-badge bg-brand-teal text-white text-xs px-3 py-1 rounded-full shadow-xs">
              COHORT {alumni.cohort_year}
            </span>
          </div>

          {/* Name & Industry */}
          <div className="space-y-1">
            {alumni.leadership_role === 'lead_mentor' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-gold text-brand-charcoal uppercase tracking-wider mb-1">
                👑 {alumni.leadership_title || 'Lead Mentor'}
              </span>
            )}
            {alumni.leadership_role === 'team' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-teal text-white uppercase tracking-wider mb-1">
                👥 {alumni.leadership_title || 'Foundation Mentor'}
              </span>
            )}
            <h2 className="font-serif-title text-2xl sm:text-3xl font-bold text-brand-charcoal">
              {alumni.first_name} {alumni.surname}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-brand-teal uppercase tracking-wider">
                {alumni.industry}
              </span>
            </div>
          </div>

          {/* Career & Location Badges */}
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-2.5 text-xs text-brand-charcoal/80">
            {/* Role & Employer */}
            <div className="flex items-start gap-2.5">
              <Briefcase className="w-4 h-4 text-brand-teal shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-brand-charcoal block">
                  {alumni.role || 'Professional Alumni'}
                </span>
                <span className="text-brand-charcoal/60 block mt-0.5">
                  {alumni.hide_employer ? 'Private Organization' : alumni.employer || 'Aspire Network'}
                </span>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-brand-teal shrink-0" />
              <span>
                {alumni.city && !alumni.hide_city ? `${alumni.city}, ` : ''}{alumni.state}
              </span>
            </div>
          </div>

          {/* Advice / Words of Wisdom Section */}
          {alumni.advice && (
            <div className="mt-5 p-4 rounded-2xl bg-brand-cream/80 border border-brand-teal/15 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-teal">
                <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
                <span>Advice for Future Fellows</span>
              </div>
              <p className="font-serif-title text-sm sm:text-base italic text-brand-charcoal leading-relaxed">
                "{alumni.advice}"
              </p>
            </div>
          )}

          {/* Social & Action Links */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
            {alumni.linkedin_url ? (
              <a
                href={alumni.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0A66C2] hover:bg-[#084e96] text-white text-xs font-bold transition-colors shadow-xs"
              >
                <Linkedin className="w-4 h-4" />
                Connect on LinkedIn
              </a>
            ) : (
              <span className="text-[11px] text-gray-400 italic">No LinkedIn link provided</span>
            )}

            {onOpenPortraitCard && (
              <button
                type="button"
                onClick={() => onOpenPortraitCard(alumni)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-brand-teal text-brand-teal hover:bg-brand-teal-tint text-xs font-bold transition-colors"
              >
                <Award className="w-3.5 h-3.5" />
                Share Portrait Card
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
