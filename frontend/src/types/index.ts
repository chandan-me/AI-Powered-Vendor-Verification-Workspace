export type VendorStatus = 'DRAFT' | 'UNDER_REVIEW' | 'ACTION_REQUIRED' | 'APPROVED' | 'REJECTED';
export type MatchStatus = 'MATCH' | 'MISMATCH' | 'MISSING' | 'NOT_CHECKED';
export type ChecklistStatus = 'MISSING' | 'AVAILABLE' | 'VERIFIED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskStatus = 'PENDING' | 'COMPLETED';
export type VerificationOutcome = 'VERIFIED' | 'MISMATCH' | 'UNABLE_TO_VERIFY';

export interface Vendor {
  id: number;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  registration_number: string;
  gst_number: string;
  bank_account_number_masked: string;
  bank_account_number?: string;
  ifsc_code: string;
  status: VendorStatus;
  created_at: string;
  updated_at: string;
}

export interface VendorVersion {
  id: number;
  vendor_id: number;
  version_number: number;
  snapshot: Record<string, any>;
  changed_fields?: Record<string, { old: any; new: any }>;
  actor: string;
  reason?: string;
  created_at: string;
}

export interface ExtractionField {
  value?: string | null;
  confidence?: number | null;
  source_text?: string | null;
}

export interface DocumentExtraction {
  id: number;
  document_id: number;
  raw_text?: string;
  extracted_json?: Record<string, ExtractionField>;
  user_edited_json?: Record<string, string>;
  is_user_corrected: boolean;
  model_used: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentItem {
  id: number;
  vendor_id: number;
  document_type: string;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  processing_status: 'PENDING' | 'PROCESSING' | 'EXTRACTED' | 'FAILED';
  verification_status: 'UNVERIFIED' | 'VERIFIED' | 'REJECTED';
  uploaded_at: string;
  extraction?: DocumentExtraction;
}

export interface FieldComparison {
  id: number;
  vendor_id: number;
  field_name: string;
  vendor_value?: string;
  registration_value?: string;
  gst_value?: string;
  bank_value?: string;
  external_api_value?: string;
  match_status: MatchStatus;
  explanation?: string;
  review_status: 'PENDING' | 'RESOLVED' | 'IGNORED';
  created_at: string;
  updated_at: string;
}

export interface ComparisonSummary {
  comparisons: FieldComparison[];
  has_mismatches: boolean;
  mismatch_count: number;
  match_count: number;
  missing_count: number;
}

export interface CompanyVerification {
  id: number;
  vendor_id: number;
  provider: string;
  search_query: string;
  jurisdiction_code?: string;
  api_status_code?: number;
  raw_response?: any;
  extracted_company_name?: string;
  extracted_reg_number?: string;
  extracted_jurisdiction?: string;
  extracted_status?: string;
  outcome: VerificationOutcome;
  mismatch_notes?: string;
  is_simulated: boolean;
  verified_at: string;
}

export interface DocumentChecklist {
  id: number;
  vendor_id: number;
  document_type: string;
  status: ChecklistStatus;
  notes?: string;
  checked_at: string;
}

export interface WorkflowHistory {
  id: number;
  vendor_id: number;
  previous_status: string;
  new_status: string;
  reason?: string;
  actor: string;
  created_at: string;
}

export interface TaskItem {
  id: number;
  vendor_id: number;
  title: string;
  description?: string;
  priority: TaskPriority;
  due_date?: string;
  status: TaskStatus;
  created_at: string;
  completed_at?: string;
  vendor_company_name?: string;
}

export interface EmailNotification {
  id: number;
  vendor_id: number;
  recipient_email: string;
  subject: string;
  body_text: string;
  missing_documents?: string[];
  provider: string;
  status: string;
  provider_message_id?: string;
  error_message?: string;
  sent_at: string;
}

export interface DashboardStats {
  total_vendors: number;
  draft_vendors: number;
  under_review_vendors: number;
  action_required_vendors: number;
  approved_vendors: number;
  rejected_vendors: number;
  pending_tasks: number;
  completed_tasks: number;
  recent_activity: Array<{
    id: number;
    vendor_id: number;
    vendor_name: string;
    action_type: string;
    description: string;
    actor: string;
    timestamp: string;
  }>;
  status_distribution: Record<string, number>;
}
