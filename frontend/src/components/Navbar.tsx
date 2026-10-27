import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from './NotificationBell';
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
  const [targetScore, setTargetScore] = useState(7.5);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = () => {
    setIsUserMenuOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  const handleCycleTarget = () => {
    setTargetScore((prev) => (prev >= 8.5 ? 6.5 : Number((prev + 0.5).toFixed(1))));
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
        <Link to="/" className="dmr-logo-wrap" aria-label="EduCenter IELTS Trang chủ">
          <div className="dmr-logo-badge">
            <span style={{ fontSize: '20px' }}>🇬🇧</span>
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

        {/* Desktop Navigation Menu */}
        <ul className="dmr-nav-menu">
          {/* Về EduCenter */}
          <li className="dmr-nav-item">
            <span className="dmr-nav-link">
              Về EduCenter ▾
            </span>
            <div className="dmr-dropdown">
              <Link to="/#about" onClick={handleScrollTo('about')} className="dmr-dropdown-link">
                <span className="dmr-dropdown-title">VỀ CHÚNG TÔI</span>
                <span className="dmr-dropdown-desc">Tổ chức đào tạo IELTS chuẩn khảo thí quốc tế</span>
              </Link>
              <Link to="/#teachers" onClick={handleScrollTo('teachers')} className="dmr-dropdown-link">
                <span className="dmr-dropdown-title">Đội ngũ giảng viên 8.5+</span>
                <span className="dmr-dropdown-desc">100% giáo viên đạt 8.5 - 9.0 IELTS Overall</span>
              </Link>
              <Link to="/#reviews" onClick={handleScrollTo('reviews')} className="dmr-dropdown-link">
                <span className="dmr-dropdown-title">Bảng vàng học viên</span>
                <span className="dmr-dropdown-desc">Hơn 50.000 học viên đạt 6.5 - 8.5 IELTS</span>
              </Link>
              <Link to="/#partners" onClick={handleScrollTo('partners')} className="dmr-dropdown-link">
                <span className="dmr-dropdown-title">Đối tác IDP &amp; British Council</span>
                <span className="dmr-dropdown-desc">Đối tác đăng ký thi IELTS chính thức</span>
              </Link>
            </div>
          </li>

          {/* Lộ trình IELTS with Mega Dropdown */}
          <li className="dmr-nav-item">
            <span className="dmr-nav-link">
              Lộ trình IELTS ▾
            </span>
            <div className="dmr-dropdown dmr-mega-dropdown" style={{ minWidth: '460px' }}>
              <div style={{ padding: '4px 10px 10px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ fontSize: '11px', color: '#FCD34D', textTransform: 'uppercase', fontWeight: 800 }}>
                  CHỌN KHÓA HỌC THEO BAND ĐIỂM MỤC TIÊU
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' }}>
                <Link to="/courses" className="dmr-dropdown-link">
                  <span className="dmr-dropdown-title">
                    IELTS Mất Gốc (0 - 3.5) <span className="dmr-badge-green">Cơ bản</span>
                  </span>
                  <span className="dmr-dropdown-desc">Lấy lại nền tảng phát âm &amp; ngữ pháp</span>
                </Link>
                <Link to="/courses" className="dmr-dropdown-link">
                  <span className="dmr-dropdown-title">
                    IELTS Pre (3.5 - 4.5)
                  </span>
                  <span className="dmr-dropdown-desc">Làm quen format 4 kỹ năng</span>
                </Link>
                <Link to="/courses" className="dmr-dropdown-link">
                  <span className="dmr-dropdown-title">
                    IELTS Foundation (4.5 - 5.5)
                  </span>
                  <span className="dmr-dropdown-desc">Chiến thuật làm bài cơ bản</span>
                </Link>
                <Link to="/courses" className="dmr-dropdown-link">
                  <span className="dmr-dropdown-title">
                    IELTS Bứt Phá (5.5 - 6.5) <span className="dmr-badge-orange">HOT</span>
                  </span>
                  <span className="dmr-dropdown-desc">Đạt chuẩn du học &amp; xét tuyển ĐH</span>
                </Link>
                <Link to="/courses" className="dmr-dropdown-link">
                  <span className="dmr-dropdown-title">
                    IELTS Chuyên Sâu (6.5 - 7.5+) <span className="dmr-badge-orange">MỚI</span>
                  </span>
                  <span className="dmr-dropdown-desc">Chấm chữa Writing &amp; Speaking 1:1</span>
                </Link>
                <Link to="/courses" className="dmr-dropdown-link">
                  <span className="dmr-dropdown-title">
                    IELTS Master 8.0+
                  </span>
                  <span className="dmr-dropdown-desc">Luyện cùng cựu giám khảo chấm thi</span>
                </Link>
              </div>
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '8px' }}>
                <Link to="/courses" className="dmr-dropdown-link" style={{ flex: 1 }}>
                  <span className="dmr-dropdown-title">🎯 Lớp Online VIP 1:1</span>
                  <span className="dmr-dropdown-desc">Học qua Zoom cùng giáo viên 8.5+</span>
                </Link>
                <Link to="/courses" className="dmr-dropdown-link" style={{ flex: 1 }}>
                  <span className="dmr-dropdown-title">🏫 Lớp Offline Campus</span>
                  <span className="dmr-dropdown-desc">Phòng máy chuẩn thi IDP / BC</span>
                </Link>
              </div>
            </div>
          </li>

          {/* 4 Kỹ năng (Skills) */}
          <li className="dmr-nav-item">
            <span className="dmr-nav-link">
              4 Kỹ năng ▾
            </span>
            <div className="dmr-dropdown">
              <Link to="/courses" className="dmr-dropdown-link">
                <span className="dmr-dropdown-title">🎙️ IELTS Speaking Coaching 1:1</span>
                <span className="dmr-dropdown-desc">Sửa phát âm và phản xạ tự nhiên</span>
              </Link>
              <Link to="/courses" className="dmr-dropdown-link">
                <span className="dmr-dropdown-title">✍️ IELTS Writing Intensive</span>
                <span className="dmr-dropdown-desc">Chữa bài chi tiết theo 4 tiêu chí chấm điểm</span>
              </Link>
              <Link to="/courses" className="dmr-dropdown-link">
                <span className="dmr-dropdown-title">🎧 IELTS Listening Master</span>
                <span className="dmr-dropdown-desc">Bắt trọn keyword &amp; bẫy đề thi</span>
              </Link>
              <Link to="/courses" className="dmr-dropdown-link">
                <span className="dmr-dropdown-title">📖 IELTS Reading Skim &amp; Scan</span>
                <span className="dmr-dropdown-desc">Kỹ thuật định vị thông tin chuẩn xác</span>
              </Link>
            </div>
          </li>

          {/* Thi thử IELTS (Mock Test) */}
          <li className="dmr-nav-item">
            <span className="dmr-nav-link">
              Thi thử IELTS ▾
            </span>
            <div className="dmr-dropdown">
              <Link to="/placement-test" className="dmr-dropdown-link">
                <span className="dmr-dropdown-title">
                  🎯 Test Đầu Vào &amp; Gợi Ý Lộ Trình <span className="dmr-badge-orange">HOT</span>
                </span>
                <span className="dmr-dropdown-desc">3 bài test thực chiến chuẩn Cambridge, dự đoán Band và gợi ý khóa học</span>
              </Link>
              <Link to="/placement-test" className="dmr-dropdown-link">
                <span className="dmr-dropdown-title">
                  Mock Test Online (Computer) <span className="dmr-badge-orange">MIỄN PHÍ</span>
                </span>
                <span className="dmr-dropdown-desc">Mô phỏng 100% giao diện thi IELTS trực tuyến trên máy tính</span>
              </Link>
              <Link to="/placement-test/ielts-reading-real-02" className="dmr-dropdown-link">
                <span className="dmr-dropdown-title">
                  Thi thử Học Thuật Real Test <span className="dmr-badge-orange">MIỄN PHÍ</span>
                </span>
                <span className="dmr-dropdown-desc">Đề thi thật Cambridge có phân tích chi tiết theo từng kỹ năng</span>
              </Link>
            </div>
          </li>

          {/* Thư viện đề & Sách */}
          <li className="dmr-nav-item">
            <Link to="/#books" onClick={handleScrollTo('books')} className="dmr-nav-link">
              <span>Tài liệu &amp; Sách</span>
            </Link>
          </li>

          {/* Thông báo */}
          <li className="dmr-nav-item">
            <Link to="/announcements" className="dmr-nav-link">
              <span>Thông Báo</span>
              <span className="dmr-pulse-dot" />
            </Link>
          </li>
        </ul>

        {/* Right Action Widgets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {/* Target Score Widget: Only display for guest or students to avoid header crowding */}
          {(!isAuthenticated || user?.role === 'STUDENT') && (
            <div
              className="dmr-leaf-points"
              onClick={handleCycleTarget}
              title="Nhấp để thay đổi Target Band điểm mục tiêu của bạn!"
            >
              <span style={{ fontSize: '15px' }}>🎯</span>
              <span>Target {targetScore}+</span>
            </div>
          )}

          {/* Cart Icon: Only display for guest or students */}
          {(!isAuthenticated || user?.role === 'STUDENT') && (
            <Link to="/courses" className="dmr-store-btn" title="Cửa hàng khóa học IELTS">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                <circle cx="10" cy="21" r="1.5" />
                <circle cx="19" cy="21" r="1.5" />
              </svg>
            </Link>
          )}

          {/* Auth Section */}
          {isAuthenticated && user ? (
            <div style={{ position: 'relative' }}>
              {/* Notification bell — chỉ dành cho học viên */}
              {user.role === 'STUDENT' && <NotificationBell />}

              <div
                className="dmr-user-pill"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 10px 4px 6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.14)',
                  borderRadius: '30px',
                  border: '1px solid rgba(255, 255, 255, 0.22)',
                }}
              >
                {/* Clickable user profile trigger */}
                <div
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                  title="Nhấp để mở menu tài khoản"
                >
                  <div className="dmr-user-avatar">
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        lineHeight: 1.1,
                        maxWidth: '120px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={user.fullName}
                    >
                      {user.fullName}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: '#A0EC1D' }}>
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
                    padding: '4px 10px',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginLeft: '4px',
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
                          if (user.role === 'STUDENT') {
                            navigate('/student/profile');
                          } else {
                            setIsProfileOpen(true);
                          }
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
            to="/courses"
            onClick={() => setMobileMenuOpen(false)}
            style={{ color: '#FFF', fontWeight: 700, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
          >
            🎯 Khóa học IELTS theo Band (4.5 - 8.0+)
          </Link>
          <Link
            to="/courses"
            onClick={() => setMobileMenuOpen(false)}
            style={{ color: '#FFF', fontWeight: 700, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
          >
            🎙️ Luyện Speaking &amp; Writing Coaching 1:1
          </Link>
          <Link
            to="/courses"
            onClick={() => setMobileMenuOpen(false)}
            style={{ color: '#FFF', fontWeight: 700, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
          >
            💻 Thi thử IELTS Mock Test (Computer) Miễn phí
          </Link>
          <Link
            to="/#books"
            onClick={(e) => {
              setMobileMenuOpen(false);
              handleScrollTo('books')(e);
            }}
            style={{ color: '#FFF', fontWeight: 700, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
          >
            📚 Bộ đề Cambridge IELTS &amp; Forecast Speaking
          </Link>
          <Link
            to="/announcements"
            onClick={() => setMobileMenuOpen(false)}
            style={{ color: '#FFF', fontWeight: 700, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
          >
            📢 Thông báo
          </Link>
          <Link
            to="/#teachers"
            onClick={(e) => {
              setMobileMenuOpen(false);
              handleScrollTo('teachers')(e);
            }}
            style={{ color: '#FFF', fontWeight: 700, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
          >
            👨‍🏫 Đội ngũ Giảng viên 8.5+ - 9.0 IELTS
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
