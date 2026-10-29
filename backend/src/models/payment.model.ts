import mongoose, { Document, Schema, Model, Types } from 'mongoose';

/**
 * Các phương thức thanh toán hỗ trợ trong hệ thống EduCenter
 */
export type PaymentMethod =
  | 'VIETQR'
  | 'VietQR'
  | 'VNPAY'
  | 'VNPay'
  | 'BANK_TRANSFER'
  | 'CASH'
  | 'CREDIT_CARD'
  | 'MOMO'
  | 'ZALOPAY'
  | 'OTHER';

/**
 * Các trạng thái giao dịch học phí (hỗ trợ cả uppercase và lowercase)
 */
export type PaymentStatus =
  | 'PENDING'
  | 'SUCCESS'
  | 'FAILED'
  | 'REFUNDED'
  | 'pending'
  | 'success'
  | 'failed'
  | 'refunded';

/**
 * Interface biểu diễn thông tin một giao dịch học phí
 */
export interface IPayment extends Document {
  /** ID của học viên thanh toán (tham chiếu User) */
  student: Types.ObjectId;
  /** Alias cho student (studentId) */
  studentId?: Types.ObjectId;

  /** Số tiền thanh toán (VNĐ) */
  amount: number;

  /** ID của khóa học được thanh toán (tham chiếu Course) */
  course?: Types.ObjectId;
  /** Alias cho course (courseId) */
  courseId?: Types.ObjectId;

  /** Mã hóa đơn học phí tương ứng */
  invoiceId?: string;

  /** Mã giao dịch hệ thống / cổng thanh toán */
  transactionCode: string;

  /** Lượt đăng ký lớp học tương ứng (nếu có) */
  enrollment?: Types.ObjectId;

  /** Phương thức thanh toán (Ví dụ: VIETQR, VNPAY, BANK_TRANSFER,...) */
  method: PaymentMethod;
  /** Alias cho method (paymentMethod) */
  paymentMethod?: PaymentMethod;

  /** Trạng thái giao dịch (pending, success, failed, refunded) */
  status: PaymentStatus;

  /** Thời điểm giao dịch thực tế */
  paymentDate: Date;

  /** Ghi chú hoặc thông tin bổ sung */
  note?: string;

  /** Thời gian tạo bản ghi (tự động từ timestamps) */
  createdAt: Date;
  /** Thời gian cập nhật gần nhất (tự động từ timestamps) */
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    // studentId: ID của học viên (tham chiếu model User)
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Học viên (studentId) là bắt buộc'],
      alias: 'studentId',
      index: true,
    },

    // amount: Số tiền thanh toán
    amount: {
      type: Number,
      required: [true, 'Số tiền thanh toán (amount) là bắt buộc'],
      min: [0, 'Số tiền thanh toán không được nhỏ hơn 0'],
    },

    // courseId: Mã hoặc ID khóa học tương ứng (tham chiếu Course)
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      alias: 'courseId',
      index: true,
    },

    // invoiceId: Mã hóa đơn học phí tương ứng
    invoiceId: {
      type: String,
      trim: true,
      index: true,
      default: function (this: any) {
        return this.transactionCode || `INV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      },
    },

    // Mã lượt đăng ký học (nếu gắn liền với 1 đợt ghi danh)
    enrollment: {
      type: Schema.Types.ObjectId,
      ref: 'Enrollment',
      index: true,
    },

    // paymentMethod: Phương thức thanh toán (Ví dụ: VietQR, VNPAY, Chuyển khoản,...)
    method: {
      type: String,
      enum: {
        values: [
          'VIETQR',
          'VietQR',
          'VNPAY',
          'VNPay',
          'BANK_TRANSFER',
          'CASH',
          'CREDIT_CARD',
          'MOMO',
          'ZALOPAY',
          'OTHER',
        ],
        message: '{VALUE} không phải là phương thức thanh toán hợp lệ',
      },
      default: 'VIETQR',
      alias: 'paymentMethod',
    },

    // Mã giao dịch duy nhất cho cổng thanh toán / đối soát
    transactionCode: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      default: function (this: any) {
        return this.invoiceId || `PAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      },
    },

    // status: Trạng thái (pending, success, failed, refunded)
    status: {
      type: String,
      enum: {
        values: [
          'PENDING',
          'SUCCESS',
          'FAILED',
          'REFUNDED',
          'pending',
          'success',
          'failed',
          'refunded',
        ],
        message: '{VALUE} không phải là trạng thái giao dịch hợp lệ',
      },
      default: 'PENDING',
      set: (val: string) => (typeof val === 'string' ? val.toUpperCase() : val),
      index: true,
    },

    // Thời gian thanh toán thực tế
    paymentDate: {
      type: Date,
      default: Date.now,
    },

    // Ghi chú chi tiết về giao dịch
    note: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    // Tự động sinh createdAt và updatedAt
    timestamps: true,
    // Cho phép hiển thị virtuals và aliases khi chuyển đổi sang JSON/Object
    toJSON: { virtuals: true, aliases: true, getters: true },
    toObject: { virtuals: true, aliases: true, getters: true },
  }
);

// Mỗi enrollment chỉ được có tối đa 1 giao dịch thanh toán THÀNH CÔNG.
// Partial unique index: chỉ áp dụng cho bản ghi status = 'SUCCESS' có `enrollment`.
// - Hóa đơn PENDING (chưa thanh toán) không bị tính vào ràng buộc, nên vẫn có
//   thể tạo giao dịch SUCCESS cho cùng enrollment sau đó.
// - Đây là chốt chặn cuối cùng ở tầng DB, bảo vệ khỏi race condition khi
//   2 request thanh toán chạy đồng thời.
paymentSchema.index(
  { enrollment: 1 },
  {
    unique: true,
    partialFilterExpression: {
      enrollment: { $type: 'objectId' },
      status: 'SUCCESS',
    },
  }
);

// Index hỗ trợ tìm kiếm nhanh theo học viên và ngày tạo
paymentSchema.index({ student: 1, createdAt: -1 });

export const Payment: Model<IPayment> = mongoose.model<IPayment>('Payment', paymentSchema);
