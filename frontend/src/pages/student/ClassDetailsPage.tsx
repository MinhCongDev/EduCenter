import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { studentService } from '../../services/student.service';
import type { MyClass, AssignmentItem } from '../../types';

const ClassDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [cls, setCls] = useState<MyClass | null>(null);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      const [clsRes, assignmentsRes] = await Promise.all([
        studentService.getClassDetails(id),
        studentService.getAssignments(id),
      ]);
      if (clsRes.success && clsRes.data) setCls(clsRes.data.class);
      if (assignmentsRes.success && assignmentsRes.data) setAssignments(assignmentsRes.data.assignments);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Không thể tải chi tiết lớp học');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="dash-container" style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p>Đang tải chi tiết lớp học...</p>
      </div>
    );
  }

  if (error || !cls) {
    return (
      <div className="dash-container" style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>❌</div>
        <p style={{ color: '#ef4444', marginBottom: '1rem' }}>{error || 'Không tìm thấy lớp học'}</p>
        <Link to="/student/classes" className="dash-quick-btn primary" style={{ textDecoration: 'none' }}>
          ← Quay lại danh sách lớp
        </Link>
      </div>
    );
  }

  const pendingAssignments = assignments.filter(a => !a.submissionStatus);
  const submittedAssignments = assignments.filter(a => a.submissionStatus);

  return (
    <div className="dash-container">
      {/* ── Page Header ── */}
      <div className="dash-banner">
        <div className="dash-banner-content">
          <div className="dash-banner-badge">ℹ️ Chi Tiết Lớp Học</div>
          <h1>{cls.class.course?.code || 'Lớp học'} — {cls.class.course?.title || ''}</h1>
          <p>
            Mã lớp: <strong>{cls.class.classCode}</strong> • Phòng <strong>{cls.class.room}</strong> • {cls.class.scheduleDays?.join(', ')} • {cls.class.timeSlot}
          </p>
        </div>
        <div className="dash-banner-right">
          <div className="dash-date-pill">
            <div>📍 {cls.class.classCode}</div>
            <div className="sub">{cls.class.teacher?.fullName || 'Chưa có giảng viên'}</div>
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
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

      {/* ── Class Info Cards ── */}
      <div className="dash-metrics-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="dash-metric-card">
          <div className="dash-metric-info">
            <span className="dash-metric-label">Trạng thái học phí</span>
            <span className="dash-metric-val">
              {cls.tuitionStatus === 'PAID' ? '✅ Đã thanh toán' : cls.tuitionStatus === 'PENDING' ? '⏳ Chờ thanh toán' : '❌ Chưa thanh toán'}
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
            <span className="dash-metric-val">{submittedAssignments.length}/{assignments.length} đã nộp</span>
            <span className="dash-metric-trend">
              {pendingAssignments.length} bài chưa nộp
            </span>
          </div>
          <div className="dash-metric-icon icon-amber">📝</div>
        </div>
        <div className="dash-metric-card">
          <div className="dash-metric-info">
            <span className="dash-metric-label">Trạng thái lớp</span>
            <span className="dash-metric-val">{cls.class.status || cls.enrollmentStatus}</span>
            <span className="dash-metric-trend up">
              {cls.class.course?.durationWeeks || '—'} tuần học
            </span>
          </div>
          <div className="dash-metric-icon icon-purple">🎓</div>
        </div>
      </div>

      {/* ── Course Info ── */}
      <div className="dash-card" style={{ marginBottom: '1.5rem' }}>
        <div className="dash-card-header">
          <h2 className="dash-card-title"><span>📘</span> Thông Tin Khóa Học</h2>
        </div>
        <div className="dash-subcard">
          {cls.class.course?.description && (
            <div style={{ marginBottom: '1rem' }}>
              <div className="dash-subcard-label">Mô tả</div>
              <div className="dash-subcard-value">{cls.class.course.description}</div>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem 1.5rem' }}>
            <div>
              <div className="dash-subcard-label">Mã khóa học</div>
              <div className="dash-subcard-value">{cls.class.course?.code || '—'}</div>
            </div>
            <div>
              <div className="dash-subcard-label">Số buổi học</div>
              <div className="dash-subcard-value">{cls.class.course?.sessions || '—'}</div>
            </div>
            <div>
              <div className="dash-subcard-label">Học phí</div>
              <div className="dash-subcard-value">
                {cls.class.course?.tuitionFee ? `${cls.class.course.tuitionFee.toLocaleString('vi-VN')} VNĐ` : '—'}
              </div>
            </div>
            <div>
              <div className="dash-subcard-label">Ngày bắt đầu</div>
              <div className="dash-subcard-value">
                {new Date(cls.class.startDate).toLocaleDateString('vi-VN')}
              </div>
            </div>
            <div>
              <div className="dash-subcard-label">Ngày kết thúc</div>
              <div className="dash-subcard-value">
                {new Date(cls.class.endDate).toLocaleDateString('vi-VN')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Class Info ── */}
      <div className="dash-card" style={{ marginBottom: '1.5rem' }}>
        <div className="dash-card-header">
          <h2 className="dash-card-title"><span>🏫</span> Thông Tin Lớp Học</h2>
        </div>
        <div className="dash-subcard">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem 1.5rem' }}>
            <div>
              <div className="dash-subcard-label">Mã lớp</div>
              <div className="dash-subcard-value">{cls.class.classCode}</div>
            </div>
            <div>
              <div className="dash-subcard-label">Giảng viên</div>
              <div className="dash-subcard-value">{cls.class.teacher?.fullName || '—'}</div>
            </div>
            <div>
              <div className="dash-subcard-label">Email giảng viên</div>
              <div className="dash-subcard-value">{cls.class.teacher?.email || '—'}</div>
            </div>
            <div>
              <div className="dash-subcard-label">Phòng học</div>
              <div className="dash-subcard-value">{cls.class.room}</div>
            </div>
            <div>
              <div className="dash-subcard-label">Lịch học</div>
              <div className="dash-subcard-value">{cls.class.scheduleDays?.join(', ')}</div>
            </div>
            <div>
              <div className="dash-subcard-label">Ca học</div>
              <div className="dash-subcard-value">{cls.class.timeSlot}</div>
            </div>
            <div>
              <div className="dash-subcard-label">Ngày đăng ký</div>
              <div className="dash-subcard-value">
                {new Date(cls.enrollmentDate).toLocaleDateString('vi-VN')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent Assignments ── */}
      {assignments.length > 0 && (
        <div className="dash-card">
          <div className="dash-card-header">
            <h2 className="dash-card-title"><span>📝</span> Bài Tập Gần Đây</h2>
            <Link to={`/student/classes/${id}/assignments`} className="dash-quick-btn" style={{ textDecoration: 'none', padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}>
              Xem tất cả →
            </Link>
          </div>
          <div className="dash-item-list">
            {assignments.slice(0, 5).map((a) => (
              <div key={a._id} className="dash-item">
                <div className="dash-item-main">
                  <div className="dash-item-icon">
                    {!a.submissionStatus ? '⏳' : a.submissionStatus === 'LATE' ? '⏰' : a.submissionStatus === 'GRADED' ? '🏆' : '✅'}
                  </div>
                  <div>
                    <div className="dash-item-title">{a.title}</div>
                    <div className="dash-item-sub">
                      Hạn: {new Date(a.dueDate).toLocaleDateString('vi-VN')} • {a.skill} • {a.maxScore} điểm
                    </div>
                  </div>
                </div>
                <div>
                  {!a.submissionStatus ? (
                    <Link to={`/student/classes/${id}/assignments`} className="dash-quick-btn primary" style={{ padding: '0.35rem 0.85rem', fontSize: '0.75rem', textDecoration: 'none' }}>
                      Nộp bài
                    </Link>
                  ) : (
                    <span className={`badge-pill ${a.submissionStatus === 'GRADED' ? 'badge-blue' : 'badge-green'}`}>
                      {a.submissionStatus === 'GRADED' ? `Đã chấm: ${a.score ?? '?'}` : 'Đã nộp'}
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

export default ClassDetailsPage;
