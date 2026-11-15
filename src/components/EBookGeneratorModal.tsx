import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  Download, 
  CheckCircle2 
} from 'lucide-react';
import { generateAlumniEBook } from '../utils/ebookGenerator';
import { AlumniProfile } from './AlumniProfileModal';
import { COHORTS } from '../constants/options';

interface EBookGeneratorModalProps {
  alumni: AlumniProfile[];
  onClose: () => void;
  isAdmin?: boolean;
}

export const EBookGeneratorModal: React.FC<EBookGeneratorModalProps> = ({
  alumni,
  onClose,
  isAdmin = false,
}) => {
  const [scope, setScope] = useState<string>('all');
  const [editionName, setEditionName] = useState<string>(`Edition ${new Date().getFullYear()}`);
  const [generating, setGenerating] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [generatedPdfBytes, setGeneratedPdfBytes] = useState<Uint8Array | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    setProgressText('Preparing layout, fonts, and brand assets...');
    try {
      setProgressText('Building cover, welcome address, and table of contents...');
      const bytes = await generateAlumniEBook({
        editionName,
        scope,
        alumni,
      });

      setGeneratedPdfBytes(bytes);
      setProgressText('E-Book generated successfully!');

      // If admin, record edition in database
      if (isAdmin) {
        try {
          await fetch('/api/admin/ebook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              edition_name: editionName,
              scope,
            }),
          });
          setSaveSuccess(true);
        } catch (e) {
          console.warn('Failed to register ebook edition:', e);
        }
      }
    } catch (err: any) {
      alert(`Error generating e-book: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedPdfBytes) return;
    const blob = new Blob([generatedPdfBytes as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = editionName.replace(/[^a-z0-9]/gi, '_');
    a.download = `Aspire_Alumni_Directory_${safeName}_${scope}.pdf`;
    a.click();
  };

  const fellowsCount = scope === 'all' 
    ? alumni.length 
    : alumni.filter(a => String(a.cohort_year) === scope).length;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand-teal" />
            <h3 className="font-serif-title font-bold text-xl text-brand-charcoal">
              Alumni E-Book Generator
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-brand-charcoal/70">
          Produces a complete publication e-book with cover, welcome note, table of contents, cohort divider pages, 2×2 profile grids, and back cover.
        </p>

        {/* Edition Scope Selector */}
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-brand-charcoal block">
              Edition Scope
            </label>
            <select
              value={scope}
              onChange={(e) => {
                setScope(e.target.value);
                setGeneratedPdfBytes(null);
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
            >
              <option value="all">Full Directory (All Cohorts)</option>
              {COHORTS.map((c) => (
                <option key={c} value={String(c)}>Single Edition: Cohort {c}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-brand-charcoal block">
              Edition Title (Section 6.3)
            </label>
            <input
              type="text"
              value={editionName}
              onChange={(e) => setEditionName(e.target.value)}
              placeholder="e.g. Edition 2026"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
            />
          </div>

          <div className="p-3 bg-brand-cream/80 rounded-xl border border-brand-teal/15 flex items-center justify-between text-xs">
            <span className="text-brand-charcoal/70">Included Fellows:</span>
            <span className="font-bold text-brand-teal">{fellowsCount} approved profiles</span>
          </div>
        </div>

        {/* Generation Progress Indicator */}
        {generating && (
          <div className="p-4 bg-brand-teal-tint/50 rounded-2xl border border-brand-teal/20 text-center space-y-2">
            <div className="w-7 h-7 border-3 border-brand-teal border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-semibold text-brand-teal">{progressText}</p>
          </div>
        )}

        {/* Generated Success */}
        {generatedPdfBytes && (
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-3">
            <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>PDF Ready for Download! ({Math.round(generatedPdfBytes.length / 1024)} KB)</span>
            </div>
            {saveSuccess && (
              <p className="text-[11px] text-emerald-700">
                ✓ Recorded edition in foundation publications archive.
              </p>
            )}
            
            <button
              type="button"
              onClick={handleDownload}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              <Download className="w-4 h-4" />
              Save PDF Publication
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100"
          >
            Close
          </button>
          {!generatedPdfBytes && (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating || fellowsCount === 0}
              className="px-5 py-2.5 rounded-xl bg-brand-teal hover:bg-brand-teal-dark text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Generate Publication
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
