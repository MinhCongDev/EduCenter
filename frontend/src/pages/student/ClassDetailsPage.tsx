import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

interface ClassDetails {
  id: string;
  classCode: string;
  courseName: string;
  courseCode: string;
  description: string;
  teacherName: string;
  teacherEmail: string;
  teacherPhone: string;
  room: string;
  scheduleDays: string[];
  timeSlot: string;
  startDate: string;
  endDate: string;
  totalSessions: number;
  completedSessions: number;
  tuitionFee: number;
  status: 'ACTIVE' | 'COMPLETED' | 'UPCOMING';
}

const ClassDetailsPage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - sẽ thay bằng API call: GET /api/student/classes/:classId
    setTimeout(() => {
      setClassDetails({
        id: classId || '1',
        classCode: 'WEB-K24-A',
        courseName: 'Lập trình Web Full-Stack MERN',
        courseCode: 'MERN101',
        description:
          'Khóa học toàn diện về phát triển web hiện đại với MongoDB, Express, React, Node.js. Học viên sẽ xây dựng được ứng dụng web full-stack hoàn chỉnh.',
        teacherName: 'ThS. Nguyễn Văn An',
        teacherEmail: 'annv@educenter.vn',
        teacherPhone: '0901 234 567',
        room: 'Phòng Lab 302',
        scheduleDays: ['Thứ 2', 'Thứ 4', 'Thứ 6'],
        timeSlot: '18:30 - 20:30',
        startDate: '01/09/2026',
        endDate: '30/11/2026',
        totalSessions: 36,
        completedSessions: 12,
        tuitionFee: 5000000,
        status: 'ACTIVE',
      });
      setLoading(false);
    }, 500);
  }, [classId]);

  if (loading) {
    return (
      <div className="dash-container">
        <div className="dash-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Đang tải thông tin lớp học...</p>
        </div>
      </div>
    );
  }

  if (!classDetails) {
    return (
      <div className="dash-container">
        <div className="dash-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Không tìm thấy thông tin lớp học.</p>
          <Link to="/student/classes" className="dash-quick-btn primary" style={{ marginTop: '1rem' }}>
            ← Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  const progress = Math.round((classDetails.completedSessions / classDetails.totalSessions) * 100);

  return (
    <div className="dash-container">
      {/* ── Banner ── */}
      <div className="dash-banner">
        <div className="dash-banner-content">
          <div className="dash-banner-badge">📋 Chi Tiết Lớp Học • EduCenter Portal</div>
          <h1>{classDetails.courseName}</h1>
          <p>{classDetails.description}</p>
        </div>
        <div className="dash-banner-right">
          <div className="dash-date-pill">
            <div>📚 Mã lớp: {classDetails.classCode}</div>
            <div className="sub">Mã khóa: {classDetails.courseCode}</div>
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="dash-actions-row">
        <Link
          to={`/student/classes/${classDetails.id}/schedule`}
          className="dash-quick-btn primary"
          style={{ textDecoration: 'none' }}
        >
          <span>📅</span>
          <span>Xem Lịch Học</span>
        </Link>
        <Link
          to={`/student/classes/${classDetails.id}/assignments`}
          className="dash-quick-btn"
          style={{ textDecoration: 'none' }}
        >
          <span>📝</span>
          <span>Bài Tập Về Nhà</span>
        </Link>
        <Link
          to={`/student/classes/${classDetails.id}/grades`}
          className="dash-quick-btn"
          style={{ textDecoration: 'none' }}
        >
          <span>🏆</span>
          <span>Xem Điểm</span>
        </Link>
        <Link
          to={`/student/classes/${classDetails.id}/attendance`}
          className="dash-quick-btn"
          style={{ textDecoration: 'none' }}
        >
          <span>✅</span>
          <span>Điểm Danh</span>
        </Link>
      </div>

      {/* ── Main Info Grid ── */}
      <div className="dash-two-col">
        {/* Left: Course Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="dash-card">
            <div className="dash-card-header">
              <h2 className="dash-card-title">
                <span>📖</span> Thông Tin Khóa Học
              </h2>
            </div>
            <div className="dash-subcard">
              <div className="dash-subcard-meta">
                <strong>Tên khóa học:</strong> {classDetails.courseName}
              </div>
              <div className="dash-subcard-meta">
                <strong>Mã khóa học:</strong> {classDetails.courseCode}
              </div>
              <div className="dash-subcard-meta">
                <strong>Mã lớp:</strong> {classDetails.classCode}
              </div>
              <div className="dash-subcard-meta">
                <strong>Học phí:</strong>{' '}
                <span style={{ color: '#10b981', fontWeight: 700 }}>
                  {classDetails.tuitionFee.toLocaleString('vi-VN')} đ
                </span>
              </div>
              <div className="dash-subcard-meta">
                <strong>Trạng thái:</strong>{' '}
                <span
                  className={`badge-pill ${
                    classDetails.status === 'ACTIVE'
                      ? 'badge-green'
                      : classDetails.status === 'COMPLETED'
                        ? 'badge-blue'
                        : 'badge-amber'
                  }`}
                >
                  {classDetails.status === 'ACTIVE'
                    ? '🟢 Đang học'
                    : classDetails.status === 'COMPLETED'
                      ? '✅ Hoàn thành'
                      : '⏳ Sắp khai giảng'}
                </span>
              </div>
            </div>
          </div>

          <div className="dash-card">
            <div className="dash-card-header">
              <h2 className="dash-card-title">
                <span>📊</span> Tiến Độ Học Tập
              </h2>
              <span className="badge-pill badge-purple">{progress}%</span>
            </div>
            <div className="dash-subcard">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem',
                }}
              >
                <span style={{ fontWeight: 600 }}>Buổi học đã hoàn thành</span>
                <span style={{ fontWeight: 700, color: '#6366f1' }}>
                  {classDetails.completedSessions} / {classDetails.totalSessions} buổi
                </span>
              </div>
              <div className="dash-progress" style={{ height: '12px' }}>
                <div className="dash-progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <p
                style={{
                  marginTop: '0.75rem',
                  fontSize: '0.85rem',
                  opacity: 0.7,
                  margin: '0.75rem 0 0 0',
                }}
              >
                🎯 Còn <strong>{classDetails.totalSessions - classDetails.completedSessions} buổi</strong>{' '}
                nữa là hoàn thành khóa học.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Teacher + Schedule */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="dash-card">
            <div className="dash-card-header">
              <h2 className="dash-card-title">
                <span>👨‍🏫</span> Giảng Viên
              </h2>
            </div>
            <div className="dash-subcard">
              <h3 className="dash-subcard-title" style={{ margin: 0 }}>
                {classDetails.teacherName}
              </h3>
              <div className="dash-subcard-meta" style={{ marginTop: '0.4rem' }}>
                📧 Email: <a href={`mailto:${classDetails.teacherEmail}`}>{classDetails.teacherEmail}</a>
              </div>
              <div className="dash-subcard-meta">
                📞 Điện thoại: <a href={`tel:${classDetails.teacherPhone}`}>{classDetails.teacherPhone}</a>
              </div>
              <button
                type="button"
                onClick={() => alert('Mở form gửi tin nhắn cho giảng viên')}
                className="dash-quick-btn primary"
                style={{ marginTop: '0.75rem', width: '100%' }}
              >
                💬 Gửi Tin Nhắn
              </button>
            </div>
          </div>

          <div className="dash-card">
            <div className="dash-card-header">
              <h2 className="dash-card-title">
                <span>📅</span> Lịch Học Hàng Tuần
              </h2>
            </div>
            <div className="dash-subcard">
              <div className="dash-subcard-meta">
                <strong>📍 Phòng học:</strong> {classDetails.room}
              </div>
              <div className="dash-subcard-meta">
                <strong>📅 Thứ:</strong> {classDetails.scheduleDays.join(', ')}
              </div>
              <div className="dash-subcard-meta">
                <strong>⏰ Giờ học:</strong> {classDetails.timeSlot}
              </div>
              <div className="dash-subcard-meta">
                <strong>🗓️ Khai giảng:</strong> {classDetails.startDate}
              </div>
              <div className="dash-subcard-meta">
                <strong>🏁 Kết thúc:</strong> {classDetails.endDate}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassDetailsPage;
