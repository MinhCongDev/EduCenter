import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [leafCount, setLeafCount] = useState(0);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleCollectLeaf = () => {
    setLeafCount((prev) => prev + 10);
  };

  return (
    <nav className="dmr-header" role="navigation" aria-label="Main navigation">
      <div className="dmr-header-container">
        {/* Brand Logo */}
        <Link to="/" className="dmr-logo-wrap" aria-label="EduCenter Trang chủ">
          <div className="dmr-logo-badge">
            <span>🎓</span>
          </div>
          <div className="dmr-logo-text">
            <span className="dmr-logo-title">
              Edu<span>Center</span>
            </span>
            <span className="dmr-logo-sub">Dũng Mori Style</span>
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
              <Link to="/#about" className="dmr-dropdown-link">
                <span className="dmr-dropdown-title">VỀ CHÚNG TÔI</span>
                <span className="dmr-dropdown-desc">Lịch sử hình thành và phát triển</span>
              </Link>
              <Link to="/#teachers" className="dmr-dropdown-link">
                <span className="dmr-dropdown-title">Đội ngũ giáo viên</span>
                <span className="dmr-dropdown-desc">Thầy Dũng, Cô Thanh, Thầy Nghĩa</span>
              </Link>
              <Link to="/#reviews" className="dmr-dropdown-link">
                <span className="dmr-dropdown-title">Review học viên</span>
                <span className="dmr-dropdown-desc">Chia sẻ của hơn 660.000 học viên</span>
              </Link>
              <Link to="/announcements" className="dmr-dropdown-link">
                <span className="dmr-dropdown-title">Tin tức & Sự kiện</span>
                <span className="dmr-dropdown-desc">Cập nhật thông tin kỳ thi JLPT</span>
              </Link>
            </div>
          </li>

          {/* Sự kiện */}
          <li className="dmr-nav-item">
            <Link to="/announcements" className="dmr-nav-link">
              <span>Sự kiện</span>
              <span className="dmr-pulse-dot" />
            </Link>
          </li>

          {/* JLPT with Mega Dropdown */}
          <li className="dmr-nav-item">
            <span className="dmr-nav-link">
              JLPT ▾
            </span>
            <div className="dmr-dropdown dmr-mega-dropdown">
              <div style={{ padding: '4px 10px 10px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ fontSize: '11px', color: '#9AE6B4', textTransform: 'uppercase', fontWeight: 700 }}>
                  Học qua App / Web / Zoom
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '8px' }}>
                <Link to="/courses" className="dmr-dropdown-link">
                  <span className="dmr-dropdown-title">
                    Gungun N5 <span className="dmr-badge-green">Cơ bản</span>
                  </span>
                </Link>
                <Link to="/courses" className="dmr-dropdown-link">
                  <span className="dmr-dropdown-title">Gungun N4</span>
                </Link>
                <Link to="/courses" className="dmr-dropdown-link">
                  <span className="dmr-dropdown-title">
                    Gungun N3 <span className="dmr-badge-orange">MỚI</span>
                  </span>
                </Link>
                <Link to="/courses" className="dmr-dropdown-link">
                  <span className="dmr-dropdown-title">
                    Gungun N2 <span className="dmr-badge-orange">MỚI</span>
                  </span>
                </Link>
                <Link to="/courses" className="dmr-dropdown-link">
                  <span className="dmr-dropdown-title">
                    Gungun N1 <span className="dmr-badge-orange">MỚI</span>
                  </span>
                </Link>
                <Link to="/courses" className="dmr-dropdown-link">
                  <span className="dmr-dropdown-title">
                    Chữ Hán N5 <span className="dmr-badge-orange">MIỄN PHÍ</span>
                  </span>
                </Link>
              </div>
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '8px' }}>
                <Link to="/courses" className="dmr-dropdown-link" style={{ flex: 1 }}>
                  <span className="dmr-dropdown-title">🎯 Online VIP Zoom</span>
                  <span className="dmr-dropdown-desc">Học trực tiếp cùng giáo viên</span>
                </Link>
                <Link to="/courses" className="dmr-dropdown-link" style={{ flex: 1 }}>
                  <span className="dmr-dropdown-title">🏫 Lớp Offline</span>
                  <span className="dmr-dropdown-desc">Tại Hà Nội & TP. HCM</span>
                </Link>
              </div>
            </div>
          </li>

          {/* Giao tiếp (Kaiwa) */}
          <li className="dmr-nav-item">
            <Link to="/courses" className="dmr-nav-link">
              <span>Giao tiếp</span>
            </Link>
          </li>

          {/* Sách */}
          <li className="dmr-nav-item">
            <Link to="/#books" className="dmr-nav-link">
              <span>Sách</span>
            </Link>
          </li>

          {/* JFT & Tokutei */}
          <li className="dmr-nav-item">
            <span className="dmr-nav-link">
              JFT &amp; TOKUTEI ▾
            </span>
            <div className="dmr-dropdown">
              <Link to="/courses" className="dmr-dropdown-link">
                <span className="dmr-dropdown-title">
                  Thi thử JFT-Basic <span className="dmr-badge-orange">MIỄN PHÍ</span>
                </span>
                <span className="dmr-dropdown-desc">Thi thử theo chuẩn format mới</span>
              </Link>
              <Link to="/courses" className="dmr-dropdown-link">
                <span className="dmr-dropdown-title">
                  Đề thi Tokutei có đáp án <span className="dmr-badge-orange">MIỄN PHÍ</span>
                </span>
                <span className="dmr-dropdown-desc">Kèm giải thích chi tiết</span>
              </Link>
            </div>
          </li>

          {/* Khóa học */}
          <li className="dmr-nav-item">
            <Link to="/courses" className="dmr-nav-link">
              <span>Khóa học</span>
            </Link>
          </li>
        </ul>

        {/* Right Action Widgets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Gamification Leaf points */}
          <div
            className="dmr-leaf-points"
            onClick={handleCollectLeaf}
            title="Nhấp để nhận thêm lá điểm thưởng tích lũy!"
          >
            <span style={{ fontSize: '16px' }}>🌿</span>
            <span>{leafCount} Lá</span>
          </div>

          {/* Cart Icon */}
          <Link to="/courses" className="dmr-store-btn" title="Cửa hàng khóa học">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              <circle cx="10" cy="21" r="1.5" />
              <circle cx="19" cy="21" r="1.5" />
            </svg>
          </Link>

          {/* Auth Section */}
          {isAuthenticated && user ? (
            <div className="dmr-user-pill">
              <div className="dmr-user-avatar">
                {user.fullName.charAt(0).toUpperCase()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, lineHeight: 1.1 }}>
                  {user.fullName}
                </span>
                <span style={{ fontSize: '0.7rem', color: '#A0EC1D' }}>
                  {user.role}
                </span>
              </div>
              <Link
                to={getDashboardPath(user.role)}
                style={{
                  color: '#FFFFFF',
                  background: 'rgba(255,255,255,0.18)',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#FFB4A2',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  padding: '0 4px',
                }}
                title="Đăng xuất"
              >
                Thoát
              </button>
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
            📚 Khóa học JLPT (N5 - N1)
          </Link>
          <Link
            to="/courses"
            onClick={() => setMobileMenuOpen(false)}
            style={{ color: '#FFF', fontWeight: 700, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
          >
            🗣️ Khóa Giao tiếp Kaiwa
          </Link>
          <Link
            to="/#books"
            onClick={() => setMobileMenuOpen(false)}
            style={{ color: '#FFF', fontWeight: 700, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
          >
            📖 Bộ giáo trình & Sách
          </Link>
          <Link
            to="/announcements"
            onClick={() => setMobileMenuOpen(false)}
            style={{ color: '#FFF', fontWeight: 700, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
          >
            📢 Tin tức & Thông báo
          </Link>
          <Link
            to="/#teachers"
            onClick={() => setMobileMenuOpen(false)}
            style={{ color: '#FFF', fontWeight: 700, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
          >
            👨‍🏫 Đội ngũ Giảng viên
          </Link>
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
        </div>
      )}
    </nav>
  );
};

export default Navbar;
