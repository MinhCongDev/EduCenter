import React, { useState, useEffect } from 'react';
import { paymentService } from '../services/payment.service';

export interface VietQRData {
  amount: number;
  description: string; // Nội dung chuyển khoản tự động
  invoiceCode?: string; // Mã hóa đơn / mã giao dịch
  courseTitle?: string; // Tên khóa học
  courseId?: string; // ID khóa học
  studentName?: string; // Tên học viên
  classCode?: string; // Mã lớp học
  enrollmentId?: string; // ID lượt đăng ký (dùng cho xác nhận thanh toán tự động)
  gateway?: 'VIETQR' | 'VNPAY'; // Mặc định mở tab nào
  paymentId?: string; // ID giao dịch nếu có sẵn
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
  const [activeGateway, setActiveGateway] = useState<'VIETQR' | 'VNPAY'>('VIETQR');
  const [selectedBank, setSelectedBank] = useState<BankOption>(SUPPORTED_BANKS[0]);
  const [template, setTemplate] = useState<'compact2' | 'qr_only'>('compact2');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmSuccess, setConfirmSuccess] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [customAmount, setCustomAmount] = useState<number>(0);

  // Quản lý bản ghi giao dịch thanh toán trên cơ sở dữ liệu
  const [pendingPayment, setPendingPayment] = useState<any>(null);
  const [isInitiating, setIsInitiating] = useState<boolean>(false);
  const [activeTxnCode, setActiveTxnCode] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Thông tin tài khoản thụ hưởng của trung tâm
  const ACCOUNT_NO = '988866889999';
  const ACCOUNT_NAME = 'CONG TY CO PHAN GIAO DUC EDUCENTER';

  // Số tiền hiệu lực
  const effectiveAmount = data?.amount && data.amount > 0 ? data.amount : customAmount;

  // Lấy nội dung chuyển khoản tự động (ưu tiên mã giao dịch do server sinh ra)
  const transferContent =
    activeTxnCode ||
    data?.description ||
    (data?.invoiceCode ? `EDUPAY ${data.invoiceCode}` : 'HOCPHI EDUCENTER');

  // Tạo URL VietQR chuẩn
  const vietQrUrl =
    `https://img.vietqr.io/image/${selectedBank.id}-${ACCOUNT_NO}-${template}.png?amount=${effectiveAmount}&addInfo=${encodeURIComponent(
      transferContent
    )}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;

  // Tạo URL VNPay-QR mô phỏng chuẩn EMVCo
  const vnpayQrUrl =
    activeGateway === 'VNPAY'
      ? `https://img.vietqr.io/image/MB-${ACCOUNT_NO}-compact2.png?amount=${effectiveAmount}&addInfo=${encodeURIComponent(
          `VNPAY ${transferContent}`
        )}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`
      : vietQrUrl;

  const currentQrUrl = activeGateway === 'VNPAY' ? vnpayQrUrl : vietQrUrl;

  // Gọi POST /api/payments để tạo bản ghi giao dịch PENDING trên database
  const initPendingPayment = async (amountToPay: number, gatewayChoice: 'VIETQR' | 'VNPAY') => {
    if (amountToPay <= 0) return;
    try {
      setIsInitiating(true);
      const res = await paymentService.createPayment({
        enrollmentId: data?.enrollmentId,
        courseId: data?.courseId,
        amount: amountToPay,
        paymentMethod: gatewayChoice === 'VNPAY' ? 'VNPAY' : 'VIETQR',
        note: data?.description || (data?.invoiceCode ? `EDUPAY ${data.invoiceCode}` : 'HOCPHI EDUCENTER'),
        transactionCode: data?.invoiceCode,
        invoiceId: data?.invoiceCode,
      });
      setPendingPayment(res);
      if (res.transactionCode) {
        setActiveTxnCode(res.transactionCode);
      }
    } catch (err: any) {
      console.warn('Không thể khởi tạo giao dịch pending:', err);
    } finally {
      setIsInitiating(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setConfirmSuccess(false);
      setIsConfirming(false);
      setCopiedKey(null);
      setImageLoading(true);
      setPendingPayment(null);
      setActiveTxnCode('');
      setToastMessage(null);
    } else {
      const initialGateway = data?.gateway || 'VIETQR';
      setActiveGateway(initialGateway);

      const initialAmount = data?.amount && data.amount > 0 ? data.amount : 5000000;
      if (!data?.amount || data.amount <= 0) {
        setCustomAmount(initialAmount);
      }

      // Khởi tạo bản ghi giao dịch PENDING ngay khi mở popup
      initPendingPayment(initialAmount, initialGateway);
    }
  }, [isOpen, data]);

  useEffect(() => {
    setImageLoading(true);
  }, [currentQrUrl, activeGateway, selectedBank, template, effectiveAmount]);

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
      const response = await fetch(currentQrUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${activeGateway}_EduCenter_${activeTxnCode || data.invoiceCode || 'Payment'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(currentQrUrl, '_blank');
    }
  };

  // Xác nhận đã chuyển khoản -> Gọi PUT /api/payments/:id/confirm
  const handleConfirmTransfer = async () => {
    try {
      setIsConfirming(true);
      let paymentResult: any = null;

      // Ưu tiên gọi PUT /api/payments/:id/confirm với _id của bản ghi PENDING đã tạo trên DB
      const paymentIdToConfirm = pendingPayment?._id || data.paymentId;
      if (paymentIdToConfirm) {
        paymentResult = await paymentService.confirmPayment(paymentIdToConfirm, {
          paymentMethod: activeGateway === 'VNPAY' ? 'VNPAY' : 'VIETQR',
          note: `Học viên quét mã và xác nhận chuyển khoản ${formatVND(effectiveAmount)}. Mã GD: ${activeTxnCode || transferContent}`,
          transactionCode: activeTxnCode || undefined,
        });
      } else if (data.enrollmentId) {
        // Fallback an toàn: nếu chưa có paymentId thì dùng processPayment
        paymentResult = await paymentService.processPayment({
          enrollmentId: data.enrollmentId,
          method: activeGateway === 'VNPAY' ? 'VNPAY' : 'BANK_TRANSFER',
          note: `Học viên quét mã ${activeGateway === 'VNPAY' ? 'VNPAY-QR' : 'VietQR'}. Nội dung: ${transferContent}`,
        });
      }

      setConfirmSuccess(true);
      setToastMessage('🎉 Xác nhận thanh toán thành công! Giao dịch đã được ghi nhận.');

      // Báo cho component cha biết thanh toán đã thành công để refresh data & toast
      if (onPaymentSuccess) {
        onPaymentSuccess(paymentResult || pendingPayment);
      }

      // Tự động đóng modal sau 1.8s
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Xác nhận thanh toán chưa thành công. Vui lòng kiểm tra lại!');
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
      {/* Toast thông báo nổi khi xác nhận thành công */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#064e3b',
            color: '#ffffff',
            padding: '12px 24px',
            borderRadius: '999px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
            fontWeight: 800,
            fontSize: '0.92rem',
            zIndex: 100000,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: '1px solid #34d399',
            animation: 'dashFadeIn 0.25s ease-out',
          }}
        >
          <span>✅</span>
          <span>{toastMessage}</span>
        </div>
      )}

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
            background:
              activeGateway === 'VNPAY'
                ? 'linear-gradient(135deg, #991b1b 0%, #dc2626 50%, #005baa 100%)'
                : 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%)',
            padding: '1.25rem 1.75rem',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
            transition: 'background 0.3s ease',
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
              {activeGateway === 'VNPAY' ? '🔴' : '📱'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                  {activeGateway === 'VNPAY'
                    ? 'Cổng Thanh Toán VNPAY QR'
                    : 'Thanh Toán Chuyển Khoản VietQR'}
                </h2>
                <span
                  style={{
                    backgroundColor: activeGateway === 'VNPAY' ? '#ffffff' : '#10b981',
                    color: activeGateway === 'VNPAY' ? '#dc2626' : '#ffffff',
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
                Quét mã QR bằng ứng dụng ngân hàng hoặc ví điện tử để hoàn tất học phí
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
          {/* Tab Selector: VietQR vs VNPay */}
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              padding: '0.35rem',
              backgroundColor: '#f1f5f9',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setActiveGateway('VIETQR');
                initPendingPayment(effectiveAmount, 'VIETQR');
              }}
              style={{
                flex: 1,
                padding: '0.65rem 1rem',
                borderRadius: '9px',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: 'pointer',
                backgroundColor: activeGateway === 'VIETQR' ? '#059669' : 'transparent',
                color: activeGateway === 'VIETQR' ? '#ffffff' : '#64748b',
                boxShadow:
                  activeGateway === 'VIETQR' ? '0 2px 8px rgba(5, 150, 105, 0.25)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease',
              }}
            >
              <span>🏦</span>
              <span>VietQR (Chuyển khoản Napas 24/7)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveGateway('VNPAY');
                initPendingPayment(effectiveAmount, 'VNPAY');
              }}
              style={{
                flex: 1,
                padding: '0.65rem 1rem',
                borderRadius: '9px',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: 'pointer',
                backgroundColor: activeGateway === 'VNPAY' ? '#dc2626' : 'transparent',
                color: activeGateway === 'VNPAY' ? '#ffffff' : '#64748b',
                boxShadow:
                  activeGateway === 'VNPAY' ? '0 2px 8px rgba(220, 38, 38, 0.25)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease',
              }}
            >
              <span>🔴</span>
              <span>VNPAY QR (Cổng VNPAY)</span>
            </button>
          </div>

          {/* Thông tin gói học phí / hóa đơn thanh toán */}
          <div
            style={{
              backgroundColor: activeGateway === 'VNPAY' ? '#fff5f5' : '#ecfdf5',
              border:
                activeGateway === 'VNPAY' ? '1px solid #fecaca' : '1px solid #a7f3d0',
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
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: activeGateway === 'VNPAY' ? '#b91c1c' : '#047857',
                  textTransform: 'uppercase',
                }}
              >
                Khóa học & Hóa đơn thanh toán
              </div>
              <div
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  color: activeGateway === 'VNPAY' ? '#7f1d1d' : '#064e3b',
                  marginTop: '0.2rem',
                }}
              >
                {data.courseTitle || 'Học phí Trung Tâm EduCenter'}
              </div>
              <div
                style={{
                  fontSize: '0.8rem',
                  color: activeGateway === 'VNPAY' ? '#991b1b' : '#047857',
                  marginTop: '0.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '4px',
                }}
              >
                {data.classCode && (
                  <span>
                    Lớp: <strong>{data.classCode}</strong> •{' '}
                  </span>
                )}
                {(activeTxnCode || data.invoiceCode) && (
                  <span>
                    Mã GD: <strong>{activeTxnCode || data.invoiceCode}</strong> •{' '}
                  </span>
                )}
                <span>
                  Học viên: <strong>{data.studentName || 'Học viên EduCenter'}</strong>
                </span>
                {isInitiating && (
                  <span
                    style={{
                      marginLeft: '6px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: '#b45309',
                      backgroundColor: '#fef3c7',
                      padding: '2px 8px',
                      borderRadius: '999px',
                    }}
                  >
                    ⏳ Đang tạo GD trên database...
                  </span>
                )}
                {pendingPayment && !isInitiating && (
                  <span
                    style={{
                      marginLeft: '6px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: '#047857',
                      backgroundColor: '#d1fae5',
                      padding: '2px 8px',
                      borderRadius: '999px',
                    }}
                  >
                    ⚡ Đã lưu DB (PENDING)
                  </span>
                )}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: activeGateway === 'VNPAY' ? '#991b1b' : '#047857',
                  fontWeight: 600,
                }}
              >
                SỐ TIỀN CẦN THANH TOÁN
              </div>
              <div
                style={{
                  fontSize: '1.45rem',
                  fontWeight: 900,
                  color: activeGateway === 'VNPAY' ? '#dc2626' : '#059669',
                  letterSpacing: '-0.5px',
                }}
              >
                {formatVND(effectiveAmount)}
              </div>
            </div>
          </div>

          {/* Ô nhập số tiền tùy chọn nếu nạp tiền học phí tự do */}
          {(!data.amount || data.amount <= 0) && (
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '12px',
                padding: '0.85rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                flexWrap: 'wrap',
              }}
            >
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                Số tiền nạp (VNĐ):
              </label>
              <input
                type="number"
                min="50000"
                step="50000"
                value={customAmount || ''}
                onChange={(e) => setCustomAmount(Number(e.target.value) || 0)}
                onBlur={() => {
                  if (customAmount > 0) {
                    initPendingPayment(customAmount, activeGateway);
                  }
                }}
                style={{
                  padding: '0.45rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #94a3b8',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  width: '180px',
                }}
              />
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {[1000000, 2000000, 5000000, 10000000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setCustomAmount(amt);
                      initPendingPayment(amt, activeGateway);
                    }}
                    style={{
                      padding: '0.3rem 0.6rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: customAmount === amt ? '#059669' : '#ffffff',
                      color: customAmount === amt ? '#ffffff' : '#475569',
                      cursor: 'pointer',
                    }}
                  >
                    {amt >= 1000000 ? `${amt / 1000000} triệu` : `${amt / 1000}k`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Grid chính: QR Code bên trái & Thông tin bên phải */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(280px, 340px) 1fr',
              gap: '1.5rem',
              alignItems: 'start',
            }}
          >
            {/* Cột Trái: Mã QR */}
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
                  border:
                    activeGateway === 'VNPAY'
                      ? '2px solid #dc2626'
                      : '2px solid #10b981',
                  borderRadius: '16px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow:
                    activeGateway === 'VNPAY'
                      ? '0 10px 25px -5px rgba(220, 38, 38, 0.15)'
                      : '0 10px 25px -5px rgba(16, 185, 129, 0.15)',
                  transition: 'border-color 0.3s ease',
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
                        borderTopColor: activeGateway === 'VNPAY' ? '#dc2626' : '#059669',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                      }}
                    />
                    <span
                      style={{
                        fontSize: '0.8rem',
                        color: activeGateway === 'VNPAY' ? '#b91c1c' : '#047857',
                        marginTop: '0.5rem',
                        fontWeight: 600,
                      }}
                    >
                      Đang tạo mã QR thanh toán...
                    </span>
                  </div>
                )}

                <img
                  src={currentQrUrl}
                  alt={`Mã QR ${activeGateway} thanh toán học phí`}
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
                {activeGateway === 'VIETQR' && (
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
                    <span>{template === 'compact2' ? 'Dạng Đơn giản' : 'Dạng Chi tiết'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleDownloadQR}
                  style={{
                    flex: activeGateway === 'VNPAY' ? 1 : 'unset',
                    padding: '0.5rem 0.85rem',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    border:
                      activeGateway === 'VNPAY' ? '1px solid #dc2626' : '1px solid #059669',
                    backgroundColor: activeGateway === 'VNPAY' ? '#dc2626' : '#059669',
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                >
                  <span>📥</span>
                  <span>Tải ảnh mã QR</span>
                </button>
              </div>

              <div style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }}>
                {activeGateway === 'VNPAY'
                  ? '🔴 Quét bằng ứng dụng Ví VNPAY hoặc hơn 40 Mobile Banking hỗ trợ VNPAY-QR'
                  : '💡 Quét bằng mọi app Mobile Banking, MoMo, ZaloPay, ViettelMoney'}
              </div>
            </div>

            {/* Cột Phải: Thông tin chuyển khoản chi tiết */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {activeGateway === 'VIETQR' && (
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: '#334155',
                      marginBottom: '0.35rem',
                    }}
                  >
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
              )}

              {activeGateway === 'VNPAY' && (
                <div
                  style={{
                    backgroundColor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '12px',
                    padding: '0.85rem 1rem',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#1d4ed8',
                      marginBottom: '0.35rem',
                    }}
                  >
                    🚀 Hướng dẫn thanh toán qua VNPAY-QR:
                  </div>
                  <ol
                    style={{
                      margin: 0,
                      paddingLeft: '1.2rem',
                      fontSize: '0.78rem',
                      color: '#334155',
                      lineHeight: '1.5',
                    }}
                  >
                    <li>Mở App Mobile Banking hoặc ứng dụng Ví điện tử VNPAY.</li>
                    <li>
                      Chọn tính năng <strong>Quét mã QR</strong> hoặc <strong>VNPAY-QR</strong>.
                    </li>
                    <li>Quét mã QR bên cạnh và xác nhận số tiền cùng nội dung chuyển khoản.</li>
                  </ol>
                </div>
              )}

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
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px dashed #cbd5e1',
                    paddingBottom: '0.5rem',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>SỐ TÀI KHOẢN NHẬN</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#047857' }}>
                      {ACCOUNT_NO}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(ACCOUNT_NO, 'acc')}
                    style={{
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: copiedKey === 'acc' ? '#dcfce7' : '#ffffff',
                      color: copiedKey === 'acc' ? '#15803d' : '#334155',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {copiedKey === 'acc' ? '✅ Đã chép' : '📋 Sao chép'}
                  </button>
                </div>

                {/* Tên chủ tài khoản */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px dashed #cbd5e1',
                    paddingBottom: '0.5rem',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>TÊN THỤ HƯỞNG</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                      {ACCOUNT_NAME}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(ACCOUNT_NAME, 'name')}
                    style={{
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: copiedKey === 'name' ? '#dcfce7' : '#ffffff',
                      color: copiedKey === 'name' ? '#15803d' : '#334155',
                      cursor: 'pointer',
                    }}
                  >
                    {copiedKey === 'name' ? '✅ Đã chép' : '📋 Sao chép'}
                  </button>
                </div>

                {/* Số tiền */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px dashed #cbd5e1',
                    paddingBottom: '0.5rem',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>SỐ TIỀN CHÍNH XÁC</div>
                    <div
                      style={{
                        fontSize: '1.15rem',
                        fontWeight: 900,
                        color: activeGateway === 'VNPAY' ? '#dc2626' : '#059669',
                      }}
                    >
                      {formatVND(effectiveAmount)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(effectiveAmount.toString(), 'amt')}
                    style={{
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: copiedKey === 'amt' ? '#dcfce7' : '#ffffff',
                      color: copiedKey === 'amt' ? '#15803d' : '#334155',
                      cursor: 'pointer',
                    }}
                  >
                    {copiedKey === 'amt' ? '✅ Đã chép' : '📋 Sao chép'}
                  </button>
                </div>

                {/* Nội dung chuyển khoản */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ maxWidth: '240px' }}>
                    <div style={{ fontSize: '0.72rem', color: '#b45309', fontWeight: 700 }}>
                      NỘI DUNG CHUYỂN KHOẢN (BẮT BUỘC)
                    </div>
                    <div
                      style={{
                        fontSize: '0.95rem',
                        fontWeight: 800,
                        color: '#b91c1c',
                        letterSpacing: '0.5px',
                        wordBreak: 'break-all',
                      }}
                    >
                      {transferContent}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(transferContent, 'syntax')}
                    style={{
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      borderRadius: '6px',
                      border: '1px solid #fca5a5',
                      backgroundColor: copiedKey === 'syntax' ? '#fee2e2' : '#ffffff',
                      color: copiedKey === 'syntax' ? '#dc2626' : '#b91c1c',
                      cursor: 'pointer',
                    }}
                  >
                    {copiedKey === 'syntax' ? '✅ Đã chép' : '📋 Sao chép'}
                  </button>
                </div>
              </div>

              {/* Hộp lưu ý quan trọng */}
              <div
                style={{
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '10px',
                  padding: '0.65rem 0.85rem',
                  fontSize: '0.75rem',
                  color: '#92400e',
                  lineHeight: '1.45',
                }}
              >
                ⚠️ <strong>Lưu ý:</strong> Vui lòng giữ nguyên nội dung chuyển khoản để hệ thống tự
                động gạch nợ hóa đơn và kích hoạt lớp học trong vòng 1-3 phút.
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
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            {confirmSuccess ? (
              <span style={{ color: '#059669', fontWeight: 700 }}>
                🎉 Xác nhận thanh toán thành công! Hệ thống đang cập nhật...
              </span>
            ) : (
              <span>Sau khi chuyển tiền, nhấn nút bên phải để xác nhận giao dịch.</span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.6rem 1.15rem',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#475569',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Đóng
            </button>

            <button
              type="button"
              disabled={isConfirming || confirmSuccess}
              onClick={handleConfirmTransfer}
              style={{
                padding: '0.6rem 1.35rem',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: confirmSuccess ? '#10b981' : '#059669',
                color: '#ffffff',
                fontSize: '0.875rem',
                fontWeight: 700,
                cursor: isConfirming || confirmSuccess ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
                opacity: isConfirming ? 0.75 : 1,
              }}
            >
              <span>{confirmSuccess ? '✅' : isConfirming ? '⏳' : '🚀'}</span>
              <span>
                {confirmSuccess
                  ? 'Đã Thanh Toán Thành Công'
                  : isConfirming
                  ? 'Đang xử lý...'
                  : 'Tôi Đã Chuyển Khoản'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default VietQRModal;
