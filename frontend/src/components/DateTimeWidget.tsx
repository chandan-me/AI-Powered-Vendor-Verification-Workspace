import React, { useState, useEffect } from 'react';
import { Clock, Calendar } from 'lucide-react';

interface DateTimeWidgetProps {
  compact?: boolean;
  variant?: 'light' | 'dark';
  className?: string;
}

export const DateTimeWidget: React.FC<DateTimeWidgetProps> = ({
  compact = false,
  variant = 'light',
  className = '',
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  useEffect(() => {
    // Update every second for a live ticking clock
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedTime = currentDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const isDark = variant === 'dark';

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-mono select-none ${
          isDark
            ? 'bg-slate-800/80 border border-slate-700/80 text-slate-200'
            : 'bg-slate-100/90 border border-slate-200/80 text-slate-700'
        } ${className}`}
        title={`Current System Time: ${formattedDate} ${formattedTime}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-semibold">{formattedTime}</span>
      </div>
    );
  }

  return (
    <div
      className={`hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-xl border shadow-xs transition-colors select-none ${
        isDark
          ? 'bg-slate-800/80 border-slate-700/80 hover:border-slate-600 text-slate-100'
          : 'bg-slate-50 border-slate-200/80 hover:border-slate-300 text-slate-800'
      } ${className}`}
      title={`Live System Clock & Calendar: ${formattedDate} ${formattedTime}`}
    >
      <div
        className={`flex items-center gap-1.5 text-xs font-medium border-r pr-2.5 ${
          isDark ? 'border-slate-700 text-slate-300' : 'border-slate-200 text-slate-600'
        }`}
      >
        <Calendar className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-brand-400' : 'text-brand-600'}`} />
        <span className={`whitespace-nowrap font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
          {formattedDate}
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-xs font-mono font-bold">
        <Clock className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
        <span className={`tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{formattedTime}</span>
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" title="Live Clock Active" />
      </div>
    </div>
  );
};
