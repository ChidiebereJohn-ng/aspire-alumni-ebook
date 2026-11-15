import React from 'react';
import { MapPin, Globe, Check } from 'lucide-react';
import { NIGERIAN_STATES } from '../constants/options';

interface AlumniByStateViewProps {
  stateCounts: Record<string, number>;
  selectedState: string;
  onSelectState: (state: string) => void;
}

export const AlumniByStateView: React.FC<AlumniByStateViewProps> = ({
  stateCounts,
  selectedState,
  onSelectState,
}) => {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-brand-teal/10 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-brand-teal" />
          <div>
            <h3 className="font-serif-title font-bold text-lg text-brand-charcoal">
              Alumni Distribution by State (Section 6.10)
            </h3>
            <p className="text-xs text-brand-charcoal/60">
              Tap any state tile to filter alumni residing or working across Nigeria and abroad.
            </p>
          </div>
        </div>

        {selectedState !== 'all' && (
          <button
            onClick={() => onSelectState('all')}
            className="text-xs font-bold text-brand-teal hover:underline"
          >
            Show All States
          </button>
        )}
      </div>

      {/* Grid of State Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
        {NIGERIAN_STATES.map((st) => {
          const count = stateCounts[st] || 0;
          const isSelected = selectedState === st;
          const isAbroad = st === 'Outside Nigeria';

          return (
            <button
              key={st}
              onClick={() => onSelectState(isSelected ? 'all' : st)}
              className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-brand-teal text-white border-brand-teal shadow-xs ring-2 ring-brand-teal/30'
                  : count > 0
                  ? 'bg-brand-cream/80 hover:bg-brand-teal-tint border-brand-teal/20 text-brand-charcoal'
                  : 'bg-white hover:bg-gray-50 border-gray-100 text-gray-400 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between">
                {isAbroad ? (
                  <Globe className={`w-3.5 h-3.5 ${isSelected ? 'text-brand-gold' : 'text-brand-teal'}`} />
                ) : (
                  <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-brand-gold' : 'text-brand-teal'}`} />
                )}
                {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
              </div>

              <div className="mt-2">
                <span className="font-bold text-xs block leading-tight truncate">
                  {st}
                </span>
                <span className={`text-[11px] block mt-0.5 ${
                  isSelected ? 'text-white/80' : count > 0 ? 'text-brand-teal font-semibold' : 'text-gray-400'
                }`}>
                  {count} {count === 1 ? 'alum' : 'alumni'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
