import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Building2,
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  History,
  CheckSquare,
  Globe,
  Mail,
  ShieldCheck,
  RotateCcw,
  ExternalLink,
  Edit,
  Trash2,
  Download,
  Eye,
  Sparkles,
  RefreshCw,
  Clock,
  AlertCircle,
  X
} from 'lucide-react';
import { api } from '../api/client';
import {
  Vendor,
  DocumentItem,
  FieldComparison,
  CompanyVerification,
  DocumentChecklist,
  WorkflowHistory,
  TaskItem,
  VendorVersion,
  EmailNotification,
  VendorStatus,
} from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { MaskedValue } from '../components/MaskedValue';
import { ConfirmModal } from '../components/ConfirmModal';

// Formik validation schema for Task creation
const taskValidationSchema = Yup.object().shape({
  title: Yup.string()
    .trim()
    .min(3, 'Task title must be at least 3 characters')
    .max(255, 'Task title is too long')
    .required('Task title is required'),
  description: Yup.string().optional(),
  priority: Yup.string().oneOf(['LOW', 'MEDIUM', 'HIGH']).required('Priority is required'),
  due_date: Yup.string().optional(),
});

// Formik validation schema for Registry lookup
const registrySearchSchema = Yup.object().shape({
  query: Yup.string()
    .trim()
    .min(2, 'Search query must be at least 2 characters')
    .required('Company name or registration number is required'),
  jurisdiction_code: Yup.string().required('Jurisdiction is required'),
});

export const VendorDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const vendorId = Number(id);

  // Core Data
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [comparisons, setComparisons] = useState<FieldComparison[]>([]);
  const [latestVerif, setLatestVerif] = useState<CompanyVerification | null>(null);
  const [checklist, setChecklist] = useState<DocumentChecklist[]>([]);
  const [history, setHistory] = useState<WorkflowHistory[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [versions, setVersions] = useState<VendorVersion[]>([]);
  const [emails, setEmails] = useState<EmailNotification[]>([]);

  // State
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'comparison' | 'verification' | 'checklist' | 'tasks' | 'versions'>('overview');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Workflow transition modal
  const [targetTransition, setTargetTransition] = useState<VendorStatus | null>(null);

  // Document upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDocType, setUploadDocType] = useState('REGISTRATION_CERTIFICATE');
  const [uploading, setUploading] = useState(false);

  // Document extraction editing
  const [editingDocId, setEditingDocId] = useState<number | null>(null);
  const [editFields, setEditFields] = useState<Record<string, string>>({});

  // Version restore modal
  const [versionToRestore, setVersionToRestore] = useState<VendorVersion | null>(null);

  // Discrepancy resolution state
  const [resolvingComparison, setResolvingComparison] = useState<FieldComparison | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Document preview state
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);

  const loadAllData = async () => {
    if (!vendorId) return;
    try {
      setLoading(true);
      const [v, docs, comp, ver, chk, hist, t, vers, em] = await Promise.all([
        api.vendors.get(vendorId),
        api.documents.list(vendorId),
        api.verification.getComparisons(vendorId),
        api.verification.getLatestVerification(vendorId),
        api.workflow.getChecklist(vendorId),
        api.workflow.getHistory(vendorId),
        api.tasks.list({ vendor_id: vendorId }),
        api.versions.list(vendorId),
        api.workflow.getEmails(vendorId),
      ]);

      setVendor(v);
      setDocuments(docs);
      setComparisons(comp);
      setLatestVerif(ver);
      setChecklist(chk);
      setHistory(hist);
      setTasks(t);
      setVersions(vers);
      setEmails(em);
      registryFormik.setFieldValue('query', v.company_name);
    } catch (e) {
      console.error('Failed to load vendor workspace:', e);
      toast.error('Failed to load vendor details from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [vendorId]);

  // Formik for Task Creation
  const taskFormik = useFormik({
    initialValues: {
      title: '',
      description: '',
      priority: 'MEDIUM',
      due_date: '',
    },
    validationSchema: taskValidationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        setActionLoading(true);
        await api.tasks.create(vendorId, {
          title: values.title,
          description: values.description || undefined,
          priority: values.priority,
          due_date: values.due_date || undefined,
        });
        toast.success(`Task "${values.title}" created successfully!`);
        resetForm();
        const t = await api.tasks.list({ vendor_id: vendorId });
        setTasks(t);
      } catch (e) {
        toast.error('Failed to create compliance task.');
      } finally {
        setActionLoading(false);
      }
    },
  });

  // Formik for External Registry Search
  const registryFormik = useFormik({
    initialValues: {
      query: vendor?.company_name || '',
      jurisdiction_code: 'in',
    },
    enableReinitialize: true,
    validationSchema: registrySearchSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        setSubmitting(true);
        const searchPromise = api.verification.verifyCompany(vendorId, values.query, values.jurisdiction_code);
        await toast.promise(searchPromise, {
          loading: `Querying OpenCorporates registry for "${values.query}"...`,
          success: (res) => `Registry Query Complete: Outcome is ${res.outcome}`,
          error: 'Corporate registry lookup failed.',
        });
        const res = await searchPromise;
        setLatestVerif(res);
        const comp = await api.verification.getComparisons(vendorId);
        setComparisons(comp);
      } catch (e) {
        toast.error('Failed to verify company registry.');
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Handle Workflow Status Transition
  const handleTransition = async (reason?: string) => {
    if (!targetTransition || !vendor) return;
    try {
      setActionLoading(true);
      const updated = await api.workflow.transitionStatus(vendor.id, targetTransition, reason);
      setVendor(updated);
      setTargetTransition(null);
      toast.success(`Workflow status updated to ${targetTransition}!`);
      const h = await api.workflow.getHistory(vendorId);
      setHistory(h);
    } catch (e: any) {
      const detail = e.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Failed to update workflow status');
    } finally {
      setActionLoading(false);
    }
  };

  // Upload Document
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;
    try {
      setUploading(true);
      const uploadPromise = api.documents.upload(vendorId, uploadFile, uploadDocType, true);
      await toast.promise(uploadPromise, {
        loading: `Uploading ${uploadFile.name} & running AI extraction...`,
        success: 'Document uploaded & AI entities extracted successfully!',
        error: 'Failed to process document upload.',
      });
      setUploadFile(null);
      const [docs, chk, comp] = await Promise.all([
        api.documents.list(vendorId),
        api.workflow.getChecklist(vendorId),
        api.verification.runComparison(vendorId),
      ]);
      setDocuments(docs);
      setChecklist(chk);
      setComparisons(comp.comparisons);
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Delete Document
  const handleDeleteDocument = async (docId: number) => {
    if (!confirm('Are you sure you want to remove this document?')) return;
    try {
      await api.documents.delete(docId);
      toast.success('Document deleted from compliance dossier.');
      const [docs, chk] = await Promise.all([
        api.documents.list(vendorId),
        api.workflow.getChecklist(vendorId),
      ]);
      setDocuments(docs);
      setChecklist(chk);
    } catch (e) {
      toast.error('Failed to delete document.');
    }
  };

  // Save extraction corrections
  const handleSaveCorrections = async (docId: number) => {
    try {
      setActionLoading(true);
      await api.documents.updateCorrections(docId, editFields);
      setEditingDocId(null);
      toast.success('Reviewer corrections saved! Re-calculating comparisons...');
      const [docs, comp] = await Promise.all([
        api.documents.list(vendorId),
        api.verification.runComparison(vendorId),
      ]);
      setDocuments(docs);
      setComparisons(comp.comparisons);
    } catch (e) {
      toast.error('Failed to save corrections.');
    } finally {
      setActionLoading(false);
    }
  };

  // Trigger Run Comparison
  const handleRunComparison = async () => {
    try {
      setActionLoading(true);
      const res = await api.verification.runComparison(vendorId);
      setComparisons(res.comparisons);
      if (res.has_mismatches) {
        toast.error(`Comparison complete: ${res.mismatch_count} mismatch(es) detected across sources!`, {
          duration: 4500,
        });
      } else {
        toast.success(`Comparison complete: All ${res.match_count} comparable fields matched!`);
      }
    } catch (e) {
      toast.error('Failed to execute cross-document comparison.');
    } finally {
      setActionLoading(false);
    }
  };

  // Audit Missing Documents & Send Notification Email
  const handleAuditMissingDocs = async () => {
    try {
      setActionLoading(true);
      const res = await api.workflow.checkMissing(vendorId, true);
      if (res.missing_documents.length > 0) {
        toast.error(
          `Missing Documents Found: ${res.missing_documents.join(', ')}. Action Required triggered & notice email sent!`,
          { duration: 5000 }
        );
      } else {
        toast.success('Checklist Complete: All mandatory compliance documents are present!');
      }
      const [v, chk, t, em] = await Promise.all([
        api.vendors.get(vendorId),
        api.workflow.getChecklist(vendorId),
        api.tasks.list({ vendor_id: vendorId }),
        api.workflow.getEmails(vendorId),
      ]);
      setVendor(v);
      setChecklist(chk);
      setTasks(t);
      setEmails(em);
    } catch (e) {
      toast.error('Failed to audit missing documents.');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Task Status
  const handleToggleTask = async (task: TaskItem) => {
    const nextStatus = task.status === 'PENDING' ? 'COMPLETED' : 'PENDING';
    try {
      await api.tasks.update(task.id, { status: nextStatus });
      toast.success(`Task marked as ${nextStatus}!`);
      const t = await api.tasks.list({ vendor_id: vendorId });
      setTasks(t);
    } catch (e) {
      toast.error('Failed to update task status.');
    }
  };

  // Restore Version
  const handleRestoreVersion = async (reason?: string) => {
    if (!versionToRestore) return;
    try {
      setActionLoading(true);
      const updated = await api.versions.restore(vendorId, versionToRestore.id, reason);
      setVendor(updated);
      setVersionToRestore(null);
      toast.success(`Reverted to Version ${versionToRestore.version_number}! New rollback version appended.`);
      const vers = await api.versions.list(vendorId);
      setVersions(vers);
    } catch (e) {
      toast.error('Failed to restore historical version.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveDiscrepancy = async () => {
    if (!resolvingComparison) return;
    if (!resolutionNotes.trim()) {
      toast.error('Please enter resolution notes explaining why this discrepancy was cleared.');
      return;
    }
    try {
      setActionLoading(true);
      await api.verification.resolveDiscrepancy(vendorId, resolvingComparison.id, resolutionNotes.trim());
      toast.success(`Discrepancy on ${resolvingComparison.field_name.replace(/_/g, ' ')} marked as resolved!`);
      setResolvingComparison(null);
      setResolutionNotes('');
      const [comp, t, hist] = await Promise.all([
        api.verification.getComparisons(vendorId),
        api.tasks.list({ vendor_id: vendorId }),
        api.workflow.getHistory(vendorId),
      ]);
      setComparisons(comp);
      setTasks(t);
      setHistory(hist);
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to resolve discrepancy');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !vendor) {
    return <div className="p-12 text-center text-slate-400 text-xs">Loading verification workspace...</div>;
  }

  const allowedTransitionsMap: Record<string, VendorStatus[]> = {
    DRAFT: ['UNDER_REVIEW'],
    UNDER_REVIEW: ['ACTION_REQUIRED', 'APPROVED', 'REJECTED'],
    ACTION_REQUIRED: ['UNDER_REVIEW', 'REJECTED'],
    APPROVED: ['UNDER_REVIEW'],
    REJECTED: ['UNDER_REVIEW'],
  };
  const availableTransitions = allowedTransitionsMap[vendor.status] || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Breadcrumb & Workflow Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/vendors"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              title="Back to Vendors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">{vendor.company_name}</h1>
                <StatusBadge status={vendor.status} size="lg" />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Reg #{vendor.registration_number} • GSTIN: {vendor.gst_number} • Registered on {new Date(vendor.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Workflow Action Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {availableTransitions.map((target) => {
              const isApprove = target === 'APPROVED';
              const isReject = target === 'REJECTED';
              const isAction = target === 'ACTION_REQUIRED';

              let btnStyle = 'bg-brand-600 hover:bg-brand-700 text-white';
              if (isApprove) btnStyle = 'bg-emerald-600 hover:bg-emerald-700 text-white';
              if (isReject) btnStyle = 'bg-rose-600 hover:bg-rose-700 text-white';
              if (isAction) btnStyle = 'bg-amber-600 hover:bg-amber-700 text-white';

              return (
                <button
                  key={target}
                  type="button"
                  onClick={() => setTargetTransition(target)}
                  disabled={actionLoading}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 ${btnStyle}`}
                >
                  Move to {target.replace('_', ' ')}
                </button>
              );
            })}
            <a
              href={api.vendors.dossierPdfUrl(vendor.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-xl transition-colors shadow-xs"
              title="Download Certified Compliance Dossier PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Dossier PDF</span>
            </a>
            <Link
              to={`/vendors/${vendor.id}/edit`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                loadAllData();
                toast.success('Workspace data refreshed!');
              }}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Refresh Workspace"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 8-STAGE END-TO-END VERIFICATION PIPELINE (PDF Page 5 Specification) */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span>End-to-End Verification Pipeline (PDF Specification)</span>
            </div>
            <span className="text-[11px] text-slate-400">Click any stage to inspect details</span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-[11px]">
            {[
              { step: 1, name: 'Vendor Details', status: 'Completed', tab: 'overview', done: true, alert: false, inProgress: false },
              { step: 2, name: 'Upload Docs', status: `${documents.length}/3 Docs`, tab: 'documents', done: documents.length >= 3, inProgress: documents.length > 0 && documents.length < 3, alert: false },
              { step: 3, name: 'AI Extraction', status: documents.some((d) => d.extraction) ? 'Extracted' : 'Pending', tab: 'documents', done: documents.some((d) => d.extraction), inProgress: false, alert: false },
              { step: 4, name: 'AI Comparison', status: comparisons.length > 0 ? (comparisons.some((c) => c.match_status === 'MISMATCH' && c.review_status !== 'RESOLVED') ? 'Discrepancy' : 'Matched') : 'Pending', tab: 'comparison', done: comparisons.length > 0 && !comparisons.some((c) => c.match_status === 'MISMATCH' && c.review_status !== 'RESOLVED'), inProgress: false, alert: comparisons.some((c) => c.match_status === 'MISMATCH' && c.review_status !== 'RESOLVED') },
              { step: 5, name: 'Registry API', status: latestVerif ? latestVerif.outcome : 'Pending', tab: 'verification', done: latestVerif?.outcome === 'VERIFIED', inProgress: false, alert: latestVerif?.outcome === 'MISMATCH' },
              { step: 6, name: 'Missing Docs', status: checklist.some((c) => c.status === 'MISSING') ? 'Missing Items' : 'Complete', tab: 'checklist', done: checklist.length > 0 && !checklist.some((c) => c.status === 'MISSING'), inProgress: false, alert: checklist.some((c) => c.status === 'MISSING') },
              { step: 7, name: 'Email Client', status: `${emails.length} Dispatched`, tab: 'checklist', done: emails.length > 0, inProgress: false, alert: false },
              { step: 8, name: 'Review / Sign-off', status: vendor.status.replace('_', ' '), tab: 'overview', done: vendor.status === 'APPROVED' || vendor.status === 'REJECTED', inProgress: vendor.status === 'UNDER_REVIEW', alert: vendor.status === 'ACTION_REQUIRED' }
            ].map((item) => {
              let bg = 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100';
              if (item.alert) bg = 'bg-amber-50 border-amber-300 text-amber-800 font-bold hover:bg-amber-100/80';
              else if (item.done) bg = 'bg-emerald-50/70 border-emerald-300 text-emerald-800 font-bold hover:bg-emerald-100/70';
              else if (item.inProgress) bg = 'bg-brand-50 border-brand-300 text-brand-800 font-bold hover:bg-brand-100';

              return (
                <button
                  key={item.step}
                  type="button"
                  onClick={() => setActiveTab(item.tab as any)}
                  className={`p-2 rounded-xl border text-left transition-all hover:scale-[1.02] flex flex-col justify-between ${bg}`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                    <span>Step {item.step}</span>
                    {item.done ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    ) : item.alert ? (
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                    ) : null}
                  </div>
                  <span className="font-bold truncate text-[11px]">{item.name}</span>
                  <span className="text-[10px] truncate opacity-90">{item.status}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 text-xs font-semibold">
        {[
          { key: 'overview', label: 'Overview & Profile', icon: Building2 },
          { key: 'documents', label: `Documents (${documents.length})`, icon: FileText },
          { key: 'comparison', label: 'AI Comparison Matrix', icon: Sparkles },
          { key: 'verification', label: 'Corporate Registry', icon: Globe },
          { key: 'checklist', label: 'Checklist & Emails', icon: Mail },
          { key: 'tasks', label: `Tasks (${tasks.filter((t) => t.status === 'PENDING').length})`, icon: CheckSquare },
          { key: 'versions', label: `Version History (${versions.length})`, icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-white text-brand-700 shadow-xs border border-slate-200 border-b-2 border-b-brand-600'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & PROFILE */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Registered Profile Attributes
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Company Legal Name
                </span>
                <span className="text-sm font-bold text-slate-900">{vendor.company_name}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Contact Person
                </span>
                <span className="text-sm font-bold text-slate-900">{vendor.contact_person}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Registered Email
                </span>
                <span className="text-sm font-mono text-slate-800">{vendor.email}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Phone Number
                </span>
                <span className="text-sm font-slate-800">{vendor.phone}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Corporate Registration # (CIN)
                </span>
                <span className="text-sm font-mono font-bold text-slate-900">{vendor.registration_number}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  GST / Tax ID Number
                </span>
                <span className="text-sm font-mono font-bold text-slate-900">{vendor.gst_number}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Settlement Bank Account
                </span>
                <MaskedValue vendorId={vendor.id} maskedValue={vendor.bank_account_number_masked} />
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Bank IFSC / Branch Code
                </span>
                <span className="text-sm font-mono font-bold text-slate-900">{vendor.ifsc_code}</span>
              </div>

              <div className="sm:col-span-2 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Registered Office Address
                </span>
                <span className="text-xs text-slate-700 leading-relaxed">{vendor.address}</span>
              </div>
            </div>
          </div>

          {/* Quick Summary & Audit Timeline */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Compliance Audit Snapshot</h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">Documents Uploaded</span>
                  <span className="font-bold text-slate-900">{documents.length} / 3 mandatory</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">OpenCorporates Status</span>
                  <span className="font-semibold">{latestVerif ? latestVerif.outcome : 'Not Queried'}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">Open Review Tasks</span>
                  <span className="font-bold text-rose-600">{tasks.filter((t) => t.status === 'PENDING').length}</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-slate-600">Audit Versions</span>
                  <span className="font-bold text-slate-900">{versions.length} revisions</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Workflow Audit Log</h3>
              <div className="space-y-3">
                {history.slice(0, 5).map((h) => (
                  <div key={h.id} className="text-xs space-y-0.5 border-l-2 border-brand-400 pl-3">
                    <div className="flex justify-between font-semibold text-slate-800">
                      <span>{h.previous_status} → {h.new_status}</span>
                      <span className="text-[10px] text-slate-400">{new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">{h.reason}</p>
                    <span className="text-[10px] text-slate-400">By {h.actor}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DOCUMENTS & AI EXTRACTION */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          {/* Upload Dropzone Form */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-1">Upload Compliance Documentation</h2>
            <p className="text-xs text-slate-500 mb-4">
              Upload Company Registration Certificate, GST / Tax Certificate, or Bank Document (PDF or images up to 10MB).
            </p>

            <form onSubmit={handleUpload} className="flex flex-col sm:flex-row items-center gap-3">
              <select
                value={uploadDocType}
                onChange={(e) => setUploadDocType(e.target.value)}
                className="text-xs font-semibold rounded-xl border border-slate-200 p-2.5 outline-none bg-slate-50 text-slate-800"
              >
                <option value="REGISTRATION_CERTIFICATE">Company Registration Certificate</option>
                <option value="GST_CERTIFICATE">GST / Tax Certificate</option>
                <option value="BANK_DOCUMENT">Bank Statement / Document</option>
                <option value="OTHER">Other Compliance Document</option>
              </select>

              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="text-xs file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer flex-1"
              />

              <button
                type="submit"
                disabled={!uploadFile || uploading}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-xs transition-colors disabled:opacity-50 shrink-0"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{uploading ? 'Processing AI Extraction...' : 'Upload & Extract'}</span>
              </button>
            </form>

            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold">Quick Sample Downloads for Testing:</span>
              <a
                href={api.samples.downloadSampleUrl('registration')}
                download
                className="text-brand-600 hover:underline inline-flex items-center gap-1"
              >
                <Download className="w-3 h-3" /> Registration.pdf
              </a>
              <span>•</span>
              <a
                href={api.samples.downloadSampleUrl('gst')}
                download
                className="text-brand-600 hover:underline inline-flex items-center gap-1"
              >
                <Download className="w-3 h-3" /> GST.pdf
              </a>
              <span>•</span>
              <a
                href={api.samples.downloadSampleUrl('bank')}
                download
                className="text-brand-600 hover:underline inline-flex items-center gap-1"
              >
                <Download className="w-3 h-3" /> Bank.pdf
              </a>
            </div>
          </div>

          {/* Uploaded Documents List */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Uploaded Dossier Documents</h3>

            {documents.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
                No documents uploaded yet. Choose a sample PDF above to test AI extraction.
              </div>
            ) : (
              documents.map((doc) => {
                const ext = doc.extraction;
                const baseJson = ext?.extracted_json || {};
                const editsJson = ext?.user_edited_json || {};
                const isEditing = editingDocId === doc.id;

                return (
                  <div key={doc.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                    {/* Doc Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-brand-600 shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-slate-900">{doc.original_filename}</h4>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              {doc.document_type.replace('_', ' ')}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {(doc.file_size / 1024).toFixed(1)} KB • Uploaded {new Date(doc.uploaded_at).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewDoc(doc)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-xl transition-colors"
                          title="Interactive in-browser preview"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </button>
                        <a
                          href={api.documents.downloadUrl(doc.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download / View</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                          title="Delete Document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* AI Extraction Results */}
                    {ext ? (() => {
                      const normalizeFieldVal = (key: string, val: string | null | undefined): string => {
                        if (!val) return '';
                        let s = String(val).toLowerCase().trim();
                        if (key === 'company_name') {
                          s = s.replace(/\b(pvt\.?\s*ltd\.?|private\s*limited)\b/g, 'pvt ltd')
                               .replace(/\b(ltd\.?|limited)\b/g, 'ltd')
                               .replace(/\b(inc\.?|incorporated)\b/g, 'inc')
                               .replace(/\b(corp\.?|corporation)\b/g, 'corp')
                               .replace(/[^a-z0-9]/g, '');
                        } else if (key === 'bank_account_number') {
                          s = s.replace(/\D/g, '').replace(/^0+/, '');
                        } else {
                          s = s.replace(/[^a-z0-9]/g, '');
                        }
                        return s;
                      };

                      const allFieldKeys = [
                        'company_name',
                        'registration_number',
                        'gst_number',
                        'address',
                        'bank_account_number',
                        'ifsc_code',
                      ];

                      const docDiscrepancies = allFieldKeys.filter((key) => {
                        const val = editsJson[key] !== undefined ? editsJson[key] : baseJson[key]?.value;
                        if (!val || !vendor) return false;
                        const vendorVal = (vendor as any)[key];
                        if (!vendorVal) return false;
                        return normalizeFieldVal(key, val) !== normalizeFieldVal(key, vendorVal);
                      });

                      const hasDocDiscrepancy = docDiscrepancies.length > 0;

                      return (
                        <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <Sparkles className="w-4 h-4 text-brand-600" />
                              <span className="text-xs font-bold text-slate-800">
                                AI-Extracted Entities from Document
                              </span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                                Model: {ext.model_used}
                              </span>
                              {hasDocDiscrepancy ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-300 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 text-red-600" />
                                  <span>{docDiscrepancies.length} Discrepancy Flagged</span>
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Entities Verified</span>
                                </span>
                              )}
                              {ext.is_user_corrected && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                  Reviewer Corrected
                                </span>
                              )}
                            </div>

                            {!isEditing ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingDocId(doc.id);
                                  const currentVals: Record<string, string> = {};
                                  Object.keys(baseJson).forEach((k) => {
                                    currentVals[k] = editsJson[k] ?? baseJson[k]?.value ?? '';
                                  });
                                  setEditFields(currentVals);
                                }}
                                className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1"
                              >
                                <Edit className="w-3 h-3" />
                                <span>Edit Incorrect Extraction</span>
                              </button>
                            ) : (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingDocId(null)}
                                  className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveCorrections(doc.id)}
                                  className="px-3 py-1 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-xs"
                                >
                                  Save Corrections
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Discrepancy Warning Banner if Document Does Not Match Vendor */}
                          {hasDocDiscrepancy && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-3">
                              <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                              <div className="text-xs text-red-900 space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold">Cross-Source Discrepancy Detected</span>
                                  <span className="text-[10px] bg-red-200 text-red-900 px-2 py-0.2 rounded font-mono">
                                    MISMATCH WITH VENDOR PROFILE
                                  </span>
                                </div>
                                <p className="text-[11px] text-red-800 leading-relaxed">
                                  The company information in this document differs from your vendor profile (<strong>"{vendor?.company_name}"</strong>).
                                  This has been logged as a discrepancy in <strong>Step 4 (AI Comparison Matrix)</strong>.
                                </p>
                                <p className="text-[10px] text-slate-500 italic pt-0.5 border-t border-red-200/60">
                                  💡 <strong>Why does it show "OCR: 96%"?</strong> That score measures the AI's <em>visual text-reading clarity from this PDF document</em> (optical character recognition), NOT whether the document belongs to your vendor profile.
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Fields Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {allFieldKeys.map((fieldKey) => {
                              const fieldData = baseJson[fieldKey] || {};
                              const userVal = editsJson[fieldKey];
                              const displayVal = userVal !== undefined ? userVal : fieldData.value;
                              const conf = fieldData.confidence;
                              const sourceText = fieldData.source_text;

                              const vendorVal = vendor ? (vendor as any)[fieldKey] : null;
                              const hasVendorVal = Boolean(vendorVal && String(vendorVal).trim());
                              const hasExtractedVal = Boolean(displayVal && String(displayVal).trim());

                              const isComparisonPossible = hasVendorVal && hasExtractedVal;
                              const isFieldMatch = isComparisonPossible && normalizeFieldVal(fieldKey, displayVal) === normalizeFieldVal(fieldKey, vendorVal);
                              const isFieldMismatch = isComparisonPossible && !isFieldMatch;

                              return (
                                <div
                                  key={fieldKey}
                                  className={`p-3 rounded-xl border transition-all space-y-1.5 ${
                                    isFieldMismatch
                                      ? 'bg-red-50/30 border-red-300 ring-1 ring-red-200'
                                      : isFieldMatch
                                      ? 'bg-emerald-50/20 border-emerald-300'
                                      : 'bg-white border-slate-200 shadow-xs'
                                  }`}
                                >
                                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase">
                                    <span>{fieldKey.replace(/_/g, ' ')}</span>
                                    <div className="flex items-center gap-1.5">
                                      {/* Match vs Mismatch Badge */}
                                      {isFieldMismatch && (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-300 font-bold flex items-center gap-1">
                                          <AlertTriangle className="w-3 h-3 text-red-600" />
                                          <span>MISMATCH</span>
                                        </span>
                                      )}
                                      {isFieldMatch && (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold flex items-center gap-1">
                                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                          <span>MATCH</span>
                                        </span>
                                      )}
                                      {/* Neutral OCR Accuracy Badge */}
                                      {conf !== undefined && conf !== null && (
                                        <span
                                          title="AI OCR Text-Reading Accuracy from PDF (How clearly the text was extracted from this file)"
                                          className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono border border-slate-200"
                                        >
                                          OCR: {Math.round(conf * 100)}%
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {isEditing ? (
                                    <input
                                      type="text"
                                      value={editFields[fieldKey] ?? ''}
                                      onChange={(e) =>
                                        setEditFields((prev) => ({ ...prev, [fieldKey]: e.target.value }))
                                      }
                                      placeholder="Enter corrected value or leave empty..."
                                      className="w-full text-xs p-1.5 border border-brand-300 rounded-lg outline-none font-semibold text-slate-900 bg-brand-50/20"
                                    />
                                  ) : (
                                    <p className={`text-xs font-bold line-clamp-1 ${isFieldMismatch ? 'text-red-900' : 'text-slate-900'}`}>
                                      {displayVal || <span className="text-slate-400 font-normal italic">Not extracted</span>}
                                    </p>
                                  )}

                                  {/* Mismatch Diff Callout */}
                                  {isFieldMismatch && (
                                    <div className="mt-1 pt-1.5 border-t border-red-200 text-[10px] text-red-800 space-y-0.5">
                                      <div className="flex items-center gap-1 font-semibold text-red-700">
                                        <AlertTriangle className="w-3 h-3 text-red-600 flex-shrink-0" />
                                        <span>Differs from Vendor Profile:</span>
                                      </div>
                                      <div className="font-mono bg-white p-1 rounded border border-red-200 text-slate-800">
                                        Expected: <span className="font-bold text-red-900">"{vendorVal}"</span>
                                      </div>
                                    </div>
                                  )}

                                  {isFieldMatch && (
                                    <div className="mt-1 pt-1 border-t border-emerald-100 text-[10px] text-emerald-700 flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                                      <span>Consistent with vendor profile</span>
                                    </div>
                                  )}

                                  {sourceText && (
                                    <p className="text-[10px] text-slate-400 italic line-clamp-1 border-t border-slate-100 pt-1">
                                      Source: "{sourceText}"
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })() : (
                      <div className="p-4 text-center text-slate-400 text-xs">
                        Extraction pending. Click to re-run AI extraction.
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 3: AI COMPARISON & DISCREPANCY MATRIX */}
      {activeTab === 'comparison' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Deterministic Cross-Document Comparison</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Compares Vendor Input vs Registration Certificate vs GST Certificate vs Bank Document vs External Registry.
              </p>
            </div>
            <button
              type="button"
              onClick={handleRunComparison}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-xs transition-colors shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{actionLoading ? 'Auditing...' : 'Re-Run Comparison'}</span>
            </button>
          </div>

          {/* Matrix Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Entity Field</th>
                    <th className="py-3.5 px-4">Vendor Input</th>
                    <th className="py-3.5 px-4">Registration Doc</th>
                    <th className="py-3.5 px-4">GST / Tax Doc</th>
                    <th className="py-3.5 px-4">Bank Document</th>
                    <th className="py-3.5 px-4">Registry API</th>
                    <th className="py-3.5 px-4">Match Status</th>
                    <th className="py-3.5 px-4">Audit Explanation</th>
                    <th className="py-3.5 px-4">Reviewer Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {comparisons.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        No comparison results yet. Click "Re-Run Comparison" above.
                      </td>
                    </tr>
                  ) : (
                    comparisons.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900 capitalize">
                          {c.field_name.replace(/_/g, ' ')}
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">{c.vendor_value || '—'}</td>
                        <td className="py-3 px-4 text-slate-700">{c.registration_value || '—'}</td>
                        <td className="py-3 px-4 text-slate-700">{c.gst_value || '—'}</td>
                        <td className="py-3 px-4 text-slate-700">{c.bank_value || '—'}</td>
                        <td className="py-3 px-4 text-slate-700 font-medium text-brand-700">{c.external_api_value || '—'}</td>
                        <td className="py-3 px-4">
                          <StatusBadge status={c.match_status} />
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs">{c.explanation}</td>
                        <td className="py-3 px-4">
                          {c.review_status === 'RESOLVED' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                              <CheckCircle2 className="w-3 h-3 text-sky-600" />
                              Resolved
                            </span>
                          ) : c.match_status === 'MISMATCH' ? (
                            <button
                              type="button"
                              onClick={() => {
                                setResolvingComparison(c);
                                setResolutionNotes('');
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-xs transition-colors shrink-0"
                              title="Authorize discrepancy with audit explanation"
                            >
                              <ShieldCheck className="w-3 h-3" />
                              <span>Resolve</span>
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: EXTERNAL COMPANY VERIFICATION (FORMIK POWERED) */}
      {activeTab === 'verification' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">External Corporate Registry Verification</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Formik-validated query against official corporate registries via OpenCorporates adapter.
              </p>
            </div>

            <form onSubmit={registryFormik.handleSubmit} className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="w-full sm:flex-1">
                <input
                  type="text"
                  {...registryFormik.getFieldProps('query')}
                  placeholder="Search company legal name or registration number..."
                  className={`w-full text-xs rounded-xl border p-2.5 outline-none transition-all ${
                    registryFormik.touched.query && registryFormik.errors.query
                      ? 'border-red-400 bg-red-50/20'
                      : 'border-slate-200 focus:border-brand-500'
                  }`}
                />
                {registryFormik.touched.query && registryFormik.errors.query && (
                  <p className="text-[11px] text-red-500 mt-1">{registryFormik.errors.query}</p>
                )}
              </div>

              <select
                {...registryFormik.getFieldProps('jurisdiction_code')}
                className="text-xs font-semibold rounded-xl border border-slate-200 p-2.5 outline-none bg-slate-50 text-slate-800"
              >
                <option value="in">India (in)</option>
                <option value="us_de">Delaware, US (us_de)</option>
                <option value="gb">United Kingdom (gb)</option>
              </select>

              <button
                type="submit"
                disabled={registryFormik.isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-xs transition-colors shrink-0 disabled:opacity-50"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{registryFormik.isSubmitting ? 'Querying Registry...' : 'Verify Entity Online'}</span>
              </button>
            </form>
          </div>

          {/* Verification Result Banner */}
          {latestVerif ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-sm text-slate-900">Official Verification Result</h3>
                  <StatusBadge status={latestVerif.outcome} size="lg" />
                  {latestVerif.is_simulated && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                      [DEMO MODE: Simulated External Verification]
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-400">
                  Verified at {new Date(latestVerif.verified_at).toLocaleString()}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <p className="font-semibold text-slate-800">{latestVerif.mismatch_notes}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-slate-600 border-t border-slate-200/60">
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block font-bold">Matched Name</span>
                    <span className="font-semibold text-slate-900">{latestVerif.extracted_company_name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block font-bold">Registration #</span>
                    <span className="font-semibold text-slate-900">{latestVerif.extracted_reg_number || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block font-bold">Registry Status</span>
                    <span className="font-semibold text-slate-900">{latestVerif.extracted_status || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block font-bold">Jurisdiction</span>
                    <span className="font-semibold text-slate-900">{latestVerif.extracted_jurisdiction || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {latestVerif.raw_response && (
                <details className="text-xs text-slate-500 border border-slate-100 rounded-xl p-3 bg-slate-50/50">
                  <summary className="font-semibold cursor-pointer text-brand-600">
                    Inspect Raw Registry API Response Payload
                  </summary>
                  <pre className="mt-2 text-[11px] font-mono bg-slate-900 text-slate-100 p-3 rounded-lg overflow-x-auto max-h-48">
                    {JSON.stringify(latestVerif.raw_response, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
              No registry verification has been executed for this vendor yet.
            </div>
          )}
        </div>
      )}

      {/* TAB 5: CHECKLIST & EMAIL AUTOMATION */}
      {activeTab === 'checklist' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Document Compliance Checklist</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                All 3 mandatory documents must be marked AVAILABLE or VERIFIED before final approval is unlocked.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAuditMissingDocs}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors shrink-0"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{actionLoading ? 'Auditing...' : 'Audit Missing Docs & Send Notice'}</span>
            </button>
          </div>

          {/* Checklist Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Required Document Category</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Reviewer Notes</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {checklist.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {item.document_type.replace('_', ' ')}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{item.notes || '—'}</td>
                    <td className="py-3.5 px-4 text-right">
                      <select
                        value={item.status}
                        onChange={async (e) => {
                          await api.workflow.updateChecklist(vendorId, item.id, e.target.value);
                          const chk = await api.workflow.getChecklist(vendorId);
                          setChecklist(chk);
                          toast.success(`Checklist item updated to ${e.target.value}!`);
                        }}
                        className="text-xs font-semibold rounded-lg border border-slate-200 p-1 bg-slate-50"
                      >
                        <option value="MISSING">MISSING</option>
                        <option value="AVAILABLE">AVAILABLE</option>
                        <option value="VERIFIED">VERIFIED</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Sent Email Notices Log */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Email Notification Audit Log</h3>
            {emails.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No emails sent to this vendor yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {emails.map((em) => (
                  <div key={em.id} className="py-3 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{em.subject}</span>
                      <StatusBadge status={em.status} size="sm" />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      To: {em.recipient_email} • Sent at: {new Date(em.sent_at).toLocaleString()} • Provider: {em.provider}
                    </p>
                    <details className="text-[11px] text-slate-600 pt-1 cursor-pointer">
                      <summary className="text-brand-600 font-semibold">View Email Body</summary>
                      <pre className="mt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200 whitespace-pre-wrap font-sans text-slate-700">
                        {em.body_text}
                      </pre>
                    </details>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: TASKS MANAGEMENT (FORMIK POWERED) */}
      {activeTab === 'tasks' && (
        <div className="space-y-6">
          {/* Formik Create Task Form */}
          <form
            onSubmit={taskFormik.handleSubmit}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3"
          >
            <span className="text-xs font-bold text-slate-800 block">Create Compliance Review Task (Formik-Validated)</span>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="w-full sm:flex-1">
                <input
                  type="text"
                  {...taskFormik.getFieldProps('title')}
                  placeholder="Task title (e.g., Follow up on address discrepancy)..."
                  className={`w-full text-xs rounded-xl border p-2.5 outline-none transition-all ${
                    taskFormik.touched.title && taskFormik.errors.title
                      ? 'border-red-400 bg-red-50/20'
                      : 'border-slate-200 focus:border-brand-500'
                  }`}
                />
                {taskFormik.touched.title && taskFormik.errors.title && (
                  <p className="text-[11px] text-red-500 mt-1">{taskFormik.errors.title}</p>
                )}
              </div>

              <select
                {...taskFormik.getFieldProps('priority')}
                className="text-xs font-semibold rounded-xl border border-slate-200 p-2.5 outline-none bg-slate-50"
              >
                <option value="LOW">Low Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="HIGH">High Priority</option>
              </select>

              <input
                type="date"
                {...taskFormik.getFieldProps('due_date')}
                className="text-xs rounded-xl border border-slate-200 p-2 outline-none"
              />

              <button
                type="submit"
                disabled={taskFormik.isSubmitting || actionLoading}
                className="px-4 py-2.5 text-xs font-bold rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-xs transition-colors shrink-0 disabled:opacity-50"
              >
                Add Task
              </button>
            </div>
          </form>

          {/* Tasks Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-12 text-center">Status</th>
                  <th className="py-3.5 px-4">Task Title & Details</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4 text-right">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No tasks for this vendor.
                    </td>
                  </tr>
                ) : (
                  tasks.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={t.status === 'COMPLETED'}
                          onChange={() => handleToggleTask(t)}
                          className="rounded text-brand-600 cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`font-semibold ${t.status === 'COMPLETED' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          {t.title}
                        </span>
                        {t.description && <p className="text-[11px] text-slate-500 mt-0.5">{t.description}</p>}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={t.priority} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {t.due_date ? new Date(t.due_date).toLocaleDateString() : 'No date'}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-400">
                        {new Date(t.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: VERSION HISTORY & RESTORATION */}
      {activeTab === 'versions' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900">Immutable Version History</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Every vendor profile revision is snapshot-tracked. You can roll back to any historical version safely.
            </p>
          </div>

          <div className="space-y-4">
            {versions.map((ver) => {
              const diff = ver.changed_fields || {};
              const hasDiff = Object.keys(diff).length > 0;

              return (
                <div key={ver.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-700 font-black text-sm flex items-center justify-center border border-brand-200 shrink-0">
                        v{ver.version_number}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">
                          Version {ver.version_number}: {ver.reason || 'Vendor update'}
                        </h4>
                        <span className="text-[11px] text-slate-400">
                          Saved by {ver.actor} on {new Date(ver.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setVersionToRestore(ver)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors self-start sm:self-auto"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore This Version</span>
                    </button>
                  </div>

                  {/* Changes Diff */}
                  {hasDiff ? (
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Changed Fields</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {Object.entries(diff).map(([field, delta]: any) => (
                          <div key={field} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                            <span className="font-bold text-slate-700 capitalize block text-[11px] mb-1">
                              {field.replace(/_/g, ' ')}
                            </span>
                            <div className="space-y-0.5 font-mono text-[11px]">
                              <p className="text-rose-600 line-through">Old: {delta.old ?? 'None'}</p>
                              <p className="text-emerald-700 font-bold">New: {delta.new ?? 'None'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Base initial version snapshot.</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Workflow Transition Confirmation Modal */}
      <ConfirmModal
        isOpen={!!targetTransition}
        title={`Confirm Workflow State Transition`}
        message={`Are you sure you want to transition ${vendor.company_name} from ${vendor.status} to ${targetTransition}?`}
        confirmLabel={`Move to ${targetTransition?.replace('_', ' ')}`}
        requireReason={true}
        onConfirm={handleTransition}
        onClose={() => setTargetTransition(null)}
      />

      {/* Version Restoration Confirmation Modal */}
      <ConfirmModal
        isOpen={!!versionToRestore}
        title={`Restore Version ${versionToRestore?.version_number}`}
        message={`Are you sure you want to revert ${vendor.company_name} to Version ${versionToRestore?.version_number}? Current field values will be overwritten with the historical snapshot, and a new audit version will be recorded.`}
        confirmLabel="Confirm & Restore"
        requireReason={true}
        reasonPlaceholder="Reason for reverting to this version..."
        onConfirm={handleRestoreVersion}
        onClose={() => setVersionToRestore(null)}
      />

      {/* Interactive Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{previewDoc.original_filename}</h3>
                  <span className="text-[11px] text-slate-500">
                    {previewDoc.document_type.replace(/_/g, ' ')} • {(previewDoc.file_size / 1024).toFixed(1)} KB
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={api.documents.downloadUrl(previewDoc.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Open in Tab</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-slate-100 rounded-xl border border-slate-200 overflow-hidden min-h-[420px] flex items-center justify-center">
                {previewDoc.mime_type === 'application/pdf' ? (
                  <iframe
                    src={api.documents.previewUrl(previewDoc.id)}
                    className="w-full h-full min-h-[420px] border-none"
                    title={previewDoc.original_filename}
                  />
                ) : (
                  <img
                    src={api.documents.previewUrl(previewDoc.id)}
                    alt={previewDoc.original_filename}
                    className="max-h-[420px] object-contain"
                  />
                )}
              </div>
              <div className="space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                    <span>Extracted Structured Entities</span>
                  </h4>
                  {previewDoc.extraction?.extracted_json ? (
                    <div className="space-y-2 text-xs">
                      {Object.entries(previewDoc.extraction.extracted_json).map(([k, v]: any) => (
                        <div key={k} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                            {k.replace(/_/g, ' ')}
                          </span>
                          <span className="font-semibold text-slate-900 text-xs">
                            {previewDoc.extraction?.user_edited_json?.[k] ?? v?.value ?? '—'}
                          </span>
                          {v?.confidence !== undefined && (
                            <span className="block text-[10px] text-slate-400 mt-1">
                              Confidence: {(v.confidence * 100).toFixed(0)}%
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No structured extraction entities found.</p>
                  )}
                </div>
                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(null)}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  >
                    Close Preview
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Discrepancy Resolution Modal */}
      {resolvingComparison && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Resolve Field Discrepancy</h3>
                <p className="text-xs text-slate-500">
                  Field: <span className="font-bold text-slate-700 capitalize">{resolvingComparison.field_name.replace(/_/g, ' ')}</span>
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Vendor Profile:</span>
                <span className="font-semibold text-slate-800">{resolvingComparison.vendor_value || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Uploaded Document:</span>
                <span className="font-semibold text-slate-800">
                  {resolvingComparison.registration_value || resolvingComparison.gst_value || resolvingComparison.bank_value || 'None'}
                </span>
              </div>
              <div className="text-[11px] text-amber-700 bg-amber-50/80 p-2 rounded-lg border border-amber-200 mt-2">
                {resolvingComparison.explanation}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Auditor Justification / Resolution Notes *</label>
              <textarea
                rows={3}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="e.g. Verified with Registrar of Companies gazette copy; minor naming abbreviation is legally valid."
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 outline-none focus:border-brand-500 transition-colors"
              />
              <span className="text-[11px] text-slate-400">
                Resolution will complete any pending discrepancy tasks and log an immutable audit explanation.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setResolvingComparison(null);
                  setResolutionNotes('');
                }}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResolveDiscrepancy}
                disabled={actionLoading || !resolutionNotes.trim()}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Saving...' : 'Authorize & Resolve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
