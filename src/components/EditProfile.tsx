import React, { useState, useEffect } from 'react';
import { PhotoCropper } from './PhotoCropper';
import { NIGERIAN_STATES, INDUSTRIES, COHORTS } from '../constants/options';
import { 
  Save, 
  Trash2, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Linkedin, 
  EyeOff,
  Clock
} from 'lucide-react';

interface EditProfileProps {
  token: string;
  onBack: () => void;
}

export const EditProfile: React.FC<EditProfileProps> = ({ token, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [alumniId, setAlumniId] = useState('');
  const [status, setStatus] = useState<'pending' | 'approved' | 'hidden'>('pending');
  const [surname, setSurname] = useState('');
  const [firstName, setFirstName] = useState('');
  const [photoBase64, setPhotoBase64] = useState('');
  const [currentPhotoKey, setCurrentPhotoKey] = useState<string | null>(null);
  const [city, setCity] = useState('');
  const [state, setState] = useState('Lagos');
  const [employer, setEmployer] = useState('');
  const [role, setRole] = useState('');
  const [industry, setIndustry] = useState('Technology & Software');
  const [cohortYear, setCohortYear] = useState<number>(2024);
  const [advice, setAdvice] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [hideEmployer, setHideEmployer] = useState(false);
  const [hideCity, setHideCity] = useState(false);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [token]);

  const fetchProfile = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/edit/${token}`);
      if (!res.ok) {
        throw new Error('Invalid or expired edit link.');
      }
      const data = await res.json();
      const a = data.alumni;
      setAlumniId(a.id);
      setStatus(a.status);
      setSurname(a.surname || '');
      setFirstName(a.first_name || '');
      setCurrentPhotoKey(a.photo_key || null);
      setCity(a.city || '');
      setState(a.state || 'Lagos');
      setEmployer(a.employer || '');
      setRole(a.role || '');
      setIndustry(a.industry || 'Technology & Software');
      setCohortYear(a.cohort_year || 2024);
      setAdvice(a.advice || '');
      setLinkedinUrl(a.linkedin_url || '');
      setHideEmployer(Boolean(a.hide_employer));
      setHideCity(Boolean(a.hide_city));
      setRemoved(Boolean(a.removed_at));
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not load your profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const payload = {
        surname: surname.trim(),
        first_name: firstName.trim(),
        photo: photoBase64 || undefined,
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
      };

      const res = await fetch(`/api/edit/${token}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update profile.');
      }

      setSuccessMessage('Your profile has been successfully updated!');
      if (data.photo_key) {
        setCurrentPhotoKey(data.photo_key);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleSelfRemoval = async () => {
    if (!confirm('Are you sure you want to remove your profile from the alumni directory? This will hide your details from the public directory.')) {
      return;
    }

    setRemoving(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/edit/${token}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to remove profile.');
      }

      setRemoved(true);
      setStatus('hidden');
      setSuccessMessage('Your profile has been removed from the alumni directory.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to remove profile.');
    } finally {
      setRemoving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-3">
        <div className="w-8 h-8 border-3 border-brand-teal border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm text-brand-charcoal/70">Loading your alumni record...</p>
      </div>
    );
  }

  if (errorMessage && !alumniId) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-full bg-red-50 text-brand-red flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="font-serif-title text-2xl font-bold text-brand-charcoal">Edit Link Not Found</h3>
        <p className="text-xs text-brand-charcoal/70">{errorMessage}</p>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-teal text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Directory
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-teal hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          {removed ? (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
              Removed / Hidden
            </span>
          ) : status === 'approved' ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Approved & Published
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="w-3.5 h-3.5" />
              Pending Review
            </span>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <h1 className="font-serif-title text-2xl sm:text-3xl font-bold text-brand-charcoal">
          Manage Your Alumni Profile
        </h1>
        <p className="text-xs text-brand-charcoal/60">
          Make updates to your career designation, photo, or privacy preferences anytime.
        </p>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-brand-red/20 text-brand-red text-xs sm:text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-brand-teal/10 space-y-6">
        {/* Photo Cropper */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-brand-charcoal">
            Portrait Photo
          </label>
          <PhotoCropper
            initialImage={currentPhotoKey ? `/api/photo/${currentPhotoKey}` : undefined}
            onCropComplete={(base64) => setPhotoBase64(base64)}
          />
        </div>

        {/* Names */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-charcoal">
              Surname (Last Name)
            </label>
            <input
              type="text"
              required
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-charcoal">
              First Name
            </label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-sm"
            />
          </div>
        </div>

        {/* Cohort Year & Industry */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-charcoal">
              Cohort Year
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
              Industry Sector
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

        {/* Role & Employer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-charcoal">
              Current Role
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-charcoal">
              Current Employer
            </label>
            <input
              type="text"
              value={employer}
              onChange={(e) => setEmployer(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-sm"
            />
          </div>
        </div>

        {/* State & City */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-charcoal">
              State / Region
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
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-sm"
            />
          </div>
        </div>

        {/* Advice */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-brand-charcoal">
            Advice for Future Scholars
          </label>
          <textarea
            rows={3}
            maxLength={300}
            value={advice}
            onChange={(e) => setAdvice(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-sm resize-none"
          />
        </div>

        {/* LinkedIn */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-brand-charcoal flex items-center gap-1.5">
            <Linkedin className="w-3.5 h-3.5 text-[#0A66C2]" />
            LinkedIn Profile URL
          </label>
          <input
            type="url"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-sm"
          />
        </div>

        {/* Privacy Options */}
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

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-3.5 px-6 rounded-2xl bg-brand-teal hover:bg-brand-teal-dark text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </button>

          <button
            type="button"
            onClick={handleSelfRemoval}
            disabled={removing || removed}
            className="py-3.5 px-4 rounded-2xl border border-red-200 text-brand-red hover:bg-red-50 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40"
          >
            <Trash2 className="w-4 h-4" />
            {removed ? 'Entry Removed' : 'Remove Me From Directory'}
          </button>
        </div>
      </form>
    </div>
  );
};
