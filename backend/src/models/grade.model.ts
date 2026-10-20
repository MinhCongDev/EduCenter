import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type EvaluationType =
  | 'MOCK_TEST'
  | 'MID_TERM'
  | 'FINAL_TEST'
  | 'ASSIGNMENT'
  | 'SPEAKING_ASSESSMENT'
  | 'WRITING_ASSESSMENT';

export interface IGrade extends Document {
  student: Types.ObjectId;
  class: Types.ObjectId;
  teacher: Types.ObjectId;
  evaluationType: EvaluationType;
  title: string;
  testDate: Date;
  overallBand: number;
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
        'MOCK_TEST',
        'MID_TERM',
        'FINAL_TEST',
        'ASSIGNMENT',
        'SPEAKING_ASSESSMENT',
        'WRITING_ASSESSMENT',
      ],
      default: 'MOCK_TEST',
    },
    title: {
      type: String,
      required: [true, 'Tiêu đề kỳ thi/bài đánh giá là bắt buộc'],
      trim: true,
    },
    testDate: {
      type: Date,
      default: Date.now,
    },
    overallBand: {
      type: Number,
      required: [true, 'Điểm Overall Band là bắt buộc'],
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
