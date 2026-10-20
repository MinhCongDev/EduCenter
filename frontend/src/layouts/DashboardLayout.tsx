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

  const roleTasks: Record<Exclude<UserRole, 'TRAINING_STAFF'>, string[]> = {
    STUDENT: ['Khóa học của tôi', 'Lịch học', 'Kết quả học tập', 'Thông báo'],
    TEACHER: ['Lớp đang dạy', 'Lịch giảng dạy', 'Bài tập', 'Báo cáo'],
    DIRECTOR: ['Học viên', 'Nhân sự', 'Báo cáo', 'Cài đặt'],
  };

  return [
    { label: 'Tổng quan', path: dashboardPaths[role] },
    ...roleTasks[role].map((label) => ({ label })),
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
            const isCurrent = item.path === location.pathname;

            return item.path ? (
              <NavLink
                key={item.label}
                to={item.path}
                end
                className={({ isActive }) =>
                  `dashboard-nav-item${isActive ? ' is-active' : ''}`
                }
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
            <h1>Bảng điều khiển</h1>
          </div>
          <span className="dashboard-topbar-role">{roleLabels[role]}</span>
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
