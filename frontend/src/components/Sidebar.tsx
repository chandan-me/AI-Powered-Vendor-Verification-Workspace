import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, CheckSquare, PlusCircle, ShieldAlert, BookOpen } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/vendors', label: 'Vendor Directory', icon: Users },
    { to: '/vendors/new', label: 'Onboard Vendor', icon: PlusCircle },
    { to: '/tasks', label: 'Compliance Tasks', icon: CheckSquare },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-4 shrink-0 h-[calc(100vh-4rem)] sticky top-16">
      <div className="space-y-6">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Verification Platform
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${isActive
                      ? 'bg-brand-50 text-brand-700 shadow-xs border border-brand-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Workflow Info Box */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <ShieldAlert className="w-4 h-4 text-brand-600" />
            <span>Audit Flow Standard</span>
          </div>
          <div className="text-[11px] text-slate-600 leading-relaxed space-y-1">
            <p>1. Register Vendor Profile</p>
            <p>2. Upload 3 Compliance PDFs</p>
            <p>3. AI Entity Extraction</p>
            <p>4. Cross-Document Comparison</p>
            <p>5. OpenCorporates Lookup</p>
            <p>6. Missing Doc Auto-Email</p>
            <p>7. Final Approval & Versioning</p>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-400 space-y-1">
        <p className="font-bold text-slate-900">AI-Powered Vendor Verification Workspace</p>
      </div>
    </aside>
  );
};
