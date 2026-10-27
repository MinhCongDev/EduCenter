/**
 * Kiểm tra API "Cài đặt" (tích hợp trong Hồ sơ cá nhân).
 *
 * Chạy: npx ts-node --transpile-only scripts/verify-settings.ts
 */
import mongoose from 'mongoose';
import { config } from '../src/config';
import { User } from '../src/models/user.model';
import { Notification } from '../src/models/notification.model';
import { notify } from '../src/services/notification.service';

const BASE = `http://localhost:${config.port}/api`;
const EMAIL = 'student.dang@gmail.com';
const PASSWORD = 'Password123@';

type Json = Record<string, any>;

const request = async (
  method: string,
  path: string,
  body?: Json,
  token?: string
): Promise<{ status: number; data: Json }> => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data: Json = {};
  try {
    data = (await res.json()) as Json;
  } catch {
    data = {};
  }
  return { status: res.status, data };
};

let pass = 0;
let fail = 0;

const check = (name: string, cond: boolean, extra?: string) => {
  if (cond) {
    pass++;
    console.log(`  ✅ ${name}`);
  } else {
    fail++;
    console.log(`  ❌ ${name}${extra ? ` — ${extra}` : ''}`);
  }
};

const main = async () => {
  await mongoose.connect(config.mongodbUri);
  console.log('🔌 Đã kết nối MongoDB\n');

  const login = await request('POST', '/auth/login', { email: EMAIL, password: PASSWORD });
  const token = login.data.data?.token;
  const userId = login.data.data?.user?._id;
  check('Đăng nhập thành công', !!token);

  console.log('\n── GET /api/auth/preferences ──');
  const get = await request('GET', '/auth/preferences', undefined, token);
  const getPrefs = get.data.data?.preferences || {};
  console.log('   GET preferences =', JSON.stringify(getPrefs));
  check('Trả về preferences', get.data.success && !!getPrefs);
  check(
    'Mặc định bật thông báo',
    getPrefs.inAppNotifications === true && getPrefs.notifyGrades === true
  );

  console.log('\n── PUT /api/auth/preferences ──');
  const put = await request(
    'PUT',
    '/auth/preferences',
    { notifyGrades: false, compactMode: true, notifyAttendance: false },
    token
  );
  const putPrefs = put.data.data?.preferences || {};
  check('Lưu thành công', put.data.success);
  check('notifyGrades = false', putPrefs.notifyGrades === false);
  check('compactMode = true', putPrefs.compactMode === true);
  check(
    'Cờ khác không bị mất',
    putPrefs.notifyAnnouncements === true && putPrefs.notifyPayments === true
  );

  console.log('\n── Từ chối giá trị không hợp lệ ──');
  const bad = await request(
    'PUT',
    '/auth/preferences',
    { notifyGrades: 'không phải boolean', emailNotifications: 'abc' },
    token
  );
  check(
    'Bỏ qua giá trị không phải boolean',
    bad.data.data?.preferences?.notifyGrades === false
  );

  console.log('\n── Tác dụng thật: tắt thông báo điểm ──');
  const before = await Notification.countDocuments({ recipient: userId, type: 'GRADE_PUBLISHED' });
  await notify({
    user: userId,
    type: 'GRADE_PUBLISHED',
    title: 'Điểm mới',
    message: 'Kiểm tra tự động',
  });
  const after = await Notification.countDocuments({ recipient: userId, type: 'GRADE_PUBLISHED' });
  check('Không tạo thông báo GRADE_PUBLISHED khi đã tắt', after === before, `${before} → ${after}`);

  const beforeAnn = await Notification.countDocuments({ recipient: userId, type: 'CLASS_ANNOUNCEMENT' });
  await notify({
    user: userId,
    type: 'CLASS_ANNOUNCEMENT',
    title: 'Thông báo lớp',
    message: 'Kiểm tra tự động',
  });
  const afterAnn = await Notification.countDocuments({ recipient: userId, type: 'CLASS_ANNOUNCEMENT' });
  check('Vẫn tạo thông báo loại khác', afterAnn === beforeAnn + 1);

  console.log('\n── Bật lại và kiểm tra gửi được ──');
  await request('PUT', '/auth/preferences', { notifyGrades: true }, token);
  const before2 = await Notification.countDocuments({ recipient: userId, type: 'GRADE_PUBLISHED' });
  await notify({
    user: userId,
    type: 'GRADE_PUBLISHED',
    title: 'Điểm mới',
    message: 'Kiểm tra tự động (bật lại)',
  });
  const after2 = await Notification.countDocuments({ recipient: userId, type: 'GRADE_PUBLISHED' });
  check('Tạo thông báo khi đã bật', after2 === before2 + 1);

  console.log('\n── preferences lưu trong DB ──');
  const dbUser = await User.findById(userId);
  check('DB có preferences', !!dbUser?.preferences);
  check('DB notifyGrades = true', dbUser?.preferences?.notifyGrades === true);
  check('DB compactMode = true', dbUser?.preferences?.compactMode === true);

  console.log('\n── GET /api/student/profile trả về preferences ──');
  const profile = await request('GET', '/student/profile', undefined, token);
  check('Profile có preferences', !!profile.data.data?.user?.preferences);

  console.log('\n── Bảo mật: chưa đăng nhập bị từ chối ──');
  const noAuth = await request('GET', '/auth/preferences');
  check('Từ chối truy cập không token', noAuth.status === 401);

  // Dọn dẹp thông báo kiểm tra
  await Notification.deleteMany({
    recipient: userId,
    content: /Kiểm tra tự động/,
  });

  await mongoose.disconnect();
  console.log(`\n📊 Kết quả: ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
};

main().catch((err) => {
  console.error('Lỗi:', err.response?.data || err);
  process.exit(1);
});
