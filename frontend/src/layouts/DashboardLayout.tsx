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
      { label: 'Học viên' },
      { label: 'Giảng viên' },
      { label: 'Báo cáo' },
      { label: 'Cài đặt' },
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
      { label: 'Cài đặt' },
    ];
  }

  if (role === 'STUDENT') {
    return [
      { label: 'Tổng quan', path: '/student/dashboard' },
      { label: 'Khóa học của tôi', path: '/student/dashboard?tab=courses' },
      { label: 'Lịch học', path: '/student/dashboard?tab=schedule' },
      { label: 'Bài tập về nhà', path: '/student/dashboard?tab=assignments' },
      { label: 'Kết quả học tập', path: '/student/dashboard?tab=grades' },
      { label: 'Thanh toán khóa học', path: '/student/tuition' },
      { label: 'Thông báo' },
      { label: 'Cài đặt' },
    ];
  }

  if (role === 'DIRECTOR') {
    return [
      { label: 'Tổng quan', path: '/director/dashboard' },
      { label: 'Quản lý nhân sự', path: '/director/dashboard?tab=staff_accounts' },
      { label: 'Giám sát vận hành', path: '/director/dashboard?tab=monitoring' },
      { label: 'Báo cáo học viên', path: '/director/dashboard?tab=student_reports' },
      { label: 'Báo cáo giảng viên', path: '/director/dashboard?tab=teacher_reports' },
      { label: 'Báo cáo lớp & khóa học', path: '/director/dashboard?tab=class_course_reports' },
      { label: 'Báo cáo tài chính & doanh thu', path: '/director/dashboard?tab=revenue_reports' },
      { label: 'Cài đặt' },
    ];
  }

  return [
    { label: 'Tổng quan', path: dashboardPaths[role] },
    { label: 'Học viên' },
    { label: 'Nhân sự' },
    { label: 'Báo cáo' },
    { label: 'Cài đặt' },
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
  const pageTitle = currentItem?.label || 'Bảng điều khiển';

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
            <div className="dashboard-user">
              <span className="dashboard-user-avatar" aria-hidden="true">
                {user.fullName.trim().charAt(0).toUpperCase()}
              </span>
              <span className="dashboard-user-info">
                <strong>{user.fullName}</strong>
                <span>{roleLabels[role]}</span>
              </span>
            </div>
            <button type="button" className="dashboard-account-action" onClick={() => setIsProfileOpen(true)}>
              Hồ sơ cá nhân
            </button>
            <button type="button" className="dashboard-account-action" onClick={() => setIsChangePasswordOpen(true)}>
              Đổi mật khẩu
            </button>
            <button type="button" className="dashboard-account-action is-logout" onClick={handleLogout}>
              Đăng xuất
            </button>
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
