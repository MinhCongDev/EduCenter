import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth.service';
import type { UserRole } from '../../types';
import { ForgotPasswordModal } from '../../components/ForgotPasswordModal';
import './AuthPage.css';

interface AuthPageProps {
  defaultMode?: 'login' | 'register';
}

const DEMO_ACCOUNTS = [
  { role: 'DIRECTOR' as UserRole, label: 'Giám đốc', email: 'director@educenter.edu.vn', icon: '👔' },
  { role: 'TRAINING_STAFF' as UserRole, label: 'Giáo vụ', email: 'staff@educenter.edu.vn', icon: '📋' },
  { role: 'TEACHER' as UserRole, label: 'Giảng viên', email: 'teacher.an@educenter.edu.vn', icon: '👨‍🏫' },
  { role: 'STUDENT' as UserRole, label: 'Học viên', email: 'student.dang@gmail.com', icon: '🎓' },
];

export const AuthPage: React.FC<AuthPageProps> = ({ defaultMode }) => {
  const { login, register, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Mode state: 'login' | 'register'
  const isRegisterRoute = location.pathname.includes('/register') || defaultMode === 'register';
  const [mode, setMode] = useState<'login' | 'register'>(isRegisterRoute ? 'register' : 'login');

  // Keep mode in sync if user navigates with browser back/forward buttons
  useEffect(() => {
    if (location.pathname.includes('/register')) {
      setMode('register');
    } else if (location.pathname.includes('/login')) {
      setMode('login');
    }
  }, [location.pathname]);

  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    // Update URL smoothly without full reload
    navigate(newMode === 'register' ? '/register' : '/login', { replace: true });
  };

  // ── Login State ────────────────────────────────────────────────────────
  const stateData = location.state as { from?: { pathname: string }; message?: string } | null;
  const from = stateData?.from?.pathname || null;
  const initialSuccessMessage = stateData?.message || null;

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [loginSuccessNotice, setLoginSuccessNotice] = useState<string | null>(initialSuccessMessage);

  // Forgot password modal state
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  // ── Register State ─────────────────────────────────────────────────────
  const [registerForm, setRegisterForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSubmitting, setRegisterSubmitting] = useState(false);

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setLoginError(null);
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRegisterForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setRegisterError(null);
  };

  const handleQuickFill = (email: string) => {
    setLoginForm({
      email,
      password: 'Password123@',
    });
    setLoginError(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      setLoginError('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }

    setLoginSubmitting(true);
    setLoginError(null);

    try {
      await login({ email: loginForm.email, password: loginForm.password });
      
      const storedUser = authService.getStoredUser();
      if (storedUser) {
        const dashboardPaths: Record<string, string> = {
          STUDENT: '/student/dashboard',
          TEACHER: '/teacher/dashboard',
          TRAINING_STAFF: '/staff/dashboard',
          DIRECTOR: '/director/dashboard',
        };

        const rolePrefixes: Record<string, string> = {
          STUDENT: '/student',
          TEACHER: '/teacher',
          TRAINING_STAFF: '/staff',
          DIRECTOR: '/director',
        };

        let targetPath = dashboardPaths[storedUser.role] || '/';

        if (from && !from.includes('/unauthorized') && !from.includes('/login') && !from.includes('/register')) {
          const isOtherRolePath = Object.entries(rolePrefixes).some(
            ([role, prefix]) => role !== storedUser.role && from.startsWith(prefix)
          );
          if (!isOtherRolePath) {
            targetPath = from;
          }
        }

        navigate(targetPath, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Đăng nhập không thành công. Vui lòng kiểm tra lại email và mật khẩu.';
      setLoginError(msg);
    } finally {
      setLoginSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setRegisterError(null);

    // Validation
    if (!registerForm.fullName.trim()) {
      setRegisterError('Vui lòng nhập họ và tên.');
      return;
    }
    if (!registerForm.email) {
      setRegisterError('Vui lòng nhập địa chỉ email.');
      return;
    }
    if (registerForm.password.length < 6) {
      setRegisterError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (registerForm.password !== registerForm.confirmPassword) {
      setRegisterError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setRegisterSubmitting(true);
    try {
      await register({
        fullName: registerForm.fullName.trim(),
        email: registerForm.email,
        phone: registerForm.phone || undefined,
        password: registerForm.password,
      });

      // On register success: the account is created and logged in, redirect to student dashboard
      navigate('/student/dashboard', { replace: true });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.';
      setRegisterError(msg);
    } finally {
      setRegisterSubmitting(false);
    }
  };

  // Only show a loader during the very first session verification on mount
  const [initialChecked, setInitialChecked] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setInitialChecked(true);
    }
  }, [isLoading]);

  if (!initialChecked && isLoading) {
    return (
      <div className="auth-wrapper" style={{ minHeight: '60vh' }}>
        <div className="spinner-sm" aria-label="Loading authentication..." />
      </div>
    );
  }

  return (
    <div className="auth-wrapper">
      <div className={`auth-master-card mode-${mode}`}>
        
        {/* Mobile Header with brand logo & segmented pill toggle */}
        <div className="auth-mobile-header">
          <div className="auth-logo-badge" style={{ marginBottom: '6px' }}>
            <span className="flag-icon">🇬🇧</span>
            <span className="academy-name">EduCenter IELTS</span>
          </div>
          <div className="auth-mobile-toggle-pills">
            <button
              type="button"
              className={`auth-mobile-pill ${mode === 'login' ? 'active' : ''}`}
              onClick={() => switchMode('login')}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              className={`auth-mobile-pill ${mode === 'register' ? 'active' : ''}`}
              onClick={() => switchMode('register')}
            >
              Đăng ký
            </button>
          </div>
        </div>

        {/* ── Form Containers ─────────────────────────────────────────── */}
        <div className="auth-forms-container">

          {/* 1. LOGIN FORM PANEL (Left side) */}
          <div className="auth-form-panel login-panel">
            <div className="auth-form-scroll-inner">
              <div className="auth-panel-header">
                <span className="auth-panel-badge">Chào mừng trở lại</span>
                <h1 className="auth-panel-title">Đăng nhập tài khoản</h1>
                <p className="auth-panel-subtitle">Truy cập hệ thống quản lý học tập &amp; luyện thi EduCenter</p>
              </div>

            {/* Quick Demo Fill Buttons */}
            <div className="auth-demo-accounts">
              <p className="auth-demo-title">
                <span>⚡</span> Chọn tài khoản test nhanh:
              </p>
              <div className="auth-demo-grid">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleQuickFill(acc.email)}
                    className="auth-demo-btn"
                  >
                    <span>{acc.icon}</span>
                    <span>{acc.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Alerts */}
            {loginSuccessNotice && (
              <div className="auth-alert auth-alert-success" role="status">
                <span>✅</span>
                <span>{loginSuccessNotice}</span>
              </div>
            )}

            {loginError && (
              <div className="auth-alert auth-alert-error" role="alert">
                <span>⚠️</span>
                <span>{loginError}</span>
              </div>
            )}

            <form
              id="sliding-login-form"
              onSubmit={handleLoginSubmit}
              noValidate
              aria-label="Login form"
              className="auth-fields-stack"
            >
              <div className="auth-input-group">
                <label htmlFor="auth-login-email" className="auth-input-label">
                  Địa chỉ Email <span className="req">*</span>
                </label>
                <input
                  id="auth-login-email"
                  type="email"
                  name="email"
                  value={loginForm.email}
                  onChange={handleLoginChange}
                  className="auth-input-control"
                  placeholder="ten@educenter.edu.vn"
                  autoComplete="email"
                  required
                  disabled={loginSubmitting}
                />
              </div>

              <div className="auth-input-group">
                <div className="auth-input-label">
                  <span>Mật khẩu <span className="req">*</span></span>
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className="auth-forgot-link"
                  >
                    Quên mật khẩu? (UC11)
                  </button>
                </div>
                <input
                  id="auth-login-password"
                  type="password"
                  name="password"
                  value={loginForm.password}
                  onChange={handleLoginChange}
                  className="auth-input-control"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  disabled={loginSubmitting}
                />
              </div>

              <button
                id="login-submit-btn"
                type="submit"
                className="auth-submit-btn"
                disabled={loginSubmitting}
              >
                {loginSubmitting ? (
                  <>
                    <span className="spinner-sm" aria-hidden="true" />
                    Đang đăng nhập...
                  </>
                ) : (
                  'Đăng nhập ngay'
                )}
              </button>
            </form>

            {/* Inline link for mobile view */}
            <div className="auth-mobile-switch">
              Chưa có tài khoản?
              <button
                type="button"
                className="auth-inline-switch-btn"
                onClick={() => switchMode('register')}
              >
                Đăng ký ngay
              </button>
            </div>
            </div>
          </div>

          {/* 2. REGISTER FORM PANEL (Right side) */}
          <div className="auth-form-panel register-panel">
            <div className="auth-form-scroll-inner">
              <div className="auth-panel-header">
                <span className="auth-panel-badge">Gia nhập cộng đồng IELTS</span>
                <h2 className="auth-panel-title">Tạo tài khoản học viên</h2>
                <p className="auth-panel-subtitle">Bắt đầu lộ trình chinh phục chứng chỉ quốc tế 7.5 - 8.5+</p>
              </div>

            {registerError && (
              <div className="auth-alert auth-alert-error" role="alert">
                <span>⚠️</span>
                <span>{registerError}</span>
              </div>
            )}

            <form
              id="sliding-register-form"
              onSubmit={handleRegisterSubmit}
              noValidate
              aria-label="Registration form"
              className="auth-fields-stack"
            >
              <div className="auth-input-row">
                <div className="auth-input-group">
                  <label htmlFor="auth-register-fullname" className="auth-input-label">
                    Họ và tên <span className="req">*</span>
                  </label>
                  <input
                    id="auth-register-fullname"
                    type="text"
                    name="fullName"
                    value={registerForm.fullName}
                    onChange={handleRegisterChange}
                    className="auth-input-control"
                    placeholder="Nguyễn Văn A"
                    autoComplete="name"
                    required
                    disabled={registerSubmitting}
                  />
                </div>

                <div className="auth-input-group">
                  <label htmlFor="auth-register-phone" className="auth-input-label">
                    Số điện thoại
                  </label>
                  <input
                    id="auth-register-phone"
                    type="tel"
                    name="phone"
                    value={registerForm.phone}
                    onChange={handleRegisterChange}
                    className="auth-input-control"
                    placeholder="0988 123 456"
                    autoComplete="tel"
                    disabled={registerSubmitting}
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <label htmlFor="auth-register-email" className="auth-input-label">
                  Địa chỉ Email <span className="req">*</span>
                </label>
                <input
                  id="auth-register-email"
                  type="email"
                  name="email"
                  value={registerForm.email}
                  onChange={handleRegisterChange}
                  className="auth-input-control"
                  placeholder="hocvien@gmail.com"
                  autoComplete="email"
                  required
                  disabled={registerSubmitting}
                />
              </div>

              <div className="auth-input-row">
                <div className="auth-input-group">
                  <label htmlFor="auth-register-password" className="auth-input-label">
                    Mật khẩu <span className="req">*</span>
                  </label>
                  <input
                    id="auth-register-password"
                    type="password"
                    name="password"
                    value={registerForm.password}
                    onChange={handleRegisterChange}
                    className="auth-input-control"
                    placeholder="Tối thiểu 6 ký tự"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    disabled={registerSubmitting}
                  />
                </div>

                <div className="auth-input-group">
                  <label htmlFor="auth-register-confirm" className="auth-input-label">
                    Xác nhận <span className="req">*</span>
                  </label>
                  <input
                    id="auth-register-confirm"
                    type="password"
                    name="confirmPassword"
                    value={registerForm.confirmPassword}
                    onChange={handleRegisterChange}
                    className="auth-input-control"
                    placeholder="Nhập lại mật khẩu"
                    autoComplete="new-password"
                    required
                    disabled={registerSubmitting}
                  />
                </div>
              </div>

              <button
                id="register-submit-btn"
                type="submit"
                className="auth-submit-btn"
                disabled={registerSubmitting}
              >
                {registerSubmitting ? (
                  <>
                    <span className="spinner-sm" aria-hidden="true" />
                    Đang tạo tài khoản...
                  </>
                ) : (
                  'Tạo tài khoản học viên'
                )}
              </button>
            </form>

            {/* Inline link for mobile view */}
            <div className="auth-mobile-switch">
              Đã có tài khoản?
              <button
                type="button"
                className="auth-inline-switch-btn"
                onClick={() => switchMode('login')}
              >
                Đăng nhập
              </button>
            </div>
            </div>
          </div>
        </div>

        {/* ── Sliding Overlay Panel (Curtain with Logo & Dynamic Promo) ── */}
        <div className="auth-overlay-container">
          <div className="auth-overlay">
            
            {/* Top Brand Logo Section */}
            <div className="auth-overlay-brand">
              <div className="auth-logo-badge">
                <span className="flag-icon">🇬🇧</span>
                <span className="academy-name">EduCenter IELTS</span>
              </div>
              <h3 className="auth-brand-title">
                Edu<span>Center</span>
              </h3>
              <div className="auth-brand-sub">IELTS ACADEMY 8.0+</div>
            </div>

            {/* Center Dynamic Content */}
            <div className="auth-overlay-content">
              {mode === 'login' ? (
                // Shown when in Login mode -> invites user to slide to Register
                <div>
                  <h2 className="auth-overlay-title">Bạn chưa có tài khoản?</h2>
                  <p className="auth-overlay-desc">
                    Đăng ký ngay hôm nay để nhận bài kiểm tra năng lực 4 kỹ năng miễn phí,
                    tiếp cận ngân hàng đề thi chuẩn Cambridge và nhận lộ trình cá nhân hóa!
                  </p>

                  <div className="auth-feature-list">
                    <div className="auth-feature-item">
                      <span className="auth-feature-icon">✓</span>
                      <span>Test trình độ IELTS 4 kỹ năng miễn phí</span>
                    </div>
                    <div className="auth-feature-item">
                      <span className="auth-feature-icon">✓</span>
                      <span>Lộ trình học tập tinh gọn từ giảng viên 8.5+</span>
                    </div>
                    <div className="auth-feature-item">
                      <span className="auth-feature-icon">✓</span>
                      <span>Tham gia cộng đồng hơn 50.000 học viên</span>
                    </div>
                  </div>

                  <button
                    id="switch-to-register-btn"
                    type="button"
                    className="btn-switch-mode"
                    onClick={() => switchMode('register')}
                  >
                    <span>Tạo tài khoản mới</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>
              ) : (
                // Shown when in Register mode -> invites user to slide back to Login
                <div>
                  <h2 className="auth-overlay-title">Đã có tài khoản?</h2>
                  <p className="auth-overlay-desc">
                    Đăng nhập để tiếp tục lộ trình học tập, tham gia lớp học trực tuyến,
                    luyện đề thi thử và nhận bài chữa chi tiết từ giáo viên của bạn!
                  </p>

                  <div className="auth-feature-list">
                    <div className="auth-feature-item">
                      <span className="auth-feature-icon">✓</span>
                      <span>Truy cập phòng luyện Mock Test trên máy tính</span>
                    </div>
                    <div className="auth-feature-item">
                      <span className="auth-feature-icon">✓</span>
                      <span>Kho tài liệu và bài giảng độc quyền</span>
                    </div>
                    <div className="auth-feature-item">
                      <span className="auth-feature-icon">✓</span>
                      <span>Tra cứu tiến độ học tập và điểm số</span>
                    </div>
                  </div>

                  <button
                    id="switch-to-login-btn"
                    type="button"
                    className="btn-switch-mode"
                    onClick={() => switchMode('login')}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: 'rotate(180deg)' }}>
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                    <span>Đăng nhập ngay</span>
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Details */}
            <div className="auth-overlay-footer">
              <span>🔒 Bảo mật SSL 256-bit</span>
              <span>Đối tác IDP &amp; British Council</span>
            </div>

          </div>
        </div>

      </div>

      {/* UC11: Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        onSuccess={(resetEmail) => {
          setLoginForm((prev) => ({ ...prev, email: resetEmail, password: '' }));
          setLoginSuccessNotice('Mật khẩu đã được thay đổi! Vui lòng nhập mật khẩu mới để đăng nhập.');
        }}
      />
    </div>
  );
};

export default AuthPage;
