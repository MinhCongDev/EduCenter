import React, { useState, useEffect } from 'react';
import { paymentService } from '../services/payment.service';

export interface VietQRData {
  amount: number;
  description: string; // Nội dung chuyển khoản tự động
  invoiceCode?: string; // Mã hóa đơn / mã đơn hàng
  courseTitle?: string; // Tên khóa học
  courseId?: string; // ID khóa học
  studentName?: string; // Tên học viên
  classCode?: string; // Mã lớp học
  enrollmentId?: string; // ID lượt đăng ký (dùng cho xác nhận thanh toán tự động)
  paymentId?: string; // ID giao dịch nếu có sẵn
  gateway?: string;
  orderCode?: number;
  payosCheckoutUrl?: string;
}

export interface VietQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: VietQRData | null;
  onPaymentSuccess?: (payment: any) => void;
  onPaymentExpired?: () => void;
}

interface BankOption {
  id: string;
  code: string;
  name: string;
  shortName: string;
}

const SUPPORTED_BANKS: BankOption[] = [
  { id: 'KLB', code: '970452', name: 'Ngân hàng Kiên Long', shortName: 'KienlongBank' },
  { id: 'MB', code: '970422', name: 'Ngân hàng Quân Đội', shortName: 'MBBank' },
  { id: 'VCB', code: '970436', name: 'Ngân hàng Ngoại Thương Việt Nam', shortName: 'Vietcombank' },
  { id: 'TCB', code: '970407', name: 'Ngân hàng Kỹ Thương Việt Nam', shortName: 'Techcombank' },
  { id: 'ICB', code: '970415', name: 'Ngân hàng Công Thương Việt Nam', shortName: 'VietinBank' },
  { id: 'BIDV', code: '970418', name: 'Ngân hàng Đầu tư và Phát triển VN', shortName: 'BIDV' },
  { id: 'ACB', code: '970416', name: 'Ngân hàng Á Châu', shortName: 'ACB' },
  { id: 'VPB', code: '970432', name: 'Ngân hàng Việt Nam Thịnh Vượng', shortName: 'VPBank' },
  { id: 'TPB', code: '970423', name: 'Ngân hàng Tiên Phong', shortName: 'TPBank' },
  { id: 'VBA', code: '970405', name: 'Ngân hàng Nông nghiệp & PT Nông thôn VN', shortName: 'Agribank' },
  { id: 'STB', code: '970403', name: 'Ngân hàng Sài Gòn Thương Tín', shortName: 'Sacombank' },
  { id: 'HDB', code: '970437', name: 'Ngân hàng Phát triển TP.HCM', shortName: 'HDBank' },
  { id: 'VIB', code: '970441', name: 'Ngân hàng Quốc tế Việt Nam', shortName: 'VIB' },
  { id: 'SHB', code: '970443', name: 'Ngân hàng Sài Gòn - Hà Nội', shortName: 'SHB' },
  { id: 'MSB', code: '970426', name: 'Ngân hàng Hàng Hải Việt Nam', shortName: 'MSB' },
  { id: 'SEAB', code: '970440', name: 'Ngân hàng Đông Nam Á', shortName: 'SeABank' },
  { id: 'OCB', code: '970448', name: 'Ngân hàng Phương Đông', shortName: 'OCB' },
  { id: 'LPB', code: '970449', name: 'Ngân hàng Bưu điện Liên Việt', shortName: 'LPBank' },
];

export const VietQRModal: React.FC<VietQRModalProps> = ({
  isOpen,
  onClose,
  data,
  onPaymentSuccess,
  onPaymentExpired,
}) => {
  const [selectedBank, setSelectedBank] = useState<BankOption>(SUPPORTED_BANKS[0]);
  const [template, setTemplate] = useState<'compact2' | 'qr_only'>('compact2');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [confirmSuccess, setConfirmSuccess] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [customAmount, setCustomAmount] = useState<number>(0);

  // Quản lý thời gian thanh toán: 10 phút (600 giây)
  const TOTAL_PAYMENT_TIME = 600;
  const [timeLeft, setTimeLeft] = useState<number>(TOTAL_PAYMENT_TIME);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  // Quản lý bản ghi giao dịch thanh toán trên cơ sở dữ liệu
  const [pendingPayment, setPendingPayment] = useState<any>(null);
  const [activeTxnCode, setActiveTxnCode] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // PayOS states
  const [payosOrderCode, setPayosOrderCode] = useState<number | null>(null);
  const [payosCheckoutUrl, setPayosCheckoutUrl] = useState<string | null>(null);
  const [payosAccountNo, setPayosAccountNo] = useState<string>('');
  const [payosAccountName, setPayosAccountName] = useState<string>('');
  const [payosBin, setPayosBin] = useState<string>('');

  const timerStorageKey = data
    ? `pay_timer_${data.invoiceCode || data.orderCode || data.courseId || 'pending'}`
    : null;

  const formatCountdown = (totalSeconds: number): string => {
    const mins = Math.floor(Math.max(0, totalSeconds) / 60);
    const secs = Math.max(0, totalSeconds) % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleExpire = async () => {
    setIsExpired(true);
    setIsCancelling(true);
    try {
      await paymentService.cancelExpiredPayment({
        orderCode: payosOrderCode || data?.orderCode,
        paymentId: pendingPayment?._id || data?.paymentId,
        enrollmentId: data?.enrollmentId,
        courseId: data?.courseId,
        reason: 'Hết thời gian thanh toán (10 phút) - Tự động hủy đăng ký',
      });
      if (timerStorageKey) {
        sessionStorage.removeItem(timerStorageKey);
      }
      if (onPaymentExpired) {
        onPaymentExpired();
      }
    } catch (err) {
      console.warn('Lỗi khi tự động hủy thanh toán hết hạn:', err);
    } finally {
      setIsCancelling(false);
    }
  };

  // Thông tin tài khoản thụ hưởng hiển thị: "EduCenter" theo yêu cầu thương hiệu trung tâm
  const DEFAULT_ACCOUNT_NO = '988866889999';
  const displayAccountNo = payosAccountNo || DEFAULT_ACCOUNT_NO;
  // Tên người thụ hưởng hiển thị cố định là EduCenter
  const displayAccountName = 'EduCenter';

  // Số tiền hiệu lực
  const effectiveAmount = data?.amount && data.amount > 0 ? data.amount : customAmount;

  // Lấy nội dung chuyển khoản tự động (ưu tiên mã đơn PayOS để tự động đối soát)
  const transferContent =
    (payosOrderCode ? `HP ${payosOrderCode}` : '') ||
    activeTxnCode ||
    data?.description ||
    (data?.invoiceCode ? `EDUPAY ${data.invoiceCode}` : 'HOCPHI EDUCENTER');

  // Mã định danh ngân hàng: ưu tiên BIN từ PayOS hoặc mã của selectedBank
  const bankCodeForQr = payosBin || selectedBank.code || selectedBank.id;

  // Tạo URL VietQR chuẩn Napas 24/7 với tài khoản và tên thụ hưởng EduCenter
  const vietQrUrl = `https://img.vietqr.io/image/${bankCodeForQr}-${displayAccountNo}-${template}.png?amount=${effectiveAmount}&addInfo=${encodeURIComponent(
    transferContent
  )}&accountName=${encodeURIComponent(displayAccountName)}`;

  // Gọi API tạo liên kết thanh toán PayOS & bản ghi PENDING
  const initPendingPayment = async (amountToPay: number) => {
    if (amountToPay <= 0) return;
    try {
      // Tạo link PayOS và lấy mã QR cùng thông tin ngân hàng thực tế từ PayOS
      try {
        const payosRes = await paymentService.createPayOSPaymentLink({
          courseId: data?.courseId,
          enrollmentId: data?.enrollmentId,
          amount: amountToPay,
          description: data?.description || (data?.courseTitle ? `HP ${data.courseTitle}` : undefined),
        });

        if (payosRes?.payos?.orderCode) {
          setPayosOrderCode(payosRes.payos.orderCode);
          setPayosCheckoutUrl(payosRes.payos.checkoutUrl || null);
          setPendingPayment(payosRes.payment);
          setActiveTxnCode(`POS-${payosRes.payos.orderCode}`);

          // Cập nhật số tài khoản, tên chủ thẻ và ngân hàng thụ hưởng thực tế từ PayOS
          if (payosRes.payos.accountNumber) {
            setPayosAccountNo(payosRes.payos.accountNumber);
          }
          if (payosRes.payos.accountName) {
            setPayosAccountName(payosRes.payos.accountName);
          }
          if (payosRes.payos.bin) {
            setPayosBin(payosRes.payos.bin);
            const matchedBank = SUPPORTED_BANKS.find(
              (b) => b.code === payosRes.payos.bin || b.id === payosRes.payos.bin
            );
            if (matchedBank) {
              setSelectedBank(matchedBank);
            }
          }
          return;
        }
      } catch (payosErr) {
        console.warn('PayOS API warning, fallback to standard payment:', payosErr);
      }

      // Fallback nếu PayOS service chưa sẵn sàng
      const res = await paymentService.createPayment({
        enrollmentId: data?.enrollmentId,
        courseId: data?.courseId,
        amount: amountToPay,
        paymentMethod: 'PAYOS',
        note:
          data?.description ||
          (data?.invoiceCode ? `EDUPAY ${data.invoiceCode}` : `HOCPHI ${data?.courseTitle || 'EDUCENTER'}`),
        transactionCode: data?.invoiceCode,
        invoiceId: data?.invoiceCode,
      });
      setPendingPayment(res);
      if (res.transactionCode) {
        setActiveTxnCode(res.transactionCode);
      }
    } catch (err: any) {
      console.warn('Không thể khởi tạo giao dịch pending:', err);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setConfirmSuccess(false);
      setCopiedKey(null);
      setImageLoading(true);
      setPendingPayment(null);
      setActiveTxnCode('');
      setToastMessage(null);
      setCustomAmount(0);
      setPayosOrderCode(null);
      setPayosCheckoutUrl(null);
      setPayosAccountNo('');
      setPayosAccountName('');
      setPayosBin('');
      setIsExpired(false);
      setIsCancelling(false);
      setTimeLeft(TOTAL_PAYMENT_TIME);
    } else {
      const initialAmount = data?.amount && data.amount > 0 ? data.amount : 0;
      setCustomAmount(initialAmount);

      // Khởi tạo bản ghi giao dịch PENDING ngay khi mở popup nếu số tiền hợp lệ (> 0)
      if (initialAmount > 0) {
        initPendingPayment(initialAmount);
      }
    }
  }, [isOpen, data]);

  // Bộ đếm ngược thời gian thanh toán 10 phút (600 giây)
  useEffect(() => {
    if (!isOpen || !data || confirmSuccess) {
      return;
    }

    if (!timerStorageKey) return;

    let startTimeStr = sessionStorage.getItem(timerStorageKey);
    const now = Date.now();
    if (!startTimeStr) {
      startTimeStr = String(now);
      sessionStorage.setItem(timerStorageKey, startTimeStr);
    }

    const elapsedSeconds = Math.floor((now - Number(startTimeStr)) / 1000);
    const remainingSeconds = Math.max(0, TOTAL_PAYMENT_TIME - elapsedSeconds);

    setTimeLeft(remainingSeconds);

    if (remainingSeconds <= 0) {
      handleExpire();
      return;
    }

    setIsExpired(false);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, data, timerStorageKey, confirmSuccess]);

  // Xử lý tự động khi phát hiện thanh toán thành công (tự đối soát PayOS)
  const triggerSuccessFlow = (paymentRecord?: any) => {
    if (confirmSuccess) return;
    setConfirmSuccess(true);
    if (timerStorageKey) {
      sessionStorage.removeItem(timerStorageKey);
    }
    setToastMessage('PayOS đã xác nhận thanh toán thành công!');
    if (onPaymentSuccess) {
      onPaymentSuccess(paymentRecord || pendingPayment);
    }
    setTimeout(() => {
      onClose();
    }, 2800);
  };

  // Polling tự động đối chiếu trạng thái giao dịch với PayOS sau mỗi 2.5 giây
  useEffect(() => {
    if (!isOpen || !payosOrderCode || confirmSuccess || isExpired) return;

    let isMounted = true;

    // Kiểm tra nhanh sau 1.2 giây đầu tiên (rất hữu ích khi học viên đã quét và chuyển tiền xong)
    const initialCheck = setTimeout(async () => {
      try {
        const checkRes = await paymentService.checkPayOSStatus(payosOrderCode);
        if (!isMounted) return;
        if (checkRes.isPaid || checkRes.status === 'PAID') {
          triggerSuccessFlow(checkRes.payment);
        }
      } catch {
        // Retry silently
      }
    }, 1200);

    const interval = setInterval(async () => {
      try {
        const checkRes = await paymentService.checkPayOSStatus(payosOrderCode);
        if (!isMounted) return;

        if (checkRes.isPaid || checkRes.status === 'PAID') {
          clearInterval(interval);
          triggerSuccessFlow(checkRes.payment);
        }
      } catch {
        // Silently retry in 2.5 seconds
      }
    }, 2500);

    return () => {
      isMounted = false;
      clearTimeout(initialCheck);
      clearInterval(interval);
    };
  }, [isOpen, payosOrderCode, confirmSuccess, pendingPayment, onClose, onPaymentSuccess]);

  useEffect(() => {
    setImageLoading(true);
  }, [vietQrUrl, selectedBank, template, effectiveAmount]);

  // Đóng modal khi bấm phím ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !data || !data.amount || data.amount <= 0) return null;

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
      const response = await fetch(vietQrUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `VietQR_EduCenter_${activeTxnCode || data.invoiceCode || 'Payment'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(vietQrUrl, '_blank');
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
              
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                  Thanh Toán Học Phí PayOS (QR 24/7)
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
                  TỰ ĐỘNG XÁC NHẬN
                </span>
              </div>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#d1fae5', opacity: 0.9 }}>
                Quét mã QR bằng ứng dụng ngân hàng hoặc ví điện tử để tự động hoàn tất học phí
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
          {confirmSuccess ? (
            <div
              style={{
                padding: '3rem 2rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                gap: '1.25rem',
                minHeight: '380px',
                animation: 'dashFadeIn 0.3s ease-out',
              }}
            >
              <div
                style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  backgroundColor: '#dcfce7',
                  color: '#16a34a',
                  fontSize: '3.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 12px 28px -6px rgba(22, 163, 74, 0.4)',
                  border: '4px solid #86efac',
                }}
              >
                ✓
              </div>
              <div>
                <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#064e3b', margin: '0 0 0.5rem' }}>
                  Thanh Toán Thành Công!
                </h3>
                <p style={{ fontSize: '0.98rem', color: '#047857', maxWidth: '460px', margin: '0 auto', lineHeight: '1.5' }}>
                  Cổng thanh toán <strong>PayOS</strong> đã đối soát và xác thực học phí thành công cho khóa học{' '}
                  <strong>{data.courseTitle || 'Đăng ký học'}</strong>.
                </p>
              </div>

              <div
                style={{
                  padding: '0.85rem 1.5rem',
                  borderRadius: '12px',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #86efac',
                  fontSize: '0.92rem',
                  color: '#064e3b',
                  fontWeight: 700,
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                }}
              >
                {payosOrderCode && <span>Mã đơn: #{payosOrderCode}</span>}
                <span>•</span>
                <span style={{ color: '#059669', fontSize: '1.15rem', fontWeight: 900 }}>
                  {formatVND(effectiveAmount)}
                </span>
                <span>•</span>
                <span
                  style={{
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    fontSize: '0.72rem',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontWeight: 800,
                  }}
                >
                  ĐÃ XÁC THỰC 24/7
                </span>
              </div>

              <div style={{ fontSize: '0.85rem', color: '#047857', marginTop: '0.5rem', fontWeight: 600 }}>
                Khóa học đã được đưa vào mục <strong>"Khóa học của tôi"</strong> (chờ xếp lớp). Đang tự động chuyển trang...
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    window.location.href = '/student/classes';
                  }}
                  style={{
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '0.92rem',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)',
                  }}
                >
                  <span>Xem Thông Tin &amp; Khóa Học Vừa Đăng Ký</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          ) : isExpired ? (
            <div
              style={{
                padding: '3rem 2rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                gap: '1.25rem',
                minHeight: '380px',
                animation: 'dashFadeIn 0.3s ease-out',
              }}
            >
              <div
                style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  fontSize: '3.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 12px 28px -6px rgba(220, 38, 38, 0.35)',
                  border: '4px solid #fca5a5',
                }}
              >
                
              </div>
              <div>
                <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#991b1b', margin: '0 0 0.5rem' }}>
                  Hết Thời Gian Thanh Toán (10 Phút)
                </h3>
                <p style={{ fontSize: '0.96rem', color: '#7f1d1d', maxWidth: '480px', margin: '0 auto', lineHeight: '1.6' }}>
                  Đơn thanh toán cho khóa học <strong>{data?.courseTitle || 'vừa đăng ký'}</strong> đã quá thời hạn quy định (10 phút).
                  <br />
                  <span style={{ fontWeight: 700, color: '#b91c1c' }}>
                    Hệ thống đã tự động hủy lượt đăng ký khóa học này
                  </span>{' '}
                  để giải phóng slot giữ chỗ.
                </p>
              </div>

              <div
                style={{
                  padding: '0.85rem 1.5rem',
                  borderRadius: '12px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fca5a5',
                  fontSize: '0.88rem',
                  color: '#991b1b',
                  fontWeight: 600,
                  display: 'flex',
                  gap: '0.5rem',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span>ℹ️</span>
                <span>{isCancelling ? 'Đang hoàn tất hủy đơn trên hệ thống...' : 'Đơn đăng ký khóa học đã được tự động hủy thành công'}</span>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (timerStorageKey) sessionStorage.removeItem(timerStorageKey);
                    onClose();
                    window.location.href = '/courses';
                  }}
                  style={{
                    backgroundColor: '#ea580c',
                    color: '#ffffff',
                    padding: '0.75rem 1.6rem',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '0.92rem',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 14px rgba(234, 88, 12, 0.3)',
                  }}
                >
                  <span>Đăng Ký Lại Khóa Học</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (timerStorageKey) sessionStorage.removeItem(timerStorageKey);
                    onClose();
                  }}
                  style={{
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    padding: '0.75rem 1.4rem',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    border: '1px solid #cbd5e1',
                    cursor: 'pointer',
                  }}
                >
                  Đóng
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Thanh đếm ngược thời gian thanh toán (10 phút) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '12px',
                  backgroundColor: timeLeft <= 120 ? '#fef2f2' : '#f0fdf4',
                  border: `1.5px solid ${timeLeft <= 120 ? '#f87171' : '#86efac'}`,
                  color: timeLeft <= 120 ? '#991b1b' : '#166534',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  transition: 'all 0.3s ease',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.3rem' }}>''</span>
                  <span>
                    {timeLeft <= 120
                      ? 'Khẩn cấp! Sắp hết thời hạn thanh toán:'
                      : 'Thời gian hoàn tất thanh toán (10 phút):'}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '1.25rem',
                    fontWeight: 900,
                    fontFamily: 'monospace',
                    letterSpacing: '1px',
                    color: timeLeft <= 120 ? '#dc2626' : '#059669',
                    backgroundColor: '#ffffff',
                    padding: '3px 12px',
                    borderRadius: '8px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    border: `1px solid ${timeLeft <= 120 ? '#fca5a5' : '#bbf7d0'}`,
                  }}
                >
                  <span>{formatCountdown(timeLeft)}</span>
                </div>
              </div>

              {/* Thông tin gói học phí / khóa học được truyền động */}
              <div
                style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
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
                      color: '#047857',
                      textTransform: 'uppercase',
                    }}
                  >
                    Khóa học & Đơn đăng ký học
                  </div>
                  <div
                    style={{
                      fontSize: '1.1rem',
                      fontWeight: 800,
                      color: '#064e3b',
                      marginTop: '0.2rem',
                    }}
                  >
                    {data.courseTitle || 'Học phí Trung Tâm EduCenter'}
                  </div>
                  <div
                    style={{
                      fontSize: '0.8rem',
                      color: '#047857',
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
                        Mã đơn: <strong>{activeTxnCode || data.invoiceCode}</strong> •{' '}
                      </span>
                    )}
                    <span>
                      Học viên: <strong>{data.studentName || 'Học viên EduCenter'}</strong>
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: '#047857',
                      fontWeight: 600,
                    }}
                  >
                    SỐ TIỀN CẦN THANH TOÁN
                  </div>
                  <div
                    style={{
                      fontSize: '1.45rem',
                      fontWeight: 900,
                      color: '#059669',
                      letterSpacing: '-0.5px',
                    }}
                  >
                    {formatVND(effectiveAmount)}
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
                        <span
                          style={{
                            fontSize: '0.8rem',
                            color: '#047857',
                            marginTop: '0.5rem',
                            fontWeight: 600,
                          }}
                        >
                          Đang tạo mã VietQR thanh toán...
                        </span>
                      </div>
                    )}

                    <img
                      src={vietQrUrl}
                      alt="Mã QR VietQR thanh toán học phí"
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
                      
                      <span>{template === 'compact2' ? 'Dạng Đơn giản' : 'Dạng Chi tiết'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadQR}
                      style={{
                        flex: 1,
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
                        justifyContent: 'center',
                        gap: '4px',
                      }}
                    >
                      
                      <span>Tải ảnh mã QR</span>
                    </button>
                  </div>

                  {payosCheckoutUrl && (
                    <a
                      href={payosCheckoutUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.85rem',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        borderRadius: '8px',
                        backgroundColor: '#0284c7',
                        color: '#ffffff',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 4px rgba(2, 132, 199, 0.2)',
                      }}
                    >
                      
                      <span>Mở Cổng Thanh Toán PayOS Web</span>
                    </a>
                  )}

                  <div style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }}>
                    Quét bằng mọi app Mobile Banking (MB, VCB, TCB, ACB, VPB,...) hoặc Ví điện tử (MoMo, ZaloPay, ViettelMoney)
                  </div>
                </div>

                {/* Cột Phải: Thông tin chuyển khoản chi tiết */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
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
                          {displayAccountNo}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(displayAccountNo, 'acc')}
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
                        {copiedKey === 'acc' ? 'Đã sao chép' : 'Sao chép'}
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
                        <div style={{ fontSize: '1rem', fontWeight: 800, color: '#047857' }}>
                          {displayAccountName}
                        </div>
                        {payosAccountName && (
                          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                            (Chủ TK liên kết PayOS: <strong>{payosAccountName}</strong>)
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(displayAccountName, 'name')}
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
                        {copiedKey === 'name' ? 'Đã sao chép' : 'Sao chép'}
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
                            color: '#059669',
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
                        {copiedKey === 'amt' ? 'Đã sao chép' : 'Sao chép'}
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
                            color: '#047857',
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
                          border: '1px solid #a7f3d0',
                          backgroundColor: copiedKey === 'syntax' ? '#dcfce7' : '#ffffff',
                          color: copiedKey === 'syntax' ? '#047857' : '#065f46',
                          cursor: 'pointer',
                        }}
                      >
                        {copiedKey === 'syntax' ? 'Đã sao chép' : 'Sao chép'}
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
                    <strong>Lưu ý:</strong> Vui lòng giữ nguyên nội dung chuyển khoản để hệ thống tự
                    động gạch nợ hóa đơn và kích hoạt khóa học trong vòng 1-3 phút.
                  </div>
                </div>
              </div>
            </>
          )}
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
                Xác nhận thanh toán thành công! Hệ thống đang cập nhật...
              </span>
            ) : isExpired ? (
              <span style={{ color: '#dc2626', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block' }} />
                 Đã quá hạn 10 phút thanh toán — Khóa học đã tự động bị hủy.
              </span>
            ) : (
              <span style={{ color: '#047857', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600 }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: timeLeft <= 120 ? '#ef4444' : '#10b981',
                    display: 'inline-block',
                  }}
                />
                Đang chờ chuyển khoản (còn {formatCountdown(timeLeft)}) — tự động hủy nếu quá 10 phút
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.65rem 1.65rem',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#334155',
              fontSize: '0.875rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
export default VietQRModal;
