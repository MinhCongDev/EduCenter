import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import teacherService from '../../services/teacher.service';
import '../dashboard/Dashboard.css';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'classes' | 'students' | 'schedule' | 'assignments' | 'grading' | 'attendance' | 'requests'>('overview');

  // Database Data States
  const [classes, setClasses] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [changeRequests, setChangeRequests] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [classAttendance, setClassAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Grading State
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [gradingSubmission, setGradingSubmission] = useState<any>(null);
  const [gradeValue, setGradeValue] = useState<number>(8.0);
  const [gradeFeedback, setGradeFeedback] = useState<string>('');

  // Update Student Final Grade State
  const [updatingEnrollment, setUpdatingEnrollment] = useState<any>(null);
  const [finalScoreInput, setFinalScoreInput] = useState<number>(8.0);
  const [academicResultInput, setAcademicResultInput] = useState<string>('ĐẠT LOẠI GIỎI');

  // Create Assignment State
  const [isCreateAssignmentOpen, setIsCreateAssignmentOpen] = useState<boolean>(false);
  const [newAssignmentTitle, setNewAssignmentTitle] = useState<string>('');
  const [newAssignmentDesc, setNewAssignmentDesc] = useState<string>('');
  const [newAssignmentDueDate, setNewAssignmentDueDate] = useState<string>('');
  const [newAssignmentMaxScore, setNewAssignmentMaxScore] = useState<number>(9.0);
  const [newAssignmentType, setNewAssignmentType] = useState<string>('HOMEWORK');

  // Schedule change request state
  const [reqClassId, setReqClassId] = useState<string>('');
  const [reqTargetSchedule, setReqTargetSchedule] = useState<string>('');
  const [reqReason, setReqReason] = useState<string>('');

  // Attendance Check State (Take attendance)
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, { status: string; notes: string }>>({});

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [cls, sch, asg, cr] = await Promise.all([
        teacherService.getClasses(),
        teacherService.getSchedule(),
        teacherService.getAssignments(),
        teacherService.getChangeRequests(),
      ]);

      setClasses(cls || []);
      setSchedule(sch || []);
      setAssignments(asg || []);
      setChangeRequests(cr || []);

      if (cls && cls.length > 0) {
        setSelectedClassId(cls[0]._id);
        setReqClassId(cls[0]._id);
      }
      if (asg && asg.length > 0) {
        setSelectedAssignmentId(asg[0]._id);
      }
    } catch (err: any) {
      console.error('Lỗi khi nạp dữ liệu giảng viên:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Fetch students & attendance when selectedClassId changes
  useEffect(() => {
    if (!selectedClassId) return;

    const fetchClassDetails = async () => {
      try {
        const [students, att] = await Promise.all([
          teacherService.getClassStudents(selectedClassId),
          teacherService.getClassAttendance(selectedClassId),
        ]);
        setClassStudents(students || []);
        setClassAttendance(att || []);

        // Initialize attendance record map
        const initialMap: Record<string, { status: string; notes: string }> = {};
        (students || []).forEach((st: any) => {
          if (st.user?._id) {
            initialMap[st.user._id] = { status: 'PRESENT', notes: '' };
          }
        });
        setAttendanceRecords(initialMap);
      } catch (err) {
        console.error('Lỗi nạp danh sách học viên lớp:', err);
      }
    };

    fetchClassDetails();
  }, [selectedClassId]);

  // Fetch submissions when selectedAssignmentId changes
  useEffect(() => {
    if (!selectedAssignmentId) return;

    const fetchSubmissions = async () => {
      try {
        const subs = await teacherService.getSubmissions(selectedAssignmentId);
        setSubmissions(subs || []);
      } catch (err) {
        console.error('Lỗi nạp bài nộp:', err);
      }
    };

    fetchSubmissions();
  }, [selectedAssignmentId]);

  const handleGradeSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission) return;

    try {
      await teacherService.gradeSubmission(gradingSubmission._id, {
        grade: Number(gradeValue),
        feedback: gradeFeedback,
      });
      setMessage({ type: 'success', text: 'Chấm điểm và phản hồi bài tập thành công!' });
      setGradingSubmission(null);
      // Reload submissions and assignments
      const subs = await teacherService.getSubmissions(selectedAssignmentId);
      setSubmissions(subs || []);
      const asg = await teacherService.getAssignments();
      setAssignments(asg || []);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi khi chấm điểm' });
    }
  };

  const handleUpdateStudentGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatingEnrollment) return;

    try {
      await teacherService.updateStudentGrade(updatingEnrollment.enrollmentId, {
        finalScore: Number(finalScoreInput),
        academicResult: academicResultInput,
      });
      setMessage({ type: 'success', text: 'Cập nhật điểm tổng kết của học viên thành công!' });
      setUpdatingEnrollment(null);
      // Refresh students
      const students = await teacherService.getClassStudents(selectedClassId);
      setClassStudents(students || []);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi khi cập nhật điểm' });
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssignmentTitle || !newAssignmentDueDate || !selectedClassId) {
      setMessage({ type: 'error', text: 'Vui lòng nhập đầy đủ thông tin bài tập' });
      return;
    }

    try {
      await teacherService.createAssignment({
        classId: selectedClassId,
        title: newAssignmentTitle,
        description: newAssignmentDesc,
        dueDate: newAssignmentDueDate,
        maxScore: Number(newAssignmentMaxScore),
        type: newAssignmentType,
      });
      setMessage({ type: 'success', text: 'Tạo và giao bài tập mới thành công!' });
      setIsCreateAssignmentOpen(false);
      setNewAssignmentTitle('');
      setNewAssignmentDesc('');
      const asg = await teacherService.getAssignments();
      setAssignments(asg || []);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi tạo bài tập' });
    }
  };

  const handleSaveAttendance = async () => {
    if (!selectedClassId) return;

    try {
      const recordsArray = Object.keys(attendanceRecords).map((studentId) => ({
        studentId,
        status: attendanceRecords[studentId].status,
        notes: attendanceRecords[studentId].notes,
      }));

      await teacherService.checkAttendance({
        classId: selectedClassId,
        sessionDate: attendanceDate,
        records: recordsArray,
      });

      setMessage({ type: 'success', text: 'Lưu dữ liệu điểm danh buổi học thành công!' });
      const att = await teacherService.getClassAttendance(selectedClassId);
      setClassAttendance(att || []);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi lưu điểm danh' });
    }
  };

  const handleSubmitScheduleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqClassId || !reqReason.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng chọn lớp học và nêu lý do' });
      return;
    }

    try {
      await teacherService.createScheduleChangeRequest({
        currentClass: reqClassId,
        targetSchedule: reqTargetSchedule,
        reason: reqReason,
      });
      setMessage({ type: 'success', text: 'Đã gửi yêu cầu đổi lịch dạy tới phòng Giáo vụ!' });
      setReqReason('');
      setReqTargetSchedule('');
      const cr = await teacherService.getChangeRequests();
      setChangeRequests(cr || []);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi gửi yêu cầu' });
    }
  };

  return (
    <div className="dmr-dashboard-wrapper">
      <div className="dmr-dashboard-container">
        {/* Header */}
        <div className="dmr-dash-header">
          <div className="dmr-dash-welcome">
            <span className="dmr-dash-role-badge">👨‍🏫 Giảng Viên IELTS • EduCenter Portal</span>
            <h1 className="dmr-dash-title">Không Gian Giảng Dạy &amp; Quản Lý Học Vụ</h1>
            <p className="dmr-dash-subtitle">
              Xin chào, <strong>{user?.fullName}</strong> • Giảng viên IELTS 8.5+ Chuẩn Khảo Thí
            </p>
          </div>

          <div className="dmr-dash-actions">
            <button
              type="button"
              className="dmr-dash-btn dmr-dash-btn-secondary"
              onClick={() => setActiveTab('requests')}
            >
              🔄 Báo đổi lịch dạy
            </button>
            <button
              type="button"
              className="dmr-dash-btn dmr-dash-btn-primary"
              onClick={() => {
                setActiveTab('assignments');
                setIsCreateAssignmentOpen(true);
              }}
            >
              ➕ Tạo bài tập mới
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
            { id: 'overview', label: '📊 Tổng quan' },
            { id: 'classes', label: '🏫 Lớp phân công (UC25)' },
            { id: 'students', label: '👥 DS Học viên (UC26, UC28, UC29, UC32)' },
            { id: 'schedule', label: '📅 Lịch giảng dạy (UC27)' },
            { id: 'assignments', label: '📝 Bài tập & Giao bài (UC30, UC35, UC36)' },
            { id: 'grading', label: '✍️ Chấm điểm bài nộp (UC31, UC32)' },
            { id: 'attendance', label: '✅ Điểm danh (UC37, UC38)' },
            { id: 'requests', label: '🔄 Đổi lịch dạy (UC33, UC34)' },
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
                    <div className="dmr-kpi-icon">🏫</div>
                    <div className="dmr-kpi-info">
                      <span className="dmr-kpi-value">{classes.length} Lớp</span>
                      <span className="dmr-kpi-label">Lớp đang giảng dạy</span>
                      <span className="dmr-kpi-trend dmr-trend-up">Đang hoạt động</span>
                    </div>
                  </div>

                  <div className="dmr-kpi-card">
                    <div className="dmr-kpi-icon" style={{ background: 'rgba(59, 130, 246, 0.2)', borderColor: '#3B82F6' }}>
                      👥
                    </div>
                    <div className="dmr-kpi-info">
                      <span className="dmr-kpi-value">
                        {classes.reduce((sum, c) => sum + (c.currentEnrollment || 0), 0)} HV
                      </span>
                      <span className="dmr-kpi-label">Tổng học viên phụ trách</span>
                      <span className="dmr-kpi-trend dmr-trend-highlight">Đã ghi danh</span>
                    </div>
                  </div>

                  <div className="dmr-kpi-card">
                    <div className="dmr-kpi-icon" style={{ background: 'rgba(236, 110, 35, 0.2)', borderColor: '#EC6E23' }}>
                      📝
                    </div>
                    <div className="dmr-kpi-info">
                      <span className="dmr-kpi-value">
                        {assignments.reduce((sum, a) => sum + (a.pendingCount || 0), 0)} Bài
                      </span>
                      <span className="dmr-kpi-label">Bài nộp chờ chấm</span>
                      <span className="dmr-kpi-trend" style={{ color: '#FCD34D' }}>
                        Cần hoàn thành sớm
                      </span>
                    </div>
                  </div>

                  <div className="dmr-kpi-card">
                    <div className="dmr-kpi-icon">📅</div>
                    <div className="dmr-kpi-info">
                      <span className="dmr-kpi-value">{schedule.length} Ca/Tuần</span>
                      <span className="dmr-kpi-label">Lịch giảng dạy</span>
                      <span className="dmr-kpi-trend dmr-trend-up">Thời khóa biểu chuẩn</span>
                    </div>
                  </div>
                </div>

                <div className="dmr-dash-content-grid" style={{ marginTop: '24px' }}>
                  {/* Left: Classes */}
                  <div className="dmr-card">
                    <div className="dmr-card-header">
                      <h3 className="dmr-card-title">🏫 Danh Sách Lớp Phụ Trách</h3>
                      <button
                        type="button"
                        className="dmr-card-action"
                        onClick={() => setActiveTab('classes')}
                      >
                        Quản lý lớp ➔
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {classes.map((c) => (
                        <div
                          key={c._id}
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
                            <strong style={{ color: '#FFF', fontSize: '0.95rem' }}>{c.name || c.classCode}</strong>
                            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                              📍 {c.room} • {c.scheduleDays?.join(', ')} ({c.timeSlot})
                            </p>
                          </div>
                          <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', backgroundColor: 'rgba(87,208,97,0.15)', color: '#57D061', fontWeight: 800 }}>
                            {c.currentEnrollment}/{c.capacity} HV
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Submissions needing grading */}
                  <div className="dmr-card">
                    <div className="dmr-card-header">
                      <h3 className="dmr-card-title">✍️ Bài Nộp Chờ Chấm</h3>
                      <button
                        type="button"
                        className="dmr-card-action"
                        onClick={() => setActiveTab('grading')}
                      >
                        Chấm bài ngay ➔
                      </button>
                    </div>
                    {assignments.length === 0 ? (
                      <p style={{ color: 'rgba(255,255,255,0.6)' }}>Chưa có bài tập nào được tạo.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {assignments.map((a) => (
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
                              <strong style={{ color: '#FFF', fontSize: '0.95rem' }}>{a.title}</strong>
                              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                                Lớp: {a.class?.name || a.class?.classCode}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedAssignmentId(a._id);
                                setActiveTab('grading');
                              }}
                              style={{
                                backgroundColor: '#EC6E23',
                                border: 'none',
                                color: '#FFF',
                                padding: '6px 14px',
                                borderRadius: '15px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              Chấm bài ({a.pendingCount || 0})
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 2: ASSIGNED CLASSES (UC25) ───────────────────────── */}
            {activeTab === 'classes' && (
              <div>
                <h2 style={{ fontSize: '1.3rem', color: '#FFF', marginBottom: '16px' }}>
                  Danh Sách Lớp Học Được Phân Công Giảng Dạy (UC25)
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
                  {classes.map((cls) => (
                    <div key={cls._id} className="dmr-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div>
                          <span style={{ fontSize: '0.8rem', color: '#FCD34D', fontWeight: 800 }}>MÃ LỚP: {cls.classCode}</span>
                          <h3 style={{ margin: '4px 0 0', color: '#FFF', fontSize: '1.2rem' }}>{cls.name}</h3>
                        </div>
                        <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', backgroundColor: '#57D061', color: '#052F2E', fontWeight: 800 }}>
                          {cls.status}
                        </span>
                      </div>

                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px', marginTop: '10px' }}>
                        <p style={{ margin: '6px 0', fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>
                          <strong>Khóa học:</strong> {cls.course?.title || 'IELTS Academy'}
                        </p>
                        <p style={{ margin: '6px 0', fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>
                          <strong>Phòng học:</strong> {cls.room}
                        </p>
                        <p style={{ margin: '6px 0', fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>
                          <strong>Thời gian học:</strong> {cls.scheduleDays?.join(', ')} ({cls.timeSlot})
                        </p>
                        <p style={{ margin: '6px 0', fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>
                          <strong>Sĩ số hiện tại:</strong> {cls.currentEnrollment} / {cls.capacity} học viên
                        </p>
                        <p style={{ margin: '6px 0', fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>
                          <strong>Khai giảng:</strong> {new Date(cls.startDate).toLocaleDateString('vi-VN')}
                        </p>
                      </div>

                      <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedClassId(cls._id);
                            setActiveTab('students');
                          }}
                          style={{
                            flex: 1,
                            backgroundColor: '#57D061',
                            border: 'none',
                            color: '#052F2E',
                            padding: '8px',
                            borderRadius: '15px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                          }}
                        >
                          Xem DS Học Viên
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedClassId(cls._id);
                            setActiveTab('attendance');
                          }}
                          style={{
                            flex: 1,
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: '#FFF',
                            padding: '8px',
                            borderRadius: '15px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                          }}
                        >
                          Điểm Danh Lớp
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── TAB 3: STUDENT LIST & ACADEMIC RESULTS (UC26, UC28, UC29, UC32) ── */}
            {activeTab === 'students' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '1.3rem', color: '#FFF', margin: 0 }}>
                    Danh Sách Học Viên &amp; Kết Quả Học Tập (UC26, UC28, UC29, UC32)
                  </h2>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      backgroundColor: '#0F2F2E',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#FFF',
                      fontSize: '0.9rem',
                    }}
                  >
                    {classes.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name || c.classCode}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Edit Student Final Score Modal */}
                {updatingEnrollment && (
                  <div className="dmr-card" style={{ marginBottom: '20px', borderColor: '#57D061' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <h3 style={{ margin: 0, color: '#57D061' }}>
                        Cập Nhật Điểm Tổng Kết: {updatingEnrollment.user?.fullName} (UC32)
                      </h3>
                      <button
                        type="button"
                        onClick={() => setUpdatingEnrollment(null)}
                        style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', fontSize: '1.2rem' }}
                      >
                        ✕
                      </button>
                    </div>
                    <form onSubmit={handleUpdateStudentGrade} style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>
                          Điểm tổng kết (thang 10 hoặc band):
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={finalScoreInput}
                          onChange={(e) => setFinalScoreInput(Number(e.target.value))}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            backgroundColor: '#0F2F2E',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: '#FFF',
                            width: '120px',
                          }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: '220px' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>
                          Xếp loại kết quả học thuật:
                        </label>
                        <input
                          type="text"
                          value={academicResultInput}
                          onChange={(e) => setAcademicResultInput(e.target.value)}
                          placeholder="VD: ĐẠT XUẤT SẮC (Target 7.5+)"
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            backgroundColor: '#0F2F2E',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: '#FFF',
                            width: '100%',
                          }}
                        />
                      </div>
                      <button
                        type="submit"
                        style={{
                          marginTop: '20px',
                          backgroundColor: '#57D061',
                          border: 'none',
                          color: '#052F2E',
                          padding: '10px 20px',
                          borderRadius: '20px',
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        Lưu điểm
                      </button>
                    </form>
                  </div>
                )}

                <div className="dmr-card">
                  {classStudents.length === 0 ? (
                    <p style={{ color: 'rgba(255,255,255,0.6)' }}>Chưa có học viên nào được xếp vào lớp này.</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', color: '#FFF' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                          <th style={{ padding: '10px' }}>Mã HV &amp; Họ tên</th>
                          <th style={{ padding: '10px' }}>Liên hệ</th>
                          <th style={{ padding: '10px' }}>Mục tiêu học</th>
                          <th style={{ padding: '10px' }}>Điểm TB Bài tập</th>
                          <th style={{ padding: '10px' }}>Điểm Tổng kết</th>
                          <th style={{ padding: '10px' }}>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classStudents.map((st) => (
                          <tr key={st.enrollmentId} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem' }}>
                            <td style={{ padding: '12px 10px' }}>
                              <strong style={{ color: '#FFF' }}>{st.user?.fullName}</strong>
                              <div style={{ fontSize: '0.75rem', color: '#FCD34D' }}>
                                {st.profile?.studentCode || 'STU-1001'}
                              </div>
                            </td>
                            <td style={{ padding: '12px 10px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                              {st.user?.email}
                              <div>{st.user?.phone}</div>
                            </td>
                            <td style={{ padding: '12px 10px' }}>
                              <span style={{ color: '#A0EC1D', fontWeight: 700 }}>
                                Target: {st.profile?.targetBand || 7.0}+
                              </span>
                              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
                                {st.profile?.learningGoal || 'Du học'}
                              </div>
                            </td>
                            <td style={{ padding: '12px 10px', color: '#FCD34D', fontWeight: 700 }}>
                              {st.averageGrade} ({st.submissionsCount} bài)
                            </td>
                            <td style={{ padding: '12px 10px' }}>
                              {st.finalScore !== undefined ? (
                                <div>
                                  <span style={{ color: '#57D061', fontWeight: 800 }}>{st.finalScore}/10</span>
                                  <div style={{ fontSize: '0.75rem', color: '#A0EC1D' }}>{st.academicResult}</div>
                                </div>
                              ) : (
                                <span style={{ color: 'rgba(255,255,255,0.4)' }}>Chưa nhập</span>
                              )}
                            </td>
                            <td style={{ padding: '12px 10px' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setUpdatingEnrollment(st);
                                  setFinalScoreInput(st.finalScore || 8.0);
                                  setAcademicResultInput(st.academicResult || 'ĐẠT LOẠI GIỎI');
                                }}
                                style={{
                                  backgroundColor: '#57D061',
                                  border: 'none',
                                  color: '#052F2E',
                                  padding: '6px 12px',
                                  borderRadius: '12px',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                Vào điểm (UC32)
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* ── TAB 4: TEACHING SCHEDULE (UC27) ──────────────────────── */}
            {activeTab === 'schedule' && (
              <div>
                <h2 style={{ fontSize: '1.3rem', color: '#FFF', marginBottom: '16px' }}>
                  Thời Khóa Biểu Giảng Dạy Tuần (UC27)
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                  {schedule.map((sc) => (
                    <div key={sc._id} className="dmr-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FCD34D' }}>{sc.dayOfWeek}</span>
                        <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', backgroundColor: 'rgba(255,255,255,0.1)', color: '#FFF' }}>
                          {sc.startTime} - {sc.endTime}
                        </span>
                      </div>
                      <h4 style={{ margin: '0 0 8px', color: '#FFF', fontSize: '1.05rem' }}>{sc.topic || 'Buổi học IELTS'}</h4>
                      <p style={{ margin: '4px 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>
                        🏫 <strong>Lớp:</strong> {sc.class?.name || sc.class?.classCode}
                      </p>
                      <p style={{ margin: '4px 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>
                        📍 <strong>Phòng học:</strong> {sc.classroom || sc.room}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── TAB 5: ASSIGNMENTS & CREATE (UC30, UC35, UC36) ───────── */}
            {activeTab === 'assignments' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '1.3rem', color: '#FFF', margin: 0 }}>
                    Quản Lý &amp; Giao Bài Tập Cho Lớp (UC30, UC35, UC36)
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsCreateAssignmentOpen(!isCreateAssignmentOpen)}
                    style={{
                      backgroundColor: '#57D061',
                      border: 'none',
                      color: '#052F2E',
                      padding: '8px 20px',
                      borderRadius: '20px',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    {isCreateAssignmentOpen ? 'Đóng form' : '+ Tạo bài tập mới'}
                  </button>
                </div>

                {/* Create Assignment Form (UC35, UC36) */}
                {isCreateAssignmentOpen && (
                  <div className="dmr-card" style={{ marginBottom: '24px', borderColor: '#57D061' }}>
                    <h3 className="dmr-card-title">Tạo &amp; Phân Phối Bài Tập Mới (UC35, UC36)</h3>
                    <form onSubmit={handleCreateAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '14px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>
                            Lớp học được giao:
                          </label>
                          <select
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(e.target.value)}
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
                              <option key={c._id} value={c._id}>
                                {c.name || c.classCode}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>
                            Loại bài đánh giá:
                          </label>
                          <select
                            value={newAssignmentType}
                            onChange={(e) => setNewAssignmentType(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '10px',
                              borderRadius: '8px',
                              backgroundColor: '#0F2F2E',
                              border: '1px solid rgba(255,255,255,0.2)',
                              color: '#FFF',
                            }}
                          >
                            <option value="HOMEWORK">Bài tập về nhà (Homework)</option>
                            <option value="FINAL_EXAM">Kỳ thi cuối khóa (Final Exam)</option>
                            <option value="QUIZ">Bài kiểm tra nhanh (Quiz)</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>
                            Hạn nộp bài:
                          </label>
                          <input
                            type="datetime-local"
                            value={newAssignmentDueDate}
                            onChange={(e) => setNewAssignmentDueDate(e.target.value)}
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

                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>
                            Thang điểm tối đa:
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            value={newAssignmentMaxScore}
                            onChange={(e) => setNewAssignmentMaxScore(Number(e.target.value))}
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
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>
                          Tiêu đề bài tập:
                        </label>
                        <input
                          type="text"
                          value={newAssignmentTitle}
                          onChange={(e) => setNewAssignmentTitle(e.target.value)}
                          placeholder="VD: Writing Task 2: Renewable Energy and Economic Growth"
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

                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>
                          Mô tả đề bài &amp; Yêu cầu học thuật:
                        </label>
                        <textarea
                          rows={4}
                          value={newAssignmentDesc}
                          onChange={(e) => setNewAssignmentDesc(e.target.value)}
                          placeholder="Nhập đề bài chi tiết, số lượng từ, định dạng câu trả lời..."
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
                          Phát hành bài tập
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
                            <span style={{ fontSize: '0.8rem', color: '#FCD34D' }}>
                              Lớp: {a.class?.name || a.class?.classCode}
                            </span>
                          </div>
                          <h3 style={{ margin: '4px 0', color: '#FFF' }}>{a.title}</h3>
                          <p style={{ margin: '0 0 10px', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                            {a.description}
                          </p>
                          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                            Hạn nộp: {new Date(a.dueDate).toLocaleDateString('vi-VN')} • Thang điểm: {a.maxScore}
                          </span>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ marginBottom: '8px' }}>
                            <span style={{ fontSize: '0.85rem', color: '#57D061', fontWeight: 700 }}>
                              {a.submissionsCount || 0} bài nộp ({a.gradedCount || 0} đã chấm)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAssignmentId(a._id);
                              setActiveTab('grading');
                            }}
                            style={{
                              backgroundColor: '#57D061',
                              border: 'none',
                              color: '#052F2E',
                              padding: '6px 16px',
                              borderRadius: '15px',
                              fontSize: '0.8rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                            }}
                          >
                            Xem bài làm &amp; Chấm điểm
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── TAB 6: GRADING SUBMISSIONS (UC31, UC32) ──────────────── */}
            {activeTab === 'grading' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '1.3rem', color: '#FFF', margin: 0 }}>
                    Chấm Điểm &amp; Nhận Xét Bài Nộp Của Học Viên (UC31, UC32)
                  </h2>
                  <select
                    value={selectedAssignmentId}
                    onChange={(e) => setSelectedAssignmentId(e.target.value)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      backgroundColor: '#0F2F2E',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#FFF',
                      fontSize: '0.9rem',
                    }}
                  >
                    {assignments.map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.title} ({a.class?.classCode})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Grading Action Modal / Card */}
                {gradingSubmission && (
                  <div className="dmr-card" style={{ marginBottom: '24px', borderColor: '#57D061' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h3 style={{ margin: 0, color: '#57D061' }}>
                        Chấm Bài Của: {gradingSubmission.student?.fullName}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setGradingSubmission(null)}
                        style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', fontSize: '1.2rem' }}
                      >
                        ✕
                      </button>
                    </div>

                    <div style={{ padding: '14px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '8px', marginBottom: '14px' }}>
                      <strong style={{ display: 'block', fontSize: '0.85rem', color: '#FCD34D', marginBottom: '6px' }}>
                        Nội dung học viên nộp:
                      </strong>
                      <p style={{ margin: 0, color: '#FFF', fontSize: '0.9rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                        {gradingSubmission.content}
                      </p>
                    </div>

                    <form onSubmit={handleGradeSubmission} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>
                          Điểm số chấm (Band điểm hoặc thang điểm):
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          value={gradeValue}
                          onChange={(e) => setGradeValue(Number(e.target.value))}
                          style={{
                            width: '120px',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            backgroundColor: '#0F2F2E',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: '#FFF',
                            fontWeight: 700,
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>
                          Nhận xét chi tiết của giảng viên:
                        </label>
                        <textarea
                          rows={3}
                          value={gradeFeedback}
                          onChange={(e) => setGradeFeedback(e.target.value)}
                          placeholder="Chỉ ra ưu điểm, lỗi ngữ pháp, từ vựng hoặc phát âm cần cải thiện..."
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
                          Lưu điểm &amp; Gửi phản hồi
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="dmr-card">
                  {submissions.length === 0 ? (
                    <p style={{ color: 'rgba(255,255,255,0.6)' }}>Chưa có học viên nào nộp bài tập này.</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', color: '#FFF' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                          <th style={{ padding: '8px' }}>Học viên</th>
                          <th style={{ padding: '8px' }}>Thời gian nộp</th>
                          <th style={{ padding: '8px' }}>Nội dung tóm tắt</th>
                          <th style={{ padding: '8px' }}>Điểm</th>
                          <th style={{ padding: '8px' }}>Trạng thái</th>
                          <th style={{ padding: '8px' }}>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {submissions.map((sub) => (
                          <tr key={sub._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem' }}>
                            <td style={{ padding: '10px 8px' }}>
                              <strong>{sub.student?.fullName}</strong>
                              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{sub.student?.email}</div>
                            </td>
                            <td style={{ padding: '10px 8px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                              {new Date(sub.submissionTime).toLocaleString('vi-VN')}
                            </td>
                            <td style={{ padding: '10px 8px', maxWidth: '250px' }}>
                              <p style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {sub.content}
                              </p>
                              {sub.feedback && (
                                <span style={{ fontSize: '0.75rem', color: '#A0EC1D' }}>Phản hồi: "{sub.feedback}"</span>
                              )}
                            </td>
                            <td style={{ padding: '10px 8px', color: '#57D061', fontWeight: 800, fontSize: '1rem' }}>
                              {sub.grade !== undefined ? sub.grade : '—'}
                            </td>
                            <td style={{ padding: '10px 8px' }}>
                              <span style={{
                                padding: '3px 8px',
                                borderRadius: '10px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                backgroundColor: sub.status === 'GRADED' ? 'rgba(87,208,97,0.2)' : 'rgba(245,158,11,0.2)',
                                color: sub.status === 'GRADED' ? '#57D061' : '#F59E0B',
                              }}>
                                {sub.status === 'GRADED' ? 'Đã chấm' : 'Chờ chấm'}
                              </span>
                            </td>
                            <td style={{ padding: '10px 8px' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setGradingSubmission(sub);
                                  setGradeValue(sub.grade || 8.0);
                                  setGradeFeedback(sub.feedback || '');
                                }}
                                style={{
                                  backgroundColor: '#57D061',
                                  border: 'none',
                                  color: '#052F2E',
                                  padding: '5px 14px',
                                  borderRadius: '12px',
                                  fontSize: '0.75rem',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                }}
                              >
                                {sub.status === 'GRADED' ? 'Sửa điểm' : 'Chấm bài'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* ── TAB 7: ATTENDANCE (UC37, UC38) ───────────────────────── */}
            {activeTab === 'attendance' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '1.3rem', color: '#FFF', margin: 0 }}>
                    Theo Dõi &amp; Thực Hiện Điểm Danh Học Viên (UC37, UC38)
                  </h2>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <select
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#0F2F2E',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: '#FFF',
                      }}
                    >
                      {classes.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name || c.classCode}
                        </option>
                      ))}
                    </select>

                    <input
                      type="date"
                      value={attendanceDate}
                      onChange={(e) => setAttendanceDate(e.target.value)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#0F2F2E',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: '#FFF',
                      }}
                    />

                    <button
                      type="button"
                      onClick={handleSaveAttendance}
                      style={{
                        backgroundColor: '#57D061',
                        border: 'none',
                        color: '#052F2E',
                        padding: '8px 20px',
                        borderRadius: '20px',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      Lưu Điểm Danh
                    </button>
                  </div>
                </div>

                <div className="dmr-card">
                  <h3 className="dmr-card-title">Điểm Danh Buổi Học Ngày: {attendanceDate}</h3>
                  {classStudents.length === 0 ? (
                    <p style={{ color: 'rgba(255,255,255,0.6)' }}>Lớp chưa có học viên nào.</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', color: '#FFF', marginTop: '12px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                          <th style={{ padding: '8px' }}>Học viên</th>
                          <th style={{ padding: '8px' }}>Điểm danh</th>
                          <th style={{ padding: '8px' }}>Ghi chú học vụ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classStudents.map((st) => {
                          const currentRec = attendanceRecords[st.user?._id] || { status: 'PRESENT', notes: '' };
                          return (
                            <tr key={st.user?._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <td style={{ padding: '10px 8px' }}>
                                <strong>{st.user?.fullName}</strong>
                                <div style={{ fontSize: '0.75rem', color: '#FCD34D' }}>{st.profile?.studentCode}</div>
                              </td>
                              <td style={{ padding: '10px 8px' }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  {[
                                    { val: 'PRESENT', label: 'Có mặt', color: '#57D061' },
                                    { val: 'LATE', label: 'Đi muộn', color: '#F59E0B' },
                                    { val: 'ABSENT', label: 'Vắng', color: '#EF4444' },
                                  ].map((opt) => (
                                    <button
                                      key={opt.val}
                                      type="button"
                                      onClick={() => {
                                        setAttendanceRecords((prev) => ({
                                          ...prev,
                                          [st.user._id]: { ...prev[st.user._id], status: opt.val },
                                        }));
                                      }}
                                      style={{
                                        padding: '4px 12px',
                                        borderRadius: '15px',
                                        border: `1px solid ${opt.color}`,
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        backgroundColor: currentRec.status === opt.val ? opt.color : 'transparent',
                                        color: currentRec.status === opt.val ? '#052F2E' : opt.color,
                                      }}
                                    >
                                      {opt.label}
                                    </button>
                                  ))}
                                </div>
                              </td>
                              <td style={{ padding: '10px 8px' }}>
                                <input
                                  type="text"
                                  value={currentRec.notes || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setAttendanceRecords((prev) => ({
                                      ...prev,
                                      [st.user._id]: { ...prev[st.user._id], notes: val },
                                    }));
                                  }}
                                  placeholder="Ghi chú (phát biểu tốt, nghỉ có phép...)"
                                  style={{
                                    width: '100%',
                                    maxWidth: '300px',
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    backgroundColor: '#0F2F2E',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    color: '#FFF',
                                    fontSize: '0.85rem',
                                  }}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Lịch sử điểm danh đã lưu (UC37) */}
                <div className="dmr-card" style={{ marginTop: '20px' }}>
                  <h3 className="dmr-card-title">Lịch Sử Điểm Danh Lớp (UC37 - View Attendance)</h3>
                  {classAttendance.length === 0 ? (
                    <p style={{ color: 'rgba(255,255,255,0.6)' }}>Chưa có hồ sơ điểm danh nào được lưu trong hệ thống.</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', color: '#FFF', marginTop: '12px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                          <th style={{ padding: '8px' }}>Ngày học</th>
                          <th style={{ padding: '8px' }}>Học viên</th>
                          <th style={{ padding: '8px' }}>Trạng thái</th>
                          <th style={{ padding: '8px' }}>Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classAttendance.map((att: any) => (
                          <tr key={att._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
                            <td style={{ padding: '8px', color: '#FCD34D' }}>{new Date(att.date).toLocaleDateString('vi-VN')}</td>
                            <td style={{ padding: '8px' }}>{att.student?.fullName || 'Học viên'}</td>
                            <td style={{ padding: '8px' }}>
                              <span style={{
                                padding: '3px 8px',
                                borderRadius: '10px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                backgroundColor: att.status === 'PRESENT' ? 'rgba(87,208,97,0.2)' : att.status === 'LATE' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)',
                                color: att.status === 'PRESENT' ? '#57D061' : att.status === 'LATE' ? '#F59E0B' : '#EF4444',
                              }}>
                                {att.status === 'PRESENT' ? 'Có mặt' : att.status === 'LATE' ? 'Đi muộn' : 'Vắng'}
                              </span>
                            </td>
                            <td style={{ padding: '8px', color: 'rgba(255,255,255,0.7)' }}>{att.notes || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* ── TAB 8: SCHEDULE CHANGE REQUESTS (UC33, UC34) ─────────── */}
            {activeTab === 'requests' && (
              <div>
                <h2 style={{ fontSize: '1.3rem', color: '#FFF', marginBottom: '16px' }}>
                  Yêu Cầu Thay Đổi Lịch Dạy Của Giảng Viên (UC33, UC34)
                </h2>

                <div className="dmr-card" style={{ marginBottom: '24px' }}>
                  <h3 className="dmr-card-title">Gửi Đơn Xin Đổi Lịch Dạy (UC33)</h3>
                  <form onSubmit={handleSubmitScheduleRequest} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '14px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>
                          Lớp học cần điều chỉnh:
                        </label>
                        <select
                          value={reqClassId}
                          onChange={(e) => setReqClassId(e.target.value)}
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
                            <option key={c._id} value={c._id}>
                              {c.name || c.classCode}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>
                          Lịch dạy mong muốn dời sang:
                        </label>
                        <input
                          type="text"
                          value={reqTargetSchedule}
                          onChange={(e) => setReqTargetSchedule(e.target.value)}
                          placeholder="VD: Dời buổi Thứ 4 sang tối Thứ 5 (19h00)"
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
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>
                        Lý do thay đổi lịch dạy:
                      </label>
                      <textarea
                        rows={3}
                        value={reqReason}
                        onChange={(e) => setReqReason(e.target.value)}
                        placeholder="Nêu lý do (công tác, tham gia hội thảo IELTS của IDP/British Council...)"
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
                        Gửi Đơn Xin Đổi Lịch
                      </button>
                    </div>
                  </form>
                </div>

                <div className="dmr-card">
                  <h3 className="dmr-card-title">Tiến Trình &amp; Lịch Sử Xét Duyệt Yêu Cầu (UC34)</h3>
                  {changeRequests.length === 0 ? (
                    <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '10px' }}>Chưa có yêu cầu nào được gửi.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                      {changeRequests.map((cr) => (
                        <div
                          key={cr._id}
                          style={{
                            padding: '12px 16px',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div>
                            <strong style={{ color: '#FFF' }}>{cr.reason}</strong>
                            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                              Lớp: {cr.currentClass?.name || cr.currentClass?.classCode} • Ngày gửi: {new Date(cr.createdAt).toLocaleDateString('vi-VN')}
                            </p>
                            {cr.reviewNote && (
                              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#A0EC1D' }}>
                                Phê duyệt từ Giáo vụ: "{cr.reviewNote}"
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
                                cr.status === 'APPROVED'
                                  ? 'rgba(87,208,97,0.2)'
                                  : cr.status === 'PENDING'
                                  ? 'rgba(245,158,11,0.2)'
                                  : 'rgba(239,68,68,0.2)',
                              color:
                                cr.status === 'APPROVED'
                                  ? '#57D061'
                                  : cr.status === 'PENDING'
                                  ? '#F59E0B'
                                  : '#EF4444',
                            }}
                          >
                            {cr.status === 'APPROVED' ? 'Đã duyệt' : cr.status === 'PENDING' ? 'Chờ duyệt' : 'Từ chối'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
