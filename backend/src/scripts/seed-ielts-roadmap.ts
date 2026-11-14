import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const courseSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: { type: String, default: 'Lộ trình IELTS', trim: true },
    entryLevel: { type: String, default: '0 - 3.5', trim: true },
    targetLevel: { type: String, default: '3.5 - 4.5', trim: true },
    sessions: { type: Number, required: true, default: 30 },
    tuitionFee: { type: Number, required: true, default: 0 },
    format: { type: String, enum: ['ONLINE', 'OFFLINE', 'BLENDED'], default: 'OFFLINE' },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'DRAFT'], default: 'ACTIVE' },
    learningObjectives: { type: [String], default: [] },
    syllabus: { type: [String], default: [] },
    milestones: [
      {
        milestoneId: { type: String, required: true },
        title: { type: String, required: true },
        description: { type: String, default: '' },
        order: { type: Number, default: 1 },
        type: { type: String, default: 'CHECKPOINT' },
        targetSession: { type: Number, default: 0 },
      },
    ],
    bannerUrl: { type: String, default: '' },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Course = mongoose.models.Course || mongoose.model('Course', courseSchema);

export const roadmapCourses = [
  {
    code: 'IELTS-LOST',
    title: 'IELTS Mất Gốc (0 - 3.5) [CƠ BẢN]',
    description: 'Khóa học thiết kế chuyên biệt cho người mất gốc tiếng Anh hoặc bắt đầu từ số 0, tập trung lấy lại nền tảng phát âm chuẩn IPA và ngữ pháp học thuật cốt lõi.',
    category: 'Lộ trình IELTS',
    entryLevel: '0 - 3.5',
    targetLevel: '3.5 - 4.5',
    sessions: 24,
    tuitionFee: 4500000,
    format: 'BLENDED',
    status: 'ACTIVE',
    featured: false,
    bannerUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800&auto=format&fit=crop',
    learningObjectives: [
      'Chuẩn hóa phát âm 44 âm IPA theo chuẩn Anh - Mỹ quốc tế',
      'Nắm vững 12 chủ điểm ngữ pháp trọng yếu hay gặp nhất trong đề thi IELTS',
      'Tích lũy 1.500 từ vựng cốt lõi theo chủ đề đời sống thông dụng',
      'Tự tin tạo lập câu đúng ngữ pháp và phản xạ giao tiếp cơ bản',
    ],
    syllabus: [
      'Tuần 1-2: Ngữ âm nền tảng IPA, nhấn trọng âm & Kỹ thuật nối âm chuẩn xác',
      'Tuần 3-4: Ngữ pháp cốt lõi: Các thì cơ bản, Mệnh đề quan hệ, Thể bị động',
      'Tuần 5-6: Xây dựng vốn từ vựng theo chủ đề: Education, Work, Family, Travel',
      'Tuần 7-8: Làm quen với format các phần thi IELTS & Kiểm tra đánh giá đầu ra',
    ],
    milestones: [
      { milestoneId: 'MS-1', title: 'Hoàn thành bảng phiên âm IPA', description: 'Phát âm chuẩn 44 âm và ngữ điệu tự nhiên.', order: 1, type: 'SKILL_CHECK', targetSession: 6 },
      { milestoneId: 'MS-2', title: 'Kiểm tra ngữ pháp nền tảng', description: 'Đạt tối thiểu 80% câu hỏi trắc nghiệm ngữ pháp.', order: 2, type: 'ASSIGNMENT', targetSession: 12 },
      { milestoneId: 'MS-3', title: 'Thi giữa kỳ mini test', description: 'Đánh giá từ vựng và phản xạ nghe nói.', order: 3, type: 'MOCK_TEST', targetSession: 18 },
      { milestoneId: 'MS-4', title: 'Thi tốt nghiệp khóa Mất Gốc', description: 'Đạt chuẩn đầu ra sẵn sàng lên lớp Pre-IELTS.', order: 4, type: 'CHECKPOINT', targetSession: 24 },
    ],
  },
  {
    code: 'IELTS-PRE',
    title: 'IELTS Pre (3.5 - 4.5)',
    description: 'Làm quen toàn diện với format bài thi IELTS 4 kỹ năng (Listening, Reading, Writing, Speaking) và các dạng câu hỏi kinh điển theo chuẩn đề thi Cambridge.',
    category: 'Lộ trình IELTS',
    entryLevel: '3.5 - 4.5',
    targetLevel: '4.5 - 5.5',
    sessions: 30,
    tuitionFee: 5800000,
    format: 'OFFLINE',
    status: 'ACTIVE',
    featured: false,
    bannerUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800&auto=format&fit=crop',
    learningObjectives: [
      'Hiểu rõ tiêu chí chấm điểm và format 4 kỹ năng trong đề thi IELTS',
      'Rèn luyện kỹ năng Skimming & Scanning định vị thông tin nhanh trong bài đọc',
      'Luyện nghe bắt từ khóa (Keywords) và nhận diện các bẫy đề thi phổ biến',
      'Luyện nói phản xạ Part 1 và nắm vững cấu trúc bài viết Task 1 miêu tả biểu đồ',
    ],
    syllabus: [
      'Tuần 1-3: Format đề thi & Listening Section 1-2, Reading Multiple Choice & Completion',
      'Tuần 4-6: Speaking Part 1 Topics & Writing Task 1: Dạng biểu đồ đường, cột, tròn',
      'Tuần 7-9: Listening Section 3 & Reading Matching Headings, True/False/Not Given',
      'Tuần 10: Mock Test giữa khóa & Hoàn thiện kỹ năng phản xạ 4 kỹ năng',
    ],
    milestones: [
      { milestoneId: 'MS-1', title: 'Nắm vững format đề thi 4 kỹ năng', description: 'Phân biệt rõ từng dạng câu hỏi và tiêu chí tính điểm.', order: 1, type: 'LESSON_COMPLETION', targetSession: 6 },
      { milestoneId: 'MS-2', title: 'Hoàn thiện kỹ năng làm Reading & Listening cơ bản', description: 'Luyện đề Cam 14-17 phần Section 1-2.', order: 2, type: 'SKILL_CHECK', targetSession: 14 },
      { milestoneId: 'MS-3', title: 'Đánh giá tiến độ Giữa kỳ (Mid-term)', description: 'Thi thử 2 kỹ năng Nghe - Đọc dưới áp lực thời gian.', order: 3, type: 'MOCK_TEST', targetSession: 20 },
      { milestoneId: 'MS-4', title: 'Đạt chuẩn đầu ra Pre-IELTS (4.5+)', description: 'Hoàn thành bài thi tốt nghiệp 4 kỹ năng.', order: 4, type: 'CHECKPOINT', targetSession: 30 },
    ],
  },
  {
    code: 'IELTS-FOUNDATION',
    title: 'IELTS Foundation (4.5 - 5.5)',
    description: 'Khóa học xây dựng chiến thuật làm bài cơ bản, tập trung bồi dưỡng kỹ thuật xử lý các dạng bài khó, phát triển ý tưởng Speaking Part 2 và dàn ý Writing Task 2.',
    category: 'Lộ trình IELTS',
    entryLevel: '4.5 - 5.5',
    targetLevel: '5.5 - 6.5',
    sessions: 36,
    tuitionFee: 6800000,
    format: 'OFFLINE',
    status: 'ACTIVE',
    featured: true,
    bannerUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop',
    learningObjectives: [
      'Thành thạo chiến thuật làm bài Reading cho dạng hóc búa Yes/No/Not Given',
      'Làm chủ dạng bài Listening Section 3 - 4 thảo luận học thuật chuyên sâu',
      'Phát triển ý tưởng Speaking Part 2 trôi chảy theo sơ đồ tư duy Mindmap',
      'Nắm chắc cấu trúc đoạn văn chuẩn PEEL trong Academic Writing Task 2',
    ],
    syllabus: [
      'Tuần 1-3: Chiến lược định vị thông tin nhanh trong Reading học thuật',
      'Tuần 4-6: Tư duy phát triển luận điểm Writing Task 2 dạng Opinion & Discussion',
      'Tuần 7-9: Luyện Speaking Part 2 theo công thức 5W1H và từ vựng nâng cao Band 6.0+',
      'Tuần 10-12: Mock Test trên máy tính và tổng kết phương pháp làm bài',
    ],
    milestones: [
      { milestoneId: 'MS-1', title: 'Nắm vững nền tảng học thuật', description: 'Chiến thuật Reading/Listening cơ bản.', order: 1, type: 'LESSON_COMPLETION', targetSession: 6 },
      { milestoneId: 'MS-2', title: 'Làm chủ dạng bài Listening Section 3 & Reading Headings', description: 'Đạt tỷ lệ đúng trên 25/40 câu.', order: 2, type: 'SKILL_CHECK', targetSession: 14 },
      { milestoneId: 'MS-3', title: 'Bài thi đánh giá Giữa kỳ (Mid-term Test)', description: 'Đo lường tiến độ sau 50% thời lượng.', order: 3, type: 'MOCK_TEST', targetSession: 18 },
      { milestoneId: 'MS-4', title: 'Hoàn thiện 4 bài viết Writing Task 2', description: 'Sửa lỗi ngữ pháp và tăng cường liên kết đoạn.', order: 4, type: 'ASSIGNMENT', targetSession: 28 },
      { milestoneId: 'MS-5', title: 'Thi thử 4 kỹ năng trọn vẹn (Full Mock Test)', description: 'Mô phỏng kỳ thi thực tế tại phòng máy.', order: 5, type: 'MOCK_TEST', targetSession: 34 },
      { milestoneId: 'MS-6', title: 'Đạt chuẩn đầu ra 5.5+', description: 'Chứng nhận hoàn thành khóa Foundation.', order: 6, type: 'CHECKPOINT', targetSession: 36 },
    ],
  },
  {
    code: 'IELTS-BREAKTHROUGH',
    title: 'IELTS Bứt Phá (5.5 - 6.5) [HOT]',
    description: 'Khóa học được học viên lựa chọn nhiều nhất! Đạt chuẩn nộp hồ sơ xét tuyển Đại học top đầu và du học quốc tế. Đột phá tư duy lập luận và xử lý câu hỏi chuyên sâu.',
    category: 'Lộ trình IELTS',
    entryLevel: '5.5 - 6.5',
    targetLevel: '6.5 - 7.5',
    sessions: 36,
    tuitionFee: 8800000,
    format: 'BLENDED',
    status: 'ACTIVE',
    featured: true,
    bannerUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=800&auto=format&fit=crop',
    learningObjectives: [
      'Chinh phục Band 7.0+ ở 2 kỹ năng Listening & Reading',
      'Sử dụng linh hoạt Collocations & Idiomatic language trong Speaking Part 2 & 3',
      'Nâng cấp cấu trúc câu phức (Complex Sentences, Inversion) trong Writing Task 2',
      'Sửa bài Writing & Speaking 1:1 hàng tuần trực tiếp với giảng viên 8.0+',
    ],
    syllabus: [
      'Tuần 1-3: Chiến thuật tối đa điểm Listening Section 4 & Reading chuyên ngành',
      'Tuần 4-6: Xử lý dạng bài Map / Process và biểu đồ phức hợp trong Writing Task 1',
      'Tuần 7-9: Luyện tư duy phản biện (Critical Thinking) cho Speaking Part 3 & Writing Task 2',
      'Tuần 10-12: Luyện giải bộ đề dự đoán Cambridge thực chiến & Cam kết chuẩn đầu ra',
    ],
    milestones: [
      { milestoneId: 'MS-1', title: 'Chiến thuật nâng Band Listening & Reading 7.0+', description: 'Tập trung các bẫy khó nhất của Cambridge.', order: 1, type: 'LESSON_COMPLETION', targetSession: 8 },
      { milestoneId: 'MS-2', title: 'Thành thạo Writing Task 1 dạng Map/Process', description: 'Đạt tiêu chí Task Achievement chuẩn xác.', order: 2, type: 'SKILL_CHECK', targetSession: 16 },
      { milestoneId: 'MS-3', title: 'Thi giữa kỳ áp lực thi thật', description: 'Kiểm tra 4 kỹ năng, phân tích lỗi chi tiết.', order: 3, type: 'MOCK_TEST', targetSession: 22 },
      { milestoneId: 'MS-4', title: 'Coaching 1:1 Speaking với Giảng viên', description: 'Sửa phát âm và từ vựng band 7.0+.', order: 4, type: 'ASSIGNMENT', targetSession: 30 },
      { milestoneId: 'MS-5', title: 'Tốt nghiệp khóa Bứt Phá (Target 6.5+)', description: 'Đạt chứng nhận hoàn thành khóa học.', order: 5, type: 'CHECKPOINT', targetSession: 36 },
    ],
  },
  {
    code: 'IELTS-ADVANCED',
    title: 'IELTS Chuyên Sâu (6.5 - 7.5+) [MỚI]',
    description: 'Chấm chữa Writing & Speaking 1:1 chuyên sâu cùng giảng viên IELTS 8.5+. Rèn luyện tư duy học thuật phản biện đỉnh cao, tối ưu từng barem điểm quốc tế.',
    category: 'Lộ trình IELTS',
    entryLevel: '6.5 - 7.5+',
    targetLevel: '7.5 - 8.0',
    sessions: 30,
    tuitionFee: 9800000,
    format: 'OFFLINE',
    status: 'ACTIVE',
    featured: true,
    bannerUrl: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?q=80&w=800&auto=format&fit=crop',
    learningObjectives: [
      'Chấm chữa Writing Task 1 & 2 chi tiết 1:1 theo 4 tiêu chí giám khảo chấm thi',
      'Huấn luyện Speaking 1:1 sửa ngữ điệu, độ trôi chảy và từ vựng band cao',
      'Làm chủ các chủ đề Speaking & Writing trừu tượng, tính học thuật cao',
      'Thành thạo kỹ năng Paraphrasing nâng cao và tư duy logic phản biện',
    ],
    syllabus: [
      'Tuần 1-2: Phân tích đề thi IELTS thực chiến & Chiến thuật tối ưu Band từng kỹ năng',
      'Tuần 3-5: Advanced Academic Writing Task 2 & Kỹ thuật nâng cấp Lexical Resource',
      'Tuần 6-8: Coaching Speaking 1:1 chuyên sâu các chủ đề xã hội, triết lý, công nghệ',
      'Tuần 9-10: Full Mock Test phòng thi máy & Đánh giá phân tích cá nhân hóa',
    ],
    milestones: [
      { milestoneId: 'MS-1', title: 'Phân tích tiêu chí chấm thi Band 7.5+', description: 'Nắm chắc barem Lexical Resource & Grammatical Range.', order: 1, type: 'LESSON_COMPLETION', targetSession: 6 },
      { milestoneId: 'MS-2', title: 'Writing Task 2 Band 7.5+ Master Essay', description: 'Hoàn thành 4 bài luận học thuật phản biện sắc sảo.', order: 2, type: 'ASSIGNMENT', targetSession: 14 },
      { milestoneId: 'MS-3', title: 'Đánh giá Giữa khóa cùng Giảng viên', description: 'Thi thử 4 kỹ năng và chấm điểm 1:1.', order: 3, type: 'MOCK_TEST', targetSession: 18 },
      { milestoneId: 'MS-4', title: 'Coaching Speaking 1:1 phản xạ đề khó', description: 'Luyện bộ Forecast đề thi mới nhất.', order: 4, type: 'SKILL_CHECK', targetSession: 24 },
      { milestoneId: 'MS-5', title: 'Tốt nghiệp khóa Chuyên Sâu (Target 7.5+)', description: 'Hoàn thành bài thi tốt nghiệp tổng lực.', order: 5, type: 'CHECKPOINT', targetSession: 30 },
    ],
  },
  {
    code: 'IELTS-MASTER',
    title: 'IELTS Master 8.0+',
    description: 'Luyện cùng cựu giám khảo chấm thi và chuyên gia IELTS 9.0. Khóa học đỉnh cao dành cho học viên săn học bổng toàn phần hoặc theo đuổi sự nghiệp giảng dạy tiếng Anh.',
    category: 'Lộ trình IELTS',
    entryLevel: '8.0+',
    targetLevel: '8.0+',
    sessions: 30,
    tuitionFee: 12500000,
    format: 'BLENDED',
    status: 'ACTIVE',
    featured: true,
    bannerUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=800&auto=format&fit=crop',
    learningObjectives: [
      'Chinh phục Band 8.0 - 8.5+ cùng cựu giám khảo chấm thi và giảng viên 9.0',
      'Nắm vững chiều sâu 4 tiêu chí chấm thi và tư duy ngữ nghĩa bản xứ (Native-like)',
      'Luyện kỹ năng lập luận sắc bén, luận điểm đa chiều cho bài viết học thuật',
      'Tự tin bước vào phòng thi chính thức tại IDP / British Council',
    ],
    syllabus: [
      'Tuần 1-3: Giải mã các bẫy tinh vi nhất trong Reading & Listening đề thi thật',
      'Tuần 4-6: Chuyên đề Writing Task 2 Band 8.0+: Nghệ thuật lập luận & Văn phong học thuật',
      'Tuần 7-8: Coaching 1:1 Speaking trực tiếp với cựu giám khảo IDP/BC',
      'Tuần 9-10: Thi thử 100% mô phỏng Computer-delivered IELTS & Tinh chỉnh trước ngày thi',
    ],
    milestones: [
      { milestoneId: 'MS-1', title: 'Giải mã tư duy giám khảo khảo thí', description: 'Tiếp cận sâu barem chấm thi của Cambridge/IDP.', order: 1, type: 'LESSON_COMPLETION', targetSession: 6 },
      { milestoneId: 'MS-2', title: 'Writing Task 2 Band 8.0+ Essays', description: 'Thực hành các chủ đề triết học, đạo đức xã hội.', order: 2, type: 'ASSIGNMENT', targetSession: 14 },
      { milestoneId: 'MS-3', title: 'Mock Interview trực tiếp với Giám khảo', description: 'Ghi âm và phân tích chi tiết từng phát ngôn.', order: 3, type: 'MOCK_TEST', targetSession: 20 },
      { milestoneId: 'MS-4', title: 'Thi thử toàn diện tại EduCenter Testing Lab', description: 'Mô phỏng chính xác áp lực thi máy.', order: 4, type: 'MOCK_TEST', targetSession: 26 },
      { milestoneId: 'MS-5', title: 'Chứng nhận hoàn thành IELTS Master 8.0+', description: 'Sẵn sàng thi thật với cam kết band điểm.', order: 5, type: 'CHECKPOINT', targetSession: 30 },
    ],
  },
];

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('LỖI: MONGODB_URI không được thiết lập trong backend/.env');
    process.exit(1);
  }

  console.log('🔄 Đang kết nối tới MongoDB Atlas...');
  await mongoose.connect(uri);
  console.log('✅ Đã kết nối thành công tới MongoDB Atlas.');

  for (const courseData of roadmapCourses) {
    const existing = await Course.findOne({ code: courseData.code });
    if (existing) {
      console.log(`📝 Cập nhật khóa học hiện có: ${courseData.code} - ${courseData.title}`);
      await Course.updateOne({ code: courseData.code }, { $set: courseData });
    } else {
      console.log(`✨ Thêm mới khóa học: ${courseData.code} - ${courseData.title}`);
      await Course.create(courseData);
    }
  }

  const allCourses = await Course.find({}).sort({ tuitionFee: 1 });
  console.log('\n========================================');
  console.log(`🎉 Tổng số khóa học hiện tại trong MongoDB Atlas: ${allCourses.length}`);
  allCourses.forEach((c) => {
    console.log(`- [${c.code}] ${c.title} | Level: ${c.entryLevel} -> ${c.targetLevel} | Học phí: ${c.tuitionFee.toLocaleString()}đ`);
  });
  console.log('========================================\n');

  await mongoose.disconnect();
  console.log('🔒 Đã đóng kết nối MongoDB Atlas.');
}

seed().catch((err) => {
  console.error('❌ Lỗi khi thêm dữ liệu khóa học:', err);
  process.exit(1);
});

