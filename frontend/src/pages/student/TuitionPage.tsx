import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { studentService } from '../../services/student.service';
import { paymentService } from '../../services/payment.service';
import { Modal } from '../../components/Modal';
import { EmptyState, SkeletonPage } from '../../components/Skeleton';
import { PaymentReceiptModal } from '../../components/PaymentReceiptModal';
import { VietQRModal, type VietQRData } from '../../components/VietQRModal';
import { formatDate, formatVND } from '../../utils/format';
import type {
  Payment,
  PaymentMethod,
  PaymentReceiptData,
  TuitionItem,
  TuitionStats,
} from '../../types';

/**
 * Trang Thanh toán khóa học — hợp nhất 3 nguồn về còn 1:
 *
 *  • Tab "Học phí"   → theo lớp (Enrollment.tuitionStatus): PAID / PENDING / REFUNDED,
 *                      có thể thanh toán trực tiếp + xem chi tiết giao dịch.
 *  • Tab "Lịch sử"  → theo giao dịch (Payment.status): SUCCESS / PENDING / FAILED / REFUNDED,
 *                      có tìm kiếm + xuất biên lai điện tử.
 *
 * Nguồn dữ liệu:
 *  • Học phí  → GET /api/student/tuition    (chi tiết lớp, giáo viên, lịch học, giao dịch)
 *  • Lịch sử → GET /api/payments/my-payments (lịch sử giao dịch + tổng hợp tài chính)
 *
 * Cả hai endpoint đều lọc enrollment còn hiệu lực ở tầng backend, nên số liệu
 * "đã thanh toán / còn nợ / đã hoàn tiền" luôn khớp nhau.
 */

type TuitionTab = 'tuition' | 'history';
type TuitionFilter = 'ALL' | 'PAID' | 'PENDING' | 'REFUNDED';
type HistoryFilter = 'ALL' | 'SUCCESS' | 'PENDING' | 'FAILED' | 'REFUNDED';

const tuitionStatusCfg = (s: TuitionItem['tuitionStatus']) => {
  const map: Record<
    TuitionItem['tuitionStatus'],
    { label: string; cls: string; icon: string; color: string }
  > = {
    PAID: { label: 'Đã thanh toán', cls: 'badge-green', icon: '✅', color: '#10b981' },
    PENDING: { label: 'Chưa thanh toán', cls: 'badge-amber', icon: '⏳', color: '#f59e0b' },
    REFUNDED: { label: 'Đã hoàn tiền', cls: 'badge-blue', icon: '💸', color: '#3b82f6' },
  };
  return map[s] || { label: s, cls: 'badge-amber', icon: '❓', color: '#64748b' };
};

const paymentStatusCfg = (s: Payment['status']) => {
  const map: Record<Payment['status'], { label: string; cls: string; icon: string }> = {
    SUCCESS: { label: 'Đã thanh toán', cls: 'badge-green', icon: '✅' },
    PENDING: { label: 'Chờ thanh toán', cls: 'badge-amber', icon: '⏳' },
    FAILED: { label: 'Thất bại', cls: 'badge-purple', icon: '❌' },
    REFUNDED: { label: 'Đã hoàn tiền', cls: 'badge-blue', icon: '💸' },
  };
  return map[s] || { label: s, cls: 'badge-amber', icon: '❓' };
};

const METHOD_LABEL: Record<PaymentMethod, string> = {
  VNPAY: 'VNPay',
  BANK_TRANSFER: 'Chuyển khoản ngân hàng',
  CASH: 'Tiền mặt',
  CREDIT_CARD: 'Thẻ tín dụng',
};

const TuitionPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();

  // ── Dữ liệu ──
  const [items, setItems] = useState<TuitionItem[]>([]);
  const [tuitionStats, setTuitionStats] = useState<TuitionStats | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── Điều hướng trong trang ──
  const [tab, setTab] = useState<TuitionTab>('tuition');
  const [tuitionFilter, setTuitionFilter] = useState<TuitionFilter>('ALL');
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('ALL');
  const [search, setSearch] = useState('');

  // ── Modal học phí ──
  const [detail, setDetail] = useState<TuitionItem | null>(null);
  const [paying, setPaying] = useState(false);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('VNPAY');

  // ── Modal VietQR ──
  const [vietQRData, setVietQRData] = useState<VietQRData | null>(null);
  const [isVietQRModalOpen, setIsVietQRModalOpen] = useState(false);

  // ── Modal biên lai ──
  const [receipt, setReceipt] = useState<PaymentReceiptData | null>(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);

  // =====================================================
  // Tải dữ liệu — song song 2 nguồn để số liệu luôn khớp
  // =====================================================
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [tuitionRes, paymentsRes] = await Promise.all([
        studentService.getTuition(),
        paymentService.getMyPayments(),
      ]);

      if (tuitionRes.success && tuitionRes.data) {
        setItems(tuitionRes.data.items || []);
        setTuitionStats(tuitionRes.data.stats);
      } else {
        toast.error(tuitionRes.message || 'Không thể tải danh sách học phí');
      }

      setPayments(paymentsRes.payments || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Không thể tải dữ liệu thanh toán');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // =====================================================
  // Lọc & tìm kiếm
  // =====================================================
  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      if (tuitionFilter !== 'ALL' && i.tuitionStatus !== tuitionFilter) return false;
      if (q) {
        const hay = [i.classCode, i.course?.code, i.course?.title, i.teacher?.fullName]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, tuitionFilter, search]);

  const filteredPayments = useMemo(() => {
    const q = search.trim().toLowerCase();
    return payments.filter((p) => {
      if (historyFilter !== 'ALL' && p.status !== historyFilter) return false;
      if (q) {
        const cls = p.class as any;
        const hay = [
          p.transactionCode,
          p.method,
          p.note,
          cls?.classCode,
          cls?.course?.code,
          cls?.course?.title,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [payments, historyFilter, search]);

  // Số lớp ĐANG theo học (loại trừ lớp đã rút).
  // `items` bao gồm cả enrollment DROPPED + REFUNDED nên không thể dùng
  // `items.length` cho câu "Bạn đang theo học N khóa học".
  const activeCount = items.filter((i) => i.enrollmentStatus !== 'DROPPED').length;
  const refundedCount = items.filter((i) => i.tuitionStatus === 'REFUNDED').length;

  // =====================================================
  // Thanh toán trực tiếp (không qua QR) — khoản chưa thanh toán
  // =====================================================
  const handlePay = async () => {
    if (!detail) return;
    try {
      setPaying(true);
      const res = await studentService.payTuition(detail.enrollmentId, payMethod);
      if (res.success) {
        toast.success(res.message || 'Thanh toán học phí thành công!');
        setDetail(null);
        await fetchData();
      } else {
        toast.error(res.message || 'Thanh toán thất bại');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Thanh toán thất bại');
    } finally {
      setPaying(false);
    }
  };

  // =====================================================
  // VietQR — quét mã chuyển khoản / VNPAY-QR
  // =====================================================
  // Tên viết tắt trong nội dung chuyển khoản. `fullName` trong DB có dạng
  // "Nguyễn Đức Huy (Học viên)" → phải bỏ phần ngoặc trước, nếu không
  // `split(' ').pop()` sẽ ra "viên)" và nội dung chuyển khoản bị sai.
  const shortStudentName = useMemo(() => {
    const raw = (user?.fullName || '').replace(/\([^)]*\)/g, '').trim();
    const last = raw.split(/\s+/).filter(Boolean).pop();
    return (last || 'HV').toUpperCase();
  }, [user?.fullName]);

  const openVietQRForTuition = (item: TuitionItem) => {
    const courseCode = item.course?.code || 'IELTS';
    const transferCode = `HP ${shortStudentName} ${courseCode}`;
    const invoiceCode = item.payments?.[0]?.transactionCode || item.classCode;

    setVietQRData({
      amount: item.tuitionFee,
      description: transferCode,
      invoiceCode,
      courseTitle: item.course?.title,
      studentName: user?.fullName,
      classCode: item.classCode,
      enrollmentId: item.enrollmentId,
    });
    setIsVietQRModalOpen(true);
  };

  const openVietQRForPayment = (payment: Payment) => {
    setVietQRData({
      amount: payment.amount,
      description: `EDUPAY ${payment.transactionCode || payment._id}`,
      invoiceCode: payment.transactionCode,
      courseTitle: (payment.course as any)?.title,
      studentName: user?.fullName,
    });
    setIsVietQRModalOpen(true);
  };

  // =====================================================
  // Biên lai điện tử
  // =====================================================
  const handleViewReceipt = async (paymentId: string) => {
    try {
      setLoadingReceipt(true);
      setReceipt(await paymentService.getPaymentReceipt(paymentId));
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Không thể xem biên lai');
    } finally {
      setLoadingReceipt(false);
    }
  };

  if (isLoading) return <SkeletonPage message="Đang tải học phí..." />;

  // =====================================================
  // Render
  // =====================================================
  const tuitionTabs: { key: TuitionFilter; label: string; count: number }[] = [
    { key: 'ALL', label: '💼 Tất cả', count: items.length },
    {
      key: 'PAID',
      label: '✅ Đã thanh toán',
      count: items.filter((i) => i.tuitionStatus === 'PAID').length,
    },
    {
      key: 'PENDING',
      label: '⏳ Chưa thanh toán',
      count: items.filter((i) => i.tuitionStatus === 'PENDING').length,
    },
    {
      key: 'REFUNDED',
      label: '💸 Đã hoàn tiền',
      count: items.filter((i) => i.tuitionStatus === 'REFUNDED').length,
    },
  ];

  const historyTabs: { key: HistoryFilter; label: string; count: number }[] = [
    { key: 'ALL', label: 'Tất cả', count: payments.length },
    {
      key: 'SUCCESS',
      label: '✅ Đã thanh toán',
      count: payments.filter((p) => p.status === 'SUCCESS').length,
    },
    {
      key: 'PENDING',
      label: '⏳ Chờ thanh toán',
      count: payments.filter((p) => p.status === 'PENDING').length,
    },
    {
      key: 'FAILED',
      label: '❌ Thất bại',
      count: payments.filter((p) => p.status === 'FAILED').length,
    },
    {
      key: 'REFUNDED',
      label: '💸 Đã hoàn tiền',
      count: payments.filter((p) => p.status === 'REFUNDED').length,
    },
  ];

  return (
    <div className="dash-container">
      {/* ── Banner ── */}
      <div className="dash-banner">
        <div className="dash-banner-content">
          <div className="dash-banner-badge">💳 Thanh Toán</div>
          <h1>Thanh Toán Khóa Học</h1>
          <p>
            {items.length > 0
              ? `Bạn đang theo học ${activeCount} khóa học • ${tuitionStats?.pendingCount || 0} khoản chờ thanh toán${
                  refundedCount > 0 ? ` • ${refundedCount} khoản đã hoàn tiền` : ''
                }`
              : 'Bạn chưa đăng ký khóa học nào để thanh toán.'}
          </p>
        </div>
        <div className="dash-banner-right">
          <div className="dash-date-pill">
            <div>💰 {tuitionStats?.pendingCount || 0} khoản chờ</div>
            <div className="sub">Học viên: {user?.fullName}</div>
          </div>
        </div>
      </div>

      {/* ── Quick actions ── */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <Link to="/student/dashboard" className="dash-quick-btn" style={{ textDecoration: 'none' }}>
          ← Tổng quan
        </Link>
        <Link to="/student/classes" className="dash-quick-btn" style={{ textDecoration: 'none' }}>
          📚 Khóa học của tôi
        </Link>
      </div>

      {/* ── Metrics ── */}
      {tuitionStats && tuitionStats.total > 0 && (
        <div className="dash-metrics-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Đã thanh toán</span>
              <span className="dash-metric-val" style={{ color: '#10b981' }}>
                {formatVND(tuitionStats.totalPaid)}
              </span>
              <span className="dash-metric-trend up">{tuitionStats.paidCount} khóa học</span>
            </div>
            <div className="dash-metric-icon icon-emerald">✅</div>
          </div>

          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Chờ thanh toán</span>
              <span className="dash-metric-val" style={{ color: '#f59e0b' }}>
                {formatVND(tuitionStats.totalPending)}
              </span>
              <span className="dash-metric-trend">{tuitionStats.pendingCount} khóa học</span>
            </div>
            <div className="dash-metric-icon icon-amber">⏳</div>
          </div>

          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Tổng khóa học</span>
              <span className="dash-metric-val">{activeCount} khóa</span>
              <span className="dash-metric-trend up">
                {refundedCount > 0 ? `${refundedCount} đã hoàn tiền` : 'Không hoàn tiền'}
              </span>
            </div>
            <div className="dash-metric-icon icon-blue">💼</div>
          </div>
        </div>
      )}

      {/* ── Tabs chính: Học phí | Lịch sử ── */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.25rem',
          padding: '0.35rem',
          backgroundColor: '#f1f5f9',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          width: 'fit-content',
          maxWidth: '100%',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={() => setTab('tuition')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: '9px',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            backgroundColor: tab === 'tuition' ? '#059669' : 'transparent',
            color: tab === 'tuition' ? '#ffffff' : '#64748b',
            boxShadow: tab === 'tuition' ? '0 2px 8px rgba(5,150,105,0.25)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <span>💼</span>
          <span>Học phí ({items.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('history')}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: '9px',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            backgroundColor: tab === 'history' ? '#059669' : 'transparent',
            color: tab === 'history' ? '#ffffff' : '#64748b',
            boxShadow: tab === 'history' ? '0 2px 8px rgba(5,150,105,0.25)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <span>🧾</span>
          <span>Lịch sử giao dịch ({payments.length})</span>
        </button>
      </div>

      {/* ── Filter + Search ── */}
      <div className="dash-card" style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {(tab === 'tuition' ? tuitionTabs : historyTabs).map((t) => (
              <button
                key={t.key}
                onClick={() =>
                  tab === 'tuition'
                    ? setTuitionFilter(t.key as TuitionFilter)
                    : setHistoryFilter(t.key as HistoryFilter)
                }
                className={`dash-quick-btn ${
                  (tab === 'tuition' ? tuitionFilter : historyFilter) === t.key ? 'primary' : ''
                }`}
                style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
              >
                {t.label} ({t.count})
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder={
              tab === 'tuition'
                ? '🔍 Tìm theo mã lớp, khóa học, giảng viên...'
                : '🔍 Tìm theo mã GD, phương thức, lớp...'
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              minWidth: '220px',
              padding: '0.55rem 0.85rem',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              fontSize: '0.88rem',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          TAB 1 — HỌC PHÍ (theo lớp)
      ══════════════════════════════════════════════════════ */}
      {tab === 'tuition' &&
        (filteredItems.length === 0 ? (
          <EmptyState
            icon="📭"
            title={items.length === 0 ? 'Chưa có khóa học' : 'Không có khoản học phí phù hợp'}
            description={
              items.length === 0
                ? 'Hãy đăng ký một khóa học để xem học phí tại đây.'
                : 'Thử đổi bộ lọc hoặc từ khoá tìm kiếm.'
            }
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredItems.map((item) => {
              const st = tuitionStatusCfg(item.tuitionStatus);
              const latest = item.payments?.[0];
              return (
                <div key={item.enrollmentId} className="dash-card">
                  <div className="dash-card-header">
                    <h2 className="dash-card-title">
                      <span>{st.icon}</span> {item.course?.title || item.classCode}
                    </h2>
                    <span className={`badge-pill ${st.cls}`}>{st.label}</span>
                  </div>

                  <div className="dash-subcard">
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                        gap: '0.75rem 1.5rem',
                      }}
                    >
                      <Field label="Mã lớp" value={item.classCode} />
                      <Field label="Mã khóa học" value={item.course?.code} />
                      <Field
                        label="Học phí"
                        value={
                          <span style={{ color: st.color, fontWeight: 800 }}>
                            {formatVND(item.tuitionFee)}
                          </span>
                        }
                      />
                      <Field label="Giảng viên" value={item.teacher?.fullName} />
                      <Field label="Lịch học" value={item.scheduleDays?.join(', ')} />
                      <Field label="Ca học" value={item.timeSlot} />
                      <Field label="Phòng" value={item.room} />
                      <Field label="Ngày ghi danh" value={formatDate(item.enrollmentDate)} />
                      {latest && (
                        <Field
                          label="Mã giao dịch"
                          value={<span style={{ fontSize: '0.8rem' }}>{latest.transactionCode}</span>}
                        />
                      )}
                    </div>

                    {/* Lớp đã rút khỏi nhưng đã hoàn tiền — ghi rõ để học viên
                        không tưởng là đang nợ hoặc đã ghi danh. */}
                    {item.enrollmentStatus === 'DROPPED' && (
                      <div
                        style={{
                          marginTop: '0.75rem',
                          padding: '0.6rem 0.85rem',
                          borderRadius: '10px',
                          background: 'rgba(59,130,246,0.08)',
                          border: '1px solid rgba(59,130,246,0.25)',
                          color: '#1e40af',
                          fontSize: '0.8rem',
                          lineHeight: 1.6,
                        }}
                      >
                        🚪 <strong>Đã rút khỏi lớp học này.</strong> Học phí đã được đánh dấu hoàn
                        tiền — vui lòng liên hệ phòng giáo vụ để được hoàn tiền.
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: '0.75rem',
                      flexWrap: 'wrap',
                      marginTop: '0.75rem',
                    }}
                  >
                    <button
                      type="button"
                      className="dash-quick-btn primary"
                      onClick={() => {
                        setDetail(item);
                        setPayMethod('VNPAY');
                      }}
                    >
                      👁️ Xem Chi Tiết
                    </button>

                    {item.tuitionStatus === 'PENDING' && (
                      <>
                        <button
                          type="button"
                          className="dash-quick-btn"
                          onClick={() => openVietQRForTuition(item)}
                        >
                          📱 Quét QR / Chuyển khoản
                        </button>
                        <button
                          type="button"
                          className="dash-quick-btn"
                          onClick={() => {
                            setDetail(item);
                            setPayMethod('VNPAY');
                          }}
                        >
                          💳 Thanh Toán
                        </button>
                      </>
                    )}

                    <Link
                      to={`/student/classes/${item.classId}`}
                      className="dash-quick-btn"
                      style={{
                        textDecoration: 'none',
                        display: item.enrollmentStatus === 'DROPPED' ? 'none' : undefined,
                      }}
                    >
                      ℹ️ Lớp Học
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

      {/* ══════════════════════════════════════════════════════
          TAB 2 — LỊCH SỬ GIAO DỊCH
      ══════════════════════════════════════════════════════ */}
      {tab === 'history' &&
        (filteredPayments.length === 0 ? (
          <EmptyState
            icon="📭"
            title="Không có giao dịch"
            description="Không có giao dịch nào phù hợp với bộ lọc hiện tại."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredPayments.map((p) => {
              const st = paymentStatusCfg(p.status);
              const cls = p.class as any;
              const displayCode = typeof cls === 'string' ? cls : cls?.classCode;
              const displayCourse = typeof cls === 'string' ? null : cls?.course;
              return (
                <div key={p._id} className="dash-card">
                  <div className="dash-card-header">
                    <h2 className="dash-card-title">
                      <span>{st.icon}</span> Thanh toán học phí
                    </h2>
                    <span className={`badge-pill ${st.cls}`}>{st.label}</span>
                  </div>

                  <div className="dash-subcard">
                    {(displayCode || p.course) && (
                      <div style={{ marginBottom: '0.75rem' }}>
                        <div className="dash-subcard-label">Lớp học</div>
                        <div className="dash-subcard-value">
                          {displayCourse?.code
                            ? `${displayCourse.code} — ${displayCourse.title}`
                            : displayCode ?? ''}
                        </div>
                      </div>
                    )}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                        gap: '0.75rem 1.5rem',
                      }}
                    >
                      <Field label="Mã giao dịch" value={p.transactionCode || p._id} />
                      <Field
                        label="Số tiền"
                        value={
                          <span style={{ fontWeight: 800, color: '#10b981', fontSize: '1.1rem' }}>
                            {formatVND(p.amount)}
                          </span>
                        }
                      />
                      <Field label="Phương thức" value={METHOD_LABEL[p.method] || p.method} />
                      {p.paymentDate && (
                        <Field label="Ngày thanh toán" value={formatDate(p.paymentDate)} />
                      )}
                      <Field label="Ngày tạo" value={formatDate(p.createdAt)} />
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: '0.75rem',
                      flexWrap: 'wrap',
                      marginTop: '0.75rem',
                    }}
                  >
                    {p.status === 'SUCCESS' && (
                      <button
                        type="button"
                        className="dash-quick-btn primary"
                        disabled={loadingReceipt}
                        onClick={() => handleViewReceipt(p._id)}
                      >
                        📄 Xem Biên Lai
                      </button>
                    )}
                    {p.status === 'PENDING' && (
                      <button
                        type="button"
                        className="dash-quick-btn"
                        onClick={() => openVietQRForPayment(p)}
                      >
                        📱 Quét QR / Chuyển khoản
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

      {/* ── Modal chi tiết học phí ── */}
      <Modal
        isOpen={!!detail}
        onClose={() => setDetail(null)}
        title="Chi Tiết Học Phí"
        icon="💳"
        size="lg"
        footer={
          detail && (
            <>
              <button
                type="button"
                className="dash-quick-btn"
                onClick={() => setDetail(null)}
                disabled={paying}
              >
                Đóng
              </button>
              {detail.tuitionStatus === 'PENDING' && (
                <button
                  type="button"
                  className="dash-quick-btn primary"
                  onClick={handlePay}
                  disabled={paying}
                >
                  {paying ? '⏳ Đang xử lý...' : `💳 Thanh toán ${formatVND(detail.tuitionFee)}`}
                </button>
              )}
            </>
          )
        }
      >
        {detail && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Header khóa học */}
            <div
              style={{
                background: 'linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)',
                borderRadius: '14px',
                padding: '1.25rem',
                border: '1px solid #e2e8f0',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div className="dash-subcard-label">Khóa học</div>
                  <h3
                    style={{
                      margin: '0.25rem 0 0.25rem',
                      fontSize: '1.1rem',
                      fontWeight: 800,
                      color: '#0f172a',
                    }}
                  >
                    {detail.course?.title || '—'}
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    Mã khóa học: <strong style={{ color: '#0f172a' }}>{detail.course?.code || '—'}</strong>{' '}
                    • Mã lớp: <strong style={{ color: '#0f172a' }}>{detail.classCode}</strong>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`badge-pill ${tuitionStatusCfg(detail.tuitionStatus).cls}`}>
                    {tuitionStatusCfg(detail.tuitionStatus).icon}{' '}
                    {tuitionStatusCfg(detail.tuitionStatus).label}
                  </span>
                  <div
                    style={{
                      marginTop: '0.5rem',
                      fontSize: '1.35rem',
                      fontWeight: 800,
                      color: tuitionStatusCfg(detail.tuitionStatus).color,
                    }}
                  >
                    {formatVND(detail.tuitionFee)}
                  </div>
                </div>
              </div>
            </div>

            {/* Thông tin chi tiết */}
            <div>
              <h4
                style={{
                  margin: '0 0 0.6rem',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  color: '#0f172a',
                }}
              >
                📋 Thông tin chi tiết
              </h4>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '0.75rem 1.5rem',
                }}
              >
                <Field label="Giảng viên" value={detail.teacher?.fullName} />
                <Field label="Email giảng viên" value={detail.teacher?.email} />
                <Field label="Phòng học" value={detail.room} />
                <Field label="Lịch học" value={detail.scheduleDays?.join(', ')} />
                <Field label="Ca học" value={detail.timeSlot} />
                <Field
                  label="Thời gian học"
                  value={`${formatDate(detail.startDate)} — ${formatDate(detail.endDate)}`}
                />
                <Field
                  label="Thời lượng"
                  value={
                    detail.course?.durationWeeks
                      ? `${detail.course.durationWeeks} tuần`
                      : detail.course?.sessions
                      ? `${detail.course.sessions} buổi`
                      : undefined
                  }
                />
                <Field label="Ngày ghi danh" value={formatDate(detail.enrollmentDate)} />
              </div>
              {detail.course?.description && (
                <div style={{ marginTop: '0.75rem' }}>
                  <Field label="Mô tả khóa học" value={detail.course.description} />
                </div>
              )}
            </div>

            {/* Phương thức thanh toán (chỉ khi chưa thanh toán) */}
            {detail.tuitionStatus === 'PENDING' && (
              <div>
                <h4
                  style={{
                    margin: '0 0 0.6rem',
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    color: '#0f172a',
                  }}
                >
                  🎯 Phương thức thanh toán
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {(Object.keys(METHOD_LABEL) as PaymentMethod[]).map((m) => (
                    <label
                      key={m}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        padding: '0.6rem 0.85rem',
                        border: `1px solid ${payMethod === m ? '#2563eb' : '#e2e8f0'}`,
                        background: payMethod === m ? '#eff6ff' : 'white',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontSize: '0.88rem',
                      }}
                    >
                      <input
                        type="radio"
                        name="payMethod"
                        checked={payMethod === m}
                        onChange={() => setPayMethod(m)}
                      />
                      <span>{METHOD_LABEL[m]}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Lịch sử giao dịch của khoản học phí này */}
            <div>
              <h4
                style={{
                  margin: '0 0 0.6rem',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  color: '#0f172a',
                }}
              >
                🧾 Giao dịch ({detail.payments?.length || 0})
              </h4>
              {detail.payments?.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {detail.payments.map((p) => (
                    <div
                      key={p._id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '0.65rem 0.85rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        fontSize: '0.85rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{p.transactionCode}</div>
                        <div style={{ color: '#64748b', marginTop: '0.15rem' }}>
                          {METHOD_LABEL[p.method] || p.method} • {formatDate(p.paymentDate, true)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, color: '#10b981' }}>{formatVND(p.amount)}</div>
                        <div
                          style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.15rem' }}
                        >
                          {p.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    padding: '0.85rem',
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: '10px',
                    fontSize: '0.85rem',
                    color: '#92400e',
                  }}
                >
                  ⏳ Chưa có giao dịch thanh toán nào cho khóa học này.
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Modal VietQR ── */}
      <VietQRModal
        isOpen={isVietQRModalOpen}
        onClose={() => setIsVietQRModalOpen(false)}
        data={vietQRData}
        onPaymentSuccess={() => {
          fetchData();
        }}
      />

      {/* ── Modal biên lai điện tử ── */}
      <PaymentReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />
    </div>
  );
};

const Field: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div>
    <div className="dash-subcard-label">{label}</div>
    <div className="dash-subcard-value">{value || '—'}</div>
  </div>
);

export default TuitionPage;
