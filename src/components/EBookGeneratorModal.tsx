import React, { useState, useEffect } from 'react';
import { 
  X, 
  BookOpen, 
  Download, 
  CheckCircle2, 
  Archive, 
  Trash2, 
  Calendar,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { generateAlumniEBook } from '../utils/ebookGenerator';
import { AlumniProfile } from './AlumniProfileModal';
import { COHORTS } from '../constants/options';

interface EBookGeneratorModalProps {
  alumni: AlumniProfile[];
  onClose: () => void;
  isAdmin?: boolean;
}

interface ArchivedEdition {
  id: string;
  edition_name: string;
  scope: string;
  pdf_key: string;
  generated_at: string;
}

export const EBookGeneratorModal: React.FC<EBookGeneratorModalProps> = ({
  alumni,
  onClose,
  isAdmin = false,
}) => {
  const [activeTab, setActiveTab] = useState<'generate' | 'archive'>('generate');
  const [scope, setScope] = useState<string>('all');
  const [editionName, setEditionName] = useState<string>(`Edition ${new Date().getFullYear()}`);
  const [generating, setGenerating] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [generatedPdfBytes, setGeneratedPdfBytes] = useState<Uint8Array | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Archive list state
  const [archivedEditions, setArchivedEditions] = useState<ArchivedEdition[]>([]);
  const [loadingArchive, setLoadingArchive] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchArchive();
  }, [isAdmin]);

  const fetchArchive = async () => {
    setLoadingArchive(true);
    try {
      const endpoint = isAdmin ? '/api/admin/ebook' : '/api/ebooks';
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        setArchivedEditions(data.ebooks || []);
      }
    } catch (err) {
      console.warn('Failed to fetch archive:', err);
    } finally {
      setLoadingArchive(false);
    }
  };

  const handleGenerate = async (customScope?: string, customName?: string) => {
    const targetScope = customScope || scope;
    const targetName = customName || editionName;

    setGenerating(true);
    setProgressText('Preparing publication layout and typography...');
    try {
      setProgressText('Building cover, welcome address, and table of contents...');
      const bytes = await generateAlumniEBook({
        editionName: targetName,
        scope: targetScope,
        alumni,
      });

      setGeneratedPdfBytes(bytes);
      setProgressText('E-Book generated successfully!');

      // Register edition in archive
      try {
        await fetch(isAdmin ? '/api/admin/ebook' : '/api/ebook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            edition_name: targetName,
            scope: targetScope,
          }),
        });
        setSaveSuccess(true);
        fetchArchive();
      } catch (e) {
        console.warn('Failed to record edition in archive:', e);
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

    // Log ebook_download event (Blueprint Section 6.4)
    try {
      fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ebook_download',
          cohort_year: scope === 'all' ? null : parseInt(scope, 10),
        }),
      }).catch(() => {});
    } catch {}
  };

  const handleDeleteEdition = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this edition from the archive?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/ebook?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setArchivedEditions((prev) => prev.filter((item) => item.id !== id));
      } else {
        alert('Failed to delete edition.');
      }
    } catch {
      alert('Error connecting to server.');
    } finally {
      setDeletingId(null);
    }
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
        className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand-teal" />
            <h3 className="font-serif-title font-bold text-xl text-brand-charcoal">
              Alumni E-Book & Yearbooks
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Generate vs Archive */}
        <div className="flex items-center border border-brand-teal/20 p-1 rounded-xl bg-brand-cream/50 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('generate')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'generate'
                ? 'bg-brand-teal text-white shadow-xs'
                : 'text-brand-charcoal/70 hover:text-brand-teal'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Edition</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('archive')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'archive'
                ? 'bg-brand-teal text-white shadow-xs'
                : 'text-brand-charcoal/70 hover:text-brand-teal'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Editions Archive ({archivedEditions.length})</span>
          </button>
        </div>

        {/* Body Container */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-0.5">
          {activeTab === 'generate' ? (
            <div className="space-y-4">
              <p className="text-xs text-brand-charcoal/70">
                Produces a publication-grade PDF yearbook with cover page, foundation welcome address, cohort dividers, 2×2 portrait grids, and closing back cover.
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
                    <option value="all">Full Directory (All Cohorts 2021–2026)</option>
                    {COHORTS.map((c) => (
                      <option key={c} value={String(c)}>Single Cohort: Class of {c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-brand-charcoal block">
                    Named Edition Title (Section 6.3)
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
                  <span className="text-brand-charcoal/70">Included Alumni:</span>
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
                      ✓ Saved to editions archive as "{editionName}". Older versions remain available.
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
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-brand-charcoal/70">
                  Previously published editions. Older versions remain available for review and download.
                </p>
                <button
                  type="button"
                  onClick={fetchArchive}
                  disabled={loadingArchive}
                  className="p-1 text-brand-teal hover:bg-brand-cream rounded-lg transition-colors"
                  title="Refresh archive"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingArchive ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {loadingArchive ? (
                <div className="py-12 text-center space-y-2">
                  <div className="w-6 h-6 border-2 border-brand-teal border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-brand-charcoal/60">Loading editions archive...</p>
                </div>
              ) : archivedEditions.length === 0 ? (
                <div className="p-8 text-center bg-brand-cream/40 rounded-2xl border border-dashed border-gray-200 space-y-2">
                  <Archive className="w-8 h-8 text-gray-300 mx-auto" />
                  <p className="text-xs font-semibold text-brand-charcoal/70">No editions archived yet</p>
                  <p className="text-[11px] text-brand-charcoal/50">
                    Switch to "Generate Edition" to publish your first alumni yearbook.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[46vh] overflow-y-auto">
                  {archivedEditions.map((ed) => (
                    <div
                      key={ed.id}
                      className="p-3.5 bg-white rounded-xl border border-brand-teal/15 hover:border-brand-teal/30 transition-all shadow-xs flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-serif-title font-bold text-sm text-brand-charcoal truncate">
                            {ed.edition_name}
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-teal-tint text-brand-teal shrink-0">
                            {ed.scope === 'all' ? 'All Cohorts' : `Cohort ${ed.scope}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-brand-charcoal/60">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {new Date(ed.generated_at).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setScope(ed.scope);
                            setEditionName(ed.edition_name);
                            setActiveTab('generate');
                            handleGenerate(ed.scope, ed.edition_name);
                          }}
                          className="px-2.5 py-1.5 bg-brand-cream hover:bg-brand-teal-tint text-brand-teal font-semibold text-[11px] rounded-lg transition-colors flex items-center gap-1 border border-brand-teal/20"
                          title="Generate & Download this edition"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </button>

                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDeleteEdition(ed.id)}
                            disabled={deletingId === ed.id}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete this edition from archive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100"
          >
            Close
          </button>
          {activeTab === 'generate' && !generatedPdfBytes && (
            <button
              type="button"
              onClick={() => handleGenerate()}
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
