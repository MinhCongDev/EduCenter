import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import GuestLayout from './layouts/GuestLayout';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// ===========================
// Lazy-loaded pages
// ===========================

// Public pages
const HomePage = lazy(() => import('./pages/public/HomePage'));
const CoursesPage = lazy(() => import('./pages/public/CoursesPage'));
const AnnouncementsPage = lazy(() => import('./pages/public/AnnouncementsPage'));
const AuthPage = lazy(() => import('./pages/public/AuthPage'));
const VerifyEmailPage = lazy(() => import('./pages/public/VerifyEmailPage'));
const ResendVerificationPage = lazy(() => import('./pages/public/ResendVerificationPage'));

// Dashboard pages
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const TeacherDashboard = lazy(() => import('./pages/teacher/TeacherDashboard'));
const StaffDashboard = lazy(() => import('./pages/staff/StaffDashboard'));
const CoursesManagementPage = lazy(() => import('./pages/staff/CoursesManagementPage'));
const ClassesManagementPage = lazy(() => import('./pages/staff/ClassesManagementPage'));
const DirectorDashboard = lazy(() => import('./pages/director/DirectorDashboard'));

// Error pages
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const UnauthorizedPage = lazy(() => import('./pages/UnauthorizedPage'));

// ===========================
// Page fallback
// ===========================
const PageFallback: React.FC = () => (
  <div className="loading-screen" aria-label="Loading page">
    <div className="loading-spinner" />
  </div>
);

// ===========================
// Auth-aware redirect for "/"
// Auth-aware render for "/"
// ===========================
const HomeRedirect: React.FC = () => {
  const { isLoading } = useAuth();

  if (isLoading) return <PageFallback />;

  return (
    <GuestLayout>
      <HomePage />
    </GuestLayout>
  );
};

// ===========================
// Main App Router
// ===========================
const AppRouter: React.FC = () => {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        {/* ── Public Routes ────────────────────────── */}
        <Route path="/" element={<HomeRedirect />} />

        <Route
          path="/courses"
          element={
            <GuestLayout>
              <CoursesPage />
            </GuestLayout>
          }
        />
        <Route
          path="/announcements"
          element={
            <GuestLayout>
              <AnnouncementsPage />
            </GuestLayout>
          }
        />
        <Route
          path="/login"
          element={
            <GuestLayout>
              <AuthPage defaultMode="login" />
            </GuestLayout>
          }
        />
        <Route
          path="/register"
          element={
            <GuestLayout>
              <AuthPage defaultMode="register" />
            </GuestLayout>
          }
        />
        <Route
          path="/verify-email"
          element={
            <GuestLayout>
              <VerifyEmailPage />
            </GuestLayout>
          }
        />
        <Route
          path="/resend-verification"
          element={
            <GuestLayout>
              <ResendVerificationPage />
            </GuestLayout>
          }
        />

        {/* ── Student Routes ───────────────────────── */}
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <DashboardLayout>
                <StudentDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        {/* Additional student routes will be added in Phase 9 */}

        {/* ── Teacher Routes ───────────────────────── */}
        <Route
          path="/teacher/dashboard"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <DashboardLayout>
                <TeacherDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* ── Training Staff Routes ────────────────── */}
        <Route
          path="/staff/dashboard"
          element={
            <ProtectedRoute allowedRoles={['TRAINING_STAFF']}>
              <DashboardLayout>
                <StaffDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/courses"
          element={
            <ProtectedRoute allowedRoles={['TRAINING_STAFF']}>
              <DashboardLayout>
                <CoursesManagementPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/classes"
          element={
            <ProtectedRoute allowedRoles={['TRAINING_STAFF']}>
              <DashboardLayout>
                <ClassesManagementPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* ── Director Routes ──────────────────────── */}
        <Route
          path="/director/dashboard"
          element={
            <ProtectedRoute allowedRoles={['DIRECTOR']}>
              <DashboardLayout>
                <DirectorDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* ── Error Routes ─────────────────────────── */}
        <Route
          path="/unauthorized"
          element={
            <GuestLayout>
              <UnauthorizedPage />
            </GuestLayout>
          }
        />
        <Route
          path="*"
          element={
            <GuestLayout>
              <NotFoundPage />
            </GuestLayout>
          }
        />
      </Routes>
    </Suspense>
  );
};

// ===========================
// Root App Component
// ===========================
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
