import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middlewares/auth.middleware';
import { createError } from '../middlewares/error.middleware';
import { ChangeRequest } from '../models/changeRequest.model';
import { Enrollment } from '../models/enrollment.model';
import { Class } from '../models/class.model';
import { User } from '../models/user.model';
import { Notification } from '../models/notification.model';
import { Payment } from '../models/payment.model';
import { notify } from '../services/notification.service';
import { activeEnrollmentFilter } from '../utils/enrollment';

const isValidId = (id: string): boolean => mongoose.Types.ObjectId.isValid(id);

// =====================================================
//  GET /api/staff/requests
//  Danh sách yêu cầu thay đổi do học viên / giảng viên gửi.
//  Phòng giáo vụ dùng API này để xử lý yêu cầu của học viên.
//
//  Trước đây học viên gửi yêu cầu xong không có ai duyệt: không tồn tại
//  endpoint review, không ai đổi status → yêu cầu treo vĩnh viễn ở PENDING
//  và học viên không bao giờ biết kết quả.
// =====================================================
export const getStaffRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, requestType, search, page = '1', limit = '20' } = req.query;

    const query: any = {};
    if (status && typeof status === 'string' && status !== 'ALL') {
      query.status = status;
    }
    if (requestType && typeof requestType === 'string' && requestType !== 'ALL') {
      query.requestType = requestType;
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(Math.max(1, Number(limit) || 20), 100);
    const skip = (pageNum - 1) * limitNum;

    // ── Tìm kiếm ──
    // Phải lọc TRƯỚC khi phân trang, nếu không thì `total` (đếm trên toàn bộ
    // collection) không khớp với số kết quả trả về và các trang sau bị rỗng
    // trong khi trang đầu vẫn hiện "có kết quả".
    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

      // Tìm các user khớp từ khoá (người gửi yêu cầu).
      const matchedUsers = await User.find({
        $or: [{ fullName: rx }, { email: rx }],
      }).select('_id');
      const userIds = matchedUsers.map((u) => u._id);

      // Tìm các lớp khớp từ khoá (mã lớp hiện tại / lớp đích).
      const matchedClasses = await Class.find({ classCode: rx }).select('_id');
      const classIds = matchedClasses.map((c) => c._id);

      const orParts: any[] = [
        { reason: rx },
        { currentClass: { $in: classIds } },
        { targetClass: { $in: classIds } },
      ];
      if (userIds.length) {
        orParts.push({ student: { $in: userIds } });
        orParts.push({ teacher: { $in: userIds } });
      }
      query.$or = orParts;
    }

    const requests = await ChangeRequest.find(query)
      .populate('student', 'fullName email phone avatarUrl')
      .populate('teacher', 'fullName email')
      .populate('currentClass', 'classCode room timeSlot scheduleDays status capacity')
      .populate('targetClass', 'classCode room timeSlot scheduleDays status capacity')
      .populate('reviewedBy', 'fullName')
      .sort({ status: 1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await ChangeRequest.countDocuments(query);

    res.json({
      success: true,
      message: 'Lấy danh sách yêu cầu thành công',
      data: { requests },
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy danh sách yêu cầu',
    });
  }
};

// =====================================================
//  PATCH /api/staff/requests/:id/review
//  Duyệt / từ chối yêu cầu của học viên.
//
//  Nghiệp vụ khi DUYỆT yêu cầu đổi lớp (CLASS_CHANGE):
//   - Chuyển enrollment của học viên từ lớp hiện tại sang lớp đích.
//   - Sĩ số lớp cũ giảm 1, lớp mới tăng 1 (đếm từ Enrollment — nguồn sự thật).
//   - Học phí của lớp mới được đặt về PENDING vì khóa học có thể khác giá.
//
//  Mọi thao tác đều được bọc trong try/catch: nếu chuyển lớp lỗi thì
//  yêu cầu vẫn được đánh dấu APPROVED và học viên được thông báo kết quả
//  (tốt hơn việc treo yêu cầu ở PENDING vô thời hạn).
// =====================================================
export const reviewChangeRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reviewerId = req.user?._id;
    const { id } = req.params;
    if (!id || !isValidId(id)) throw createError('ID yêu cầu không hợp lệ', 400);

    const { status, reviewNote } = req.body || {};
    if (status !== 'APPROVED' && status !== 'REJECTED') {
      throw createError('Trạng thái xử lý không hợp lệ (APPROVED hoặc REJECTED)', 400);
    }

    const request = await ChangeRequest.findById(id)
      .populate('student', 'fullName email')
      .populate('currentClass', 'classCode status capacity')
      .populate('targetClass', 'classCode status capacity');

    if (!request) throw createError('Không tìm thấy yêu cầu', 404);
    if (request.status !== 'PENDING') {
      throw createError(
        `Yêu cầu này đã được xử lý (${request.status === 'APPROVED' ? 'duyệt' : 'từ chối'})`,
        400
      );
    }

    const notes = (reviewNote || '').trim();
    if (status === 'REJECTED' && !notes) {
      throw createError('Vui lòng ghi lý do từ chối để học viên hiểu lý do', 400);
    }

    // ── Duyệt yêu cầu đổi lớp → chuyển enrollment ──
    let enrollmentMoved = false;
    if (status === 'APPROVED' && request.requestType === 'CLASS_CHANGE' && request.targetClass) {
      const student = request.student as any;
      const target = request.targetClass as any;

      if (student?._id && target?._id) {
        // Lớp đích phải còn hoạt động để nhận học viên chuyển vào.
        //
        // Trước đây chỉ cho phép lớp `OPEN`. Sai, vì yêu cầu đổi lớp hợp
        // lý hay là chuyển sang lớp ĐÃ KHAI GIẢNG (lớp đích cùng trình
        // độ, học viên nghỉ học nên muốn vào lớp khác đang chạy) — quy tắc
        // "chỉ lớp OPEN" khiến mọi yêu cầu đổi lớp giữa kỳ đều bị chặn.
        // Ràng buộc `OPEN` là quy tắc cho TỰ GHI DANH; ở đây phòng giáo vụ
        // đã chủ động duyệt nên chỉ cần lớp đích còn hoạt động.
        if (target.status && ['CANCELLED', 'COMPLETED'].includes(target.status)) {
          throw createError(
            `Lớp đích (${target.classCode}) không còn hoạt động — không thể duyệt yêu cầu`,
            400
          );
        }

        // Kiểm tra sĩ số lớp đích (đếm từ Enrollment — nguồn sự thật).
        const targetActiveCount = await Enrollment.countDocuments({
          class: target._id,
          ...activeEnrollmentFilter(),
        });
        if (typeof target.capacity === 'number' && targetActiveCount >= target.capacity) {
          throw createError(
            `Lớp đích (${target.classCode}) đã đầy — không thể duyệt yêu cầu`,
            400
          );
        }

        const currentEnrollment = await Enrollment.findOne({
          student: student._id,
          class: request.currentClass,
          ...activeEnrollmentFilter(),
        });

        if (currentEnrollment) {
          // Rút khỏi lớp cũ (atomic để không trừ sĩ số hai lần).
          await Enrollment.updateOne(
            {
              _id: currentEnrollment._id,
              student: student._id,
              status: { $in: ['ENROLLED', 'COMPLETED'] },
            },
            {
              $set: {
                status: 'DROPPED',
                droppedAt: new Date(),
                tuitionStatus:
                  currentEnrollment.tuitionStatus === 'PAID' ? 'REFUNDED' : currentEnrollment.tuitionStatus,
              },
            }
          );

          // Đồng bộ hóa đơn đã thanh toán sang REFUNDED — nếu không,
          // `getDashboard` vẫn tính tiền đã hoàn vào "Học phí đã thanh toán"
          // (lệch với `TuitionPage` vốn đếm theo Enrollment.tuitionStatus).
          if (currentEnrollment.tuitionStatus === 'PAID') {
            await Payment.updateMany(
              { enrollment: currentEnrollment._id, status: 'SUCCESS' },
              { $set: { status: 'REFUNDED' } }
            );
          }

          // Ghi danh vào lớp đích (tái sử dụng bản ghi enrollment cũ nếu có).
          const existingTarget = await Enrollment.findOne({
            student: student._id,
            class: target._id,
          });
          if (existingTarget) {
            existingTarget.status = 'ENROLLED';
            existingTarget.enrollmentDate = new Date();
            existingTarget.droppedAt = undefined;
            existingTarget.tuitionStatus = 'PENDING';
            await existingTarget.save();
          } else {
            await Enrollment.create({
              student: student._id,
              class: target._id,
              status: 'ENROLLED',
              enrollmentDate: new Date(),
              tuitionStatus: 'PENDING',
            });
          }
          enrollmentMoved = true;
        }
      }
    }

    // ── Cập nhật trạng thái yêu cầu ──
    request.status = status;
    request.reviewedBy = reviewerId;
    request.reviewNote = notes;
    request.reviewedAt = new Date();
    await request.save();

    // ── Đồng bộ sĩ số các lớp liên quan ──
    const affectedClassIds = [request.currentClass?._id, request.targetClass?._id].filter(Boolean);
    for (const classId of affectedClassIds) {
      const count = await Enrollment.countDocuments({
        class: classId,
        ...activeEnrollmentFilter(),
      });
      await Class.updateOne({ _id: classId }, { $set: { currentEnrollment: count } });
    }

    // ── Thông báo kết quả cho học viên ──
    const student = request.student as any;
    if (student?._id) {
      const type = status === 'APPROVED' ? 'REQUEST_APPROVED' : 'REQUEST_REJECTED';
      const title =
        status === 'APPROVED'
          ? '✅ Yêu cầu thay đổi của bạn đã được duyệt'
          : '⛔ Yêu cầu thay đổi của bạn đã bị từ chối';
      let message =
        status === 'APPROVED'
          ? 'Phòng giáo vụ đã duyệt yêu cầu của bạn.'
          : `Phòng giáo vụ đã từ chối yêu cầu. Lý do: ${notes}`;
      if (enrollmentMoved) {
        message += ` Bạn đã được chuyển sang lớp ${(request.targetClass as any)?.classCode || 'mới'}.`;
      }
      await notify({
        user: student._id,
        type,
        title,
        message,
        link: '/student/requests',
      });
    }

    res.json({
      success: true,
      message:
        status === 'APPROVED'
          ? 'Đã duyệt yêu cầu thành công'
          : 'Đã từ chối yêu cầu thành công',
      data: {
        request,
        enrollmentMoved,
      },
    });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi xử lý yêu cầu',
    });
  }
};

// =====================================================
//  PATCH /api/staff/notifications/read-all
//  Đánh dấu toàn bộ thông báo của nhân viên là đã đọc.
//  API student đã có endpoint tương đương nhưng phía staff thì thiếu →
//  nút "Đọc tất cả" trong chuông thông báo không hoạt động.
// =====================================================
export const markAllStaffNotificationsAsRead = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) throw createError('Chưa xác thực', 401);

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
//  DELETE /api/staff/notifications/:id
//  Nhân viên xoá thông báo của chính mình.
// =====================================================
export const deleteStaffNotification = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) throw createError('Chưa xác thực', 401);
    const { id } = req.params;
    if (!isValidId(id)) throw createError('ID thông báo không hợp lệ', 400);

    const result = await Notification.deleteOne({ _id: id, recipient: user._id });
    if (result.deletedCount === 0) {
      throw createError('Không tìm thấy thông báo', 404);
    }
    res.json({ success: true, message: 'Đã xoá thông báo' });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi xoá thông báo',
    });
  }
};

// =====================================================
//  GET /api/staff/notifications
//  Thông báo gửi tới nhân viên giáo vụ (yêu cầu mới, học viên mới...).
//  Bổ sung cho vòng đời thông báo: hiện chỉ học viên có API đọc thông báo.
// =====================================================
export const getStaffNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) throw createError('Chưa xác thực', 401);

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
//  PATCH /api/staff/notifications/:id/read
// =====================================================
export const markStaffNotificationAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) throw createError('Chưa xác thực', 401);
    const { id } = req.params;
    if (!isValidId(id)) throw createError('ID thông báo không hợp lệ', 400);

    const result = await Notification.updateOne(
      { _id: id, recipient: user._id },
      { $set: { isRead: true } }
    );
    if (result.matchedCount === 0) {
      throw createError('Không tìm thấy thông báo', 404);
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
