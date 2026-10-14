import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { studentService } from '../../services/student.service';
import type { Class, User } from '../../types';

const ClassDetailsPage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const [classData, setClassData] = useState<Class | null>(null);
  const [teacher, setTeacher] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (classId) {
      fetchClassData();
    }
  }, [classId]);

  const fetchClassData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch class details
      const detailsRes = await studentService.getClassDetails(classId!);
      if (detailsRes.success && detailsRes.data) {
        setClassData(detailsRes.data.class as any);
      }

      // Fetch teacher info
      const teacherRes = await studentService.getClassTeachers(classId!);
      if (teacherRes.success && teacherRes.data) {
        setTeacher(teacherRes.data.teacher as any);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="dash-container" style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p>Đang tải thông tin lớp học...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dash-container" style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>❌</div>
        <p style={{ color: '#dc2626' }}>{error}</p>
        <button className="dash-quick-btn" onClick={() => window.history.back()}>
          ← Quay lại
        </button>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="dash-container" style={{ textAlign: 'center', padding: '3rem' }}>
        <p>Không tìm thấy thông tin lớp học</p>
      </div>
    );
  }

  return (
    <div className="dash-container">
      {/* Header */}
      <div className="dash-banner" style={{ marginBottom: '1.5rem' }}>
        <div className="dash-banner-content">
          <div className="dash-banner-badge">📚 Thông Tin Lớp Học</div>
          <h1>{classData.course?.title || 'Lớp học'}</h1>
          <p>Mã lớp: <strong>{classData.classCode}</strong></p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {/* Class Info Card */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h2 className="dash-card-title">
              <span>📋</span> Thông Tin Lớp
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f9fafb', borderRadius: '8px' }}>
              <span style={{ fontWeight: 600 }}>Mã lớp</span>
              <span>{classData.classCode}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f9fafb', borderRadius: '8px' }}>
              <span style={{ fontWeight: 600 }}>Khóa học</span>
              <span>{classData.course?.title}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f9fafb', borderRadius: '8px' }}>
              <span style={{ fontWeight: 600 }}>Phòng học</span>
              <span>{classData.room}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f9fafb', borderRadius: '8px' }}>
              <span style={{ fontWeight: 600 }}>Lịch học</span>
              <span>{classData.scheduleDays?.join(', ')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f9fafb', borderRadius: '8px' }}>
              <span style={{ fontWeight: 600 }}>Giờ học</span>
              <span>{classData.timeSlot}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f9fafb', borderRadius: '8px' }}>
              <span style={{ fontWeight: 600 }}>Ngày bắt đầu</span>
              <span>{new Date(classData.startDate).toLocaleDateString('vi-VN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f9fafb', borderRadius: '8px' }}>
              <span style={{ fontWeight: 600 }}>Ngày kết thúc</span>
              <span>{new Date(classData.endDate).toLocaleDateString('vi-VN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f9fafb', borderRadius: '8px' }}>
              <span style={{ fontWeight: 600 }}>Sĩ số</span>
              <span>{classData.capacity} học viên</span>
            </div>
          </div>
        </div>

        {/* Teacher Info Card */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h2 className="dash-card-title">
              <span>👨‍🏫</span> Giảng Viên
            </h2>
          </div>

          {teacher ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#f0fdf4', borderRadius: '12px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.5rem', fontWeight: 700 }}>
                  {teacher.fullName?.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{teacher.fullName}</div>
                  <div style={{ opacity: 0.7, fontSize: '0.85rem' }}>Giảng viên</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>📧</span>
                  <span>{teacher.email}</span>
                </div>
                {teacher.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>📱</span>
                    <span>{teacher.phone}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.7 }}>
              Chưa có thông tin giảng viên
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="dash-quick-btn primary"
          onClick={() => window.location.href = `/student/classes/${classId}/schedule`}
        >
          📅 Xem Lịch Học
        </button>
        <button
          type="button"
          className="dash-quick-btn"
          onClick={() => window.location.href = `/student/classes/${classId}/assignments`}
        >
          📝 Xem Bài Tập
        </button>
        <button
          type="button"
          className="dash-quick-btn"
          onClick={() => window.location.href = `/student/classes/${classId}/grades`}
        >
          📊 Xem Điểm
        </button>
        <button
          type="button"
          className="dash-quick-btn"
          onClick={() => window.location.href = `/student/classes/${classId}/attendance`}
        >
          ✅ Xem Điểm Danh
        </button>
      </div>
    </div>
  );
};

export default ClassDetailsPage;
