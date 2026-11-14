import React, { useState, useEffect, useId } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { paymentService } from '../../services/payment.service';
import { VietQRModal, type VietQRData } from '../../components/VietQRModal';
import type {
  Payment,
  PaymentSummary,
  PendingTuitionItem,
  PaymentReceiptData,
  PaymentMethod,
} from '../../types';

export const StudentPaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // State dữ liệu chính
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<PaymentSummary>({
    totalPaid: 0,
    successCount: 0,
    pendingCount: 0,
    pendingTuitionCount: 0,
    totalPendingTuitionAmount: 0,
  });
  const [pendingTuitions, setPendingTuitions] = useState<PendingTuitionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Khóa học / hóa đơn cần thanh toán hiện tại (chỉ xuất hiện khi học viên bấm 'Đăng kí học' từ CoursesPage)
  const [activeCoursePayment, setActiveCoursePayment] = useState<{
    courseId: string;
    courseTitle: string;
    courseCode: string;
    tuitionFee: number;
    invoiceCode: string;
    transferContent: string;
  } | null>(null);

  // Bộ lọc và tìm kiếm
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal thanh toán
  const [selectedTuition, setSelectedTuition] = useState<PendingTuitionItem | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [note, setNote] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<Payment | null>(null);

  // Modal VietQR
  const [vietQRData, setVietQRData] = useState<VietQRData | null>(null);
  const [isVietQRModalOpen, setIsVietQRModalOpen] = useState<boolean>(false);

  // Toast thông báo nổi khi thanh toán / thao tác thành công
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Làm sạch / Reset hoàn toàn state hóa đơn thanh toán hiện tại về mặc định (0 / Trống)
  const handleResetPaymentState = () => {
    setActiveCoursePayment(null);
    setVietQRData(null);
    setIsVietQRModalOpen(false);
    setSelectedTuition(null);
    setPaymentSuccess(null);
    setNote('');
    // Xóa state trong browser history để tránh bị lưu cache hoặc mở lại khi reload trang / back
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  // Tự động nhận diện dữ liệu khóa học chuyển từ trang Khóa học sang và mở popup VietQR
  useEffect(() => {
    const passedCourse = (location.state as any)?.course;
    if (passedCourse && passedCourse.tuitionFee) {
      const studentLastName = user?.fullName ? user.fullName.trim().split(' ').pop()?.toUpperCase() : 'HV';
      const courseCode = passedCourse.code || 'IELTS';
      const invoiceCode = `HP-${courseCode}-${Date.now().toString().slice(-4)}`;
      const transferContent = `HP ${studentLastName} ${courseCode}`;
      const tuitionFee = Number(passedCourse.tuitionFee) || 0;

      const coursePaymentInfo = {
        courseId: passedCourse._id,
        courseTitle: passedCourse.title,
        courseCode,
        tuitionFee,
        invoiceCode,
        transferContent,
      };

      setActiveCoursePayment(coursePaymentInfo);

      setVietQRData({
        amount: tuitionFee,
        description: transferContent,
        invoiceCode,
        courseTitle: passedCourse.title,
        courseId: passedCourse._id,
        studentName: user?.fullName,
      });
      setIsVietQRModalOpen(true);

      // Xóa state location ngay sau khi đã đọc để tránh lưu cache khi reload trang
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      // Đảm bảo ở trạng thái trống mặc định nếu không có course được truyền sang
      setActiveCoursePayment(null);
      setVietQRData(null);
      setIsVietQRModalOpen(false);
    }
  }, [location.state, user]);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Nhận kết quả đối soát tự động khi được PayOS redirect về (/student/payments?status=PAID&orderCode=...)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const orderCodeParam = searchParams.get('orderCode');
    const statusParam = searchParams.get('status');

    if (orderCodeParam) {
      const orderCode = Number(orderCodeParam);
      if (!isNaN(orderCode)) {
        paymentService
          .checkPayOSStatus(orderCode)
          .then((res) => {
            if (res.isPaid || res.status === 'PAID') {
              showToast(`PayOS: Đơn hàng #${orderCode} đã thanh toán thành công! Khóa học đã được kích hoạt.`);
              fetchData();
            } else if (statusParam === 'CANCELLED') {
              showToast(`Bạn đã hủy thanh toán đơn hàng #${orderCode}`);
            }
          })
          .catch((err) => {
            console.warn('Lỗi kiểm tra trạng thái PayOS từ redirect URL:', err);
          });

        navigate('/student/payments', { replace: true });
      }
    }
  }, [location.search]);

  // Mở modal VietQR cho gói học phí cần đóng
  const handleOpenVietQRForTuition = (tuition: PendingTuitionItem) => {
    const studentLastName = user?.fullName ? user.fullName.trim().split(' ').pop()?.toUpperCase() : 'HV';
    const courseCode = tuition.course?.code || 'IELTS';
    const transferCode = `HP ${studentLastName} ${courseCode}`;
    const invoiceCode = tuition.class?.classCode
      ? `${tuition.class.classCode}-${tuition._id.slice(-4).toUpperCase()}`
      : `HP-${tuition._id.slice(-6).toUpperCase()}`;

    setVietQRData({
      amount: tuition.course?.tuitionFee || 0,
      description: transferCode,
      invoiceCode,
      courseTitle: tuition.course?.title,
      courseId: tuition.course?._id,
      studentName: user?.fullName,
      classCode: tuition.class?.classCode,
      enrollmentId: tuition._id,
    });
    setIsVietQRModalOpen(true);
  };

  // Mở modal VietQR cho hóa đơn trong lịch sử
  const handleOpenVietQRForPayment = (payment: Payment) => {
    setVietQRData({
      amount: payment.amount,
      description: `EDUPAY ${payment.transactionCode || payment._id}`,
      invoiceCode: payment.transactionCode,
      courseTitle: payment.course?.title,
      courseId: payment.course?._id,
      paymentId: payment._id,
      studentName: user?.fullName,
      classCode: payment.enrollment?.class?.classCode,
      enrollmentId: payment.enrollment?._id,
    });
    setIsVietQRModalOpen(true);
  };

  // Mở Cổng thanh toán quét mã VietQR (Napas 24/7) trực tiếp từ thẻ hoặc nút Cổng thanh toán
  const handleOpenGatewayQR = () => {
    if (activeCoursePayment) {
      setVietQRData({
        amount: activeCoursePayment.tuitionFee,
        description: activeCoursePayment.transferContent,
        invoiceCode: activeCoursePayment.invoiceCode,
        courseTitle: activeCoursePayment.courseTitle,
        courseId: activeCoursePayment.courseId,
        studentName: user?.fullName,
      });
      setIsVietQRModalOpen(true);
    } else {
      showToast('ℹ️ Chưa có khoản thanh toán nào cần thực hiện. Vui lòng bấm "Đăng kí học" từ trang Khóa học.');
    }
  };

  // Modal biên lai (Receipt)
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceiptData | null>(null);
  const [loadingReceipt, setLoadingReceipt] = useState<boolean>(false);

  // Copy state
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Form IDs for accessibility
  const cardHolderId = useId();
  const cardNumberId = useId();
  const cardExpiryId = useId();
  const cardCvvId = useId();

  // Tải dữ liệu ban đầu
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [paymentsRes, pendingRes] = await Promise.all([
        paymentService.getMyPayments({
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          search: searchTerm.trim() || undefined,
        }),
        paymentService.getPendingTuition(),
      ]);

      setPayments(paymentsRes.payments);
      setSummary(paymentsRes.summary);
      setPendingTuitions(pendingRes);
    } catch (err: any) {
      console.error('Lỗi khi tải dữ liệu thanh toán:', err);
      setError(err?.response?.data?.message || 'Không thể kết nối đến máy chủ. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  // Tìm kiếm khi gõ (debounce)
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchData();
    }, 350);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Xử lý thanh toán
  const handleProcessPayment = async () => {
    if (!selectedTuition) return;
    try {
      setIsProcessing(true);
      const newPayment = await paymentService.processPayment({
        enrollmentId: selectedTuition._id,
        method: paymentMethod,
        note: note.trim() || undefined,
      });

      setPaymentSuccess(newPayment);
      // Tải lại danh sách sau khi thanh toán thành công
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Thanh toán không thành công. Vui lòng kiểm tra lại!');
    } finally {
      setIsProcessing(false);
    }
  };

  // Mở biên lai thanh toán
  const handleViewReceipt = async (paymentId: string) => {
    try {
      setLoadingReceipt(true);
      const receipt = await paymentService.getPaymentReceipt(paymentId);
      setSelectedReceipt(receipt);
    } catch (err: any) {
      alert(err.message || 'Không thể xem biên lai');
    } finally {
      setLoadingReceipt(false);
    }
  };

  // Copy vào clipboard
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Format tiền tệ VNĐ
  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return '0 đ';
    return `${val.toLocaleString('vi-VN')} đ`;
  };

  // Format ngày tháng
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="dash-container" style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
      {/* ── Welcome Banner ── */}
      <div className="dash-banner" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #6366f1 100%)' }}>
        <div className="dash-banner-content">
          <div className="dash-banner-badge" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff' }}>
            Tài Chính & Học Phí • EduCenter Portal
          </div>
          <h1 style={{ color: '#fff', margin: '0.4rem 0' }}>
            Cổng Thanh Toán & Hóa Đơn Điện Tử
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.9)', maxWidth: '650px', margin: 0 }}>
            Học viên: <strong>{user?.fullName}</strong> ({user?.email}) • Quản lý các khoản học phí, thanh toán trực tuyến qua mã VietQR (Napas 24/7) và tra cứu biên lai đóng tiền điện tử.
          </p>
        </div>
        <div className="dash-banner-right" style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="dash-quick-btn"
            style={{
              backgroundColor: activeCoursePayment ? '#10b981' : '#475569',
              color: '#ffffff',
              fontWeight: 800,
              border: 'none',
              boxShadow: activeCoursePayment ? '0 4px 14px rgba(16, 185, 129, 0.4)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              cursor: 'pointer',
            }}
            onClick={handleOpenGatewayQR}
          >
            
            <span>{activeCoursePayment ? 'Quét Mã VietQR' : 'Cổng Thanh Toán QR'}</span>
          </button>
          <button
            type="button"
            className="dash-quick-btn"
            style={{
              backgroundColor: 'rgba(255,255,255,0.95)',
              color: '#1e3a8a',
              fontWeight: 700,
              border: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
            onClick={fetchData}
          >
            
            <span>Làm Mới</span>
          </button>
        </div>
      </div>

      {/* ── Key Financial Metrics ── */}
      <div className="dash-metrics-grid">
        <div className="dash-metric-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="dash-metric-info">
            <span className="dash-metric-label">Tổng học phí đã thanh toán</span>
            <span className="dash-metric-val" style={{ color: '#10b981' }}>
              {formatCurrency(summary.totalPaid)}
            </span>
            <span className="dash-metric-trend up">
              {summary.successCount} giao dịch thành công
            </span>
          </div>
          <div className="dash-metric-icon icon-emerald"></div>
        </div>

        <div className="dash-metric-card" style={{ borderLeft: activeCoursePayment ? '4px solid #ef4444' : '4px solid #6366f1' }}>
          <div className="dash-metric-info">
            <span className="dash-metric-label">Học phí cần đóng</span>
            <span className="dash-metric-val" style={{ color: activeCoursePayment ? '#ef4444' : '#64748b' }}>
              {activeCoursePayment ? formatCurrency(activeCoursePayment.tuitionFee) : '0 đ'}
            </span>
            <span className="dash-metric-trend" style={{ color: activeCoursePayment ? '#ef4444' : '#10b981' }}>
              {activeCoursePayment
                ? `Khóa học: ${activeCoursePayment.courseCode} (${formatCurrency(activeCoursePayment.tuitionFee)})`
                : 'Chưa có khoản thanh toán nào cần thực hiện'}
            </span>
          </div>
          <div className="dash-metric-icon icon-amber">
            ''
          </div>
        </div>

        <div className="dash-metric-card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <div className="dash-metric-info">
            <span className="dash-metric-label">Tổng số hóa đơn</span>
            <span className="dash-metric-val">{payments.length} Hóa đơn</span>
            <span className="dash-metric-trend neutral">Lịch sử giao dịch lưu trữ</span>
          </div>
          <div className="dash-metric-icon icon-blue"></div>
        </div>

        <div
          className="dash-metric-card"
          onClick={handleOpenGatewayQR}
          style={{
            borderLeft: activeCoursePayment ? '4px solid #10b981' : '4px solid #94a3b8',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            backgroundColor: activeCoursePayment ? '#f0fdf4' : '#f8fafc',
          }}
          title={
            activeCoursePayment
              ? "Bấm để quét mã QR thanh toán học phí (VietQR Napas 24/7)"
              : "Chưa có khoản thanh toán nào cần thực hiện"
          }
        >
          <div className="dash-metric-info">
            <span className="dash-metric-label" style={{ color: activeCoursePayment ? '#047857' : '#64748b' }}>
              Cổng thanh toán trực tuyến
            </span>
            <span className="dash-metric-val" style={{ fontSize: '1.25rem', color: activeCoursePayment ? '#065f46' : '#64748b' }}>
              {activeCoursePayment ? 'VietQR Napas 24/7' : '0 đ'}
            </span>
            <span
              className="dash-metric-trend up"
              style={{
                color: activeCoursePayment ? '#059669' : '#64748b',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontWeight: 700,
                fontSize: '0.78rem',
              }}
            >
              
              <span>
                {activeCoursePayment
                  ? 'Bấm để quét mã QR thanh toán ➔'
                  : 'Chưa có yêu cầu thanh toán'}
              </span>
            </span>
          </div>
          <div className="dash-metric-icon icon-emerald"></div>
        </div>
      </div>

      {/* ── Chi Tiết Thanh Toán Khóa Học (Chỉ hiển thị khi có yêu cầu từ Khóa học) ── */}
      {activeCoursePayment ? (
        <div
          className="dash-card"
          style={{
            border: '2px solid #10b981',
            backgroundColor: '#f0fdf4',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.12)',
            marginBottom: '1.5rem',
            animation: 'dashFadeIn 0.3s ease-out',
          }}
        >
          <div
            className="dash-card-header"
            style={{
              borderBottomColor: '#a7f3d0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              
              <div>
                <h2 className="dash-card-title" style={{ color: '#064e3b', margin: 0, fontSize: '1.15rem' }}>
                  Hóa Đơn & Đơn Đăng Ký Khóa Học
                </h2>
                <div style={{ fontSize: '0.8rem', color: '#047857', marginTop: '2px' }}>
                  Yêu cầu thanh toán được kích hoạt từ trang Khóa học
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge-pill badge-green" style={{ fontWeight: 800 }}>
                ● Chờ chuyển khoản
              </span>
              <button
                type="button"
                onClick={handleResetPaymentState}
                title="Hủy / Đóng đơn này"
                style={{
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  borderRadius: '8px',
                  padding: '4px 10px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#64748b',
                  cursor: 'pointer',
                }}
              >
                ✕ Hủy đơn
              </button>
            </div>
          </div>

          <div
            style={{
              padding: '1.25rem',
              display: 'grid',
              gridTemplateColumns: 'minmax(240px, 1fr) 240px',
              gap: '1.5rem',
              alignItems: 'center',
            }}
          >
            {/* Cột trái: Thông tin chi tiết */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 700, textTransform: 'uppercase' }}>
                  Khóa học đăng ký
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                  {activeCoursePayment.courseTitle}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '2px' }}>
                  Mã khóa học: <strong>{activeCoursePayment.courseCode}</strong>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: '#ffffff',
                  padding: '1rem',
                  borderRadius: '12px',
                  border: '1px solid #bbf7d0',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>MÃ ĐƠN HÀNG</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#047857' }}>
                    {activeCoursePayment.invoiceCode}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>HỌC PHÍ CẦN ĐÓNG</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#dc2626' }}>
                    {formatCurrency(activeCoursePayment.tuitionFee)}
                  </div>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>NỘI DUNG CHUYỂN KHOẢN (BẮT BUỘC)</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#065f46', wordBreak: 'break-all' }}>
                    {activeCoursePayment.transferContent}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="dash-quick-btn primary"
                  style={{
                    backgroundColor: '#059669',
                    borderColor: '#059669',
                    padding: '0.65rem 1.25rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    cursor: 'pointer',
                  }}
                  onClick={() => setIsVietQRModalOpen(true)}
                >
                  
                  <span>Mở Popup VietQR Toàn Màn Hình</span>
                </button>

                <button
                  type="button"
                  className="dash-quick-btn"
                  style={{
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    padding: '0.65rem 1.25rem',
                    fontWeight: 600,
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                  onClick={handleResetPaymentState}
                >
                  ✕ Đóng / Hủy giao dịch này
                </button>
              </div>
            </div>

            {/* Cột phải: Mã QR VietQR Napas 24/7 trực quan */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backgroundColor: '#ffffff',
                padding: '1rem',
                borderRadius: '14px',
                border: '2px solid #10b981',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)',
              }}
            >
              <img
                src={`https://img.vietqr.io/image/MB-988866889999-compact2.png?amount=${activeCoursePayment.tuitionFee}&addInfo=${encodeURIComponent(
                  activeCoursePayment.transferContent
                )}&accountName=CONG%20TY%20CP%20GIAO%20DUC%20EDUCENTER`}
                alt="VietQR MBBank"
                style={{ width: '180px', height: '180px', objectFit: 'contain' }}
              />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#047857', marginTop: '0.5rem' }}>
                Quét mã VietQR (Napas 24/7)
              </span>
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                MBBank: <strong>988866889999</strong>
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* ── Trạng thái mặc định (Reset về 0 / Trống) ── */
        <div
          className="dash-card"
          style={{
            padding: '2.5rem 1.5rem',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px dashed #cbd5e1',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            marginBottom: '1.5rem',
          }}
        >
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              backgroundColor: '#ecfdf5',
              color: '#059669',
              fontSize: '1.5rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}
          >
            ✓
          </div>
          <h3 style={{ margin: '0 0 0.5rem', color: '#1e293b', fontSize: '1.25rem', fontWeight: 800 }}>
            Chưa có khoản thanh toán nào cần thực hiện
          </h3>
          <p style={{ margin: '0 0 0.5rem', color: '#64748b', fontSize: '0.95rem' }}>
            Hệ thống hiện không có khoản học phí nào đang chờ thanh toán. Số tiền cần đóng: <strong style={{ color: '#0f172a' }}>0 đ</strong>.
          </p>
          <p style={{ margin: '0 auto 1.5rem', color: '#94a3b8', fontSize: '0.85rem', maxWidth: '580px' }}>
            Để thanh toán học phí, vui lòng truy cập trang <strong>Danh sách khóa học</strong> và nhấn nút <strong>"Đăng kí học"</strong> tại khóa học bạn muốn tham gia.
          </p>
          <button
            type="button"
            className="dash-quick-btn primary"
            style={{
              padding: '0.65rem 1.5rem',
              fontSize: '0.9rem',
              fontWeight: 700,
              backgroundColor: '#07403F',
              borderColor: '#07403F',
              borderRadius: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
            }}
            onClick={() => navigate('/courses')}
          >
            
            <span>Xem Danh Sách Khóa Học & Đăng Kí Học</span>
          </button>
        </div>
      )}

      {/* ── Danh sách lớp học đang chờ đóng học phí (nếu có trong hệ thống) ── */}
      {!activeCoursePayment && pendingTuitions.length > 0 && (
        <div
          className="dash-card"
          style={{
            border: '1px solid #fed7aa',
            backgroundColor: '#fffaf5',
            marginBottom: '1.5rem',
          }}
        >
          <div className="dash-card-header" style={{ borderBottomColor: '#fed7aa' }}>
            <h3 style={{ color: '#c2410c', margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              
              <span>Lớp học đã ghi danh chờ hoàn thành học phí ({pendingTuitions.length})</span>
            </h3>
            <span className="badge-pill badge-amber" style={{ fontSize: '0.75rem' }}>
              Chờ thanh toán
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}>
            {pendingTuitions.map((item) => (
              <div
                key={item._id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.85rem 1.15rem',
                  backgroundColor: '#ffffff',
                  borderRadius: '10px',
                  border: '1px solid #fed7aa',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <strong style={{ color: '#1e293b', fontSize: '0.95rem' }}>{item.course?.title}</strong>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                    Mã khóa: <strong>{item.course?.code}</strong>
                    {item.class && <span> • Lớp: <strong>{item.class.classCode}</strong></span>}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#dc2626' }}>
                      {formatCurrency(item.course?.tuitionFee)}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="dash-quick-btn primary"
                    style={{
                      backgroundColor: '#059669',
                      borderColor: '#059669',
                      padding: '0.45rem 1rem',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      const studentLastName = user?.fullName ? user.fullName.trim().split(' ').pop()?.toUpperCase() : 'HV';
                      const courseCode = item.course?.code || 'IELTS';
                      const invoiceCode = item.class?.classCode
                        ? `${item.class.classCode}-${item._id.slice(-4).toUpperCase()}`
                        : `HP-${item._id.slice(-6).toUpperCase()}`;
                      const transferContent = `HP ${studentLastName} ${courseCode}`;
                      const tuitionFee = item.course?.tuitionFee || 0;

                      setActiveCoursePayment({
                        courseId: item.course?._id || '',
                        courseTitle: item.course?.title || '',
                        courseCode,
                        tuitionFee,
                        invoiceCode,
                        transferContent,
                      });

                      setVietQRData({
                        amount: tuitionFee,
                        description: transferContent,
                        invoiceCode,
                        courseTitle: item.course?.title,
                        courseId: item.course?._id,
                        studentName: user?.fullName,
                        classCode: item.class?.classCode,
                        enrollmentId: item._id,
                      });
                      setIsVietQRModalOpen(true);
                    }}
                  >
                    
                    <span>Thanh toán ngay</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Main Payment History & Invoices Card ── */}
      <div className="dash-card">
        <div className="dash-card-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 className="dash-card-title">
              Lịch Sử Giao Dịch & Hóa Đơn Điện Tử
            </h2>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              Danh sách chi tiết tất cả các giao dịch đóng học phí của học viên
            </p>
          </div>

          {/* Search & Filters */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Tìm mã GD hoặc ghi chú..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: '0.5rem 1rem 0.5rem 2rem',
                  fontSize: '0.875rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  outline: 'none',
                  minWidth: '220px',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.35rem', backgroundColor: '#f1f5f9', padding: '0.25rem', borderRadius: '8px' }}>
              <button
                type="button"
                className={`dash-filter-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
                style={{
                  border: 'none',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: statusFilter === 'ALL' ? '#3b82f6' : 'transparent',
                  color: statusFilter === 'ALL' ? '#fff' : '#475569',
                }}
                onClick={() => setStatusFilter('ALL')}
              >
                Tất cả ({payments.length})
              </button>
              <button
                type="button"
                style={{
                  border: 'none',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: statusFilter === 'SUCCESS' ? '#10b981' : 'transparent',
                  color: statusFilter === 'SUCCESS' ? '#fff' : '#475569',
                }}
                onClick={() => setStatusFilter('SUCCESS')}
              >
                Thành công
              </button>
              <button
                type="button"
                style={{
                  border: 'none',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: statusFilter === 'PENDING' ? '#f59e0b' : 'transparent',
                  color: statusFilter === 'PENDING' ? '#fff' : '#475569',
                }}
                onClick={() => setStatusFilter('PENDING')}
              >
                Đang xử lý
              </button>
            </div>
          </div>
        </div>

        {/* Loading / Error states */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
            <p style={{ color: '#64748b' }}>Đang tải lịch sử thanh toán...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#ef4444' }}>
            <p>{error}</p>
            <button type="button" className="dash-quick-btn" onClick={fetchData}>
              Thử lại
            </button>
          </div>
        ) : payments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#64748b' }}>
            
            <h3 style={{ margin: '0 0 0.5rem', color: '#1e293b' }}>Chưa có giao dịch thanh toán nào</h3>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>
              Khi bạn đăng ký và thanh toán khóa học tại EduCenter, lịch sử và biên lai sẽ hiển thị ở đây.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', marginTop: '0.5rem' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '0.9rem',
              }}
            >
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>MÃ GIAO DỊCH</th>
                  <th style={{ padding: '0.85rem 1rem' }}>KHÓA HỌC / LỚP</th>
                  <th style={{ padding: '0.85rem 1rem' }}>SỐ TIỀN</th>
                  <th style={{ padding: '0.85rem 1rem' }}>PHƯƠNG THỨC</th>
                  <th style={{ padding: '0.85rem 1rem' }}>NGÀY GIAO DỊCH</th>
                  <th style={{ padding: '0.85rem 1rem' }}>TRẠNG THÁI</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => {
                  const isSuccess = p.status === 'SUCCESS';
                  const isPending = p.status === 'PENDING';
                  return (
                    <tr
                      key={p._id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      {/* Transaction Code */}
                      <td style={{ padding: '1rem', fontWeight: 700, color: '#1e293b' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span
                            onClick={() => handleOpenVietQRForPayment(p)}
                            style={{
                              cursor: 'pointer',
                              color: '#047857',
                              fontWeight: 800,
                              textDecoration: 'underline',
                              textUnderlineOffset: '2px',
                            }}
                            title="Bấm để quét mã QR thanh toán cho hóa đơn này"
                          >
                            {p.transactionCode}
                          </span>
                          <button
                            type="button"
                            title="Sao chép mã giao dịch"
                            onClick={() => handleCopy(p.transactionCode || '', p._id)}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              padding: '2px 4px',
                              fontSize: '0.75rem',
                              opacity: 0.6,
                            }}
                          >
                            {copiedText === p._id ? 'Đã sao chép' : 'Sao chép'}
                          </button>
                        </div>
                      </td>

                      {/* Course / Class */}
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>
                          {p.course?.title || 'Khóa học EduCenter'}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          Mã: {p.course?.code || 'N/A'}
                          {p.enrollment?.class?.classCode && (
                            <span> • Lớp: {p.enrollment.class.classCode}</span>
                          )}
                        </div>
                      </td>

                      {/* Amount */}
                      <td style={{ padding: '1rem', fontWeight: 800, color: isSuccess ? '#059669' : '#1e293b' }}>
                        {formatCurrency(p.amount)}
                      </td>

                      {/* Method */}
                      <td style={{ padding: '1rem' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '6px',
                            fontSize: '0.775rem',
                            fontWeight: 600,
                            backgroundColor: '#f1f5f9',
                            color: '#334155',
                          }}
                        >
                          {p.method === 'VNPAY' && 'VNPAY QR'}
                          {p.method === 'BANK_TRANSFER' && 'Chuyển khoản MB'}
                          {p.method === 'CREDIT_CARD' && 'Thẻ Quốc tế'}
                          {p.method === 'CASH' && 'Tiền mặt tại quầy'}
                        </span>
                      </td>

                      {/* Date */}
                      <td style={{ padding: '1rem', fontSize: '0.825rem', color: '#475569' }}>
                        {formatDate(p.paymentDate || p.createdAt)}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '1rem' }}>
                        {isSuccess && (
                          <span className="badge-pill badge-green">
                            ● Thành công
                          </span>
                        )}
                        {isPending && (
                          <span className="badge-pill badge-amber">
                            ● Đang chờ
                          </span>
                        )}
                        {p.status === 'FAILED' && (
                          <span className="badge-pill badge-red">
                            ● Thất bại
                          </span>
                        )}
                        {p.status === 'REFUNDED' && (
                          <span className="badge-pill badge-purple">
                            ● Hoàn tiền
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', alignItems: 'center' }}>
                          <button
                            type="button"
                            className="dash-quick-btn"
                            style={{
                              padding: '0.35rem 0.75rem',
                              fontSize: '0.775rem',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              color: '#047857',
                              borderColor: '#a7f3d0',
                              backgroundColor: '#ecfdf5',
                              cursor: 'pointer',
                            }}
                            onClick={() => handleOpenVietQRForPayment(p)}
                            title="Hiển thị mã QR thanh toán ngân hàng VietQR"
                          >
                            
                            <span>Quét QR</span>
                          </button>

                          <button
                            type="button"
                            className="dash-quick-btn"
                            disabled={loadingReceipt}
                            style={{
                              padding: '0.35rem 0.75rem',
                              fontSize: '0.775rem',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              opacity: loadingReceipt ? 0.7 : 1,
                            }}
                            onClick={() => handleViewReceipt(p._id)}
                          >
                            
                            <span>Biên Lai</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          MODAL THANH TOÁN TRỰC TUYẾN (ONLINE PAYMENT MODAL)
      ══════════════════════════════════════════════════════════════ */}
      {selectedTuition && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
          onClick={() => !isProcessing && setSelectedTuition(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '580px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e2e8f0',
              padding: '1.75rem',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <span className="badge-pill badge-blue" style={{ marginBottom: '0.35rem', display: 'inline-block' }}>
                  Cổng Thanh Toán Bảo Mật
                </span>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: 800 }}>
                  Thanh Toán Học Phí Trực Tuyến
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTuition(null)}
                disabled={isProcessing}
                style={{
                  border: 'none',
                  background: '#f1f5f9',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  color: '#64748b',
                }}
              >
                ✕
              </button>
            </div>

            {/* Màn hình thành công nếu đã thanh toán */}
            {paymentSuccess ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <div
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    backgroundColor: '#d1fae5',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2.5rem',
                    margin: '0 auto 1rem',
                  }}
                >
                  ✓
                </div>
                <h2 style={{ color: '#065f46', margin: '0 0 0.5rem', fontSize: '1.4rem' }}>
                  Thanh Toán Thành Công!
                </h2>
                <p style={{ color: '#475569', fontSize: '0.95rem', margin: '0 0 1.25rem' }}>
                  Giao dịch học phí cho khóa <strong>{paymentSuccess.course?.title}</strong> đã được ghi nhận vào hệ thống.
                </p>

                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    padding: '1rem',
                    borderRadius: '10px',
                    textAlign: 'left',
                    marginBottom: '1.5rem',
                    fontSize: '0.9rem',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ color: '#64748b' }}>Mã giao dịch:</span>
                    <strong>{paymentSuccess.transactionCode}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ color: '#64748b' }}>Số tiền:</span>
                    <strong style={{ color: '#059669', fontSize: '1.1rem' }}>
                      {formatCurrency(paymentSuccess.amount)}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Phương thức:</span>
                    <span>{paymentSuccess.method}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                  <button
                    type="button"
                    className="dash-quick-btn primary"
                    onClick={() => {
                      const pId = paymentSuccess._id;
                      setSelectedTuition(null);
                      handleViewReceipt(pId);
                    }}
                  >
                    
                    <span>Xem Biên Lai Điện Tử</span>
                  </button>
                  <button
                    type="button"
                    className="dash-quick-btn"
                    onClick={() => setSelectedTuition(null)}
                  >
                    Đóng
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {/* Thông tin khóa học & số tiền */}
                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '1rem',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Khóa học thanh toán:</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: '0.2rem 0' }}>
                    {selectedTuition.course?.title}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      Mã lớp: <strong>{selectedTuition.class?.classCode || 'IELTS-STANDARD'}</strong>
                    </span>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Học phí: </span>
                      <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#2563eb' }}>
                        {formatCurrency(selectedTuition.course?.tuitionFee)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Chọn phương thức thanh toán */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#334155', marginBottom: '0.6rem' }}>
                    Chọn phương thức thanh toán:
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.65rem' }}>
                    {/* Option Chuyển khoản VietQR */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('BANK_TRANSFER')}
                      style={{
                        padding: '0.75rem 0.5rem',
                        borderRadius: '10px',
                        border: paymentMethod === 'BANK_TRANSFER' ? '2px solid #059669' : '1px solid #cbd5e1',
                        backgroundColor: paymentMethod === 'BANK_TRANSFER' ? '#ecfdf5' : '#ffffff',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#065f46' }}>VietQR (Napas 24/7)</div>
                      <div style={{ fontSize: '0.675rem', color: '#059669' }}>Quét mã & Chuyển khoản tự động</div>
                    </button>

                    {/* Option Thẻ */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CREDIT_CARD')}
                      style={{
                        padding: '0.75rem 0.5rem',
                        borderRadius: '10px',
                        border: paymentMethod === 'CREDIT_CARD' ? '2px solid #8b5cf6' : '1px solid #cbd5e1',
                        backgroundColor: paymentMethod === 'CREDIT_CARD' ? '#f5f3ff' : '#ffffff',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6d28d9' }}>Visa / Master</div>
                      <div style={{ fontSize: '0.675rem', color: '#64748b' }}>Thẻ thanh toán quốc tế</div>
                    </button>
                  </div>
                </div>

                {/* Chi tiết từng phương thức */}

                {paymentMethod === 'BANK_TRANSFER' && (
                  <div
                    style={{
                      border: '2px solid #a7f3d0',
                      backgroundColor: '#f0fdf4',
                      borderRadius: '14px',
                      padding: '1.25rem',
                      marginBottom: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.85rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 800, color: '#064e3b', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        
                        <span>QUÉT MÃ VIETQR CHUYỂN KHOẢN NGÂN HÀNG</span>
                      </div>
                      <span className="badge-pill badge-green" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                        TỰ ĐỘNG KHỚP 24/7
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        gap: '1.25rem',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        backgroundColor: '#ffffff',
                        padding: '1rem',
                        borderRadius: '12px',
                        border: '1px solid #d1fae5',
                      }}
                    >
                      <div
                        style={{
                          width: '180px',
                          height: '180px',
                          borderRadius: '10px',
                          border: '2px solid #10b981',
                          overflow: 'hidden',
                          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)',
                          flexShrink: 0,
                          backgroundColor: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <img
                          src={`https://img.vietqr.io/image/MB-988866889999-compact2.png?amount=${selectedTuition.course?.tuitionFee || 0}&addInfo=${encodeURIComponent(
                            `HP ${user?.fullName?.trim().split(' ').pop()?.toUpperCase() || 'HV'} ${selectedTuition.course?.code || 'IELTS'}`
                          )}&accountName=CONG%20TY%20CP%20GIAO%20DUC%20EDUCENTER`}
                          alt="VietQR MBBank"
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      </div>

                      <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.35rem' }}>
                          <span style={{ color: '#64748b' }}>Ngân hàng:</span>
                          <strong style={{ color: '#0f172a' }}>MBBank (Quân Đội)</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.35rem' }}>
                          <span style={{ color: '#64748b' }}>Số tài khoản:</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <strong style={{ color: '#047857', fontSize: '1rem' }}>9888 6688 9999</strong>
                            <button
                              type="button"
                              onClick={() => handleCopy('988866889999', 'acc')}
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.85rem' }}
                            >
                              {copiedText === 'acc' ? 'Đã sao chép' : 'Sao chép'}
                            </button>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.35rem' }}>
                          <span style={{ color: '#64748b' }}>Chủ tài khoản:</span>
                          <strong style={{ color: '#0f172a', fontSize: '0.8rem' }}>CONG TY CP GIAO DUC EDUCENTER</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.35rem' }}>
                          <span style={{ color: '#64748b' }}>Số tiền:</span>
                          <strong style={{ color: '#059669', fontSize: '1.05rem', fontWeight: 800 }}>
                            {formatCurrency(selectedTuition.course?.tuitionFee)}
                          </strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#b45309', fontWeight: 700 }}>Nội dung CK:</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <strong style={{ color: '#dc2626' }}>
                              HP {user?.fullName?.trim().split(' ').pop()?.toUpperCase() || 'HV'} {selectedTuition.course?.code}
                            </strong>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(
                                  `HP ${user?.fullName?.trim().split(' ').pop()?.toUpperCase() || 'HV'} ${selectedTuition.course?.code}`,
                                  'syntax'
                                )
                              }
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.85rem' }}
                            >
                              {copiedText === 'syntax' ? 'Đã sao chép' : 'Sao chép'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => {
                          const item = selectedTuition;
                          setSelectedTuition(null);
                          handleOpenVietQRForTuition(item);
                        }}
                        style={{
                          backgroundColor: '#059669',
                          border: 'none',
                          color: '#ffffff',
                          padding: '0.45rem 1rem',
                          borderRadius: '8px',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                        }}
                      >
                        
                        <span>Mở toàn màn hình VietQR & Tải ảnh</span>
                      </button>
                    </div>
                  </div>
                )}
                {paymentMethod === 'CREDIT_CARD' && (
                  <div
                    style={{
                      border: '1px solid #e9d5ff',
                      backgroundColor: '#faf5ff',
                      borderRadius: '12px',
                      padding: '1rem',
                      marginBottom: '1.25rem',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      <div>
                        <label htmlFor={cardHolderId} style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b21a8' }}>
                          TÊN CHỦ THẺ (KHÔNG DẤU)
                        </label>
                        <input
                          id={cardHolderId}
                          type="text"
                          defaultValue={user?.fullName?.toUpperCase() || ''}
                          placeholder="NGUYEN VAN A"
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.85rem',
                          }}
                        />
                      </div>

                      <div>
                        <label htmlFor={cardNumberId} style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b21a8' }}>
                          SỐ THẺ VISA / MASTERCARD
                        </label>
                        <input
                          id={cardNumberId}
                          type="text"
                          defaultValue="4532 •••• •••• 8899"
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.85rem',
                          }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <div>
                          <label htmlFor={cardExpiryId} style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b21a8' }}>
                            HẾT HẠN (MM/YY)
                          </label>
                          <input
                            id={cardExpiryId}
                            type="text"
                            defaultValue="12/28"
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              fontSize: '0.85rem',
                            }}
                          />
                        </div>
                        <div>
                          <label htmlFor={cardCvvId} style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b21a8' }}>
                            CVV / CVC
                          </label>
                          <input
                            id={cardCvvId}
                            type="password"
                            defaultValue="•••"
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              fontSize: '0.85rem',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Ghi chú thêm */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>
                    Ghi chú giao dịch (Tùy chọn):
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Học viên thanh toán đợt 1..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>

                {/* Actions Button */}
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="dash-quick-btn"
                    onClick={() => setSelectedTuition(null)}
                    disabled={isProcessing}
                  >
                    Hủy Bỏ
                  </button>

                  <button
                    type="button"
                    className="dash-quick-btn primary"
                    disabled={isProcessing}
                    onClick={handleProcessPayment}
                    style={{
                      backgroundColor: '#2563eb',
                      borderColor: '#2563eb',
                      padding: '0.65rem 1.5rem',
                      fontWeight: 700,
                      minWidth: '180px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    {isProcessing ? (
                      <>
                        <span className="loading-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                        <span>Đang xử lý...</span>
                      </>
                    ) : (
                      <>
                        
                        <span>Xác Nhận Thanh Toán</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODAL BIÊN LAI ĐIỆN TỬ (OFFICIAL ELECTRONIC RECEIPT)
      ══════════════════════════════════════════════════════════════ */}
      {selectedReceipt && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
          onClick={() => setSelectedReceipt(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e2e8f0',
              padding: '2.5rem',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
            id="printable-receipt"
          >
            {/* Watermark PAID */}
            <div
              style={{
                position: 'absolute',
                top: '45%',
                left: '50%',
                transform: 'translate(-50%, -50%) rotate(-25deg)',
                fontSize: '5rem',
                fontWeight: 900,
                color: 'rgba(16, 185, 129, 0.1)',
                border: '6px dashed rgba(16, 185, 129, 0.15)',
                padding: '0.5rem 2rem',
                borderRadius: '16px',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            >
              PAID • ĐÃ THU
            </div>

            {/* Receipt Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #e2e8f0', paddingBottom: '1.25rem' }}>
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  
                  <span>{selectedReceipt.center?.name || 'EduCenter IELTS Academy'}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                  Địa chỉ: {selectedReceipt.center?.address}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Hotline: <strong>{selectedReceipt.center?.hotline}</strong> • Email: {selectedReceipt.center?.email}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span className="badge-pill badge-green" style={{ fontSize: '0.8rem', fontWeight: 800 }}>
                  ✓ ĐÃ THANH TOÁN
                </span>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>
                  Mã biên lai:
                </div>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.05rem' }}>
                  {selectedReceipt.payment.transactionCode}
                </div>
              </div>
            </div>

            {/* Title */}
            <div style={{ textAlign: 'center', margin: '1.5rem 0' }}>
              <h2 style={{ margin: '0 0 0.25rem', color: '#0f172a', fontSize: '1.5rem', fontWeight: 800 }}>
                BIÊN LAI THU HỌC PHÍ ĐIỆN TỬ
              </h2>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Ngày lập: {formatDate(selectedReceipt.payment.paymentDate || selectedReceipt.payment.createdAt)}
              </div>
            </div>

            {/* Student Info */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                borderRadius: '10px',
                padding: '1rem',
                marginBottom: '1.5rem',
                border: '1px solid #f1f5f9',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.5rem',
                fontSize: '0.875rem',
              }}
            >
              <div>
                <span style={{ color: '#64748b' }}>Họ và tên học viên: </span>
                <strong style={{ color: '#0f172a' }}>
                  {typeof selectedReceipt.payment.student === 'object'
                    ? selectedReceipt.payment.student.fullName
                    : user?.fullName}
                </strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Email: </span>
                <span>
                  {typeof selectedReceipt.payment.student === 'object'
                    ? selectedReceipt.payment.student.email
                    : user?.email}
                </span>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Khóa học: </span>
                <strong>{selectedReceipt.payment.course?.title}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Mã khóa: </span>
                <span>{selectedReceipt.payment.course?.code}</span>
              </div>
            </div>

            {/* Receipt Table */}
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.9rem',
                marginBottom: '1.5rem',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', color: '#334155' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0' }}>Nội dung thu</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #e2e8f0', width: '90px' }}>Số lượng</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', border: '1px solid #e2e8f0', width: '150px' }}>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>
                    <strong>Học phí {selectedReceipt.payment.course?.title}</strong>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Phương thức: {selectedReceipt.payment.method} • {selectedReceipt.payment.note || 'Thanh toán trực tuyến'}
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #e2e8f0' }}>1</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', border: '1px solid #e2e8f0', fontWeight: 700 }}>
                    {formatCurrency(selectedReceipt.payment.amount)}
                  </td>
                </tr>
                <tr style={{ backgroundColor: '#fafaf9', fontWeight: 800 }}>
                  <td colSpan={2} style={{ padding: '0.85rem', textAlign: 'right', border: '1px solid #e2e8f0' }}>
                    TỔNG CỘNG ĐÃ THANH TOÁN:
                  </td>
                  <td style={{ padding: '0.85rem', textAlign: 'right', border: '1px solid #e2e8f0', color: '#059669', fontSize: '1.15rem' }}>
                    {formatCurrency(selectedReceipt.payment.amount)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Note & Signature */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '2rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', maxWidth: '320px' }}>
                <p style={{ margin: '0 0 0.25rem' }}>
                  • Biên lai này có giá trị xác nhận học viên đã hoàn thành nghĩa vụ học phí cho khóa học.
                </p>
                <p style={{ margin: 0 }}>
                  • Mọi thắc mắc xin liên hệ Phòng Tài chính - Kế toán: 1900 6868.
                </p>
              </div>

              <div style={{ textAlign: 'center', minWidth: '180px' }}>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Đại diện EduCenter</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic', marginBottom: '2.5rem' }}>
                  (Ký & đóng dấu điện tử)
                </div>
                <div style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '0.95rem' }}>
                  Bộ Phận Tài Chính EduCenter
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                borderTop: '1px solid #e2e8f0',
                paddingTop: '1.25rem',
                marginTop: '1.5rem',
              }}
            >
              <button
                type="button"
                className="dash-quick-btn"
                onClick={() => setSelectedReceipt(null)}
              >
                Đóng
              </button>
              <button
                type="button"
                className="dash-quick-btn primary"
                onClick={() => window.print()}
              >
                
                <span>In Biên Lai / Xuất PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Toast Thông Báo Nổi ── */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            backgroundColor: '#047857',
            color: '#ffffff',
            padding: '14px 22px',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)',
            fontWeight: 700,
            fontSize: '0.9rem',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            border: '1px solid #10b981',
            animation: 'dashFadeIn 0.3s ease-out',
          }}
        >
          
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: '1rem',
              cursor: 'pointer',
              marginLeft: '8px',
              opacity: 0.8,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Modal VietQR Chuyển Khoản Tự Động ── */}
      <VietQRModal
        isOpen={isVietQRModalOpen}
        onClose={handleResetPaymentState}
        data={vietQRData}
        onPaymentSuccess={(payment) => {
          handleResetPaymentState();
          fetchData();
          showToast(
            `Thanh toán học phí ${payment?.amount ? payment.amount.toLocaleString('vi-VN') + ' đ ' : ''
            }thành công! Khóa học đã xuất hiện trong 'Khóa học của tôi' (Trạng thái: Đang chờ staff xếp lớp).`
          );
        }}
      />
    </div>
  );
};

export default StudentPaymentsPage;
