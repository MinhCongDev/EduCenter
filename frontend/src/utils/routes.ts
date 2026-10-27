// ===========================
// Kiểm tra link nội bộ
// ===========================

/**
 * Các route nội bộ mà hệ thống được phép điều hướng tới từ dữ liệu
 * (notification, announcement...).
 *
 * Bối cảnh: seed cũ ghi linkUrl là '/student/grades' và '/student/assignments'
 * trong khi route thật là '/student/classes/:id/grades' và
 * '/student/classes/:id/assignments' → click thông báo là rơi vào trang 404.
 * Để chắc chắn, mọi link lấy từ DB đều phải đi qua `resolveInternalLink`.
 */

/** Route tĩnh (không có tham số). */
const STATIC_ROUTES = [
  '/',
  '/courses',
  '/announcements',
  '/login',
  '/register',
  '/student/dashboard',
  '/student/classes',
  '/student/tuition',
  '/student/requests',
  '/student/notifications',
  '/student/profile',
  '/student/schedule',
  '/teacher/dashboard',
  '/staff/dashboard',
  '/staff/courses',
  '/staff/classes',
  '/staff/requests',
  '/staff/feedback',
  '/director/dashboard',
];

/** Route có tham số — mẫu regex tương ứng. */
const DYNAMIC_ROUTE_PATTERNS: RegExp[] = [
  /^\/student\/classes\/[A-Za-z0-9]+$/,
  /^\/student\/classes\/[A-Za-z0-9]+\/(assignments|attendance|grades|schedule)$/,
];

/**
 * Kiểm tra một link có phải route nội bộ hợp lệ của hệ thống hay không.
 * Chỉ chấp nhận link bắt đầu bằng '/' và khớp với một route đã biết.
 */
export const isKnownInternalRoute = (path: string): boolean => {
  if (!path || !path.startsWith('/')) return false;

  // Tách query string / hash.
  const cleanPath = path.split('?')[0].split('#')[0];
  if (!cleanPath || cleanPath.length > 1 && cleanPath.endsWith('/')) {
    // Bỏ dấu '/' cuối (trừ root) để so khớp chuẩn.
    return STATIC_ROUTES.includes(cleanPath.replace(/\/$/, ''));
  }

  if (STATIC_ROUTES.includes(cleanPath)) return true;
  return DYNAMIC_ROUTE_PATTERNS.some((re) => re.test(cleanPath));
};

/**
 * Chuẩn hoá linkUrl lấy từ API:
 *  - link không hợp lệ (rỗng, link ngoài, route không tồn tại) → trả về null
 *    để UI bỏ qua việc điều hướng thay vì đưa người dùng tới trang 404.
 *  - link hợp lệ → trả về nguyên bản (kèm query string nếu có).
 */
export const resolveInternalLink = (linkUrl?: string | null): string | null => {
  if (!linkUrl || typeof linkUrl !== 'string') return null;

  const trimmed = linkUrl.trim();
  if (!trimmed.startsWith('/')) return null;

  const [path, ...rest] = trimmed.split('?');
  const query = rest.length ? `?${rest.join('?')}` : '';

  if (!isKnownInternalRoute(path)) return null;

  return `${path}${query}`;
};
