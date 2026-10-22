import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';

import {
  Course,
  Class,
  User,
  Student,
  Teacher,
  Enrollment,
  ClassSchedule,
  Payment,
  ChangeRequest,
  Assignment,
  Submission,
  Notification,
} from '../models';

/**
 * UC39: Manage Courses and Training Programs - Get All Courses
 * GET /api/staff/courses
 */
export const getCourses = async (_req: Request, res: Response): Promise<void> => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: courses,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy danh sách khóa học',
    });
  }
};

/**
 * UC39: Manage Courses - Create Course
 * POST /api/staff/courses
 */
export const createCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      code,
      title,
      description,
      category,
      entryLevel,
      targetLevel,
      durationWeeks,
      sessions,
      tuitionFee,
      format,
      learningObjectives,
      syllabus,
      bannerUrl,
    } = req.body;

    if (!code || !title || !tuitionFee) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp mã khóa học, tên khóa học và học phí',
      });
      return;
    }

    const course = await Course.create({
      code: code.trim().toUpperCase(),
      title: title.trim(),
      description: description || '',
      category: category || 'IELTS',
      entryLevel: entryLevel || '0.0',
      targetLevel: targetLevel || '6.5',
      durationWeeks: Number(durationWeeks) || 10,
      sessions: Number(sessions) || 30,
      tuitionFee: Number(tuitionFee),
      format: format || 'BLENDED',
      learningObjectives: learningObjectives || [],
      syllabus: syllabus || [],
      bannerUrl: bannerUrl || '',
      status: 'ACTIVE',
    });

    res.status(201).json({
      success: true,
      message: 'Tạo khóa học thành công!',
      data: course,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi tạo khóa học',
    });
  }
};

/**
 * UC39: Manage Courses - Update Course
 * PUT /api/staff/courses/:id
 */
export const updateCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const course = await Course.findByIdAndUpdate(id, updateData, { new: true });
    if (!course) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy khóa học',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật khóa học thành công!',
      data: course,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi cập nhật khóa học',
    });
  }
};

/**
 * UC40: Manage Student Accounts
 * GET /api/staff/students
 */
export const getStudents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search } = req.query;
    let query: any = { role: 'STUDENT' };

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const students = await User.find(query).sort({ createdAt: -1 });
    const userIds = students.map((s) => s._id);

    const profiles = await Student.find({ user: { $in: userIds } });
    const profileMap = new Map();
    profiles.forEach((p) => profileMap.set(p.user.toString(), p));

    const enrollments = await Enrollment.find({ student: { $in: userIds } }).populate('class course');

    const result = students.map((s) => {
      const p = profileMap.get(s._id.toString());
      const userEnrollments = enrollments.filter((e) => e.student.toString() === s._id.toString());
      return {
        _id: s._id,
        fullName: s.fullName,
        email: s.email,
        phone: s.phone,
        address: s.address,
        status: s.status,
        createdAt: s.createdAt,
        studentCode: p?.studentCode || `STU-${s._id.toString().slice(-4)}`,
        currentBand: p?.currentBand,
        targetBand: p?.targetBand,
        learningGoal: p?.learningGoal,
        enrollmentsCount: userEnrollments.length,
        classes: userEnrollments.map((e) => (e.class as any)?.name || (e.course as any)?.title).filter(Boolean),
      };
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy danh sách tài khoản học viên',
    });
  }
};

/**
 * UC40: Manage Student Accounts - Update Status
 * PUT /api/staff/students/:id
 */
export const updateStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, targetBand, currentBand, learningGoal } = req.body;

    if (status) {
      await User.findByIdAndUpdate(id, { status });
    }

    if (targetBand !== undefined || currentBand !== undefined || learningGoal !== undefined) {
      await Student.findOneAndUpdate(
        { user: id },
        {
          ...(targetBand !== undefined && { targetBand }),
          ...(currentBand !== undefined && { currentBand }),
          ...(learningGoal !== undefined && { learningGoal }),
        },
        { upsert: true }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật tài khoản học viên thành công!',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi cập nhật tài khoản học viên',
    });
  }
};

/**
 * UC41: Manage Teacher Accounts
 * GET /api/staff/teachers
 */
export const getTeachers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const teachers = await User.find({ role: 'TEACHER' }).sort({ createdAt: -1 });
    const userIds = teachers.map((t) => t._id);

    const profiles = await Teacher.find({ user: { $in: userIds } });
    const profileMap = new Map();
    profiles.forEach((p) => profileMap.set(p.user.toString(), p));

    // Get active classes for each teacher
    const classes = await Class.find({ teacher: { $in: userIds } });

    const result = teachers.map((t) => {
      const p = profileMap.get(t._id.toString());
      const teacherClasses = classes.filter((c) => c.teacher?.toString() === t._id.toString());
      return {
        _id: t._id,
        fullName: t.fullName,
        email: t.email,
        phone: t.phone,
        status: t.status,
        avatarUrl: t.avatarUrl,
        teacherCode: p?.teacherCode || `TCH-${t._id.toString().slice(-4)}`,
        specialization: p?.specialization || [],
        bio: p?.bio || '',
        ieltsBand: p?.ieltsBand || 8.5,
        yearsOfExperience: p?.yearsOfExperience || 5,
        activeClassesCount: teacherClasses.length,
        classes: teacherClasses.map((c) => c.name || c.classCode),
      };
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy danh sách giảng viên',
    });
  }
};

/**
 * UC41: Manage Teacher Accounts - Update Teacher
 * PUT /api/staff/teachers/:id
 */
export const updateTeacher = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, bio, specialization, ieltsBand, yearsOfExperience } = req.body;

    if (status) {
      await User.findByIdAndUpdate(id, { status });
    }

    if (bio || specialization || ieltsBand || yearsOfExperience) {
      await Teacher.findOneAndUpdate(
        { user: id },
        {
          ...(bio && { bio }),
          ...(specialization && { specialization }),
          ...(ieltsBand && { ieltsBand }),
          ...(yearsOfExperience && { yearsOfExperience }),
        },
        { upsert: true }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật hồ sơ giảng viên thành công!',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi cập nhật giảng viên',
    });
  }
};

/**
 * UC42: Manage Classes - Get All Classes
 * GET /api/staff/classes
 */
export const getClasses = async (_req: Request, res: Response): Promise<void> => {
  try {
    const classes = await Class.find()
      .populate('course')
      .populate('teacher', 'fullName email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: classes,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy danh sách lớp học',
    });
  }
};

/**
 * UC42: Manage Classes - Create Class
 * POST /api/staff/classes
 */
export const createClass = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      classCode,
      name,
      courseId,
      teacherId,
      room,
      scheduleDays,
      timeSlot,
      startDate,
      endDate,
      capacity,
    } = req.body;

    if (!classCode || !courseId || !startDate) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp mã lớp, khóa học và ngày khai giảng',
      });
      return;
    }

    const newClass = await Class.create({
      classCode: classCode.trim().toUpperCase(),
      name: name?.trim() || `Lớp ${classCode}`,
      course: courseId,
      teacher: teacherId || undefined,
      room: room || 'Phòng học EduCenter',
      scheduleDays: scheduleDays || ['Thứ 2', 'Thứ 4', 'Thứ 6'],
      timeSlot: timeSlot || '18:30 - 20:30',
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      capacity: Number(capacity) || 20,
      currentEnrollment: 0,
      status: 'OPEN',
    });

    res.status(201).json({
      success: true,
      message: 'Tạo lớp học mới thành công!',
      data: newClass,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi tạo lớp học mới',
    });
  }
};

/**
 * UC42: Manage Classes - Update Class
 * PUT /api/staff/classes/:id
 */
export const updateClass = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedClass = await Class.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedClass) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy lớp học',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin lớp học thành công!',
      data: updatedClass,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi cập nhật lớp học',
    });
  }
};

/**
 * UC43: Assign Students to Classes
 * POST /api/staff/classes/:classId/assign-student
 */
export const assignStudentToClass = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { classId } = req.params;
    const { studentId } = req.body;

    if (!studentId) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng chọn học viên cần xếp vào lớp',
      });
      return;
    }

    const targetClass = await Class.findById(classId);
    if (!targetClass) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy lớp học',
      });
      return;
    }

    // Check if already enrolled in this class
    const existingEnrollment = await Enrollment.findOne({ student: studentId, class: classId });
    if (existingEnrollment) {
      res.status(400).json({
        success: false,
        message: 'Học viên đã được xếp vào lớp này rồi!',
      });
      return;
    }

    const enrollment = await Enrollment.create({
      student: studentId,
      class: classId,
      course: targetClass.course,
      registrationDate: new Date(),
      enrollmentDate: new Date(),
      status: 'ENROLLED',
      tuitionStatus: 'PAID',
    });

    // Increment currentEnrollment
    targetClass.currentEnrollment = (targetClass.currentEnrollment || 0) + 1;
    await targetClass.save();

    res.status(200).json({
      success: true,
      message: 'Xếp học viên vào lớp thành công!',
      data: enrollment,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi xếp học viên vào lớp',
    });
  }
};

/**
 * UC44: Assign Teachers to Classes
 * POST /api/staff/classes/:classId/assign-teacher
 */
export const assignTeacherToClass = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { classId } = req.params;
    const { teacherId } = req.body;

    if (!teacherId) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng chọn giảng viên cần phân công',
      });
      return;
    }

    const updatedClass = await Class.findByIdAndUpdate(
      classId,
      { teacher: teacherId },
      { new: true }
    ).populate('teacher course');

    if (!updatedClass) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy lớp học',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Phân công giảng viên giảng dạy lớp học thành công!',
      data: updatedClass,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi phân công giảng viên',
    });
  }
};

/**
 * UC45: Manage Class Schedules
 * GET /api/staff/schedules
 */
export const getClassSchedules = async (_req: Request, res: Response): Promise<void> => {
  try {
    const schedules = await ClassSchedule.find()
      .populate({ path: 'class', populate: [{ path: 'course' }, { path: 'teacher' }] })
      .sort({ dayOfWeek: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      data: schedules,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy danh sách thời khóa biểu',
    });
  }
};

/**
 * UC45: Create Class Schedule
 * POST /api/staff/schedules
 */
export const createClassSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { classId, dayOfWeek, startTime, endTime, classroom, topic } = req.body;

    if (!classId || !dayOfWeek || !startTime || !endTime) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ lớp học, thứ trong tuần, giờ bắt đầu và kết thúc',
      });
      return;
    }

    const schedule = await ClassSchedule.create({
      class: classId,
      dayOfWeek,
      startTime,
      endTime,
      classroom: classroom || 'Phòng học tiêu chuẩn',
      topic: topic || 'Buổi học định kỳ',
      status: 'ACTIVE',
    });

    res.status(201).json({
      success: true,
      message: 'Tạo buổi học thành công!',
      data: schedule,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi tạo lịch học',
    });
  }
};

/**
 * UC46: Track Registrations
 * GET /api/staff/registrations
 */
export const getRegistrations = async (_req: Request, res: Response): Promise<void> => {
  try {
    const enrollments = await Enrollment.find()
      .populate('student', 'fullName email phone address')
      .populate('course')
      .populate({ path: 'class', populate: { path: 'teacher' } })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: enrollments,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi theo dõi danh sách ghi danh',
    });
  }
};

/**
 * UC47: Track Payments
 * GET /api/staff/payments
 */
export const getPayments = async (_req: Request, res: Response): Promise<void> => {
  try {
    const payments = await Payment.find()
      .populate('student', 'fullName email phone')
      .populate('course', 'title code tuitionFee')
      .populate({ path: 'enrollment', populate: { path: 'class' } })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: payments,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi theo dõi các giao dịch học phí',
    });
  }
};

/**
 * UC47: Confirm / Update Payment Status
 * PUT /api/staff/payments/:id/confirm
 */
export const confirmPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const payment = await Payment.findByIdAndUpdate(
      id,
      { status: status || 'SUCCESS' },
      { new: true }
    );

    if (!payment) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy giao dịch',
      });
      return;
    }

    if (payment.enrollment && payment.status === 'SUCCESS') {
      await Enrollment.findByIdAndUpdate(payment.enrollment, {
        tuitionStatus: 'PAID',
        status: 'ENROLLED',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái giao dịch học phí thành công!',
      data: payment,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi cập nhật giao dịch',
    });
  }
};

/**
 * UC48: Process Class Change Requests & UC49: Process Schedule Change Requests
 * GET /api/staff/change-requests
 */
export const getChangeRequests = async (_req: Request, res: Response): Promise<void> => {
  try {
    const requests = await ChangeRequest.find()
      .populate('student', 'fullName email phone role')
      .populate('currentClass', 'name classCode room')
      .populate('targetClass', 'name classCode room')
      .populate('reviewedBy', 'fullName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy danh sách yêu cầu chuyển đổi',
    });
  }
};

/**
 * UC48 & UC49: Review and Approve/Reject Change Request
 * PUT /api/staff/change-requests/:id
 */
export const processChangeRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const staffId = req.user?._id;
    const { id } = req.params;
    const { status, reviewNote } = req.body; // 'APPROVED' or 'REJECTED'

    const request = await ChangeRequest.findById(id);
    if (!request) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu',
      });
      return;
    }

    request.status = status;
    request.reviewNote = reviewNote || '';
    request.reviewedBy = staffId;
    request.reviewedAt = new Date();
    await request.save();

    // If APPROVED and requestType is CLASS_CHANGE, move student to targetClass
    if (status === 'APPROVED' && request.requestType === 'CLASS_CHANGE' && request.targetClass) {
      const targetClassDoc = await Class.findById(request.targetClass);
      const updatePayload: any = { class: request.targetClass };
      if (targetClassDoc?.course) {
        updatePayload.course = targetClassDoc.course;
      }
      await Enrollment.findOneAndUpdate(
        { student: request.student, class: request.currentClass },
        updatePayload
      );
      await Class.findByIdAndUpdate(request.currentClass, { $inc: { currentEnrollment: -1 } });
      await Class.findByIdAndUpdate(request.targetClass, { $inc: { currentEnrollment: 1 } });
    }

    // If APPROVED and requestType is SCHEDULE_CHANGE with targetSchedule
    if (status === 'APPROVED' && request.requestType === 'SCHEDULE_CHANGE' && request.targetSchedule) {
      await Class.findByIdAndUpdate(request.currentClass, { timeSlot: request.targetSchedule });
    }

    // Send in-app notification to the requester (student or teacher)
    if (request.student) {
      await Notification.create({
        recipient: request.student,
        title: `Yêu cầu đổi ${request.requestType === 'CLASS_CHANGE' ? 'lớp học' : 'lịch học/dạy'} đã được ${status === 'APPROVED' ? 'chấp thuận' : 'từ chối'}`,
        message: reviewNote
          ? `Giáo vụ phản hồi: "${reviewNote}"`
          : `Yêu cầu của bạn đã được phòng Giáo vụ xét duyệt: ${status === 'APPROVED' ? 'Chấp thuận' : 'Từ chối'}.`,
        type: 'SYSTEM',
        isRead: false,
      });
    }

    res.status(200).json({
      success: true,
      message: `Đã xử lý yêu cầu thành công (${status === 'APPROVED' ? 'Chấp thuận' : 'Từ chối'})!`,
      data: request,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi xử lý yêu cầu',
    });
  }
};

/**
 * UC50: Track Academic Results & UC51: View Class Academic Results
 * GET /api/staff/academic-results
 */
export const getAcademicResults = async (req: Request, res: Response): Promise<void> => {
  try {
    const { classId } = req.query;
    let query: any = {};
    if (classId) query.class = classId;

    const enrollments = await Enrollment.find(query)
      .populate('student', 'fullName email phone')
      .populate('class', 'name classCode room')
      .populate('course', 'title code');

    const submissions = await Submission.find({ status: 'GRADED' })
      .populate('student', 'fullName')
      .populate({ path: 'assignment', populate: { path: 'class' } });

    res.status(200).json({
      success: true,
      data: {
        enrollments,
        submissions,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi theo dõi kết quả học tập',
    });
  }
};

/**
 * Final Exam Management: Schedule / Manage Final Exams
 * GET /api/staff/final-exams
 */
export const getFinalExams = async (_req: Request, res: Response): Promise<void> => {
  try {
    const exams = await Assignment.find({ type: 'FINAL_EXAM' })
      .populate('class', 'name classCode room currentEnrollment')
      .populate('teacher', 'fullName email')
      .sort({ dueDate: -1 });

    const examIds = exams.map((e) => e._id);
    const submissions = await Submission.find({ assignment: { $in: examIds } })
      .populate('student', 'fullName email');

    res.status(200).json({
      success: true,
      data: {
        exams,
        submissions,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy thông tin kỳ thi cuối khóa',
    });
  }
};

/**
 * Final Exam: Create new final exam
 * POST /api/staff/final-exams
 */
export const createFinalExam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const staffId = req.user?._id;
    const { classId, teacherId, title, description, examDate, maxScore } = req.body;

    if (!classId || !title || !examDate) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp lớp học, tên kỳ thi và ngày thi',
      });
      return;
    }

    const cls = await Class.findById(classId);
    const teacherRef = teacherId || cls?.teacher || staffId;

    const exam = await Assignment.create({
      class: classId,
      teacher: teacherRef,
      title: title.trim(),
      description: description || 'Kỳ thi đánh giá năng lực chuẩn đầu ra 4 kỹ năng IELTS.',
      dueDate: new Date(examDate),
      maxScore: Number(maxScore) || 9.0,
      type: 'FINAL_EXAM',
      status: 'PUBLISHED',
    });

    res.status(201).json({
      success: true,
      message: 'Tổ chức kỳ thi cuối khóa (Final Exam) thành công!',
      data: exam,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi tổ chức kỳ thi cuối khóa',
    });
  }
};
