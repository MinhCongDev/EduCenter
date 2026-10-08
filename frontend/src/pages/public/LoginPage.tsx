import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth.service';
import type { UserRole } from '../../types';

const DEMO_ACCOUNTS = [
  { role: 'DIRECTOR' as UserRole, label: 'Giám đốc', email: 'director@educenter.edu.vn', icon: '👔' },
  { role: 'TRAINING_STAFF' as UserRole, label: 'Giáo vụ', email: 'staff@educenter.edu.vn', icon: '📋' },
  { role: 'TEACHER' as UserRole, label: 'Giảng viên', email: 'teacher.an@educenter.edu.vn', icon: '👨‍🏫' },
  { role: 'STUDENT' as UserRole, label: 'Học viên', email: 'student.dang@gmail.com', icon: '🎓' },
];

const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const stateData = location.state as { from?: { pathname: string }; message?: string } | null;
  const from = stateData?.from?.pathname || null;
  const successMessage = stateData?.message || null;

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleQuickFill = (email: string) => {
    setFormData({
      email,
      password: 'Password123@',
    });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await login({ email: formData.email, password: formData.password });
      
      const storedUser = authService.getStoredUser();
      if (storedUser) {
        const dashboardPaths: Record<string, string> = {
          STUDENT: '/student/dashboard',
          TEACHER: '/teacher/dashboard',
          TRAINING_STAFF: '/staff/dashboard',
          DIRECTOR: '/director/dashboard',
        };
        const targetPath = from || dashboardPaths[storedUser.role] || '/';
        navigate(targetPath, { replace: true });
      } else {
        navigate(from || '/', { replace: true });
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Đăng nhập không thành công. Vui lòng kiểm tra lại email và mật khẩu.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return null;

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: '440px' }}>
        <div className="auth-header">
          <div className="auth-logo">🎓</div>
          <h1 className="auth-title">Chào mừng trở lại</h1>
          <p className="auth-subtitle">Đăng nhập vào hệ thống EduCenter</p>
        </div>

        {successMessage && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              backgroundColor: '#ecfdf5',
              border: '1px solid #10b981',
              color: '#065f46',
              fontSize: '0.875rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>✅</span>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Quick Demo Fill Buttons for easy testing */}
        <div
          style={{
            marginBottom: '1.25rem',
            padding: '0.75rem',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px dashed #cbd5e1',
          }}
        >
          <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 0.5rem 0', fontWeight: 600 }}>
            ⚡ Chọn tài khoản test nhanh:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => handleQuickFill(acc.email)}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.35rem 0.5rem',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  justifyContent: 'center',
                  color: '#334155',
                  fontWeight: 500,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f1f5f9';
                  e.currentTarget.style.borderColor = '#94a3b8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                <span>{acc.icon}</span>
                <span>{acc.label}</span>
              </button>
            ))}
          </div>
        </div>

        <form
          id="login-form"
          onSubmit={handleSubmit}
          className="auth-form"
          noValidate
          aria-label="Login form"
        >
          {error && (
            <div className="form-error-banner" role="alert" aria-live="polite">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="login-email" className="form-label">Địa chỉ Email</label>
            <input
              id="login-email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              placeholder="ten@educenter.edu.vn"
              autoComplete="email"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password" className="form-label">Mật khẩu</label>
            <input
              id="login-password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="form-input"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              disabled={isSubmitting}
            />
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            className="btn btn-primary btn-full"
            disabled={isSubmitting}
            style={{ marginTop: '0.5rem' }}
          >
            {isSubmitting ? (
              <span className="btn-loading">
                <span className="spinner-sm" aria-hidden="true" />
                Đang đăng nhập...
              </span>
            ) : 'Đăng nhập'}
          </button>
        </form>

        <div className="auth-footer" style={{ marginTop: '1.25rem' }}>
          <p>
            Chưa có tài khoản?{' '}
            <Link to="/register" className="auth-link">Đăng ký ngay</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
