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

export const Payment: Model<IPayment> = mongoose.model<IPayment>('Payment', paymentSchema);
