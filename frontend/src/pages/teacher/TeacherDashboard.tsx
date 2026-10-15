import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import dashboardService from '../../services/dashboard.service';
import type { TeacherDashboardData } from '../../services/dashboard.service';
import '../dashboard/Dashboard.css';

const DEFAULT_TEACHER_CLASSES = [
  { id: 'c1', name: 'IELTS Intensive 7.5+ (Sáng 2-4-6)', room: 'Phòng A201 - Cơ sở Cầu Giấy', students: 18, time: '08:30 - 10:30', progress: 'Bài 14/24' },
  { id: 'c2', name: 'IELTS Writing Intensive (Tối 3-5-7)', room: 'Phòng B102 - Cơ sở Hà Đông', students: 22, time: '18:00 - 20:00', progress: 'Bài 8/20' },
  { id: 'c3', name: 'IELTS Speaking Master 1:1', room: 'Online VIP Zoom Room 02', students: 12, time: '20:15 - 21:15', progress: 'Kèm riêng' },
  { id: 'c4', name: 'Luyện đề Mock Test Cuối Tuần', room: 'Phòng Computer Lab 01', students: 26, time: 'Chủ Nhật 08:00', progress: 'Đợt 4' },
];

const DEFAULT_SUBMISSIONS = [
  { id: 's1', student: 'Phạm Hải Đăng', class: 'IELTS Intensive 7.5+', task: 'Writing Task 2: Artificial Intelligence in Education', date: 'Hôm nay, 08:15', status: 'Chờ chấm' },
  { id: 's2', student: 'Lê Hoàng Minh', class: 'IELTS Writing Intensive', task: 'Writing Task 1: Bar Chart on Global Energy Consumption', date: 'Hôm qua, 22:30', status: 'Chờ chấm' },
  { id: 's3', student: 'Trần Thảo Linh', class: 'IELTS Speaking Master', task: 'Speaking Part 2: Describe an environmental problem', date: '13/10/2026', status: 'Đã chấm (7.5)' },
  { id: 's4', student: 'Nguyễn Quốc Anh', class: 'IELTS Intensive 7.5+', task: 'Writing Task 2: Public Transportation Funding', date: '12/10/2026', status: 'Đã chấm (8.0)' },
];

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<TeacherDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await dashboardService.getTeacherDashboard();
        if (isMounted) {
          setDashboardData(res);
        }
      } catch (err) {
        console.warn('Could not fetch teacher dashboard from backend, using default fallback:', err);
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
  const classes = dashboardData?.classes?.length ? dashboardData.classes : DEFAULT_TEACHER_CLASSES;
  const submissions = dashboardData?.submissions?.length ? dashboardData.submissions : DEFAULT_SUBMISSIONS;


  return (
    <div className="dmr-dashboard-wrapper">
      <div className="dmr-dashboard-container">
        
        {/* Top Header */}
        <div className="dmr-dash-header">
          <div className="dmr-dash-welcome">
            <span className="dmr-dash-role-badge">👨‍🏫 Cổng Giảng Viên IELTS 8.5+</span>
            <h1 className="dmr-dash-title">Bàn Làm Việc Giảng Dạy &amp; Quản Lý Lớp</h1>
            <p className="dmr-dash-subtitle">
              Xin chào, <strong>{user?.fullName || 'Thầy Alex Nguyễn (IELTS 9.0)'}</strong> • Hôm nay bạn có 2 ca giảng dạy
            </p>
          </div>

          <div className="dmr-dash-actions">
            <button
              type="button"
              className="dmr-dash-btn dmr-dash-btn-secondary"
              onClick={() => alert('Đang mở form Điểm danh lớp học...')}
            >
              📋 Điểm danh hôm nay
            </button>
            <button
              type="button"
              className="dmr-dash-btn dmr-dash-btn-primary"
              onClick={() => alert('Mở giao diện Tạo bài tập / Chấm bài Writing 1:1...')}
            >
              ✍️ Chữa bài nộp mới
            </button>
          </div>
        </div>

        {/* 4 KPI Metrics */}
        <div className="dmr-kpi-grid">
          <div className="dmr-kpi-card">
            <div className="dmr-kpi-icon">🏫</div>
            <div className="dmr-kpi-info">
              <span className="dmr-kpi-value">{loading ? '...' : `${stats?.activeClasses || classes.length} Lớp`}</span>
              <span className="dmr-kpi-label">Lớp đang giảng dạy</span>
              <span className="dmr-kpi-trend dmr-trend-up">▲ Đang hoạt động</span>
            </div>
          </div>

          <div className="dmr-kpi-card">
            <div className="dmr-kpi-icon">👥</div>
            <div className="dmr-kpi-info">
              <span className="dmr-kpi-value">{loading ? '...' : (stats?.totalStudents || 78)}</span>
              <span className="dmr-kpi-label">Tổng học viên theo học</span>
              <span className="dmr-kpi-trend dmr-trend-highlight">★ Chuyên cần 97.2%</span>
            </div>
          </div>

          <div className="dmr-kpi-card">
            <div className="dmr-kpi-icon" style={{ background: 'rgba(236, 110, 35, 0.2)', borderColor: '#EC6E23' }}>
              📝
            </div>
            <div className="dmr-kpi-info">
              <span className="dmr-kpi-value">{loading ? '...' : `${stats?.pendingSubmissions ?? 9} Bài`}</span>
              <span className="dmr-kpi-label">Bài tập cần chấm</span>
              <span className="dmr-kpi-trend dmr-trend-up">Hạn chữa: trong 24h</span>
            </div>
          </div>

          <div className="dmr-kpi-card">
            <div className="dmr-kpi-icon" style={{ background: 'rgba(160, 236, 29, 0.2)', borderColor: '#A0EC1D' }}>
              📅
            </div>
            <div className="dmr-kpi-info">
              <span className="dmr-kpi-value">{loading ? '...' : `${stats?.weeklySessions || 14} Ca`}</span>
              <span className="dmr-kpi-label">Lịch dạy tuần này</span>
              <span className="dmr-kpi-trend dmr-trend-highlight">Cập nhật thời khóa biểu</span>
            </div>
          </div>
        </div>

        {/* 2-Column Section */}
        <div className="dmr-section-grid">
          
          {/* Left Column: Classes Schedule */}
          <div className="dmr-card-box">
            <div className="dmr-box-header">
              <h2 className="dmr-box-title">
                📚 Danh Sách Lớp Học Đang Phụ Trách
              </h2>
              <span className="dmr-box-tag">Học kỳ Fall 2026</span>
            </div>

            <div className="dmr-item-list">
              {classes.map((cls) => (
                <div key={cls.id} className="dmr-list-card">
                  <div className="dmr-list-info">
                    <span className="dmr-list-title">{cls.name}</span>
                    <span className="dmr-list-sub">
                      📍 {cls.room} • ⏰ {cls.time} • 👥 {cls.students} học viên
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <span className="dmr-badge dmr-badge-success">{cls.progress}</span>
                    <button
                      type="button"
                      className="dmr-dash-btn dmr-dash-btn-secondary"
                      style={{ padding: '3px 9px', fontSize: '0.75rem' }}
                      onClick={() => alert(`Mở tài liệu lớp: ${cls.name}`)}
                    >
                      Vào lớp
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Pending Homework to Grade */}
          <div className="dmr-card-box">
            <div className="dmr-box-header">
              <h2 className="dmr-box-title">
                ✍️ Bài Nộp Chờ Chữa
              </h2>
              <span className="dmr-box-tag">Writing &amp; Speaking</span>
            </div>

            <div className="dmr-item-list">
              {submissions.map((sub) => (
                <div key={sub.id} className="dmr-list-card">
                  <div className="dmr-list-info">
                    <span className="dmr-list-title" style={{ fontSize: '0.88rem' }}>
                      {sub.student}
                    </span>
                    <span className="dmr-list-sub" style={{ fontSize: '0.75rem' }}>
                      {sub.task}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#A0EC1D' }}>
                      {sub.class} • {sub.date}
                    </span>
                  </div>
                  <span
                    className={`dmr-badge ${
                      sub.status === 'Chờ chấm' ? 'dmr-badge-orange' : 'dmr-badge-success'
                    }`}
                  >
                    {sub.status}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <button
                type="button"
                className="dmr-dash-btn dmr-dash-btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => alert('Mở trình chữa bài tương tác Audio & Highlight Text...')}
              >
                Chữa Bài Ngay 1:1
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default TeacherDashboard;
