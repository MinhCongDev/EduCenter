import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type GradeEvaluationType = 'LISTENING' | 'READING' | 'WRITING' | 'SPEAKING' | 'OVERALL' | 'QUIZ' | 'MIDTERM' | 'FINAL' | 'OTHER';
export type GradeStatus = 'DRAFT' | 'PUBLISHED';

export interface IGrade extends Document {
  student: Types.ObjectId;
  class: Types.ObjectId;
  teacher: Types.ObjectId;
  evaluationType: GradeEvaluationType;
  title: string;
  testDate: Date;
  maxScore: number;
  score: number;
  // IELTS band breakdown (optional)
  listening?: number;
  reading?: number;
  writing?: number;
  speaking?: number;
  overallBand?: number;
  feedback?: string;
  status: GradeStatus;
  createdAt: Date;
  updatedAt: Date;
}

const gradeSchema = new Schema<IGrade>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sinh viên là bắt buộc'],
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
      enum: ['LISTENING', 'READING', 'WRITING', 'SPEAKING', 'OVERALL', 'QUIZ', 'MIDTERM', 'FINAL', 'OTHER'],
      default: 'OTHER',
    },
    title: {
      type: String,
      required: [true, 'Tên bài đánh giá là bắt buộc'],
      trim: true,
    },
    testDate: {
      type: Date,
      required: [true, 'Ngày thi là bắt buộc'],
    },
    maxScore: {
      type: Number,
      default: 10,
      min: 0,
    },
    score: {
      type: Number,
      required: [true, 'Điểm số là bắt buộc'],
      min: 0,
    },
    listening: { type: Number, min: 0, max: 9 },
    reading: { type: Number, min: 0, max: 9 },
    writing: { type: Number, min: 0, max: 9 },
    speaking: { type: Number, min: 0, max: 9 },
    overallBand: { type: Number, min: 0, max: 9 },
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

gradeSchema.index({ student: 1, class: 1, testDate: -1 });

export const Grade: Model<IGrade> = mongoose.model<IGrade>('Grade', gradeSchema);
