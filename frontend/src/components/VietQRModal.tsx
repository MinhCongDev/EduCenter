import React, { useState, useEffect } from 'react';
import { paymentService } from '../services/payment.service';

export interface VietQRData {
  amount: number;
  description: string; // Nội dung chuyển khoản tự động
  invoiceCode?: string; // Mã hóa đơn / mã giao dịch
  courseTitle?: string; // Tên khóa học
  studentName?: string; // Tên học viên
  classCode?: string; // Mã lớp học
  enrollmentId?: string; // ID lượt đăng ký (dùng cho xác nhận thanh toán tự động)
}

export interface VietQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: VietQRData | null;
  onPaymentSuccess?: (payment: any) => void;
}

interface BankOption {
  id: string;
  code: string;
  name: string;
  shortName: string;
}

const SUPPORTED_BANKS: BankOption[] = [
  { id: 'MB', code: '970422', name: 'Ngân hàng Quân Đội', shortName: 'MBBank' },
  { id: 'VCB', code: '970436', name: 'Ngân hàng Ngoại Thương Việt Nam', shortName: 'Vietcombank' },
  { id: 'TCB', code: '970407', name: 'Ngân hàng Kỹ Thương Việt Nam', shortName: 'Techcombank' },
  { id: 'ICB', code: '970415', name: 'Ngân hàng Công Thương Việt Nam', shortName: 'VietinBank' },
  { id: 'BIDV', code: '970418', name: 'Ngân hàng Đầu tư và Phát triển VN', shortName: 'BIDV' },
  { id: 'ACB', code: '970416', name: 'Ngân hàng Á Châu', shortName: 'ACB' },
  { id: 'VPB', code: '970432', name: 'Ngân hàng Việt Nam Thịnh Vượng', shortName: 'VPBank' },
  { id: 'TPB', code: '970423', name: 'Ngân hàng Tiên Phong', shortName: 'TPBank' },
];

export const VietQRModal: React.FC<VietQRModalProps> = ({
  isOpen,
  onClose,
  data,
  onPaymentSuccess,
}) => {
  const [selectedBank, setSelectedBank] = useState<BankOption>(SUPPORTED_BANKS[0]);
  const [template, setTemplate] = useState<'compact2' | 'qr_only'>('compact2');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmSuccess, setConfirmSuccess] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Thông tin tài khoản thụ hưởng của trung tâm
  const ACCOUNT_NO = '988866889999';
  const ACCOUNT_NAME = 'CONG TY CO PHAN GIAO DUC EDUCENTER';

  // Lấy nội dung chuyển khoản tự động
  const transferContent = data?.description || (data?.invoiceCode ? `EDUPAY ${data.invoiceCode}` : 'HOCPHI EDUCENTER');

  // Tạo URL VietQR chuẩn
  const qrUrl = data
    ? `https://img.vietqr.io/image/${selectedBank.id}-${ACCOUNT_NO}-${template}.png?amount=${data.amount}&addInfo=${encodeURIComponent(
        transferContent
      )}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`
    : '';

  useEffect(() => {
    if (!isOpen) {
      setConfirmSuccess(false);
      setIsConfirming(false);
      setCopiedKey(null);
      setImageLoading(true);
    }
  }, [isOpen]);

  useEffect(() => {
    setImageLoading(true);
  }, [qrUrl]);

  // Đóng modal khi bấm phím ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !data) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 2000);
  };

  const formatVND = (amount: number) => {
    return `${amount.toLocaleString('vi-VN')} ₫`;
  };

  // Tải ảnh mã QR về máy
  const handleDownloadQR = async () => {
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `VietQR_EduCenter_${data.invoiceCode || 'Payment'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(qrUrl, '_blank');
    }
  };

  // Xác nhận đã chuyển khoản
  const handleConfirmTransfer = async () => {
    if (!data.enrollmentId) {
      setConfirmSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
      return;
    }

    try {
      setIsConfirming(true);
      const payment = await paymentService.processPayment({
        enrollmentId: data.enrollmentId,
        method: 'BANK_TRANSFER',
        note: `Học viên thanh toán quét mã VietQR MBBank. Nội dung: ${transferContent}`,
      });
      setConfirmSuccess(true);
      if (onPaymentSuccess) {
        onPaymentSuccess(payment);
      }
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      alert(err.message || 'Xác nhận thanh toán chưa thành công. Vui lòng kiểm tra lại!');
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        animation: 'dashFadeIn 0.2s ease-out',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        style={{
          width: '100%',
          maxWidth: '780px',
          maxHeight: '92vh',
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(16, 185, 129, 0.1)',
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            background: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%)',
            padding: '1.25rem 1.75rem',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                backdropFilter: 'blur(4px)',
              }}
            >
              📱
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                  Thanh Toán Chuyển Khoản VietQR
                </h2>
                <span
                  style={{
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    letterSpacing: '0.5px',
                  }}
                >
                  24/7 TỰ ĐỘNG
                </span>
              </div>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#d1fae5', opacity: 0.9 }}>
                Quét mã QR bằng mọi ứng dụng ngân hàng hoặc ví điện tử (Napas 247)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '1.1rem',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)')}
          >
            ✕
          </button>
        </div>

        {/* ── Body ── */}
        <div
          style={{
            padding: '1.5rem 1.75rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          {/* Thông tin gói học phí / hóa đơn thanh toán */}
          <div
            style={{
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '14px',
              padding: '1rem 1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#047857', textTransform: 'uppercase' }}>
                Khóa học & Hóa đơn cần thanh toán
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#064e3b', marginTop: '0.2rem' }}>
                {data.courseTitle || 'Khóa học EduCenter'}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#047857', marginTop: '0.2rem' }}>
                {data.classCode && <span>Lớp học: <strong>{data.classCode}</strong> • </span>}
                {data.invoiceCode && <span>Mã hóa đơn: <strong>{data.invoiceCode}</strong> • </span>}
                <span>Học viên: <strong>{data.studentName || 'Học viên'}</strong></span>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 600 }}>SỐ TIỀN CẦN THANH TOÁN</div>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#059669', letterSpacing: '-0.5px' }}>
                {formatVND(data.amount)}
              </div>
            </div>
          </div>

          {/* Grid chính: QR Code bên trái & Thông tin bên phải */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(280px, 340px) 1fr',
              gap: '1.5rem',
              alignItems: 'start',
            }}
          >
            {/* Cột Trái: Mã QR VietQR */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              {/* Khung chứa ảnh mã QR */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  minHeight: template === 'compact2' ? '320px' : '280px',
                  backgroundColor: '#ffffff',
                  border: '2px solid #10b981',
                  borderRadius: '16px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.15)',
                }}
              >
                {imageLoading && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: '14px',
                      zIndex: 2,
                    }}
                  >
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        border: '3px solid #d1fae5',
                        borderTopColor: '#059669',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                      }}
                    />
                    <span style={{ fontSize: '0.8rem', color: '#047857', marginTop: '0.5rem', fontWeight: 600 }}>
                      Đang tạo mã VietQR...
                    </span>
                  </div>
                )}

                <img
                  src={qrUrl}
                  alt="Mã QR chuyển khoản học phí VietQR"
                  onLoad={() => setImageLoading(false)}
                  onError={() => setImageLoading(false)}
                  style={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: '10px',
                    display: 'block',
                    objectFit: 'contain',
                  }}
                />
              </div>

              {/* Tùy chọn giao diện QR & Tải ảnh */}
              <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                <button
                  type="button"
                  onClick={() => setTemplate(template === 'compact2' ? 'qr_only' : 'compact2')}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    border: '1px solid #d1fae5',
                    backgroundColor: '#f0fdf4',
                    color: '#047857',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                >
                  <span>🔄</span>
                  <span>{template === 'compact2' ? 'Dạng QR Đơn giản' : 'Dạng Thẻ Ngân hàng'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadQR}
                  style={{
                    padding: '0.5rem 0.85rem',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    border: '1px solid #059669',
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>📥</span>
                  <span>Tải mã QR</span>
                </button>
              </div>

              <div style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }}>
                💡 Hỗ trợ hơn 40+ ứng dụng ngân hàng và ví Momo, ZaloPay, ViettelMoney
              </div>
            </div>

            {/* Cột Phải: Thông tin chuyển khoản chi tiết */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Chọn ngân hàng nhận */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Ngân hàng thụ hưởng:
                </label>
                <select
                  value={selectedBank.id}
                  onChange={(e) => {
                    const b = SUPPORTED_BANKS.find((x) => x.id === e.target.value);
                    if (b) setSelectedBank(b);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {SUPPORTED_BANKS.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.shortName} — {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Các trường thông tin có nút Copy */}
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                {/* Số tài khoản */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 600 }}>SỐ TÀI KHOẢN</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#047857', letterSpacing: '0.5px' }}>
                      {ACCOUNT_NO}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(ACCOUNT_NO, 'acc')}
                    style={{
                      padding: '0.4rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #d1fae5',
                      backgroundColor: copiedKey === 'acc' ? '#10b981' : '#ffffff',
                      color: copiedKey === 'acc' ? '#ffffff' : '#047857',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.2s',
                    }}
                  >
                    <span>{copiedKey === 'acc' ? '✓' : '📋'}</span>
                    <span>{copiedKey === 'acc' ? 'Đã sao chép' : 'Sao chép'}</span>
                  </button>
                </div>

                {/* Tên chủ tài khoản */}
                <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '0.6rem' }}>
                  <div style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 600 }}>TÊN NGƯỜI THỤ HƯỞNG</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0f172a' }}>{ACCOUNT_NAME}</div>
                </div>

                {/* Số tiền */}
                <div
                  style={{
                    borderTop: '1px dashed #e2e8f0',
                    paddingTop: '0.6rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 600 }}>SỐ TIỀN CHUYỂN KHOẢN</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#059669' }}>
                      {formatVND(data.amount)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(data.amount.toString(), 'amount')}
                    style={{
                      padding: '0.4rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #d1fae5',
                      backgroundColor: copiedKey === 'amount' ? '#10b981' : '#ffffff',
                      color: copiedKey === 'amount' ? '#ffffff' : '#047857',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.2s',
                    }}
                  >
                    <span>{copiedKey === 'amount' ? '✓' : '📋'}</span>
                    <span>{copiedKey === 'amount' ? 'Đã sao chép' : 'Sao chép'}</span>
                  </button>
                </div>

                {/* Nội dung chuyển khoản tự động */}
                <div
                  style={{
                    borderTop: '1px dashed #e2e8f0',
                    paddingTop: '0.6rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#fffbeb',
                    margin: '-0.25rem -0.5rem -0.5rem',
                    padding: '0.75rem',
                    borderRadius: '10px',
                    border: '1px solid #fde68a',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.725rem', color: '#b45309', fontWeight: 700 }}>
                      NỘI DUNG CHUYỂN KHOẢN (BẮT BUỘC)
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#b91c1c', letterSpacing: '0.3px' }}>
                      {transferContent}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(transferContent, 'content')}
                    style={{
                      padding: '0.4rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #f59e0b',
                      backgroundColor: copiedKey === 'content' ? '#d97706' : '#ffffff',
                      color: copiedKey === 'content' ? '#ffffff' : '#b45309',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.2s',
                    }}
                  >
                    <span>{copiedKey === 'content' ? '✓' : '📋'}</span>
                    <span>{copiedKey === 'content' ? 'Đã sao chép' : 'Sao chép'}</span>
                  </button>
                </div>
              </div>

              {/* Lưu ý chuyển khoản */}
              <div
                style={{
                  fontSize: '0.775rem',
                  color: '#475569',
                  backgroundColor: '#f1f5f9',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  lineHeight: 1.45,
                }}
              >
                ⚠️ <strong>Lưu ý:</strong> Quý học viên vui lòng giữ <strong>chính xác nội dung chuyển khoản</strong>{' '}
                để hệ thống EduCenter tự động đối soát và kích hoạt khóa học trong vòng 1-3 phút.
              </div>
            </div>
          </div>

          {/* 3 Bước hướng dẫn nhanh */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.75rem',
              paddingTop: '0.5rem',
              borderTop: '1px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: '#ecfdf5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  flexShrink: 0,
                }}
              >
                1
              </div>
              <div style={{ fontSize: '0.775rem', color: '#475569' }}>
                Mở ứng dụng <strong>Ngân hàng</strong> hoặc ví điện tử bất kỳ.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: '#ecfdf5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  flexShrink: 0,
                }}
              >
                2
              </div>
              <div style={{ fontSize: '0.775rem', color: '#475569' }}>
                Chọn <strong>Quét mã QR</strong> và quét mã hiển thị trên màn hình.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: '#ecfdf5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  flexShrink: 0,
                }}
              >
                3
              </div>
              <div style={{ fontSize: '0.775rem', color: '#475569' }}>
                Kiểm tra đúng số tiền và bấm <strong>Xác nhận chuyển</strong>.
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div
          style={{
            padding: '1rem 1.75rem',
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            {confirmSuccess ? (
              <span style={{ color: '#059669', fontWeight: 700 }}>
                ✅ Xác nhận thanh toán thành công! Đang đóng...
              </span>
            ) : (
              <span>Cần hỗ trợ thanh toán? Hotline: <strong>1900 6868</strong></span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isConfirming}
              style={{
                padding: '0.6rem 1.25rem',
                fontSize: '0.875rem',
                fontWeight: 700,
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#475569',
                cursor: 'pointer',
              }}
            >
              Đóng
            </button>

            <button
              type="button"
              onClick={handleConfirmTransfer}
              disabled={isConfirming || confirmSuccess}
              style={{
                padding: '0.6rem 1.5rem',
                fontSize: '0.875rem',
                fontWeight: 800,
                borderRadius: '10px',
                border: 'none',
                background: confirmSuccess
                  ? '#059669'
                  : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                color: '#ffffff',
                cursor: isConfirming || confirmSuccess ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)',
                transition: 'all 0.2s',
              }}
            >
              {isConfirming ? (
                <>
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255,255,255,0.4)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      animation: 'spin 0.6s linear infinite',
                    }}
                  />
                  <span>Đang ghi nhận...</span>
                </>
              ) : confirmSuccess ? (
                <>
                  <span>✓</span>
                  <span>Đã ghi nhận thanh toán</span>
                </>
              ) : (
                <>
                  <span>✅</span>
                  <span>Tôi đã chuyển khoản thành công</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VietQRModal;
