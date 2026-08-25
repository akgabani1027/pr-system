import React from 'react';
import { useAuth } from '../context/AuthContext';
import { FileText, FileSpreadsheet, PlusCircle } from 'lucide-react';

export const Navbar = ({ onOpenNewPR, onOpenImportCSV }) => {
  const { user, switchRole } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">PR System</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                  Requisitions
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Approval Workflow & Spend Management</p>
            </div>
          </div>

          {/* Action CTAs & Persona Switcher */}
          <div className="flex items-center gap-2.5">
            {onOpenImportCSV && (
              <button
                onClick={onOpenImportCSV}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition shadow-sm"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                Import CSV/Excel
              </button>
            )}

            {onOpenNewPR && (
              <button
                onClick={onOpenNewPR}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                New PR
              </button>
            )}

            {/* Quick Persona Switcher */}
            <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200 text-xs">
              <span className="text-[11px] font-bold text-slate-500 px-1.5 hidden md:inline">Role:</span>
              <button
                onClick={() => switchRole('admin')}
                className={`px-2 py-1 rounded-lg font-semibold transition text-xs ${
                  user.role === 'admin'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                🛡️ Admin
              </button>
              <button
                onClick={() => switchRole('manager')}
                className={`px-2 py-1 rounded-lg font-semibold transition text-xs ${
                  user.role === 'manager'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                👔 Manager
              </button>
              <button
                onClick={() => switchRole('employee')}
                className={`px-2 py-1 rounded-lg font-semibold transition text-xs ${
                  user.role === 'employee'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                💼 Employee
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
