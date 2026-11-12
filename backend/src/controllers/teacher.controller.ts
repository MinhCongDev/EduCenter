import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import {
  Class,
  Course,
  Enrollment,
  User,
  Student,
  ClassSchedule,
  Attendance,
  ChangeRequest,
  Grade,
} from '../models';
import { ClassTeacher } from '../models/classTeacher.model';

const EVALUATION_TYPES = [
  'ENTRY_TEST',
  'MID_TERM',
  'FINAL_TEST',
  'MONTHLY_EVALUATION',
  'COURSE_EVALUATION',
  'MOCK_TEST',
  'ASSIGNMENT',
  'SPEAKING_ASSESSMENT',
  'WRITING_ASSESSMENT',
] as const;

const GENERAL_EVALUATION_TYPES = new Set(['MONTHLY_EVALUATION', 'COURSE_EVALUATION']);

/**
 * Normalize a YYYY-MM-DD string or Date into UTC day start/end bounds
 */
const getDayBounds = (value?: string | Date): { date: Date; start: Date; end: Date } => {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    const clean = value.trim();
    const start = new Date(`${clean}T00:00:00.000Z`);
    const end = new Date(`${clean}T23:59:59.999Z`);
    return { date: start, start, end };
  }
  const base = value ? new Date(value) : new Date();
  const isoDay = base.toISOString().slice(0, 10);
  const start = new Date(`${isoDay}T00:00:00.000Z`);
  const end = new Date(`${isoDay}T23:59:59.999Z`);
  return { date: start, start, end };
};

/**
 * Helper to get classes assigned to teacher (primary or co-teacher)
 */
const getTeacherClassIds = async (teacherUserId: any) => {
  const coTeachings = await ClassTeacher.find({ teacher: teacherUserId, status: 'ACTIVE' })
    .select('class')
    .lean();
  const coClassIds = coTeachings.map((ct) => ct.class);

  let classes = await Class.find({
    $or: [{ teacher: teacherUserId }, ...(coClassIds.length ? [{ _id: { $in: coClassIds } }] : [])],
  });

  if (classes.length === 0) {
    // Fallback for demo teacher accounts without explicit class assignments
    const available = await Class.find({});
    if (available.length > 0) {
      await Class.updateMany(
        { _id: { $in: available.slice(0, 3).map((c) => c._id) } },
        { teacher: teacherUserId }
      );
      classes = await Class.find({ teacher: teacherUserId });
    }
  }
  return classes;
};

/**
 * 1. View Assigned Classes (Class Management)
 * GET /api/teacher/classes
 */
export const getAssignedClasses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user?._id;
    const classes = await getTeacherClassIds(teacherId);

    const classList = await Promise.all(
      classes.map(async (cls) => {
        const [course, studentCount, schedules] = await Promise.all([
          Course.findById(cls.course).select('title code tuitionFee targetLevel bannerUrl sessions'),
          Enrollment.countDocuments({ class: cls._id, status: 'ENROLLED' }),
          ClassSchedule.find({ class: cls._id, status: 'ACTIVE' }).sort({ sessionDate: 1, startTime: 1 }),
        ]);

        return {
          _id: cls._id,
          classCode: cls.classCode,
          name: cls.name || `${course?.title || 'IELTS'} - ${cls.classCode}`,
          room: cls.room,
          scheduleDays: cls.scheduleDays,
          timeSlot: cls.timeSlot,
          startDate: cls.startDate,
          endDate: cls.endDate,
          capacity: cls.capacity,
          currentEnrollment: studentCount || cls.currentEnrollment || 0,
          status: cls.status,
          course: course || null,
          schedules: schedules.map((s) => ({
            _id: s._id,
            sessionDate: s.sessionDate,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            classroom: s.classroom,
            topic: s.topic,
          })),
        };
      })
    );

    res.status(200).json({
      success: true,
      data: { classes: classList },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Lỗi khi tải danh sách lớp học phụ trách',
    });
  }
};

/**
 * 1b. Get Single Assigned Class Detail
 * GET /api/teacher/classes/:classId
 */
export const getClassDetail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { classId } = req.params;
    const cls = await Class.findById(classId).populate('course teacher');
    if (!cls) {
      res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' });
      return;
    }

    const [enrollments, schedules] = await Promise.all([
      Enrollment.find({ class: classId, status: 'ENROLLED' }).populate('student'),
      ClassSchedule.find({ class: classId, status: 'ACTIVE' }).sort({ sessionDate: 1, startTime: 1 }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        class: cls,
        students: enrollments.map((e) => e.student),
        schedules,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Lỗi khi tải chi tiết lớp học' });
  }
};

/**
 * 2. View Student List (Student Management)
 * GET /api/teacher/students
 */
export const getStudentList = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user?._id;
    const { classId, search } = req.query;

    const teacherClasses = await getTeacherClassIds(teacherId);
    let targetClassIds = teacherClasses.map((c) => c._id);

    if (classId && typeof classId === 'string') {
      targetClassIds = targetClassIds.filter((id) => id.toString() === classId);
    }

    const enrollments = await Enrollment.find({
      class: { $in: targetClassIds },
      status: 'ENROLLED',
    }).populate('student class');

    const studentMap = new Map<string, any>();

    for (const enr of enrollments) {
      const studentUser = enr.student as any;
      if (!studentUser) continue;

      const studentId = studentUser._id.toString();
      if (!studentMap.has(studentId)) {
        const [studentProfile, totalSessions, presentSessions, latestGrade] = await Promise.all([
          Student.findOne({ user: studentUser._id }),
          Attendance.countDocuments({
            student: studentUser._id,
            class: { $in: targetClassIds },
          }),
          Attendance.countDocuments({
            student: studentUser._id,
            class: { $in: targetClassIds },
            status: { $in: ['PRESENT', 'LATE'] },
          }),
          Grade.findOne({
            student: studentUser._id,
            class: { $in: targetClassIds },
          }).sort({ testDate: -1 }),
        ]);

        studentMap.set(studentId, {
          _id: studentUser._id,
          fullName: studentUser.fullName,
          email: studentUser.email,
          phone: studentUser.phone || '0988 123 456',
          avatarUrl: studentUser.avatarUrl || '',
          studentCode:
            studentProfile?.studentCode || `STU-${studentUser._id.toString().slice(-4).toUpperCase()}`,
          currentBand: studentProfile?.currentBand ?? 5.5,
          targetBand: studentProfile?.targetBand ?? 7.0,
          learningGoal: studentProfile?.learningGoal || 'Du học & Xét tuyển ĐH',
          emergencyContact: studentProfile?.emergencyContact || {
            name: 'Phụ huynh',
            phone: studentUser.phone || '',
            relationship: 'Bố/Mẹ',
          },
          classes: [],
          attendanceStats: {
            total: totalSessions,
            present: presentSessions,
            attendanceRate: totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 100,
          },
          latestGrade: latestGrade
            ? {
                title: latestGrade.title,
                overallBand: latestGrade.overallBand,
                evaluationType: latestGrade.evaluationType,
                testDate: latestGrade.testDate,
              }
            : null,
        });
      }

      const current = studentMap.get(studentId);
      if (enr.class) {
        const cls = enr.class as any;
        current.classes.push({
          _id: cls._id,
          classCode: cls.classCode,
          name: cls.name,
        });
      }
    }

    let result = Array.from(studentMap.values());

    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.fullName.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.studentCode.toLowerCase().includes(q)
      );
    }

    res.status(200).json({
      success: true,
      data: { students: result },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Lỗi khi tải danh sách học viên',
    });
  }
};

/**
 * 2b. View Student Detail
 * GET /api/teacher/students/:studentId
 */
export const getStudentDetail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const teacherId = req.user?._id;

    const studentUser = await User.findById(studentId).select('-password');
    if (!studentUser) {
      res.status(404).json({ success: false, message: 'Không tìm thấy học viên' });
      return;
    }

    const teacherClasses = await getTeacherClassIds(teacherId);
    const classIds = teacherClasses.map((c) => c._id);

    const [studentProfile, enrollments, grades, attendanceRecords] = await Promise.all([
      Student.findOne({ user: studentId }),
      Enrollment.find({ student: studentId, class: { $in: classIds } }).populate('class course'),
      Grade.find({ student: studentId, class: { $in: classIds } }).sort({ testDate: -1 }),
      Attendance.find({ student: studentId, class: { $in: classIds } })
        .populate('class', 'classCode name')
        .sort({ sessionDate: -1 }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        student: {
          _id: studentUser._id,
          fullName: studentUser.fullName,
          email: studentUser.email,
          phone: studentUser.phone,
          address: studentUser.address,
          avatarUrl: studentUser.avatarUrl,
          studentCode:
            studentProfile?.studentCode || `STU-${studentUser._id.toString().slice(-4).toUpperCase()}`,
          currentBand: studentProfile?.currentBand ?? 5.5,
          targetBand: studentProfile?.targetBand ?? 7.0,
          learningGoal: studentProfile?.learningGoal || 'Du học & Định cư',
          emergencyContact: studentProfile?.emergencyContact || null,
        },
        enrollments,
        grades,
        attendance: attendanceRecords,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Lỗi khi tải chi tiết học viên',
    });
  }
};

/**
 * 3. View Teaching Schedule (Timetable)
 * GET /api/teacher/schedule
 */
export const getTeachingSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user?._id;
    const { classId } = req.query;
    const classes = await getTeacherClassIds(teacherId);

    let targetClasses = classes.filter((c) => c.status !== 'CANCELLED');
    if (classId && typeof classId === 'string') {
      targetClasses = targetClasses.filter((c) => c._id.toString() === classId);
    }

    const classIds = targetClasses.map((c) => c._id);

    const dbSchedules = await ClassSchedule.find({
      class: { $in: classIds },
      status: 'ACTIVE',
    })
      .populate({
        path: 'class',
        select: 'classCode name room timeSlot capacity currentEnrollment startDate endDate status course',
        populate: { path: 'course', select: 'code title' },
      })
      .sort({ sessionDate: 1, startTime: 1 })
      .lean();

    // Fallback for any assigned class that doesn't yet have ClassSchedule rows
    const classesWithSchedules = new Set(dbSchedules.map((s: any) => s.class?._id?.toString()).filter(Boolean));
    const fallbackSchedules: any[] = [];

    for (const cls of targetClasses) {
      if (classesWithSchedules.has(cls._id.toString())) continue;
      const [startTime = '18:30', endTime = '20:30'] = (cls.timeSlot || '').split('-').map((t) => t.trim());
      const populatedCourse = await Course.findById(cls.course).select('code title').lean();
      for (const day of cls.scheduleDays || []) {
        fallbackSchedules.push({
          _id: `${cls._id}-${day}`,
          class: {
            _id: cls._id,
            classCode: cls.classCode,
            name: cls.name,
            room: cls.room,
            timeSlot: cls.timeSlot,
            capacity: cls.capacity,
            currentEnrollment: cls.currentEnrollment,
            startDate: cls.startDate,
            endDate: cls.endDate,
            status: cls.status,
            course: populatedCourse,
          },
          dayOfWeek: day,
          startTime,
          endTime,
          classroom: cls.room,
          topic: '',
          status: 'ACTIVE',
        });
      }
    }

    res.status(200).json({
      success: true,
      data: { schedules: [...dbSchedules, ...fallbackSchedules] },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Lỗi khi tải lịch dạy của giảng viên',
    });
  }
};

/**
 * 4. View Periodic Grades & General Evaluations (Monthly / Course)
 * GET /api/teacher/grades
 */
export const getStudentAcademicResults = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user?._id;
    const { classId, studentId, evaluationType, category } = req.query;

    const classes = await getTeacherClassIds(teacherId);
    let classIds = classes.map((c) => c._id);

    if (classId && typeof classId === 'string') {
      classIds = classIds.filter((id) => id.toString() === classId);
    }

    const query: any = { class: { $in: classIds } };

    if (studentId && typeof studentId === 'string') {
      query.student = studentId;
    }
    if (evaluationType && typeof evaluationType === 'string') {
      query.evaluationType = evaluationType;
    } else if (category === 'TESTS') {
      query.evaluationType = { $in: ['ENTRY_TEST', 'MID_TERM', 'FINAL_TEST', 'MOCK_TEST'] };
    } else if (category === 'EVALUATIONS') {
      query.evaluationType = { $in: ['MONTHLY_EVALUATION', 'COURSE_EVALUATION'] };
    }

    const grades = await Grade.find(query)
      .populate('student', 'fullName email phone')
      .populate('class', 'classCode name')
      .sort({ testDate: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { grades },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Lỗi khi tải bảng điểm và nhận xét học viên',
    });
  }
};

/**
 * 4b. Enter Periodic Test Score (Entry/Mid-term/Final) or General Evaluation (Monthly/Course)
 * POST /api/teacher/grades
 */
export const createOrEnterGrade = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user?._id;
    const {
      studentId,
      classId,
      evaluationType = 'MID_TERM',
      title,
      period,
      rating,
      testDate,
      overallBand,
      listening,
      reading,
      writing,
      speaking,
      feedback,
    } = req.body;

    if (!studentId || !classId || !title || !String(title).trim()) {
      res.status(400).json({
        success: false,
        message: 'Học viên, lớp học và tiêu đề đánh giá là bắt buộc',
      });
      return;
    }

    if (!EVALUATION_TYPES.includes(evaluationType)) {
      res.status(400).json({
        success: false,
        message: 'Loại kiểm tra / đánh giá không hợp lệ',
      });
      return;
    }

    const isGeneralEval = GENERAL_EVALUATION_TYPES.has(evaluationType);
    const hasOverall = overallBand !== undefined && overallBand !== null && overallBand !== '';

    if (!isGeneralEval && !hasOverall) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng nhập điểm Overall Band cho bài kiểm tra định kỳ',
      });
      return;
    }

    if (isGeneralEval && (!feedback || !String(feedback).trim()) && !rating && !hasOverall) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng nhập nội dung nhận xét hoặc xếp loại đánh giá cho học viên',
      });
      return;
    }

    const grade = await Grade.create({
      student: studentId,
      class: classId,
      teacher: teacherId,
      evaluationType,
      title: String(title).trim(),
      period: period ? String(period).trim() : '',
      ...(rating ? { rating } : {}),
      testDate: testDate ? new Date(testDate) : new Date(),
      ...(hasOverall ? { overallBand: Number(overallBand) } : {}),
      listening: listening !== undefined && listening !== '' ? Number(listening) : undefined,
      reading: reading !== undefined && reading !== '' ? Number(reading) : undefined,
      writing: writing !== undefined && writing !== '' ? Number(writing) : undefined,
      speaking: speaking !== undefined && speaking !== '' ? Number(speaking) : undefined,
      feedback: feedback ? String(feedback).trim() : '',
      status: 'PUBLISHED',
    });

    const populated = await Grade.findById(grade._id)
      .populate('student', 'fullName email')
      .populate('class', 'classCode name');

    res.status(201).json({
      success: true,
      message: isGeneralEval
        ? 'Đã lưu đánh giá / nhận xét học viên thành công!'
        : 'Đã nhập điểm kiểm tra định kỳ thành công!',
      data: { grade: populated },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Lỗi khi lưu điểm / nhận xét học viên',
    });
  }
};

/**
 * 4c. Update Periodic Grade or General Evaluation
 * PUT /api/teacher/grades/:gradeId
 */
export const updateGrade = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { gradeId } = req.params;
    const {
      overallBand,
      listening,
      reading,
      writing,
      speaking,
      feedback,
      title,
      period,
      rating,
      testDate,
      evaluationType,
    } = req.body;

    if (evaluationType && !EVALUATION_TYPES.includes(evaluationType)) {
      res.status(400).json({
        success: false,
        message: 'Loại kiểm tra / đánh giá không hợp lệ',
      });
      return;
    }

    const updatePayload: Record<string, any> = {};
    const unsetPayload: Record<string, 1> = {};

    if (title !== undefined) updatePayload.title = String(title).trim();
    if (period !== undefined) updatePayload.period = String(period).trim();
    if (rating !== undefined) {
      if (rating === '' || rating === null) unsetPayload.rating = 1;
      else updatePayload.rating = rating;
    }
    if (testDate) updatePayload.testDate = new Date(testDate);
    if (evaluationType) updatePayload.evaluationType = evaluationType;
    if (feedback !== undefined) updatePayload.feedback = String(feedback).trim();

    const assignScore = (key: string, val: unknown) => {
      if (val === undefined) return;
      if (val === '' || val === null) unsetPayload[key] = 1;
      else updatePayload[key] = Number(val);
    };

    assignScore('overallBand', overallBand);
    assignScore('listening', listening);
    assignScore('reading', reading);
    assignScore('writing', writing);
    assignScore('speaking', speaking);

    const mongoUpdate: Record<string, any> = {};
    if (Object.keys(updatePayload).length > 0) mongoUpdate.$set = updatePayload;
    if (Object.keys(unsetPayload).length > 0) mongoUpdate.$unset = unsetPayload;

    const grade = await Grade.findByIdAndUpdate(gradeId, mongoUpdate, { new: true, runValidators: true })
      .populate('student', 'fullName email')
      .populate('class', 'classCode name');

    if (!grade) {
      res.status(404).json({ success: false, message: 'Không tìm thấy bản ghi điểm/đánh giá' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật điểm / nhận xét thành công!',
      data: { grade },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Lỗi khi cập nhật điểm / nhận xét',
    });
  }
};

/**
 * 4d. Delete a Grade / Evaluation
 * DELETE /api/teacher/grades/:gradeId
 */
export const deleteGrade = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { gradeId } = req.params;
    const deleted = await Grade.findByIdAndDelete(gradeId);
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Không tìm thấy bản ghi điểm/đánh giá' });
      return;
    }
    res.status(200).json({ success: true, message: 'Đã xóa bản ghi điểm / nhận xét' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Lỗi khi xóa điểm / nhận xét' });
  }
};

/**
 * 5. Submit Schedule Change Request
 * POST /api/teacher/schedule-requests
 */
export const submitScheduleChangeRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user?._id;
    const { currentClassId, currentSchedule, targetSchedule, sessionDate, targetDate, reason } = req.body;

    if (!currentClassId || !reason) {
      res.status(400).json({
        success: false,
        message: 'Lớp học và lý do đổi lịch ca dạy là bắt buộc',
      });
      return;
    }

    const request = await ChangeRequest.create({
      teacher: teacherId,
      requesterRole: 'TEACHER',
      requestType: 'TEACHER_SCHEDULE_CHANGE',
      currentClass: currentClassId,
      currentSchedule: currentSchedule || '',
      targetSchedule: targetSchedule || '',
      sessionDate: sessionDate ? new Date(sessionDate) : undefined,
      targetDate: targetDate ? new Date(targetDate) : undefined,
      reason: reason.trim(),
      status: 'PENDING',
    });

    const populated = await ChangeRequest.findById(request._id).populate('currentClass', 'classCode name');

    res.status(201).json({
      success: true,
      message: 'Đã gửi yêu cầu đổi lịch ca dạy tới Ban Quản lý / Giáo vụ thành công!',
      data: { request: populated },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Lỗi khi gửi yêu cầu đổi lịch dạy',
    });
  }
};

/**
 * 5b. Track Change Requests
 * GET /api/teacher/schedule-requests
 */
export const getScheduleChangeRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user?._id;
    const requests = await ChangeRequest.find({
      $or: [{ teacher: teacherId }, { requesterRole: 'TEACHER' }],
    })
      .populate('currentClass', 'classCode name room')
      .populate('reviewedBy', 'fullName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { requests },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Lỗi khi tải lịch sử yêu cầu đổi lịch',
    });
  }
};

/**
 * 6. View Attendance (Session Records & History)
 * GET /api/teacher/attendance
 */
export const getAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user?._id;
    const { classId, sessionDate, classScheduleId } = req.query;

    const classes = await getTeacherClassIds(teacherId);
    let classIds = classes.map((c) => c._id);

    if (classId && typeof classId === 'string') {
      classIds = classIds.filter((id) => id.toString() === classId);
    }

    const query: any = { class: { $in: classIds } };

    if (classScheduleId && typeof classScheduleId === 'string') {
      query.classSchedule = classScheduleId;
    } else if (sessionDate && typeof sessionDate === 'string') {
      const { start, end } = getDayBounds(sessionDate);
      query.sessionDate = { $gte: start, $lte: end };
    }

    const records = await Attendance.find(query)
      .populate('student', 'fullName email')
      .populate('class', 'classCode name')
      .sort({ sessionDate: -1, updatedAt: -1 });

    res.status(200).json({
      success: true,
      data: { records },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Lỗi khi tải dữ liệu điểm danh',
    });
  }
};

/**
 * 6b. Check Attendance / Save Attendance for a Class Session
 * POST /api/teacher/attendance
 */
export const checkAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user?._id;
    const { classId, sessionDate, classScheduleId, records } = req.body;

    if (!classId || !records || !Array.isArray(records) || records.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Lớp học và danh sách điểm danh là bắt buộc',
      });
      return;
    }

    const validStatuses = new Set(['PRESENT', 'LATE', 'ABSENT', 'EXCUSED']);
    for (const rec of records) {
      if (!rec.studentId || !validStatuses.has(rec.status)) {
        res.status(400).json({
          success: false,
          message: 'Dữ liệu trạng thái điểm danh của học viên không hợp lệ',
        });
        return;
      }
    }

    const { date, start, end } = getDayBounds(sessionDate);

    const results = await Promise.all(
      records.map(
        async (rec: {
          studentId: string;
          status: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED';
          notes?: string;
        }) => {
          return Attendance.findOneAndUpdate(
            {
              class: classId,
              student: rec.studentId,
              sessionDate: { $gte: start, $lte: end },
            },
            {
              class: classId,
              ...(classScheduleId ? { classSchedule: classScheduleId } : {}),
              student: rec.studentId,
              sessionDate: date,
              status: rec.status,
              notes: rec.notes || '',
              recordedBy: teacherId,
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
        }
      )
    );

    res.status(200).json({
      success: true,
      message: `Đã lưu điểm danh thành công cho ${results.length} học viên!`,
      data: { count: results.length, records: results },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Lỗi khi lưu điểm danh buổi học',
    });
  }
};
