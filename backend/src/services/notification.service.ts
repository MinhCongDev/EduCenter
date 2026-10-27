import { Types } from 'mongoose';
import { Notification, INotification, NotificationType } from '../models/notification.model';
import { User, IUserPreferences } from '../models/user.model';

/**
 * Danh sách type thông báo hợp lệ — phải khớp với enum trong
 * `notification.model.ts` và với `NOTIFICATION_META` ở frontend.
 */
const VALID_TYPES: NotificationType[] = [
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
];

/**
 * Ánh xạ loại thông báo → cờ tùy chọn tương ứng trong `User.preferences`.
 * Người dùng tắt cờ tương ứng sẽ không nhận thông báo loại đó.
 */
const PREFERENCE_BY_TYPE: Partial<Record<NotificationType, keyof IUserPreferences>> = {
  GRADE_PUBLISHED: 'notifyGrades',
  ASSIGNMENT_GRADED: 'notifyGrades',
  ATTENDANCE_MARKED: 'notifyAttendance',
  CLASS_ANNOUNCEMENT: 'notifyAnnouncements',
  PAYMENT_RECEIVED: 'notifyPayments',
};

/**
 * Kiểm tra một người nhận có bật loại thông báo này không.
 * Lỗi truy vấn không được chặn thông báo (non-fatal).
 */
const isAllowedFor = async (
  userId: Types.ObjectId | string,
  type: NotificationType
): Promise<boolean> => {
  try {
    const prefKey = PREFERENCE_BY_TYPE[type];
    if (!prefKey) return true;
    const user = await User.findById(userId).select('preferences');
    if (!user) return true;
    // `preferences` là sub-document → dùng `.toObject()` để đọc giá trị.
    const prefs = (user.preferences as any)?.toObject?.() ?? user.preferences;
    if (!prefs) return true;
    if (prefs.inAppNotifications === false) return false;
    return prefs[prefKey] !== false;
  } catch (err) {
    console.error('[notify] Không đọc được preferences — vẫn gửi thông báo:', err);
    return true;
  }
};

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
    // Kiểm tra type trước khi ghi: enum của model chỉ chấp nhận một danh
    // sách cố định. Nếu type sai, Mongoose throw ValidationError và thông
    // báo sẽ KHÔNG được tạo — trước đây lỗi này bị nuốt im lặng khiến
    // học viên không bao giờ nhận được thông báo nào.
    const type = data.type || 'INFO';
    if (!VALID_TYPES.includes(type)) {
      console.error(`[notify] Loại thông báo không hợp lệ: "${type}" — bỏ qua.`);
      return null;
    }
    if (!data.user) {
      console.error('[notify] Thiếu người nhận — bỏ qua.');
      return null;
    }
    if (!(await isAllowedFor(data.user, type))) {
      return null;
    }

    return await Notification.create({
      recipient: data.user,
      type,
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
      const type = payload.type || 'INFO';
      if (!VALID_TYPES.includes(type)) {
        console.error(`[notifyMany] Loại thông báo không hợp lệ: "${type}" — bỏ qua.`);
        return 0;
      }

      // Chỉ gửi cho người dùng chưa tắt loại thông báo tương ứng.
      const recipients = await Promise.all(
        userIds.map(async (id) => ((await isAllowedFor(id, type)) ? id : null))
      );
      const targets = recipients.filter((id): id is Types.ObjectId | string => id !== null);
      if (!targets.length) return 0;

      const docs = targets.map((u) => ({
      recipient: u,
      type,
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

/**
 * Đồng bộ `Student.currentBand` với điểm mới nhất đã công bố.
 *
 * `currentBand` là kết quả đánh giá của giảng viên — học viên KHÔNG được
 * tự sửa (xem `student.controller.updateMyProfile`). Trước đây mỗi lần
 * giảng viên nhập điểm, band hiện tại của học viên trong hồ sơ vẫn giữ
 * giá trị cũ → hiển thị sai ở trang Hồ Sơ và trang Kết quả học tập.
 *
 * @param studentId  user id của học viên
 * @param overallBand band tổng hợp mới nhất
 */
export const syncStudentBand = async (
  studentId: Types.ObjectId | string,
  overallBand: number
): Promise<void> => {
  try {
    if (!studentId || Number.isNaN(overallBand)) return;
    // Import động để tránh phụ thuộc vòng (models/index ↔ services).
    const { Student } = await import('../models/student.model');
    await Student.updateOne(
      { user: studentId },
      { $set: { currentBand: overallBand } }
    );
  } catch (err) {
    console.error('[syncStudentBand] Không đồng bộ được band hiện tại:', err);
  }
};
