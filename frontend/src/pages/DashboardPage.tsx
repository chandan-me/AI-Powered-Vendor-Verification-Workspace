import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ListTodo,
  ArrowRight,
  Sparkles,
  PlusCircle,
  FileCheck2,
  RefreshCw,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../api/client';
import { DashboardStats } from '../types';
import { DateTimeWidget } from '../components/DateTimeWidget';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await api.dashboard.getStats();
      setStats(data);
    } catch (e) {
      console.error('Failed to load dashboard stats:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-brand-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-brand-500/20 to-transparent pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold border border-brand-500/30">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span>AI-Driven Onboarding Intelligence</span>
            </div>
            <DateTimeWidget variant="dark" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Vendor Verification & Compliance Command Center
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            Multi-document entity extraction, cross-document discrepancy auditing, automated registry verification,
            and email notice automation in a single workspace.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              to="/vendors/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-colors shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Register New Vendor</span>
            </Link>
            <Link
              to="/vendors"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors border border-white/10"
            >
              <span>Explore All Vendors</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              type="button"
              onClick={fetchStats}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Refresh Stats"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Total Vendors</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-900">{stats?.total_vendors ?? 0}</p>
          <span className="text-[11px] text-slate-400">Total registered</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Draft</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-700">{stats?.draft_vendors ?? 0}</p>
          <span className="text-[11px] text-slate-400">Pending submission</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-200 bg-blue-50/20 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-blue-600">
            <span className="text-xs font-semibold">Under Review</span>
            <FileCheck2 className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-700">{stats?.under_review_vendors ?? 0}</p>
          <span className="text-[11px] text-blue-500">In audit queue</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-xs font-semibold">Action Req.</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-700">{stats?.action_required_vendors ?? 0}</p>
          <span className="text-[11px] text-amber-500">Missing/mismatch</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-xs font-semibold">Approved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-700">{stats?.approved_vendors ?? 0}</p>
          <span className="text-[11px] text-emerald-500">Verified & active</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Pending Tasks</span>
            <ListTodo className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-600">{stats?.pending_tasks ?? 0}</p>
          <span className="text-[11px] text-slate-400">Open reviewer tasks</span>
        </div>
      </div>

      {/* 3 SEPARATE COMPANIES FAKE PDF & MATCHING DATA HUB */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Sample Compliance Hub: 3 Separate Companies & Fake PDFs
              </h2>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                100% Match Ready
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Each company has its own separate fake PDFs (Incorporation, GST REG-06, Bank Statement). Seeding triggers full AI extraction, registry checks, and 100% matching audit events.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="http://localhost:8000/api/samples/download-report"
              download="VendorVerify_AI_Complete_Build_Report.pdf"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
            >
              <FileText className="w-3.5 h-3.5 text-brand-400" />
              <span>Report PDF</span>
            </a>
            <button
              type="button"
              onClick={async () => {
                try {
                  toast.loading('Seeding all 3 companies...');
                  await api.samples.seedAllCompanies();
                  toast.dismiss();
                  toast.success('All 3 companies seeded & verified with 100% matching events!');
                  fetchStats();
                } catch {
                  toast.dismiss();
                  toast.error('Failed to seed companies.');
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-xs transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Seed All 3 Companies</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Company 1 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-3.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold text-brand-700 uppercase tracking-wider bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                  Company 1 • Tech SaaS
                </span>
                <h3 className="font-bold text-sm text-slate-900 mt-1">Zenith Cloud Technologies</h3>
                <p className="text-[11px] text-slate-500">Bangalore, Karnataka</p>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0" title="100% Match Target" />
            </div>

            <div className="space-y-1 text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
              <p><span className="text-slate-400 font-mono">CIN:</span> U72200KA2020PTC138890</p>
              <p><span className="text-slate-400 font-mono">GST:</span> 29AAACZ1234F1Z5</p>
              <p><span className="text-slate-400 font-mono">BANK:</span> 98765432101234 (HDFC)</p>
            </div>

            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Download Fake PDFs</p>
              <div className="grid grid-cols-3 gap-1.5">
                <a
                  href="http://localhost:8000/api/samples/download/zenith/registration"
                  download="zenith_registration_certificate.pdf"
                  className="flex items-center justify-center gap-1 py-1.5 px-2 bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 hover:border-blue-300 rounded text-[10px] font-semibold transition-colors"
                >
                  <FileText className="w-3 h-3" />
                  <span>Inc Cert</span>
                </a>
                <a
                  href="http://localhost:8000/api/samples/download/zenith/gst"
                  download="zenith_gst_certificate.pdf"
                  className="flex items-center justify-center gap-1 py-1.5 px-2 bg-white hover:bg-emerald-50 text-emerald-700 border border-slate-200 hover:border-emerald-300 rounded text-[10px] font-semibold transition-colors"
                >
                  <FileText className="w-3 h-3" />
                  <span>GST-06</span>
                </a>
                <a
                  href="http://localhost:8000/api/samples/download/zenith/bank"
                  download="zenith_bank_statement.pdf"
                  className="flex items-center justify-center gap-1 py-1.5 px-2 bg-white hover:bg-rose-50 text-rose-700 border border-slate-200 hover:border-rose-300 rounded text-[10px] font-semibold transition-colors"
                >
                  <FileText className="w-3 h-3" />
                  <span>Bank</span>
                </a>
              </div>
            </div>

            <button
              type="button"
              onClick={async () => {
                try {
                  toast.loading('Seeding Zenith Cloud (100% Match)...');
                  await api.samples.seedCompany('zenith');
                  toast.dismiss();
                  toast.success('Zenith Cloud seeded & verified with 100% match!');
                  fetchStats();
                } catch {
                  toast.dismiss();
                  toast.error('Failed to seed Zenith Cloud.');
                }
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-2xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Seed & Verify 100% Match</span>
            </button>
          </div>

          {/* Company 2 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-3.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                  Company 2 • Enterprise IT
                </span>
                <h3 className="font-bold text-sm text-slate-900 mt-1">Nexus Enterprise Solutions</h3>
                <p className="text-[11px] text-slate-500">Gurgaon, Haryana</p>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0" title="Separate Company" />
            </div>

            <div className="space-y-1 text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
              <p><span className="text-slate-400 font-mono">CIN:</span> U72900DL2021PTC345678</p>
              <p><span className="text-slate-400 font-mono">GST:</span> 07AABCN5678M1Z9</p>
              <p><span className="text-slate-400 font-mono">BANK:</span> 40987654321098 (ICICI)</p>
            </div>

            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Download Fake PDFs</p>
              <div className="grid grid-cols-3 gap-1.5">
                <a
                  href="http://localhost:8000/api/samples/download/nexus/registration"
                  download="nexus_registration_certificate.pdf"
                  className="flex items-center justify-center gap-1 py-1.5 px-2 bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 hover:border-blue-300 rounded text-[10px] font-semibold transition-colors"
                >
                  <FileText className="w-3 h-3" />
                  <span>Inc Cert</span>
                </a>
                <a
                  href="http://localhost:8000/api/samples/download/nexus/gst"
                  download="nexus_gst_certificate.pdf"
                  className="flex items-center justify-center gap-1 py-1.5 px-2 bg-white hover:bg-emerald-50 text-emerald-700 border border-slate-200 hover:border-emerald-300 rounded text-[10px] font-semibold transition-colors"
                >
                  <FileText className="w-3 h-3" />
                  <span>GST-06</span>
                </a>
                <a
                  href="http://localhost:8000/api/samples/download/nexus/bank"
                  download="nexus_bank_statement.pdf"
                  className="flex items-center justify-center gap-1 py-1.5 px-2 bg-white hover:bg-rose-50 text-rose-700 border border-slate-200 hover:border-rose-300 rounded text-[10px] font-semibold transition-colors"
                >
                  <FileText className="w-3 h-3" />
                  <span>Bank</span>
                </a>
              </div>
            </div>

            <button
              type="button"
              onClick={async () => {
                try {
                  toast.loading('Seeding Nexus Enterprise...');
                  await api.samples.seedCompany('nexus');
                  toast.dismiss();
                  toast.success('Nexus Enterprise seeded & verified with 100% match!');
                  fetchStats();
                } catch {
                  toast.dismiss();
                  toast.error('Failed to seed Nexus Enterprise.');
                }
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg bg-sky-600 hover:bg-sky-700 text-white transition-colors shadow-2xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Seed & Verify Company 2</span>
            </button>
          </div>

          {/* Company 3 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-3.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Company 3 • Supply Chain
                </span>
                <h3 className="font-bold text-sm text-slate-900 mt-1">Apex Logistics & Supply</h3>
                <p className="text-[11px] text-slate-500">Navi Mumbai, Maharashtra</p>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0" title="Separate Company" />
            </div>

            <div className="space-y-1 text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
              <p><span className="text-slate-400 font-mono">CIN:</span> U63090MH2019PTC234567</p>
              <p><span className="text-slate-400 font-mono">GST:</span> 27AAACA9876P1Z4</p>
              <p><span className="text-slate-400 font-mono">BANK:</span> 60234567890123 (Kotak)</p>
            </div>

            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Download Fake PDFs</p>
              <div className="grid grid-cols-3 gap-1.5">
                <a
                  href="http://localhost:8000/api/samples/download/apex/registration"
                  download="apex_registration_certificate.pdf"
                  className="flex items-center justify-center gap-1 py-1.5 px-2 bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 hover:border-blue-300 rounded text-[10px] font-semibold transition-colors"
                >
                  <FileText className="w-3 h-3" />
                  <span>Inc Cert</span>
                </a>
                <a
                  href="http://localhost:8000/api/samples/download/apex/gst"
                  download="apex_gst_certificate.pdf"
                  className="flex items-center justify-center gap-1 py-1.5 px-2 bg-white hover:bg-emerald-50 text-emerald-700 border border-slate-200 hover:border-emerald-300 rounded text-[10px] font-semibold transition-colors"
                >
                  <FileText className="w-3 h-3" />
                  <span>GST-06</span>
                </a>
                <a
                  href="http://localhost:8000/api/samples/download/apex/bank"
                  download="apex_bank_statement.pdf"
                  className="flex items-center justify-center gap-1 py-1.5 px-2 bg-white hover:bg-rose-50 text-rose-700 border border-slate-200 hover:border-rose-300 rounded text-[10px] font-semibold transition-colors"
                >
                  <FileText className="w-3 h-3" />
                  <span>Bank</span>
                </a>
              </div>
            </div>

            <button
              type="button"
              onClick={async () => {
                try {
                  toast.loading('Seeding Apex Logistics...');
                  await api.samples.seedCompany('apex');
                  toast.dismiss();
                  toast.success('Apex Logistics seeded & verified with 100% match!');
                  fetchStats();
                } catch {
                  toast.dismiss();
                  toast.error('Failed to seed Apex Logistics.');
                }
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors shadow-2xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Seed & Verify Company 3</span>
            </button>
          </div>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution Progress */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-sm">Workflow Status Distribution</h2>
            <span className="text-xs text-slate-400 font-medium">{stats?.total_vendors ?? 0} Total</span>
          </div>

          <div className="space-y-3 pt-2">
            {[
              { label: 'Approved', count: stats?.approved_vendors ?? 0, color: 'bg-emerald-500' },
              { label: 'Under Review', count: stats?.under_review_vendors ?? 0, color: 'bg-blue-500' },
              { label: 'Action Required', count: stats?.action_required_vendors ?? 0, color: 'bg-amber-500' },
              { label: 'Draft', count: stats?.draft_vendors ?? 0, color: 'bg-slate-400' },
              { label: 'Rejected', count: stats?.rejected_vendors ?? 0, color: 'bg-rose-500' },
            ].map((item) => {
              const total = stats?.total_vendors || 1;
              const pct = Math.round((item.count / total) * 100);
              return (
                <div key={item.label} className="space-y-1 text-xs">
                  <div className="flex justify-between font-medium text-slate-700">
                    <span>{item.label}</span>
                    <span className="text-slate-500 font-semibold">{item.count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-100">
            <Link
              to="/vendors"
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-xl transition-colors"
            >
              <span>Manage Vendor Records</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Recent Audit Activity Feed */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-sm">Recent Compliance & Workflow Activity</h2>
            <span className="text-xs text-slate-400">Audit Trail</span>
          </div>

          <div className="divide-y divide-slate-100">
            {stats?.recent_activity && stats.recent_activity.length > 0 ? (
              stats.recent_activity.map((act) => (
                <div key={act.id} className="py-3 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/vendors/${act.vendor_id}`}
                        className="font-bold text-xs text-brand-700 hover:underline"
                      >
                        {act.vendor_name}
                      </Link>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {act.action_type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{act.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] text-slate-400 block">{act.timestamp}</span>
                    <span className="text-[10px] text-slate-500 font-medium">By {act.actor}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                No recent activity recorded yet. Create or seed a vendor to begin.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
