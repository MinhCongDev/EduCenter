import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export interface IAttendance extends Document {
  class: Types.ObjectId;
  student: Types.ObjectId;
  schedule?: Types.ObjectId;
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
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sinh viên là bắt buộc'],
    },
    schedule: {
      type: Schema.Types.ObjectId,
      ref: 'ClassSchedule',
    },
    sessionDate: {
      type: Date,
      required: [true, 'Ngày điểm danh là bắt buộc'],
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

attendanceSchema.index({ class: 1, student: 1, sessionDate: 1 });

export const Attendance: Model<IAttendance> = mongoose.model<IAttendance>('Attendance', attendanceSchema);
