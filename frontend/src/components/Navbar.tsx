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
  const [targetScore, setTargetScore] = useState(7.5);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleCycleTarget = () => {
    setTargetScore((prev) => (prev >= 8.5 ? 6.5 : Number((prev + 0.5).toFixed(1))));
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
              <Link to="/#about" className="dmr-dropdown-link">
                <span className="dmr-dropdown-title">VỀ CHÚNG TÔI</span>
                <span className="dmr-dropdown-desc">Tổ chức đào tạo IELTS chuẩn khảo thí quốc tế</span>
              </Link>
              <Link to="/#teachers" className="dmr-dropdown-link">
                <span className="dmr-dropdown-title">Đội ngũ giảng viên 8.5+</span>
                <span className="dmr-dropdown-desc">100% giáo viên đạt 8.5 - 9.0 IELTS Overall</span>
              </Link>
              <Link to="/#reviews" className="dmr-dropdown-link">
                <span className="dmr-dropdown-title">Bảng vàng học viên</span>
                <span className="dmr-dropdown-desc">Hơn 50.000 học viên đạt 6.5 - 8.5 IELTS</span>
              </Link>
              <Link to="/#partners" className="dmr-dropdown-link">
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
              <Link to="/courses" className="dmr-dropdown-link">
                <span className="dmr-dropdown-title">
                  Mock Test Online (Computer) <span className="dmr-badge-orange">MIỄN PHÍ</span>
                </span>
                <span className="dmr-dropdown-desc">Mô phỏng 100% phần mềm thi IELTS trên máy tính</span>
              </Link>
              <Link to="/courses" className="dmr-dropdown-link">
                <span className="dmr-dropdown-title">
                  Thi thử Offline tại cơ sở <span className="dmr-badge-orange">MIỄN PHÍ</span>
                </span>
                <span className="dmr-dropdown-desc">Phòng thi trang bị tai nghe cách âm chuyên dụng</span>
              </Link>
            </div>
          </li>

          {/* Thư viện đề & Sách */}
          <li className="dmr-nav-item">
            <Link to="/#books" className="dmr-nav-link">
              <span>Tài liệu &amp; Sách</span>
            </Link>
          </li>

          {/* Sự kiện / Workshop */}
          <li className="dmr-nav-item">
            <Link to="/announcements" className="dmr-nav-link">
              <span>Workshop 8.0+</span>
              <span className="dmr-pulse-dot" />
            </Link>
          </li>
        </ul>

        {/* Right Action Widgets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Target Score Widget */}
          <div
            className="dmr-leaf-points"
            onClick={handleCycleTarget}
            title="Nhấp để thay đổi Target Band điểm mục tiêu của bạn!"
          >
            <span style={{ fontSize: '15px' }}>🎯</span>
            <span>Target {targetScore}+</span>
          </div>

          {/* Cart Icon */}
          <Link to="/courses" className="dmr-store-btn" title="Cửa hàng khóa học IELTS">
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
            onClick={() => setMobileMenuOpen(false)}
            style={{ color: '#FFF', fontWeight: 700, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
          >
            📚 Bộ đề Cambridge IELTS &amp; Forecast Speaking
          </Link>
          <Link
            to="/announcements"
            onClick={() => setMobileMenuOpen(false)}
            style={{ color: '#FFF', fontWeight: 700, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
          >
            🔥 Workshop Chiến thuật Đạt 8.0+ IELTS
          </Link>
          <Link
            to="/#teachers"
            onClick={() => setMobileMenuOpen(false)}
            style={{ color: '#FFF', fontWeight: 700, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
          >
            👨‍🏫 Đội ngũ Giảng viên 8.5+ - 9.0 IELTS
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
