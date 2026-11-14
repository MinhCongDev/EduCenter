import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../middlewares/auth.middleware';
import { Payment, PaymentMethod, PaymentStatus } from '../models/payment.model';
import { Enrollment } from '../models/enrollment.model';
import { Course } from '../models/course.model';
import { Center } from '../models/center.model';
import { Notification } from '../models/notification.model';
import { payosService } from '../services/payos.service';

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
    const pendingCount = allStudentPayments.filter((p) => p.status === 'PENDING').length;

    // Lấy các khoản học phí còn nợ (Enrollment có tuitionStatus = PENDING)
    const pendingEnrollments = await Enrollment.find({
      student: studentId,
      tuitionStatus: 'PENDING',
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

    const validMethods: PaymentMethod[] = [
      'VIETQR',
      'VietQR',
      'PAYOS',
      'PayOS',
      'VNPAY',
      'VNPay',
      'BANK_TRANSFER',
      'CASH',
      'CREDIT_CARD',
      'MOMO',
      'ZALOPAY',
      'OTHER',
    ];
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
      VIETQR: 'VQR',
      VietQR: 'VQR',
      PAYOS: 'POS',
      PayOS: 'POS',
      VNPAY: 'VNP',
      VNPay: 'VNP',
      BANK_TRANSFER: 'MBB',
      CREDIT_CARD: 'CRD',
      CASH: 'CSH',
      MOMO: 'MOM',
      ZALOPAY: 'ZAL',
      OTHER: 'OTH',
    };
    const prefix = prefixMap[method as PaymentMethod] || 'PAY';
    const timestamp = Date.now().toString().slice(-6);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const transactionCode = `${prefix}-${timestamp}${randomSuffix}`;

    // Cập nhật trạng thái enrollment
    enrollment.tuitionStatus = 'PAID';
    await enrollment.save();

    // Tạo bản ghi Payment
    const payment = await Payment.create({
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

/**
 * POST /api/payments
 * Nhận dữ liệu từ client để tạo mới một bản ghi thanh toán ở trạng thái PENDING khi học viên mở mã QR
 */
export const createPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user?._id;
    if (!currentUserId) {
      res.status(401).json({ success: false, message: 'Chưa xác thực người dùng' });
      return;
    }

    const {
      studentId,
      amount,
      courseId,
      invoiceId,
      enrollmentId,
      paymentMethod = 'VIETQR',
      method,
      note,
      transactionCode,
    } = req.body;

    // Xác định học viên: ưu tiên studentId từ body, fallback về user đang đăng nhập
    const targetStudentId = studentId || currentUserId;

    // Phương thức thanh toán chuẩn hóa
    const finalMethod: PaymentMethod = (paymentMethod || method || 'VIETQR') as PaymentMethod;

    let finalAmount = Number(amount);
    let targetCourseId = courseId;
    let targetEnrollment: any = null;

    // Nếu có enrollmentId, kiểm tra và lấy thông tin khóa học / học phí nếu client chưa truyền amount
    if (enrollmentId && Types.ObjectId.isValid(enrollmentId)) {
      targetEnrollment = await Enrollment.findOne({
        _id: enrollmentId,
        student: targetStudentId,
      }).populate('course', 'title code tuitionFee');

      if (targetEnrollment) {
        if (!finalAmount || finalAmount <= 0) {
          finalAmount = (targetEnrollment.course as any)?.tuitionFee || 0;
        }
        if (!targetCourseId && targetEnrollment.course) {
          targetCourseId = (targetEnrollment.course as any)._id;
        }
      }
    }

    // Nếu có courseId nhưng chưa có amount, lấy từ bảng Course
    if ((!finalAmount || finalAmount <= 0) && targetCourseId && Types.ObjectId.isValid(targetCourseId)) {
      const course = await Course.findById(targetCourseId).select('tuitionFee title');
      if (course) {
        finalAmount = course.tuitionFee || 0;
      }
    }

    if (!finalAmount || finalAmount <= 0) {
      res.status(400).json({
        success: false,
        message: 'Số tiền thanh toán (amount) phải lớn hơn 0',
      });
      return;
    }

    // Sinh mã hóa đơn / mã giao dịch nếu chưa có
    const prefixMap: Record<string, string> = {
      VIETQR: 'VQR',
      VietQR: 'VQR',
      VNPAY: 'VNP',
      VNPay: 'VNP',
      BANK_TRANSFER: 'MBB',
      CREDIT_CARD: 'CRD',
      CASH: 'CSH',
      MOMO: 'MOM',
      ZALOPAY: 'ZAL',
    };
    const prefix = prefixMap[finalMethod] || 'PAY';
    const timestamp = Date.now().toString().slice(-6);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);

    const genTransactionCode =
      transactionCode ||
      invoiceId ||
      `${prefix}-${timestamp}${randomSuffix}`;

    const genInvoiceId =
      invoiceId ||
      `INV-${timestamp}${randomSuffix}`;

    // Nếu có courseId nhưng chưa có enrollment, tìm hoặc tạo enrollment PENDING (chờ staff xếp lớp)
    if (!targetEnrollment && targetCourseId && Types.ObjectId.isValid(targetCourseId)) {
      targetEnrollment = await Enrollment.findOne({
        student: targetStudentId,
        course: targetCourseId,
        status: { $ne: 'DROPPED' },
      });

      if (!targetEnrollment) {
        targetEnrollment = await Enrollment.create({
          student: targetStudentId,
          course: targetCourseId,
          status: 'PENDING',
          tuitionStatus: 'PENDING',
          registrationDate: new Date(),
          enrollmentDate: new Date(),
        });
      }
    }

    const linkedEnrollmentId = enrollmentId || targetEnrollment?._id;

    // Kiểm tra xem đã có bản ghi PENDING cho enrollment này chưa để tái sử dụng
    let payment = null;
    if (linkedEnrollmentId && Types.ObjectId.isValid(linkedEnrollmentId)) {
      const existingPending = await Payment.findOne({
        enrollment: linkedEnrollmentId,
        student: targetStudentId,
        status: 'PENDING',
      });

      if (existingPending) {
        existingPending.amount = finalAmount;
        existingPending.method = finalMethod;
        existingPending.invoiceId = genInvoiceId;
        existingPending.transactionCode = genTransactionCode;
        if (targetCourseId) existingPending.course = targetCourseId;
        if (note) existingPending.note = note;
        await existingPending.save();
        payment = existingPending;
      }
    }

    if (!payment) {
      payment = await Payment.create({
        student: targetStudentId,
        amount: finalAmount,
        course: targetCourseId,
        enrollment: linkedEnrollmentId,
        invoiceId: genInvoiceId,
        transactionCode: genTransactionCode,
        method: finalMethod,
        status: 'PENDING',
        paymentDate: new Date(),
        note: note || `Tạo yêu cầu thanh toán qua cổng ${finalMethod}`,
      });
    }

    // Populate dữ liệu liên quan để trả về client
    const populated = await Payment.findById(payment._id)
      .populate('student', 'fullName email phone studentCode')
      .populate('course', 'title code tuitionFee level durationWeeks')
      .populate({
        path: 'enrollment',
        select: 'status tuitionStatus class',
        populate: { path: 'class', select: 'classCode room scheduleDays timeSlot' },
      });

    res.status(201).json({
      success: true,
      message: 'Khởi tạo yêu cầu thanh toán thành công (Pending)',
      data: populated,
    });
  } catch (error: any) {
    console.error('Lỗi khi tạo giao dịch thanh toán:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể khởi tạo giao dịch thanh toán',
      error: error.message,
    });
  }
};

/**
 * PUT /api/payments/:id/confirm
 * Cập nhật trạng thái giao dịch từ pending sang success khi học viên xác nhận đã chuyển khoản
 */
export const confirmPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user?._id;
    if (!currentUserId) {
      res.status(401).json({ success: false, message: 'Chưa xác thực người dùng' });
      return;
    }

    const { id } = req.params;
    const { note, paymentMethod, method, transactionCode } = req.body;

    // Tìm bản ghi payment theo ID, hoặc fallback theo transactionCode / invoiceId
    let payment = null;
    if (Types.ObjectId.isValid(id)) {
      payment = await Payment.findById(id);
    }

    if (!payment) {
      payment = await Payment.findOne({
        $or: [{ transactionCode: id }, { invoiceId: id }],
      });
    }

    if (!payment) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin giao dịch thanh toán',
      });
      return;
    }

    // Kiểm tra quyền: nếu là học viên thì chỉ được xác nhận giao dịch của chính mình
    const isStudent = req.user?.role === 'STUDENT';
    if (isStudent && payment.student.toString() !== currentUserId.toString()) {
      res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thao tác trên giao dịch của học viên khác',
      });
      return;
    }

    // Nếu giao dịch đã hoàn tất trước đó (idempotency)
    if (payment.status === 'SUCCESS') {
      res.status(200).json({
        success: true,
        message: 'Giao dịch này đã được xác nhận thành công trước đó',
        data: payment,
      });
      return;
    }

    // Cập nhật trạng thái sang SUCCESS
    payment.status = 'SUCCESS';
    payment.paymentDate = new Date();
    if (paymentMethod || method) {
      payment.method = (paymentMethod || method) as PaymentMethod;
    }
    if (transactionCode) {
      payment.transactionCode = transactionCode;
    }
    if (note) {
      payment.note = note;
    }
    await payment.save();

    // Đảm bảo lượt đăng ký học (Enrollment) luôn tồn tại và chuyển sang trạng thái đã thanh toán (PAID)
    let relatedEnrollment: any = null;
    if (payment.enrollment) {
      relatedEnrollment = await Enrollment.findByIdAndUpdate(
        payment.enrollment,
        { tuitionStatus: 'PAID' },
        { new: true }
      );
    }

    // Nếu payment chưa gắn enrollment nhưng có course (học viên thanh toán từ trang Khóa học)
    if (!relatedEnrollment && payment.course) {
      relatedEnrollment = await Enrollment.findOne({
        student: payment.student,
        course: payment.course,
        status: { $ne: 'DROPPED' },
      });

      if (!relatedEnrollment) {
        relatedEnrollment = await Enrollment.create({
          student: payment.student,
          course: payment.course,
          status: 'PENDING',
          tuitionStatus: 'PAID',
          registrationDate: new Date(),
          enrollmentDate: new Date(),
        });
      } else {
        relatedEnrollment.tuitionStatus = 'PAID';
        await relatedEnrollment.save();
      }

      payment.enrollment = relatedEnrollment._id as any;
      await payment.save();
    }

    // Lấy thông tin khóa học để gửi thông báo chi tiết
    let courseTitle = '';
    if (payment.course) {
      const course = await Course.findById(payment.course).select('title');
      if (course) courseTitle = course.title;
    }

    // Tạo thông báo xác nhận thành công cho học viên
    await Notification.create({
      recipient: payment.student,
      title: '💳 Xác nhận thanh toán học phí thành công',
      content: `Giao dịch ${payment.transactionCode || payment.invoiceId} trị giá ${payment.amount.toLocaleString('vi-VN')} VNĐ${courseTitle ? ` cho khóa học ${courseTitle}` : ''} đã được xác nhận thành công. Chúc bạn học tập tốt!`,
      type: 'SUCCESS',
      linkUrl: '/student/payments',
    });

    const populatedPayment = await Payment.findById(payment._id)
      .populate('student', 'fullName email phone studentCode')
      .populate('course', 'title code tuitionFee')
      .populate({
        path: 'enrollment',
        populate: { path: 'class', select: 'classCode room scheduleDays timeSlot' },
      });

    res.status(200).json({
      success: true,
      message: 'Xác nhận thanh toán học phí thành công!',
      data: populatedPayment,
    });
  } catch (error: any) {
    console.error('Lỗi khi xác nhận thanh toán:', error);
    res.status(500).json({
      success: false,
      message: 'Xác nhận thanh toán thất bại, vui lòng thử lại sau',
      error: error.message,
    });
  }
};

/**
 * GET /api/payments/payos/config-status
 * Kiểm tra xem backend đã được cấu hình PayOS Client ID & Checksum Key chưa
 */
export const getPayOSConfigStatus = async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    data: {
      isConfigured: payosService.isConfigured(),
    },
  });
};

/**
 * POST /api/payments/payos/create-link
 * Tạo link thanh toán PayOS và mã QR cho học viên
 */
export const createPayOSPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user?._id;
    if (!studentId) {
      res.status(401).json({ success: false, message: 'Chưa xác thực người dùng' });
      return;
    }

    const { courseId, enrollmentId, amount, description } = req.body;

    let targetCourse: any = null;
    let targetEnrollment: any = null;
    let finalAmount = Number(amount);

    if (enrollmentId && Types.ObjectId.isValid(enrollmentId)) {
      targetEnrollment = await Enrollment.findOne({
        _id: enrollmentId,
        student: studentId,
      }).populate('course');

      if (targetEnrollment && targetEnrollment.course) {
        targetCourse = targetEnrollment.course;
        if (!finalAmount || finalAmount <= 0) {
          finalAmount = targetCourse.tuitionFee || 0;
        }
      }
    }

    if (!targetCourse && courseId && Types.ObjectId.isValid(courseId)) {
      targetCourse = await Course.findById(courseId);
      if (targetCourse && (!finalAmount || finalAmount <= 0)) {
        finalAmount = targetCourse.tuitionFee || 0;
      }
    }

    if (!finalAmount || finalAmount <= 0) {
      res.status(400).json({
        success: false,
        message: 'Số tiền thanh toán phải lớn hơn 0',
      });
      return;
    }

    // Nếu có course mà chưa có enrollment, tạo hoặc lấy enrollment PENDING
    if (!targetEnrollment && targetCourse) {
      targetEnrollment = await Enrollment.findOne({
        student: studentId,
        course: targetCourse._id,
        status: { $ne: 'DROPPED' },
      });

      if (!targetEnrollment) {
        try {
          targetEnrollment = await Enrollment.create({
            student: studentId,
            course: targetCourse._id,
            status: 'PENDING',
            tuitionStatus: 'PENDING',
            registrationDate: new Date(),
            enrollmentDate: new Date(),
          });
        } catch (enrErr: any) {
          console.warn('Cảnh báo khi tạo enrollment pending (tiếp tục tạo PayOS):', enrErr.message);
          // Tìm lại xem đã có enrollment chưa
          targetEnrollment = await Enrollment.findOne({
            student: studentId,
            course: targetCourse._id,
          });
        }
      }
    }

    // Sinh mã orderCode số nguyên duy nhất cho PayOS
    const orderCode = payosService.generateOrderCode();
    const courseTitle = targetCourse?.title || 'Khoa hoc EduCenter';
    const cleanDesc = payosService.normalizeDescription(
      description || `HP ${targetCourse?.code || ''} ${orderCode}`
    );

    // Gọi PayOS service tạo link thanh toán
    const payosResult = await payosService.createPaymentLink({
      orderCode,
      amount: finalAmount,
      description: cleanDesc,
      buyerName: req.user?.fullName,
      buyerEmail: req.user?.email,
      buyerPhone: req.user?.phone,
      items: [
        {
          name: courseTitle.slice(0, 50),
          quantity: 1,
          price: finalAmount,
        },
      ],
    });

    // Tạo bản ghi Payment với status PENDING
    const payment = await Payment.create({
      student: studentId,
      amount: finalAmount,
      course: targetCourse?._id,
      enrollment: targetEnrollment?._id,
      method: 'PAYOS',
      status: 'PENDING',
      orderCode: payosResult.orderCode,
      paymentLinkId: payosResult.paymentLinkId,
      checkoutUrl: payosResult.checkoutUrl,
      qrCode: payosResult.qrCode,
      transactionCode: `POS-${payosResult.orderCode}`,
      invoiceId: `INV-${payosResult.orderCode}`,
      paymentDate: new Date(),
      note: description || `Thanh toán PayOS cho khóa học ${courseTitle}`,
      payosData: payosResult,
    });

    const populatedPayment = await Payment.findById(payment._id)
      .populate('student', 'fullName email phone studentCode')
      .populate('course', 'title code tuitionFee durationWeeks level')
      .populate({
        path: 'enrollment',
        populate: { path: 'class', select: 'classCode room scheduleDays timeSlot' },
      });

    res.status(201).json({
      success: true,
      message: 'Khởi tạo link thanh toán PayOS thành công',
      data: {
        payment: populatedPayment,
        payos: payosResult,
      },
    });
  } catch (error: any) {
    console.error('Lỗi khi tạo thanh toán PayOS:', error);
    res.status(500).json({
      success: false,
      message: error?.message || 'Không thể tạo liên kết thanh toán PayOS',
    });
  }
};

/**
 * GET/POST /api/payments/payos/check-status/:orderCode
 * Đối chiếu trực tiếp mã đơn hàng (orderCode) với PayOS API để cập nhật trạng thái
 * Phục vụ trường hợp chưa cấu hình Webhook (môi trường Local / Không có domain public)
 */
export const checkPayOSPaymentStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rawOrderCode = req.params.orderCode || req.body.orderCode;
    const orderCode = Number(rawOrderCode);

    if (!orderCode || isNaN(orderCode)) {
      res.status(400).json({
        success: false,
        message: 'Mã đơn hàng (orderCode) không hợp lệ',
      });
      return;
    }

    // Lấy thông tin thanh toán trực tiếp từ PayOS qua API paymentRequests.get
    let payosInfo = await payosService.getPaymentLinkInformation(orderCode);

    // Tìm bản ghi Payment trong database
    const payment = await Payment.findOne({
      $or: [{ orderCode }, { transactionCode: `POS-${orderCode}` }],
    }).populate('course', 'title code tuitionFee');

    if (!payment) {
      res.status(404).json({
        success: false,
        message: `Không tìm thấy thông tin giao dịch với mã orderCode ${orderCode}`,
        data: { payosInfo },
      });
      return;
    }

    // Kiểm tra trạng thái từ PayOS
    const isPaid =
      payosInfo.status === 'PAID' ||
      (typeof payosInfo.amountPaid === 'number' &&
        payosInfo.amountPaid >= payment.amount &&
        payment.amount > 0);

    // Nếu PayOS xác nhận đã thanh toán nhưng DB chưa cập nhật SUCCESS
    if (isPaid && payment.status !== 'SUCCESS') {
      try {
        payment.status = 'SUCCESS';
        payment.paymentDate = new Date();
        payment.payosData = {
          ...(payment.payosData || {}),
          lastCheckedInfo: payosInfo,
        };
        await payment.save();
      } catch (saveErr: any) {
        console.warn('⚠️ [checkPayOSPaymentStatus] Cảnh báo lưu payment:', saveErr.message);
        await Payment.findByIdAndUpdate(payment._id, {
          status: 'SUCCESS',
          paymentDate: new Date(),
          'payosData.lastCheckedInfo': payosInfo,
        });
      }

      // Cập nhật trạng thái enrollment sang PAID
      try {
        if (payment.enrollment) {
          await Enrollment.findByIdAndUpdate(payment.enrollment, { tuitionStatus: 'PAID' });
        } else if (payment.course) {
          const studentEnrollment = await Enrollment.findOne({
            student: payment.student,
            course: payment.course,
            status: { $ne: 'DROPPED' },
          });
          if (studentEnrollment) {
            studentEnrollment.tuitionStatus = 'PAID';
            await studentEnrollment.save();
          }
        }
      } catch (enrErr: any) {
        console.warn('⚠️ [checkPayOSPaymentStatus] Cảnh báo cập nhật enrollment:', enrErr.message);
      }

      // Gửi thông báo đến học viên (không chặn flow nếu lỗi)
      try {
        await Notification.create({
          recipient: payment.student,
          title: '💳 Xác nhận thanh toán PayOS thành công',
          content: `Đơn hàng #${orderCode} trị giá ${payment.amount.toLocaleString('vi-VN')} VNĐ cho khóa học ${(payment.course as any)?.title || ''} đã được đối soát thành công qua PayOS!`,
          type: 'SUCCESS',
          linkUrl: '/student/payments',
        });
      } catch (notifErr: any) {
        console.warn('⚠️ [checkPayOSPaymentStatus] Cảnh báo gửi notification:', notifErr.message);
      }
    } else if (payosInfo.status === 'CANCELLED' && payment.status === 'PENDING') {
      payment.status = 'FAILED';
      await payment.save();
    }

    res.status(200).json({
      success: true,
      message: isPaid ? 'Đơn hàng đã được thanh toán thành công' : `Trạng thái đơn hàng: ${payosInfo.status}`,
      data: {
        isPaid,
        status: payosInfo.status,
        payosInfo,
        payment,
      },
    });
  } catch (error: any) {
    console.error('Lỗi khi đối chiếu trạng thái PayOS:', error);
    res.status(500).json({
      success: false,
      message: error?.message || 'Không thể kiểm tra trạng thái thanh toán từ PayOS',
    });
  }
};

/**
 * POST /api/payments/payos/webhook
 * Nhận Webhook từ PayOS khi khách hàng hoàn tất giao dịch
 * (Public endpoint - Không yêu cầu Bearer auth)
 */
export const handlePayOSWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const webhookBody = req.body;
    console.log('🔔 [PayOS Webhook] Nhận dữ liệu webhook:', JSON.stringify(webhookBody));

    // PayOS test URL confirmation ping
    if (webhookBody?.data?.orderCode === 123 || webhookBody?.desc === 'Webhook confirm') {
      res.status(200).json({ success: true, message: 'Webhook confirm OK' });
      return;
    }

    // Xác thực webhook signature từ PayOS
    let webhookData: any = null;
    try {
      webhookData = await payosService.verifyWebhookData(webhookBody);
    } catch (verifyErr: any) {
      console.warn('⚠️ [PayOS Webhook] Xác thực signature warning:', verifyErr.message);
      webhookData = webhookBody?.data || webhookBody;
    }

    const orderCode = webhookData?.orderCode || webhookBody?.data?.orderCode;

    if (!orderCode) {
      res.status(200).json({ success: true, message: 'Không tìm thấy orderCode trong webhook payload' });
      return;
    }

    // Tìm và cập nhật Payment
    const payment = await Payment.findOne({
      $or: [{ orderCode: Number(orderCode) }, { transactionCode: `POS-${orderCode}` }],
    }).populate('course', 'title');

    if (!payment) {
      console.warn(`⚠️ [PayOS Webhook] Không tìm thấy đơn hàng với orderCode: ${orderCode}`);
      res.status(200).json({ success: true, message: 'Đơn hàng không tồn tại trong hệ thống' });
      return;
    }

    if (payment.status !== 'SUCCESS') {
      try {
        payment.status = 'SUCCESS';
        payment.paymentDate = new Date();
        payment.payosData = {
          ...(payment.payosData || {}),
          webhookData,
        };
        await payment.save();
      } catch (saveErr: any) {
        console.warn('⚠️ [PayOS Webhook] Cảnh báo lưu payment:', saveErr.message);
        await Payment.findByIdAndUpdate(payment._id, {
          status: 'SUCCESS',
          paymentDate: new Date(),
          'payosData.webhookData': webhookData,
        });
      }

      // Cập nhật enrollment
      try {
        if (payment.enrollment) {
          await Enrollment.findByIdAndUpdate(payment.enrollment, { tuitionStatus: 'PAID' });
        } else if (payment.course) {
          const studentEnrollment = await Enrollment.findOne({
            student: payment.student,
            course: payment.course,
            status: { $ne: 'DROPPED' },
          });
          if (studentEnrollment) {
            studentEnrollment.tuitionStatus = 'PAID';
            await studentEnrollment.save();
          }
        }
      } catch (enrErr: any) {
        console.warn('⚠️ [PayOS Webhook] Cảnh báo cập nhật enrollment:', enrErr.message);
      }

      // Gửi thông báo cho học viên
      try {
        await Notification.create({
          recipient: payment.student,
          title: '💳 Thanh toán PayOS tự động thành công (Webhook)',
          content: `Đơn hàng #${orderCode} trị giá ${payment.amount.toLocaleString('vi-VN')} VNĐ cho khóa học ${(payment.course as any)?.title || ''} đã được PayOS xác thực thành công!`,
          type: 'SUCCESS',
          linkUrl: '/student/payments',
        });
      } catch (notifErr: any) {
        console.warn('⚠️ [PayOS Webhook] Cảnh báo gửi notification:', notifErr.message);
      }
    }

    res.status(200).json({ success: true, message: 'Webhook đã được xử lý thành công' });
  } catch (error: any) {
    console.error('❌ [PayOS Webhook] Lỗi xử lý webhook:', error);
    res.status(500).json({ success: false, message: error?.message || 'Lỗi xử lý webhook PayOS' });
  }
};

