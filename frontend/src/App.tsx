import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
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
const PlacementTestListPage = lazy(() => import('./pages/public/PlacementTestListPage'));
const PlacementTestDetailPage = lazy(() => import('./pages/public/PlacementTestDetailPage'));
const AuthPage = lazy(() => import('./pages/public/AuthPage'));
const VerifyEmailPage = lazy(() => import('./pages/public/VerifyEmailPage'));
const ResendVerificationPage = lazy(() => import('./pages/public/ResendVerificationPage'));

// Dashboard pages
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const StudentPaymentsPage = lazy(() => import('./pages/student/StudentPaymentsPage'));
const MyClassesPage = lazy(() => import('./pages/student/MyClassesPage'));
const ClassDetailsPage = lazy(() => import('./pages/student/ClassDetailsPage'));
const AssignmentsPage = lazy(() => import('./pages/student/AssignmentsPage'));
const AttendancePage = lazy(() => import('./pages/student/AttendancePage'));
const GradesPage = lazy(() => import('./pages/student/GradesPage'));
const SchedulePage = lazy(() => import('./pages/student/SchedulePage'));
const PaymentsPage = lazy(() => import('./pages/student/PaymentsPage'));
const RequestsPage = lazy(() => import('./pages/student/RequestsPage'));
const ProfilePage = lazy(() => import('./pages/student/ProfilePage'));
const CombinedSchedulePage = lazy(() => import('./pages/student/CombinedSchedulePage'));
const TeacherDashboard = lazy(() => import('./pages/teacher/TeacherDashboard'));
const StaffDashboard = lazy(() => import('./pages/staff/StaffDashboard'));
const CoursesManagementPage = lazy(() => import('./pages/staff/CoursesManagementPage'));
const ClassesManagementPage = lazy(() => import('./pages/staff/ClassesManagementPage'));
const PlacementTestsManagementPage = lazy(() => import('./pages/staff/PlacementTestsManagementPage'));
const EnrollmentsManagementPage = lazy(() => import('./pages/staff/EnrollmentsManagementPage'));
const TimetableManagementPage = lazy(() => import('./pages/staff/TimetableManagementPage'));
const StudentsManagementPage = lazy(() => import('./pages/staff/StudentsManagementPage'));
const StudentDetailPage = lazy(() => import('./pages/staff/StudentDetailPage'));
const TeachersManagementPage = lazy(() => import('./pages/staff/TeachersManagementPage'));
const TeacherDetailPage = lazy(() => import('./pages/staff/TeacherDetailPage'));
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
          path="/placement-test"
          element={
            <GuestLayout>
              <PlacementTestListPage />
            </GuestLayout>
          }
        />
        <Route
          path="/placement-test/:id"
          element={
            <GuestLayout>
              <PlacementTestDetailPage />
            </GuestLayout>
          }
        />
        <Route
          path="/placement-tests"
          element={
            <GuestLayout>
              <PlacementTestListPage />
            </GuestLayout>
          }
        />
        <Route
          path="/placement-tests/:id"
          element={
            <GuestLayout>
              <PlacementTestDetailPage />
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
        <Route
          path="/student/classes"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <DashboardLayout>
                <MyClassesPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/classes/:id"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <DashboardLayout>
                <ClassDetailsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/classes/:id/assignments"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <DashboardLayout>
                <AssignmentsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/classes/:id/attendance"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <DashboardLayout>
                <AttendancePage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/classes/:id/grades"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <DashboardLayout>
                <GradesPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/classes/:id/schedule"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <DashboardLayout>
                <SchedulePage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/payments"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <DashboardLayout>
                <StudentPaymentsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/payment-history"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <DashboardLayout>
                <PaymentsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/tuition"
          element={<Navigate to="/student/payments" replace />}
        />
        <Route
          path="/student/requests"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <DashboardLayout>
                <RequestsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/profile"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <DashboardLayout>
                <ProfilePage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/schedule"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <DashboardLayout>
                <CombinedSchedulePage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
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
        <Route
          path="/staff/placement-tests"
          element={
            <ProtectedRoute allowedRoles={['TRAINING_STAFF']}>
              <DashboardLayout>
                <PlacementTestsManagementPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/enrollments"
          element={
            <ProtectedRoute allowedRoles={['TRAINING_STAFF']}>
              <DashboardLayout>
                <EnrollmentsManagementPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/timetable"
          element={
            <ProtectedRoute allowedRoles={['TRAINING_STAFF']}>
              <DashboardLayout>
                <TimetableManagementPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/students"
          element={
            <ProtectedRoute allowedRoles={['TRAINING_STAFF']}>
              <DashboardLayout>
                <StudentsManagementPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/students/:id"
          element={
            <ProtectedRoute allowedRoles={['TRAINING_STAFF']}>
              <DashboardLayout>
                <StudentDetailPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/teachers"
          element={
            <ProtectedRoute allowedRoles={['TRAINING_STAFF']}>
              <DashboardLayout>
                <TeachersManagementPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/teachers/:id"
          element={
            <ProtectedRoute allowedRoles={['TRAINING_STAFF']}>
              <DashboardLayout>
                <TeacherDetailPage />
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
        <ToastProvider>
          <AuthProvider>
            <AppRouter />
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
