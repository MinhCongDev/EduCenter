import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { studentService } from '../../services/student.service';
import { useToast } from '../../contexts/ToastContext';
import type { Assignment, Enrollment } from '../../types';
import { EmptyState, SkeletonPage } from '../../components/Skeleton';
import { formatDate, formatVND } from '../../utils/format';

const ClassDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const [cls, setCls] = useState<Enrollment | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const [clsRes, aRes] = await Promise.all([
        studentService.getClassDetails(id),
        studentService.getAssignments(id),
      ]);
      if (clsRes.success && clsRes.data) setCls(clsRes.data.class);
      if (aRes.success && aRes.data) setAssignments(aRes.data.assignments);
      else toast.error(clsRes.message || 'Không thể tải lớp học');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể tải chi tiết lớp học');
    } finally {
      setIsLoading(false);
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
              {cls.tuitionStatus === 'PAID' ? '✅ Đã thanh toán' : '⚠️ Chưa thanh toán'}
            </span>
            <span className={`dash-metric-trend ${cls.tuitionStatus === 'PAID' ? 'up' : ''}`}>
              {cls.tuitionStatus === 'PAID' ? 'Hoàn tất' : 'Cần thanh toán sớm'}
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
            <span className="dash-metric-val">{c.status}</span>
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
            <Field label="Sĩ số" value={`${c.currentStudents || '—'}/${c.capacity || '—'}`} />
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
