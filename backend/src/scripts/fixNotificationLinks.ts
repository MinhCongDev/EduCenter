/**
 * Script đồng bộ link thông báo (Notification.linkUrl) cho module Student.
 *
 * Vấn đề:
 *   Seed cũ tạo linkUrl là '/student/grades' và '/student/assignments' —
 *   hai route này KHÔNG tồn tại trong frontend (route thật là
 *   '/student/classes/:classId/grades' và '/student/classes/:classId/assignments').
 *   Ngoài ra '/teacher/submissions' và '/staff/requests' cũng không tồn tại.
 *   → Click thông báo là rơi vào trang 404.
 *
 * Cách sửa (hoàn toàn dựa trên dữ liệu thật, không hardcode classId):
 *   - Link về bài tập -> tìm bài tập mà học viên đã NỘP trong lớp đang ghi danh,
 *     ưu tiên khớp theo `skill` (vd "Writing Task 2") rồi tới tiêu đề.
 *   - Link về điểm    -> tìm bài đánh giá (Grade) gần nhất của học viên.
 *   - Link về học phí -> '/student/tuition'.
 *   - Link giảng viên -> '/teacher/dashboard?tab=assignments_grading'.
 *   - Link nhân viên  -> '/staff/dashboard'.
 *   - Không xác định được -> xoá link (frontend sẽ bỏ qua điều hướng).
 *
 * Script chạy lại nhiều lần cho kết quả giống nhau (idempotent).
 * Chạy: npx ts-node src/scripts/fixNotificationLinks.ts
 */
import mongoose from 'mongoose';
import { config } from '../config';
import '../models/user.model';
import '../models/class.model';
import '../models/course.model';
import '../models/enrollment.model';
import '../models/assignment.model';
import '../models/submission.model';
import '../models/grade.model';
import '../models/notification.model';
import { ACTIVE_ENROLLMENT_STATUSES } from '../utils/enrollment';

/** Chuẩn hoá chuỗi để so khớp không phân biệt hoa thường / dấu cách / tiếng Việt. */
const norm = (s: string) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** Lấy các classId mà học viên đang ghi danh (còn hiệu lực). */
async function activeClassIdsOf(studentId: mongoose.Types.ObjectId): Promise<string[]> {
  const enrollments = await mongoose
    .model('Enrollment')
    .find({ student: studentId, status: { $in: [...ACTIVE_ENROLLMENT_STATUSES] } })
    .select('class')
    .lean();
  return enrollments.map((e: any) => e.class.toString());
}

/**
 * Tìm lớp chứa bài tập mà thông báo đang nhắc tới.
 * Ưu tiên: bài tập học viên đã nộp > khớp `skill` > khớp tiêu đề.
 */
async function findClassByAssignment(
  studentId: mongoose.Types.ObjectId,
  classIds: string[],
  title: string
): Promise<string | null> {
  if (!classIds.length) return null;

  const assignments = await mongoose
    .model('Assignment')
    .find({ class: { $in: classIds } })
    .select('title skill class')
    .lean();

  if (!assignments.length) return null;

  // Lọc các bài tập học viên đã nộp (chính xác nhất về mặt ngữ nghĩa).
  const submissions = await mongoose
    .model('Submission')
    .find({ student: studentId, assignment: { $in: assignments.map((a: any) => a._id) } })
    .select('assignment')
    .lean();
  const submittedIds = new Set(submissions.map((s: any) => s.assignment.toString()));

  const target = norm(title);
  const submitted = assignments.filter((a: any) => submittedIds.has(a._id.toString()));
  const pool = submitted.length ? submitted : assignments;

  // 1) Khớp theo `skill` (vd thông báo "bài tập Writing Task 2" -> skill "Writing Task 2")
  const bySkill = pool.find((a: any) => {
    const s = norm(a.skill);
    return s && (target.includes(s) || s.includes(target));
  });
  if (bySkill) return bySkill.class.toString();

  // 2) Khớp chính xác tiêu đề
  const byExactTitle = pool.find((a: any) => norm(a.title) === target);
  if (byExactTitle) return byExactTitle.class.toString();

  // 3) Khớp "chứa" (một chuỗi là tập con của chuỗi kia)
  const byContains = pool.find((a: any) => {
    const t = norm(a.title);
    return t && (target.includes(t) || t.includes(target));
  });
  if (byContains) return byContains.class.toString();

  // 4) Khớp theo từ khoá đáng kể trong tiêu đề
  const keywords = target
    .split(' ')
    .filter(
      (w) =>
        w.length > 3 &&
        !['bai', 'tap', 'nop', 'cua', 'vao', 'cham', 'diem', 'thong', 'bao', 'co'].includes(w)
    );
  if (keywords.length) {
    const byKeyword = pool.find((a: any) => {
      const t = `${norm(a.title)} ${norm(a.skill)}`;
      return keywords.some((k) => t.includes(k));
    });
    if (byKeyword) return byKeyword.class.toString();
  }

  return null;
}

/** Tìm class của bài đánh giá (Grade) gần nhất của học viên. */
async function findClassByRecentGrade(studentId: mongoose.Types.ObjectId): Promise<string | null> {
  const grades = await mongoose
    .model('Grade')
    .find({ student: studentId })
    .sort({ testDate: -1, createdAt: -1 })
    .select('class')
    .lean();
  return grades.length ? grades[0].class.toString() : null;
}

/**
 * Phân loại ý nghĩa của một thông báo dựa trên TIÊU ĐỀ + NỘI DUNG.
 * Nhờ vậy script chạy lại nhiều lần vẫn cho kết quả giống nhau (idempotent).
 */
type Semantics = 'tuition' | 'teacher' | 'staff' | 'assignments' | 'grades';

const classify = (title: string, content: string): Semantics | null => {
  const hay = norm(`${title} ${content}`);

  // Nhân viên giáo vụ (kiểm tra TRƯỚC teacher vì nội dung có thể nhắc "giảng viên")
  if (hay.includes('yeu cau doi lich') || hay.includes('giao vu')) return 'staff';

  // Giảng viên
  if (hay.includes('bai nop moi') || hay.includes('vui long vao cham')) return 'teacher';

  // Học phí
  if (hay.includes('thanh toan') || hay.includes('hoc phi')) return 'tuition';

  // Bài tập (ưu tiên trước "điểm" vì "Bài tập ... đã được chấm điểm" vẫn là bài tập)
  if (hay.includes('bai tap')) return 'assignments';

  // Bảng điểm
  if (
    hay.includes('bang diem') ||
    hay.includes('diem thi thu') ||
    hay.includes('mock test') ||
    hay.includes('diem danh')
  ) {
    return 'grades';
  }
  return null;
};

/** Suy ra link đúng cho một thông báo. Trả về null nếu không xác định được. */
async function resolveLink(notification: any): Promise<string | null> {
  const recipient = notification.recipient;
  const title: string = notification.title || '';
  const content: string = notification.content || '';
  const current: string = notification.linkUrl || '';

  switch (classify(title, content)) {
    case 'tuition':
      return '/student/tuition';

    case 'teacher':
      return '/teacher/dashboard?tab=assignments_grading';

    case 'staff':
      return '/staff/dashboard';

    case 'assignments': {
      const classIds = await activeClassIdsOf(recipient);
      const classId = await findClassByAssignment(recipient, classIds, title);
      if (classId) return `/student/classes/${classId}/assignments`;
      // Không tìm được lớp -> giữ link lớp cụ thể cũ nếu có, else xoá.
      return /^\/student\/classes\/[^/]+\/assignments$/.test(current) ? current : null;
    }

    case 'grades': {
      const classId = await findClassByRecentGrade(recipient);
      if (classId) return `/student/classes/${classId}/grades`;
      return /^\/student\/classes\/[^/]+\/grades$/.test(current) ? current : null;
    }

    default:
      return null;
  }
}

async function main() {
  await mongoose.connect(config.mongodbUri);
  console.log('🔗 Đã kết nối MongoDB');

  const Notification = mongoose.model('Notification');
  const notifications = await Notification.find({ linkUrl: { $exists: true, $ne: '' } });
  console.log(`🔔 Tìm thấy ${notifications.length} thông báo có linkUrl`);

  let fixed = 0;
  let cleared = 0;
  let unchanged = 0;

  for (const notification of notifications) {
    const oldLink: string = notification.linkUrl || '';
    const newLink = await resolveLink(notification);

    if (newLink === null) {
      await Notification.updateOne({ _id: notification._id }, { $set: { linkUrl: '' } });
      console.log(`  ⚠️  "${notification.title}"`);
      console.log(`     ${oldLink}  ->  (xoá link)`);
      cleared += 1;
      continue;
    }

    if (newLink === oldLink) {
      unchanged += 1;
      continue;
    }

    await Notification.updateOne({ _id: notification._id }, { $set: { linkUrl: newLink } });
    console.log(`  ✅ "${notification.title}"`);
    console.log(`     ${oldLink}  ->  ${newLink}`);
    fixed += 1;
  }

  console.log(`\n📊 Kết quả: sửa ${fixed}, xoá link ${cleared}, giữ nguyên ${unchanged}`);

  console.log('\n📋 Trạng thái link sau khi sửa:');
  for (const n of await Notification.find({}).select('title linkUrl')) {
    console.log(`  • ${n.title} -> ${n.linkUrl || '(rỗng)'}`);
  }

  await mongoose.disconnect();
  console.log('\n🎉 Hoàn tất');
}

main().catch((e) => {
  console.error('❌ Lỗi:', e);
  process.exit(1);
});
