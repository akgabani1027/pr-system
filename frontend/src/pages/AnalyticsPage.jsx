import React, { useState, useEffect } from 'react';
import { analyticsAPI, prAPI } from '../services/api';
import { StatCard } from '../components/StatCard';
import { 
  BarChart3, 
  Download, 
  TrendingUp, 
  DollarSign, 
  Layers, 
  PieChart,
  Building,
  CheckCircle2
} from 'lucide-react';

export const AnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await analyticsAPI.getDashboard();
        setData(res.data);
      } catch (err) {
        console.error("Failed to load analytics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const handleExportCSV = async () => {
    try {
      const res = await prAPI.list({ limit: 1000 });
      const allPRs = res.data.prs || [];
      
      const headers = ["PR Number", "Title", "Requester", "Department", "Category", "Priority", "Status", "Total Spend ($)", "Created At"];
      const rows = allPRs.map(p => [
        `"${p.pr_number}"`,
        `"${p.title.replace(/"/g, '""')}"`,
        `"${p.requester?.name || ''}"`,
        `"${p.department}"`,
        `"${p.category}"`,
        `"${p.priority}"`,
        `"${p.status}"`,
        p.estimated_total_cost,
        `"${new Date(p.created_at).toLocaleDateString()}"`
      ]);

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `pr_procurement_report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert("Failed to export CSV report.");
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-96 text-sm text-slate-500">
        <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mr-2"></div>
        Generating procurement analytics & reports...
      </div>
    );
  }

  const { summary, departments, categories, status_distribution } = data;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Procurement & Spend Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">Comprehensive departmental spend and requisition performance metrics.</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-sm transition"
        >
          <Download className="w-4 h-4 text-slate-500" />
          Export CSV Report
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Requisition Value"
          value={`$${summary.total_requested_spend?.toLocaleString()}`}
          subtitle="Across all submitted PRs"
          icon={DollarSign}
          color="indigo"
        />
        <StatCard
          title="Authorized & PO Released"
          value={`$${summary.total_approved_spend?.toLocaleString()}`}
          subtitle={`${summary.total_approved} Requisitions fully signed`}
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Pending Authorization Value"
          value={`$${summary.total_pending_spend?.toLocaleString()}`}
          subtitle={`${summary.total_pending} In active review queue`}
          icon={TrendingUp}
          color="amber"
        />
      </div>

      {/* Department & Category Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Building className="w-4 h-4 text-brand-600" />
              Department Breakdown
            </h3>
            <span className="text-xs text-slate-400 font-medium">{departments.length} Active Departments</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 text-slate-400 font-semibold uppercase">
                <tr>
                  <th className="pb-2">Department</th>
                  <th className="pb-2 text-center">PR Count</th>
                  <th className="pb-2 text-right">Approved Spend</th>
                  <th className="pb-2 text-right">Total Requested</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {departments.map((d) => (
                  <tr key={d.department} className="hover:bg-slate-50/50">
                    <td className="py-2.5 font-semibold text-slate-800">{d.department}</td>
                    <td className="py-2.5 text-center font-medium text-slate-600">{d.count}</td>
                    <td className="py-2.5 text-right font-bold text-emerald-600">${d.approved_spend?.toLocaleString()}</td>
                    <td className="py-2.5 text-right font-bold text-slate-900">${d.total_spend?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-brand-600" />
              Procurement Categories
            </h3>
            <span className="text-xs text-slate-400 font-medium">{categories.length} Categories</span>
          </div>

          <div className="space-y-3">
            {categories.map((c) => {
              const maxSpend = Math.max(...categories.map(cat => cat.total_spend), 1);
              const pct = Math.round((c.total_spend / maxSpend) * 100);
              return (
                <div key={c.category} className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-700">
                    <span className="font-semibold">{c.category} ({c.count} PRs)</span>
                    <span className="font-bold text-slate-900">${c.total_spend?.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
