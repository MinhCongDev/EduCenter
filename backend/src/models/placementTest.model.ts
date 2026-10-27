import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export const PLACEMENT_TEST_DIFFICULTIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const;
export const PLACEMENT_TEST_SKILLS = ['LISTENING', 'SPEAKING', 'READING', 'WRITING'] as const;
export type PlacementTestDifficulty = typeof PLACEMENT_TEST_DIFFICULTIES[number];
export type PlacementTestSkill = typeof PLACEMENT_TEST_SKILLS[number];
export type PlacementTestStatus = 'DRAFT' | 'PUBLISHED';

export interface IPlacementTestQuestion {
  skill: PlacementTestSkill;
  prompt: string;
  options: string[];
  correctOption: number;
}

export interface IPlacementTest extends Document {
  title: string;
  course: Types.ObjectId;
  difficulty: PlacementTestDifficulty;
  durationMinutes: number;
  status: PlacementTestStatus;
  questions: IPlacementTestQuestion[];
  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new Schema<IPlacementTestQuestion>(
  {
    skill: {
      type: String,
      enum: PLACEMENT_TEST_SKILLS,
      required: true,
    },
    prompt: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    options: {
      type: [{ type: String, trim: true, maxlength: 500 }],
      required: true,
      validate: {
        validator: (options: string[]) => options.length >= 2 && options.length <= 6,
        message: 'Mỗi câu hỏi cần từ 2 đến 6 phương án',
      },
    },
    correctOption: {
      type: Number,
      required: true,
      min: 0,
      max: 5,
    },
  },
  { _id: true }
);

const placementTestSchema = new Schema<IPlacementTest>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    difficulty: {
      type: String,
      enum: PLACEMENT_TEST_DIFFICULTIES,
      required: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 5,
      max: 240,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED'],
      default: 'DRAFT',
    },
    questions: {
      type: [questionSchema],
      default: [],
      validate: {
        validator: (questions: IPlacementTestQuestion[]) => questions.length <= 100,
        message: 'Bài kiểm tra không được vượt quá 100 câu hỏi',
      },
    },
  },
  { timestamps: true }
);

placementTestSchema.index({ course: 1, difficulty: 1 }, { unique: true });

export const PlacementTest: Model<IPlacementTest> =
  mongoose.models.PlacementTest
  || mongoose.model<IPlacementTest>('PlacementTest', placementTestSchema);
