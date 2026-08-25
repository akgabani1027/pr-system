import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  FileSpreadsheet, 
  CheckCircle2, 
  BarChart3, 
  Users, 
  PlusCircle,
  UploadCloud
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab, onOpenNewPR, onOpenImportCSV, pendingCount = 0 }) => {
  const { user } = useAuth();
  const isApprover = user?.role === 'manager' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'prs', label: 'Requisitions', icon: FileSpreadsheet },
    ...(isApprover ? [{ 
      id: 'approvals', 
      label: 'Approvals Queue', 
      icon: CheckCircle2,
      badge: pendingCount > 0 ? pendingCount : null
    }] : []),
    { id: 'analytics', label: 'Analytics & Spend', icon: BarChart3 },
    ...(isAdmin ? [{ id: 'users', label: 'Team & Roles', icon: Users }] : []),
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between hidden md:flex">
      <div className="space-y-4">
        <div className="space-y-2">
          <button
            onClick={onOpenNewPR}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-md shadow-brand-500/20 transition-all hover:translate-y-[-1px]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Requisition</span>
          </button>
          
          <button
            onClick={onOpenImportCSV}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-xs transition"
          >
            <UploadCloud className="w-4 h-4 text-emerald-600" />
            <span>Import CSV / Excel</span>
          </button>
        </div>

        <nav className="space-y-1">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Main Menu</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
        <p className="font-semibold text-slate-800 mb-1">Spreadsheet Bulk Imports</p>
        <p className="text-[11px] leading-relaxed text-slate-500">
          Upload any Excel/CSV spreadsheet to immediately reflect employee requisitions across the dashboard.
        </p>
      </div>
    </aside>
  );
};
