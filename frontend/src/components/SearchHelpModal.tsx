import React from 'react';
import {
  X,
  Search,
  Building2,
  Hash,
  Receipt,
  User,
  Mail,
  CheckCircle2,
  Sparkles,
  Command,
  ArrowRight,
  BookOpen
} from 'lucide-react';

interface SearchHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectQuery?: (sampleQuery: string) => void;
}

export const SearchHelpModal: React.FC<SearchHelpModalProps> = ({
  isOpen,
  onClose,
  onSelectQuery,
}) => {
  if (!isOpen) return null;

  const handleSampleClick = (query: string) => {
    if (onSelectQuery) {
      onSelectQuery(query);
    }
    onClose();
  };

  const searchCapabilities = [
    {
      title: 'Company & Trade Name',
      icon: Building2,
      iconColor: 'text-brand-600 bg-brand-50 border-brand-200',
      description: 'Find vendors by full legal name or any partial keyword match.',
      samples: ['Zenith Cloud', 'Nexus Innovations', 'Apex Logix'],
    },
    {
      title: 'Registration Number / CIN',
      icon: Hash,
      iconColor: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      description: 'Search exact or partial 21-digit MCA Corporate Identification Number.',
      samples: ['U72200MH2021PTC368921', 'U72900KA2020PTC134567', 'U74999DL2019PTC345678'],
    },
    {
      title: 'GSTIN / Tax Identifier',
      icon: Receipt,
      iconColor: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      description: 'Search 15-character Goods & Services Tax Identification Number.',
      samples: ['27AABCU9603R1ZM', '29AABCN8821M1ZQ', '07AAACA9012L1ZO'],
    },
    {
      title: 'Contact Person & Email',
      icon: User,
      iconColor: 'text-amber-600 bg-amber-50 border-amber-200',
      description: 'Search by primary contact person, compliance officer, or registered email domain.',
      samples: ['Priya Sharma', 'Rajesh Kumar', 'finance@zenithcloud.in'],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-500/20 border border-brand-400/30 flex items-center justify-center text-brand-300">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>How to Search Vendors & Companies</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-brand-500/30 text-brand-200 border border-brand-400/30">
                  Quick Guide
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Instant multi-field search engine across all vendor records & compliance databases
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            title="Close Guide (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Overview Banner */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-brand-50 to-sky-50 border border-brand-200 text-xs text-brand-900 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900">Real-Time Global Search</p>
              <p className="text-slate-600 mt-0.5 leading-relaxed">
                Start typing in the search bar from any screen. VendorVerify AI instantly queries across company names,
                registration numbers, tax codes, and emails with live debouncing and instant navigation.
              </p>
            </div>
          </div>

          {/* Search Methods Grid */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Supported Search Methods & Formats
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {searchCapabilities.map((cap) => {
                const IconComponent = cap.icon;
                return (
                  <div
                    key={cap.title}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-brand-300 hover:shadow-xs transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className={`p-1.5 rounded-lg border ${cap.iconColor}`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <h4 className="text-xs font-bold text-slate-900">{cap.title}</h4>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-normal">{cap.description}</p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                        Click to search sample:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {cap.samples.map((sample) => (
                          <button
                            key={sample}
                            type="button"
                            onClick={() => handleSampleClick(sample)}
                            className="inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-slate-100 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 border border-slate-200 text-slate-700 transition-colors"
                            title={`Search for "${sample}"`}
                          >
                            <span>{sample}</span>
                            <ArrowRight className="w-2.5 h-2.5 opacity-60" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status Filter Tip */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold text-slate-800">Filter by Verification Status:</span>
                <span className="text-slate-600 ml-1.5">
                  You can also filter vendors directly by status:
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {['APPROVED', 'UNDER_REVIEW', 'ACTION_REQUIRED'].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => handleSampleClick(status)}
                  className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-white border border-slate-200 hover:border-brand-300 text-slate-700 hover:text-brand-700 shadow-2xs transition-colors"
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[10px] font-semibold text-slate-700">
                Ctrl + K
              </kbd>
              <span>or</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[10px] font-semibold text-slate-700">
                /
              </kbd>
              <span>to focus global search bar anytime</span>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[10px] font-semibold text-slate-700">
                Esc
              </kbd>
              <span>to close dropdown or guide</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-colors"
          >
            Got it, close guide
          </button>
        </div>
      </div>
    </div>
  );
};
