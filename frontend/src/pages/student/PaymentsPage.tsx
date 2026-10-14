import React, { useState, useEffect } from 'react';
import { studentService } from '../../services/student.service';
import type { Enrollment, Payment } from '../../types';

const PaymentsPage: React.FC = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch enrollments
      const enrollRes = await studentService.getEnrollmentStatus();
      if (enrollRes.success && enrollRes.data) {
        setEnrollments(enrollRes.data.enrollments);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async (enrollment: Enrollment) => {
    const method = prompt('Chọn phương thức thanh toán:\n1. Tiền mặt (CASH)\n2. Chuyển khoản (BANK_TRANSFER)\n3. VNPAY\n4. MOMO\n\nNhập số (1-4):', '1');
    
    if (!method || !['1', '2', '3', '4'].includes(method)) {
      return;
    }

    const methods: Record<string, 'CASH' | 'BANK_TRANSFER' | 'VNPAY' | 'MOMO'> = {
      '1': 'CASH',
      '2': 'BANK_TRANSFER',
      '3': 'VNPAY',
      '4': 'MOMO'
    };

    const transactionCode = prompt('Nhập mã giao dịch (nếu có):', '');

    try {
      setProcessingId(enrollment._id);
      const res = await studentService.makePayment({
        enrollmentId: enrollment._id,
        amount: enrollment.class?.course?.tuitionFee || 0,
        paymentMethod: methods[method],
        transactionCode: transactionCode || undefined
      });

      if (res.success) {
        alert('Thanh toán thành công!');
        fetchData(); // Refresh data
      } else {
        alert(res.message || 'Thanh toán thất bại');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi thanh toán');
    } finally {
      setProcessingId(null);
    }
  };

  const pendingEnrollments = enrollments.filter(e => e.tuitionStatus === 'PENDING');
  const paidEnrollments = enrollments.filter(e => e.tuitionStatus === 'PAID');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="dash-container" style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p>Đang tải thông tin học phí...</p>
      </div>
    );
  }

  return (
    <div className="dash-container">
      {/* Header */}
      <div className="dash-banner" style={{ marginBottom: '1.5rem' }}>
        <div className="dash-banner-content">
          <div className="dash-banner-badge">💳 Thanh Toán Học Phí</div>
          <h1>Quản Lý Học Phí</h1>
          <p>Theo dõi và thanh toán học phí các lớp đã đăng ký</p>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: '#fee2e2', borderRadius: '8px', marginBottom: '1rem', color: '#dc2626' }}>
          ❌ {error}
        </div>
      )}

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="dash-card" style={{ textAlign: 'center', borderTop: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b' }}>{pendingEnrollments.length}</div>
          <div style={{ opacity: 0.7 }}>Chưa thanh toán</div>
        </div>
        <div className="dash-card" style={{ textAlign: 'center', borderTop: '4px solid #10b981' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>{paidEnrollments.length}</div>
          <div style={{ opacity: 0.7 }}>Đã thanh toán</div>
        </div>
      </div>

      {/* Pending Payments */}
      {pendingEnrollments.length > 0 && (
        <div className="dash-card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid #f59e0b' }}>
          <div className="dash-card-header">
            <h2 className="dash-card-title">
              <span>⚠️</span> Học Phí Cần Thanh Toán
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 0' }}>
            {pendingEnrollments.map(enrollment => (
              <div key={enrollment._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#fef3c7', borderRadius: '8px', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{enrollment.class?.course?.title || 'Khóa học'}</div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                    Lớp: {enrollment.class?.classCode} • Học phí: {formatCurrency(enrollment.class?.course?.tuitionFee || 0)}
                  </div>
                </div>
                <button
                  type="button"
                  className="dash-quick-btn primary"
                  onClick={() => handlePayment(enrollment)}
                  disabled={processingId === enrollment._id}
                >
                  {processingId === enrollment._id ? '⏳ Đang xử lý...' : '💳 Thanh toán'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Enrollments */}
      <div className="dash-card">
        <div className="dash-card-header">
          <h2 className="dash-card-title">
            <span>📋</span> Tất Cả Đăng Ký Học
          </h2>
        </div>

        {enrollments.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', opacity: 0.7 }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
            <p>Bạn chưa đăng ký lớp học nào</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem 0' }}>
            {enrollments.map(enrollment => (
              <div key={enrollment._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#f9fafb', borderRadius: '8px', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{enrollment.class?.course?.title || 'Khóa học'}</div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                    Lớp: {enrollment.class?.classCode}
                  </div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                    Học phí: {formatCurrency(enrollment.class?.course?.tuitionFee || 0)}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span className={`badge-pill ${enrollment.tuitionStatus === 'PAID' ? 'badge-green' : 'badge-amber'}`}>
                    {enrollment.tuitionStatus === 'PAID' ? '✅ Đã thanh toán' : '⚠️ Chưa thanh toán'}
                  </span>
                  <span className={`badge-pill ${enrollment.status === 'ENROLLED' ? 'badge-blue' : 'badge-gray'}`}>
                    {enrollment.status === 'ENROLLED' ? 'Đang học' : enrollment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Back Button */}
      <div style={{ marginTop: '1.5rem' }}>
        <button
          type="button"
          className="dash-quick-btn"
          onClick={() => window.location.href = '/student'}
        >
          ← Quay lại Dashboard
        </button>
      </div>
    </div>
  );
};

export default PaymentsPage;
