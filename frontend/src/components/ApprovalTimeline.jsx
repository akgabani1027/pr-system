import React from 'react';
import { CheckCircle2, Clock, XCircle, CircleDot } from 'lucide-react';

export const ApprovalTimeline = ({ pr }) => {
  const isDraft = pr.status === 'Draft';
  const isPendingManager = pr.status === 'Pending Manager Approval';
  const isPendingAdmin = pr.status === 'Pending Admin Approval';
  const isApproved = pr.status === 'Approved';
  const isRejected = pr.status === 'Rejected';
  const isCancelled = pr.status === 'Cancelled';

  const steps = [
    {
      title: 'Requisition Submitted',
      description: `By ${pr.requester?.name || 'Requester'} (${pr.requester?.department || ''})`,
      time: pr.created_at ? new Date(pr.created_at).toLocaleString() : '',
      state: isDraft ? 'current' : 'complete',
    },
    {
      title: 'Tier 1: Department Manager Review',
      description: pr.manager_approval 
        ? `Approved by ${pr.manager_approval.user_name}` 
        : isPendingManager 
          ? 'Awaiting review from Department Manager'
          : isRejected && !pr.manager_approval
            ? 'Rejected by Manager'
            : isDraft ? 'Waiting for submission' : 'Pending',
      time: pr.manager_approval?.timestamp ? new Date(pr.manager_approval.timestamp).toLocaleString() : '',
      note: pr.manager_approval?.comment,
      state: pr.manager_approval 
        ? 'complete' 
        : isPendingManager 
          ? 'current' 
          : isRejected && !pr.manager_approval ? 'rejected' : 'upcoming'
    },
    {
      title: 'Tier 2: Admin Sign-Off & PO Release',
      description: pr.admin_approval 
        ? `Authorized by ${pr.admin_approval.user_name}` 
        : isPendingAdmin 
          ? 'Awaiting Final Admin Sign-Off & Budget Check'
          : isRejected && pr.manager_approval
            ? 'Rejected by Admin'
            : isApproved ? 'Authorized' : 'Pending Tier 1',
      time: pr.admin_approval?.timestamp ? new Date(pr.admin_approval.timestamp).toLocaleString() : '',
      note: pr.admin_approval?.comment || (isRejected ? pr.rejection_reason : null),
      state: isApproved 
        ? 'complete' 
        : isPendingAdmin 
          ? 'current' 
          : isRejected && pr.manager_approval ? 'rejected' : 'upcoming'
    }
  ];

  const getIcon = (state) => {
    switch (state) {
      case 'complete':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600 bg-white" />;
      case 'current':
        return <Clock className="w-5 h-5 text-amber-500 bg-white animate-pulse" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-rose-600 bg-white" />;
      default:
        return <CircleDot className="w-5 h-5 text-slate-300 bg-white" />;
    }
  };

  return (
    <div className="py-4">
      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {steps.map((step, idx) => (
          <div key={idx} className="relative group">
            <div className="absolute -left-6 top-0.5 flex items-center justify-center">
              {getIcon(step.state)}
            </div>
            <div>
              <div className="flex items-baseline justify-between gap-2">
                <h4 className={`text-sm font-semibold ${
                  step.state === 'complete' ? 'text-slate-900' :
                  step.state === 'current' ? 'text-amber-700 font-bold' :
                  step.state === 'rejected' ? 'text-rose-700 font-bold' : 'text-slate-400'
                }`}>
                  {step.title}
                </h4>
                {step.time && (
                  <span className="text-[11px] text-slate-400">{step.time}</span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{step.description}</p>
              {step.note && (
                <div className={`mt-2 p-2 rounded-lg text-xs border ${
                  step.state === 'rejected' 
                    ? 'bg-rose-50 border-rose-200 text-rose-800' 
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                  <span className="font-semibold">{step.state === 'rejected' ? 'Rejection Reason: ' : 'Review Note: '}</span>
                  {step.note}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
