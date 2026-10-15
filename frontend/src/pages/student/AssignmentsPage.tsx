import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { studentService } from '../../services/student.service';
import type { AssignmentItem } from '../../types';

const AssignmentsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'SUBMITTED' | 'GRADED'>('ALL');
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [submitNote, setSubmitNote] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchAssignments();
  }, [id]);

  const fetchAssignments = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await studentService.getAssignments(id);
      if (res.success && res.data) setAssignments(res.data.assignments);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Không thể tải bài tập');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (assignmentId: string) => {
    try {
      setSubmittingId(assignmentId);
      await studentService.submitAssignment(assignmentId, new FormData());
      await fetchAssignments();
      setShowSubmitModal(null);
      setSubmitNote('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Nộp bài thất bại');
    } finally {
      setSubmittingId(null);
    }
  };

  const filtered = assignments.filter(a => {
    if (filter === 'ALL') return true;
    if (filter === 'PENDING') return !a.submissionStatus;
    return a.submissionStatus === filter;
  });

  const statusConfig = (s?: string) => {
    if (!s) return { label: 'Chưa nộp', cls: 'badge-amber', icon: '⏳' };
    if (s === 'GRADED') return { label: `Đã chấm: ${s}`, cls: 'badge-blue', icon: '🏆' };
    if (s === 'LATE') return { label: 'Nộp trễ', cls: 'badge-purple', icon: '⏰' };
    return { label: 'Đã nộp', cls: 'badge-green', icon: '✅' };
  };

  const filterTabs: { key: typeof filter; label: string }[] = [
    { key: 'ALL', label: `Tất cả (${assignments.length})` },
    { key: 'PENDING', label: `Chưa nộp (${assignments.filter(a => !a.submissionStatus).length})` },
    { key: 'SUBMITTED', label: `Đã nộp (${assignments.filter(a => a.submissionStatus === 'SUBMITTED' || a.submissionStatus === 'LATE').length})` },
    { key: 'GRADED', label: `Đã chấm (${assignments.filter(a => a.submissionStatus === 'GRADED').length})` },
  ];

  if (isLoading) {
    return (
      <div className="dash-container" style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p>Đang tải bài tập...</p>
      </div>
    );
  }

  return (
    <div className="dash-container">
      {/* ── Page Header ── */}
      <div className="dash-banner">
        <div className="dash-banner-content">
          <div className="dash-banner-badge">📝 Bài Tập</div>
          <h1>Bài Tập Lớp Học</h1>
          <p>
            {assignments.length > 0
              ? `Tổng cộng ${assignments.length} bài tập. Đã nộp: ${assignments.filter(a => a.submissionStatus).length}`
              : 'Chưa có bài tập nào cho lớp này.'}
          </p>
        </div>
        <div className="dash-banner-right">
          <div className="dash-date-pill">
            <div>📝 {assignments.filter(a => !a.submissionStatus).length} chưa nộp</div>
            <div className="sub">Lớp ID: {id}</div>
          </div>
        </div>
      </div>

      {/* ── Quick Nav ── */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <Link to={`/student/classes/${id}`} className="dash-quick-btn" style={{ textDecoration: 'none' }}>
          ← Chi Tiết Lớp
        </Link>
        <Link to={`/student/classes/${id}/attendance`} className="dash-quick-btn" style={{ textDecoration: 'none' }}>
          📅 Điểm Danh
        </Link>
        <Link to={`/student/classes/${id}/grades`} className="dash-quick-btn" style={{ textDecoration: 'none' }}>
          📊 Bảng Điểm
        </Link>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(239,68,68,0.1)', borderRadius: '12px', marginBottom: '1.5rem' }}>
          <p style={{ color: '#ef4444', marginBottom: '0.75rem' }}>{error}</p>
          <button className="dash-quick-btn primary" onClick={fetchAssignments}>Thử lại</button>
        </div>
      )}

      {/* ── Metrics ── */}
      {assignments.length > 0 && (
        <div className="dash-metrics-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Tổng bài tập</span>
              <span className="dash-metric-val">{assignments.length}</span>
              <span className="dash-metric-trend up">Đã nộp: {assignments.filter(a => a.submissionStatus).length}</span>
            </div>
            <div className="dash-metric-icon icon-blue">📝</div>
          </div>
          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Chưa nộp</span>
              <span className="dash-metric-val">{assignments.filter(a => !a.submissionStatus).length}</span>
              <span className="dash-metric-trend">
                Cần hoàn thành sớm
              </span>
            </div>
            <div className="dash-metric-icon icon-amber">⏳</div>
          </div>
          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Đã chấm điểm</span>
              <span className="dash-metric-val">{assignments.filter(a => a.submissionStatus === 'GRADED').length}</span>
              <span className="dash-metric-trend">
                {assignments.filter(a => a.submissionStatus === 'GRADED').length > 0 ? 'Chúc mừng! 🎉' : 'Chờ giảng viên chấm'}
              </span>
            </div>
            <div className="dash-metric-icon icon-emerald">🏆</div>
          </div>
        </div>
      )}

      {/* ── Filter Tabs ── */}
      {assignments.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {filterTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`dash-quick-btn ${filter === tab.key ? 'primary' : ''}`}
              style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Assignment List ── */}
      {filtered.length === 0 && !isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--dash-card-subtle)', borderRadius: '16px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
          <h2>Không có bài tập</h2>
          <p style={{ opacity: 0.7 }}>Không có bài tập nào phù hợp với bộ lọc hiện tại.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map((a) => {
            const status = statusConfig(a.submissionStatus);
            const isPastDue = !a.submissionStatus && new Date(a.dueDate) < new Date();
            return (
              <div key={a._id} className="dash-card">
                <div className="dash-card-header">
                  <h2 className="dash-card-title">
                    <span>{status.icon}</span>
                    {a.title}
                  </h2>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span className={`badge-pill ${isPastDue ? 'badge-purple' : status.cls}`}>
                      {isPastDue ? '⏰ Quá hạn' : status.label}
                    </span>
                  </div>
                </div>

                <div className="dash-subcard">
                  {a.description && (
                    <div style={{ marginBottom: '1rem' }}>
                      <div className="dash-subcard-label">Mô tả</div>
                      <div className="dash-subcard-value">{a.description}</div>
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem 1.5rem', marginBottom: '1rem' }}>
                    <div>
                      <div className="dash-subcard-label">Kỹ năng</div>
                      <div className="dash-subcard-value">{a.skill || '—'}</div>
                    </div>
                    <div>
                      <div className="dash-subcard-label">Hạn nộp</div>
                      <div className="dash-subcard-value" style={{ color: isPastDue ? '#ef4444' : 'inherit' }}>
                        {new Date(a.dueDate).toLocaleDateString('vi-VN')}
                        {isPastDue && ' ⚠️'}
                      </div>
                    </div>
                    <div>
                      <div className="dash-subcard-label">Điểm tối đa</div>
                      <div className="dash-subcard-value">{a.maxScore}</div>
                    </div>
                    {a.submissionStatus === 'GRADED' && a.score !== undefined && (
                      <div>
                        <div className="dash-subcard-label">Điểm của bạn</div>
                        <div className="dash-subcard-value" style={{ color: '#3b82f6', fontWeight: 700 }}>
                          {a.score} / {a.maxScore}
                        </div>
                      </div>
                    )}
                    {a.submissionDate && (
                      <div>
                        <div className="dash-subcard-label">Ngày nộp</div>
                        <div className="dash-subcard-value">
                          {new Date(a.submissionDate).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                    )}
                  </div>

                  {!a.submissionStatus ? (
                    <button
                      className="dash-quick-btn primary"
                      onClick={() => handleSubmit(a._id)}
                      disabled={submittingId === a._id}
                    >
                      {submittingId === a._id ? '⏳ Đang nộp...' : '📤 Nộp bài ngay'}
                    </button>
                  ) : (
                    <span className={`badge-pill ${status.cls}`}>
                      {status.icon} {status.label}
                      {a.submissionStatus === 'GRADED' && a.score !== undefined && ` — ${a.score} điểm`}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Submit Modal ── */}
      {showSubmitModal && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000 }} onClick={() => setShowSubmitModal(null)} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            background: 'white', borderRadius: '16px', padding: '2rem', width: '90%', maxWidth: '480px',
            zIndex: 1001, boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{ marginBottom: '1rem' }}>📤 Nộp Bài Tập</h2>
            <textarea
              value={submitNote}
              onChange={e => setSubmitNote(e.target.value)}
              placeholder="Ghi chú khi nộp bài (tùy chọn)..."
              style={{ width: '100%', minHeight: '100px', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '1rem', fontFamily: 'inherit' }}
            />
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="dash-quick-btn" onClick={() => setShowSubmitModal(null)}>Hủy</button>
              <button
                className="dash-quick-btn primary"
                onClick={() => handleSubmit(showSubmitModal)}
                disabled={submittingId === showSubmitModal}
              >
                {submittingId === showSubmitModal ? 'Đang nộp...' : 'Xác nhận nộp'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AssignmentsPage;
