import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface IStudentProgress extends Document {
  student: Types.ObjectId; // ref: User
  class: Types.ObjectId;   // ref: Class
  course: Types.ObjectId;  // ref: Course
  milestoneId: string;     // Unique identifier for the milestone within the course
  completed: boolean;
  completedAt?: Date;
  markedBy?: Types.ObjectId; // ref: User (Teacher or Staff)
  note?: string;
  score?: number;
  createdAt: Date;
  updatedAt: Date;
}

const studentProgressSchema = new Schema<IStudentProgress>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Học viên là bắt buộc'],
    },
    class: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Lớp học là bắt buộc'],
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Khóa học là bắt buộc'],
    },
    milestoneId: {
      type: String,
      required: [true, 'Mã mốc tiến độ là bắt buộc'],
      trim: true,
    },
    completed: {
      type: Boolean,
      default: true,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
    markedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    note: {
      type: String,
      default: '',
    },
    score: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

studentProgressSchema.index({ student: 1, class: 1, milestoneId: 1 }, { unique: true });

export const StudentProgress: Model<IStudentProgress> = mongoose.model<IStudentProgress>(
  'StudentProgress',
  studentProgressSchema
);
