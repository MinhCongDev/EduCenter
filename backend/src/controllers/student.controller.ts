import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import {
  Enrollment,
  ClassSchedule,
  Assignment,
  Submission,
  ChangeRequest,
  Attendance,
  Feedback,
  Payment,
  Student,
} from '../models';


/**
 * UC14: View Assigned Class & UC16: View Class Information & UC17: View Teacher Information
 * GET /api/student/classes
 */
export const getAssignedClasses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user?._id;

    const enrollments = await Enrollment.find({ student: studentId })
      .populate({
        path: 'class',
        populate: [
          { path: 'course' },
          { path: 'teacher', select: 'fullName email phone avatarUrl' },
        ],
      })
      .populate('course');

    const classesData = enrollments
      .filter((e) => e.class)
      .map((e) => {
        const cls = e.class as any;
        return {
          enrollmentId: e._id,
          classId: cls._id,
          classCode: cls.classCode,
          name: cls.name || cls.course?.title,
          course: cls.course,
          teacher: cls.teacher,
          room: cls.room,
          scheduleDays: cls.scheduleDays,
          timeSlot: cls.timeSlot,
          startDate: cls.startDate,
          endDate: cls.endDate,
          capacity: cls.capacity,
          currentEnrollment: cls.currentEnrollment,
          status: cls.status,
          enrollmentStatus: e.status,
          tuitionStatus: e.tuitionStatus,
          finalScore: e.finalScore,
          academicResult: e.academicResult,
        };
      });

    res.status(200).json({
      success: true,
      data: classesData,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy thông tin lớp học của học viên',
    });
  }
};

/**
 * UC15: View Weekly Schedule
 * GET /api/student/schedule
 */
export const getWeeklySchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user?._id;

    // Find class IDs the student is enrolled in
    const enrollments = await Enrollment.find({ student: studentId, status: 'ENROLLED' });
    const classIds = enrollments.map((e) => e.class).filter(Boolean);

    let schedules = await ClassSchedule.find({ class: { $in: classIds }, status: 'ACTIVE' })
      .populate({
        path: 'class',
        populate: [
          { path: 'course', select: 'title code' },
          { path: 'teacher', select: 'fullName email phone' },
        ],
      })
      .sort({ dayOfWeek: 1, startTime: 1 });

    if (schedules.length === 0) {
      // Fallback: fetch available class schedules if not explicitly linked
      schedules = await ClassSchedule.find({ status: 'ACTIVE' })
        .populate({
          path: 'class',
          populate: [
            { path: 'course', select: 'title code' },
            { path: 'teacher', select: 'fullName email phone' },
          ],
        })
        .limit(6);
    }

    res.status(200).json({
      success: true,
      data: schedules,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy lịch học tuần của học viên',
    });
  }
};

/**
 * UC18: View Assignments
 * GET /api/student/assignments
 */
export const getStudentAssignments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user?._id;

    const enrollments = await Enrollment.find({ student: studentId });
    const classIds = enrollments.map((e) => e.class).filter(Boolean);

    let query: any = { status: { $in: ['PUBLISHED', 'CLOSED'] } };
    if (classIds.length > 0) {
      query.class = { $in: classIds };
    }

    const assignments = await Assignment.find(query)
      .populate('class', 'name classCode')
      .populate('teacher', 'fullName email')
      .sort({ dueDate: 1 });

    // Fetch student submissions for these assignments
    const assignmentIds = assignments.map((a) => a._id);
    const submissions = await Submission.find({
      assignment: { $in: assignmentIds },
      student: studentId,
    });

    const submissionMap = new Map();
    submissions.forEach((sub) => {
      submissionMap.set(sub.assignment.toString(), sub);
    });

    const result = assignments.map((a) => {
      const sub = submissionMap.get(a._id.toString());
      return {
        _id: a._id,
        title: a.title,
        description: a.description,
        class: a.class,
        teacher: a.teacher,
        dueDate: a.dueDate,
        maxScore: a.maxScore,
        type: a.type || 'HOMEWORK',
        status: a.status,
        submission: sub
          ? {
              _id: sub._id,
              content: sub.content,
              submissionTime: sub.submissionTime,
              grade: sub.grade,
              feedback: sub.feedback,
              status: sub.status,
            }
          : null,
      };
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy danh sách bài tập',
    });
  }
};

/**
 * UC19: Do Assignments (Submit Assignment)
 * POST /api/student/assignments/:id/submit
 */
export const submitAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user?._id;
    const assignmentId = req.params.id;
    const { content, attachments } = req.body;

    if (!content || !content.trim()) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng nhập nội dung bài nộp',
      });
      return;
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài tập được chỉ định',
      });
      return;
    }

    // Check existing submission
    let submission = await Submission.findOne({
      assignment: assignmentId,
      student: studentId,
    });

    const isLate = new Date() > new Date(assignment.dueDate);

    if (submission) {
      submission.content = content.trim();
      if (attachments) submission.attachments = attachments;
      submission.submissionTime = new Date();
      submission.status = isLate ? 'LATE' : 'SUBMITTED';
      await submission.save();
    } else {
      submission = await Submission.create({
        assignment: assignmentId,
        student: studentId,
        content: content.trim(),
        attachments: attachments || [],
        submissionTime: new Date(),
        status: isLate ? 'LATE' : 'SUBMITTED',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Nộp bài tập thành công!',
      data: submission,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi nộp bài tập',
    });
  }
};

/**
 * UC20: View Grades and Academic Results
 * GET /api/student/academic-results
 */
export const getAcademicResults = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user?._id;

    const [enrollments, submissions, studentProfile] = await Promise.all([
      Enrollment.find({ student: studentId })
        .populate({ path: 'class', populate: { path: 'course' } })
        .populate('course'),
      Submission.find({ student: studentId, status: 'GRADED' })
        .populate({ path: 'assignment', populate: { path: 'class' } })
        .populate('gradedBy', 'fullName'),
      Student.findOne({ user: studentId }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        profile: studentProfile,
        enrollments,
        gradedSubmissions: submissions,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy bảng điểm học tập',
    });
  }
};

/**
 * UC21: Request to change class & UC22: Request to change Schedule
 * POST /api/student/change-requests
 */
export const createChangeRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user?._id;
    const { requestType, currentClass, targetClass, targetSchedule, reason } = req.body;

    if (!requestType || !currentClass || !reason) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp loại yêu cầu, lớp hiện tại và lý do',
      });
      return;
    }

    const changeRequest = await ChangeRequest.create({
      student: studentId,
      requesterRole: 'STUDENT',
      requestType,
      currentClass,
      targetClass: targetClass || undefined,
      targetSchedule: targetSchedule || '',
      reason: reason.trim(),
      status: 'PENDING',
    });

    res.status(201).json({
      success: true,
      message: 'Gửi yêu cầu thay đổi thành công! Giáo vụ sẽ phản hồi trong 24 giờ.',
      data: changeRequest,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi gửi yêu cầu đổi lớp/lịch',
    });
  }
};

/**
 * UC24: Track Change Requests
 * GET /api/student/change-requests
 */
export const getChangeRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user?._id;

    const requests = await ChangeRequest.find({ student: studentId })
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
      message: error.message || 'Lỗi khi tra cứu yêu cầu thay đổi',
    });
  }
};

/**
 * UC23: View Attendance
 * GET /api/student/attendance
 */
export const getStudentAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user?._id;

    const attendanceRecords = await Attendance.find({ student: studentId })
      .populate('class', 'name classCode room')
      .populate('classSchedule')
      .sort({ sessionDate: -1 });

    const totalSessions = attendanceRecords.length;
    const presentSessions = attendanceRecords.filter((a) => a.status === 'PRESENT').length;
    const attendanceRate = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 100;

    res.status(200).json({
      success: true,
      data: {
        records: attendanceRecords,
        stats: {
          totalSessions,
          presentSessions,
          absentSessions: attendanceRecords.filter((a) => a.status === 'ABSENT').length,
          lateSessions: attendanceRecords.filter((a) => a.status === 'LATE').length,
          attendanceRate: `${attendanceRate}%`,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy thông tin chuyên cần',
    });
  }
};

/**
 * Teacher Feedback: Submit Teacher / Class Feedback
 * POST /api/student/feedback
 */
export const submitFeedback = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user?._id;
    const { receiver, classId, courseId, content, rating, tags } = req.body;

    if (!content || !rating) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp nội dung đánh giá và số sao',
      });
      return;
    }

    const feedback = await Feedback.create({
      sender: studentId,
      receiver: receiver || undefined,
      class: classId || undefined,
      course: courseId || undefined,
      content: content.trim(),
      rating: Number(rating),
      tags: tags || [],
    });

    res.status(201).json({
      success: true,
      message: 'Cảm ơn bạn đã gửi đánh giá phản hồi!',
      data: feedback,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi gửi đánh giá phản hồi',
    });
  }
};

/**
 * UC13: View Registration Status
 * GET /api/student/registrations
 */
export const getRegistrations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user?._id;

    const enrollments = await Enrollment.find({ student: studentId })
      .populate('course')
      .populate('class')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: enrollments,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy trạng thái ghi danh',
    });
  }
};

/**
 * UC12: Make Payment
 * POST /api/student/payments
 */
export const makePayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user?._id;
    const { enrollmentId, courseId, amount, method, note } = req.body;

    if (!amount || amount <= 0) {
      res.status(400).json({
        success: false,
        message: 'Số tiền thanh toán không hợp lệ',
      });
      return;
    }

    const transactionCode = `TXN-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const payment = await Payment.create({
      student: studentId,
      enrollment: enrollmentId || undefined,
      course: courseId || undefined,
      amount,
      method: method || 'VNPAY',
      transactionCode,
      status: 'SUCCESS',
      paymentDate: new Date(),
      note: note || 'Thanh toán học phí khóa học IELTS',
    });

    // Update enrollment tuitionStatus to PAID if linked
    if (enrollmentId) {
      await Enrollment.findByIdAndUpdate(enrollmentId, {
        tuitionStatus: 'PAID',
        status: 'ENROLLED',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Thanh toán học phí thành công!',
      data: payment,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi xử lý thanh toán',
    });
  }
};
