import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { studentService } from '../../services/student.service';
import type { MyClass, Assignment } from '../../types';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [myClasses, setMyClasses] = useState<MyClass[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dữ liệu khi mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Gọi API lấy danh sách lớp
      const classesRes = await studentService.getMyClasses();
      if (classesRes.success && classesRes.data) {
        setMyClasses(classesRes.data.classes);

        // Nếu có lớp, lấy bài tập của lớp đầu tiên
        if (classesRes.data.classes.length > 0) {
          const firstClassId = classesRes.data.classes[0].class._id;
          const assignmentsRes = await studentService.getAssignments(firstClassId);
          if (assignmentsRes.success && assignmentsRes.data) {
            setAssignments(assignmentsRes.data.assignments);
          }
        }
      }
    } catch (err: any) {
      console.error('Lỗi khi fetch dữ liệu:', err);
      setError(err.message || 'Không thể tải dữ liệu dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý nộp bài tập
  const handleSubmitAssignment = async (assignment: Assignment) => {
    const link = prompt('Dán link GitHub repo hoặc bài nộp của bạn:', 'https://github.com/my-student-repo');
    if (!link) return;

    try {
      const res = await studentService.submitAssignment({
        assignmentId: assignment._id,
        content: link,
        attachmentUrl: link,
      });

      if (res.success) {
        // Cập nhật state
        setAssignments(prev =>
          prev.map(a =>
            a._id === assignment._id
              ? { ...a, submissionStatus: 'SUBMITTED', submittedAt: new Date().toISOString() }
              : a
          )
        );
        alert('Đã nộp bài tập thành công! Giảng viên sẽ chấm điểm sớm.');
      } else {
        alert(res.message || 'Nộp bài thất bại');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi nộp bài');
    }
  };

  // Tính stats
  const pendingAssignments = assignments.filter(a => !a.submissionStatus);
  const currentClass = myClasses.length > 0 ? myClasses[0] : null;

  if (isLoading) {
    return (
      <div className="dash-container" style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dash-container" style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>❌</div>
        <p style={{ color: '#ef4444' }}>{error}</p>
        <button
          className="dash-quick-btn primary"
          onClick={fetchDashboardData}
          style={{ marginTop: '1rem' }}
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="dash-container">
      {/* ── Welcome Banner ── */}
      <div className="dash-banner">
        <div className="dash-banner-content">
          <div className="dash-banner-badge">
            🎓 Cổng Học Viên • EduCenter Portal
          </div>
          <h1>Chào mừng, {user?.fullName || 'Học viên'}!</h1>
          <p>
            {myClasses.length > 0
              ? `Bạn đang theo học ${myClasses.length} lớp. Tiếp tục cố gắng nhé!`
              : 'Bạn chưa đăng ký lớp học nào. Hãy liên hệ trung tâm để được hỗ trợ.'}
          </p>
        </div>
        {currentClass && (
          <div className="dash-banner-right">
            <div className="dash-date-pill">
              <div>📍 Lớp học: {currentClass.class.classCode}</div>
              <div className="sub">Phòng {currentClass.class.room} • {currentClass.class.timeSlot}</div>
            </div>
          </div>
        )}
      </div>

      {/* ── Quick Action Toolbar ── */}
      <div className="dash-actions-row">
        <button
          type="button"
          className="dash-quick-btn primary"
          onClick={() => window.location.href = '/student/schedule'}
        >
          <span>📖</span>
          <span>Xem Lịch Học</span>
        </button>
        <button
          type="button"
          className="dash-quick-btn"
          onClick={() => window.location.href = '/student/assignments'}
        >
          <span>📝</span>
          <span>Bài Tập Cần Nộp</span>
        </button>
        <button
          type="button"
          className="dash-quick-btn"
          onClick={() => window.location.href = '/student/attendance'}
        >
          <span>📅</span>
          <span>Điểm Danh</span>
        </button>
        <button
          type="button"
          className="dash-quick-btn"
          onClick={() => window.location.href = '/student/payments'}
        >
          <span>💳</span>
          <span>Thanh Toán Học Phí</span>
        </button>
      </div>

      {/* ── Key Metrics ── */}
      <div className="dash-metrics-grid">
        <div className="dash-metric-card">
          <div className="dash-metric-info">
            <span className="dash-metric-label">Lớp đang học</span>
            <span className="dash-metric-val">{myClasses.length} lớp</span>
            <span className="dash-metric-trend up">
              {currentClass?.class.course?.title || 'Đang tải...'}
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
            <span className="dash-metric-label">Bài tập đã nộp</span>
            <span className="dash-metric-val">
              {assignments.filter(a => a.submissionStatus).length} / {assignments.length}
            </span>
            <span className="dash-metric-trend up">
              {assignments.filter(a => a.submissionStatus === 'GRADED').length} đã chấm điểm
            </span>
          </div>
          <div className="dash-metric-icon icon-amber">🏆</div>
        </div>

        <div className="dash-metric-card">
          <div className="dash-metric-info">
            <span className="dash-metric-label">Bài tập sắp đến hạn</span>
            <span className="dash-metric-val">{pendingAssignments.length} bài</span>
            <span className="dash-metric-trend neutral">
              {pendingAssignments.length > 0
                ? `Hạn: ${new Date(pendingAssignments[0].dueDate).toLocaleDateString('vi-VN')}`
                : 'Không có bài tập mới'}
            </span>
          </div>
          <div className="dash-metric-icon icon-purple">⏰</div>
        </div>
      </div>

      {/* ── Main Two Column Grid ── */}
      <div className="dash-two-col">
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Upcoming Class Session */}
          {currentClass && (
            <div className="dash-card">
              <div className="dash-card-header">
                <h2 className="dash-card-title">
                  <span>⏰</span> Lớp Học Hiện Tại
                </h2>
                <span className="badge-pill badge-green">{currentClass.enrollmentStatus}</span>
              </div>

              <div className="dash-subcard">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 className="dash-subcard-title">
                      {currentClass.class.course?.title || 'Đang tải...'}
                    </h3>
                    <div className="dash-subcard-meta" style={{ marginTop: '0.25rem' }}>
                      Mã lớp: <strong>{currentClass.class.classCode}</strong>
                      {currentClass.class.teacher && (
                        <> • Giảng viên: <strong>{currentClass.class.teacher.fullName}</strong></>
                      )}
                    </div>
                  </div>
                  <span className="badge-pill badge-blue">Phòng {currentClass.class.room}</span>
                </div>

                <div className="dash-subcard-body" style={{ marginTop: '1rem' }}>
                  <div>📅 <strong>Lịch học:</strong> {currentClass.class.scheduleDays?.join(', ')}</div>
                  <div>🕐 <strong>Giờ học:</strong> {currentClass.class.timeSlot}</div>
                  <div>📆 <strong>Thời gian:</strong> {new Date(currentClass.class.startDate).toLocaleDateString('vi-VN')} - {new Date(currentClass.class.endDate).toLocaleDateString('vi-VN')}</div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="dash-quick-btn primary"
                    onClick={() => window.location.href = `/student/classes/${currentClass.class._id}/schedule`}
                  >
                    📅 Xem Lịch Học
                  </button>
                  <button
                    type="button"
                    className="dash-quick-btn"
                    onClick={() => window.location.href = `/student/classes/${currentClass.class._id}`}
                  >
                    ℹ️ Xem Chi Tiết
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* My Classes List */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h2 className="dash-card-title">
                <span>📚</span> Các Lớp Của Tôi
              </h2>
              <span className="badge-pill badge-purple">{myClasses.length} lớp</span>
            </div>

            <div className="dash-item-list">
              {myClasses.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', opacity: 0.7 }}>
                  Bạn chưa đăng ký lớp học nào
                </div>
              ) : (
                myClasses.map((item) => (
                  <div key={item.enrollmentId} className="dash-item">
                    <div className="dash-item-main">
                      <div className="dash-item-icon">📚</div>
                      <div>
                        <div className="dash-item-title">
                          {item.class.course?.title || 'Đang tải...'}
                        </div>
                        <div className="dash-item-sub">
                          Lớp: {item.class.classCode} • {item.class.scheduleDays?.join(', ')}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                      <span className={`badge-pill ${item.tuitionStatus === 'PAID' ? 'badge-green' : 'badge-amber'}`}>
                        {item.tuitionStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa TT'}
                      </span>
                      <button
                        type="button"
                        className="dash-quick-btn"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                        onClick={() => window.location.href = `/student/classes/${item.class._id}`}
                      >
                        Chi tiết →
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Assignments Due */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h2 className="dash-card-title">
                <span>📝</span> Bài Tập Cần Nộp
              </h2>
              <span className="badge-pill badge-amber">
                {pendingAssignments.length} cần nộp
              </span>
            </div>

            <div className="dash-item-list">
              {assignments.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', opacity: 0.7 }}>
                  Không có bài tập nào
                </div>
              ) : (
                assignments.map((item) => (
                  <div key={item._id} className="dash-item">
                    <div className="dash-item-main">
                      <div className="dash-item-icon">
                        {!item.submissionStatus ? '⏳' : item.submissionStatus === 'LATE' ? '⏰' : '✅'}
                      </div>
                      <div>
                        <div className="dash-item-title">{item.title}</div>
                        <div className="dash-item-sub">
                          Hạn: {new Date(item.dueDate).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>

                    <div>
                      {!item.submissionStatus ? (
                        <button
                          type="button"
                          onClick={() => handleSubmitAssignment(item)}
                          className="dash-quick-btn primary"
                          style={{ padding: '0.35rem 0.85rem', fontSize: '0.775rem' }}
                        >
                          Nộp bài
                        </button>
                      ) : (
                        <span className={`badge-pill ${item.submissionStatus === 'GRADED' ? 'badge-blue' : 'badge-green'}`}>
                          {item.submissionStatus === 'GRADED' ? 'Đã chấm' : 'Đã nộp'}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {assignments.length > 0 && (
              <div style={{ padding: '0.75rem', borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
                <button
                  type="button"
                  className="dash-quick-btn"
                  onClick={() => currentClass && (window.location.href = `/student/classes/${currentClass.class._id}/assignments`)}
                >
                  Xem tất cả bài tập →
                </button>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h2 className="dash-card-title">
                <span>⚡</span> Thao Tác Nhanh
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                type="button"
                className="dash-quick-btn"
                onClick={() => window.location.href = '/student/requests'}
                style={{ justifyContent: 'flex-start' }}
              >
                <span>🔄</span>
                <span>Yêu cầu đổi lớp / lịch học</span>
              </button>
              <button
                type="button"
                className="dash-quick-btn"
                onClick={() => window.location.href = '/student/requests'}
                style={{ justifyContent: 'flex-start' }}
              >
                <span>📊</span>
                <span>Theo dõi yêu cầu đã gửi</span>
              </button>
              <button
                type="button"
                className="dash-quick-btn"
                onClick={() => window.location.href = '/student/payments'}
                style={{ justifyContent: 'flex-start' }}
              >
                <span>💳</span>
                <span>Thanh toán học phí</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
