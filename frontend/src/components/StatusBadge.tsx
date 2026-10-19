import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', className = '' }) => {
  const norm = (status || '').toUpperCase();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';
  let label = status;

  switch (norm) {
    // Vendor Workflow Statuses
    case 'DRAFT':
      styles = 'bg-slate-100 text-slate-700 border-slate-300';
      dotColor = 'bg-slate-400';
      label = 'Draft';
      break;
    case 'UNDER_REVIEW':
      styles = 'bg-blue-50 text-blue-700 border-blue-200';
      dotColor = 'bg-blue-500 animate-pulse';
      label = 'Under Review';
      break;
    case 'ACTION_REQUIRED':
      styles = 'bg-amber-50 text-amber-800 border-amber-300';
      dotColor = 'bg-amber-500';
      label = 'Action Required';
      break;
    case 'APPROVED':
      styles = 'bg-emerald-50 text-emerald-700 border-emerald-300';
      dotColor = 'bg-emerald-500';
      label = 'Approved';
      break;
    case 'REJECTED':
      styles = 'bg-rose-50 text-rose-700 border-rose-300';
      dotColor = 'bg-rose-500';
      label = 'Rejected';
      break;

    // Field Comparison Statuses
    case 'MATCH':
      styles = 'bg-emerald-50 text-emerald-700 border-emerald-300';
      dotColor = 'bg-emerald-500';
      label = 'Match';
      break;
    case 'MISMATCH':
      styles = 'bg-rose-50 text-rose-700 border-rose-300';
      dotColor = 'bg-rose-500 animate-bounce';
      label = 'Mismatch';
      break;
    case 'MISSING':
      styles = 'bg-amber-50 text-amber-800 border-amber-300';
      dotColor = 'bg-amber-500';
      label = 'Missing';
      break;
    case 'NOT_CHECKED':
      styles = 'bg-slate-100 text-slate-600 border-slate-200';
      dotColor = 'bg-slate-400';
      label = 'Not Checked';
      break;

    // Document Checklist & Verification
    case 'AVAILABLE':
      styles = 'bg-sky-50 text-sky-700 border-sky-300';
      dotColor = 'bg-sky-500';
      label = 'Available';
      break;
    case 'VERIFIED':
      styles = 'bg-teal-50 text-teal-800 border-teal-300';
      dotColor = 'bg-teal-500';
      label = 'Verified';
      break;
    case 'UNABLE_TO_VERIFY':
      styles = 'bg-indigo-50 text-indigo-700 border-indigo-300';
      dotColor = 'bg-indigo-400';
      label = 'Unable to Verify';
      break;

    // Tasks Priority
    case 'HIGH':
      styles = 'bg-red-50 text-red-700 border-red-300';
      dotColor = 'bg-red-500';
      label = 'High Priority';
      break;
    case 'MEDIUM':
      styles = 'bg-amber-50 text-amber-700 border-amber-300';
      dotColor = 'bg-amber-500';
      label = 'Medium';
      break;
    case 'LOW':
      styles = 'bg-slate-100 text-slate-600 border-slate-200';
      dotColor = 'bg-slate-400';
      label = 'Low';
      break;

    // Task Status
    case 'PENDING':
      styles = 'bg-amber-50 text-amber-800 border-amber-200';
      dotColor = 'bg-amber-500';
      label = 'Pending';
      break;
    case 'COMPLETED':
      styles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      dotColor = 'bg-emerald-500';
      label = 'Completed';
      break;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3.5 py-1.5',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${styles} ${sizeClasses} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{label}</span>
    </span>
  );
};
