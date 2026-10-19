import axios from 'axios';
import {
  Vendor,
  VendorVersion,
  DocumentItem,
  DocumentExtraction,
  FieldComparison,
  ComparisonSummary,
  CompanyVerification,
  DocumentChecklist,
  WorkflowHistory,
  TaskItem,
  EmailNotification,
  DashboardStats,
  VendorStatus
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Vendors
  vendors: {
    list: async (params?: { search?: string; status?: string; skip?: number; limit?: number }) => {
      const res = await apiClient.get<{ items: Vendor[]; total: number }>('/vendors', { params });
      return res.data;
    },
    get: async (id: number, unmask = false) => {
      const res = await apiClient.get<Vendor>(`/vendors/${id}`, { params: { unmask } });
      return res.data;
    },
    create: async (data: Omit<Vendor, 'id' | 'status' | 'created_at' | 'updated_at' | 'bank_account_number_masked'>) => {
      const res = await apiClient.post<Vendor>('/vendors', data);
      return res.data;
    },
    update: async (id: number, data: Partial<Vendor> & { change_reason?: string }) => {
      const res = await apiClient.put<Vendor>(`/vendors/${id}`, data);
      return res.data;
    },
    delete: async (id: number) => {
      await apiClient.delete(`/vendors/${id}`);
    },
    dossierPdfUrl: (id: number) => `${API_BASE_URL}/vendors/${id}/dossier-pdf`,
  },

  // Documents
  documents: {
    list: async (vendorId: number) => {
      const res = await apiClient.get<DocumentItem[]>(`/vendors/${vendorId}/documents`);
      return res.data;
    },
    upload: async (vendorId: number, file: File, documentType: string, autoExtract = true) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', documentType);
      formData.append('auto_extract', String(autoExtract));
      const res = await apiClient.post<DocumentItem>(`/vendors/${vendorId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    extract: async (documentId: number) => {
      const res = await apiClient.post<DocumentExtraction>(`/documents/${documentId}/extract`);
      return res.data;
    },
    updateCorrections: async (documentId: number, corrections: Record<string, string | null>) => {
      const res = await apiClient.put<DocumentExtraction>(`/documents/${documentId}/extraction`, corrections);
      return res.data;
    },
    downloadUrl: (documentId: number) => `${API_BASE_URL}/documents/${documentId}/download`,
    previewUrl: (documentId: number) => `${API_BASE_URL}/documents/${documentId}/download?inline=true`,
    delete: async (documentId: number) => {
      await apiClient.delete(`/documents/${documentId}`);
    },
  },

  // Verification & Comparison
  verification: {
    runComparison: async (vendorId: number) => {
      const res = await apiClient.post<ComparisonSummary>(`/vendors/${vendorId}/compare`);
      return res.data;
    },
    getComparisons: async (vendorId: number) => {
      const res = await apiClient.get<FieldComparison[]>(`/vendors/${vendorId}/comparisons`);
      return res.data;
    },
    resolveDiscrepancy: async (vendorId: number, comparisonId: number, resolutionNotes: string, actor?: string) => {
      const res = await apiClient.patch<FieldComparison>(`/vendors/${vendorId}/comparisons/${comparisonId}/resolve`, {
        resolution_notes: resolutionNotes,
        actor: actor || 'Reviewer'
      });
      return res.data;
    },
    verifyCompany: async (vendorId: number, query?: string, jurisdictionCode?: string) => {
      const res = await apiClient.post<CompanyVerification>(`/vendors/${vendorId}/verify-company`, {
        query,
        jurisdiction_code: jurisdictionCode,
      });
      return res.data;
    },
    getLatestVerification: async (vendorId: number) => {
      const res = await apiClient.get<CompanyVerification | null>(`/vendors/${vendorId}/verification`);
      return res.data;
    },
  },

  // Workflow & Checklist
  workflow: {
    getChecklist: async (vendorId: number) => {
      const res = await apiClient.get<DocumentChecklist[]>(`/vendors/${vendorId}/checklist`);
      return res.data;
    },
    updateChecklist: async (vendorId: number, checklistId: number, status: string, notes?: string) => {
      const res = await apiClient.patch<DocumentChecklist>(`/vendors/${vendorId}/checklist/${checklistId}`, {
        status,
        notes,
      });
      return res.data;
    },
    transitionStatus: async (vendorId: number, newStatus: VendorStatus, reason?: string, actor?: string) => {
      const res = await apiClient.patch<Vendor>(`/vendors/${vendorId}/workflow`, {
        new_status: newStatus,
        reason,
        actor: actor || 'Compliance Officer',
      });
      return res.data;
    },
    getHistory: async (vendorId: number) => {
      const res = await apiClient.get<WorkflowHistory[]>(`/vendors/${vendorId}/workflow-history`);
      return res.data;
    },
    checkMissing: async (vendorId: number, forceResend = false) => {
      const res = await apiClient.post<{
        missing_documents: string[];
        action_required_triggered: boolean;
        task_created: boolean;
        task_id?: number;
        email_sent: boolean;
        email_status?: string;
      }>(`/vendors/${vendorId}/check-missing`, { force_resend: forceResend });
      return res.data;
    },
    getEmails: async (vendorId: number) => {
      const res = await apiClient.get<EmailNotification[]>(`/vendors/${vendorId}/emails`);
      return res.data;
    },
  },

  // Tasks
  tasks: {
    list: async (params?: { status?: string; priority?: string; vendor_id?: number }) => {
      const res = await apiClient.get<TaskItem[]>('/tasks', { params });
      return res.data;
    },
    create: async (vendorId: number, data: { title: string; description?: string; priority: string; due_date?: string }) => {
      const res = await apiClient.post<TaskItem>(`/vendors/${vendorId}/tasks`, data);
      return res.data;
    },
    update: async (taskId: number, data: Partial<TaskItem>) => {
      const res = await apiClient.patch<TaskItem>(`/tasks/${taskId}`, data);
      return res.data;
    },
  },

  // Versions
  versions: {
    list: async (vendorId: number) => {
      const res = await apiClient.get<VendorVersion[]>(`/vendors/${vendorId}/versions`);
      return res.data;
    },
    restore: async (vendorId: number, versionId: number, reason?: string) => {
      const res = await apiClient.post<Vendor>(`/vendors/${vendorId}/versions/${versionId}/restore`, { reason });
      return res.data;
    },
  },

  // Dashboard
  dashboard: {
    getStats: async () => {
      const res = await apiClient.get<DashboardStats>('/dashboard/stats');
      return res.data;
    },
  },

  // Samples & Seed
  samples: {
    seedDemo: async () => {
      const res = await apiClient.post<{ message: string; vendor_id: number }>('/samples/seed-demo-vendor');
      return res.data;
    },
    seedCompany: async (companyKey: string) => {
      if (companyKey === 'zenith') {
        const res = await apiClient.post<{ message: string; vendor_id: number }>('/samples/seed-company-1');
        return res.data;
      } else if (companyKey === 'nexus') {
        const res = await apiClient.post<{ message: string; vendor_id: number }>('/samples/seed-company-2');
        return res.data;
      } else if (companyKey === 'apex') {
        const res = await apiClient.post<{ message: string; vendor_id: number }>('/samples/seed-company-3');
        return res.data;
      }
      const res = await apiClient.post<{ message: string; vendor_id: number }>('/samples/seed-demo-vendor');
      return res.data;
    },
    seedAllCompanies: async () => {
      const res = await apiClient.post<{ message: string; companies: Array<{ vendor_id: number; company_name: string }> }>('/samples/seed-all-companies');
      return res.data;
    },
    listFiles: async () => {
      const res = await apiClient.get<{ files: any[]; companies: Record<string, any> }>('/samples/files');
      return res.data;
    },
    downloadReportUrl: () => `${API_BASE_URL}/samples/download-report`,
    downloadCompanyPdfUrl: (companyKey: string, docType: string) =>
      `${API_BASE_URL}/samples/download/${companyKey}/${docType}`,
    downloadSampleUrl: (docType: string) => `${API_BASE_URL}/samples/download/${docType}`,
  },
};
