import React, { useState, useEffect } from 'react';
import { PhotoCropper } from './PhotoCropper';
import { TurnstileWidget } from './TurnstileWidget';
import { NIGERIAN_STATES, INDUSTRIES, COHORTS } from '../constants/options';
import { 
  Send, 
  AlertCircle, 
  Lock, 
  Linkedin, 
  EyeOff, 
  Star 
} from 'lucide-react';

interface SubmissionFormProps {
  onSuccess: (data: { id: string; edit_token: string; surname: string; first_name: string }) => void;
  prefilledCohort?: number;
}

export const SubmissionForm: React.FC<SubmissionFormProps> = ({ 
  onSuccess, 
  prefilledCohort 
}) => {
  const [surname, setSurname] = useState('');
  const [firstName, setFirstName] = useState('');
  const [photoBase64, setPhotoBase64] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Lagos');
  const [employer, setEmployer] = useState('');
  const [role, setRole] = useState('');
  const [industry, setIndustry] = useState('Technology & Software');
  const [cohortYear, setCohortYear] = useState<number>(prefilledCohort || 2024);
  const [advice, setAdvice] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [hideEmployer, setHideEmployer] = useState(false);
  const [hideCity, setHideCity] = useState(false);
  const [consent, setConsent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check URL query param ?cohort=2024 (Feature 6.6)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cohortParam = params.get('cohort');
    if (cohortParam) {
      const parsed = parseInt(cohortParam, 10);
      if (!isNaN(parsed) && parsed >= 2000 && parsed <= 2040) {
        setCohortYear(parsed);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!surname.trim() || !firstName.trim()) {
      setErrorMessage('Please provide both your surname and first name.');
      return;
    }

    if (!consent) {
      setErrorMessage('Please agree to the consent statement to appear in the alumni directory.');
      return;
    }

    if (!turnstileToken) {
      setErrorMessage('Please complete the spam check verification before submitting.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        surname: surname.trim(),
        first_name: firstName.trim(),
        photo: photoBase64, // base64 800x800 square JPEG
        city: city.trim(),
        state,
        employer: employer.trim(),
        role: role.trim(),
        industry,
        cohort_year: Number(cohortYear),
        advice: advice.trim().slice(0, 320),
        linkedin_url: linkedinUrl.trim(),
        hide_employer: hideEmployer ? 1 : 0,
        hide_city: hideCity ? 1 : 0,
        consent: consent ? 1 : 0,
        turnstile_token: turnstileToken,
      };

      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit alumni entry.');
      }

      onSuccess({
        id: data.id,
        edit_token: data.edit_token,
        surname: surname.trim(),
        first_name: firstName.trim(),
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const adviceMaxLength = 300;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Blueprint Logo Rule: Form: top center, above the title */}
      <div className="text-center space-y-3 mb-8">
        <div className="inline-block p-3 rounded-2xl bg-white shadow-xs border border-brand-teal/10">
          <img 
            src="/logo.png" 
            alt="Aspire for Excellence Foundation" 
            className="h-20 w-auto object-contain mx-auto"
          />
        </div>
        <div className="star-divider max-w-[160px] mx-auto pt-1">
          <Star className="w-4 h-4 fill-brand-gold text-brand-gold" />
        </div>
        <h1 className="font-serif-title text-3xl sm:text-4xl font-bold text-brand-charcoal">
          Alumni Directory & E-Book
        </h1>
        <p className="text-sm text-brand-charcoal/70 max-w-md mx-auto">
          Please submit your profile for the official foundation alumni directory and upcoming graduation e-book edition.
        </p>
      </div>

      {/* Form Container */}
      <form 
        onSubmit={handleSubmit} 
        className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-brand-teal/10 space-y-6"
      >
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-50 border border-brand-red/20 text-brand-red text-xs sm:text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Submission Warning</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* 1. Portrait Photo (with in-browser square crop) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-brand-charcoal">
            Portrait Photo <span className="text-brand-red">*</span>
          </label>
          <PhotoCropper onCropComplete={(base64) => setPhotoBase64(base64)} />
        </div>

        {/* 2. Names */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-charcoal">
              Surname (Last Name) <span className="text-brand-red">*</span>
            </label>
            <input
              type="text"
              required
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              placeholder="e.g. Adeyemi"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-charcoal">
              First Name <span className="text-brand-red">*</span>
            </label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. Oluwaseun"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-sm"
            />
          </div>
        </div>

        {/* 3. Cohort Year & Industry */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-charcoal">
              Cohort Year <span className="text-brand-red">*</span>
            </label>
            <select
              value={cohortYear}
              onChange={(e) => setCohortYear(parseInt(e.target.value, 10))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-sm bg-white"
            >
              {COHORTS.map((c) => (
                <option key={c} value={c}>
                  Cohort {c}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-charcoal">
              Industry Sector <span className="text-brand-red">*</span>
            </label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-sm bg-white"
            >
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4. Professional Details: Role & Employer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-charcoal">
              Current Role / Designation
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Software Engineer / Analyst"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-charcoal">
              Current Employer / Business
            </label>
            <input
              type="text"
              value={employer}
              onChange={(e) => setEmployer(e.target.value)}
              placeholder="e.g. Paystack / Central Bank / Self"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-sm"
            />
          </div>
        </div>

        {/* 5. Location: State & City */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-charcoal">
              State / Region <span className="text-brand-red">*</span>
            </label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-sm bg-white"
            >
              {NIGERIAN_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-charcoal">
              City / Town
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Ikeja, Lekki, Bodija"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-sm"
            />
          </div>
        </div>

        {/* 6. Advice / Words of Wisdom (max ~300 chars) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-charcoal">
              Advice for Future Scholars (Optional)
            </label>
            <span className={`text-[11px] font-mono ${advice.length > adviceMaxLength ? 'text-brand-red font-bold' : 'text-gray-400'}`}>
              {advice.length} / {adviceMaxLength}
            </span>
          </div>
          <textarea
            rows={3}
            maxLength={adviceMaxLength}
            value={advice}
            onChange={(e) => setAdvice(e.target.value)}
            placeholder="Share one piece of wisdom or encouragement for aspiring fellows..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-sm resize-none"
          />
          <p className="text-[11px] text-brand-charcoal/60">
            A one-line excerpt (~100 chars) is highlighted in the print e-book, with your full quote on your web profile.
          </p>
        </div>

        {/* 7. Optional LinkedIn Field (Section 6.8) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-brand-charcoal flex items-center gap-1.5">
            <Linkedin className="w-3.5 h-3.5 text-[#0A66C2]" />
            LinkedIn Profile URL (Optional)
          </label>
          <input
            type="url"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            placeholder="https://www.linkedin.com/in/your-profile"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-sm"
          />
          <p className="text-[11px] text-brand-charcoal/60">
            Shown only on your web profile. No phone numbers or emails are ever published.
          </p>
        </div>

        {/* 8. Privacy Options (Section 6.7) */}
        <div className="p-4 rounded-2xl bg-brand-cream/80 border border-brand-teal/10 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-teal">
            <EyeOff className="w-4 h-4" />
            <span>Privacy Options</span>
          </div>
          
          <div className="space-y-2 text-xs text-brand-charcoal">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={hideEmployer}
                onChange={(e) => setHideEmployer(e.target.checked)}
                className="w-4 h-4 rounded text-brand-teal accent-brand-teal"
              />
              <span>Hide my employer name on the public directory</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={hideCity}
                onChange={(e) => setHideCity(e.target.checked)}
                className="w-4 h-4 rounded text-brand-teal accent-brand-teal"
              />
              <span>Hide my city name on the public directory</span>
            </label>
          </div>
        </div>

        {/* 9. Consent Checkbox (Nigeria Data Protection Act 2023 aligned) */}
        <div className="p-4 rounded-2xl bg-brand-teal-tint/40 border border-brand-teal/20 space-y-2">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              required
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="w-4 h-4 rounded mt-0.5 text-brand-teal accent-brand-teal"
            />
            <span className="text-xs text-brand-charcoal leading-relaxed">
              <strong>Consent:</strong> I agree that my details and portrait photo will appear in the official Aspire for Excellence Foundation alumni directory and e-book editions. I understand I will receive a private edit link to update or remove my entry at any time.
            </span>
          </label>
        </div>

        {/* 10. Turnstile Spam Check */}
        <div className="border-t border-gray-100 pt-4">
          <TurnstileWidget 
            onVerify={(token) => setTurnstileToken(token)} 
          />
        </div>

        {/* 11. Submit Button */}
        <button
          type="submit"
          disabled={loading || !turnstileToken}
          className="w-full py-4 px-6 rounded-2xl bg-brand-teal hover:bg-brand-teal-dark text-white font-bold text-sm tracking-wide transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Saving Alumni Profile...
            </span>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit Alumni Profile
            </>
          )}
        </button>

        <p className="text-center text-[11px] text-brand-charcoal/60 flex items-center justify-center gap-1">
          <Lock className="w-3 h-3 text-brand-teal" />
          Entries are reviewed and approved by the foundation team before publication.
        </p>
      </form>
    </div>
  );
};
