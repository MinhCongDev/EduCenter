import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

import { User } from '../models/user.model';
import { Course } from '../models/course.model';
import { Class } from '../models/class.model';
import { Enrollment } from '../models/enrollment.model';
import { Announcement } from '../models/announcement.model';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI không tồn tại trong .env');
  process.exit(1);
}

const seedDatabase = async () => {
  try {
    console.log('⏳ Đang kết nối tới MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Đã kết nối thành công tới Atlas!');

    // 1. Xóa dữ liệu cũ để tránh trùng lặp
    console.log('🧹 Đang làm sạch dữ liệu cũ...');
    await User.deleteMany({});
    await Course.deleteMany({});
    await Class.deleteMany({});
    await Enrollment.deleteMany({});
    await Announcement.deleteMany({});

    // Mật khẩu mặc định cho tất cả tài khoản mẫu
    const defaultPassword = 'Password123@';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // 2. Tạo Users (4 roles)
    console.log('👤 Đang tạo tài khoản mẫu...');
    const users = await User.insertMany([
      {
        fullName: 'Nguyễn Minh Công (Giám đốc)',
        email: 'director@educenter.edu.vn',
        password: hashedPassword,
        phone: '0988111222',
        role: 'DIRECTOR',
        status: 'ACTIVE',
      },
      {
        fullName: 'Trần Thị Thu Thảo (Giáo vụ)',
        email: 'staff@educenter.edu.vn',
        password: hashedPassword,
        phone: '0977222333',
        role: 'TRAINING_STAFF',
        status: 'ACTIVE',
      },
      {
        fullName: 'ThS. Nguyễn Văn An (Giảng viên Web)',
        email: 'teacher.an@educenter.edu.vn',
        password: hashedPassword,
        phone: '0911333444',
        role: 'TEACHER',
        status: 'ACTIVE',
      },
      {
        fullName: 'TS. Lê Hoàng Bách (Giảng viên AI/Data)',
        email: 'teacher.bach@educenter.edu.vn',
        password: hashedPassword,
        phone: '0912444555',
        role: 'TEACHER',
        status: 'ACTIVE',
      },
      {
        fullName: 'Phạm Hải Đăng (Học viên)',
        email: 'student.dang@gmail.com',
        password: hashedPassword,
        phone: '0933555666',
        role: 'STUDENT',
        status: 'ACTIVE',
      },
      {
        fullName: 'Vũ Ngọc Mai (Học viên)',
        email: 'student.mai@gmail.com',
        password: hashedPassword,
        phone: '0934666777',
        role: 'STUDENT',
        status: 'ACTIVE',
      },
      {
        fullName: 'Đỗ Tuấn Kiệt (Học viên)',
        email: 'student.kiet@gmail.com',
        password: hashedPassword,
        phone: '0935777888',
        role: 'STUDENT',
        status: 'ACTIVE',
      },
    ]);

    const directorUser = users[0];
    const teacherAn = users[2];
    const teacherBach = users[3];
    const studentDang = users[4];
    const studentMai = users[5];
    const studentKiet = users[6];

    // 3. Tạo Courses (Khóa học)
    console.log('📚 Đang tạo khóa học mẫu...');
    const courses = await Course.insertMany([
      {
        code: 'WEB-FULLSTACK',
        title: 'Lập trình Web Chuyên nghiệp Full-Stack (MERN)',
        description: 'Thành thạo xây dựng ứng dụng web hiện đại với React, Node.js, Express, MongoDB và TypeScript từ cơ bản đến nâng cao.',
        category: 'Lập trình Web',
        durationWeeks: 12,
        tuitionFee: 8500000,
        status: 'ACTIVE',
        syllabus: [
          'Tuần 1-3: Nền tảng HTML5, CSS3, JavaScript ES6+ & TypeScript',
          'Tuần 4-6: Frontend Hiện đại với React 19, Vite, TailwindCSS & State Management',
          'Tuần 7-9: Backend API RESTful với Node.js, Express & MongoDB/Mongoose',
          'Tuần 10-12: Dự án tốt nghiệp thực chiến, CI/CD và Triển khai Cloud',
        ],
      },
      {
        code: 'PYTHON-AI',
        title: 'Lập trình Python & Ứng dụng Trí tuệ Nhân tạo AI',
        description: 'Học lập trình Python ứng dụng, xử lý dữ liệu và xây dựng các mô hình Machine Learning, tích hợp AI API (OpenAI, Gemini).',
        category: 'Trí tuệ nhân tạo & Data',
        durationWeeks: 10,
        tuitionFee: 7800000,
        status: 'ACTIVE',
        syllabus: [
          'Tuần 1-2: Cú pháp Python cơ bản & Lập trình hướng đối tượng OOP',
          'Tuần 3-5: Xử lý dữ liệu số học với NumPy, Pandas, Matplotlib',
          'Tuần 6-8: Nhập môn Học máy (Machine Learning) với Scikit-learn',
          'Tuần 9-10: Xây dựng ứng dụng Generative AI & Chatbot thông minh',
        ],
      },
      {
        code: 'UIUX-DESIGN',
        title: 'Thiết kế Giao diện Trải nghiệm Người dùng UI/UX với Figma',
        description: 'Tư duy thiết kế sản phẩm số, Design System, Wireframing, Prototyping và bàn giao sản phẩm cho đội ngũ Developer.',
        category: 'Thiết kế đồ họa',
        durationWeeks: 8,
        tuitionFee: 6500000,
        status: 'ACTIVE',
        syllabus: [
          'Tuần 1-2: Nguyên lý Thiết kế & Nghiên cứu người dùng (User Research)',
          'Tuần 3-4: Thiết kế Wireframe & Hệ thống thành phần (Design System) Figma',
          'Tuần 5-6: UI Hi-fi Design & Tương tác Prototype chuyên nghiệp',
          'Tuần 7-8: Đánh giá Usability Testing & Hoàn thiện Portfolio sản phẩm',
        ],
      },
    ]);

    const courseWeb = courses[0];
    const courseAI = courses[1];

    // 4. Tạo Classes (Lớp học)
    console.log('🏫 Đang tạo lớp học mẫu...');
    const classes = await Class.insertMany([
      {
        classCode: 'WEB-K24-A',
        course: courseWeb._id,
        teacher: teacherAn._id,
        room: 'Phòng Lab 302 (Tòa Nhà A)',
        scheduleDays: ['Thứ 2', 'Thứ 4', 'Thứ 6'],
        timeSlot: '18:30 - 21:00',
        startDate: new Date('2026-11-01'),
        endDate: new Date('2027-01-25'),
        capacity: 25,
        status: 'OPEN',
      },
      {
        classCode: 'AI-K12-B',
        course: courseAI._id,
        teacher: teacherBach._id,
        room: 'Phòng Lab 405 (Tòa Nhà B)',
        scheduleDays: ['Thứ 3', 'Thứ 5', 'Thứ 7'],
        timeSlot: '19:00 - 21:30',
        startDate: new Date('2026-11-10'),
        endDate: new Date('2027-01-15'),
        capacity: 20,
        status: 'OPEN',
      },
    ]);

    const classWeb = classes[0];
    const classAI = classes[1];

    // 5. Tạo Enrollments (Ghi danh học viên)
    console.log('📝 Đang tạo dữ liệu ghi danh học viên...');
    await Enrollment.insertMany([
      {
        student: studentDang._id,
        class: classWeb._id,
        enrollmentDate: new Date(),
        status: 'ENROLLED',
        tuitionStatus: 'PAID',
      },
      {
        student: studentMai._id,
        class: classWeb._id,
        enrollmentDate: new Date(),
        status: 'ENROLLED',
        tuitionStatus: 'PAID',
      },
      {
        student: studentKiet._id,
        class: classAI._id,
        enrollmentDate: new Date(),
        status: 'ENROLLED',
        tuitionStatus: 'PENDING',
      },
    ]);

    // 6. Tạo Announcements (Thông báo)
    console.log('📢 Đang tạo thông báo mẫu...');
    await Announcement.insertMany([
      {
        title: 'Chào mừng năm học mới 2026 & Khai giảng các lớp chuyên đề tháng 11',
        content: 'Trung tâm đào tạo EduCenter trân trọng thông báo lịch khai giảng các khóa học MERN Full-Stack và Python AI. Học viên vui lòng hoàn tất thủ tục ghi danh trước ngày 28/10.',
        author: directorUser._id,
        targetAudience: 'ALL',
        isPinned: true,
      },
      {
        title: 'Hướng dẫn sử dụng hệ thống Portal EduCenter dành cho sinh viên',
        content: 'Sinh viên có thể tra cứu lịch học, xem danh sách bài tập và nộp bài trực tiếp qua giao diện sinh viên. Mọi thắc mắc liên hệ phòng Giáo vụ.',
        author: directorUser._id,
        targetAudience: 'STUDENTS',
        isPinned: false,
      },
    ]);

    console.log('\n===========================================');
    console.log('🎉 SEED DỮ LIỆU THÀNH CÔNG VÀO MONGODB ATLAS!');
    console.log('===========================================');
    console.log('🔑 TÀI KHOẢN MẪU (Mật khẩu chung: Password123@)');
    console.log('- Giám đốc (DIRECTOR):      director@educenter.edu.vn');
    console.log('- Giáo vụ (TRAINING_STAFF): staff@educenter.edu.vn');
    console.log('- Giảng viên 1 (TEACHER):   teacher.an@educenter.edu.vn');
    console.log('- Giảng viên 2 (TEACHER):   teacher.bach@educenter.edu.vn');
    console.log('- Học viên 1 (STUDENT):     student.dang@gmail.com');
    console.log('- Học viên 2 (STUDENT):     student.mai@gmail.com');
    console.log('- Học viên 3 (STUDENT):     student.kiet@gmail.com');
    console.log('===========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi seed dữ liệu:', error);
    process.exit(1);
  }
};

seedDatabase();
