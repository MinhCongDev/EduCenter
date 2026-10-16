import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { studentService } from '../../services/student.service';
import { useToast } from '../../contexts/ToastContext';
import type { Assignment, SubmissionStatus } from '../../types';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { EmptyState, SkeletonPage } from '../../components/Skeleton';
import { formatDate, isPast } from '../../utils/format';

type FilterKey = 'ALL' | 'PENDING' | 'SUBMITTED' | 'GRADED';

const statusOf = (s?: SubmissionStatus | null) => {
  if (!s) return { label: 'Chưa nộp', cls: 'badge-amber', icon: '⏳' };
  if (s === 'GRADED') return { label: 'Đã chấm', cls: 'badge-blue', icon: '🏆' };
  if (s === 'LATE') return { label: 'Nộp trễ', cls: 'badge-purple', icon: '⏰' };
  return { label: 'Đã nộp', cls: 'badge-green', icon: '✅' };
};

const AssignmentsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('ALL');
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState<string | null>(null);

  // Form state
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState<string>('ALL');

  useEffect(() => {
    if (id) fetchAssignments();
  }, [id]);

  const fetchAssignments = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const res = await studentService.getAssignments(id);
      if (res.success && res.data) setAssignments(res.data.assignments);
      else toast.error(res.message || 'Không thể tải bài tập');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể tải bài tập');
    } finally {
      setIsLoading(false);
    }
  };

  const openSubmitModal = (assignmentId: string) => {
    setShowModal(assignmentId);
    setContent('');
    setFile(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const closeModal = () => {
    if (submitting) return;
    setShowModal(null);
  };

  const handleSubmit = async () => {
    if (!showModal) return;
    if (!file && !content.trim()) {
      toast.warning('Vui lòng đính kèm file hoặc nhập nội dung');
      return;
    }
    try {
      setSubmitting(true);
      const res = await studentService.submitAssignment(showModal, { file, content });
      if (res.success) {
        toast.success(res.message || 'Nộp bài thành công');
        setShowModal(null);
        await fetchAssignments();
      } else {
        toast.error(res.message || 'Nộp bài thất bại');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Nộp bài thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  // ── M5: search & filter (skill + status + free text) ──
  const filtered = assignments.filter((a) => {
    if (filter === 'ALL') {
      // skip status filter
    } else if (filter === 'PENDING') {
      if (a.submissionStatus) return false;
    } else if (filter === 'GRADED') {
      if (a.submissionStatus !== 'GRADED') return false;
    } else {
      // SUBMITTED
      if (!(a.submissionStatus === 'SUBMITTED' || a.submissionStatus === 'LATE')) return false;
    }
    if (skillFilter !== 'ALL' && a.skill !== skillFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const hay = [a.title, a.description, a.skill].filter(Boolean).join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const skillOptions: { value: string; label: string }[] = [
    { value: 'ALL', label: 'Tất cả kỹ năng' },
    { value: 'LISTENING', label: '🎧 Listening' },
    { value: 'READING', label: '📖 Reading' },
    { value: 'WRITING', label: '✍️ Writing' },
    { value: 'SPEAKING', label: '🎤 Speaking' },
    { value: 'OVERALL', label: '📚 Overall' },
    { value: 'VOCABULARY', label: '📝 Vocabulary' },
    { value: 'GRAMMAR', label: '🔤 Grammar' },
    { value: 'OTHER', label: '📌 Khác' },
  ];

  const tabs: { key: FilterKey; label: string; count: number }[] = [
    { key: 'ALL', label: 'Tất cả', count: assignments.length },
    { key: 'PENDING', label: 'Chưa nộp', count: assignments.filter((a) => !a.submissionStatus).length },
    {
      key: 'SUBMITTED',
      label: 'Đã nộp',
      count: assignments.filter((a) => a.submissionStatus === 'SUBMITTED' || a.submissionStatus === 'LATE').length,
    },
    { key: 'GRADED', label: 'Đã chấm', count: assignments.filter((a) => a.submissionStatus === 'GRADED').length },
  ];

  if (isLoading) return <SkeletonPage message="Đang tải bài tập..." />;

  const currentAssignment = assignments.find((a) => a._id === showModal);

  return (
    <div className="dash-container">
      <div className="dash-banner">
        <div className="dash-banner-content">
          <div className="dash-banner-badge">📝 Bài Tập</div>
          <h1>Bài Tập Lớp Học</h1>
          <p>
            {assignments.length > 0
              ? `Tổng cộng ${assignments.length} bài tập. Đã nộp: ${
                  assignments.filter((a) => a.submissionStatus).length
                }`
              : 'Chưa có bài tập nào cho lớp này.'}
          </p>
        </div>
        <div className="dash-banner-right">
          <div className="dash-date-pill">
            <div>📝 {assignments.filter((a) => !a.submissionStatus).length} chưa nộp</div>
            <div className="sub">Lớp ID: {id}</div>
          </div>
        </div>
      </div>

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

      {assignments.length > 0 && (
        <div className="dash-metrics-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Tổng bài tập</span>
              <span className="dash-metric-val">{assignments.length}</span>
              <span className="dash-metric-trend up">
                Đã nộp: {assignments.filter((a) => a.submissionStatus).length}
              </span>
            </div>
            <div className="dash-metric-icon icon-blue">📝</div>
          </div>
          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Chưa nộp</span>
              <span className="dash-metric-val">
                {assignments.filter((a) => !a.submissionStatus).length}
              </span>
              <span className="dash-metric-trend">Cần hoàn thành sớm</span>
            </div>
            <div className="dash-metric-icon icon-amber">⏳</div>
          </div>
          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Đã chấm điểm</span>
              <span className="dash-metric-val">
                {assignments.filter((a) => a.submissionStatus === 'GRADED').length}
              </span>
              <span className="dash-metric-trend">
                {assignments.filter((a) => a.submissionStatus === 'GRADED').length > 0
                  ? 'Chúc mừng! 🎉'
                  : 'Chờ giảng viên chấm'}
              </span>
            </div>
            <div className="dash-metric-icon icon-emerald">🏆</div>
          </div>
        </div>
      )}

      {assignments.length > 0 && (
        <div className="dash-card" style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(200px, 2fr) minmax(160px, 1fr) auto',
              gap: '0.75rem',
              alignItems: 'center',
              marginBottom: '0.75rem',
            }}
          >
            <input
              type="text"
              placeholder="🔍 Tìm theo tiêu đề, mô tả..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: '0.9rem',
              }}
            />
            <select
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: '0.9rem',
                background: 'white',
              }}
            >
              {skillOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
              {filtered.length}/{assignments.length} bài
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`dash-quick-btn ${filter === tab.key ? 'primary' : ''}`}
                style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon="📭"
          title="Không có bài tập"
          description="Không có bài tập nào phù hợp với bộ lọc hiện tại."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map((a) => {
            const status = statusOf(a.submissionStatus);
            const past = !a.submissionStatus && isPast(a.dueDate);
            return (
              <div key={a._id} className="dash-card">
                <div className="dash-card-header">
                  <h2 className="dash-card-title">
                    <span>{status.icon}</span>
                    {a.title}
                  </h2>
                  <span className={`badge-pill ${past ? 'badge-purple' : status.cls}`}>
                    {past ? '⏰ Quá hạn' : status.label}
                  </span>
                </div>

                <div className="dash-subcard">
                  {a.description && (
                    <div style={{ marginBottom: '1rem' }}>
                      <div className="dash-subcard-label">Mô tả</div>
                      <div className="dash-subcard-value">{a.description}</div>
                    </div>
                  )}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                      gap: '0.75rem 1.5rem',
                      marginBottom: '1rem',
                    }}
                  >
                    <Field label="Kỹ năng" value={a.skill || '—'} />
                    <Field
                      label="Hạn nộp"
                      value={
                        <span style={{ color: past ? '#ef4444' : 'inherit' }}>
                          {formatDate(a.dueDate, true)}
                          {past && ' ⚠️'}
                        </span>
                      }
                    />
                    <Field label="Điểm tối đa" value={a.maxScore} />
                    {a.submissionStatus === 'GRADED' && a.score !== undefined && (
                      <Field
                        label="Điểm của bạn"
                        value={
                          <span style={{ color: '#3b82f6', fontWeight: 700 }}>
                            {a.score} / {a.maxScore}
                          </span>
                        }
                      />
                    )}
                    {a.submissionDate && (
                      <Field label="Ngày nộp" value={formatDate(a.submissionDate, true)} />
                    )}
                  </div>

                  {a.feedback && (
                    <div
                      style={{
                        background: 'rgba(59,130,246,0.06)',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        marginBottom: '1rem',
                      }}
                    >
                      <div className="dash-subcard-label">💬 Nhận xét</div>
                      <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: '#475569' }}>
                        {a.feedback}
                      </div>
                    </div>
                  )}

                  {!a.submissionStatus ? (
                    <Button variant="primary" onClick={() => openSubmitModal(a._id)}>
                      📤 Nộp bài ngay
                    </Button>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span className={`badge-pill ${status.cls}`}>
                        {status.icon} {status.label}
                        {a.submissionStatus === 'GRADED' && a.score !== undefined && ` — ${a.score} điểm`}
                      </span>
                      {a.submissionStatus !== 'GRADED' && !past && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openSubmitModal(a._id)}
                        >
                          🔄 Nộp lại
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submit Modal */}
      <Modal
        isOpen={!!showModal}
        onClose={closeModal}
        icon="📤"
        title="Nộp bài tập"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal} disabled={submitting}>
              Hủy
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={submitting}
              icon="📤"
            >
              Xác nhận nộp
            </Button>
          </>
        }
      >
        {currentAssignment && (
          <>
            <div style={{ marginBottom: '1rem' }}>
              <div className="dash-subcard-label">Bài tập</div>
              <div className="dash-subcard-value" style={{ fontWeight: 700 }}>
                {currentAssignment.title}
              </div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label className="dash-subcard-label">Đính kèm file (tùy chọn)</label>
              <input
                ref={fileRef}
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  border: '1px dashed #cbd5e1',
                  background: '#f8fafc',
                  marginTop: '0.25rem',
                  fontFamily: 'inherit',
                }}
              />
              {file && (
                <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '0.25rem' }}>
                  ✓ Đã chọn: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </div>
              )}
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                Hỗ trợ: PDF, Word, Excel, hình ảnh, zip. Tối đa 20MB.
              </div>
            </div>
            <div>
              <label className="dash-subcard-label">Ghi chú (tùy chọn)</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Mô tả ngắn về bài làm, link Google Drive, v.v..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  fontSize: '0.9rem',
                  marginTop: '0.25rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

const Field: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div>
    <div className="dash-subcard-label">{label}</div>
    <div className="dash-subcard-value">{value || '—'}</div>
  </div>
);

export default AssignmentsPage;
