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
    bannerUrl: { type: String, default: '' },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const classSchema = new mongoose.Schema(
  {
    classCode: { type: String },
    name: { type: String },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  },
  { strict: false }
);

const Course = mongoose.models.Course || mongoose.model('Course', courseSchema);
const Class = mongoose.models.Class || mongoose.model('Class', classSchema);

const standardizedCourses = [
  {
    code: 'IELTS-BEGINNER',
    title: 'IELTS Beginner – Mất Gốc',
    description: 'Xây dựng nền tảng từ vựng, ngữ pháp, phát âm và kỹ năng tiếng Anh cơ bản.',
    category: 'Lộ trình IELTS',
    entryLevel: '0 - 3.5',
    targetLevel: '3.5',
    sessions: 24,
    tuitionFee: 4500000,
    format: 'BLENDED',
    status: 'ACTIVE',
    featured: false,
    bannerUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800&auto=format&fit=crop',
    learningObjectives: [
      'Chuẩn hóa phát âm 44 âm IPA theo chuẩn Anh - Mỹ quốc tế',
      'Nắm vững các chủ điểm ngữ pháp trọng yếu hay gặp nhất trong đề thi IELTS',
      'Tích lũy vốn từ vựng cơ bản theo các chủ đề đời sống thông dụng',
      'Tạo lập câu văn mạch lạc và tự tin giao tiếp phản xạ nền tảng',
    ],
    syllabus: [
      'Tuần 1-2: Ngữ âm nền tảng IPA & Kỹ thuật phát âm chuẩn xác',
      'Tuần 3-4: Ngữ pháp cốt lõi: Các thì cơ bản, Mệnh đề quan hệ, Thể bị động',
      'Tuần 5-6: Xây dựng vốn từ vựng theo chủ đề: Education, Work, Family, Daily Life',
      'Tuần 7-8: Làm quen với cấu trúc bài thi IELTS & Kiểm tra đánh giá đầu ra',
    ],
  },
  {
    code: 'IELTS-PRE',
    title: 'IELTS Pre',
    description: 'Làm quen cấu trúc đề thi IELTS và phát triển 4 kỹ năng Nghe, Nói, Đọc, Viết.',
    category: 'Lộ trình IELTS',
    entryLevel: '3.5 - 4.5',
    targetLevel: '4.5',
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
  },
  {
    code: 'IELTS-FOUNDATION',
    title: 'IELTS Foundation',
    description: 'Củng cố kỹ năng, mở rộng từ vựng và áp dụng chiến thuật làm bài cơ bản.',
    category: 'Lộ trình IELTS',
    entryLevel: '4.5 - 5.5',
    targetLevel: '5.5',
    sessions: 36,
    tuitionFee: 6800000,
    format: 'OFFLINE',
    status: 'ACTIVE',
    featured: true,
    bannerUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop',
    learningObjectives: [
      'Thành thạo chiến thuật làm bài Reading cho dạng câu hỏi Yes/No/Not Given',
      'Làm chủ kỹ năng Listening Section 3-4 thảo luận học thuật',
      'Phát triển ý tưởng Speaking Part 2 trôi chảy theo sơ đồ tư duy',
      'Nắm chắc cấu trúc đoạn văn chuẩn PEEL trong Academic Writing Task 2',
    ],
    syllabus: [
      'Tuần 1-3: Chiến lược định vị thông tin nhanh trong Reading học thuật',
      'Tuần 4-6: Tư duy phát triển luận điểm Writing Task 2 dạng Opinion & Discussion',
      'Tuần 7-9: Luyện Speaking Part 2 theo công thức 5W1H và từ vựng nâng cao Band 6.0+',
      'Tuần 10-12: Mock Test trên máy tính và tổng kết phương pháp làm bài',
    ],
  },
  {
    code: 'IELTS-BREAKTHROUGH',
    title: 'IELTS Breakthrough – Bứt Phá',
    description: 'Nâng cao khả năng xử lý đề, luyện đề chuyên sâu và cải thiện band điểm.',
    category: 'Lộ trình IELTS',
    entryLevel: '5.5 - 6.5',
    targetLevel: '6.5',
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
      'Sửa bài Writing & Speaking 1:1 hàng tuần trực tiếp với giáo viên 8.0+',
    ],
    syllabus: [
      'Tuần 1-3: Chiến thuật tối đa điểm Listening Section 4 & Reading chuyên ngành',
      'Tuần 4-6: Xử lý dạng bài Map / Process và biểu đồ phức hợp trong Writing Task 1',
      'Tuần 7-9: Luyện tư duy phản biện (Critical Thinking) cho Speaking Part 3 & Writing Task 2',
      'Tuần 10-12: Luyện giải bộ đề dự đoán Cambridge thực chiến & Cam kết chuẩn đầu ra',
    ],
  },
  {
    code: 'IELTS-ADVANCED',
    title: 'IELTS Advanced – Chuyên Sâu',
    description: 'Phát triển tư duy học thuật, nâng cao Writing và Speaking, luyện đề chuyên sâu.',
    category: 'Lộ trình IELTS',
    entryLevel: '6.5 - 7.5',
    targetLevel: '7.5',
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
  },
  {
    code: 'IELTS-MASTER',
    title: 'IELTS Master',
    description: 'Hoàn thiện năng lực ngôn ngữ, tối ưu chiến thuật và nâng cao độ chính xác theo tiêu chí chấm thi IELTS.',
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
  },
];

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('LỖI: MONGODB_URI không tồn tại');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('✅ Đã kết nối MongoDB Atlas.');

  // 1. Chuẩn hóa/Update/Insert 6 khóa học chuẩn
  const courseMap: Record<string, any> = {};

  for (const cData of standardizedCourses) {
    // If course with code IELTS-LOST exists, update it to IELTS-BEGINNER
    if (cData.code === 'IELTS-BEGINNER') {
      const lostCourse = await Course.findOne({ code: 'IELTS-LOST' });
      if (lostCourse) {
        await Course.updateOne({ _id: lostCourse._id }, { $set: cData });
        const updated = await Course.findById(lostCourse._id);
        courseMap[cData.code] = updated;
        console.log(`🔄 Đã đổi mã IELTS-LOST thành IELTS-BEGINNER: ${cData.title}`);
        continue;
      }
    }

    let doc = await Course.findOne({ code: cData.code });
    if (doc) {
      await Course.updateOne({ _id: doc._id }, { $set: cData });
      doc = await Course.findById(doc._id);
      console.log(`📝 Đã cập nhật khóa học: [${cData.code}] ${cData.title}`);
    } else {
      doc = await Course.create(cData);
      console.log(`✨ Đã tạo mới khóa học: [${cData.code}] ${cData.title}`);
    }
    courseMap[cData.code] = doc;
  }

  // 2. Tái liên kết các lớp học phụ thuộc vào khóa học thừa (TOEIC-550, SPEAKING-CONVO)
  const toeicCourse = await Course.findOne({ code: 'TOEIC-550' });
  const speakingCourse = await Course.findOne({ code: 'SPEAKING-CONVO' });

  if (toeicCourse && courseMap['IELTS-BREAKTHROUGH']) {
    const res = await Class.updateMany(
      { course: toeicCourse._id },
      { $set: { course: courseMap['IELTS-BREAKTHROUGH']._id, name: 'IELTS Breakthrough - Khóa K18' } }
    );
    console.log(`🔗 Đã chuyển ${res.modifiedCount} lớp từ TOEIC-550 sang IELTS-BREAKTHROUGH`);
  }

  if (speakingCourse && courseMap['IELTS-BEGINNER']) {
    const res = await Class.updateMany(
      { course: speakingCourse._id },
      { $set: { course: courseMap['IELTS-BEGINNER']._id, name: 'IELTS Beginner - Lớp cuối tuần' } }
    );
    console.log(`🔗 Đã chuyển ${res.modifiedCount} lớp từ SPEAKING-CONVO sang IELTS-BEGINNER`);
  }

  // 3. XÓA CÁC KHÓA HỌC THỪA (TOEIC-550, SPEAKING-CONVO và bất kỳ khóa nào ngoài 6 khóa chuẩn)
  const validCodes = standardizedCourses.map((c) => c.code);
  const deleteResult = await Course.deleteMany({ code: { $nin: validCodes } });
  console.log(`🗑️ Đã xóa ${deleteResult.deletedCount} khóa học thừa.`);

  // 4. In danh sách khóa học hiện tại
  const remaining = await Course.find({}).sort({ tuitionFee: 1 });
  console.log('\n======================================================');
  console.log(`🎉 DANH SÁCH 6 KHÓA HỌC DUY NHẤT TRONG DATABASE (${remaining.length} khóa):`);
  remaining.forEach((c, idx) => {
    console.log(`${idx + 1}. [${c.code}] ${c.title} (${c.entryLevel})`);
    console.log(`   Mô tả: ${c.description}`);
    console.log(`   Học phí: ${c.tuitionFee.toLocaleString()}đ | Số buổi: ${c.sessions}`);
  });
  console.log('======================================================\n');

  await mongoose.disconnect();
  console.log('🔒 Hoàn tất.');
}

run().catch(console.error);

