import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface IGrade extends Document {
  submission: Types.ObjectId;
  teacher: Types.ObjectId;
  score?: number;
  feedback?: string;
  gradedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const gradeSchema = new Schema<IGrade>(
  {
    submission: {
      type: Schema.Types.ObjectId,
      ref: 'Submission',
      required: [true, 'Bài nộp là bắt buộc'],
      unique: true, // Mỗi submission chỉ có 1 điểm
    },
    teacher: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Giảng viên chấm điểm là bắt buộc'],
    },
    score: {
      type: Number,
      min: 0,
      max: 10,
    },
    feedback: {
      type: String,
      default: '',
    },
    gradedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const Grade: Model<IGrade> = mongoose.model<IGrade>('Grade', gradeSchema);
