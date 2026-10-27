import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { PaymentReceiptData } from '../types';

interface PaymentReceiptModalProps {
  receipt: PaymentReceiptData | null;
  onClose: () => void;
}

/**
 * Biên lai thu học phí điện tử.
 *
 * Tách riêng khỏi trang thanh toán để dùng chung được ở nhiều nơi
 * (trang Học phí, tab Lịch sử giao dịch) mà không nhân bản code.
 */
export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  receipt,
  onClose,
}) => {
  const { user } = useAuth();

  if (!receipt) return null;

  const formatCurrency = (val?: number) =>
    val === undefined || val === null ? '0 đ' : `${val.toLocaleString('vi-VN')} đ`;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const student = receipt.payment.student;
  const studentName = typeof student === 'object' && student ? student.fullName : user?.fullName;
  const studentEmail = typeof student === 'object' && student ? student.email : user?.email;

  return (
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
      onClick={onClose}
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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            borderBottom: '2px solid #e2e8f0',
            paddingBottom: '1.25rem',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '1.4rem',
                fontWeight: 800,
                color: '#1e3a8a',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <span>🇬🇧</span>
              <span>{receipt.center?.name || 'EduCenter IELTS Academy'}</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
              Địa chỉ: {receipt.center?.address}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Hotline: <strong>{receipt.center?.hotline}</strong> • Email: {receipt.center?.email}
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
              {receipt.payment.transactionCode}
            </div>
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', margin: '1.5rem 0' }}>
          <h2 style={{ margin: '0 0 0.25rem', color: '#0f172a', fontSize: '1.5rem', fontWeight: 800 }}>
            BIÊN LAI THU HỌC PHÍ ĐIỆN TỬ
          </h2>
          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Ngày lập: {formatDate(receipt.payment.paymentDate || receipt.payment.createdAt)}
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
            <strong style={{ color: '#0f172a' }}>{studentName}</strong>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>Email: </span>
            <span>{studentEmail}</span>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>Khóa học: </span>
            <strong>{receipt.payment.course?.title}</strong>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>Mã khóa: </span>
            <span>{receipt.payment.course?.code}</span>
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
              <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #e2e8f0' }}>
                Nội dung thu
              </th>
              <th
                style={{
                  padding: '0.75rem',
                  textAlign: 'center',
                  border: '1px solid #e2e8f0',
                  width: '90px',
                }}
              >
                Số lượng
              </th>
              <th
                style={{
                  padding: '0.75rem',
                  textAlign: 'right',
                  border: '1px solid #e2e8f0',
                  width: '150px',
                }}
              >
                Thành tiền
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '0.75rem', border: '1px solid #e2e8f0' }}>
                <strong>Học phí {receipt.payment.course?.title}</strong>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Phương thức: {receipt.payment.method} •{' '}
                  {receipt.payment.note || 'Thanh toán trực tuyến'}
                </div>
              </td>
              <td
                style={{
                  padding: '0.75rem',
                  textAlign: 'center',
                  border: '1px solid #e2e8f0',
                }}
              >
                1
              </td>
              <td
                style={{
                  padding: '0.75rem',
                  textAlign: 'right',
                  border: '1px solid #e2e8f0',
                  fontWeight: 700,
                }}
              >
                {formatCurrency(receipt.payment.amount)}
              </td>
            </tr>
            <tr style={{ backgroundColor: '#fafaf9', fontWeight: 800 }}>
              <td
                colSpan={2}
                style={{
                  padding: '0.85rem',
                  textAlign: 'right',
                  border: '1px solid #e2e8f0',
                }}
              >
                TỔNG CỘNG ĐÃ THANH TOÁN:
              </td>
              <td
                style={{
                  padding: '0.85rem',
                  textAlign: 'right',
                  border: '1px solid #e2e8f0',
                  color: '#059669',
                  fontSize: '1.15rem',
                }}
              >
                {formatCurrency(receipt.payment.amount)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Note & Signature */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginTop: '2rem',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#64748b', maxWidth: '320px' }}>
            <p style={{ margin: '0 0 0.25rem' }}>
              • Biên lai này có giá trị xác nhận học viên đã hoàn thành nghĩa vụ học phí cho khóa
              học.
            </p>
            <p style={{ margin: 0 }}>
              • Mọi thắc mắc xin liên hệ Phòng Tài chính - Kế toán: 1900 6868.
            </p>
          </div>

          <div style={{ textAlign: 'center', minWidth: '180px' }}>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Đại diện EduCenter</div>
            <div
              style={{
                fontSize: '0.75rem',
                color: '#94a3b8',
                fontStyle: 'italic',
                marginBottom: '2.5rem',
              }}
            >
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
          <button type="button" className="dash-quick-btn" onClick={onClose}>
            Đóng
          </button>
          <button
            type="button"
            className="dash-quick-btn primary"
            onClick={() => window.print()}
          >
            <span>🖨️</span>
            <span>In Biên Lai / Xuất PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentReceiptModal;
