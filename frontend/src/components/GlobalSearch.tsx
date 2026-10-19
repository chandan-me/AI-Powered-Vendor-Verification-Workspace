import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  HelpCircle,
  Building2,
  Hash,
  Receipt,
  ArrowRight,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { api } from '../api/client';
import { Vendor } from '../types';
import { StatusBadge } from './StatusBadge';
import { SearchHelpModal } from './SearchHelpModal';

export const GlobalSearch: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Vendor[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global keyboard shortcut to focus search: Ctrl+K or '/'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        setIsHelpOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search query
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.vendors.list({ search: trimmed, limit: 5 });
        setResults(res.items);
        setTotal(res.total);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectVendor = (vendorId: number) => {
    setIsOpen(false);
    navigate(`/vendors/${vendorId}`);
  };

  const handleViewAll = () => {
    setIsOpen(false);
    navigate(`/vendors?search=${encodeURIComponent(query.trim())}`);
  };

  const handleSampleSelected = (sample: string) => {
    setQuery(sample);
    setIsOpen(true);
    inputRef.current?.focus();
  };

  return (
    <>
      <div ref={containerRef} className="relative w-full max-w-xs sm:max-w-sm md:max-w-md">
        {/* Search Input Bar */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/90 hover:bg-slate-100 border text-xs transition-all ${
            isOpen
              ? 'border-brand-500 ring-2 ring-brand-500/15 bg-white shadow-xs'
              : 'border-slate-200/80'
          }`}
        >
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => {
              if (query.trim() || results.length > 0) setIsOpen(true);
            }}
            placeholder="Search vendor, CIN, GSTIN, email..."
            className="w-full bg-transparent text-slate-800 placeholder:text-slate-400 outline-none text-xs"
          />

          {loading ? (
            <Loader2 className="w-3.5 h-3.5 text-brand-600 animate-spin shrink-0" />
          ) : query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setResults([]);
                setIsOpen(false);
                inputRef.current?.focus();
              }}
              className="p-0.5 text-slate-400 hover:text-slate-600 rounded"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}

          {/* Keyboard shortcut hint */}
          <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-slate-400 bg-white/80 px-1.5 py-0.5 rounded border border-slate-200/60 select-none">
            <span>Ctrl</span>
            <span>K</span>
          </div>

          {/* How to search button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsHelpOpen(true);
            }}
            className="flex items-center gap-1 text-slate-500 hover:text-brand-700 hover:bg-brand-50 px-1.5 py-0.5 rounded-md transition-colors text-[11px] font-medium shrink-0"
            title="How to search vendors & companies (Guide)"
          >
            <HelpCircle className="w-3.5 h-3.5 text-brand-600" />
            <span className="hidden xl:inline">Search Guide</span>
          </button>
        </div>

        {/* Autocomplete Dropdown */}
        {isOpen && query.trim() && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150 min-w-[320px] sm:min-w-[420px]">
            {/* Dropdown Header */}
            <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-600">
                {loading
                  ? 'Searching compliance database...'
                  : `${total} matching vendor${total === 1 ? '' : 's'} found`}
              </span>
              <button
                type="button"
                onClick={() => setIsHelpOpen(true)}
                className="text-brand-600 hover:text-brand-800 font-medium inline-flex items-center gap-1"
              >
                <span>How to search?</span>
                <HelpCircle className="w-3 h-3" />
              </button>
            </div>

            {/* Results List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {results.length > 0 ? (
                results.map((vendor) => (
                  <div
                    key={vendor.id}
                    onClick={() => handleSelectVendor(vendor.id)}
                    className="p-3 hover:bg-slate-50 cursor-pointer transition-colors group flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                        <span className="font-bold text-xs text-slate-900 group-hover:text-brand-700 truncate">
                          {vendor.company_name}
                        </span>
                        <StatusBadge status={vendor.status} />
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 font-mono">
                        {vendor.registration_number && (
                          <span className="inline-flex items-center gap-1">
                            <Hash className="w-3 h-3 text-slate-400" />
                            {vendor.registration_number}
                          </span>
                        )}
                        {vendor.gst_number && (
                          <span className="inline-flex items-center gap-1">
                            <Receipt className="w-3 h-3 text-slate-400" />
                            {vendor.gst_number}
                          </span>
                        )}
                      </div>

                      {(vendor.contact_person || vendor.email) && (
                        <p className="text-[11px] text-slate-500">
                          {vendor.contact_person} {vendor.email ? `• ${vendor.email}` : ''}
                        </p>
                      )}
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                  </div>
                ))
              ) : !loading ? (
                <div className="p-6 text-center space-y-2">
                  <p className="text-xs font-semibold text-slate-700">
                    No vendors found matching "{query}"
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                    Try searching by company name (e.g. Zenith), CIN registration, GSTIN, or contact name.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsHelpOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-semibold border border-brand-200 transition-colors mt-1"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Open "How to Search" Guide</span>
                  </button>
                </div>
              ) : null}
            </div>

            {/* Dropdown Footer */}
            {results.length > 0 && (
              <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={handleViewAll}
                  className="font-semibold text-brand-700 hover:text-brand-800 inline-flex items-center gap-1 hover:underline text-[11px]"
                >
                  <span>View all {total} vendors in directory</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
                <span className="text-[10px] text-slate-400">Press Esc to close</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* How to Search Guide Modal */}
      <SearchHelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        onSelectQuery={handleSampleSelected}
      />
    </>
  );
};
