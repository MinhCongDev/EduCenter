
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';


import { useAuth } from '../../contexts/AuthContext';
import { courseService } from '../../services/course.service';

interface DashboardStats {
  totalCourses: number;
  activeCourses: number;
  inactiveCourses: number;
}

const StaffDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    activeCourses: 0,
    inactiveCourses: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [all, active, inactive] = await Promise.all([
          courseService.getCourses({ limit: 1 }),
          courseService.getCourses({ status: 'ACTIVE', limit: 1 }),
          courseService.getCourses({ status: 'INACTIVE', limit: 1 }),
        ]);
        setStats({
          totalCourses: all.pagination?.total ?? 0,
          activeCourses: active.pagination?.total ?? 0,
          inactiveCourses: inactive.pagination?.total ?? 0,
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
      value: '–',
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

  const quickActions = [
    {
      id: 'action-manage-courses',
      title: 'Quản lý khóa học',
      description: 'Thêm, sửa, xóa các khóa học',
      path: '/staff/courses',
    },
    {
      id: 'action-manage-classes',
      title: 'Quản lý lớp học',
      description: 'Tổ chức và quản lý lịch lớp',
      path: '/staff/classes',
    },
    {
      id: 'action-manage-students',
      title: 'Quản lý học viên',
      description: 'Tra cứu hồ sơ, lớp học và kết quả học tập',
      path: '/staff/students',
    },
    {
      id: 'action-manage-teachers',
      title: 'Quản lý giảng viên',
      description: 'Tra cứu giảng viên và các lớp phụ trách',
      path: '/staff/teachers',
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
            <span className="dash-metric-val">186</span>
            <span className="dash-metric-trend up">Đang theo học tại trung tâm</span>
          </div>
          <div className="dash-metric-icon icon-emerald">👩‍🎓</div>
        </div>

        <div className="dash-metric-card">
          <div className="dash-metric-info">
            <span className="dash-metric-label">Học phí cần đối soát</span>
            <span className="dash-metric-val">24.500.000 đ</span>
            <span className="dash-metric-trend neutral">3 giao dịch chờ xác nhận</span>
          </div>
          <div className="dash-metric-icon icon-purple">💳</div>
        </div>
      </div>

      {/* ── Main Two Column Grid ── */}
      <div className="dash-two-col">
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

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Room Allocation Status */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h2 className="dash-card-title">
                <span>🏢</span> Lịch Phòng Máy Hôm Nay
              </h2>
            </div>
            <div className="dash-item-list">
              <div className="dash-item">
                <div className="dash-item-main">
                  <div className="dash-item-icon">🖥️</div>
                  <div>
                    <div className="dash-item-title">Phòng Lab 302</div>
                    <div className="dash-item-sub">18:30 - 21:00 • Lớp WEB-K24-A</div>
                  </div>
                </div>
                <span className="badge-pill badge-green">Đang dùng</span>
              </div>

              <div className="dash-item">
                <div className="dash-item-main">
                  <div className="dash-item-icon">🖥️</div>
                  <div>
                    <div className="dash-item-title">Phòng Lab 405</div>
                    <div className="dash-item-sub">19:00 - 21:30 • Lớp AI-K12-B</div>
                  </div>
                </div>
                <span className="badge-pill badge-blue">Sắp bắt đầu</span>
              </div>

              <div className="dash-item">
                <div className="dash-item-main">
                  <div className="dash-item-icon">🏫</div>
                  <div>
                    <div className="dash-item-title">Phòng Lý Thuyết 201</div>
                    <div className="dash-item-sub">Trống cả ngày</div>
                  </div>
                </div>
                <span className="badge-pill badge-amber">Phòng trống</span>
              </div>
            </div>
          </div>

          {/* Academic Reminders */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h2 className="dash-card-title">
                <span>📌</span> Việc Giáo Vụ Cần Lưu Ý
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="dash-subcard" style={{ borderLeft: '4px solid #10b981' }}>
                <p className="dash-subcard-body" style={{ margin: 0 }}>
                  ✉️ Gửi email nhắc lịch khai giảng cho học viên lớp Web Fullstack trước ngày 29/10.
                </p>
              </div>
              <div className="dash-subcard" style={{ borderLeft: '4px solid #3b82f6' }}>
                <p className="dash-subcard-body" style={{ margin: 0 }}>
                  🛠️ Kiểm tra hệ thống mạng và cài đặt IDE Node.js tại phòng Lab 302.
                </p>
              </div>
              <div className="dash-subcard" style={{ borderLeft: '4px solid #f59e0b' }}>
                <p className="dash-subcard-body" style={{ margin: 0 }}>
                  💰 Chốt danh sách thu học phí đợt đầu để chuyển sang phòng Kế toán.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── Stats Grid ── */}
      <section className="staff-section" aria-label="Thống kê tổng quan">
        <div className="staff-section-header">
          <h2 className="staff-section-title">Tổng quan</h2>
        </div>
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

      {/* ── Quick Actions ── */}
      <section className="staff-section" aria-label="Quản lý nhanh">
        <div className="staff-section-header">
          <h2 className="staff-section-title">Quản lý nhanh</h2>
          <p className="staff-section-subtitle">Truy cập nhanh các chức năng quản lý</p>
        </div>
        <div className="staff-actions-grid">
          {quickActions.map((action) => (
            <Link
              key={action.id}
              id={action.id}
              to={action.path}
              className="staff-action-card"
            >
              <div className="staff-action-content">
                <h3 className="staff-action-title">{action.title}</h3>
                <p className="staff-action-desc">{action.description}</p>
              </div>
            </Link>
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
