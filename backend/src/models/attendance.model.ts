import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export interface IAttendance extends Document {
  schedule: Types.ObjectId;
  student: Types.ObjectId;
  status: AttendanceStatus;
  note?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>(
  {
    schedule: {
      type: Schema.Types.ObjectId,
      ref: 'ClassSchedule',
      required: [true, 'Lịch học là bắt buộc'],
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sinh viên là bắt buộc'],
    },
    status: {
      type: String,
      enum: ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'],
      default: 'PRESENT',
    },
    note: {
      type: String,
      default: '',
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Ngày điểm danh là bắt buộc'],
    },
  },
  {
    timestamps: true,
  }
);

// Index để tránh điểm danh trùng
attendanceSchema.index({ schedule: 1, student: 1, date: 1 }, { unique: true });

export const Attendance: Model<IAttendance> = mongoose.model<IAttendance>('Attendance', attendanceSchema);
