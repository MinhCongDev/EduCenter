import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type RequestType = 'CLASS_CHANGE' | 'SCHEDULE_CHANGE' | 'TEACHER_SCHEDULE_CHANGE';
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface IChangeRequest extends Document {
  student?: Types.ObjectId;
  teacher?: Types.ObjectId;
  requesterRole: 'STUDENT' | 'TEACHER';
  requestType: RequestType;
  currentClass: Types.ObjectId;
  targetClass?: Types.ObjectId;
  currentSchedule?: string;
  targetSchedule?: string;
  sessionDate?: Date;
  targetDate?: Date;
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
      required: false,
    },
    teacher: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    requesterRole: {
      type: String,
      enum: ['STUDENT', 'TEACHER'],
      default: 'STUDENT',
    },
    requestType: {
      type: String,
      enum: ['CLASS_CHANGE', 'SCHEDULE_CHANGE', 'TEACHER_SCHEDULE_CHANGE'],
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
    currentSchedule: {
      type: String,
      default: '',
    },
    targetSchedule: {
      type: String,
      default: '',
    },
    sessionDate: {
      type: Date,
    },
    targetDate: {
      type: Date,
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
