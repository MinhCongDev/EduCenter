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
import { User } from '../models/user.model';
import { notifyMany } from '../services/notification.service';
import {
  ACTIVE_ENROLLMENT_STATUSES,
  activeEnrollmentFilter,
  isActiveEnrollment,
} from '../utils/enrollment';

// =====================================================
//  Helpers
// =====================================================

const requireUser = (req: AuthRequest): NonNullable<AuthRequest['user']> => {
  if (!req.user) throw createError('Chưa xác thực', 401);
  return req.user;
};

const isValidId = (id: string): boolean => mongoose.Types.ObjectId.isValid(id);

/**
 * Đếm sĩ số THỰC TẾ của nhiều lớp cùng lúc.
 *
 * Lý do: counter `Class.currentEnrollment` là dữ liệu dẫn xuất (denormalised)
 * nên dễ lệch với dữ liệu seed cũ hoặc khi rút/ghi danh lại. Enrollment mới
 * là nguồn sự thật. Hàm trả về Map<classId, số học viên còn hiệu lực>.
 */
const getActiveCounts = async (
  classIds: (mongoose.Types.ObjectId | string)[]
): Promise<Map<string, number>> => {
  const result = new Map<string, number>();
  if (!classIds.length) return result;

  // PHẢI ép về ObjectId trước khi truyền vào aggregation.
  //
  // Lý do: trong pipeline `$match`, `class: { $in: [...] }` so sánh theo
  // kiểu BSON của từng phần tử. Nếu phần tử là chuỗi ('6adaf...') thì
  // không bao giờ khớp với field `class` kiểu ObjectId → luôn trả 0.
  // Đây là lý do trang Chi tiết lớp hiển thị "Sĩ số 0/20" trong khi lớp
  // thực tế có học viên (đường dẫn `/student/classes/:id` truyền `id`
  // dạng chuỗi từ `req.params`).
  const objectIds = classIds
    .map((id) => (id instanceof mongoose.Types.ObjectId ? id : new mongoose.Types.ObjectId(String(id))))
    .filter((id) => !id.toString().startsWith('000000000000000000000000'));
  if (!objectIds.length) return result;

  const rows = await Enrollment.aggregate([
    {
      $match: {
        class: { $in: objectIds },
        status: { $in: [...ACTIVE_ENROLLMENT_STATUSES] },
      },
    },
    { $group: { _id: '$class', count: { $sum: 1 } } },
  ]);

  rows.forEach((r: any) => {
    if (r?._id) result.set(r._id.toString(), r.count);
  });
  return result;
};

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

    const cls = await Class.findById(classId).populate('course', 'code title status');
    if (!cls) {
      throw createError('Không tìm thấy lớp học', 404);
    }
    // Chỉ lớp còn MỞ mới nhận đăng ký. Trước đây cho phép ghi danh vào
    // lớp IN_PROGRESS (đã khai giảng) — vi phạm nghiệp vụ vì học viên
    // bỏ lỡ các buổi đầu. Lớn CANCELLED/COMPLETED cũng phải bị chặn.
    if (cls.status !== 'OPEN') {
      throw createError(
        `Lớp học hiện không nhận đăng ký (trạng thái: ${cls.status})`,
        400
      );
    }
    // Lớp đã bắt đầu học (qua ngày startDate) cũng không nhận ghi danh mới.
    if (cls.startDate && new Date(cls.startDate).getTime() < Date.now()) {
      throw createError('Lớp học đã bắt đầu, không nhận đăng ký mới', 400);
    }
    // Khóa học nền tảng phải còn hoạt động thì lớp mới nhận ghi danh.
    const courseStatus = (cls.course as any)?.status;
    if (courseStatus && courseStatus !== 'ACTIVE') {
      throw createError('Khóa học của lớp này đã ngừng hoạt động', 400);
    }

    // Sĩ số thực tế được tính từ Enrollment (nguồn sự thật), không dựa vào
    // counter `currentEnrollment` vì counter có thể lệch với dữ liệu seed cũ.
    const activeCount = await Enrollment.countDocuments({
      class: classId,
      ...activeEnrollmentFilter(),
    });
    if (typeof cls.capacity === 'number' && activeCount >= cls.capacity) {
      throw createError('Lớp học đã đầy, không thể đăng ký', 400);
    }

    // Already enrolled?
    const existing = await Enrollment.findOne({
      student: user._id,
      class: classId,
    });
    if (existing && isActiveEnrollment(existing.status)) {
      throw createError('Bạn đã đăng ký lớp học này rồi', 409);
    }
    // Có enrollment PENDING (đang chờ duyệt) thì không tạo bản ghi mới.
    if (existing && existing.status === 'PENDING') {
      throw createError(
        'Bạn đang có yêu cầu ghi danh lớp này đang chờ phòng giáo vụ xử lý',
        409
      );
    }

    let enrollment;
    if (existing) {
      // Re-enroll một enrollment cũ đã DROPPED: lúc rút khỏi lớp, sĩ số đã
      // được trừ đi 1 nên khi ghi danh lại phải cộng lại (đồng bộ ở dưới).
      existing.status = 'ENROLLED';
      existing.enrollmentDate = new Date();
      existing.droppedAt = undefined;
      existing.tuitionStatus = 'PENDING';
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
    }

    // Đồng bộ counter sĩ số với số lượt ghi danh thực tế.
    await Class.updateOne(
      { _id: classId },
      { $set: { currentEnrollment: activeCount + 1 } }
    );

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
//  DELETE /api/student/enrollments/:id  (M7)
//  Học viên tự rút khỏi lớp học.
//  Quy tắc:
//   - Chỉ được rút khi enrollment còn hiệu lực (ENROLLED).
//   - Lớp phải chưa bắt đầu (status OPEN) — lớp đã IN_PROGRESS/đã khai giảng
//     thì học viên phải gửi yêu cầu đổi lớp để phòng giáo vụ xử lý.
//   - Học phí đã thanh toán không tự động hoàn lại: chuyển sang REFUNDED và
//     để phòng giáo vụ xử lý hoàn tiền.
// =====================================================
export const dropFromClass = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = requireUser(req);
    const { enrollmentId } = req.params;
    if (!enrollmentId || !isValidId(enrollmentId)) {
      throw createError('ID ghi danh không hợp lệ', 400);
    }

    const enrollment = await Enrollment.findOne({
      _id: enrollmentId,
      student: user._id,
    }).populate({
      path: 'class',
      populate: { path: 'course', select: 'code title' },
    });

    if (!enrollment) {
      throw createError('Không tìm thấy lớp học đã ghi danh', 404);
    }
    if (!isActiveEnrollment(enrollment.status)) {
      throw createError('Bạn không đang theo học lớp học này', 400);
    }

    const cls: any = (enrollment as any).class;
    if (cls?.status && cls.status !== 'OPEN') {
      throw createError(
        'Lớp học đã bắt đầu, bạn không thể tự rút. Vui lòng gửi yêu cầu đổi lớp.',
        400
      );
    }

    // ── Chuyển enrollment sang DROPPED (atomic) ──
    // Chỉ request thực sự chuyển được trạng thái mới được đi tiếp, tránh
    // trừ sĩ số hai lần khi 2 request chạy đồng thời.
    const dropped = await Enrollment.updateOne(
      {
        _id: enrollment._id,
        student: user._id,
        status: { $in: [...ACTIVE_ENROLLMENT_STATUSES] },
      },
      {
        $set: {
          status: 'DROPPED',
          droppedAt: new Date(),
          // Học phí đã trả không tự hoàn — đánh dấu REFUNDED để giáo vụ xử lý.
          tuitionStatus:
            enrollment.tuitionStatus === 'PAID' ? 'REFUNDED' : enrollment.tuitionStatus,
        },
      }
    );

    if (dropped.modifiedCount === 0) {
      throw createError('Bạn không đang theo học lớp học này', 400);
    }

    // ── Đồng bộ hóa đơn đã thanh toán sang REFUNDED ──
    // Enrollment.tuitionStatus = 'REFUNDED' nhưng Payment vẫn giữ
    // status = 'SUCCESS' sẽ khiến `getDashboard` (đếm Payment SUCCESS)
    // tiếp tục tính tiền đã hoàn vào "Học phí đã thanh toán", lệch với
    // `TuitionPage` (đếm theo Enrollment.tuitionStatus). Phải đồng bộ cả 2.
    if (enrollment.tuitionStatus === 'PAID') {
      await Payment.updateMany(
        { enrollment: enrollment._id, status: 'SUCCESS' },
        { $set: { status: 'REFUNDED' } }
      );
    }

    // Đồng bộ lại sĩ số lớp học với số enrollment còn hiệu lực.
    const activeCount = await Enrollment.countDocuments({
      class: enrollment.class?._id,
      ...activeEnrollmentFilter(),
    });
    if (enrollment.class?._id) {
      await Class.updateOne(
        { _id: enrollment.class._id },
        { $set: { currentEnrollment: activeCount } }
      );
    }

    res.json({
      success: true,
      message: 'Đã rút khỏi lớp học thành công',
      data: {
        enrollmentId: enrollment._id.toString(),
        status: 'DROPPED',
        tuitionStatus:
          enrollment.tuitionStatus === 'PAID' ? 'REFUNDED' : enrollment.tuitionStatus,
      },
    });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi rút khỏi lớp học',
    });
  }
};

// =====================================================
//  GET /api/student/open-classes
//  Danh sách lớp đang MỞ để học viên có thể tự ghi danh.
//
//  Trước đây endpoint `POST /api/student/enrollments` tồn tại nhưng không có
//  API nào trả về danh sách lớp mở → người học không biết có lớp nào để
//  đăng ký, tính năng ghi danh trở nên không dùng được.
//
//  Nguyên tắc:
//   - Chỉ lớp status = OPEN và khóa học ACTIVE.
//   - Lớp đã bắt đầu (startDate < now) không nhận ghi danh mới.
//   - Sĩ số đếm thật từ Enrollment (nguồn sự thật), không dựa vào counter.
// =====================================================
export const getOpenClasses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = requireUser(req);
    const { search, limit = 50 } = req.query;

    const now = new Date();
    const query: any = {
      status: 'OPEN',
      startDate: { $gte: now },
    };

    if (search && typeof search === 'string' && search.trim()) {
      // Phải escape ký tự đặc biệt của regex: nếu không, người dùng gõ
      // "(", "[", ".*" sẽ làm `new RegExp` ném lỗi → 500. `getTransferTargetClasses`
      // đã escape đúng, hai endpoint này phải giống nhau.
      const rx = new RegExp(
        search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i'
      );
      query.$or = [{ classCode: rx }, { name: rx }, { room: rx }];
    }

    const classes = await Class.find(query)
      .populate('course', 'code title description durationWeeks sessions tuitionFee status')
      .populate('teacher', 'fullName email phone avatarUrl')
      .sort({ startDate: 1 })
      .limit(Math.min(Math.max(1, Number(limit) || 50), 100));

    // Sĩ số thực tế + enrollment của chính học viên cho từng lớp.
    const classIds = classes.map((c: any) => c._id);
    const counts = await getActiveCounts(classIds);

    const myEnrollments = await Enrollment.find({
      student: user._id,
      class: { $in: classIds },
    }).select('class status');
    const mine = new Map<string, string>();
    myEnrollments.forEach((e: any) => {
      if (e.class) mine.set(e.class.toString(), e.status);
    });

    const items = classes
      .map((c: any) => {
        const current = counts.get(c._id.toString()) ?? 0;
        const myStatus = mine.get(c._id.toString());
        return {
          _id: c._id,
          classCode: c.classCode,
          name: c.name,
          room: c.room,
          scheduleDays: c.scheduleDays,
          timeSlot: c.timeSlot,
          startDate: c.startDate,
          endDate: c.endDate,
          capacity: c.capacity,
          currentStudents: current,
          currentEnrollment: current,
          seatsLeft: Math.max(0, (c.capacity ?? 0) - current),
          status: c.status,
          course: c.course,
          teacher: c.teacher,
          myEnrollmentStatus: myStatus || null,
          canEnroll: !myStatus && current < (c.capacity ?? 0),
        };
      })
      // Lớp học viên đã đăng ký (kể cả DROPPED) đưa xuống cuối để dễ tìm lớp mới.
      .sort((a: any, b: any) => Number(!!a.myEnrollmentStatus) - Number(!!b.myEnrollmentStatus));

    res.json({
      success: true,
      message: 'Lấy danh sách lớp đang mở thành công',
      data: { classes: items, total: items.length },
    });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy danh sách lớp đang mở',
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
      status: { $in: [...ACTIVE_ENROLLMENT_STATUSES] },
    })
      .populate({
        path: 'class',
        populate: [
          { path: 'course', select: 'code title description durationWeeks sessions tuitionFee' },
          { path: 'teacher', select: 'fullName email phone avatarUrl' },
        ],
      })
      .sort({ createdAt: -1 });

    // Sĩ số: đếm thật từ Enrollment (nguồn sự thật) thay vì dựa vào counter
    // `currentEnrollment` — counter có thể lệch với dữ liệu seed cũ.
    const classIds = enrollments.map((e: any) => e.class?._id).filter(Boolean);
    const counts = await getActiveCounts(classIds);

    const classes = enrollments
      .filter((e: any) => e.class)
      .map((e: any) => {
        const count = counts.get(e.class._id.toString()) ?? 0;
        return {
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
            currentStudents: count,
            currentEnrollment: count,
            sessions: e.class.sessions,
            status: e.class.status,
            course: e.class.course,
            teacher: e.class.teacher,
          },
          status: e.status,
          enrollmentStatus: e.status,
          tuitionStatus: e.tuitionStatus,
          enrollmentDate: e.enrollmentDate,
        };
      });

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
//  GET /api/student/transfer-target-classes
//  Danh sách lớp học viên có thể chuyển sang (lớp đích cho yêu cầu đổi lớp).
//
//  Vì sao cần endpoint riêng?
//  `GET /api/student/open-classes` chỉ trả về lớp `OPEN` chưa bắt đầu — đúng
//  cho TỰ GHI DANH. Nhưng yêu cầu đổi lớp giữa kỳ (nghỉ học, muốn vào lớp
//  đang chạy) cần chọn lớp `IN_PROGRESS`. Trước đây frontend dùng chung
//  danh sách open-classes cho cả hai mục đích nên học viên không chọn được
//  lớp đang học, và các yêu cầu đổi lớp hợp lệ bị chặn ở tầng nghiệp vụ.
//
//  Quy tắc:
//   - Lớp đích còn hoạt động (OPEN hoặc IN_PROGRESS), chưa CANCELLED/COMPLETED.
//   - Còn chỗ trống (sĩ số thật từ Enrollment).
//   - Loại bỏ lớp học viên đang theo học.
// =====================================================
export const getTransferTargetClasses = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const user = requireUser(req);
    const { search } = req.query;

    const query: any = {
      status: { $in: ['OPEN', 'IN_PROGRESS'] },
    };
    if (search && typeof search === 'string' && search.trim()) {
      const rx = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ classCode: rx }, { name: rx }, { room: rx }];
    }

    const classes = await Class.find(query)
      .populate('course', 'code title')
      .populate('teacher', 'fullName')
      .sort({ startDate: 1 })
      .limit(100);

    const classIds = classes.map((c: any) => c._id);
    const counts = await getActiveCounts(classIds);

    // Lớp học viên đang theo học → không thể chuyển sang chính nó.
    const myEnrollments = await Enrollment.find({
      student: user._id,
      class: { $in: classIds },
      ...activeEnrollmentFilter(),
    }).select('class');
    const myClassIds = new Set(myEnrollments.map((e: any) => e.class.toString()));

    const items = classes
      .map((c: any) => {
        const current = counts.get(c._id.toString()) ?? 0;
        return {
          _id: c._id,
          classCode: c.classCode,
          name: c.name,
          room: c.room,
          scheduleDays: c.scheduleDays,
          timeSlot: c.timeSlot,
          startDate: c.startDate,
          endDate: c.endDate,
          capacity: c.capacity,
          currentStudents: current,
          seatsLeft: Math.max(0, (c.capacity ?? 0) - current),
          status: c.status,
          course: c.course,
          teacher: c.teacher,
        };
      })
      .filter((c: any) => !myClassIds.has(c._id.toString()))
      .filter((c: any) => c.seatsLeft > 0);

    res.json({
      success: true,
      message: 'Lấy danh sách lớp có thể chuyển sang thành công',
      data: { classes: items, total: items.length },
    });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy danh sách lớp chuyển đổi',
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
      status: { $in: [...ACTIVE_ENROLLMENT_STATUSES] },
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
    // Sĩ số: đếm thật từ Enrollment (nguồn sự thật) thay vì counter
    // `currentEnrollment` — counter là dữ liệu dẫn xuất nên dễ lệch.
    const counts = await getActiveCounts([id]);
    const enrollmentCount = counts.get(id) ?? 0;
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

    const enrolled = await Enrollment.exists({ student: user._id, class: id, ...activeEnrollmentFilter() });
    if (!enrolled) throw createError('Bạn chưa đăng ký lớp học này', 403);

    // Chỉ hiển thị bài tập đã công bố (PUBLISHED) hoặc đã đóng (CLOSED).
    // Bài DRAFT (chưa công bố) thì học viên không được biết tới.
    //
    // Bài CLOSED vẫn phải hiện: nếu ẩn luôn, học viên sẽ mất toàn bộ lịch
    // sử bài đã nộp/đã được chấm khi giảng viên đóng bài — và số liệu
    // "đã nộp" trên dashboard sẽ tụt về 0. Bài CLOSED chỉ khác ở chỗ
    // không nộp lại được (backend chặn) chứ không xóa khỏi danh sách.
    const assignments = await Assignment.find({
      class: id,
      status: { $in: ['PUBLISHED', 'CLOSED'] },
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
      data: {
        assignments: enriched,
        // Danh sách kỹ năng thực tế đang có trong lớp — frontend dùng để dựng
        // bộ lọc động, nhờ vậy lọc luôn khớp với dữ liệu thật (seed ghi
        // 'Writing Task 2', 'Listening', 'Speaking Mock'... chứ không phải
        // một danh sách kỹ năng IELTS cố định hardcode).
        skills: Array.from(
          new Set(
            assignments
              .map((a: any) => (a.skill || '').trim())
              .filter((s: string) => s.length > 0)
          )
        ).sort((a: string, b: string) => a.localeCompare(b, 'vi')),
      },
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

    const enrolled = await Enrollment.exists({ student: user._id, class: id, ...activeEnrollmentFilter() });
    if (!enrolled) throw createError('Bạn chưa đăng ký lớp học này', 403);

    const records = await Attendance.find({
      class: id,
      student: user._id,
    }).sort({ sessionDate: -1 });

    const presentCount = records.filter((r) => r.status === 'PRESENT').length;
    const lateCount = records.filter((r) => r.status === 'LATE').length;
    const excusedCount = records.filter((r) => r.status === 'EXCUSED').length;

    // Tỷ lệ có mặt tính cả LATE — khớp với cách teacher.controller
    // tính attendanceRate cho danh sách học viên. Buổi "có phép" (EXCUSED)
    // vẫn tính vào tổng số buổi đã diễn ra.
    const attended = presentCount + lateCount;
    const stats = {
      total: records.length,
      present: presentCount,
      absent: records.filter((r) => r.status === 'ABSENT').length,
      late: lateCount,
      excused: excusedCount,
      attended,
      rate: records.length ? Math.round((attended / records.length) * 100) : 0,
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

    const enrolled = await Enrollment.exists({ student: user._id, class: id, ...activeEnrollmentFilter() });
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
      status: { $in: [...ACTIVE_ENROLLMENT_STATUSES] },
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
        // Cần `teacher` để dashboard hiển thị đúng giảng viên của buổi học
        // kế tiếp — trước đây UI lấy giảng viên của "lớp hiện tại" nên hiển
        // thị sai khi buổi kế tiếp thuộc lớp khác.
        select: 'classCode room',
        populate: [
          { path: 'course', select: 'code title' },
          { path: 'teacher', select: 'fullName' },
        ],
      })
      .sort({ dayOfWeek: 1, startTime: 1 });

    // ── Lịch chi tiết theo từng lớp ──
    // Bảng ClassSchedule là nguồn chuẩn, nhưng không phải lớp nào cũng có.
    // Vì vậy phải fallback **theo từng lớp**: lớp nào không có bản ghi
    // ClassSchedule thì dựng lịch từ class.scheduleDays + class.timeSlot.
    // (Cách cũ chỉ fallback khi bảng ClassSchedule rỗng HOÀN TOÀN, khiến
    // học viên học 2 lớp mà 1 lớp có lịch sẽ mất sạch lịch của lớp còn lại.)
    const timeParts = (slot?: string) => {
      const [s, e] = (slot || '').split('-').map((x) => x.trim());
      return { startTime: s || '', endTime: e || '' };
    };

    const scheduleByClass = new Map<string, any[]>();
    schedule.forEach((s: any) => {
      const key = s.class?._id?.toString();
      if (!key) return;
      const list = scheduleByClass.get(key) || [];
      list.push(s);
      scheduleByClass.set(key, list);
    });

    const scheduleList: any[] = [];
    enrollments
      .filter((e: any) => e.class && e.class.status !== 'CANCELLED')
      .forEach((e: any) => {
        const classId = e.class._id.toString();
        const fromTable = scheduleByClass.get(classId);
        if (fromTable && fromTable.length) {
          scheduleList.push(...fromTable);
          return;
        }
        // Fallback: dựng lịch từ thông tin lớp học.
        const days: string[] = e.class?.scheduleDays || [];
        if (!days.length) return;
        const { startTime, endTime } = timeParts(e.class?.timeSlot);
        const clsPlain =
          typeof e.class?.toObject === 'function' ? e.class.toObject() : { ...e.class };
        days.forEach((day: string) => {
          scheduleList.push({
            _id: `${classId}-${day}`,
            class: clsPlain,
            dayOfWeek: day,
            startTime,
            endTime,
            classroom: e.class?.room || '',
            room: e.class?.room || '',
            status: 'ACTIVE',
          });
        });
      });

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

    const enrolled = await Enrollment.exists({ student: user._id, class: id, ...activeEnrollmentFilter() });
    if (!enrolled) throw createError('Bạn chưa đăng ký lớp học này', 403);

    const classDoc = await Class.findById(id).select('scheduleDays timeSlot room classCode status');
    const schedule = await ClassSchedule.find({ class: id, status: 'ACTIVE' })
      .populate({
        path: 'class',
        select: 'classCode room timeSlot scheduleDays',
        populate: { path: 'course', select: 'code title' },
      })
      .sort({
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

    // Lấy cả enrollment DROPPED đã hoàn tiền (tuitionStatus = REFUNDED).
    //
    // Trước đây chỉ lấy enrollment còn hiệu lực → lớp đã rút (đã hoàn
    // tiền) biến mất khỏi danh sách → tab "Đã hoàn tiền" luôn hiển thị 0
    // và học viên không thấy khoản tiền đã được hoàn.
    const enrollments = await Enrollment.find({
      student: user._id,
      $or: [
        { status: { $in: [...ACTIVE_ENROLLMENT_STATUSES] } },
        { status: 'DROPPED', tuitionStatus: 'REFUNDED' },
      ],
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
      status: { $in: [...ACTIVE_ENROLLMENT_STATUSES] },
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
        status: { $in: [...ACTIVE_ENROLLMENT_STATUSES] },
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
      ...activeEnrollmentFilter(),
    });
    if (!enrolled) {
      throw createError('Bạn không đang theo học lớp này', 403);
    }

    // ── Chống gửi trùng yêu cầu ──
    // Học viên chỉ được có 1 yêu cầu PENDING cho mỗi lớp hiện tại. Nếu không
    // chặn, học viên bấm nhiều lần sẽ tạo nhiều phiếu trùng lặp và phòng
    // giáo vụ phải xử lý lặp lại.
    const duplicate = await ChangeRequest.exists({
      student: user._id,
      currentClass,
      requestType: resolvedType,
      status: 'PENDING',
    });
    if (duplicate) {
      throw createError(
        'Bạn đã có yêu cầu đang chờ duyệt cho lớp này. Vui lòng đợi kết quả xử lý.',
        409
      );
    }

    const payload: any = {
      student: user._id,
      requesterRole: 'STUDENT',
      requestType: resolvedType,
      currentClass,
      reason: reason.trim(),
      status: 'PENDING',
    };

    // ── Lớp đích (chỉ dùng cho yêu cầu đổi lớp) ──
    if (resolvedType === 'CLASS_CHANGE') {
      if (!targetClass || !isValidId(targetClass)) {
        throw createError('Vui lòng chọn lớp học mong muốn chuyển sang', 400);
      }
      if (targetClass === currentClass) {
        throw createError('Lớp mong muốn phải khác lớp hiện tại', 400);
      }
      // Lớp đích phải tồn tại và còn hoạt động — nếu không, yêu cầu sẽ
      // không bao giờ được duyệt và gây lãng phí cho phòng giáo vụ.
      //
      // Cho phép cả lớp `OPEN` lẫn `IN_PROGRESS`: yêu cầu đổi lớp giữa kỳ
      // (nghỉ học nên muốn vào lớp đang chạy) là tình huống rất phổ biến.
      // Chỉ chặn lớp đã kết thúc/hủy.
      const targetClassDoc = await Class.findById(targetClass).select('status startDate');
      if (!targetClassDoc) {
        throw createError('Lớp học mong muốn không tồn tại', 400);
      }
      if (!['OPEN', 'IN_PROGRESS'].includes(targetClassDoc.status)) {
        throw createError('Lớp học mong muốn không còn hoạt động', 400);
      }
      payload.targetClass = targetClass;
    } else if (targetClass && isValidId(targetClass)) {
      // Các loại yêu cầu khác: nếu có lớp đích thì lớp đó phải là lớp học
      // viên đang theo (dùng để đối chiếu khi giáo vụ duyệt).
      const targetEnrolled = await Enrollment.exists({
        student: user._id,
        class: targetClass,
        ...activeEnrollmentFilter(),
      });
      if (!targetEnrolled) {
        throw createError('Lớp mong muốn không hợp lệ', 400);
      }
      payload.targetClass = targetClass;
    }

    // ── Lịch mong muốn ──
    if (resolvedType === 'SCHEDULE_CHANGE' || resolvedType === 'TEACHER_SCHEDULE_CHANGE') {
      if (!targetSchedule || !targetSchedule.trim()) {
        throw createError('Vui lòng nhập lịch học mong muốn', 400);
      }
    }
    if (currentSchedule) payload.currentSchedule = currentSchedule.trim();
    if (targetSchedule) payload.targetSchedule = targetSchedule.trim();

    const request = await ChangeRequest.create(payload);

    // ── Thông báo cho phòng giáo vụ ──
    // Trước đây học viên gửi yêu cầu xong không ai biết → yêu cầu treo ở
    // PENDING vô thời hạn. Giờ phòng giáo vụ nhận được thông báo ngay.
    const staffUsers = await User.find({
      role: { $in: ['TRAINING_STAFF', 'DIRECTOR'] },
      status: 'ACTIVE',
    }).select('_id');
    if (staffUsers.length) {
      await notifyMany(staffUsers.map((s) => s._id), {
        type: 'INFO',
        title: '🔄 Yêu cầu thay đổi mới từ học viên',
        message: `Học viên ${user.fullName} vừa gửi yêu cầu ${
          resolvedType === 'CLASS_CHANGE' ? 'đổi lớp' : 'đổi lịch học'
        }. Lý do: ${reason.trim()}`,
        link: '/staff/requests',
      });
    }

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
      ...activeEnrollmentFilter(),
    });
    if (!enrolled) throw createError('Bạn chưa đăng ký lớp học của bài tập này', 403);

    const { content, notes } = req.body;
    let attachmentUrl = (req.body && (req.body.attachmentUrl || req.body.fileUrl)) || '';

    const file = (req as any).file;
    if (file) {
      attachmentUrl = `/uploads/submissions/${file.filename}`;
    }

    // Phải có ít nhất nội dung hoặc file đính kèm — nếu không, bài nộp rỗng
    // sẽ vào hệ thống và làm giảm số liệu "đã nộp" mà không có giá trị.
    const trimmedContent = (content || notes || '').trim();
    if (!trimmedContent && !attachmentUrl) {
      throw createError(
        'Vui lòng nhập nội dung hoặc đính kèm file bài làm',
        400
      );
    }

    const existing = await Submission.findOne({ assignment: id, student: user._id });

    // ── Chặn nộp lại bài đã được chấm ──
    // Nếu cho phép, học viên có thể nộp lại một bài đã được giảng viên chấm
    // để xoá điểm/nhận xét (nhánh `existing.grade = undefined` bên dưới).
    // Đây là lỗ hổng nghiệp vụ: điểm đã công bố phải được giữ nguyên.
    // Muốn chấm lại thì giảng viên chủ động chấm lại trong phần chấm bài.
    if (existing && existing.status === 'GRADED') {
      throw createError(
        'Bài tập này đã được chấm điểm. Bạn không thể nộp lại — vui lòng liên hệ giảng viên nếu cần chấm lại.',
        400
      );
    }

    const isLate = new Date() > new Date(assignment.dueDate);
    const status = isLate ? 'LATE' : 'SUBMITTED';

    let submission;
    if (existing) {
      existing.content = trimmedContent || existing.content;
      if (attachmentUrl) existing.attachments = [attachmentUrl];
      existing.submissionTime = new Date();
      existing.status = status;
      // Bài nộp lại (chưa được chấm) không có điểm/nhận xét cũ để xoá —
      // nhưng vẫn xoá cho chắc, phòng trường hợp dữ liệu cũ bị lệch.
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
        content: trimmedContent,
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

    const [enrollments, requests] = await Promise.all([
      // Chỉ tính các enrollment còn hiệu lực. Trước đây dùng
      // `status: { $ne: 'DROPPED' }` khiến enrollment PENDING (chờ duyệt)
      // cũng bị tính vào "lớp đang theo học" — lệch với getMyClasses.
      Enrollment.find({ student: user._id, ...activeEnrollmentFilter() })
        .populate({
          path: 'class',
          populate: [
            // Phải có `tuitionFee`: frontend tab "Khóa học của tôi" hiển thị
            // ô "Học phí" từ `course.tuitionFee`. Trước đây chỉ select
            // `code title` → giá trị undefined → ô trống.
            {
              path: 'course',
              select: 'code title description durationWeeks sessions tuitionFee',
            },
            { path: 'teacher', select: 'fullName email' },
          ],
        })
        .sort({ createdAt: -1 }),
      ChangeRequest.find({ student: user._id, status: 'PENDING' }).countDocuments(),
    ]);

    // "Lớp hiện tại" = lớp học viên đang học thực sự.
    // Ưu tiên enrollment ENROLLED; nếu đã học xong tất cả thì lấy lớp
    // COMPLETED gần nhất. Trước đây lấy bản ghi đầu tiên theo createdAt nên
    // có thể chọn nhầm lớp đã hoàn thành.
    const activeEnrollments = enrollments.filter(
      (e: any) => e.class && e.status === 'ENROLLED'
    );
    const fallbackEnrollments = enrollments.filter(
      (e: any) => e.class && e.status === 'COMPLETED'
    );
    const currentClass =
      activeEnrollments[0] || fallbackEnrollments[0] || null;

    // Bài tập phải được tính trên TẤT CẢ lớp học viên đang theo học.
    const classIds = enrollments
      .map((e: any) => e.class?._id)
      .filter(Boolean);

    let pendingAssignments = 0;
    let totalAssignments = 0;
    if (classIds.length > 0) {
      const aList = await Assignment.find({
        class: { $in: classIds },
        // Đồng bộ với `getAssignments`: gồm cả bài đã đóng (CLOSED).
        // Nếu chỉ tính PUBLISHED, số "bài chưa nộp" ở dashboard sẽ lệch với
        // danh sách bài tập mà học viên thấy trên trang Bài Tập.
        status: { $in: ['PUBLISHED', 'CLOSED'] },
      });
      totalAssignments = aList.length;
      const submitted = await Submission.find({
        student: user._id,
        assignment: { $in: aList.map((a) => a._id) },
      }).select('assignment');
      const submittedSet = new Set(submitted.map((s) => s.assignment.toString()));
      pendingAssignments = aList.filter((a) => !submittedSet.has(a._id.toString())).length;
    }

    // Học phí: lấy từ Enrollment.tuitionStatus + course.tuitionFee — cùng
    // nguồn sự thật với `getTuition` (trang Thanh toán khóa học).
    // Trước đây đếm từ Payment (status SUCCESS) nên lệch với TuitionPage:
    // lớp đã rút (REFUNDED) vẫn bị tính là "đã thanh toán", và giá trị trả
    // về là tiền THỰC trả chứ không phải học phí của các lớp đang theo học.
    const tuitionPaid = enrollments
      .filter((e: any) => e.tuitionStatus === 'PAID')
      .reduce(
        (sum, e: any) => sum + ((e.class as any)?.course?.tuitionFee ?? 0),
        0
      );
    const tuitionPending = enrollments
      .filter((e: any) => e.tuitionStatus === 'PENDING')
      .reduce(
        (sum, e: any) => sum + ((e.class as any)?.course?.tuitionFee ?? 0),
        0
      );

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
          preferences: user.preferences,
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
//  PUT /api/student/profile
//  Học viên tự cập nhật thông tin hồ sơ học viên (MỚI).
//
//  Phân tách bạch với `auth.updateProfile` (cập nhật thông tin User):
//   - User  : họ tên, SĐT, địa chỉ, ngày sinh, ảnh đại diện
//   - Student: band mục tiêu, mục tiêu học tập, người liên hệ khẩn cấp
//
//  `currentBand` là kết quả đánh giá của giảng viên nên KHÔNG cho học viên
//  tự sửa — chỉ giảng viên mới cập nhật được (xem teacher.controller).
// =====================================================
export const updateMyProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = requireUser(req);
    const { Student } = await import('../models/student.model');

    const { targetBand, learningGoal, emergencyContact } = req.body || {};

    const student = await Student.findOne({ user: user._id });
    if (!student) {
      throw createError('Không tìm thấy hồ sơ học viên', 404);
    }

    if (targetBand !== undefined) {
      // `null` = xoá band mục tiêu (học viên xoá ô nhập). Không gửi
      // field (undefined) = giữ nguyên giá trị cũ.
      if (targetBand === null || targetBand === '') {
        student.targetBand = null as any;
      } else {
        const band = Number(targetBand);
        if (Number.isNaN(band) || band < 0 || band > 9) {
          throw createError('Band mục tiêu phải trong khoảng 0 - 9', 400);
        }
        // Band mục tiêu không được thấp hơn band hiện tại — mục tiêu phải là
        // hướng phấn đấu, không phải hạ thấp kỳ vọng.
        const current = student.currentBand ?? 0;
        if (band > 0 && current > 0 && band < current) {
          throw createError(
            `Band mục tiêu không được thấp hơn band hiện tại (${current})`,
            400
          );
        }
        student.targetBand = band;
      }
    }

    if (learningGoal !== undefined) {
      const goal = String(learningGoal).trim();
      if (goal.length > 200) {
        throw createError('Mục tiêu học tập không được vượt quá 200 ký tự', 400);
      }
      student.learningGoal = goal;
    }

    if (emergencyContact !== undefined) {
      const ec = emergencyContact || {};
      const name = String(ec.name || '').trim();
      const phone = String(ec.phone || '').trim();
      const relationship = String(ec.relationship || '').trim();

      if (name && !/^\d{9,11}$/.test(phone.replace(/\s/g, ''))) {
        throw createError('Số điện thoại liên hệ khẩn cấp không hợp lệ', 400);
      }
      if (!name && (phone || relationship)) {
        throw createError('Vui lòng nhập đầy đủ thông tin liên hệ khẩn cấp', 400);
      }

      student.emergencyContact = { name, relationship, phone };
    }

    await student.save();

    res.json({
      success: true,
      message: 'Cập nhật hồ sơ học viên thành công',
      data: {
        student: {
          studentCode: student.studentCode,
          dob: student.dob,
          currentBand: student.currentBand,
          targetBand: student.targetBand,
          learningGoal: student.learningGoal,
          emergencyContact: student.emergencyContact,
          status: student.status,
        },
      },
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
      message: error.message || 'Lỗi server khi cập nhật hồ sơ học viên',
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
