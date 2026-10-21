import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middlewares/auth.middleware';
import { createError } from '../middlewares/error.middleware';
import { Enrollment } from '../models/enrollment.model';
import { Assignment } from '../models/assignment.model';
import { Submission } from '../models/submission.model';
import { Attendance } from '../models/attendance.model';
import { Grade } from '../models/grade.model';
import { Payment } from '../models/payment.model';
import { ChangeRequest } from '../models/changeRequest.model';
import { ClassSchedule } from '../models/classSchedule.model';
import { Class } from '../models/class.model';
import { Notification } from '../models/notification.model';

// =====================================================
//  Helpers
// =====================================================

const requireUser = (req: AuthRequest): NonNullable<AuthRequest['user']> => {
  if (!req.user) throw createError('Chưa xác thực', 401);
  return req.user;
};

const isValidId = (id: string): boolean => mongoose.Types.ObjectId.isValid(id);

// =====================================================
//  POST /api/student/enrollments  (M7)
//  Student self-enrolls into an OPEN class
// =====================================================
export const enrollIntoClass = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = requireUser(req);
    const { classId } = req.body;
    if (!classId || !isValidId(classId)) {
      throw createError('ID lớp học không hợp lệ', 400);
    }

    // Import models here to avoid circular import at top-level
    const { Class } = await import('../models/class.model');

    const cls = await Class.findById(classId);
    if (!cls) {
      throw createError('Không tìm thấy lớp học', 404);
    }
    if (cls.status !== 'OPEN' && cls.status !== 'IN_PROGRESS') {
      throw createError(`Lớp học hiện không nhận đăng ký (trạng thái: ${cls.status})`, 400);
    }
    const currentCount = cls.currentEnrollment ?? 0;
    if (typeof cls.capacity === 'number' && currentCount >= cls.capacity) {
      throw createError('Lớp học đã đầy, không thể đăng ký', 400);
    }

    // Already enrolled?
    const existing = await Enrollment.findOne({
      student: user._id,
      class: classId,
    });
    if (existing && existing.status !== 'DROPPED') {
      throw createError('Bạn đã đăng ký lớp học này rồi', 409);
    }

    let enrollment;
    if (existing) {
      // Re-enroll một enrollment cũ đã DROPPED: sĩ số chưa bị trừ khi drop,
      // nên không được tăng thêm lần nữa.
      existing.status = 'ENROLLED';
      existing.enrollmentDate = new Date();
      await existing.save();
      enrollment = existing;
    } else {
      enrollment = await Enrollment.create({
        student: user._id,
        class: classId,
        status: 'ENROLLED',
        enrollmentDate: new Date(),
        tuitionStatus: 'PENDING',
      });
      // Chỉ tăng sĩ số khi tạo enrollment mới.
      cls.currentEnrollment = currentCount + 1;
      await cls.save();
    }

    res.status(201).json({
      success: true,
      message: 'Đăng ký lớp học thành công',
      data: { enrollment },
    });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    if (error.code === 11000) {
      res.status(409).json({ success: false, message: 'Bạn đã đăng ký lớp học này rồi' });
      return;
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi đăng ký lớp học',
    });
  }
};

// =====================================================
//  GET /api/student/classes
//  My enrolled classes
// =====================================================
export const getMyClasses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = requireUser(req);

    const enrollments = await Enrollment.find({
      student: user._id,
      status: { $ne: 'DROPPED' },
    })
      .populate({
        path: 'class',
        populate: [
          { path: 'course', select: 'code title description durationWeeks sessions tuitionFee' },
          { path: 'teacher', select: 'fullName email phone avatarUrl' },
        ],
      })
      .sort({ createdAt: -1 });

    const classes = enrollments
      .filter((e: any) => e.class)
      .map((e: any) => ({
        _id: e._id.toString(),
        enrollmentId: e._id.toString(),
        class: {
          _id: e.class._id,
          classCode: e.class.classCode,
          room: e.class.room,
          scheduleDays: e.class.scheduleDays,
          timeSlot: e.class.timeSlot,
          startDate: e.class.startDate,
          endDate: e.class.endDate,
          capacity: e.class.capacity,
          currentStudents: e.class.currentEnrollment ?? e.class.currentStudents ?? 0,
          currentEnrollment: e.class.currentEnrollment ?? e.class.currentStudents ?? 0,
          sessions: e.class.sessions,
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
      data: { classes, total: classes.length },
    });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    console.error('Error getMyClasses:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy danh sách lớp học',
    });
  }
};

// =====================================================
//  GET /api/student/classes/:id
//  Class details
// =====================================================
export const getClassDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = requireUser(req);
    const { id } = req.params;
    if (!isValidId(id)) throw createError('ID lớp học không hợp lệ', 400);

    const enrollment = await Enrollment.findOne({
      student: user._id,
      class: id,
      status: { $ne: 'DROPPED' },
    }).populate({
      path: 'class',
      populate: [
        { path: 'course', select: 'code title description durationWeeks sessions tuitionFee' },
        { path: 'teacher', select: 'fullName email phone avatarUrl' },
      ],
    });

    if (!enrollment) {
      throw createError('Bạn chưa đăng ký lớp học này', 404);
    }

    const classDoc: any = (enrollment as any).class;
    // Sĩ số: ưu tiên counter `currentEnrollment` (được cập nhật khi ghi danh),
    // fallback `currentStudents` cho dữ liệu seed cũ.
    const enrollmentCount =
      classDoc?.currentEnrollment ?? classDoc?.currentStudents ?? 0;
    // Phải dùng toObject() — spread trực tiếp trên document Mongoose sẽ chỉ
    // lấy các thuộc tính nội bộ ($__, _doc, ...) chứ không lấy field dữ liệu.
    const classPlain =
      typeof classDoc?.toObject === 'function' ? classDoc.toObject() : { ...classDoc };

    res.json({
      success: true,
      message: 'Lấy chi tiết lớp học thành công',
      data: {
        class: {
          _id: classPlain._id,
          enrollmentId: enrollment._id,
          class: {
            ...classPlain,
            currentStudents: enrollmentCount,
            currentEnrollment: enrollmentCount,
          },
          status: enrollment.status,
          enrollmentStatus: enrollment.status,
          tuitionStatus: enrollment.tuitionStatus,
          enrollmentDate: enrollment.enrollmentDate,
        },
      },
    });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy chi tiết lớp học',
    });
  }
};

// =====================================================
//  GET /api/student/classes/:id/assignments
// =====================================================
export const getAssignments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = requireUser(req);
    const { id } = req.params;
    if (!isValidId(id)) throw createError('ID lớp học không hợp lệ', 400);

    const enrolled = await Enrollment.exists({ student: user._id, class: id, status: 'ENROLLED' });
    if (!enrolled) throw createError('Bạn chưa đăng ký lớp học này', 403);

    // Chỉ hiển thị bài tập đã công bố. Chấp nhận cả 'ACTIVE' vì dữ liệu
    // seed cũ dùng giá trị này thay cho 'PUBLISHED'.
    const assignments = await Assignment.find({
      class: id,
      status: { $in: ['PUBLISHED', 'ACTIVE'] },
    }).sort({ dueDate: 1 });

    const submissions = await Submission.find({
      student: user._id,
      assignment: { $in: assignments.map((a) => a._id) },
    });

    const submissionMap = new Map<string, any>();
    submissions.forEach((s: any) => {
      submissionMap.set(s.assignment.toString(), s);
    });

    const enriched = assignments.map((a: any) => {
      const sub = submissionMap.get(a._id.toString());
      let submissionStatus: 'PENDING' | 'SUBMITTED' | 'LATE' | 'GRADED' | null = null;
      if (sub) {
        if (sub.grade !== undefined && sub.grade !== null) submissionStatus = 'GRADED';
        else if (sub.status === 'LATE') submissionStatus = 'LATE';
        else submissionStatus = 'SUBMITTED';
      }
      return {
        _id: a._id,
        class: a.class,
        teacher: a.teacher,
        title: a.title,
        description: a.description,
        skill: a.skill,
        dueDate: a.dueDate,
        status: a.status,
        maxScore: a.maxScore,
        attachments: a.attachments,
        submissionStatus,
        submissionId: sub?._id,
        submissionTime: sub?.submissionTime,
        grade: sub?.grade,
        feedback: sub?.feedback,
      };
    });

    res.json({
      success: true,
      message: 'Lấy danh sách bài tập thành công',
      data: { assignments: enriched },
    });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy bài tập',
    });
  }
};

// =====================================================
//  GET /api/student/classes/:id/attendance
// =====================================================
export const getAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = requireUser(req);
    const { id } = req.params;
    if (!isValidId(id)) throw createError('ID lớp học không hợp lệ', 400);

    const enrolled = await Enrollment.exists({ student: user._id, class: id, status: 'ENROLLED' });
    if (!enrolled) throw createError('Bạn chưa đăng ký lớp học này', 403);

    const records = await Attendance.find({
      class: id,
      student: user._id,
    }).sort({ sessionDate: -1 });

    const stats = {
      total: records.length,
      present: records.filter((r) => r.status === 'PRESENT').length,
      absent: records.filter((r) => r.status === 'ABSENT').length,
      late: records.filter((r) => r.status === 'LATE').length,
      excused: records.filter((r) => r.status === 'EXCUSED').length,
      rate: records.length
        ? Math.round((records.filter((r) => r.status === 'PRESENT').length / records.length) * 100)
        : 0,
    };

    res.json({
      success: true,
      message: 'Lấy dữ liệu điểm danh thành công',
      data: { attendance: records, stats },
    });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy điểm danh',
    });
  }
};

// =====================================================
//  GET /api/student/classes/:id/grades
// =====================================================
export const getGrades = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = requireUser(req);
    const { id } = req.params;
    if (!isValidId(id)) throw createError('ID lớp học không hợp lệ', 400);

    const enrolled = await Enrollment.exists({ student: user._id, class: id, status: 'ENROLLED' });
    if (!enrolled) throw createError('Bạn chưa đăng ký lớp học này', 403);

    const grades = await Grade.find({
      class: id,
      student: user._id,
      // Chỉ hiển thị điểm đã công bố, không lộ điểm nháp của giáo viên
      status: 'PUBLISHED',
    })
      .populate('teacher', 'fullName email')
      .sort({ testDate: -1 });

    const byType: Record<string, number> = {};
    grades.forEach((g: any) => {
      byType[g.evaluationType] = (byType[g.evaluationType] || 0) + 1;
    });

    res.json({
      success: true,
      message: 'Lấy bảng điểm thành công',
      data: { grades, stats: { total: grades.length, byType } },
    });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy điểm',
    });
  }
};

// =====================================================
//  GET /api/student/schedule/all  (M6)
//  Combined schedule across all my enrolled classes
// =====================================================
export const getCombinedSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = requireUser(req);

    const enrollments = await Enrollment.find({
      student: user._id,
      status: { $ne: 'DROPPED' },
    })
      .populate({
        path: 'class',
        populate: [
          { path: 'course', select: 'code title' },
          { path: 'teacher', select: 'fullName' },
        ],
      });

    const classIds = enrollments
      .map((e: any) => e.class?._id)
      .filter(Boolean);

    const schedule = await ClassSchedule.find({
      class: { $in: classIds },
      // Chỉ lấy lịch đang hoạt động
      status: 'ACTIVE',
    })
      .populate({
        path: 'class',
        select: 'classCode room',
        populate: { path: 'course', select: 'code title' },
      })
      .sort({ dayOfWeek: 1, startTime: 1 });

    // Fallback: nếu bảng ClassSchedule chưa có dữ liệu, dựng lịch từ
    // class.scheduleDays + class.timeSlot (dữ liệu lớp học hiện có trong seed).
    let scheduleList: any[] = schedule;
    if (!scheduleList.length) {
      const timeParts = (slot?: string) => {
        const [s, e] = (slot || '').split('-').map((x) => x.trim());
        return { startTime: s || '', endTime: e || '' };
      };

      scheduleList = enrollments
        .filter((e: any) => e.class?.status !== 'CANCELLED')
        .flatMap((e: any) => {
          const days: string[] = e.class?.scheduleDays || [];
          if (!days.length) return [];
          const { startTime, endTime } = timeParts(e.class?.timeSlot);
          const clsPlain =
            typeof e.class?.toObject === 'function'
              ? e.class.toObject()
              : { ...e.class };
          return days.map((day: string) => ({
            _id: `${e.class._id}-${day}`,
            class: clsPlain,
            dayOfWeek: day,
            startTime,
            endTime,
            classroom: e.class?.room || '',
            room: e.class?.room || '',
            status: 'ACTIVE',
          }));
        });
    }

    res.json({
      success: true,
      message: 'Lấy lịch học tổng hợp thành công',
      data: { schedule: scheduleList, classCount: classIds.length },
    });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy lịch học tổng hợp',
    });
  }
};

// =====================================================
//  GET /api/student/classes/:id/schedule
// =====================================================
export const getSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = requireUser(req);
    const { id } = req.params;
    if (!isValidId(id)) throw createError('ID lớp học không hợp lệ', 400);

    const enrolled = await Enrollment.exists({ student: user._id, class: id, status: 'ENROLLED' });
    if (!enrolled) throw createError('Bạn chưa đăng ký lớp học này', 403);

    const classDoc = await Class.findById(id).select('scheduleDays timeSlot room classCode status');
    const schedule = await ClassSchedule.find({ class: id, status: 'ACTIVE' }).sort({
      dayOfWeek: 1,
      startTime: 1,
    });

    // Fallback khi bảng ClassSchedule chưa có dữ liệu cho lớp này
    let scheduleList: any[] = schedule;
    if (!scheduleList.length && classDoc?.scheduleDays?.length) {
      const [s, e] = (classDoc.timeSlot || '').split('-').map((x) => x.trim());
      const clsPlain =
        typeof classDoc.toObject === 'function'
          ? classDoc.toObject()
          : { ...classDoc };
      scheduleList = (classDoc.scheduleDays as string[]).map((day: string) => ({
        _id: `${id}-${day}`,
        class: clsPlain,
        dayOfWeek: day,
        startTime: s || '',
        endTime: e || '',
        classroom: classDoc.room || '',
        room: classDoc.room || '',
        status: 'ACTIVE',
      }));
    }

    res.json({
      success: true,
      message: 'Lấy lịch học thành công',
      data: { schedule: scheduleList },
    });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy lịch học',
    });
  }
};

// =====================================================
//  GET /api/student/payments
// =====================================================
export const getPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = requireUser(req);

    const payments = await Payment.find({ student: user._id })
      // Model Payment không có field `class` — lớp học nằm ở enrollment.class
      .populate({
        path: 'enrollment',
        select: 'class',
        populate: {
          path: 'class',
          select: 'classCode room',
          populate: { path: 'course', select: 'code title' },
        },
      })
      .populate({
        path: 'course',
        select: 'code title',
      })
      .sort({ createdAt: -1 });

    const totalPaid = payments
      .filter((p) => p.status === 'SUCCESS')
      .reduce((sum, p) => sum + p.amount, 0);
    const totalPending = payments
      .filter((p) => p.status === 'PENDING')
      .reduce((sum, p) => sum + p.amount, 0);

    // Chuẩn hoá output: expose `class` (từ enrollment.class) để frontend
    // hiển thị mã lớp + tên khóa học một cách nhất quán.
    // Dùng toObject() vì spread trực tiếp trên document Mongoose sẽ chỉ lấy
    // thuộc tính nội bộ chứ không lấy field dữ liệu.
    const normalizedPayments = payments.map((p: any) => {
      const plain =
        typeof p.toObject === 'function' ? p.toObject() : { ...p };
      const enrollment = plain.enrollment;
      delete plain.enrollment;
      return {
        ...plain,
        class: enrollment?.class ?? null,
        enrollmentId: enrollment?._id ?? null,
      };
    });

    res.json({
      success: true,
      message: 'Lấy lịch sử thanh toán thành công',
      data: {
        payments: normalizedPayments,
        stats: {
          total: normalizedPayments.length,
          paidCount: normalizedPayments.filter((p: any) => p.status === 'SUCCESS').length,
          pendingCount: normalizedPayments.filter((p: any) => p.status === 'PENDING').length,
          failedCount: normalizedPayments.filter((p: any) => p.status === 'FAILED').length,
          refundedCount: normalizedPayments.filter((p: any) => p.status === 'REFUNDED').length,
          totalPaid,
          totalPending,
        },
      },
    });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy lịch sử thanh toán',
    });
  }
};

// =====================================================
//  GET /api/student/tuition
//  Danh sách học phí theo từng lớp đã ghi danh.
//  Nguồn trạng thái: Enrollment.tuitionStatus (PAID / PENDING / REFUNDED).
// =====================================================
export const getTuition = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = requireUser(req);

    const enrollments = await Enrollment.find({
      student: user._id,
      status: { $ne: 'DROPPED' },
    })
      .populate({
        path: 'class',
        populate: [
          { path: 'course', select: 'code title description durationWeeks sessions tuitionFee' },
          { path: 'teacher', select: 'fullName email phone avatarUrl' },
        ],
      })
      .sort({ createdAt: -1 });

    const items = enrollments
      .filter((e: any) => e.class)
      .map((e: any) => {
        const cls = e.class;
        const course = cls.course;
        const tuitionFee = course?.tuitionFee ?? 0;
        const tuitionStatus = e.tuitionStatus ?? 'PENDING';

        // Giao dịch thanh toán gần nhất (nếu có) để hiển thị mã giao dịch / ngày.
        return {
          enrollmentId: e._id.toString(),
          classId: cls._id.toString(),
          classCode: cls.classCode,
          room: cls.room,
          scheduleDays: cls.scheduleDays,
          timeSlot: cls.timeSlot,
          startDate: cls.startDate,
          endDate: cls.endDate,
          course: course
            ? {
                _id: course._id,
                code: course.code,
                title: course.title,
                description: course.description,
                durationWeeks: course.durationWeeks,
                sessions: course.sessions,
                tuitionFee: course.tuitionFee,
              }
            : null,
          teacher: cls.teacher
            ? {
                _id: cls.teacher._id,
                fullName: cls.teacher.fullName,
                email: cls.teacher.email,
                phone: cls.teacher.phone,
                avatarUrl: cls.teacher.avatarUrl,
              }
            : null,
          tuitionFee,
          tuitionStatus,
          enrollmentStatus: e.status,
          enrollmentDate: e.enrollmentDate,
        };
      });

    // Gắn giao dịch thanh toán tương ứng cho từng khoản học phí.
    const payments = await Payment.find({
      student: user._id,
      enrollment: { $in: items.map((i: any) => i.enrollmentId) },
    }).sort({ createdAt: -1 });

    const withPayments = items.map((item: any) => {
      const related = payments
        .filter((p: any) => p.enrollment?.toString() === item.enrollmentId)
        .map((p: any) => ({
          _id: p._id,
          amount: p.amount,
          method: p.method,
          transactionCode: p.transactionCode,
          status: p.status,
          paymentDate: p.paymentDate,
          createdAt: p.createdAt,
        }));
      return { ...item, payments: related };
    });

    const paidItems = withPayments.filter((i: any) => i.tuitionStatus === 'PAID');
    const pendingItems = withPayments.filter((i: any) => i.tuitionStatus === 'PENDING');
    const refundedItems = withPayments.filter((i: any) => i.tuitionStatus === 'REFUNDED');

    res.json({
      success: true,
      message: 'Lấy danh sách học phí thành công',
      data: {
        items: withPayments,
        stats: {
          total: withPayments.length,
          paidCount: paidItems.length,
          pendingCount: pendingItems.length,
          refundedCount: refundedItems.length,
          totalPaid: paidItems.reduce((s: number, i: any) => s + (i.tuitionFee || 0), 0),
          totalPending: pendingItems.reduce((s: number, i: any) => s + (i.tuitionFee || 0), 0),
          totalRefunded: refundedItems.reduce((s: number, i: any) => s + (i.tuitionFee || 0), 0),
        },
      },
    });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy danh sách học phí',
    });
  }
};

// =====================================================
//  POST /api/student/tuition/:enrollmentId/pay
//  Thanh toán học phí (mô phỏng): tạo giao dịch Payment SUCCESS
//  và cập nhật Enrollment.tuitionStatus = 'PAID'.
// =====================================================
export const payTuition = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = requireUser(req);
    const { enrollmentId } = req.params;
    if (!enrollmentId || !isValidId(enrollmentId)) {
      throw createError('ID ghi danh không hợp lệ', 400);
    }

    const enrollment = await Enrollment.findOne({
      _id: enrollmentId,
      student: user._id,
      status: { $ne: 'DROPPED' },
    }).populate({
      path: 'class',
      populate: { path: 'course', select: 'code title tuitionFee' },
    });

    if (!enrollment) {
      throw createError('Không tìm thấy lớp học đã ghi danh', 404);
    }

    const cls: any = (enrollment as any).class;
    const course = cls?.course;
    const amount = course?.tuitionFee ?? 0;
    if (amount <= 0) {
      throw createError('Lớp học này không có học phí để thanh toán', 400);
    }

    const method = (req.body?.method as string) || 'VNPAY';
    const VALID_METHODS = ['VNPAY', 'BANK_TRANSFER', 'CASH', 'CREDIT_CARD'];
    if (!VALID_METHODS.includes(method)) {
      throw createError('Phương thức thanh toán không hợp lệ', 400);
    }

    // ── Bước 1: Claim quyền thanh toán bằng ATOMIC update có điều kiện ──
    // Chỉ request nào thực sự chuyển được trạng thái sang PAID mới được tiếp tục.
    // Nếu 2 request chạy đồng thời, chỉ 1 request có modifiedCount = 1, request
    // còn lại bị chặn 409 → không tạo giao dịch trùng.
    const claimed = await Enrollment.updateOne(
      {
        _id: enrollment._id,
        student: user._id,
        status: { $ne: 'DROPPED' },
        tuitionStatus: { $ne: 'PAID' },
      },
      { $set: { tuitionStatus: 'PAID' } }
    );

    if (claimed.modifiedCount === 0) {
      throw createError('Bạn đã thanh toán học phí lớp học này rồi', 409);
    }

    // Tạo mã giao dịch duy nhất.
    const transactionCode = `EDU-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)
      .toUpperCase()}`;

    let payment;
    try {
      // Nếu enrollment đã có hóa đơn PENDING (hóa đơn tạo sẵn khi ghi danh),
      // thì thanh toán chính hóa đơn đó thay vì tạo hóa đơn mới — tránh
      // trùng lặp và giữ đúng mô hình "1 hóa đơn / 1 khoản học phí".
      const existingInvoice = await Payment.findOne({
        enrollment: enrollment._id,
        status: { $ne: 'SUCCESS' },
      }).sort({ createdAt: 1 });

      if (existingInvoice) {
        existingInvoice.status = 'SUCCESS';
        existingInvoice.amount = amount;
        existingInvoice.method = method as any;
        existingInvoice.transactionCode = transactionCode;
        existingInvoice.paymentDate = new Date();
        existingInvoice.note = 'Thanh toán học phí trực tuyến';
        await existingInvoice.save();
        payment = existingInvoice;
      } else {
        payment = await Payment.create({
          student: user._id,
          enrollment: enrollment._id,
          course: course?._id,
          amount,
          method,
          transactionCode,
          status: 'SUCCESS',
          paymentDate: new Date(),
          note: 'Thanh toán học phí trực tuyến',
        });
      }
    } catch (createErr: any) {
      // Tạo giao dịch thất bại → hoàn tác trạng thái để không "mất tiền".
      await Enrollment.updateOne(
        { _id: enrollment._id, tuitionStatus: 'PAID' },
        { $set: { tuitionStatus: enrollment.tuitionStatus || 'PENDING' } }
      );
      throw createErr;
    }

    res.status(201).json({
      success: true,
      message: 'Thanh toán học phí thành công',
      data: {
        payment: {
          _id: payment._id,
          amount: payment.amount,
          method: payment.method,
          transactionCode: payment.transactionCode,
          status: payment.status,
          paymentDate: payment.paymentDate,
        },
        enrollmentId: enrollment._id.toString(),
        tuitionStatus: 'PAID',
      },
    });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    if (error.code === 11000) {
      res.status(409).json({
        success: false,
        message: 'Mã giao dịch đã tồn tại, vui lòng thử lại',
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi thanh toán học phí',
    });
  }
};

// =====================================================
//  GET /api/student/requests
// =====================================================
export const getChangeRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = requireUser(req);

    const requests = await ChangeRequest.find({ student: user._id })
      .populate('currentClass', 'classCode')
      .populate('targetClass', 'classCode')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Lấy danh sách yêu cầu thành công',
      data: { requests },
    });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy yêu cầu',
    });
  }
};

// =====================================================
//  POST /api/student/requests
// =====================================================
export const createChangeRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = requireUser(req);
    const {
      requestType,
      type,
      currentClass,
      targetClass,
      currentSchedule,
      targetSchedule,
      reason,
    } = req.body;

    // Frontend gửi `requestType`; giữ fallback `type` cho tương thích ngược.
    const resolvedType = requestType || type;
    const VALID_TYPES = ['CLASS_CHANGE', 'SCHEDULE_CHANGE', 'TEACHER_SCHEDULE_CHANGE'];
    if (!resolvedType || !VALID_TYPES.includes(resolvedType)) {
      throw createError('Loại yêu cầu không hợp lệ', 400);
    }
    if (!reason || reason.trim().length < 5) {
      throw createError('Lý do phải có ít nhất 5 ký tự', 400);
    }
    if (!currentClass || !isValidId(currentClass)) {
      throw createError('Vui lòng chọn lớp học hiện tại', 400);
    }

    // Lớp hiện tại phải là lớp học viên thực sự đang theo học.
    const enrolled = await Enrollment.exists({
      student: user._id,
      class: currentClass,
      status: 'ENROLLED',
    });
    if (!enrolled) {
      throw createError('Bạn không đang theo học lớp này', 403);
    }

    const payload: any = {
      student: user._id,
      requesterRole: 'STUDENT',
      requestType: resolvedType,
      currentClass,
      reason: reason.trim(),
      status: 'PENDING',
    };

    if (targetClass && isValidId(targetClass)) {
      const targetEnrolled = await Enrollment.exists({
        student: user._id,
        class: targetClass,
        status: 'ENROLLED',
      });
      // Cho phép chuyển sang lớp chưa đăng ký (staff sẽ xử lý đăng ký sau).
      if (!targetEnrolled && resolvedType !== 'CLASS_CHANGE') {
        throw createError('Lớp mong muốn không hợp lệ', 400);
      }
      payload.targetClass = targetClass;
    }
    if (resolvedType === 'SCHEDULE_CHANGE' && !targetSchedule) {
      throw createError('Vui lòng nhập lịch học mong muốn', 400);
    }
    if (currentSchedule) payload.currentSchedule = currentSchedule.trim();
    if (targetSchedule) payload.targetSchedule = targetSchedule.trim();

    const request = await ChangeRequest.create(payload);

    res.status(201).json({
      success: true,
      message: 'Tạo yêu cầu thành công. Vui lòng chờ nhân viên xử lý.',
      data: { request },
    });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    if (error.name === 'ValidationError') {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi tạo yêu cầu',
    });
  }
};

// =====================================================
//  DELETE /api/student/requests/:id  (M3)
//  Student cancels their own PENDING change request
// =====================================================
export const cancelChangeRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = requireUser(req);
    const { id } = req.params;
    if (!isValidId(id)) throw createError('ID yêu cầu không hợp lệ', 400);

    const request = await ChangeRequest.findOne({ _id: id, student: user._id });
    if (!request) {
      throw createError('Không tìm thấy yêu cầu hoặc bạn không có quyền hủy', 404);
    }
    if (request.status !== 'PENDING') {
      throw createError(
        `Không thể hủy yêu cầu đã được ${request.status === 'APPROVED' ? 'duyệt' : 'từ chối'}`,
        400
      );
    }

    await ChangeRequest.deleteOne({ _id: id });

    res.status(200).json({
      success: true,
      message: 'Đã hủy yêu cầu thành công',
    });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi hủy yêu cầu',
    });
  }
};

// =====================================================
//  POST /api/student/assignments/:id/submit
// =====================================================
export const submitAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = requireUser(req);
    const { id } = req.params;
    if (!isValidId(id)) throw createError('ID bài tập không hợp lệ', 400);

    const assignment = await Assignment.findById(id);
    if (!assignment) throw createError('Không tìm thấy bài tập', 404);

    if (assignment.status === 'CLOSED') {
      throw createError('Bài tập đã đóng, không thể nộp', 400);
    }
    // Bài nháp chưa công bố — học viên không được nộp.
    if (assignment.status === 'DRAFT') {
      throw createError('Bài tập chưa được công bố, không thể nộp', 400);
    }

    const enrolled = await Enrollment.exists({
      student: user._id,
      class: assignment.class,
      status: 'ENROLLED',
    });
    if (!enrolled) throw createError('Bạn chưa đăng ký lớp học của bài tập này', 403);

    const { content, notes } = req.body;
    let attachmentUrl = (req.body && (req.body.attachmentUrl || req.body.fileUrl)) || '';

    const file = (req as any).file;
    if (file) {
      attachmentUrl = `/uploads/submissions/${file.filename}`;
    }

    const existing = await Submission.findOne({ assignment: id, student: user._id });
    const isLate = new Date() > new Date(assignment.dueDate);
    const status = isLate ? 'LATE' : 'SUBMITTED';

    let submission;
    if (existing) {
      existing.content = content || notes || existing.content;
      if (attachmentUrl) existing.attachments = [attachmentUrl];
      existing.submissionTime = new Date();
      existing.status = status;
      // Học viên nộp lại bài đã được chấm → bài cũ bị thay thế,
      // phải xoá điểm/nhận xét cũ để không hiển thị sai kết quả.
      existing.grade = undefined;
      existing.feedback = '';
      existing.criteria = undefined;
      existing.gradedBy = undefined;
      await existing.save();
      submission = existing;
    } else {
      submission = await Submission.create({
        assignment: id,
        student: user._id,
        content: content || notes || '',
        attachments: attachmentUrl ? [attachmentUrl] : [],
        submissionTime: new Date(),
        status,
      });
    }

    res.status(existing ? 200 : 201).json({
      success: true,
      message: isLate ? 'Đã nộp bài (trễ hạn)' : 'Nộp bài thành công',
      data: { submission },
    });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    if (error.code === 11000) {
      res.status(409).json({ success: false, message: 'Bạn đã nộp bài tập này rồi' });
      return;
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi nộp bài',
    });
  }
};

// =====================================================
//  GET /api/student/dashboard
// =====================================================
export const getDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = requireUser(req);

    const [enrollments, payments, requests] = await Promise.all([
      Enrollment.find({ student: user._id, status: { $ne: 'DROPPED' } })
        .populate({
          path: 'class',
          populate: [
            { path: 'course', select: 'code title' },
            { path: 'teacher', select: 'fullName email' },
          ],
        })
        .sort({ createdAt: -1 }),
      Payment.find({ student: user._id }).sort({ createdAt: -1 }).limit(10),
      ChangeRequest.find({ student: user._id, status: 'PENDING' }).countDocuments(),
    ]);

    const currentClass = enrollments.find((e: any) => e.class) || null;

    // Bài tập phải được tính trên TẤT CẢ lớp học viên đang theo học.
    const classIds = enrollments
      .map((e: any) => e.class?._id)
      .filter(Boolean);

    let pendingAssignments = 0;
    let totalAssignments = 0;
    if (classIds.length > 0) {
      const aList = await Assignment.find({
        class: { $in: classIds },
        // Không tính bài nháp; 'ACTIVE' là giá trị của dữ liệu seed cũ
        status: { $in: ['PUBLISHED', 'ACTIVE'] },
      });
      totalAssignments = aList.length;
      const submitted = await Submission.find({
        student: user._id,
        assignment: { $in: aList.map((a) => a._id) },
      }).select('assignment');
      const submittedSet = new Set(submitted.map((s) => s.assignment.toString()));
      pendingAssignments = aList.filter((a) => !submittedSet.has(a._id.toString())).length;
    }

    const tuitionPaid = payments
      .filter((p) => p.status === 'SUCCESS')
      .reduce((sum, p) => sum + p.amount, 0);
    const tuitionPending = payments
      .filter((p) => p.status === 'PENDING')
      .reduce((sum, p) => sum + p.amount, 0);

    res.json({
      success: true,
      message: 'Lấy dữ liệu dashboard thành công',
      data: {
        stats: {
          totalClasses: enrollments.length,
          pendingAssignments,
          totalAssignments,
          pendingRequests: requests,
          tuitionPaid,
          tuitionPending,
        },
        currentClass: currentClass
          ? {
              enrollmentId: (currentClass as any)._id,
              class: (currentClass as any).class,
              status: (currentClass as any).status,
              tuitionStatus: (currentClass as any).tuitionStatus,
              enrollmentDate: (currentClass as any).enrollmentDate,
            }
          : null,
        myClasses: enrollments
          .filter((e: any) => e.class)
          .map((e: any) => ({
            _id: e._id,
            enrollmentId: e._id,
            class: e.class,
            status: e.status,
            tuitionStatus: e.tuitionStatus,
            enrollmentDate: e.enrollmentDate,
          })),
      },
    });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy dashboard',
    });
  }
};

// =====================================================
//  GET /api/student/profile
// =====================================================
export const getMyProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = requireUser(req);
    const { Student } = await import('../models/student.model');

    const student = await Student.findOne({ user: user._id });

    res.json({
      success: true,
      message: 'Lấy thông tin cá nhân thành công',
      data: {
        user: {
          _id: user._id,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          address: user.address,
          dob: user.dob,
          role: user.role,
          status: user.status,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt,
        },
        student: student
          ? {
              studentCode: student.studentCode,
              dob: student.dob,
              currentBand: student.currentBand,
              targetBand: student.targetBand,
              learningGoal: student.learningGoal,
              emergencyContact: student.emergencyContact,
              status: student.status,
            }
          : null,
      },
    });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy thông tin cá nhân',
    });
  }
};

// =====================================================
//  GET /api/student/notifications  (M4)
// =====================================================
export const getMyNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = requireUser(req);
    const limit = Math.min(parseInt((req.query.limit as string) || '50', 10), 100);

    const items = await Notification.find({ recipient: user._id })
      .sort({ createdAt: -1 })
      .limit(limit);

    const unreadCount = await Notification.countDocuments({
      recipient: user._id,
      isRead: false,
    });

    res.json({
      success: true,
      message: 'Lấy danh sách thông báo thành công',
      data: { items, unreadCount },
    });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy thông báo',
    });
  }
};

// =====================================================
//  PATCH /api/student/notifications/:id/read  (M4)
// =====================================================
export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = requireUser(req);
    const { id } = req.params;
    if (!isValidId(id)) throw createError('ID thông báo không hợp lệ', 400);

    const noti = await Notification.findOne({ _id: id, recipient: user._id });
    if (!noti) {
      throw createError('Không tìm thấy thông báo', 404);
    }
    if (!noti.isRead) {
      noti.isRead = true;
      await noti.save();
    }
    res.json({ success: true, message: 'Đã đánh dấu đã đọc' });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi cập nhật thông báo',
    });
  }
};

// =====================================================
//  PATCH /api/student/notifications/read-all  (M4)
// =====================================================
export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = requireUser(req);
    const result = await Notification.updateMany(
      { recipient: user._id, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({
      success: true,
      message: `Đã đánh dấu ${result.modifiedCount} thông báo là đã đọc`,
      data: { modified: result.modifiedCount },
    });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi cập nhật thông báo',
    });
  }
};

// =====================================================
//  DELETE /api/student/notifications/:id  (M4)
// =====================================================
export const deleteNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = requireUser(req);
    const { id } = req.params;
    if (!isValidId(id)) throw createError('ID thông báo không hợp lệ', 400);

    const result = await Notification.deleteOne({ _id: id, recipient: user._id });
    if (result.deletedCount === 0) {
      throw createError('Không tìm thấy thông báo', 404);
    }
    res.json({ success: true, message: 'Đã xóa thông báo' });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi xóa thông báo',
    });
  }
};
