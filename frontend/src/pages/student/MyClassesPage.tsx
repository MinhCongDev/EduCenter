import React, { useState, useEffect } from 'react';
import { studentService } from '../../services/student.service';
import type { MyClass } from '../../types';

const MyClassesPage: React.FC = () => {
  const [classes, setClasses] = useState<MyClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setIsLoading(true);
      const res = await studentService.getMyClasses();
      if (res.success && res.data) {
        setClasses(res.data.classes);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ENROLLED':
        return 'badge-blue';
      case 'COMPLETED':
        return 'badge-green';
      case 'DROPPED':
        return 'badge-red';
      default:
        return 'badge-gray';
    }
  };

  const getTuitionBadge = (status: string) => {
    return status === 'PAID' ? 'badge-green' : 'badge-amber';
  };

  if (isLoading) {
    return (
      <div className="dash-container" style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p>Đang tải danh sách lớp...</p>
      </div>
    );
  }

  return (
    <div className="dash-container">
      {/* Header */}
      <div className="dash-banner" style={{ marginBottom: '1.5rem' }}>
        <div className="dash-banner-content">
          <div className="dash-banner-badge">📚 Danh Sách Lớp Học</div>
          <h1>Các Lớp Của Tôi</h1>
          <p>Bạn đang theo học {classes.length} lớp học tại EduCenter</p>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: '#fee2e2', borderRadius: '8px', marginBottom: '1rem', color: '#dc2626' }}>
          ❌ {error}
        </div>
      )}

      {/* Classes Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {classes.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', background: '#f9fafb', borderRadius: '12px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
            <h3>Chưa có lớp học nào</h3>
            <p style={{ opacity: 0.7 }}>Bạn chưa đăng ký lớp học nào. Hãy liên hệ trung tâm để được hỗ trợ.</p>
          </div>
        ) : (
          classes.map((item) => (
            <div key={item.enrollmentId} className="dash-card">
              <div className="dash-card-header">
                <h2 className="dash-card-title">
                  <span>📚</span> {item.class.course?.title || 'Khóa học'}
                </h2>
                <span className={`badge-pill ${getStatusBadge(item.enrollmentStatus)}`}>
                  {item.enrollmentStatus === 'ENROLLED' ? 'Đang học' : item.enrollmentStatus}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 600, minWidth: '100px' }}>Mã lớp:</span>
                  <span>{item.class.classCode}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 600, minWidth: '100px' }}>Giảng viên:</span>
                  <span>{item.class.teacher?.fullName || 'Chưa có'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 600, minWidth: '100px' }}>Lịch học:</span>
                  <span>{item.class.scheduleDays?.join(', ') || 'Chưa cập nhật'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 600, minWidth: '100px' }}>Giờ học:</span>
                  <span>{item.class.timeSlot || 'Chưa cập nhật'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 600, minWidth: '100px' }}>Phòng học:</span>
                  <span>{item.class.room || 'Chưa xếp'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 600, minWidth: '100px' }}>Học phí:</span>
                  <span className={`badge-pill ${getTuitionBadge(item.tuitionStatus)}`}>
                    {item.tuitionStatus === 'PAID' ? '✅ Đã thanh toán' : '⚠️ Chưa thanh toán'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                <button
                  type="button"
                  className="dash-quick-btn primary"
                  onClick={() => window.location.href = `/student/classes/${item.class._id}`}
                >
                  📋 Chi tiết
                </button>
                <button
                  type="button"
                  className="dash-quick-btn"
                  onClick={() => window.location.href = `/student/classes/${item.class._id}/schedule`}
                >
                  📅 Lịch học
                </button>
                <button
                  type="button"
                  className="dash-quick-btn"
                  onClick={() => window.location.href = `/student/classes/${item.class._id}/assignments`}
                >
                  📝 Bài tập
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyClassesPage;
