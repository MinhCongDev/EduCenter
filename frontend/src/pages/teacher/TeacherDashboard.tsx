import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { teacherService } from '../../services/teacher.service';
import type {
  AcademicGrade,
  AssignedClass,
  AttendanceRecord,
  ScheduleChangeRequest,
  TeacherStudent,
  TeachingScheduleItem,
} from '../../services/teacher.service';
import type { EvaluationRating, GradeEvaluationType } from '../../types';

export type TeacherTab = 'overview' | 'classes_students' | 'schedule' | 'attendance' | 'grades';

type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED';

const EVALUATION_META: Record<
  GradeEvaluationType,
  { label: string; group: 'TEST' | 'EVALUATION'; bg: string; color: string; border: string }
> = {
  ENTRY_TEST: {
    label: 'Kiểm tra đầu vào',
    group: 'TEST',
    bg: '#e0f2fe',
    color: '#0369a1',
    border: '#bae6fd',
  },
  MID_TERM: {
    label: 'Kiểm tra giữa kỳ',
    group: 'TEST',
    bg: '#fce7f3',
    color: '#be185d',
    border: '#fbcfe8',
  },
  FINAL_TEST: {
    label: 'Kiểm tra cuối kỳ',
    group: 'TEST',
    bg: '#fee2e2',
    color: '#b91c1c',
    border: '#fecaca',
  },
  MOCK_TEST: {
    label: 'Thi thử (Mock Test)',
    group: 'TEST',
    bg: '#eff6ff',
    color: '#1d4ed8',
    border: '#bfdbfe',
  },
  MONTHLY_EVALUATION: {
    label: 'Nhận xét theo tháng',
    group: 'EVALUATION',
    bg: '#ecfdf5',
    color: '#047857',
    border: '#a7f3d0',
  },
  COURSE_EVALUATION: {
    label: 'Đánh giá cuối khóa',
    group: 'EVALUATION',
    bg: '#eef2ff',
    color: '#4338ca',
    border: '#c7d2fe',
  },
  ASSIGNMENT: {
    label: 'Bài tập',
    group: 'TEST',
    bg: '#f1f5f9',
    color: '#475569',
    border: '#cbd5e1',
  },
  SPEAKING_ASSESSMENT: {
    label: 'Đánh giá Speaking',
    group: 'TEST',
    bg: '#f5f3ff',
    color: '#6d28d9',
    border: '#ddd6fe',
  },
  WRITING_ASSESSMENT: {
    label: 'Đánh giá Writing',
    group: 'TEST',
    bg: '#fef3c7',
    color: '#b45309',
    border: '#fde68a',
  },
};

const RATING_LABELS: Record<EvaluationRating, { label: string; bg: string; color: string }> = {
  EXCELLENT: { label: 'Xuất sắc', bg: '#dcfce7', color: '#166534' },
  GOOD: { label: 'Tốt', bg: '#dbeafe', color: '#1d4ed8' },
  SATISFACTORY: { label: 'Đạt yêu cầu', bg: '#fef3c7', color: '#b45309' },
  NEEDS_IMPROVEMENT: { label: 'Cần cố gắng', bg: '#fee2e2', color: '#b91c1c' },
};

const ATTENDANCE_STATUSES: Array<{
  key: AttendanceStatus;
  label: string;
  activeBg: string;
  pillBg: string;
  pillColor: string;
}> = [
  { key: 'PRESENT', label: 'Có mặt', activeBg: '#059669', pillBg: '#ecfdf5', pillColor: '#047857' },
  { key: 'LATE', label: 'Muộn', activeBg: '#d97706', pillBg: '#fef3c7', pillColor: '#b45309' },
  { key: 'ABSENT', label: 'Vắng', activeBg: '#dc2626', pillBg: '#fee2e2', pillColor: '#b91c1c' },
  { key: 'EXCUSED', label: 'Có phép', activeBg: '#2563eb', pillBg: '#eff6ff', pillColor: '#1d4ed8' },
];

const WEEKDAYS_ORDER = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

const toIsoDate = (value: Date | string): string => {
  if (typeof value === 'string') return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
};

const getMondayOfWeek = (baseDate: Date): Date => {
  const copy = new Date(Date.UTC(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate()));
  const day = copy.getUTCDay();
  const diff = (day + 6) % 7;
  copy.setUTCDate(copy.getUTCDate() - diff);
  return copy;
};

const addDaysUtc = (date: Date, days: number): Date => {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
};

const roundHalfBand = (val: number): number => Math.round(val * 2) / 2;

const resolveTab = (param: string | null): TeacherTab => {
  if (param === 'classes_students') return 'classes_students';
  if (param === 'schedule' || param === 'schedule_attendance') return 'schedule';
  if (param === 'attendance') return 'attendance';
  if (param === 'grades' || param === 'academic_grades') return 'grades';
  return 'overview';
};

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TeacherTab>(() => resolveTab(searchParams.get('tab')));

  useEffect(() => {
    setActiveTab(resolveTab(searchParams.get('tab')));
  }, [searchParams]);

  const handleTabChange = (newTab: TeacherTab) => {
    setActiveTab(newTab);
    if (newTab === 'overview') setSearchParams({});
    else setSearchParams({ tab: newTab });
  };

  // Loading & Toast
  const [loading, setLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Core data states
  const [classes, setClasses] = useState<AssignedClass[]>([]);
  const [students, setStudents] = useState<TeacherStudent[]>([]);
  const [schedules, setSchedules] = useState<TeachingScheduleItem[]>([]);
  const [grades, setGrades] = useState<AcademicGrade[]>([]);
  const [scheduleRequests, setScheduleRequests] = useState<ScheduleChangeRequest[]>([]);

  // Classes & Students filter
  const [selectedClassFilterId, setSelectedClassFilterId] = useState<string>('');
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<TeacherStudent | null>(null);
  const [isStudentDetailOpen, setIsStudentDetailOpen] = useState<boolean>(false);

  // Schedule tab state
  const [scheduleClassFilterId, setScheduleClassFilterId] = useState<string>('');
  const [scheduleViewMode, setScheduleViewMode] = useState<'week' | 'list'>('week');
  const [weekStart, setWeekStart] = useState<Date>(() => getMondayOfWeek(new Date()));

  // Attendance tab state
  const [attendanceClassId, setAttendanceClassId] = useState<string>('');
  const [attendanceDate, setAttendanceDate] = useState<string>(() => toIsoDate(new Date()));
  const [attendanceScheduleId, setAttendanceScheduleId] = useState<string>('');
  const [attendanceForm, setAttendanceForm] = useState<
    Record<string, { status: AttendanceStatus; notes: string }>
  >({});
  const [attendanceViewMode, setAttendanceViewMode] = useState<'check' | 'history'>('check');
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState<boolean>(false);
  const [savingAttendance, setSavingAttendance] = useState<boolean>(false);
  const [sessionAlreadyRecorded, setSessionAlreadyRecorded] = useState<boolean>(false);

  // Grades & Evaluations tab state
  const [gradeCategoryFilter, setGradeCategoryFilter] = useState<'ALL' | 'TESTS' | 'EVALUATIONS'>('ALL');
  const [gradeClassFilterId, setGradeClassFilterId] = useState<string>('');
  const [gradeSearch, setGradeSearch] = useState<string>('');

  // Grade / Evaluation Modal state
  const [isGradeModalOpen, setIsGradeModalOpen] = useState<boolean>(false);
  const [gradeModalMode, setGradeModalMode] = useState<'TEST' | 'EVALUATION'>('TEST');
  const [editingGradeId, setEditingGradeId] = useState<string | null>(null);
  const [gradeFormClassId, setGradeFormClassId] = useState<string>('');
  const [gradeFormStudentId, setGradeFormStudentId] = useState<string>('');
  const [gradeFormType, setGradeFormType] = useState<GradeEvaluationType>('MID_TERM');
  const [gradeFormTitle, setGradeFormTitle] = useState<string>('');
  const [gradeFormPeriod, setGradeFormPeriod] = useState<string>('');
  const [gradeFormRating, setGradeFormRating] = useState<EvaluationRating | ''>('GOOD');
  const [gradeFormDate, setGradeFormDate] = useState<string>(() => toIsoDate(new Date()));
  const [gradeFormOverall, setGradeFormOverall] = useState<string>('6.5');
  const [gradeFormL, setGradeFormL] = useState<string>('');
  const [gradeFormR, setGradeFormR] = useState<string>('');
  const [gradeFormW, setGradeFormW] = useState<string>('');
  const [gradeFormS, setGradeFormS] = useState<string>('');
  const [gradeFormFeedback, setGradeFormFeedback] = useState<string>('');
  const [isSavingGrade, setIsSavingGrade] = useState<boolean>(false);

  // Schedule Change Request Modal
  const [isScheduleRequestOpen, setIsScheduleRequestOpen] = useState<boolean>(false);
  const [requestTab, setRequestTab] = useState<'submit' | 'history'>('submit');
  const [reqClassId, setReqClassId] = useState<string>('');
  const [reqCurrentSched, setReqCurrentSched] = useState<string>('Thứ 2 (18:30 - 20:30)');
  const [reqTargetSched, setReqTargetSched] = useState<string>('Thứ 4 (18:30 - 20:30)');
  const [reqSessionDate, setReqSessionDate] = useState<string>('');
  const [reqReason, setReqReason] = useState<string>('');
  const [isSubmittingReq, setIsSubmittingReq] = useState<boolean>(false);

  // Initial load
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [clsRes, stuRes, schedRes, grdRes, reqRes] = await Promise.all([
        teacherService.getAssignedClasses().catch(() => ({ data: { classes: [] } })),
        teacherService.getStudents().catch(() => ({ data: { students: [] } })),
        teacherService.getTeachingSchedule().catch(() => ({ data: { schedules: [] } })),
        teacherService.getStudentAcademicResults().catch(() => ({ data: { grades: [] } })),
        teacherService.getScheduleChangeRequests().catch(() => ({ data: { requests: [] } })),
      ]);

      const loadedClasses: AssignedClass[] = clsRes.data?.classes || [];
      const loadedStudents: TeacherStudent[] = stuRes.data?.students || [];

      setClasses(loadedClasses);
      setStudents(loadedStudents);
      setSchedules(schedRes.data?.schedules || []);
      setGrades(grdRes.data?.grades || []);
      setScheduleRequests(reqRes.data?.requests || []);

      if (loadedClasses.length > 0) {
        const firstClassId = loadedClasses[0]._id;
        setAttendanceClassId((prev) => prev || firstClassId);
        setReqClassId((prev) => prev || firstClassId);
        setGradeFormClassId((prev) => prev || firstClassId);
      }
      if (loadedStudents.length > 0) {
        setGradeFormStudentId((prev) => prev || loadedStudents[0]._id);
      }
    } catch (err: any) {
      showToast(' Không thể tải dữ liệu: ' + (err?.message || 'Lỗi mạng'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Students belonging to selected attendance class
  const attendanceStudents = useMemo(
    () =>
      students.filter((s) =>
        attendanceClassId ? s.classes.some((c) => c._id === attendanceClassId) : false
      ),
    [students, attendanceClassId]
  );

  // Sessions for selected attendance class (helps teacher pick exact scheduled session)
  const classSessionOptions = useMemo(() => {
    return schedules
      .filter((s) => s.class?._id === attendanceClassId && s.sessionDate)
      .sort((a, b) => (a.sessionDate || '').localeCompare(b.sessionDate || ''));
  }, [schedules, attendanceClassId]);

  // Load saved attendance whenever class or date changes
  useEffect(() => {
    if (!attendanceClassId || !attendanceDate) return;

    let cancelled = false;
    const loadSessionAttendance = async () => {
      setLoadingAttendance(true);
      try {
        const res = await teacherService.getAttendance({
          classId: attendanceClassId,
          sessionDate: attendanceDate,
        });
        if (cancelled) return;

        const existingRecords: AttendanceRecord[] = res.data?.records || [];
        const recordByStudent = new Map<string, AttendanceRecord>();
        existingRecords.forEach((r) => {
          const sid = typeof r.student === 'object' ? r.student._id : String(r.student);
          recordByStudent.set(sid, r);
        });

        setSessionAlreadyRecorded(existingRecords.length > 0);

        const nextForm: Record<string, { status: AttendanceStatus; notes: string }> = {};
        attendanceStudents.forEach((stu) => {
          const saved = recordByStudent.get(stu._id);
          nextForm[stu._id] = saved
            ? { status: saved.status, notes: saved.notes || '' }
            : { status: 'PRESENT', notes: '' };
        });
        setAttendanceForm(nextForm);
      } catch {
        if (cancelled) return;
        const fallbackForm: Record<string, { status: AttendanceStatus; notes: string }> = {};
        attendanceStudents.forEach((stu) => {
          fallbackForm[stu._id] = { status: 'PRESENT', notes: '' };
        });
        setAttendanceForm(fallbackForm);
        setSessionAlreadyRecorded(false);
      } finally {
        if (!cancelled) setLoadingAttendance(false);
      }
    };

    loadSessionAttendance();
    return () => {
      cancelled = true;
    };
  }, [attendanceClassId, attendanceDate, attendanceStudents]);

  const loadAttendanceHistory = async (targetClassId = attendanceClassId) => {
    if (!targetClassId) return;
    try {
      const res = await teacherService.getAttendance({ classId: targetClassId });
      setAttendanceHistory(res.data?.records || []);
    } catch {
      showToast(' Lỗi khi tải lịch sử điểm danh');
    }
  };

  useEffect(() => {
    if (attendanceViewMode === 'history' && attendanceClassId) {
      loadAttendanceHistory(attendanceClassId);
    }
  }, [attendanceViewMode, attendanceClassId]);

  const handleSaveAttendance = async () => {
    if (!attendanceClassId) {
      showToast('Vui lòng chọn lớp học trước khi lưu điểm danh');
      return;
    }
    if (attendanceStudents.length === 0) {
      showToast('Lớp học này chưa có học viên để điểm danh');
      return;
    }

    setSavingAttendance(true);
    try {
      const records = attendanceStudents.map((stu) => {
        const entry = attendanceForm[stu._id] || { status: 'PRESENT' as AttendanceStatus, notes: '' };
        return {
          studentId: stu._id,
          status: entry.status,
          notes: entry.notes,
        };
      });

      await teacherService.checkAttendance({
        classId: attendanceClassId,
        sessionDate: attendanceDate,
        classScheduleId: attendanceScheduleId || undefined,
        records,
      });

      setSessionAlreadyRecorded(true);
      showToast(` Đã lưu điểm danh buổi học ngày ${attendanceDate} (${records.length} học viên)!`);
    } catch (err: any) {
      showToast(' Lỗi khi lưu điểm danh: ' + (err?.response?.data?.message || err.message));
    } finally {
      setSavingAttendance(false);
    }
  };

  const handleMarkAllPresent = () => {
    setAttendanceForm((prev) => {
      const next = { ...prev };
      attendanceStudents.forEach((stu) => {
        next[stu._id] = { status: 'PRESENT', notes: prev[stu._id]?.notes || '' };
      });
      return next;
    });
  };

  const handleJumpToAttendance = (item: TeachingScheduleItem) => {
    setAttendanceClassId(item.class._id);
    if (item.sessionDate) {
      setAttendanceDate(toIsoDate(item.sessionDate));
    }
    if (item._id && !item._id.includes('-')) {
      setAttendanceScheduleId(item._id);
    } else {
      setAttendanceScheduleId('');
    }
    setAttendanceViewMode('check');
    handleTabChange('attendance');
  };

  // Filtered students for Classes & Students tab
  const filteredStudentsForClass = useMemo(
    () =>
      students.filter((s) =>
        selectedClassFilterId ? s.classes.some((c) => c._id === selectedClassFilterId) : true
      ),
    [students, selectedClassFilterId]
  );

  const searchedStudents = useMemo(() => {
    if (!studentSearch.trim()) return filteredStudentsForClass;
    const q = studentSearch.toLowerCase();
    return filteredStudentsForClass.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.studentCode.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
    );
  }, [filteredStudentsForClass, studentSearch]);

  // Schedule tab computations
  const filteredSchedules = useMemo(
    () =>
      schedules.filter((s) =>
        scheduleClassFilterId ? s.class?._id === scheduleClassFilterId : true
      ),
    [schedules, scheduleClassFilterId]
  );

  const weekDays = useMemo(() => {
    const weekEnd = addDaysUtc(weekStart, 6);
    const startStr = toIsoDate(weekStart);
    const endStr = toIsoDate(weekEnd);

    return WEEKDAYS_ORDER.map((dayLabel, idx) => {
      const dayDate = addDaysUtc(weekStart, idx);
      const dayIso = toIsoDate(dayDate);

      const items = filteredSchedules.filter((s) => {
        if (s.sessionDate) {
          return toIsoDate(s.sessionDate) === dayIso;
        }
        return s.dayOfWeek === dayLabel && dayIso >= startStr && dayIso <= endStr;
      });

      return { dayLabel, dayIso, dayDate, items };
    });
  }, [filteredSchedules, weekStart]);

  // Attendance live summary counts
  const attendanceCounts = useMemo(() => {
    const counts: Record<AttendanceStatus, number> = {
      PRESENT: 0,
      LATE: 0,
      ABSENT: 0,
      EXCUSED: 0,
    };
    attendanceStudents.forEach((stu) => {
      const st = attendanceForm[stu._id]?.status || 'PRESENT';
      counts[st] += 1;
    });
    return counts;
  }, [attendanceStudents, attendanceForm]);

  // Grades & Evaluations filtering
  const filteredGrades = useMemo(() => {
    return grades.filter((g) => {
      const meta = EVALUATION_META[g.evaluationType];
      if (gradeCategoryFilter === 'TESTS' && meta?.group !== 'TEST') return false;
      if (gradeCategoryFilter === 'EVALUATIONS' && meta?.group !== 'EVALUATION') return false;
      if (gradeClassFilterId && g.class?._id !== gradeClassFilterId) return false;
      if (gradeSearch.trim()) {
        const q = gradeSearch.toLowerCase();
        const matchName = g.student?.fullName?.toLowerCase().includes(q);
        const matchTitle = g.title?.toLowerCase().includes(q);
        const matchPeriod = g.period?.toLowerCase().includes(q);
        if (!matchName && !matchTitle && !matchPeriod) return false;
      }
      return true;
    });
  }, [grades, gradeCategoryFilter, gradeClassFilterId, gradeSearch]);

  const studentsForGradeForm = useMemo(() => {
    if (!gradeFormClassId) return students;
    const list = students.filter((s) => s.classes.some((c) => c._id === gradeFormClassId));
    return list.length > 0 ? list : students;
  }, [students, gradeFormClassId]);

  const openNewGradeModal = (mode: 'TEST' | 'EVALUATION') => {
    const defaultClassId = gradeClassFilterId || classes[0]?._id || '';
    const classStudents = students.filter((s) => s.classes.some((c) => c._id === defaultClassId));
    const defaultStudentId = classStudents[0]?._id || students[0]?._id || '';

    setEditingGradeId(null);
    setGradeModalMode(mode);
    setGradeFormClassId(defaultClassId);
    setGradeFormStudentId(defaultStudentId);
    setGradeFormDate(toIsoDate(new Date()));
    setGradeFormFeedback('');

    if (mode === 'TEST') {
      setGradeFormType('MID_TERM');
      setGradeFormTitle('Kiểm tra định kỳ giữa kỳ');
      setGradeFormPeriod('');
      setGradeFormRating('');
      setGradeFormOverall('6.5');
      setGradeFormL('');
      setGradeFormR('');
      setGradeFormW('');
      setGradeFormS('');
    } else {
      const now = new Date();
      const monthLabel = `Tháng ${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
      setGradeFormType('MONTHLY_EVALUATION');
      setGradeFormTitle(`Đánh giá học tập ${monthLabel}`);
      setGradeFormPeriod(monthLabel);
      setGradeFormRating('GOOD');
      setGradeFormOverall('');
      setGradeFormL('');
      setGradeFormR('');
      setGradeFormW('');
      setGradeFormS('');
    }
    setIsGradeModalOpen(true);
  };

  const handleEditGrade = (grade: AcademicGrade) => {
    const isEval =
      grade.evaluationType === 'MONTHLY_EVALUATION' ||
      grade.evaluationType === 'COURSE_EVALUATION';
    setEditingGradeId(grade._id);
    setGradeModalMode(isEval ? 'EVALUATION' : 'TEST');
    setGradeFormStudentId(grade.student._id);
    setGradeFormClassId(grade.class._id);
    setGradeFormType(grade.evaluationType);
    setGradeFormTitle(grade.title);
    setGradeFormPeriod(grade.period || '');
    setGradeFormRating(grade.rating || '');
    setGradeFormDate(grade.testDate ? toIsoDate(grade.testDate) : toIsoDate(new Date()));
    setGradeFormOverall(
      grade.overallBand !== undefined && grade.overallBand !== null
        ? String(grade.overallBand)
        : ''
    );
    setGradeFormL(grade.listening !== undefined ? String(grade.listening) : '');
    setGradeFormR(grade.reading !== undefined ? String(grade.reading) : '');
    setGradeFormW(grade.writing !== undefined ? String(grade.writing) : '');
    setGradeFormS(grade.speaking !== undefined ? String(grade.speaking) : '');
    setGradeFormFeedback(grade.feedback || '');
    setIsGradeModalOpen(true);
  };

  const handleCalculateOverall = () => {
    const nums = [gradeFormL, gradeFormR, gradeFormW, gradeFormS]
      .map((v) => Number.parseFloat(v))
      .filter((n) => !Number.isNaN(n));
    if (nums.length === 0) {
      showToast('Nhập ít nhất 1 kỹ năng (L/R/W/S) để tự tính Overall Band');
      return;
    }
    const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
    setGradeFormOverall(roundHalfBand(avg).toFixed(1));
  };

  const handleSaveAcademicGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradeFormStudentId || !gradeFormClassId || !gradeFormTitle.trim()) {
      showToast('Vui lòng chọn lớp học, học viên và nhập tiêu đề');
      return;
    }

    const isEvalMode =
      gradeModalMode === 'EVALUATION' ||
      gradeFormType === 'MONTHLY_EVALUATION' ||
      gradeFormType === 'COURSE_EVALUATION';

    if (!isEvalMode && gradeFormOverall === '') {
      showToast('Vui lòng nhập điểm Overall Band cho bài kiểm tra định kỳ');
      return;
    }
    if (isEvalMode && !gradeFormFeedback.trim() && !gradeFormRating && gradeFormOverall === '') {
      showToast('Vui lòng nhập nội dung nhận xét hoặc xếp loại cho học viên');
      return;
    }

    setIsSavingGrade(true);
    try {
      const payload = {
        evaluationType: gradeFormType,
        title: gradeFormTitle.trim(),
        period: gradeFormPeriod.trim(),
        rating: gradeFormRating || undefined,
        testDate: gradeFormDate,
        overallBand: gradeFormOverall !== '' ? Number(gradeFormOverall) : undefined,
        listening: gradeFormL !== '' ? Number(gradeFormL) : undefined,
        reading: gradeFormR !== '' ? Number(gradeFormR) : undefined,
        writing: gradeFormW !== '' ? Number(gradeFormW) : undefined,
        speaking: gradeFormS !== '' ? Number(gradeFormS) : undefined,
        feedback: gradeFormFeedback.trim(),
      };

      if (editingGradeId) {
        await teacherService.updateGrade(editingGradeId, {
          ...payload,
          overallBand: gradeFormOverall !== '' ? Number(gradeFormOverall) : null,
          listening: gradeFormL !== '' ? Number(gradeFormL) : null,
          reading: gradeFormR !== '' ? Number(gradeFormR) : null,
          writing: gradeFormW !== '' ? Number(gradeFormW) : null,
          speaking: gradeFormS !== '' ? Number(gradeFormS) : null,
          rating: gradeFormRating || null,
        });
        showToast(' Đã cập nhật kết quả / nhận xét thành công!');
      } else {
        await teacherService.createGrade({
          studentId: gradeFormStudentId,
          classId: gradeFormClassId,
          ...payload,
        });
        showToast(
          isEvalMode
            ? 'Đã lưu đánh giá nhận xét học viên!'
            : 'Đã nhập điểm kiểm tra định kỳ thành công!'
        );
      }

      setIsGradeModalOpen(false);
      setEditingGradeId(null);
      const res = await teacherService.getStudentAcademicResults();
      setGrades(res.data?.grades || []);
    } catch (err: any) {
      showToast(' Lỗi lưu dữ liệu: ' + (err?.response?.data?.message || err.message));
    } finally {
      setIsSavingGrade(false);
    }
  };

  const handleDeleteGrade = async (gradeId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bản ghi này không?')) return;
    try {
      await teacherService.deleteGrade(gradeId);
      showToast('Đã xóa bản ghi');
      setGrades((prev) => prev.filter((g) => g._id !== gradeId));
    } catch {
      showToast(' Lỗi khi xóa bản ghi');
    }
  };

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
      showToast(' Đã gửi đơn xin đổi lịch dạy tới Ban Giáo vụ!');
      setReqReason('');
      const res = await teacherService.getScheduleChangeRequests();
      setScheduleRequests(res.data?.requests || []);
      setRequestTab('history');
    } catch (err: any) {
      showToast(' Lỗi gửi yêu cầu: ' + (err?.response?.data?.message || err.message));
    } finally {
      setIsSubmittingReq(false);
    }
  };

  const thisWeekSchedules = useMemo(() => {
    const currentWeekStart = getMondayOfWeek(new Date());
    const currentWeekStartIso = toIsoDate(currentWeekStart);
    const currentWeekEndIso = toIsoDate(addDaysUtc(currentWeekStart, 6));

    return schedules
      .filter((item) => {
        if (!item.sessionDate) return true;
        const iso = toIsoDate(item.sessionDate);
        return iso >= currentWeekStartIso && iso <= currentWeekEndIso;
      })
      .sort((a, b) => {
        const dA = a.sessionDate ? toIsoDate(a.sessionDate) : '9999-99-99';
        const dB = b.sessionDate ? toIsoDate(b.sessionDate) : '9999-99-99';
        if (dA !== dB) return dA.localeCompare(dB);
        return (a.startTime || '').localeCompare(b.startTime || '');
      });
  }, [schedules]);

  const periodicTestCount = grades.filter((g) => EVALUATION_META[g.evaluationType]?.group === 'TEST').length;
  const evaluationCount = grades.filter((g) => EVALUATION_META[g.evaluationType]?.group === 'EVALUATION').length;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

  return (
    <div className="dash-container">
      {toastMessage && (
        <div className="dmr-toast" role="status" style={{ zIndex: 9999 }}>
          
          <span>{toastMessage}</span>
        </div>
      )}

      {loading && (
        <div
          style={{
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#047857',
            padding: '8px 16px',
            borderRadius: '10px',
            fontSize: '0.82rem',
            fontWeight: 700,
            textAlign: 'center',
          }}
        >
          Đang tải dữ liệu giảng dạy từ hệ thống EduCenter...
        </div>
      )}

      {/* ── TAB TỔNG QUAN ── */}
      {activeTab === 'overview' && (
        <>
          <div
            className="dash-banner"
            style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)' }}
          >
            <div className="dash-banner-content">
              <div className="dash-banner-badge">Giảng viên • Quản lý lớp học</div>
              <h1>
                {greeting}, {user?.fullName || 'Giảng viên'}!
              </h1>
              <p>
                Theo dõi lịch dạy, điểm danh từng buổi học, nhập điểm kiểm tra định kỳ và nhận xét học viên theo tháng/khóa.
              </p>
            </div>
            <div className="dash-banner-right">
              <div className="dash-date-pill">
                <div>Hôm nay: {new Date().toLocaleDateString('vi-VN')}</div>
                <div className="sub">{classes.length} lớp đang phụ trách</div>
              </div>
            </div>
          </div>

          <div className="dash-actions-row">
            <button type="button" className="dash-quick-btn" onClick={() => handleTabChange('schedule')}>
              Lịch dạy tuần này ({thisWeekSchedules.length})
            </button>
            <button type="button" className="dash-quick-btn" onClick={() => handleTabChange('attendance')}>
              Điểm danh buổi học
            </button>
            <button
              type="button"
              className="dash-quick-btn"
              onClick={() => {
                handleTabChange('grades');
                openNewGradeModal('TEST');
              }}
            >
              Nhập điểm định kỳ
            </button>
            <button
              type="button"
              className="dash-quick-btn"
              onClick={() => {
                handleTabChange('grades');
                openNewGradeModal('EVALUATION');
              }}
            >
              Nhận xét tháng / khóa
            </button>
            <button
              type="button"
              className="dash-quick-btn"
              onClick={() => handleTabChange('classes_students')}
            >
              Lớp học &amp; Học viên ({students.length})
            </button>
            <button
              type="button"
              className="dash-quick-btn"
              onClick={() => {
                setIsScheduleRequestOpen(true);
                setRequestTab('submit');
              }}
            >
              Xin đổi lịch dạy
            </button>
          </div>

          <div className="dash-metrics-grid">
            <div
              className="dash-metric-card"
              onClick={() => handleTabChange('classes_students')}
              style={{ cursor: 'pointer' }}
            >
              <div className="dash-metric-info">
                <span className="dash-metric-label">Lớp đang phụ trách</span>
                <span className="dash-metric-val">{classes.length} lớp</span>
                <span className="dash-metric-trend up">Xem danh sách lớp ➔</span>
              </div>
            </div>

            <div
              className="dash-metric-card"
              onClick={() => handleTabChange('schedule')}
              style={{ cursor: 'pointer' }}
            >
              <div className="dash-metric-info">
                <span className="dash-metric-label">Buổi dạy trong tuần</span>
                <span className="dash-metric-val">{thisWeekSchedules.length} buổi</span>
                <span className="dash-metric-trend up">Xem thời khóa biểu ➔</span>
              </div>
            </div>

            <div
              className="dash-metric-card"
              onClick={() => handleTabChange('attendance')}
              style={{ cursor: 'pointer' }}
            >
              <div className="dash-metric-info">
                <span className="dash-metric-label">Tổng học viên</span>
                <span className="dash-metric-val">{students.length} HV</span>
                <span className="dash-metric-trend up">Điểm danh buổi học ➔</span>
              </div>
            </div>

            <div
              className="dash-metric-card"
              onClick={() => handleTabChange('grades')}
              style={{ cursor: 'pointer' }}
            >
              <div className="dash-metric-info">
                <span className="dash-metric-label">Điểm &amp; Nhận xét</span>
                <span className="dash-metric-val">{grades.length} bản ghi</span>
                <span className="dash-metric-trend neutral">
                  {periodicTestCount} bài thi • {evaluationCount} nhận xét
                </span>
              </div>
            </div>
          </div>

          <div className="dash-two-col">
            {/* Left column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 0 }}>
              <div className="dash-card">
                <div
                  className="dash-card-header"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <h2 className="dash-card-title">
                     Lịch Dạy Tuần Này ({thisWeekSchedules.length} buổi)
                  </h2>
                  <button
                    type="button"
                    onClick={() => handleTabChange('schedule')}
                    style={{
                      fontSize: '0.8rem',
                      color: '#059669',
                      background: 'none',
                      border: 'none',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Xem thời khóa biểu ➔
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                  {thisWeekSchedules.length > 0 ? (
                    thisWeekSchedules.map((item) => (
                      <div
                        key={item._id}
                        style={{
                          padding: '0.85rem 1rem',
                          borderRadius: '10px',
                          backgroundColor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderLeft: '4px solid #059669',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '1rem',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 800, color: '#047857', fontSize: '0.85rem' }}>
                              {item.dayOfWeek}
                              {item.sessionDate
                                ? ` (${new Date(item.sessionDate).toLocaleDateString('vi-VN')})`
                                : ''}
                            </span>
                            <span
                              style={{
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                color: '#1d4ed8',
                                backgroundColor: '#eff6ff',
                                border: '1px solid #bfdbfe',
                                padding: '2px 8px',
                                borderRadius: '6px',
                              }}
                            >
                              {item.startTime} - {item.endTime}
                            </span>
                          </div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', marginTop: '4px' }}>
                            {item.class?.classCode} • {item.class?.name || item.class?.course?.title}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                            {item.classroom || item.class?.room}
                            {item.topic ? ` • ${item.topic}` : ''}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleJumpToAttendance(item)}
                          style={{
                            backgroundColor: '#059669',
                            color: '#ffffff',
                            border: 'none',
                            padding: '0.45rem 0.9rem',
                            borderRadius: '8px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Điểm danh buổi này
                        </button>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b', fontSize: '0.85rem' }}>
                      Tuần này chưa có buổi dạy nào theo lịch.
                    </div>
                  )}
                </div>
              </div>

              <div className="dash-card">
                <div
                  className="dash-card-header"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <h2 className="dash-card-title">
                     Điểm Định Kỳ &amp; Nhận Xét Gần Đây
                  </h2>
                  <button
                    type="button"
                    onClick={() => handleTabChange('grades')}
                    style={{
                      fontSize: '0.8rem',
                      color: '#059669',
                      background: 'none',
                      border: 'none',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Quản lý bảng điểm ➔
                  </button>
                </div>

                <div style={{ overflowX: 'auto', marginTop: '0.5rem' }}>
                  {grades.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                      <thead>
                        <tr
                          style={{
                            borderBottom: '1px solid #e2e8f0',
                            backgroundColor: '#f8fafc',
                            textAlign: 'left',
                            color: '#475569',
                          }}
                        >
                          <th style={{ padding: '8px 10px' }}>Học Viên</th>
                          <th style={{ padding: '8px 10px' }}>Nội Dung</th>
                          <th style={{ padding: '8px 10px' }}>Loại</th>
                          <th style={{ padding: '8px 10px' }}>Kết Quả</th>
                        </tr>
                      </thead>
                      <tbody>
                        {grades.slice(0, 5).map((g) => {
                          const meta = EVALUATION_META[g.evaluationType];
                          return (
                            <tr key={g._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '8px 10px', fontWeight: 700, color: '#0f172a' }}>
                                {g.student?.fullName}
                              </td>
                              <td style={{ padding: '8px 10px', color: '#334155' }}>{g.title}</td>
                              <td style={{ padding: '8px 10px' }}>
                                <span
                                  style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    padding: '2px 7px',
                                    borderRadius: '6px',
                                    backgroundColor: meta?.bg || '#f1f5f9',
                                    color: meta?.color || '#475569',
                                    border: `1px solid ${meta?.border || '#cbd5e1'}`,
                                  }}
                                >
                                  {meta?.label || g.evaluationType}
                                </span>
                              </td>
                              <td style={{ padding: '8px 10px' }}>
                                {g.overallBand !== undefined && g.overallBand !== null ? (
                                  <span
                                    style={{
                                      backgroundColor: '#ecfdf5',
                                      color: '#047857',
                                      border: '1px solid #a7f3d0',
                                      padding: '2px 8px',
                                      borderRadius: '6px',
                                      fontWeight: 800,
                                    }}
                                  >
                                    Band {g.overallBand.toFixed(1)}
                                  </span>
                                ) : g.rating ? (
                                  <span
                                    style={{
                                      backgroundColor: RATING_LABELS[g.rating].bg,
                                      color: RATING_LABELS[g.rating].color,
                                      padding: '2px 8px',
                                      borderRadius: '6px',
                                      fontWeight: 700,
                                      fontSize: '0.74rem',
                                    }}
                                  >
                                    {RATING_LABELS[g.rating].label}
                                  </span>
                                ) : (
                                  <span style={{ color: '#64748b' }}>Đã nhận xét</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b', fontSize: '0.85rem' }}>
                      Chưa có điểm kiểm tra hoặc nhận xét nào.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="dash-card">
                <div className="dash-card-header">
                  <h2 className="dash-card-title">
                     Lớp Đang Phụ Trách
                  </h2>
                </div>
                <div className="dash-item-list">
                  {classes.length > 0 ? (
                    classes.map((cls) => (
                      <div
                        key={cls._id}
                        className="dash-item"
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          setSelectedClassFilterId(cls._id);
                          handleTabChange('classes_students');
                        }}
                      >
                        <div className="dash-item-main">
                          
                          <div>
                            <div className="dash-item-title">
                              {cls.classCode} — {cls.name}
                            </div>
                            <div className="dash-item-sub">
                              {cls.scheduleDays.join(' - ')} ({cls.timeSlot}) • {cls.room}
                            </div>
                          </div>
                        </div>
                        <span className="badge-pill badge-green">
                          {cls.currentEnrollment}/{cls.capacity} HV
                        </span>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '1rem', color: '#64748b', fontSize: '0.85rem' }}>
                      Chưa có lớp phụ trách.
                    </div>
                  )}
                </div>
              </div>

              <div className="dash-card">
                <div className="dash-card-header">
                  <h2 className="dash-card-title">
                     Tác Vụ Nhanh
                  </h2>
                </div>
                <div className="dash-item-list">
                  <div className="dash-item" onClick={() => handleTabChange('attendance')} style={{ cursor: 'pointer' }}>
                    <div className="dash-item-main">
                      
                      <div>
                        <div className="dash-item-title">Điểm danh buổi học</div>
                        <div className="dash-item-sub">Ngày {new Date(attendanceDate).toLocaleDateString('vi-VN')}</div>
                      </div>
                    </div>
                    <span className="badge-pill badge-blue">Điểm danh</span>
                  </div>

                  <div
                    className="dash-item"
                    onClick={() => {
                      handleTabChange('grades');
                      openNewGradeModal('TEST');
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="dash-item-main">
                      
                      <div>
                        <div className="dash-item-title">Nhập điểm kiểm tra định kỳ</div>
                        <div className="dash-item-sub">Đầu vào • Giữa kỳ • Cuối kỳ</div>
                      </div>
                    </div>
                    <span className="badge-pill badge-green">Nhập điểm</span>
                  </div>

                  <div
                    className="dash-item"
                    onClick={() => {
                      setIsScheduleRequestOpen(true);
                      setRequestTab('history');
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="dash-item-main">
                      
                      <div>
                        <div className="dash-item-title">{scheduleRequests.length} đơn đổi lịch dạy</div>
                        <div className="dash-item-sub">Theo dõi trạng thái giáo vụ duyệt</div>
                      </div>
                    </div>
                    <span className="badge-pill badge-purple">Theo dõi</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── SUB-HEADER NAVIGATION FOR SPECIALIZED TABS ── */}
      {activeTab !== 'overview' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.85rem',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <button
            type="button"
            onClick={() => handleTabChange('overview')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 16px',
              borderRadius: '8px',
              border: '1px solid #d7e3d9',
              background: '#ffffff',
              color: '#26743d',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <span>⬅</span>
            <span>Tổng quan</span>
          </button>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {(
              [
                { id: 'classes_students', label: 'Lớp học & Học viên' },
                { id: 'schedule', label: 'Lịch dạy' },
                { id: 'attendance', label: 'Điểm danh buổi học' },
                { id: 'grades', label: 'Điểm định kỳ & Nhận xét' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`dash-quick-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => handleTabChange(tab.id)}
                style={{ fontSize: '0.8rem', padding: '6px 12px' }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB: XEM LỊCH DẠY ── */}
      {activeTab === 'schedule' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div
            className="dash-card"
            style={{
              padding: '1.25rem',
              borderRadius: '16px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                Thời Khóa Biểu &amp; Lịch Giảng Dạy
              </h2>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Xem lịch từng buổi học được phân công và chuyển nhanh sang điểm danh buổi học
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                value={scheduleClassFilterId}
                onChange={(e) => setScheduleClassFilterId(e.target.value)}
                style={{
                  padding: '0.45rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                }}
              >
                <option value="">Tất cả các lớp ({classes.length})</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.classCode} — {c.name}
                  </option>
                ))}
              </select>

              <div
                style={{
                  display: 'inline-flex',
                  backgroundColor: '#f1f5f9',
                  padding: '3px',
                  borderRadius: '8px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setScheduleViewMode('week')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    backgroundColor: scheduleViewMode === 'week' ? '#ffffff' : 'transparent',
                    color: scheduleViewMode === 'week' ? '#047857' : '#64748b',
                  }}
                >
                  Theo tuần
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleViewMode('list')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    backgroundColor: scheduleViewMode === 'list' ? '#ffffff' : 'transparent',
                    color: scheduleViewMode === 'list' ? '#047857' : '#64748b',
                  }}
                >
                  Danh sách buổi
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsScheduleRequestOpen(true);
                  setRequestTab('submit');
                }}
                style={{
                  padding: '0.45rem 0.9rem',
                  borderRadius: '8px',
                  border: '1px solid #059669',
                  backgroundColor: '#ecfdf5',
                  color: '#047857',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Xin đổi lịch dạy
              </button>
            </div>
          </div>

          {scheduleViewMode === 'week' ? (
            <div
              className="dash-card"
              style={{
                padding: '1.25rem',
                borderRadius: '16px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>
                  Tuần: {weekStart.toLocaleDateString('vi-VN')} —{' '}
                  {addDaysUtc(weekStart, 6).toLocaleDateString('vi-VN')}
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setWeekStart((prev) => addDaysUtc(prev, -7))}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    ◀ Tuần trước
                  </button>
                  <button
                    type="button"
                    onClick={() => setWeekStart(getMondayOfWeek(new Date()))}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '8px',
                      border: '1px solid #a7f3d0',
                      backgroundColor: '#ecfdf5',
                      color: '#047857',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Tuần này
                  </button>
                  <button
                    type="button"
                    onClick={() => setWeekStart((prev) => addDaysUtc(prev, 7))}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Tuần sau ▶
                  </button>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                  gap: '0.85rem',
                }}
              >
                {weekDays.map((day) => {
                  const isToday = day.dayIso === toIsoDate(new Date());
                  return (
                    <div
                      key={day.dayIso}
                      style={{
                        borderRadius: '12px',
                        border: isToday ? '2px solid #059669' : '1px solid #e2e8f0',
                        backgroundColor: isToday ? '#f0fdf4' : '#f8fafc',
                        padding: '0.85rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.6rem',
                        minHeight: '150px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          borderBottom: '1px solid #e2e8f0',
                          paddingBottom: '6px',
                        }}
                      >
                        <span style={{ fontWeight: 800, color: isToday ? '#047857' : '#0f172a', fontSize: '0.85rem' }}>
                          {day.dayLabel}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                          {day.dayDate.toLocaleDateString('vi-VN')}
                        </span>
                      </div>

                      {day.items.length === 0 ? (
                        <div style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 'auto 0', textAlign: 'center' }}>
                          Trống lịch
                        </div>
                      ) : (
                        day.items.map((item) => (
                          <div
                            key={`${item._id}-${day.dayIso}`}
                            style={{
                              backgroundColor: '#ffffff',
                              border: '1px solid #cbd5e1',
                              borderLeft: '4px solid #059669',
                              borderRadius: '8px',
                              padding: '0.65rem',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px',
                            }}
                          >
                            <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#1d4ed8' }}>
                              {item.startTime} - {item.endTime}
                            </div>
                            <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f172a' }}>
                              {item.class?.classCode}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                              {item.classroom || item.class?.room}
                            </div>
                            {item.topic && (
                              <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{item.topic}</div>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                handleJumpToAttendance({
                                  ...item,
                                  sessionDate: item.sessionDate || day.dayIso,
                                })
                              }
                              style={{
                                marginTop: '4px',
                                backgroundColor: '#ecfdf5',
                                color: '#047857',
                                border: '1px solid #a7f3d0',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              Điểm danh buổi này
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div
              className="dash-card"
              style={{
                padding: '0.5rem',
                borderRadius: '16px',
                overflowX: 'auto',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', backgroundColor: '#f8fafc', textAlign: 'left', color: '#475569' }}>
                    <th style={{ padding: '10px 14px' }}>Ngày / Thứ</th>
                    <th style={{ padding: '10px 14px' }}>Khung Giờ</th>
                    <th style={{ padding: '10px 14px' }}>Lớp &amp; Khóa Học</th>
                    <th style={{ padding: '10px 14px' }}>Phòng Học</th>
                    <th style={{ padding: '10px 14px' }}>Chủ Đề Buổi Học</th>
                    <th style={{ padding: '10px 14px' }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSchedules.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                        Chưa có buổi học nào trong lịch dạy.
                      </td>
                    </tr>
                  ) : (
                    filteredSchedules.map((item) => (
                      <tr key={item._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#047857' }}>
                          {item.sessionDate
                            ? `${new Date(item.sessionDate).toLocaleDateString('vi-VN')} (${item.dayOfWeek})`
                            : item.dayOfWeek}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span
                            style={{
                              backgroundColor: '#eff6ff',
                              color: '#1d4ed8',
                              border: '1px solid #bfdbfe',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontWeight: 700,
                              fontSize: '0.78rem',
                            }}
                          >
                            {item.startTime} - {item.endTime}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ fontWeight: 800, color: '#0f172a' }}>{item.class?.classCode}</div>
                          <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                            {item.class?.course?.title || item.class?.name}
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px', color: '#334155', fontWeight: 600 }}>
                          {item.classroom || item.class?.room}
                        </td>
                        <td style={{ padding: '10px 14px', color: '#64748b' }}>{item.topic || '—'}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <button
                            type="button"
                            onClick={() => handleJumpToAttendance(item)}
                            style={{
                              backgroundColor: '#059669',
                              color: '#ffffff',
                              border: 'none',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Điểm danh
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: ĐIỂM DANH TỪNG BUỔI HỌC ── */}
      {activeTab === 'attendance' && (
        <div
          className="dash-card"
          style={{
            padding: '1.25rem',
            borderRadius: '16px',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
              marginBottom: '1rem',
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                Điểm Danh Từng Buổi Học — {classes.find((c) => c._id === attendanceClassId)?.classCode || 'Chọn lớp'}
              </h2>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Ghi nhận chuyên cần từng buổi học (Có mặt, Muộn, Vắng, Có phép) và xem lịch sử điểm danh
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                value={attendanceClassId}
                onChange={(e) => {
                  setAttendanceClassId(e.target.value);
                  setAttendanceScheduleId('');
                }}
                style={{
                  padding: '0.45rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                }}
              >
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.classCode} — {c.name}
                  </option>
                ))}
              </select>

              {classSessionOptions.length > 0 && attendanceViewMode === 'check' && (
                <select
                  value={attendanceScheduleId}
                  onChange={(e) => {
                    const schedId = e.target.value;
                    setAttendanceScheduleId(schedId);
                    const found = classSessionOptions.find((s) => s._id === schedId);
                    if (found?.sessionDate) {
                      setAttendanceDate(toIsoDate(found.sessionDate));
                    }
                  }}
                  style={{
                    padding: '0.45rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                  }}
                >
                  <option value="">-- Chọn theo buổi trên lịch --</option>
                  {classSessionOptions.map((s, idx) => (
                    <option key={s._id} value={s._id}>
                      Buổi {idx + 1}: {s.sessionDate ? new Date(s.sessionDate).toLocaleDateString('vi-VN') : s.dayOfWeek} ({s.startTime}-{s.endTime})
                    </option>
                  ))}
                </select>
              )}

              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => {
                  setAttendanceDate(e.target.value);
                  setAttendanceScheduleId('');
                }}
                style={{
                  padding: '0.45rem 0.6rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                }}
              />

              <button
                type="button"
                onClick={() => setAttendanceViewMode((m) => (m === 'check' ? 'history' : 'check'))}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#f8fafc',
                  color: '#1e293b',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {attendanceViewMode === 'check' ? 'Xem Lịch Sử Điểm Danh' : 'Điểm Danh Buổi Học'}
              </button>
            </div>
          </div>

          {attendanceViewMode === 'check' ? (
            <>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  marginBottom: '0.85rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      padding: '3px 9px',
                      borderRadius: '6px',
                      backgroundColor: sessionAlreadyRecorded ? '#dcfce7' : '#fef3c7',
                      color: sessionAlreadyRecorded ? '#166534' : '#b45309',
                    }}
                  >
                    {loadingAttendance
                      ? 'Đang tải...'
                      : sessionAlreadyRecorded
                      ? '✓ Buổi này đã có dữ liệu điểm danh (có thể cập nhật)'
                      : 'Chưa điểm danh buổi này'}
                  </span>
                  {ATTENDANCE_STATUSES.map((st) => (
                    <span
                      key={st.key}
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: st.pillBg,
                        color: st.pillColor,
                      }}
                    >
                      {st.label}: {attendanceCounts[st.key]}
                    </span>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={handleMarkAllPresent}
                    style={{
                      backgroundColor: '#ffffff',
                      color: '#047857',
                      border: '1px solid #a7f3d0',
                      padding: '0.5rem 0.9rem',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    ✓ Tất cả có mặt
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAttendance}
                    disabled={savingAttendance || attendanceStudents.length === 0}
                    style={{
                      backgroundColor: '#059669',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.5rem 1.25rem',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      cursor: savingAttendance ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {savingAttendance ? 'Đang lưu...' : 'Lưu Điểm Danh'}
                  </button>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                  <thead>
                    <tr
                      style={{
                        borderBottom: '2px solid #e2e8f0',
                        backgroundColor: '#f8fafc',
                        textAlign: 'left',
                        color: '#475569',
                      }}
                    >
                      <th style={{ padding: '10px 12px' }}>Học Viên</th>
                      <th style={{ padding: '10px 12px' }}>Trạng Thái Buổi Học</th>
                      <th style={{ padding: '10px 12px' }}>Ghi Chú Buổi Học</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceStudents.length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#64748b' }}>
                          Lớp học này hiện chưa có học viên nào ghi danh.
                        </td>
                      </tr>
                    ) : (
                      attendanceStudents.map((stu) => {
                        const rec = attendanceForm[stu._id] || { status: 'PRESENT' as AttendanceStatus, notes: '' };
                        return (
                          <tr key={stu._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '10px 12px' }}>
                              <div style={{ fontWeight: 800, color: '#0f172a' }}>{stu.fullName}</div>
                              <div style={{ fontSize: '0.74rem', color: '#047857', fontWeight: 700 }}>
                                {stu.studentCode}
                              </div>
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                {ATTENDANCE_STATUSES.map((st) => {
                                  const isSelected = rec.status === st.key;
                                  return (
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
                                        padding: '5px 10px',
                                        borderRadius: '6px',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        border: isSelected
                                          ? `1px solid ${st.activeBg}`
                                          : '1px solid #cbd5e1',
                                        backgroundColor: isSelected ? st.activeBg : '#f8fafc',
                                        color: isSelected ? '#ffffff' : '#64748b',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      {st.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              <input
                                type="text"
                                placeholder="Ghi chú buổi học (đi muộn 10p, phát biểu tốt, xin nghỉ phép...)"
                                value={rec.notes}
                                onChange={(e) =>
                                  setAttendanceForm((prev) => ({
                                    ...prev,
                                    [stu._id]: { ...rec, notes: e.target.value },
                                  }))
                                }
                                style={{
                                  width: '100%',
                                  padding: '6px 10px',
                                  borderRadius: '6px',
                                  border: '1px solid #cbd5e1',
                                  fontSize: '0.82rem',
                                }}
                              />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              {attendanceHistory.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                  <thead>
                    <tr
                      style={{
                        borderBottom: '2px solid #e2e8f0',
                        backgroundColor: '#f8fafc',
                        textAlign: 'left',
                        color: '#475569',
                      }}
                    >
                      <th style={{ padding: '10px 12px' }}>Ngày Học</th>
                      <th style={{ padding: '10px 12px' }}>Học Viên</th>
                      <th style={{ padding: '10px 12px' }}>Trạng Thái</th>
                      <th style={{ padding: '10px 12px' }}>Ghi Chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceHistory.map((item) => {
                      const stCfg = ATTENDANCE_STATUSES.find((s) => s.key === item.status);
                      return (
                        <tr key={item._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: '#334155' }}>
                            {new Date(item.sessionDate).toLocaleDateString('vi-VN')}
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>
                            {item.student?.fullName}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span
                              style={{
                                padding: '3px 9px',
                                borderRadius: '8px',
                                fontWeight: 800,
                                fontSize: '0.74rem',
                                backgroundColor: stCfg?.pillBg || '#f1f5f9',
                                color: stCfg?.pillColor || '#475569',
                              }}
                            >
                              {stCfg?.label || item.status}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', color: '#64748b' }}>{item.notes || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  Lớp này chưa có lịch sử điểm danh nào.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: LỚP HỌC & HỌC VIÊN ── */}
      {activeTab === 'classes_students' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.75rem',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                  Lớp Học Phụ Trách ({classes.length} lớp)
                </h2>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Chọn lớp để xem danh sách học viên thuộc lớp đó
                </span>
              </div>
              {selectedClassFilterId && (
                <button
                  type="button"
                  onClick={() => setSelectedClassFilterId('')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#334155',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  ✕ Hiện tất cả học viên
                </button>
              )}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1rem',
              }}
            >
              {classes.map((cls) => {
                const isSelected = cls._id === selectedClassFilterId;
                const studentCount = students.filter((s) =>
                  s.classes.some((c) => c._id === cls._id)
                ).length;
                return (
                  <div
                    key={cls._id}
                    className="dash-card"
                    onClick={() => setSelectedClassFilterId(isSelected ? '' : cls._id)}
                    style={{
                      padding: '1.15rem',
                      borderRadius: '16px',
                      backgroundColor: isSelected ? '#f0fdf4' : '#ffffff',
                      border: isSelected ? '2px solid #059669' : '1px solid #e2e8f0',
                      borderLeft: '4px solid #059669',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, color: '#047857', fontSize: '1rem' }}>
                        {cls.classCode}
                      </span>
                      <span
                        style={{
                          backgroundColor: '#ecfdf5',
                          color: '#047857',
                          border: '1px solid #a7f3d0',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                        }}
                      >
                        {cls.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginTop: '0.35rem' }}>
                      {cls.name || 'Lớp học'}
                    </div>
                    <div
                      style={{
                        fontSize: '0.78rem',
                        color: '#64748b',
                        marginTop: '0.45rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '3px',
                      }}
                    >
                      <div>{cls.room}</div>
                      <div>
                        {cls.scheduleDays.join(' - ')} ({cls.timeSlot})
                      </div>
                      <div>
                        Sĩ số: <strong style={{ color: '#047857' }}>{studentCount}</strong> / {cls.capacity} HV
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className="dash-card"
            style={{
              padding: '1.25rem',
              borderRadius: '16px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
                marginBottom: '0.85rem',
              }}
            >
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                Danh Sách Học Viên ({searchedStudents.length} học viên)
              </h2>
              <input
                type="text"
                placeholder="Tìm theo tên, email hoặc mã HV..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                style={{
                  padding: '0.5rem 0.9rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.82rem',
                  width: '280px',
                }}
              />
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: '2px solid #e2e8f0',
                      backgroundColor: '#f8fafc',
                      textAlign: 'left',
                      color: '#475569',
                    }}
                  >
                    <th style={{ padding: '10px 12px' }}>Học Viên</th>
                    <th style={{ padding: '10px 12px' }}>Liên Hệ</th>
                    <th style={{ padding: '10px 12px' }}>Band Hiện Tại / Target</th>
                    <th style={{ padding: '10px 12px' }}>Lớp Đang Học</th>
                    <th style={{ padding: '10px 12px' }}>Chuyên Cần</th>
                    <th style={{ padding: '10px 12px' }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {searchedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                        Không có học viên phù hợp.
                      </td>
                    </tr>
                  ) : (
                    searchedStudents.map((stu) => (
                      <tr key={stu._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ fontWeight: 800, color: '#0f172a' }}>{stu.fullName}</div>
                          <div style={{ fontSize: '0.74rem', color: '#047857', fontWeight: 700 }}>
                            {stu.studentCode}
                          </div>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <div>{stu.email}</div>
                          <div style={{ fontSize: '0.76rem', color: '#64748b' }}>{stu.phone}</div>
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 700 }}>
                          {stu.currentBand} ➔ <span style={{ color: '#b45309' }}>{stu.targetBand}</span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          {stu.classes.map((c) => (
                            <span
                              key={c._id}
                              style={{
                                display: 'inline-block',
                                padding: '2px 7px',
                                borderRadius: '6px',
                                backgroundColor: '#eff6ff',
                                color: '#1d4ed8',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                marginRight: '4px',
                              }}
                            >
                              {c.classCode}
                            </span>
                          ))}
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 800, color: '#059669' }}>
                          {stu.attendanceStats?.attendanceRate ?? 100}%
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStudentDetail(stu);
                              setIsStudentDetailOpen(true);
                            }}
                            style={{
                              backgroundColor: '#f8fafc',
                              color: '#0f172a',
                              border: '1px solid #cbd5e1',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Chi tiết
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: ĐIỂM KIỂM TRA ĐỊNH KỲ & ĐÁNH GIÁ NHẬN XÉT ── */}
      {activeTab === 'grades' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                Điểm Kiểm Tra Định Kỳ &amp; Nhận Xét Học Viên
              </h2>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Nhập điểm kiểm tra (Đầu vào, Giữa kỳ, Cuối kỳ) và đánh giá nhận xét chung theo tháng hoặc cuối khóa
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => openNewGradeModal('TEST')}
                style={{
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.55rem 1.1rem',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Nhập Điểm Kiểm Tra Định Kỳ
              </button>
              <button
                type="button"
                onClick={() => openNewGradeModal('EVALUATION')}
                style={{
                  backgroundColor: '#1d4ed8',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.55rem 1.1rem',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Đánh Giá / Nhận Xét Tháng &amp; Khóa
              </button>
            </div>
          </div>

          {/* Filter bar */}
          <div
            className="dash-card"
            style={{
              padding: '0.85rem 1.15rem',
              borderRadius: '14px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {(
                [
                  { id: 'ALL', label: `Tất cả (${grades.length})` },
                  { id: 'TESTS', label: `Điểm kiểm tra định kỳ (${periodicTestCount})` },
                  { id: 'EVALUATIONS', label: `Nhận xét tháng / khóa (${evaluationCount})` },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setGradeCategoryFilter(f.id)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '8px',
                    border: gradeCategoryFilter === f.id ? '2px solid #059669' : '1px solid #cbd5e1',
                    backgroundColor: gradeCategoryFilter === f.id ? '#ecfdf5' : '#ffffff',
                    color: gradeCategoryFilter === f.id ? '#047857' : '#475569',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <select
                value={gradeClassFilterId}
                onChange={(e) => setGradeClassFilterId(e.target.value)}
                style={{
                  padding: '0.45rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                }}
              >
                <option value="">Tất cả lớp</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.classCode}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Tìm học viên, kỳ thi, tháng..."
                value={gradeSearch}
                onChange={(e) => setGradeSearch(e.target.value)}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.82rem',
                  width: '220px',
                }}
              />
            </div>
          </div>

          <div
            className="dash-card"
            style={{
              padding: '0.5rem',
              borderRadius: '16px',
              overflowX: 'auto',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
              <thead>
                <tr
                  style={{
                    borderBottom: '2px solid #e2e8f0',
                    backgroundColor: '#f8fafc',
                    textAlign: 'left',
                    color: '#475569',
                  }}
                >
                  <th style={{ padding: '10px 14px' }}>Học Viên</th>
                  <th style={{ padding: '10px 14px' }}>Loại &amp; Tiêu Đề</th>
                  <th style={{ padding: '10px 14px' }}>Ngày / Kỳ</th>
                  <th style={{ padding: '10px 14px' }}>Điểm / Xếp Loại</th>
                  <th style={{ padding: '10px 14px' }}>Chi Tiết 4 Kỹ Năng</th>
                  <th style={{ padding: '10px 14px' }}>Nhận Xét Giảng Viên</th>
                  <th style={{ padding: '10px 14px' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredGrades.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                      Chưa có bản ghi điểm kiểm tra hoặc đánh giá nhận xét nào.
                    </td>
                  </tr>
                ) : (
                  filteredGrades.map((g) => {
                    const meta = EVALUATION_META[g.evaluationType];
                    return (
                      <tr key={g._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 800, color: '#0f172a' }}>{g.student?.fullName}</div>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              color: '#047857',
                              fontWeight: 700,
                              backgroundColor: '#ecfdf5',
                              border: '1px solid #a7f3d0',
                              padding: '1px 6px',
                              borderRadius: '6px',
                              display: 'inline-block',
                              marginTop: '2px',
                            }}
                          >
                            {g.class?.classCode}
                          </span>
                        </td>

                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{g.title}</div>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              color: meta?.color || '#1d4ed8',
                              backgroundColor: meta?.bg || '#eff6ff',
                              border: `1px solid ${meta?.border || '#bfdbfe'}`,
                              padding: '2px 7px',
                              borderRadius: '6px',
                              display: 'inline-block',
                              marginTop: '3px',
                              fontWeight: 700,
                            }}
                          >
                            {meta?.label || g.evaluationType}
                          </span>
                        </td>

                        <td style={{ padding: '12px 14px', fontSize: '0.8rem', color: '#475569' }}>
                          <div>{new Date(g.testDate).toLocaleDateString('vi-VN')}</div>
                          {g.period && (
                            <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                              {g.period}
                            </div>
                          )}
                        </td>

                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                            {g.overallBand !== undefined && g.overallBand !== null && (
                              <span
                                style={{
                                  backgroundColor: '#ecfdf5',
                                  color: '#047857',
                                  border: '1px solid #a7f3d0',
                                  padding: '3px 9px',
                                  borderRadius: '8px',
                                  fontWeight: 900,
                                  fontSize: '0.84rem',
                                }}
                              >
                                Band {g.overallBand.toFixed(1)}
                              </span>
                            )}
                            {g.rating && RATING_LABELS[g.rating] && (
                              <span
                                style={{
                                  backgroundColor: RATING_LABELS[g.rating].bg,
                                  color: RATING_LABELS[g.rating].color,
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  fontWeight: 700,
                                  fontSize: '0.74rem',
                                }}
                              >
                                {RATING_LABELS[g.rating].label}
                              </span>
                            )}
                            {(g.overallBand === undefined || g.overallBand === null) && !g.rating && (
                              <span style={{ color: '#64748b', fontSize: '0.78rem' }}>Nhận xét</span>
                            )}
                          </div>
                        </td>

                        <td style={{ padding: '12px 14px', fontSize: '0.8rem', color: '#475569' }}>
                          {g.listening !== undefined ||
                          g.reading !== undefined ||
                          g.writing !== undefined ||
                          g.speaking !== undefined ? (
                            <>
                              L: <strong>{g.listening ?? '—'}</strong> | R: <strong>{g.reading ?? '—'}</strong> |
                              W: <strong>{g.writing ?? '—'}</strong> | S: <strong>{g.speaking ?? '—'}</strong>
                            </>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>—</span>
                          )}
                        </td>

                        <td style={{ padding: '12px 14px', fontSize: '0.8rem', color: '#334155', maxWidth: '260px' }}>
                          {g.feedback || '—'}
                        </td>

                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => handleEditGrade(g)}
                              style={{
                                background: '#eff6ff',
                                border: '1px solid #bfdbfe',
                                color: '#1d4ed8',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              Sửa
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteGrade(g._id)}
                              style={{
                                background: '#fef2f2',
                                border: '1px solid #fecaca',
                                color: '#dc2626',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL: NHẬP ĐIỂM ĐỊNH KỲ / ĐÁNH GIÁ NHẬN XÉT ── */}
      {isGradeModalOpen && (
        <div className="dmr-modal-overlay" onClick={() => setIsGradeModalOpen(false)}>
          <div className="dmr-modal-content" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '0.75rem',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1.12rem', fontWeight: 800, color: '#0f172a' }}>
                {editingGradeId
                  ? 'Cập Nhật Kết Quả / Nhận Xét'
                  : gradeModalMode === 'TEST'
                  ? 'Nhập Điểm Kiểm Tra Định Kỳ'
                  : 'Đánh Giá & Nhận Xét Chung (Tháng / Khóa)'}
              </h3>
              <button
                type="button"
                onClick={() => setIsGradeModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {!editingGradeId && (
              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                  backgroundColor: '#f1f5f9',
                  padding: '4px',
                  borderRadius: '8px',
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setGradeModalMode('TEST');
                    setGradeFormType('MID_TERM');
                    setGradeFormTitle('Kiểm tra định kỳ giữa kỳ');
                    setGradeFormOverall('6.5');
                  }}
                  style={{
                    flex: 1,
                    padding: '6px',
                    borderRadius: '6px',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    backgroundColor: gradeModalMode === 'TEST' ? '#ffffff' : 'transparent',
                    color: gradeModalMode === 'TEST' ? '#047857' : '#64748b',
                  }}
                >
                  Điểm kiểm tra định kỳ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGradeModalMode('EVALUATION');
                    setGradeFormType('MONTHLY_EVALUATION');
                    const now = new Date();
                    const monthLabel = `Tháng ${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
                    setGradeFormTitle(`Đánh giá học tập ${monthLabel}`);
                    setGradeFormPeriod(monthLabel);
                    setGradeFormRating('GOOD');
                    setGradeFormOverall('');
                  }}
                  style={{
                    flex: 1,
                    padding: '6px',
                    borderRadius: '6px',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    backgroundColor: gradeModalMode === 'EVALUATION' ? '#ffffff' : 'transparent',
                    color: gradeModalMode === 'EVALUATION' ? '#1d4ed8' : '#64748b',
                  }}
                >
                  Nhận xét tháng / cuối khóa
                </button>
              </div>
            )}

            <form onSubmit={handleSaveAcademicGrade}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                      Lớp học:
                    </label>
                    <select
                      value={gradeFormClassId}
                      onChange={(e) => {
                        const cid = e.target.value;
                        setGradeFormClassId(cid);
                        const list = students.filter((s) => s.classes.some((c) => c._id === cid));
                        if (list.length > 0) setGradeFormStudentId(list[0]._id);
                      }}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      required
                      disabled={!!editingGradeId}
                    >
                      {classes.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.classCode} — {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                      Học viên:
                    </label>
                    <select
                      value={gradeFormStudentId}
                      onChange={(e) => setGradeFormStudentId(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      required
                      disabled={!!editingGradeId}
                    >
                      {studentsForGradeForm.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.fullName} ({s.studentCode})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                      Hình thức:
                    </label>
                    <select
                      value={gradeFormType}
                      onChange={(e) => setGradeFormType(e.target.value as GradeEvaluationType)}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    >
                      {gradeModalMode === 'TEST' ? (
                        <>
                          <option value="ENTRY_TEST">Kiểm tra đầu vào</option>
                          <option value="MID_TERM">Kiểm tra giữa kỳ</option>
                          <option value="FINAL_TEST">Kiểm tra cuối kỳ</option>
                          <option value="MOCK_TEST">Thi thử (Mock Test)</option>
                        </>
                      ) : (
                        <>
                          <option value="MONTHLY_EVALUATION">Nhận xét theo tháng</option>
                          <option value="COURSE_EVALUATION">Đánh giá tổng kết khóa</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                      Ngày thực hiện:
                    </label>
                    <input
                      type="date"
                      value={gradeFormDate}
                      onChange={(e) => setGradeFormDate(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      required
                    />
                  </div>

                  {gradeModalMode === 'EVALUATION' ? (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                        Kỳ đánh giá:
                      </label>
                      <input
                        type="text"
                        placeholder="VD: Tháng 11/2026"
                        value={gradeFormPeriod}
                        onChange={(e) => setGradeFormPeriod(e.target.value)}
                        style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                  ) : (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                        Xếp loại (tùy chọn):
                      </label>
                      <select
                        value={gradeFormRating}
                        onChange={(e) => setGradeFormRating(e.target.value as EvaluationRating | '')}
                        style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      >
                        <option value="">-- Không chọn --</option>
                        <option value="EXCELLENT">Xuất sắc</option>
                        <option value="GOOD">Tốt</option>
                        <option value="SATISFACTORY">Đạt yêu cầu</option>
                        <option value="NEEDS_IMPROVEMENT">Cần cố gắng</option>
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                    Tiêu đề:
                  </label>
                  <input
                    type="text"
                    placeholder={
                      gradeModalMode === 'TEST'
                        ? 'VD: Kiểm tra giữa kỳ IELTS Foundation'
                        : 'VD: Nhận xét quá trình học tập Tháng 11/2026'
                    }
                    value={gradeFormTitle}
                    onChange={(e) => setGradeFormTitle(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    required
                  />
                </div>

                {gradeModalMode === 'EVALUATION' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                        Xếp loại chung:
                      </label>
                      <select
                        value={gradeFormRating}
                        onChange={(e) => setGradeFormRating(e.target.value as EvaluationRating | '')}
                        style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      >
                        <option value="EXCELLENT">Xuất sắc</option>
                        <option value="GOOD">Tốt</option>
                        <option value="SATISFACTORY">Đạt yêu cầu</option>
                        <option value="NEEDS_IMPROVEMENT">Cần cố gắng</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                        Band ước lượng hiện tại (tùy chọn):
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="9.0"
                        placeholder="VD: 6.5 (có thể để trống)"
                        value={gradeFormOverall}
                        onChange={(e) => setGradeFormOverall(e.target.value)}
                        style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.35rem',
                      }}
                    >
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>
                        Điểm thành phần &amp; Overall Band (thang 0.0 - 9.0):
                      </span>
                      <button
                        type="button"
                        onClick={handleCalculateOverall}
                        style={{
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          color: '#047857',
                          backgroundColor: '#ecfdf5',
                          border: '1px solid #a7f3d0',
                          borderRadius: '6px',
                          padding: '3px 8px',
                          cursor: 'pointer',
                        }}
                      >
                        Tự tính Overall từ 4 kỹ năng
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#064e3b' }}>
                          Overall *
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="9.0"
                          value={gradeFormOverall}
                          onChange={(e) => setGradeFormOverall(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.45rem',
                            borderRadius: '6px',
                            border: '2px solid #059669',
                            fontWeight: 800,
                            color: '#064e3b',
                            backgroundColor: '#f0fdf4',
                          }}
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
                          placeholder="—"
                          value={gradeFormL}
                          onChange={(e) => setGradeFormL(e.target.value)}
                          style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Reading</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="9.0"
                          placeholder="—"
                          value={gradeFormR}
                          onChange={(e) => setGradeFormR(e.target.value)}
                          style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Writing</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="9.0"
                          placeholder="—"
                          value={gradeFormW}
                          onChange={(e) => setGradeFormW(e.target.value)}
                          style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Speaking</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="9.0"
                          placeholder="—"
                          value={gradeFormS}
                          onChange={(e) => setGradeFormS(e.target.value)}
                          style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                    {gradeModalMode === 'EVALUATION'
                      ? 'Nhận xét chung (thái độ học tập, tiến bộ, khuyến nghị):'
                      : 'Nhận xét kết quả bài kiểm tra:'}
                  </label>
                  <textarea
                    rows={3}
                    placeholder={
                      gradeModalMode === 'EVALUATION'
                        ? 'Nhận xét mức độ tiếp thu, chuyên cần, điểm mạnh và kỹ năng cần cải thiện trong tháng/khóa...'
                        : 'Đánh giá điểm mạnh và phần cần cải thiện sau bài kiểm tra...'
                    }
                    value={gradeFormFeedback}
                    onChange={(e) => setGradeFormFeedback(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    required={gradeModalMode === 'EVALUATION'}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsGradeModalOpen(false)}
                    style={{
                      padding: '0.55rem 1rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      cursor: 'pointer',
                    }}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingGrade}
                    style={{
                      padding: '0.55rem 1.25rem',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: gradeModalMode === 'EVALUATION' ? '#1d4ed8' : '#059669',
                      color: '#ffffff',
                      fontWeight: 800,
                      cursor: isSavingGrade ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isSavingGrade
                      ? 'Đang lưu...'
                      : editingGradeId
                      ? 'Cập Nhật'
                      : gradeModalMode === 'EVALUATION'
                      ? 'Lưu Nhận Xét'
                      : 'Lưu Điểm Kiểm Tra'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: XIN ĐỔI LỊCH DẠY ── */}
      {isScheduleRequestOpen && (
        <div className="dmr-modal-overlay" onClick={() => setIsScheduleRequestOpen(false)}>
          <div className="dmr-modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '0.75rem',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1.12rem', fontWeight: 800, color: '#0f172a' }}>
                Đơn Xin Đổi Lịch Dạy
              </h3>
              <button
                type="button"
                onClick={() => setIsScheduleRequestOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '1rem',
                backgroundColor: '#f1f5f9',
                padding: '4px',
                borderRadius: '8px',
              }}
            >
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
                  backgroundColor: requestTab === 'submit' ? '#ffffff' : 'transparent',
                  color: requestTab === 'submit' ? '#064e3b' : '#64748b',
                }}
              >
                Gửi Đơn Mới
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
                  backgroundColor: requestTab === 'history' ? '#ffffff' : 'transparent',
                  color: requestTab === 'history' ? '#064e3b' : '#64748b',
                }}
              >
                Lịch Sử ({scheduleRequests.length})
              </button>
            </div>

            {requestTab === 'submit' ? (
              <form onSubmit={handleSubmitScheduleRequest}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                      Lớp cần đổi ca:
                    </label>
                    <select
                      value={reqClassId}
                      onChange={(e) => setReqClassId(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      required
                    >
                      {classes.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.classCode} ({c.name})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                        Lịch hiện tại:
                      </label>
                      <input
                        type="text"
                        value={reqCurrentSched}
                        onChange={(e) => setReqCurrentSched(e.target.value)}
                        style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                        Lịch đề xuất:
                      </label>
                      <input
                        type="text"
                        value={reqTargetSched}
                        onChange={(e) => setReqTargetSched(e.target.value)}
                        style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                      Ngày buổi dạy cần đổi (tùy chọn):
                    </label>
                    <input
                      type="date"
                      value={reqSessionDate}
                      onChange={(e) => setReqSessionDate(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                      Lý do:
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Nêu rõ lý do xin đổi lịch dạy..."
                      value={reqReason}
                      onChange={(e) => setReqReason(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setIsScheduleRequestOpen(false)}
                      style={{ padding: '0.55rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff' }}
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingReq}
                      style={{
                        padding: '0.55rem 1.25rem',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: '#059669',
                        color: '#fff',
                        fontWeight: 700,
                      }}
                    >
                      {isSubmittingReq ? 'Đang gửi...' : 'Gửi Đơn'}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto' }}>
                {scheduleRequests.length > 0 ? (
                  scheduleRequests.map((req) => (
                    <div
                      key={req._id}
                      style={{
                        padding: '0.85rem',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        backgroundColor: '#f8fafc',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>
                          Lớp: {req.currentClass?.classCode}
                        </span>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontWeight: 800,
                            fontSize: '0.72rem',
                            backgroundColor:
                              req.status === 'APPROVED'
                                ? '#dcfce7'
                                : req.status === 'PENDING'
                                ? '#fef3c7'
                                : '#fee2e2',
                            color:
                              req.status === 'APPROVED'
                                ? '#166534'
                                : req.status === 'PENDING'
                                ? '#b45309'
                                : '#991b1b',
                          }}
                        >
                          {req.status === 'APPROVED'
                            ? 'ĐÃ DUYỆT'
                            : req.status === 'PENDING'
                            ? 'CHỜ DUYỆT'
                            : 'TỪ CHỐI'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '4px' }}>
                        {req.currentSchedule} ➔ {req.targetSchedule}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px' }}>
                        Lý do: {req.reason}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    Chưa có yêu cầu đổi lịch nào.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL: CHI TIẾT HỌC VIÊN ── */}
      {isStudentDetailOpen && selectedStudentDetail && (
        <div className="dmr-modal-overlay" onClick={() => setIsStudentDetailOpen(false)}>
          <div className="dmr-modal-content" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '0.75rem',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                  {selectedStudentDetail.fullName}
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#047857', fontWeight: 700 }}>
                  Mã HV: {selectedStudentDetail.studentCode}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsStudentDetailOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.75rem', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>EMAIL</div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700 }}>{selectedStudentDetail.email}</div>
                </div>
                <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.75rem', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>ĐIỆN THOẠI</div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700 }}>{selectedStudentDetail.phone || '—'}</div>
                </div>
                <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: '0.75rem', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#1d4ed8', fontWeight: 700 }}>BAND HIỆN TẠI</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#2563eb' }}>
                    Band {selectedStudentDetail.currentBand}
                  </div>
                </div>
                <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', padding: '0.75rem', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#b45309', fontWeight: 700 }}>MỤC TIÊU</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#d97706' }}>
                    Band {selectedStudentDetail.targetBand}
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#166534' }}>
                  Chuyên cần: {selectedStudentDetail.attendanceStats?.attendanceRate ?? 100}% (
                  {selectedStudentDetail.attendanceStats?.present ?? 0}/
                  {selectedStudentDetail.attendanceStats?.total ?? 0} buổi)
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsStudentDetailOpen(false)}
                  style={{
                    padding: '0.5rem 1.25rem',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
