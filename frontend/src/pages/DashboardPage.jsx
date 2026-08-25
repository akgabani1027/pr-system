import React, { useState, useEffect } from 'react';
import { analyticsAPI, prAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/StatCard';
import { 
  FileSpreadsheet, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  DollarSign, 
  TrendingUp, 
  ArrowRight,
  Activity,
  Layers
} from 'lucide-react';

export const DashboardPage = ({ onSelectPR, onNavigatePRs, onNavigateApprovals, onOpenNewPR }) => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [recentPRs, setRecentPRs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, prsRes] = await Promise.all([
        analyticsAPI.getDashboard(),
        prAPI.list({ limit: 5, sort_by: 'created_at', sort_order: 'desc' })
      ]);
      setData(analyticsRes.data);
      setRecentPRs(prsRes.data.prs || []);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading PR Dashboard analytics...</span>
        </div>
      </div>
    );
  }

  const { summary, status_distribution, departments, recent_activities } = data;
  const isApprover = user?.role === 'manager' || user?.role === 'admin';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-brand-900 via-indigo-900 to-slate-900 rounded-2xl text-white shadow-lg">
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-brand-300">Welcome Back</span>
          <h1 className="text-2xl font-extrabold tracking-tight mt-0.5">{user?.name}</h1>
          <p className="text-xs text-slate-300 mt-1">
            Department: <span className="font-semibold text-white">{user?.department}</span> • Role: <span className="font-semibold text-white capitalize">{user?.role}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenNewPR}
            className="px-4 py-2 bg-brand-500 hover:bg-brand-400 text-white rounded-xl text-xs font-semibold shadow-md transition"
          >
            + Create New Requisition
          </button>
          {isApprover && summary.total_pending > 0 && (
            <button
              onClick={onNavigateApprovals}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-semibold backdrop-blur transition"
            >
              Review Pending ({summary.total_pending})
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Requisitions"
          value={summary.total_prs}
          subtitle={`$${summary.total_requested_spend?.toLocaleString()} total requested`}
          icon={FileSpreadsheet}
          color="indigo"
        />
        <StatCard
          title="Pending Approvals"
          value={summary.total_pending}
          subtitle={`${summary.pending_manager_approval} at Mgr, ${summary.pending_admin_approval} at Admin`}
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Approved Spend"
          value={`$${summary.total_approved_spend?.toLocaleString()}`}
          subtitle={`${summary.total_approved} Requisitions finalized`}
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Rejected / Cancelled"
          value={summary.total_rejected}
          subtitle="Requests declined or withdrawn"
          icon={XCircle}
          color="rose"
        />
      </div>

      {/* Status & Department Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Workflow Status Breakdown</h3>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-2.5 text-xs">
            {Object.entries(status_distribution).map(([st, count]) => {
              const total = summary.total_prs || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={st} className="space-y-1">
                  <div className="flex justify-between text-slate-600">
                    <span className="font-medium truncate max-w-[200px]">{st}</span>
                    <span className="font-bold text-slate-900">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        st === 'Approved' ? 'bg-emerald-500' :
                        st.includes('Pending') ? 'bg-amber-500' :
                        st === 'Rejected' ? 'bg-rose-500' : 'bg-slate-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Department Budgets */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Department Procurement Spend</h3>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {departments.slice(0, 4).map((dept) => (
              <div key={dept.department} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800 text-xs">{dept.department}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-brand-50 text-brand-700">
                    {dept.count} PRs
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-slate-400">Total Spend:</span>
                  <span className="font-bold text-slate-900">${dept.total_spend?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-slate-400">Approved POs:</span>
                  <span className="font-bold text-emerald-600">${dept.approved_spend?.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent PRs & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent PRs Table */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Latest Purchase Requisitions</h3>
            <button
              onClick={onNavigatePRs}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 text-slate-400 font-semibold uppercase">
                <tr>
                  <th className="pb-2">PR # / Title</th>
                  <th className="pb-2">Requester</th>
                  <th className="pb-2 text-right">Amount</th>
                  <th className="pb-2 text-center">Status</th>
                  <th className="pb-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentPRs.map((pr) => (
                  <tr key={pr.id} className="hover:bg-slate-50/50">
                    <td className="py-3">
                      <div className="font-mono text-[11px] text-brand-600 font-bold">{pr.pr_number}</div>
                      <div className="font-semibold text-slate-800 truncate max-w-[200px]">{pr.title}</div>
                    </td>
                    <td className="py-3 text-slate-600">
                      <div>{pr.requester?.name}</div>
                      <div className="text-[10px] text-slate-400">{pr.department}</div>
                    </td>
                    <td className="py-3 text-right font-bold text-slate-900">
                      ${pr.estimated_total_cost?.toFixed(2)}
                    </td>
                    <td className="py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        pr.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                        pr.status.includes('Pending') ? 'bg-amber-100 text-amber-800' :
                        pr.status === 'Rejected' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {pr.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => onSelectPR(pr)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 transition"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-slate-400" />
              Live Activity Audit
            </h3>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {recent_activities.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No recent activity logged.</p>
            ) : (
              recent_activities.map((act) => (
                <div key={act.id} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{act.user_name}</span>
                    <span className="text-[10px] text-slate-400">{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="text-slate-600 text-[11px]">
                    <span className="font-semibold text-brand-600">{act.action}</span> on <span className="font-mono font-bold text-slate-700">{act.pr_number}</span>
                  </div>
                  {act.comment && (
                    <p className="text-[11px] text-slate-500 italic">"{act.comment}"</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
