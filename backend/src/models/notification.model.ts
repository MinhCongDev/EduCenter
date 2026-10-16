import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type NotificationType =
  | 'GRADE_PUBLISHED'
  | 'ASSIGNMENT_GRADED'
  | 'REQUEST_APPROVED'
  | 'REQUEST_REJECTED'
  | 'PAYMENT_RECEIVED'
  | 'CLASS_ANNOUNCEMENT'
  | 'ATTENDANCE_MARKED'
  | 'SYSTEM';

export interface INotification extends Document {
  user: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Người nhận là bắt buộc'],
      index: true,
    },
    type: {
      type: String,
      enum: [
        'GRADE_PUBLISHED',
        'ASSIGNMENT_GRADED',
        'REQUEST_APPROVED',
        'REQUEST_REJECTED',
        'PAYMENT_RECEIVED',
        'CLASS_ANNOUNCEMENT',
        'ATTENDANCE_MARKED',
        'SYSTEM',
      ],
      default: 'SYSTEM',
    },
    title: {
      type: String,
      required: [true, 'Tiêu đề là bắt buộc'],
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: [true, 'Nội dung là bắt buộc'],
      trim: true,
      maxlength: 1000,
    },
    link: {
      type: String,
      default: '',
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

export const Notification: Model<INotification> = mongoose.model<INotification>(
  'Notification',
  notificationSchema
);

// =====================================================
// Helper: Create a notification for a user
// =====================================================
export const createNotification = async (data: {
  user: Types.ObjectId | string;
  type?: NotificationType;
  title: string;
  message: string;
  link?: string;
}): Promise<INotification> => {
  return Notification.create({
    user: data.user,
    type: data.type || 'SYSTEM',
    title: data.title,
    message: data.message,
    link: data.link || '',
  });
};
