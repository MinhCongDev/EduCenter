import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type SubmissionStatus = 'SUBMITTED' | 'LATE' | 'GRADED';

export interface ISubmission extends Document {
  assignment: Types.ObjectId;
  student: Types.ObjectId;
  content: string;
  attachmentUrl?: string;
  submittedAt: Date;
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
      required: [true, 'Sinh viên là bắt buộc'],
    },
    content: {
      type: String,
      default: '',
    },
    attachmentUrl: {
      type: String,
      default: '',
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['SUBMITTED', 'LATE', 'GRADED'],
      default: 'SUBMITTED',
    },
  },
  {
    timestamps: true,
  }
);

// Mỗi sinh viên chỉ nộp 1 lần cho 1 bài tập
submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

export const Submission: Model<ISubmission> = mongoose.model<ISubmission>('Submission', submissionSchema);
