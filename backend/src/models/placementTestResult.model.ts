import mongoose, { Document, Schema, Model, Types } from 'mongoose';

/**
 * Lịch sử làm bài kiểm tra đầu vào của học viên.
 *
 * Vì sao cần model riêng:
 * - `Student.placementTestScore` chỉ lưu KẾT QUẢ MỚI NHẤT, ghi đè mỗi lần
 *   làm bài → không tra lịch sử được.
 * - Frontend `placementTest.service.ts -> getMyHistory()` gọi
 *   `GET /api/placement-tests/my/history` và cần các field:
 *   `id, testId, testTitle, submittedAt, score, totalQuestions,
 *    scorePercentage, predictedBand, levelName, recommendedCourse`.
 *
 * Lưu ý: `student` trỏ tới `User` (không phải `Student`) vì middleware
 * `authenticate` gắn `req.user` là bản ghi trong collection `users`.
 */
export interface IPlacementTestResult extends Document {
  student: Types.ObjectId;   // ref: User
  test: Types.ObjectId;      // ref: PlacementTest
  testId: string;            // slug hoặc _id dạng string (theo giao diện)
  testTitle: string;
  submittedAt: Date;
  score: number;             // số câu đúng
  totalQuestions: number;
  scorePercentage: number;
  predictedBand: number;
  bandRange?: string;
  levelName: string;
  recommendedCourse: string;
  createdAt: Date;
  updatedAt: Date;
}

const placementTestResultSchema = new Schema<IPlacementTestResult>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Học viên là bắt buộc'],
    },
    test: {
      type: Schema.Types.ObjectId,
      ref: 'PlacementTest',
      required: [true, 'Bài kiểm tra là bắt buộc'],
    },
    testId: {
      type: String,
      required: true,
      trim: true,
    },
    testTitle: {
      type: String,
      required: true,
      trim: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    score: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalQuestions: {
      type: Number,
      default: 0,
      min: 0,
    },
    scorePercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    predictedBand: {
      type: Number,
      default: 0,
    },
    bandRange: {
      type: String,
      default: '',
    },
    levelName: {
      type: String,
      default: '',
    },
    recommendedCourse: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Một học viên có nhiều lần làm bài → index theo student + thời gian.
placementTestResultSchema.index({ student: 1, submittedAt: -1 });

export const PlacementTestResult: Model<IPlacementTestResult> =
  mongoose.models.PlacementTestResult
  || mongoose.model<IPlacementTestResult>('PlacementTestResult', placementTestResultSchema);
