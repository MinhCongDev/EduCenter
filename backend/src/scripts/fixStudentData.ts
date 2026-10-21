/**
 * Script đồng bộ dữ liệu cho module Student.
 *
 * 1. Đồng bộ `Class.currentEnrollment` với số Enrollment thực tế.
 *    - Seed cũ tạo Enrollment trực tiếp mà không cập nhật counter của Class,
 *      dẫn tới sĩ số hiển thị sai (0/25 thay vì 1/25).
 *
 * 2. Chuẩn hoá `Assignment.status`:
 *    - 'ACTIVE' (dữ liệu seed cũ) -> 'PUBLISHED' (giá trị đúng theo enum model).
 *    - Không sửa các bản ghi 'DRAFT' / 'CLOSED'.
 *
 * Chạy: npx ts-node src/scripts/fixStudentData.ts
 */
import mongoose from 'mongoose';
import { config } from '../config';
import '../models/user.model';
import '../models/class.model';
import '../models/course.model';
import '../models/enrollment.model';
import '../models/assignment.model';

async function main() {
  await mongoose.connect(config.mongodbUri);
  console.log('🔗 Đã kết nối MongoDB');

  // ── 1. Đồng bộ sĩ số lớp học ──
  const Class = mongoose.model('Class');
  const Enrollment = mongoose.model('Enrollment');

  const classes = await Class.find({});
  let fixedClasses = 0;

  for (const cls of classes) {
    const real = await Enrollment.countDocuments({
      class: cls._id,
      status: 'ENROLLED',
    });
    if (cls.currentEnrollment !== real) {
      console.log(
        `  • ${cls.classCode}: currentEnrollment ${cls.currentEnrollment ?? 'undefined'} → ${real}`
      );
      await Class.updateOne({ _id: cls._id }, { $set: { currentEnrollment: real } });
      fixedClasses += 1;
    }
  }
  console.log(`✅ Đã đồng bộ sĩ số cho ${fixedClasses}/${classes.length} lớp`);

  // ── 2. Chuẩn hoá trạng thái bài tập ──
  const Assignment = mongoose.model('Assignment');
  const activeAssignments = await Assignment.find({ status: 'ACTIVE' });
  if (activeAssignments.length) {
    await Assignment.updateMany(
      { status: 'ACTIVE' },
      { $set: { status: 'PUBLISHED' } }
    );
    console.log(
      `✅ Đã chuẩn hoá ${activeAssignments.length} bài tập: 'ACTIVE' → 'PUBLISHED'`
    );
  } else {
    console.log('ℹ️  Không có bài tập nào cần chuẩn hoá trạng thái');
  }

  // ── 3. Báo cáo lại ──
  console.log('\n📊 Trạng thái sĩ số sau khi đồng bộ:');
  for (const cls of await Class.find({}).select('classCode capacity currentEnrollment')) {
    const real = await Enrollment.countDocuments({
      class: cls._id,
      status: 'ENROLLED',
    });
    const flag = cls.currentEnrollment === real ? '✅' : '⚠️ ';
    console.log(
      `  ${flag} ${cls.classCode}: ${cls.currentEnrollment}/${cls.capacity} (thực tế ${real})`
    );
  }

  await mongoose.disconnect();
  console.log('\n🎉 Hoàn tất');
}

main().catch((e) => {
  console.error('❌ Lỗi:', e);
  process.exit(1);
});
