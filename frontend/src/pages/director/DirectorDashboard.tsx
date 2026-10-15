import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import dashboardService from '../../services/dashboard.service';
import type { DirectorDashboardData } from '../../services/dashboard.service';
import '../dashboard/Dashboard.css';

const DEFAULT_CAMPUS_STATS = [
  { id: 'cau-giay', name: 'Cơ sở 1: Cầu Giấy (Trụ sở)', students: 540, classes: 18, revenue: '890.000.000 ₫', fillRate: 94, status: 'Hoạt động tốt' },
  { id: 'ha-dong', name: 'Cơ sở 2: Hà Đông (Galaxy 3)', students: 380, classes: 12, revenue: '640.000.000 ₫', fillRate: 88, status: 'Hoạt động tốt' },
  { id: 'thanh-xuan', name: 'Cơ sở 3: Thanh Xuân (VNT Tower)', students: 310, classes: 10, revenue: '520.000.000 ₫', fillRate: 82, status: 'Bình thường' },
  { id: 'hcm', name: 'Cơ sở 4: TP. HCM (Quận 10)', students: 198, classes: 8, revenue: '400.000.000 ₫', fillRate: 91, status: 'Tăng trưởng nhanh' },
];

const DEFAULT_APPROVALS = [
  { id: 1, title: 'Mở thêm lớp IELTS Master 8.0+ Ca Tối (Cơ sở Cầu Giấy)', time: 'Hôm nay, 09:30', status: 'Đã duyệt' },
  { id: 2, title: 'Ký thỏa thuận đối tác Khảo thí với British Council Q4/2026', time: 'Hôm qua, 15:45', status: 'Đã ký kết' },
  { id: 3, title: 'Khen thưởng Đội ngũ GV đạt 100% học viên target band 7.5+', time: '13/10/2026', status: 'Hoàn tất' },
  { id: 4, title: 'Đề xuất nâng cấp 30 bộ máy tính phòng Computer Mock Test', time: '12/10/2026', status: 'Chờ duyệt' },
];

export const DirectorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [selectedCampus, setSelectedCampus] = useState('all');
  const [dashboardData, setDashboardData] = useState<DirectorDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await dashboardService.getDirectorDashboard();
        if (isMounted) {
          setDashboardData(res);
        }
      } catch (err) {
        console.warn('Could not fetch director dashboard from backend, using default fallback:', err);
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
  const campusStats = dashboardData?.campusStats?.length ? dashboardData.campusStats : DEFAULT_CAMPUS_STATS;
  const approvals = dashboardData?.recentApprovals?.length ? dashboardData.recentApprovals : DEFAULT_APPROVALS;


  return (
    <div className="dmr-dashboard-wrapper">
      <div className="dmr-dashboard-container">
        
        {/* Top Header */}
        <div className="dmr-dash-header">
          <div className="dmr-dash-welcome">
            <span className="dmr-dash-role-badge">👔 Ban Giám Đốc • Điều Hành Trung Tâm</span>
            <h1 className="dmr-dash-title">Báo Cáo Vận Hành Toàn Hệ Thống</h1>
            <p className="dmr-dash-subtitle">
              Xin chào, <strong>{user?.fullName || 'Nguyễn Minh Công (Giám đốc)'}</strong> • Dữ liệu cập nhật theo thời gian thực
            </p>
          </div>

          <div className="dmr-dash-actions">
            <button
              type="button"
              className="dmr-dash-btn dmr-dash-btn-secondary"
              onClick={() => alert('Đang xuất báo cáo tài chính & đào tạo định dạng Excel...')}
            >
              📥 Xuất báo cáo Excel
            </button>
            <button
              type="button"
              className="dmr-dash-btn dmr-dash-btn-primary"
              onClick={() => alert('Chức năng phê duyệt nhanh đang hoạt động!')}
            >
              ⚡ Phê duyệt mở lớp mới
            </button>
          </div>
        </div>

        {/* 4 KPI Metrics */}
        <div className="dmr-kpi-grid">
          <div className="dmr-kpi-card">
            <div className="dmr-kpi-icon" style={{ background: 'rgba(236, 110, 35, 0.2)', borderColor: '#EC6E23' }}>
              💰
            </div>
            <div className="dmr-kpi-info">
              <span className="dmr-kpi-value">{loading ? '...' : (stats?.revenue || '2.45 Tỷ ₫')}</span>
              <span className="dmr-kpi-label">Doanh thu tháng 10</span>
              <span className="dmr-kpi-trend dmr-trend-up">{stats?.revenueGrowth || '▲ +14.8% so với tháng trước'}</span>
            </div>
          </div>

          <div className="dmr-kpi-card">
            <div className="dmr-kpi-icon">👩‍🎓</div>
            <div className="dmr-kpi-info">
              <span className="dmr-kpi-value">{loading ? '...' : (stats?.totalStudents?.toLocaleString('vi-VN') || '1,428')}</span>
              <span className="dmr-kpi-label">Tổng học viên Active</span>
              <span className="dmr-kpi-trend dmr-trend-up">▲ {stats?.totalEnrollments ? `${stats.totalEnrollments} hồ sơ nhập học` : '+86 học viên tuần này'}</span>
            </div>
          </div>

          <div className="dmr-kpi-card">
            <div className="dmr-kpi-icon" style={{ background: 'rgba(160, 236, 29, 0.2)', borderColor: '#A0EC1D' }}>
              👨‍🏫
            </div>
            <div className="dmr-kpi-info">
              <span className="dmr-kpi-value">{loading ? '...' : (stats?.totalTeachers || 42)}</span>
              <span className="dmr-kpi-label">Giảng viên IELTS 8.5+</span>
              <span className="dmr-kpi-trend dmr-trend-highlight">★ 100% đạt chuẩn quốc tế</span>
            </div>
          </div>

          <div className="dmr-kpi-card">
            <div className="dmr-kpi-icon">🎯</div>
            <div className="dmr-kpi-info">
              <span className="dmr-kpi-value">{loading ? '...' : (stats?.targetAchievementRate || '96.8%')}</span>
              <span className="dmr-kpi-label">Tỷ lệ đạt Target Band</span>
              <span className="dmr-kpi-trend dmr-trend-up">▲ {stats?.activeClasses ? `${stats.activeClasses} lớp hoạt động` : 'Cam kết đầu ra bằng HĐ'}</span>
            </div>
          </div>
        </div>

        {/* 2-Column Section */}
        <div className="dmr-section-grid">
          
          {/* Left Table: Campus Breakdown */}
          <div className="dmr-card-box">
            <div className="dmr-box-header">
              <h2 className="dmr-box-title">
                🏢 Hiệu Quả Đào Tạo Từng Cơ Sở ({campusStats.length} Cơ Sở)
              </h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={selectedCampus}
                  onChange={(e) => setSelectedCampus(e.target.value)}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255,255,255,0.2)',
                    padding: '4px 8px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    outline: 'none',
                  }}
                >
                  <option value="all" style={{ background: '#052F2E' }}>Tất cả các Cơ sở</option>
                  {campusStats.map((c) => (
                    <option key={c.id} value={c.id} style={{ background: '#052F2E' }}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="dmr-table-responsive">
              <table className="dmr-table">
                <thead>
                  <tr>
                    <th>Cơ sở</th>
                    <th>Học viên</th>
                    <th>Số lớp</th>
                    <th>Doanh thu</th>
                    <th>Lấp đầy</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {campusStats
                    .filter((c) => selectedCampus === 'all' || c.id === selectedCampus)
                    .map((campus) => (
                      <tr key={campus.id}>
                        <td style={{ fontWeight: 700 }}>{campus.name}</td>
                        <td>{campus.students} học viên</td>
                        <td>{campus.classes} lớp</td>
                        <td style={{ color: '#FCD34D', fontWeight: 700 }}>{campus.revenue}</td>
                        <td>
                          <span>{campus.fillRate}%</span>
                          <div className="dmr-progress-bar">
                            <div className="dmr-progress-fill" style={{ width: `${campus.fillRate}%` }} />
                          </div>
                        </td>
                        <td>
                          <span className="dmr-badge dmr-badge-success">{campus.status}</span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column: Approvals & High Priority Activities */}
          <div className="dmr-card-box">
            <div className="dmr-box-header">
              <h2 className="dmr-box-title">
                ⚡ Phê Duyệt &amp; Chỉ Đạo
              </h2>
              <span className="dmr-box-tag">Tháng 10/2026</span>
            </div>

            <div className="dmr-item-list">
              {approvals.map((item) => (
                <div key={item.id} className="dmr-list-card">
                  <div className="dmr-list-info">
                    <span className="dmr-list-title">{item.title}</span>
                    <span className="dmr-list-sub">{item.time}</span>
                  </div>
                  <span
                    className={`dmr-badge ${
                      item.status === 'Chờ duyệt' ? 'dmr-badge-orange' : 'dmr-badge-success'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <button
                type="button"
                className="dmr-dash-btn dmr-dash-btn-secondary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => alert('Đang mở toàn bộ lịch trình công tác của Ban Giám Đốc...')}
              >
                📅 Xem Lịch Họp Ban Quản Trị
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default DirectorDashboard;
