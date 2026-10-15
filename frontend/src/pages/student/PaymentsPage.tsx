import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Payment {
  id: string;
  enrollmentId: string;
  classCode: string;
  courseName: string;
  amount: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'VNPAY' | 'MOMO';
  transactionCode: string;
  paymentDate: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  tuitionStatus: 'PAID' | 'PENDING';
}

const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');
  const [showPayModal, setShowPayModal] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'BANK_TRANSFER' | 'VNPAY' | 'MOMO' | 'CASH'>('VNPAY');

  useEffect(() => {
    // Mock data - sẽ thay bằng API: GET /api/student/payments
    setTimeout(() => {
      const mockPayments: Payment[] = [
        {
          id: 'p1',
          enrollmentId: 'e1',
          classCode: 'WEB-K24-A',
          courseName: 'Lập trình Web Full-Stack MERN',
          amount: 5000000,
          paymentMethod: 'VNPAY',
          transactionCode: 'VNP-20260901-001',
          paymentDate: '01/09/2026 09:30',
          status: 'COMPLETED',
          tuitionStatus: 'PAID',
        },
        {
          id: 'p2',
          enrollmentId: 'e2',
          classCode: 'REACT-K23-B',
          courseName: 'ReactJS Nâng Cao & State Management',
          amount: 4500000,
          paymentMethod: 'MOMO',
          transactionCode: 'MOMO-20260515-002',
          paymentDate: '15/05/2026 14:20',
          status: 'COMPLETED',
          tuitionStatus: 'PAID',
        },
        {
          id: 'p3',
          enrollmentId: 'e3',
          classCode: 'NODE-K25-A',
          courseName: 'Node.js Backend Development',
          amount: 5500000,
          paymentMethod: 'VNPAY',
          transactionCode: '',
          paymentDate: '',
          status: 'PENDING',
          tuitionStatus: 'PENDING',
        },
      ];
      setPayments(mockPayments);
      setLoading(false);
    }, 500);
  }, []);

  const handlePayNow = (paymentId: string) => {
    // Simulate payment
    setPayments((prev) =>
      prev.map((p) =>
        p.id === paymentId
          ? {
              ...p,
              status: 'COMPLETED',
              tuitionStatus: 'PAID',
              paymentMethod,
              transactionCode: `${paymentMethod}-${Date.now()}`,
              paymentDate: new Date().toLocaleString('vi-VN'),
            }
          : p
      )
    );
    setShowPayModal(null);
    alert(`Thanh toán thành công qua ${paymentMethod}!`);
  };

  if (loading) {
    return (
      <div className="dash-container">
        <div className="dash-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Đang tải dữ liệu thanh toán...</p>
        </div>
      </div>
    );
  }

  const filtered = payments.filter((p) => {
    if (filter === 'ALL') return true;
    return p.status === filter;
  });

  const totalPaid = payments.filter((p) => p.status === 'COMPLETED').reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter((p) => p.status === 'PENDING').reduce((s, p) => s + p.amount, 0);

  return (
    <div className="dash-container">
      {/* ── Banner ── */}
      <div className="dash-banner">
        <div className="dash-banner-content">
          <div className="dash-banner-badge">💳 Học Phí & Thanh Toán • EduCenter Portal</div>
          <h1>Quản lý học phí</h1>
          <p>Thanh toán học phí các lớp đã đăng ký và theo dõi lịch sử giao dịch.</p>
        </div>
        <div className="dash-banner-right">
          <div className="dash-date-pill">
            <div>💰 Tổng đã đóng: {(totalPaid / 1000000).toFixed(1)}M</div>
            <div className="sub">Còn phải đóng: {(totalPending / 1000000).toFixed(1)}M</div>
          </div>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="dash-metrics-grid">
        <div className="dash-metric-card">
          <div className="dash-metric-info">
            <span className="dash-metric-label">Tổng đã thanh toán</span>
            <span className="dash-metric-val">{(totalPaid / 1000000).toFixed(1)}M đ</span>
            <span className="dash-metric-trend up">Thành công</span>
          </div>
          <div className="dash-metric-icon icon-emerald">✅</div>
        </div>
        <div className="dash-metric-card">
          <div className="dash-metric-info">
            <span className="dash-metric-label">Còn phải đóng</span>
            <span className="dash-metric-val">{(totalPending / 1000000).toFixed(1)}M đ</span>
            <span className={`dash-metric-trend ${totalPending > 0 ? 'down' : 'up'}`}>
              {totalPending > 0 ? 'Cần thanh toán' : 'Hoàn tất'}
            </span>
          </div>
          <div className="dash-metric-icon icon-amber">⏰</div>
        </div>
        <div className="dash-metric-card">
          <div className="dash-metric-info">
            <span className="dash-metric-label">Số lớp đã đóng</span>
            <span className="dash-metric-val">
              {payments.filter((p) => p.status === 'COMPLETED').length} lớp
            </span>
            <span className="dash-metric-trend up">Hoàn tất</span>
          </div>
          <div className="dash-metric-icon icon-blue">📚</div>
        </div>
        <div className="dash-metric-card">
          <div className="dash-metric-info">
            <span className="dash-metric-label">Lớp chờ thanh toán</span>
            <span className="dash-metric-val">
              {payments.filter((p) => p.status === 'PENDING').length} lớp
            </span>
            <span className="dash-metric-trend down">Cần xử lý</span>
          </div>
          <div className="dash-metric-icon icon-purple">💳</div>
        </div>
      </div>

      {/* ── Filter + List ── */}
      <div className="dash-card">
        <div className="dash-card-header">
          <h2 className="dash-card-title">
            <span>💰</span> Lịch Sử Giao Dịch
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {(['ALL', 'PENDING', 'COMPLETED'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`dash-quick-btn ${filter === f ? 'primary' : ''}`}
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
              >
                {f === 'ALL' ? 'Tất cả' : f === 'PENDING' ? 'Chờ thanh toán' : 'Đã thanh toán'}
              </button>
            ))}
          </div>
        </div>

        <div className="dash-item-list">
          {filtered.map((p) => (
            <div key={p.id} className="dash-subcard">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <div style={{ flex: 1, minWidth: '250px' }}>
                  <h3 className="dash-subcard-title" style={{ margin: 0 }}>
                    {p.courseName}
                  </h3>
                  <div className="dash-subcard-meta" style={{ marginTop: '0.4rem' }}>
                    📚 Mã lớp: <strong>{p.classCode}</strong>
                  </div>
                  {p.paymentDate && (
                    <div className="dash-subcard-meta">
                      📅 Ngày thanh toán: {p.paymentDate}
                    </div>
                  )}
                  {p.transactionCode && (
                    <div className="dash-subcard-meta" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      🔖 Mã GD: {p.transactionCode}
                    </div>
                  )}
                  {p.paymentMethod && p.status === 'COMPLETED' && (
                    <div className="dash-subcard-meta">💳 Phương thức: {p.paymentMethod}</div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 800,
                      color: p.status === 'COMPLETED' ? '#10b981' : '#f59e0b',
                    }}
                  >
                    {p.amount.toLocaleString('vi-VN')} đ
                  </div>
                  {p.status === 'COMPLETED' && (
                    <span className="badge-pill badge-green" style={{ marginTop: '0.25rem' }}>
                      ✅ Thành công
                    </span>
                  )}
                  {p.status === 'PENDING' && (
                    <span className="badge-pill badge-amber" style={{ marginTop: '0.25rem' }}>
                      ⏳ Chờ thanh toán
                    </span>
                  )}
                  {p.status === 'FAILED' && (
                    <span
                      className="badge-pill"
                      style={{ background: '#ef4444', color: 'white', marginTop: '0.25rem' }}
                    >
                      ❌ Thất bại
                    </span>
                  )}
                  {p.status === 'REFUNDED' && (
                    <span className="badge-pill badge-blue" style={{ marginTop: '0.25rem' }}>
                      ↩️ Đã hoàn tiền
                    </span>
                  )}
                </div>
              </div>

              {p.status === 'PENDING' && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setShowPayModal(p.id)}
                    className="dash-quick-btn primary"
                  >
                    💳 Thanh toán ngay
                  </button>
                  <Link
                    to="/student/requests"
                    className="dash-quick-btn"
                    style={{ textDecoration: 'none' }}
                  >
                    📞 Liên hệ hỗ trợ
                  </Link>
                </div>
              )}

              {p.status === 'COMPLETED' && (
                <button
                  type="button"
                  onClick={() => alert(`In hóa đơn cho giao dịch ${p.transactionCode}`)}
                  className="dash-quick-btn"
                  style={{ marginTop: '0.75rem' }}
                >
                  🧾 In hóa đơn
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Payment Modal ── */}
      {showPayModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowPayModal(null)}
        >
          <div
            className="dash-card"
            style={{ maxWidth: '500px', width: '90%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 1rem 0' }}>💳 Chọn phương thức thanh toán</h3>
            {(['VNPAY', 'MOMO', 'BANK_TRANSFER', 'CASH'] as const).map((m) => (
              <label
                key={m}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  border: paymentMethod === m ? '2px solid #6366f1' : '1px solid #e5e7eb',
                  borderRadius: '8px',
                  marginBottom: '0.5rem',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === m}
                  onChange={() => setPaymentMethod(m)}
                />
                <span style={{ fontWeight: 600 }}>
                  {m === 'VNPAY'
                    ? '💳 VNPay (ATM/Internet Banking)'
                    : m === 'MOMO'
                      ? '📱 Ví MoMo'
                      : m === 'BANK_TRANSFER'
                        ? '🏦 Chuyển khoản ngân hàng'
                        : '💵 Tiền mặt (tại văn phòng)'}
                </span>
              </label>
            ))}
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="button" onClick={() => setShowPayModal(null)} className="dash-quick-btn">
                Hủy
              </button>
              <button
                type="button"
                onClick={() => handlePayNow(showPayModal)}
                className="dash-quick-btn primary"
              >
                ✅ Xác nhận thanh toán
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsPage;
