/**
 * Quy tắc dùng chung cho Enrollment.
 *
 * Lý do tồn tại file này:
 * Trước đây các controller lọc theo 2 tiêu chí khác nhau:
 *   - `status: 'ENROLLED'`            (chặn học viên có enrollment COMPLETED)
 *   - `status: { $ne: 'DROPPED' }`    (cho phép PENDING + COMPLETED)
 * Hệ quả: một học viên đã hoàn thành khóa học vẫn thấy lớp trong danh sách
 * (`getMyClasses`) nhưng bị trả 403 khi mở bài tập / điểm / lịch của lớp đó.
 *
 * Chuẩn hoá lại: một enrollment được coi là "đang có hiệu lực" khi status
 * là ENROLLED hoặc COMPLETED. Chỉ DROPPED (và PENDING - chưa xác nhận ghi danh)
 * mới bị loại khỏi quyền truy cập dữ liệu lớp học.
 */

/** Các trạng thái enrollment còn hiệu lực (học viên vẫn thuộc lớp). */
export const ACTIVE_ENROLLMENT_STATUSES = ['ENROLLED', 'COMPLETED'] as const;

/** Điều kiện Mongoose để lấy các enrollment còn hiệu lực. */
export const activeEnrollmentFilter = () => ({
  status: { $in: [...ACTIVE_ENROLLMENT_STATUSES] },
});

/** Kiểm tra một enrollment cụ thể có còn hiệu lực hay không. */
export const isActiveEnrollment = (status?: string | null): boolean =>
  !!status && (ACTIVE_ENROLLMENT_STATUSES as readonly string[]).includes(status);
