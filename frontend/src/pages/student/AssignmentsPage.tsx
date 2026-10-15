import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  status: 'PENDING' | 'SUBMITTED' | 'GRADED' | 'OVERDUE';
  score?: number;
  submittedAt?: string;
  feedback?: string;
  submissionLink?: string;
}

const AssignmentsPage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'GRADED'>('ALL');
  const [showSubmitModal, setShowSubmitModal] = useState<string | null>(null);
  const [submissionLink, setSubmissionLink] = useState('');
  const [submissionNote, setSubmissionNote] = useState('');

  useEffect(() => {
    // Mock data - sẽ thay bằng API: GET /api/student/classes/:classId/assignments
    setTimeout(() => {
      const mockAssignments: Assignment[] = [
        {
          id: 'a1',
          title: 'Bài tập 2: Xây dựng RESTful API với Express và MongoDB',
          description:
            'Thiết kế và xây dựng RESTful API cho ứng dụng quản lý sách sử dụng Express, Mongoose, MongoDB Atlas. Bao gồm CRUD operations, validation, error handling.',
          dueDate: '23:59 - 10/10/2026',
          maxScore: 10,
          status: 'PENDING',
        },
        {
          id: 'a2',
          title: 'Bài tập 1: Xây dựng giao diện responsive với HTML5/CSS3',
          description: 'Thiết kế landing page responsive, áp dụng Flexbox, Grid, media queries.',
          dueDate: '02/10/2026',
          maxScore: 10,
          status: 'GRADED',
          score: 9,
          submittedAt: '01/10/2026 22:30',
          feedback: 'Bài làm tốt, giao diện đẹp. Cần cải thiện phần accessibility.',
        },
        {
          id: 'a3',
          title: 'Bài tập 3: Authentication với JWT',
          description: 'Xây dựng hệ thống đăng nhập/đăng ký với JWT, refresh token, middleware phân quyền.',
          dueDate: '23:59 - 20/10/2026',
          maxScore: 10,
          status: 'PENDING',
        },
        {
          id: 'a4',
          title: 'Bài tập 4: Upload file & Validation',
          description: 'Implement upload ảnh với Multer, validate form với Joi/Yup.',
          dueDate: '23:59 - 30/09/2026',
          maxScore: 10,
          status: 'OVERDUE',
        },
      ];
      setAssignments(mockAssignments);
      setLoading(false);
    }, 500);
  }, [classId]);

  const handleSubmit = (assignmentId: string) => {
    if (!submissionLink.trim()) {
      alert('Vui lòng nhập link bài nộp!');
      return;
    }
    setAssignments((prev) =>
      prev.map((a) =>
        a.id === assignmentId
          ? {
              ...a,
              status: 'SUBMITTED',
              submittedAt: new Date().toLocaleString('vi-VN'),
              submissionLink,
            }
          : a
      )
    );
    setShowSubmitModal(null);
    setSubmissionLink('');
    setSubmissionNote('');
    alert('Đã nộp bài tập thành công! Giảng viên sẽ chấm điểm sớm.');
  };

  if (loading) {
    return (
      <div className="dash-container">
        <div className="dash-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Đang tải danh sách bài tập...</p>
        </div>
      </div>
    );
  }

  const filtered = assignments.filter((a) => {
    if (filter === 'ALL') return true;
    if (filter === 'PENDING') return a.status === 'PENDING' || a.status === 'OVERDUE' || a.status === 'SUBMITTED';
    if (filter === 'GRADED') return a.status === 'GRADED';
    return true;
  });

  const stats = {
    total: assignments.length,
    pending: assignments.filter((a) => a.status === 'PENDING').length,
    submitted: assignments.filter((a) => a.status === 'SUBMITTED').length,
    graded: assignments.filter((a) => a.status === 'GRADED').length,
    overdue: assignments.filter((a) => a.status === 'OVERDUE').length,
  };

  return (
    <div className="dash-container">
      {/* ── Banner ── */}
      <div className="dash-banner">
        <div className="dash-banner-content">
          <div className="dash-banner-badge">📝 Bài Tập Về Nhà • EduCenter Portal</div>
          <h1>Bài tập của bạn</h1>
          <p>Theo dõi và nộp các bài tập về nhà. Đừng quên deadline nhé!</p>
        </div>
        <div className="dash-banner-right">
          <div className="dash-date-pill">
            <div>📚 Lớp: WEB-K24-A</div>
            <div className="sub">{stats.total} bài tập tổng</div>
          </div>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="dash-metrics-grid">
        <div className="dash-metric-card">
          <div className="dash-metric-info">
            <span className="dash-metric-label">Tổng bài tập</span>
            <span className="dash-metric-val">{stats.total} bài</span>
            <span className="dash-metric-trend up">Đã giao</span>
          </div>
          <div className="dash-metric-icon icon-blue">📚</div>
        </div>
        <div className="dash-metric-card">
          <div className="dash-metric-info">
            <span className="dash-metric-label">Cần nộp</span>
            <span className="dash-metric-val">{stats.pending} bài</span>
            <span className="dash-metric-trend down">Chưa hoàn thành</span>
          </div>
          <div className="dash-metric-icon icon-amber">⏰</div>
        </div>
        <div className="dash-metric-card">
          <div className="dash-metric-info">
            <span className="dash-metric-label">Đã nộp</span>
            <span className="dash-metric-val">{stats.submitted} bài</span>
            <span className="dash-metric-trend neutral">Chờ chấm</span>
          </div>
          <div className="dash-metric-icon icon-purple">📤</div>
        </div>
        <div className="dash-metric-card">
          <div className="dash-metric-info">
            <span className="dash-metric-label">Đã chấm</span>
            <span className="dash-metric-val">{stats.graded} bài</span>
            <span className="dash-metric-trend up">Có điểm</span>
          </div>
          <div className="dash-metric-icon icon-emerald">🏆</div>
        </div>
      </div>

      {/* ── Filter + List ── */}
      <div className="dash-card">
        <div className="dash-card-header">
          <h2 className="dash-card-title">
            <span>📋</span> Danh Sách Bài Tập
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link
              to={`/student/classes/${classId}`}
              className="dash-quick-btn"
              style={{ textDecoration: 'none', padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
            >
              ← Quay lại
            </Link>
            {(['ALL', 'PENDING', 'GRADED'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`dash-quick-btn ${filter === f ? 'primary' : ''}`}
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
              >
                {f === 'ALL' ? 'Tất cả' : f === 'PENDING' ? 'Cần làm' : 'Đã chấm'}
              </button>
            ))}
          </div>
        </div>

        <div className="dash-item-list">
          {filtered.map((a) => (
            <div key={a.id} className="dash-subcard">
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
                  <h3 className="dash-subcard-title" style={{ margin: 0 }}>
                    {a.title}
                  </h3>
                  <p style={{ fontSize: '0.85rem', opacity: 0.75, margin: '0.5rem 0' }}>
                    {a.description}
                  </p>
                  <div className="dash-subcard-meta">
                    ⏰ <strong>Hạn nộp:</strong> {a.dueDate}
                  </div>
                  {a.submittedAt && (
                    <div className="dash-subcard-meta">
                      📤 <strong>Đã nộp:</strong> {a.submittedAt}
                    </div>
                  )}
                  {a.feedback && (
                    <div
                      className="dash-subcard"
                      style={{
                        marginTop: '0.5rem',
                        background: 'rgba(16, 185, 129, 0.08)',
                        borderLeft: '3px solid #10b981',
                        padding: '0.5rem 0.75rem',
                      }}
                    >
                      <strong style={{ fontSize: '0.8rem', color: '#10b981' }}>💬 Nhận xét:</strong>
                      <p style={{ fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>{a.feedback}</p>
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  {a.status === 'PENDING' && (
                    <span className="badge-pill badge-amber">⏳ Chưa nộp</span>
                  )}
                  {a.status === 'SUBMITTED' && (
                    <span className="badge-pill badge-blue">📤 Chờ chấm</span>
                  )}
                  {a.status === 'GRADED' && (
                    <div>
                      <span className="badge-pill badge-green">✅ Đã chấm</span>
                      <div
                        style={{
                          fontSize: '1.5rem',
                          fontWeight: 800,
                          color: '#10b981',
                          marginTop: '0.25rem',
                        }}
                      >
                        {a.score} / {a.maxScore}
                      </div>
                    </div>
                  )}
                  {a.status === 'OVERDUE' && (
                    <span className="badge-pill" style={{ background: '#ef4444', color: 'white' }}>
                      ⚠️ Quá hạn
                    </span>
                  )}
                </div>
              </div>

              {(a.status === 'PENDING' || a.status === 'OVERDUE') && (
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(a.id)}
                  className="dash-quick-btn primary"
                  style={{ marginTop: '0.75rem' }}
                >
                  📤 Nộp Bài Tập
                </button>
              )}

              {a.status === 'SUBMITTED' && a.submissionLink && (
                <a
                  href={a.submissionLink}
                  target="_blank"
                  rel="noreferrer"
                  className="dash-quick-btn"
                  style={{ marginTop: '0.75rem', textDecoration: 'none', display: 'inline-block' }}
                >
                  🔗 Xem bài đã nộp
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Submit Modal ── */}
      {showSubmitModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowSubmitModal(null)}
        >
          <div
            className="dash-card"
            style={{ maxWidth: '500px', width: '90%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 1rem 0' }}>📤 Nộp bài tập</h3>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                Link GitHub / Google Drive / URL bài nộp: <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="url"
                value={submissionLink}
                onChange={(e) => setSubmissionLink(e.target.value)}
                placeholder="https://github.com/username/repo"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                Ghi chú (tùy chọn):
              </label>
              <textarea
                value={submissionNote}
                onChange={(e) => setSubmissionNote(e.target.value)}
                placeholder="Mô tả ngắn về bài làm..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  resize: 'vertical',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowSubmitModal(null)}
                className="dash-quick-btn"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => handleSubmit(showSubmitModal)}
                className="dash-quick-btn primary"
              >
                ✅ Xác nhận nộp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentsPage;
