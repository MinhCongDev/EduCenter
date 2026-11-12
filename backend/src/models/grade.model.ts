import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type EvaluationType =
  | 'ENTRY_TEST'
  | 'MID_TERM'
  | 'FINAL_TEST'
  | 'MONTHLY_EVALUATION'
  | 'COURSE_EVALUATION'
  | 'MOCK_TEST'
  | 'ASSIGNMENT'
  | 'SPEAKING_ASSESSMENT'
  | 'WRITING_ASSESSMENT';

export type EvaluationRating = 'EXCELLENT' | 'GOOD' | 'SATISFACTORY' | 'NEEDS_IMPROVEMENT';

export interface IGrade extends Document {
  student: Types.ObjectId;
  class: Types.ObjectId;
  teacher: Types.ObjectId;
  evaluationType: EvaluationType;
  title: string;
  period?: string;
  rating?: EvaluationRating;
  testDate: Date;
  overallBand?: number;
  listening?: number;
  reading?: number;
  writing?: number;
  speaking?: number;
  feedback?: string;
  status: 'DRAFT' | 'PUBLISHED';
  createdAt: Date;
  updatedAt: Date;
}

const gradeSchema = new Schema<IGrade>(
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
    teacher: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Giảng viên là bắt buộc'],
    },
    evaluationType: {
      type: String,
      enum: [
        'ENTRY_TEST',
        'MID_TERM',
        'FINAL_TEST',
        'MONTHLY_EVALUATION',
        'COURSE_EVALUATION',
        'MOCK_TEST',
        'ASSIGNMENT',
        'SPEAKING_ASSESSMENT',
        'WRITING_ASSESSMENT',
      ],
      default: 'MID_TERM',
    },
    title: {
      type: String,
      required: [true, 'Tiêu đề kỳ thi/đánh giá là bắt buộc'],
      trim: true,
    },
    period: {
      type: String,
      trim: true,
      default: '',
    },
    rating: {
      type: String,
      enum: ['EXCELLENT', 'GOOD', 'SATISFACTORY', 'NEEDS_IMPROVEMENT'],
    },
    testDate: {
      type: Date,
      default: Date.now,
    },
    overallBand: {
      type: Number,
      min: 0,
      max: 9.0,
    },
    listening: {
      type: Number,
      min: 0,
      max: 9.0,
    },
    reading: {
      type: Number,
      min: 0,
      max: 9.0,
    },
    writing: {
      type: Number,
      min: 0,
      max: 9.0,
    },
    speaking: {
      type: Number,
      min: 0,
      max: 9.0,
    },
    feedback: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED'],
      default: 'PUBLISHED',
    },
  },
  {
    timestamps: true,
  }
);

export const Grade: Model<IGrade> = mongoose.model<IGrade>('Grade', gradeSchema);
