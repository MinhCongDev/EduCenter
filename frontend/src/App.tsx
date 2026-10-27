import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
const AuthPage = lazy(() => import('./pages/public/AuthPage'));
const VerifyEmailPage = lazy(() => import('./pages/public/VerifyEmailPage'));
const ResendVerificationPage = lazy(() => import('./pages/public/ResendVerificationPage'));

// Dashboard pages
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const MyClassesPage = lazy(() => import('./pages/student/MyClassesPage'));
const ClassDetailsPage = lazy(() => import('./pages/student/ClassDetailsPage'));
const AssignmentsPage = lazy(() => import('./pages/student/AssignmentsPage'));
const AttendancePage = lazy(() => import('./pages/student/AttendancePage'));
const GradesPage = lazy(() => import('./pages/student/GradesPage'));
const SchedulePage = lazy(() => import('./pages/student/SchedulePage'));
// Trang thanh toán — hợp nhất 3 nguồn vào 1: tab "Học phí" (theo lớp)
// + tab "Lịch sử giao dịch" (theo hóa đơn), kèm VietQR & biên lai điện tử.
const TuitionPage = lazy(() => import('./pages/student/TuitionPage'));
const RequestsPage = lazy(() => import('./pages/student/RequestsPage'));
const ProfilePage = lazy(() => import('./pages/student/ProfilePage'));
const CombinedSchedulePage = lazy(() => import('./pages/student/CombinedSchedulePage'));
const NotificationsPage = lazy(() => import('./pages/student/NotificationsPage'));
const TeacherDashboard = lazy(() => import('./pages/teacher/TeacherDashboard'));
const StaffDashboard = lazy(() => import('./pages/staff/StaffDashboard'));
const CoursesManagementPage = lazy(() => import('./pages/staff/CoursesManagementPage'));
const ClassesManagementPage = lazy(() => import('./pages/staff/ClassesManagementPage'));
const RequestsManagementPage = lazy(() => import('./pages/staff/RequestsManagementPage'));
const FeedbackManagementPage = lazy(() => import('./pages/staff/FeedbackManagementPage'));
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
        {/* ── Thanh toán: đã hợp nhất về 1 trang duy nhất ──
            /student/tuition là trang chính (tab "Học phí" + tab "Lịch sử giao dịch",
            kèm VietQR/VNPay và biên lai điện tử).
            /student/payments và /student/payment-history giữ lại làm alias
            để các link cũ (email, thông báo, bookmark) không bị gãy. */}
        <Route
          path="/student/tuition"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <DashboardLayout>
                <TuitionPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/payments"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <DashboardLayout>
                <TuitionPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/payment-history"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <DashboardLayout>
                <TuitionPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
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
          path="/student/notifications"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <DashboardLayout>
                <NotificationsPage />
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
          path="/staff/requests"
          element={
            <ProtectedRoute allowedRoles={['TRAINING_STAFF', 'DIRECTOR']}>
              <DashboardLayout>
                <RequestsManagementPage />
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
          path="/staff/feedback"
          element={
            <ProtectedRoute allowedRoles={['TRAINING_STAFF', 'DIRECTOR']}>
              <DashboardLayout>
                <FeedbackManagementPage />
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
