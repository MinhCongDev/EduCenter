import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();

  const [assignments, setAssignments] = useState([
    {
      id: 'ASM-1',
      title: 'Bài tập 2: Xây dựng RESTful API với Express và MongoDB',
      course: 'Lập trình Web Full-Stack MERN',
      deadline: '23:59 - 10/10/2026',
      status: 'PENDING',
    },
    {
      id: 'ASM-2',
      title: 'Bài tập 1: Xây dựng giao diện responsive với HTML5/CSS3',
      course: 'Lập trình Web Full-Stack MERN',
      deadline: '02/10/2026',
      status: 'SUBMITTED',
      score: '9.0 / 10',
    },
  ]);

  const handleSubmitAssignment = (id: string) => {
    const link = prompt('Dán link GitHub repo hoặc bài nộp của bạn:', 'https://github.com/my-student-repo');
    if (link) {
      setAssignments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'SUBMITTED', score: 'Chờ chấm' } : a))
      );
      alert('Đã nộp bài tập thành công! Giảng viên sẽ chấm điểm sớm.');
    }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

  return (
    <div className="dash-container">
      {/* ── Welcome Banner ── */}
      <div className="dash-banner" style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)' }}>
        <div className="dash-banner-content">
          <div className="dash-banner-badge">
            Cổng Học Viên • EduCenter Portal
          </div>
          <h1>{greeting}, {user?.fullName || 'Học viên'}!</h1>
          <p>Chúc bạn một tuần học tập hiệu quả. Bạn có 1 buổi học diễn ra vào tối nay!</p>
        </div>
        <div className="dash-banner-right">
          <div className="dash-date-pill">
            <div>Trạng thái: Đang theo học</div>
            <div className="sub">Kỳ tuyển sinh Đợt 4 • Năm 2026</div>
          </div>
        </div>
      </div>

      {/* ── Quick Action Toolbar ── */}
      <div className="dash-actions-row">
        <button
          type="button"
          className="dash-quick-btn primary"
          onClick={() => alert('Mở danh sách khóa học của tôi')}
        >
          Khóa học của tôi
        </button>
        <button
          type="button"
          className="dash-quick-btn"
          onClick={() => alert('Chuyển tới danh sách bài tập cần hoàn thành')}
        >
          Nộp bài tập về nhà
        </button>
        <button
          type="button"
          className="dash-quick-btn"
          onClick={() => alert('Mở bảng theo dõi chuyên cần và lịch học')}
        >
          Xem lịch học
        </button>
        <button
          type="button"
          className="dash-quick-btn"
          onClick={() => alert('Mở bảng điểm và kết quả học tập')}
        >
          Kết quả học tập
        </button>
      </div>

      {/* ── Key Metrics ── */}
      <div className="dash-metrics-grid">
        <div className="dash-metric-card">
          <div className="dash-metric-info">
            <span className="dash-metric-label">Khóa học đang học</span>
            <span className="dash-metric-val">1 Khóa</span>
            <span className="dash-metric-trend up">Web Full-Stack MERN</span>
          </div>
          <div className="dash-metric-icon icon-blue">📚</div>
        </div>

        <div className="dash-metric-card">
          <div className="dash-metric-info">
            <span className="dash-metric-label">Tỷ lệ chuyên cần</span>
            <span className="dash-metric-val">100%</span>
            <span className="dash-metric-trend up">Đã tham gia 4/4 buổi</span>
          </div>
          <div className="dash-metric-icon icon-emerald">✅</div>
        </div>

        <div className="dash-metric-card">
          <div className="dash-metric-info">
            <span className="dash-metric-label">Điểm trung bình (GPA)</span>
            <span className="dash-metric-val">9.0 / 10</span>
            <span className="dash-metric-trend up">⭐ Xếp loại: Xuất sắc</span>
          </div>
          <div className="dash-metric-icon icon-amber">🏆</div>
        </div>

        <div className="dash-metric-card">
          <div className="dash-metric-info">
            <span className="dash-metric-label">Bài tập sắp đến hạn</span>
            <span className="dash-metric-val">
              {assignments.filter((a) => a.status === 'PENDING').length} bài
            </span>
            <span className="dash-metric-trend neutral">Hạn: 23:59 ngày 10/10</span>
          </div>
          <div className="dash-metric-icon icon-purple">⏰</div>
        </div>
      </div>

      {/* ── Main Two Column Grid ── */}
      <div className="dash-two-col">
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Upcoming Class Session */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h2 className="dash-card-title">
                <span>⏰</span> Buổi Học Kế Tiếp
              </h2>
              <span className="badge-pill badge-green">Tối nay lúc 18:30</span>
            </div>

            <div className="dash-subcard">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 className="dash-subcard-title">
                    Lập trình Web Chuyên nghiệp Full-Stack (MERN)
                  </h3>
                  <div className="dash-subcard-meta" style={{ marginTop: '0.25rem' }}>
                    Mã lớp: <strong>WEB-K24-A</strong> • Giảng viên: <strong>ThS. Nguyễn Văn An</strong>
                  </div>
                </div>
                <span className="badge-pill badge-blue">Phòng Lab 302</span>
              </div>

              <div className="dash-subcard-body">
                🎯 <strong>Nội dung buổi học:</strong> Buổi 4: Xây dựng RESTful API với Express và Mongoose Model, kết nối MongoDB Atlas.
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="dash-quick-btn primary"
                  onClick={() => alert('Mở slide bài giảng buổi 4')}
                >
                  📥 Tải Slide Bài Giảng
                </button>
                <button
                  type="button"
                  className="dash-quick-btn"
                  onClick={() => alert('Xem bài tập thực hành trên lớp')}
                >
                  📝 Đề Bài Lab 4
                </button>
              </div>
            </div>
          </div>

          {/* Enrolled Courses & Progress */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h2 className="dash-card-title">
                <span>📚</span> Tiến Độ Khóa Học Của Tôi
              </h2>
              <span className="badge-pill badge-purple">4 / 12 tuần (33%)</span>
            </div>

            <div className="dash-subcard">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700 }}>Lớp WEB-K24-A (Khóa MERN Full-Stack)</span>
                <span style={{ fontWeight: 700, color: '#6366f1' }}>33% Hoàn thành</span>
              </div>
              <div className="dash-progress" style={{ height: '10px' }}>
                <div className="dash-progress-fill" style={{ width: '33%' }} />
              </div>

              <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <span>✅</span>
                  <span style={{ opacity: 0.7, textDecoration: 'line-through' }}>
                    Tuần 1-3: HTML5, CSS3, JavaScript ES6+ & TypeScript
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 700 }}>
                  <span>🔄</span>
                  <span style={{ color: '#6366f1' }}>
                    Tuần 4-6: Backend API RESTful với Node.js, Express & MongoDB (Đang học)
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', opacity: 0.65 }}>
                  <span>⏳</span>
                  <span>Tuần 7-9: Frontend Hiện đại với React 19 & State Management</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', opacity: 0.65 }}>
                  <span>⏳</span>
                  <span>Tuần 10-12: Đồ án Tốt nghiệp Thực chiến & Triển khai Cloud</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Assignments Due */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h2 className="dash-card-title">
                <span>📝</span> Bài Tập Về Nhà
              </h2>
              <span className="badge-pill badge-amber">
                {assignments.filter((a) => a.status === 'PENDING').length} cần nộp
              </span>
            </div>

            <div className="dash-item-list">
              {assignments.map((item) => (
                <div key={item.id} className="dash-item">
                  <div className="dash-item-main">
                    <div className="dash-item-icon">
                      {item.status === 'PENDING' ? '⏳' : '✅'}
                    </div>
                    <div>
                      <div className="dash-item-title">{item.title}</div>
                      <div className="dash-item-sub">Hạn nộp: {item.deadline}</div>
                    </div>
                  </div>

                  <div>
                    {item.status === 'PENDING' ? (
                      <button
                        type="button"
                        onClick={() => handleSubmitAssignment(item.id)}
                        className="dash-quick-btn primary"
                        style={{ padding: '0.35rem 0.85rem', fontSize: '0.775rem' }}
                      >
                        Nộp bài
                      </button>
                    ) : (
                      <span className="badge-pill badge-green">
                        {item.score || 'Đã nộp'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Announcements */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h2 className="dash-card-title">
                <span>📢</span> Thông Báo Từ Trung Tâm
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="dash-subcard" style={{ borderLeft: '4px solid #6366f1' }}>
                <strong className="dash-subcard-title" style={{ fontSize: '0.9rem' }}>
                  Khai giảng các lớp chuyên đề công nghệ tháng 11
                </strong>
                <p className="dash-subcard-meta" style={{ margin: 0, lineHeight: 1.5 }}>
                  Học viên EduCenter được ưu đãi 20% học phí khi đăng ký thêm khóa thứ 2.
                </p>
              </div>

              <div className="dash-subcard" style={{ borderLeft: '4px solid #10b981' }}>
                <strong className="dash-subcard-title" style={{ fontSize: '0.9rem' }}>
                  Hướng dẫn sử dụng hệ thống Portal EduCenter
                </strong>
                <p className="dash-subcard-meta" style={{ margin: 0, lineHeight: 1.5 }}>
                  Học viên có thể tra cứu lịch học, xem danh sách bài tập và nộp bài trực tiếp qua đây.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
