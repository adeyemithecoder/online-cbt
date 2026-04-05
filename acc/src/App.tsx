import { Routes, Route } from "react-router-dom";
// Import REAL pages
import SessionsPage from "./Pages/admin/SessionsPage";
import AccountsPage from "./Pages/admin/AccountsPage";
import JournalPage from "./Pages/admin/JournalPage";
import FeesPage from "./Pages/admin/FeesPage";
import PaymentsPage from "./Pages/admin/PaymentsPage";
import ExpensesPage from "./Pages/admin/ExpensesPage";
import LoansPage from "./Pages/admin/LoansPage";
import DonationsPage from "./Pages/admin/DonationsPage";
import ReportsPage from "./Pages/admin/ReportsPage";
import AuditPage from "./Pages/admin/AuditPage";

// Optional (if you're using context)
import { AppProvider } from "./context/AppContext";

import LoginPage from "./Pages/auth/LoginPage";
import { ToastProvider } from "./context/ToastContext";
import StudentsPage from "./Pages/admin/StudentsPage";
import Layout from "./components/layouts/Layout";
import DashboardPage from "./Pages/admin/DashboardPage";

export default function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected — all wrapped by Layout */}
          <Route element={<Layout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/sessions" element={<SessionsPage />} />
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/journal" element={<JournalPage />} />
            <Route path="/fees" element={<FeesPage />} />
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/loans" element={<LoansPage />} />
            <Route path="/donations" element={<DonationsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/audit" element={<AuditPage />} />
          </Route>
        </Routes>
      </ToastProvider>
    </AppProvider>
  );
}
