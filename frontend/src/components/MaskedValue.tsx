import React, { useState } from 'react';
import { Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { api } from '../api/client';

interface MaskedValueProps {
  vendorId: number;
  maskedValue: string;
  className?: string;
}

export const MaskedValue: React.FC<MaskedValueProps> = ({ vendorId, maskedValue, className = '' }) => {
  const [unmasked, setUnmasked] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const toggleReveal = async () => {
    if (revealed) {
      setRevealed(false);
      return;
    }

    if (unmasked) {
      setRevealed(true);
      return;
    }

    try {
      setLoading(true);
      const data = await api.vendors.get(vendorId, true);
      setUnmasked(data.bank_account_number || maskedValue);
      setRevealed(true);
    } catch (e) {
      console.error('Failed to fetch unmasked value:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 font-mono ${className}`}>
      <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded text-sm tracking-wider font-semibold border border-slate-200">
        {revealed && unmasked ? unmasked : maskedValue}
      </span>
      <button
        type="button"
        onClick={toggleReveal}
        disabled={loading}
        title={revealed ? 'Mask sensitive number' : 'Authorize disclosure & reveal'}
        className="p-1 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors"
      >
        {revealed ? <EyeOff className="w-4 h-4 text-amber-600" /> : <Eye className="w-4 h-4" />}
      </button>
      {revealed && (
        <span className="flex items-center gap-1 text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
          <ShieldAlert className="w-3 h-3" />
          Disclosed
        </span>
      )}
    </div>
  );
};
