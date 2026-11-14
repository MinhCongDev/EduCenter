
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';


import { useAuth } from '../../contexts/AuthContext';
import { courseService } from '../../services/course.service';
import { staffManagementService } from '../../services/staff-management.service';

interface DashboardStats {
  totalCourses: number;
  activeCourses: number;
  inactiveCourses: number;
  totalStudents: number;
}

const StaffDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    activeCourses: 0,
    inactiveCourses: 0,
    totalStudents: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [all, active, inactive, students] = await Promise.all([
          courseService.getCourses({ limit: 1 }),
          courseService.getCourses({ status: 'ACTIVE', limit: 1 }),
          courseService.getCourses({ status: 'INACTIVE', limit: 1 }),
          staffManagementService.getStudents({ limit: 1 }),
        ]);
        setStats({
          totalCourses: all.pagination?.total ?? 0,
          activeCourses: active.pagination?.total ?? 0,
          inactiveCourses: inactive.pagination?.total ?? 0,
          totalStudents: students.pagination?.total ?? 0,
        });
      } catch {
        // backend might not be running – keep zeros
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    {
      id: 'stat-total-courses',
      icon: '📚',
      label: 'Tổng khóa học',
      value: loading ? '…' : stats.totalCourses.toString(),
      color: 'var(--primary-500)',
      bg: 'var(--primary-50)',
    },
    {
      id: 'stat-active-courses',
      icon: '✅',
      label: 'Đang hoạt động',
      value: loading ? '…' : stats.activeCourses.toString(),
      color: 'var(--success)',
      bg: 'rgba(16,185,129,0.08)',
    },
    {
      id: 'stat-inactive-courses',
      icon: '⏸️',
      label: 'Tạm dừng',
      value: loading ? '…' : stats.inactiveCourses.toString(),
      color: 'var(--warning)',
      bg: 'rgba(245,158,11,0.08)',
    },
    {
      id: 'stat-students',
      icon: '👩‍🎓',
      label: 'Học viên',
      value: loading ? '…' : stats.totalStudents.toString(),
      color: 'var(--accent-500)',
      bg: 'rgba(6,182,212,0.08)',
    },
    {
      id: 'stat-teachers',
      icon: '👨‍🏫',
      label: 'Giảng viên',
      value: '–',
      color: 'var(--primary-600)',
      bg: 'var(--primary-50)',
    },
    {
      id: 'stat-enrollments',
      icon: '📋',
      label: 'Đăng ký',
      value: '–',
      color: 'var(--info)',
      bg: 'rgba(59,130,246,0.08)',
    },
  ];

  // Get greeting based on current hour
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

  return (

    <div className="dash-container">
      {/* ── Welcome Banner ── */}
      <div className="dash-banner" style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)' }}>
        <div className="dash-banner-content">
          <div className="dash-banner-badge">
            Phòng Giáo vụ • Quản lý đào tạo
          </div>
          <h1>{greeting}, {user?.fullName || 'Cán bộ Giáo vụ'}!</h1>
          <p>Quản lý tuyển sinh, phân bổ lớp học, giảng viên và tiếp nhận học viên trung tâm.</p>
        </div>
        <div className="dash-banner-right">
          <div className="dash-date-pill">
            <div>Trạng thái: Sẵn sàng</div>
            <div className="sub">Kỳ tuyển sinh Đợt 4 • Năm 2026</div>
          </div>
        </div>
      </div>

      {/* ── Quick Action Bar ── */}
      <div className="dash-actions-row">
        <Link to="/staff/courses" className="dash-quick-btn primary">
          Quản lý khóa học
        </Link>
        <Link to="/staff/classes" className="dash-quick-btn">
          Quản lý lớp học
        </Link>
      </div>

      {/* ── Key Metrics ── */}
      <div className="dash-metrics-grid">
        <div className="dash-metric-card">
          <div className="dash-metric-info">
            <span className="dash-metric-label">Lớp đang mở tuyển</span>
            <span className="dash-metric-val">4 lớp</span>
            <span className="dash-metric-trend up">Sắp đủ sĩ số</span>
          </div>
          <div className="dash-metric-icon icon-blue">🏫</div>
        </div>

        <div className="dash-metric-card">
          <div className="dash-metric-info">
            <span className="dash-metric-label">Tổng học viên quản lý</span>
            <span className="dash-metric-val">{loading ? '…' : stats.totalStudents}</span>
            <span className="dash-metric-trend up">Tài khoản học viên trong hệ thống</span>
          </div>
          <div className="dash-metric-icon icon-emerald">👩‍🎓</div>
        </div>
      </div>

      {/* ── Main Two Column Grid ── */}
      <div className="dash-two-col" style={{ gridTemplateColumns: '1fr' }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Active Classes Management */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h2 className="dash-card-title">
                <span>🏫</span> Tình Trạng Tuyển Sinh Các Lớp Sắp Mở
              </h2>
              <span className="dash-subcard-meta">Hạn chót: 28/10/2026</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="dash-subcard">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 className="dash-subcard-title">Lớp WEB-K24-A (MERN Full-Stack)</h3>
                    <div className="dash-subcard-meta">GV: ThS. Nguyễn Văn An • Lab 302 • Thứ 2-4-6 (18:30)</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 800, color: '#10b981' }}>22 / 25 Học viên</span>
                    <div className="dash-subcard-meta">Đủ điều kiện mở lớp</div>
                  </div>
                </div>
                <div className="dash-progress">
                  <div className="dash-progress-fill" style={{ width: '88%', background: '#10b981' }} />
                </div>
              </div>

              <div className="dash-subcard">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 className="dash-subcard-title">Lớp AI-K12-B (Python & AI)</h3>
                    <div className="dash-subcard-meta">GV: TS. Lê Hoàng Bách • Lab 405 • Thứ 3-5-7 (19:00)</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 800, color: '#3b82f6' }}>16 / 20 Học viên</span>
                    <div className="dash-subcard-meta">Còn 4 chỗ trống</div>
                  </div>
                </div>
                <div className="dash-progress">
                  <div className="dash-progress-fill" style={{ width: '80%', background: '#3b82f6' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── Stats Grid ── */}
      <section className="staff-section" aria-label="Thống kê tổng quan">
        <div className="staff-stats-grid">
          {statCards.map((card) => (
            <div
              key={card.id}
              id={card.id}
              className="staff-stat-card"
              style={{ '--card-color': card.color, '--card-bg': card.bg } as React.CSSProperties}
            >
              <div className="staff-stat-icon-wrap">
                <span className="staff-stat-icon">{card.icon}</span>
              </div>
              <div className="staff-stat-info">
                <span className="staff-stat-value">{card.value}</span>
                <span className="staff-stat-label">{card.label}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Recent Activity placeholder ── */}
      <section className="staff-section" aria-label="Hoạt động gần đây">
        <div className="staff-section-header">
          <h2 className="staff-section-title">Hoạt động gần đây</h2>
        </div>
        <div className="staff-empty-state">
          <span className="staff-empty-icon">📡</span>
          <p>Kết nối backend để hiển thị dữ liệu thực tế.</p>
        </div>
      </section>
    </div>
  );
};

export default StaffDashboard;
