import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import studentService from '../../services/student.service';
import '../dashboard/Dashboard.css';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'classes' | 'schedule' | 'assignments' | 'results' | 'requests' | 'feedback' | 'payments'>('overview');

  // Database States
  const [classes, setClasses] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [academicResults, setAcademicResults] = useState<any>(null);
  const [changeRequests, setChangeRequests] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal / Form States
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [submissionContent, setSubmissionContent] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Request form state
  const [requestType, setRequestType] = useState<'CLASS_CHANGE' | 'SCHEDULE_CHANGE'>('CLASS_CHANGE');
  const [requestCurrentClass, setRequestCurrentClass] = useState<string>('');
  const [requestTargetSchedule, setRequestTargetSchedule] = useState<string>('');
  const [requestReason, setRequestReason] = useState<string>('');

  // Feedback form state
  const [feedbackReceiver, setFeedbackReceiver] = useState<string>('');
  const [feedbackClassId, setFeedbackClassId] = useState<string>('');
  const [feedbackContent, setFeedbackContent] = useState<string>('');
  const [feedbackRating, setFeedbackRating] = useState<number>(5);

  // Payment form state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(9200000);
  const [paymentEnrollmentId, setPaymentEnrollmentId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('VNPAY');
  const [paymentNote, setPaymentNote] = useState<string>('');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cls, sch, asg, res, cr, att, reg] = await Promise.all([
        studentService.getClasses(),
        studentService.getSchedule(),
        studentService.getAssignments(),
        studentService.getAcademicResults(),
        studentService.getChangeRequests(),
        studentService.getAttendance(),
        studentService.getRegistrations(),
      ]);

      setClasses(cls || []);
      setSchedule(sch || []);
      setAssignments(asg || []);
      setAcademicResults(res || null);
      setChangeRequests(cr || []);
      setAttendance(att || null);
      setRegistrations(reg || []);

      if (cls && cls.length > 0) {
        setRequestCurrentClass(cls[0].classId);
        setFeedbackClassId(cls[0].classId);
        if (cls[0].teacher?._id) {
          setFeedbackReceiver(cls[0].teacher._id);
        }
      }
    } catch (err: any) {
      console.error('Lỗi khi nạp dữ liệu học viên:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDoAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment || !submissionContent.trim()) return;

    try {
      setIsSubmitting(true);
      await studentService.submitAssignment(selectedAssignment._id, {
        content: submissionContent,
      });
      setMessage({ type: 'success', text: 'Nộp bài tập thành công!' });
      setSelectedAssignment(null);
      setSubmissionContent('');
      await fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi khi nộp bài' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitChangeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestCurrentClass || !requestReason.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng chọn lớp học và nhập lý do yêu cầu' });
      return;
    }

    try {
      await studentService.createChangeRequest({
        requestType,
        currentClass: requestCurrentClass,
        targetSchedule: requestTargetSchedule,
        reason: requestReason,
      });
      setMessage({ type: 'success', text: 'Đã gửi yêu cầu thay đổi tới phòng Giáo vụ thành công!' });
      setRequestReason('');
      setRequestTargetSchedule('');
      await fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi khi gửi yêu cầu' });
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackContent.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập nội dung đánh giá' });
      return;
    }

    try {
      await studentService.submitFeedback({
        receiver: feedbackReceiver || undefined,
        classId: feedbackClassId || undefined,
        content: feedbackContent,
        rating: feedbackRating,
      });
      setMessage({ type: 'success', text: 'Cảm ơn bạn đã gửi đánh giá phản hồi tới Giảng viên!' });
      setFeedbackContent('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi khi gửi phản hồi' });
    }
  };

  const handleMakePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await studentService.makePayment({
        enrollmentId: paymentEnrollmentId || undefined,
        amount: Number(paymentAmount),
        method: paymentMethod,
        note: paymentNote || 'Thanh toán học phí IELTS',
      });
      setMessage({ type: 'success', text: 'Thanh toán học phí thành công! Giao dịch đã được lưu vào hệ thống.' });
      setIsPaymentModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi thanh toán' });
    }
  };

  const currentClass = classes[0];

  return (
    <div className="dmr-dashboard-wrapper">
      <div className="dmr-dashboard-container">
        {/* Top Header */}
        <div className="dmr-dash-header">
          <div className="dmr-dash-welcome">
            <span className="dmr-dash-role-badge">🎓 Không Gian Học Viên • EduCenter IELTS</span>
            <h1 className="dmr-dash-title">Cổng Thông Tin Học Viên</h1>
            <p className="dmr-dash-subtitle">
              Xin chào, <strong>{user?.fullName}</strong> • Mã HV: <span style={{ color: '#FCD34D', fontWeight: 700 }}>{academicResults?.profile?.studentCode || 'STU-1001'}</span>
            </p>
          </div>

          <div className="dmr-dash-actions">
            <button
              type="button"
              className="dmr-dash-btn dmr-dash-btn-secondary"
              onClick={() => {
                setActiveTab('feedback');
              }}
            >
              ⭐ Gửi phản hồi GV
            </button>
            <button
              type="button"
              className="dmr-dash-btn dmr-dash-btn-primary"
              onClick={() => {
                if (registrations.length > 0) {
                  setPaymentEnrollmentId(registrations[0]._id);
                }
                setIsPaymentModalOpen(true);
              }}
            >
              💳 Đóng học phí
            </button>
          </div>
        </div>

        {/* Global Notice message */}
        {message && (
          <div
            style={{
              padding: '12px 18px',
              borderRadius: '10px',
              marginBottom: '20px',
              backgroundColor: message.type === 'success' ? 'rgba(87, 208, 97, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${message.type === 'success' ? '#57D061' : '#EF4444'}`,
              color: '#FFF',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>{message.text}</span>
            <button
              type="button"
              onClick={() => setMessage(null)}
              style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', fontSize: '1rem' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '24px', paddingBottom: '4px' }}>
          {[
            { id: 'overview', label: '📊 Tổng quan', uc: 'UC14, UC20' },
            { id: 'classes', label: '🏫 Lớp & Giảng viên', uc: 'UC14, UC16, UC17' },
            { id: 'schedule', label: '📅 Thời khóa biểu', uc: 'UC15, UC23' },
            { id: 'assignments', label: '✍️ Bài tập & Nộp bài', uc: 'UC18, UC19' },
            { id: 'results', label: '🏆 Bảng điểm & Học tập', uc: 'UC20' },
            { id: 'requests', label: '🔄 Đổi lớp & Lịch', uc: 'UC21, UC22, UC24' },
            { id: 'feedback', label: '💬 Đánh giá GV', uc: 'Feedback' },
            { id: 'payments', label: '💳 Học phí & Ghi danh', uc: 'UC12, UC13' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '10px 16px',
                borderRadius: '25px',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
                backgroundColor: activeTab === tab.id ? '#57D061' : 'rgba(255,255,255,0.08)',
                color: activeTab === tab.id ? '#052F2E' : '#FFFFFF',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#DDD' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 16px' }} />
            Đang tải dữ liệu từ database...
          </div>
        ) : (
          <>
            {/* ── TAB 1: OVERVIEW ────────────────────────────────────── */}
            {activeTab === 'overview' && (
              <div>
                <div className="dmr-kpi-grid">
                  <div className="dmr-kpi-card">
                    <div className="dmr-kpi-icon">📚</div>
                    <div className="dmr-kpi-info">
                      <span className="dmr-kpi-value" style={{ fontSize: '1.25rem' }}>
                        {currentClass ? currentClass.classCode : 'Chưa xếp lớp'}
                      </span>
                      <span className="dmr-kpi-label">Lớp học hiện tại</span>
                      <span className="dmr-kpi-trend dmr-trend-up">
                        {currentClass?.teacher?.fullName ? `GV: ${currentClass.teacher.fullName}` : 'Chưa phân công'}
                      </span>
                    </div>
                  </div>

                  <div className="dmr-kpi-card">
                    <div className="dmr-kpi-icon" style={{ background: 'rgba(245, 158, 11, 0.2)', borderColor: '#F59E0B' }}>
                      🏆
                    </div>
                    <div className="dmr-kpi-info">
                      <span className="dmr-kpi-value">
                        {academicResults?.profile?.currentBand ? `IELTS ${academicResults.profile.currentBand}` : '5.5 Overall'}
                      </span>
                      <span className="dmr-kpi-label">Band điểm hiện tại</span>
                      <span className="dmr-kpi-trend dmr-trend-highlight">
                        Target: {academicResults?.profile?.targetBand || 7.0}+
                      </span>
                    </div>
                  </div>

                  <div className="dmr-kpi-card">
                    <div className="dmr-kpi-icon">✅</div>
                    <div className="dmr-kpi-info">
                      <span className="dmr-kpi-value">{attendance?.stats?.attendanceRate || '100%'}</span>
                      <span className="dmr-kpi-label">Tỷ lệ chuyên cần</span>
                      <span className="dmr-kpi-trend dmr-trend-up">
                        {attendance?.stats?.presentSessions || 0}/{attendance?.stats?.totalSessions || 0} buổi học
                      </span>
                    </div>
                  </div>

                  <div className="dmr-kpi-card">
                    <div className="dmr-kpi-icon" style={{ background: 'rgba(236, 110, 35, 0.2)', borderColor: '#EC6E23' }}>
                      📝
                    </div>
                    <div className="dmr-kpi-info">
                      <span className="dmr-kpi-value">
                        {assignments.filter((a) => !a.submission).length} Bài
                      </span>
                      <span className="dmr-kpi-label">Bài tập cần nộp</span>
                      <span className="dmr-kpi-trend" style={{ color: '#FCD34D' }}>
                        {assignments.filter((a) => a.submission).length} bài đã hoàn thành
                      </span>
                    </div>
                  </div>
                </div>

                <div className="dmr-dash-content-grid" style={{ marginTop: '24px' }}>
                  {/* Left Column: Schedule Quickview */}
                  <div className="dmr-card">
                    <div className="dmr-card-header">
                      <h3 className="dmr-card-title">📅 Lịch Học Tuần Này</h3>
                      <button
                        type="button"
                        className="dmr-card-action"
                        onClick={() => setActiveTab('schedule')}
                      >
                        Xem tất cả ➔
                      </button>
                    </div>
                    {schedule.length === 0 ? (
                      <p style={{ color: 'rgba(255,255,255,0.6)', padding: '16px' }}>Chưa có lịch học nào được sắp xếp.</p>
                    ) : (
                      <div className="dmr-schedule-list">
                        {schedule.slice(0, 3).map((item) => (
                          <div key={item._id} className="dmr-schedule-item">
                            <div className="dmr-schedule-time">
                              <span className="dmr-schedule-day">{item.dayOfWeek}</span>
                              <span className="dmr-schedule-hours">{item.startTime} - {item.endTime}</span>
                            </div>
                            <div className="dmr-schedule-details">
                              <h4 className="dmr-schedule-subject">{item.topic || 'Buổi học IELTS'}</h4>
                              <p className="dmr-schedule-meta">
                                📍 {item.classroom || item.room} • 👨‍🏫 {item.class?.teacher?.fullName || 'Giảng viên'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Homework Quickview */}
                  <div className="dmr-card">
                    <div className="dmr-card-header">
                      <h3 className="dmr-card-title">✍️ Bài Tập Đang Chờ Nộp</h3>
                      <button
                        type="button"
                        className="dmr-card-action"
                        onClick={() => setActiveTab('assignments')}
                      >
                        Nộp bài ➔
                      </button>
                    </div>
                    {assignments.length === 0 ? (
                      <p style={{ color: 'rgba(255,255,255,0.6)', padding: '16px' }}>Không có bài tập nào cần làm.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {assignments.slice(0, 4).map((a) => (
                          <div
                            key={a._id}
                            style={{
                              padding: '12px 16px',
                              borderRadius: '10px',
                              backgroundColor: 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <div>
                              <strong style={{ fontSize: '0.95rem', color: '#FFF' }}>{a.title}</strong>
                              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                                Hạn nộp: {new Date(a.dueDate).toLocaleDateString('vi-VN')}
                              </p>
                            </div>
                            <div>
                              {a.submission ? (
                                <span style={{ padding: '4px 10px', borderRadius: '15px', fontSize: '0.75rem', backgroundColor: 'rgba(87,208,97,0.2)', color: '#57D061', fontWeight: 700 }}>
                                  {a.submission.status === 'GRADED' ? `Điểm: ${a.submission.grade}` : 'Đã nộp'}
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedAssignment(a);
                                    setActiveTab('assignments');
                                  }}
                                  style={{
                                    backgroundColor: '#EC6E23',
                                    border: 'none',
                                    color: '#FFF',
                                    padding: '6px 14px',
                                    borderRadius: '15px',
                                    fontWeight: 700,
                                    fontSize: '0.78rem',
                                    cursor: 'pointer',
                                  }}
                                >
                                  Nộp ngay
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 2: CLASSES & TEACHER INFO (UC14, UC16, UC17) ────── */}
            {activeTab === 'classes' && (
              <div>
                <h2 style={{ fontSize: '1.3rem', color: '#FFF', marginBottom: '16px' }}>
                  Thông Tin Lớp Học &amp; Giảng Viên Giảng Dạy (UC14, UC16, UC17)
                </h2>
                {classes.length === 0 ? (
                  <div className="dmr-card" style={{ textAlign: 'center', padding: '40px' }}>
                    <p>Bạn chưa được ghi danh vào lớp học nào. Vui lòng liên hệ Phòng Giáo vụ để được phân lớp.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
                    {classes.map((cls) => (
                      <div key={cls.classId} className="dmr-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <div>
                            <span style={{ fontSize: '0.8rem', color: '#FCD34D', fontWeight: 800 }}>MÃ LỚP: {cls.classCode}</span>
                            <h3 style={{ margin: '4px 0 0', fontSize: '1.2rem', color: '#FFF' }}>{cls.name}</h3>
                          </div>
                          <span style={{ padding: '4px 10px', borderRadius: '15px', fontSize: '0.75rem', backgroundColor: '#57D061', color: '#052F2E', fontWeight: 800 }}>
                            {cls.enrollmentStatus}
                          </span>
                        </div>

                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '14px', marginTop: '10px' }}>
                          <p style={{ margin: '6px 0', fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>
                            <strong>Phòng học:</strong> {cls.room}
                          </p>
                          <p style={{ margin: '6px 0', fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>
                            <strong>Lịch học:</strong> {cls.scheduleDays?.join(', ')} ({cls.timeSlot})
                          </p>
                          <p style={{ margin: '6px 0', fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>
                            <strong>Thời gian:</strong> {new Date(cls.startDate).toLocaleDateString('vi-VN')} ➔ {new Date(cls.endDate).toLocaleDateString('vi-VN')}
                          </p>
                          <p style={{ margin: '6px 0', fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>
                            <strong>Sĩ số lớp:</strong> {cls.currentEnrollment}/{cls.capacity} học viên
                          </p>
                          {cls.finalScore !== undefined && (
                            <p style={{ margin: '6px 0', fontSize: '0.95rem', color: '#A0EC1D', fontWeight: 700 }}>
                              <strong>Điểm tổng kết:</strong> {cls.finalScore}/10 ({cls.academicResult})
                            </p>
                          )}
                        </div>

                        {/* Teacher profile section */}
                        {cls.teacher && (
                          <div style={{ marginTop: '16px', padding: '14px', borderRadius: '12px', backgroundColor: 'rgba(87,208,97,0.06)', border: '1px solid rgba(87,208,97,0.2)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#57D061', color: '#052F2E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem' }}>
                                {cls.teacher.fullName?.charAt(0)}
                              </div>
                              <div>
                                <span style={{ fontSize: '0.75rem', color: '#A0EC1D', textTransform: 'uppercase', fontWeight: 700 }}>Giảng Viên Phụ Trách</span>
                                <h4 style={{ margin: 0, fontSize: '1rem', color: '#FFF' }}>{cls.teacher.fullName}</h4>
                                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>{cls.teacher.email} • {cls.teacher.phone}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 3: SCHEDULE & ATTENDANCE (UC15, UC23) ────────────── */}
            {activeTab === 'schedule' && (
              <div>
                <h2 style={{ fontSize: '1.3rem', color: '#FFF', marginBottom: '16px' }}>
                  Lịch Học Tuần &amp; Kết Quả Chuyên Cần (UC15, UC23)
                </h2>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                  {schedule.map((sc) => (
                    <div key={sc._id} className="dmr-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FCD34D' }}>{sc.dayOfWeek}</span>
                        <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', backgroundColor: 'rgba(255,255,255,0.1)', color: '#FFF' }}>
                          {sc.startTime} - {sc.endTime}
                        </span>
                      </div>
                      <h4 style={{ margin: '0 0 8px', color: '#FFF', fontSize: '1rem' }}>{sc.topic || 'Buổi học IELTS'}</h4>
                      <p style={{ margin: '4px 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                        📍 {sc.classroom || sc.room}
                      </p>
                      <p style={{ margin: '4px 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                        👨‍🏫 {sc.class?.teacher?.fullName || 'Giảng viên IELTS'}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Attendance details */}
                {attendance && (
                  <div className="dmr-card">
                    <div className="dmr-card-header">
                      <h3 className="dmr-card-title">📋 Lịch Sử Điểm Danh Chuyên Cần</h3>
                      <span style={{ color: '#57D061', fontWeight: 700 }}>
                        Tỷ lệ có mặt: {attendance.stats?.attendanceRate}
                      </span>
                    </div>
                    {attendance.records?.length === 0 ? (
                      <p style={{ color: 'rgba(255,255,255,0.6)' }}>Chưa có bản ghi điểm danh nào.</p>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px', color: '#FFF' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                            <th style={{ padding: '8px' }}>Ngày học</th>
                            <th style={{ padding: '8px' }}>Lớp học</th>
                            <th style={{ padding: '8px' }}>Trạng thái</th>
                            <th style={{ padding: '8px' }}>Ghi chú của GV</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendance.records.map((r: any) => (
                            <tr key={r._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem' }}>
                              <td style={{ padding: '10px 8px' }}>{new Date(r.sessionDate).toLocaleDateString('vi-VN')}</td>
                              <td style={{ padding: '10px 8px' }}>{r.class?.name || r.class?.classCode}</td>
                              <td style={{ padding: '10px 8px' }}>
                                <span style={{
                                  padding: '3px 8px',
                                  borderRadius: '10px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  backgroundColor: r.status === 'PRESENT' ? 'rgba(87,208,97,0.2)' : 'rgba(239,68,68,0.2)',
                                  color: r.status === 'PRESENT' ? '#57D061' : '#EF4444',
                                }}>
                                  {r.status === 'PRESENT' ? 'Có mặt' : r.status === 'LATE' ? 'Đi muộn' : 'Vắng'}
                                </span>
                              </td>
                              <td style={{ padding: '10px 8px', color: 'rgba(255,255,255,0.7)' }}>{r.notes || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 4: ASSIGNMENTS & DO ASSIGNMENT (UC18, UC19) ──────── */}
            {activeTab === 'assignments' && (
              <div>
                <h2 style={{ fontSize: '1.3rem', color: '#FFF', marginBottom: '16px' }}>
                  Danh Sách Bài Tập &amp; Nộp Bài Trực Tuyến (UC18, UC19)
                </h2>

                {/* Submit Modal / Panel */}
                {selectedAssignment && (
                  <div className="dmr-card" style={{ marginBottom: '24px', borderColor: '#57D061' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h3 style={{ margin: 0, color: '#57D061' }}>
                        Nộp Bài: {selectedAssignment.title}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setSelectedAssignment(null)}
                        style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', fontSize: '1.2rem' }}
                      >
                        ✕
                      </button>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', marginBottom: '14px' }}>
                      {selectedAssignment.description}
                    </p>
                    <form onSubmit={handleDoAssignment}>
                      <textarea
                        rows={6}
                        value={submissionContent}
                        onChange={(e) => setSubmissionContent(e.target.value)}
                        placeholder="Nhập nội dung bài làm của bạn tại đây (Writing Task / Speaking link / Câu trả lời)..."
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(0,0,0,0.3)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          color: '#FFF',
                          fontSize: '0.9rem',
                          marginBottom: '12px',
                        }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedAssignment(null)}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '20px',
                            border: '1px solid rgba(255,255,255,0.3)',
                            background: 'none',
                            color: '#FFF',
                            cursor: 'pointer',
                          }}
                        >
                          Hủy bỏ
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          style={{
                            padding: '8px 24px',
                            borderRadius: '20px',
                            backgroundColor: '#57D061',
                            border: 'none',
                            color: '#052F2E',
                            fontWeight: 800,
                            cursor: 'pointer',
                          }}
                        >
                          {isSubmitting ? 'Đang gửi...' : 'Nộp bài ngay'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {assignments.map((a) => (
                    <div key={a._id} className="dmr-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '10px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              backgroundColor: a.type === 'FINAL_EXAM' ? '#EC6E23' : 'rgba(255,255,255,0.1)',
                              color: '#FFF',
                            }}>
                              {a.type === 'FINAL_EXAM' ? 'KỲ THI CUỐI KHÓA' : 'BÀI TẬP VỀ NHÀ'}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: '#FCD34D' }}>Lớp: {a.class?.name || a.class?.classCode}</span>
                          </div>
                          <h3 style={{ margin: '0 0 6px', color: '#FFF', fontSize: '1.15rem' }}>{a.title}</h3>
                          <p style={{ margin: '0 0 10px', color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem', lineHeight: 1.4 }}>
                            {a.description}
                          </p>
                          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                            Hạn nộp: {new Date(a.dueDate).toLocaleDateString('vi-VN')} • Thang điểm tối đa: {a.maxScore}
                          </span>
                        </div>

                        <div>
                          {a.submission ? (
                            <div style={{ textAlign: 'right' }}>
                              <span style={{
                                padding: '4px 12px',
                                borderRadius: '15px',
                                fontSize: '0.8rem',
                                fontWeight: 800,
                                backgroundColor: a.submission.status === 'GRADED' ? 'rgba(87,208,97,0.2)' : 'rgba(245,158,11,0.2)',
                                color: a.submission.status === 'GRADED' ? '#57D061' : '#F59E0B',
                              }}>
                                {a.submission.status === 'GRADED' ? `Đã chấm: ${a.submission.grade}/${a.maxScore}` : 'Đã nộp bài (Chờ chấm)'}
                              </span>
                              {a.submission.feedback && (
                                <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: '#A0EC1D', fontStyle: 'italic', maxWidth: '300px' }}>
                                  Nhận xét của GV: "{a.submission.feedback}"
                                </p>
                              )}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedAssignment(a);
                                setSubmissionContent('');
                              }}
                              style={{
                                backgroundColor: '#57D061',
                                border: 'none',
                                color: '#052F2E',
                                padding: '8px 20px',
                                borderRadius: '20px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                              }}
                            >
                              Làm bài
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── TAB 5: ACADEMIC RESULTS (UC20) ───────────────────────── */}
            {activeTab === 'results' && (
              <div>
                <h2 style={{ fontSize: '1.3rem', color: '#FFF', marginBottom: '16px' }}>
                  Bảng Điểm &amp; Kết Quả Đào Tạo Chi Tiết (UC20)
                </h2>

                <div className="dmr-card" style={{ marginBottom: '24px' }}>
                  <h3 className="dmr-card-title">Kết Quả Đánh Giá Các Lớp Học</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px', color: '#FFF' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                        <th style={{ padding: '8px' }}>Khóa học / Lớp</th>
                        <th style={{ padding: '8px' }}>Điểm Giữa kỳ</th>
                        <th style={{ padding: '8px' }}>Điểm Cuối khóa</th>
                        <th style={{ padding: '8px' }}>Kết quả học tập</th>
                        <th style={{ padding: '8px' }}>Trạng thái học vụ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {academicResults?.enrollments?.map((en: any) => (
                        <tr key={en._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem' }}>
                          <td style={{ padding: '10px 8px' }}>
                            <strong>{en.class?.name || en.course?.title}</strong>
                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{en.class?.classCode}</div>
                          </td>
                          <td style={{ padding: '10px 8px', color: '#FCD34D' }}>{en.midtermScore !== undefined ? `${en.midtermScore}/10` : '—'}</td>
                          <td style={{ padding: '10px 8px', color: '#57D061', fontWeight: 800 }}>{en.finalScore !== undefined ? `${en.finalScore}/10` : '—'}</td>
                          <td style={{ padding: '10px 8px' }}>
                            <span style={{ color: '#A0EC1D', fontWeight: 700 }}>
                              {en.academicResult || 'Đang theo học'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 8px' }}>{en.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="dmr-card">
                  <h3 className="dmr-card-title">Chi Tiết Điểm Từng Bài Tập &amp; Nhận Xét Của Giảng Viên</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                    {academicResults?.gradedSubmissions?.map((sub: any) => (
                      <div
                        key={sub._id}
                        style={{
                          padding: '12px 16px',
                          borderRadius: '10px',
                          backgroundColor: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.08)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: '1rem', color: '#FFF' }}>
                            {sub.assignment?.title}
                          </strong>
                          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#57D061' }}>
                            {sub.grade} Điểm
                          </span>
                        </div>
                        <p style={{ margin: '6px 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>
                          <strong>Bài làm:</strong> {sub.content?.slice(0, 150)}...
                        </p>
                        {sub.feedback && (
                          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#A0EC1D' }}>
                            💬 <strong>Nhận xét:</strong> {sub.feedback} (Chấm bởi: {sub.gradedBy?.fullName || 'Giảng viên'})
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 6: REQUESTS (UC21, UC22, UC24) ──────────────────── */}
            {activeTab === 'requests' && (
              <div>
                <h2 style={{ fontSize: '1.3rem', color: '#FFF', marginBottom: '16px' }}>
                  Yêu Cầu Thay Đổi Lớp Học &amp; Lịch Học (UC21, UC22, UC24)
                </h2>

                {/* Submit form */}
                <div className="dmr-card" style={{ marginBottom: '24px' }}>
                  <h3 className="dmr-card-title">Gửi Yêu Cầu Mới Tới Phòng Giáo Vụ</h3>
                  <form onSubmit={handleSubmitChangeRequest} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '14px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>
                          Loại yêu cầu:
                        </label>
                        <select
                          value={requestType}
                          onChange={(e) => setRequestType(e.target.value as any)}
                          style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '8px',
                            backgroundColor: '#0F2F2E',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: '#FFF',
                          }}
                        >
                          <option value="CLASS_CHANGE">Chuyển sang Lớp học khác (UC21)</option>
                          <option value="SCHEDULE_CHANGE">Thay đổi Lịch học trong tuần (UC22)</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>
                          Lớp học hiện tại:
                        </label>
                        <select
                          value={requestCurrentClass}
                          onChange={(e) => setRequestCurrentClass(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '8px',
                            backgroundColor: '#0F2F2E',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: '#FFF',
                          }}
                        >
                          {classes.map((c) => (
                            <option key={c.classId} value={c.classId}>
                              {c.name} ({c.classCode})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>
                          Khung giờ mong muốn chuyển sang:
                        </label>
                        <input
                          type="text"
                          value={requestTargetSchedule}
                          onChange={(e) => setRequestTargetSchedule(e.target.value)}
                          placeholder="VD: Ca tối Thứ 3-5-7 (19h00)"
                          style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '8px',
                            backgroundColor: '#0F2F2E',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: '#FFF',
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>
                        Lý do chuyển đổi cụ thể:
                      </label>
                      <textarea
                        rows={3}
                        value={requestReason}
                        onChange={(e) => setRequestReason(e.target.value)}
                        placeholder="Nêu rõ lý do (trùng lịch công tác, lịch thi học kỳ, muốn học cùng giáo viên khác...)"
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '8px',
                          backgroundColor: '#0F2F2E',
                          border: '1px solid rgba(255,255,255,0.2)',
                          color: '#FFF',
                        }}
                      />
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <button
                        type="submit"
                        style={{
                          backgroundColor: '#57D061',
                          border: 'none',
                          color: '#052F2E',
                          padding: '10px 24px',
                          borderRadius: '25px',
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        Gửi yêu cầu xét duyệt
                      </button>
                    </div>
                  </form>
                </div>

                {/* Track requests list (UC24) */}
                <div className="dmr-card">
                  <h3 className="dmr-card-title">Lịch Sử &amp; Tiến Trình Xét Duyệt Yêu Cầu (UC24)</h3>
                  {changeRequests.length === 0 ? (
                    <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '10px' }}>Bạn chưa gửi yêu cầu thay đổi nào.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                      {changeRequests.map((req) => (
                        <div
                          key={req._id}
                          style={{
                            padding: '14px 16px',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div>
                            <span style={{ fontSize: '0.75rem', color: '#FCD34D', fontWeight: 700 }}>
                              {req.requestType === 'CLASS_CHANGE' ? 'ĐỔI LỚP HỌC' : 'ĐỔI LỊCH HỌC'}
                            </span>
                            <h4 style={{ margin: '4px 0', color: '#FFF' }}>{req.reason}</h4>
                            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                              Lớp: {req.currentClass?.name || req.currentClass?.classCode} • Ngày gửi: {new Date(req.createdAt).toLocaleDateString('vi-VN')}
                            </span>
                            {req.reviewNote && (
                              <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: '#A0EC1D' }}>
                                Phản hồi từ Giáo vụ: "{req.reviewNote}"
                              </p>
                            )}
                          </div>
                          <span
                            style={{
                              padding: '4px 12px',
                              borderRadius: '15px',
                              fontSize: '0.8rem',
                              fontWeight: 800,
                              backgroundColor:
                                req.status === 'APPROVED'
                                  ? 'rgba(87,208,97,0.2)'
                                  : req.status === 'PENDING'
                                  ? 'rgba(245,158,11,0.2)'
                                  : 'rgba(239,68,68,0.2)',
                              color:
                                req.status === 'APPROVED'
                                  ? '#57D061'
                                  : req.status === 'PENDING'
                                  ? '#F59E0B'
                                  : '#EF4444',
                            }}
                          >
                            {req.status === 'APPROVED' ? 'Đã duyệt' : req.status === 'PENDING' ? 'Chờ duyệt' : 'Từ chối'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── TAB 7: FEEDBACK ──────────────────────────────────────── */}
            {activeTab === 'feedback' && (
              <div className="dmr-card" style={{ maxWidth: '650px', margin: '0 auto' }}>
                <h3 className="dmr-card-title">Đánh Giá Giảng Viên &amp; Khóa Học</h3>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginBottom: '16px' }}>
                  Ý kiến của bạn giúp EduCenter liên tục nâng cao chất lượng giảng dạy và trải nghiệm học thuật.
                </p>

                <form onSubmit={handleSubmitFeedback} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>
                      Lớp học &amp; Giảng viên:
                    </label>
                    <select
                      value={feedbackClassId}
                      onChange={(e) => {
                        setFeedbackClassId(e.target.value);
                        const c = classes.find((cl) => cl.classId === e.target.value);
                        if (c?.teacher?._id) setFeedbackReceiver(c.teacher._id);
                      }}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '8px',
                        backgroundColor: '#0F2F2E',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: '#FFF',
                      }}
                    >
                      {classes.map((c) => (
                        <option key={c.classId} value={c.classId}>
                          {c.name} - GV: {c.teacher?.fullName || 'Giảng viên'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>
                      Mức độ hài lòng:
                    </label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFeedbackRating(star)}
                          style={{
                            fontSize: '1.6rem',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            opacity: star <= feedbackRating ? 1 : 0.3,
                            transition: 'opacity 0.2s',
                          }}
                        >
                          ⭐
                        </button>
                      ))}
                      <span style={{ alignSelf: 'center', color: '#FCD34D', fontWeight: 700, marginLeft: '8px' }}>
                        {feedbackRating} / 5 Sao
                      </span>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>
                      Ý kiến đóng góp &amp; nhận xét chi tiết:
                    </label>
                    <textarea
                      rows={5}
                      value={feedbackContent}
                      onChange={(e) => setFeedbackContent(e.target.value)}
                      placeholder="Chia sẻ về phương pháp dạy, sửa bài Writing/Speaking, tài liệu hoặc thái độ giảng viên..."
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        backgroundColor: '#0F2F2E',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: '#FFF',
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    style={{
                      backgroundColor: '#57D061',
                      border: 'none',
                      color: '#052F2E',
                      padding: '12px',
                      borderRadius: '25px',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    Gửi phản hồi đánh giá
                  </button>
                </form>
              </div>
            )}

            {/* ── TAB 8: PAYMENTS & REGISTRATIONS (UC12, UC13) ──────────── */}
            {activeTab === 'payments' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '1.3rem', color: '#FFF', margin: 0 }}>
                    Trạng Thái Đăng Ký &amp; Thanh Toán Học Phí (UC12, UC13)
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsPaymentModalOpen(true)}
                    style={{
                      backgroundColor: '#57D061',
                      border: 'none',
                      color: '#052F2E',
                      padding: '8px 18px',
                      borderRadius: '20px',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    + Nộp học phí mới
                  </button>
                </div>

                <div className="dmr-card">
                  <h3 className="dmr-card-title">Danh Sách Khóa Học Đã Đăng Ký (UC13)</h3>
                  {registrations.length === 0 ? (
                    <p style={{ color: 'rgba(255,255,255,0.6)' }}>Chưa có bản ghi đăng ký nào.</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px', color: '#FFF' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                          <th style={{ padding: '8px' }}>Khóa học</th>
                          <th style={{ padding: '8px' }}>Lớp xếp</th>
                          <th style={{ padding: '8px' }}>Học phí</th>
                          <th style={{ padding: '8px' }}>Tình trạng đóng tiền</th>
                          <th style={{ padding: '8px' }}>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {registrations.map((reg) => (
                          <tr key={reg._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem' }}>
                            <td style={{ padding: '10px 8px' }}>
                              <strong>{reg.course?.title || 'Khóa học IELTS'}</strong>
                            </td>
                            <td style={{ padding: '10px 8px' }}>{reg.class?.name || 'Đang chờ xếp lớp'}</td>
                            <td style={{ padding: '10px 8px', color: '#FCD34D' }}>
                              {((reg.course?.tuitionFee) || 9200000).toLocaleString('vi-VN')} ₫
                            </td>
                            <td style={{ padding: '10px 8px' }}>
                              <span style={{
                                padding: '3px 8px',
                                borderRadius: '10px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                backgroundColor: reg.tuitionStatus === 'PAID' ? 'rgba(87,208,97,0.2)' : 'rgba(245,158,11,0.2)',
                                color: reg.tuitionStatus === 'PAID' ? '#57D061' : '#F59E0B',
                              }}>
                                {reg.tuitionStatus === 'PAID' ? 'ĐÃ HOÀN TẤT' : 'CHƯA THANH TOÁN'}
                              </span>
                            </td>
                            <td style={{ padding: '10px 8px' }}>
                              {reg.tuitionStatus !== 'PAID' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPaymentEnrollmentId(reg._id);
                                    setPaymentAmount(reg.course?.tuitionFee || 9200000);
                                    setIsPaymentModalOpen(true);
                                  }}
                                  style={{
                                    backgroundColor: '#EC6E23',
                                    border: 'none',
                                    color: '#FFF',
                                    padding: '4px 12px',
                                    borderRadius: '12px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                  }}
                                >
                                  Thanh toán ngay
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── PAYMENT MODAL (UC12: Make Payment) ─────────────────────── */}
        {isPaymentModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(5px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '16px',
            }}
          >
            <div
              style={{
                backgroundColor: '#0F2F2E',
                border: '1px solid #1E4E4D',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '500px',
                padding: '24px',
                color: '#FFF',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, color: '#57D061' }}>💳 Cổng Thanh Toán Học Phí (UC12)</h3>
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', fontSize: '1.2rem' }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleMakePayment} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>
                    Số tiền thanh toán (VNĐ):
                  </label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#FFF',
                      fontSize: '1rem',
                      fontWeight: 700,
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>
                    Phương thức thanh toán:
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      backgroundColor: '#0F2F2E',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#FFF',
                    }}
                  >
                    <option value="VNPAY">Cổng VNPAY (QR Code &amp; ATM)</option>
                    <option value="BANK_TRANSFER">Chuyển khoản ngân hàng trực tiếp</option>
                    <option value="CREDIT_CARD">Thẻ tín dụng / Ghi nợ quốc tế</option>
                    <option value="CASH">Tiền mặt tại quầy Giáo vụ</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>
                    Nội dung chuyển khoản / Ghi chú:
                  </label>
                  <input
                    type="text"
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    placeholder="VD: Nguyễn Văn A nộp học phí IELTS K26"
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#FFF',
                    }}
                  />
                </div>

                <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setIsPaymentModalOpen(false)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '20px',
                      border: '1px solid rgba(255,255,255,0.3)',
                      background: 'none',
                      color: '#FFF',
                      cursor: 'pointer',
                    }}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '8px 24px',
                      borderRadius: '20px',
                      backgroundColor: '#57D061',
                      border: 'none',
                      color: '#052F2E',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    Xác nhận thanh toán
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
