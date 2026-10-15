import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

import { User } from '../models/user.model';
import { Course } from '../models/course.model';
import { Class } from '../models/class.model';
import { Enrollment } from '../models/enrollment.model';
import { Announcement } from '../models/announcement.model';
import { Assignment } from '../models/assignment.model';
import { Submission } from '../models/submission.model';
import { Grade } from '../models/grade.model';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/educenter';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI không tồn tại trong .env');
  process.exit(1);
}

const seedDatabase = async () => {
  try {
    console.log('⏳ Đang kết nối tới MongoDB...');
    console.log('   URI:', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
    
    // Set DNS servers to avoid ISP DNS blocking MongoDB Atlas
    if (process.env.MONGODB_DNS_SERVERS) {
      const dns = require('node:dns');
      dns.setServers(process.env.MONGODB_DNS_SERVERS.split(','));
      console.log('   DNS:', process.env.MONGODB_DNS_SERVERS);
    }
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Đã kết nối thành công!\n');

    // 0. Xóa index cũ trên tất cả collections
    console.log('🗑️  Đang xóa index cũ...');
    const collections = ['grades', 'users', 'courses', 'classes', 'enrollments', 'assignments', 'submissions', 'announcements'];
    for (const coll of collections) {
      try {
        const c = mongoose.connection.collection(coll);
        await c.dropIndex('submission_1').catch(() => {});
        await c.dropIndex('_id_').catch(() => {});
      } catch (e) { /* index có thể không tồn tại */ }
    }
    
    // 1. Xóa dữ liệu cũ
    console.log('🧹 Đang làm sạch dữ liệu cũ...');
    await User.deleteMany({});
    await Course.deleteMany({});
    await Class.deleteMany({});
    await Enrollment.deleteMany({});
    await Announcement.deleteMany({});
    await Assignment.deleteMany({});
    await Submission.deleteMany({});
    await Grade.deleteMany({});
    console.log('   ✅ Đã xóa dữ liệu cũ\n');

    const defaultPassword = 'Password123@';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // 2. Tạo Users
    console.log('👤 Đang tạo tài khoản mẫu...');
    const users = await User.insertMany([
      {
        fullName: 'Nguyễn Văn Minh (Giám đốc)',
        email: 'director@educenter.edu.vn',
        password: hashedPassword,
        phone: '0988111222',
        role: 'DIRECTOR',
        status: 'ACTIVE',
      },
      {
        fullName: 'Trần Thị Thu Hà (Giáo vụ)',
        email: 'staff@educenter.edu.vn',
        password: hashedPassword,
        phone: '0977222333',
        role: 'TRAINING_STAFF',
        status: 'ACTIVE',
      },
      {
        fullName: 'ThS. Nguyễn Hoàng Nam (Giảng viên IELTS)',
        email: 'teacher.nam@educenter.edu.vn',
        password: hashedPassword,
        phone: '0911333444',
        role: 'TEACHER',
        status: 'ACTIVE',
      },
      {
        fullName: 'TS. Emily Johnson (Giảng viên TOEIC/Speaking)',
        email: 'teacher.emily@educenter.edu.vn',
        password: hashedPassword,
        phone: '0912444555',
        role: 'TEACHER',
        status: 'ACTIVE',
      },
      {
        fullName: 'Lê Minh Tuấn (Học viên)',
        email: 'student.tuan@gmail.com',
        password: hashedPassword,
        phone: '0933555666',
        role: 'STUDENT',
        status: 'ACTIVE',
      },
      {
        fullName: 'Phạm Thu Hương (Học viên)',
        email: 'student.huong@gmail.com',
        password: hashedPassword,
        phone: '0934666777',
        role: 'STUDENT',
        status: 'ACTIVE',
      },
      {
        fullName: 'Hoàng Đức Anh (Học viên)',
        email: 'student.anh@gmail.com',
        password: hashedPassword,
        phone: '0935777888',
        role: 'STUDENT',
        status: 'ACTIVE',
      },
    ]);
    console.log(`   ✅ Đã tạo ${users.length} tài khoản\n`);

    const directorUser = users[0];
    const staffUser = users[1];
    const teacherNam = users[2];
    const teacherEmily = users[3];
    const studentTuan = users[4];
    const studentHuong = users[5];
    const studentAnh = users[6];

    // 3. Tạo Courses (Khóa học TIẾNG ANH)
    console.log('📚 Đang tạo khóa học tiếng Anh...');
    const courses = await Course.insertMany([
      {
        code: 'IELTS-FOUNDATION',
        title: 'IELTS Foundation - Luyện thi IELTS từ cơ bản (Target: 5.0 - 6.0)',
        description: 'Khóa học dành cho người mới bắt đầu hoặc có nền tảng tiếng Anh yếu, tập trung 4 kỹ năng: Listening, Reading, Writing, Speaking theo format IELTS.',
        category: 'IELTS',
        entryLevel: 'IELTS Foundation',
        targetLevel: '5.0 - 6.0',
        durationWeeks: 12,
        sessions: 36,
        tuitionFee: 6500000,
        format: 'OFFLINE',
        status: 'ACTIVE',
        learningObjectives: [
          'Nắm vững nền tảng tiếng Anh học thuật',
          'Làm quen format bài thi IELTS',
          'Phát triển 4 kỹ năng: Listening, Reading, Writing, Speaking',
        ],
        syllabus: [
          'Tuần 1-3: Nền tảng tiếng Anh học thuật & Từ vựng IELTS Band 5.0',
          'Tuần 4-6: Chiến lược làm bài Reading & Listening cơ bản',
          'Tuần 7-9: Kỹ năng Writing Task 1 & Task 2 - Cấu trúc bài luận',
          'Tuần 10-12: Speaking Part 1, 2, 3 & Luyện đề thi thử',
        ],
        featured: true,
      },
      {
        code: 'IELTS-ADVANCED',
        title: 'IELTS Advanced - Luyện thi IELTS nâng cao (Target: 6.5 - 8.0)',
        description: 'Khóa học dành cho học viên đã có Band 5.5+, tập trung chiến thuật nâng Band, luyện đề chuyên sâu và kỹ năng phản biện.',
        category: 'IELTS',
        entryLevel: 'IELTS 5.5+',
        targetLevel: '6.5 - 8.0',
        durationWeeks: 10,
        sessions: 30,
        tuitionFee: 8500000,
        format: 'OFFLINE',
        status: 'ACTIVE',
        learningObjectives: [
          'Chiến thuật nâng Band từng kỹ năng',
          'Luyện đề chuyên sâu',
          'Phát triển kỹ năng phản biện',
        ],
        syllabus: [
          'Tuần 1-2: Phân tích đề thi IELTS & Chiến thuật nâng Band từng kỹ năng',
          'Tuần 3-5: Advanced Reading strategies & Complex Listening techniques',
          'Tuần 6-8: Academic Writing Band 7+ & Complex Speaking Topics',
          'Tuần 9-10: Full Mock Test & Personal Band Prediction',
        ],
        featured: true,
      },
      {
        code: 'TOEIC-550',
        title: 'Luyện thi TOEIC - Mục tiêu 550+',
        description: 'Khóa học luyện thi TOEIC ngắn hạn, tập trung hai phần Listening và Reading, phù hợp cho yêu cầu xin việc và chứng chỉ.',
        category: 'TOEIC',
        entryLevel: 'A2 - B1',
        targetLevel: '550+',
        durationWeeks: 8,
        sessions: 24,
        tuitionFee: 5500000,
        format: 'OFFLINE',
        status: 'ACTIVE',
        learningObjectives: [
          'Nắm vững cấu trúc bài thi TOEIC',
          'Chiến thuật làm bài nhanh',
          'Luyện đề tổng hợp',
        ],
        syllabus: [
          'Tuần 1-2: Cấu trúc bài thi TOEIC & Từ vựng trọng tâm',
          'Tuần 3-4: Listening Part 1-4 chiến thuật & Luyện tập',
          'Tuần 5-6: Reading Part 5-7 kỹ thuật làm bài nhanh',
          'Tuần 7-8: Luyện đề tổng hợp & Ôn tập trọng tâm',
        ],
        featured: false,
      },
      {
        code: 'SPEAKING-CONVO',
        title: 'Speaking Communication - Giao tiếp tiếng Anh',
        description: 'Khóa học giao tiếp tiếng Anh thực tế, tập trung phát âm, ngữ điệu, phản xạ nói và tự tin giao tiếp trong công việc.',
        category: 'SPEAKING',
        entryLevel: 'A2+',
        targetLevel: 'B2+',
        durationWeeks: 6,
        sessions: 18,
        tuitionFee: 4500000,
        format: 'OFFLINE',
        status: 'ACTIVE',
        learningObjectives: [
          'Phát âm chuẩn IPA',
          'Ngữ điệu tự nhiên',
          'Phản xạ giao tiếp hàng ngày',
          'Business English cơ bản',
        ],
        syllabus: [
          'Tuần 1-2: Phát âm chuẩn IPA & Ngữ điệu tự nhiên',
          'Tuần 3-4: Phản xạ giao tiếp hàng ngày & Business English',
          'Tuần 5-6: Thuyết trình & Phỏng vấn xin việc bằng tiếng Anh',
        ],
        featured: false,
      },
    ]);
    console.log(`   ✅ Đã tạo ${courses.length} khóa học\n`);

    const courseIELTS_F = courses[0];
    const courseIELTS_A = courses[1];
    const courseTOEIC = courses[2];
    const courseSPEAKING = courses[3];

    // 4. Tạo Classes (Lớp học)
    console.log('🏫 Đang tạo lớp học mẫu...');
    const classes = await Class.insertMany([
      {
        classCode: 'IELTS-K26-A',
        course: courseIELTS_F._id,
        teacher: teacherNam._id,
        room: 'Phòng 201',
        scheduleDays: ['Thứ 2', 'Thứ 4', 'Thứ 6'],
        timeSlot: '18:30 - 20:30',
        startDate: new Date('2026-10-15'),
        endDate: new Date('2027-01-10'),
        capacity: 30,
        status: 'OPEN',
      },
      {
        classCode: 'IELTS-K26-B',
        course: courseIELTS_A._id,
        teacher: teacherNam._id,
        room: 'Phòng 202',
        scheduleDays: ['Thứ 3', 'Thứ 5', 'Thứ 7'],
        timeSlot: '19:00 - 21:00',
        startDate: new Date('2026-10-20'),
        endDate: new Date('2027-01-05'),
        capacity: 25,
        status: 'OPEN',
      },
      {
        classCode: 'SPEAKING-K15',
        course: courseSPEAKING._id,
        teacher: teacherEmily._id,
        room: 'Phòng 301',
        scheduleDays: ['Thứ 7', 'Chủ nhật'],
        timeSlot: '09:00 - 11:30',
        startDate: new Date('2026-10-18'),
        endDate: new Date('2026-11-22'),
        capacity: 20,
        status: 'OPEN',
      },
    ]);
    console.log(`   ✅ Đã tạo ${classes.length} lớp học\n`);

    const classIELTS_A = classes[0];
    const classIELTS_B = classes[1];
    const classSPEAKING = classes[2];

    // 5. Tạo Enrollments (Ghi danh)
    console.log('📝 Đang tạo dữ liệu ghi danh...');
    const enrollments = await Enrollment.insertMany([
      {
        student: studentTuan._id,
        class: classIELTS_A._id,
        enrollmentDate: new Date('2026-10-01'),
        status: 'ENROLLED',
        tuitionStatus: 'PAID',
      },
      {
        student: studentHuong._id,
        class: classIELTS_A._id,
        enrollmentDate: new Date('2026-10-05'),
        status: 'ENROLLED',
        tuitionStatus: 'PAID',
      },
      {
        student: studentAnh._id,
        class: classSPEAKING._id,
        enrollmentDate: new Date('2026-10-10'),
        status: 'ENROLLED',
        tuitionStatus: 'PENDING',
      },
    ]);
    console.log(`   ✅ Đã tạo ${enrollments.length} đăng ký học\n`);

    // 6. Tạo Assignments (Bài tập)
    console.log('📝 Đang tạo bài tập mẫu...');
    const assignments = await Assignment.insertMany([
      {
        class: classIELTS_A._id,
        teacher: teacherNam._id,
        title: 'Listening Practice Test 1',
        description: 'Luyện nghe IELTS Listening Part 1-4. Thời gian: 30 phút. Làm bài và nộp bản scan/photo đáp án.',
        skill: 'IELTS Listening',
        dueDate: new Date('2026-10-25T23:59:59'),
        maxScore: 9,
        status: 'PUBLISHED',
      },
      {
        class: classIELTS_A._id,
        teacher: teacherNam._id,
        title: 'Writing Task 1 - Bar Chart',
        description: 'Viết bài mô tả biểu đồ cột (Bar Chart) về số liệu thống kê. Tối thiểu 150 từ, IELTS Writing format.',
        skill: 'IELTS Writing',
        dueDate: new Date('2026-10-28T23:59:59'),
        maxScore: 9,
        status: 'PUBLISHED',
      },
      {
        class: classIELTS_A._id,
        teacher: teacherNam._id,
        title: 'Speaking Part 2 Self-Introduction',
        description: 'Ghi âm bài nói Part 2 giới thiệu bản thân trong 1-2 phút. Upload file mp3.',
        skill: 'IELTS Speaking',
        dueDate: new Date('2026-10-30T23:59:59'),
        maxScore: 9,
        status: 'PUBLISHED',
      },
      {
        class: classIELTS_A._id,
        teacher: teacherNam._id,
        title: 'Reading Passage Practice',
        description: 'Đọc passage và trả lời 14 câu hỏi. Thời gian: 20 phút.',
        skill: 'IELTS Reading',
        dueDate: new Date('2026-11-01T23:59:59'),
        maxScore: 9,
        status: 'PUBLISHED',
      },
      {
        class: classSPEAKING._id,
        teacher: teacherEmily._id,
        title: 'Self-Introduction Recording',
        description: 'Ghi âm bài giới thiệu bản thân bằng tiếng Anh (2-3 phút).',
        skill: 'Speaking Communication',
        dueDate: new Date('2026-10-25T23:59:59'),
        maxScore: 10,
        status: 'PUBLISHED',
      },
    ]);
    console.log(`   ✅ Đã tạo ${assignments.length} bài tập\n`);

    const assignment1 = assignments[0];

    // 7. Tạo Submissions (Bài nộp)
    console.log('✅ Đang tạo bài nộp mẫu...');
    const submissions = await Submission.insertMany([
      {
        assignment: assignment1._id,
        student: studentTuan._id,
        submissionDate: new Date('2026-10-24T14:30:00'),
        fileUrl: '/uploads/submissions/tuan-listening-1.pdf',
        notes: 'Đã hoàn thành đầy đủ 40 câu',
      },
    ]);
    console.log(`   ✅ Đã tạo ${submissions.length} bài nộp\n`);

    // 8. Tạo Grades (Điểm)
    console.log('📊 Đang tạo điểm IELTS mẫu...');
    await Grade.insertMany([
      {
        student: studentTuan._id,
        class: classIELTS_A._id,
        teacher: teacherNam._id,
        evaluationType: 'MOCK_TEST',
        title: 'Mock Test IELTS - Tháng 10/2026',
        testDate: new Date('2026-10-20'),
        overallBand: 6.5,
        listening: 7.0,
        reading: 6.5,
        writing: 6.0,
        speaking: 6.5,
        feedback: 'Em có nền tảng tốt. Cần cải thiện Writing Task 1 (mô tả biểu đồ chưa chính xác) và luyện thêm Speaking Part 3.',
        status: 'PUBLISHED',
      },
      {
        student: studentHuong._id,
        class: classIELTS_A._id,
        teacher: teacherNam._id,
        evaluationType: 'ASSIGNMENT',
        title: 'Writing Task 1 - Bar Chart',
        testDate: new Date('2026-10-28'),
        overallBand: 6.0,
        writing: 6.0,
        feedback: 'Bài viết có cấu trúc rõ ràng. Cần cải thiện từ vựng học thuật và đa dạng câu phức.',
        status: 'PUBLISHED',
      },
      {
        student: studentAnh._id,
        class: classSPEAKING._id,
        teacher: teacherEmily._id,
        evaluationType: 'SPEAKING_ASSESSMENT',
        title: 'Speaking Assessment - Self Introduction',
        testDate: new Date('2026-10-25'),
        overallBand: 7.0,
        speaking: 7.0,
        feedback: 'Phát âm tốt, tự nhiên. Cần cải thiện fluency ở Part 2.',
        status: 'PUBLISHED',
      },
    ]);
    console.log('   ✅ Đã tạo 3 bản ghi điểm\n');

    // 9. Tạo Announcements (Thông báo)
    console.log('📢 Đang tạo thông báo...');
    await Announcement.insertMany([
      {
        title: '🎓 Chào mừng học viên khóa mới 2026!',
        content: 'Trung tâm Luyện thi EduCenter chính thức khai giảng các lớp IELTS, TOEIC và Speaking. Chúc các bạn học tập hiệu quả!',
        author: directorUser._id,
        targetAudience: 'ALL',
        isPinned: true,
      },
      {
        title: '📅 Lịch thi Mock IELTS tháng 11',
        content: 'Trung tâm tổ chức thi Mock IELTS miễn phí vào ngày 15/11/2026. Học viên các lớp IELTS đăng ký tại phòng Giáo vụ.',
        author: staffUser._id,
        targetAudience: 'STUDENTS',
        isPinned: true,
      },
      {
        title: '💡 Mẹo học IELTS Reading hiệu quả',
        content: 'Bắt đầu từ tuần này, các bạn nên đọc 1-2 bài báo học thuật tiếng Anh mỗi ngày để cải thiện tốc độ đọc.',
        author: teacherNam._id,
        targetAudience: 'STUDENTS',
        isPinned: false,
      },
    ]);
    console.log('   ✅ Đã tạo 3 thông báo\n');

    console.log('\n╔═══════════════════════════════════════════════════════════════════╗');
    console.log('║              🎉 SEED DỮ LIỆU THÀNH CÔNG! 🎉                      ║');
    console.log('╠═══════════════════════════════════════════════════════════════════╣');
    console.log('║  Trung tâm Luyện thi TIẾNG ANH - EduCenter                       ║');
    console.log('╠═══════════════════════════════════════════════════════════════════╣');
    console.log('║  🔑 TÀI KHOẢN MẪU (Mật khẩu: Password123@)                       ║');
    console.log('║                                                                   ║');
    console.log('║  👔 Quản lý:                                                     ║');
    console.log('║     director@educenter.edu.vn  (Giám đốc)                         ║');
    console.log('║     staff@educenter.edu.vn     (Giáo vụ)                         ║');
    console.log('║                                                                   ║');
    console.log('║  👨‍🏫 Giảng viên:                                                  ║');
    console.log('║     teacher.nam@educenter.edu.vn   (IELTS)                         ║');
    console.log('║     teacher.emily@educenter.edu.vn (Speaking)                     ║');
    console.log('║                                                                   ║');
    console.log('║  👨‍🎓 Học viên:                                                    ║');
    console.log('║     student.tuan@gmail.com                                       ║');
    console.log('║     student.huong@gmail.com                                      ║');
    console.log('║     student.anh@gmail.com                                         ║');
    console.log('║                                                                   ║');
    console.log('║  📚 KHÓA HỌC:                                                     ║');
    console.log('║     IELTS Foundation (5.0-6.0) - 6.5tr                            ║');
    console.log('║     IELTS Advanced (6.5-8.0) - 8.5tr                              ║');
    console.log('║     TOEIC 550+ - 5.5tr                                           ║');
    console.log('║     Speaking Communication - 4.5tr                                ║');
    console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

    await mongoose.connection.close();
    console.log('🔌 Đã đóng kết nối MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Lỗi khi seed dữ liệu:', error);
    process.exit(1);
  }
};

seedDatabase();
