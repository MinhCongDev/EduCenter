import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import type { ApiResponse } from '../../types';
import { getApiErrorMessage } from '../../utils/apiError';
import './EmailVerification.css';

type Status = 'loading' | 'success' | 'invalid' | 'error';

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('');

  // Reuse the same request across React 19 StrictMode's double effect run.
  const requestRef = useRef<Promise<ApiResponse<{ email: string }>> | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      setMessage('Liên kết xác thực không hợp lệ hoặc đã hết hạn.');
      return;
    }

    let active = true;

    if (!requestRef.current) {
      requestRef.current = authService.verifyEmail(token);
    }

    requestRef.current
      .then((result) => {
        if (!active) return;
        setStatus('success');
        setMessage(result.message || 'Xác thực email thành công!');
      })
      .catch((err: unknown) => {
        if (!active) return;
        const response = (
          err as {
            response?: {
              status?: number;
              data?: { message?: string; code?: string };
            };
          }
        )?.response;

        const isInvalid =
          response?.data?.code === 'VALIDATION_INVALID_TOKEN' || response?.status === 400;

        setStatus(isInvalid ? 'invalid' : 'error');
        setMessage(
          getApiErrorMessage(err, 'Không thể xác thực email lúc này. Vui lòng thử lại sau.')
        );
      });

    return () => {
      active = false;
    };
  }, [token]);

  // Auto-redirect to login a few seconds after a successful verification.
  useEffect(() => {
    if (status !== 'success') return;
    const timer = window.setTimeout(() => navigate('/login', { replace: true }), 5000);
    return () => window.clearTimeout(timer);
  }, [status, navigate]);

  return (
    <div className="verify-wrapper">
      <div className="verify-card">
        <div className="verify-brand">
          <span className="verify-brand-mark">🎓</span>
          <span className="verify-brand-name">EduCenter</span>
        </div>

        {status === 'loading' && (
          <>
            <div className="verify-spinner" aria-label="Đang xác thực email" />
            <h1 className="verify-title">Đang xác thực email…</h1>
            <p className="verify-text">Vui lòng chờ trong giây lát.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="verify-icon verify-icon-success" aria-hidden="true">
              ✓
            </div>
            <h1 className="verify-title">Xác thực email thành công!</h1>
            <p className="verify-text">{message}</p>
            <p className="verify-note">
              Bạn sẽ được chuyển tới trang đăng nhập sau vài giây.
            </p>
            <Link to="/login" className="verify-btn">
              Đăng nhập ngay
            </Link>
          </>
        )}

        {status === 'invalid' && (
          <>
            <div className="verify-icon verify-icon-error" aria-hidden="true">
              !
            </div>
            <h1 className="verify-title">Liên kết không hợp lệ hoặc đã hết hạn</h1>
            <p className="verify-text">{message}</p>
            <p className="verify-note">
              Liên kết xác thực chỉ có hiệu lực trong 15 phút. Bạn có thể yêu cầu gửi lại email.
            </p>
            <div className="verify-actions">
              <Link to="/resend-verification" className="verify-btn">
                Gửi lại email xác thực
              </Link>
              <Link to="/login" className="verify-btn verify-btn-secondary">
                Quay lại đăng nhập
              </Link>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="verify-icon verify-icon-error" aria-hidden="true">
              !
            </div>
            <h1 className="verify-title">Không thể xác thực email</h1>
            <p className="verify-text">{message}</p>
            <div className="verify-actions">
              <button
                type="button"
                className="verify-btn"
                onClick={() => window.location.reload()}
              >
                Thử lại
              </button>
              <Link to="/login" className="verify-btn verify-btn-secondary">
                Quay lại đăng nhập
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
