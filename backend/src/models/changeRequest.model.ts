import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type ChangeRequestType = 'CHANGE_CLASS' | 'CHANGE_SCHEDULE' | 'WITHDRAW';
export type ChangeRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface IChangeRequest extends Document {
  student: Types.ObjectId;
  type: ChangeRequestType;
  // For CHANGE_CLASS / CHANGE_SCHEDULE
  currentClass?: Types.ObjectId;
  targetClass?: Types.ObjectId;
  // Free-text fallbacks (e.g. user types class code manually)
  currentClassCode?: string;
  targetClassCode?: string;
  currentSchedule?: string;
  targetSchedule?: string;
  reason: string;
  status: ChangeRequestStatus;
  adminNote?: string;
  processedBy?: Types.ObjectId;
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
      enum: ['CHANGE_CLASS', 'CHANGE_SCHEDULE', 'WITHDRAW'],
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
    currentClassCode: { type: String, default: '' },
    targetClassCode: { type: String, default: '' },
    currentSchedule: { type: String, default: '' },
    targetSchedule: { type: String, default: '' },
    reason: {
      type: String,
      required: [true, 'Lý do là bắt buộc'],
      trim: true,
      minlength: [5, 'Lý do phải có ít nhất 5 ký tự'],
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
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    processedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

changeRequestSchema.index({ student: 1, createdAt: -1 });

export const ChangeRequest: Model<IChangeRequest> = mongoose.model<IChangeRequest>('ChangeRequest', changeRequestSchema);
