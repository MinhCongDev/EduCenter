import mongoose, { Document, Schema, Model } from 'mongoose';

export type CourseStatus = 'ACTIVE' | 'INACTIVE' | 'DRAFT';
export type LearningFormat = 'ONLINE' | 'OFFLINE' | 'BLENDED';

export interface ICourse extends Document {
  code: string;
  title: string;
  name?: string;
  description: string;
  category: string;
  entryLevel: string;
  targetLevel?: string;
  sessions: number;
  tuitionFee: number;
  format: LearningFormat;
  status: CourseStatus;
  learningObjectives: string[];
  syllabus: string[];
  milestones?: ICourseMilestone[];
  bannerUrl?: string;
  featured?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type MilestoneType =
  | 'LESSON_COMPLETION'
  | 'ASSIGNMENT'
  | 'MOCK_TEST'
  | 'SKILL_CHECK'
  | 'CHECKPOINT';

export interface ICourseMilestone {
  milestoneId: string;
  title: string;
  description?: string;
  order: number;
  type?: MilestoneType;
  targetSession?: number;
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
      default: 'IELTS Toàn Diện',
      trim: true,
    },
    entryLevel: {
      type: String,
      default: 'IELTS Foundation',
      trim: true,
    },
    targetLevel: {
      type: String,
      default: '6.5 - 7.5+',
      trim: true,
    },
    sessions: {
      type: Number,
      required: [true, 'Số buổi học là bắt buộc'],
      default: 36,
      min: 1,
    },
    tuitionFee: {
      type: Number,
      required: [true, 'Học phí là bắt buộc'],
      min: 0,
      default: 0,
    },
    format: {
      type: String,
      enum: ['ONLINE', 'OFFLINE', 'BLENDED'],
      default: 'OFFLINE',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'DRAFT'],
      default: 'ACTIVE',
    },
    learningObjectives: {
      type: [String],
      default: [],
    },
    syllabus: {
      type: [String],
      default: [],
    },
    milestones: [
      {
        milestoneId: { type: String, required: true },
        title: { type: String, required: true },
        description: { type: String, default: '' },
        order: { type: Number, default: 1 },
        type: {
          type: String,
          enum: ['LESSON_COMPLETION', 'ASSIGNMENT', 'MOCK_TEST', 'SKILL_CHECK', 'CHECKPOINT'],
          default: 'CHECKPOINT',
        },
        targetSession: { type: Number, default: 0 },
      },
    ],
    bannerUrl: {
      type: String,
      default: '',
    },
    featured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field name alias title
courseSchema.virtual('name').get(function () {
  return this.title;
});

courseSchema.virtual('price').get(function () {
  return this.tuitionFee;
});

export const Course: Model<ICourse> = mongoose.model<ICourse>('Course', courseSchema);
