import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types';
import { ProfileModal } from './ProfileModal';
import { ChangePasswordModal } from './ChangePasswordModal';

// Role-based dashboard path mapping
const getDashboardPath = (role: UserRole): string => {
  const paths: Record<UserRole, string> = {
    STUDENT: '/student/dashboard',
    TEACHER: '/teacher/dashboard',
    TRAINING_STAFF: '/staff/dashboard',
    DIRECTOR: '/director/dashboard',
  };
  return paths[role] || '/';
};

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = () => {
    setIsUserMenuOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  const handleHomeClick = (e: React.MouseEvent) => {
    if (location.pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      if (location.hash) {
        window.history.pushState(null, '', '/');
      }
    }
  };

  const handleCoursesClick = (e: React.MouseEvent) => {
    if (location.pathname === '/courses') {
      e.preventDefault();
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  };

  const handlePlacementTestClick = (e: React.MouseEvent) => {
    if (location.pathname === '/placement-test') {
      e.preventDefault();
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  };

  const handleAnnouncementsClick = (e: React.MouseEvent) => {
    if (location.pathname === '/announcements') {
      e.preventDefault();
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  };

  const handleScrollTo = (targetId: string) => (e: React.MouseEvent) => {
    if (location.pathname === '/') {
      e.preventDefault();
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.history.pushState(null, '', `/#${targetId}`);
      }
    }
  };

  return (
    <nav className="dmr-header" role="navigation" aria-label="Main IELTS navigation">
      <div className="dmr-header-container">
        {/* Brand Logo */}
        <Link to="/" onClick={handleHomeClick} className="dmr-logo-wrap" aria-label="EduCenter IELTS Trang chủ">
          <div className="dmr-logo-badge">
            <span>E</span>
          </div>
          <div className="dmr-logo-text">
            <span className="dmr-logo-title">
              Edu<span>Center</span>
            </span>
            <span className="dmr-logo-sub" style={{ color: '#FCD34D' }}>
              IELTS ACADEMY 8.0+
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Menu: 5 mục tinh gọn chuẩn xác */}
        <ul className="dmr-nav-menu">
          {/* Trang chủ */}
          <li className="dmr-nav-item">
            <Link
              to="/"
              onClick={handleHomeClick}
              className="dmr-nav-link"
              style={{
                color: location.pathname === '/' && !location.hash ? '#57D061' : undefined,
              }}
            >
              <span>Trang chủ</span>
            </Link>
          </li>

          {/* Khóa học */}
          <li className="dmr-nav-item">
            <Link
              to="/courses"
              onClick={handleCoursesClick}
              className="dmr-nav-link"
              style={{
                color: location.pathname.startsWith('/courses') ? '#57D061' : undefined,
              }}
            >
              <span>Khóa học</span>
            </Link>
          </li>

          {/* Thi thử */}
          <li className="dmr-nav-item">
            <Link
              to="/placement-test"
              onClick={handlePlacementTestClick}
              className="dmr-nav-link"
              style={{
                color: location.pathname.startsWith('/placement-test') ? '#57D061' : undefined,
              }}
            >
              <span>Thi thử</span>
            </Link>
          </li>

          {/* Giới thiệu */}
          <li className="dmr-nav-item">
            <Link
              to="/#about"
              onClick={handleScrollTo('about')}
              className="dmr-nav-link"
            >
              <span>Giới thiệu</span>
            </Link>
          </li>

          {/* Thông báo */}
          <li className="dmr-nav-item">
            <Link
              to="/announcements"
              onClick={handleAnnouncementsClick}
              className="dmr-nav-link"
              style={{
                color: location.pathname.startsWith('/announcements') ? '#57D061' : undefined,
              }}
            >
              <span>Thông báo</span>
              <span className="dmr-pulse-dot" />
            </Link>
          </li>
        </ul>

        {/* Right Action Widgets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {/* Auth Section */}
          {isAuthenticated && user ? (
            <div style={{ position: 'relative' }}>
              <div
                className="dmr-user-pill"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 8px 4px 6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.14)',
                  borderRadius: '30px',
                  border: '1px solid rgba(255, 255, 255, 0.22)',
                  maxWidth: '340px',
                  boxSizing: 'border-box',
                }}
              >
                {/* Clickable user profile trigger */}
                <div
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', minWidth: 0 }}
                  title="Nhấp để mở menu tài khoản"
                >
                  <div className="dmr-user-avatar" style={{ flexShrink: 0 }}>
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        lineHeight: 1.2,
                        maxWidth: '170px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'block',
                      }}
                      title={user.fullName}
                    >
                      {user.fullName}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: '#A0EC1D', lineHeight: 1 }}>
                      {user.role} ▾
                    </span>
                  </div>
                </div>

                {/* Prominent, guaranteed-visible Logout button */}
                <button
                  id="navbar-logout-btn"
                  type="button"
                  onClick={handleLogout}
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.25)',
                    border: '1px solid rgba(239, 68, 68, 0.45)',
                    color: '#FFB4A2',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    fontWeight: 700,
                    padding: '4px 8px',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginLeft: '2px',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#ef4444';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.25)';
                    e.currentTarget.style.color = '#FFB4A2';
                  }}
                  title="Đăng xuất khỏi hệ thống"
                >
                  <span>🚪</span>
                  <span>Đăng xuất</span>
                </button>
              </div>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <>
                  <div
                    style={{ position: 'fixed', inset: 0, zIndex: 1050 }}
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      width: '230px',
                      backgroundColor: '#052F2E',
                      border: '1px solid rgba(87, 208, 97, 0.35)',
                      borderRadius: '14px',
                      boxShadow: '0 12px 36px rgba(0, 0, 0, 0.5)',
                      padding: '8px',
                      zIndex: 1100,
                      color: '#ffffff',
                    }}
                  >
                    <div style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff' }}>
                        {user.fullName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#9AE6B4' }}>
                        {user.email}
                      </div>
                      <div style={{ marginTop: '4px' }}>
                        <span className="dmr-badge-gold" style={{ fontSize: '0.7rem' }}>
                          {user.role}
                        </span>
                      </div>
                    </div>

                    <div style={{ padding: '6px 0', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <Link
                        to={getDashboardPath(user.role)}
                        onClick={() => setIsUserMenuOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          color: '#ffffff',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        <span>📊</span>
                        <span>Dashboard của tôi</span>
                      </Link>

                      {user.role === 'STUDENT' && (
                        <Link
                          to="/student/payments"
                          onClick={() => setIsUserMenuOpen(false)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 10px',
                            borderRadius: '8px',
                            color: '#FCD34D',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            textDecoration: 'none',
                          }}
                        >
                          <span>💳</span>
                          <span>Học phí & Thanh toán</span>
                        </Link>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          const profilePath =
                            user.role === 'TEACHER'
                              ? '/teacher/profile'
                              : user.role === 'TRAINING_STAFF'
                              ? '/staff/profile'
                              : user.role === 'DIRECTOR'
                              ? '/director/profile'
                              : '/student/profile';
                          navigate(profilePath);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          color: '#ffffff',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          width: '100%',
                          textAlign: 'left',
                        }}
                      >
                        <span>👤</span>
                        <span>Hồ sơ cá nhân</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setIsChangePasswordOpen(true);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          color: '#ffffff',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          width: '100%',
                          textAlign: 'left',
                        }}
                      >
                        <span>🔐</span>
                        <span>Đổi mật khẩu</span>
                      </button>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '6px' }}>
                      <button
                        type="button"
                        onClick={handleLogout}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          color: '#ff8585',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: 'none',
                          cursor: 'pointer',
                          width: '100%',
                          textAlign: 'left',
                        }}
                      >
                        <span>🚪</span>
                        <span>Đăng xuất (Thoát)</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="dmr-auth-pill">
              <Link to="/login" className="dmr-auth-link">
                Đăng nhập
              </Link>
              <span style={{ opacity: 0.7 }}>/</span>
              <Link to="/register" className="dmr-auth-link">
                Đăng ký
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            className="dmr-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'absolute',
            top: '76px',
            left: 0,
            right: 0,
            backgroundColor: '#052F2E',
            padding: '20px',
            borderBottom: '3px solid #57D061',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
          }}
        >
          <Link
            to="/"
            onClick={(e) => {
              setMobileMenuOpen(false);
              handleHomeClick(e);
            }}
            style={{ color: '#FFF', fontWeight: 700, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
          >
            🏠 Trang chủ
          </Link>
          <Link
            to="/courses"
            onClick={(e) => {
              setMobileMenuOpen(false);
              handleCoursesClick(e);
            }}
            style={{ color: '#FFF', fontWeight: 700, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
          >
            📚 Khóa học
          </Link>
          <Link
            to="/placement-test"
            onClick={(e) => {
              setMobileMenuOpen(false);
              handlePlacementTestClick(e);
            }}
            style={{ color: '#FFF', fontWeight: 700, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
          >
            🎯 Thi thử
          </Link>
          <Link
            to="/#about"
            onClick={(e) => {
              setMobileMenuOpen(false);
              handleScrollTo('about')(e);
            }}
            style={{ color: '#FFF', fontWeight: 700, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
          >
            ℹ️ Giới thiệu
          </Link>
          <Link
            to="/announcements"
            onClick={(e) => {
              setMobileMenuOpen(false);
              handleAnnouncementsClick(e);
            }}
            style={{ color: '#FFF', fontWeight: 700, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
          >
            📢 Thông báo
          </Link>
          {isAuthenticated && user ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="dmr-user-avatar">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '0.9rem' }}>{user.fullName}</div>
                  <div style={{ color: '#A0EC1D', fontSize: '0.75rem' }}>{user.role}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Link
                  to={getDashboardPath(user.role)}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    color: '#FFF',
                    padding: '9px',
                    borderRadius: '20px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    textDecoration: 'none',
                  }}
                >
                  📊 Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    backgroundColor: '#ef4444',
                    color: '#FFF',
                    padding: '9px',
                    borderRadius: '20px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  🚪 Đăng xuất
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  backgroundColor: '#EC6E23',
                  color: '#FFF',
                  padding: '10px',
                  borderRadius: '25px',
                  fontWeight: 700,
                }}
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  backgroundColor: '#57D061',
                  color: '#07403F',
                  padding: '10px',
                  borderRadius: '25px',
                  fontWeight: 800,
                }}
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Update Personal Information Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </nav>
  );
};

export default Navbar;
