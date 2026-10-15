import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

interface GradeItem {
  assignmentId: string;
  assignmentTitle: string;
  maxScore: number;
  score?: number;
  feedback?: string;
  submittedAt?: string;
  gradedAt?: string;
  weight: number;
}

const GradesPage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - sẽ thay bằng API: GET /api/student/classes/:classId/grades
    setTimeout(() => {
      const mockGrades: GradeItem[] = [
        {
          assignmentId: 'a1',
          assignmentTitle: 'Bài tập 1: HTML5/CSS3 Responsive',
          maxScore: 10,
          score: 9,
          feedback: 'Bài làm tốt, giao diện đẹp. Cần cải thiện phần accessibility.',
          submittedAt: '01/10/2026 22:30',
          gradedAt: '03/10/2026 14:00',
          weight: 10,
        },
        {
          assignmentId: 'a2',
          assignmentTitle: 'Bài tập Lab 1: JavaScript ES6+',
          maxScore: 10,
          score: 8.5,
          feedback: 'Code sạch, logic rõ ràng. Có thể tối ưu thêm về performance.',
          submittedAt: '08/10/2026 23:15',
          gradedAt: '10/10/2026 10:30',
          weight: 10,
        },
        {
          assignmentId: 'a3',
          assignmentTitle: 'Bài tập Lab 2: TypeScript cơ bản',
          maxScore: 10,
          score: 9.5,
          feedback: 'Xuất sắc! Sử dụng types rất chặt chẽ.',
          submittedAt: '12/10/2026 20:00',
          gradedAt: '13/10/2026 09:15',
          weight: 10,
        },
        {
          assignmentId: 'a4',
          assignmentTitle: 'Kiểm tra giữa kỳ',
          maxScore: 10,
          score: 8.75,
          feedback: 'Hiểu bài tốt, cần luyện thêm phần async/await.',
          submittedAt: '15/10/2026 23:50',
          gradedAt: '17/10/2026 16:00',
          weight: 30,
        },
        {
          assignmentId: 'a5',
          assignmentTitle: 'Bài tập nhóm: RESTful API Project',
          maxScore: 10,
          weight: 20,
        },
      ];
      setGrades(mockGrades);
      setLoading(false);
    }, 500);
  }, [classId]);

  if (loading) {
    return (
      <div className="dash-container">
        <div className="dash-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Đang tải bảng điểm...</p>
        </div>
      </div>
    );
  }

  // Tính toán
  const gradedItems = grades.filter((g) => g.score !== undefined);
  const totalScore = gradedItems.reduce((sum, g) => sum + (g.score || 0) * g.weight, 0);
  const totalWeight = gradedItems.reduce((sum, g) => sum + g.weight, 0);
  const weightedGPA = totalWeight > 0 ? (totalScore / totalWeight).toFixed(2) : '0.00';

  const classification =
    parseFloat(weightedGPA) >= 9
      ? { label: 'Xuất sắc', color: '#10b981', emoji: '🌟' }
      : parseFloat(weightedGPA) >= 8
        ? { label: 'Giỏi', color: '#3b82f6', emoji: '🎯' }
        : parseFloat(weightedGPA) >= 6.5
          ? { label: 'Khá', color: '#f59e0b', emoji: '📘' }
          : { label: 'Trung bình', color: '#ef4444', emoji: '📚' };

  return (
    <div className="dash-container">
      {/* ── Banner ── */}
      <div className="dash-banner">
        <div className="dash-banner-content">
          <div className="dash-banner-badge">🏆 Bảng Điểm • EduCenter Portal</div>
          <h1>Kết quả học tập của bạn</h1>
          <p>Theo dõi điểm số, nhận xét từ giảng viên cho từng bài tập và kiểm tra.</p>
        </div>
        <div className="dash-banner-right">
          <div className="dash-date-pill">
            <div>📚 Lớp: WEB-K24-A</div>
            <div className="sub">MERN Full-Stack</div>
          </div>
        </div>
      </div>

      {/* ── GPA Hero Card ── */}
      <div
        className="dash-card"
        style={{
          background: `linear-gradient(135deg, ${classification.color}22 0%, ${classification.color}11 100%)`,
          borderLeft: `4px solid ${classification.color}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '0.25rem' }}>
              🎓 Điểm trung bình (GPA) - Hệ số
            </div>
            <div
              style={{
                fontSize: '3rem',
                fontWeight: 800,
                color: classification.color,
                lineHeight: 1,
              }}
            >
              {weightedGPA} <span style={{ fontSize: '1.5rem', opacity: 0.5 }}>/ 10</span>
            </div>
            <div
              style={{
                fontSize: '1.2rem',
                fontWeight: 700,
                color: classification.color,
                marginTop: '0.5rem',
              }}
            >
              {classification.emoji} Xếp loại: {classification.label}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>Đã chấm</div>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>
              {gradedItems.length} <span style={{ fontSize: '1rem', opacity: 0.5 }}>/ {grades.length}</span>
            </div>
            <div style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: '0.5rem' }}>
              Tổng trọng số: {totalWeight}%
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="dash-metrics-grid">
        <div className="dash-metric-card">
          <div className="dash-metric-info">
            <span className="dash-metric-label">Điểm cao nhất</span>
            <span className="dash-metric-val">
              {gradedItems.length > 0 ? Math.max(...gradedItems.map((g) => g.score || 0)) : 0} / 10
            </span>
            <span className="dash-metric-trend up">Tuyệt vời!</span>
          </div>
          <div className="dash-metric-icon icon-emerald">🌟</div>
        </div>
        <div className="dash-metric-card">
          <div className="dash-metric-info">
            <span className="dash-metric-label">Điểm thấp nhất</span>
            <span className="dash-metric-val">
              {gradedItems.length > 0 ? Math.min(...gradedItems.map((g) => g.score || 0)) : 0} / 10
            </span>
            <span className="dash-metric-trend neutral">Cần cố gắng</span>
          </div>
          <div className="dash-metric-icon icon-amber">📊</div>
        </div>
        <div className="dash-metric-card">
          <div className="dash-metric-info">
            <span className="dash-metric-label">Điểm TB</span>
            <span className="dash-metric-val">
              {gradedItems.length > 0
                ? (gradedItems.reduce((s, g) => s + (g.score || 0), 0) / gradedItems.length).toFixed(2)
                : '0.00'}
            </span>
            <span className="dash-metric-trend up">Cải thiện</span>
          </div>
          <div className="dash-metric-icon icon-blue">📈</div>
        </div>
        <div className="dash-metric-card">
          <div className="dash-metric-info">
            <span className="dash-metric-label">Tỷ lệ đạt</span>
            <span className="dash-metric-val">
              {gradedItems.length > 0
                ? Math.round((gradedItems.filter((g) => (g.score || 0) >= 5).length / gradedItems.length) * 100)
                : 0}
              %
            </span>
            <span className="dash-metric-trend up">Tốt</span>
          </div>
          <div className="dash-metric-icon icon-purple">✅</div>
        </div>
      </div>

      {/* ── Grade List ── */}
      <div className="dash-card">
        <div className="dash-card-header">
          <h2 className="dash-card-title">
            <span>📋</span> Chi Tiết Điểm Từng Bài
          </h2>
          <Link
            to={`/student/classes/${classId}`}
            className="dash-quick-btn"
            style={{ textDecoration: 'none', padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
          >
            ← Quay lại
          </Link>
        </div>

        <div className="dash-item-list">
          {grades.map((g) => (
            <div key={g.assignmentId} className="dash-subcard">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <div style={{ flex: 1, minWidth: '250px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <h3 className="dash-subcard-title" style={{ margin: 0 }}>
                      {g.assignmentTitle}
                    </h3>
                    <span className="badge-pill badge-purple">Trọng số: {g.weight}%</span>
                  </div>
                  {g.submittedAt && (
                    <div className="dash-subcard-meta" style={{ marginTop: '0.4rem' }}>
                      📤 Nộp: {g.submittedAt} • ✅ Chấm: {g.gradedAt}
                    </div>
                  )}
                  {g.feedback && (
                    <div
                      className="dash-subcard"
                      style={{
                        marginTop: '0.5rem',
                        background: 'rgba(99, 102, 241, 0.08)',
                        borderLeft: '3px solid #6366f1',
                        padding: '0.5rem 0.75rem',
                      }}
                    >
                      <strong style={{ fontSize: '0.8rem', color: '#6366f1' }}>💬 Nhận xét của GV:</strong>
                      <p style={{ fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>{g.feedback}</p>
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  {g.score !== undefined ? (
                    <div>
                      <div
                        style={{
                          fontSize: '2rem',
                          fontWeight: 800,
                          color: g.score >= 8 ? '#10b981' : g.score >= 5 ? '#f59e0b' : '#ef4444',
                          lineHeight: 1,
                        }}
                      >
                        {g.score}
                      </div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>/ {g.maxScore}</div>
                      <div
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          marginTop: '0.25rem',
                          color: g.score >= 8 ? '#10b981' : g.score >= 5 ? '#f59e0b' : '#ef4444',
                        }}
                      >
                        {g.score >= 9 ? '🌟 Xuất sắc' : g.score >= 8 ? '🎯 Giỏi' : g.score >= 6.5 ? '📘 Khá' : g.score >= 5 ? '📗 TB' : '⚠️ Yếu'}
                      </div>
                    </div>
                  ) : (
                    <span className="badge-pill badge-amber">⏳ Chờ chấm</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GradesPage;
