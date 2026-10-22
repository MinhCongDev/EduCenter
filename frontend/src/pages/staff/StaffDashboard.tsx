import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import staffService from '../../services/staff.service';
import '../dashboard/Dashboard.css';

export const StaffDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'classes' | 'students' | 'teachers' | 'schedules' | 'registrations' | 'payments' | 'requests' | 'results' | 'finalExams'>('overview');

  // Database Data States
  const [courses, setCourses] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [changeRequests, setChangeRequests] = useState<any[]>([]);
  const [academicResults, setAcademicResults] = useState<any>(null);
  const [finalExamsData, setFinalExamsData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Search state
  const [studentSearch, setStudentSearch] = useState<string>('');

  // Course Form Modal
  const [isCourseModalOpen, setIsCourseModalOpen] = useState<boolean>(false);
  const [courseCode, setCourseCode] = useState<string>('');
  const [courseTitle, setCourseTitle] = useState<string>('');
  const [courseFee, setCourseFee] = useState<number>(8500000);
  const [courseDuration, setCourseDuration] = useState<number>(10);
  const [courseTarget, setCourseTarget] = useState<string>('6.5 - 7.5');
  const [courseFormat, setCourseFormat] = useState<string>('BLENDED');

  // Class Form Modal
  const [isClassModalOpen, setIsClassModalOpen] = useState<boolean>(false);
  const [classCode, setClassCode] = useState<string>('');
  const [className, setClassName] = useState<string>('');
  const [classCourseId, setClassCourseId] = useState<string>('');
  const [classTeacherId, setClassTeacherId] = useState<string>('');
  const [classRoom, setClassRoom] = useState<string>('Phòng Lab 201 (Cầu Giấy)');
  const [classStartDate, setClassStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [classCapacity, setClassCapacity] = useState<number>(20);

  // Assign Student Modal (UC43)
  const [isAssignStudentModalOpen, setIsAssignStudentModalOpen] = useState<boolean>(false);
  const [assignClassId, setAssignClassId] = useState<string>('');
  const [assignStudentId, setAssignStudentId] = useState<string>('');

  // Assign Teacher Modal (UC44)
  const [isAssignTeacherModalOpen, setIsAssignTeacherModalOpen] = useState<boolean>(false);
  const [targetTeacherId, setTargetTeacherId] = useState<string>('');

  // Schedule Form Modal (UC45)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);
  const [schClassId, setSchClassId] = useState<string>('');
  const [schDay, setSchDay] = useState<string>('Thứ 2');
  const [schStart, setSchStart] = useState<string>('18:30');
  const [schEnd, setSchEnd] = useState<string>('20:30');
  const [schRoom, setSchRoom] = useState<string>('Phòng Lab 201');
  const [schTopic, setSchTopic] = useState<string>('IELTS Writing & Speaking');

  // Final Exam Form Modal
  const [isFinalExamModalOpen, setIsFinalExamModalOpen] = useState<boolean>(false);
  const [examClassId, setExamClassId] = useState<string>('');
  const [examTitle, setExamTitle] = useState<string>('');
  const [examDate, setExamDate] = useState<string>('');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [crs, cls, std, tch, sch, reg, pay, req, res, exm] = await Promise.all([
        staffService.getCourses(),
        staffService.getClasses(),
        staffService.getStudents(),
        staffService.getTeachers(),
        staffService.getSchedules(),
        staffService.getRegistrations(),
        staffService.getPayments(),
        staffService.getChangeRequests(),
        staffService.getAcademicResults(),
        staffService.getFinalExams(),
      ]);

      setCourses(crs || []);
      setClasses(cls || []);
      setStudents(std || []);
      setTeachers(tch || []);
      setSchedules(sch || []);
      setRegistrations(reg || []);
      setPayments(pay || []);
      setChangeRequests(req || []);
      setAcademicResults(res || null);
      setFinalExamsData(exm || null);

      if (cls && cls.length > 0) {
        setAssignClassId(cls[0]._id);
        setSchClassId(cls[0]._id);
        setExamClassId(cls[0]._id);
      }
      if (std && std.length > 0) {
        setAssignStudentId(std[0]._id);
      }
      if (tch && tch.length > 0) {
        setClassTeacherId(tch[0]._id);
        setTargetTeacherId(tch[0]._id);
      }
      if (crs && crs.length > 0) {
        setClassCourseId(crs[0]._id);
      }
    } catch (err) {
      console.error('Lỗi khi nạp dữ liệu Giáo vụ:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseCode || !courseTitle) {
      setMessage({ type: 'error', text: 'Vui lòng nhập mã và tên khóa học' });
      return;
    }

    try {
      await staffService.createCourse({
        code: courseCode,
        title: courseTitle,
        tuitionFee: Number(courseFee),
        durationWeeks: Number(courseDuration),
        targetLevel: courseTarget,
        format: courseFormat,
      });
      setMessage({ type: 'success', text: 'Tạo khóa học IELTS mới thành công!' });
      setIsCourseModalOpen(false);
      setCourseCode('');
      setCourseTitle('');
      await fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi khi tạo khóa học' });
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classCode || !classCourseId) {
      setMessage({ type: 'error', text: 'Vui lòng cung cấp mã lớp và khóa học' });
      return;
    }

    try {
      await staffService.createClass({
        classCode,
        name: className || `Lớp ${classCode}`,
        courseId: classCourseId,
        teacherId: classTeacherId || undefined,
        room: classRoom,
        startDate: classStartDate,
        capacity: Number(classCapacity),
      });
      setMessage({ type: 'success', text: 'Tạo lớp học mới thành công!' });
      setIsClassModalOpen(false);
      setClassCode('');
      setClassName('');
      await fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi khi tạo lớp học' });
    }
  };

  const handleAssignStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignClassId || !assignStudentId) return;

    try {
      await staffService.assignStudent(assignClassId, assignStudentId);
      setMessage({ type: 'success', text: 'Xếp học viên vào lớp học thành công!' });
      setIsAssignStudentModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi xếp lớp học viên' });
    }
  };

  const handleAssignTeacher = async (classId: string, teacherId: string) => {
    try {
      await staffService.assignTeacher(classId, teacherId);
      setMessage({ type: 'success', text: 'Phân công giảng viên cho lớp học thành công!' });
      setIsAssignTeacherModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi phân công giảng viên' });
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await staffService.createSchedule({
        classId: schClassId,
        dayOfWeek: schDay,
        startTime: schStart,
        endTime: schEnd,
        classroom: schRoom,
        topic: schTopic,
      });
      setMessage({ type: 'success', text: 'Tạo buổi học vào thời khóa biểu thành công!' });
      setIsScheduleModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi tạo lịch học' });
    }
  };

  const handleConfirmPayment = async (paymentId: string) => {
    try {
      await staffService.confirmPayment(paymentId, 'SUCCESS');
      setMessage({ type: 'success', text: 'Đã xác nhận giao dịch học phí thành công!' });
      await fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi xác nhận học phí' });
    }
  };

  const handleProcessRequest = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    const note = window.prompt(status === 'APPROVED' ? 'Nhập ghi chú phê duyệt (tùy chọn):' : 'Nhập lý do từ chối:');
    if (note === null) return; // User cancelled prompt
    try {
      await staffService.processChangeRequest(requestId, {
        status,
        reviewNote: note,
      });
      setMessage({ type: 'success', text: `Đã xử lý yêu cầu thành công (${status === 'APPROVED' ? 'Chấp thuận' : 'Từ chối'})!` });
      await fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi xử lý yêu cầu' });
    }
  };

  const handleCreateFinalExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examClassId || !examTitle || !examDate) {
      setMessage({ type: 'error', text: 'Vui lòng nhập đầy đủ thông tin kỳ thi cuối khóa' });
      return;
    }

    try {
      await staffService.createFinalExam({
        classId: examClassId,
        title: examTitle,
        examDate,
        maxScore: 9.0,
      });
      setMessage({ type: 'success', text: 'Tổ chức kỳ thi tốt nghiệp Final Exam thành công!' });
      setIsFinalExamModalOpen(false);
      setExamTitle('');
      await fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi tổ chức thi' });
    }
  };

  return (
    <div className="dmr-dashboard-wrapper">
      <div className="dmr-dashboard-container">
        {/* Header */}
        <div className="dmr-dash-header">
          <div className="dmr-dash-welcome">
            <span className="dmr-dash-role-badge">💼 Phòng Giáo Vụ &amp; Đào Tạo • EduCenter Portal</span>
            <h1 className="dmr-dash-title">Bàn Làm Việc Giáo Vụ &amp; Quản Lý Khóa Học</h1>
            <p className="dmr-dash-subtitle">
              Xin chào, <strong>{user?.fullName}</strong> • Điều phối vận hành học thuật, xếp lớp &amp; học vụ
            </p>
          </div>

          <div className="dmr-dash-actions">
            <button
              type="button"
              className="dmr-dash-btn dmr-dash-btn-secondary"
              onClick={() => {
                setActiveTab('students');
                setIsAssignStudentModalOpen(true);
              }}
            >
              👤 Xếp lớp học viên
            </button>
            <button
              type="button"
              className="dmr-dash-btn dmr-dash-btn-primary"
              onClick={() => {
                setActiveTab('classes');
                setIsClassModalOpen(true);
              }}
            >
              ➕ Mở lớp học mới
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
            { id: 'courses', label: '📚 Khóa học' },
            { id: 'classes', label: '🏫 Lớp học' },
            { id: 'students', label: '👥 Học viên' },
            { id: 'teachers', label: '👨‍🏫 Giảng viên' },
            { id: 'schedules', label: '📅 Thời khóa biểu' },
            { id: 'registrations', label: '📝 Ghi danh' },
            { id: 'payments', label: '💳 Thu học phí' },
            { id: 'requests', label: '🔄 Duyệt đổi lớp/lịch' },
            { id: 'results', label: '🏆 Điểm học vụ' },
            { id: 'finalExams', label: '🎯 Kỳ thi Final Exam' },
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
                      <span className="dmr-kpi-value">{courses.length} Khóa</span>
                      <span className="dmr-kpi-label">Chương trình đào tạo</span>
                      <span className="dmr-kpi-trend dmr-trend-up">Khảo thí chuẩn IDP</span>
                    </div>
                  </div>

                  <div className="dmr-kpi-card">
                    <div className="dmr-kpi-icon" style={{ background: 'rgba(59, 130, 246, 0.2)', borderColor: '#3B82F6' }}>
                      🏫
                    </div>
                    <div className="dmr-kpi-info">
                      <span className="dmr-kpi-value">{classes.length} Lớp</span>
                      <span className="dmr-kpi-label">Tổng số lớp học</span>
                      <span className="dmr-kpi-trend dmr-trend-highlight">
                        {classes.reduce((sum, c) => sum + (c.currentEnrollment || 0), 0)} học viên
                      </span>
                    </div>
                  </div>

                  <div className="dmr-kpi-card">
                    <div className="dmr-kpi-icon" style={{ background: 'rgba(236, 110, 35, 0.2)', borderColor: '#EC6E23' }}>
                      🔄
                    </div>
                    <div className="dmr-kpi-info">
                      <span className="dmr-kpi-value">
                        {changeRequests.filter((r) => r.status === 'PENDING').length} Đơn
                      </span>
                      <span className="dmr-kpi-label">Yêu cầu chờ phê duyệt</span>
                      <span className="dmr-kpi-trend" style={{ color: '#FCD34D' }}>
                        Đổi lớp &amp; đổi lịch
                      </span>
                    </div>
                  </div>

                  <div className="dmr-kpi-card">
                    <div className="dmr-kpi-icon">💳</div>
                    <div className="dmr-kpi-info">
                      <span className="dmr-kpi-value">{payments.length} Giao dịch</span>
                      <span className="dmr-kpi-label">Giao dịch học phí</span>
                      <span className="dmr-kpi-trend dmr-trend-up">Đã lưu trong DB</span>
                    </div>
                  </div>
                </div>

                <div className="dmr-dash-content-grid" style={{ marginTop: '24px' }}>
                  {/* Left: Pending Requests */}
                  <div className="dmr-card">
                    <div className="dmr-card-header">
                      <h3 className="dmr-card-title">🔄 Yêu Cầu Chờ Xử Lý</h3>
                      <button
                        type="button"
                        className="dmr-card-action"
                        onClick={() => setActiveTab('requests')}
                      >
                        Xử lý ngay ➔
                      </button>
                    </div>
                    {changeRequests.filter((r) => r.status === 'PENDING').length === 0 ? (
                      <p style={{ color: 'rgba(255,255,255,0.6)', padding: '10px 0' }}>Không có yêu cầu nào đang chờ xử lý.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {changeRequests
                          .filter((r) => r.status === 'PENDING')
                          .slice(0, 4)
                          .map((r) => (
                            <div
                              key={r._id}
                              style={{
                                padding: '12px 14px',
                                borderRadius: '10px',
                                backgroundColor: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                              }}
                            >
                              <div>
                                <strong style={{ color: '#FFF' }}>{r.student?.fullName}</strong>
                                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#FCD34D' }}>
                                  {r.requestType === 'CLASS_CHANGE'
                                    ? `Xin đổi sang: ${r.targetClass?.name || r.targetClass?.classCode || 'Lớp mới'}`
                                    : `Xin đổi lịch: ${r.targetSchedule || r.reason}`}
                                </p>
                              </div>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleProcessRequest(r._id, 'APPROVED')}
                                  style={{
                                    backgroundColor: '#57D061',
                                    border: 'none',
                                    color: '#052F2E',
                                    padding: '4px 10px',
                                    borderRadius: '12px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                  }}
                                >
                                  Duyệt
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleProcessRequest(r._id, 'REJECTED')}
                                  style={{
                                    backgroundColor: 'rgba(239,68,68,0.2)',
                                    border: '1px solid #EF4444',
                                    color: '#EF4444',
                                    padding: '4px 10px',
                                    borderRadius: '12px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                  }}
                                >
                                  Từ chối
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Right: Recent Registrations */}
                  <div className="dmr-card">
                    <div className="dmr-card-header">
                      <h3 className="dmr-card-title">📝 Ghi Danh Mới Nhất</h3>
                      <button
                        type="button"
                        className="dmr-card-action"
                        onClick={() => setActiveTab('registrations')}
                      >
                        Xem tất cả ➔
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {registrations.slice(0, 4).map((reg) => (
                        <div
                          key={reg._id}
                          style={{
                            padding: '12px 14px',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div>
                            <strong style={{ color: '#FFF' }}>{reg.student?.fullName}</strong>
                            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                              {reg.course?.title} • {reg.class?.name || 'Chờ xếp lớp'}
                            </p>
                          </div>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '10px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            backgroundColor: reg.tuitionStatus === 'PAID' ? 'rgba(87,208,97,0.2)' : 'rgba(245,158,11,0.2)',
                            color: reg.tuitionStatus === 'PAID' ? '#57D061' : '#F59E0B',
                          }}>
                            {reg.tuitionStatus === 'PAID' ? 'Đã đóng phí' : 'Chưa đóng phí'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 2: MANAGE COURSES (UC39) ─────────────────────────── */}
            {activeTab === 'courses' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '1.3rem', color: '#FFF', margin: 0 }}>
                    Quản Lý Khóa Học &amp; Chương Trình Đào Tạo
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsCourseModalOpen(true)}
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
                    + Tạo khóa học mới
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                  {courses.map((c) => (
                    <div key={c._id} className="dmr-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                          <span style={{ fontSize: '0.8rem', color: '#FCD34D', fontWeight: 800 }}>MÃ: {c.code}</span>
                          <h3 style={{ margin: '4px 0', color: '#FFF', fontSize: '1.15rem' }}>{c.title}</h3>
                        </div>
                        <span style={{ padding: '3px 8px', borderRadius: '10px', fontSize: '0.75rem', backgroundColor: '#57D061', color: '#052F2E', fontWeight: 800 }}>
                          {c.status}
                        </span>
                      </div>
                      <p style={{ margin: '6px 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>
                        {c.description?.slice(0, 120)}...
                      </p>
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px', marginTop: '10px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>
                        <p style={{ margin: '3px 0' }}><strong>Đầu vào:</strong> {c.entryLevel} ➔ <strong>Đầu ra:</strong> {c.targetLevel}</p>
                        <p style={{ margin: '3px 0' }}><strong>Thời lượng:</strong> {c.durationWeeks} tuần ({c.sessions} buổi) • Hình thức: {c.format}</p>
                        <p style={{ margin: '3px 0', color: '#FCD34D', fontWeight: 700 }}>
                          <strong>Học phí chuẩn:</strong> {c.tuitionFee?.toLocaleString('vi-VN')} ₫
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── TAB 3: MANAGE CLASSES (UC42, UC43, UC44) ─────────────── */}
            {activeTab === 'classes' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '1.3rem', color: '#FFF', margin: 0 }}>
                    Quản Lý Lớp Học &amp; Xếp Lớp Giảng Viên/Học Viên
                  </h2>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setIsAssignStudentModalOpen(true)}
                      style={{
                        backgroundColor: '#3B82F6',
                        border: 'none',
                        color: '#FFF',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                      }}
                    >
                      👤 Xếp học viên
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsClassModalOpen(true)}
                      style={{
                        backgroundColor: '#57D061',
                        border: 'none',
                        color: '#052F2E',
                        padding: '8px 18px',
                        borderRadius: '20px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                      }}
                    >
                      + Tạo lớp học mới
                    </button>
                  </div>
                </div>

                <div className="dmr-card">
                  <table style={{ width: '100%', borderCollapse: 'collapse', color: '#FFF' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                        <th style={{ padding: '10px' }}>Mã lớp / Tên</th>
                        <th style={{ padding: '10px' }}>Khóa học</th>
                        <th style={{ padding: '10px' }}>Giảng viên</th>
                        <th style={{ padding: '10px' }}>Phòng &amp; Lịch học</th>
                        <th style={{ padding: '10px' }}>Sĩ số</th>
                        <th style={{ padding: '10px' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classes.map((cls) => (
                        <tr key={cls._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem' }}>
                          <td style={{ padding: '12px 10px' }}>
                            <strong style={{ color: '#FFF' }}>{cls.name}</strong>
                            <div style={{ fontSize: '0.75rem', color: '#FCD34D' }}>{cls.classCode}</div>
                          </td>
                          <td style={{ padding: '12px 10px' }}>{cls.course?.title}</td>
                          <td style={{ padding: '12px 10px' }}>
                            {cls.teacher?.fullName ? (
                              <span style={{ color: '#57D061', fontWeight: 700 }}>{cls.teacher.fullName}</span>
                            ) : (
                              <span style={{ color: '#EF4444' }}>Chưa phân công</span>
                            )}
                          </td>
                          <td style={{ padding: '12px 10px', fontSize: '0.85rem' }}>
                            <div>{cls.room}</div>
                            <span style={{ color: 'rgba(255,255,255,0.6)' }}>{cls.scheduleDays?.join(', ')} ({cls.timeSlot})</span>
                          </td>
                          <td style={{ padding: '12px 10px' }}>
                            <span style={{ fontWeight: 700, color: '#FCD34D' }}>
                              {cls.currentEnrollment} / {cls.capacity} HV
                            </span>
                          </td>
                          <td style={{ padding: '12px 10px' }}>
                            <button
                              type="button"
                              onClick={() => {
                                setAssignClassId(cls._id);
                                setIsAssignTeacherModalOpen(true);
                              }}
                              style={{
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                color: '#FFF',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                              }}
                            >
                              Gán GV
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── TAB 4: MANAGE STUDENTS (UC40) ────────────────────────── */}
            {activeTab === 'students' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '1.3rem', color: '#FFF', margin: 0 }}>
                    Quản Lý Danh Sách &amp; Hồ Sơ Học Viên
                  </h2>
                  <input
                    type="text"
                    placeholder="Tìm theo họ tên, email, sđt..."
                    value={studentSearch}
                    onChange={async (e) => {
                      setStudentSearch(e.target.value);
                      const res = await staffService.getStudents(e.target.value);
                      setStudents(res || []);
                    }}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '20px',
                      backgroundColor: '#0F2F2E',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#FFF',
                      width: '260px',
                    }}
                  />
                </div>

                <div className="dmr-card">
                  <table style={{ width: '100%', borderCollapse: 'collapse', color: '#FFF' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                        <th style={{ padding: '10px' }}>Mã HV &amp; Họ tên</th>
                        <th style={{ padding: '10px' }}>Email &amp; SĐT</th>
                        <th style={{ padding: '10px' }}>Band điểm hiện tại / Target</th>
                        <th style={{ padding: '10px' }}>Lớp đang tham gia</th>
                        <th style={{ padding: '10px' }}>Trạng thái tài khoản</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((st) => (
                        <tr key={st._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem' }}>
                          <td style={{ padding: '12px 10px' }}>
                            <strong style={{ color: '#FFF' }}>{st.fullName}</strong>
                            <div style={{ fontSize: '0.75rem', color: '#FCD34D' }}>{st.studentCode}</div>
                          </td>
                          <td style={{ padding: '12px 10px', fontSize: '0.85rem' }}>
                            <div>{st.email}</div>
                            <span style={{ color: 'rgba(255,255,255,0.6)' }}>{st.phone}</span>
                          </td>
                          <td style={{ padding: '12px 10px' }}>
                            <span style={{ color: '#57D061', fontWeight: 700 }}>
                              {st.currentBand ? `IELTS ${st.currentBand}` : 'Chưa có'} ➔ Target: {st.targetBand || 7.0}+
                            </span>
                          </td>
                          <td style={{ padding: '12px 10px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>
                            {st.classes?.length > 0 ? st.classes.join(', ') : 'Chưa xếp lớp'}
                          </td>
                          <td style={{ padding: '12px 10px' }}>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '10px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              backgroundColor: st.status === 'ACTIVE' ? 'rgba(87,208,97,0.2)' : 'rgba(239,68,68,0.2)',
                              color: st.status === 'ACTIVE' ? '#57D061' : '#EF4444',
                            }}>
                              {st.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── TAB 5: MANAGE TEACHERS (UC41) ────────────────────────── */}
            {activeTab === 'teachers' && (
              <div>
                <h2 style={{ fontSize: '1.3rem', color: '#FFF', marginBottom: '16px' }}>
                  Quản Lý Đội Ngũ Giảng Viên &amp; Phân Bổ Lớp Dạy
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
                  {teachers.map((t) => (
                    <div key={t._id} className="dmr-card">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#57D061', color: '#052F2E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.3rem' }}>
                          {t.fullName.charAt(0)}
                        </div>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: '#FCD34D', fontWeight: 800 }}>MÃ GV: {t.teacherCode}</span>
                          <h3 style={{ margin: 0, color: '#FFF', fontSize: '1.1rem' }}>{t.fullName}</h3>
                          <span style={{ fontSize: '0.8rem', color: '#A0EC1D' }}>IELTS {t.ieltsBand} Overall • {t.yearsOfExperience} năm kinh nghiệm</span>
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px', fontSize: '0.85rem' }}>
                        <p style={{ margin: '4px 0', color: 'rgba(255,255,255,0.8)' }}>
                          <strong>Liên hệ:</strong> {t.email} • {t.phone}
                        </p>
                        <p style={{ margin: '4px 0', color: 'rgba(255,255,255,0.8)' }}>
                          <strong>Chuyên môn:</strong> {t.specialization?.join(', ')}
                        </p>
                        <p style={{ margin: '4px 0', color: 'rgba(255,255,255,0.8)' }}>
                          <strong>Lớp đang dạy:</strong> {t.classes?.length > 0 ? t.classes.join(', ') : 'Chưa phân công lớp'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── TAB 6: SCHEDULES (UC45) ──────────────────────────────── */}
            {activeTab === 'schedules' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '1.3rem', color: '#FFF', margin: 0 }}>
                    Quản Lý Thời Khóa Biểu &amp; Phòng Học
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsScheduleModalOpen(true)}
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
                    + Tạo buổi học mới
                  </button>
                </div>

                <div className="dmr-card">
                  <table style={{ width: '100%', borderCollapse: 'collapse', color: '#FFF' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                        <th style={{ padding: '10px' }}>Thứ / Thời gian</th>
                        <th style={{ padding: '10px' }}>Lớp học</th>
                        <th style={{ padding: '10px' }}>Chủ đề buổi học</th>
                        <th style={{ padding: '10px' }}>Phòng học</th>
                        <th style={{ padding: '10px' }}>Giảng viên</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedules.map((sc) => (
                        <tr key={sc._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem' }}>
                          <td style={{ padding: '12px 10px' }}>
                            <strong style={{ color: '#FCD34D' }}>{sc.dayOfWeek}</strong>
                            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>{sc.startTime} - {sc.endTime}</div>
                          </td>
                          <td style={{ padding: '12px 10px' }}>{sc.class?.name || sc.class?.classCode}</td>
                          <td style={{ padding: '12px 10px' }}>{sc.topic}</td>
                          <td style={{ padding: '12px 10px', color: '#A0EC1D' }}>{sc.classroom || sc.room}</td>
                          <td style={{ padding: '12px 10px' }}>{sc.class?.teacher?.fullName || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── TAB 7: REGISTRATIONS (UC46) ──────────────────────────── */}
            {activeTab === 'registrations' && (
              <div>
                <h2 style={{ fontSize: '1.3rem', color: '#FFF', marginBottom: '16px' }}>
                  Theo Dõi Danh Sách Ghi Danh Khóa Học
                </h2>
                <div className="dmr-card">
                  <table style={{ width: '100%', borderCollapse: 'collapse', color: '#FFF' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                        <th style={{ padding: '10px' }}>Học viên</th>
                        <th style={{ padding: '10px' }}>Khóa học</th>
                        <th style={{ padding: '10px' }}>Lớp học</th>
                        <th style={{ padding: '10px' }}>Ngày đăng ký</th>
                        <th style={{ padding: '10px' }}>Trạng thái học vụ</th>
                        <th style={{ padding: '10px' }}>Học phí</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registrations.map((reg) => (
                        <tr key={reg._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem' }}>
                          <td style={{ padding: '12px 10px' }}>
                            <strong>{reg.student?.fullName}</strong>
                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>{reg.student?.email} • {reg.student?.phone}</div>
                          </td>
                          <td style={{ padding: '12px 10px' }}>{reg.course?.title}</td>
                          <td style={{ padding: '12px 10px' }}>{reg.class?.name || 'Chờ xếp lớp'}</td>
                          <td style={{ padding: '12px 10px', fontSize: '0.85rem' }}>{new Date(reg.registrationDate).toLocaleDateString('vi-VN')}</td>
                          <td style={{ padding: '12px 10px' }}>
                            <span style={{ color: '#57D061', fontWeight: 700 }}>{reg.status}</span>
                          </td>
                          <td style={{ padding: '12px 10px' }}>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '10px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              backgroundColor: reg.tuitionStatus === 'PAID' ? 'rgba(87,208,97,0.2)' : 'rgba(245,158,11,0.2)',
                              color: reg.tuitionStatus === 'PAID' ? '#57D061' : '#F59E0B',
                            }}>
                              {reg.tuitionStatus === 'PAID' ? 'Đã đóng đủ' : 'Chưa thu'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── TAB 8: PAYMENTS (UC47) ───────────────────────────────── */}
            {activeTab === 'payments' && (
              <div>
                <h2 style={{ fontSize: '1.3rem', color: '#FFF', marginBottom: '16px' }}>
                  Theo Dõi Giao Dịch &amp; Đối Soát Học Phí
                </h2>
                <div className="dmr-card">
                  <table style={{ width: '100%', borderCollapse: 'collapse', color: '#FFF' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                        <th style={{ padding: '10px' }}>Mã GD</th>
                        <th style={{ padding: '10px' }}>Học viên</th>
                        <th style={{ padding: '10px' }}>Số tiền</th>
                        <th style={{ padding: '10px' }}>Phương thức</th>
                        <th style={{ padding: '10px' }}>Thời gian</th>
                        <th style={{ padding: '10px' }}>Trạng thái</th>
                        <th style={{ padding: '10px' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr key={p._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem' }}>
                          <td style={{ padding: '12px 10px', color: '#FCD34D', fontWeight: 700 }}>{p.transactionCode}</td>
                          <td style={{ padding: '12px 10px' }}>
                            <strong>{p.student?.fullName}</strong>
                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>{p.course?.title}</div>
                          </td>
                          <td style={{ padding: '12px 10px', color: '#57D061', fontWeight: 800 }}>
                            {p.amount?.toLocaleString('vi-VN')} ₫
                          </td>
                          <td style={{ padding: '12px 10px', fontSize: '0.85rem' }}>{p.method}</td>
                          <td style={{ padding: '12px 10px', fontSize: '0.85rem' }}>{new Date(p.paymentDate).toLocaleDateString('vi-VN')}</td>
                          <td style={{ padding: '12px 10px' }}>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '10px',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              backgroundColor: p.status === 'SUCCESS' ? 'rgba(87,208,97,0.2)' : 'rgba(245,158,11,0.2)',
                              color: p.status === 'SUCCESS' ? '#57D061' : '#F59E0B',
                            }}>
                              {p.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px 10px' }}>
                            {p.status !== 'SUCCESS' && (
                              <button
                                type="button"
                                onClick={() => handleConfirmPayment(p._id)}
                                style={{
                                  backgroundColor: '#57D061',
                                  border: 'none',
                                  color: '#052F2E',
                                  padding: '4px 10px',
                                  borderRadius: '12px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                Xác nhận
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── TAB 9: PROCESS CHANGE REQUESTS (UC48, UC49) ─────────── */}
            {activeTab === 'requests' && (
              <div>
                <h2 style={{ fontSize: '1.3rem', color: '#FFF', marginBottom: '16px' }}>
                  Xử Lý &amp; Xét Duyệt Yêu Cầu Đổi Lớp / Đổi Lịch Học
                </h2>
                <div className="dmr-card">
                  <table style={{ width: '100%', borderCollapse: 'collapse', color: '#FFF' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                        <th style={{ padding: '10px' }}>Người gửi &amp; Vai trò</th>
                        <th style={{ padding: '10px' }}>Loại yêu cầu</th>
                        <th style={{ padding: '10px' }}>Lớp học &amp; Đề xuất</th>
                        <th style={{ padding: '10px' }}>Lý do</th>
                        <th style={{ padding: '10px' }}>Trạng thái</th>
                        <th style={{ padding: '10px' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {changeRequests.map((r) => (
                        <tr key={r._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem' }}>
                          <td style={{ padding: '12px 10px' }}>
                            <strong>{r.student?.fullName}</strong>
                            <div style={{ fontSize: '0.75rem', color: '#A0EC1D' }}>{r.student?.role}</div>
                          </td>
                          <td style={{ padding: '12px 10px', color: '#FCD34D', fontWeight: 700 }}>
                            {r.requestType === 'CLASS_CHANGE' ? 'ĐỔI LỚP' : 'ĐỔI LỊCH'}
                          </td>
                          <td style={{ padding: '12px 10px', fontSize: '0.85rem' }}>
                            <div>Hiện tại: {r.currentClass?.name || r.currentClass?.classCode}</div>
                            {r.targetClass && (
                              <div style={{ color: '#57D061' }}>Chuyển sang: {r.targetClass?.name || r.targetClass?.classCode}</div>
                            )}
                            {r.targetSchedule && (
                              <div style={{ color: '#57D061' }}>Muốn dời sang: {r.targetSchedule}</div>
                            )}
                          </td>
                          <td style={{ padding: '12px 10px', maxWidth: '240px' }}>{r.reason}</td>
                          <td style={{ padding: '12px 10px' }}>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '10px',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              backgroundColor:
                                r.status === 'APPROVED'
                                  ? 'rgba(87,208,97,0.2)'
                                  : r.status === 'PENDING'
                                  ? 'rgba(245,158,11,0.2)'
                                  : 'rgba(239,68,68,0.2)',
                              color:
                                r.status === 'APPROVED'
                                  ? '#57D061'
                                  : r.status === 'PENDING'
                                  ? '#F59E0B'
                                  : '#EF4444',
                            }}>
                              {r.status === 'APPROVED' ? 'Đã duyệt' : r.status === 'PENDING' ? 'Chờ duyệt' : 'Từ chối'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 10px' }}>
                            {r.status === 'PENDING' && (
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleProcessRequest(r._id, 'APPROVED')}
                                  style={{
                                    backgroundColor: '#57D061',
                                    border: 'none',
                                    color: '#052F2E',
                                    padding: '4px 10px',
                                    borderRadius: '12px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                  }}
                                >
                                  Chấp thuận
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleProcessRequest(r._id, 'REJECTED')}
                                  style={{
                                    backgroundColor: 'rgba(239,68,68,0.2)',
                                    border: '1px solid #EF4444',
                                    color: '#EF4444',
                                    padding: '4px 10px',
                                    borderRadius: '12px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                  }}
                                >
                                  Từ chối
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── TAB 10: ACADEMIC RESULTS ──────────────────────────────── */}
            {activeTab === 'results' && (
              <div>
                <h2 style={{ fontSize: '1.3rem', color: '#FFF', marginBottom: '16px' }}>
                  Theo Dõi Kết Quả Học Tập &amp; Điểm Số Toàn Trung Tâm
                </h2>
                <div className="dmr-card">
                  <table style={{ width: '100%', borderCollapse: 'collapse', color: '#FFF' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                        <th style={{ padding: '10px' }}>Học viên</th>
                        <th style={{ padding: '10px' }}>Lớp học &amp; Khóa</th>
                        <th style={{ padding: '10px' }}>Điểm Giữa kỳ</th>
                        <th style={{ padding: '10px' }}>Điểm Cuối khóa</th>
                        <th style={{ padding: '10px' }}>Xếp loại học vụ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {academicResults?.enrollments?.map((en: any) => (
                        <tr key={en._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem' }}>
                          <td style={{ padding: '12px 10px' }}>
                            <strong>{en.student?.fullName}</strong>
                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>{en.student?.email}</div>
                          </td>
                          <td style={{ padding: '12px 10px' }}>
                            {en.class?.name || en.course?.title}
                            <div style={{ fontSize: '0.75rem', color: '#FCD34D' }}>{en.class?.classCode}</div>
                          </td>
                          <td style={{ padding: '12px 10px', color: '#FCD34D', fontWeight: 700 }}>
                            {en.midtermScore !== undefined ? `${en.midtermScore}/10` : '—'}
                          </td>
                          <td style={{ padding: '12px 10px', color: '#57D061', fontWeight: 800 }}>
                            {en.finalScore !== undefined ? `${en.finalScore}/10` : '—'}
                          </td>
                          <td style={{ padding: '12px 10px' }}>
                            <span style={{ color: '#A0EC1D', fontWeight: 700 }}>
                              {en.academicResult || 'Đang theo học'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── TAB 11: FINAL EXAM ───────────────────────────────────── */}
            {activeTab === 'finalExams' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '1.3rem', color: '#FFF', margin: 0 }}>
                    Tổ Chức &amp; Quản Lý Kỳ Thi Tốt Nghiệp Cuối Khóa (Final Exam)
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsFinalExamModalOpen(true)}
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
                    + Lên lịch Final Exam
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {finalExamsData?.exams?.map((exam: any) => (
                    <div key={exam._id} className="dmr-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span style={{ padding: '3px 8px', borderRadius: '8px', backgroundColor: '#EC6E23', color: '#FFF', fontSize: '0.75rem', fontWeight: 800 }}>
                            FINAL EXAM 4 SKILLS
                          </span>
                          <h3 style={{ margin: '6px 0', color: '#FFF' }}>{exam.title}</h3>
                          <p style={{ margin: '0 0 10px', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                            {exam.description}
                          </p>
                          <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>
                            <strong>Lớp:</strong> {exam.class?.name || exam.class?.classCode} • <strong>Giám thị / Chấm thi:</strong> {exam.teacher?.fullName} • <strong>Ngày thi:</strong> {new Date(exam.dueDate).toLocaleDateString('vi-VN')}
                          </div>
                        </div>
                        <span style={{ color: '#57D061', fontWeight: 800, fontSize: '1.1rem' }}>
                          Thang điểm: {exam.maxScore}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── MODALS ─────────────────────────────────────────────────── */}

        {/* Create Course Modal */}
        {isCourseModalOpen && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
            <div style={{ backgroundColor: '#0F2F2E', border: '1px solid #1E4E4D', borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '24px', color: '#FFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h3 style={{ margin: 0, color: '#57D061' }}>Tạo Khóa Học IELTS Mới</h3>
                <button type="button" onClick={() => setIsCourseModalOpen(false)} style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
              </div>
              <form onSubmit={handleCreateCourse} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Mã khóa:</label>
                  <input type="text" value={courseCode} onChange={(e) => setCourseCode(e.target.value)} placeholder="VD: IELTS-VIP-8" style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Tên khóa học:</label>
                  <input type="text" value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} placeholder="VD: IELTS Siêu Tốc 7.5+" style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Học phí (VNĐ):</label>
                    <input type="number" value={courseFee} onChange={(e) => setCourseFee(Number(e.target.value))} style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Thời lượng (tuần):</label>
                    <input type="number" value={courseDuration} onChange={(e) => setCourseDuration(Number(e.target.value))} style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF' }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Mục tiêu đầu ra:</label>
                    <input type="text" value={courseTarget} onChange={(e) => setCourseTarget(e.target.value)} placeholder="6.5 - 7.5" style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Hình thức:</label>
                    <select value={courseFormat} onChange={(e) => setCourseFormat(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#0F2F2E', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF' }}>
                      <option value="OFFLINE">Offline (Trực tiếp)</option>
                      <option value="ONLINE">Online (Trực tuyến)</option>
                      <option value="BLENDED">Blended (Kết hợp)</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button type="button" onClick={() => setIsCourseModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '20px', background: 'none', border: '1px solid #666', color: '#FFF', cursor: 'pointer' }}>Hủy</button>
                  <button type="submit" style={{ padding: '8px 20px', borderRadius: '20px', backgroundColor: '#57D061', border: 'none', color: '#052F2E', fontWeight: 800, cursor: 'pointer' }}>Lưu khóa học</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create Class Modal */}
        {isClassModalOpen && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
            <div style={{ backgroundColor: '#0F2F2E', border: '1px solid #1E4E4D', borderRadius: '16px', width: '100%', maxWidth: '520px', padding: '24px', color: '#FFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h3 style={{ margin: 0, color: '#57D061' }}>Mở Lớp Học Mới</h3>
                <button type="button" onClick={() => setIsClassModalOpen(false)} style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
              </div>
              <form onSubmit={handleCreateClass} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Mã lớp học:</label>
                    <input type="text" value={classCode} onChange={(e) => setClassCode(e.target.value)} placeholder="VD: IELTS-MST-K27" style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Tên lớp học:</label>
                    <input type="text" value={className} onChange={(e) => setClassName(e.target.value)} placeholder="VD: IELTS Master K27" style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Khóa học:</label>
                  <select value={classCourseId} onChange={(e) => setClassCourseId(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#0F2F2E', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF' }}>
                    {courses.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Giảng viên phụ trách:</label>
                  <select value={classTeacherId} onChange={(e) => setClassTeacherId(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#0F2F2E', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF' }}>
                    {teachers.map((t) => <option key={t._id} value={t._id}>{t.fullName}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Phòng học:</label>
                    <input type="text" value={classRoom} onChange={(e) => setClassRoom(e.target.value)} placeholder="Phòng Lab 201" style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Sĩ số tối đa:</label>
                    <input type="number" value={classCapacity} onChange={(e) => setClassCapacity(Number(e.target.value))} style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Ngày khai giảng:</label>
                  <input type="date" value={classStartDate} onChange={(e) => setClassStartDate(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#0F2F2E', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button type="button" onClick={() => setIsClassModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '20px', background: 'none', border: '1px solid #666', color: '#FFF', cursor: 'pointer' }}>Hủy</button>
                  <button type="submit" style={{ padding: '8px 20px', borderRadius: '20px', backgroundColor: '#57D061', border: 'none', color: '#052F2E', fontWeight: 800, cursor: 'pointer' }}>Khởi tạo lớp</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Assign Student Modal */}
        {isAssignStudentModalOpen && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
            <div style={{ backgroundColor: '#0F2F2E', border: '1px solid #1E4E4D', borderRadius: '16px', width: '100%', maxWidth: '480px', padding: '24px', color: '#FFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h3 style={{ margin: 0, color: '#57D061' }}>Xếp Học Viên Vào Lớp</h3>
                <button type="button" onClick={() => setIsAssignStudentModalOpen(false)} style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
              </div>
              <form onSubmit={handleAssignStudent} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Chọn lớp học:</label>
                  <select value={assignClassId} onChange={(e) => setAssignClassId(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#0F2F2E', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF' }}>
                    {classes.map((c) => <option key={c._id} value={c._id}>{c.name || c.classCode} ({c.currentEnrollment}/{c.capacity} HV)</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Chọn học viên:</label>
                  <select value={assignStudentId} onChange={(e) => setAssignStudentId(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#0F2F2E', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF' }}>
                    {students.map((st) => <option key={st._id} value={st._id}>{st.fullName} ({st.email})</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button type="button" onClick={() => setIsAssignStudentModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '20px', background: 'none', border: '1px solid #666', color: '#FFF', cursor: 'pointer' }}>Hủy</button>
                  <button type="submit" style={{ padding: '8px 20px', borderRadius: '20px', backgroundColor: '#57D061', border: 'none', color: '#052F2E', fontWeight: 800, cursor: 'pointer' }}>Xác nhận xếp lớp</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Assign Teacher Modal */}
        {isAssignTeacherModalOpen && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
            <div style={{ backgroundColor: '#0F2F2E', border: '1px solid #1E4E4D', borderRadius: '16px', width: '100%', maxWidth: '480px', padding: '24px', color: '#FFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h3 style={{ margin: 0, color: '#57D061' }}>Phân Công Giảng Viên Dạy Lớp</h3>
                <button type="button" onClick={() => setIsAssignTeacherModalOpen(false)} style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Chọn giảng viên:</label>
                  <select value={targetTeacherId} onChange={(e) => setTargetTeacherId(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#0F2F2E', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF' }}>
                    {teachers.map((t) => <option key={t._id} value={t._id}>{t.fullName} (IELTS {t.ieltsBand})</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button type="button" onClick={() => setIsAssignTeacherModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '20px', background: 'none', border: '1px solid #666', color: '#FFF', cursor: 'pointer' }}>Hủy</button>
                  <button type="button" onClick={() => handleAssignTeacher(assignClassId, targetTeacherId)} style={{ padding: '8px 20px', borderRadius: '20px', backgroundColor: '#57D061', border: 'none', color: '#052F2E', fontWeight: 800, cursor: 'pointer' }}>Lưu phân công</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Schedule Modal */}
        {isScheduleModalOpen && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
            <div style={{ backgroundColor: '#0F2F2E', border: '1px solid #1E4E4D', borderRadius: '16px', width: '100%', maxWidth: '480px', padding: '24px', color: '#FFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h3 style={{ margin: 0, color: '#57D061' }}>Thêm Buổi Học Vào Lịch</h3>
                <button type="button" onClick={() => setIsScheduleModalOpen(false)} style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
              </div>
              <form onSubmit={handleCreateSchedule} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Lớp học:</label>
                  <select value={schClassId} onChange={(e) => setSchClassId(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#0F2F2E', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF' }}>
                    {classes.map((c) => <option key={c._id} value={c._id}>{c.name || c.classCode}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Thứ trong tuần:</label>
                    <select value={schDay} onChange={(e) => setSchDay(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#0F2F2E', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF' }}>
                      {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'].map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Phòng học:</label>
                    <input type="text" value={schRoom} onChange={(e) => setSchRoom(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF' }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Bắt đầu:</label>
                    <input type="text" value={schStart} onChange={(e) => setSchStart(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Kết thúc:</label>
                    <input type="text" value={schEnd} onChange={(e) => setSchEnd(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Chủ đề:</label>
                  <input type="text" value={schTopic} onChange={(e) => setSchTopic(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button type="button" onClick={() => setIsScheduleModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '20px', background: 'none', border: '1px solid #666', color: '#FFF', cursor: 'pointer' }}>Hủy</button>
                  <button type="submit" style={{ padding: '8px 20px', borderRadius: '20px', backgroundColor: '#57D061', border: 'none', color: '#052F2E', fontWeight: 800, cursor: 'pointer' }}>Lưu lịch</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Final Exam Modal */}
        {isFinalExamModalOpen && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
            <div style={{ backgroundColor: '#0F2F2E', border: '1px solid #1E4E4D', borderRadius: '16px', width: '100%', maxWidth: '480px', padding: '24px', color: '#FFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h3 style={{ margin: 0, color: '#57D061' }}>Tổ Chức Kỳ Thi Final Exam</h3>
                <button type="button" onClick={() => setIsFinalExamModalOpen(false)} style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
              </div>
              <form onSubmit={handleCreateFinalExam} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Lớp học thi:</label>
                  <select value={examClassId} onChange={(e) => setExamClassId(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#0F2F2E', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF' }}>
                    {classes.map((c) => <option key={c._id} value={c._id}>{c.name || c.classCode}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Tiêu đề kỳ thi:</label>
                  <input type="text" value={examTitle} onChange={(e) => setExamTitle(e.target.value)} placeholder="VD: IELTS Final Assessment 4 Kỹ Năng" style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Ngày tổ chức thi:</label>
                  <input type="datetime-local" value={examDate} onChange={(e) => setExamDate(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#0F2F2E', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button type="button" onClick={() => setIsFinalExamModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '20px', background: 'none', border: '1px solid #666', color: '#FFF', cursor: 'pointer' }}>Hủy</button>
                  <button type="submit" style={{ padding: '8px 20px', borderRadius: '20px', backgroundColor: '#57D061', border: 'none', color: '#052F2E', fontWeight: 800, cursor: 'pointer' }}>Xác nhận lịch thi</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;
