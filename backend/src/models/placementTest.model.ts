import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export const PLACEMENT_TEST_DIFFICULTIES = [
  'BEGINNER',
  'INTERMEDIATE',
  'ADVANCED',
  'Cơ bản - Trung cấp',
  'Trung cấp - Khá',
  'Nâng cao - Chuyên sâu',
] as const;

export const PLACEMENT_TEST_SKILLS = [
  'LISTENING',
  'SPEAKING',
  'READING',
  'WRITING',
  'Grammar',
  'Vocabulary',
  'Reading',
  'Critical Reasoning',
] as const;

export type PlacementTestDifficulty = string;
export type PlacementTestSkill = string;
export type PlacementTestStatus = 'DRAFT' | 'PUBLISHED';

export interface IPlacementOption {
  key?: string;
  text: string;
}

export interface IPlacementPassage {
  id?: string;
  title: string;
  subtitle?: string;
  content: string;
}

export interface IPlacementTestQuestion {
  _id?: string;
  id?: string;
  questionNumber?: number;
  skill: string;
  prompt: string;
  questionText?: string;
  section?: string;
  passageId?: string;
  type?: string;
  options: (string | IPlacementOption)[];
  correctOption: number;
  correctAnswer?: string;
  explanation?: string;
}

export interface IPlacementTest extends Document {
  slug?: string;
  title: string;
  subtitle?: string;
  category?: string;
  targetLevel?: string;
  course?: Types.ObjectId;
  difficulty: string;
  durationMinutes: number;
  status: PlacementTestStatus;
  bannerUrl?: string;
  description?: string;
  instructions?: string[];
  passages?: IPlacementPassage[];
  questions: IPlacementTestQuestion[];
  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new Schema(
  {
    skill: {
      type: String,
      default: 'READING',
    },
    prompt: {
      type: String,
      required: true,
      trim: true,
    },
    questionText: {
      type: String,
    },
    section: {
      type: String,
    },
    passageId: {
      type: String,
    },
    type: {
      type: String,
      default: 'MULTIPLE_CHOICE',
    },
    options: {
      type: Schema.Types.Mixed,
      required: true,
    },
    correctOption: {
      type: Number,
      default: 0,
    },
    correctAnswer: {
      type: String,
    },
    explanation: {
      type: String,
      default: '',
    },
  },
  { _id: true }
);

const placementTestSchema = new Schema<IPlacementTest>(
  {
    slug: {
      type: String,
      trim: true,
      sparse: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 250,
    },
    subtitle: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      default: 'Chẩn đoán trình độ',
    },
    targetLevel: {
      type: String,
      default: 'Band 0.0 - 5.5',
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
    },
    difficulty: {
      type: String,
      default: 'BEGINNER',
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 5,
      max: 240,
      default: 30,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED'],
      default: 'PUBLISHED',
    },
    bannerUrl: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    instructions: {
      type: [String],
      default: [],
    },
    passages: [
      {
        id: { type: String },
        title: { type: String },
        subtitle: { type: String },
        content: { type: String },
      },
    ],
    questions: {
      type: [questionSchema],
      default: [],
    },
  },
  { timestamps: true }
);

placementTestSchema.index({ status: 1 });

export const PlacementTest: Model<IPlacementTest> =
  mongoose.models.PlacementTest
  || mongoose.model<IPlacementTest>('PlacementTest', placementTestSchema);
