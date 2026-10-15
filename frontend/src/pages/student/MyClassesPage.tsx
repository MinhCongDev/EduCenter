import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface EnrolledClass {
  id: string;
  classCode: string;
  courseName: string;
  courseCode: string;
  teacherName: string;
  room: string;
  scheduleDays: string[];
  timeSlot: string;
  startDate: string;
  endDate: string;
  progress: number;
  status: 'ACTIVE' | 'COMPLETED' | 'UPCOMING';
  tuitionStatus: 'PAID' | 'PENDING';
}

const MyClassesPage: React.FC = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');

  // Mock data - sẽ thay bằng API call
  const [classes] = useState<EnrolledClass[]>([
    {
      id: '1',
      classCode: 'WEB-K24-A',
      courseName: 'Lập trình Web Full-Stack MERN',
      courseCode: 'MERN101',
      teacherName: 'ThS. Nguyễn Văn An',
      room: 'Phòng Lab 302',
      scheduleDays: ['Thứ 2', 'Thứ 4', 'Thứ 6'],
      timeSlot: '18:30 - 20:30',
      startDate: '01/09/2026',
      endDate: '30/11/2026',
      progress: 33,
      status: 'ACTIVE',
      tuitionStatus: 'PAID',
    },
    {
      id: '2',
      classCode: 'REACT-K23-B',
      courseName: 'ReactJS Nâng Cao & State Management',
      courseCode: 'REACT201',
      teacherName: 'TS. Trần Thị Bình',
      room: 'Phòng Lab 205',
      scheduleDays: ['Thứ 3', 'Thứ 5'],
      timeSlot: '19:00 - 21:00',
      startDate: '15/05/2026',
      endDate: '15/08/2026',
      progress: 100,
      status: 'COMPLETED',
      tuitionStatus: 'PAID',
    },
    {
      id: '3',
      classCode: 'NODE-K25-A',
      courseName: 'Node.js Backend Development',
      courseCode: 'NODE101',
      teacherName: 'ThS. Lê Văn Cường',
      room: 'Phòng Lab 401',
      scheduleDays: ['Thứ 7', 'Chủ nhật'],
      timeSlot: '08:00 - 11:00',
      startDate: '15/11/2026',
      endDate: '15/02/2027',
      progress: 0,
      status: 'UPCOMING',
      tuitionStatus: 'PENDING',
    },
  ]);

  const filteredClasses = classes.filter((c) => {
    if (filter === 'ALL') return true;
    return c.status === filter;
  });

  const stats = {
    total: classes.length,
    active: classes.filter((c) => c.status === 'ACTIVE').length,
    completed: classes.filter((c) => c.status === 'COMPLETED').length,
    pendingPayment: classes.filter((c) => c.tuitionStatus === 'PENDING').length,
  };

  return (
    <div className="dash-container">
      {/* ── Welcome Banner ── */}
      <div className="dash-banner">
        <div className="dash-banner-content">
          <div className="dash-banner-badge">📚 Lớp Học Của Tôi • EduCenter Portal</div>
          <h1>Lớp học của {user?.fullName || 'bạn'}</h1>
          <p>Quản lý tất cả các lớp học bạn đã đăng ký tại EduCenter.</p>
        </div>
        <div className="dash-banner-right">
          <div className="dash-date-pill">
            <div>📊 Tổng: {stats.total} lớp</div>
            <div className="sub">Đang học: {stats.active} • Hoàn thành: {stats.completed}</div>
          </div>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="dash-metrics-grid">
        <div className="dash-metric-card">
          <div className="dash-metric-info">
            <span className="dash-metric-label">Tổng số lớp</span>
            <span className="dash-metric-val">{stats.total} lớp</span>
            <span className="dash-metric-trend up">Đã đăng ký</span>
          </div>
          <div className="dash-metric-icon icon-blue">📚</div>
        </div>
        <div className="dash-metric-card">
          <div className="dash-metric-info">
            <span className="dash-metric-label">Đang học</span>
            <span className="dash-metric-val">{stats.active} lớp</span>
            <span className="dash-metric-trend up">Đang diễn ra</span>
          </div>
          <div className="dash-metric-icon icon-emerald">🎯</div>
        </div>
        <div className="dash-metric-card">
          <div className="dash-metric-info">
            <span className="dash-metric-label">Hoàn thành</span>
            <span className="dash-metric-val">{stats.completed} lớp</span>
            <span className="dash-metric-trend up">Đã tốt nghiệp</span>
          </div>
          <div className="dash-metric-icon icon-amber">🏆</div>
        </div>
        <div className="dash-metric-card">
          <div className="dash-metric-info">
            <span className="dash-metric-label">Chờ thanh toán</span>
            <span className="dash-metric-val">{stats.pendingPayment} lớp</span>
            <span
              className={`dash-metric-trend ${stats.pendingPayment > 0 ? 'down' : 'neutral'}`}
            >
              {stats.pendingPayment > 0 ? 'Cần thanh toán' : 'Đã hoàn tất'}
            </span>
          </div>
          <div className="dash-metric-icon icon-purple">💳</div>
        </div>
      </div>

      {/* ── Filter Tabs ── */}
      <div className="dash-card">
        <div className="dash-card-header">
          <h2 className="dash-card-title">
            <span>📖</span> Danh Sách Lớp Học
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {(['ALL', 'ACTIVE', 'COMPLETED'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`dash-quick-btn ${filter === f ? 'primary' : ''}`}
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
              >
                {f === 'ALL' ? 'Tất cả' : f === 'ACTIVE' ? 'Đang học' : 'Hoàn thành'}
              </button>
            ))}
          </div>
        </div>

        <div className="dash-item-list">
          {filteredClasses.length === 0 ? (
            <div className="dash-subcard" style={{ textAlign: 'center', padding: '2rem' }}>
              <p style={{ opacity: 0.6, margin: 0 }}>Không có lớp học nào trong mục này.</p>
            </div>
          ) : (
            filteredClasses.map((cls) => (
              <div key={cls.id} className="dash-subcard">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ flex: 1, minWidth: '250px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <h3 className="dash-subcard-title" style={{ margin: 0 }}>
                        {cls.courseName}
                      </h3>
                      <span
                        className={`badge-pill ${
                          cls.status === 'ACTIVE'
                            ? 'badge-green'
                            : cls.status === 'COMPLETED'
                              ? 'badge-blue'
                              : 'badge-amber'
                        }`}
                      >
                        {cls.status === 'ACTIVE'
                          ? '🟢 Đang học'
                          : cls.status === 'COMPLETED'
                            ? '✅ Hoàn thành'
                            : '⏳ Sắp khai giảng'}
                      </span>
                      {cls.tuitionStatus === 'PENDING' && (
                        <span className="badge-pill badge-amber">💳 Chờ thanh toán</span>
                      )}
                    </div>
                    <div className="dash-subcard-meta" style={{ marginTop: '0.4rem' }}>
                      Mã lớp: <strong>{cls.classCode}</strong> • Mã khóa: <strong>{cls.courseCode}</strong>
                    </div>
                    <div className="dash-subcard-meta">
                      👨‍🏫 GV: <strong>{cls.teacherName}</strong> • 📍 {cls.room}
                    </div>
                    <div className="dash-subcard-meta">
                      📅 {cls.scheduleDays.join(', ')} • ⏰ {cls.timeSlot}
                    </div>
                    <div className="dash-subcard-meta">
                      🗓️ {cls.startDate} → {cls.endDate}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ marginTop: '0.75rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '0.25rem',
                      fontSize: '0.85rem',
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>Tiến độ</span>
                    <span style={{ fontWeight: 700, color: '#6366f1' }}>{cls.progress}%</span>
                  </div>
                  <div className="dash-progress" style={{ height: '8px' }}>
                    <div className="dash-progress-fill" style={{ width: `${cls.progress}%` }} />
                  </div>
                </div>

                {/* Action buttons */}
                <div
                  style={{
                    display: 'flex',
                    gap: '0.5rem',
                    marginTop: '0.75rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <Link
                    to={`/student/classes/${cls.id}`}
                    className="dash-quick-btn primary"
                    style={{ textDecoration: 'none', padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
                  >
                    📋 Chi tiết
                  </Link>
                  <Link
                    to={`/student/classes/${cls.id}/schedule`}
                    className="dash-quick-btn"
                    style={{ textDecoration: 'none', padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
                  >
                    📅 Lịch học
                  </Link>
                  <Link
                    to={`/student/classes/${cls.id}/assignments`}
                    className="dash-quick-btn"
                    style={{ textDecoration: 'none', padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
                  >
                    📝 Bài tập
                  </Link>
                  {cls.tuitionStatus === 'PENDING' && (
                    <Link
                      to="/student/payments"
                      className="dash-quick-btn"
                      style={{
                        textDecoration: 'none',
                        padding: '0.35rem 0.85rem',
                        fontSize: '0.8rem',
                        background: '#f59e0b',
                        color: 'white',
                      }}
                    >
                      💳 Thanh toán
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MyClassesPage;
