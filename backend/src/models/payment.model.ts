import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'VNPAY' | 'MOMO' | 'CARD';

export interface IPayment extends Document {
  student: Types.ObjectId;
  enrollment?: Types.ObjectId;
  class?: Types.ObjectId;
  amount: number;
  method: PaymentMethod;
  transactionId?: string;
  paymentDate?: Date;
  dueDate?: Date;
  status: PaymentStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sinh viên là bắt buộc'],
      index: true,
    },
    enrollment: {
      type: Schema.Types.ObjectId,
      ref: 'Enrollment',
    },
    class: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
    },
    amount: {
      type: Number,
      required: [true, 'Số tiền là bắt buộc'],
      min: 0,
    },
    method: {
      type: String,
      enum: ['CASH', 'BANK_TRANSFER', 'VNPAY', 'MOMO', 'CARD'],
      default: 'CASH',
    },
    transactionId: {
      type: String,
      default: '',
    },
    paymentDate: {
      type: Date,
    },
    dueDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ student: 1, createdAt: -1 });

export const Payment: Model<IPayment> = mongoose.model<IPayment>('Payment', paymentSchema);
