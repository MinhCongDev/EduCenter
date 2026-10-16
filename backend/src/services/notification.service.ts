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
      user: data.user,
      type: data.type || 'SYSTEM',
      title: data.title,
      message: data.message,
      link: data.link || '',
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
      user: u,
      type: payload.type || 'SYSTEM',
      title: payload.title,
      message: payload.message,
      link: payload.link || '',
    }));
    const result = await Notification.insertMany(docs, { ordered: false });
    return result.length;
  } catch (err) {
    console.error('[notifyMany] Failed:', err);
    return 0;
  }
};
