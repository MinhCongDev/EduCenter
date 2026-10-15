import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import dashboardService from '../../services/dashboard.service';
import type { StudentDashboardData } from '../../services/dashboard.service';
import '../dashboard/Dashboard.css';

const DEFAULT_STUDENT_SCHEDULE = [
  { id: 'sc1', day: 'Thứ Ba, 21/10', time: '18:00 - 20:00', title: 'Speaking Coaching: Fluency & Lexical Resource', room: 'Phòng A201 - Cơ sở Cầu Giấy', teacher: 'Thầy Alex Nguyễn (9.0)', status: 'Sắp học' },
  { id: 'sc2', day: 'Thứ Năm, 23/10', time: '18:00 - 20:00', title: 'Writing Task 2: Coherence & Cohesion Analysis', room: 'Phòng A201 - Cơ sở Cầu Giấy', teacher: 'Thầy Alex Nguyễn (9.0)', status: 'Lên lịch' },
  { id: 'sc3', day: 'Thứ Bảy, 25/10', time: '08:30 - 11:30', title: 'Full Mock Test Listening & Reading trên máy tính', room: 'Phòng Computer Lab 01', teacher: 'Giám thị IDP Chuẩn', status: 'Thi thử' },
];

const DEFAULT_STUDENT_HOMEWORK = [
  { id: 'hw1', title: 'Writing Task 2: Government Investment in Space Exploration', deadline: 'Hạn: 23:59 Chủ Nhật (19/10)', status: 'Chưa nộp', priority: 'high' },
  { id: 'hw2', title: 'Speaking Part 2 Recording: Describe a memorable journey', deadline: 'Hạn: 23:59 Thứ Tư (22/10)', status: 'Chưa nộp', priority: 'normal' },
  { id: 'hw3', title: 'Writing Task 1: Comparative Bar Chart on Carbon Emissions', deadline: 'Đã nộp 12/10', status: 'Điểm: 7.5 (Tốt)', priority: 'done' },
];

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await dashboardService.getStudentDashboard();
        if (isMounted) {
          setDashboardData(res);
        }
      } catch (err) {
        console.warn('Could not fetch student dashboard from backend, using default fallback:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  const stats = dashboardData?.stats;
  const schedule = dashboardData?.schedule?.length ? dashboardData.schedule : DEFAULT_STUDENT_SCHEDULE;
  const homework = dashboardData?.homework?.length ? dashboardData.homework : DEFAULT_STUDENT_HOMEWORK;


  return (
    <div className="dmr-dashboard-wrapper">
      <div className="dmr-dashboard-container">
        
        {/* Top Header */}
        <div className="dmr-dash-header">
          <div className="dmr-dash-welcome">
            <span className="dmr-dash-role-badge">🎓 Không Gian Học Viên • EduCenter IELTS</span>
            <h1 className="dmr-dash-title">Lộ Trình Học Tập Cá Nhân Hóa</h1>
            <p className="dmr-dash-subtitle">
              Xin chào, <strong>{user?.fullName || 'Phạm Hải Đăng (Học viên)'}</strong> • Band điểm mục tiêu: <span style={{ color: '#FCD34D', fontWeight: 800 }}>IELTS 7.5+</span>
            </p>
          </div>

          <div className="dmr-dash-actions">
            <button
              type="button"
              className="dmr-dash-btn dmr-dash-btn-secondary"
              onClick={() => alert('Đang mở form Đặt lịch Coaching 1:1 cùng Cựu giám khảo...')}
            >
              🎙️ Đặt lịch nói 1:1
            </button>
            <button
              type="button"
              className="dmr-dash-btn dmr-dash-btn-primary"
              onClick={() => alert('Mở giao diện phòng thi thử Mock Test trên máy tính...')}
            >
              🎧 Thi thử Online ngay
            </button>
          </div>
        </div>

        {/* 4 KPI Metrics */}
        <div className="dmr-kpi-grid">
          <div className="dmr-kpi-card">
            <div className="dmr-kpi-icon">📚</div>
            <div className="dmr-kpi-info">
              <span className="dmr-kpi-value" style={{ fontSize: '1.25rem' }}>
                {loading ? '...' : (stats?.currentClass || 'IELTS 7.5+')}
              </span>
              <span className="dmr-kpi-label">Lớp đang theo học</span>
              <span className="dmr-kpi-trend dmr-trend-up">
                {stats?.teacherName ? `GV: ${stats.teacherName}` : 'Phòng A201 • Thầy Alex'}
              </span>
            </div>
          </div>

          <div className="dmr-kpi-card">
            <div className="dmr-kpi-icon" style={{ background: 'rgba(245, 158, 11, 0.2)', borderColor: '#F59E0B' }}>
              🏆
            </div>
            <div className="dmr-kpi-info">
              <span className="dmr-kpi-value">
                {loading ? '...' : (stats?.latestScore ? stats.latestScore.split(' ')[0] + ' Overall' : '7.5 Overall')}
              </span>
              <span className="dmr-kpi-label">Điểm thi thử gần nhất</span>
              <span className="dmr-kpi-trend dmr-trend-highlight">
                {stats?.latestScore || 'L: 8.0 | R: 8.0 | W: 7.0 | S: 7.0'}
              </span>
            </div>
          </div>

          <div className="dmr-kpi-card">
            <div className="dmr-kpi-icon">✅</div>
            <div className="dmr-kpi-info">
              <span className="dmr-kpi-value">{loading ? '...' : (stats?.attendanceRate || '96%')}</span>
              <span className="dmr-kpi-label">Tỷ lệ chuyên cần</span>
              <span className="dmr-kpi-trend dmr-trend-up">Chuyên cần tích cực</span>
            </div>
          </div>

          <div className="dmr-kpi-card">
            <div className="dmr-kpi-icon" style={{ background: 'rgba(236, 110, 35, 0.2)', borderColor: '#EC6E23' }}>
              📝
            </div>
            <div className="dmr-kpi-info">
              <span className="dmr-kpi-value">{loading ? '...' : `${stats?.pendingTasks ?? 2} Bài`}</span>
              <span className="dmr-kpi-label">Bài tập cần nộp</span>
              <span className="dmr-kpi-trend dmr-trend-highlight">Cần hoàn thành đúng hạn</span>
            </div>
          </div>
        </div>

        {/* 2-Column Section */}
        <div className="dmr-section-grid">
          
          {/* Left Column: Schedule & Upcoming Classes */}
          <div className="dmr-card-box">
            <div className="dmr-box-header">
              <h2 className="dmr-box-title">
                📅 Lịch Học &amp; Thi Thử Tuần Này
              </h2>
              <span className="dmr-box-tag">{schedule.length} buổi sắp tới</span>
            </div>

            <div className="dmr-item-list">
              {schedule.map((sc) => (
                <div key={sc.id} className="dmr-list-card">
                  <div className="dmr-list-info">
                    <span className="dmr-list-title">
                      {sc.title}
                    </span>
                    <span className="dmr-list-sub">
                      ⏰ {sc.day} ({sc.time}) • 📍 {sc.room}
                    </span>
                    <span style={{ fontSize: '0.74rem', color: '#57D061' }}>
                      Giảng viên: {sc.teacher}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <span
                      className={`dmr-badge ${
                        sc.status === 'Sắp học' ? 'dmr-badge-orange' : 'dmr-badge-success'
                      }`}
                    >
                      {sc.status}
                    </span>
                    <button
                      type="button"
                      className="dmr-dash-btn dmr-dash-btn-secondary"
                      style={{ padding: '3px 8px', fontSize: '0.74rem' }}
                      onClick={() => alert(`Xem giáo án buổi học: ${sc.title}`)}
                    >
                      Xem giáo án
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Homework & Assignments */}
          <div className="dmr-card-box">
            <div className="dmr-box-header">
              <h2 className="dmr-box-title">
                ✍️ Bài Tập &amp; Nhiệm Vụ
              </h2>
              <span className="dmr-box-tag">Writing &amp; Speaking</span>
            </div>

            <div className="dmr-item-list">
              {homework.map((hw) => (
                <div key={hw.id} className="dmr-list-card">
                  <div className="dmr-list-info">
                    <span className="dmr-list-title" style={{ fontSize: '0.88rem' }}>
                      {hw.title}
                    </span>
                    <span className="dmr-list-sub" style={{ fontSize: '0.75rem', color: '#FCD34D' }}>
                      ⏰ {hw.deadline}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <span
                      className={`dmr-badge ${
                        hw.priority === 'high' ? 'dmr-badge-orange' : 'dmr-badge-success'
                      }`}
                    >
                      {hw.status}
                    </span>
                    {hw.priority !== 'done' && (
                      <button
                        type="button"
                        className="dmr-dash-btn dmr-dash-btn-primary"
                        style={{ padding: '3px 9px', fontSize: '0.74rem' }}
                        onClick={() => alert(`Mở cửa sổ nộp bài: ${hw.title}`)}
                      >
                        Nộp bài
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <button
                type="button"
                className="dmr-dash-btn dmr-dash-btn-secondary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => alert('Đang mở Kho tài liệu Cambridge 10-19 & Video bài giảng độc quyền...')}
              >
                📥 Mở Thư Viện Sách &amp; Video Độc Quyền
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default StudentDashboard;
