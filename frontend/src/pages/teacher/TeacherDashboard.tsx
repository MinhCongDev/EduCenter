import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { teacherService } from '../../services/teacher.service';
import type {
  AssignedClass,
  TeacherStudent,
  TeachingScheduleItem,
  TeacherAssignment,
  AssignmentSubmission,
  AcademicGrade,
  ScheduleChangeRequest,
  AttendanceRecord,
} from '../../services/teacher.service';

export const TeacherDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // 4 Primary Functional Tabs (covering all 14 features)
  const [activeTab, setActiveTab] = useState<'schedule_attendance' | 'assignments_grading' | 'classes_students' | 'academic_grades'>('schedule_attendance');

  // Loading & Toast State
  const [loading, setLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ── Data States ──
  const [classes, setClasses] = useState<AssignedClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [students, setStudents] = useState<TeacherStudent[]>([]);
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [schedules, setSchedules] = useState<TeachingScheduleItem[]>([]);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [grades, setGrades] = useState<AcademicGrade[]>([]);
  const [scheduleRequests, setScheduleRequests] = useState<ScheduleChangeRequest[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  // Attendance checking state
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attendanceForm, setAttendanceForm] = useState<Record<string, { status: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED'; notes: string }>>({});
  const [attendanceViewMode, setAttendanceViewMode] = useState<'check' | 'history'>('check');

  // ── Modals State ──
  // 1. Schedule Change Modal (Submit & Track)
  const [isScheduleRequestOpen, setIsScheduleRequestOpen] = useState<boolean>(false);
  const [requestTab, setRequestTab] = useState<'submit' | 'history'>('submit');
  const [reqClassId, setReqClassId] = useState<string>('');
  const [reqCurrentSched, setReqCurrentSched] = useState<string>('Thứ 2 (18:30 - 20:30)');
  const [reqTargetSched, setReqTargetSched] = useState<string>('Thứ 4 (18:30 - 20:30)');
  const [reqSessionDate, setReqSessionDate] = useState<string>('');
  const [reqReason, setReqReason] = useState<string>('');
  const [isSubmittingReq, setIsSubmittingReq] = useState<boolean>(false);

  // 2. Create Assignment Modal
  const [isCreateAssOpen, setIsCreateAssOpen] = useState<boolean>(false);
  const [assTitle, setAssTitle] = useState<string>('');
  const [assSkill, setAssSkill] = useState<string>('Writing Task 2');
  const [assClassId, setAssClassId] = useState<string>('');
  const [assDueDate, setAssDueDate] = useState<string>('');
  const [assMaxScore, setAssMaxScore] = useState<number>(9.0);
  const [assDesc, setAssDesc] = useState<string>('');
  const [isSubmittingAss, setIsSubmittingAss] = useState<boolean>(false);

  // 3. Grade Assignment Modal
  const [gradingSubmissions, setGradingSubmissions] = useState<AssignmentSubmission[]>([]);
  const [selectedAssignmentForGrading, setSelectedAssignmentForGrading] = useState<TeacherAssignment | null>(null);
  const [isGradingListOpen, setIsGradingListOpen] = useState<boolean>(false);
  const [activeSubmission, setActiveSubmission] = useState<AssignmentSubmission | null>(null);
  const [gradeBand, setGradeBand] = useState<number>(7.0);
  const [gradeFeedback, setGradeFeedback] = useState<string>('');
  const [gradeCriteria, setGradeCriteria] = useState({
    taskAchievement: 7.0,
    coherenceCohesion: 7.0,
    lexicalResource: 7.0,
    grammaticalAccuracy: 7.0,
  });
  const [isSavingGrade, setIsSavingGrade] = useState<boolean>(false);

  // 4. Student Detail Modal
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<TeacherStudent | null>(null);
  const [isStudentDetailOpen, setIsStudentDetailOpen] = useState<boolean>(false);

  // 5. Enter/Update Academic Grade Modal
  const [isGradeModalOpen, setIsGradeModalOpen] = useState<boolean>(false);
  const [editingGradeId, setEditingGradeId] = useState<string | null>(null);
  const [gradeFormStudentId, setGradeFormStudentId] = useState<string>('');
  const [gradeFormClassId, setGradeFormClassId] = useState<string>('');
  const [gradeFormType, setGradeFormType] = useState<string>('MOCK_TEST');
  const [gradeFormTitle, setGradeFormTitle] = useState<string>('IELTS Mock Test Số 2');
  const [gradeFormDate, setGradeFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [gradeFormOverall, setGradeFormOverall] = useState<number>(7.0);
  const [gradeFormL, setGradeFormL] = useState<number>(7.0);
  const [gradeFormR, setGradeFormR] = useState<number>(7.0);
  const [gradeFormW, setGradeFormW] = useState<number>(6.5);
  const [gradeFormS, setGradeFormS] = useState<number>(7.0);
  const [gradeFormFeedback, setGradeFormFeedback] = useState<string>('');
  const [isSavingAcademicGrade, setIsSavingAcademicGrade] = useState<boolean>(false);

  // ── Load All Data ──
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [clsRes, stuRes, schedRes, assRes, grdRes, reqRes] = await Promise.all([
        teacherService.getAssignedClasses().catch(() => ({ data: { classes: [] } })),
        teacherService.getStudents().catch(() => ({ data: { students: [] } })),
        teacherService.getTeachingSchedule().catch(() => ({ data: { schedules: [] } })),
        teacherService.getAssignments().catch(() => ({ data: { assignments: [] } })),
        teacherService.getStudentAcademicResults().catch(() => ({ data: { grades: [] } })),
        teacherService.getScheduleChangeRequests().catch(() => ({ data: { requests: [] } })),
      ]);

      const loadedClasses = clsRes.data?.classes || [];
      setClasses(loadedClasses);
      if (loadedClasses.length > 0 && !selectedClassId) {
        setSelectedClassId(loadedClasses[0]._id);
        setReqClassId(loadedClasses[0]._id);
        setAssClassId(loadedClasses[0]._id);
        setGradeFormClassId(loadedClasses[0]._id);
      }

      const loadedStudents = stuRes.data?.students || [];
      setStudents(loadedStudents);
      if (loadedStudents.length > 0) {
        setGradeFormStudentId(loadedStudents[0]._id);
      }

      setSchedules(schedRes.data?.schedules || []);
      setAssignments(assRes.data?.assignments || []);
      setGrades(grdRes.data?.grades || []);
      setScheduleRequests(reqRes.data?.requests || []);

      // Initialize Attendance Map for loaded students
      const initial: Record<string, { status: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED'; notes: string }> = {};
      loadedStudents.forEach((stu: TeacherStudent) => {
        initial[stu._id] = { status: 'PRESENT', notes: '' };
      });
      setAttendanceForm(initial);
    } catch (err: any) {
      showToast('⚠️ Không thể tải dữ liệu: ' + (err?.message || 'Lỗi mạng'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Filtered Students for selected class
  const classStudents = students.filter((s) => {
    if (!selectedClassId) return true;
    return s.classes.some((c) => c._id === selectedClassId) || s.classes.length === 0;
  });

  const searchedStudents = classStudents.filter((s) => {
    if (!studentSearch.trim()) return true;
    const q = studentSearch.toLowerCase();
    return s.fullName.toLowerCase().includes(q) || s.studentCode.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
  });

  // Load Attendance records when switching to history
  const loadAttendanceHistory = async () => {
    try {
      const res = await teacherService.getAttendance({ classId: selectedClassId });
      setAttendanceRecords(res.data?.records || []);
    } catch (err: any) {
      showToast('Lỗi khi tải lịch sử điểm danh');
    }
  };

  // ── Handler: Check Attendance (Save) ──
  const handleSaveAttendance = async () => {
    if (!selectedClassId) {
      showToast('Vui lòng chọn lớp học trước khi lưu điểm danh');
      return;
    }
    try {
      const records = Object.entries(attendanceForm).map(([studentId, data]) => ({
        studentId,
        status: data.status,
        notes: data.notes,
      }));

      await teacherService.checkAttendance({
        classId: selectedClassId,
        sessionDate: attendanceDate,
        records,
      });

      showToast(`🎉 Đã lưu điểm danh ca dạy ngày ${attendanceDate} thành công!`);
    } catch (err: any) {
      showToast('❌ Lỗi khi lưu điểm danh: ' + (err?.response?.data?.message || err.message));
    }
  };

  const handleMarkAllPresent = () => {
    const updated = { ...attendanceForm };
    classStudents.forEach((stu) => {
      updated[stu._id] = { ...(updated[stu._id] || {}), status: 'PRESENT' };
    });
    setAttendanceForm(updated);
    showToast('Đã đánh dấu tất cả học viên: CÓ MẶT');
  };

  // ── Handler: Submit Schedule Change Request ──
  const handleSubmitScheduleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqClassId || !reqReason.trim()) {
      showToast('Vui lòng chọn lớp và nêu rõ lý do xin đổi lịch');
      return;
    }
    setIsSubmittingReq(true);
    try {
      await teacherService.submitScheduleChangeRequest({
        currentClassId: reqClassId,
        currentSchedule: reqCurrentSched,
        targetSchedule: reqTargetSched,
        sessionDate: reqSessionDate || undefined,
        reason: reqReason,
      });
      showToast('✅ Đã gửi đơn xin đổi ca dạy thành công tới Ban Giáo vụ!');
      setReqReason('');
      const res = await teacherService.getScheduleChangeRequests();
      setScheduleRequests(res.data?.requests || []);
      setRequestTab('history');
    } catch (err: any) {
      showToast('❌ Lỗi gửi yêu cầu: ' + (err?.response?.data?.message || err.message));
    } finally {
      setIsSubmittingReq(false);
    }
  };

  // ── Handler: Create Assignment ──
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assClassId || !assTitle.trim() || !assDueDate) {
      showToast('Vui lòng điền đủ Lớp học, Tiêu đề bài tập và Hạn nộp');
      return;
    }
    setIsSubmittingAss(true);
    try {
      await teacherService.createAssignment({
        classId: assClassId,
        title: assTitle,
        skill: assSkill,
        dueDate: assDueDate,
        maxScore: assMaxScore,
        description: assDesc,
        status: 'PUBLISHED',
      });
      showToast('🎉 Tạo và giao bài tập cho lớp thành công!');
      setIsCreateAssOpen(false);
      setAssTitle('');
      setAssDesc('');
      const res = await teacherService.getAssignments();
      setAssignments(res.data?.assignments || []);
    } catch (err: any) {
      showToast('❌ Lỗi tạo bài tập: ' + (err?.response?.data?.message || err.message));
    } finally {
      setIsSubmittingAss(false);
    }
  };

  // ── Handler: Open Grading List ──
  const handleOpenGradingList = async (assignment: TeacherAssignment) => {
    setSelectedAssignmentForGrading(assignment);
    setIsGradingListOpen(true);
    try {
      const res = await teacherService.getAssignmentSubmissions(assignment._id);
      setGradingSubmissions(res.data?.submissions || []);
    } catch (err: any) {
      showToast('Lỗi khi tải danh sách bài nộp');
    }
  };

  // ── Handler: Submit Grade for Submission ──
  const handleSaveSubmissionGrade = async () => {
    if (!activeSubmission) return;
    setIsSavingGrade(true);
    try {
      await teacherService.gradeSubmission(activeSubmission._id, {
        grade: gradeBand,
        feedback: gradeFeedback,
        criteria: gradeCriteria,
      });
      showToast(`🎉 Đã chấm xong bài cho ${activeSubmission.student.fullName} (Band ${gradeBand})!`);
      setActiveSubmission(null);
      if (selectedAssignmentForGrading) {
        const res = await teacherService.getAssignmentSubmissions(selectedAssignmentForGrading._id);
        setGradingSubmissions(res.data?.submissions || []);
      }
      const assRes = await teacherService.getAssignments();
      setAssignments(assRes.data?.assignments || []);
    } catch (err: any) {
      showToast('❌ Lỗi khi chấm bài: ' + (err?.response?.data?.message || err.message));
    } finally {
      setIsSavingGrade(false);
    }
  };

  // ── Handler: Enter / Update Academic Grade ──
  const handleSaveAcademicGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradeFormStudentId || !gradeFormClassId || !gradeFormTitle.trim()) {
      showToast('Vui lòng chọn học viên, lớp và nhập tiêu đề bài thi');
      return;
    }
    setIsSavingAcademicGrade(true);
    try {
      if (editingGradeId) {
        await teacherService.updateGrade(editingGradeId, {
          title: gradeFormTitle,
          evaluationType: gradeFormType,
          testDate: gradeFormDate,
          overallBand: gradeFormOverall,
          listening: gradeFormL,
          reading: gradeFormR,
          writing: gradeFormW,
          speaking: gradeFormS,
          feedback: gradeFormFeedback,
        });
        showToast('✅ Đã cập nhật kết quả học tập thành công!');
      } else {
        await teacherService.createGrade({
          studentId: gradeFormStudentId,
          classId: gradeFormClassId,
          evaluationType: gradeFormType,
          title: gradeFormTitle,
          testDate: gradeFormDate,
          overallBand: gradeFormOverall,
          listening: gradeFormL,
          reading: gradeFormR,
          writing: gradeFormW,
          speaking: gradeFormS,
          feedback: gradeFormFeedback,
        });
        showToast('🎉 Đã nhập điểm đánh giá học viên thành công!');
      }
      setIsGradeModalOpen(false);
      setEditingGradeId(null);
      const res = await teacherService.getStudentAcademicResults();
      setGrades(res.data?.grades || []);
    } catch (err: any) {
      showToast('❌ Lỗi lưu điểm: ' + (err?.response?.data?.message || err.message));
    } finally {
      setIsSavingAcademicGrade(false);
    }
  };

  const handleDeleteGrade = async (gradeId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bản ghi điểm này không?')) return;
    try {
      await teacherService.deleteGrade(gradeId);
      showToast('Đã xóa bản ghi điểm');
      setGrades((prev) => prev.filter((g) => g._id !== gradeId));
    } catch (err: any) {
      showToast('Lỗi khi xóa điểm');
    }
  };

  const handleEditGrade = (grade: AcademicGrade) => {
    setEditingGradeId(grade._id);
    setGradeFormStudentId(grade.student._id);
    setGradeFormClassId(grade.class._id);
    setGradeFormType(grade.evaluationType);
    setGradeFormTitle(grade.title);
    setGradeFormDate(grade.testDate ? grade.testDate.split('T')[0] : '');
    setGradeFormOverall(grade.overallBand);
    setGradeFormL(grade.listening ?? 7.0);
    setGradeFormR(grade.reading ?? 7.0);
    setGradeFormW(grade.writing ?? 6.5);
    setGradeFormS(grade.speaking ?? 7.0);
    setGradeFormFeedback(grade.feedback || '');
    setIsGradeModalOpen(true);
  };

  const pendingAssignmentsCount = assignments.reduce((acc, curr) => acc + (curr.stats?.pendingCount || 0), 0);
  const totalStudentsCount = students.length;
  const totalClassesCount = classes.length;

  return (
    <div className="dash-container" style={{ gap: '1.25rem', paddingBottom: '3rem' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="dmr-toast" role="status" style={{ zIndex: 9999 }}>
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Syncing Badge */}
      {loading && (
        <div style={{ backgroundColor: 'rgba(160, 236, 29, 0.15)', border: '1px solid #A0EC1D', color: '#A0EC1D', padding: '6px 12px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700, textAlign: 'center' }}>
          ⏳ Đang đồng bộ dữ liệu thời gian thực từ máy chủ EduCenter...
        </div>
      )}

      {/* ── 1. Header Banner Giảng Viên ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #07403F 0%, #0d5654 60%, #166557 100%)',
          borderRadius: '16px',
          padding: '1.25rem 1.75rem',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 8px 24px rgba(7, 64, 63, 0.2)',
          border: '1px solid rgba(160, 236, 29, 0.25)',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #A0EC1D, #57D061)',
              color: '#052F2E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              fontWeight: 800,
              boxShadow: '0 4px 12px rgba(87, 208, 97, 0.3)',
            }}
          >
            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'T'}
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, lineHeight: 1.2 }}>
              Chào {user?.fullName || 'Thầy Alex Nguyễn'} 👋
            </h1>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#CEFFD8' }}>
              Giảng viên IELTS Academic • Quản trị đào tạo &amp; Chấm thi học thuật
            </p>
          </div>
        </div>

        {/* Action button cluster */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => {
              setIsScheduleRequestOpen(true);
              setRequestTab('submit');
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: '#FCD34D',
              borderRadius: '10px',
              padding: '0.5rem 0.85rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
            title="Gửi đơn xin đổi ca dạy hoặc xem kết quả phê duyệt"
          >
            <span>🔄</span>
            <span>Xin đổi lịch dạy ({scheduleRequests.length})</span>
          </button>

          <button
            type="button"
            id="teacher-dashboard-logout-btn"
            onClick={() => {
              logout();
              navigate('/login', { replace: true });
            }}
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.25)',
              color: '#FFB4A2',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              padding: '0.5rem 0.85rem',
              borderRadius: '10px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#ef4444';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.25)';
              e.currentTarget.style.color = '#FFB4A2';
            }}
            title="Đăng xuất khỏi tài khoản Giảng viên"
          >
            <span>🚪</span>
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>

      {/* ── 2. Thẻ Thống Kê Tổng Quan ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div
          className="dash-card"
          style={{
            padding: '1rem 1.25rem',
            borderRadius: '14px',
            borderLeft: '4px solid #57D061',
            cursor: 'pointer',
          }}
          onClick={() => setActiveTab('classes_students')}
        >
          <div style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600 }}>Lớp Đang Phụ Trách</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#A0EC1D', marginTop: '0.2rem' }}>
            {totalClassesCount} Lớp
          </div>
          <div style={{ fontSize: '0.75rem', color: '#57D061', marginTop: '0.2rem' }}>
            🏫 Xem danh sách lớp học
          </div>
        </div>

        <div
          className="dash-card"
          style={{
            padding: '1rem 1.25rem',
            borderRadius: '14px',
            borderLeft: '4px solid #3B82F6',
            cursor: 'pointer',
          }}
          onClick={() => setActiveTab('classes_students')}
        >
          <div style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600 }}>Tổng Số Học Viên</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FFFFFF', marginTop: '0.2rem' }}>
            {totalStudentsCount} Học viên
          </div>
          <div style={{ fontSize: '0.75rem', color: '#60A5FA', marginTop: '0.2rem' }}>
            👥 Theo dõi hồ sơ &amp; chuyên cần
          </div>
        </div>

        <div
          className="dash-card"
          style={{
            padding: '1rem 1.25rem',
            borderRadius: '14px',
            borderLeft: '4px solid #EC6E23',
            cursor: 'pointer',
          }}
          onClick={() => setActiveTab('assignments_grading')}
        >
          <div style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600 }}>Bài Nộp Chờ Chấm</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FB923C', marginTop: '0.2rem' }}>
            {pendingAssignmentsCount} Bài
          </div>
          <div style={{ fontSize: '0.75rem', color: '#FB923C', marginTop: '0.2rem' }}>
            ✍️ Writing &amp; Speaking Mock
          </div>
        </div>

        <div
          className="dash-card"
          style={{
            padding: '1rem 1.25rem',
            borderRadius: '14px',
            borderLeft: '4px solid #A855F7',
            cursor: 'pointer',
          }}
          onClick={() => setActiveTab('academic_grades')}
        >
          <div style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600 }}>Kết Quả Học Tập</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#C084FC', marginTop: '0.2rem' }}>
            {grades.length} Bài thi
          </div>
          <div style={{ fontSize: '0.75rem', color: '#C084FC', marginTop: '0.2rem' }}>
            📊 Quản lý điểm &amp; Nhập điểm
          </div>
        </div>
      </div>

      {/* ── 3. Tab Bar Điều Hướng 4 Nhóm Tính Năng Trọng Tâm ── */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          backgroundColor: '#052F2E',
          padding: '0.4rem',
          borderRadius: '12px',
          border: '1px solid rgba(87, 208, 97, 0.3)',
          overflowX: 'auto',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('schedule_attendance')}
          style={{
            flex: 1,
            padding: '0.65rem 1rem',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
            backgroundColor: activeTab === 'schedule_attendance' ? '#A0EC1D' : 'transparent',
            color: activeTab === 'schedule_attendance' ? '#052F2E' : '#FFFFFF',
          }}
        >
          📅 Lịch Dạy &amp; Điểm Danh
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('assignments_grading')}
          style={{
            flex: 1,
            padding: '0.65rem 1rem',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
            backgroundColor: activeTab === 'assignments_grading' ? '#A0EC1D' : 'transparent',
            color: activeTab === 'assignments_grading' ? '#052F2E' : '#FFFFFF',
          }}
        >
          ✍️ Quản Lý Bài Tập &amp; Chấm Bài {pendingAssignmentsCount > 0 && <span style={{ backgroundColor: '#EC6E23', color: '#FFF', padding: '1px 6px', borderRadius: '10px', fontSize: '0.72rem', marginLeft: '4px' }}>{pendingAssignmentsCount}</span>}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('classes_students')}
          style={{
            flex: 1,
            padding: '0.65rem 1rem',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
            backgroundColor: activeTab === 'classes_students' ? '#A0EC1D' : 'transparent',
            color: activeTab === 'classes_students' ? '#052F2E' : '#FFFFFF',
          }}
        >
          🎓 Lớp Học &amp; Học Viên ({totalClassesCount} Lớp)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('academic_grades')}
          style={{
            flex: 1,
            padding: '0.65rem 1rem',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
            backgroundColor: activeTab === 'academic_grades' ? '#A0EC1D' : 'transparent',
            color: activeTab === 'academic_grades' ? '#052F2E' : '#FFFFFF',
          }}
        >
          📊 Bảng Điểm &amp; Kết Quả Học Tập
        </button>
      </div>

      {/* ── 4. NỘI DUNG TỪNG TAB ── */}

      {/* TAB 1: LỊCH DẠY & ĐIỂM DANH */}
      {activeTab === 'schedule_attendance' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.25rem' }}>
          {/* Cột trái: Thời khóa biểu tuần */}
          <div className="dash-card" style={{ padding: '1.25rem', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF' }}>
                🗓️ Lịch Dạy Tuần Này
              </h2>
              <button
                type="button"
                onClick={() => {
                  setIsScheduleRequestOpen(true);
                  setRequestTab('submit');
                }}
                style={{
                  fontSize: '0.75rem',
                  color: '#FB923C',
                  background: 'none',
                  border: 'none',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Xin đổi ca ➔
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {schedules.length > 0 ? (
                schedules.map((item) => (
                  <div
                    key={item._id}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderLeft: '4px solid #57D061',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#A0EC1D' }}>
                        {item.dayOfWeek}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#93C5FD', fontWeight: 700, backgroundColor: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '2px 8px', borderRadius: '12px' }}>
                        {item.startTime} - {item.endTime}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF', marginTop: '0.35rem' }}>
                      {item.class?.classCode} • {item.class?.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.2rem' }}>
                      📍 {item.classroom || item.class?.room} {item.topic && `• 📖 ${item.topic}`}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94A3B8', fontSize: '0.85rem' }}>
                  Chưa có lịch dạy cố định cho tuần này.
                </div>
              )}
            </div>
          </div>

          {/* Cột phải: Điểm danh ca dạy */}
          <div className="dash-card" style={{ padding: '1.25rem', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF' }}>
                  ✅ Điểm Danh Ca Dạy: {classes.find((c) => c._id === selectedClassId)?.classCode || 'Lớp học'}
                </h2>
                <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                  Ghi nhận trạng thái tham gia &amp; nhận xét cho từng học viên
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  style={{
                    padding: '0.45rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: '#FFFFFF',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  {classes.map((c) => (
                    <option key={c._id} value={c._id} style={{ backgroundColor: '#161f30', color: '#FFFFFF' }}>
                      {c.classCode} ({c.name})
                    </option>
                  ))}
                </select>

                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  style={{
                    padding: '0.45rem 0.6rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: '#FFFFFF',
                    colorScheme: 'dark',
                    fontSize: '0.8rem',
                  }}
                />

                <button
                  type="button"
                  onClick={() => {
                    const next = attendanceViewMode === 'check' ? 'history' : 'check';
                    setAttendanceViewMode(next);
                    if (next === 'history') loadAttendanceHistory();
                  }}
                  style={{
                    padding: '0.45rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: '#FFFFFF',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {attendanceViewMode === 'check' ? '📜 Xem Lịch Sử' : '✏️ Điểm Danh Hôm Nay'}
                </button>
              </div>
            </div>

            {attendanceViewMode === 'check' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={handleMarkAllPresent}
                    style={{
                      background: 'rgba(87, 208, 97, 0.15)',
                      border: '1px solid #57D061',
                      color: '#A0EC1D',
                      padding: '0.4rem 0.75rem',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    ⚡ Tất cả có mặt
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAttendance}
                    style={{
                      backgroundColor: '#57D061',
                      color: '#052F2E',
                      border: 'none',
                      padding: '0.4rem 1rem',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    💾 Lưu Điểm Danh
                  </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.15)', textAlign: 'left', color: '#94A3B8' }}>
                        <th style={{ padding: '8px 12px' }}>Học Viên</th>
                        <th style={{ padding: '8px 12px' }}>Target</th>
                        <th style={{ padding: '8px 12px' }}>Trạng Thái Điểm Danh</th>
                        <th style={{ padding: '8px 12px' }}>Ghi Chú Nhận Xét</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classStudents.map((stu) => {
                        const rec = attendanceForm[stu._id] || { status: 'PRESENT', notes: '' };
                        return (
                          <tr key={stu._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                            <td style={{ padding: '10px 12px' }}>
                              <div style={{ fontWeight: 800, color: '#FFFFFF' }}>{stu.fullName}</div>
                              <div style={{ fontSize: '0.75rem', color: '#A0EC1D', fontWeight: 700 }}>{stu.studentCode}</div>
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              <span style={{ backgroundColor: 'rgba(251, 191, 36, 0.15)', color: '#FCD34D', border: '1px solid rgba(251, 191, 36, 0.3)', padding: '2px 8px', borderRadius: '10px', fontWeight: 800, fontSize: '0.75rem' }}>
                                Band {stu.targetBand}
                              </span>
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                {(
                                  [
                                    { key: 'PRESENT', label: 'Có mặt', color: '#57D061', activeBg: '#57D061', activeColor: '#052F2E' },
                                    { key: 'LATE', label: 'Muộn', color: '#F59E0B', activeBg: '#F59E0B', activeColor: '#000000' },
                                    { key: 'ABSENT', label: 'Vắng', color: '#EF4444', activeBg: '#EF4444', activeColor: '#FFFFFF' },
                                    { key: 'EXCUSED', label: 'Có phép', color: '#3B82F6', activeBg: '#3B82F6', activeColor: '#FFFFFF' },
                                  ] as const
                                ).map((st) => (
                                  <button
                                    key={st.key}
                                    type="button"
                                    onClick={() =>
                                      setAttendanceForm((prev) => ({
                                        ...prev,
                                        [stu._id]: { ...rec, status: st.key },
                                      }))
                                    }
                                    style={{
                                      padding: '4px 8px',
                                      borderRadius: '6px',
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      border: rec.status === st.key ? `2px solid ${st.color}` : '1px solid rgba(255, 255, 255, 0.2)',
                                      backgroundColor: rec.status === st.key ? st.activeBg : 'rgba(255, 255, 255, 0.05)',
                                      color: rec.status === st.key ? st.activeColor : '#94A3B8',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    {st.label}
                                  </button>
                                ))}
                              </div>
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              <input
                                type="text"
                                placeholder="Ghi chú (phát biểu tốt, vắng có phép...)"
                                value={rec.notes}
                                onChange={(e) =>
                                  setAttendanceForm((prev) => ({
                                    ...prev,
                                    [stu._id]: { ...rec, notes: e.target.value },
                                  }))
                                }
                                style={{
                                  width: '100%',
                                  padding: '5px 8px',
                                  borderRadius: '6px',
                                  border: '1px solid rgba(255, 255, 255, 0.2)',
                                  backgroundColor: 'rgba(255, 255, 255, 0.07)',
                                  color: '#FFFFFF',
                                  fontSize: '0.78rem',
                                }}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {attendanceViewMode === 'history' && (
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.5rem', color: '#FFFFFF' }}>
                  Lịch sử các buổi điểm danh gần đây:
                </div>
                {attendanceRecords.length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.15)', textAlign: 'left', color: '#94A3B8' }}>
                          <th style={{ padding: '8px' }}>Ngày học</th>
                          <th style={{ padding: '8px' }}>Học viên</th>
                          <th style={{ padding: '8px' }}>Trạng thái</th>
                          <th style={{ padding: '8px' }}>Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceRecords.map((item) => (
                          <tr key={item._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                            <td style={{ padding: '8px', color: '#CBD5E1' }}>
                              {new Date(item.sessionDate).toLocaleDateString('vi-VN')}
                            </td>
                            <td style={{ padding: '8px', fontWeight: 700, color: '#FFFFFF' }}>{item.student?.fullName}</td>
                            <td style={{ padding: '8px' }}>
                              <span
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: '10px',
                                  fontWeight: 800,
                                  fontSize: '0.72rem',
                                  backgroundColor:
                                    item.status === 'PRESENT' ? 'rgba(87, 208, 97, 0.2)' : item.status === 'LATE' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                  color:
                                    item.status === 'PRESENT' ? '#57D061' : item.status === 'LATE' ? '#FCD34D' : '#FCA5A5',
                                  border:
                                    item.status === 'PRESENT' ? '1px solid rgba(87, 208, 97, 0.3)' : item.status === 'LATE' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                                }}
                              >
                                {item.status}
                              </span>
                            </td>
                            <td style={{ padding: '8px', color: '#94A3B8' }}>{item.notes || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8' }}>
                    Chưa có bản ghi điểm danh nào trước đó.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: QUẢN LÝ BÀI TẬP & CHẤM BÀI */}
      {activeTab === 'assignments_grading' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF' }}>
                ✍️ Quản Lý Bài Tập &amp; Chấm Điểm
              </h2>
              <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                Tạo bài tập theo kỹ năng (Writing / Speaking / Listening / Reading) và chấm bài chi tiết theo tiêu chí IELTS
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsCreateAssOpen(true)}
              style={{
                backgroundColor: '#EC6E23',
                color: '#FFFFFF',
                border: 'none',
                padding: '0.6rem 1.2rem',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(236, 110, 35, 0.25)',
              }}
            >
              <span>➕</span>
              <span>Tạo &amp; Giao Bài Tập Mới</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
            {assignments.map((ass) => (
              <div
                key={ass._id}
                className="dash-card"
                style={{
                  padding: '1.25rem',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderTop: '4px solid #57D061',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ backgroundColor: 'rgba(2, 132, 199, 0.2)', color: '#38BDF8', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '2px 8px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 700 }}>
                      {ass.skill}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#CBD5E1', fontWeight: 600 }}>
                      Hạn nộp: {new Date(ass.dueDate).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  <h3 style={{ margin: '0.5rem 0 0.35rem', fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.3 }}>
                    {ass.title}
                  </h3>

                  <div style={{ fontSize: '0.8rem', color: '#94A3B8', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {ass.description}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: '1px solid rgba(255, 255, 255, 0.1)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '0.8rem' }}>
                    <span style={{ color: '#CBD5E1' }}>Lớp: <strong style={{ color: '#A0EC1D' }}>{ass.class?.classCode}</strong></span>
                    <span style={{ color: '#CBD5E1' }}>
                      Đã nộp: <strong style={{ color: '#57D061' }}>{ass.stats?.submittedCount || 0}</strong> / <span style={{ color: '#94A3B8' }}>{ass.stats?.totalStudents || 16}</span>
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => handleOpenGradingList(ass)}
                      style={{
                        flex: 1,
                        backgroundColor: 'rgba(87, 208, 97, 0.15)',
                        color: '#A0EC1D',
                        border: '1px solid #57D061',
                        padding: '0.5rem',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#57D061';
                        e.currentTarget.style.color = '#052F2E';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(87, 208, 97, 0.15)';
                        e.currentTarget.style.color = '#A0EC1D';
                      }}
                    >
                      <span>📝</span>
                      <span>Chấm Bài ({ass.stats?.pendingCount || 0} chờ)</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: LỚP HỌC & HỌC VIÊN */}
      {activeTab === 'classes_students' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Section 1: Assigned Classes */}
          <div>
            <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF' }}>
              🏫 Danh Sách Lớp Học Phụ Trách (Class Management)
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
              {classes.map((cls) => (
                <div
                  key={cls._id}
                  className="dash-card"
                  style={{
                    padding: '1.25rem',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderLeft: '4px solid #A0EC1D',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, color: '#A0EC1D', fontSize: '1.05rem' }}>
                      {cls.classCode}
                    </span>
                    <span style={{ backgroundColor: 'rgba(87, 208, 97, 0.2)', color: '#57D061', border: '1px solid rgba(87, 208, 97, 0.3)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700 }}>
                      {cls.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FFFFFF', marginTop: '0.35rem' }}>
                    {cls.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div>📍 Phòng: <strong style={{ color: '#CBD5E1' }}>{cls.room}</strong></div>
                    <div>⏰ Lịch học: <strong style={{ color: '#CBD5E1' }}>{cls.scheduleDays.join(' - ')} ({cls.timeSlot})</strong></div>
                    <div>👥 Sĩ số: <strong style={{ color: '#CBD5E1' }}>{cls.currentEnrollment} / {cls.capacity} học viên</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Student List & Detail */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF' }}>
                  👥 Danh Sách Học Viên (Student Directory &amp; Detail)
                </h2>
                <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                  Nhấp vào học viên để xem hồ sơ chi tiết, điểm danh và kết quả học tập
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="🔍 Tìm theo tên hoặc mã học viên..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  style={{
                    padding: '0.5rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: '#FFFFFF',
                    fontSize: '0.82rem',
                    width: '260px',
                  }}
                />
              </div>
            </div>

            <div className="dash-card" style={{ padding: '0.5rem', borderRadius: '16px', overflowX: 'auto', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.15)', textAlign: 'left', color: '#94A3B8' }}>
                    <th style={{ padding: '10px 14px' }}>Mã &amp; Tên Học Viên</th>
                    <th style={{ padding: '10px 14px' }}>Liên Hệ</th>
                    <th style={{ padding: '10px 14px' }}>Target Band</th>
                    <th style={{ padding: '10px 14px' }}>Mục Tiêu</th>
                    <th style={{ padding: '10px 14px' }}>Chuyên Cần</th>
                    <th style={{ padding: '10px 14px' }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {searchedStudents.map((stu) => (
                    <tr key={stu._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 800, color: '#FFFFFF', fontSize: '0.9rem' }}>{stu.fullName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#A0EC1D', fontWeight: 700, marginTop: '2px' }}>{stu.studentCode}</div>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '0.82rem' }}>
                        <div style={{ color: '#E2E8F0' }}>{stu.email}</div>
                        <div style={{ color: '#94A3B8', fontSize: '0.78rem', marginTop: '2px' }}>{stu.phone}</div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ backgroundColor: 'rgba(251, 191, 36, 0.15)', color: '#FCD34D', border: '1px solid rgba(251, 191, 36, 0.3)', padding: '3px 9px', borderRadius: '12px', fontWeight: 800, fontSize: '0.78rem' }}>
                          Band {stu.targetBand}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '0.82rem', color: '#CBD5E1' }}>
                        {stu.learningGoal}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ color: '#57D061', fontWeight: 800, fontSize: '0.88rem' }}>
                          {stu.attendanceStats?.attendanceRate || 92}%
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStudentDetail(stu);
                            setIsStudentDetailOpen(true);
                          }}
                          style={{
                            backgroundColor: 'rgba(87, 208, 97, 0.15)',
                            color: '#A0EC1D',
                            border: '1px solid #57D061',
                            padding: '0.45rem 0.9rem',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'poin      {/* TAB 4: BẢNG ĐIỂM & KẾT QUẢ HỌC TẬP */}
      {activeTab === 'academic_grades' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF' }}>
                📊 Bảng Điểm &amp; Kết Quả Học Tập (Academic Performance)
              </h2>
              <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                Theo dõi điểm thi thử Mock Test, kiểm tra định kỳ 4 kỹ năng và cập nhật bảng điểm học viên
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingGradeId(null);
                setGradeFormTitle('IELTS Mock Test Số 2');
                setGradeFormOverall(7.0);
                setIsGradeModalOpen(true);
              }}
              style={{
                backgroundColor: '#57D061',
                color: '#052F2E',
                border: 'none',
                padding: '0.6rem 1.2rem',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(87, 208, 97, 0.3)',
              }}
            >
              <span>➕</span>
              <span>Nhập Điểm Bài Thi Mới</span>
            </button>
          </div>

          <div className="dash-card" style={{ padding: '0.5rem', borderRadius: '16px', overflowX: 'auto', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.15)', textAlign: 'left', color: '#94A3B8' }}>
                  <th style={{ padding: '10px 14px' }}>Học Viên</th>
                  <th style={{ padding: '10px 14px' }}>Bài Đánh Giá</th>
                  <th style={{ padding: '10px 14px' }}>Ngày Thi</th>
                  <th style={{ padding: '10px 14px' }}>Overall Band</th>
                  <th style={{ padding: '10px 14px' }}>L / R / W / S</th>
                  <th style={{ padding: '10px 14px' }}>Nhận Xét Giảng Viên</th>
                  <th style={{ padding: '10px 14px' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {grades.map((g) => (
                  <tr key={g._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 800, color: '#FFFFFF', fontSize: '0.9rem' }}>{g.student?.fullName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#A0EC1D', fontWeight: 700, marginTop: '2px' }}>{g.class?.classCode}</div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 700, color: '#FCD34D', fontSize: '0.88rem' }}>{g.title}</div>
                      <span style={{ fontSize: '0.7rem', color: '#93C5FD', backgroundColor: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '1px 6px', borderRadius: '6px', display: 'inline-block', marginTop: '2px' }}>
                        {g.evaluationType}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '0.82rem', color: '#CBD5E1' }}>
                      {new Date(g.testDate).toLocaleDateString('vi-VN')}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ backgroundColor: 'rgba(87, 208, 97, 0.2)', color: '#57D061', border: '1px solid #57D061', padding: '3px 10px', borderRadius: '12px', fontWeight: 900, fontSize: '0.85rem' }}>
                        Band {g.overallBand.toFixed(1)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '0.82rem', color: '#CBD5E1' }}>
                      L: <strong style={{ color: '#FFFFFF' }}>{g.listening ?? '—'}</strong> | R: <strong style={{ color: '#FFFFFF' }}>{g.reading ?? '—'}</strong> | W: <strong style={{ color: '#FFFFFF' }}>{g.writing ?? '—'}</strong> | S: <strong style={{ color: '#FFFFFF' }}>{g.speaking ?? '—'}</strong>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '0.8rem', color: '#94A3B8', maxWidth: '200px' }}>
                      {g.feedback || '—'}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleEditGrade(g)}
                          style={{
                            background: 'rgba(160, 236, 29, 0.12)',
                            border: '1px solid #A0EC1D',
                            color: '#A0EC1D',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                          title="Chỉnh sửa điểm"
                        >
                          ✏️ Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteGrade(g._id)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid #EF4444',
                            color: '#FCA5A5',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                          title="Xóa điểm"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}rsor: 'pointer',
                          }}
                          title="Chỉnh sửa điểm"
                        >
                          ✏️ Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteGrade(g._id)}
                          style={{
                            background: 'none',
                            border: '1px solid #FCA5A5',
                            color: '#DC2626',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                          title="Xóa điểm"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 1: XIN ĐỔI LỊCH DẠY & THEO DÕI YÊU CẦU (Features: 9, 10)
          ───────────────────────────────────────────────────────────── */}
      {isScheduleRequestOpen && (
        <div className="dmr-modal-overlay" onClick={() => setIsScheduleRequestOpen(false)}>
          <div className="dmr-modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#07403F' }}>
                🔄 Đơn Xin Đổi Lịch Dạy / Ca Dạy
              </h3>
              <button type="button" onClick={() => setIsScheduleRequestOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            {/* Segmented Control */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', backgroundColor: '#F1F5F9', padding: '4px', borderRadius: '8px' }}>
              <button
                type="button"
                onClick={() => setRequestTab('submit')}
                style={{
                  flex: 1,
                  padding: '6px',
                  borderRadius: '6px',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  backgroundColor: requestTab === 'submit' ? '#FFFFFF' : 'transparent',
                  color: requestTab === 'submit' ? '#07403F' : '#64748B',
                }}
              >
                📝 Gửi Đơn Yêu Cầu Mới
              </button>
              <button
                type="button"
                onClick={() => setRequestTab('history')}
                style={{
                  flex: 1,
                  padding: '6px',
                  borderRadius: '6px',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  backgroundColor: requestTab === 'history' ? '#FFFFFF' : 'transparent',
                  color: requestTab === 'history' ? '#07403F' : '#64748B',
                }}
              >
                📋 Lịch Sử &amp; Trạng Thái ({scheduleRequests.length})
              </button>
            </div>

            {requestTab === 'submit' && (
              <form onSubmit={handleSubmitScheduleRequest}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>Lớp cần đổi ca:</label>
                    <select
                      value={reqClassId}
                      onChange={(e) => setReqClassId(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                      required
                    >
                      {classes.map((c) => (
                        <option key={c._id} value={c._id}>{c.classCode} ({c.name})</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>Lịch hiện tại:</label>
                      <input
                        type="text"
                        value={reqCurrentSched}
                        onChange={(e) => setReqCurrentSched(e.target.value)}
                        style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>Lịch đề xuất chuyển sang:</label>
                      <input
                        type="text"
                        value={reqTargetSched}
                        onChange={(e) => setReqTargetSched(e.target.value)}
                        style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>Ngày của ca dạy cần đổi (tùy chọn):</label>
                    <input
                      type="date"
                      value={reqSessionDate}
                      onChange={(e) => setReqSessionDate(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>Lý do xin đổi ca dạy:</label>
                    <textarea
                      rows={3}
                      placeholder="Nêu rõ lý do (trùng lịch công tác, việc cá nhân, tập huấn chuyên môn...)"
                      value={reqReason}
                      onChange={(e) => setReqReason(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setIsScheduleRequestOpen(false)}
                      style={{ padding: '0.55rem 1rem', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFF' }}
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingReq}
                      style={{ padding: '0.55rem 1.25rem', borderRadius: '8px', border: 'none', backgroundColor: '#EC6E23', color: '#FFF', fontWeight: 700 }}
                    >
                      {isSubmittingReq ? 'Đang gửi...' : 'Gửi Đơn Lên Giáo Vụ'}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {requestTab === 'history' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto' }}>
                {scheduleRequests.length > 0 ? (
                  scheduleRequests.map((req) => (
                    <div
                      key={req._id}
                      style={{
                        padding: '0.85rem',
                        borderRadius: '10px',
                        border: '1px solid #E2E8F0',
                        backgroundColor: '#F8FAFC',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#07403F' }}>
                          Lớp: {req.currentClass?.classCode}
                        </span>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontWeight: 800,
                            fontSize: '0.72rem',
                            backgroundColor:
                              req.status === 'APPROVED' ? '#DCFCE7' : req.status === 'PENDING' ? '#FEF3C7' : '#FEE2E2',
                            color:
                              req.status === 'APPROVED' ? '#166534' : req.status === 'PENDING' ? '#B45309' : '#991B1B',
                          }}
                        >
                          {req.status === 'APPROVED' ? 'ĐÃ DUYỆT' : req.status === 'PENDING' ? 'CHỜ DUYỆT' : 'TỪ CHỐI'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '0.25rem' }}>
                        Đổi từ: <strong>{req.currentSchedule}</strong> ➔ Sang: <strong>{req.targetSchedule}</strong>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>
                        Lý do: {req.reason}
                      </div>
                      {req.reviewNote && (
                        <div style={{ fontSize: '0.72rem', color: '#2563EB', marginTop: '0.25rem', backgroundColor: '#EFF6FF', padding: '4px', borderRadius: '4px' }}>
                          Phản hồi giáo vụ: {req.reviewNote}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8' }}>
                    Chưa có yêu cầu đổi ca dạy nào.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 2: TẠO VÀ GIAO BÀI TẬP (Features: 11, 12)
          ───────────────────────────────────────────────────────────── */}
      {isCreateAssOpen && (
        <div className="dmr-modal-overlay" onClick={() => setIsCreateAssOpen(false)}>
          <div className="dmr-modal-content" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#07403F' }}>
                ➕ Giao Bài Tập Mới Cho Lớp
              </h3>
              <button type="button" onClick={() => setIsCreateAssOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleCreateAssignment}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>Lớp học được giao bài:</label>
                  <select
                    value={assClassId}
                    onChange={(e) => setAssClassId(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                    required
                  >
                    {classes.map((c) => (
                      <option key={c._id} value={c._id}>{c.classCode} ({c.name})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>Tiêu đề bài tập:</label>
                  <input
                    type="text"
                    placeholder="VD: Writing Task 2 - Essay on Globalization"
                    value={assTitle}
                    onChange={(e) => setAssTitle(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>Kỹ năng IELTS:</label>
                    <select
                      value={assSkill}
                      onChange={(e) => setAssSkill(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                    >
                      <option value="Writing Task 1">Writing Task 1</option>
                      <option value="Writing Task 2">Writing Task 2</option>
                      <option value="Speaking Mock">Speaking Mock (Ghi âm)</option>
                      <option value="Listening Test">Listening Test</option>
                      <option value="Reading Test">Reading Test</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>Hạn chót nộp bài:</label>
                    <input
                      type="date"
                      value={assDueDate}
                      onChange={(e) => setAssDueDate(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>Max Band / Điểm:</label>
                    <input
                      type="number"
                      step="0.5"
                      value={assMaxScore}
                      onChange={(e) => setAssMaxScore(Number(e.target.value))}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>Mô tả đề bài &amp; Hướng dẫn nộp bài:</label>
                  <textarea
                    rows={4}
                    placeholder="Nhập đề bài chi tiết, số lượng từ tối thiểu, cấu trúc yêu cầu..."
                    value={assDesc}
                    onChange={(e) => setAssDesc(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsCreateAssOpen(false)}
                    style={{ padding: '0.55rem 1rem', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFF' }}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingAss}
                    style={{ padding: '0.55rem 1.25rem', borderRadius: '8px', border: 'none', backgroundColor: '#EC6E23', color: '#FFF', fontWeight: 700 }}
                  >
                    {isSubmittingAss ? 'Đang tạo...' : 'Xuất Bản & Giao Bài'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 3: DANH SÁCH BÀI NỘP & CHẤM ĐIỂM (Features: 7)
          ───────────────────────────────────────────────────────────── */}
      {isGradingListOpen && selectedAssignmentForGrading && (
        <div className="dmr-modal-overlay" onClick={() => setIsGradingListOpen(false)}>
          <div className="dmr-modal-content" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#07403F' }}>
                  📝 Chấm Bài: {selectedAssignmentForGrading.title}
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  Lớp: {selectedAssignmentForGrading.class?.classCode} • Kỹ năng: {selectedAssignmentForGrading.skill}
                </span>
              </div>
              <button type="button" onClick={() => setIsGradingListOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            {/* Submissions List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '450px', overflowY: 'auto' }}>
              {gradingSubmissions.length > 0 ? (
                gradingSubmissions.map((sub) => (
                  <div
                    key={sub._id}
                    style={{
                      padding: '1rem',
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      backgroundColor: sub.status === 'GRADED' ? '#F0FDF4' : '#FFFBEB',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1E293B' }}>
                          {sub.student?.fullName}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#64748B', marginLeft: '8px' }}>
                          Nộp lúc: {new Date(sub.submissionTime).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontWeight: 800,
                          fontSize: '0.72rem',
                          backgroundColor: sub.status === 'GRADED' ? '#DCFCE7' : '#FEF3C7',
                          color: sub.status === 'GRADED' ? '#166534' : '#B45309',
                        }}
                      >
                        {sub.status === 'GRADED' ? `ĐÃ CHẤM (Band ${sub.grade})` : 'CHỜ CHẤM'}
                      </span>
                    </div>

                    <div style={{ backgroundColor: '#FFFFFF', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0', margin: '0.6rem 0', fontSize: '0.8rem', color: '#334155', maxHeight: '120px', overflowY: 'auto', whiteSpace: 'pre-line' }}>
                      {sub.content || '(Bài nộp trống)'}
                    </div>

                    {sub.feedback && (
                      <div style={{ fontSize: '0.75rem', color: '#166534', backgroundColor: '#DCFCE7', padding: '6px 10px', borderRadius: '6px', marginBottom: '0.5rem' }}>
                        💬 <strong>Nhận xét:</strong> {sub.feedback}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setActiveSubmission(sub);
                        setGradeBand(sub.grade || 7.0);
                        setGradeFeedback(sub.feedback || '');
                        if (sub.criteria) {
                          setGradeCriteria({
                            taskAchievement: sub.criteria.taskAchievement || 7.0,
                            coherenceCohesion: sub.criteria.coherenceCohesion || 7.0,
                            lexicalResource: sub.criteria.lexicalResource || 7.0,
                            grammaticalAccuracy: sub.criteria.grammaticalAccuracy || 7.0,
                          });
                        }
                      }}
                      style={{
                        backgroundColor: '#07403F',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '0.45rem 0.9rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {sub.status === 'GRADED' ? '✏️ Chấm Lại' : '✍️ Chấm Điểm & Nhận Xét'}
                    </button>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8' }}>
                  Chưa có học viên nào nộp bài tập này.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 3B: BẢNG CHẤM CHI TIẾT THEO TIÊU CHÍ IELTS
          ───────────────────────────────────────────────────────────── */}
      {activeSubmission && (
        <div className="dmr-modal-overlay" style={{ zIndex: 1100 }} onClick={() => setActiveSubmission(null)}>
          <div className="dmr-modal-content" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#07403F' }}>
                🎯 Chấm Barem IELTS: {activeSubmission.student?.fullName}
              </h3>
              <button type="button" onClick={() => setActiveSubmission(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ backgroundColor: '#F8FAFC', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.8rem', maxHeight: '100px', overflowY: 'auto' }}>
                <strong>Nội dung bài làm:</strong>
                <p style={{ margin: '4px 0 0', whiteSpace: 'pre-line' }}>{activeSubmission.content}</p>
              </div>

              {/* 4 Tiêu chí IELTS */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Task Achievement / Response:</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="9.0"
                    value={gradeCriteria.taskAchievement}
                    onChange={(e) => setGradeCriteria({ ...gradeCriteria, taskAchievement: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Coherence &amp; Cohesion:</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="9.0"
                    value={gradeCriteria.coherenceCohesion}
                    onChange={(e) => setGradeCriteria({ ...gradeCriteria, coherenceCohesion: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Lexical Resource:</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="9.0"
                    value={gradeCriteria.lexicalResource}
                    onChange={(e) => setGradeCriteria({ ...gradeCriteria, lexicalResource: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Grammatical Range &amp; Accuracy:</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="9.0"
                    value={gradeCriteria.grammaticalAccuracy}
                    onChange={(e) => setGradeCriteria({ ...gradeCriteria, grammaticalAccuracy: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#07403F', marginBottom: '0.2rem' }}>
                  Overall Band Điểm (0.0 - 9.0):
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="9.0"
                  value={gradeBand}
                  onChange={(e) => setGradeBand(Number(e.target.value))}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '2px solid #57D061', fontWeight: 800, fontSize: '1rem', color: '#07403F' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                  Nhận xét &amp; Góp ý sửa bài:
                </label>
                <textarea
                  rows={3}
                  placeholder="Ghi nhận xét chi tiết, chỉ ra các lỗi ngữ pháp và khen ngợi tiến bộ..."
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setActiveSubmission(null)}
                  style={{ padding: '0.55rem 1rem', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFF' }}
                >
                  Đóng
                </button>
                <button
                  type="button"
                  disabled={isSavingGrade}
                  onClick={handleSaveSubmissionGrade}
                  style={{ padding: '0.55rem 1.25rem', borderRadius: '8px', border: 'none', backgroundColor: '#57D061', color: '#052F2E', fontWeight: 800 }}
                >
                  {isSavingGrade ? 'Đang lưu...' : 'Lưu & Gửi Điểm Cho Học Viên'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 4: CHI TIẾT HỒ SƠ HỌC VIÊN (Feature: 4)
          ───────────────────────────────────────────────────────────── */}
      {isStudentDetailOpen && selectedStudentDetail && (
        <div className="dmr-modal-overlay" onClick={() => setIsStudentDetailOpen(false)}>
          <div
            className="dmr-modal-content"
            style={{
              maxWidth: '620px',
              backgroundColor: '#FFFFFF',
              color: '#0F172A',
              padding: '1.75rem',
              borderRadius: '20px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #A0EC1D 0%, #57D061 100%)',
                    color: '#052F2E',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '1.5rem',
                    boxShadow: '0 4px 12px rgba(87, 208, 97, 0.35)',
                  }}
                >
                  {selectedStudentDetail.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
                    {selectedStudentDetail.fullName}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                    <span style={{ backgroundColor: '#DCFCE7', color: '#166534', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800 }}>
                      Mã HV: {selectedStudentDetail.studentCode}
                    </span>
                    <span style={{ backgroundColor: '#E0F2FE', color: '#0369A1', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                      Học viên chính thức
                    </span>
                    {selectedStudentDetail.classes.length > 0 && (
                      <span style={{ backgroundColor: '#FEF3C7', color: '#B45309', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                        {selectedStudentDetail.classes[0].classCode}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsStudentDetailOpen(false)}
                style={{
                  background: '#F1F5F9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  color: '#64748B',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#E2E8F0'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#F1F5F9'; }}
                title="Đóng cửa sổ"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* 4 Khối thông tin liên hệ & Target band */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.85rem', borderRadius: '12px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    📧 Email Học Viên
                  </div>
                  <div style={{ fontSize: '0.88rem', color: '#0F172A', fontWeight: 700, marginTop: '0.25rem', wordBreak: 'break-all' }}>
                    {selectedStudentDetail.email || 'Chưa cập nhật'}
                  </div>
                </div>

                <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.85rem', borderRadius: '12px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    📞 Số Điện Thoại
                  </div>
                  <div style={{ fontSize: '0.88rem', color: '#0F172A', fontWeight: 700, marginTop: '0.25rem' }}>
                    {selectedStudentDetail.phone || '0988 123 456'}
                  </div>
                </div>

                <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', padding: '0.85rem', borderRadius: '12px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#B45309', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    🎯 Target Band Mục Tiêu
                  </div>
                  <div style={{ fontSize: '1.15rem', color: '#D97706', fontWeight: 900, marginTop: '0.2rem' }}>
                    Band {selectedStudentDetail.targetBand}
                  </div>
                </div>

                <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', padding: '0.85rem', borderRadius: '12px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#1D4ED8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    📊 Band Hiện Tại / Đầu Vào
                  </div>
                  <div style={{ fontSize: '1.15rem', color: '#2563EB', fontWeight: 900, marginTop: '0.2rem' }}>
                    Band {selectedStudentDetail.currentBand ?? 5.5}
                  </div>
                </div>
              </div>

              {/* Mục tiêu học tập */}
              <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.85rem 1rem', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🎯</span>
                  <span>Mục Tiêu &amp; Định Hướng Học Tập</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 600, marginTop: '0.35rem', lineHeight: 1.4 }}>
                  {selectedStudentDetail.learningGoal || 'Du học Thạc sĩ Châu Âu & Xét tuyển Đại học'}
                </div>
              </div>

              {/* Người liên hệ khẩn cấp */}
              <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.85rem 1rem', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>👨‍👩‍👧</span>
                  <span>Thông Tin Phụ Huynh / Liên Hệ Khẩn Cấp</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 600, marginTop: '0.35rem' }}>
                  {selectedStudentDetail.emergencyContact?.name && selectedStudentDetail.emergencyContact.name.trim() !== '' ? (
                    <span>
                      {selectedStudentDetail.emergencyContact.name}{' '}
                      <span style={{ color: '#64748B' }}>
                        ({selectedStudentDetail.emergencyContact.relationship || 'Phụ huynh'})
                      </span>{' '}
                      • 📞 <strong>{selectedStudentDetail.emergencyContact.phone || selectedStudentDetail.phone}</strong>
                    </span>
                  ) : (
                    <span>
                      Phụ huynh học viên <span style={{ color: '#64748B' }}>(Bố/Mẹ)</span> • 📞{' '}
                      <strong>{selectedStudentDetail.phone || '0988 123 456'}</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* Thống kê chuyên cần & Đào tạo */}
              <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', padding: '0.85rem 1rem', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>📈</span>
                  <span>Tình Hình Chuyên Cần &amp; Tham Gia Lớp Học</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#166534' }}>Tỷ lệ có mặt: </span>
                    <strong style={{ fontSize: '1rem', color: '#15803D' }}>
                      {selectedStudentDetail.attendanceStats?.attendanceRate || 100}%
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#166534' }}>Số buổi tham gia: </span>
                    <strong style={{ color: '#15803D' }}>
                      {selectedStudentDetail.attendanceStats?.present || 1} / {selectedStudentDetail.attendanceStats?.total || 1} buổi
                    </strong>
                  </div>
                  <div>
                    <span style={{ backgroundColor: '#DCFCE7', color: '#166534', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>
                      ✓ Chuyên cần tốt
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer action */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsStudentDetailOpen(false)}
                  style={{
                    padding: '0.6rem 1.5rem',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: '#07403F',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(7, 64, 63, 0.25)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#0d5654'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#07403F'; }}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 5: NHẬP & CẬP NHẬT ĐIỂM BÀI THI (Features: 8)
          ───────────────────────────────────────────────────────────── */}
      {isGradeModalOpen && (
        <div className="dmr-modal-overlay" onClick={() => setIsGradeModalOpen(false)}>
          <div className="dmr-modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#07403F' }}>
                {editingGradeId ? '✏️ Cập Nhật Điểm Bài Thi' : '➕ Nhập Điểm Đánh Giá Học Viên'}
              </h3>
              <button type="button" onClick={() => setIsGradeModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSaveAcademicGrade}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>Học viên:</label>
                    <select
                      value={gradeFormStudentId}
                      onChange={(e) => setGradeFormStudentId(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                      required
                      disabled={!!editingGradeId}
                    >
                      {students.map((s) => (
                        <option key={s._id} value={s._id}>{s.fullName} ({s.studentCode})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>Lớp học:</label>
                    <select
                      value={gradeFormClassId}
                      onChange={(e) => setGradeFormClassId(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                      required
                      disabled={!!editingGradeId}
                    >
                      {classes.map((c) => (
                        <option key={c._id} value={c._id}>{c.classCode}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>Tiêu đề bài thi:</label>
                    <input
                      type="text"
                      placeholder="VD: IELTS Mock Test Số 2"
                      value={gradeFormTitle}
                      onChange={(e) => setGradeFormTitle(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>Loại bài:</label>
                    <select
                      value={gradeFormType}
                      onChange={(e) => setGradeFormType(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                    >
                      <option value="MOCK_TEST">Mock Test</option>
                      <option value="MID_TERM">Giữa khóa</option>
                      <option value="FINAL_TEST">Cuối khóa</option>
                      <option value="SPEAKING_ASSESSMENT">Speaking Coaching</option>
                      <option value="WRITING_ASSESSMENT">Writing Intensive</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#166534' }}>Overall</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="9.0"
                      value={gradeFormOverall}
                      onChange={(e) => setGradeFormOverall(Number(e.target.value))}
                      style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '2px solid #57D061', fontWeight: 800 }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Listening</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="9.0"
                      value={gradeFormL}
                      onChange={(e) => setGradeFormL(Number(e.target.value))}
                      style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Reading</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="9.0"
                      value={gradeFormR}
                      onChange={(e) => setGradeFormR(Number(e.target.value))}
                      style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Writing</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="9.0"
                      value={gradeFormW}
                      onChange={(e) => setGradeFormW(Number(e.target.value))}
                      style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Speaking</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="9.0"
                      value={gradeFormS}
                      onChange={(e) => setGradeFormS(Number(e.target.value))}
                      style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>Nhận xét kết quả bài thi:</label>
                  <textarea
                    rows={2}
                    placeholder="Đánh giá điểm mạnh và phần cần khắc phục..."
                    value={gradeFormFeedback}
                    onChange={(e) => setGradeFormFeedback(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsGradeModalOpen(false)}
                    style={{ padding: '0.55rem 1rem', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFF' }}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingAcademicGrade}
                    style={{ padding: '0.55rem 1.25rem', borderRadius: '8px', border: 'none', backgroundColor: '#57D061', color: '#052F2E', fontWeight: 800 }}
                  >
                    {isSavingAcademicGrade ? 'Đang lưu...' : editingGradeId ? 'Cập Nhật Điểm' : 'Lưu Điểm Học Viên'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
