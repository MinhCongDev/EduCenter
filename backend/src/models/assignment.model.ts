import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type AssignmentStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED';
export type AssignmentType = 'HOMEWORK' | 'FINAL_EXAM' | 'QUIZ';

export interface IAssignment extends Document {
  class: Types.ObjectId;
  teacher: Types.ObjectId;
  title: string;
  description: string;
  skill?: string;
  dueDate: Date;
  maxScore: number;
  attachments: string[];
  status: AssignmentStatus;
  type?: AssignmentType;
  createdAt: Date;
  updatedAt: Date;
}

const assignmentSchema = new Schema<IAssignment>(
  {
    class: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Lớp học là bắt buộc'],
    },
    teacher: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Giảng viên là bắt buộc'],
    },
    title: {
      type: String,
      required: [true, 'Tiêu đề bài tập là bắt buộc'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    skill: {
      type: String,
      default: 'IELTS Writing',
    },
    dueDate: {
      type: Date,
      required: [true, 'Hạn nộp là bắt buộc'],
    },
    maxScore: {
      type: Number,
      default: 10,
      min: 0,
    },
    attachments: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'CLOSED'],
      default: 'PUBLISHED',
    },
    type: {
      type: String,
      enum: ['HOMEWORK', 'FINAL_EXAM', 'QUIZ'],
      default: 'HOMEWORK',
    },
  },
  {
    timestamps: true,
  }
);

export const Assignment: Model<IAssignment> = mongoose.model<IAssignment>('Assignment', assignmentSchema);

