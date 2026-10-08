import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!formData.fullName.trim()) {
      setError('Vui lòng nhập họ và tên.');
      return;
    }
    if (!formData.email) {
      setError('Vui lòng nhập địa chỉ email.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        fullName: formData.fullName.trim(),
        email: formData.email,
        phone: formData.phone || undefined,
        password: formData.password,
      });
      navigate('/login', {
        state: { message: 'Đăng ký tài khoản học viên thành công! Vui lòng đăng nhập.' },
      });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide" style={{ maxWidth: '520px' }}>
        <div className="auth-header">
          <div className="auth-logo">🎓</div>
          <h1 className="auth-title">Đăng ký tài khoản</h1>
          <p className="auth-subtitle">Trở thành học viên tại EduCenter</p>
        </div>

        <form
          id="register-form"
          onSubmit={handleSubmit}
          className="auth-form"
          noValidate
          aria-label="Registration form"
        >
          {error && (
            <div className="form-error-banner" role="alert" aria-live="polite">
              {error}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="register-fullname" className="form-label">
                Họ và tên <span className="required">*</span>
              </label>
              <input
                id="register-fullname"
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="form-input"
                placeholder="Nguyễn Văn A"
                autoComplete="name"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="register-phone" className="form-label">Số điện thoại</label>
              <input
                id="register-phone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="form-input"
                placeholder="0988 123 456"
                autoComplete="tel"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="register-email" className="form-label">
              Địa chỉ Email <span className="required">*</span>
            </label>
            <input
              id="register-email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              placeholder="hocvien@gmail.com"
              autoComplete="email"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="register-password" className="form-label">
                Mật khẩu <span className="required">*</span>
              </label>
              <input
                id="register-password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                placeholder="Tối thiểu 6 ký tự"
                autoComplete="new-password"
                required
                minLength={6}
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="register-confirm-password" className="form-label">
                Xác nhận mật khẩu <span className="required">*</span>
              </label>
              <input
                id="register-confirm-password"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="form-input"
                placeholder="Nhập lại mật khẩu"
                autoComplete="new-password"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <button
            id="register-submit-btn"
            type="submit"
            className="btn btn-primary btn-full"
            disabled={isSubmitting}
            style={{ marginTop: '0.75rem' }}
          >
            {isSubmitting ? (
              <span className="btn-loading">
                <span className="spinner-sm" aria-hidden="true" />
                Đang tạo tài khoản...
              </span>
            ) : 'Tạo tài khoản học viên'}
          </button>
        </form>

        <div className="auth-footer" style={{ marginTop: '1.25rem' }}>
          <p>
            Đã có tài khoản?{' '}
            <Link to="/login" className="auth-link">Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
