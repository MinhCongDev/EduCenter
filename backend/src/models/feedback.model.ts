import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface IFeedback extends Document {
  sender: Types.ObjectId;
  receiver?: Types.ObjectId;
  class?: Types.ObjectId;
  course?: Types.ObjectId;
  content: string;
  rating: number;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const feedbackSchema = new Schema<IFeedback>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Người gửi đánh giá là bắt buộc'],
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    class: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
    },
    content: {
      type: String,
      required: [true, 'Nội dung phản hồi là bắt buộc'],
      trim: true,
    },
    rating: {
      type: Number,
      required: [true, 'Đánh giá sao là bắt buộc'],
      min: 1,
      max: 5,
      default: 5,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const Feedback: Model<IFeedback> = mongoose.model<IFeedback>('Feedback', feedbackSchema);
