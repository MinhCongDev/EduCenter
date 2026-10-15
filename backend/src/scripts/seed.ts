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
  ClassSchedule,
  Announcement,
  Center,
} from '../models';

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

    // 1. Dọn dẹp dữ liệu cũ
    console.log('🧹 Đang làm sạch dữ liệu cũ...');
    await Promise.all([
      User.deleteMany({}),
      Staff.deleteMany({}),
      Teacher.deleteMany({}),
      Student.deleteMany({}),
      Course.deleteMany({}),
      Class.deleteMany({}),
      Enrollment.deleteMany({}),
      ClassSchedule.deleteMany({}),
      Announcement.deleteMany({}),
      Center.deleteMany({}),
    ]);

    // 2. Tạo thông tin Trung tâm (Center Info - UC01)
    console.log('🏛️ Đang tạo thông tin Trung tâm đào tạo EduCenter...');
    await Center.create({
      name: 'EduCenter IELTS Academy',
      slogan: 'Học viện Luyện thi IELTS 8.0+ Chuẩn Khảo thí Quốc tế',
      introduction:
        'EduCenter là tổ chức giáo dục đào tạo IELTS hàng đầu Việt Nam, đối tác bạch kim chính thức của IDP và British Council. Với đội ngũ 100% giảng viên đạt 8.5 - 9.0 IELTS Overall, hệ thống phòng thi máy tính độc quyền và hợp đồng cam kết đầu ra bằng văn bản pháp lý, EduCenter đã đồng hành cùng hơn 50.000 học viên đạt mục tiêu.',
      vision: 'Trở thành học viện khảo thí và đào tạo IELTS chuẩn mực số 1 tại Đông Nam Á.',
      mission: 'Kiến tạo môi trường học tiếng Anh chuẩn học thuật quốc tế, giúp học viên Việt Nam tự tin chinh phục học bổng, du học và định cư.',
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
          studentCount: 540,
          classCount: 18,
          revenue: '890.000.000 ₫',
          fillRate: 94,
          status: 'Tăng trưởng nhanh',
        },
        {
          branchName: 'Cơ sở 2 (Đống Đa)',
          address: 'Số 254 Tây Sơn, P. Trung Liệt, Q. Đống Đa, Hà Nội',
          phone: '024 3789 6869',
          isHeadquarters: false,
          studentCount: 380,
          classCount: 12,
          revenue: '640.000.000 ₫',
          fillRate: 88,
          status: 'Hoạt động tốt',
        },
        {
          branchName: 'Cơ sở 3 (Bách Khoa - Hai Bà Trưng)',
          address: 'Số 86 Lê Thanh Nghị, P. Đồng Tâm, Q. Hai Bà Trưng, Hà Nội',
          phone: '024 3789 6870',
          isHeadquarters: false,
          studentCount: 310,
          classCount: 10,
          revenue: '520.000.000 ₫',
          fillRate: 82,
          status: 'Hoạt động tốt',
        },
        {
          branchName: 'Cơ sở 4 (Quận 1 - TP. Hồ Chí Minh)',
          address: 'Tòa nhà Bitexco Nam, 180 Nguyễn Thị Minh Khai, P. 6, Q. 1, TP. HCM',
          phone: '028 3988 6868',
          isHeadquarters: false,
          studentCount: 198,
          classCount: 8,
          revenue: '400.000.000 ₫',
          fillRate: 91,
          status: 'Tăng trưởng nhanh',
        },
        {
          branchName: 'Cơ sở 5 (Quận 10 - TP. Hồ Chí Minh)',
          address: 'Số 387 Sư Vạn Hạnh, P. 12, Q. 10, TP. HCM',
          phone: '028 3988 6869',
          isHeadquarters: false,
          studentCount: 150,
          classCount: 6,
          revenue: '300.000.000 ₫',
          fillRate: 85,
          status: 'Hoạt động tốt',
        },
      ],
      facilities: [
        {
          name: 'Phòng thi thử IELTS trên máy tính (Computer-delivered Lab)',
          description: 'Trang bị 60 máy tính Core i7, tai nghe cách âm chuyên dụng đạt chuẩn kiểm định IDP & British Council.',
          imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop',
        },
        {
          name: 'Phòng Mock Speaking Coaching 1:1 Studio',
          description: 'Không gian tiêu âm chuẩn thu âm studio, camera HD ghi lại ngôn ngữ cơ thể và phản xạ câu hỏi.',
          imageUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=800&auto=format&fit=crop',
        },
        {
          name: 'Thư viện học thuật Cambridge IELTS & Không gian tự học 24/7',
          description: 'Kho đề thi Cambridge từ Vol 10 - 19, nguồn tài liệu New Scientist, The Economist và phòng tự học miễn phí.',
          imageUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=800&auto=format&fit=crop',
        },
        {
          name: 'Smart Classrooms màn hình tương tác 4K',
          description: 'Phòng học hiện đại có hệ thống bảng tương tác thông minh và micro thu âm giảng dạy trực tiếp.',
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

    // 3. Mật khẩu chung cho các tài khoản mẫu
    const defaultPassword = 'Password123@';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // 4. Tạo Users (4 roles)
    console.log('👤 Đang tạo tài khoản người dùng mẫu...');
    const users = await User.insertMany([
      {
        fullName: 'Nguyễn Minh Công (Giám đốc)',
        email: 'director@educenter.edu.vn',
        password: hashedPassword,
        phone: '0988111222',
        address: 'Hà Nội',
        role: 'DIRECTOR',
        status: 'ACTIVE',
      },
      {
        fullName: 'Trần Thị Thu Thảo (Giáo vụ)',
        email: 'staff@educenter.edu.vn',
        password: hashedPassword,
        phone: '0977222333',
        address: 'Hà Nội',
        role: 'TRAINING_STAFF',
        status: 'ACTIVE',
      },
      {
        fullName: 'Thầy Alex Nguyễn (IELTS 9.0)',
        email: 'teacher.an@educenter.edu.vn',
        password: hashedPassword,
        phone: '0911333444',
        address: 'Cầu Giấy, Hà Nội',
        role: 'TEACHER',
        status: 'ACTIVE',
        avatarUrl: 'https://cdn.dungmori.com/assets/img/new_home/06-2024/thaydung.png',
      },
      {
        fullName: 'Cô Sarah Phương (IELTS 8.5)',
        email: 'teacher.bach@educenter.edu.vn',
        password: hashedPassword,
        phone: '0912444555',
        address: 'Đống Đa, Hà Nội',
        role: 'TEACHER',
        status: 'ACTIVE',
        avatarUrl: 'https://cdn.dungmori.com/assets/img/new_home/06-2024/cothanh.png',
      },
      {
        fullName: 'Phạm Hải Đăng (Học viên)',
        email: 'student.dang@gmail.com',
        password: hashedPassword,
        phone: '0933555666',
        address: 'Hà Nội',
        role: 'STUDENT',
        status: 'ACTIVE',
      },
      {
        fullName: 'Vũ Ngọc Mai (Học viên)',
        email: 'student.mai@gmail.com',
        password: hashedPassword,
        phone: '0934666777',
        address: 'Hà Nội',
        role: 'STUDENT',
        status: 'ACTIVE',
      },
      {
        fullName: 'Đỗ Tuấn Kiệt (Học viên)',
        email: 'student.kiet@gmail.com',
        password: hashedPassword,
        phone: '0935777888',
        address: 'TP. Hồ Chí Minh',
        role: 'STUDENT',
        status: 'ACTIVE',
      },
    ]);

    const directorUser = users[0];
    const staffUser = users[1];
    const teacherAlex = users[2];
    const teacherSarah = users[3];
    const studentDang = users[4];
    const studentMai = users[5];
    const studentKiet = users[6];

    // Tạo hồ sơ nhân viên Staff
    await Staff.create({
      user: staffUser._id,
      staffCode: 'STF-001',
      department: 'Phòng Giáo vụ & Đào tạo',
      position: 'Trưởng ban Học vụ',
    });

    // Tạo hồ sơ Giảng viên Teacher
    await Teacher.create({
      user: teacherAlex._id,
      teacherCode: 'TCH-001',
      specialization: ['IELTS 4 Kỹ Năng', 'IELTS Writing Task 2 Master', 'Mock Speaking 1:1'],
      bio: 'IELTS 9.0 Overall (9.0 Listening, 9.0 Reading, 8.5 Speaking), Thạc sĩ MA TESOL University of Leeds (Anh Quốc), 11 năm kinh nghiệm.',
      qualifications: ['MA TESOL Leeds', 'CELTA Pass A', 'IELTS 9.0'],
      ieltsBand: 9.0,
      yearsOfExperience: 11,
    });

    await Teacher.create({
      user: teacherSarah._id,
      teacherCode: 'TCH-002',
      specialization: ['IELTS Speaking Fluency', 'IELTS Listening Accent Master'],
      bio: 'IELTS 8.5 Overall (9.0 Speaking), Cựu du học sinh Đại học Sydney Úc, chứng chỉ quốc tế CELTA.',
      qualifications: ['Bachelor USYD', 'CELTA', 'IELTS 8.5'],
      ieltsBand: 8.5,
      yearsOfExperience: 7,
    });

    // Tạo hồ sơ Học viên Student
    await Student.create({
      user: studentDang._id,
      studentCode: 'STU-1001',
      currentBand: 5.5,
      targetBand: 7.0,
      learningGoal: 'Du học Thạc sĩ Châu Âu',
    });

    await Student.create({
      user: studentMai._id,
      studentCode: 'STU-1002',
      currentBand: 6.0,
      targetBand: 7.5,
      learningGoal: 'Xét tuyển thẳng Đại học Ngoại Thương',
    });

    await Student.create({
      user: studentKiet._id,
      studentCode: 'STU-1003',
      currentBand: 4.5,
      targetBand: 6.5,
      learningGoal: 'Định cư Canada',
    });

    // 5. Tạo các khóa học IELTS chuẩn (Courses - UC02, UC03, UC04, UC05)
    console.log('📚 Đang tạo danh sách khóa học IELTS...');
    const courses = await Course.insertMany([
      {
        code: 'IELTS-LOST',
        title: 'IELTS Mất Gốc & Phát Âm Chuẩn Quốc Tế (0 - 3.5)',
        description: 'Khóa học được thiết kế dành riêng cho người mất gốc tiếng Anh hoàn toàn hoặc muốn xây dựng lại nền tảng phát âm IPA và ngữ pháp học thuật cốt lõi.',
        category: 'Nền tảng IELTS',
        entryLevel: '0 - 3.5',
        targetLevel: '3.5 - 4.5',
        durationWeeks: 8,
        sessions: 24,
        tuitionFee: 4500000,
        format: 'BLENDED',
        status: 'ACTIVE',
        bannerUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800&auto=format&fit=crop',
        featured: true,
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
        description: 'Làm quen toàn diện với cấu trúc bài thi IELTS 4 kỹ năng (Nghe, Nói, Đọc, Viết) và các dạng bài thi điển hình theo chuẩn Cambridge.',
        category: 'Nền tảng IELTS',
        entryLevel: '3.5 - 4.5',
        targetLevel: '4.5 - 5.5',
        durationWeeks: 10,
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
        description: 'Tập trung bồi dưỡng chiến thuật xử lý các dạng câu hỏi khó trong bài thi IELTS, phát triển tư duy mở rộng ý tưởng Speaking Part 2 và Writing Task 2.',
        category: 'Chiến thuật IELTS',
        entryLevel: '4.5 - 5.5',
        targetLevel: '5.5 - 6.5',
        durationWeeks: 12,
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
        description: 'Khóa học được học viên lựa chọn nhiều nhất tại EduCenter! Cam kết tăng 1.0 Band điểm, đạt chuẩn nộp hồ sơ xét tuyển Đại học top đầu và du học quốc tế.',
        category: 'Luyện thi Chuyên sâu',
        entryLevel: '5.5 - 6.5',
        targetLevel: '6.5 - 7.5+',
        durationWeeks: 12,
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
        description: 'Khóa học đỉnh cao dành cho học viên mục tiêu săn học bổng toàn phần du học Anh/Mỹ/Úc hoặc giảng dạy IELTS. Chấm chữa Writing & Speaking chi tiết từng từ.',
        category: 'Luyện thi Chuyên sâu',
        entryLevel: '6.5 - 7.5+',
        targetLevel: '8.0+',
        durationWeeks: 10,
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
        description: 'Lớp học kèm riêng 1:1 tập trung toàn bộ thời lượng vào việc chỉnh sửa ngữ điệu, phản xạ tự nhiên và bộ đề Forecast Speaking mới nhất của quý.',
        category: 'Kỹ năng Chuyên biệt',
        entryLevel: '4.5 - 7.5+',
        targetLevel: '7.5+',
        durationWeeks: 8,
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

    // 6. Tạo các lớp học (Classes)
    console.log('🏫 Đang tạo các lớp học mẫu...');
    const class1 = await Class.create({
      classCode: 'IELTS-INT-K26A',
      name: 'Lớp IELTS Bứt Phá K26A (Mục tiêu 6.5 - 7.5)',
      course: courses[3]._id,
      teacher: teacherAlex._id,
      room: 'Phòng Lab 201 (EduCenter Cầu Giấy)',
      scheduleDays: ['Thứ 2', 'Thứ 4', 'Thứ 6'],
      timeSlot: '18:30 - 20:30',
      startDate: new Date('2026-11-01'),
      endDate: new Date('2027-01-28'),
      capacity: 20,
      currentEnrollment: 12,
      status: 'OPEN',
    });

    const class2 = await Class.create({
      classCode: 'IELTS-FND-K18B',
      name: 'Lớp IELTS Foundation K18B (Mục tiêu 5.5)',
      course: courses[2]._id,
      teacher: teacherSarah._id,
      room: 'Phòng 302 (EduCenter Đống Đa)',
      scheduleDays: ['Thứ 3', 'Thứ 5', 'Thứ 7'],
      timeSlot: '19:00 - 21:00',
      startDate: new Date('2026-11-05'),
      endDate: new Date('2027-02-05'),
      capacity: 20,
      currentEnrollment: 15,
      status: 'OPEN',
    });

    // 7. Tạo lịch học cho lớp (ClassSchedule)
    await ClassSchedule.create([
      {
        class: class1._id,
        dayOfWeek: 'Thứ 2',
        startTime: '18:30',
        endTime: '20:30',
        classroom: 'Phòng Lab 201',
        topic: 'IELTS Reading - Chiến thuật Matching Headings',
      },
      {
        class: class1._id,
        dayOfWeek: 'Thứ 4',
        startTime: '18:30',
        endTime: '20:30',
        classroom: 'Phòng Lab 201',
        topic: 'IELTS Writing Task 2 - Bố cục đoạn văn PEEL',
      },
      {
        class: class1._id,
        dayOfWeek: 'Thứ 6',
        startTime: '18:30',
        endTime: '20:30',
        classroom: 'Phòng Lab 201',
        topic: 'IELTS Speaking Part 3 - Luận điểm & Phản xạ',
      },
    ]);

    // 8. Tạo dữ liệu ghi danh học viên (Enrollments)
    console.log('📝 Đang tạo dữ liệu ghi danh học viên...');
    await Enrollment.create([
      {
        student: studentDang._id,
        class: class1._id,
        course: courses[3]._id,
        enrollmentDate: new Date(),
        registrationDate: new Date(),
        status: 'ENROLLED',
        tuitionStatus: 'PAID',
      },
      {
        student: studentMai._id,
        class: class1._id,
        course: courses[3]._id,
        enrollmentDate: new Date(),
        registrationDate: new Date(),
        status: 'ENROLLED',
        tuitionStatus: 'PAID',
      },
      {
        student: studentKiet._id,
        class: class2._id,
        course: courses[2]._id,
        enrollmentDate: new Date(),
        registrationDate: new Date(),
        status: 'ENROLLED',
        tuitionStatus: 'PENDING',
      },
    ]);

    // 9. Tạo thông báo quan trọng (Announcements - UC06)
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
        summary: 'Tham gia buổi chia sẻ chiến thuật chinh phục Writing Task 2 Band 7.5+ cùng Thầy Alex Nguyễn 9.0 IELTS.',
        author: directorUser._id,
        category: 'Workshop',
        targetAudience: 'ALL',
        isPinned: true,
        publicationDate: new Date(),
        views: 342,
      },
      {
        title: '🎯 Lịch Thi Thử IELTS On Computer (Thực Chiến 100% Chuẩn IDP & British Council)',
        content: `EduCenter tổ chức kỳ thi thử IELTS trên máy tính định kỳ hàng tháng hoàn toàn MIỄN PHÍ dành cho học viên và thí sinh tự do.
- Định dạng: 100% chuẩn giao diện máy tính IDP/BC
- Trang thiết bị: Tai nghe cách âm chuyên dụng khử ồn chủ động, màn hình 24-inch sắc nét
- Kết quả: Trả điểm và nhận xét chi tiết 4 kỹ năng trong vòng 24 giờ làm việc.
Lịch thi đợt 1: Thứ 7 (Ca sáng: 08:30 - 11:30 | Ca chiều: 14:00 - 17:00).
Vui lòng liên hệ quầy Giáo vụ hoặc đăng ký trực tiếp trên Portal để giữ chỗ.`,
        summary: 'Trải nghiệm phòng thi máy tính chuẩn quốc tế, nhận kết quả và phân tích điểm chi tiết sau 24h.',
        author: staffUser._id,
        category: 'Thi thử IELTS',
        targetAudience: 'ALL',
        isPinned: true,
        publicationDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        views: 520,
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
        publicationDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        views: 890,
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
        author: staffUser._id,
        category: 'Thông báo học vụ',
        targetAudience: 'STUDENTS',
        isPinned: false,
        publicationDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        views: 215,
      },
    ]);

    console.log('\n======================================================');
    console.log('🎉 SEED DỮ LIỆU EDUCENTER THÀNH CÔNG VÀO MONGODB ATLAS!');
    console.log('======================================================');
    console.log('🏢 Thông tin trung tâm EduCenter IELTS Academy đã sẵn sàng (UC01)');
    console.log('📚 6 Khóa học IELTS từ 0 đến 8.0+ đã được nạp (UC02, UC03, UC04, UC05)');
    console.log('📢 4 Bản tin thông báo IELTS & Workshop đã nạp (UC06)');
    console.log('------------------------------------------------------');
    console.log('🔑 TÀI KHOẢN MẪU (Mật khẩu chung: Password123@)');
    console.log('- Giám đốc (DIRECTOR):      director@educenter.edu.vn');
    console.log('- Giáo vụ (TRAINING_STAFF): staff@educenter.edu.vn');
    console.log('- Giảng viên 1 (TEACHER):   teacher.an@educenter.edu.vn');
    console.log('- Giảng viên 2 (TEACHER):   teacher.bach@educenter.edu.vn');
    console.log('- Học viên 1 (STUDENT):     student.dang@gmail.com');
    console.log('- Học viên 2 (STUDENT):     student.mai@gmail.com');
    console.log('- Học viên 3 (STUDENT):     student.kiet@gmail.com');
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi seed dữ liệu:', error);
    process.exit(1);
  }
};

seedDatabase();
