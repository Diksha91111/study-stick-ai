import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppLayout } from './components/layout/AppLayout';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { TimetablePage } from './pages/TimetablePage';
import { AcademicPage } from './pages/AcademicPage';
import { ExamsPage } from './pages/ExamsPage';
import { SleepPage } from './pages/SleepPage';
import { ProfilePage } from './pages/ProfilePage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { CodeLabPage } from './pages/CodeLabPage';
import { ProgressPage } from './pages/ProgressPage';
import { LearningPathPage } from './pages/LearningPathPage';
import { KnowledgeGraphPage } from './pages/KnowledgeGraphPage';
import { RevisionPage } from './pages/RevisionPage';
import { PlannerPage } from './pages/PlannerPage';
import { StudyRoomsPage } from './pages/StudyRoomsPage';
import { StudyRoomWorkspacePage } from './pages/StudyRoomWorkspacePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { LegalConsentPage } from './pages/LegalConsentPage';
import { FocusAudioProvider } from './context/FocusAudioContext';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.requiresLegalConsent) {
    return <Navigate to="/legal-consent" replace />;
  }

  return <>{children}</>;
};

// Public Only Route Wrapper (e.g. login/register when already logged in)
const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    if (user?.requiresLegalConsent) {
      return <Navigate to="/legal-consent" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Route wrapper for mandatory legal consent flow
const LegalConsentRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.requiresLegalConsent) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <FocusAudioProvider>
          <BrowserRouter>
          <Routes>
            {/* Landing Page (Public) */}
            <Route path="/" element={<LandingPage />} />

            {/* Auth Public Only Routes */}
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <LoginPage />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicOnlyRoute>
                  <RegisterPage />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicOnlyRoute>
                  <RegisterPage />
                </PublicOnlyRoute>
              }
            />

            {/* Email Verification - Always Accessible */}
            <Route path="/verify-email" element={<VerifyEmailPage />} />

            {/* Password Reset - Always Accessible */}
            <Route
              path="/forgot-password"
              element={<ForgotPasswordPage />}
            />
            <Route
              path="/reset-password"
              element={<ResetPasswordPage />}
            />

            {/* Public Legal Pages - Accessible without authentication */}
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />

            {/* Mandatory Legal Consent (for authenticated users requiring renewed consent) */}
            <Route
              path="/legal-consent"
              element={
                <LegalConsentRoute>
                  <LegalConsentPage />
                </LegalConsentRoute>
              }
            />

            {/* Protected Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/assistant" element={<AIAssistantPage />} />
              <Route path="/codelab" element={<CodeLabPage />} />
              <Route path="/timetable" element={<TimetablePage />} />
              <Route path="/academic" element={<AcademicPage />} />
              <Route path="/exams" element={<ExamsPage />} />
              <Route path="/sleep" element={<SleepPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/progress" element={<ProgressPage />} />
              <Route path="/learning-path" element={<LearningPathPage />} />
              <Route path="/knowledge-graph" element={<KnowledgeGraphPage />} />
              <Route path="/revision" element={<RevisionPage />} />
              <Route path="/planner" element={<PlannerPage />} />
              <Route path="/study-rooms" element={<StudyRoomsPage />} />
              <Route path="/study-rooms/:roomId" element={<StudyRoomWorkspacePage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        </FocusAudioProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
