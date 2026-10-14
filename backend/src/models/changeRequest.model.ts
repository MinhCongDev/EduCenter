import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type ChangeRequestType = 'CLASS_CHANGE' | 'SCHEDULE_CHANGE';
export type ChangeRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface IChangeRequest extends Document {
  student: Types.ObjectId;
  type: ChangeRequestType;
  currentClass?: Types.ObjectId;
  targetClass?: Types.ObjectId;
  currentSchedule?: Types.ObjectId;
  targetSchedule?: Types.ObjectId;
  reason: string;
  status: ChangeRequestStatus;
  adminNote?: string;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const changeRequestSchema = new Schema<IChangeRequest>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sinh viên là bắt buộc'],
    },
    type: {
      type: String,
      enum: ['CLASS_CHANGE', 'SCHEDULE_CHANGE'],
      required: [true, 'Loại yêu cầu là bắt buộc'],
    },
    currentClass: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
    },
    targetClass: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
    },
    currentSchedule: {
      type: Schema.Types.ObjectId,
      ref: 'ClassSchedule',
    },
    targetSchedule: {
      type: Schema.Types.ObjectId,
      ref: 'ClassSchedule',
    },
    reason: {
      type: String,
      required: [true, 'Lý do là bắt buộc'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
    adminNote: {
      type: String,
      default: '',
    },
    processedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const ChangeRequest: Model<IChangeRequest> = mongoose.model<IChangeRequest>('ChangeRequest', changeRequestSchema);
