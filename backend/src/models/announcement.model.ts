import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type AnnouncementAudience = 'ALL' | 'STUDENTS' | 'TEACHERS' | 'STAFF';
export type AnnouncementStatus = 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';

export interface IAnnouncement extends Document {
  title: string;
  content: string;
  summary?: string;
  author: Types.ObjectId;
  category: string;
  targetAudience: AnnouncementAudience;
  isPinned: boolean;
  status: AnnouncementStatus;
  publicationDate: Date;
  imageUrl?: string;
  views: number;
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
    summary: {
      type: String,
      default: '',
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      default: 'Chung',
      trim: true,
    },
    targetAudience: {
      type: String,
      enum: ['ALL', 'STUDENTS', 'TEACHERS', 'STAFF'],
      default: 'ALL',
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['PUBLISHED', 'DRAFT', 'ARCHIVED'],
      default: 'PUBLISHED',
    },
    publicationDate: {
      type: Date,
      default: Date.now,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Announcement: Model<IAnnouncement> = mongoose.model<IAnnouncement>('Announcement', announcementSchema);
