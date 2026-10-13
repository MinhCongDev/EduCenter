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
      icon: '📚',
      title: 'Quản lý Khóa học',
      description: 'Thêm, sửa, xóa các khóa học',
      path: '/staff/courses',
      gradient: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
    },
    {
      id: 'action-manage-classes',
      icon: '🏫',
      title: 'Quản lý Lớp học',
      description: 'Tổ chức và quản lý lịch lớp',
      path: '/staff/classes',
      gradient: 'linear-gradient(135deg, var(--accent-500), var(--accent-600))',
    },
    {
      id: 'action-manage-students',
      icon: '👩‍🎓',
      title: 'Quản lý Học viên',
      description: 'Danh sách và hồ sơ học viên',
      path: '/staff/students',
      gradient: 'linear-gradient(135deg, #10b981, #059669)',
    },
    {
      id: 'action-manage-enrollments',
      icon: '📋',
      title: 'Đăng ký học',
      description: 'Xử lý đơn đăng ký khóa học',
      path: '/staff/enrollments',
      gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    },
  ];

  // Get greeting based on current hour
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

  return (
    <div className="staff-dashboard">
      {/* ── Welcome Banner ── */}
      <div className="staff-welcome-banner">
        <div className="staff-welcome-content">
          <div className="staff-welcome-text">
            <span className="staff-greeting">{greeting},</span>
            <h1 className="staff-name">{user?.fullName ?? 'Staff'} 👋</h1>
            <p className="staff-role-badge">
              <span className="role-dot" />
              Training Staff
            </p>
          </div>
          <div className="staff-welcome-art" aria-hidden="true">
            <span className="welcome-emoji">🎓</span>
          </div>
        </div>
        <p className="staff-date">
          {new Date().toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
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
              style={{ '--action-gradient': action.gradient } as React.CSSProperties}
            >
              <div className="staff-action-icon-wrap">
                <span className="staff-action-icon">{action.icon}</span>
              </div>
              <div className="staff-action-content">
                <h3 className="staff-action-title">{action.title}</h3>
                <p className="staff-action-desc">{action.description}</p>
              </div>
              <span className="staff-action-arrow">→</span>
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
