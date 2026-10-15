import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { Enrollment } from '../models/enrollment.model';
import { Class } from '../models/class.model';
import { Assignment } from '../models/assignment.model';
import { Submission } from '../models/submission.model';
import { Attendance } from '../models/attendance.model';
import { Grade } from '../models/grade.model';
import { Payment } from '../models/payment.model';
import { ChangeRequest } from '../models/changeRequest.model';
import { ClassSchedule } from '../models/classSchedule.model';

/**
 * GET /api/student/classes
 * Lấy danh sách lớp học của học viên hiện tại
 */
export const getMyClasses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa xác thực' });
      return;
    }

    const enrollments = await Enrollment.find({ student: req.user._id })
      .populate({
        path: 'class',
        populate: [
          { path: 'course', select: 'code title' },
          { path: 'teacher', select: 'fullName email' },
        ],
      })
      .sort({ createdAt: -1 });

    const classes = enrollments
      .filter((e: any) => e.class) // skip if class is null
      .map((e: any) => ({
        _id: e._id,
        enrollmentId: e._id.toString(),
        class: {
          _id: e.class._id,
          classCode: e.class.classCode,
          room: e.class.room,
          scheduleDays: e.class.scheduleDays,
          timeSlot: e.class.timeSlot,
          startDate: e.class.startDate,
          endDate: e.class.endDate,
          status: e.class.status,
          course: e.class.course,
          teacher: e.class.teacher,
        },
        status: e.status,
        enrollmentStatus: e.status,
        tuitionStatus: e.tuitionStatus,
        enrollmentDate: e.enrollmentDate,
      }));

    res.json({
      success: true,
      message: 'Lấy danh sách lớp học thành công',
      data: { classes },
    });
  } catch (error: any) {
    console.error('Error getMyClasses:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy danh sách lớp học',
    });
  }
};

/**
 * GET /api/student/classes/:id
 * Chi tiết lớp học
 */
export const getClassDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa xác thực' });
      return;
    }

    const { id } = req.params;
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      class: id,
    }).populate({
      path: 'class',
      populate: [
        { path: 'course', select: 'code title description durationWeeks sessions tuitionFee' },
        { path: 'teacher', select: 'fullName email phone avatarUrl' },
      ],
    });

    if (!enrollment) {
      res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' });
      return;
    }

    res.json({
      success: true,
      data: {
        class: {
          _id: enrollment._id,
          enrollmentId: enrollment._id,
          class: (enrollment as any).class,
          status: enrollment.status,
          enrollmentStatus: enrollment.status,
          tuitionStatus: enrollment.tuitionStatus,
          enrollmentDate: enrollment.enrollmentDate,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy chi tiết lớp học',
    });
  }
};

/**
 * GET /api/student/classes/:id/assignments
 * Bài tập của lớp
 */
export const getAssignments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa xác thực' });
      return;
    }

    const { id } = req.params;
    const assignments = await Assignment.find({ class: id }).sort({ dueDate: 1 });

    // Get submissions for this student
    const submissions = await Submission.find({
      student: req.user._id,
      assignment: { $in: assignments.map((a) => a._id) },
    });

    const submissionMap = new Map<string, any>();
    submissions.forEach((s: any) => {
      submissionMap.set(s.assignment.toString(), s);
    });

    const enriched = assignments.map((a: any) => {
      const sub = submissionMap.get(a._id.toString());
      return {
        _id: a._id,
        class: a.class,
        teacher: a.teacher,
        title: a.title,
        description: a.description,
        skill: a.skill,
        dueDate: a.dueDate,
        maxScore: a.maxScore,
        status: a.status,
        submissionStatus: sub
          ? sub.grade !== undefined && sub.grade !== null
            ? 'GRADED'
            : sub.status === 'LATE'
            ? 'LATE'
            : 'SUBMITTED'
          : null,
        submissionId: sub?._id,
        submissionDate: sub?.submissionDate,
        score: sub?.grade,
      };
    });

    res.json({
      success: true,
      data: { assignments: enriched },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy bài tập',
    });
  }
};

/**
 * GET /api/student/classes/:id/attendance
 * Điểm danh của lớp
 */
export const getAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa xác thực' });
      return;
    }

    const { id } = req.params;
    const attendance = await Attendance.find({
      class: id,
      student: req.user._id,
    }).sort({ sessionDate: -1 });

    res.json({
      success: true,
      data: { attendance },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy điểm danh',
    });
  }
};

/**
 * GET /api/student/classes/:id/grades
 * Bảng điểm
 */
export const getGrades = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa xác thực' });
      return;
    }

    const { id } = req.params;
    const grades = await Grade.find({
      class: id,
      student: req.user._id,
    }).sort({ testDate: -1 });

    res.json({
      success: true,
      data: { grades },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy điểm',
    });
  }
};

/**
 * GET /api/student/classes/:id/schedule
 * Lịch học
 */
export const getSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa xác thực' });
      return;
    }

    const { id } = req.params;
    const schedule = await ClassSchedule.find({ class: id, status: 'ACTIVE' }).sort({
      dayOfWeek: 1,
    });

    res.json({
      success: true,
      data: { schedule },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy lịch học',
    });
  }
};

/**
 * GET /api/student/payments
 * Lịch sử thanh toán
 */
export const getPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa xác thực' });
      return;
    }

    const payments = await Payment.find({ student: req.user._id })
      .populate({
        path: 'enrollment',
        populate: { path: 'class', select: 'classCode' },
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { payments },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy lịch sử thanh toán',
    });
  }
};

/**
 * GET /api/student/requests
 * Yêu cầu thay đổi
 */
export const getChangeRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa xác thực' });
      return;
    }

    const requests = await ChangeRequest.find({ student: req.user._id })
      .populate('currentClass', 'classCode')
      .populate('targetClass', 'classCode')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { requests },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy yêu cầu',
    });
  }
};

/**
 * POST /api/student/requests
 * Tạo yêu cầu thay đổi mới
 */
export const createChangeRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa xác thực' });
      return;
    }

    const { requestType, currentClass, targetClass, reason, currentSchedule, targetSchedule } = req.body;

    if (!requestType || !currentClass || !reason) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp loại yêu cầu, lớp hiện tại và lý do',
      });
      return;
    }

    const request = await ChangeRequest.create({
      student: req.user._id,
      requesterRole: 'STUDENT',
      requestType,
      currentClass,
      targetClass,
      currentSchedule,
      targetSchedule,
      reason,
      status: 'PENDING',
    });

    res.status(201).json({
      success: true,
      message: 'Tạo yêu cầu thành công',
      data: { request },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi tạo yêu cầu',
    });
  }
};

/**
 * POST /api/student/assignments/:id/submit
 * Nộp bài tập
 */
export const submitAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa xác thực' });
      return;
    }

    const { id } = req.params;
    const { fileUrl, notes } = req.body;

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      res.status(404).json({ success: false, message: 'Không tìm thấy bài tập' });
      return;
    }

    const isLate = new Date() > new Date(assignment.dueDate);
    const submission = await Submission.create({
      assignment: id,
      student: req.user._id,
      submissionDate: new Date(),
      fileUrl: fileUrl || '',
      notes: notes || '',
      status: isLate ? 'LATE' : 'SUBMITTED',
    });

    res.status(201).json({
      success: true,
      message: isLate ? 'Đã nộp bài (trễ hạn)' : 'Nộp bài thành công',
      data: { submission },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi nộp bài',
    });
  }
};
