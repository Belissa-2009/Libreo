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
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/books/:id/settings" element={<BookSettingsPage />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

