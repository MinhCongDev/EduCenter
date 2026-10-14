import React, { useState, useEffect } from 'react';
import { studentService } from '../../services/student.service';
import type { ChangeRequest, MyClass, ClassSchedule } from '../../types';

const RequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [myClasses, setMyClasses] = useState<MyClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showClassForm, setShowClassForm] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [selectedCurrentClass, setSelectedCurrentClass] = useState('');
  const [selectedTargetClass, setSelectedTargetClass] = useState('');
  const [selectedCurrentSchedule, setSelectedCurrentSchedule] = useState('');
  const [selectedTargetSchedule, setSelectedTargetSchedule] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch requests
      const requestsRes = await studentService.getMyRequests();
      if (requestsRes.success && requestsRes.data) {
        setRequests(requestsRes.data.requests);
      }

      // Fetch my classes
      const classesRes = await studentService.getMyClasses();
      if (classesRes.success && classesRes.data) {
        setMyClasses(classesRes.data.classes);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClassChangeRequest = async () => {
    if (!selectedCurrentClass || !selectedTargetClass || !reason) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (selectedCurrentClass === selectedTargetClass) {
      alert('Lớp hiện tại và lớp muốn chuyển không được trùng nhau');
      return;
    }

    try {
      setSubmitting(true);
      const res = await studentService.requestClassChange({
        currentClassId: selectedCurrentClass,
        targetClassId: selectedTargetClass,
        reason
      });

      if (res.success) {
        alert('Gửi yêu cầu đổi lớp thành công!');
        setShowClassForm(false);
        resetForm();
        fetchData();
      } else {
        alert(res.message || 'Gửi yêu cầu thất bại');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi gửi yêu cầu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleScheduleChangeRequest = async () => {
    if (!selectedCurrentSchedule || !selectedTargetSchedule || !reason) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      setSubmitting(true);
      const res = await studentService.requestScheduleChange({
        currentScheduleId: selectedCurrentSchedule,
        targetScheduleId: selectedTargetSchedule,
        reason
      });

      if (res.success) {
        alert('Gửi yêu cầu đổi lịch học thành công!');
        setShowScheduleForm(false);
        resetForm();
        fetchData();
      } else {
        alert(res.message || 'Gửi yêu cầu thất bại');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi gửi yêu cầu');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedCurrentClass('');
    setSelectedTargetClass('');
    setSelectedCurrentSchedule('');
    setSelectedTargetSchedule('');
    setReason('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { class: 'badge-amber', text: '⏳ Đang chờ' };
      case 'APPROVED':
        return { class: 'badge-green', text: '✅ Đã duyệt' };
      case 'REJECTED':
        return { class: 'badge-red', text: '❌ Từ chối' };
      default:
        return { class: 'badge-gray', text: status };
    }
  };

  const getTypeLabel = (type: string) => {
    return type === 'CLASS_CHANGE' ? '🔄 Đổi lớp' : '📅 Đổi lịch học';
  };

  if (isLoading) {
    return (
      <div className="dash-container" style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p>Đang tải thông tin...</p>
      </div>
    );
  }

  return (
    <div className="dash-container">
      {/* Header */}
      <div className="dash-banner" style={{ marginBottom: '1.5rem' }}>
        <div className="dash-banner-content">
          <div className="dash-banner-badge">🔄 Yêu Cầu Thay Đổi</div>
          <h1>Quản Lý Yêu Cầu</h1>
          <p>Gửi yêu cầu đổi lớp, đổi lịch học và theo dõi trạng thái</p>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: '#fee2e2', borderRadius: '8px', marginBottom: '1rem', color: '#dc2626' }}>
          ❌ {error}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="dash-quick-btn primary"
          onClick={() => {
            setShowClassForm(!showClassForm);
            setShowScheduleForm(false);
          }}
        >
          🔄 Yêu Cầu Đổi Lớp
        </button>
        <button
          type="button"
          className="dash-quick-btn"
          onClick={() => {
            setShowScheduleForm(!showScheduleForm);
            setShowClassForm(false);
          }}
        >
          📅 Yêu Cầu Đổi Lịch Học
        </button>
      </div>

      {/* Class Change Form */}
      {showClassForm && (
        <div className="dash-card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid #6366f1' }}>
          <div className="dash-card-header">
            <h2 className="dash-card-title">
              <span>🔄</span> Yêu Cầu Đổi Lớp
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 0' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Lớp hiện tại:</label>
              <select
                value={selectedCurrentClass}
                onChange={(e) => setSelectedCurrentClass(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
              >
                <option value="">-- Chọn lớp --</option>
                {myClasses.map(c => (
                  <option key={c.class._id} value={c.class._id}>
                    {c.class.classCode} - {c.class.course?.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Lớp muốn chuyển đến:</label>
              <input
                type="text"
                placeholder="Nhập mã lớp muốn chuyển đến"
                value={selectedTargetClass}
                onChange={(e) => setSelectedTargetClass(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Lý do:</label>
              <textarea
                placeholder="Nhập lý do yêu cầu đổi lớp..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="dash-quick-btn primary"
                onClick={handleClassChangeRequest}
                disabled={submitting}
              >
                {submitting ? '⏳ Đang gửi...' : '📤 Gửi Yêu Cầu'}
              </button>
              <button
                type="button"
                className="dash-quick-btn"
                onClick={() => {
                  setShowClassForm(false);
                  resetForm();
                }}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Change Form */}
      {showScheduleForm && (
        <div className="dash-card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid #06b6d4' }}>
          <div className="dash-card-header">
            <h2 className="dash-card-title">
              <span>📅</span> Yêu Cầu Đổi Lịch Học
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 0' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Lịch học hiện tại:</label>
              <select
                value={selectedCurrentSchedule}
                onChange={(e) => setSelectedCurrentSchedule(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
              >
                <option value="">-- Chọn lịch học --</option>
                {myClasses.map(c => (
                  <option key={c.class._id} value={c.class._id}>
                    {c.class.classCode} - {c.class.scheduleDays?.join(', ')} - {c.class.timeSlot}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Lịch học muốn chuyển đến:</label>
              <input
                type="text"
                placeholder="Nhập mã lịch học muốn chuyển đến"
                value={selectedTargetSchedule}
                onChange={(e) => setSelectedTargetSchedule(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Lý do:</label>
              <textarea
                placeholder="Nhập lý do yêu cầu đổi lịch học..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="dash-quick-btn primary"
                onClick={handleScheduleChangeRequest}
                disabled={submitting}
              >
                {submitting ? '⏳ Đang gửi...' : '📤 Gửi Yêu Cầu'}
              </button>
              <button
                type="button"
                className="dash-quick-btn"
                onClick={() => {
                  setShowScheduleForm(false);
                  resetForm();
                }}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Requests History */}
      <div className="dash-card">
        <div className="dash-card-header">
          <h2 className="dash-card-title">
            <span>📋</span> Lịch Sử Yêu Cầu
          </h2>
          <span className="badge-pill badge-purple">{requests.length} yêu cầu</span>
        </div>

        {requests.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', opacity: 0.7 }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
            <p>Bạn chưa gửi yêu cầu nào</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem 0' }}>
            {requests.map(request => {
              const status = getStatusBadge(request.status);
              return (
                <div key={request._id} style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px', borderLeft: `4px solid ${request.status === 'APPROVED' ? '#10b981' : request.status === 'REJECTED' ? '#ef4444' : '#f59e0b'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 600 }}>{getTypeLabel(request.type)}</span>
                        <span className={`badge-pill ${status.class}`}>{status.text}</span>
                      </div>
                      
                      <div style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.5rem' }}>
                        {request.type === 'CLASS_CHANGE' ? (
                          <>
                            Từ: {request.currentClass?.classCode || 'N/A'} 
                            → Đến: {request.targetClass?.classCode || request.targetClass || 'N/A'}
                          </>
                        ) : (
                          <>
                            Từ lịch: {request.currentSchedule?.dayOfWeek} {request.currentSchedule?.startTime}
                            → Đến: {request.targetSchedule?.dayOfWeek} {request.targetSchedule?.startTime}
                          </>
                        )}
                      </div>

                      <div style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                        <strong>Lý do:</strong> {request.reason}
                      </div>

                      {request.adminNote && (
                        <div style={{ fontSize: '0.85rem', padding: '0.5rem', background: '#e0e7ff', borderRadius: '4px', marginTop: '0.5rem' }}>
                          <strong>💬 Phản hồi từ Admin:</strong> {request.adminNote}
                        </div>
                      )}

                      <div style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '0.5rem' }}>
                        Gửi lúc: {new Date(request.createdAt).toLocaleString('vi-VN')}
                        {request.processedAt && ` • Xử lý: ${new Date(request.processedAt).toLocaleString('vi-VN')}`}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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

export default RequestsPage;
