import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { Payment, PaymentMethod, PaymentStatus } from '../models/payment.model';
import { Enrollment } from '../models/enrollment.model';
import { Center } from '../models/center.model';
import { Notification } from '../models/notification.model';
import { activeEnrollmentFilter } from '../utils/enrollment';

/**
 * GET /api/payments/my-payments
 * Lấy toàn bộ lịch sử thanh toán & thống kê tài chính của học viên đang đăng nhập
 */
export const getMyPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user?._id;
    if (!studentId) {
      res.status(401).json({ success: false, message: 'Chưa xác thực học viên' });
      return;
    }

    const { status, search } = req.query;

    const query: any = { student: studentId };

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ transactionCode: searchRegex }, { note: searchRegex }];
    }

    const payments = await Payment.find(query)
      .populate('course', 'title code tuitionFee durationWeeks level category')
      .populate({
        path: 'enrollment',
        select: 'status tuitionStatus registrationDate enrollmentDate class',
        populate: {
          path: 'class',
          select: 'classCode room scheduleDays timeSlot startDate endDate',
        },
      })
      .sort({ paymentDate: -1, createdAt: -1 });

    // Tính toán thống kê tài chính
    const allStudentPayments = await Payment.find({ student: studentId });
    const totalPaid = allStudentPayments
      .filter((p) => p.status === 'SUCCESS')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const successCount = allStudentPayments.filter((p) => p.status === 'SUCCESS').length;
    // Chỉ tính hóa đơn PENDING còn "sống" — tức là thuộc enrollment còn hiệu lực.
    // Hóa đơn PENDING của lượt ghi danh đã rút (DROPPED) là hóa đơn mồ côi,
    // không được tính vào "học phí chờ đóng" (đã được `getTuition` loại trừ).
    const activeEnrollmentIds = new Set(
      (
        await Enrollment.find({
          student: studentId,
          ...activeEnrollmentFilter(),
        }).select('_id')
      ).map((e) => e._id.toString())
    );
    const pendingPayments = allStudentPayments.filter(
      (p) => p.status === 'PENDING' && (!p.enrollment || activeEnrollmentIds.has(p.enrollment.toString()))
    );
    const pendingCount = pendingPayments.length;

    // Lấy các khoản học phí còn nợ (Enrollment còn hiệu lực + tuitionStatus = PENDING).
    // Bắt buộc lọc `status` — nếu không, các lượt ghi danh đã rút (DROPPED) vẫn
    // còn tuitionStatus = PENDING và sẽ bị tính nhầm là "học phí còn nợ".
    const pendingEnrollments = await Enrollment.find({
      student: studentId,
      tuitionStatus: 'PENDING',
      ...activeEnrollmentFilter(),
    }).populate('course', 'tuitionFee title code');

    const pendingTuitionCount = pendingEnrollments.length;
    const totalPendingTuitionAmount = pendingEnrollments.reduce((sum: number, e: any) => {
      return sum + (e.course?.tuitionFee || 0);
    }, 0);

    res.status(200).json({
      success: true,
      data: {
        payments,
        summary: {
          totalPaid,
          successCount,
          pendingCount,
          pendingTuitionCount,
          totalPendingTuitionAmount,
        },
      },
    });
  } catch (error: any) {
    console.error('Lỗi khi lấy lịch sử thanh toán:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tải lịch sử thanh toán',
      error: error.message,
    });
  }
};

/**
 * GET /api/payments/pending-tuition
 * Lấy danh sách các khóa học / lớp học học viên đã đăng ký nhưng chưa hoàn thành học phí
 */
export const getPendingTuition = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user?._id;
    if (!studentId) {
      res.status(401).json({ success: false, message: 'Chưa xác thực học viên' });
      return;
    }

    const pendingEnrollments = await Enrollment.find({
      student: studentId,
      tuitionStatus: 'PENDING',
      ...activeEnrollmentFilter(),
    })
      .populate('course', 'title code description tuitionFee originalPrice durationWeeks level format')
      .populate('class', 'classCode room scheduleDays timeSlot startDate endDate status')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: pendingEnrollments,
    });
  } catch (error: any) {
    console.error('Lỗi khi lấy học phí chờ đóng:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy thông tin học phí chờ thanh toán',
      error: error.message,
    });
  }
};

/**
 * POST /api/payments/process
 * Học viên thực hiện thanh toán học phí qua VNPAY, Chuyển khoản, hoặc Thẻ
 */
export const processPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user?._id;
    if (!studentId) {
      res.status(401).json({ success: false, message: 'Chưa xác thực học viên' });
      return;
    }

    const { enrollmentId, method = 'VNPAY', note } = req.body;

    if (!enrollmentId) {
      res.status(400).json({
        success: false,
        message: 'Mã lượt đăng ký học (enrollmentId) là bắt buộc',
      });
      return;
    }

    const validMethods: PaymentMethod[] = ['VNPAY', 'BANK_TRANSFER', 'CASH', 'CREDIT_CARD'];
    if (!validMethods.includes(method)) {
      res.status(400).json({
        success: false,
        message: 'Phương thức thanh toán không hợp lệ',
      });
      return;
    }

    const enrollment = await Enrollment.findOne({
      _id: enrollmentId,
      student: studentId,
      // Chỉ cho thanh toán các lượt ghi danh còn hiệu lực (đã rút lớp thì
      // không được phép đóng học phí nữa).
      ...activeEnrollmentFilter(),
    }).populate('course', 'title code tuitionFee');

    if (!enrollment) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin đăng ký khóa học của bạn',
      });
      return;
    }

    if (enrollment.tuitionStatus === 'PAID') {
      res.status(400).json({
        success: false,
        message: 'Khoản học phí này đã được thanh toán hoàn tất trước đó',
      });
      return;
    }

    const course: any = enrollment.course;
    const amount = course?.tuitionFee || 0;

    // Sinh mã giao dịch duy nhất
    const prefixMap: Record<PaymentMethod, string> = {
      VNPAY: 'VNP',
      BANK_TRANSFER: 'MBB',
      CREDIT_CARD: 'CRD',
      CASH: 'CSH',
    };
    const prefix = prefixMap[method as PaymentMethod] || 'PAY';
    const timestamp = Date.now().toString().slice(-6);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const transactionCode = `${prefix}-${timestamp}${randomSuffix}`;

    // Cập nhật trạng thái enrollment
    enrollment.tuitionStatus = 'PAID';
    await enrollment.save();

    // Tạo bản ghi Payment.
    // Nếu enrollment đã có hóa đơn PENDING (hóa đơn tạo sẵn khi ghi danh) thì
    // thanh toán chính hóa đơn đó thay vì tạo hóa đơn mới — tránh để lại
    // hóa đơn PENDING mồ côi (làm sai số liệu "học phí chờ đóng") và tránh
    // vi phạm unique index (enrollment + status=SUCCESS).
    const existingInvoice = await Payment.findOne({
      enrollment: enrollment._id,
      status: { $ne: 'SUCCESS' },
    }).sort({ createdAt: 1 });

    let payment;
    if (existingInvoice) {
      existingInvoice.status = 'SUCCESS' as PaymentStatus;
      existingInvoice.amount = amount;
      existingInvoice.method = method as PaymentMethod;
      existingInvoice.transactionCode = transactionCode;
      existingInvoice.paymentDate = new Date();
      existingInvoice.note = note || `Học viên thanh toán học phí khóa ${course?.title || 'IELTS'} qua cổng ${method}`;
      await existingInvoice.save();
      payment = existingInvoice;
    } else {
      payment = await Payment.create({
        student: studentId,
        enrollment: enrollment._id,
        course: course?._id,
        amount,
        method: method as PaymentMethod,
        transactionCode,
        status: 'SUCCESS' as PaymentStatus,
        paymentDate: new Date(),
        note: note || `Học viên thanh toán học phí khóa ${course?.title || 'IELTS'} qua cổng ${method}`,
      });
    }

    // Tạo thông báo cho học viên
    await Notification.create({
      recipient: studentId,
      title: '💳 Thanh toán học phí thành công',
      content: `Giao dịch ${transactionCode} cho khóa ${course?.title || ''} trị giá ${amount.toLocaleString('vi-VN')} VNĐ đã hoàn tất. Cảm ơn bạn!`,
      type: 'SUCCESS',
      linkUrl: '/student/payments',
    });

    // Populate dữ liệu để trả về
    const populatedPayment = await Payment.findById(payment._id)
      .populate('course', 'title code tuitionFee')
      .populate({
        path: 'enrollment',
        populate: { path: 'class', select: 'classCode room scheduleDays timeSlot' },
      });

    res.status(201).json({
      success: true,
      message: 'Thanh toán học phí thành công!',
      data: populatedPayment,
    });
  } catch (error: any) {
    console.error('Lỗi khi xử lý thanh toán:', error);
    res.status(500).json({
      success: false,
      message: 'Xử lý thanh toán thất bại, vui lòng thử lại sau',
      error: error.message,
    });
  }
};

/**
 * GET /api/payments/:id/receipt
 * Xuất biên lai điện tử / hóa đơn thanh toán chi tiết
 */
export const getPaymentReceipt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user?._id;
    const { id } = req.params;

    const payment = await Payment.findOne({
      _id: id,
      student: studentId,
    })
      .populate('student', 'fullName email phone address')
      .populate('course', 'title code tuitionFee durationWeeks level')
      .populate({
        path: 'enrollment',
        populate: {
          path: 'class',
          select: 'classCode room scheduleDays timeSlot startDate endDate',
        },
      });

    if (!payment) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy hóa đơn hoặc bạn không có quyền xem hóa đơn này',
      });
      return;
    }

    const center = await Center.findOne();

    res.status(200).json({
      success: true,
      data: {
        payment,
        center: center || {
          name: 'EduCenter IELTS Academy',
          hotline: '1900 6868',
          email: 'contact@educenter.edu.vn',
          address: 'Tòa nhà EduCenter Tower, 128 Cầu Giấy, Q. Cầu Giấy, Hà Nội',
        },
      },
    });
  } catch (error: any) {
    console.error('Lỗi khi lấy biên lai thanh toán:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tải biên lai thanh toán',
      error: error.message,
    });
  }
};
