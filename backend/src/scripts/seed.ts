import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

import {
  User,
  Staff,
  Teacher,
  Student,
  Course,
  Class,
  Enrollment,
  ClassTeacher,
  ClassSchedule,
  Assignment,
  Submission,
  Attendance,
  Payment,
  Announcement,
  Notification,
  Feedback,
  Center,
  ChangeRequest,
  Grade,
} from '../models';
import { activeEnrollmentFilter } from '../utils/enrollment';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI không tồn tại trong file .env');
  process.exit(1);
}

const seedDatabase = async () => {
  try {
    console.log('⏳ Đang kết nối tới MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Đã kết nối thành công tới MongoDB Atlas!');

    // ==========================================
    // 1. XÓA SẠCH DỮ LIỆU CŨ TRÊN TẤT CẢ 19 BẢNG
    // ==========================================
    console.log('🧹 Đang làm sạch toàn bộ dữ liệu cũ trên tất cả các collections...');
    await Promise.all([
      User.deleteMany({}),
      Staff.deleteMany({}),
      Teacher.deleteMany({}),
      Student.deleteMany({}),
      Course.deleteMany({}),
      Class.deleteMany({}),
      Enrollment.deleteMany({}),
      ClassTeacher.deleteMany({}),
      ClassSchedule.deleteMany({}),
      Assignment.deleteMany({}),
      Submission.deleteMany({}),
      Attendance.deleteMany({}),
      Payment.deleteMany({}),
      Announcement.deleteMany({}),
      Notification.deleteMany({}),
      Feedback.deleteMany({}),
      Center.deleteMany({}),
      ChangeRequest.deleteMany({}),
      Grade.deleteMany({}),
    ]);
    console.log('✨ Đã xóa thành công toàn bộ dữ liệu cũ.');

    // Dọn dẹp index cũ lỗi thời trên Atlas (ví dụ schedule_1_student_1_date_1)
    try {
      await Attendance.collection.dropIndexes();
      console.log('🧹 Đã xóa sạch indexes cũ trên collection attendances.');
    } catch (idxErr) {
      // Bỏ qua nếu index chưa tồn tại
    }

    // ==========================================
    // 2. TẠO THÔNG TIN TRUNG TÂM (CENTER)
    // ==========================================
    console.log('🏛️ Đang tạo thông tin Trung tâm EduCenter IELTS Academy...');
    await Center.create({
      name: 'EduCenter IELTS Academy',
      slogan: 'Học viện Luyện thi IELTS 8.0+ Chuẩn Khảo thí Quốc tế',
      introduction:
        'EduCenter là tổ chức giáo dục đào tạo IELTS hàng đầu Việt Nam, đối tác bạch kim chính thức của IDP và British Council. Với đội ngũ 100% giảng viên đạt 8.5 - 9.0 IELTS Overall, hệ thống phòng thi máy tính độc quyền và hợp đồng cam kết đầu ra bằng văn bản pháp lý, EduCenter đã đồng hành cùng hơn 50.000 học viên đạt mục tiêu.',
      vision: 'Trở thành học viện khảo thí và đào tạo IELTS chuẩn mực số 1 tại Đông Nam Á.',
      mission:
        'Kiến tạo môi trường học tiếng Anh chuẩn học thuật quốc tế, giúp học viên Việt Nam tự tin chinh phục học bổng, du học và định cư.',
      hotline: '1900 6868 - 0988 123 456',
      email: 'contact@educenter.edu.vn',
      workingHours: 'Thứ 2 - Chủ Nhật: 08:00 - 21:30',
      address: 'Tòa nhà EduCenter Tower, 128 Cầu Giấy, Q. Cầu Giấy, Hà Nội',
      branches: [
        {
          branchName: 'Cơ sở 1 (Trụ sở chính - Cầu Giấy)',
          address: 'EduCenter Tower, 128 Cầu Giấy, Q. Cầu Giấy, Hà Nội',
          phone: '024 3789 6868',
          isHeadquarters: true,
        },
        {
          branchName: 'Cơ sở 2 (Đống Đa)',
          address: 'Số 254 Tây Sơn, P. Trung Liệt, Q. Đống Đa, Hà Nội',
          phone: '024 3789 6869',
          isHeadquarters: false,
        },
        {
          branchName: 'Cơ sở 3 (Bách Khoa - Hai Bà Trưng)',
          address: 'Số 86 Lê Thanh Nghị, P. Đồng Tâm, Q. Hai Bà Trưng, Hà Nội',
          phone: '024 3789 6870',
          isHeadquarters: false,
        },
        {
          branchName: 'Cơ sở 4 (Quận 1 - TP. Hồ Chí Minh)',
          address: 'Tòa nhà Bitexco Nam, 180 Nguyễn Thị Minh Khai, P. 6, Q. 1, TP. HCM',
          phone: '028 3988 6868',
          isHeadquarters: false,
        },
        {
          branchName: 'Cơ sở 5 (Quận 10 - TP. Hồ Chí Minh)',
          address: 'Số 387 Sư Vạn Hạnh, P. 12, Q. 10, TP. HCM',
          phone: '028 3988 6869',
          isHeadquarters: false,
        },
      ],
      facilities: [
        {
          name: 'Phòng thi thử IELTS trên máy tính (Computer-delivered Lab)',
          description:
            'Trang bị 60 máy tính Core i7, tai nghe cách âm chuyên dụng đạt chuẩn kiểm định IDP & British Council.',
          imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop',
        },
        {
          name: 'Phòng Mock Speaking Coaching 1:1 Studio',
          description:
            'Không gian tiêu âm chuẩn thu âm studio, camera HD ghi lại ngôn ngữ cơ thể và phản xạ câu hỏi.',
          imageUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=800&auto=format&fit=crop',
        },
        {
          name: 'Thư viện học thuật Cambridge IELTS & Không gian tự học 24/7',
          description:
            'Kho đề thi Cambridge từ Vol 10 - 19, nguồn tài liệu New Scientist, The Economist và phòng tự học miễn phí.',
          imageUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=800&auto=format&fit=crop',
        },
        {
          name: 'Smart Classrooms màn hình tương tác 4K',
          description:
            'Phòng học hiện đại có hệ thống bảng tương tác thông minh và micro thu âm giảng dạy trực tiếp.',
          imageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=800&auto=format&fit=crop',
        },
      ],
      achievements: [
        { label: 'Học viên đạt Target 6.5 - 8.5', value: '50.000+', icon: '🎓' },
        { label: 'Giảng viên đạt 8.5 - 9.0 IELTS', value: '100%', icon: '👨‍🏫' },
        { label: 'Năm tiên phong đào tạo học thuật', value: '11 Năm', icon: '⭐' },
        { label: 'Đối tác khảo thí Kim Cương IDP & BC', value: 'Top 1', icon: '🏆' },
      ],
      socialLinks: {
        facebook: 'https://facebook.com/educenter.ielts',
        youtube: 'https://youtube.com/@educenter.ielts',
        tiktok: 'https://tiktok.com/@educenter.ielts',
        website: 'https://educenter.edu.vn',
      },
    });

    // ==========================================
    // 3. TẠO USERS (4 ROLES: DIRECTOR, TRAINING_STAFF, TEACHER, STUDENT)
    // ==========================================
    console.log('👤 Đang tạo tài khoản người dùng mẫu...');
    const defaultPassword = 'Password123@';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const usersData = [
      // 1 Director
      {
        fullName: 'Nguyễn Minh Công (Giám đốc Điều hành)',
        email: 'director@educenter.edu.vn',
        password: hashedPassword,
        phone: '0988111222',
        address: 'Cầu Giấy, Hà Nội',
        role: 'DIRECTOR' as const,
        status: 'ACTIVE' as const,
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop',
      },
      // 2 Training Staff
      {
        fullName: 'Trần Thị Thu Thảo (Trưởng ban Giáo vụ)',
        email: 'staff@educenter.edu.vn',
        password: hashedPassword,
        phone: '0977222333',
        address: 'Đống Đa, Hà Nội',
        role: 'TRAINING_STAFF' as const,
        status: 'ACTIVE' as const,
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop',
      },
      {
        fullName: 'Hoàng Minh Tuấn (Chuyên viên Giáo vụ)',
        email: 'staff.hoang@educenter.edu.vn',
        password: hashedPassword,
        phone: '0977888999',
        address: 'Hai Bà Trưng, Hà Nội',
        role: 'TRAINING_STAFF' as const,
        status: 'ACTIVE' as const,
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop',
      },
      // 4 Teachers
      {
        fullName: 'Thầy Alex Nguyễn (Head Teacher - IELTS 9.0)',
        email: 'teacher.an@educenter.edu.vn',
        password: hashedPassword,
        phone: '0911333444',
        address: 'Cầu Giấy, Hà Nội',
        role: 'TEACHER' as const,
        status: 'ACTIVE' as const,
        avatarUrl: 'https://cdn.dungmori.com/assets/img/new_home/06-2024/thaydung.png',
      },
      {
        fullName: 'Cô Sarah Phương (Senior Teacher - IELTS 8.5)',
        email: 'teacher.bach@educenter.edu.vn',
        password: hashedPassword,
        phone: '0912444555',
        address: 'Đống Đa, Hà Nội',
        role: 'TEACHER' as const,
        status: 'ACTIVE' as const,
        avatarUrl: 'https://cdn.dungmori.com/assets/img/new_home/06-2024/cothanh.png',
      },
      {
        fullName: 'Thầy Michael Trần (Master Trainer - IELTS 8.5)',
        email: 'teacher.michael@educenter.edu.vn',
        password: hashedPassword,
        phone: '0913555666',
        address: 'Hai Bà Trưng, Hà Nội',
        role: 'TEACHER' as const,
        status: 'ACTIVE' as const,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
      },
      {
        fullName: 'Cô Emily Đặng (Speaking Specialist - IELTS 8.5)',
        email: 'teacher.emily@educenter.edu.vn',
        password: hashedPassword,
        phone: '0914666777',
        address: 'Thanh Xuân, Hà Nội',
        role: 'TEACHER' as const,
        status: 'ACTIVE' as const,
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=crop',
      },
      // 8 Students
      {
        fullName: 'Phạm Hải Đăng (Học viên)',
        email: 'student.dang@gmail.com',
        password: hashedPassword,
        phone: '0933555666',
        address: 'Cầu Giấy, Hà Nội',
        role: 'STUDENT' as const,
        status: 'ACTIVE' as const,
        avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=400&auto=format&fit=crop',
      },
      {
        fullName: 'Vũ Ngọc Mai (Học viên)',
        email: 'student.mai@gmail.com',
        password: hashedPassword,
        phone: '0934666777',
        address: 'Đống Đa, Hà Nội',
        role: 'STUDENT' as const,
        status: 'ACTIVE' as const,
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop',
      },
      {
        fullName: 'Đỗ Tuấn Kiệt (Học viên)',
        email: 'student.kiet@gmail.com',
        password: hashedPassword,
        phone: '0935777888',
        address: 'Quận 1, TP. Hồ Chí Minh',
        role: 'STUDENT' as const,
        status: 'ACTIVE' as const,
        avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400&auto=format&fit=crop',
      },
      {
        fullName: 'Hoàng Thùy Linh (Học viên)',
        email: 'student.linh@gmail.com',
        password: hashedPassword,
        phone: '0936888999',
        address: 'Tây Hồ, Hà Nội',
        role: 'STUDENT' as const,
        status: 'ACTIVE' as const,
        avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=400&auto=format&fit=crop',
      },
      {
        fullName: 'Đặng Minh Quân (Học viên)',
        email: 'student.quan@gmail.com',
        password: hashedPassword,
        phone: '0937111333',
        address: 'Bách Khoa, Hà Nội',
        role: 'STUDENT' as const,
        status: 'ACTIVE' as const,
        avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=400&auto=format&fit=crop',
      },
      {
        fullName: 'Trần Thu Trang (Học viên)',
        email: 'student.trang@gmail.com',
        password: hashedPassword,
        phone: '0938222444',
        address: 'Hà Đông, Hà Nội',
        role: 'STUDENT' as const,
        status: 'ACTIVE' as const,
        avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=400&auto=format&fit=crop',
      },
      {
        fullName: 'Nguyễn Đức Huy (Học viên)',
        email: 'student.huy@gmail.com',
        password: hashedPassword,
        phone: '0939333555',
        address: 'Quận 10, TP. Hồ Chí Minh',
        role: 'STUDENT' as const,
        status: 'ACTIVE' as const,
        avatarUrl: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?q=80&w=400&auto=format&fit=crop',
      },
      {
        fullName: 'Bùi Thảo Vy (Học viên)',
        email: 'student.vy@gmail.com',
        password: hashedPassword,
        phone: '0940444666',
        address: 'Ba Đình, Hà Nội',
        role: 'STUDENT' as const,
        status: 'ACTIVE' as const,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
      },
    ];

    const users = await User.insertMany(usersData);

    const directorUser = users[0];
    const staffUser1 = users[1];
    const staffUser2 = users[2];
    const teacherAlex = users[3];
    const teacherSarah = users[4];
    const teacherMichael = users[5];
    const teacherEmily = users[6];
    const studentDang = users[7];
    const studentMai = users[8];
    const studentKiet = users[9];
    const studentLinh = users[10];
    const studentQuan = users[11];
    const studentTrang = users[12];
    const studentHuy = users[13];
    const studentVy = users[14];

    // ==========================================
    // 4. TẠO HỒ SƠ STAFF (STAFF PROFILES)
    // ==========================================
    console.log('💼 Đang tạo hồ sơ Nhân viên Giáo vụ...');
    await Staff.insertMany([
      {
        user: staffUser1._id,
        staffCode: 'STF-001',
        department: 'Phòng Giáo vụ & Đào tạo',
        position: 'Trưởng ban Học vụ',
        joinDate: new Date('2022-01-15'),
        status: 'ACTIVE',
      },
      {
        user: staffUser2._id,
        staffCode: 'STF-002',
        department: 'Phòng Tuyển sinh & Quản lý Lớp học',
        position: 'Chuyên viên Điều phối Học viên',
        joinDate: new Date('2023-04-10'),
        status: 'ACTIVE',
      },
    ]);

    // ==========================================
    // 5. TẠO HỒ SƠ TEACHER (TEACHER PROFILES)
    // ==========================================
    console.log('👨‍🏫 Đang tạo hồ sơ Giảng viên...');
    await Teacher.insertMany([
      {
        user: teacherAlex._id,
        teacherCode: 'TCH-001',
        specialization: ['IELTS 4 Kỹ Năng', 'IELTS Writing Task 2 Master', 'Mock Speaking 1:1'],
        bio: 'IELTS 9.0 Overall (9.0 Listening, 9.0 Reading, 8.5 Speaking), Thạc sĩ MA TESOL University of Leeds (Anh Quốc), 11 năm kinh nghiệm luyện thi học thuật đỉnh cao.',
        qualifications: ['MA TESOL Leeds', 'CELTA Pass A', 'IELTS 9.0 Overall', 'IDP Authorized Trainer'],
        ieltsBand: 9.0,
        yearsOfExperience: 11,
        status: 'ACTIVE',
      },
      {
        user: teacherSarah._id,
        teacherCode: 'TCH-002',
        specialization: ['IELTS Speaking Fluency', 'IELTS Listening Accent Master', 'Pronunciation Coach'],
        bio: 'IELTS 8.5 Overall (9.0 Speaking), Cựu du học sinh Đại học Sydney (Úc), chứng chỉ quốc tế CELTA Cambridge, 7 năm giảng dạy chuyên sâu kỹ năng Nói.',
        qualifications: ['Bachelor of Arts USYD', 'CELTA Cambridge', 'IELTS 8.5 Overall'],
        ieltsBand: 8.5,
        yearsOfExperience: 7,
        status: 'ACTIVE',
      },
      {
        user: teacherMichael._id,
        teacherCode: 'TCH-003',
        specialization: ['IELTS Reading Strategies', 'IELTS Academic Writing Task 1', 'Critical Thinking'],
        bio: 'IELTS 8.5 Overall (9.0 Reading), Tốt nghiệp loại Giỏi ĐH Ngoại ngữ ĐHQGHN, Cố vấn học thuật đã đồng hành cùng 1.200+ học viên đạt band 7.0 - 8.0.',
        qualifications: ['BA English Linguistics ULIS', 'TESOL Certified', 'IELTS 8.5 Overall'],
        ieltsBand: 8.5,
        yearsOfExperience: 6,
        status: 'ACTIVE',
      },
      {
        user: teacherEmily._id,
        teacherCode: 'TCH-004',
        specialization: ['IELTS Foundation', 'IPA Phonetics', 'Grammar in Use', 'Vocabulary Building'],
        bio: 'IELTS 8.5 Overall, Thủ khoa Sư phạm Tiếng Anh ĐH Sư Phạm Hà Nội, chuyên gia phục hồi nền tảng và truyền cảm hứng tiếng Anh cho người mất gốc.',
        qualifications: ['HNUE Valedictorian', 'DELTA Module 1', 'IELTS 8.5 Overall'],
        ieltsBand: 8.5,
        yearsOfExperience: 5,
        status: 'ACTIVE',
      },
    ]);

    // ==========================================
    // 6. TẠO HỒ SƠ STUDENT (STUDENT PROFILES)
    // ==========================================
    console.log('🎓 Đang tạo hồ sơ Học viên...');
    await Student.insertMany([
      {
        user: studentDang._id,
        studentCode: 'STU-1001',
        dob: new Date('2003-05-12'),
        currentBand: 5.5,
        targetBand: 7.0,
        learningGoal: 'Du học Thạc sĩ Châu Âu và săn học bổng Erasmus Mundus',
        emergencyContact: { name: 'Phạm Văn Nam', relationship: 'Bố', phone: '0912111222' },
        status: 'ACTIVE',
      },
      {
        user: studentMai._id,
        studentCode: 'STU-1002',
        dob: new Date('2004-08-20'),
        currentBand: 6.0,
        targetBand: 7.5,
        learningGoal: 'Xét tuyển thẳng Đại học Ngoại Thương Hà Nội',
        emergencyContact: { name: 'Nguyễn Thị Hoa', relationship: 'Mẹ', phone: '0913222333' },
        status: 'ACTIVE',
      },
      {
        user: studentKiet._id,
        studentCode: 'STU-1003',
        dob: new Date('2001-11-03'),
        currentBand: 4.5,
        targetBand: 6.5,
        learningGoal: 'Định cư Canada theo diện tay nghề Express Entry',
        emergencyContact: { name: 'Đỗ Quốc Tuấn', relationship: 'Bố', phone: '0914333444' },
        status: 'ACTIVE',
      },
      {
        user: studentLinh._id,
        studentCode: 'STU-1004',
        dob: new Date('2002-03-15'),
        currentBand: 6.5,
        targetBand: 7.5,
        learningGoal: 'Đổi bằng tiếng Anh nộp học bổng Chevening Anh Quốc',
        emergencyContact: { name: 'Hoàng Quốc Việt', relationship: 'Bố', phone: '0915444555' },
        status: 'ACTIVE',
      },
      {
        user: studentQuan._id,
        studentCode: 'STU-1005',
        dob: new Date('2000-09-28'),
        currentBand: 7.0,
        targetBand: 8.0,
        learningGoal: 'Trở thành Giảng viên IELTS chuyên nghiệp tại EduCenter',
        emergencyContact: { name: 'Đặng Đình Long', relationship: 'Anh trai', phone: '0916555666' },
        status: 'ACTIVE',
      },
      {
        user: studentTrang._id,
        studentCode: 'STU-1006',
        dob: new Date('2004-01-10'),
        currentBand: 5.0,
        targetBand: 7.0,
        learningGoal: 'Chuẩn đầu ra xuất sắc Đại học Kinh Tế Quốc Dân',
        emergencyContact: { name: 'Trần Văn Đức', relationship: 'Bố', phone: '0917666777' },
        status: 'ACTIVE',
      },
      {
        user: studentHuy._id,
        studentCode: 'STU-1007',
        dob: new Date('2005-07-22'),
        currentBand: 3.5,
        targetBand: 6.0,
        learningGoal: 'Làm việc tại tập đoàn công nghệ đa quốc gia',
        emergencyContact: { name: 'Lê Thị Thu', relationship: 'Mẹ', phone: '0918777888' },
        status: 'ACTIVE',
      },
      {
        user: studentVy._id,
        studentCode: 'STU-1008',
        dob: new Date('2003-12-05'),
        currentBand: 7.0,
        targetBand: 8.0,
        learningGoal: 'Học bổng Fulbright Hoa Kỳ ngành Khoa học Xã hội',
        emergencyContact: { name: 'Bùi Đức Trọng', relationship: 'Bố', phone: '0919888999' },
        status: 'ACTIVE',
      },
    ]);

    // ==========================================
    // 7. TẠO CÁC KHÓA HỌC IELTS (COURSES)
    // ==========================================
    console.log('📚 Đang tạo danh sách khóa học chuẩn quốc tế...');
    const courses = await Course.insertMany([
      {
        code: 'IELTS-LOST',
        title: 'IELTS Mất Gốc & Phát Âm Chuẩn Quốc Tế (0 - 3.5)',
        description:
          'Khóa học được thiết kế dành riêng cho người mất gốc tiếng Anh hoàn toàn hoặc muốn xây dựng lại nền tảng phát âm IPA và ngữ pháp học thuật cốt lõi.',
        category: 'Nền tảng IELTS',
        entryLevel: '0 - 3.5',
        targetLevel: '3.5 - 4.5',
        sessions: 24,
        tuitionFee: 4500000,
        format: 'BLENDED',
        status: 'ACTIVE',
        bannerUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800&auto=format&fit=crop',
        featured: false,
        learningObjectives: [
          'Chuẩn hóa phát âm 44 âm IPA theo giọng Anh - Mỹ chuẩn quốc tế',
          'Nắm vững 12 chủ điểm ngữ pháp trọng yếu hay gặp nhất trong kỳ thi IELTS',
          'Tích lũy vốn từ vựng cơ bản 1.500 từ theo các chủ đề đời sống thông dụng',
          'Tự tin phát âm chuẩn và tạo lập câu giao tiếp mạch lạc',
        ],
        syllabus: [
          'Tuần 1-2: Ngữ âm nền tảng IPA & Kỹ thuật nối âm, nhấn trọng âm',
          'Tuần 3-4: Ngữ pháp cốt lõi: Các thì cơ bản, Mệnh đề quan hệ, Thể bị động',
          'Tuần 5-6: Xây dựng vốn từ vựng theo chủ đề: Education, Work, Family, Travel',
          'Tuần 7-8: Làm quen với cấu trúc các dạng bài thi IELTS & Thi kiểm tra đầu ra',
        ],
      },
      {
        code: 'IELTS-PRE',
        title: 'IELTS Pre - Làm Quen Format Đề Thi Chuẩn (3.5 - 4.5)',
        description:
          'Làm quen toàn diện với cấu trúc bài thi IELTS 4 kỹ năng (Nghe, Nói, Đọc, Viết) và các dạng bài thi điển hình theo chuẩn Cambridge.',
        category: 'Nền tảng IELTS',
        entryLevel: '3.5 - 4.5',
        targetLevel: '4.5 - 5.5',
        sessions: 30,
        tuitionFee: 5800000,
        format: 'OFFLINE',
        status: 'ACTIVE',
        bannerUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800&auto=format&fit=crop',
        featured: false,
        learningObjectives: [
          'Hiểu rõ tiêu chí chấm điểm và format 4 kỹ năng IELTS',
          'Rèn luyện kỹ năng Skimming & Scanning trong bài đọc',
          'Luyện nghe bắt từ khóa (Keywords) và phân biệt các bẫy thông tin phổ biến',
          'Luyện nói phản xạ Part 1 và cấu trúc bài viết Task 1 miêu tả biểu đồ cơ bản',
        ],
        syllabus: [
          'Tuần 1-3: Format đề thi & Kỹ năng Listening Section 1-2, Reading Dạng Multiple Choice & Completion',
          'Tuần 4-6: Speaking Part 1 Topics & Writing Task 1: Biểu đồ đường, cột, tròn',
          'Tuần 7-9: Listening Section 3 & Reading Matching Headings, True/False/Not Given',
          'Tuần 10: Mock Test giữa khóa và hoàn thiện kỹ năng phản xạ',
        ],
      },
      {
        code: 'IELTS-FND',
        title: 'IELTS Foundation - Xây Dựng Chiến Thuật Làm Bài (4.5 - 5.5)',
        description:
          'Tập trung bồi dưỡng chiến thuật xử lý các dạng câu hỏi khó trong bài thi IELTS, phát triển tư duy mở rộng ý tưởng Speaking Part 2 và Writing Task 2.',
        category: 'Chiến thuật IELTS',
        entryLevel: '4.5 - 5.5',
        targetLevel: '5.5 - 6.5',
        sessions: 36,
        tuitionFee: 7500000,
        format: 'OFFLINE',
        status: 'ACTIVE',
        bannerUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop',
        featured: true,
        learningObjectives: [
          'Thành thạo chiến thuật làm bài Reading cho dạng bài hóc búa Yes/No/Not Given',
          'Làm chủ dạng bài Listening Section 3 - 4 thảo luận học thuật chuyên sâu',
          'Phát triển ý tưởng Speaking Part 2 trôi chảy theo phương pháp mindmap 1 phút chuẩn bị',
          'Nắm chắc cấu trúc đoạn văn chuẩn PEEL trong Writing Task 2',
        ],
        syllabus: [
          'Tuần 1-3: Chiến lược định vị thông tin nhanh trong Reading học thuật',
          'Tuần 4-6: Tư duy phát triển luận điểm Writing Task 2 dạng Opinion & Discussion',
          'Tuần 7-9: Luyện Speaking Part 2 theo công thức 5W1H và từ vựng nâng cao Band 6.0+',
          'Tuần 10-12: Mock Test trên máy tính và tổng kết phương pháp làm bài',
        ],
      },
      {
        code: 'IELTS-INT',
        title: 'IELTS Bứt Phá - Chinh Phục Band Điểm Vàng (5.5 - 6.5+)',
        description:
          'Khóa học được học viên lựa chọn nhiều nhất tại EduCenter! Cam kết tăng 1.0 Band điểm, đạt chuẩn nộp hồ sơ xét tuyển Đại học top đầu và du học quốc tế.',
        category: 'Luyện thi Chuyên sâu',
        entryLevel: '5.5 - 6.5',
        targetLevel: '6.5 - 7.5+',
        sessions: 36,
        tuitionFee: 9200000,
        format: 'BLENDED',
        status: 'ACTIVE',
        bannerUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=800&auto=format&fit=crop',
        featured: true,
        learningObjectives: [
          'Chinh phục Band 7.0+ ở 2 kỹ năng Listening & Reading',
          'Sử dụng linh hoạt Collocations & Idiomatic language trong Speaking Part 2 & Part 3',
          'Nâng cấp cấu trúc ngữ pháp phức (Complex Sentences, Inversion) trong Writing Task 2',
          'Sửa bài Writing & Speaking 1:1 hàng tuần trực tiếp với giảng viên 8.5+',
        ],
        syllabus: [
          'Tuần 1-3: Chiến thuật đạt điểm tối đa Listening Section 4 & Reading chuyên ngành',
          'Tuần 4-6: Xử lý các dạng biểu đồ phức hợp và bản đồ Map / Quy trình Process trong Writing Task 1',
          'Tuần 7-9: Luyện tư duy phản biện (Critical Thinking) cho Speaking Part 3 & Writing Task 2',
          'Tuần 10-12: Luyện giải bộ đề dự đoán Cambridge thực chiến & Hợp đồng cam kết đầu ra',
        ],
      },
      {
        code: 'IELTS-MST',
        title: 'IELTS Master 8.0+ - Luyện Cùng Giảng Viên 9.0 IELTS',
        description:
          'Khóa học đỉnh cao dành cho học viên mục tiêu săn học bổng toàn phần du học Anh/Mỹ/Úc hoặc giảng dạy IELTS. Chấm chữa Writing & Speaking chi tiết từng từ.',
        category: 'Luyện thi Chuyên sâu',
        entryLevel: '6.5 - 7.5+',
        targetLevel: '8.0+',
        sessions: 30,
        tuitionFee: 12500000,
        format: 'OFFLINE',
        status: 'ACTIVE',
        bannerUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=800&auto=format&fit=crop',
        featured: true,
        learningObjectives: [
          'Chạm mốc 8.5 - 9.0 Listening & Reading thông qua kỹ năng tư duy phản biện',
          'Nắm vững 4 tiêu chí chấm điểm IELTS theo barem chuẩn khảo thí quốc tế',
          'Sử dụng ngôn ngữ tự nhiên như người bản xứ (Native-like Fluency & Nuance)',
          'Đạt điểm tối đa tiêu chí Lexical Resource & Grammatical Range trong Writing',
        ],
        syllabus: [
          'Tuần 1-3: Giải mã các bẫy tinh vi nhất trong Reading & Listening đề thi thật',
          'Tuần 4-6: Chuyên đề Writing Task 2 Band 8.0+: Nghệ thuật lập luận sắc bén & Luận điểm đa chiều',
          'Tuần 7-8: Coaching 1:1 Speaking cùng giảng viên 9.0 và cựu giám khảo chấm thi',
          'Tuần 9-10: Thi thử mô phỏng 100% Computer-delivered IELTS tại EduCenter Lab',
        ],
      },
      {
        code: 'IELTS-SPK-VIP',
        title: 'IELTS Speaking Coaching 1:1 Chuyên Sâu Cùng Giáo Viên 8.5+',
        description:
          'Lớp học kèm riêng 1:1 tập trung toàn bộ thời lượng vào việc chỉnh sửa ngữ điệu, phản xạ tự nhiên và bộ đề Forecast Speaking mới nhất của quý.',
        category: 'Kỹ năng Chuyên biệt',
        entryLevel: '4.5 - 7.5+',
        targetLevel: '7.5+',

        sessions: 16,
        tuitionFee: 8500000,
        format: 'ONLINE',
        status: 'ACTIVE',
        bannerUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800&auto=format&fit=crop',
        featured: false,
        learningObjectives: [
          'Khắc phục dứt điểm tật ngập ngừng, ậm ừ khi trả lời các câu hỏi khó',
          'Bổ sung idioms và phrasal verbs tự nhiên chuẩn bản xứ',
          'Luyện tập toàn bộ đề thi thật trong bộ Forecast Speaking quý hiện tại',
          'Thu âm và nhận phân tích lỗi sai ngữ pháp, phát âm sau mỗi buổi học',
        ],
        syllabus: [
          'Tuần 1-2: Phản xạ nhanh Part 1 các chủ đề mới nổi',
          'Tuần 3-5: Xây dựng câu chuyện cá nhân hóa Part 2 áp dụng cho nhiều đề bài',
          'Tuần 6-7: Nâng cấp tư duy lập luận xã hội, khoa học cho Part 3',
          'Tuần 8: Mock Interview phòng thi thật và chấm điểm chi tiết',
        ],
      },
    ]);

    // ==========================================
    // 8. TẠO CÁC LỚP HỌC (CLASSES)
    // ==========================================
    console.log('🏫 Đang tạo các lớp học...');
    const classes = await Class.insertMany([
      {
        classCode: 'IELTS-INT-K26A',
        name: 'Lớp IELTS Bứt Phá K26A (Mục tiêu 6.5 - 7.5)',
        course: courses[3]._id,
        teacher: teacherAlex._id,
        room: 'Phòng Lab 201 (EduCenter Cầu Giấy)',
        scheduleDays: ['Thứ 2', 'Thứ 4', 'Thứ 6'],
        timeSlot: '18:30 - 20:30',
        startDate: new Date('2026-10-01'),
        endDate: new Date('2026-12-30'),
        capacity: 20,
        currentEnrollment: 4,
        status: 'IN_PROGRESS',
      },
      {
        classCode: 'IELTS-FND-K18B',
        name: 'Lớp IELTS Foundation K18B (Mục tiêu 5.5 - 6.5)',
        course: courses[2]._id,
        teacher: teacherSarah._id,
        room: 'Phòng 302 (EduCenter Đống Đa)',
        scheduleDays: ['Thứ 3', 'Thứ 5', 'Thứ 7'],
        timeSlot: '19:00 - 21:00',
        startDate: new Date('2026-10-05'),
        endDate: new Date('2027-01-10'),
        capacity: 20,
        currentEnrollment: 3,
        status: 'IN_PROGRESS',
      },
      {
        classCode: 'IELTS-MST-K09A',
        name: 'Lớp IELTS Master 8.0+ K09A (Chuyên Gia 9.0)',
        course: courses[4]._id,
        teacher: teacherAlex._id,
        room: 'Phòng Hội Thảo VIP 1 (EduCenter Cầu Giấy)',
        scheduleDays: ['Thứ 2', 'Thứ 4', 'Thứ 6'],
        timeSlot: '19:30 - 21:30',
        startDate: new Date('2026-11-01'),
        endDate: new Date('2027-01-20'),
        capacity: 15,
        currentEnrollment: 2,
        status: 'OPEN',
      },
      {
        classCode: 'IELTS-PRE-K30C',
        name: 'Lớp IELTS Pre-Foundation K30C (Mục tiêu 4.5+)',
        course: courses[1]._id,
        teacher: teacherMichael._id,
        room: 'Phòng 104 (EduCenter Bách Khoa)',
        scheduleDays: ['Thứ 3', 'Thứ 5', 'Chủ Nhật'],
        timeSlot: '18:00 - 20:00',
        startDate: new Date('2026-09-15'),
        endDate: new Date('2026-11-25'),
        capacity: 22,
        currentEnrollment: 2,
        status: 'IN_PROGRESS',
      },
      {
        classCode: 'IELTS-LOST-K45',
        name: 'Lớp IELTS Mất Gốc K45 (Chuẩn Hóa IPA & Ngữ Pháp)',
        course: courses[0]._id,
        teacher: teacherEmily._id,
        room: 'Phòng 205 (EduCenter Cầu Giấy)',
        scheduleDays: ['Thứ 2', 'Thứ 4', 'Thứ 6'],
        timeSlot: '17:30 - 19:30',
        startDate: new Date('2026-11-10'),
        endDate: new Date('2027-01-10'),
        capacity: 20,
        currentEnrollment: 1,
        status: 'OPEN',
      },
      {
        classCode: 'IELTS-SPK-VIP-01',
        name: 'Lớp Speaking Coaching 1:1 VIP Khóa 1',
        course: courses[5]._id,
        teacher: teacherSarah._id,
        room: 'Phòng Coaching Studio 1 (Online Zoom Pro)',
        scheduleDays: ['Thứ 3', 'Thứ 5'],
        timeSlot: '20:00 - 21:30',
        startDate: new Date('2026-10-08'),
        endDate: new Date('2026-12-08'),
        capacity: 5,
        currentEnrollment: 2,
        status: 'IN_PROGRESS',
      },
    ]);

    const class1 = classes[0]; // IELTS-INT-K26A
    const class2 = classes[1]; // IELTS-FND-K18B
    const class3 = classes[2]; // IELTS-MST-K09A
    const class4 = classes[3]; // IELTS-PRE-K30C
    const class5 = classes[4]; // IELTS-LOST-K45
    const class6 = classes[5]; // IELTS-SPK-VIP-01

    // ==========================================
    // 9. TẠO PHÂN CÔNG GIẢNG VIÊN (CLASSTEACHER)
    // ==========================================
    console.log('🔗 Đang phân công Giảng viên cho các lớp học...');
    await ClassTeacher.insertMany([
      {
        class: class1._id,
        teacher: teacherAlex._id,
        assignedDate: new Date('2026-09-20'),
        role: 'PRIMARY',
        status: 'ACTIVE',
      },
      {
        class: class1._id,
        teacher: teacherEmily._id,
        assignedDate: new Date('2026-09-20'),
        role: 'ASSISTANT',
        status: 'ACTIVE',
      },
      {
        class: class2._id,
        teacher: teacherSarah._id,
        assignedDate: new Date('2026-09-25'),
        role: 'PRIMARY',
        status: 'ACTIVE',
      },
      {
        class: class2._id,
        teacher: teacherMichael._id,
        assignedDate: new Date('2026-09-25'),
        role: 'ASSISTANT',
        status: 'ACTIVE',
      },
      {
        class: class3._id,
        teacher: teacherAlex._id,
        assignedDate: new Date('2026-10-01'),
        role: 'PRIMARY',
        status: 'ACTIVE',
      },
      {
        class: class4._id,
        teacher: teacherMichael._id,
        assignedDate: new Date('2026-09-10'),
        role: 'PRIMARY',
        status: 'ACTIVE',
      },
      {
        class: class5._id,
        teacher: teacherEmily._id,
        assignedDate: new Date('2026-10-05'),
        role: 'PRIMARY',
        status: 'ACTIVE',
      },
      {
        class: class6._id,
        teacher: teacherSarah._id,
        assignedDate: new Date('2026-10-01'),
        role: 'PRIMARY',
        status: 'ACTIVE',
      },
    ]);

    // ==========================================
    // 10. TẠO THỜI KHÓA BIỂU (CLASSSCHEDULE)
    // ==========================================
    console.log('📅 Đang tạo lịch học chi tiết cho từng lớp...');
    const schedules = await ClassSchedule.insertMany([
      // Lớp 1 (IELTS-INT-K26A)
      {
        class: class1._id,
        dayOfWeek: 'Thứ 2',
        startTime: '18:30',
        endTime: '20:30',
        classroom: 'Phòng Lab 201',
        topic: 'IELTS Reading - Chiến thuật Skimming, Scanning & Matching Headings',
      },
      {
        class: class1._id,
        dayOfWeek: 'Thứ 4',
        startTime: '18:30',
        endTime: '20:30',
        classroom: 'Phòng Lab 201',
        topic: 'IELTS Writing Task 2 - Bố cục đoạn văn PEEL & Luận điểm phản biện',
      },
      {
        class: class1._id,
        dayOfWeek: 'Thứ 6',
        startTime: '18:30',
        endTime: '20:30',
        classroom: 'Phòng Lab 201',
        topic: 'IELTS Speaking Part 3 - Phân tích đa chiều & Fluency Native',
      },
      // Lớp 2 (IELTS-FND-K18B)
      {
        class: class2._id,
        dayOfWeek: 'Thứ 3',
        startTime: '19:00',
        endTime: '21:00',
        classroom: 'Phòng 302',
        topic: 'IELTS Listening - Bắt từ khóa Sections 1 & 2 và tránh bẫy Distractors',
      },
      {
        class: class2._id,
        dayOfWeek: 'Thứ 5',
        startTime: '19:00',
        endTime: '21:00',
        classroom: 'Phòng 302',
        topic: 'IELTS Writing Task 1 - Kỹ thuật mô tả biểu đồ đường và cột',
      },
      {
        class: class2._id,
        dayOfWeek: 'Thứ 7',
        startTime: '19:00',
        endTime: '21:00',
        classroom: 'Phòng 302',
        topic: 'IELTS Speaking Part 1 & 2 - Phương pháp mở rộng câu trả lời 5W1H',
      },
      // Lớp 3 (IELTS-MST-K09A)
      {
        class: class3._id,
        dayOfWeek: 'Thứ 2',
        startTime: '19:30',
        endTime: '21:30',
        classroom: 'Phòng VIP 1',
        topic: 'Writing Task 2 Band 8.0+: Nghệ thuật lập luận sắc bén & Luận điểm đa chiều',
      },
      {
        class: class3._id,
        dayOfWeek: 'Thứ 4',
        startTime: '19:30',
        endTime: '21:30',
        classroom: 'Phòng VIP 1',
        topic: 'Reading Academic: Hóa giải các bẫy tinh vi dạng Yes/No/Not Given',
      },
      {
        class: class3._id,
        dayOfWeek: 'Thứ 6',
        startTime: '19:30',
        endTime: '21:30',
        classroom: 'Phòng VIP 1',
        topic: 'Mock Speaking 1:1 theo tiêu chí chấm thi Giám khảo IDP',
      },
      // Lớp 4 (IELTS-PRE-K30C)
      {
        class: class4._id,
        dayOfWeek: 'Thứ 3',
        startTime: '18:00',
        endTime: '20:00',
        classroom: 'Phòng 104',
        topic: 'Luyện phản xạ Nghe hiểu hội thoại cơ bản Section 1',
      },
      {
        class: class4._id,
        dayOfWeek: 'Thứ 5',
        startTime: '18:00',
        endTime: '20:00',
        classroom: 'Phòng 104',
        topic: 'Ngữ pháp học thuật trọng điểm cho IELTS 4.5+',
      },
      {
        class: class4._id,
        dayOfWeek: 'Chủ Nhật',
        startTime: '18:00',
        endTime: '20:00',
        classroom: 'Phòng 104',
        topic: 'Từ vựng theo chủ đề Education & Technology',
      },
      // Lớp 5 (IELTS-LOST-K45)
      {
        class: class5._id,
        dayOfWeek: 'Thứ 2',
        startTime: '17:30',
        endTime: '19:30',
        classroom: 'Phòng 205',
        topic: 'Ngữ âm IPA: Chuẩn hóa 44 âm Anh - Mỹ cốt lõi',
      },
      {
        class: class5._id,
        dayOfWeek: 'Thứ 4',
        startTime: '17:30',
        endTime: '19:30',
        classroom: 'Phòng 205',
        topic: 'Ngữ pháp cơ bản: Cấu trúc câu và các thì hay gặp trong giao tiếp',
      },
      {
        class: class5._id,
        dayOfWeek: 'Thứ 6',
        startTime: '17:30',
        endTime: '19:30',
        classroom: 'Phòng 205',
        topic: 'Tập phản xạ câu đơn và câu ghép trong ngữ cảnh sinh hoạt hàng ngày',
      },
      // Lớp 6 (IELTS-SPK-VIP-01)
      {
        class: class6._id,
        dayOfWeek: 'Thứ 3',
        startTime: '20:00',
        endTime: '21:30',
        classroom: 'Studio Online 1',
        topic: 'Speaking Coaching 1:1 - Chỉnh sửa ngữ điệu và phát âm chuẩn bản xứ',
      },
      {
        class: class6._id,
        dayOfWeek: 'Thứ 5',
        startTime: '20:00',
        endTime: '21:30',
        classroom: 'Studio Online 1',
        topic: 'Speaking Coaching 1:1 - Bẻ khóa bộ đề Forecast Speaking quý mới nhất',
      },
    ]);

    // ==========================================
    // 11. TẠO DỮ LIỆU ĐĂNG KÝ HỌC (ENROLLMENTS)
    // ==========================================
    console.log('📝 Đang ghi danh học viên vào các lớp học...');
    const enrollments = await Enrollment.insertMany([
      {
        student: studentDang._id,
        class: class1._id,
        course: courses[3]._id,
        registrationDate: new Date('2026-09-25'),
        enrollmentDate: new Date('2026-09-26'),
        status: 'ENROLLED',
        tuitionStatus: 'PAID',
      },
      {
        student: studentMai._id,
        class: class1._id,
        course: courses[3]._id,
        registrationDate: new Date('2026-09-26'),
        enrollmentDate: new Date('2026-09-27'),
        status: 'ENROLLED',
        tuitionStatus: 'PAID',
      },
      {
        student: studentLinh._id,
        class: class1._id,
        course: courses[3]._id,
        registrationDate: new Date('2026-09-28'),
        enrollmentDate: new Date('2026-09-29'),
        status: 'ENROLLED',
        tuitionStatus: 'PAID',
      },
      {
        student: studentQuan._id,
        class: class1._id,
        course: courses[3]._id,
        registrationDate: new Date('2026-09-28'),
        enrollmentDate: new Date('2026-09-29'),
        status: 'ENROLLED',
        tuitionStatus: 'PAID',
      },
      {
        student: studentKiet._id,
        class: class2._id,
        course: courses[2]._id,
        registrationDate: new Date('2026-09-28'),
        enrollmentDate: new Date('2026-09-30'),
        status: 'ENROLLED',
        tuitionStatus: 'PAID',
      },
      {
        student: studentTrang._id,
        class: class2._id,
        course: courses[2]._id,
        registrationDate: new Date('2026-10-01'),
        enrollmentDate: new Date('2026-10-02'),
        status: 'ENROLLED',
        tuitionStatus: 'PAID',
      },
      {
        student: studentLinh._id,
        class: class2._id,
        course: courses[2]._id,
        registrationDate: new Date('2026-10-02'),
        enrollmentDate: new Date('2026-10-03'),
        status: 'ENROLLED',
        tuitionStatus: 'PAID',
      },
      {
        student: studentQuan._id,
        class: class3._id,
        course: courses[4]._id,
        registrationDate: new Date('2026-10-05'),
        enrollmentDate: new Date('2026-10-06'),
        status: 'ENROLLED',
        tuitionStatus: 'PAID',
      },
      {
        student: studentVy._id,
        class: class3._id,
        course: courses[4]._id,
        registrationDate: new Date('2026-10-06'),
        enrollmentDate: new Date('2026-10-07'),
        status: 'ENROLLED',
        tuitionStatus: 'PAID',
      },
      {
        student: studentKiet._id,
        class: class4._id,
        course: courses[1]._id,
        registrationDate: new Date('2026-09-10'),
        enrollmentDate: new Date('2026-09-12'),
        status: 'ENROLLED',
        tuitionStatus: 'PAID',
      },
      {
        student: studentTrang._id,
        class: class4._id,
        course: courses[1]._id,
        registrationDate: new Date('2026-09-12'),
        enrollmentDate: new Date('2026-09-13'),
        status: 'ENROLLED',
        tuitionStatus: 'PAID',
      },
      {
        student: studentHuy._id,
        class: class5._id,
        course: courses[0]._id,
        registrationDate: new Date('2026-10-10'),
        enrollmentDate: new Date('2026-10-11'),
        status: 'ENROLLED',
        tuitionStatus: 'PENDING',
      },
      {
        student: studentDang._id,
        class: class6._id,
        course: courses[5]._id,
        registrationDate: new Date('2026-10-02'),
        enrollmentDate: new Date('2026-10-03'),
        status: 'ENROLLED',
        tuitionStatus: 'PAID',
      },
      {
        student: studentMai._id,
        class: class6._id,
        course: courses[5]._id,
        registrationDate: new Date('2026-10-03'),
        enrollmentDate: new Date('2026-10-04'),
        status: 'ENROLLED',
        tuitionStatus: 'PAID',
      },
    ]);

    // Đồng bộ sĩ số lớp học với số lượt ghi danh thực tế.
    // (Nếu không, Class.currentEnrollment sẽ lệch với dữ liệu Enrollment
    //  và học viên sẽ thấy số liệu "0/25" dù đang có người học.)
    for (const cls of await Class.find({})) {
      // Dùng chung quy tắc "enrollment còn hiệu lực" với các controller
      // (ENROLLED + COMPLETED) để counter khớp với số học viên mà học viên
      // thực sự nhìn thấy ở trang "Lớp học của tôi".
      const real = await Enrollment.countDocuments({
        class: cls._id,
        ...activeEnrollmentFilter(),
      });
      if (cls.currentEnrollment !== real) {
        await Class.updateOne({ _id: cls._id }, { $set: { currentEnrollment: real } });
      }
    }

    // ==========================================
    // 12. TẠO HÓA ĐƠN & GIAO DỊCH THANH TOÁN (PAYMENTS)
    // ==========================================
    console.log('💳 Đang tạo lịch sử thanh toán học phí...');
    await Payment.insertMany([
      {
        student: studentDang._id,
        enrollment: enrollments[0]._id,
        course: courses[3]._id,
        amount: 9200000,
        method: 'VNPAY',
        transactionCode: 'VNPTXN-984210',
        status: 'SUCCESS',
        paymentDate: new Date('2026-09-26'),
        note: 'Học viên thanh toán học phí khóa IELTS Bứt Phá qua cổng VNPAY QR',
      },
      {
        student: studentMai._id,
        enrollment: enrollments[1]._id,
        course: courses[3]._id,
        amount: 9200000,
        method: 'BANK_TRANSFER',
        transactionCode: 'MBB-20261001-9981',
        status: 'SUCCESS',
        paymentDate: new Date('2026-09-27'),
        note: 'Chuyển khoản ngân hàng Quân Đội MBBank',
      },
      {
        student: studentLinh._id,
        enrollment: enrollments[2]._id,
        course: courses[3]._id,
        amount: 9200000,
        method: 'BANK_TRANSFER',
        transactionCode: 'VCB-20261002-4412',
        status: 'SUCCESS',
        paymentDate: new Date('2026-09-29'),
        note: 'Chuyển khoản ngân hàng Vietcombank',
      },
      {
        student: studentKiet._id,
        enrollment: enrollments[4]._id,
        course: courses[2]._id,
        amount: 7500000,
        method: 'VNPAY',
        transactionCode: 'VNPTXN-984212',
        status: 'SUCCESS',
        paymentDate: new Date('2026-09-30'),
        note: 'Thanh toán học phí IELTS Foundation',
      },
      {
        student: studentQuan._id,
        enrollment: enrollments[7]._id,
        course: courses[4]._id,
        amount: 12500000,
        method: 'CREDIT_CARD',
        transactionCode: 'CRD-VISA-88219',
        status: 'SUCCESS',
        paymentDate: new Date('2026-10-06'),
        note: 'Thanh toán thẻ Visa quốc tế khóa IELTS Master 8.0+',
      },
      {
        student: studentTrang._id,
        enrollment: enrollments[5]._id,
        course: courses[2]._id,
        amount: 7500000,
        method: 'VNPAY',
        transactionCode: 'VNPTXN-984215',
        status: 'SUCCESS',
        paymentDate: new Date('2026-10-02'),
        note: 'Thanh toán học phí IELTS Foundation qua VNPAY',
      },
      {
        student: studentVy._id,
        enrollment: enrollments[8]._id,
        course: courses[4]._id,
        amount: 12500000,
        method: 'BANK_TRANSFER',
        transactionCode: 'TCB-20261003-7711',
        status: 'SUCCESS',
        paymentDate: new Date('2026-10-07'),
        note: 'Chuyển khoản Techcombank khóa IELTS Master 8.0+',
      },
      {
        student: studentDang._id,
        enrollment: enrollments[12]._id,
        course: courses[5]._id,
        amount: 8500000,
        method: 'VNPAY',
        transactionCode: 'VNPTXN-984218',
        status: 'SUCCESS',
        paymentDate: new Date('2026-10-03'),
        note: 'Thanh toán khóa Speaking Coaching 1:1 Chuyên Sâu',
      },
      {
        student: studentMai._id,
        enrollment: enrollments[13]._id,
        course: courses[5]._id,
        amount: 8500000,
        method: 'BANK_TRANSFER',
        transactionCode: 'MBB-20261005-3329',
        status: 'SUCCESS',
        paymentDate: new Date('2026-10-04'),
        note: 'Thanh toán khóa Speaking Coaching 1:1 Chuyên Sâu',
      },
      {
        student: studentHuy._id,
        enrollment: enrollments[11]._id,
        course: courses[0]._id,
        amount: 4500000,
        method: 'BANK_TRANSFER',
        transactionCode: 'PEND-LOST-0010',
        status: 'PENDING',
        paymentDate: new Date('2026-10-11'),
        note: 'Học viên chờ nhận lương thanh toán trước ngày khai giảng',
      },
    ]);

    // ==========================================
    // 13. TẠO BÀI TẬP VỀ NHÀ (ASSIGNMENTS)
    // ==========================================
    console.log('📝 Đang tạo bài tập về nhà cho các lớp...');
    const assignments = await Assignment.insertMany([
      {
        class: class1._id,
        teacher: teacherAlex._id,
        title: 'Writing Task 2: Technology in Education & Modern Learning Paradigm',
        description:
          'Some people believe that technology has improved education, while others argue it is a major distraction for pupils. Discuss both views and give your own reasoned opinion. (Minimum 250 words, apply PEEL paragraph framework).',
        skill: 'Writing Task 2',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        maxScore: 9.0,
        attachments: [
          'https://educenter.edu.vn/materials/writing_task_2_peel_template.pdf',
          'https://educenter.edu.vn/materials/technology_education_lexical_pack.pdf',
        ],
        status: 'PUBLISHED',
      },
      {
        class: class1._id,
        teacher: teacherAlex._id,
        title: 'Writing Task 1: Renewable Energy Projections (2015 - 2030)',
        description:
          'The line chart illustrates the global proportion of renewable energy consumption across four continents between 2015 and 2030. Summarise the key trends, select main features, and provide comparative analysis.',
        skill: 'Writing Task 1',
        dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
        maxScore: 9.0,
        attachments: ['https://educenter.edu.vn/materials/renewable_energy_chart_task1.png'],
        status: 'PUBLISHED',
      },
      {
        class: class1._id,
        teacher: teacherAlex._id,
        title: 'Speaking Mock: Part 2 & 3 - Environmental Conservation',
        description:
          'Describe an environmental initiative you know that has significantly improved your local community. Record an audio file (approx. 2 minutes) and attach the speech outline script.',
        skill: 'Speaking Mock',
        dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
        maxScore: 9.0,
        attachments: ['https://educenter.edu.vn/materials/speaking_part2_environment_guideline.pdf'],
        status: 'PUBLISHED',
      },
      {
        class: class2._id,
        teacher: teacherSarah._id,
        title: 'Writing Task 2: Public Transport vs Private Vehicles in Urban Areas',
        description:
          'In many cities, traffic congestion is a severe issue. Some recommend heavy investments in public transport, while others support taxing private cars. Discuss both views.',
        skill: 'Writing Task 2',
        dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        maxScore: 9.0,
        attachments: [],
        status: 'PUBLISHED',
      },
      {
        class: class2._id,
        teacher: teacherSarah._id,
        title: 'Listening Section 3 Academic Drill: University Research Methodology',
        description:
          'Listen to the audio recording between a tutor and two students discussing a psychology research project. Complete the summary notes with NO MORE THAN TWO WORDS.',
        skill: 'Listening',
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        maxScore: 9.0,
        attachments: ['https://educenter.edu.vn/materials/cambridge18_test2_sec3_audio.mp3'],
        status: 'PUBLISHED',
      },
      {
        class: class3._id,
        teacher: teacherAlex._id,
        title: 'Writing Task 2 Band 8.0+ Master Essay: Artificial Intelligence Ethics',
        description:
          'To what extent does the rapid proliferation of artificial intelligence pose ethical risks to creative industries and intellectual property? Provide sophisticated academic reasoning.',
        skill: 'Writing Task 2',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        maxScore: 9.0,
        attachments: ['https://educenter.edu.vn/materials/ai_ethics_cambridge_reading_source.pdf'],
        status: 'PUBLISHED',
      },
    ]);

    const a1 = assignments[0];
    const a2 = assignments[1];
    const a3 = assignments[2];
    const a4 = assignments[3];
    const a6 = assignments[5];

    // ==========================================
    // 14. TẠO BÀI NỘP CỦA HỌC VIÊN (SUBMISSIONS)
    // ==========================================
    console.log('📬 Đang tạo các bài nộp và chấm điểm chi tiết...');
    await Submission.insertMany([
      {
        assignment: a1._id,
        student: studentDang._id,
        content: `It is widely believed that technology has fundamentally transformed the modern learning paradigm. While detractors argue that digital devices induce distractions in pedagogical environments, I firmly contend that technology fosters self-directed learning and global access to academic materials.\n\nOn the one hand, unregulated smartphone usage in classrooms can deteriorate attention spans. Students frequently succumb to social media notifications during instructional hours, thereby impairing their cognitive retention...\n\nIn conclusion, despite minor drawbacks regarding classroom discipline, technological integration remains an indispensable catalyst for academic excellence.`,
        attachments: ['https://drive.google.com/file/d/student_dang_essay_draft.pdf'],
        submissionTime: new Date(Date.now() - 4 * 60 * 60 * 1000),
        status: 'PENDING',
      },
      {
        assignment: a1._id,
        student: studentMai._id,
        content: `In this day and age, pedagogical approaches are undergoing radical transformations owing to cutting-edge technological innovations. This essay scrutinizes both perspectives before presenting my personal stance in favor of digital integration.\n\nUndeniably, digital educational platforms empower pupils with personalized learning trajectories. Learners can assimilate knowledge at their own pace via interactive multimedia tools and intelligent tutoring algorithms...`,
        attachments: ['https://drive.google.com/file/d/student_mai_essay_task2.pdf'],
        submissionTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
        grade: 7.5,
        criteria: {
          taskAchievement: 7.5,
          coherenceCohesion: 8.0,
          lexicalResource: 7.5,
          grammaticalAccuracy: 7.0,
        },
        feedback:
          'Bài viết lập luận rất sắc sảo, cấu trúc liên kết đoạn (Cohesive devices) tự nhiên. Đã dùng tốt các cụm từ học thuật C1 như "pedagogical approaches", "personalized learning trajectories". Chú ý đa dạng hóa hơn nữa các cấu trúc đảo ngữ (Inversion) để đạt mốc 8.0 Grammar.',
        gradedBy: teacherAlex._id,
        status: 'GRADED',
      },
      {
        assignment: a1._id,
        student: studentLinh._id,
        content: `The intersection of educational theory and technological innovation has sparked fervent debate among educators worldwide. Whereas skeptics emphasize the erosion of interpersonal mentorship, advocates celebrate unprecedented democratization of knowledge.\n\nIn my viewpoint, educational technology should not supplant traditional pedagogy but serve as an amplifying instrument...`,
        attachments: ['https://drive.google.com/file/d/student_linh_essay_band8.pdf'],
        submissionTime: new Date(Date.now() - 36 * 60 * 60 * 1000),
        grade: 8.0,
        criteria: {
          taskAchievement: 8.0,
          coherenceCohesion: 8.0,
          lexicalResource: 8.5,
          grammaticalAccuracy: 7.5,
        },
        feedback:
          'Khả năng hành văn lưu loát, lập luận đa chiều chuẩn học thuật Cambridge. Từ vựng C1/C2 dùng rất tự nhiên (democratization, amplifying instrument, pedagogical paradigm). Một bài viết rất đáng khen ngợi!',
        gradedBy: teacherAlex._id,
        status: 'GRADED',
      },
      {
        assignment: a2._id,
        student: studentKiet._id,
        content: `The given bar chart illustrates the comparative statistics regarding renewable energy consumption across four continents between 2015 and 2030. Overall, there was a steady upward trajectory in all regions, with Europe maintaining the dominant position throughout the projected period...`,
        attachments: [],
        submissionTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        status: 'PENDING',
      },
      {
        assignment: a4._id,
        student: studentTrang._id,
        content: `Traffic congestion has emerged as an alarming conundrum in modern metropolitan centers. While expanding the mass transit network presents a sustainable remedy, imposing stringent surcharges on private vehicle owners serves as an immediate deterrent...\n\nFrom my perspective, a synchronized combination of both strategies will yield the highest efficacy.`,
        attachments: [],
        submissionTime: new Date(Date.now() - 18 * 60 * 60 * 1000),
        grade: 6.5,
        criteria: {
          taskAchievement: 6.5,
          coherenceCohesion: 6.5,
          lexicalResource: 6.5,
          grammaticalAccuracy: 6.5,
        },
        feedback:
          'Bố cục bài viết rõ ràng, đủ 4 đoạn theo hướng dẫn. Lưu ý tránh lặp từ vựng về "traffic congestion" và "private vehicles", hãy áp dụng linh hoạt paraphrasing như "gridlock", "commuter volume".',
        gradedBy: teacherSarah._id,
        status: 'GRADED',
      },
      {
        assignment: a3._id,
        student: studentMai._id,
        content: `I would like to talk about the "Clean Green Hanoi" community campaign launched last summer. Our youth volunteer group gathered every weekend to clean the To Lich riverbank and plant urban trees. This initiative not only rejuvenated the local ecosystem but also raised environmental consciousness among neighborhood residents.`,
        attachments: ['https://storage.educenter.edu.vn/audio/speaking_mock_mai_green_campaign.mp3'],
        submissionTime: new Date(Date.now() - 8 * 60 * 60 * 1000),
        grade: 7.5,
        criteria: {
          taskAchievement: 7.5,
          coherenceCohesion: 8.0,
          lexicalResource: 7.5,
          grammaticalAccuracy: 7.0,
        },
        feedback:
          'Phần thi Speaking Part 2 thể hiện độ trôi chảy và ngữ điệu tự nhiên rất tốt. Phát âm tròn vành rõ chữ, từ vựng theo chủ đề môi trường phong phú.',
        gradedBy: teacherAlex._id,
        status: 'GRADED',
      },
      {
        assignment: a6._id,
        student: studentQuan._id,
        content: `The rapid emergence of generative artificial intelligence systems has precipitated profound epistemological and jurisprudential concerns regarding the preservation of intellectual property and original human craftsmanship...\n\nThis treatise asserts that unregulated algorithmic replication undermines creative economies, necessitating rigorous multilateral legislative frameworks.`,
        attachments: ['https://drive.google.com/file/d/student_quan_ai_ethics_essay.pdf'],
        submissionTime: new Date(Date.now() - 12 * 60 * 60 * 1000),
        grade: 8.5,
        criteria: {
          taskAchievement: 8.5,
          coherenceCohesion: 8.5,
          lexicalResource: 9.0,
          grammaticalAccuracy: 8.0,
        },
        feedback:
          'Xuất sắc! Văn phong học thuật đỉnh cao, độ chính xác từ vựng hoàn hảo. Lập luận phản biện sắc sảo tương đương trình độ C2 Proficiency. Bạn hoàn toàn sẵn sàng cho mục tiêu 8.5+ Writing.',
        gradedBy: teacherAlex._id,
        status: 'GRADED',
      },
    ]);

    // ==========================================
    // 15. TẠO ĐIỂM DANH HỌC VIÊN (ATTENDANCE)
    // ==========================================
    console.log('📋 Đang tạo nhật ký điểm danh các buổi học...');
    const attendanceRecords = [
      // Buổi 1 lớp 1 - Thứ 2 (2026-10-05)
      {
        class: class1._id,
        classSchedule: schedules[0]._id,
        student: studentDang._id,
        sessionDate: new Date('2026-10-05'),
        status: 'PRESENT',
        notes: 'Tích cực phát biểu và đóng góp ý tưởng phản biện',
        recordedBy: teacherAlex._id,
      },
      {
        class: class1._id,
        classSchedule: schedules[0]._id,
        student: studentMai._id,
        sessionDate: new Date('2026-10-05'),
        status: 'PRESENT',
        notes: 'Chuẩn bị bài tập ở nhà đầy đủ, phát âm chuẩn',
        recordedBy: teacherAlex._id,
      },
      {
        class: class1._id,
        classSchedule: schedules[0]._id,
        student: studentLinh._id,
        sessionDate: new Date('2026-10-05'),
        status: 'PRESENT',
        notes: 'Hoàn thành xuất sắc bài tập đọc Skimming tại lớp',
        recordedBy: teacherAlex._id,
      },
      {
        class: class1._id,
        classSchedule: schedules[0]._id,
        student: studentQuan._id,
        sessionDate: new Date('2026-10-05'),
        status: 'PRESENT',
        notes: 'Phân tích đề bài Writing Task 2 rất sắc bén',
        recordedBy: teacherAlex._id,
      },
      // Buổi 2 lớp 1 - Thứ 4 (2026-10-07)
      {
        class: class1._id,
        classSchedule: schedules[1]._id,
        student: studentDang._id,
        sessionDate: new Date('2026-10-07'),
        status: 'PRESENT',
        notes: 'Làm bài tập nhóm tốt, có tiến bộ về từ vựng',
        recordedBy: teacherAlex._id,
      },
      {
        class: class1._id,
        classSchedule: schedules[1]._id,
        student: studentMai._id,
        sessionDate: new Date('2026-10-07'),
        status: 'PRESENT',
        notes: 'Đóng góp ý tưởng phong phú cho Task 2',
        recordedBy: teacherAlex._id,
      },
      {
        class: class1._id,
        classSchedule: schedules[1]._id,
        student: studentLinh._id,
        sessionDate: new Date('2026-10-07'),
        status: 'LATE',
        notes: 'Đến muộn 10 phút do thời tiết mưa lớn',
        recordedBy: teacherAlex._id,
      },
      {
        class: class1._id,
        classSchedule: schedules[1]._id,
        student: studentQuan._id,
        sessionDate: new Date('2026-10-07'),
        status: 'PRESENT',
        notes: 'Tham gia tranh luận phản biện sôi nổi',
        recordedBy: teacherAlex._id,
      },
      // Buổi 3 lớp 1 - Thứ 6 (2026-10-09)
      {
        class: class1._id,
        classSchedule: schedules[2]._id,
        student: studentDang._id,
        sessionDate: new Date('2026-10-09'),
        status: 'PRESENT',
        notes: 'Phát biểu tốt',
        recordedBy: teacherAlex._id,
      },
      {
        class: class1._id,
        classSchedule: schedules[2]._id,
        student: studentMai._id,
        sessionDate: new Date('2026-10-09'),
        status: 'PRESENT',
        notes: 'Đầy đủ bài tập và tích cực tương tác',
        recordedBy: teacherAlex._id,
      },
      {
        class: class1._id,
        classSchedule: schedules[2]._id,
        student: studentLinh._id,
        sessionDate: new Date('2026-10-09'),
        status: 'PRESENT',
        notes: 'Phong độ học tập xuất sắc',
        recordedBy: teacherAlex._id,
      },
      {
        class: class1._id,
        classSchedule: schedules[2]._id,
        student: studentQuan._id,
        sessionDate: new Date('2026-10-09'),
        status: 'EXCUSED',
        notes: 'Xin phép nghỉ có lý do: bận thi chứng chỉ tại trường ĐH',
        recordedBy: teacherAlex._id,
      },
      // Buổi 1 lớp 2 - Thứ 3 (2026-10-13)
      {
        class: class2._id,
        classSchedule: schedules[3]._id,
        student: studentKiet._id,
        sessionDate: new Date('2026-10-13'),
        status: 'PRESENT',
        notes: 'Ghi chép bài đầy đủ',
        recordedBy: teacherSarah._id,
      },
      {
        class: class2._id,
        classSchedule: schedules[3]._id,
        student: studentTrang._id,
        sessionDate: new Date('2026-10-13'),
        status: 'PRESENT',
        notes: 'Chăm chỉ, thực hành nghe tốt',
        recordedBy: teacherSarah._id,
      },
      // Buổi 2 lớp 2 - Thứ 5 (2026-10-15)
      {
        class: class2._id,
        classSchedule: schedules[4]._id,
        student: studentKiet._id,
        sessionDate: new Date('2026-10-15'),
        status: 'LATE',
        notes: 'Đến muộn 15 phút do kẹt xe giờ cao điểm',
        recordedBy: teacherSarah._id,
      },
      {
        class: class2._id,
        classSchedule: schedules[4]._id,
        student: studentTrang._id,
        sessionDate: new Date('2026-10-15'),
        status: 'PRESENT',
        notes: 'Bài tập dữ liệu mô tả biểu đồ rõ ràng, số liệu chính xác',
        recordedBy: teacherSarah._id,
      },
      // Buổi 3 lớp 2 - Thứ 7 (2026-10-17)
      {
        class: class2._id,
        classSchedule: schedules[5]._id,
        student: studentKiet._id,
        sessionDate: new Date('2026-10-17'),
        status: 'PRESENT',
        notes: 'Trả lời Speaking Part 1 tự nhiên, phát âm chuẩn',
        recordedBy: teacherSarah._id,
      },
      {
        class: class2._id,
        classSchedule: schedules[5]._id,
        student: studentTrang._id,
        sessionDate: new Date('2026-10-17'),
        status: 'ABSENT',
        notes: 'Vắng mặt không báo lý do',
        recordedBy: teacherSarah._id,
      },
    ];
    await Attendance.insertMany(attendanceRecords);
    const attendanceCount = attendanceRecords.length;

    // ==========================================
    // 16. TẠO BẢNG ĐIỂM & KẾT QUẢ THI (GRADES)
    // ==========================================
    console.log('🏆 Đang tạo bảng điểm và kết quả thi thử...');
    await Grade.insertMany([
      {
        student: studentDang._id,
        class: class1._id,
        teacher: teacherAlex._id,
        evaluationType: 'MOCK_TEST',
        title: 'IELTS Mock Test Số 1 (Computer-delivered)',
        testDate: new Date('2026-10-05'),
        overallBand: 7.0,
        listening: 7.5,
        reading: 7.0,
        writing: 6.5,
        speaking: 7.0,
        feedback:
          'Tiến bộ vượt bậc ở kỹ năng Listening. Kỹ năng Writing Task 2 cần trau chuốt thêm phần mở rộng luận điểm.',
        status: 'PUBLISHED',
      },
      {
        student: studentMai._id,
        class: class1._id,
        teacher: teacherAlex._id,
        evaluationType: 'MOCK_TEST',
        title: 'IELTS Mock Test Số 1 (Computer-delivered)',
        testDate: new Date('2026-10-05'),
        overallBand: 7.5,
        listening: 8.0,
        reading: 7.5,
        writing: 7.0,
        speaking: 7.5,
        feedback:
          'Phong độ ổn định, phản xạ Speaking tự nhiên. Điểm số sẵn sàng cho kỳ thi chính thức quý 4.',
        status: 'PUBLISHED',
      },
      {
        student: studentLinh._id,
        class: class1._id,
        teacher: teacherAlex._id,
        evaluationType: 'MOCK_TEST',
        title: 'IELTS Mock Test Số 1 (Computer-delivered)',
        testDate: new Date('2026-10-05'),
        overallBand: 8.0,
        listening: 8.5,
        reading: 8.0,
        writing: 7.5,
        speaking: 8.0,
        feedback:
          'Kỹ năng Listening và Speaking tiệm cận người bản xứ. Cần duy trì phong độ cao!',
        status: 'PUBLISHED',
      },
      {
        student: studentKiet._id,
        class: class2._id,
        teacher: teacherSarah._id,
        evaluationType: 'MID_TERM',
        title: 'Kiểm Tra Giữa Khóa Foundation',
        testDate: new Date('2026-10-08'),
        overallBand: 6.5,
        listening: 6.5,
        reading: 6.5,
        writing: 6.0,
        speaking: 6.5,
        feedback: 'Có nhiều nỗ lực, cần cải thiện tốc độ đọc hiểu các bài báo học thuật dài.',
        status: 'PUBLISHED',
      },
      {
        student: studentTrang._id,
        class: class2._id,
        teacher: teacherSarah._id,
        evaluationType: 'MID_TERM',
        title: 'Kiểm Tra Giữa Khóa Foundation',
        testDate: new Date('2026-10-08'),
        overallBand: 6.5,
        listening: 7.0,
        reading: 6.5,
        writing: 6.0,
        speaking: 6.5,
        feedback: 'Khả năng nghe bắt từ khóa rất nhanh. Chú ý ngữ pháp chia thì trong bài thi Viết.',
        status: 'PUBLISHED',
      },
      {
        student: studentQuan._id,
        class: class3._id,
        teacher: teacherAlex._id,
        evaluationType: 'MOCK_TEST',
        title: 'IELTS Mock Test Band 8.0+ Challenge',
        testDate: new Date('2026-10-09'),
        overallBand: 8.5,
        listening: 9.0,
        reading: 9.0,
        writing: 8.0,
        speaking: 8.0,
        feedback: 'Thành tích xuất sắc! Kỹ năng Reading và Listening tuyệt đối. Bài thi hoàn hảo.',
        status: 'PUBLISHED',
      },
      {
        student: studentVy._id,
        class: class3._id,
        teacher: teacherAlex._id,
        evaluationType: 'MOCK_TEST',
        title: 'IELTS Mock Test Band 8.0+ Challenge',
        testDate: new Date('2026-10-09'),
        overallBand: 8.0,
        listening: 8.5,
        reading: 8.5,
        writing: 7.5,
        speaking: 8.0,
        feedback:
          'Tư duy phản biện sắc sảo, vốn từ vựng phong phú, sử dụng collocation chuẩn xác.',
        status: 'PUBLISHED',
      },
    ]);

    // ==========================================
    // 17. TẠO ĐÁNH GIÁ & PHẢN HỒI (FEEDBACK)
    // ==========================================
    console.log('⭐ Đang tạo đánh giá và phản hồi của học viên...');
    await Feedback.insertMany([
      {
        sender: studentDang._id,
        receiver: teacherAlex._id,
        class: class1._id,
        course: courses[3]._id,
        content:
          'Thầy Alex dạy cực kỳ nhiệt huyết và dễ hiểu! Phương pháp PEEL cho Writing Task 2 giúp em thoát khỏi tình trạng bí ý tưởng. Rất cảm ơn thầy và trung tâm.',
        rating: 5,
        tags: ['Giảng viên tận tâm', 'Phương pháp dễ hiểu', 'Cải thiện rõ rệt'],
      },
      {
        sender: studentMai._id,
        receiver: teacherAlex._id,
        class: class1._id,
        course: courses[3]._id,
        content:
          'Phòng học hiện đại, có hệ thống thi thử máy tính như thi thật ở IDP. Thầy Alex chấm bài Writing rất chi tiết, chỉ ra từng lỗi dùng từ và cách diễn đạt chuẩn bản xứ.',
        rating: 5,
        tags: ['Cơ sở vật chất tốt', 'Chữa bài chi tiết', 'Học liệu phong phú'],
      },
      {
        sender: studentKiet._id,
        receiver: teacherSarah._id,
        class: class2._id,
        course: courses[2]._id,
        content:
          'Cô Sarah phát âm cực hay, hướng dẫn chỉnh âm IPA và nối âm rất kỹ. Em tự tin hơn nhiều khi nói tiếng Anh sau 4 tuần học.',
        rating: 5,
        tags: ['Phát âm chuẩn', 'Tương tác sôi nổi', 'Truyền cảm hứng'],
      },
      {
        sender: studentLinh._id,
        receiver: teacherAlex._id,
        class: class1._id,
        course: courses[3]._id,
        content:
          'Chất lượng đào tạo số 1! Các buổi Mock Speaking 1:1 cho cảm giác chân thực như ngồi phòng thi khảo thí thật. Đánh giá 5 sao cho EduCenter.',
        rating: 5,
        tags: ['Chuyên môn cao', 'Mock test thực chiến', 'Hài lòng tuyệt đối'],
      },
      {
        sender: studentQuan._id,
        receiver: teacherAlex._id,
        class: class3._id,
        course: courses[4]._id,
        content:
          'Lớp Master 8.0+ với thầy Alex Nguyễn là bước ngoặt lớn trong hành trình săn học bổng của em. Tư duy bài viết được nâng cấp hoàn toàn.',
        rating: 5,
        tags: ['Band điểm vượt trội', 'Giảng viên 9.0', 'Tư duy học thuật'],
      },
    ]);

    // ==========================================
    // 18. TẠO THÔNG BÁO CÁ NHÂN (NOTIFICATIONS)
    // ==========================================
    console.log('🔔 Đang tạo thông báo cá nhân cho người dùng...');
    // linkUrl phải trỏ tới route THẬT của frontend, nếu không người dùng
    // click thông báo sẽ bị đưa tới trang 404.
    //  - Học viên: bài tập / điểm đều nằm dưới /student/classes/:classId/...
    //  - Giảng viên: tab chấm bài nằm trong TeacherDashboard
    //  - Nhân viên giáo vụ: chưa có trang "yêu cầu" riêng → về dashboard
    await Notification.insertMany([
      {
        recipient: studentDang._id,
        title: '🔔 Đã có điểm thi thử IELTS Mock Test Số 1',
        content:
          'Điểm Overall Band của bạn là 7.0 (L: 7.5, R: 7.0, W: 6.5, S: 7.0). Xem nhận xét chi tiết của Thầy Alex Nguyễn trong mục Bảng điểm.',
        type: 'SUCCESS',
        isRead: true,
        linkUrl: `/student/classes/${class1._id}/grades`,
      },
      {
        recipient: studentDang._id,
        title: '📝 Nhắc nhở nộp bài tập Writing Task 2',
        content:
          'Bài tập Writing Task 2: Technology in Education sẽ hết hạn trong 5 ngày tới. Vui lòng nộp bài đúng hạn để được chấm chữa chi tiết.',
        type: 'INFO',
        isRead: false,
        linkUrl: `/student/classes/${class1._id}/assignments`,
      },
      {
        recipient: studentMai._id,
        title: '🎉 Bài tập Writing Task 2 đã được chấm điểm',
        content:
          'Thầy Alex Nguyễn đã chấm bài viết của bạn đạt 7.5/9.0 kèm nhận xét chi tiết 4 tiêu chí Task Achievement, Coherence, Lexical, Grammar.',
        type: 'SUCCESS',
        isRead: false,
        linkUrl: `/student/classes/${class1._id}/assignments`,
      },
      {
        recipient: studentKiet._id,
        title: '💳 Xác nhận thanh toán học phí thành công',
        content:
          'EduCenter đã nhận được thanh toán 7.500.000 VNĐ cho khóa học IELTS Foundation qua cổng VNPAY. Chúc bạn học tập tốt!',
        type: 'SUCCESS',
        isRead: true,
        linkUrl: '/student/tuition',
      },
      {
        recipient: teacherAlex._id,
        title: '📬 Có bài nộp mới từ học viên',
        content:
          'Học viên Phạm Hải Đăng vừa nộp bài tập Writing Task 2: Technology in Education. Vui lòng vào chấm điểm.',
        type: 'INFO',
        isRead: false,
        linkUrl: '/teacher/dashboard?tab=assignments_grading',
      },
      {
        recipient: staffUser1._id,
        title: '🔄 Yêu cầu đổi lịch giảng dạy mới từ Thầy Alex Nguyễn',
        content:
          'Giảng viên Alex Nguyễn vừa gửi yêu cầu đổi lịch dạy cho lớp IELTS-INT-K26A sang ngày 23/10/2026. Vui lòng xét duyệt.',
        type: 'WARNING',
        isRead: false,
        linkUrl: '/staff/requests',
      },
    ]);

    // ==========================================
    // 19. TẠO YÊU CẦU THAY ĐỔI (CHANGEREQUESTS)
    // ==========================================
    console.log('🔄 Đang tạo các yêu cầu chuyển lớp & đổi lịch học...');
    await ChangeRequest.insertMany([
      {
        teacher: teacherAlex._id,
        requesterRole: 'TEACHER',
        requestType: 'TEACHER_SCHEDULE_CHANGE',
        currentClass: class1._id,
        currentSchedule: 'Thứ 2 (18:30 - 20:30)',
        targetSchedule: 'Thứ 4 (18:30 - 20:30)',
        sessionDate: new Date('2026-10-21'),
        targetDate: new Date('2026-10-23'),
        reason:
          'Tham dự hội thảo tập huấn chuyên môn khảo thí cùng Hội đồng Anh (British Council) tại Singapore.',
        status: 'PENDING',
      },
      {
        student: studentKiet._id,
        requesterRole: 'STUDENT',
        requestType: 'CLASS_CHANGE',
        currentClass: class2._id,
        targetClass: class4._id,
        currentSchedule: 'Thứ 3 - 5 - 7 (19:00 - 21:00)',
        targetSchedule: 'Thứ 3 - 5 - CN (18:00 - 20:00)',
        reason:
          'Em có lịch công tác đột xuất vào tối thứ 7 hàng tuần nên muốn chuyển sang lớp có lịch học tối Chủ Nhật.',
        status: 'PENDING',
      },
      {
        student: studentDang._id,
        requesterRole: 'STUDENT',
        requestType: 'SCHEDULE_CHANGE',
        currentClass: class1._id,
        currentSchedule: 'Thứ 6 (18:30 - 20:30)',
        targetSchedule: 'Thứ 7 (18:30 - 20:30)',
        sessionDate: new Date('2026-10-13'),
        targetDate: new Date('2026-10-14'),
        reason:
          'Trùng lịch thi kết thúc học phần môn Kinh tế vĩ mô tại trường đại học.',
        status: 'APPROVED',
        reviewedBy: staffUser1._id,
        reviewNote: 'Đã duyệt cho học viên học bù ca thứ 7 cùng tuần tại Phòng Lab 201.',
        reviewedAt: new Date('2026-10-12'),
      },
    ]);

    // ==========================================
    // 20. TẠO BẢN TIN & THÔNG BÁO CHUNG (ANNOUNCEMENTS)
    // ==========================================
    console.log('📢 Đang tạo thông báo IELTS và tin tức sự kiện...');
    await Announcement.insertMany([
      {
        title: '🔥 Workshop Đặc Biệt: Giải Mã Bẫy Đề Thi IELTS Writing Task 2 Cùng Giảng Viên 9.0',
        content: `EduCenter trân trọng kính mời quý phụ huynh và các bạn học viên tham dự buổi Workshop học thuật độc quyền tháng này.
Diễn giả: Thầy Alex Nguyễn (9.0 IELTS Overall, Thạc sĩ TESOL Đại học Leeds Anh Quốc).
Thời gian: 19:30 Thứ 7 tuần này.
Địa điểm: Hội trường tầng 5, EduCenter Tower 128 Cầu Giấy và Livestream trên nền tảng Portal.
Nội dung chính:
- Phân tích 5 lỗi tư duy khiến bài viết Writing Task 2 bị kẹt ở Band 6.0
- Bộ khung mở bài và thân bài mạch lạc giúp ghi điểm Task Achievement & Coherence
- Thực hành sửa bài viết trực tiếp cho học viên tham dự tại hội trường.
Ưu đãi: Tặng ngay voucher 1.000.000 VNĐ cho học viên đăng ký khóa học IELTS tại sự kiện!`,
        summary:
          'Tham gia buổi chia sẻ chiến thuật chinh phục Writing Task 2 Band 7.5+ cùng Thầy Alex Nguyễn 9.0 IELTS.',
        author: directorUser._id,
        category: 'Workshop',
        targetAudience: 'ALL',
        isPinned: true,
        status: 'PUBLISHED',
        publicationDate: new Date(),
        views: 450,
      },
      {
        title: '🎯 Lịch Thi Thử IELTS On Computer (Thực Chiến 100% Chuẩn IDP & British Council Tháng 10)',
        content: `EduCenter tổ chức kỳ thi thử IELTS trên máy tính định kỳ hàng tháng hoàn toàn MIỄN PHÍ dành cho học viên và thí sinh tự do.
- Định dạng: 100% chuẩn giao diện máy tính IDP/BC
- Trang thiết bị: Tai nghe cách âm chuyên dụng khử ồn chủ động, màn hình 24-inch sắc nét
- Kết quả: Trả điểm và nhận xét chi tiết 4 kỹ năng trong vòng 24 giờ làm việc.
Lịch thi đợt 1: Thứ 7 (Ca sáng: 08:30 - 11:30 | Ca chiều: 14:00 - 17:00).
Vui lòng liên hệ quầy Giáo vụ hoặc đăng ký trực tiếp trên Portal để giữ chỗ.`,
        summary:
          'Trải nghiệm phòng thi máy tính chuẩn quốc tế, nhận kết quả và phân tích điểm chi tiết sau 24h.',
        author: staffUser1._id,
        category: 'Thi thử IELTS',
        targetAudience: 'ALL',
        isPinned: true,
        status: 'PUBLISHED',
        publicationDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        views: 620,
      },
      {
        title: '🏆 Bảng Vàng Vinh Danh: Chúc Mừng 18 Học Viên EduCenter Đạt IELTS 7.5 - 8.5 Trong Tháng',
        content: `EduCenter nhiệt liệt chúc mừng thành tích bứt phá xuất sắc của 18 bạn học viên trong kỳ thi IELTS chính thức tại IDP & Hội đồng Anh tháng vừa qua!
Đặc biệt vinh danh:
- Bạn Nguyễn Hoàng Minh: Đạt 8.5 Overall (Listening 9.0, Reading 9.0)
- Bạn Trần Thu Trang: Đạt 8.0 Overall sau 3 tháng theo học lớp IELTS Bứt Phá
- Bạn Đặng Minh Quân: Đạt 7.5 Overall, đủ điều kiện nhận học bổng toàn phần du học Australia.
Sự nỗ lực của các bạn là niềm tự hào lớn lao của toàn thể đội ngũ giảng viên EduCenter.`,
        summary: 'Tuyên dương 18 gương mặt học viên xuất sắc chinh phục band điểm vàng 7.5 - 8.5 IELTS.',
        author: directorUser._id,
        category: 'Vinh danh',
        targetAudience: 'ALL',
        isPinned: false,
        status: 'PUBLISHED',
        publicationDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        views: 1045,
      },
      {
        title: '📋 Hướng Dẫn Sử Dụng Tính Năng Đổi Lớp & Đổi Lịch Học Trên Cổng Portal',
        content: `Nhằm tạo điều kiện linh hoạt tối đa cho học viên có lịch trình công tác hoặc thi cử, hệ thống EduCenter Portal đã cập nhật tính năng "Gửi Yêu Cầu Thay Đổi Lớp Học / Lịch Học" trực tuyến.
Quy trình thực hiện:
1. Đăng nhập vào tài khoản học viên tại portal.educenter.edu.vn
2. Vào mục "Yêu cầu thay đổi" trong trang cá nhân
3. Chọn lớp học mong muốn chuyển sang và nêu rõ lý do
4. Phòng Giáo vụ sẽ xét duyệt và phản hồi trong vòng 24h làm việc.`,
        summary: 'Quy trình gửi yêu cầu chuyển lớp, dời lịch học trực tuyến thuận tiện cho học viên.',
        author: staffUser1._id,
        category: 'Thông báo học vụ',
        targetAudience: 'STUDENTS',
        isPinned: false,
        status: 'PUBLISHED',
        publicationDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        views: 320,
      },
      {
        title: '📚 Cập Nhật Bộ Đề Dự Đoán Cambridge IELTS Forecast Quý 4 Độc Quyền',
        content: `Phòng Nghiên cứu Học thuật EduCenter vừa phát hành trọn bộ tài liệu Forecast Speaking & Writing Quý 4.
- Đầy đủ 60 chủ đề Speaking Part 1, 2, 3 mới nhất với câu trả lời mẫu đạt chuẩn Band 8.0+
- Bộ 25 đề Writing Task 1 & 2 dự đoán kèm dàn ý chi tiết và danh mục từ vựng Collocation học thuật
Học viên hiện tại của trung tâm có thể tải tài liệu miễn phí trong mục "Tài nguyên học tập".`,
        summary: 'Tài liệu độc quyền Forecast Quý 4 giúp học viên tự tin bứt phá điểm số trong kỳ thi thật.',
        author: teacherAlex._id,
        category: 'Học liệu',
        targetAudience: 'STUDENTS',
        isPinned: false,
        status: 'PUBLISHED',
        publicationDate: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
        views: 890,
      },
      {
        title: '📢 Kế Hoạch Tập Huấn Phương Pháp Sư Phạm Khảo Thí Dành Cho Đội Ngũ Giảng Viên',
        content: `Ban Giám đốc EduCenter thông báo lịch tập huấn chuyên môn định kỳ Quý 4 cùng chuyên gia khảo thí IDP.
Thời gian: 09:00 - 17:00 Chủ Nhật tuần tới.
Địa điểm: Phòng Hội thảo VIP 1 - EduCenter Cầu Giấy.
Yêu cầu 100% Giảng viên cơ hữu và thỉnh giảng tham dự đầy đủ.`,
        summary: 'Tập huấn nâng cao phương pháp giảng dạy và barem chấm điểm IELTS quốc tế mới nhất.',
        author: directorUser._id,
        category: 'Nội bộ',
        targetAudience: 'TEACHERS',
        isPinned: false,
        status: 'PUBLISHED',
        publicationDate: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
        views: 180,
      },
    ]);

    // ==========================================
    // TỔNG KẾT VÀ BÁO CÁO THÀNH CÔNG
    // ==========================================
    console.log('\n======================================================');
    console.log('🎉 SEED DỮ LIỆU EDUCENTER THÀNH CÔNG VÀO MONGODB ATLAS!');
    console.log('======================================================');
    console.log(`🏛️ 1.  Center:          1 trung tâm đào tạo với 5 chi nhánh & 4 cơ sở vật chất`);
    console.log(`👤 2.  Users:           ${users.length} tài khoản (1 Director, 2 Staff, 4 Teachers, 8 Students)`);
    console.log(`💼 3.  Staff:           2 hồ sơ cán bộ giáo vụ`);
    console.log(`👨‍🏫 4.  Teachers:        4 hồ sơ giảng viên IELTS 8.5 - 9.0`);
    console.log(`🎓 5.  Students:        8 hồ sơ học viên`);
    console.log(`📚 6.  Courses:         ${courses.length} khóa học IELTS chuẩn quốc tế`);
    console.log(`🏫 7.  Classes:         ${classes.length} lớp học đang hoạt động`);
    console.log(`🔗 8.  ClassTeachers:   8 phân công giảng viên - lớp`);
    console.log(`📅 9.  ClassSchedules:  ${schedules.length} buổi học theo thời khóa biểu`);
    console.log(`📝 10. Enrollments:     ${enrollments.length} lượt ghi danh học viên`);
    console.log(`💳 11. Payments:        10 bản ghi thanh toán học phí`);
    console.log(`📝 12. Assignments:     ${assignments.length} bài tập về nhà`);
    console.log(`📬 13. Submissions:     6 bài nộp có điểm và phản hồi chi tiết`);
    console.log(`📋 14. Attendance:      ${attendanceCount} bản ghi điểm danh học viên`);
    console.log(`🏆 15. Grades:          7 bảng điểm thi thử và giữa kỳ`);
    console.log(`⭐ 16. Feedback:        5 đánh giá 5 sao từ học viên`);
    console.log(`🔔 17. Notifications:   6 thông báo cá nhân`);
    console.log(`🔄 18. ChangeRequests:  3 yêu cầu chuyển lớp & dời lịch`);
    console.log(`📢 19. Announcements:   6 bản tin & thông báo chung`);
    console.log('------------------------------------------------------');
    console.log('🔑 TÀI KHOẢN ĐĂNG NHẬP (Mật khẩu chung: Password123@)');
    console.log('------------------------------------------------------');
    console.log('👔 DIRECTOR:        director@educenter.edu.vn');
    console.log('📋 TRAINING_STAFF:  staff@educenter.edu.vn');
    console.log('📋 TRAINING_STAFF:  staff.hoang@educenter.edu.vn');
    console.log('👨‍🏫 TEACHER 1 (9.0): teacher.an@educenter.edu.vn');
    console.log('👨‍🏫 TEACHER 2 (8.5): teacher.bach@educenter.edu.vn');
    console.log('👨‍🏫 TEACHER 3 (8.5): teacher.michael@educenter.edu.vn');
    console.log('👨‍🏫 TEACHER 4 (8.5): teacher.emily@educenter.edu.vn');
    console.log('🎓 STUDENT 1:       student.dang@gmail.com');
    console.log('🎓 STUDENT 2:       student.mai@gmail.com');
    console.log('🎓 STUDENT 3:       student.kiet@gmail.com');
    console.log('🎓 STUDENT 4:       student.linh@gmail.com');
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi seed dữ liệu:', error);
    process.exit(1);
  }
};

seedDatabase();
