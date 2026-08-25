import React, { useState, useEffect } from 'react';
import { prAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FilterBar } from '../components/FilterBar';
import { 
  Plus, 
  FileText, 
  Trash2, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  ArrowUpDown
} from 'lucide-react';

export const PRsPage = ({ onSelectPR, onOpenNewPR }) => {
  const { user } = useAuth();
  const [prs, setPRs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [limit] = useState(10);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'my' | 'drafts'

  // Filter states
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [department, setDepartment] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  const [loading, setLoading] = useState(true);

  const fetchPRs = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        sort_by: sortBy,
        sort_order: sortOrder,
        ...(search && { search }),
        ...(status && { status }),
        ...(department && { department }),
        ...(category && { category }),
        ...(priority && { priority }),
        ...(activeTab === 'my' && { my_prs: true }),
        ...(activeTab === 'drafts' && { status: 'Draft', my_prs: true }),
      };

      const res = await prAPI.list(params);
      setPRs(res.data.prs || []);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || 1);
    } catch (err) {
      console.error("Failed to fetch PRs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPRs();
  }, [page, activeTab, status, department, category, priority, sortBy, sortOrder]);

  // Debounced search trigger
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchPRs();
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const handleResetFilters = () => {
    setSearch('');
    setStatus('');
    setDepartment('');
    setCategory('');
    setPriority('');
    setPage(1);
  };

  const handleDeleteDraft = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this draft?")) return;
    try {
      await prAPI.delete(id);
      fetchPRs();
    } catch (err) {
      alert("Failed to delete requisition.");
    }
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'Approved':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Approved</span>;
      case 'Pending Manager Approval':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">Pending Mgr</span>;
      case 'Pending Admin Approval':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">Pending Admin</span>;
      case 'Rejected':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">Rejected</span>;
      case 'Cancelled':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">Draft</span>;
    }
  };

  const getPriorityBadge = (prio) => {
    switch (prio) {
      case 'Urgent':
        return <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-800">Urgent</span>;
      case 'High':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800">High</span>;
      case 'Medium':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800">Medium</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">Low</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Purchase Requisitions</h1>
          <p className="text-xs text-slate-500 mt-0.5">Search, monitor and manage organizational procurement workflows.</p>
        </div>
        <button
          onClick={onOpenNewPR}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-500/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Requisition
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold">
        <button
          onClick={() => { setActiveTab('all'); setPage(1); }}
          className={`pb-3 transition ${
            activeTab === 'all'
              ? 'border-b-2 border-brand-600 text-brand-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          All Requisitions
        </button>
        <button
          onClick={() => { setActiveTab('my'); setPage(1); }}
          className={`pb-3 transition ${
            activeTab === 'my'
              ? 'border-b-2 border-brand-600 text-brand-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          My Submissions
        </button>
        <button
          onClick={() => { setActiveTab('drafts'); setPage(1); }}
          className={`pb-3 transition ${
            activeTab === 'drafts'
              ? 'border-b-2 border-brand-600 text-brand-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Drafts
        </button>
      </div>

      {/* Filter Bar */}
      <FilterBar
        search={search}
        setSearch={setSearch}
        status={status}
        setStatus={setStatus}
        department={department}
        setDepartment={setDepartment}
        category={category}
        setCategory={setCategory}
        priority={priority}
        setPriority={setPriority}
        onReset={handleResetFilters}
      />

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-slate-500">
            <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading requisitions from MongoDB...
          </div>
        ) : prs.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-500 space-y-2">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">No purchase requisitions found.</p>
            <p className="text-xs text-slate-400">Try adjusting your filters or create a new requisition.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">PR # / Title</th>
                  <th className="py-3 px-4">Requester</th>
                  <th className="py-3 px-4">Department & Category</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4 text-right">Estimated Spend</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {prs.map((pr) => {
                  const isAuthor = pr.requester?.id === user?.id;
                  const isDraft = pr.status === 'Draft';
                  return (
                    <tr
                      key={pr.id}
                      onClick={() => onSelectPR(pr)}
                      className="hover:bg-slate-50/60 cursor-pointer transition"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-[11px] text-brand-600 font-bold">{pr.pr_number}</div>
                        <div className="font-semibold text-slate-900 truncate max-w-xs">{pr.title}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(pr.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        <div className="font-medium">{pr.requester?.name}</div>
                        <div className="text-[10px] text-slate-400">{pr.requester?.email}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="font-medium text-slate-800">{pr.department}</span>
                        <div className="text-[10px] text-slate-400">{pr.category}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        {getPriorityBadge(pr.priority)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-bold text-slate-900 text-xs">
                          ${pr.estimated_total_cost?.toFixed(2)} {pr.currency}
                        </div>
                        <div className="text-[10px] text-slate-400">{pr.items?.length || 0} line items</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {getStatusBadge(pr.status)}
                      </td>
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectPR(pr)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition"
                            title="Inspect Requisition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {isDraft && isAuthor && (
                            <button
                              onClick={(e) => handleDeleteDraft(pr.id, e)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Delete Draft"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
          <span>
            Showing page <span className="font-bold text-slate-800">{page}</span> of <span className="font-bold text-slate-800">{pages}</span> ({total} total requisitions)
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(Math.min(pages, page + 1))}
              disabled={page >= pages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
