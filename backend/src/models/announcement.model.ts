import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface IAnnouncement extends Document {
  title: string;
  content: string;
  author: Types.ObjectId;
  targetAudience: 'ALL' | 'STUDENTS' | 'TEACHERS';
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const announcementSchema = new Schema<IAnnouncement>(
  {
    title: {
      type: String,
      required: [true, 'Tiêu đề thông báo là bắt buộc'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Nội dung thông báo là bắt buộc'],
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetAudience: {
      type: String,
      enum: ['ALL', 'STUDENTS', 'TEACHERS'],
      default: 'ALL',
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Announcement: Model<IAnnouncement> = mongoose.model<IAnnouncement>('Announcement', announcementSchema);
