import mongoose from 'mongoose';
import dotenv from 'dotenv';
import {
  User,
  Class,
  Assignment,
  Submission,
  Attendance,
  ChangeRequest,
  Grade,
  Enrollment,
} from '../models';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI không tồn tại');
  process.exit(1);
}

const seedTeacherData = async () => {
  try {
    console.log('⏳ Kết nối MongoDB...');
    await mongoose.connect(MONGODB_URI);

    const teacher = await User.findOne({ role: 'TEACHER', email: 'teacher.an@educenter.edu.vn' });
    if (!teacher) {
      console.log('❌ Không tìm thấy teacher.an@educenter.edu.vn');
      process.exit(1);
    }

    const classItem = await Class.findOne({ classCode: 'IELTS-INT-K26A' });
    if (!classItem) {
      console.log('❌ Không tìm thấy lớp IELTS-INT-K26A');
      process.exit(1);
    }

    const students = await User.find({ role: 'STUDENT' });
    const studentDang = students.find((s) => s.email === 'student.dang@gmail.com') || students[0];
    const studentMai = students.find((s) => s.email === 'student.mai@gmail.com') || students[1];
    const studentKiet = students.find((s) => s.email === 'student.kiet@gmail.com') || students[2];

    // Ensure student enrollments in classItem
    for (const stu of [studentDang, studentMai, studentKiet]) {
      if (stu) {
        await Enrollment.findOneAndUpdate(
          { student: stu._id, class: classItem._id },
          { student: stu._id, class: classItem._id, status: 'ENROLLED', tuitionStatus: 'PAID' },
          { upsert: true }
        );
      }
    }

    // 1. Tạo Assignments
    console.log('📝 Seed Assignments...');
    await Assignment.deleteMany({ class: classItem._id });
    const a1 = await Assignment.create({
      class: classItem._id,
      teacher: teacher._id,
      title: 'Writing Task 2: Technology in Education',
      description: 'Some people believe that technology has improved education, while others argue it is a distraction. Discuss both views and give your opinion. (Minimum 250 words, PEEL paragraph structure).',
      skill: 'Writing Task 2',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      maxScore: 9.0,
      status: 'PUBLISHED',
    });

    const a2 = await Assignment.create({
      class: classItem._id,
      teacher: teacher._id,
      title: 'Writing Task 1: Renewable Energy Consumption Chart',
      description: 'The chart below shows global renewable energy trends from 2010 to 2025. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
      skill: 'Writing Task 1',
      dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      maxScore: 9.0,
      status: 'PUBLISHED',
    });

    const a3 = await Assignment.create({
      class: classItem._id,
      teacher: teacher._id,
      title: 'Speaking Mock: Part 2 & 3 - Memorable Journeys',
      description: 'Describe an unforgettable trip you took. Record audio (2 minutes) and send transcript for pronunciation & fluency review.',
      skill: 'Speaking Mock',
      dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      maxScore: 9.0,
      status: 'PUBLISHED',
    });

    // 2. Tạo Submissions
    console.log('📬 Seed Submissions...');
    await Submission.deleteMany({ assignment: { $in: [a1._id, a2._id, a3._id] } });

    if (studentDang) {
      await Submission.create({
        assignment: a1._id,
        student: studentDang._id,
        content: `It is widely believed that technology has fundamentally transformed the modern learning paradigm. While detractors argue that digital devices induce distractions, I firmly contend that technology fosters self-directed learning and global access to academic materials.\n\nOn the one hand, unregulated smartphone usage in classrooms can deteriorate attention spans. Students frequently succumb to social media notifications during instructional hours...\n\nIn conclusion, despite minor drawbacks regarding classroom discipline, technological integration remains an indispensable catalyst for academic excellence.`,
        status: 'PENDING',
        submissionTime: new Date(Date.now() - 4 * 60 * 60 * 1000),
      });
    }

    if (studentMai) {
      await Submission.create({
        assignment: a1._id,
        student: studentMai._id,
        content: `In this day and age, pedagogical approaches are undergoing radical transformations owing to cutting-edge technological innovations. This essay scrutinizes both perspectives before presenting my personal stance.\n\nUndeniably, digital educational platforms empower pupils with personalized learning trajectories...`,
        grade: 7.5,
        criteria: {
          taskAchievement: 7.5,
          coherenceCohesion: 8.0,
          lexicalResource: 7.5,
          grammaticalAccuracy: 7.0,
        },
        feedback: 'Bài viết lập luận rất sắc sảo, cấu trúc liên kết đoạn (Cohesive devices) tự nhiên. Chú ý đa dạng hóa hơn nữa các cấu trúc đảo ngữ (Inversion) để đạt mốc 8.0 Grammar.',
        status: 'GRADED',
        gradedBy: teacher._id,
        submissionTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
      });
    }

    if (studentKiet) {
      await Submission.create({
        assignment: a2._id,
        student: studentKiet._id,
        content: `The given bar chart illustrates the comparative statistics regarding renewable energy consumption across four continents between 2010 and 2025. Overall, there was a steady upward trajectory in all regions...`,
        status: 'PENDING',
        submissionTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
      });
    }

    // 3. Tạo Grades (Academic Results)
    console.log('🏆 Seed Student Grades...');
    await Grade.deleteMany({ class: classItem._id });
    if (studentDang) {
      await Grade.create({
        student: studentDang._id,
        class: classItem._id,
        teacher: teacher._id,
        evaluationType: 'MOCK_TEST',
        title: 'IELTS Mock Test Số 1 (Computer-delivered)',
        testDate: new Date('2026-10-05'),
        overallBand: 7.0,
        listening: 7.5,
        reading: 7.0,
        writing: 6.5,
        speaking: 7.0,
        feedback: 'Tiến bộ vượt bậc ở kỹ năng Listening. Kỹ năng Writing Task 2 cần trau chuốt thêm phần mở rộng luận điểm.',
      });
    }

    if (studentMai) {
      await Grade.create({
        student: studentMai._id,
        class: classItem._id,
        teacher: teacher._id,
        evaluationType: 'MOCK_TEST',
        title: 'IELTS Mock Test Số 1 (Computer-delivered)',
        testDate: new Date('2026-10-05'),
        overallBand: 7.5,
        listening: 8.0,
        reading: 7.5,
        writing: 7.0,
        speaking: 7.5,
        feedback: 'Phong độ ổn định, phản xạ Speaking tự nhiên. Sẵn sàng cho kỳ thi chính thức quý 4.',
      });
    }

    if (studentKiet) {
      await Grade.create({
        student: studentKiet._id,
        class: classItem._id,
        teacher: teacher._id,
        evaluationType: 'MID_TERM',
        title: 'Kiểm Tra Giữa Khóa Foundation',
        testDate: new Date('2026-10-08'),
        overallBand: 6.5,
        listening: 6.5,
        reading: 6.5,
        writing: 6.0,
        speaking: 6.5,
        feedback: 'Có nhiều nỗ lực, cần cải thiện tốc độ đọc hiểu các bài báo học thuật dài.',
      });
    }

    // 4. Tạo Attendance logs
    console.log('📋 Seed Attendance...');
    const today = new Date('2026-10-13');
    if (studentDang) {
      await Attendance.findOneAndUpdate(
        { class: classItem._id, student: studentDang._id, sessionDate: today },
        { class: classItem._id, student: studentDang._id, sessionDate: today, status: 'PRESENT', notes: 'Phát biểu tốt', recordedBy: teacher._id },
        { upsert: true }
      );
    }
    if (studentMai) {
      await Attendance.findOneAndUpdate(
        { class: classItem._id, student: studentMai._id, sessionDate: today },
        { class: classItem._id, student: studentMai._id, sessionDate: today, status: 'PRESENT', notes: 'Đầy đủ bài tập', recordedBy: teacher._id },
        { upsert: true }
      );
    }
    if (studentKiet) {
      await Attendance.findOneAndUpdate(
        { class: classItem._id, student: studentKiet._id, sessionDate: today },
        { class: classItem._id, student: studentKiet._id, sessionDate: today, status: 'LATE', notes: 'Đến muộn 15 phút do kẹt xe', recordedBy: teacher._id },
        { upsert: true }
      );
    }

    // 5. Tạo Change Request
    console.log('🔄 Seed Schedule Change Request...');
    await ChangeRequest.deleteMany({ teacher: teacher._id });
    await ChangeRequest.create({
      teacher: teacher._id,
      requesterRole: 'TEACHER',
      requestType: 'TEACHER_SCHEDULE_CHANGE',
      currentClass: classItem._id,
      currentSchedule: 'Thứ 2 (18:30 - 20:30)',
      targetSchedule: 'Thứ 4 (18:30 - 20:30)',
      sessionDate: new Date('2026-10-21'),
      targetDate: new Date('2026-10-23'),
      reason: 'Tham dự hội thảo tập huấn chuyên môn cùng Hội đồng Khảo thí Cambridge',
      status: 'PENDING',
    });

    console.log('✅ Đã nạp thành công dữ liệu mẫu cho Giảng viên!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
};

seedTeacherData();
