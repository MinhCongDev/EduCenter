import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { Enrollment } from '../models/enrollment.model';
import { Class } from '../models/class.model';
import { Course } from '../models/course.model';
import { ClassSchedule } from '../models/classSchedule.model';
import { Attendance } from '../models/attendance.model';
import { Assignment } from '../models/assignment.model';
import { Submission } from '../models/submission.model';
import { Grade } from '../models/grade.model';
import { Payment } from '../models/payment.model';
import { ChangeRequest } from '../models/changeRequest.model';

// ============================================
// UC #14: Xem trạng thái đăng ký học
// ============================================
export const getEnrollmentStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
      return;
    }

    const enrollments = await Enrollment.find({ student: req.user._id })
      .populate('class')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Lấy trạng thái đăng ký thành công',
      data: { enrollments },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi server' });
  }
};

// ============================================
// UC #15: Xem danh sách lớp đã đăng ký
// ============================================
export const getMyClasses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
      return;
    }

    // Lấy tất cả enrollment của student, populate class và course
    const enrollments = await Enrollment.find({
      student: req.user._id,
      status: { $in: ['ENROLLED', 'COMPLETED'] }
    })
      .populate({
        path: 'class',
        populate: { path: 'course' }
      })
      .sort({ createdAt: -1 });

    const classes = enrollments.map(e => ({
      enrollmentId: e._id,
      enrollmentStatus: e.status,
      tuitionStatus: e.tuitionStatus,
      enrolledAt: e.enrollmentDate,
      class: e.class
    }));

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách lớp học thành công',
      data: { classes },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi server' });
  }
};

// ============================================
// UC #17: Xem thông tin lớp học
// ============================================
export const getClassDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
      return;
    }

    const { classId } = req.params;

    // Kiểm tra student có đăng ký lớp này không
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      class: classId,
      status: { $in: ['ENROLLED', 'COMPLETED'] }
    });

    if (!enrollment) {
      res.status(403).json({
        success: false,
        message: 'Bạn chưa đăng ký lớp học này'
      });
      return;
    }

    // Lấy thông tin lớp
    const classInfo = await Class.findById(classId)
      .populate('course');

    if (!classInfo) {
      res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Lấy thông tin lớp học thành công',
      data: {
        class: classInfo,
        enrollmentStatus: enrollment.status,
        tuitionStatus: enrollment.tuitionStatus
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi server' });
  }
};

// ============================================
// UC #18: Xem thông tin giảng viên
// ============================================
export const getClassTeachers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
      return;
    }

    const { classId } = req.params;

    // Kiểm tra student có đăng ký lớp này không
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      class: classId,
      status: { $in: ['ENROLLED', 'COMPLETED'] }
    });

    if (!enrollment) {
      res.status(403).json({
        success: false,
        message: 'Bạn chưa đăng ký lớp học này'
      });
      return;
    }

    // Lấy thông tin lớp + teacher (teacher là ObjectId trong Class model)
    const classInfo = await Class.findById(classId)
      .populate({
        path: 'teacher',
        select: 'fullName email phone role avatarUrl'
      })
      .populate('course');

    if (!classInfo) {
      res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Lấy thông tin giảng viên thành công',
      data: {
        teacher: classInfo.teacher,
        class: {
          _id: classInfo._id,
          classCode: classInfo.classCode,
          name: classInfo.name,
          course: classInfo.course
        }
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi server' });
  }
};

// ============================================
// UC #16: Xem thời khóa biểu tuần
// ============================================
export const getWeeklySchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
      return;
    }

    const { classId } = req.params;

    // Kiểm tra enrollment
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      class: classId,
      status: { $in: ['ENROLLED', 'COMPLETED'] }
    });

    if (!enrollment) {
      res.status(403).json({
        success: false,
        message: 'Bạn chưa đăng ký lớp học này'
      });
      return;
    }

    // Lấy lịch học
    const schedules = await ClassSchedule.find({ class: classId })
      .sort({ dayOfWeek: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      message: 'Lấy thời khóa biểu thành công',
      data: { schedules },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi server' });
  }
};

// ============================================
// UC #19: Xem danh sách bài tập
// ============================================
export const getAssignments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
      return;
    }

    const { classId } = req.params;

    // Kiểm tra enrollment
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      class: classId,
      status: { $in: ['ENROLLED', 'COMPLETED'] }
    });

    if (!enrollment) {
      res.status(403).json({
        success: false,
        message: 'Bạn chưa đăng ký lớp học này'
      });
      return;
    }

    // Lấy bài tập của lớp
    const assignments = await Assignment.find({ class: classId })
      .sort({ dueDate: -1 });

    // Lấy submissions của student cho các bài tập này
    const assignmentIds = assignments.map(a => a._id);
    const submissions = await Submission.find({
      assignment: { $in: assignmentIds },
      student: req.user._id
    });

    // Map submissions vào assignments
    const assignmentsWithStatus = assignments.map(assignment => {
      const submission = submissions.find(
        s => s.assignment.toString() === assignment._id.toString()
      );
      return {
        ...assignment.toObject(),
        submissionStatus: submission?.status || null,
        submittedAt: submission?.submittedAt || null,
        submissionId: submission?._id || null
      };
    });

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách bài tập thành công',
      data: { assignments: assignmentsWithStatus },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi server' });
  }
};

// ============================================
// UC #20: Nộp bài tập
// ============================================
export const submitAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
      return;
    }

    const { assignmentId, content, attachmentUrl } = req.body;

    if (!assignmentId || !content) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp mã bài tập và nội dung'
      });
      return;
    }

    // Kiểm tra bài tập tồn tại
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      res.status(404).json({ success: false, message: 'Không tìm thấy bài tập' });
      return;
    }

    // Kiểm tra student có đăng ký lớp không
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      class: assignment.class,
      status: { $in: ['ENROLLED', 'COMPLETED'] }
    });

    if (!enrollment) {
      res.status(403).json({
        success: false,
        message: 'Bạn chưa đăng ký lớp học này'
      });
      return;
    }

    // Kiểm tra đã nộp chưa
    const existingSubmission = await Submission.findOne({
      assignment: assignmentId,
      student: req.user._id
    });

    if (existingSubmission) {
      res.status(400).json({
        success: false,
        message: 'Bạn đã nộp bài tập này rồi'
      });
      return;
    }

    // Kiểm tra hạn nộp
    const now = new Date();
    const isLate = now > assignment.dueDate;

    // Tạo submission
    const submission = await Submission.create({
      assignment: assignmentId,
      student: req.user._id,
      content,
      attachmentUrl: attachmentUrl || '',
      status: isLate ? 'LATE' : 'SUBMITTED'
    });

    res.status(201).json({
      success: true,
      message: isLate ? 'Nộp bài thành công (nộp trễ)' : 'Nộp bài thành công',
      data: { submission },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi server' });
  }
};

// ============================================
// UC #21: Xem điểm
// ============================================
export const getGrades = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
      return;
    }

    const { classId } = req.params;

    // Kiểm tra enrollment
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      class: classId,
      status: { $in: ['ENROLLED', 'COMPLETED'] }
    });

    if (!enrollment) {
      res.status(403).json({
        success: false,
        message: 'Bạn chưa đăng ký lớp học này'
      });
      return;
    }

    // Lấy tất cả bài tập của lớp
    const assignments = await Assignment.find({ class: classId });

    // Lấy submissions của student
    const assignmentIds = assignments.map(a => a._id);
    const submissions = await Submission.find({
      assignment: { $in: assignmentIds },
      student: req.user._id
    }).populate('assignment');

    // Lấy grades của các submissions
    const submissionIds = submissions.map(s => s._id);
    const grades = await Grade.find({ submission: { $in: submissionIds } })
      .populate('teacher', 'fullName');

    // Map grades vào submissions
    const gradesWithDetails = submissions.map(submission => {
      const grade = grades.find(
        g => g.submission.toString() === submission._id.toString()
      );
      return {
        assignment: submission.assignment,
        submission: {
          _id: submission._id,
          content: submission.content,
          submittedAt: submission.submittedAt,
          status: submission.status
        },
        grade: grade ? {
          score: grade.score,
          feedback: grade.feedback,
          gradedAt: grade.gradedAt,
          teacher: grade.teacher
        } : null
      };
    });

    res.status(200).json({
      success: true,
      message: 'Lấy điểm thành công',
      data: { grades: gradesWithDetails },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi server' });
  }
};

// ============================================
// UC #24: Xem điểm danh
// ============================================
export const getAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
      return;
    }

    const { classId } = req.params;

    // Kiểm tra enrollment
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      class: classId,
      status: { $in: ['ENROLLED', 'COMPLETED'] }
    });

    if (!enrollment) {
      res.status(403).json({
        success: false,
        message: 'Bạn chưa đăng ký lớp học này'
      });
      return;
    }

    // Lấy lịch học của lớp
    const schedules = await ClassSchedule.find({ class: classId });

    // Lấy điểm danh của student cho các lịch này
    const scheduleIds = schedules.map(s => s._id);
    const attendanceRecords = await Attendance.find({
      schedule: { $in: scheduleIds },
      student: req.user._id
    }).populate('schedule');

    // Tính thống kê
    const stats = {
      total: attendanceRecords.length,
      present: attendanceRecords.filter(a => a.status === 'PRESENT').length,
      absent: attendanceRecords.filter(a => a.status === 'ABSENT').length,
      late: attendanceRecords.filter(a => a.status === 'LATE').length,
      excused: attendanceRecords.filter(a => a.status === 'EXCUSED').length
    };

    res.status(200).json({
      success: true,
      message: 'Lấy thông tin điểm danh thành công',
      data: {
        attendance: attendanceRecords,
        stats
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi server' });
  }
};

// ============================================
// UC #13: Thanh toán học phí
// ============================================
export const makePayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
      return;
    }

    const { enrollmentId, amount, paymentMethod, transactionCode } = req.body;

    if (!enrollmentId || !amount) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp mã đăng ký và số tiền'
      });
      return;
    }

    // Kiểm tra enrollment tồn tại và thuộc student
    const enrollment = await Enrollment.findOne({
      _id: enrollmentId,
      student: req.user._id
    });

    if (!enrollment) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin đăng ký'
      });
      return;
    }

    if (enrollment.tuitionStatus === 'PAID') {
      res.status(400).json({
        success: false,
        message: 'Học phí đã được thanh toán'
      });
      return;
    }

    // Tạo payment
    const payment = await Payment.create({
      enrollment: enrollmentId,
      amount,
      paymentMethod: paymentMethod || 'CASH',
      transactionCode: transactionCode || '',
      status: 'COMPLETED'
    });

    // Cập nhật tuitionStatus của enrollment
    await Enrollment.findByIdAndUpdate(enrollmentId, { tuitionStatus: 'PAID' });

    res.status(201).json({
      success: true,
      message: 'Thanh toán học phí thành công',
      data: { payment },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi server' });
  }
};

// ============================================
// UC #22: Yêu cầu đổi lớp
// ============================================
export const requestClassChange = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
      return;
    }

    const { currentClassId, targetClassId, reason } = req.body;

    if (!currentClassId || !targetClassId || !reason) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin'
      });
      return;
    }

    // Kiểm tra student có đăng ký lớp hiện tại không
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      class: currentClassId,
      status: 'ENROLLED'
    });

    if (!enrollment) {
      res.status(403).json({
        success: false,
        message: 'Bạn chưa đăng ký lớp này'
      });
      return;
    }

    // Kiểm tra lớp target tồn tại
    const targetClass = await Class.findById(targetClassId);
    if (!targetClass) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy lớp muốn chuyển đến'
      });
      return;
    }

    // Tạo yêu cầu
    const changeRequest = await ChangeRequest.create({
      student: req.user._id,
      type: 'CLASS_CHANGE',
      currentClass: currentClassId,
      targetClass: targetClassId,
      reason
    });

    res.status(201).json({
      success: true,
      message: 'Gửi yêu cầu đổi lớp thành công',
      data: { changeRequest },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi server' });
  }
};

// ============================================
// UC #23: Yêu cầu đổi lịch học
// ============================================
export const requestScheduleChange = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
      return;
    }

    const { currentScheduleId, targetScheduleId, reason } = req.body;

    if (!currentScheduleId || !targetScheduleId || !reason) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin'
      });
      return;
    }

    // Kiểm tra lịch hiện tại tồn tại
    const currentSchedule = await ClassSchedule.findById(currentScheduleId);
    if (!currentSchedule) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch học hiện tại'
      });
      return;
    }

    // Kiểm tra lịch target tồn tại
    const targetSchedule = await ClassSchedule.findById(targetScheduleId);
    if (!targetSchedule) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch học muốn chuyển đến'
      });
      return;
    }

    // Kiểm tra student có đăng ký lớp của lịch hiện tại không
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      class: currentSchedule.class,
      status: 'ENROLLED'
    });

    if (!enrollment) {
      res.status(403).json({
        success: false,
        message: 'Bạn chưa đăng ký lớp của lịch học này'
      });
      return;
    }

    // Tạo yêu cầu
    const changeRequest = await ChangeRequest.create({
      student: req.user._id,
      type: 'SCHEDULE_CHANGE',
      currentSchedule: currentScheduleId,
      targetSchedule: targetScheduleId,
      reason
    });

    res.status(201).json({
      success: true,
      message: 'Gửi yêu cầu đổi lịch học thành công',
      data: { changeRequest },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi server' });
  }
};

// ============================================
// UC #25: Theo dõi yêu cầu thay đổi
// ============================================
export const getMyRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
      return;
    }

    const requests = await ChangeRequest.find({ student: req.user._id })
      .populate('currentClass', 'classCode name')
      .populate('targetClass', 'classCode name')
      .populate('currentSchedule')
      .populate('targetSchedule')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách yêu cầu thành công',
      data: { requests },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi server' });
  }
};
