import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type AssignmentStatus = 'ACTIVE' | 'CLOSED';
export type AssignmentSkill = 'LISTENING' | 'READING' | 'WRITING' | 'SPEAKING' | 'OVERALL' | 'VOCABULARY' | 'GRAMMAR' | 'OTHER';

export interface IAssignment extends Document {
  class: Types.ObjectId;
  teacher?: Types.ObjectId;
  title: string;
  description?: string;
  skill: AssignmentSkill;
  dueDate: Date;
  maxScore: number;
  status: AssignmentStatus;
  attachmentUrl?: string;
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
      enum: ['LISTENING', 'READING', 'WRITING', 'SPEAKING', 'OVERALL', 'VOCABULARY', 'GRAMMAR', 'OTHER'],
      default: 'OTHER',
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
    status: {
      type: String,
      enum: ['ACTIVE', 'CLOSED'],
      default: 'ACTIVE',
    },
    attachmentUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

assignmentSchema.index({ class: 1, dueDate: 1 });

export const Assignment: Model<IAssignment> = mongoose.model<IAssignment>('Assignment', assignmentSchema);
