import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { studentService } from '../../services/student.service';
import type { DashboardData, Assignment, Enrollment } from '../../types';
import { Button } from '../../components/Button';
import { EmptyState, SkeletonPage } from '../../components/Skeleton';
import { formatVND } from '../../utils/format';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await studentService.getDashboard();
      if (res.success && res.data) setData(res.data);
      else toast.error(res.message || 'Không thể tải dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể tải dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch assignments for current class to show in "Bài tập cần nộp"
  const [pendingAssignments, setPendingAssignments] = useState<Assignment[]>([]);
  useEffect(() => {
    if (!data?.currentClass) return;
    const classId = (data.currentClass.class as any)?._id;
    if (!classId) return;
    studentService
      .getAssignments(classId)
      .then((res) => {
        if (res.success && res.data) {
          setPendingAssignments(
            (res.data.assignments || []).filter((a) => !a.submissionStatus)
          );
        }
      })
      .catch(() => {});
  }, [data?.currentClass]);

  if (isLoading) return <SkeletonPage message="Đang tải dữ liệu từ server..." />;

  if (!data) {
    return (
      <div className="dash-container" style={{ textAlign: 'center', padding: '3rem' }}>
        <EmptyState
          icon="❌"
          title="Không thể tải dữ liệu"
          action={<Button onClick={fetchData}>Thử lại</Button>}
        />
      </div>
    );
  }

  const { stats, currentClass, myClasses } = data;
  const currentClassId = (currentClass?.class as any)?._id;

  return (
    <div className="dash-container">
      {/* ── Welcome Banner ── */}
      <div className="dash-banner">
        <div className="dash-banner-content">
          <div className="dash-banner-badge">🎓 Cổng Học Viên • EduCenter Portal</div>
          <h1>Chào mừng, {user?.fullName || 'Học viên'}!</h1>
          <p>
            {stats.totalClasses > 0
              ? `Bạn đang theo học ${stats.totalClasses} lớp. Tiếp tục cố gắng nhé!`
              : 'Bạn chưa đăng ký lớp học nào. Hãy liên hệ trung tâm để được hỗ trợ.'}
          </p>
        </div>
        {currentClass && (
          <div className="dash-banner-right">
            <div className="dash-date-pill">
              <div>📍 Lớp học: {(currentClass.class as any).classCode}</div>
              <div className="sub">
                Phòng {(currentClass.class as any).room} • {(currentClass.class as any).timeSlot}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Quick Action Toolbar ── */}
      <div className="dash-actions-row">
        <Link to="/student/classes" className="dash-quick-btn primary" style={{ textDecoration: 'none' }}>
          <span>📖</span>
          <span>Lớp Học Của Tôi</span>
        </Link>
        {currentClassId && (
          <>
            <Link
              to={`/student/classes/${currentClassId}/assignments`}
              className="dash-quick-btn"
              style={{ textDecoration: 'none' }}
            >
              <span>📝</span>
              <span>Bài Tập Cần Nộp</span>
            </Link>
            <Link
              to={`/student/classes/${currentClassId}/attendance`}
              className="dash-quick-btn"
              style={{ textDecoration: 'none' }}
            >
              <span>📅</span>
              <span>Điểm Danh</span>
            </Link>
          </>
        )}
        <Link to="/student/payments" className="dash-quick-btn" style={{ textDecoration: 'none' }}>
          <span>💳</span>
          <span>Thanh Toán Học Phí</span>
        </Link>
      </div>

      {/* ── Key Metrics ── */}
      <div className="dash-metrics-grid">
        <div className="dash-metric-card">
          <div className="dash-metric-info">
            <span className="dash-metric-label">Lớp đang học</span>
            <span className="dash-metric-val">{stats.totalClasses} lớp</span>
            <span className="dash-metric-trend up">
              {(currentClass?.class as any)?.course?.code || '—'}
            </span>
          </div>
          <div className="dash-metric-icon icon-blue">📚</div>
        </div>

        <div className="dash-metric-card">
          <div className="dash-metric-info">
            <span className="dash-metric-label">Trạng thái học phí</span>
            <span className="dash-metric-val">
              {currentClass?.tuitionStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
            </span>
            <span className="dash-metric-trend">
              {currentClass?.tuitionStatus === 'PAID' ? '✅ Đã hoàn tất' : '⚠️ Cần thanh toán'}
            </span>
          </div>
          <div className="dash-metric-icon icon-emerald">
            {currentClass?.tuitionStatus === 'PAID' ? '✅' : '💰'}
          </div>
        </div>

        <div className="dash-metric-card">
          <div className="dash-metric-info">
            <span className="dash-metric-label">Bài tập</span>
            <span className="dash-metric-val">
              {stats.totalAssignments - stats.pendingAssignments} / {stats.totalAssignments}
            </span>
            <span className="dash-metric-trend up">{stats.pendingAssignments} chưa nộp</span>
          </div>
          <div className="dash-metric-icon icon-amber">🏆</div>
        </div>

        <div className="dash-metric-card">
          <div className="dash-metric-info">
            <span className="dash-metric-label">Yêu cầu chờ duyệt</span>
            <span className="dash-metric-val">{stats.pendingRequests}</span>
            <span className="dash-metric-trend neutral">
              {stats.pendingRequests > 0 ? 'Đang được xử lý' : 'Không có yêu cầu'}
            </span>
          </div>
          <div className="dash-metric-icon icon-purple">⏰</div>
        </div>
      </div>

      {/* ── Main Two Column Grid ── */}
      <div className="dash-two-col">
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {currentClass && (
            <div className="dash-card">
              <div className="dash-card-header">
                <h2 className="dash-card-title">
                  <span>⏰</span> Lớp Học Hiện Tại
                </h2>
                <span className="badge-pill badge-green">
                  {currentClass.status || currentClass.enrollmentStatus}
                </span>
              </div>

              <div className="dash-subcard">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <div>
                    <h3 className="dash-subcard-title">
                      {(currentClass.class as any).course?.code || 'Đang tải...'}
                    </h3>
                    <div className="dash-subcard-meta" style={{ marginTop: '0.25rem' }}>
                      Mã lớp: <strong>{(currentClass.class as any).classCode}</strong>
                      {(currentClass.class as any).teacher && (
                        <>
                          {' • '}
                          Giảng viên:{' '}
                          <strong>{(currentClass.class as any).teacher.fullName}</strong>
                        </>
                      )}
                    </div>
                  </div>
                  <span className="badge-pill badge-blue">
                    Phòng {(currentClass.class as any).room}
                  </span>
                </div>

                <div className="dash-subcard-body" style={{ marginTop: '1rem' }}>
                  <div>
                    📅 <strong>Lịch học:</strong>{' '}
                    {(currentClass.class as any).scheduleDays?.join(', ')}
                  </div>
                  <div>
                    🕐 <strong>Giờ học:</strong> {(currentClass.class as any).timeSlot}
                  </div>
                  <div>
                    💰 <strong>Học phí:</strong>{' '}
                    {formatVND((currentClass.class as any).course?.tuitionFee)}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                  <Link
                    to={`/student/classes/${currentClassId}/schedule`}
                    className="dash-quick-btn primary"
                    style={{ textDecoration: 'none' }}
                  >
                    📅 Xem Lịch Học
                  </Link>
                  <Link
                    to={`/student/classes/${currentClassId}`}
                    className="dash-quick-btn"
                    style={{ textDecoration: 'none' }}
                  >
                    ℹ️ Xem Chi Tiết
                  </Link>
                </div>
              </div>
            </div>
          )}

          <div className="dash-card">
            <div className="dash-card-header">
              <h2 className="dash-card-title">
                <span>📚</span> Các Lớp Của Tôi
              </h2>
              <span className="badge-pill badge-purple">{myClasses.length} lớp</span>
            </div>

            {myClasses.length === 0 ? (
              <EmptyState
                icon="📚"
                title="Chưa có lớp học"
                description="Bạn chưa đăng ký lớp học nào."
              />
            ) : (
              <div className="dash-item-list">
                {myClasses.map((item: Enrollment) => (
                  <div key={item._id || item.enrollmentId} className="dash-item">
                    <div className="dash-item-main">
                      <div className="dash-item-icon">📚</div>
                      <div>
                        <div className="dash-item-title">
                          {(item.class as any).course?.code || 'Đang tải...'}
                        </div>
                        <div className="dash-item-sub">
                          Lớp: {(item.class as any).classCode} •{' '}
                          {(item.class as any).scheduleDays?.join(', ')}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: '0.25rem',
                      }}
                    >
                      <span
                        className={`badge-pill ${
                          item.tuitionStatus === 'PAID' ? 'badge-green' : 'badge-amber'
                        }`}
                      >
                        {item.tuitionStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa TT'}
                      </span>
                      <Link
                        to={`/student/classes/${(item.class as any)._id}`}
                        className="dash-quick-btn"
                        style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.7rem',
                          textDecoration: 'none',
                        }}
                      >
                        Chi tiết →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="dash-card">
            <div className="dash-card-header">
              <h2 className="dash-card-title">
                <span>📝</span> Bài Tập Cần Nộp
              </h2>
              <span className="badge-pill badge-amber">{pendingAssignments.length} cần nộp</span>
            </div>

            {!currentClassId ? (
              <EmptyState icon="📝" title="Chưa đăng ký lớp nào" />
            ) : pendingAssignments.length === 0 ? (
              <EmptyState
                icon="🎉"
                title="Không có bài tập cần nộp"
                description="Bạn đã hoàn thành tất cả bài tập."
              />
            ) : (
              <div className="dash-item-list">
                {pendingAssignments.slice(0, 5).map((a) => (
                  <div key={a._id} className="dash-item">
                    <div className="dash-item-main">
                      <div className="dash-item-icon">⏳</div>
                      <div>
                        <div className="dash-item-title">{a.title}</div>
                        <div className="dash-item-sub">
                          Hạn: {new Date(a.dueDate).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </div>
                      </div>
                    </div>
                    <Link
                      to={`/student/classes/${currentClassId}/assignments`}
                      className="dash-quick-btn primary"
                      style={{
                        padding: '0.35rem 0.85rem',
                        fontSize: '0.775rem',
                        textDecoration: 'none',
                      }}
                    >
                      Nộp bài
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="dash-card">
            <div className="dash-card-header">
              <h2 className="dash-card-title">
                <span>⚡</span> Thao Tác Nhanh
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Link
                to="/student/requests"
                className="dash-quick-btn"
                style={{ justifyContent: 'flex-start', textDecoration: 'none' }}
              >
                <span>🔄</span>
                <span>Yêu cầu đổi lớp / lịch học</span>
              </Link>
              {currentClassId && (
                <Link
                  to={`/student/classes/${currentClassId}/grades`}
                  className="dash-quick-btn"
                  style={{ justifyContent: 'flex-start', textDecoration: 'none' }}
                >
                  <span>📊</span>
                  <span>Xem bảng điểm</span>
                </Link>
              )}
              <Link
                to="/student/payments"
                className="dash-quick-btn"
                style={{ justifyContent: 'flex-start', textDecoration: 'none' }}
              >
                <span>💳</span>
                <span>Thanh toán học phí</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
