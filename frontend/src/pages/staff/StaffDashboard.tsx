import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import dashboardService from '../../services/dashboard.service';
import type { StaffDashboardData } from '../../services/dashboard.service';
import '../dashboard/Dashboard.css';

const DEFAULT_RECENT_ENROLLMENTS = [
  { id: 'en1', name: 'Đặng Thùy Dương', phone: '0988 345 678', course: 'IELTS Intensive 7.5+', campus: 'Cầu Giấy', fee: '12.500.000 ₫', payment: 'Đã thanh toán', date: 'Hôm nay' },
  { id: 'en2', name: 'Bùi Gia Huy', phone: '0977 123 456', course: 'IELTS Mất Gốc (0 - 3.5)', campus: 'Hà Đông', fee: '8.900.000 ₫', payment: 'Đã thanh toán', date: 'Hôm nay' },
  { id: 'en3', name: 'Trịnh Mai Phương', phone: '0912 888 999', course: 'Luyện đề Mock Test Máy', campus: 'Thanh Xuân', fee: '1.200.000 ₫', payment: 'Chờ đối soát', date: 'Hôm qua' },
  { id: 'en4', name: 'Vũ Minh Khôi', phone: '0934 555 777', course: 'IELTS Speaking Master 1:1', campus: 'Online', fee: '6.500.000 ₫', payment: 'Đã thanh toán', date: 'Hôm qua' },
];

const DEFAULT_ROOM_STATUS = [
  { id: 'r1', room: 'Phòng Computer Lab 01 (30 Máy)', campus: 'Cơ sở Cầu Giấy', event: 'Thi thử IELTS Mock Test IDP', time: '14:00 - 17:00', status: 'Đang sử dụng' },
  { id: 'r2', room: 'Phòng A201 (Lớp 20 ghế)', campus: 'Cơ sở Cầu Giấy', event: 'IELTS Intensive 7.5+', time: '18:00 - 20:00', status: 'Sắp diễn ra' },
  { id: 'r3', room: 'Speaking Coaching Booth 1', campus: 'Cơ sở Hà Đông', event: 'Luyện nói 1:1 Thầy Alex', time: '19:00 - 20:30', status: 'Sắp diễn ra' },
  { id: 'r4', room: 'Hội trường B101 (100 ghế)', campus: 'Cơ sở Thanh Xuân', event: 'Workshop Bí quyết 8.0+ Listening', time: 'Thứ 7, 09:00', status: 'Chuẩn bị' },
];

export const StaffDashboard: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<StaffDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await dashboardService.getStaffDashboard();
        if (isMounted) {
          setDashboardData(res);
        }
      } catch (err) {
        console.warn('Could not fetch staff dashboard from backend, using default fallback:', err);
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
  const recentEnrollments = dashboardData?.recentEnrollments?.length ? dashboardData.recentEnrollments : DEFAULT_RECENT_ENROLLMENTS;
  const roomStatus = dashboardData?.roomStatus?.length ? dashboardData.roomStatus : DEFAULT_ROOM_STATUS;


  return (
    <div className="dmr-dashboard-wrapper">
      <div className="dmr-dashboard-container">
        
        {/* Top Header */}
        <div className="dmr-dash-header">
          <div className="dmr-dash-welcome">
            <span className="dmr-dash-role-badge">📋 Ban Giáo Vụ &amp; Quản Lý Học Vụ</span>
            <h1 className="dmr-dash-title">Điều Phối Tuyển Sinh, Lớp Học &amp; Thi Thử</h1>
            <p className="dmr-dash-subtitle">
              Xin chào, <strong>{user?.fullName || 'Giáo vụ Nguyễn Thị Mai'}</strong> • Hệ thống sẵn sàng phục vụ học viên
            </p>
          </div>

          <div className="dmr-dash-actions">
            <button
              type="button"
              className="dmr-dash-btn dmr-dash-btn-secondary"
              onClick={() => alert('Mở form Xếp lớp / Mở ca học mới...')}
            >
              🏫 Xếp lớp mới
            </button>
            <button
              type="button"
              className="dmr-dash-btn dmr-dash-btn-primary"
              onClick={() => alert('Mở form Tiếp nhận học viên mới...')}
            >
              👩‍🎓 Đăng ký học viên mới
            </button>
          </div>
        </div>

        {/* 4 KPI Metrics */}
        <div className="dmr-kpi-grid">
          <div className="dmr-kpi-card">
            <div className="dmr-kpi-icon">👩‍🎓</div>
            <div className="dmr-kpi-info">
              <span className="dmr-kpi-value">{loading ? '...' : (stats?.newStudents || 68)}</span>
              <span className="dmr-kpi-label">Học viên hoạt động</span>
              <span className="dmr-kpi-trend dmr-trend-up">▲ Đang theo học hệ thống</span>
            </div>
          </div>

          <div className="dmr-kpi-card">
            <div className="dmr-kpi-icon">🏫</div>
            <div className="dmr-kpi-info">
              <span className="dmr-kpi-value">{loading ? '...' : `${stats?.activeClasses || 28} Lớp`}</span>
              <span className="dmr-kpi-label">Lớp học đang mở</span>
              <span className="dmr-kpi-trend dmr-trend-highlight">★ Vận hành tiêu chuẩn</span>
            </div>
          </div>

          <div className="dmr-kpi-card">
            <div className="dmr-kpi-icon" style={{ background: 'rgba(236, 110, 35, 0.2)', borderColor: '#EC6E23' }}>
              🎧
            </div>
            <div className="dmr-kpi-info">
              <span className="dmr-kpi-value">{loading ? '...' : (stats?.mockTestCandidates || 120)}</span>
              <span className="dmr-kpi-label">Thí sinh thi thử tuần này</span>
              <span className="dmr-kpi-trend dmr-trend-up">Computer Mock Test</span>
            </div>
          </div>

          <div className="dmr-kpi-card">
            <div className="dmr-kpi-icon" style={{ background: 'rgba(160, 236, 29, 0.2)', borderColor: '#A0EC1D' }}>
              💳
            </div>
            <div className="dmr-kpi-info">
              <span className="dmr-kpi-value">{loading ? '...' : `${stats?.pendingPayments ?? 45} Giao dịch`}</span>
              <span className="dmr-kpi-label">Giao dịch học phí</span>
              <span className="dmr-kpi-trend dmr-trend-highlight">Tự động xuất hóa đơn</span>
            </div>
          </div>
        </div>

        {/* 2-Column Section */}
        <div className="dmr-section-grid">
          
          {/* Left Column: Recent Enrollments */}
          <div className="dmr-card-box">
            <div className="dmr-box-header">
              <h2 className="dmr-box-title">
                📝 Học Viên Đăng Ký Mới Nhất
              </h2>
              <span className="dmr-box-tag">Tuyển sinh 24/7</span>
            </div>

            <div className="dmr-table-responsive">
              <table className="dmr-table">
                <thead>
                  <tr>
                    <th>Họ và tên</th>
                    <th>SĐT</th>
                    <th>Khóa học</th>
                    <th>Cơ sở</th>
                    <th>Học phí</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEnrollments.map((en) => (
                    <tr key={en.id}>
                      <td style={{ fontWeight: 700 }}>{en.name}</td>
                      <td>{en.phone}</td>
                      <td style={{ color: '#57D061' }}>{en.course}</td>
                      <td>{en.campus}</td>
                      <td style={{ fontWeight: 700, color: '#FCD34D' }}>{en.fee}</td>
                      <td>
                        <span
                          className={`dmr-badge ${
                            en.payment === 'Đã thanh toán' ? 'dmr-badge-success' : 'dmr-badge-orange'
                          }`}
                        >
                          {en.payment}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column: Room Schedules & Facilities */}
          <div className="dmr-card-box">
            <div className="dmr-box-header">
              <h2 className="dmr-box-title">
                🏢 Phòng Học &amp; Computer Lab
              </h2>
              <span className="dmr-box-tag">Trạng thái phòng</span>
            </div>

            <div className="dmr-item-list">
              {roomStatus.map((r) => (
                <div key={r.id} className="dmr-list-card">
                  <div className="dmr-list-info">
                    <span className="dmr-list-title" style={{ fontSize: '0.88rem' }}>
                      {r.room}
                    </span>
                    <span className="dmr-list-sub" style={{ fontSize: '0.75rem' }}>
                      {r.event} • ⏰ {r.time}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#A0EC1D' }}>
                      📍 {r.campus}
                    </span>
                  </div>
                  <span
                    className={`dmr-badge ${
                      r.status === 'Đang sử dụng' ? 'dmr-badge-orange' : 'dmr-badge-success'
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <button
                type="button"
                className="dmr-dash-btn dmr-dash-btn-secondary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => alert('Mở sơ đồ phân bổ cơ sở vật chất toàn hệ thống...')}
              >
                🗺️ Xem Sơ Đồ Phòng Trống
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default StaffDashboard;
