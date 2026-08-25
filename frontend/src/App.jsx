import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PRsPage } from './pages/PRsPage';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { UsersPage } from './pages/UsersPage';
import { PRFormModal } from './components/PRFormModal';
import { PRDetailModal } from './components/PRDetailModal';
import { prAPI, analyticsAPI } from './services/api';
import { CheckCircle2 } from 'lucide-react';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPR, setSelectedPR] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const refreshPendingCount = async () => {
    if (!user) return;
    try {
      if (user.role === 'manager' || user.role === 'admin') {
        const res = await prAPI.list({ awaiting_my_approval: true, limit: 1 });
        setPendingCount(res.data.total || 0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    refreshPendingCount();
  }, [user, activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-brand-600 font-semibold text-sm">
          <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Starting PR System Session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const handlePRCreated = (newPR) => {
    showToast(`Requisition ${newPR.pr_number} created successfully!`);
    refreshPendingCount();
  };

  const handlePRUpdated = (updatedPR) => {
    setSelectedPR(updatedPR);
    showToast(`Requisition ${updatedPR.pr_number} updated to '${updatedPR.status}'`);
    refreshPendingCount();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-800 animate-fade-in text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar onOpenNewPR={() => setIsFormOpen(true)} />

      {/* Body Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenNewPR={() => setIsFormOpen(true)}
          pendingCount={pendingCount}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardPage
              onSelectPR={(pr) => setSelectedPR(pr)}
              onNavigatePRs={() => setActiveTab('prs')}
              onNavigateApprovals={() => setActiveTab('approvals')}
              onOpenNewPR={() => setIsFormOpen(true)}
            />
          )}

          {activeTab === 'prs' && (
            <PRsPage
              onSelectPR={(pr) => setSelectedPR(pr)}
              onOpenNewPR={() => setIsFormOpen(true)}
            />
          )}

          {activeTab === 'approvals' && (
            <ApprovalsPage
              onSelectPR={(pr) => setSelectedPR(pr)}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsPage />
          )}

          {activeTab === 'users' && user.role === 'admin' && (
            <UsersPage />
          )}
        </main>
      </div>

      {/* Create PR Modal */}
      <PRFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={handlePRCreated}
      />

      {/* PR Detail Modal */}
      <PRDetailModal
        pr={selectedPR}
        isOpen={!!selectedPR}
        onClose={() => setSelectedPR(null)}
        onUpdate={handlePRUpdated}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
