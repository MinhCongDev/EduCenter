import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();

  const [submissions, setSubmissions] = useState([
    {
      id: 'SUB-101',
      studentName: 'Phạm Hải Đăng',
      classCode: 'WEB-K24-A',
      assignmentTitle: 'Bài tập 2: Xây dựng REST API Express & MongoDB',
      submittedAt: 'Hôm nay, 10:15',
      score: null as number | null,
    },
    {
      id: 'SUB-102',
      studentName: 'Vũ Ngọc Mai',
      classCode: 'WEB-K24-A',
      assignmentTitle: 'Bài tập 2: Xây dựng REST API Express & MongoDB',
      submittedAt: 'Hôm qua, 22:30',
      score: null as number | null,
    },
    {
      id: 'SUB-103',
      studentName: 'Đỗ Tuấn Kiệt',
      classCode: 'AI-K12-B',
      assignmentTitle: 'Bài tập 1: Tiền xử lý dữ liệu với Pandas & NumPy',
      submittedAt: '05/10/2026',
      score: 9.0,
    },
  ]);

  const handleGrade = (id: string) => {
    const scoreStr = prompt('Nhập điểm cho học viên (thang điểm 10):', '8.5');
    if (scoreStr !== null && !isNaN(Number(scoreStr))) {
      setSubmissions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, score: parseFloat(scoreStr) } : s))
      );
    }
  };

  return (
    <div className="dash-container">
      {/* ── Welcome Banner ── */}
      <div className="dash-banner" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #2563eb 100%)' }}>
        <div className="dash-banner-content">
          <div className="dash-banner-badge">
            👨‍🏫 Cổng Giảng Viên • Quản Lý Giảng Dạy
          </div>
          <h1>Xin chào Thầy/Cô, {user?.fullName || 'Giảng viên'}!</h1>
          <p>Xem lịch giảng dạy, điểm danh lớp học, giao bài tập và chấm điểm học viên.</p>
        </div>
        <div className="dash-banner-right">
          <div className="dash-date-pill">
            <div>⏰ Ca dạy kế tiếp: 18:30 Tối nay</div>
            <div className="sub">Phòng Lab 302 • Lớp WEB-K24-A</div>
          </div>
        </div>
      </div>

      {/* ── Quick Action Toolbar ── */}
      <div className="dash-actions-row">
        <button
          type="button"
          className="dash-quick-btn primary"
          onClick={() => alert('Mở giao diện điểm danh sinh viên buổi hôm nay')}
        >
          <span>✅</span>
          <span>Điểm Danh Buổi Học Hôm Nay</span>
        </button>
        <button
          type="button"
          className="dash-quick-btn"
          onClick={() => alert('Mở form tạo bài tập mới cho lớp')}
        >
          <span>📝</span>
          <span>Giao Bài Tập Mới</span>
        </button>
        <button
          type="button"
          className="dash-quick-btn"
          onClick={() => alert('Đang mở thư viện tài liệu bài giảng')}
        >
          <span>📁</span>
          <span>Tải Lên Slide / Tài Liệu</span>
        </button>
        <button
          type="button"
          className="dash-quick-btn"
          onClick={() => alert('Mở bảng nhập điểm tổng kết học phần')}
        >
          <span>📊</span>
          <span>Bảng Điểm Quá Trình</span>
        </button>
      </div>

      {/* ── Key Metrics ── */}
      <div className="dash-metrics-grid">
        <div className="dash-metric-card">
          <div className="dash-metric-info">
            <span className="dash-metric-label">Lớp đang giảng dạy</span>
            <span className="dash-metric-val">2 lớp</span>
            <span className="dash-metric-trend up">WEB-K24 & AI-K12</span>
          </div>
          <div className="dash-metric-icon icon-blue">🏫</div>
        </div>

        <div className="dash-metric-card">
          <div className="dash-metric-info">
            <span className="dash-metric-label">Tổng học viên</span>
            <span className="dash-metric-val">42 học viên</span>
            <span className="dash-metric-trend up">Tỷ lệ chuyên cần 96%</span>
          </div>
          <div className="dash-metric-icon icon-emerald">👥</div>
        </div>

        <div className="dash-metric-card">
          <div className="dash-metric-info">
            <span className="dash-metric-label">Bài tập chờ chấm</span>
            <span className="dash-metric-val">
              {submissions.filter((s) => s.score === null).length} bài
            </span>
            <span className="dash-metric-trend up">Hạn nộp vừa kết thúc</span>
          </div>
          <div className="dash-metric-icon icon-amber">📝</div>
        </div>

        <div className="dash-metric-card">
          <div className="dash-metric-info">
            <span className="dash-metric-label">Đánh giá trung bình</span>
            <span className="dash-metric-val">4.9 / 5.0</span>
            <span className="dash-metric-trend neutral">⭐ 38 lượt đánh giá</span>
          </div>
          <div className="dash-metric-icon icon-purple">🌟</div>
        </div>
      </div>

      {/* ── Main Two Column Grid ── */}
      <div className="dash-two-col">
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Today & Upcoming Classes */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h2 className="dash-card-title">
                <span>📅</span> Lịch Dạy Trong Tuần
              </h2>
              <span className="badge-pill badge-green">Hôm nay có 1 ca dạy</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="dash-subcard" style={{ borderLeft: '4px solid #2563eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="badge-pill badge-blue">18:30 - 21:00 (Tối nay)</span>
                    <strong className="dash-subcard-title">Lớp WEB-K24-A (Phòng Lab 302)</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => alert('Mở danh sách sinh viên lớp WEB-K24-A để điểm danh')}
                    className="dash-quick-btn primary"
                    style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
                  >
                    Điểm danh ngay
                  </button>
                </div>
                <div className="dash-subcard-body">
                  📖 <strong>Chủ đề buổi học:</strong> Buổi 4 - Thiết kế RESTful API với Express và Mongoose Model
                </div>
                <div className="dash-subcard-meta">
                  Sĩ số: 22/25 học viên • Trạng thái: Chưa điểm danh
                </div>
              </div>

              <div className="dash-subcard">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="badge-pill badge-amber">19:00 - 21:30 (Thứ 5)</span>
                    <strong className="dash-subcard-title">Lớp AI-K12-B (Phòng Lab 405)</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => alert('Xem chi tiết lớp')}
                    className="dash-quick-btn"
                    style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem' }}
                  >
                    Xem lớp
                  </button>
                </div>
                <div className="dash-subcard-meta">
                  📖 Chủ đề: Buổi 5 - Xử lý ảnh số & thị giác máy tính OpenCV
                </div>
              </div>
            </div>
          </div>

          {/* Pending Grading Submissions */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h2 className="dash-card-title">
                <span>📝</span> Bài Nộp Chờ Giảng Viên Chấm Điểm
              </h2>
              <span className="badge-pill badge-amber">
                {submissions.filter((s) => s.score === null).length} bài chưa chấm
              </span>
            </div>

            <div className="dash-table-wrapper">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Học viên</th>
                    <th>Lớp</th>
                    <th>Tên bài tập</th>
                    <th>Điểm số</th>
                    <th style={{ textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub) => (
                    <tr key={sub.id}>
                      <td>
                        <strong>{sub.studentName}</strong>
                        <div className="dash-subcard-meta">{sub.submittedAt}</div>
                      </td>
                      <td>
                        <span className="badge-pill badge-blue">{sub.classCode}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{sub.assignmentTitle}</div>
                      </td>
                      <td>
                        {sub.score !== null ? (
                          <span className="badge-pill badge-green">
                            {sub.score} / 10
                          </span>
                        ) : (
                          <span className="badge-pill badge-amber">Chưa chấm</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleGrade(sub.id)}
                          className={sub.score !== null ? 'dash-quick-btn' : 'dash-quick-btn primary'}
                          style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}
                        >
                          {sub.score !== null ? 'Sửa điểm' : 'Chấm điểm'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Teaching Progress */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h2 className="dash-card-title">
                <span>📈</span> Tiến Độ Giảng Dạy
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="dash-subcard">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700 }}>
                  <span>WEB-K24-A (Web Full-Stack)</span>
                  <span style={{ color: '#3b82f6' }}>4 / 12 Tuần (33%)</span>
                </div>
                <div className="dash-progress">
                  <div className="dash-progress-fill" style={{ width: '33%', background: '#3b82f6' }} />
                </div>
              </div>

              <div className="dash-subcard">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700 }}>
                  <span>AI-K12-B (Python AI)</span>
                  <span style={{ color: '#10b981' }}>6 / 10 Tuần (60%)</span>
                </div>
                <div className="dash-progress">
                  <div className="dash-progress-fill" style={{ width: '60%', background: '#10b981' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Student Feedback */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h2 className="dash-card-title">
                <span>💬</span> Đánh Giá Gần Đây
              </h2>
            </div>
            <div className="dash-item-list">
              <div className="dash-subcard">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <strong style={{ fontSize: '0.85rem' }}>Học viên (Lớp Web K24)</strong>
                  <span style={{ color: '#f59e0b', fontSize: '0.8rem' }}>⭐⭐⭐⭐⭐</span>
                </div>
                <p className="dash-subcard-meta" style={{ margin: 0, fontStyle: 'italic', lineHeight: 1.5 }}>
                  &ldquo;Thầy giảng phần kiến trúc MVC và MongoDB rất thực tế, bài tập về nhà dễ hiểu!&rdquo;
                </p>
              </div>

              <div className="dash-subcard">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <strong style={{ fontSize: '0.85rem' }}>Học viên (Lớp AI K12)</strong>
                  <span style={{ color: '#f59e0b', fontSize: '0.8rem' }}>⭐⭐⭐⭐⭐</span>
                </div>
                <p className="dash-subcard-meta" style={{ margin: 0, fontStyle: 'italic', lineHeight: 1.5 }}>
                  &ldquo;Phần code demo Scikit-learn rất chi tiết, bài giảng chất lượng cao.&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
