import React, { useState } from 'react';
import { authService } from '../services/auth.service';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (email: string) => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Vui lòng nhập địa chỉ email.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const res = await authService.forgotPassword({ email: email.trim() });
      if (res.success) {
        setResetCode('');
        setMessage(
          `Mã xác nhận đã được gửi tới ${email.trim()}. Vui lòng kiểm tra hộp thư (cả thư mục Spam) rồi nhập mã 6 chữ số bên dưới.`
        );
        setStep(2);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Có lỗi xảy ra khi yêu cầu cấp lại mật khẩu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (!email.trim()) {
      setStep(1);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const res = await authService.forgotPassword({ email: email.trim() });
      if (res.success) {
        setMessage(
          `Mã xác nhận mới đã được gửi tới ${email.trim()}. Vui lòng kiểm tra email của bạn.`
        );
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể gửi lại mã xác nhận.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCode.trim() || !newPassword) {
      setError('Vui lòng nhập đầy đủ mã xác nhận và mật khẩu mới.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await authService.resetPassword({
        email: email.trim(),
        resetCode: resetCode.trim(),
        newPassword,
      });

      if (res.success) {
        setMessage('Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.');
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess(email);
        }, 1500);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Mã xác thực không hợp lệ hoặc đã hết hạn.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
        backdropFilter: 'blur(3px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '460px',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #07403F 0%, #052F2E 100%)',
            color: '#FFFFFF',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.4rem' }}>🔑</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
                Quên Mật Khẩu
              </h3>
              <span style={{ fontSize: '0.8rem', color: '#FCD34D' }}>
                Bước {step}/2: {step === 1 ? 'Nhập email nhận mã' : 'Đặt mật khẩu mới'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: '#FFFFFF',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {error && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                backgroundColor: '#fee2e2',
                color: '#991b1b',
                fontSize: '0.875rem',
                marginBottom: '1rem',
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {message && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                backgroundColor: '#ecfdf5',
                color: '#065f46',
                fontSize: '0.875rem',
                marginBottom: '1rem',
                border: '1px solid #a7f3d0',
              }}
            >
              ✅ {message}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleRequestCode}>
              <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '1.25rem' }}>
                Nhập địa chỉ email tài khoản của bạn để nhận mã xác thực đặt lại mật khẩu trong 15 phút.
              </p>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Địa chỉ Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student.dang@gmail.com"
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '0.55rem 1.1rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '0.55rem 1.25rem',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#EC6E23',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isSubmitting ? 'Đang gửi...' : 'Gửi Mã Xác Thực'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPassword}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Mã xác nhận (6 chữ số) *
                </label>
                <input
                  type="text"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder="Nhập 6 chữ số..."
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '1rem',
                    fontWeight: 700,
                    letterSpacing: '2px',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Mật khẩu mới (Tối thiểu 6 ký tự) *
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Xác nhận mật khẩu mới *
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={isSubmitting}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    fontSize: '0.85rem',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    padding: 0,
                  }}
                >
                  ← Gửi lại mã
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '0.55rem 1.25rem',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#10b981',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isSubmitting ? 'Đang xác nhận...' : 'Đặt Lại Mật Khẩu'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
