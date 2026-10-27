import React, { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types';
import { ChangePasswordModal } from '../components/ChangePasswordModal';
import { ProfileModal } from '../components/ProfileModal';
import '../styles/dashboard-layout.css';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface DashboardItem {
  label: string;
  path?: string;
}

const dashboardPaths: Record<UserRole, string> = {
  STUDENT: '/student/dashboard',
  TEACHER: '/teacher/dashboard',
  TRAINING_STAFF: '/staff/dashboard',
  DIRECTOR: '/director/dashboard',
};

const roleLabels: Record<UserRole, string> = {
  STUDENT: 'Học viên',
  TEACHER: 'Giảng viên',
  TRAINING_STAFF: 'Phòng giáo vụ',
  DIRECTOR: 'Ban giám đốc',
};

const getMenuItems = (role: UserRole): DashboardItem[] => {
  if (role === 'TRAINING_STAFF') {
    return [
      { label: 'Tổng quan', path: dashboardPaths[role] },
      { label: 'Quản lý khóa học', path: '/staff/courses' },
      { label: 'Quản lý lớp học', path: '/staff/classes' },
      { label: 'Quản lý ghi danh', path: '/staff/enrollments' },
      { label: 'Thời khóa biểu', path: '/staff/timetable' },
      { label: 'Quản lý học viên', path: '/staff/students' },
      { label: 'Quản lý giảng viên', path: '/staff/teachers' },
      { label: 'Báo cáo' },
    ];
  }

  if (role === 'TEACHER') {
    return [
      { label: 'Tổng quan', path: '/teacher/dashboard' },
      { label: 'Quản lý lớp học', path: '/teacher/dashboard?tab=classes_students' },
      { label: 'Lịch dạy & Điểm danh', path: '/teacher/dashboard?tab=schedule_attendance' },
      { label: 'Bài tập & Chấm bài', path: '/teacher/dashboard?tab=assignments_grading' },
      { label: 'Kết quả học tập', path: '/teacher/dashboard?tab=academic_grades' },
      { label: 'Báo cáo' },
    ];
  }

  if (role === 'STUDENT') {
    return [
      { label: 'Tổng quan', path: '/student/dashboard' },
      { label: 'Học phí & Thanh toán', path: '/student/payments' },
      { label: 'Khóa học của tôi', path: '/student/dashboard?tab=courses' },
      { label: 'Lịch học', path: '/student/dashboard?tab=schedule' },
      { label: 'Bài tập về nhà', path: '/student/dashboard?tab=assignments' },
      { label: 'Kết quả học tập', path: '/student/dashboard?tab=grades' },
      { label: '🎯 Thi thử & Test đầu vào', path: '/placement-tests' },
    ];
  }

  if (role === 'DIRECTOR') {
    return [
      { label: 'Tổng quan', path: '/director/dashboard' },
      { label: 'Quản lý thông báo', path: '/director/dashboard?tab=announcements' },
      { label: 'Quản lý nhân sự', path: '/director/dashboard?tab=staff_accounts' },
      { label: 'Giám sát vận hành', path: '/director/dashboard?tab=monitoring' },
      { label: 'Báo cáo học viên', path: '/director/dashboard?tab=student_reports' },
      { label: 'Báo cáo giảng viên', path: '/director/dashboard?tab=teacher_reports' },
      { label: 'Báo cáo lớp & khóa học', path: '/director/dashboard?tab=class_course_reports' },
      { label: 'Báo cáo tài chính & doanh thu', path: '/director/dashboard?tab=revenue_reports' },
    ];
  }

  return [
    { label: 'Tổng quan', path: dashboardPaths[role] },
    { label: 'Học viên' },
    { label: 'Nhân sự' },
    { label: 'Báo cáo' },
  ];
};

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const role = user?.role ?? 'STUDENT';
  const items = getMenuItems(role);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const currentItem = items.find((item) => {
    if (!item.path) return false;
    const currentFull = location.pathname + (location.search || '');
    if (item.path.includes('?')) return currentFull === item.path;
    return location.pathname === item.path && (!location.search || location.search === '');
  });
  const pageTitle = location.pathname.includes('/profile')
    ? 'Hồ sơ cá nhân'
    : currentItem?.label || 'Bảng điều khiển';

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <Link className="dashboard-brand" to="/" aria-label="EduCenter trang chủ">
          <span className="dashboard-brand-mark">E</span>
          <span className="dashboard-brand-name">Edu<span>Center</span></span>
        </Link>

        <div className="dashboard-nav-label">KHÔNG GIAN LÀM VIỆC</div>
        <nav className="dashboard-nav" aria-label="Điều hướng tác vụ">
          {items.map((item) => {
            const currentFull = location.pathname + (location.search || '');
            const isCurrent = item.path
              ? item.path.includes('?')
                ? currentFull === item.path
                : location.pathname === item.path && (!location.search || location.search === '')
              : false;

            return item.path ? (
              <NavLink
                key={item.label}
                to={item.path}
                className={`dashboard-nav-item${isCurrent ? ' is-active' : ''}`}
                aria-current={isCurrent ? 'page' : undefined}
              >
                {item.label}
              </NavLink>
            ) : (
              <button
                key={item.label}
                type="button"
                className="dashboard-nav-item is-placeholder"
                disabled
                title="Chức năng sẽ được cập nhật trong thời gian tới"
              >
                <span>{item.label}</span>
                <span className="dashboard-nav-status">Sắp có</span>
              </button>
            );
          })}
        </nav>

        {user && (
          <div className="dashboard-account">
            {/* Thông tin tài khoản */}
            <div className="dashboard-user">
              <span className="dashboard-user-avatar" aria-hidden="true">
                {user.fullName.trim().charAt(0).toUpperCase()}
              </span>
              <span className="dashboard-user-info">
                <strong title={user.fullName}>{user.fullName}</strong>
                <span>{roleLabels[role]}</span>
              </span>
            </div>

            {/* Danh sách cài đặt tài khoản (Account Settings Navigation) */}
            <nav className="dashboard-account-nav" aria-label="Cài đặt tài khoản">
              {role === 'STUDENT' ? (
                <NavLink
                  to="/student/profile"
                  className={({ isActive }) =>
                    `dashboard-account-nav-item${isActive ? ' is-active' : ''}`
                  }
                >
                  <svg className="dashboard-account-nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>Hồ sơ cá nhân</span>
                </NavLink>
              ) : (
                <button
                  type="button"
                  className="dashboard-account-nav-item"
                  onClick={() => setIsProfileOpen(true)}
                >
                  <svg className="dashboard-account-nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>Hồ sơ cá nhân</span>
                </button>
              )}

              <button
                type="button"
                className="dashboard-account-nav-item"
                onClick={() => setIsChangePasswordOpen(true)}
              >
                <svg className="dashboard-account-nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>Đổi mật khẩu</span>
              </button>

              <div className="dashboard-account-divider" />

              <button
                type="button"
                className="dashboard-account-nav-item is-logout"
                onClick={handleLogout}
              >
                <svg className="dashboard-account-nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Đăng xuất</span>
              </button>
            </nav>
          </div>
        )}
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <span className="dashboard-topbar-eyebrow">EDUCENTER</span>
            <h1>{pageTitle === 'Tổng quan' ? 'Bảng điều khiển' : pageTitle}</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="dashboard-topbar-role">{roleLabels[role]}</span>
            <span style={{
              background: '#dbeafe',
              color: '#1d4ed8',
              padding: '0.35rem 0.85rem',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}>
              {user?.currentClass?.name || ''}
            </span>
          </div>
        </header>
        <main className="dashboard-main-content">
          <div className="dashboard-content-inner">{children}</div>
        </main>
      </div>

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
      />
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </div>
  );
};

export default DashboardLayout;
