import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { studentService } from '../../services/student.service';
import type { MyClass } from '../../types';

const MyClassesPage: React.FC = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<MyClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await studentService.getMyClasses();
      if (res.success && res.data) {
        setClasses(res.data.classes);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Không thể tải danh sách lớp học');
    } finally {
      setIsLoading(false);
    }
  };

  const tuitionStatusLabel = (s: string) => {
    if (s === 'PAID') return { label: 'Đã thanh toán', cls: 'badge-green' };
    if (s === 'PENDING') return { label: 'Chờ thanh toán', cls: 'badge-amber' };
    return { label: 'Chưa thanh toán', cls: 'badge-purple' };
  };

  const enrollmentStatusLabel = (s: string) => {
    if (s === 'ACTIVE' || s === 'ENROLLED') return { label: 'Đang học', cls: 'badge-green' };
    if (s === 'DROPPED') return { label: 'Đã bỏ', cls: 'badge-purple' };
    return { label: s, cls: 'badge-blue' };
  };

  if (isLoading) {
    return (
      <div className="dash-container" style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p>Đang tải danh sách lớp học...</p>
      </div>
    );
  }

  return (
    <div className="dash-container">
      {/* ── Page Header ── */}
      <div className="dash-banner">
        <div className="dash-banner-content">
          <div className="dash-banner-badge">📚 Lớp Học Của Tôi</div>
          <h1>Danh Sách Lớp Học</h1>
          <p>
            {classes.length > 0
              ? `Bạn đang theo học ${classes.length} lớp. Nhấn vào lớp để xem chi tiết.`
              : 'Bạn chưa đăng ký lớp học nào. Hãy liên hệ trung tâm để được hỗ trợ.'}
          </p>
        </div>
        <div className="dash-banner-right">
          <div className="dash-date-pill">
            <div>📚 {classes.length} lớp đã đăng ký</div>
            <div className="sub">Học viên: {user?.fullName}</div>
          </div>
        </div>
      </div>

      {/* ── Metrics ── */}
      {classes.length > 0 && (
        <div className="dash-metrics-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Tổng số lớp</span>
              <span className="dash-metric-val">{classes.length} lớp</span>
              <span className="dash-metric-trend up">
                {classes.filter(c => c.tuitionStatus === 'PAID').length} đã thanh toán
              </span>
            </div>
            <div className="dash-metric-icon icon-blue">📚</div>
          </div>
          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Đã thanh toán</span>
              <span className="dash-metric-val">{classes.filter(c => c.tuitionStatus === 'PAID').length}</span>
              <span className="dash-metric-trend up">
                {classes.filter(c => c.tuitionStatus !== 'PAID').length} chưa thanh toán
              </span>
            </div>
            <div className="dash-metric-icon icon-emerald">✅</div>
          </div>
          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Lớp đang học</span>
              <span className="dash-metric-val">{classes.filter(c => c.class.status === 'IN_PROGRESS').length}</span>
              <span className="dash-metric-trend">
                {classes.filter(c => c.class.status === 'OPEN').length} đang mở đăng ký
              </span>
            </div>
            <div className="dash-metric-icon icon-purple">🎓</div>
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(239,68,68,0.1)', borderRadius: '12px', marginBottom: '1.5rem' }}>
          <p style={{ color: '#ef4444', marginBottom: '0.75rem' }}>{error}</p>
          <button className="dash-quick-btn primary" onClick={fetchClasses}>Thử lại</button>
        </div>
      )}

      {/* ── Classes List ── */}
      {classes.length === 0 && !isLoading && !error ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--dash-card-subtle)', borderRadius: '16px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
          <h2 style={{ marginBottom: '0.5rem' }}>Chưa có lớp học nào</h2>
          <p style={{ opacity: 0.7, marginBottom: '1.5rem' }}>
            Bạn chưa đăng ký lớp học nào. Vui lòng liên hệ trung tâm để được tư vấn.
          </p>
          <Link to="/courses" className="dash-quick-btn primary" style={{ textDecoration: 'none' }}>
            📖 Xem các khóa học
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {classes.map((item) => {
            const tuition = tuitionStatusLabel(item.tuitionStatus);
            const enrollment = enrollmentStatusLabel(item.enrollmentStatus);
            return (
              <div key={item._id} className="dash-card">
                <div className="dash-card-header">
                  <h2 className="dash-card-title">
                    <span>📘</span>
                    {item.class.course?.code || 'Khóa học'} — {item.class.course?.title || ''}
                  </h2>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span className={`badge-pill ${enrollment.cls}`}>{enrollment.label}</span>
                    <span className={`badge-pill ${tuition.cls}`}>{tuition.label}</span>
                  </div>
                </div>

                <div className="dash-subcard">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem 1.5rem' }}>
                    <div>
                      <div className="dash-subcard-label">Mã lớp</div>
                      <div className="dash-subcard-value">{item.class.classCode}</div>
                    </div>
                    <div>
                      <div className="dash-subcard-label">Giảng viên</div>
                      <div className="dash-subcard-value">{item.class.teacher?.fullName || '—'}</div>
                    </div>
                    <div>
                      <div className="dash-subcard-label">Phòng học</div>
                      <div className="dash-subcard-value">{item.class.room}</div>
                    </div>
                    <div>
                      <div className="dash-subcard-label">Lịch học</div>
                      <div className="dash-subcard-value">{item.class.scheduleDays?.join(', ')}</div>
                    </div>
                    <div>
                      <div className="dash-subcard-label">Ca học</div>
                      <div className="dash-subcard-value">{item.class.timeSlot}</div>
                    </div>
                    <div>
                      <div className="dash-subcard-label">Thời gian</div>
                      <div className="dash-subcard-value">
                        {new Date(item.class.startDate).toLocaleDateString('vi-VN')} — {new Date(item.class.endDate).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                    {item.class.course?.tuitionFee && (
                      <div>
                        <div className="dash-subcard-label">Học phí</div>
                        <div className="dash-subcard-value">
                          {item.class.course.tuitionFee.toLocaleString('vi-VN')} VNĐ
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="dash-subcard-label">Ngày đăng ký</div>
                      <div className="dash-subcard-value">
                        {new Date(item.enrollmentDate).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
                    <Link
                      to={`/student/classes/${item.class._id}`}
                      className="dash-quick-btn primary"
                      style={{ textDecoration: 'none' }}
                    >
                      ℹ️ Xem Chi Tiết
                    </Link>
                    <Link
                      to={`/student/classes/${item.class._id}/assignments`}
                      className="dash-quick-btn"
                      style={{ textDecoration: 'none' }}
                    >
                      📝 Bài Tập
                    </Link>
                    <Link
                      to={`/student/classes/${item.class._id}/attendance`}
                      className="dash-quick-btn"
                      style={{ textDecoration: 'none' }}
                    >
                      📅 Điểm Danh
                    </Link>
                    <Link
                      to={`/student/classes/${item.class._id}/grades`}
                      className="dash-quick-btn"
                      style={{ textDecoration: 'none' }}
                    >
                      📊 Bảng Điểm
                    </Link>
                    <Link
                      to={`/student/classes/${item.class._id}/schedule`}
                      className="dash-quick-btn"
                      style={{ textDecoration: 'none' }}
                    >
                      🗓️ Lịch Học
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyClassesPage;
