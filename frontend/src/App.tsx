import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import GuestLayout from './layouts/GuestLayout';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './routes/ProtectedRoute';

// ===========================
// Lazy-loaded pages
// ===========================

// Public pages
const HomePage = lazy(() => import('./pages/public/HomePage'));
const CoursesPage = lazy(() => import('./pages/public/CoursesPage'));
const AnnouncementsPage = lazy(() => import('./pages/public/AnnouncementsPage'));
const LoginPage = lazy(() => import('./pages/public/LoginPage'));
const RegisterPage = lazy(() => import('./pages/public/RegisterPage'));

// Dashboard pages
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const TeacherDashboard = lazy(() => import('./pages/teacher/TeacherDashboard'));
const StaffDashboard = lazy(() => import('./pages/staff/StaffDashboard'));
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
// When logged in, redirect to the appropriate dashboard.
// ===========================
const HomeRedirect: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <PageFallback />;

  if (isAuthenticated && user) {
    const dashboardMap: Record<string, string> = {
      STUDENT: '/student/dashboard',
      TEACHER: '/teacher/dashboard',
      TRAINING_STAFF: '/staff/dashboard',
      DIRECTOR: '/director/dashboard',
    };
    return <Navigate to={dashboardMap[user.role] || '/student/dashboard'} replace />;
  }

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
              <LoginPage />
            </GuestLayout>
          }
        />
        <Route
          path="/register"
          element={
            <GuestLayout>
              <RegisterPage />
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
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
