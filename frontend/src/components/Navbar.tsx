import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShieldCheck, Sparkles, Database, FileText } from 'lucide-react';
import { api } from '../api/client';
import { GlobalSearch } from './GlobalSearch';
import { DateTimeWidget } from './DateTimeWidget';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [seeding, setSeeding] = useState(false);

  const handleSeedDemo = async () => {
    try {
      setSeeding(true);
      const seedPromise = api.samples.seedDemo();

      await toast.promise(seedPromise, {
        loading: 'Generating compliance PDFs & seeding demo vendor...',
        success: (res) => `Demo vendor seeded successfully! (Vendor ID: #${res.vendor_id})`,
        error: 'Failed to seed demo vendor. Check backend connection.',
      });

      const res = await seedPromise;
      navigate(`/vendors/${res.vendor_id}`);
    } catch (e: any) {
      console.error('Seeding error:', e);
    } finally {
      setSeeding(false);
    }
  };

  const handleSeedCompany = async (key: string, name: string) => {
    try {
      setSeeding(true);
      const seedPromise = api.samples.seedCompany(key);
      await toast.promise(seedPromise, {
        loading: `Generating fake PDFs & seeding ${name} (100% Match)...`,
        success: (res) => `${name} verified & approved! (Vendor ID: #${res.vendor_id})`,
        error: 'Failed to seed vendor. Check backend connection.',
      });
      const res = await seedPromise;
      navigate(`/vendors/${res.vendor_id}`);
    } catch (e: any) {
      console.error('Seeding error:', e);
    } finally {
      setSeeding(false);
    }
  };

  const handleSeedAll = async () => {
    try {
      setSeeding(true);
      const seedPromise = api.samples.seedAllCompanies();
      await toast.promise(seedPromise, {
        loading: 'Generating separate fake PDFs & seeding 3 companies...',
        success: () => 'All 3 separate companies seeded & verified successfully!',
        error: 'Failed to seed companies. Check backend connection.',
      });
      await seedPromise;
      navigate('/vendors');
    } catch (e: any) {
      console.error('Seeding all error:', e);
    } finally {
      setSeeding(false);
    }
  };

  const handleDownloadReport = async (e: React.MouseEvent) => {
    try {
      toast.success('Downloading VendorVerify Architecture & Build Report PDF...');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-40 px-6 flex items-center justify-between shadow-xs">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 to-sky-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-lg text-slate-900 tracking-tight">VendorVerify</span>
            <span className="text-xs font-bold uppercase tracking-wider bg-brand-50 text-brand-700 px-2 py-0.5 rounded-md border border-brand-200">
              AI Workspace
            </span>
          </div>
          <p className="text-[11px] text-slate-500 hidden sm:block">Automated Compliance, Extraction & Registry Verification</p>
        </div>
      </div>

      {/* Center Search Bar & Real-Time Date/Time Clock */}
      <div className="flex-1 max-w-xl mx-2 sm:mx-6 flex items-center justify-center gap-2.5">
        <GlobalSearch />
        <DateTimeWidget />
      </div>

      {/* Quick Action */}
      <div className="flex items-center gap-2.5">
        <a
          href="http://localhost:8000/api/samples/download-report"
          download="VendorVerify_AI_Complete_Build_Report.pdf"
          onClick={handleDownloadReport}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors"
          title="Download Complete Build & Architecture PDF"
        >
          <FileText className="w-3.5 h-3.5 text-brand-400" />
          <span>Download Report PDF</span>
        </a>

        {/* 1-Click 100% Match Seed */}
        <button
          type="button"
          onClick={() => handleSeedCompany('zenith', 'Zenith Cloud (100% Match)')}
          disabled={seeding}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm transition-all disabled:opacity-50"
          title="Seed company where all 3 PDFs and events match 100%"
        >
          <Sparkles className={`w-3.5 h-3.5 ${seeding ? 'animate-spin' : ''}`} />
          <span>{seeding ? 'Seeding...' : '1-Click 100% Match'}</span>
        </button>

        {/* 3 Companies Seed */}
        <button
          type="button"
          onClick={handleSeedAll}
          disabled={seeding}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 transition-colors disabled:opacity-50"
          title="Seed all 3 separate companies with their own fake PDFs"
        >
          <span>Seed 3 Companies</span>
        </button>

        <a
          href="http://localhost:8000/docs"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>API Docs</span>
        </a>
      </div>
    </header>
  );
};
