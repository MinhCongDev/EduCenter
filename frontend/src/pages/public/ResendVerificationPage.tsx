import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import './EmailVerification.css';

interface ResendSuccess {
  email: string;
}

const ResendVerificationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<ResendSuccess | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = email.trim();

    if (!trimmed) {
      setError('Vui lòng nhập địa chỉ email.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await authService.resendVerificationEmail(trimmed);
      setSuccess({
        email: response.data?.email ?? trimmed,
      });
    } catch (err: unknown) {
      const message = (
        err as { response?: { data?: { message?: string } } }
      )?.response?.data?.message;
      setError(message || 'Không thể gửi lại email xác thực. Vui lòng thử lại sau.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="verify-wrapper">
      <div className="verify-card">
        <div className="verify-brand">
          <span className="verify-brand-mark">🎓</span>
          <span className="verify-brand-name">EduCenter</span>
        </div>

        {success ? (
          <>
            <div className="verify-icon verify-icon-success" aria-hidden="true">
              ✓
            </div>
            <h1 className="verify-title">Đã gửi lại email xác thực</h1>
            <p className="verify-text">
              Chúng tôi đã gửi một liên kết xác thực mới tới{' '}
              <strong className="verify-email">{success.email}</strong>.
            </p>
            <p className="verify-note">
              Liên kết có hiệu lực trong 15 phút. Hãy kiểm tra cả thư mục Spam.
            </p>

            <div className="verify-actions">
              <button type="button" className="verify-btn" onClick={() => setSuccess(null)}>
                Gửi lại lần nữa
              </button>
              <Link to="/login" className="verify-btn verify-btn-secondary">
                Quay lại đăng nhập
              </Link>
            </div>
          </>
        ) : (
          <>
            <h1 className="verify-title">Gửi lại email xác thực</h1>
            <p className="verify-text">
              Nhập địa chỉ email bạn đã dùng để đăng ký. Chúng tôi sẽ gửi lại liên kết kích hoạt
              tài khoản.
            </p>

            {error && (
              <div className="verify-alert" role="alert">
                {error}
              </div>
            )}

            <form className="verify-form" onSubmit={handleSubmit} noValidate>
              <label htmlFor="resend-email" className="verify-label">
                Địa chỉ email
              </label>
              <input
                id="resend-email"
                type="email"
                className="verify-input"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                placeholder="ten@example.com"
                autoComplete="email"
                required
                disabled={submitting}
              />

              <button type="submit" className="verify-btn" disabled={submitting}>
                {submitting ? 'Đang gửi…' : 'Gửi lại email xác thực'}
              </button>
            </form>

            <Link to="/login" className="verify-back-link">
              ← Quay lại đăng nhập
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default ResendVerificationPage;
