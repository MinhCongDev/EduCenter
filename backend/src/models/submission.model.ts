import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type SubmissionStatus = 'SUBMITTED' | 'GRADED' | 'LATE' | 'PENDING';

export interface ISubmission extends Document {
  assignment: Types.ObjectId;
  student: Types.ObjectId;
  content: string;
  attachments: string[];
  submissionTime: Date;
  grade?: number;
  feedback?: string;
  gradedBy?: Types.ObjectId;
  status: SubmissionStatus;
  createdAt: Date;
  updatedAt: Date;
}

const submissionSchema = new Schema<ISubmission>(
  {
    assignment: {
      type: Schema.Types.ObjectId,
      ref: 'Assignment',
      required: [true, 'Bài tập là bắt buộc'],
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Học viên là bắt buộc'],
    },
    content: {
      type: String,
      default: '',
    },
    attachments: {
      type: [String],
      default: [],
    },
    submissionTime: {
      type: Date,
      default: Date.now,
    },
    grade: {
      type: Number,
      min: 0,
    },
    feedback: {
      type: String,
      default: '',
    },
    gradedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['SUBMITTED', 'GRADED', 'LATE', 'PENDING'],
      default: 'SUBMITTED',
    },
  },
  {
    timestamps: true,
  }
);

export const Submission: Model<ISubmission> = mongoose.model<ISubmission>('Submission', submissionSchema);
