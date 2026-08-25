import axios from 'axios';

// Check if running on GitHub Pages (static standalone mode)
const isGitHubPages = typeof window !== 'undefined' && (
  window.location.hostname.includes('github.io') ||
  window.location.hostname.includes('pages.dev') ||
  window.location.hostname.includes('vercel.app') ||
  window.location.hostname.includes('netlify.app')
);

const API_BASE_URL = import.meta.env.VITE_API_URL || (isGitHubPages ? '' : '/api');

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 4000,
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('pr_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// -------------------------------------------------------------
// IN-BROWSER PERSISTENCE ENGINE (FOR GITHUB PAGES LIVE HOSTING)
// -------------------------------------------------------------
const STORAGE_KEYS = {
  USERS: 'pr_mock_users_db',
  PRS: 'pr_mock_prs_db',
  ACTIVITIES: 'pr_mock_activities_db',
};

const DEFAULT_USERS = [
  {
    id: 'usr-admin-1',
    name: 'Sarah Connor (Admin)',
    email: 'admin@prsystem.com',
    department: 'Executive / Operations',
    role: 'admin',
    password: 'password123',
    is_active: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString()
  },
  {
    id: 'usr-manager-1',
    name: 'Alex Rivera (Manager)',
    email: 'manager@prsystem.com',
    department: 'Engineering',
    role: 'manager',
    password: 'password123',
    is_active: true,
    created_at: new Date(Date.now() - 25 * 86400000).toISOString()
  },
  {
    id: 'usr-employee-1',
    name: 'Jordan Lee (Employee)',
    email: 'employee@prsystem.com',
    department: 'Engineering',
    role: 'employee',
    password: 'password123',
    is_active: true,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString()
  }
];

const DEFAULT_PRS = [
  {
    id: 'pr-001',
    pr_number: 'PR-2026-0001',
    title: 'High-Performance Developer Workstations',
    description: 'Procure 3x Apple MacBook Pro M3 Max for the core platform backend and AI engineering team.',
    department: 'Engineering',
    category: 'IT Equipment',
    priority: 'High',
    currency: 'USD',
    items: [
      {
        item_name: 'MacBook Pro 16" M3 Max 64GB 1TB',
        quantity: 3,
        unit_price: 3499.00,
        total_price: 10497.00,
        specification: 'Space Black, 16-core CPU, 40-core GPU, AppleCare+'
      },
      {
        item_name: 'Dell UltraSharp 32" 4K Thunderbolt Monitors',
        quantity: 3,
        unit_price: 899.00,
        total_price: 2697.00,
        specification: 'U3223QE 4K USB-C Hub Monitor'
      }
    ],
    estimated_total_cost: 13194.00,
    justification: 'Required for compiling heavy local microservices and local LLM execution.',
    vendor_name: 'Apple Enterprise Direct & B&H',
    required_by_date: '2026-09-15',
    status: 'Pending Admin Approval',
    requester: {
      id: 'usr-employee-1',
      name: 'Jordan Lee (Employee)',
      email: 'employee@prsystem.com',
      department: 'Engineering',
      role: 'employee'
    },
    manager_approval: {
      user_id: 'usr-manager-1',
      user_name: 'Alex Rivera (Manager)',
      user_role: 'manager',
      timestamp: new Date(Date.now() - 1 * 86400000).toISOString(),
      comment: 'Approved at department level. Hardware specs verified for Q3 deliverables.'
    },
    admin_approval: null,
    rejection_reason: null,
    attachments: [
      {
        file_name: 'hardware_quote_apple.pdf',
        file_url: '#',
        file_size: 245760,
        uploaded_at: new Date(Date.now() - 2 * 86400000).toISOString()
      }
    ],
    activities: [
      {
        id: 'act-1',
        user_id: 'usr-employee-1',
        user_name: 'Jordan Lee (Employee)',
        user_role: 'employee',
        action: 'Submitted Requisition',
        comment: 'Initial submission for team hardware upgrade.',
        timestamp: new Date(Date.now() - 2 * 86400000).toISOString()
      },
      {
        id: 'act-2',
        user_id: 'usr-manager-1',
        user_name: 'Alex Rivera (Manager)',
        user_role: 'manager',
        action: 'Manager Approved (Tier 1)',
        comment: 'Department level approved. Forwarded to Admin for budget release.',
        timestamp: new Date(Date.now() - 1 * 86400000).toISOString()
      }
    ],
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString()
  },
  {
    id: 'pr-002',
    pr_number: 'PR-2026-0002',
    title: 'Annual Figma & Cloud Tooling Subscriptions',
    description: 'Annual enterprise license renewal for Figma Org and GitHub Enterprise seats.',
    department: 'Design',
    category: 'Software & Subscriptions',
    priority: 'Medium',
    currency: 'USD',
    items: [
      {
        item_name: 'Figma Enterprise Tier (Annual)',
        quantity: 12,
        unit_price: 900.00,
        total_price: 10800.00,
        specification: '12 editor seats for UX/UI designers and front-end leads'
      }
    ],
    estimated_total_cost: 10800.00,
    justification: 'Core tool for design system and product prototyping.',
    vendor_name: 'Figma Inc.',
    required_by_date: '2026-09-01',
    status: 'Approved',
    requester: {
      id: 'usr-employee-1',
      name: 'Jordan Lee (Employee)',
      email: 'employee@prsystem.com',
      department: 'Engineering',
      role: 'employee'
    },
    manager_approval: {
      user_id: 'usr-manager-1',
      user_name: 'Alex Rivera (Manager)',
      user_role: 'manager',
      timestamp: new Date(Date.now() - 5 * 86400000).toISOString(),
      comment: 'Design team software verified.'
    },
    admin_approval: {
      user_id: 'usr-admin-1',
      user_name: 'Sarah Connor (Admin)',
      timestamp: new Date(Date.now() - 4 * 86400000).toISOString(),
      comment: 'Finance budget approved and PO issued.'
    },
    rejection_reason: null,
    attachments: [],
    activities: [
      {
        id: 'act-3',
        user_id: 'usr-employee-1',
        user_name: 'Jordan Lee (Employee)',
        user_role: 'employee',
        action: 'Submitted Requisition',
        comment: 'Annual renewal submitted.',
        timestamp: new Date(Date.now() - 6 * 86400000).toISOString()
      },
      {
        id: 'act-4',
        user_id: 'usr-admin-1',
        user_name: 'Sarah Connor (Admin)',
        user_role: 'admin',
        action: 'Final Admin Approval Granted',
        comment: 'PO Issued #9941',
        timestamp: new Date(Date.now() - 4 * 86400000).toISOString()
      }
    ],
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 86400000).toISOString()
  },
  {
    id: 'pr-003',
    pr_number: 'PR-2026-0003',
    title: 'Ergonomic Office Chairs & Standing Desks',
    description: 'Ergonomic setup renewal for the team floor in Building B.',
    department: 'Operations',
    category: 'Office Supplies',
    priority: 'Low',
    currency: 'USD',
    items: [
      {
        item_name: 'Herman Miller Aeron Chair',
        quantity: 5,
        unit_price: 1250.00,
        total_price: 6250.00,
        specification: 'Size B, Fully adjustable arms and Lumbar Support'
      }
    ],
    estimated_total_cost: 6250.00,
    justification: 'Workplace health and ergonomic standards compliance.',
    vendor_name: 'Herman Miller Commercial',
    required_by_date: '2026-09-30',
    status: 'Pending Manager Approval',
    requester: {
      id: 'usr-employee-1',
      name: 'Jordan Lee (Employee)',
      email: 'employee@prsystem.com',
      department: 'Engineering',
      role: 'employee'
    },
    manager_approval: null,
    admin_approval: null,
    rejection_reason: null,
    attachments: [],
    activities: [
      {
        id: 'act-5',
        user_id: 'usr-employee-1',
        user_name: 'Jordan Lee (Employee)',
        user_role: 'employee',
        action: 'Submitted Requisition',
        comment: 'Requisition submitted for new team seating.',
        timestamp: new Date(Date.now() - 8 * 3600000).toISOString()
      }
    ],
    created_at: new Date(Date.now() - 8 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 8 * 3600000).toISOString()
  }
];

function getStoredUsers() {
  const data = localStorage.getItem(STORAGE_KEYS.USERS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  }
  return JSON.parse(data);
}

function getStoredPRs() {
  const data = localStorage.getItem(STORAGE_KEYS.PRS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.PRS, JSON.stringify(DEFAULT_PRS));
    return DEFAULT_PRS;
  }
  return JSON.parse(data);
}

function savePRs(prs) {
  localStorage.setItem(STORAGE_KEYS.PRS, JSON.stringify(prs));
}

function getCurrentUserFromToken() {
  const token = localStorage.getItem('pr_auth_token');
  if (!token) return null;
  const users = getStoredUsers();
  return users.find(u => u.id === token || u.email === token) || users[2];
}

// -------------------------------------------------------------
// UNIFIED CLIENT WITH AUTOMATIC LOCALSTORAGE FALLBACK
// -------------------------------------------------------------

export const authAPI = {
  login: async (credentials) => {
    if (!isGitHubPages) {
      try {
        return await axiosInstance.post('/auth/login', credentials);
      } catch (e) {
        console.warn("Backend server not responding. Falling back to in-browser storage.");
      }
    }
    const users = getStoredUsers();
    const user = users.find(
      u => u.email.toLowerCase() === credentials.email.toLowerCase() && u.password === credentials.password
    );
    if (!user) {
      throw { response: { data: { detail: 'Invalid email or password' } } };
    }
    const token = user.id;
    return { data: { access_token: token, token_type: 'bearer', user } };
  },

  register: async (data) => {
    if (!isGitHubPages) {
      try {
        return await axiosInstance.post('/auth/register', data);
      } catch (e) {
        console.warn("Backend server not responding. Falling back to in-browser storage.");
      }
    }
    const users = getStoredUsers();
    if (users.some(u => u.email.toLowerCase() === data.email.toLowerCase())) {
      throw { response: { data: { detail: 'User with this email already exists' } } };
    }
    const newUser = {
      id: 'usr-' + Date.now(),
      name: data.name,
      email: data.email.toLowerCase(),
      department: data.department,
      role: data.role,
      password: data.password,
      is_active: true,
      created_at: new Date().toISOString()
    };
    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return { data: { access_token: newUser.id, token_type: 'bearer', user: newUser } };
  },

  getMe: async () => {
    if (!isGitHubPages) {
      try {
        return await axiosInstance.get('/auth/me');
      } catch (e) {
        console.warn("Backend server not responding. Falling back to in-browser storage.");
      }
    }
    const user = getCurrentUserFromToken();
    if (!user) throw { response: { status: 401 } };
    return { data: user };
  }
};

export const prAPI = {
  list: async (params = {}) => {
    if (!isGitHubPages) {
      try {
        return await axiosInstance.get('/prs', { params });
      } catch (e) {
        console.warn("Backend server not responding. Falling back to in-browser storage.");
      }
    }
    let prs = getStoredPRs();
    const currentUser = getCurrentUserFromToken();

    // Filters
    if (params.search) {
      const q = params.search.toLowerCase();
      prs = prs.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.pr_number.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.vendor_name && p.vendor_name.toLowerCase().includes(q)) ||
        (p.requester?.name && p.requester.name.toLowerCase().includes(q))
      );
    }
    if (params.status) {
      prs = prs.filter(p => p.status === params.status);
    }
    if (params.department) {
      prs = prs.filter(p => p.department === params.department);
    }
    if (params.category) {
      prs = prs.filter(p => p.category === params.category);
    }
    if (params.priority) {
      prs = prs.filter(p => p.priority === params.priority);
    }
    if (params.my_prs && currentUser) {
      prs = prs.filter(p => p.requester?.id === currentUser.id);
    }
    if (params.awaiting_my_approval && currentUser) {
      if (currentUser.role === 'manager') {
        prs = prs.filter(p => p.status === 'Pending Manager Approval');
      } else if (currentUser.role === 'admin') {
        prs = prs.filter(p => p.status === 'Pending Admin Approval');
      }
    }

    // Sort
    prs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const total = prs.length;
    const page = params.page || 1;
    const limit = params.limit || 10;
    const startIndex = (page - 1) * limit;
    const pagedPRs = prs.slice(startIndex, startIndex + limit);

    return {
      data: {
        prs: pagedPRs,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1
      }
    };
  },

  get: async (id) => {
    if (!isGitHubPages) {
      try {
        return await axiosInstance.get(`/prs/${id}`);
      } catch (e) {}
    }
    const prs = getStoredPRs();
    const pr = prs.find(p => p.id === id || p.pr_number === id);
    if (!pr) throw { response: { status: 404, data: { detail: 'PR not found' } } };
    return { data: pr };
  },

  create: async (data) => {
    if (!isGitHubPages) {
      try {
        return await axiosInstance.post('/prs', data);
      } catch (e) {}
    }
    const prs = getStoredPRs();
    const currentUser = getCurrentUserFromToken() || DEFAULT_USERS[2];
    const totalCost = (data.items || []).reduce((acc, it) => acc + (it.quantity * it.unit_price || 0), 0);
    const count = prs.length + 1;
    const currentYear = new Date().getFullYear();
    const prNumber = `PR-${currentYear}-${count.toString().padStart(4, '0')}`;
    const now = new Date().toISOString();

    const newPR = {
      id: 'pr-' + Date.now(),
      pr_number: prNumber,
      title: data.title,
      description: data.description || '',
      department: data.department || currentUser.department,
      category: data.category || 'General',
      priority: data.priority || 'Medium',
      currency: data.currency || 'USD',
      items: (data.items || []).map(it => ({
        ...it,
        total_price: roundTwo(it.quantity * it.unit_price)
      })),
      estimated_total_cost: roundTwo(totalCost),
      justification: data.justification || '',
      vendor_name: data.vendor_name || '',
      required_by_date: data.required_by_date || null,
      status: data.is_draft ? 'Draft' : 'Pending Manager Approval',
      requester: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        department: currentUser.department,
        role: currentUser.role
      },
      manager_approval: null,
      admin_approval: null,
      rejection_reason: null,
      attachments: [],
      activities: [
        {
          id: 'act-' + Date.now(),
          user_id: currentUser.id,
          user_name: currentUser.name,
          user_role: currentUser.role,
          action: data.is_draft ? 'Created Draft' : 'Submitted Requisition',
          comment: `Initial requisition total: $${totalCost.toFixed(2)}`,
          timestamp: now
        }
      ],
      created_at: now,
      updated_at: now
    };

    prs.unshift(newPR);
    savePRs(prs);
    return { data: newPR };
  },

  action: async (id, payload) => {
    if (!isGitHubPages) {
      try {
        return await axiosInstance.post(`/prs/${id}/action`, payload);
      } catch (e) {}
    }
    const prs = getStoredPRs();
    const pr = prs.find(p => p.id === id);
    if (!pr) throw { response: { status: 404, data: { detail: 'PR not found' } } };

    const currentUser = getCurrentUserFromToken() || DEFAULT_USERS[0];
    const { action, comment } = payload;
    const now = new Date().toISOString();

    if (action === 'submit') {
      pr.status = 'Pending Manager Approval';
      pr.activities.push({
        id: 'act-' + Date.now(),
        user_id: currentUser.id,
        user_name: currentUser.name,
        user_role: currentUser.role,
        action: 'Submitted for Approval',
        comment: comment || '',
        timestamp: now
      });
    } else if (action === 'cancel') {
      pr.status = 'Cancelled';
      pr.activities.push({
        id: 'act-' + Date.now(),
        user_id: currentUser.id,
        user_name: currentUser.name,
        user_role: currentUser.role,
        action: 'Cancelled Requisition',
        comment: comment || '',
        timestamp: now
      });
    } else if (action === 'approve') {
      if (pr.status === 'Pending Manager Approval') {
        pr.status = 'Pending Admin Approval';
        pr.manager_approval = {
          user_id: currentUser.id,
          user_name: currentUser.name,
          user_role: currentUser.role,
          timestamp: now,
          comment: comment || 'Manager approval granted'
        };
        pr.activities.push({
          id: 'act-' + Date.now(),
          user_id: currentUser.id,
          user_name: currentUser.name,
          user_role: currentUser.role,
          action: 'Manager Approved (Tier 1)',
          comment: comment || 'Approved at department level',
          timestamp: now
        });
      } else if (pr.status === 'Pending Admin Approval') {
        pr.status = 'Approved';
        pr.admin_approval = {
          user_id: currentUser.id,
          user_name: currentUser.name,
          timestamp: now,
          comment: comment || 'Final Admin PO Authorization'
        };
        pr.activities.push({
          id: 'act-' + Date.now(),
          user_id: currentUser.id,
          user_name: currentUser.name,
          user_role: currentUser.role,
          action: 'Final Admin Approval Granted',
          comment: comment || 'Authorized and PO issued',
          timestamp: now
        });
      }
    } else if (action === 'reject') {
      pr.status = 'Rejected';
      pr.rejection_reason = comment || 'Rejected without specific notes';
      pr.activities.push({
        id: 'act-' + Date.now(),
        user_id: currentUser.id,
        user_name: currentUser.name,
        user_role: currentUser.role,
        action: `Rejected by ${currentUser.role}`,
        comment: comment || '',
        timestamp: now
      });
    }

    pr.updated_at = now;
    savePRs(prs);
    return { data: pr };
  },

  addComment: async (id, data) => {
    if (!isGitHubPages) {
      try {
        return await axiosInstance.post(`/prs/${id}/comments`, data);
      } catch (e) {}
    }
    const prs = getStoredPRs();
    const pr = prs.find(p => p.id === id);
    if (!pr) throw { response: { status: 404 } };
    const currentUser = getCurrentUserFromToken() || DEFAULT_USERS[2];
    const now = new Date().toISOString();
    pr.activities.push({
      id: 'act-' + Date.now(),
      user_id: currentUser.id,
      user_name: currentUser.name,
      user_role: currentUser.role,
      action: 'Added Comment',
      comment: data.comment,
      timestamp: now
    });
    pr.updated_at = now;
    savePRs(prs);
    return { data: pr };
  },

  uploadAttachment: async (id, formData) => {
    if (!isGitHubPages) {
      try {
        return await axiosInstance.post(`/prs/${id}/attachments`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } catch (e) {}
    }
    const prs = getStoredPRs();
    const pr = prs.find(p => p.id === id);
    if (!pr) throw { response: { status: 404 } };
    const file = formData.get('file');
    const fileName = file ? file.name : 'document_attachment.pdf';
    pr.attachments.push({
      file_name: fileName,
      file_url: '#',
      file_size: file ? file.size : 102400,
      uploaded_at: new Date().toISOString()
    });
    savePRs(prs);
    return { data: pr };
  },

  delete: async (id) => {
    if (!isGitHubPages) {
      try {
        return await axiosInstance.delete(`/prs/${id}`);
      } catch (e) {}
    }
    let prs = getStoredPRs();
    prs = prs.filter(p => p.id !== id);
    savePRs(prs);
    return { data: null };
  }
};

export const analyticsAPI = {
  getDashboard: async () => {
    if (!isGitHubPages) {
      try {
        return await axiosInstance.get('/analytics/dashboard');
      } catch (e) {}
    }
    const prs = getStoredPRs();
    const currentUser = getCurrentUserFromToken();

    const statusCounts = {
      'Draft': 0,
      'Pending Manager Approval': 0,
      'Pending Admin Approval': 0,
      'Approved': 0,
      'Rejected': 0,
      'Cancelled': 0
    };

    let totalApprovedSpend = 0;
    let totalPendingSpend = 0;
    let totalRequestedSpend = 0;
    const deptStats = {};
    const catStats = {};

    prs.forEach(pr => {
      const st = pr.status || 'Draft';
      const cost = pr.estimated_total_cost || 0;
      const dept = pr.department || 'General';
      const cat = pr.category || 'General';

      statusCounts[st] = (statusCounts[st] || 0) + 1;
      totalRequestedSpend += cost;

      if (st === 'Approved') totalApprovedSpend += cost;
      if (st === 'Pending Manager Approval' || st === 'Pending Admin Approval') totalPendingSpend += cost;

      if (!deptStats[dept]) deptStats[dept] = { count: 0, total_spend: 0, approved_spend: 0 };
      deptStats[dept].count += 1;
      deptStats[dept].total_spend += cost;
      if (st === 'Approved') deptStats[dept].approved_spend += cost;

      if (!catStats[cat]) catStats[cat] = { count: 0, total_spend: 0 };
      catStats[cat].count += 1;
      catStats[cat].total_spend += cost;
    });

    const activities = [];
    prs.forEach(p => {
      (p.activities || []).forEach(a => {
        activities.push({ ...a, pr_number: p.pr_number });
      });
    });
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return {
      data: {
        summary: {
          total_prs: prs.length,
          total_approved_spend: roundTwo(totalApprovedSpend),
          total_pending_spend: roundTwo(totalPendingSpend),
          total_requested_spend: roundTwo(totalRequestedSpend),
          pending_manager_approval: statusCounts['Pending Manager Approval'] || 0,
          pending_admin_approval: statusCounts['Pending Admin Approval'] || 0,
          total_pending: (statusCounts['Pending Manager Approval'] || 0) + (statusCounts['Pending Admin Approval'] || 0),
          total_approved: statusCounts['Approved'] || 0,
          total_rejected: statusCounts['Rejected'] || 0,
          my_prs_count: currentUser ? prs.filter(p => p.requester?.id === currentUser.id).length : 0,
          my_pending_count: currentUser ? prs.filter(p => p.requester?.id === currentUser.id && p.status.includes('Pending')).length : 0
        },
        status_distribution: statusCounts,
        departments: Object.entries(deptStats).map(([k, v]) => ({
          department: k,
          count: v.count,
          total_spend: roundTwo(v.total_spend),
          approved_spend: roundTwo(v.approved_spend)
        })),
        categories: Object.entries(catStats).map(([k, v]) => ({
          category: k,
          count: v.count,
          total_spend: roundTwo(v.total_spend)
        })),
        recent_activities: activities.slice(0, 10)
      }
    };
  }
};

export const userAPI = {
  list: async () => {
    if (!isGitHubPages) {
      try {
        return await axiosInstance.get('/users');
      } catch (e) {}
    }
    const users = getStoredUsers();
    return { data: users.map(({ password, ...u }) => u) };
  }
};

function roundTwo(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export default axiosInstance;
