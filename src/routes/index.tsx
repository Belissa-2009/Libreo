import { Routes, Route, Navigate } from 'react-router';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import LoginPage from '@/pages/auth/LoginPage';
import SignupPage from '@/pages/auth/SignupPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import ProfilePage from '@/pages/auth/ProfilePage';
import HomePage from '@/pages/HomePage';
import BooksPage from '@/pages/books/BooksPage';
import NewBookPage from '@/pages/books/NewBookPage';
import BookSettingsPage from '@/pages/books/BookSettingsPage';
import AcceptInvitationPage from '@/pages/books/AcceptInvitationPage';

import AccountsPage from '@/pages/accounts/AccountsPage';

import JournalPage from '@/pages/journal/JournalPage';
import NewEntryPage from '@/pages/journal/NewEntryPage';
import EditEntryPage from '@/pages/journal/EditEntryPage';

import LedgerPage from '@/pages/reports/LedgerPage';
import TrialBalancePage from '@/pages/reports/TrialBalancePage';
import IncomeStatementPage from '@/pages/reports/IncomeStatementPage';
import BalanceSheetPage from '@/pages/reports/BalanceSheetPage';import ExchangeRatesPage from '@/pages/currencies/ExchangeRatesPage'
import LoansPage from '@/pages/loans/LoansPage'
import NewLoanPage from '@/pages/loans/NewLoanPage'
import LoanDetailPage from '@/pages/loans/LoanDetailPage'

export function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/accept-invitation" element={<AcceptInvitationPage />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/books" element={<BooksPage />} />
        <Route path="/books/new" element={<NewBookPage />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/journal" element={<JournalPage />} />
          <Route path="/journal/new" element={<NewEntryPage />} />
          <Route path="/journal/:id/edit" element={<EditEntryPage />} />
          <Route path="/reports/ledger" element={<LedgerPage />} />
          <Route path="/reports/trial-balance" element={<TrialBalancePage />} />
          <Route path="/reports/income-statement" element={<IncomeStatementPage />} />
          <Route path="/reports/balance-sheet" element={<BalanceSheetPage />} />
          <Route path="/currencies" element={<ExchangeRatesPage />} />
          <Route path="/loans" element={<LoansPage />} />
          <Route path="/loans/new" element={<NewLoanPage />} />
          <Route path="/loans/:id" element={<LoanDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/books/:id/settings" element={<BookSettingsPage />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

