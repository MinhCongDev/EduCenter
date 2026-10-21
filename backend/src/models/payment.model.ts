import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type PaymentMethod = 'VNPAY' | 'BANK_TRANSFER' | 'CASH' | 'CREDIT_CARD';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export interface IPayment extends Document {
  student: Types.ObjectId;
  enrollment?: Types.ObjectId;
  course?: Types.ObjectId;
  amount: number;
  method: PaymentMethod;
  transactionCode: string;
  status: PaymentStatus;
  paymentDate: Date;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Học viên là bắt buộc'],
    },
    enrollment: {
      type: Schema.Types.ObjectId,
      ref: 'Enrollment',
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
    },
    amount: {
      type: Number,
      required: [true, 'Số tiền thanh toán là bắt buộc'],
      min: 0,
    },
    method: {
      type: String,
      enum: ['VNPAY', 'BANK_TRANSFER', 'CASH', 'CREDIT_CARD'],
      default: 'VNPAY',
    },
    transactionCode: {
      type: String,
      required: [true, 'Mã giao dịch là bắt buộc'],
      unique: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
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

export const Payment: Model<IPayment> = mongoose.model<IPayment>('Payment', paymentSchema);
