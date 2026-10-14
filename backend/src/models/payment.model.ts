import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'VNPAY' | 'MOMO';

export interface IPayment extends Document {
  enrollment: Types.ObjectId;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionCode?: string;
  paymentDate: Date;
  status: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    enrollment: {
      type: Schema.Types.ObjectId,
      ref: 'Enrollment',
      required: [true, 'Đăng ký học phí là bắt buộc'],
    },
    amount: {
      type: Number,
      required: [true, 'Số tiền là bắt buộc'],
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'BANK_TRANSFER', 'VNPAY', 'MOMO'],
      default: 'CASH',
    },
    transactionCode: {
      type: String,
      default: '',
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
    },
  },
  {
    timestamps: true,
  }
);

export const Payment: Model<IPayment> = mongoose.model<IPayment>('Payment', paymentSchema);
