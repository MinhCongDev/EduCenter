import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type NotificationType = 'INFO' | 'ALERT' | 'SUCCESS' | 'WARNING';

export interface INotification extends Document {
  recipient: Types.ObjectId;
  title: string;
  content: string;
  type: NotificationType;
  isRead: boolean;
  linkUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Người nhận thông báo là bắt buộc'],
    },
    title: {
      type: String,
      required: [true, 'Tiêu đề thông báo là bắt buộc'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Nội dung thông báo là bắt buộc'],
    },
    type: {
      type: String,
      enum: ['INFO', 'ALERT', 'SUCCESS', 'WARNING'],
      default: 'INFO',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    linkUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const Notification: Model<INotification> = mongoose.model<INotification>('Notification', notificationSchema);
