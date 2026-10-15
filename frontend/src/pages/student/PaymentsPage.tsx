import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { studentService } from '../../services/student.service';
import type { PaymentItem } from '../../types';

const PaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'PAID' | 'PENDING' | 'FAILED'>('ALL');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await studentService.getPayments();
      if (res.success && res.data) setPayments(res.data.payments);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Không thể tải lịch sử thanh toán');
    } finally {
      setIsLoading(false);
    }
  };

  const statusConfig = (s: string) => {
    if (s === 'PAID') return { label: 'Đã thanh toán', cls: 'badge-green', icon: '✅' };
    if (s === 'PENDING') return { label: 'Chờ thanh toán', cls: 'badge-amber', icon: '⏳' };
    if (s === 'FAILED') return { label: 'Thất bại', cls: 'badge-purple', icon: '❌' };
    if (s === 'REFUNDED') return { label: 'Đã hoàn tiền', cls: 'badge-blue', icon: '💸' };
    return { label: s, cls: 'badge-amber', icon: '❓' };
  };

  const filtered = payments.filter(p => {
    if (filter === 'ALL') return true;
    return p.status === filter;
  });

  const totalPaid = payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0);

  const filterTabs: { key: typeof filter; label: string }[] = [
    { key: 'ALL', label: `Tất cả (${payments.length})` },
    { key: 'PAID', label: `✅ Đã thanh toán (${payments.filter(p => p.status === 'PAID').length})` },
    { key: 'PENDING', label: `⏳ Chờ thanh toán (${payments.filter(p => p.status === 'PENDING').length})` },
    { key: 'FAILED', label: `❌ Thất bại (${payments.filter(p => p.status === 'FAILED').length})` },
  ];

  if (isLoading) {
    return (
      <div className="dash-container" style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p>Đang tải lịch sử thanh toán...</p>
      </div>
    );
  }

  return (
    <div className="dash-container">
      {/* ── Page Header ── */}
      <div className="dash-banner">
        <div className="dash-banner-content">
          <div className="dash-banner-badge">💳 Thanh Toán</div>
          <h1>Lịch Sử Thanh Toán Học Phí</h1>
          <p>
            {payments.length > 0
              ? `Tổng ${payments.length} giao dịch. Đã thanh toán: ${totalPaid.toLocaleString('vi-VN')} VNĐ`
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

      {/* ── Quick Nav ── */}
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

      {/* ── Error ── */}
      {error && (
        <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(239,68,68,0.1)', borderRadius: '12px', marginBottom: '1.5rem' }}>
          <p style={{ color: '#ef4444', marginBottom: '0.75rem' }}>{error}</p>
          <button className="dash-quick-btn primary" onClick={fetchPayments}>Thử lại</button>
        </div>
      )}

      {/* ── Metrics ── */}
      {payments.length > 0 && (
        <div className="dash-metrics-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Đã thanh toán</span>
              <span className="dash-metric-val" style={{ color: '#10b981' }}>
                {totalPaid.toLocaleString('vi-VN')} <span style={{ fontSize: '0.8em', fontWeight: 400 }}>VNĐ</span>
              </span>
              <span className="dash-metric-trend up">
                {payments.filter(p => p.status === 'PAID').length} giao dịch
              </span>
            </div>
            <div className="dash-metric-icon icon-emerald">✅</div>
          </div>
          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Chờ thanh toán</span>
              <span className="dash-metric-val" style={{ color: '#f59e0b' }}>
                {totalPending.toLocaleString('vi-VN')} <span style={{ fontSize: '0.8em', fontWeight: 400 }}>VNĐ</span>
              </span>
              <span className="dash-metric-trend">
                {payments.filter(p => p.status === 'PENDING').length} khoản chưa thanh toán
              </span>
            </div>
            <div className="dash-metric-icon icon-amber">⏳</div>
          </div>
          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Tổng phí đã chi</span>
              <span className="dash-metric-val">
                {(totalPaid + totalPending).toLocaleString('vi-VN')} <span style={{ fontSize: '0.8em', fontWeight: 400 }}>VNĐ</span>
              </span>
              <span className="dash-metric-trend">
                {payments.length} giao dịch
              </span>
            </div>
            <div className="dash-metric-icon icon-blue">💰</div>
          </div>
        </div>
      )}

      {/* ── Filter Tabs ── */}
      {payments.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {filterTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`dash-quick-btn ${filter === tab.key ? 'primary' : ''}`}
              style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Payment List ── */}
      {filtered.length === 0 && !isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--dash-card-subtle)', borderRadius: '16px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
          <h2>Không có giao dịch</h2>
          <p style={{ opacity: 0.7 }}>Không có giao dịch nào phù hợp với bộ lọc hiện tại.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map((p) => {
            const status = statusConfig(p.status);
            return (
              <div key={p._id} className="dash-card">
                <div className="dash-card-header">
                  <h2 className="dash-card-title">
                    <span>{status.icon}</span>
                    Thanh toán học phí
                  </h2>
                  <span className={`badge-pill ${status.cls}`}>{status.label}</span>
                </div>

                <div className="dash-subcard">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem 1.5rem' }}>
                    <div>
                      <div className="dash-subcard-label">Mã giao dịch</div>
                      <div className="dash-subcard-value">{p.transactionId || p._id}</div>
                    </div>
                    <div>
                      <div className="dash-subcard-label">Số tiền</div>
                      <div className="dash-subcard-value" style={{ fontWeight: 800, color: '#10b981', fontSize: '1.1rem' }}>
                        {p.amount.toLocaleString('vi-VN')} VNĐ
                      </div>
                    </div>
                    <div>
                      <div className="dash-subcard-label">Phương thức</div>
                      <div className="dash-subcard-value">{p.method || '—'}</div>
                    </div>
                    {p.paymentDate && (
                      <div>
                        <div className="dash-subcard-label">Ngày thanh toán</div>
                        <div className="dash-subcard-value">
                          {new Date(p.paymentDate).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                    )}
                    {p.dueDate && (
                      <div>
                        <div className="dash-subcard-label">Hạn thanh toán</div>
                        <div className="dash-subcard-value" style={{ color: p.status === 'PENDING' ? '#f59e0b' : 'inherit' }}>
                          {new Date(p.dueDate).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="dash-subcard-label">Ngày tạo</div>
                      <div className="dash-subcard-value">
                        {new Date(p.createdAt).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
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

export default PaymentsPage;
