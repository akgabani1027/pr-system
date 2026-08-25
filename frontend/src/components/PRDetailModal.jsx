import React, { useState } from 'react';
import { prAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ApprovalTimeline } from './ApprovalTimeline';
import { 
  X, 
  CheckCircle, 
  XCircle, 
  Send, 
  MessageSquare, 
  FileText, 
  Paperclip, 
  Building, 
  Calendar, 
  User,
  DollarSign,
  AlertCircle
} from 'lucide-react';

export const PRDetailModal = ({ pr, isOpen, onClose, onUpdate }) => {
  const { user } = useAuth();
  const [actionLoading, setActionLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [actionComment, setActionComment] = useState('');
  const [confirmDialog, setConfirmDialog] = useState(null); // { type: 'approve' | 'reject' | 'cancel' | 'submit' }
  const [error, setError] = useState('');

  if (!isOpen || !pr) return null;

  const isAuthor = pr.requester?.id === user?.id;
  const isManager = user?.role === 'manager' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';

  const canManagerApprove = isManager && pr.status === 'Pending Manager Approval';
  const canAdminApprove = isAdmin && pr.status === 'Pending Admin Approval';
  const canReject = (isManager && pr.status === 'Pending Manager Approval') || (isAdmin && pr.status === 'Pending Admin Approval');
  const canSubmitDraft = isAuthor && pr.status === 'Draft';
  const canCancel = isAuthor && !['Approved', 'Rejected', 'Cancelled'].includes(pr.status);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Approved</span>;
      case 'Pending Manager Approval':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">Pending Manager Review</span>;
      case 'Pending Admin Approval':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">Pending Admin Sign-Off</span>;
      case 'Rejected':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">Rejected</span>;
      case 'Cancelled':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">Draft</span>;
    }
  };

  const handlePerformAction = async (actionType) => {
    setError('');
    try {
      setActionLoading(true);
      const res = await prAPI.action(pr.id, {
        action: actionType,
        comment: actionComment
      });
      onUpdate(res.data);
      setConfirmDialog(null);
      setActionComment('');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to process requisition action.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      setActionLoading(true);
      const res = await prAPI.addComment(pr.id, { comment: commentText });
      onUpdate(res.data);
      setCommentText('');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to add comment.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border border-slate-100 animate-fade-in my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                {pr.pr_number}
              </span>
              {getStatusBadge(pr.status)}
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                {pr.priority} Priority
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">{pr.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Requester</span>
              <span className="font-semibold text-slate-800">{pr.requester?.name}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Department</span>
              <span className="font-semibold text-slate-800">{pr.department}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Category</span>
              <span className="font-semibold text-slate-800">{pr.category}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Total Amount</span>
              <span className="font-bold text-brand-700 text-sm">
                ${pr.estimated_total_cost?.toLocaleString('en-US', { minimumFractionDigits: 2 })} {pr.currency}
              </span>
            </div>
          </div>

          {/* Description & Vendor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl border border-slate-100 bg-white shadow-sm space-y-1">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Description & Scope</span>
              <p className="text-slate-600 text-xs leading-relaxed">{pr.description || 'No description provided.'}</p>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-100 bg-white shadow-sm space-y-1">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Business Justification</span>
              <p className="text-slate-600 text-xs leading-relaxed">{pr.justification || 'Standard departmental procurement.'}</p>
              {pr.vendor_name && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-slate-400">Supplier / Vendor:</span>
                  <span className="font-semibold text-slate-700">{pr.vendor_name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">Requisition Line Items</h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Total Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pr.items?.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800">{item.item_name}</div>
                        {item.specification && (
                          <div className="text-[11px] text-slate-400">{item.specification}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-medium">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-right text-slate-600">${item.unit_price?.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">${item.total_price?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50/80 font-bold border-t border-slate-200">
                  <tr>
                    <td colSpan="3" className="py-2.5 px-3 text-right text-slate-700">Requisition Grand Total:</td>
                    <td className="py-2.5 px-3 text-right text-brand-700 text-sm">
                      ${pr.estimated_total_cost?.toFixed(2)} {pr.currency}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Workflow & Approval Timeline */}
          <div className="border-t border-slate-200 pt-4">
            <h3 className="text-sm font-bold text-slate-900 mb-2">Multi-Tier Approval Progress</h3>
            <ApprovalTimeline pr={pr} />
          </div>

          {/* Attachments */}
          {pr.attachments && pr.attachments.length > 0 && (
            <div className="border-t border-slate-200 pt-4">
              <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-slate-400" />
                Attached Documents
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {pr.attachments.map((att, idx) => (
                  <a
                    key={idx}
                    href={att.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-100 transition text-xs"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="w-4 h-4 text-brand-600 flex-shrink-0" />
                      <span className="font-medium text-slate-700 truncate">{att.file_name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 uppercase">View</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Activity Log / Discussion Thread */}
          <div className="border-t border-slate-200 pt-4 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-slate-400" />
              Activity & Audit Trail
            </h3>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {pr.activities?.map((act) => (
                <div key={act.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 text-xs">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-slate-800">{act.user_name} ({act.user_role})</span>
                    <span className="text-[10px] text-slate-400">{new Date(act.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="text-slate-600">
                    <span className="font-semibold text-brand-700">{act.action}: </span>
                    {act.comment}
                  </div>
                </div>
              ))}
            </div>

            {/* Post comment */}
            <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
              <input
                type="text"
                placeholder="Post a note or audit comment to this PR..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500"
              />
              <button
                type="submit"
                disabled={actionLoading || !commentText.trim()}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold disabled:opacity-40 transition flex items-center gap-1"
              >
                <Send className="w-3 h-3" />
                Post
              </button>
            </form>
          </div>
        </div>

        {/* Action Confirmation Modal (Embedded) */}
        {confirmDialog && (
          <div className="p-4 bg-brand-50 border-t border-brand-200 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Confirm {confirmDialog.type.toUpperCase()}
              </span>
              <button onClick={() => setConfirmDialog(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              rows={2}
              placeholder={confirmDialog.type === 'reject' ? "Please explain reason for rejection..." : "Add optional review comments..."}
              value={actionComment}
              onChange={(e) => setActionComment(e.target.value)}
              className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-brand-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handlePerformAction(confirmDialog.type)}
                disabled={actionLoading}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold text-white shadow-sm transition ${
                  confirmDialog.type === 'reject' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {actionLoading ? 'Processing...' : `Confirm ${confirmDialog.type}`}
              </button>
            </div>
          </div>
        )}

        {/* Sticky Actions Footer */}
        {!confirmDialog && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/80">
            <div className="flex items-center gap-2">
              {canCancel && (
                <button
                  type="button"
                  onClick={() => setConfirmDialog({ type: 'cancel' })}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition"
                >
                  Cancel Requisition
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {canSubmitDraft && (
                <button
                  type="button"
                  onClick={() => setConfirmDialog({ type: 'submit' })}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 transition"
                >
                  Submit for Approval
                </button>
              )}

              {canReject && (
                <button
                  type="button"
                  onClick={() => setConfirmDialog({ type: 'reject' })}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-100 hover:bg-rose-200 border border-rose-300 transition flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Reject Requisition
                </button>
              )}

              {canManagerApprove && (
                <button
                  type="button"
                  onClick={() => setConfirmDialog({ type: 'approve' })}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Manager Approve (Tier 1)
                </button>
              )}

              {canAdminApprove && (
                <button
                  type="button"
                  onClick={() => setConfirmDialog({ type: 'approve' })}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-600/20 transition flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Grant Final Admin Sign-Off
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
