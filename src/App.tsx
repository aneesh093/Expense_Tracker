
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import { Settings } from './pages/Settings';
import { Categories } from './pages/Categories';
import { Mandates } from './pages/Mandates';
import { useFinanceStore } from './store/useFinanceStore';
import { useBackupScheduler } from './hooks/useBackupScheduler';

import { useAutoReport } from './hooks/useAutoReport';

// Placeholder pages to be implemented later

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
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MobileLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/accounts/:id" element={<AccountDetails />} />
          <Route path="/add" element={<TransactionForm />} />
          <Route path="/edit/:id" element={<TransactionForm />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/new" element={<EventForm />} />
          <Route path="/events/edit/:id" element={<EventForm />} />
          <Route path="/events/:id" element={<EventDetails />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/reports/transactions" element={<ReportTransactions />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/mandates" element={<Mandates />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
