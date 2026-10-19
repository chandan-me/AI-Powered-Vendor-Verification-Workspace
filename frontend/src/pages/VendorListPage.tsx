import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Search, PlusCircle, Filter, ArrowUpRight, Building2, Trash2, HelpCircle, Sparkles, BookOpen } from 'lucide-react';
import { api } from '../api/client';
import { Vendor, VendorStatus } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { MaskedValue } from '../components/MaskedValue';
import { ConfirmModal } from '../components/ConfirmModal';
import { SearchHelpModal } from '../components/SearchHelpModal';

export const VendorListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') || '';
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState(urlSearch);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [vendorToDelete, setVendorToDelete] = useState<Vendor | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Sync if URL search changes externally
  useEffect(() => {
    if (urlSearch !== search) {
      setSearch(urlSearch);
    }
  }, [urlSearch]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const res = await api.vendors.list({
        search: search || undefined,
        status: statusFilter || undefined,
        limit: 100,
      });
      setVendors(res.items);
      setTotal(res.total);
    } catch (e) {
      console.error('Failed to load vendors:', e);
      toast.error('Failed to fetch vendors list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchVendors();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  const handleDelete = async () => {
    if (!vendorToDelete) return;
    try {
      await api.vendors.delete(vendorToDelete.id);
      toast.success(`Vendor ${vendorToDelete.company_name} deleted.`);
      setVendorToDelete(null);
      fetchVendors();
    } catch (e) {
      console.error('Delete error:', e);
      toast.error('Failed to delete vendor.');
    }
  };

  const statusTabs = [
    { label: 'All Vendors', value: '' },
    { label: 'Draft', value: 'DRAFT' },
    { label: 'Under Review', value: 'UNDER_REVIEW' },
    { label: 'Action Required', value: 'ACTION_REQUIRED' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Rejected', value: 'REJECTED' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Vendor Management Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit compliance dossiers, view extracted documents, and manage verification pipelines.
          </p>
        </div>
        <Link
          to="/vendors/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-sm transition-colors self-start"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Onboard New Vendor</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              statusFilter === tab.value
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Bar & Guide */}
      <div className="space-y-2">
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2.5 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/15 transition-all">
          <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company name, registration number, GSTIN, email, or contact person..."
            className="w-full text-xs text-slate-800 placeholder:text-slate-400 outline-none bg-transparent"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="text-xs text-slate-400 hover:text-slate-600 px-2 py-0.5 rounded"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsHelpOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-semibold border border-brand-200 transition-colors shrink-0"
            title="Open comprehensive search guide"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">How to Search?</span>
          </button>
        </div>

        {/* Quick Search Suggestions & Chips */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 px-1">
          <span className="font-semibold text-slate-600 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-brand-500" />
            Try searching:
          </span>
          {[
            { label: 'Zenith Cloud', query: 'Zenith Cloud' },
            { label: 'Nexus Innovations', query: 'Nexus Innovations' },
            { label: 'Apex Logix', query: 'Apex Logix' },
            { label: 'CIN: U72200MH...', query: 'U72200MH2021PTC368921' },
            { label: 'GST: 27AABCU...', query: '27AABCU9603R1ZM' },
            { label: 'Priya Sharma', query: 'Priya Sharma' },
          ].map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => setSearch(chip.query)}
              className="px-2 py-0.5 rounded-md bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[10px] transition-colors shadow-2xs hover:border-brand-300"
            >
              {chip.label}
            </button>
          ))}
          {search && (
            <span className="text-slate-400 text-[10px]">
              • Filtering for: <strong className="text-slate-700 font-mono">"{search}"</strong>
            </span>
          )}
        </div>
      </div>

      {/* Vendors Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Company Details</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4">Registration #</th>
                <th className="py-3.5 px-4">GST / Tax ID</th>
                <th className="py-3.5 px-4">Bank Account</th>
                <th className="py-3.5 px-4">Workflow Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading vendors...
                  </td>
                </tr>
              ) : vendors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No vendors found. Try adjusting filters or click "Onboard New Vendor".
                  </td>
                </tr>
              ) : (
                vendors.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                        <Link to={`/vendors/${v.id}`} className="hover:underline">
                          {v.company_name}
                        </Link>
                      </div>
                      <span className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{v.address}</span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800">{v.contact_person}</p>
                      <p className="text-[11px] text-slate-500">{v.email}</p>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">
                      {v.registration_number}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">
                      {v.gst_number}
                    </td>
                    <td className="py-3 px-4">
                      <MaskedValue vendorId={v.id} maskedValue={v.bank_account_number_masked} />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={v.status} />
                    </td>
                    <td className="py-3 px-4 text-right shrink-0">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/vendors/${v.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors"
                        >
                          <span>Workspace</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setVendorToDelete(v)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Vendor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-slate-50/50 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
          <span>Showing {vendors.length} of {total} registered vendors</span>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!vendorToDelete}
        title="Delete Vendor Record"
        message={`Are you sure you want to delete ${vendorToDelete?.company_name}? This action will permanently remove all associated documents, extractions, and verification audits.`}
        confirmLabel="Delete Permanently"
        isDestructive={true}
        onConfirm={handleDelete}
        onClose={() => setVendorToDelete(null)}
      />

      {/* How to Search Guide Modal */}
      <SearchHelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        onSelectQuery={(q) => setSearch(q)}
      />
    </div>
  );
};
