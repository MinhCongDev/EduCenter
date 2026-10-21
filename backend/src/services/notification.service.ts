import { Types } from 'mongoose';
import { Notification, INotification, NotificationType } from '../models/notification.model';

/**
 * Helper service to create notifications.
 * Import this from any controller (staff, teacher, etc.) to notify students.
 *
 * Example:
 *   import { notify } from '../services/notification.service';
 *   await notify({
 *     user: studentId,
 *     type: 'GRADE_PUBLISHED',
 *     title: 'Điểm mới',
 *     message: 'Bạn vừa được chấm bài Writing...',
 *     link: '/student/classes/.../grades'
 *   });
 */
export const notify = async (data: {
  user: Types.ObjectId | string;
  type?: NotificationType;
  title: string;
  message: string;
  link?: string;
}): Promise<INotification | null> => {
  try {
    return await Notification.create({
      recipient: data.user,
      type: data.type || 'INFO',
      title: data.title,
      content: data.message,
      linkUrl: data.link || '',
    });
  } catch (err) {
    // Non-fatal: a notification failure should not break the parent flow
    console.error('[notify] Failed to create notification:', err);
    return null;
  }
};

export const notifyMany = async (
  userIds: Array<Types.ObjectId | string>,
  payload: {
    type?: NotificationType;
    title: string;
    message: string;
    link?: string;
  }
): Promise<number> => {
  if (!userIds.length) return 0;
  try {
    const docs = userIds.map((u) => ({
      recipient: u,
      type: payload.type || 'INFO',
      title: payload.title,
      content: payload.message,
      linkUrl: payload.link || '',
    }));
    const result = await Notification.insertMany(docs, { ordered: false });
    return result.length;
  } catch (err) {
    console.error('[notifyMany] Failed:', err);
    return 0;
  }
};
