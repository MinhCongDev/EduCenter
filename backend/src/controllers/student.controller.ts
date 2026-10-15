import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../middlewares/auth.middleware';
import { Class } from '../models/class.model';
import { Assignment } from '../models/assignment.model';
import { Submission } from '../models/submission.model';
import { Grade } from '../models/grade.model';
import { Attendance } from '../models/attendance.model';
import { ClassSchedule } from '../models/classSchedule.model';
import { Enrollment } from '../models/enrollment.model';
import { Payment } from '../models/payment.model';
import { ChangeRequest } from '../models/changeRequest.model';
import { Student } from '../models/student.model';
import { User } from '../models/user.model';

// ===========================
// Helper: Lấy Student ID từ User
// ===========================
const getStudentDocId = async (userId: string): Promise<Types.ObjectId | null> => {
  const student = await Student.findOne({ user: userId });
  return student ? (student._id as Types.ObjectId) : null;
};

// ===========================
// UC #14: Xem trạng thái đăng ký
// ===========================
export const getEnrollmentStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa xác thực' });
      return;
    }

    const userId = req.user._id;
    const enrollments = await Enrollment.find({ student: userId })
      .populate({
        path: 'class',
        populate: [
          { path: 'course', select: 'name code' },
          { path: 'teacher', select: 'fullName email' },
        ],
      })
      .sort({ createdAt: -1 });

    const summary = {
      total: enrollments.length,
      active: enrollments.filter((e) => e.status === 'ENROLLED').length,
      completed: enrollments.filter((e) => e.status === 'COMPLETED').length,
      dropped: enrollments.filter((e) => e.status === 'DROPPED').length,
      paidCount: enrollments.filter((e) => e.tuitionStatus === 'PAID').length,
      pendingPayment: enrollments.filter((e) => e.tuitionStatus === 'PENDING').length,
    };

    res.status(200).json({
      success: true,
      data: {
        summary,
        enrollments,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy trạng thái đăng ký',
    });
  }
};

// ===========================
// UC #15: Xem danh sách lớp đã đăng ký
// ===========================
export const getMyClasses = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa xác thực' });
      return;
    }

    const userId = req.user._id;
    const enrollments = await Enrollment.find({
      student: userId,
      status: { $in: ['ENROLLED', 'COMPLETED'] },
    })
      .populate({
        path: 'class',
        populate: [
          { path: 'course', select: 'name code tuitionFee' },
          { path: 'teacher', select: 'fullName email phone' },
        ],
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { classes: enrollments },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy danh sách lớp',
    });
  }
};

// ===========================
// UC #17: Xem thông tin chi tiết lớp học
// ===========================
export const getClassDetails = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa xác thực' });
      return;
    }

    const { classId } = req.params;
    const userId = req.user._id;

    // Kiểm tra sinh viên có trong lớp không
    const enrollment = await Enrollment.findOne({
      student: userId,
      class: classId,
    });
    if (!enrollment) {
      res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập lớp học này',
      });
      return;
    }

    const classDoc = await Class.findById(classId)
      .populate('course', 'name code description tuitionFee duration')
      .populate('teacher', 'fullName email phone');

    if (!classDoc) {
      res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        class: classDoc,
        enrollment,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy chi tiết lớp học',
    });
  }
};

// ===========================
// UC #18: Xem thông tin giảng viên
// ===========================
export const getClassTeachers = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa xác thực' });
      return;
    }

    const { classId } = req.params;
    const classDoc = await Class.findById(classId)
      .populate('teacher', 'fullName email phone avatar');

    if (!classDoc) {
      res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' });
      return;
    }

    res.status(200).json({
      success: true,
      data: { teacher: classDoc.teacher },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy thông tin giảng viên',
    });
  }
};

// ===========================
// UC #16: Xem thời khóa biểu tuần
// ===========================
export const getWeeklySchedule = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa xác thực' });
      return;
    }

    const { classId } = req.params;
    const schedules = await ClassSchedule.find({ class: classId }).sort({
      dayOfWeek: 1,
      startTime: 1,
    });

    // Nhóm theo thứ
    const grouped: Record<string, any[]> = {
      'Thứ 2': [],
      'Thứ 3': [],
      'Thứ 4': [],
      'Thứ 5': [],
      'Thứ 6': [],
      'Thứ 7': [],
      'Chủ nhật': [],
    };

    schedules.forEach((s) => {
      if (grouped[s.dayOfWeek]) {
        grouped[s.dayOfWeek].push(s);
      }
    });

    res.status(200).json({
      success: true,
      data: { schedules, grouped },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy thời khóa biểu',
    });
  }
};

// ===========================
// UC #19: Xem danh sách bài tập
// ===========================
export const getAssignments = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa xác thực' });
      return;
    }

    const { classId } = req.params;
    const userId = req.user._id;

    const assignments = await Assignment.find({ class: classId })
      .sort({ dueDate: 1 })
      .lean();

    // Lấy thông tin submission + grade cho mỗi assignment
    const assignmentsWithSubmission = await Promise.all(
      assignments.map(async (a) => {
        const submission = await Submission.findOne({
          assignment: a._id,
          student: userId,
        });

        let grade = null;
        if (submission) {
          grade = await Grade.findOne({ submission: submission._id });
        }

        const isOverdue = new Date(a.dueDate) < new Date() && !submission;
        return {
          ...a,
          submission: submission || null,
          grade: grade || null,
          isOverdue,
          submissionStatus: submission
            ? grade
              ? 'GRADED'
              : submission.status
            : isOverdue
              ? 'OVERDUE'
              : 'PENDING',
        };
      })
    );

    res.status(200).json({
      success: true,
      data: { assignments: assignmentsWithSubmission },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy danh sách bài tập',
    });
  }
};

// ===========================
// UC #20: Nộp bài tập
// ===========================
export const submitAssignment = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa xác thực' });
      return;
    }

    const { assignmentId, content, attachmentUrl } = req.body;
    const userId = req.user._id;

    if (!assignmentId) {
      res.status(400).json({ success: false, message: 'Thiếu assignmentId' });
      return;
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      res.status(404).json({ success: false, message: 'Không tìm thấy bài tập' });
      return;
    }

    if (assignment.status === 'CLOSED') {
      res.status(400).json({ success: false, message: 'Bài tập đã đóng' });
      return;
    }

    const isLate = new Date() > new Date(assignment.dueDate);

    // Upsert: nếu đã nộp thì update, chưa thì tạo mới
    const submission = await Submission.findOneAndUpdate(
      { assignment: assignmentId, student: userId },
      {
        content: content || '',
        attachmentUrl: attachmentUrl || '',
        submittedAt: new Date(),
        status: isLate ? 'LATE' : 'SUBMITTED',
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
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

// ===========================
// UC #21: Xem điểm
// ===========================
export const getGrades = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa xác thực' });
      return;
    }

    const { classId } = req.params;
    const userId = req.user._id;

    // Lấy tất cả assignment của lớp
    const assignments = await Assignment.find({ class: classId }).lean();

    // Lấy submission + grade cho mỗi assignment
    const grades = await Promise.all(
      assignments.map(async (a) => {
        const submission = await Submission.findOne({
          assignment: a._id,
          student: userId,
        });
        let grade = null;
        if (submission) {
          grade = await Grade.findOne({ submission: submission._id });
        }
        return {
          assignment: a,
          submission,
          grade,
        };
      })
    );

    // Tính GPA
    const gradedItems = grades.filter((g) => g.grade?.score !== undefined);
    const totalScore = gradedItems.reduce((sum, g) => sum + (g.grade?.score || 0), 0);
    const maxPossible = gradedItems.reduce(
      (sum, g) => sum + (g.assignment.maxScore || 10),
      0
    );
    const gpa = gradedItems.length > 0 ? (totalScore / gradedItems.length).toFixed(2) : '0.00';

    res.status(200).json({
      success: true,
      data: {
        grades,
        summary: {
          total: assignments.length,
          submitted: grades.filter((g) => g.submission).length,
          graded: gradedItems.length,
          gpa,
          totalScore,
          maxPossible,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy điểm',
    });
  }
};

// ===========================
// UC #24: Xem điểm danh
// ===========================
export const getAttendance = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa xác thực' });
      return;
    }

    const { classId } = req.params;
    const userId = req.user._id;

    const records = await Attendance.find({
      student: userId,
    })
      .populate({
        path: 'schedule',
        match: { class: classId },
        populate: { path: 'class', select: 'classCode' },
      })
      .sort({ date: -1 });

    // Lọc các record có schedule thuộc classId
    const filtered = records.filter((r: any) => r.schedule !== null);

    const summary = {
      total: filtered.length,
      present: filtered.filter((r) => r.status === 'PRESENT').length,
      absent: filtered.filter((r) => r.status === 'ABSENT').length,
      late: filtered.filter((r) => r.status === 'LATE').length,
      excused: filtered.filter((r) => r.status === 'EXCUSED').length,
      rate:
        filtered.length > 0
          ? Math.round(
              (filtered.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length /
                filtered.length) *
                100
            )
          : 0,
    };

    res.status(200).json({
      success: true,
      data: { records: filtered, summary },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy điểm danh',
    });
  }
};

// ===========================
// UC #13: Thanh toán học phí
// ===========================
export const makePayment = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa xác thực' });
      return;
    }

    const { enrollmentId, amount, paymentMethod, transactionCode } = req.body;
    const userId = req.user._id;

    if (!enrollmentId || !amount || !paymentMethod) {
      res.status(400).json({
        success: false,
        message: 'Thiếu thông tin thanh toán',
      });
      return;
    }

    // Kiểm tra enrollment thuộc về user
    const enrollment = await Enrollment.findOne({
      _id: enrollmentId,
      student: userId,
    });
    if (!enrollment) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy đăng ký học',
      });
      return;
    }

    const payment = await Payment.create({
      enrollment: enrollmentId,
      amount,
      paymentMethod,
      transactionCode: transactionCode || `TXN-${Date.now()}`,
      paymentDate: new Date(),
      status: 'COMPLETED', // Giả lập gateway thành công
    });

    // Cập nhật trạng thái enrollment
    enrollment.tuitionStatus = 'PAID';
    await enrollment.save();

    res.status(201).json({
      success: true,
      message: 'Thanh toán thành công',
      data: { payment, enrollment },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi thanh toán',
    });
  }
};

// ===========================
// UC #22: Yêu cầu đổi lớp
// ===========================
export const requestClassChange = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa xác thực' });
      return;
    }

    const { currentClass, targetClass, reason } = req.body;
    const userId = req.user._id;

    if (!currentClass || !targetClass || !reason) {
      res.status(400).json({
        success: false,
        message: 'Thiếu thông tin yêu cầu',
      });
      return;
    }

    const request = await ChangeRequest.create({
      student: userId,
      type: 'CLASS_CHANGE',
      currentClass,
      targetClass,
      reason,
      status: 'PENDING',
    });

    res.status(201).json({
      success: true,
      message: 'Đã gửi yêu cầu đổi lớp. Vui lòng chờ admin duyệt.',
      data: { request },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi gửi yêu cầu',
    });
  }
};

// ===========================
// UC #23: Yêu cầu đổi lịch học
// ===========================
export const requestScheduleChange = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa xác thực' });
      return;
    }

    const { currentSchedule, targetSchedule, reason } = req.body;
    const userId = req.user._id;

    if (!currentSchedule || !targetSchedule || !reason) {
      res.status(400).json({
        success: false,
        message: 'Thiếu thông tin yêu cầu',
      });
      return;
    }

    const request = await ChangeRequest.create({
      student: userId,
      type: 'SCHEDULE_CHANGE',
      currentSchedule,
      targetSchedule,
      reason,
      status: 'PENDING',
    });

    res.status(201).json({
      success: true,
      message: 'Đã gửi yêu cầu đổi lịch. Vui lòng chờ admin duyệt.',
      data: { request },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi gửi yêu cầu',
    });
  }
};

// ===========================
// UC #25: Theo dõi yêu cầu thay đổi
// ===========================
export const getMyRequests = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa xác thực' });
      return;
    }

    const userId = req.user._id;
    const requests = await ChangeRequest.find({ student: userId })
      .populate('currentClass', 'classCode')
      .populate('targetClass', 'classCode')
      .populate('currentSchedule')
      .populate('targetSchedule')
      .sort({ createdAt: -1 });

    res.status(200).json({
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
