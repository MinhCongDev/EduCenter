// ===========================
// Nhãn trạng thái hiển thị
// ===========================

/**
 * Gom nhãn tiếng Việt cho các trạng thái nghiệp vụ.
 *
 * Lý do tồn tại file này:
 * Trước đây mỗi page tự viết lại một hàm `xxxLabel(status)` riêng, và các
 * bản khác nhau lệch nhau — ví dụ `tuitionLabel` coi mọi thứ khác 'PAID'
 * là "Chưa thanh toán", khiến trạng thái REFUNDED bị hiển thị sai.
 * Gom về một chỗ để mọi màn hình hiển thị nhất quán.
 */

export interface StatusMeta {
  /** Nhãn tiếng Việt. */
  label: string;
  /** Class CSS cho badge (badge-green / badge-amber / ...). */
  cls: string;
  /** Icon hiển thị kèm. */
  icon: string;
}

/** Trạng thái ghi danh (Enrollment.status). */
export const ENROLLMENT_STATUS_META: Record<string, StatusMeta> = {
  PENDING: { label: 'Chờ duyệt', cls: 'badge-amber', icon: '⏳' },
  ENROLLED: { label: 'Đang học', cls: 'badge-green', icon: '🎓' },
  DROPPED: { label: 'Đã rút', cls: 'badge-purple', icon: '🚪' },
  COMPLETED: { label: 'Hoàn thành', cls: 'badge-blue', icon: '🏆' },
};

/** Trạng thái học phí (Enrollment.tuitionStatus). */
export const TUITION_STATUS_META: Record<string, StatusMeta> = {
  PENDING: { label: 'Chưa thanh toán', cls: 'badge-amber', icon: '⏳' },
  PAID: { label: 'Đã thanh toán', cls: 'badge-green', icon: '✅' },
  REFUNDED: { label: 'Đã hoàn', cls: 'badge-purple', icon: '↩️' },
};

/** Trạng thái lớp học (Class.status). */
export const CLASS_STATUS_META: Record<string, StatusMeta> = {
  OPEN: { label: 'Đang mở', cls: 'badge-green', icon: '🟢' },
  IN_PROGRESS: { label: 'Đang học', cls: 'badge-blue', icon: '📘' },
  COMPLETED: { label: 'Đã kết thúc', cls: 'badge-purple', icon: '🏁' },
  CANCELLED: { label: 'Đã huỷ', cls: 'badge-amber', icon: '🚫' },
};

/** Trạng thái yêu cầu (ChangeRequest.status). */
export const REQUEST_STATUS_META: Record<string, StatusMeta> = {
  PENDING: { label: 'Đang chờ', cls: 'badge-amber', icon: '⏳' },
  APPROVED: { label: 'Đã duyệt', cls: 'badge-green', icon: '✅' },
  REJECTED: { label: 'Từ chối', cls: 'badge-purple', icon: '❌' },
};

/** Trạng thái học viên (Student.status). */
export const STUDENT_STATUS_META: Record<string, StatusMeta> = {
  ACTIVE: { label: 'Đang học', cls: 'badge-green', icon: '🎓' },
  GRADUATED: { label: 'Đã tốt nghiệp', cls: 'badge-blue', icon: '🎓' },
  RESERVED: { label: 'Đã giữ chỗ', cls: 'badge-amber', icon: '🔖' },
  DROPPED: { label: 'Đã rút', cls: 'badge-purple', icon: '🚪' },
};

const FALLBACK: StatusMeta = { label: '—', cls: 'badge-amber', icon: '❓' };

/** Lấy metadata của trạng thái, có fallback an toàn. */
export const statusMeta = (map: Record<string, StatusMeta>, status?: string | null): StatusMeta => {
  if (!status) return FALLBACK;
  return map[status] || { ...FALLBACK, label: status };
};

/** Nhãn trạng thái ghi danh. */
export const enrollmentStatusMeta = (s?: string | null) => statusMeta(ENROLLMENT_STATUS_META, s);

/** Nhãn trạng thái học phí. */
export const tuitionStatusMeta = (s?: string | null) => statusMeta(TUITION_STATUS_META, s);

/** Nhãn trạng thái lớp học. */
export const classStatusMeta = (s?: string | null) => statusMeta(CLASS_STATUS_META, s);

/** Nhãn trạng thái yêu cầu. */
export const requestStatusMeta = (s?: string | null) => statusMeta(REQUEST_STATUS_META, s);

/** Nhãn trạng thái học viên. */
export const studentStatusMeta = (s?: string | null) => statusMeta(STUDENT_STATUS_META, s);
