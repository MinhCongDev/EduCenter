import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { studentService } from '../../services/student.service';
import type { Payment, PaymentStatus, PaymentStats } from '../../types';
import { EmptyState, SkeletonPage } from '../../components/Skeleton';
import { formatDate, formatVND } from '../../utils/format';

type FilterKey = 'ALL' | PaymentStatus;

const statusCfg = (s: PaymentStatus) => {
  const map: Record<PaymentStatus, { label: string; cls: string; icon: string }> = {
    SUCCESS: { label: 'Đã thanh toán', cls: 'badge-green', icon: '✅' },
    PENDING: { label: 'Chờ thanh toán', cls: 'badge-amber', icon: '⏳' },
    FAILED: { label: 'Thất bại', cls: 'badge-purple', icon: '❌' },
    REFUNDED: { label: 'Đã hoàn tiền', cls: 'badge-blue', icon: '💸' },
  };
  return map[s] || { label: s, cls: 'badge-amber', icon: '❓' };
};

const PaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      const res = await studentService.getPayments();
      if (res.success && res.data) {
        setPayments(res.data.payments);
        setStats(res.data.stats);
      } else {
        toast.error(res.message || 'Không thể tải lịch sử thanh toán');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể tải lịch sử thanh toán');
    } finally {
      setIsLoading(false);
    }
  };

  // ── M5: search & filter ──
  const filtered = payments.filter((p) => {
    if (filter !== 'ALL' && p.status !== filter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
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

  if (isLoading) return <SkeletonPage message="Đang tải lịch sử thanh toán..." />;

  const tabs: { key: FilterKey; label: string; count: number }[] = [
    { key: 'ALL', label: 'Tất cả', count: payments.length },
    { key: 'SUCCESS', label: '✅ Đã thanh toán', count: payments.filter((p) => p.status === 'SUCCESS').length },
    { key: 'PENDING', label: '⏳ Chờ thanh toán', count: payments.filter((p) => p.status === 'PENDING').length },
    { key: 'FAILED', label: '❌ Thất bại', count: payments.filter((p) => p.status === 'FAILED').length },
    { key: 'REFUNDED', label: '💸 Đã hoàn tiền', count: payments.filter((p) => p.status === 'REFUNDED').length },
  ];

  return (
    <div className="dash-container">
      <div className="dash-banner">
        <div className="dash-banner-content">
          <div className="dash-banner-badge">💳 Thanh Toán</div>
          <h1>Lịch Sử Thanh Toán Học Phí</h1>
          <p>
            {payments.length > 0
              ? `Tổng ${payments.length} giao dịch. Đã thanh toán: ${formatVND(stats?.totalPaid || 0)}`
              : 'Chưa có giao dịch thanh toán nào.'}
          </p>
        </div>
        <div className="dash-banner-right">
          <div className="dash-date-pill">
            <div>💳 {payments.length} giao dịch</div>
            <div className="sub">Học viên: {user?.fullName}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <Link to="/student/dashboard" className="dash-quick-btn" style={{ textDecoration: 'none' }}>
          ← Dashboard
        </Link>
        <Link to="/student/classes" className="dash-quick-btn" style={{ textDecoration: 'none' }}>
          📚 Lớp Học
        </Link>
        <Link to="/student/requests" className="dash-quick-btn" style={{ textDecoration: 'none' }}>
          🔄 Yêu Cầu
        </Link>
      </div>

      {stats && stats.total > 0 && (
        <div className="dash-metrics-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Đã thanh toán</span>
              <span className="dash-metric-val" style={{ color: '#10b981' }}>
                {formatVND(stats.totalPaid)}
              </span>
              <span className="dash-metric-trend up">{stats.paidCount} giao dịch</span>
            </div>
            <div className="dash-metric-icon icon-emerald">✅</div>
          </div>
          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Chờ thanh toán</span>
              <span className="dash-metric-val" style={{ color: '#f59e0b' }}>
                {formatVND(stats.totalPending)}
              </span>
              <span className="dash-metric-trend">{stats.pendingCount} khoản chưa thanh toán</span>
            </div>
            <div className="dash-metric-icon icon-amber">⏳</div>
          </div>
          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Tổng phát sinh</span>
              <span className="dash-metric-val">
                {formatVND(stats.totalPaid + stats.totalPending)}
              </span>
              <span className="dash-metric-trend">{stats.total} giao dịch</span>
            </div>
            <div className="dash-metric-icon icon-blue">💰</div>
          </div>
        </div>
      )}

      {payments.length > 0 && (
        <div className="dash-card" style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(220px, 2fr) auto',
              gap: '0.75rem',
              alignItems: 'center',
              marginBottom: '0.75rem',
            }}
          >
            <input
              type="text"
              placeholder="🔍 Tìm theo mã GD, phương thức, lớp..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: '0.9rem',
              }}
            />
            <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
              {filtered.length}/{payments.length} giao dịch
            </span>
          </div>
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
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon="📭"
          title="Không có giao dịch"
          description="Không có giao dịch nào phù hợp với bộ lọc hiện tại."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map((p) => {
            const status = statusCfg(p.status);
            // p.class is populated as: { classCode, room, course: { code, title } }
            const cls = p.class as any;
            const displayCode = typeof cls === 'string' ? cls : cls?.classCode;
            const displayCourse = typeof cls === 'string' ? null : cls?.course;
            return (
              <div key={p._id} className="dash-card">
                <div className="dash-card-header">
                  <h2 className="dash-card-title">
                    <span>{status.icon}</span> Thanh toán học phí
                  </h2>
                  <span className={`badge-pill ${status.cls}`}>{status.label}</span>
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
                    <Field label="Phương thức" value={p.method || '—'} />
                    {p.paymentDate && (
                      <Field label="Ngày thanh toán" value={formatDate(p.paymentDate)} />
                    )}
                    {p.dueDate && (
                      <Field
                        label="Hạn thanh toán"
                        value={
                          <span style={{ color: p.status === 'PENDING' ? '#f59e0b' : 'inherit' }}>
                            {formatDate(p.dueDate)}
                          </span>
                        }
                      />
                    )}
                    <Field label="Ngày tạo" value={formatDate(p.createdAt)} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const Field: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div>
    <div className="dash-subcard-label">{label}</div>
    <div className="dash-subcard-value">{value || '—'}</div>
  </div>
);

export default PaymentsPage;
