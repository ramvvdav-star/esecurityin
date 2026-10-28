import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, NavView } from './components/layout/Sidebar';
import { SupabaseSetupBanner } from './components/common/SupabaseSetupBanner';
import { LoginForm } from './components/auth/LoginForm';
import { ResetPasswordModal } from './components/auth/ResetPasswordModal';
import { SupabaseConfigModal } from './components/auth/SupabaseConfigModal';

// Admin Views
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ProjectsManager } from './components/admin/ProjectsManager';
import { WorkItemsManager } from './components/admin/WorkItemsManager';
import { DailyReportsReview } from './components/admin/DailyReportsReview';
import { EmployeesManager } from './components/admin/EmployeesManager';
import { AnalyticsPanel } from './components/admin/AnalyticsPanel';
import { AuditLogsView } from './components/admin/AuditLogsView';

// Employee Views
import { EmployeeDashboard } from './components/employee/EmployeeDashboard';
import { DailyReportForm } from './components/employee/DailyReportForm';
import { MyAssignmentsView } from './components/employee/MyAssignmentsView';
import { ReportHistoryView } from './components/employee/ReportHistoryView';

import { Shield, Loader2 } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { user, profile, isLoading } = useAuth();

  const [currentView, setCurrentView] = useState<NavView>('dashboard');
  const [selectedReportDate, setSelectedReportDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isSupabaseConfigOpen, setIsSupabaseConfigOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [preselectedProjectId, setPreselectedProjectId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
          <Shield size={32} className="animate-pulse" />
        </div>
        <div className="flex items-center gap-2 text-sm font-medium">
          <Loader2 size={16} className="animate-spin text-cyan-400" />
          <span>Initializing eSecurityIn Tracker &amp; Supabase Session...</span>
        </div>
      </div>
    );
  }

  // If not authenticated, render login form
  if (!user || !profile) {
    return (
      <>
        <LoginForm
          onOpenResetPassword={() => setIsResetPasswordOpen(true)}
          onOpenSupabaseConfig={() => setIsSupabaseConfigOpen(true)}
        />
        <ResetPasswordModal
          isOpen={isResetPasswordOpen}
          onClose={() => setIsResetPasswordOpen(false)}
          onBackToLogin={() => setIsResetPasswordOpen(false)}
        />
        <SupabaseConfigModal
          isOpen={isSupabaseConfigOpen}
          onClose={() => setIsSupabaseConfigOpen(false)}
        />
      </>
    );
  }

  const isAdmin = profile.role === 'admin';

  // Navigation handlers
  const handleOpenCreateProject = () => {
    setCurrentView('projects');
  };

  const handleOpenCreateWorkItem = (projectId?: string) => {
    setPreselectedProjectId(projectId || null);
    setCurrentView('work_items');
  };

  const handleOpenReportForDate = (date: string) => {
    setSelectedReportDate(date);
    setCurrentView('my_report');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-cyan-500 selection:text-slate-950">
      {/* Supabase Connectivity Banner */}
      <SupabaseSetupBanner onOpenConfig={() => setIsSupabaseConfigOpen(true)} />

      {/* Main Top Navigation */}
      <Navbar onOpenSupabaseConfig={() => setIsSupabaseConfigOpen(true)} />

      {/* Main App Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Role-Aware Sidebar */}
        <Sidebar
          currentView={currentView}
          onNavigate={(view) => {
            if (view === 'supabase_setup') {
              setIsSupabaseConfigOpen(true);
            } else {
              setCurrentView(view);
            }
          }}
        />

        {/* Dynamic Main Workspace Container */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-950">
          <div className="max-w-7xl mx-auto">
            {isAdmin ? (
              <>
                {currentView === 'dashboard' && (
                  <AdminDashboard
                    onNavigate={setCurrentView}
                    onOpenCreateProject={handleOpenCreateProject}
                    onOpenCreateWorkItem={() => handleOpenCreateWorkItem()}
                  />
                )}
                {currentView === 'projects' && (
                  <ProjectsManager
                    onOpenCreateWorkItemWithProject={(pId) => handleOpenCreateWorkItem(pId)}
                  />
                )}
                {currentView === 'work_items' && (
                  <WorkItemsManager initialProjectId={preselectedProjectId} />
                )}
                {currentView === 'review_reports' && <DailyReportsReview />}
                {currentView === 'employees' && <EmployeesManager />}
                {currentView === 'analytics' && <AnalyticsPanel />}
                {currentView === 'audit_logs' && <AuditLogsView />}
              </>
            ) : (
              <>
                {currentView === 'dashboard' && (
                  <EmployeeDashboard
                    onNavigate={setCurrentView}
                    onOpenReportForDate={handleOpenReportForDate}
                  />
                )}
                {currentView === 'my_report' && (
                  <DailyReportForm
                    initialDate={selectedReportDate}
                    onNavigateHistory={() => setCurrentView('report_history')}
                  />
                )}
                {currentView === 'my_tasks' && (
                  <MyAssignmentsView
                    onOpenReportWithTask={() => {
                      setSelectedReportDate(new Date().toISOString().split('T')[0]);
                      setCurrentView('my_report');
                    }}
                  />
                )}
                {currentView === 'report_history' && (
                  <ReportHistoryView
                    onEditReport={(date) => {
                      setSelectedReportDate(date);
                      setCurrentView('my_report');
                    }}
                  />
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Global Supabase Config Modal */}
      <SupabaseConfigModal
        isOpen={isSupabaseConfigOpen}
        onClose={() => setIsSupabaseConfigOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <MainAppContent />
      </DataProvider>
    </AuthProvider>
  );
}
