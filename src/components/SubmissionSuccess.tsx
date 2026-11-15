import React, { useState } from 'react';
import { CheckCircle2, Copy, Check, Star, ExternalLink, ShieldAlert } from 'lucide-react';

interface SubmissionSuccessProps {
  data: {
    id: string;
    edit_token: string;
    surname: string;
    first_name: string;
  };
  onEditNow: (token: string) => void;
  onReset: () => void;
}

export const SubmissionSuccess: React.FC<SubmissionSuccessProps> = ({
  data,
  onEditNow,
  onReset,
}) => {
  const [copied, setCopied] = useState(false);
  const editUrl = `${window.location.origin}/edit/${data.edit_token}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(editUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12 text-center space-y-6">
      {/* Success Badge */}
      <div className="w-20 h-20 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border-2 border-emerald-200 shadow-sm animate-bounce">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-teal-tint text-brand-teal">
          <Star className="w-3.5 h-3.5 fill-brand-gold text-brand-gold" />
          Submission Received
        </div>
        <h2 className="font-serif-title text-3xl sm:text-4xl font-bold text-brand-charcoal">
          Thank You, {data.first_name}!
        </h2>
        <p className="text-sm text-brand-charcoal/70 max-w-md mx-auto">
          Your profile has been received and added to the review queue. Once approved by the administration team, your profile will appear in the directory.
        </p>
      </div>

      {/* Private Edit Link Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-brand-teal/20 text-left space-y-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-brand-orange" />
          <h3 className="text-sm font-bold text-brand-charcoal">
            Save Your Private Edit Link
          </h3>
        </div>
        <p className="text-xs text-brand-charcoal/70 leading-relaxed">
          Bookmark or save this private link on WhatsApp. You can use it at any time to update your career status, change your portrait, or remove your entry.
        </p>

        <div className="p-3 bg-brand-cream rounded-xl border border-gray-200 flex items-center justify-between gap-2 overflow-hidden">
          <span className="font-mono text-xs text-brand-teal truncate select-all">
            {editUrl}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-brand-teal hover:bg-brand-teal-dark text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy Link
              </>
            )}
          </button>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => onEditNow(data.edit_token)}
            className="flex-1 py-3 px-4 rounded-xl border border-brand-teal text-brand-teal hover:bg-brand-teal-tint font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Preview or Edit My Submission
          </button>
          
          <button
            type="button"
            onClick={onReset}
            className="py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-brand-charcoal font-semibold text-xs transition-colors"
          >
            Submit Another Entry
          </button>
        </div>
      </div>
    </div>
  );
};
