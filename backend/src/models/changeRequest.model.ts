import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type RequestType = 'CLASS_CHANGE' | 'SCHEDULE_CHANGE';
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface IChangeRequest extends Document {
  student: Types.ObjectId;
  requestType: RequestType;
  currentClass: Types.ObjectId;
  targetClass?: Types.ObjectId;
  targetSchedule?: string;
  reason: string;
  status: RequestStatus;
  reviewedBy?: Types.ObjectId;
  reviewNote?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const changeRequestSchema = new Schema<IChangeRequest>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Học viên yêu cầu là bắt buộc'],
    },
    requestType: {
      type: String,
      enum: ['CLASS_CHANGE', 'SCHEDULE_CHANGE'],
      required: [true, 'Loại yêu cầu là bắt buộc'],
    },
    currentClass: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Lớp học hiện tại là bắt buộc'],
    },
    targetClass: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
    },
    targetSchedule: {
      type: String,
      default: '',
    },
    reason: {
      type: String,
      required: [true, 'Lý do đổi lớp/lịch là bắt buộc'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewNote: {
      type: String,
      default: '',
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const ChangeRequest: Model<IChangeRequest> = mongoose.model<IChangeRequest>('ChangeRequest', changeRequestSchema);
