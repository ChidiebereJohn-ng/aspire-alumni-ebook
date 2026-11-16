import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';

interface AdminLoginProps {
  onSuccess: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed.');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Incorrect password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-16 px-4">
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-brand-teal/20 space-y-6 text-center">
        {/* Foundation Mark */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-brand-teal-tint flex items-center justify-center text-brand-teal mb-2">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <h2 className="font-serif-title text-2xl sm:text-3xl font-bold text-brand-charcoal">
            Administrator Portal
          </h2>
          <p className="text-xs text-brand-charcoal/60">
            Aspire for Excellence Foundation • Alumni Directory Moderation
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-brand-red/20 rounded-xl text-brand-red text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-charcoal">
              Admin Access Key / Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full pl-4 pr-11 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3.5 px-6 rounded-xl bg-brand-teal hover:bg-brand-teal-dark text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            Sign In to Dashboard
          </button>
        </form>
      </div>
    </div>
  );
};
