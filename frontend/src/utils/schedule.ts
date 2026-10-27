// ===========================
// Lịch học — helpers dùng chung
// ===========================

/** Thứ tự chuẩn các ngày trong tuần (Thứ 2 → Chủ Nhật). */
export const WEEK_ORDER = [
  'thứ 2',
  'thứ 3',
  'thứ 4',
  'thứ 5',
  'thứ 6',
  'thứ 7',
  'chủ nhật',
];

/**
 * Chuẩn hoá chuỗi ngày trong tuần về key dùng để so sánh:
 * bỏ khoảng trắng thừa, ép NFC (Unicode chuẩn), chuyển chữ thường.
 *
 * Ví dụ: 'Thứ 2' / 'THỨ 2' / 'thứ  2' → 'thứ 2'
 */
export const normalizeDay = (day?: string | null): string =>
  (day || '').trim().normalize('NFC').toLowerCase();

/**
 * Chuyển ngày trong tuần về số thứ tự (Thứ 2 = 0 ... Chủ Nhật = 6).
 * Trả về -1 nếu không nhận diện được.
 */
export const dayIndex = (day?: string | null): number =>
  WEEK_ORDER.indexOf(normalizeDay(day));

/**
 * Tìm nhãn chuẩn (đúng hoa/thường như trong DB) cho một ngày.
 * Dùng để gom nhóm các bản ghi ghi 'Chủ Nhật' và 'chủ nhật' về một nhóm.
 */
export const canonicalDay = (day: string): string => {
  const key = normalizeDay(day);
  const found = WEEK_ORDER.find((d) => d === key);
  if (!found) return day;
  // Trả về đúng casing trong DB: 'Chủ Nhật' viết hoa C và N.
  return found === 'chủ nhật' ? 'Chủ Nhật' : `Thứ ${found.slice(-1)}`;
};

/**
 * Chuyển 'HH:mm' thành số phút kể từ đầu ngày.
 * Trả về null nếu chuỗi không hợp lệ.
 */
export const timeToMinutes = (time?: string | null): number | null => {
  if (!time) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (Number.isNaN(h) || Number.isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    return null;
  }
  return h * 60 + m;
};

/**
 * Tính "phút tương đối" của một buổi học so với thời điểm hiện tại.
 *
 * Giá trị càng nhỏ càng gần. Nếu buổi học đã qua trong tuần này thì trả về
 * số lớn dương (đã qua), còn buổi sắp tới trả về số nhỏ (còn ở phía trước).
 *
 * @param dayOfWeek  'Thứ 2' ... 'Chủ Nhật'
 * @param startTime  'HH:mm'
 * @param now        thời điểm hiện tại (mặc định = Date.now())
 */
export const minutesUntilSession = (
  dayOfWeek?: string | null,
  startTime?: string | null,
  now: number = Date.now()
): number => {
  const dayIdx = dayIndex(dayOfWeek);
  const minutes = timeToMinutes(startTime);

  if (dayIdx === -1 || minutes === null) {
    // Không xác định được → đẩy xuống cuối danh sách.
    return Number.MAX_SAFE_INTEGER;
  }

  const nowDate = new Date(now);
  const nowMinutes = nowDate.getHours() * 60 + nowDate.getMinutes();

  // JS: 0 = Chủ Nhật ... 6 = Thứ 7. Quy đổi sang Thứ 2 = 0.
  const jsDay = nowDate.getDay();
  const todayIdx = jsDay === 0 ? 6 : jsDay - 1;

  let deltaDays = dayIdx - todayIdx;
  if (deltaDays < 0) deltaDays += 7;

  let deltaMinutes = minutes - nowMinutes;
  if (deltaDays === 0 && deltaMinutes < 0) {
    // Buổi hôm nay đã qua → sang tuần sau.
    deltaDays = 7;
    deltaMinutes += 7 * 24 * 60;
  }

  return deltaDays * 24 * 60 + deltaMinutes;
};

/**
 * Sắp xếp lịch học theo thứ tự thời gian thực tế:
 * trước hết theo ngày trong tuần (Thứ 2 → CN), sau đó theo giờ bắt đầu.
 */
export const sortByWeekOrder = <T extends { dayOfWeek?: string; startTime?: string }>(
  items: T[]
): T[] =>
  [...items].sort((a, b) => {
    const da = dayIndex(a.dayOfWeek);
    const db = dayIndex(b.dayOfWeek);
    if (da !== db) {
      // Ngày không nhận diện được đẩy xuống cuối.
      if (da === -1) return 1;
      if (db === -1) return -1;
      return da - db;
    }
    return (a.startTime || '').localeCompare(b.startTime || '');
  });
