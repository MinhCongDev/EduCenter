import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { studentService } from '../../services/student.service';
import { useToast } from '../../contexts/ToastContext';
import type { Assignment, ClassFeedback, Enrollment } from '../../types';
import { Button } from '../../components/Button';
import { EmptyState, SkeletonPage } from '../../components/Skeleton';
import { formatDate, formatVND } from '../../utils/format';
import { classStatusMeta, tuitionStatusMeta } from '../../utils/labels';

const ClassDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const [cls, setCls] = useState<Enrollment | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── Phản hồi / đánh giá lớp học ──
  const [feedback, setFeedback] = useState<ClassFeedback | null>(null);
  const [fbRating, setFbRating] = useState(5);
  const [fbContent, setFbContent] = useState('');
  const [fbTags, setFbTags] = useState<string[]>([]);
  const [fbSubmitting, setFbSubmitting] = useState(false);

  const FEEDBACK_TAGS = [
    'Giảng viên nhiệt tình',
    'Nội dung hữu ích',
    'Lịch học ổn định',
    'Tài liệu đầy đủ',
    'Phòng học thoải mái',
    'Nhịp độ học phù hợp',
  ];

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const [clsRes, aRes, fbRes] = await Promise.all([
        studentService.getClassDetails(id),
        studentService.getAssignments(id),
        studentService.getMyClassFeedback(id).catch(() => null),
      ]);
      if (clsRes.success && clsRes.data) setCls(clsRes.data.class);
      if (aRes.success && aRes.data) setAssignments(aRes.data.assignments);
      else toast.error(clsRes.message || 'Không thể tải lớp học');
      // Nạp sẵn phản hồi đã có để học viên sửa thay vì gửi lại từ đầu.
      const mine = fbRes?.data?.items?.[0] || null;
      if (mine) {
        setFeedback(mine);
        setFbRating(mine.rating);
        setFbContent(mine.content);
        setFbTags(mine.tags || []);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể tải chi tiết lớp học');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!id) return;
    if (fbContent.trim().length < 5) {
      toast.warning('Nội dung phản hồi phải có ít nhất 5 ký tự');
      return;
    }
    try {
      setFbSubmitting(true);
      const res = await studentService.submitClassFeedback(id, {
        content: fbContent.trim(),
        rating: fbRating,
        tags: fbTags,
      });
      if (res.success && res.data?.feedback) {
        setFeedback(res.data.feedback);
        toast.success(res.message || 'Cảm ơn bạn đã gửi phản hồi!');
      } else {
        toast.error(res.message || 'Gửi phản hồi thất bại');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gửi phản hồi thất bại');
    } finally {
      setFbSubmitting(false);
    }
  };

  if (isLoading) return <SkeletonPage message="Đang tải chi tiết lớp học..." />;

  if (!cls) {
    return (
      <div className="dash-container">
        <EmptyState
          icon="❌"
          title="Không tìm thấy lớp học"
          description="Bạn không có quyền truy cập lớp học này."
          action={
            <Link to="/student/classes" className="dash-quick-btn primary" style={{ textDecoration: 'none' }}>
              ← Quay lại danh sách
            </Link>
          }
        />
      </div>
    );
  }

  const c = cls.class as any;
  const pending = assignments.filter((a) => !a.submissionStatus);
  const submitted = assignments.filter((a) => a.submissionStatus);
  const classStatus = classStatusMeta(c.status);
  const tuition = tuitionStatusMeta(cls.tuitionStatus);

  return (
    <div className="dash-container">
      <div className="dash-banner">
        <div className="dash-banner-content">
          <div className="dash-banner-badge">ℹ️ Chi Tiết Lớp Học</div>
          <h1>
            {c.course?.code || 'Lớp học'} — {c.course?.title || ''}
          </h1>
          <p>
            Mã lớp: <strong>{c.classCode}</strong> • Phòng <strong>{c.room}</strong> •{' '}
            {c.scheduleDays?.join(', ')} • {c.timeSlot}
          </p>
        </div>
        <div className="dash-banner-right">
          <div className="dash-date-pill">
            <div>📍 {c.classCode}</div>
            <div className="sub">{c.teacher?.fullName || 'Chưa có giảng viên'}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <Link to={`/student/classes/${id}/assignments`} className="dash-quick-btn primary" style={{ textDecoration: 'none' }}>
          📝 Bài Tập ({assignments.length})
        </Link>
        <Link to={`/student/classes/${id}/attendance`} className="dash-quick-btn" style={{ textDecoration: 'none' }}>
          📅 Điểm Danh
        </Link>
        <Link to={`/student/classes/${id}/grades`} className="dash-quick-btn" style={{ textDecoration: 'none' }}>
          📊 Bảng Điểm
        </Link>
        <Link to={`/student/classes/${id}/schedule`} className="dash-quick-btn" style={{ textDecoration: 'none' }}>
          🗓️ Lịch Học
        </Link>
        <Link to="/student/classes" className="dash-quick-btn" style={{ textDecoration: 'none' }}>
          ← Danh Sách Lớp
        </Link>
      </div>

      <div className="dash-metrics-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="dash-metric-card">
          <div className="dash-metric-info">
            <span className="dash-metric-label">Trạng thái học phí</span>
            <span className="dash-metric-val">
              {tuition.icon} {tuition.label}
            </span>
            <span className={`dash-metric-trend ${cls.tuitionStatus === 'PAID' ? 'up' : ''}`}>
              {cls.tuitionStatus === 'PAID'
                ? 'Hoàn tất'
                : cls.tuitionStatus === 'REFUNDED'
                ? 'Đã hoàn — liên hệ phòng giáo vụ'
                : 'Cần thanh toán sớm'}
            </span>
          </div>
          <div className="dash-metric-icon icon-emerald">💰</div>
        </div>
        <div className="dash-metric-card">
          <div className="dash-metric-info">
            <span className="dash-metric-label">Bài tập</span>
            <span className="dash-metric-val">
              {submitted.length}/{assignments.length} đã nộp
            </span>
            <span className="dash-metric-trend">{pending.length} bài chưa nộp</span>
          </div>
          <div className="dash-metric-icon icon-amber">📝</div>
        </div>
        <div className="dash-metric-card">
          <div className="dash-metric-info">
            <span className="dash-metric-label">Trạng thái lớp</span>
            <span className="dash-metric-val">
              {classStatus.icon} {classStatus.label}
            </span>
            <span className="dash-metric-trend up">
              {c.course?.durationWeeks || '—'} tuần • {c.sessions || c.course?.sessions || '—'} buổi
            </span>
          </div>
          <div className="dash-metric-icon icon-purple">🎓</div>
        </div>
      </div>

      <div className="dash-card" style={{ marginBottom: '1.5rem' }}>
        <div className="dash-card-header">
          <h2 className="dash-card-title"><span>📘</span> Thông Tin Khóa Học</h2>
        </div>
        <div className="dash-subcard">
          {c.course?.description && (
            <div style={{ marginBottom: '1rem' }}>
              <div className="dash-subcard-label">Mô tả</div>
              <div className="dash-subcard-value">{c.course.description}</div>
            </div>
          )}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '0.75rem 1.5rem',
            }}
          >
            <Field label="Mã khóa học" value={c.course?.code || '—'} />
            <Field label="Số buổi học" value={c.course?.sessions || c.sessions || '—'} />
            <Field label="Học phí" value={formatVND(c.course?.tuitionFee)} />
            <Field label="Ngày bắt đầu" value={formatDate(c.startDate)} />
            <Field label="Ngày kết thúc" value={formatDate(c.endDate)} />
          </div>
        </div>
      </div>

      <div className="dash-card" style={{ marginBottom: '1.5rem' }}>
        <div className="dash-card-header">
          <h2 className="dash-card-title"><span>🏫</span> Thông Tin Lớp Học</h2>
        </div>
        <div className="dash-subcard">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '0.75rem 1.5rem',
            }}
          >
            <Field label="Mã lớp" value={c.classCode} />
            <Field label="Giảng viên" value={c.teacher?.fullName || '—'} />
            <Field label="Email giảng viên" value={c.teacher?.email || '—'} />
            <Field label="Phòng học" value={c.room} />
            <Field label="Lịch học" value={c.scheduleDays?.join(', ')} />
            <Field label="Ca học" value={c.timeSlot} />
            <Field
              label="Sĩ số"
              value={`${c.currentEnrollment ?? c.currentStudents ?? 0}/${c.capacity ?? '—'}`}
            />
            <Field label="Ngày đăng ký" value={formatDate(cls.enrollmentDate)} />
          </div>
        </div>
      </div>

      {assignments.length > 0 && (
        <div className="dash-card">
          <div className="dash-card-header">
            <h2 className="dash-card-title"><span>📝</span> Bài Tập Gần Đây</h2>
            <Link
              to={`/student/classes/${id}/assignments`}
              className="dash-quick-btn"
              style={{ textDecoration: 'none', padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}
            >
              Xem tất cả →
            </Link>
          </div>
          <div className="dash-item-list">
            {assignments.slice(0, 5).map((a) => (
              <div key={a._id} className="dash-item">
                <div className="dash-item-main">
                  <div className="dash-item-icon">
                    {!a.submissionStatus
                      ? '⏳'
                      : a.submissionStatus === 'LATE'
                      ? '⏰'
                      : a.submissionStatus === 'GRADED'
                      ? '🏆'
                      : '✅'}
                  </div>
                  <div>
                    <div className="dash-item-title">{a.title}</div>
                    <div className="dash-item-sub">
                      Hạn: {formatDate(a.dueDate)} • {a.skill} • {a.maxScore} điểm
                    </div>
                  </div>
                </div>
                <div>
                  {!a.submissionStatus ? (
                    <Link
                      to={`/student/classes/${id}/assignments`}
                      className="dash-quick-btn primary"
                      style={{ padding: '0.35rem 0.85rem', fontSize: '0.75rem', textDecoration: 'none' }}
                    >
                      Nộp bài
                    </Link>
                  ) : (
                    <span
                      className={`badge-pill ${
                        a.submissionStatus === 'GRADED' ? 'badge-blue' : 'badge-green'
                      }`}
                    >
                      {a.submissionStatus === 'GRADED' ? 'Đã chấm ✓' : 'Đã nộp'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Phản hồi / Đánh giá lớp học ──
          Học viên đánh giá lớp đang học (1 phản hồi / 1 lớp, có thể sửa).
          Trước đây model Feedback có sẵn ở backend nhưng không có API/UI
          nào dùng → tính năng thu thập ý kiến học viên không hoạt động. */}
      <div className="dash-card" style={{ marginTop: '1.5rem' }}>
        <div className="dash-card-header">
          <h2 className="dash-card-title"><span>💬</span> Đánh Giá Lớp Học</h2>
          {feedback && (
            <span className="badge-pill badge-green">Đã gửi đánh giá</span>
          )}
        </div>
        <div className="dash-subcard">
          <div style={{ marginBottom: '1rem' }}>
            <div className="dash-subcard-label">Mức độ hài lòng</div>
            <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', marginTop: '0.4rem' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  aria-label={`${star} sao`}
                  onClick={() => setFbRating(star)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.6rem',
                    lineHeight: 1,
                    padding: '0 2px',
                    opacity: star <= fbRating ? 1 : 0.25,
                    transition: 'opacity .15s',
                  }}
                >
                  ⭐
                </button>
              ))}
              <span style={{ fontSize: '0.85rem', color: '#64748b', marginLeft: '0.4rem' }}>
                {fbRating}/5 sao
              </span>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <div className="dash-subcard-label">Nhận xét của bạn *</div>
            <textarea
              value={fbContent}
              onChange={(e) => setFbContent(e.target.value)}
              placeholder="Chia sẻ trải nghiệm với giảng viên, nội dung bài học, cơ sở vật chất..."
              rows={4}
              maxLength={1000}
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
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.25rem' }}>
              {fbContent.trim().length}/1000 ký tự
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <div className="dash-subcard-label">Chọn nhãn đánh giá</div>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
              {FEEDBACK_TAGS.map((tag) => {
                const active = fbTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      setFbTags((prev) =>
                        prev.includes(tag)
                          ? prev.filter((t) => t !== tag)
                          : prev.length >= 6
                          ? prev
                          : [...prev, tag]
                      )
                    }
                    className={`dash-quick-btn ${active ? 'primary' : ''}`}
                    style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}
                  >
                    {active ? '✓ ' : ''}{tag}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <Button
              variant="primary"
              onClick={handleSubmitFeedback}
              loading={fbSubmitting}
              icon="💬"
            >
              {feedback ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}
            </Button>
            {feedback && (
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Đã gửi lần cuối: {formatDate(feedback.createdAt, true)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div>
    <div className="dash-subcard-label">{label}</div>
    <div className="dash-subcard-value">{value || '—'}</div>
  </div>
);

export default ClassDetailsPage;
