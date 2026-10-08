import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ICourse extends Document {
  code: string;
  title: string;
  description: string;
  category: string;
  durationWeeks: number;
  tuitionFee: number;
  status: 'ACTIVE' | 'INACTIVE';
  syllabus: string[];
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<ICourse>(
  {
    code: {
      type: String,
      required: [true, 'Mã khóa học là bắt buộc'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    title: {
      type: String,
      required: [true, 'Tên khóa học là bắt buộc'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      required: [true, 'Danh mục là bắt buộc'],
      trim: true,
    },
    durationWeeks: {
      type: Number,
      required: [true, 'Thời lượng (tuần) là bắt buộc'],
      min: 1,
    },
    tuitionFee: {
      type: Number,
      required: [true, 'Học phí là bắt buộc'],
      min: 0,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
    },
    syllabus: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const Course: Model<ICourse> = mongoose.model<ICourse>('Course', courseSchema);
