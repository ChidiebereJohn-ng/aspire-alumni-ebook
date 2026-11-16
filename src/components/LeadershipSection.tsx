import React from 'react';
import { Crown, Users, Linkedin, MapPin, Briefcase, Quote } from 'lucide-react';
import { AlumniProfile } from './AlumniProfileModal';

interface LeadershipSectionProps {
  leadMentor: AlumniProfile | null;
  leadershipTeam: AlumniProfile[];
  onSelectAlumni: (alumni: AlumniProfile) => void;
}

export const LeadershipSection: React.FC<LeadershipSectionProps> = ({
  leadMentor,
  leadershipTeam,
  onSelectAlumni,
}) => {
  // If no lead mentor and no team members assigned, do not render
  if (!leadMentor && (!leadershipTeam || leadershipTeam.length === 0)) {
    return null;
  }

  return (
    <section className="space-y-6 pt-2 pb-6">
      {/* Section Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-gold/15 text-brand-charcoal border border-brand-gold/30">
          <Crown className="w-3.5 h-3.5 text-brand-gold fill-brand-gold" />
          <span>Foundation Leadership & Mentorship</span>
        </div>
        <h2 className="font-serif-title text-2xl sm:text-3xl font-bold text-brand-charcoal tracking-tight">
          Mentorship & Direction Team
        </h2>
        <p className="text-xs sm:text-sm text-brand-charcoal/70 max-w-xl mx-auto">
          Leading the mission to empower scholars, fellows, and emerging visionaries across Nigeria and the world.
        </p>
      </div>

      {/* 1. LEAD MENTOR SPOTLIGHT ("THE BOSS") */}
      {leadMentor && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-teal via-[#0E6C71] to-brand-charcoal text-white p-6 sm:p-8 shadow-xl border-2 border-brand-gold/50">
          {/* Subtle decorative gold stars in background */}
          <div className="absolute top-3 right-4 text-brand-gold/20 select-none pointer-events-none text-6xl font-serif">
            ★
          </div>
          <div className="absolute -bottom-6 -right-6 text-brand-gold/10 select-none pointer-events-none text-9xl font-serif">
            ★
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8">
            {/* Avatar & Badge */}
            <div className="flex flex-col items-center shrink-0">
              <div className="relative">
                <img
                  src={leadMentor.photo_key ? `/api/photo/${leadMentor.photo_key}` : `/api/photo/${leadMentor.id}.jpg`}
                  alt={`${leadMentor.first_name} ${leadMentor.surname}`}
                  className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-brand-gold shadow-2xl bg-brand-cream"
                />
                <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-brand-gold text-brand-charcoal px-3 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider shadow-md whitespace-nowrap flex items-center gap-1">
                  <Crown className="w-3 h-3 fill-brand-charcoal" />
                  Lead Mentor
                </span>
              </div>
              <span className="text-[11px] text-white/70 mt-4">
                Cohort {leadMentor.cohort_year}
              </span>
            </div>

            {/* Profile Content */}
            <div className="flex-1 text-center md:text-left space-y-3">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-md bg-white/10 text-brand-gold text-xs font-semibold tracking-wide uppercase mb-1">
                  {leadMentor.leadership_title || 'Founder & Lead Mentor'}
                </span>
                <h3 className="font-serif-title text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white">
                  {leadMentor.first_name} {leadMentor.surname}
                </h3>
                {(leadMentor.role || leadMentor.employer) && (
                  <p className="text-sm text-white/80 font-medium mt-1 flex items-center justify-center md:justify-start gap-1.5 flex-wrap">
                    <Briefcase className="w-3.5 h-3.5 text-brand-gold" />
                    <span>{leadMentor.role}</span>
                    {leadMentor.employer && (
                      <>
                        <span className="text-white/40">•</span>
                        <span>{leadMentor.employer}</span>
                      </>
                    )}
                  </p>
                )}
                {leadMentor.state && (
                  <p className="text-xs text-white/60 flex items-center justify-center md:justify-start gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-brand-gold/80" />
                    <span>{leadMentor.city ? `${leadMentor.city}, ` : ''}{leadMentor.state}, Nigeria</span>
                  </p>
                )}
              </div>

              {/* Advice Quote */}
              {leadMentor.advice && (
                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 text-xs sm:text-sm italic leading-relaxed text-brand-cream/90 relative">
                  <Quote className="w-4 h-4 text-brand-gold/60 inline mr-1 -mt-1" />
                  <span>"{leadMentor.advice}"</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-center md:justify-start gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => onSelectAlumni(leadMentor)}
                  className="px-4 py-2 bg-brand-gold text-brand-charcoal rounded-xl text-xs font-bold hover:bg-brand-gold/90 transition-all shadow-md flex items-center gap-1.5"
                >
                  <span>View Full Profile</span>
                </button>
                {leadMentor.linkedin_url && (
                  <a
                    href={leadMentor.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
                    title="Connect on LinkedIn"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. LEADERSHIP & MENTORSHIP TEAM GRID */}
      {leadershipTeam && leadershipTeam.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="font-serif-title text-xl font-bold text-brand-charcoal flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-teal" />
              <span>Mentorship Team</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-brand-teal-tint text-brand-teal font-sans font-bold">
                {leadershipTeam.length}
              </span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {leadershipTeam.map((member) => (
              <div
                key={member.id}
                onClick={() => onSelectAlumni(member)}
                className="bg-white rounded-2xl p-5 shadow-xs hover:shadow-md transition-all border border-brand-teal/20 hover:border-brand-teal flex flex-col items-center text-center justify-between h-[255px] cursor-pointer group"
              >
                <div className="relative mt-1">
                  <img
                    src={member.photo_key ? `/api/photo/${member.photo_key}` : `/api/photo/${member.id}.jpg`}
                    alt={`${member.first_name} ${member.surname}`}
                    className="w-20 h-20 rounded-full object-cover border-2 border-brand-teal group-hover:scale-105 transition-transform bg-brand-cream"
                  />
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-brand-teal text-white px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shadow-xs whitespace-nowrap">
                    Team
                  </span>
                </div>

                <div className="space-y-1 w-full px-1 mt-2">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-brand-teal truncate">
                    {member.leadership_title || 'Foundation Mentor'}
                  </span>
                  <h4 className="font-serif-title font-bold text-base text-brand-charcoal truncate">
                    {member.first_name} {member.surname}
                  </h4>
                  <p className="text-[11px] text-brand-charcoal/70 truncate">
                    {member.role || member.industry || `Cohort ${member.cohort_year}`}
                  </p>
                  {member.employer && (
                    <p className="text-[10px] text-brand-charcoal/50 truncate">
                      {member.employer}
                    </p>
                  )}
                </div>

                <div className="w-full pt-2 border-t border-brand-cream/80 flex items-center justify-between text-[11px] text-brand-charcoal/60 px-1">
                  <span className="cohort-badge bg-brand-cream text-brand-teal font-semibold px-2 py-0.5 rounded text-[10px]">
                    Cohort {member.cohort_year}
                  </span>
                  <span className="text-brand-teal font-semibold group-hover:underline text-[11px]">
                    View →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
