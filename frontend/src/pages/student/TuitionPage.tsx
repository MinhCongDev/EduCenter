import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { studentService } from '../../services/student.service';
import { Modal } from '../../components/Modal';
import { EmptyState, SkeletonPage } from '../../components/Skeleton';
import { formatDate, formatVND } from '../../utils/format';
import type { PaymentMethod, TuitionItem, TuitionStats } from '../../types';

type TuitionFilter = 'ALL' | 'PAID' | 'PENDING' | 'REFUNDED';

const statusCfg = (s: TuitionItem['tuitionStatus']) => {
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

const METHOD_LABEL: Record<PaymentMethod, string> = {
  VNPAY: 'VNPay',
  BANK_TRANSFER: 'Chuyển khoản ngân hàng',
  CASH: 'Tiền mặt',
  CREDIT_CARD: 'Thẻ tín dụng',
};

const TuitionPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState<TuitionItem[]>([]);
  const [stats, setStats] = useState<TuitionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<TuitionFilter>('ALL');
  const [search, setSearch] = useState('');

  // Modal chi tiết
  const [detail, setDetail] = useState<TuitionItem | null>(null);
  const [paying, setPaying] = useState(false);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('VNPAY');

  const fetchTuition = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await studentService.getTuition();
      if (res.success && res.data) {
        setItems(res.data.items || []);
        setStats(res.data.stats);
      } else {
        toast.error(res.message || 'Không thể tải danh sách học phí');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể tải danh sách học phí');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTuition();
  }, [fetchTuition]);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (filter !== 'ALL' && i.tuitionStatus !== filter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const hay = [
          i.classCode,
          i.course?.code,
          i.course?.title,
          i.teacher?.fullName,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, filter, search]);

  // Số lớp ĐANG theo học (loại trừ lớp đã rút) và số khoản đã hoàn tiền.
  // `items` giờ bao gồm cả enrollment DROPPED + REFUNDED nên không thể dùng
  // `items.length` cho câu "Bạn đang theo học N khóa học".
  const activeCount = items.filter((i) => i.enrollmentStatus !== 'DROPPED').length;
  const refundedCount = items.filter((i) => i.tuitionStatus === 'REFUNDED').length;

  const openDetail = (item: TuitionItem) => {
    setDetail(item);
    setPayMethod('VNPAY');
  };

  const handlePay = async () => {
    if (!detail) return;
    try {
      setPaying(true);
      const res = await studentService.payTuition(detail.enrollmentId, payMethod);
      if (res.success) {
        toast.success(res.message || 'Thanh toán học phí thành công!');
        setDetail(null);
        await fetchTuition();
      } else {
        toast.error(res.message || 'Thanh toán thất bại');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Thanh toán thất bại');
    } finally {
      setPaying(false);
    }
  };

  if (isLoading) return <SkeletonPage message="Đang tải học phí..." />;

  const tabs: { key: TuitionFilter; label: string; count: number }[] = [
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

  return (
    <div className="dash-container">
      {/* ── Banner ── */}
      <div className="dash-banner">
        <div className="dash-banner-content">
          <div className="dash-banner-badge">💳 Thanh Toán</div>
          <h1>Thanh Toán Khóa Học</h1>
          <p>
            {items.length > 0
              ? `Bạn đang theo học ${activeCount} khóa học • ${stats?.pendingCount || 0} khoản chờ thanh toán${
                  refundedCount > 0 ? ` • ${refundedCount} khoản đã hoàn tiền` : ''
                }`
              : 'Bạn chưa đăng ký khóa học nào để thanh toán.'}
          </p>
        </div>
        <div className="dash-banner-right">
          <div className="dash-date-pill">
            <div>💰 {stats?.pendingCount || 0} khoản chờ</div>
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
      {stats && stats.total > 0 && (
        <div className="dash-metrics-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Đã thanh toán</span>
              <span className="dash-metric-val" style={{ color: '#10b981' }}>
                {formatVND(stats.totalPaid)}
              </span>
              <span className="dash-metric-trend up">{stats.paidCount} khóa học</span>
            </div>
            <div className="dash-metric-icon icon-emerald">✅</div>
          </div>

          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Chờ thanh toán</span>
              <span className="dash-metric-val" style={{ color: '#f59e0b' }}>
                {formatVND(stats.totalPending)}
              </span>
              <span className="dash-metric-trend">{stats.pendingCount} khóa học</span>
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

      {/* ── Filter + Search ── */}
      <div className="dash-card" style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem' }}>
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`dash-quick-btn ${filter === tab.key ? 'primary' : ''}`}
                style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="🔍 Tìm theo mã lớp, khóa học, giảng viên..."
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

      {/* ── Danh sách ── */}
      {filtered.length === 0 ? (
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
          {filtered.map((item) => {
            const st = statusCfg(item.tuitionStatus);
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
                    <Field
                      label="Ngày ghi danh"
                      value={formatDate(item.enrollmentDate)}
                    />
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
                      🚪 <strong>Đã rút khỏi lớp học này.</strong> Học phí đã được
                      đánh dấu hoàn tiền — vui lòng liên hệ phòng giáo vụ để được
                      hoàn tiền.
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                  <button
                    type="button"
                    className="dash-quick-btn primary"
                    onClick={() => openDetail(item)}
                  >
                    👁️ Xem Chi Tiết
                  </button>
                  {item.tuitionStatus === 'PENDING' && (
                    <button
                      type="button"
                      className="dash-quick-btn"
                      onClick={() => {
                        openDetail(item);
                      }}
                    >
                      💳 Thanh Toán
                    </button>
                  )}
                  <Link
                    to={`/student/classes/${item.classId}`}
                    className="dash-quick-btn"
                    style={{ textDecoration: 'none', display: item.enrollmentStatus === 'DROPPED' ? 'none' : undefined }}
                  >
                    ℹ️ Lớp Học
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal chi tiết ── */}
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
                    • Mã lớp:{' '}
                    <strong style={{ color: '#0f172a' }}>{detail.classCode}</strong>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`badge-pill ${statusCfg(detail.tuitionStatus).cls}`}>
                    {statusCfg(detail.tuitionStatus).icon} {statusCfg(detail.tuitionStatus).label}
                  </span>
                  <div
                    style={{
                      marginTop: '0.5rem',
                      fontSize: '1.35rem',
                      fontWeight: 800,
                      color: statusCfg(detail.tuitionStatus).color,
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
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>
                          {p.transactionCode}
                        </div>
                        <div style={{ color: '#64748b', marginTop: '0.15rem' }}>
                          {METHOD_LABEL[p.method] || p.method} • {formatDate(p.paymentDate, true)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, color: '#10b981' }}>
                          {formatVND(p.amount)}
                        </div>
                        <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.15rem' }}>
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
