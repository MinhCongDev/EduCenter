import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type AssignmentStatus = 'ACTIVE' | 'CLOSED';

export interface IAssignment extends Document {
  class: Types.ObjectId;
  title: string;
  description?: string;
  dueDate: Date;
  maxScore?: number;
  status: AssignmentStatus;
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
    title: {
      type: String,
      required: [true, 'Tiêu đề bài tập là bắt buộc'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
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
  },
  {
    timestamps: true,
  }
);

export const Assignment: Model<IAssignment> = mongoose.model<IAssignment>('Assignment', assignmentSchema);
