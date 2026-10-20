import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface IClassSchedule extends Document {
  class: Types.ObjectId;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  classroom: string;
  room?: string;
  topic?: string;
  status: 'ACTIVE' | 'CANCELLED';
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
      required: [true, 'Thứ trong tuần là bắt buộc'],
      enum: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'],
    },
    startTime: {
      type: String,
      required: [true, 'Giờ bắt đầu là bắt buộc'],
      trim: true,
    },
    endTime: {
      type: String,
      required: [true, 'Giờ kết thúc là bắt buộc'],
      trim: true,
    },
    classroom: {
      type: String,
      required: [true, 'Phòng học là bắt buộc'],
      trim: true,
      default: 'Phòng học 101',
    },
    topic: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'CANCELLED'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

classScheduleSchema.virtual('room').get(function () {
  return this.classroom;
});

export const ClassSchedule: Model<IClassSchedule> = mongoose.model<IClassSchedule>('ClassSchedule', classScheduleSchema);
