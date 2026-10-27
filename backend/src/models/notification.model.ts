import mongoose, { Document, Schema, Model, Types } from 'mongoose';

/**
 * Loại thông báo.
 *
 * Gồm 4 type gốc (INFO/ALERT/SUCCESS/WARNING) và các type nghiệp vụ mở rộng
 * dùng cho module Student. Trước đây model chỉ khai báo 4 type gốc trong
 * khi `notification.service.ts` đã dùng các type nghiệp vụ (GRADE_PUBLISHED…)
 * → Mongoose validation reject, `notify()` nuốt lỗi và im lặng không tạo
 * được thông báo. Frontend cũng đã map sẵn icon/màu cho các type này.
 */
export type NotificationType =
  | 'INFO'
  | 'ALERT'
  | 'SUCCESS'
  | 'WARNING'
  | 'GRADE_PUBLISHED'
  | 'ASSIGNMENT_GRADED'
  | 'REQUEST_APPROVED'
  | 'REQUEST_REJECTED'
  | 'PAYMENT_RECEIVED'
  | 'CLASS_ANNOUNCEMENT'
  | 'ATTENDANCE_MARKED';

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
      enum: [
        'INFO',
        'ALERT',
        'SUCCESS',
        'WARNING',
        'GRADE_PUBLISHED',
        'ASSIGNMENT_GRADED',
        'REQUEST_APPROVED',
        'REQUEST_REJECTED',
        'PAYMENT_RECEIVED',
        'CLASS_ANNOUNCEMENT',
        'ATTENDANCE_MARKED',
      ],
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
