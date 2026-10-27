import mongoose from 'mongoose';
import dns from 'node:dns';
import dotenv from 'dotenv';
import { config } from '../config';
import { Class } from '../models/class.model';
import { Course } from '../models/course.model';
import { Enrollment } from '../models/enrollment.model';
import { User, UserRole } from '../models/user.model';

dotenv.config();

const DEMO_PASSWORD = 'Demo123!';

const teacherSamples = [
  { email: 'teacher.sample01@educenter.edu.vn', fullName: 'Nguyễn Minh Anh', phone: '0901000001' },
  { email: 'teacher.sample02@educenter.edu.vn', fullName: 'Trần Quốc Bảo', phone: '0901000002' },
  { email: 'teacher.sample03@educenter.edu.vn', fullName: 'Lê Thu Hà', phone: '0901000003' },
  { email: 'teacher.sample04@educenter.edu.vn', fullName: 'Phạm Hoàng Nam', phone: '0901000004' },
];

const studentSamples = [
  ['student.sample01@educenter.edu.vn', 'Nguyễn Hà My'],
  ['student.sample02@educenter.edu.vn', 'Trần Gia Huy'],
  ['student.sample03@educenter.edu.vn', 'Lê Khánh Linh'],
  ['student.sample04@educenter.edu.vn', 'Phạm Đức Anh'],
  ['student.sample05@educenter.edu.vn', 'Vũ Ngọc Mai'],
  ['student.sample06@educenter.edu.vn', 'Đỗ Minh Khang'],
  ['student.sample07@educenter.edu.vn', 'Hoàng Bảo Châu'],
  ['student.sample08@educenter.edu.vn', 'Bùi Tuấn Kiệt'],
  ['student.sample09@educenter.edu.vn', 'Đặng Phương Thảo'],
  ['student.sample10@educenter.edu.vn', 'Ngô Nhật Minh'],
  ['student.sample11@educenter.edu.vn', 'Phan Hải Yến'],
  ['student.sample12@educenter.edu.vn', 'Dương Quang Huy'],
];

const courseSamples = [
  {
    code: 'ENG-GEN-A1',
    title: 'Tiếng Anh Giao tiếp Cơ bản A1',
    description: 'Làm quen từ vựng, phát âm và các tình huống giao tiếp hằng ngày.',
    category: 'Tiếng Anh Giao Tiếp',
    sessions: 30,
    tuitionFee: 4500000,
    syllabus: ['Phát âm nền tảng', 'Giới thiệu bản thân', 'Giao tiếp trong sinh hoạt'],
  },
  {
    code: 'ENG-GEN-B1',
    title: 'Tiếng Anh Giao tiếp Trung cấp B1',
    description: 'Phát triển khả năng hội thoại và trình bày ý kiến trong công việc, cuộc sống.',
    category: 'Tiếng Anh Giao Tiếp',
    sessions: 36,
    tuitionFee: 6200000,
    syllabus: ['Hội thoại theo chủ đề', 'Kể chuyện và mô tả', 'Thảo luận và trình bày'],
  },
  {
    code: 'IELTS-FOUND',
    title: 'IELTS Foundation',
    description: 'Củng cố ngữ pháp, từ vựng và chiến lược cho bốn kỹ năng IELTS.',
    category: 'Luyện Thi IELTS',
    sessions: 36,
    tuitionFee: 7500000,
    syllabus: ['Listening và Reading cơ bản', 'Writing Task 1', 'Speaking Part 1-2'],
  },
  {
    code: 'IELTS-ADV-65',
    title: 'IELTS Intensive mục tiêu 6.5+',
    description: 'Luyện đề chuyên sâu, sửa bài viết và nâng cao kỹ năng nói.',
    category: 'Luyện Thi IELTS',
    sessions: 48,
    tuitionFee: 11500000,
    syllabus: ['Chiến lược làm đề', 'Writing Task 1-2', 'Speaking Part 1-3', 'Thi thử và chữa đề'],
  },
  {
    code: 'TOEIC-600',
    title: 'TOEIC mục tiêu 600+',
    description: 'Ôn tập ngữ pháp và luyện nghe đọc theo định dạng bài thi TOEIC.',
    category: 'Luyện Thi TOEIC',
    sessions: 30,
    tuitionFee: 5900000,
    syllabus: ['Từ vựng TOEIC', 'Listening Part 1-4', 'Reading Part 5-7'],
  },
  {
    code: 'BUS-ENG-01',
    title: 'Tiếng Anh giao tiếp công sở',
    description: 'Thực hành email, họp, thuyết trình và trao đổi với khách hàng.',
    category: 'Tiếng Anh Kinh Doanh',
    sessions: 24,
    tuitionFee: 6800000,
    syllabus: ['Email công việc', 'Họp và trao đổi', 'Thuyết trình', 'Đàm phán cơ bản'],
  },
];

const daysFromNow = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(0, 0, 0, 0);
  return date;
};

const getOrCreateUser = async (
  sample: { email: string; fullName: string; phone?: string },
  role: UserRole
): Promise<{ userId: mongoose.Types.ObjectId; created: boolean }> => {
  const existing = await User.findOne({ email: sample.email });
  if (existing) {
    if (existing.role !== role) {
      throw new Error(`Tài khoản ${sample.email} đã tồn tại nhưng có role khác.`);
    }
    return { userId: existing._id, created: false };
  }

  const user = await User.create({
    ...sample,
    password: DEMO_PASSWORD,
    role,
    status: 'ACTIVE',
  });
  return { userId: user._id, created: true };
};

const seedClassSamples = async (): Promise<void> => {
  const counts = { users: 0, courses: 0, classes: 0, enrollments: 0 };

  try {
    const dnsServers = process.env.MONGODB_DNS_SERVERS
      ?.split(',')
      .map((server) => server.trim())
      .filter(Boolean);
    if (dnsServers?.length) dns.setServers(dnsServers);

    await mongoose.connect(config.mongodbUri);
    console.log('Đã kết nối tới MongoDB được cấu hình.');

    const staff = await getOrCreateUser(
      { email: 'staff.sample@educenter.edu.vn', fullName: 'Trần Nhật Minh (Giáo vụ)', phone: '0901000000' },
      'TRAINING_STAFF'
    );
    if (staff.created) counts.users += 1;

    const teachers = [];
    for (const sample of teacherSamples) {
      const result = await getOrCreateUser(sample, 'TEACHER');
      teachers.push(result.userId);
      if (result.created) counts.users += 1;
    }

    const students = [];
    for (const [email, fullName] of studentSamples) {
      const result = await getOrCreateUser({ email, fullName }, 'STUDENT');
      students.push(result.userId);
      if (result.created) counts.users += 1;
    }

    const courses = [];
    for (const sample of courseSamples) {
      let course = await Course.findOne({ code: sample.code });
      if (!course) {
        course = await Course.create({ ...sample, status: 'ACTIVE' });
        counts.courses += 1;
      }
      courses.push(course._id);
    }

    const classSamples = [
      { classCode: 'ENG-A1-26A', course: 0, teacher: 0, room: 'Phòng 101', scheduleDays: ['Thứ 2', 'Thứ 4'], timeSlot: '18:00 - 19:30', start: 14, end: 84, capacity: 18, status: 'OPEN' as const },
      { classCode: 'ENG-A1-26B', course: 0, teacher: 1, room: 'Phòng 102', scheduleDays: ['Thứ 3', 'Thứ 5'], timeSlot: '19:00 - 20:30', start: 21, end: 91, capacity: 20, status: 'OPEN' as const },
      { classCode: 'ENG-B1-26A', course: 1, teacher: 2, room: 'Phòng 201', scheduleDays: ['Thứ 2', 'Thứ 6'], timeSlot: '18:30 - 20:00', start: -21, end: 63, capacity: 18, status: 'IN_PROGRESS' as const },
      { classCode: 'IELTS-F-26A', course: 2, teacher: 0, room: 'Phòng 202', scheduleDays: ['Thứ 3', 'Thứ 5', 'Thứ 7'], timeSlot: '18:30 - 20:00', start: 7, end: 91, capacity: 16, status: 'OPEN' as const },
      { classCode: 'IELTS-65-26A', course: 3, teacher: 2, room: 'Phòng 301', scheduleDays: ['Thứ 2', 'Thứ 4', 'Thứ 6'], timeSlot: '19:00 - 20:30', start: -35, end: 77, capacity: 15, status: 'IN_PROGRESS' as const },
      { classCode: 'TOEIC-600-26A', course: 4, teacher: 1, room: 'Phòng 103', scheduleDays: ['Thứ 3', 'Thứ 5'], timeSlot: '17:30 - 19:00', start: 28, end: 98, capacity: 22, status: 'OPEN' as const },
      { classCode: 'BUS-ENG-26A', course: 5, teacher: 3, room: 'Phòng 302', scheduleDays: ['Thứ 7', 'Chủ nhật'], timeSlot: '09:00 - 11:00', start: 14, end: 70, capacity: 14, status: 'OPEN' as const },
      { classCode: 'ENG-B1-25C', course: 1, teacher: 3, room: 'Phòng 201', scheduleDays: ['Thứ 2', 'Thứ 4'], timeSlot: '18:00 - 19:30', start: -112, end: -28, capacity: 18, status: 'COMPLETED' as const },
    ];

    const classIds: mongoose.Types.ObjectId[] = [];
    for (const sample of classSamples) {
      let classroom = await Class.findOne({ classCode: sample.classCode });
      if (!classroom) {
        classroom = await Class.create({
          classCode: sample.classCode,
          course: courses[sample.course],
          teacher: teachers[sample.teacher],
          room: sample.room,
          scheduleDays: sample.scheduleDays,
          timeSlot: sample.timeSlot,
          startDate: daysFromNow(sample.start),
          endDate: daysFromNow(sample.end),
          capacity: sample.capacity,
          status: sample.status,
        });
        counts.classes += 1;
      }
      classIds.push(classroom._id);
    }

    const enrollmentSamples = [
      [0, 0, 'PAID'], [1, 0, 'PAID'], [2, 0, 'PENDING'],
      [3, 1, 'PAID'], [4, 1, 'PENDING'], [5, 1, 'PAID'],
      [0, 2, 'PAID'], [6, 2, 'PAID'], [7, 2, 'PENDING'],
      [2, 3, 'PAID'], [8, 3, 'PAID'],
      [3, 4, 'PAID'], [9, 4, 'PAID'], [10, 4, 'PENDING'],
      [5, 5, 'PAID'], [11, 5, 'PENDING'],
      [6, 6, 'PAID'], [7, 6, 'PAID'],
      [8, 7, 'PAID'], [9, 7, 'PAID'],
    ] as const;

    for (const [studentIndex, classIndex, tuitionStatus] of enrollmentSamples) {
      const student = students[studentIndex];
      const classroom = classIds[classIndex];
      const existing = await Enrollment.exists({ student, class: classroom });
      if (!existing) {
        await Enrollment.create({
          student,
          class: classroom,
          status: classSamples[classIndex].status === 'COMPLETED' ? 'COMPLETED' : 'ENROLLED',
          tuitionStatus,
        });
        counts.enrollments += 1;
      }
    }

    const [sampleUsers, sampleCourses, sampleClasses, sampleEnrollments] = await Promise.all([
      User.countDocuments({
        email: {
          $in: [
            'staff.sample@educenter.edu.vn',
            ...teacherSamples.map((sample) => sample.email),
            ...studentSamples.map(([email]) => email),
          ],
        },
      }),
      Course.countDocuments({ code: { $in: courseSamples.map((sample) => sample.code) } }),
      Class.countDocuments({ classCode: { $in: classSamples.map((sample) => sample.classCode) } }),
      Enrollment.countDocuments({ student: { $in: students }, class: { $in: classIds } }),
    ]);

    console.log('Sample data đã được thêm an toàn (không xóa hoặc ghi đè dữ liệu hiện có).');
    console.log(`Tạo mới: ${counts.users} users, ${counts.courses} courses, ${counts.classes} classes, ${counts.enrollments} enrollments.`);
    console.log(`Hiện có: ${sampleUsers} users, ${sampleCourses} courses, ${sampleClasses} classes, ${sampleEnrollments} enrollments trong bộ sample.`);
    console.log('Tài khoản giáo vụ mẫu: staff.sample@educenter.edu.vn');
    console.log(`Mật khẩu chung cho tài khoản mẫu mới: ${DEMO_PASSWORD}`);
  } catch (error) {
    console.error('Không thể thêm dữ liệu mẫu:', error instanceof Error ? error.message : 'Lỗi không xác định');
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  }
};

void seedClassSamples();
