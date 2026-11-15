import React from 'react';
import { Star, ChevronRight } from 'lucide-react';
import { AlumniProfile } from './AlumniProfileModal';

interface FeaturedAlumniStripProps {
  featured: AlumniProfile[];
  onSelect: (alumni: AlumniProfile) => void;
}

export const FeaturedAlumniStrip: React.FC<FeaturedAlumniStripProps> = ({
  featured,
  onSelect,
}) => {
  if (!featured || featured.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 fill-brand-gold text-brand-gold" />
          <h2 className="font-serif-title font-bold text-lg text-brand-charcoal">
            Featured Alumni
          </h2>
        </div>
        <span className="text-[11px] text-brand-charcoal/60 uppercase tracking-wider font-semibold">
          Spotlight Fellows
        </span>
      </div>

      {/* Horizontal Scroll Strip */}
      <div className="flex gap-4 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-brand-teal/20 snap-x">
        {featured.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelect(item)}
            className="shrink-0 w-72 sm:w-80 snap-start bg-gradient-to-br from-white to-brand-cream/80 rounded-2xl p-4 border border-brand-gold/40 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-3"
          >
            <div className="flex items-start gap-3">
              <div className="relative">
                <img
                  src={item.photo_key ? `/api/photo/${item.photo_key}` : `/api/photo/${item.id}.jpg`}
                  alt={`${item.first_name} ${item.surname}`}
                  className="w-14 h-14 rounded-full object-cover border-2 border-brand-gold shadow-sm shrink-0 bg-brand-cream"
                />
                <span className="absolute -bottom-1 -right-1 bg-brand-gold text-white p-0.5 rounded-full">
                  <Star className="w-3 h-3 fill-white" />
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <span className="cohort-badge text-[10px] bg-brand-teal text-white px-2 py-0.5 rounded-sm inline-block mb-1">
                  COHORT {item.cohort_year}
                </span>
                <h3 className="font-serif-title font-bold text-base text-brand-charcoal truncate group-hover:text-brand-teal transition-colors">
                  {item.first_name} {item.surname}
                </h3>
                <p className="text-[11px] text-brand-charcoal/70 truncate">
                  {item.role || item.industry}
                </p>
              </div>
            </div>

            {item.advice && (
              <p className="text-[11px] italic text-brand-charcoal/80 line-clamp-2 bg-white/80 p-2 rounded-xl border border-brand-gold/20">
                "{item.advice}"
              </p>
            )}

            <div className="flex items-center justify-between text-[11px] font-bold text-brand-teal pt-1">
              <span>View Profile</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
