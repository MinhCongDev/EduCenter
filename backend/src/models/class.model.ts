import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type ClassStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface IClass extends Document {
  classCode: string;
  course: Types.ObjectId;
  teacher: Types.ObjectId;
  room: string;
  scheduleDays: string[];
  timeSlot: string;
  startDate: Date;
  endDate: Date;
  capacity: number;
  status: ClassStatus;
  createdAt: Date;
  updatedAt: Date;
}

const classSchema = new Schema<IClass>(
  {
    classCode: {
      type: String,
      required: [true, 'Mã lớp học là bắt buộc'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Khóa học là bắt buộc'],
    },
    teacher: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Giảng viên là bắt buộc'],
    },
    room: {
      type: String,
      default: 'Phòng học 101',
      trim: true,
    },
    scheduleDays: {
      type: [String],
      default: ['Thứ 2', 'Thứ 4', 'Thứ 6'],
    },
    timeSlot: {
      type: String,
      default: '18:30 - 20:30',
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    capacity: {
      type: Number,
      default: 30,
      min: 1,
    },
    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'OPEN',
    },
  },
  {
    timestamps: true,
  }
);

export const Class: Model<IClass> = mongoose.model<IClass>('Class', classSchema);
