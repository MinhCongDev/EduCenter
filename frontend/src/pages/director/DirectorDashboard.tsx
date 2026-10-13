import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const DirectorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState([
    {
      id: 'AP-101',
      title: 'Mở thêm lớp cấp tốc Python & AI (K13-C)',
      proposer: 'Trần Thị Thu Thảo (Giáo vụ)',
      date: 'Hôm nay, 09:30',
      status: 'PENDING',
    },
    {
      id: 'AP-102',
      title: 'Học bổng khuyến học 20% cho học viên khó khăn (Vũ Ngọc Mai)',
      proposer: 'Phòng Đào tạo',
      date: 'Hôm qua, 15:45',
      status: 'PENDING',
    },
    {
      id: 'AP-103',
      title: 'Duyệt bảng điểm tốt nghiệp lớp Web Full-Stack K23',
      proposer: 'ThS. Nguyễn Văn An (Giảng viên)',
      date: '06/10/2026',
      status: 'APPROVED',
    },
  ]);

  const handleApprove = (id: string) => {
    setApprovals((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'APPROVED' } : item))
    );
  };

  const handleReject = (id: string) => {
    setApprovals((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'REJECTED' } : item))
    );
  };

  const currentDate = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="dash-container">
      {/* ── Welcome Banner ── */}
      <div className="dash-banner">
        <div className="dash-banner-content">
          <div className="dash-banner-badge">👔 Ban Giám Đốc • Điều Hành Trung Tâm</div>
          <h1>Kính chào, {user?.fullName || 'Giám đốc'}!</h1>
          <p>Hệ thống ghi nhận hoạt động đào tạo và vận hành ổn định trong kỳ này.</p>
        </div>
        <div className="dash-banner-right">
          <div className="dash-date-pill">
            <div>📅 {currentDate}</div>
            <div className="sub">Học kỳ Thu - Đông 2026</div>
          </div>
        </div>
      </div>

      {/* ── Key Metrics ── */}
      <div className="dash-metrics-grid">
        <div className="dash-metric-card">
          <div className="dash-metric-info">
            <span className="dash-metric-label">Doanh thu quý hiện tại</span>
            <span className="dash-metric-val">168.500.000 đ</span>
            <span className="dash-metric-trend up">↗ +16.4% so với quý trước</span>
          </div>
          <div className="dash-metric-icon icon-emerald">💰</div>
        </div>

        <div className="dash-metric-card">
          <div className="dash-metric-info">
            <span className="dash-metric-label">Tổng học viên đang học</span>
            <span className="dash-metric-val">186</span>
            <span className="dash-metric-trend up">↗ +28 học viên mới</span>
          </div>
          <div className="dash-metric-icon icon-blue">🎓</div>
        </div>

        <div className="dash-metric-card">
          <div className="dash-metric-info">
            <span className="dash-metric-label">Lớp học đang vận hành</span>
            <span className="dash-metric-val">12 lớp</span>
            <span className="dash-metric-trend up">↗ 92% công suất phòng</span>
          </div>
          <div className="dash-metric-icon icon-purple">🏫</div>
        </div>

        <div className="dash-metric-card">
          <div className="dash-metric-info">
            <span className="dash-metric-label">Tỷ lệ tốt nghiệp có việc</span>
            <span className="dash-metric-val">95.8%</span>
            <span className="dash-metric-trend neutral">⭐ Đánh giá 4.85 / 5.0</span>
          </div>
          <div className="dash-metric-icon icon-amber">🏆</div>
        </div>
      </div>

      {/* ── Main Two Column Grid ── */}
      <div className="dash-two-col">
        {/* Left Col */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Revenue by Course */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h2 className="dash-card-title">
                <span>📊</span> Doanh Thu & Tỷ Trọng Theo Khóa Học
              </h2>
              <span className="dash-subcard-meta">Tháng 10/2026</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="dash-subcard">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: 700 }}>
                  <span>Lập trình Web Full-Stack MERN (8.500.000 đ/học viên)</span>
                  <span style={{ color: '#6366f1' }}>76.500.000 đ (48%)</span>
                </div>
                <div className="dash-progress">
                  <div className="dash-progress-fill" style={{ width: '48%' }} />
                </div>
              </div>

              <div className="dash-subcard">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: 700 }}>
                  <span>Lập trình Python & Ứng dụng AI (7.800.000 đ/học viên)</span>
                  <span style={{ color: '#06b6d4' }}>54.600.000 đ (34%)</span>
                </div>
                <div className="dash-progress">
                  <div className="dash-progress-fill" style={{ width: '34%', background: 'linear-gradient(90deg, #06b6d4, #10b981)' }} />
                </div>
              </div>

              <div className="dash-subcard">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: 700 }}>
                  <span>Thiết kế Giao diện UI/UX Chuyên nghiệp (6.500.000 đ/học viên)</span>
                  <span style={{ color: '#f59e0b' }}>29.250.000 đ (18%)</span>
                </div>
                <div className="dash-progress">
                  <div className="dash-progress-fill" style={{ width: '18%', background: 'linear-gradient(90deg, #f59e0b, #ec4899)' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Pending Approvals */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h2 className="dash-card-title">
                <span>📑</span> Đề Xuất & Phê Duyệt Của Ban Giám Đốc
              </h2>
              <span className="badge-pill badge-amber">
                {approvals.filter((a) => a.status === 'PENDING').length} cần xử lý
              </span>
            </div>

            <div className="dash-table-wrapper">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Mã</th>
                    <th>Nội dung đề xuất</th>
                    <th>Người gửi</th>
                    <th>Trạng thái</th>
                    <th style={{ textAlign: 'right' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {approvals.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 700, color: '#6366f1' }}>{item.id}</td>
                      <td>
                        <strong>{item.title}</strong>
                        <div className="dash-subcard-meta">{item.date}</div>
                      </td>
                      <td>{item.proposer}</td>
                      <td>
                        {item.status === 'PENDING' && <span className="badge-pill badge-amber">Chờ duyệt</span>}
                        {item.status === 'APPROVED' && <span className="badge-pill badge-green">Đã duyệt</span>}
                        {item.status === 'REJECTED' && <span className="badge-pill badge-red">Từ chối</span>}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {item.status === 'PENDING' ? (
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={() => handleApprove(item.id)}
                              className="dash-quick-btn primary"
                              style={{ padding: '0.3rem 0.7rem', fontSize: '0.75rem' }}
                            >
                              Duyệt
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReject(item.id)}
                              className="dash-quick-btn"
                              style={{ padding: '0.3rem 0.7rem', fontSize: '0.75rem', color: '#ef4444' }}
                            >
                              Bác
                            </button>
                          </div>
                        ) : (
                          <span className="dash-subcard-meta">Đã hoàn tất</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Executive Quick Actions */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h2 className="dash-card-title">
                <span>⚡</span> Thao Tác Quản Trị
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <button
                type="button"
                className="dash-quick-btn primary"
                onClick={() => alert('Đang tạo file Excel báo cáo doanh thu quý...')}
              >
                <span>📥</span>
                <span>Xuất Báo Cáo Tài Chính (Excel)</span>
              </button>
              <button
                type="button"
                className="dash-quick-btn"
                onClick={() => alert('Chức năng cấp phát & ký chứng chỉ tốt nghiệp điện tử.')}
              >
                <span>📜</span>
                <span>Ký Duyệt Chứng Chỉ Tốt Nghiệp</span>
              </button>
              <button
                type="button"
                className="dash-quick-btn"
                onClick={() => alert('Mở bảng cấu hình chính sách học phí và chỉ tiêu.')}
              >
                <span>⚙️</span>
                <span>Cấu hình Chỉ tiêu & Học phí</span>
              </button>
            </div>
          </div>

          {/* Top Instructors */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h2 className="dash-card-title">
                <span>🌟</span> Giảng Viên Tiêu Biểu
              </h2>
            </div>
            <div className="dash-item-list">
              <div className="dash-item">
                <div className="dash-item-main">
                  <div className="dash-item-icon">👨‍🏫</div>
                  <div>
                    <div className="dash-item-title">ThS. Nguyễn Văn An</div>
                    <div className="dash-item-sub">Lập trình Web • 4 lớp active</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, color: '#f59e0b', fontSize: '0.9rem' }}>⭐ 4.9 / 5.0</div>
                  <div className="dash-subcard-meta">98% phản hồi tốt</div>
                </div>
              </div>

              <div className="dash-item">
                <div className="dash-item-main">
                  <div className="dash-item-icon">🤖</div>
                  <div>
                    <div className="dash-item-title">TS. Lê Hoàng Bách</div>
                    <div className="dash-item-sub">Python AI • 3 lớp active</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, color: '#f59e0b', fontSize: '0.9rem' }}>⭐ 4.8 / 5.0</div>
                  <div className="dash-subcard-meta">95% phản hồi tốt</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Notice */}
          <div className="dash-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem' }}>📢</span>
              <strong className="dash-subcard-title">Nhắc việc ban giám đốc</strong>
            </div>
            <p className="dash-subcard-body" style={{ margin: 0 }}>
              Cuộc họp giao ban định kỳ với phòng Giáo vụ và các Trưởng bộ môn lúc <strong>16:00 chiều nay</strong> tại Phòng Hội thảo 1.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DirectorDashboard;
