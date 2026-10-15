import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface ChangeRequest {
  id: string;
  type: 'CLASS_CHANGE' | 'SCHEDULE_CHANGE';
  currentClassCode?: string;
  targetClassCode?: string;
  currentScheduleInfo?: string;
  targetScheduleInfo?: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNote?: string;
  processedAt?: string;
  createdAt: string;
}

const RequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [newRequest, setNewRequest] = useState({
    type: 'CLASS_CHANGE' as 'CLASS_CHANGE' | 'SCHEDULE_CHANGE',
    currentClass: 'WEB-K24-A',
    targetClass: 'WEB-K24-B',
    reason: '',
  });

  useEffect(() => {
    // Mock data - sẽ thay bằng API: GET /api/student/requests
    setTimeout(() => {
      const mockRequests: ChangeRequest[] = [
        {
          id: 'req1',
          type: 'CLASS_CHANGE',
          currentClassCode: 'WEB-K24-A',
          targetClassCode: 'WEB-K24-B',
          reason: 'Lịch học lớp A bị trùng với công việc part-time, xin được chuyển sang lớp B (Thứ 3, 5, 7).',
          status: 'PENDING',
          createdAt: '14/10/2026 10:30',
        },
        {
          id: 'req2',
          type: 'SCHEDULE_CHANGE',
          currentScheduleInfo: 'Thứ 2, 4, 6 - 18:30',
          targetScheduleInfo: 'Thứ 3, 5, 7 - 19:00',
          reason: 'Xin chuyển sang ca học tối cuối tuần vì có việc gia đình vào tối thứ 2 và 4.',
          status: 'APPROVED',
          adminNote: 'Đã duyệt. Lớp B còn chỗ trống. Áp dụng từ tuần sau.',
          processedAt: '12/10/2026 14:00',
          createdAt: '10/10/2026 09:15',
        },
        {
          id: 'req3',
          type: 'CLASS_CHANGE',
          currentClassCode: 'REACT-K23-A',
          targetClassCode: 'REACT-K23-B',
          reason: 'Muốn học cùng lớp với bạn để dễ thảo luận nhóm.',
          status: 'REJECTED',
          adminNote: 'Lớp B đã đầy chỗ. Vui lòng chờ đợt khai giảng tiếp theo.',
          processedAt: '05/10/2026 16:30',
          createdAt: '03/10/2026 11:20',
        },
      ];
      setRequests(mockRequests);
      setLoading(false);
    }, 500);
  }, []);

  const handleSubmitRequest = () => {
    if (!newRequest.reason.trim()) {
      alert('Vui lòng nhập lý do!');
      return;
    }
    const newReq: ChangeRequest = {
      id: `req${Date.now()}`,
      type: newRequest.type,
      currentClassCode: newRequest.type === 'CLASS_CHANGE' ? newRequest.currentClass : undefined,
      targetClassCode: newRequest.type === 'CLASS_CHANGE' ? newRequest.targetClass : undefined,
      reason: newRequest.reason,
      status: 'PENDING',
      createdAt: new Date().toLocaleString('vi-VN'),
    };
    setRequests((prev) => [newReq, ...prev]);
    setShowNewRequestModal(false);
    setNewRequest({ type: 'CLASS_CHANGE', currentClass: 'WEB-K24-A', targetClass: 'WEB-K24-B', reason: '' });
    alert('Đã gửi yêu cầu thành công! Vui lòng chờ Training Staff duyệt.');
  };

  if (loading) {
    return (
      <div className="dash-container">
        <div className="dash-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Đang tải danh sách yêu cầu...</p>
        </div>
      </div>
    );
  }

  const filtered = requests.filter((r) => filter === 'ALL' || r.status === filter);

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === 'PENDING').length,
    approved: requests.filter((r) => r.status === 'APPROVED').length,
    rejected: requests.filter((r) => r.status === 'REJECTED').length,
  };

  return (
    <div className="dash-container">
      {/* ── Banner ── */}
      <div className="dash-banner">
        <div className="dash-banner-content">
          <div className="dash-banner-badge">📋 Yêu Cầu Thay Đổi • EduCenter Portal</div>
          <h1>Yêu cầu của bạn</h1>
          <p>Gửi yêu cầu đổi lớp, đổi lịch học và theo dõi trạng thái xử lý.</p>
        </div>
        <div className="dash-banner-right">
          <button
            type="button"
            onClick={() => setShowNewRequestModal(true)}
            className="dash-quick-btn primary"
            style={{ padding: '0.6rem 1.2rem' }}
          >
            ➕ Tạo yêu cầu mới
          </button>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="dash-metrics-grid">
        <div className="dash-metric-card">
          <div className="dash-metric-info">
            <span className="dash-metric-label">Tổng yêu cầu</span>
            <span className="dash-metric-val">{stats.total} yêu cầu</span>
            <span className="dash-metric-trend up">Đã gửi</span>
          </div>
          <div className="dash-metric-icon icon-blue">📋</div>
        </div>
        <div className="dash-metric-card">
          <div className="dash-metric-info">
            <span className="dash-metric-label">Đang xử lý</span>
            <span className="dash-metric-val">{stats.pending} yêu cầu</span>
            <span className="dash-metric-trend neutral">⏳ Chờ duyệt</span>
          </div>
          <div className="dash-metric-icon icon-amber">⏳</div>
        </div>
        <div className="dash-metric-card">
          <div className="dash-metric-info">
            <span className="dash-metric-label">Đã duyệt</span>
            <span className="dash-metric-val">{stats.approved} yêu cầu</span>
            <span className="dash-metric-trend up">✅ Thành công</span>
          </div>
          <div className="dash-metric-icon icon-emerald">✅</div>
        </div>
        <div className="dash-metric-card">
          <div className="dash-metric-info">
            <span className="dash-metric-label">Bị từ chối</span>
            <span className="dash-metric-val">{stats.rejected} yêu cầu</span>
            <span className="dash-metric-trend down">❌ Không duyệt</span>
          </div>
          <div className="dash-metric-icon icon-purple">❌</div>
        </div>
      </div>

      {/* ── Filter + List ── */}
      <div className="dash-card">
        <div className="dash-card-header">
          <h2 className="dash-card-title">
            <span>📑</span> Danh Sách Yêu Cầu
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`dash-quick-btn ${filter === f ? 'primary' : ''}`}
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
              >
                {f === 'ALL' ? 'Tất cả' : f === 'PENDING' ? 'Chờ duyệt' : f === 'APPROVED' ? 'Đã duyệt' : 'Bị từ chối'}
              </button>
            ))}
          </div>
        </div>

        <div className="dash-item-list">
          {filtered.length === 0 ? (
            <div className="dash-subcard" style={{ textAlign: 'center', padding: '2rem' }}>
              <p style={{ opacity: 0.6, margin: 0 }}>Chưa có yêu cầu nào trong mục này.</p>
            </div>
          ) : (
            filtered.map((r) => (
              <div key={r.id} className="dash-subcard">
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <h3 className="dash-subcard-title" style={{ margin: 0 }}>
                        {r.type === 'CLASS_CHANGE' ? '🔄 Yêu cầu đổi lớp' : '📅 Yêu cầu đổi lịch học'}
                      </h3>
                      {r.status === 'PENDING' && (
                        <span className="badge-pill badge-amber">⏳ Chờ duyệt</span>
                      )}
                      {r.status === 'APPROVED' && (
                        <span className="badge-pill badge-green">✅ Đã duyệt</span>
                      )}
                      {r.status === 'REJECTED' && (
                        <span
                          className="badge-pill"
                          style={{ background: '#ef4444', color: 'white' }}
                        >
                          ❌ Từ chối
                        </span>
                      )}
                    </div>
                    {r.type === 'CLASS_CHANGE' ? (
                      <div className="dash-subcard-meta" style={{ marginTop: '0.4rem' }}>
                        Từ lớp: <strong>{r.currentClassCode}</strong> → Sang lớp:{' '}
                        <strong style={{ color: '#6366f1' }}>{r.targetClassCode}</strong>
                      </div>
                    ) : (
                      <div className="dash-subcard-meta" style={{ marginTop: '0.4rem' }}>
                        Từ: <strong>{r.currentScheduleInfo}</strong> → Sang:{' '}
                        <strong style={{ color: '#6366f1' }}>{r.targetScheduleInfo}</strong>
                      </div>
                    )}
                    <div
                      className="dash-subcard"
                      style={{
                        marginTop: '0.5rem',
                        background: 'rgba(99, 102, 241, 0.05)',
                        padding: '0.5rem 0.75rem',
                      }}
                    >
                      <strong style={{ fontSize: '0.8rem' }}>📝 Lý do:</strong>
                      <p style={{ fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>{r.reason}</p>
                    </div>
                    {r.adminNote && (
                      <div
                        className="dash-subcard"
                        style={{
                          marginTop: '0.5rem',
                          background:
                            r.status === 'APPROVED'
                              ? 'rgba(16, 185, 129, 0.08)'
                              : 'rgba(239, 68, 68, 0.08)',
                          borderLeft: `3px solid ${r.status === 'APPROVED' ? '#10b981' : '#ef4444'}`,
                          padding: '0.5rem 0.75rem',
                        }}
                      >
                        <strong
                          style={{
                            fontSize: '0.8rem',
                            color: r.status === 'APPROVED' ? '#10b981' : '#ef4444',
                          }}
                        >
                          💬 Phản hồi từ Training Staff:
                        </strong>
                        <p style={{ fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>{r.adminNote}</p>
                      </div>
                    )}
                    <div className="dash-subcard-meta" style={{ marginTop: '0.5rem' }}>
                      📅 Gửi: {r.createdAt}
                      {r.processedAt && ` • ✅ Xử lý: ${r.processedAt}`}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── New Request Modal ── */}
      {showNewRequestModal && (
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
          onClick={() => setShowNewRequestModal(false)}
        >
          <div
            className="dash-card"
            style={{ maxWidth: '500px', width: '90%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 1rem 0' }}>➕ Tạo yêu cầu mới</h3>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                Loại yêu cầu:
              </label>
              <select
                value={newRequest.type}
                onChange={(e) =>
                  setNewRequest({ ...newRequest, type: e.target.value as 'CLASS_CHANGE' | 'SCHEDULE_CHANGE' })
                }
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                }}
              >
                <option value="CLASS_CHANGE">🔄 Đổi lớp học</option>
                <option value="SCHEDULE_CHANGE">📅 Đổi lịch học</option>
              </select>
            </div>

            {newRequest.type === 'CLASS_CHANGE' && (
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                    Lớp hiện tại:
                  </label>
                  <select
                    value={newRequest.currentClass}
                    onChange={(e) => setNewRequest({ ...newRequest, currentClass: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                    }}
                  >
                    <option value="WEB-K24-A">WEB-K24-A (MERN Full-Stack)</option>
                    <option value="REACT-K23-B">REACT-K23-B (ReactJS Nâng Cao)</option>
                  </select>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                    Lớp muốn chuyển sang:
                  </label>
                  <select
                    value={newRequest.targetClass}
                    onChange={(e) => setNewRequest({ ...newRequest, targetClass: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                    }}
                  >
                    <option value="WEB-K24-B">WEB-K24-B (MERN Full-Stack - T2,4,6)</option>
                    <option value="WEB-K24-C">WEB-K24-C (MERN Full-Stack - T3,5,7)</option>
                    <option value="REACT-K23-A">REACT-K23-A (ReactJS Cơ bản)</option>
                  </select>
                </div>
              </>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                Lý do chi tiết: <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                value={newRequest.reason}
                onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
                placeholder="Vui lòng mô tả chi tiết lý do bạn muốn đổi lớp/lịch..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  resize: 'vertical',
                }}
              />
            </div>

            <div
              style={{
                background: 'rgba(245, 158, 11, 0.1)',
                borderLeft: '3px solid #f59e0b',
                padding: '0.75rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                marginBottom: '1rem',
              }}
            >
              ⚠️ <strong>Lưu ý:</strong> Yêu cầu sẽ được Training Staff xem xét trong 24-48h làm việc.
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowNewRequestModal(false)}
                className="dash-quick-btn"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSubmitRequest}
                className="dash-quick-btn primary"
              >
                📤 Gửi yêu cầu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestsPage;
