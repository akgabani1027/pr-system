import React from 'react';
import { Search, RotateCcw, Filter } from 'lucide-react';

export const FilterBar = ({
  search,
  setSearch,
  status,
  setStatus,
  department,
  setDepartment,
  category,
  setCategory,
  priority,
  setPriority,
  onReset
}) => {
  const departments = ['Engineering', 'Design', 'Product', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations'];
  const categories = ['IT Equipment', 'Software & Subscriptions', 'Office Supplies', 'Consulting & Services', 'Marketing & Events', 'Travel & Expense', 'Operations', 'Other'];
  const statuses = [
    'Draft',
    'Pending Manager Approval',
    'Pending Admin Approval',
    'Approved',
    'Rejected',
    'Cancelled'
  ];
  const priorities = ['Low', 'Medium', 'High', 'Urgent'];

  const hasActiveFilters = search || status || department || category || priority;

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search */}
        <div className="relative lg:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, PR #, requester, vendor..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-slate-50/50"
          />
        </div>

        {/* Status Dropdown */}
        <div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full py-2 px-3 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-slate-50/50 text-slate-700"
          >
            <option value="">All Statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Department Dropdown */}
        <div>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full py-2 px-3 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-slate-50/50 text-slate-700"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Priority Dropdown */}
        <div>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full py-2 px-3 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-slate-50/50 text-slate-700"
          >
            <option value="">All Priorities</option>
            {priorities.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span>Filter PR records across MongoDB</span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline"
          >
            <RotateCcw className="w-3 h-3" />
            Clear All Filters
          </button>
        )}
      </div>
    </div>
  );
};
