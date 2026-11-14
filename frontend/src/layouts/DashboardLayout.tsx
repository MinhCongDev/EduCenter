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
  dividerBefore?: boolean;
  icon?: React.ReactNode;
}

const navIcon = (children: React.ReactNode) => (
  <svg
    className="dashboard-nav-icon"
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const DIRECTOR_ICONS = {
  overview: navIcon(
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  announcements: navIcon(
    <>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </>
  ),
  staff: navIcon(
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  permissions: navIcon(
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  monitoring: navIcon(
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="m7 14 3-3 3 2 4-5" />
    </>
  ),
  studentReport: navIcon(
    <>
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </>
  ),
  teacherReport: navIcon(
    <>
      <path d="M2 3h20" />
      <path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3" />
      <path d="m7 21 5-5 5 5" />
    </>
  ),
  classReport: navIcon(
    <>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </>
  ),
  revenueReport: navIcon(
    <>
      <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
      <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
    </>
  ),
};

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
      { label: 'Bài kiểm tra đầu vào', path: '/staff/placement-tests' },
      { label: 'Quản lý ghi danh', path: '/staff/enrollments' },
      { label: 'Thời khóa biểu', path: '/staff/timetable' },
      { label: 'Quản lý học viên', path: '/staff/students' },
      { label: 'Quản lý giảng viên', path: '/staff/teachers' },
    ];
  }

  if (role === 'TEACHER') {
    return [
      { label: 'Tổng quan', path: '/teacher/dashboard' },
      { label: 'Lớp học & Học viên', path: '/teacher/dashboard?tab=classes_students' },
      { label: 'Lịch dạy', path: '/teacher/dashboard?tab=schedule' },
      { label: 'Điểm danh buổi học', path: '/teacher/dashboard?tab=attendance' },
      { label: 'Điểm định kỳ & Nhận xét', path: '/teacher/dashboard?tab=grades' },
    ];
  }

  if (role === 'STUDENT') {
    return [
      { label: 'Tổng quan', path: '/student/dashboard' },
      { label: 'Xem lịch học', path: '/student/schedule' },
      { label: 'Khóa học', path: '/student/classes' },
      { label: 'Chuyên cần', path: '/student/attendance' },
      { label: 'Kết quả học tập', path: '/student/progress' },
      { label: 'Thông báo', path: '/student/announcements' },
      { label: 'Thanh toán học phí', path: '/student/payments' },
    ];
  }

  if (role === 'DIRECTOR') {
    return [
      { label: 'Tổng quan', path: '/director/dashboard', icon: DIRECTOR_ICONS.overview },
      { label: 'Quản lý thông báo', path: '/director/dashboard?tab=announcements', icon: DIRECTOR_ICONS.announcements },
      { label: 'Quản lý tài khoản & phân quyền', path: '/director/dashboard?tab=account_permissions', icon: DIRECTOR_ICONS.permissions },
      { label: 'Giám sát vận hành', path: '/director/dashboard?tab=monitoring', icon: DIRECTOR_ICONS.monitoring },
      { label: 'Báo cáo học viên', path: '/director/dashboard?tab=student_reports', dividerBefore: true, icon: DIRECTOR_ICONS.studentReport },
      { label: 'Báo cáo giảng viên', path: '/director/dashboard?tab=teacher_reports', icon: DIRECTOR_ICONS.teacherReport },
      { label: 'Báo cáo lớp & khóa học', path: '/director/dashboard?tab=class_course_reports', icon: DIRECTOR_ICONS.classReport },
      { label: 'Báo cáo tài chính & doanh thu', path: '/director/dashboard?tab=revenue_reports', icon: DIRECTOR_ICONS.revenueReport },
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

        {role !== 'DIRECTOR' && (
          <div className="dashboard-nav-label">KHÔNG GIAN LÀM VIỆC</div>
        )}
        <nav className="dashboard-nav" aria-label="Điều hướng tác vụ">
          {items.map((item) => {
            const currentFull = location.pathname + (location.search || '');
            const isCurrent = item.path
              ? item.path.includes('?')
                ? currentFull === item.path
                : location.pathname === item.path && (!location.search || location.search === '')
              : false;

            const navElement = item.path ? (
              <NavLink
                to={item.path}
                className={`dashboard-nav-item${isCurrent ? ' is-active' : ''}`}
                aria-current={isCurrent ? 'page' : undefined}
              >
                <span className="dashboard-nav-item-main">
                  {item.icon}
                  <span>{item.label}</span>
                </span>
              </NavLink>
            ) : (
              <button
                type="button"
                className="dashboard-nav-item is-placeholder"
                disabled
                title="Chức năng sẽ được cập nhật trong thời gian tới"
              >
                <span className="dashboard-nav-item-main">
                  {item.icon}
                  <span>{item.label}</span>
                </span>
                <span className="dashboard-nav-status">Sắp có</span>
              </button>
            );

            return (
              <React.Fragment key={item.label}>
                {item.dividerBefore && <div className="dashboard-nav-divider" />}
                {navElement}
              </React.Fragment>
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
              <NavLink
                to={
                  role === 'TEACHER'
                    ? '/teacher/profile'
                    : role === 'TRAINING_STAFF'
                    ? '/staff/profile'
                    : role === 'DIRECTOR'
                    ? '/director/profile'
                    : '/student/profile'
                }
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
