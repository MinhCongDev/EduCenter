import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface IClassSchedule extends Document {
  class: Types.ObjectId;
  dayOfWeek: string; // 'Thứ 2', 'Thứ 3', ...
  startTime: string; // '08:00'
  endTime: string; // '10:00'
  room: string;
  createdAt: Date;
  updatedAt: Date;
}

const classScheduleSchema = new Schema<IClassSchedule>(
  {
    class: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Lớp học là bắt buộc'],
    },
    dayOfWeek: {
      type: String,
      required: [true, 'Ngày trong tuần là bắt buộc'],
      enum: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'],
    },
    startTime: {
      type: String,
      required: [true, 'Giờ bắt đầu là bắt buộc'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Giờ bắt đầu không hợp lệ (định dạng: HH:mm)'],
    },
    endTime: {
      type: String,
      required: [true, 'Giờ kết thúc là bắt buộc'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Giờ kết thúc không hợp lệ (định dạng: HH:mm)'],
    },
    room: {
      type: String,
      default: 'Phòng chưa xếp',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const ClassSchedule: Model<IClassSchedule> = mongoose.model<IClassSchedule>('ClassSchedule', classScheduleSchema);
