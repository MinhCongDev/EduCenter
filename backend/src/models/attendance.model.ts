import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export interface IAttendance extends Document {
  class: Types.ObjectId;
  classSchedule?: Types.ObjectId;
  student: Types.ObjectId;
  sessionDate: Date;
  status: AttendanceStatus;
  notes?: string;
  recordedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>(
  {
    class: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Lớp học là bắt buộc'],
    },
    classSchedule: {
      type: Schema.Types.ObjectId,
      ref: 'ClassSchedule',
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Học viên là bắt buộc'],
    },
    sessionDate: {
      type: Date,
      required: [true, 'Ngày học là bắt buộc'],
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'],
      default: 'PRESENT',
    },
    notes: {
      type: String,
      default: '',
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export const Attendance: Model<IAttendance> = mongoose.model<IAttendance>('Attendance', attendanceSchema);
