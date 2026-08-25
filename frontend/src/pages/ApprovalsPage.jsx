import React, { useState, useEffect } from 'react';
import { prAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, XCircle, Clock, ShieldCheck, ArrowRight, Eye, AlertCircle } from 'lucide-react';

export const ApprovalsPage = ({ onSelectPR }) => {
  const { user } = useAuth();
  const [prs, setPRs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const res = await prAPI.list({
        awaiting_my_approval: true,
        limit: 50
      });
      setPRs(res.data.prs || []);
    } catch (err) {
      console.error("Failed to load approvals queue:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const isManager = user?.role === 'manager';
  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-amber-900/90 via-orange-900/90 to-slate-900 rounded-2xl text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-amber-400/20 border border-amber-400/30 text-amber-300">
              {isAdmin ? 'Tier 2: Final Authorization' : 'Tier 1: Department Manager Review'}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight mt-1">Pending Approvals Queue</h1>
          <p className="text-xs text-slate-300 mt-1">
            You have <span className="font-bold text-amber-300">{prs.length}</span> requisition{prs.length !== 1 ? 's' : ''} awaiting your review and authorization.
          </p>
        </div>
      </div>

      {/* Requisitions List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center text-sm text-slate-500 bg-white rounded-2xl border border-slate-200">
            <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading pending queue...
          </div>
        ) : prs.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-500 bg-white rounded-2xl border border-slate-200 space-y-2">
            <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto" />
            <p className="font-bold text-slate-800 text-base">All Caught Up!</p>
            <p className="text-xs text-slate-400">There are no requisitions currently awaiting your approval.</p>
          </div>
        ) : (
          prs.map((pr) => (
            <div
              key={pr.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow transition space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                    {pr.pr_number}
                  </span>
                  <span className="font-bold text-slate-900 text-sm">{pr.title}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                    {pr.status}
                  </span>
                </div>
                <div className="text-xs font-bold text-brand-700">
                  ${pr.estimated_total_cost?.toFixed(2)} {pr.currency}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Requester</span>
                  <span className="font-semibold text-slate-800">{pr.requester?.name}</span> ({pr.department})
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Category & Priority</span>
                  <span className="font-semibold text-slate-800">{pr.category}</span> • <span className="font-semibold text-amber-600">{pr.priority}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Supplier / Vendor</span>
                  <span className="font-semibold text-slate-800">{pr.vendor_name || 'Not specified'}</span>
                </div>
              </div>

              {pr.description && (
                <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  {pr.description}
                </p>
              )}

              {/* Line items mini preview */}
              <div className="text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Items ({pr.items?.length || 0}): </span>
                {pr.items?.map(it => `${it.quantity}x ${it.item_name}`).join(', ')}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => onSelectPR(pr)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 transition flex items-center gap-1.5"
                >
                  <Eye className="w-4 h-4" />
                  Inspect & Take Action
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
