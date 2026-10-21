import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export type StudentTab = 'overview' | 'courses' | 'schedule' | 'assignments' | 'grades';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<StudentTab>('overview');

  useEffect(() => {
    const tabParam = searchParams.get('tab') as StudentTab | null;
    if (tabParam && ['overview', 'courses', 'schedule', 'assignments', 'grades'].includes(tabParam)) {
      setActiveTab(tabParam);
    } else {
      setActiveTab('overview');
    }
  }, [searchParams]);

  const handleTabChange = (newTab: StudentTab) => {
    setActiveTab(newTab);
    if (newTab === 'overview') {
      setSearchParams({});
    } else {
      setSearchParams({ tab: newTab });
    }
  };

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
      {/* ── TỔNG QUAN: CHỈ HIỂN THỊ NỘI DUNG TỔNG QUAN ── */}
      {activeTab === 'overview' && (
        <>
          {/* Welcome Banner */}
          <div className="dash-banner" style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)' }}>
            <div className="dash-banner-content">
              <div className="dash-banner-badge">
                🎓 Cổng Học Viên • EduCenter Portal
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

          {/* Quick Action Toolbar */}
          <div className="dash-actions-row">
            <Link
              to="/student/payments"
              className="dash-quick-btn primary"
              style={{ textDecoration: 'none', background: 'linear-gradient(135deg, #1e40af, #3b82f6)', color: '#fff', fontWeight: 700 }}
            >
              <span>💳</span>
              <span>Học Phí & Cổng Thanh Toán</span>
            </Link>
            <button
              type="button"
              className="dash-quick-btn"
              onClick={() => handleTabChange('courses')}
            >
              📚 Khóa học của tôi
            </button>
            <button
              type="button"
              className="dash-quick-btn"
              onClick={() => handleTabChange('assignments')}
            >
              📝 Nộp bài tập về nhà
            </button>
            <button
              type="button"
              className="dash-quick-btn"
              onClick={() => handleTabChange('schedule')}
            >
              🗓️ Xem lịch học
            </button>
            <button
              type="button"
              className="dash-quick-btn"
              onClick={() => handleTabChange('grades')}
            >
              📊 Kết quả học tập
            </button>
          </div>

          {/* Key Metrics */}
          <div className="dash-metrics-grid">
            <div className="dash-metric-card" onClick={() => handleTabChange('courses')} style={{ cursor: 'pointer' }}>
              <div className="dash-metric-info">
                <span className="dash-metric-label">Khóa học đang học</span>
                <span className="dash-metric-val">1 Khóa</span>
                <span className="dash-metric-trend up">Web Full-Stack MERN ➔</span>
              </div>
              <div className="dash-metric-icon icon-blue">📚</div>
            </div>

            <div className="dash-metric-card" onClick={() => handleTabChange('schedule')} style={{ cursor: 'pointer' }}>
              <div className="dash-metric-info">
                <span className="dash-metric-label">Tỷ lệ chuyên cần</span>
                <span className="dash-metric-val">100%</span>
                <span className="dash-metric-trend up">Đã tham gia 4/4 buổi ➔</span>
              </div>
              <div className="dash-metric-icon icon-emerald">✅</div>
            </div>

            <div className="dash-metric-card" onClick={() => handleTabChange('grades')} style={{ cursor: 'pointer' }}>
              <div className="dash-metric-info">
                <span className="dash-metric-label">Điểm trung bình (GPA)</span>
                <span className="dash-metric-val">9.0 / 10</span>
                <span className="dash-metric-trend up">⭐ Xếp loại: Xuất sắc ➔</span>
              </div>
              <div className="dash-metric-icon icon-amber">🏆</div>
            </div>

            <div className="dash-metric-card" onClick={() => handleTabChange('assignments')} style={{ cursor: 'pointer' }}>
              <div className="dash-metric-info">
                <span className="dash-metric-label">Bài tập sắp đến hạn</span>
                <span className="dash-metric-val">
                  {assignments.filter((a) => a.status === 'PENDING').length} bài
                </span>
                <span className="dash-metric-trend neutral">Hạn: 23:59 ngày 10/10 ➔</span>
              </div>
              <div className="dash-metric-icon icon-purple">⏰</div>
            </div>
          </div>

          {/* Main Two Column Grid */}
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
                  <button
                    type="button"
                    onClick={() => handleTabChange('courses')}
                    style={{ fontSize: '0.8rem', color: '#059669', background: 'none', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Xem chi tiết khóa học ➔
                  </button>
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
                        Tuần 1-3: HTML5, CSS3, JavaScript ES6+ &amp; TypeScript
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 700 }}>
                      <span>🔄</span>
                      <span style={{ color: '#6366f1' }}>
                        Tuần 4-6: Backend API RESTful với Node.js, Express &amp; MongoDB (Đang học)
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', opacity: 0.65 }}>
                      <span>⏳</span>
                      <span>Tuần 7-9: Frontend Hiện đại với React 19 &amp; State Management</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', opacity: 0.65 }}>
                      <span>⏳</span>
                      <span>Tuần 10-12: Đồ án Tốt nghiệp Thực chiến &amp; Triển khai Cloud</span>
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
        </>
      )}

      {/* ── CÁC PHẦN CHUYÊN BIỆT: CHỈ HIỂN THỊ NỘI DUNG CỦA PHẦN ĐÓ ── */}
      {activeTab !== 'overview' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <button
            type="button"
            onClick={() => handleTabChange('overview')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 16px',
              borderRadius: '8px',
              border: '1px solid #d7e3d9',
              background: '#ffffff',
              color: '#26743d',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <span>⬅</span>
            <span>Quay lại Bảng điều khiển Tổng quan</span>
          </button>
        </div>
      )}

      {/* TAB: KHÓA HỌC CỦA TÔI */}
      {activeTab === 'courses' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h2 style={{ margin: '0 0 0.35rem', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
              📚 Khóa Học Của Tôi &amp; Lộ Trình Đào Tạo
            </h2>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Theo dõi chi tiết các giai đoạn học, tiến độ hoàn thành và tài nguyên học liệu
            </span>
          </div>

          <div className="dash-card" style={{ padding: '1.5rem', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span className="badge-pill badge-green">Đang theo học</span>
                <h3 style={{ margin: '0.5rem 0 0.25rem', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  Lập trình Web Chuyên nghiệp Full-Stack (MERN)
                </h3>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Mã lớp: <strong style={{ color: '#0f172a' }}>WEB-K24-A</strong> • Giảng viên: <strong style={{ color: '#0f172a' }}>ThS. Nguyễn Văn An</strong> • Phòng học: <strong style={{ color: '#0f172a' }}>Lab 302</strong>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#047857' }}>Tiến độ: 33%</span>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>4 / 12 tuần</div>
              </div>
            </div>

            <div className="dash-progress" style={{ height: '12px', margin: '1.25rem 0' }}>
              <div className="dash-progress-fill" style={{ width: '33%' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
              <div style={{ padding: '1rem', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderTop: '4px solid #10b981' }}>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#047857' }}>✅ Giai Đoạn 1 (Tuần 1 - 3)</div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginTop: '0.25rem', color: '#0f172a' }}>HTML5, CSS3, JavaScript ES6+ &amp; TS</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.35rem' }}>Đã hoàn thành xuất sắc • Điểm Quiz: 9.5/10</div>
              </div>

              <div style={{ padding: '1rem', borderRadius: '12px', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderTop: '4px solid #059669' }}>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#047857' }}>🔄 Giai Đoạn 2 (Tuần 4 - 6) - Đang Học</div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginTop: '0.25rem', color: '#0f172a' }}>Backend RESTful API với Node.js, Express &amp; MongoDB</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.35rem' }}>Buổi 4: RESTful API &amp; Mongoose Model (Tối nay)</div>
              </div>

              <div style={{ padding: '1rem', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', opacity: 0.7 }}>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#64748b' }}>⏳ Giai Đoạn 3 (Tuần 7 - 9)</div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginTop: '0.25rem', color: '#0f172a' }}>Frontend Hiện Đại với React 19 &amp; Vite</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.35rem' }}>Sắp diễn ra vào tháng sau</div>
              </div>

              <div style={{ padding: '1rem', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', opacity: 0.7 }}>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#64748b' }}>⏳ Giai Đoạn 4 (Tuần 10 - 12)</div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginTop: '0.25rem', color: '#0f172a' }}>Đồ Án Tốt Nghiệp &amp; Triển Khai Cloud</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.35rem' }}>Bảo vệ đồ án trước hội đồng EduCenter</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="dash-quick-btn primary"
                onClick={() => alert('Đang tải toàn bộ tài liệu khóa học và slide bài giảng...')}
              >
                📥 Tải Tài Liệu &amp; Slide Bài Giảng
              </button>
              <button
                type="button"
                className="dash-quick-btn"
                onClick={() => alert('Mở kho lưu trữ GitHub của lớp học')}
              >
                💻 Kho GitHub Lớp Học
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: LỊCH HỌC */}
      {activeTab === 'schedule' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h2 style={{ margin: '0 0 0.35rem', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
              🗓️ Lịch Học &amp; Báo Cáo Chuyên Cần
            </h2>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Thời khóa biểu tuần và thông tin điểm danh các buổi học đã tham gia
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            <div className="dash-card" style={{ padding: '1.5rem', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>⏰ Buổi Học Kế Tiếp</h3>
                <span className="badge-pill badge-green">Tối nay 18:30</span>
              </div>
              <div style={{ padding: '1rem', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderLeft: '4px solid #059669' }}>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>Lớp WEB-K24-A (MERN Full-Stack)</div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.35rem' }}>
                  📍 Phòng Lab 302 • ⏰ 18:30 - 21:00
                </div>
                <div style={{ fontSize: '0.85rem', color: '#334155', marginTop: '0.5rem', fontWeight: 600 }}>
                  Chủ đề: Buổi 4 - Xây dựng RESTful API với Express và Mongoose Model
                </div>
              </div>

              <div style={{ marginTop: '1.25rem' }}>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.5rem' }}>Lịch học cố định hàng tuần:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#f1f5f9', fontSize: '0.85rem' }}>
                    <span>Thứ 2 (18:30 - 21:00)</span>
                    <strong style={{ color: '#047857' }}>Phòng Lab 302</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#f1f5f9', fontSize: '0.85rem' }}>
                    <span>Thứ 4 (18:30 - 21:00)</span>
                    <strong style={{ color: '#047857' }}>Phòng Lab 302</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#f1f5f9', fontSize: '0.85rem' }}>
                    <span>Thứ 6 (18:30 - 21:00)</span>
                    <strong style={{ color: '#047857' }}>Phòng Lab 302</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="dash-card" style={{ padding: '1.5rem', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>✅ Nhật Ký Chuyên Cần</h3>
                <span className="badge-pill badge-green">Chuyên cần 100%</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', backgroundColor: '#f8fafc', textAlign: 'left', color: '#475569' }}>
                      <th style={{ padding: '8px 10px' }}>Buổi</th>
                      <th style={{ padding: '8px 10px' }}>Ngày</th>
                      <th style={{ padding: '8px 10px' }}>Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 700 }}>Buổi 1: Tổng quan Full-Stack</td>
                      <td style={{ padding: '8px 10px', color: '#64748b' }}>01/10/2026</td>
                      <td style={{ padding: '8px 10px' }}><span className="badge-pill badge-green">Có mặt</span></td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 700 }}>Buổi 2: HTML5 &amp; CSS3 Nâng cao</td>
                      <td style={{ padding: '8px 10px', color: '#64748b' }}>03/10/2026</td>
                      <td style={{ padding: '8px 10px' }}><span className="badge-pill badge-green">Có mặt</span></td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 700 }}>Buổi 3: TypeScript &amp; OOP</td>
                      <td style={{ padding: '8px 10px', color: '#64748b' }}>05/10/2026</td>
                      <td style={{ padding: '8px 10px' }}><span className="badge-pill badge-green">Có mặt</span></td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 700 }}>Buổi 4: REST API &amp; Express</td>
                      <td style={{ padding: '8px 10px', color: '#64748b' }}>Tối nay</td>
                      <td style={{ padding: '8px 10px' }}><span className="badge-pill badge-blue">Sắp diễn ra</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: BÀI TẬP VỀ NHÀ */}
      {activeTab === 'assignments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h2 style={{ margin: '0 0 0.35rem', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
              📝 Bài Tập Về Nhà &amp; Thực Hành
            </h2>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Xem hạn nộp, nộp link bài làm và theo dõi nhận xét chi tiết của giảng viên
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
            {assignments.map((item) => (
              <div
                key={item.id}
                className="dash-card"
                style={{
                  padding: '1.25rem',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  borderTop: item.status === 'PENDING' ? '4px solid #ea580c' : '4px solid #059669',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#047857', backgroundColor: '#ecfdf5', padding: '2px 8px', borderRadius: '6px' }}>
                      {item.course}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.deadline}</span>
                  </div>
                  <h3 style={{ margin: '0.5rem 0', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.35 }}>
                    {item.title}
                  </h3>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0' }}>
                  <div>
                    {item.status === 'PENDING' ? (
                      <span className="badge-pill badge-amber">Chưa nộp</span>
                    ) : (
                      <span className="badge-pill badge-green">Đã nộp • Điểm: {item.score}</span>
                    )}
                  </div>
                  {item.status === 'PENDING' ? (
                    <button
                      type="button"
                      onClick={() => handleSubmitAssignment(item.id)}
                      className="dash-quick-btn primary"
                      style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}
                    >
                      🚀 Nộp bài ngay
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => alert('Xem chi tiết nhận xét của giảng viên')}
                      className="dash-quick-btn"
                      style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
                    >
                      👁️ Xem nhận xét
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: KẾT QUẢ HỌC TẬP */}
      {activeTab === 'grades' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h2 style={{ margin: '0 0 0.35rem', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
              📊 Bảng Điểm &amp; Kết Quả Học Tập
            </h2>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Tổng hợp điểm các bài tập, đánh giá chuyên cần và xếp loại học tập
            </span>
          </div>

          <div className="dash-card" style={{ padding: '1.5rem', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <span className="badge-pill badge-green">⭐ Xếp loại: Xuất sắc</span>
                <h3 style={{ margin: '0.4rem 0 0', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                  Điểm Trung Bình Tích Lũy (GPA): <span style={{ color: '#047857' }}>9.0 / 10</span>
                </h3>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Cập nhật lần cuối: Kỳ đánh giá Đợt 4 • Năm 2026
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', backgroundColor: '#f8fafc', textAlign: 'left', color: '#475569' }}>
                    <th style={{ padding: '10px 14px' }}>Nội Dung Đánh Giá</th>
                    <th style={{ padding: '10px 14px' }}>Trọng Số</th>
                    <th style={{ padding: '10px 14px' }}>Điểm Đạt Được</th>
                    <th style={{ padding: '10px 14px' }}>Trạng Thái</th>
                    <th style={{ padding: '10px 14px' }}>Nhận Xét Của Giảng Viên</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>
                      Bài tập 1: Giao diện Responsive HTML5/CSS3
                    </td>
                    <td style={{ padding: '12px 14px', color: '#64748b' }}>20%</td>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: '#047857' }}>9.0 / 10</td>
                    <td style={{ padding: '12px 14px' }}><span className="badge-pill badge-green">Đạt xuất sắc</span></td>
                    <td style={{ padding: '12px 14px', color: '#475569', fontSize: '0.82rem' }}>
                      Code CSS clean, giao diện chuẩn responsive trên mọi thiết bị.
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>
                      Điểm danh &amp; Tham gia thảo luận trên lớp
                    </td>
                    <td style={{ padding: '12px 14px', color: '#64748b' }}>10%</td>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: '#047857' }}>10 / 10</td>
                    <td style={{ padding: '12px 14px' }}><span className="badge-pill badge-green">100% Chuyên cần</span></td>
                    <td style={{ padding: '12px 14px', color: '#475569', fontSize: '0.82rem' }}>
                      Đi học đúng giờ, tích cực phát biểu và hỗ trợ bạn học.
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>
                      Bài tập 2: RESTful API với Express &amp; MongoDB
                    </td>
                    <td style={{ padding: '12px 14px', color: '#64748b' }}>20%</td>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: '#d97706' }}>Chờ chấm</td>
                    <td style={{ padding: '12px 14px' }}><span className="badge-pill badge-amber">Đang chấm</span></td>
                    <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '0.82rem' }}>—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;

