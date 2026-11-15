import React, { useState, useRef } from 'react';

interface PreviewItem {
  tempId: string;
  data: {
    surname: string;
    first_name: string;
    cohort_year: number;
    industry: string;
    role: string;
    employer: string;
    city: string;
    state: string;
    country: string;
    advice: string;
    linkedin_url: string;
  };
  status: 'new' | 'duplicate' | 'possible_duplicate';
  matchedId: string | null;
  matchedName: string | null;
  matchedCohort: number | null;
  reason: string;
  decision: 'skip' | 'update' | 'import';
}

interface CsvSummary {
  total: number;
  newCount: number;
  duplicateCount: number;
  possibleCount: number;
}

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const [step, setStep] = useState<'upload' | 'preview' | 'committing'>('upload');
  const [csvFileName, setCsvFileName] = useState<string>('');
  const [previewItems, setPreviewItems] = useState<PreviewItem[]>([]);
  const [summary, setSummary] = useState<CsvSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultSummary, setResultSummary] = useState<{
    importedCount: number;
    updatedCount: number;
    skippedCount: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const templateContent = `Surname,First Name,Cohort Year,Industry,Role,Employer,City,State,Country,Advice Quote,LinkedIn URL
Adeyemi,Oluwaseun,2023,Technology & Software,Senior Frontend Engineer,Paystack,Ikeja,Lagos,Nigeria,Focus on mastering fundamentals before jumping to frameworks.,https://linkedin.com/in/example
Okonkwo,Chidinma,2022,Banking & Financial Services,Financial Analyst,Standard Chartered Bank,Victoria Island,Lagos,Nigeria,Consistent networking opens more doors than credentials alone.,https://linkedin.com/in/example
Bello,Ibrahim,2024,Healthcare & Medicine,Medical Officer,National Hospital Abuja,Garki,Abuja,Nigeria,Never lose sight of why you started and keep compassion first.,`;

    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'aspire_alumni_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    setLoading(true);
    setError(null);

    try {
      const text = await file.text();
      const res = await fetch('/api/admin/csv-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'preview',
          csvText: text,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to parse CSV preview.');
      }

      setPreviewItems(data.previewRows);
      setSummary(data.summary);
      setStep('preview');
    } catch (err: any) {
      setError(err.message || 'Error processing CSV file.');
    } finally {
      setLoading(false);
    }
  };

  const handleDecisionChange = (tempId: string, decision: 'skip' | 'update' | 'import') => {
    setPreviewItems((prev) =>
      prev.map((item) => (item.tempId === tempId ? { ...item, decision } : item))
    );
  };

  const handleBulkSetDecision = (
    filterStatus: 'new' | 'duplicate' | 'possible_duplicate' | 'all',
    decision: 'skip' | 'update' | 'import'
  ) => {
    setPreviewItems((prev) =>
      prev.map((item) => {
        if (filterStatus === 'all' || item.status === filterStatus) {
          // If updating, only valid if matchedId exists
          if (decision === 'update' && !item.matchedId) {
            return { ...item, decision: 'import' };
          }
          return { ...item, decision };
        }
        return item;
      })
    );
  };

  const handleCommit = async () => {
    setStep('committing');
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/csv-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'commit',
          items: previewItems.map((item) => ({
            tempId: item.tempId,
            data: item.data,
            decision: item.decision,
            matchedId: item.matchedId,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to complete import.');
      }

      setResultSummary({
        importedCount: data.importedCount,
        updatedCount: data.updatedCount,
        skippedCount: data.skippedCount,
      });
      onImportComplete();
    } catch (err: any) {
      setError(err.message || 'Error committing import.');
      setStep('preview');
    } finally {
      setLoading(false);
    }
  };

  const toImportCount = previewItems.filter((i) => i.decision === 'import').length;
  const toUpdateCount = previewItems.filter((i) => i.decision === 'update').length;
  const toSkipCount = previewItems.filter((i) => i.decision === 'skip').length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-deepCharcoal/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6 sm:p-8 max-h-[92vh] flex flex-col border border-warmGold/20">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-lightTealTint/60">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl">📊</span>
              <h3 className="font-serif text-2xl font-bold text-teal">Bulk Alumni Import (CSV)</h3>
            </div>
            <p className="text-xs sm:text-sm text-deepCharcoal/70 mt-1">
              Import past cohorts (2021–2025). The system analyzes duplicate names and cohort mismatches before saving.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-deepCharcoal/40 hover:text-deepCharcoal p-1 rounded-lg transition-colors text-xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="my-3 p-3 bg-red-50 border border-logoRed/30 text-logoRed text-xs sm:text-sm rounded-xl">
            {error}
          </div>
        )}

        {/* Body based on step */}
        <div className="flex-1 overflow-y-auto py-4">
          {step === 'upload' && (
            <div className="space-y-6">
              <div className="bg-lightTealTint/30 border border-teal/20 rounded-2xl p-6 text-center space-y-4">
                <div className="w-14 h-14 mx-auto rounded-full bg-teal/10 flex items-center justify-center text-teal text-2xl">
                  📁
                </div>
                <div>
                  <h4 className="font-semibold text-deepCharcoal text-base">Select or Drag CSV Spreadsheet</h4>
                  <p className="text-xs text-deepCharcoal/60 mt-1">
                    Columns supported: Surname, First Name, Cohort Year, Industry, Role, Employer, City, State, Country, Advice Quote, LinkedIn URL
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    className="w-full sm:w-auto px-6 py-2.5 bg-teal text-white rounded-xl font-medium text-sm hover:bg-teal/90 transition-colors shadow-sm disabled:opacity-50"
                  >
                    {loading ? 'Analyzing CSV...' : 'Choose CSV File'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="w-full sm:w-auto px-4 py-2.5 bg-white border border-warmGold/40 text-deepCharcoal rounded-xl font-medium text-sm hover:bg-warmOffWhite transition-colors flex items-center justify-center space-x-1"
                  >
                    <span>⬇️</span>
                    <span>Download Template</span>
                  </button>
                </div>
              </div>

              <div className="bg-warmOffWhite p-4 rounded-xl border border-warmGold/20 text-xs text-deepCharcoal/80 space-y-1">
                <p className="font-semibold text-teal">Blueprint Rules Enforced:</p>
                <ul className="list-disc list-inside space-y-0.5 text-deepCharcoal/70">
                  <li>Imported alumni are placed into <strong>Pending</strong> state until approved.</li>
                  <li>Exact match = Same surname, first name, and cohort (ignoring case & whitespace).</li>
                  <li>Possible duplicate = Same name in a different cohort or 1-letter spelling difference.</li>
                  <li>Before any record is created, you choose: <strong>Skip</strong>, <strong>Update</strong>, or <strong>Import anyway</strong>.</li>
                </ul>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              {/* Summary Stats */}
              {summary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 bg-warmOffWhite rounded-xl border border-lightTealTint/60 text-center">
                    <span className="block text-xs text-deepCharcoal/60 font-medium">Total Rows</span>
                    <span className="text-xl font-bold text-deepCharcoal">{summary.total}</span>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                    <span className="block text-xs text-emerald-800 font-medium">New Alumni</span>
                    <span className="text-xl font-bold text-emerald-700">{summary.newCount}</span>
                  </div>
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-center">
                    <span className="block text-xs text-rose-800 font-medium">Exact Duplicates</span>
                    <span className="text-xl font-bold text-rose-700">{summary.duplicateCount}</span>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-center">
                    <span className="block text-xs text-amber-800 font-medium">Possible Duplicates</span>
                    <span className="text-xl font-bold text-amber-700">{summary.possibleCount}</span>
                  </div>
                </div>
              )}

              {/* Bulk decision helpers */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-lightTealTint/40 rounded-xl text-xs">
                <div className="text-deepCharcoal/70">
                  File: <strong className="text-deepCharcoal">{csvFileName}</strong>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-deepCharcoal/60">Quick actions:</span>
                  <button
                    type="button"
                    onClick={() => handleBulkSetDecision('new', 'import')}
                    className="px-2.5 py-1 bg-white border border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-50 text-[11px] font-medium"
                  >
                    Import All New
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkSetDecision('duplicate', 'skip')}
                    className="px-2.5 py-1 bg-white border border-rose-300 text-rose-700 rounded-lg hover:bg-rose-50 text-[11px] font-medium"
                  >
                    Skip All Duplicates
                  </button>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-lightTealTint/60 rounded-xl overflow-x-auto max-h-[48vh]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-lightTealTint/50 text-deepCharcoal font-semibold border-b border-lightTealTint sticky top-0 z-10">
                    <tr>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Alumni Name</th>
                      <th className="p-2.5">Cohort</th>
                      <th className="p-2.5">Industry & Role</th>
                      <th className="p-2.5">Location</th>
                      <th className="p-2.5 text-right">Decision</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-lightTealTint/40">
                    {previewItems.map((item) => (
                      <tr
                        key={item.tempId}
                        className={`hover:bg-warmOffWhite/60 transition-colors ${
                          item.status === 'duplicate'
                            ? 'bg-rose-50/40'
                            : item.status === 'possible_duplicate'
                            ? 'bg-amber-50/40'
                            : ''
                        }`}
                      >
                        <td className="p-2.5 whitespace-nowrap">
                          {item.status === 'new' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                              ✓ New
                            </span>
                          )}
                          {item.status === 'duplicate' && (
                            <div>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800">
                                ⚠️ Duplicate
                              </span>
                              <span className="block text-[10px] text-rose-600 mt-0.5">{item.reason}</span>
                            </div>
                          )}
                          {item.status === 'possible_duplicate' && (
                            <div>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                                ⚡ Possible Match
                              </span>
                              <span className="block text-[10px] text-amber-700 mt-0.5">{item.reason}</span>
                            </div>
                          )}
                        </td>
                        <td className="p-2.5 font-medium text-deepCharcoal whitespace-nowrap">
                          {item.data.first_name} {item.data.surname}
                        </td>
                        <td className="p-2.5 whitespace-nowrap">
                          <span className="px-2 py-0.5 bg-teal/10 text-teal rounded-md font-medium text-[11px]">
                            {item.data.cohort_year}
                          </span>
                        </td>
                        <td className="p-2.5 text-deepCharcoal/70">
                          {item.data.role ? (
                            <div>
                              <div className="text-deepCharcoal font-medium truncate max-w-[150px]">
                                {item.data.role}
                              </div>
                              <div className="text-[10px] text-deepCharcoal/60 truncate max-w-[150px]">
                                {item.data.industry}
                              </div>
                            </div>
                          ) : (
                            <span className="text-deepCharcoal/40 italic">—</span>
                          )}
                        </td>
                        <td className="p-2.5 text-deepCharcoal/70 whitespace-nowrap">
                          {item.data.city ? `${item.data.city}, ${item.data.state || ''}` : item.data.state || '—'}
                        </td>
                        <td className="p-2.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center bg-white border border-lightTealTint rounded-lg p-0.5 shadow-xs space-x-0.5">
                            <button
                              type="button"
                              onClick={() => handleDecisionChange(item.tempId, 'skip')}
                              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                                item.decision === 'skip'
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'text-deepCharcoal/60 hover:text-deepCharcoal'
                              }`}
                            >
                              Skip
                            </button>
                            {item.matchedId && (
                              <button
                                type="button"
                                onClick={() => handleDecisionChange(item.tempId, 'update')}
                                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                                  item.decision === 'update'
                                    ? 'bg-amber-500 text-white shadow-xs'
                                    : 'text-deepCharcoal/60 hover:text-deepCharcoal'
                                }`}
                              >
                                Update
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDecisionChange(item.tempId, 'import')}
                              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                                item.decision === 'import'
                                  ? 'bg-teal text-white shadow-xs'
                                  : 'text-deepCharcoal/60 hover:text-deepCharcoal'
                              }`}
                            >
                              Import
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {step === 'committing' && (
            <div className="py-12 text-center space-y-4">
              {loading ? (
                <>
                  <div className="w-12 h-12 border-4 border-teal border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="font-semibold text-deepCharcoal">Processing Bulk Import...</p>
                  <p className="text-xs text-deepCharcoal/60">Saving decisions to Cloudflare D1 database.</p>
                </>
              ) : resultSummary ? (
                <div className="space-y-4">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-serif text-2xl font-bold text-teal">Import Completed!</h4>
                    <p className="text-xs sm:text-sm text-deepCharcoal/70 mt-1">
                      Your database has been updated with the following:
                    </p>
                  </div>
                  <div className="max-w-xs mx-auto bg-warmOffWhite p-4 rounded-xl border border-warmGold/20 text-xs space-y-1.5 text-left">
                    <div className="flex justify-between">
                      <span className="text-deepCharcoal/70">New records imported (Pending):</span>
                      <strong className="text-teal">{resultSummary.importedCount}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-deepCharcoal/70">Existing records updated:</span>
                      <strong className="text-amber-600">{resultSummary.updatedCount}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-deepCharcoal/70">Rows skipped:</span>
                      <strong className="text-deepCharcoal/50">{resultSummary.skippedCount}</strong>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2.5 bg-teal text-white rounded-xl font-medium text-sm hover:bg-teal/90 transition-colors shadow-sm"
                  >
                    Done & Refresh Dashboard
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'preview' && (
          <div className="pt-4 border-t border-lightTealTint/60 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-deepCharcoal/70">
              Selected decisions: <strong className="text-teal">{toImportCount} to import</strong>,{' '}
              <strong className="text-amber-600">{toUpdateCount} to update</strong>,{' '}
              <strong className="text-deepCharcoal/50">{toSkipCount} to skip</strong>
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setStep('upload')}
                className="w-1/2 sm:w-auto px-4 py-2 border border-warmGold/40 text-deepCharcoal rounded-xl text-xs font-medium hover:bg-warmOffWhite"
              >
                Choose Different File
              </button>
              <button
                type="button"
                onClick={handleCommit}
                disabled={toImportCount === 0 && toUpdateCount === 0}
                className="w-1/2 sm:w-auto px-5 py-2 bg-teal text-white rounded-xl text-xs font-semibold hover:bg-teal/90 transition-colors shadow-sm disabled:opacity-40"
              >
                Execute Import ({toImportCount + toUpdateCount})
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
