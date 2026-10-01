
import { createBrowserRouter, RouterProvider, Outlet, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { MobileLayout } from './components/Layout/MobileLayout';
import { Dashboard } from './pages/Dashboard';

import { Accounts } from './pages/Accounts';
import { AccountDetails } from './pages/AccountDetails';
import { TransactionForm } from './pages/TransactionForm';
import { Reports } from './pages/Reports';
import { ReportTransactions } from './pages/ReportTransactions';
import { Events } from './pages/Events';
import { EventDetails } from './pages/EventDetails';
import { EventForm } from './pages/EventForm';
import { LogForm } from './pages/LogForm';
import { PlanForm } from './pages/PlanForm';
import { ReportSources } from './pages/ReportSources';
import { Settings } from './pages/Settings';
import { AppPreferences } from './pages/AppPreferences';
import { AuditTrail } from './pages/AuditTrail';
import { Categories } from './pages/Categories';
import { Mandates } from './pages/Mandates';
import { BackupConfiguration } from './pages/BackupConfiguration';
import { TransactionSettings } from './pages/TransactionSettings';
import { AccountOrderSettings } from './pages/AccountOrderSettings';
import { About } from './pages/About';
import { UserGuide } from './pages/UserGuide';
import { useFinanceStore } from './store/useFinanceStore';
import { useBackupScheduler } from './hooks/useBackupScheduler';

import { useAutoReport } from './hooks/useAutoReport';

import { SecuritySettings } from './pages/SecuritySettings';
import { LockScreen } from './components/Security/LockScreen';

function RootLayout() {
  const isLocked = useFinanceStore((state) => state.isLocked);
  return (
    <>
      {isLocked && <LockScreen />}
      <Outlet />
    </>
  );
}

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        element: <MobileLayout />,
        children: [
          { path: '/', element: <Dashboard /> },
          { path: '/accounts', element: <Accounts /> },
          { path: '/accounts/:id', element: <AccountDetails /> },
          { path: '/add', element: <TransactionForm /> },
          { path: '/edit/:id', element: <TransactionForm /> },
          { path: '/events', element: <Events /> },
          { path: '/events/new', element: <EventForm /> },
          { path: '/events/edit/:id', element: <EventForm /> },
          { path: '/events/:id', element: <EventDetails /> },
          { path: '/reports', element: <Reports /> },
          { path: '/reports/transactions', element: <ReportTransactions /> },
          { path: '/settings', element: <Settings /> },
          { path: '/settings/preferences', element: <AppPreferences /> },
          { path: '/settings/account-order', element: <AccountOrderSettings /> },
          { path: '/settings/transactions', element: <TransactionSettings /> },
          { path: '/settings/security', element: <SecuritySettings /> },
          { path: '/settings/audit-trail', element: <AuditTrail /> },
          { path: '/mandates', element: <Mandates /> },
          { path: '/settings/backup', element: <BackupConfiguration /> },
          { path: '/settings/about', element: <About /> },
          { path: '/settings/user-guide', element: <UserGuide /> },
          { path: '/logs/new', element: <LogForm /> },
          { path: '/logs/edit/:id', element: <LogForm /> },
          { path: '/plans/new', element: <PlanForm /> },
          { path: '/plans/edit/:id', element: <PlanForm /> },
          { path: '/settings/report-sources', element: <ReportSources /> },
          { path: '/categories', element: <Categories /> },
          { path: '*', element: <Navigate to="/" replace /> },
        ],
      },
    ],
  },
]);

function App() {
  const initialize = useFinanceStore((state) => state.initialize);
  const checkAndRunMandates = useFinanceStore((state) => state.checkAndRunMandates);

  // Enable automatic daily backups
  useBackupScheduler();

  // Enable automatic monthly PDF reports
  useAutoReport();

  useEffect(() => {
    // Initialize store from IndexedDB on app startup
    const init = async () => {
      await initialize();
      await checkAndRunMandates();
    };
    init();
  }, [initialize, checkAndRunMandates]);

  return <RouterProvider router={router} />;
}

export default App;
