import mongoose, { Types } from 'mongoose';
import dotenv from 'dotenv';
import { config } from '../config';
import {
  Attendance,
  Class,
  ClassSchedule,
  Course,
  Enrollment,
  Grade,
  Payment,
  Student,
  User,
} from '../models';
import {
  buildScheduleCandidates,
  generateSessionDates,
  parseTimeSlot,
} from '../utils/classSchedule.utils';

dotenv.config();

const STUDENT_NAMES: Array<{ fullName: string; goal: string; currentBand: number; targetBand: number }> = [
  { fullName: 'Nguyễn Minh Quân', goal: 'Xét tuyển thẳng Đại học Ngoại thương', currentBand: 5.0, targetBand: 7.0 },
  { fullName: 'Trần Thảo Vy', goal: 'Du học Thạc sĩ tại Úc', currentBand: 5.5, targetBand: 7.5 },
  { fullName: 'Lê Hoàng Long', goal: 'Đạt chuẩn đầu ra tiếng Anh Bách Khoa', currentBand: 4.5, targetBand: 6.0 },
  { fullName: 'Phạm Khánh Ngọc', goal: 'Săn học bổng đại học Anh Quốc', currentBand: 6.0, targetBand: 7.5 },
  { fullName: 'Vũ Đình Khôi', goal: 'Cải thiện giao tiếp & làm việc đa quốc gia', currentBand: 4.5, targetBand: 6.5 },
  { fullName: 'Đỗ Phương Anh', goal: 'Xét tuyển Đại học Kinh tế Quốc dân', currentBand: 5.0, targetBand: 6.5 },
  { fullName: 'Hoàng Gia Bảo', goal: 'Du học Canada ngành Công nghệ thông tin', currentBand: 5.5, targetBand: 7.0 },
  { fullName: 'Bùi Thanh Trúc', goal: 'Hoàn thành mục tiêu IELTS 7.0 trước tháng 6', currentBand: 5.5, targetBand: 7.0 },
  { fullName: 'Đặng Quang Huy', goal: 'Nâng band Writing & Speaking', currentBand: 5.0, targetBand: 6.5 },
  { fullName: 'Ngô Bảo Hân', goal: 'Chuẩn bị hồ sơ du học Singapore', currentBand: 6.0, targetBand: 7.5 },
  { fullName: 'Phan Tiến Đạt', goal: 'Đạt TOEIC 650+ phục vụ tốt nghiệp', currentBand: 4.5, targetBand: 6.0 },
  { fullName: 'Dương Mỹ Linh', goal: 'Thi chứng chỉ IELTS trong năm 2027', currentBand: 5.0, targetBand: 6.5 },
  { fullName: 'Tạ Hải Đăng', goal: 'Phát triển phản xạ giao tiếp tiếng Anh', currentBand: 4.0, targetBand: 6.0 },
  { fullName: 'Lý Ngọc Diệp', goal: 'Xét tuyển Đại học Y Hà Nội', currentBand: 5.5, targetBand: 7.0 },
  { fullName: 'Trịnh Công Sơn', goal: 'Định cư và làm việc tại New Zealand', currentBand: 5.0, targetBand: 6.5 },
  { fullName: 'Mai Tuyết Nhi', goal: 'Luyện thi IELTS 7.5+ học thuật', currentBand: 6.0, targetBand: 7.5 },
  { fullName: 'Cao Đức Mạnh', goal: 'Cải thiện kỹ năng nghe đọc TOEIC', currentBand: 4.5, targetBand: 6.0 },
  { fullName: 'Chu Hồng Nhung', goal: 'Giao tiếp tự tin với đối tác nước ngoài', currentBand: 4.5, targetBand: 6.5 },
  { fullName: 'Hà Quốc Trung', goal: 'Thi IELTS General cho diện tay nghề', currentBand: 5.0, targetBand: 6.5 },
  { fullName: 'Tô Minh Thư', goal: 'Du học ngành Truyền thông tại Hà Lan', currentBand: 5.5, targetBand: 7.0 },
  { fullName: 'Đinh Tuấn Tú', goal: 'Đạt chuẩn đầu ra tiếng Anh năm 3', currentBand: 4.5, targetBand: 6.0 },
  { fullName: 'Lương Gia Linh', goal: 'Chinh phục IELTS 7.0 từ mất gốc', currentBand: 4.0, targetBand: 7.0 },
  { fullName: 'Vương Thành Nam', goal: 'Thăng tiến công việc ngành Tài chính', currentBand: 5.0, targetBand: 6.5 },
  { fullName: 'Nghiêm Kiều Trang', goal: 'Chuẩn bị phỏng vấn học bổng Erasmus', currentBand: 6.0, targetBand: 7.5 },
  { fullName: 'Kiều Anh Tuấn', goal: 'Luyện đề cấp tốc 4 kỹ năng', currentBand: 5.5, targetBand: 7.0 },
  { fullName: 'Thái Bảo Ngọc', goal: 'Phát âm chuẩn và nói trôi chảy', currentBand: 4.5, targetBand: 6.5 },
  { fullName: 'La Minh Đức', goal: 'Đạt 6.5 IELTS xét tuyển Đại học Quốc gia', currentBand: 5.0, targetBand: 6.5 },
  { fullName: 'Doãn Thu Uyên', goal: 'Du học ngành Quản trị khách sạn Thụy Sĩ', currentBand: 5.5, targetBand: 7.0 },
  { fullName: 'Khổng Trọng Nghĩa', goal: 'Tăng tốc từ Band 5.0 lên 6.5', currentBand: 5.0, targetBand: 6.5 },
  { fullName: 'Mạc Kim Ngân', goal: 'Cải thiện ngữ pháp và viết luận học thuật', currentBand: 5.0, targetBand: 6.5 },
  { fullName: 'Từ Nhật Hào', goal: 'Thi chứng chỉ TOEIC 700+', currentBand: 5.0, targetBand: 6.5 },
  { fullName: 'Quách Thanh Vân', goal: 'Luyện Speaking tự nhiên cùng giảng viên', currentBand: 5.0, targetBand: 6.5 },
  { fullName: 'Bạch Xuân Trường', goal: 'Đáp ứng yêu cầu tiếng Anh tại công ty IT', currentBand: 4.5, targetBand: 6.0 },
  { fullName: 'Lưu Tường Vi', goal: 'Du học Thạc sĩ ngành Giáo dục', currentBand: 6.0, targetBand: 7.5 },
  { fullName: 'Âu Dương Phong', goal: 'Hoàn thành lộ trình IELTS Foundation', currentBand: 4.5, targetBand: 6.0 },
  { fullName: 'Phùng Gia Kiệt', goal: 'Cải thiện toàn diện 4 kỹ năng', currentBand: 5.0, targetBand: 6.5 },
  { fullName: 'Hồ Bảo Trâm', goal: 'Đạt IELTS 7.0 xét tuyển học bổng', currentBand: 5.5, targetBand: 7.0 },
  { fullName: 'Tăng Chí Vĩ', goal: 'Thi TOEIC phục vụ tuyển dụng ngân hàng', currentBand: 4.5, targetBand: 6.0 },
  { fullName: 'Diệp Thảo Nguyên', goal: 'Giao tiếp tiếng Anh thương mại', currentBand: 5.0, targetBand: 6.5 },
  { fullName: 'Lâm Phúc Thịnh', goal: 'Nâng cao điểm Reading & Listening', currentBand: 5.5, targetBand: 7.0 },
  { fullName: 'Sơn Yến Nhi', goal: 'Chinh phục Band 7.5 trong 4 tháng', currentBand: 6.0, targetBand: 7.5 },
  { fullName: 'Triệu Văn Khải', goal: 'Bổ sung nền tảng tiếng Anh từ đầu', currentBand: 4.0, targetBand: 5.5 },
  { fullName: 'Nông Minh Hiếu', goal: 'Chuẩn bị thi cuối kỳ IELTS', currentBand: 5.5, targetBand: 7.0 },
  { fullName: 'Lục Ánh Dương', goal: 'Rèn luyện phản xạ giao tiếp hàng ngày', currentBand: 4.5, targetBand: 6.0 },
  { fullName: 'Thạch Quang Vinh', goal: 'Thi IELTS du học Nhật Bản chương trình tiếng Anh', currentBand: 5.5, targetBand: 7.0 },
  { fullName: 'Lê Minh Khôi', goal: 'Chinh phục IELTS 7.0+ xét tuyển Đại học', currentBand: 5.5, targetBand: 7.0 },
];

const SAMPLE_TOPICS = [
  'Listening & Reading Strategies - Xác định từ khóa & Paraphrasing',
  'Grammar Focus - Mệnh đề quan hệ & Câu điều kiện nâng cao',
  'Writing Task 1 - Phân tích xu hướng & Số liệu so sánh',
  'Speaking Part 1 & 2 - Mở rộng câu trả lời tự nhiên (Fluency)',
  'Writing Task 2 - Lập dàn ý Opinion & Discussion Essay',
  'Mock Practice & Chữa lỗi phát âm 1:1',
];

const toIsoDate = (d: Date): string => d.toISOString().slice(0, 10);

async function ensureStudentPool(): Promise<Types.ObjectId[]> {
  const studentIds: Types.ObjectId[] = [];

  for (let i = 0; i < STUDENT_NAMES.length; i += 1) {
    const idx = i + 1;
    const email = `hv.k26.${String(idx).padStart(2, '0')}@educenter.edu.vn`;
    const meta = STUDENT_NAMES[i];
    const studentCode = `STU26${String(idx).padStart(3, '0')}`;

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        email,
        password: 'Student123!',
        fullName: meta.fullName,
        phone: `0912${String(100000 + idx * 137).slice(0, 6)}`,
        address: 'Hà Nội',
        role: 'STUDENT',
        status: 'ACTIVE',
        isVerified: true,
      });
    } else if (!user.isVerified || user.status !== 'ACTIVE') {
      user.isVerified = true;
      user.status = 'ACTIVE';
      await user.save();
    }

    const existingProfile = await Student.findOne({ user: user._id });
    if (!existingProfile) {
      await Student.create({
        user: user._id,
        studentCode,
        currentBand: meta.currentBand,
        targetBand: meta.targetBand,
        learningGoal: meta.goal,
        emergencyContact: {
          name: `Phụ huynh em ${meta.fullName.split(' ').pop()}`,
          relationship: 'Bố/Mẹ',
          phone: `0988${String(200000 + idx * 211).slice(0, 6)}`,
        },
        status: 'ACTIVE',
      });
    }

    studentIds.push(user._id);
  }

  return studentIds;
}

async function ensureSchedulesForClass(cls: any, sessionsCount: number) {
  const existingCount = await ClassSchedule.countDocuments({ class: cls._id });
  if (existingCount > 0) return;

  const startDate = new Date(cls.startDate || '2026-10-20T00:00:00.000Z');
  const scheduleDays =
    Array.isArray(cls.scheduleDays) && cls.scheduleDays.length > 0
      ? cls.scheduleDays
      : ['Thứ 2', 'Thứ 4', 'Thứ 6'];
  const { startTime, endTime } = parseTimeSlot(cls.timeSlot || '18:30 - 20:30');
  const dates = generateSessionDates(startDate, scheduleDays, sessionsCount);
  const candidates = buildScheduleCandidates(dates, startTime, endTime, cls.room || 'Phòng 201');

  await ClassSchedule.insertMany(
    candidates.map((cand, idx) => ({
      class: cls._id,
      ...cand,
      topic: SAMPLE_TOPICS[idx % SAMPLE_TOPICS.length],
      status: 'ACTIVE',
    }))
  );

  cls.endDate = dates[dates.length - 1];
  await cls.save();
}

async function main() {
  await mongoose.connect(config.mongodbUri);
  console.log('✅ Đã kết nối MongoDB Atlas thành công.');

  // 1. Lấy danh sách giáo viên & khóa học hiện có
  const [teacherNam, teacherEmily, anyTeacher] = await Promise.all([
    User.findOne({ email: 'teacher.nam@educenter.edu.vn', role: 'TEACHER' }),
    User.findOne({ email: 'teacher.emily@educenter.edu.vn', role: 'TEACHER' }),
    User.findOne({ role: 'TEACHER' }),
  ]);

  const primaryTeacher = teacherNam || anyTeacher;
  const secondaryTeacher = teacherEmily || primaryTeacher;

  if (!primaryTeacher || !secondaryTeacher) {
    throw new Error('Không tìm thấy tài khoản TEACHER trong database.');
  }

  const courses = await Course.find().lean();
  const courseByCode = new Map(courses.map((c: any) => [c.code, c]));

  const courseIeltsFound = courseByCode.get('IELTS-FOUNDATION') || courses[0];
  const courseIeltsAdv = courseByCode.get('IELTS-ADVANCED') || courses[0];
  const courseToeic = courseByCode.get('TOEIC-550') || courses[0];
  const courseSpeaking = courseByCode.get('SPEAKING-CONVO') || courses[0];

  // 2. Đảm bảo đủ 5 lớp học chuẩn
  const targetClassesSpec = [
    {
      classCode: 'IELTS-K26-A',
      name: 'IELTS Foundation - Lớp tối T2/4/6',
      course: courseIeltsFound._id,
      sessions: courseIeltsFound.sessions || 36,
      tuitionFee: courseIeltsFound.tuitionFee || 6500000,
      teacher: primaryTeacher._id,
      room: 'Phòng 201',
      scheduleDays: ['Thứ 2', 'Thứ 4', 'Thứ 6'],
      timeSlot: '18:30 - 20:30',
      startDate: new Date('2026-10-15T00:00:00.000Z'),
      capacity: 30,
      status: 'IN_PROGRESS' as const,
    },
    {
      classCode: 'IELTS-K26-B',
      name: 'IELTS Intensive - Lớp tối T3/5/7',
      course: courseIeltsFound._id,
      sessions: courseIeltsFound.sessions || 36,
      tuitionFee: courseIeltsFound.tuitionFee || 6500000,
      teacher: primaryTeacher._id,
      room: 'Phòng 202',
      scheduleDays: ['Thứ 3', 'Thứ 5', 'Thứ 7'],
      timeSlot: '19:00 - 21:00',
      startDate: new Date('2026-10-20T00:00:00.000Z'),
      capacity: 25,
      status: 'IN_PROGRESS' as const,
    },
    {
      classCode: 'SPEAKING-K15',
      name: 'Speaking Communication - Lớp cuối tuần',
      course: courseSpeaking._id,
      sessions: courseSpeaking.sessions || 18,
      tuitionFee: courseSpeaking.tuitionFee || 4500000,
      teacher: secondaryTeacher._id,
      room: 'Phòng 301',
      scheduleDays: ['Thứ 7', 'Chủ Nhật'],
      timeSlot: '09:00 - 11:30',
      startDate: new Date('2026-10-18T00:00:00.000Z'),
      capacity: 20,
      status: 'OPEN' as const,
    },
    {
      classCode: 'TOEIC-K18-A',
      name: 'TOEIC Mục tiêu 550+ - Khóa K18',
      course: courseToeic._id,
      sessions: courseToeic.sessions || 24,
      tuitionFee: courseToeic.tuitionFee || 5500000,
      teacher: secondaryTeacher._id,
      room: 'Phòng 203',
      scheduleDays: ['Thứ 2', 'Thứ 4', 'Thứ 6'],
      timeSlot: '18:30 - 20:30',
      startDate: new Date('2026-11-02T00:00:00.000Z'),
      capacity: 25,
      status: 'IN_PROGRESS' as const,
    },
    {
      classCode: 'IELTS-K27-C',
      name: 'IELTS Advanced 6.5+ - Lớp chiều T2/4/6',
      course: courseIeltsAdv._id,
      sessions: courseIeltsAdv.sessions || 30,
      tuitionFee: courseIeltsAdv.tuitionFee || 8500000,
      teacher: primaryTeacher._id,
      room: 'Phòng 204',
      scheduleDays: ['Thứ 2', 'Thứ 4', 'Thứ 6'],
      timeSlot: '14:00 - 16:00',
      startDate: new Date('2026-11-02T00:00:00.000Z'),
      capacity: 20,
      status: 'OPEN' as const,
    },
  ];

  const classDocs: Array<{ doc: any; sessions: number; tuitionFee: number }> = [];

  for (const spec of targetClassesSpec) {
    let cls = await Class.findOne({ classCode: spec.classCode });
    if (!cls) {
      const dates = generateSessionDates(spec.startDate, spec.scheduleDays, spec.sessions);
      cls = await Class.create({
        classCode: spec.classCode,
        name: spec.name,
        course: spec.course,
        teacher: spec.teacher,
        room: spec.room,
        scheduleDays: spec.scheduleDays,
        timeSlot: spec.timeSlot,
        startDate: spec.startDate,
        endDate: dates[dates.length - 1],
        capacity: spec.capacity,
        currentEnrollment: 0,
        status: spec.status,
      });
      console.log(`➕ Tạo lớp mới: ${spec.classCode}`);
    } else {
      if (!cls.name || !cls.name.trim()) cls.name = spec.name;
      if (cls.status === 'OPEN' && spec.status === 'IN_PROGRESS') cls.status = 'IN_PROGRESS';
      await cls.save();
    }

    await ensureSchedulesForClass(cls, spec.sessions);
    classDocs.push({ doc: cls, sessions: spec.sessions, tuitionFee: spec.tuitionFee });
  }

  // 3. Tạo pool 45 học sinh & ghi danh sao cho mỗi lớp có ĐÚNG 10 học sinh ENROLLED
  const studentPool = await ensureStudentPool();
  console.log(`👩‍🎓 Đã sẵn sàng ${studentPool.length} tài khoản học viên mẫu.`);

  let poolCursor = 0;
  let totalNewEnrollments = 0;
  let totalNewPayments = 0;
  let totalNewAttendances = 0;
  let totalNewGrades = 0;

  for (let classIdx = 0; classIdx < classDocs.length; classIdx += 1) {
    const { doc: cls, tuitionFee } = classDocs[classIdx];

    const existingEnrollments = await Enrollment.find({
      class: cls._id,
      status: 'ENROLLED',
    });
    const enrolledStudentIds = new Set(existingEnrollments.map((e) => e.student.toString()));

    // Bổ sung cho đủ 10 học viên / lớp
    let paidIndex = 0;
    while (enrolledStudentIds.size < 10 && poolCursor < studentPool.length) {
      const candidateId = studentPool[poolCursor];
      poolCursor += 1;

      if (enrolledStudentIds.has(candidateId.toString())) continue;

      const existingSame = await Enrollment.findOne({ student: candidateId, class: cls._id });
      if (existingSame) {
        if (existingSame.status === 'DROPPED') {
          existingSame.status = 'ENROLLED';
          await existingSame.save();
          enrolledStudentIds.add(candidateId.toString());
        }
        continue;
      }

      const tuitionStatus = paidIndex < 7 ? 'PAID' : 'PENDING';
      paidIndex += 1;

      const enr = await Enrollment.create({
        student: candidateId,
        class: cls._id,
        course: cls.course,
        status: 'ENROLLED',
        tuitionStatus,
        registrationDate: new Date('2026-10-25T00:00:00.000Z'),
        enrollmentDate: new Date('2026-10-28T00:00:00.000Z'),
      });
      totalNewEnrollments += 1;
      enrolledStudentIds.add(candidateId.toString());

      if (tuitionStatus === 'PAID') {
        const txCode = `VNP-${cls.classCode.replace(/[^A-Z0-9]/g, '')}-${candidateId.toString().slice(-5).toUpperCase()}`;
        const existingPay = await Payment.exists({ transactionCode: txCode });
        if (!existingPay) {
          await Payment.create({
            student: candidateId,
            enrollment: enr._id,
            course: cls.course,
            amount: tuitionFee,
            method: paidIndex % 2 === 0 ? 'VNPAY' : 'BANK_TRANSFER',
            transactionCode: txCode,
            status: 'SUCCESS',
            paymentDate: new Date('2026-10-29T09:30:00.000Z'),
            note: `Thanh toán học phí lớp ${cls.classCode}`,
          });
          totalNewPayments += 1;
        }
      }
    }

    // Đồng bộ lại sĩ số lớp
    const finalEnrolledList = await Enrollment.find({ class: cls._id, status: 'ENROLLED' }).lean();
    await Class.updateOne({ _id: cls._id }, { $set: { currentEnrollment: finalEnrolledList.length } });

    // 4. Tạo dữ liệu điểm danh 2 buổi học gần nhất (trước hoặc bằng 2026-11-12) cho cả 10 học sinh
    const pastSchedules = await ClassSchedule.find({
      class: cls._id,
      status: 'ACTIVE',
      sessionDate: { $lte: new Date('2026-11-12T23:59:59.999Z') },
    })
      .sort({ sessionDate: -1 })
      .limit(2)
      .lean();

    for (let sIdx = 0; sIdx < pastSchedules.length; sIdx += 1) {
      const sched = pastSchedules[sIdx];
      const sessionDate = new Date(sched.sessionDate!);
      const isoDay = toIsoDate(sessionDate);
      const startBound = new Date(`${isoDay}T00:00:00.000Z`);
      const endBound = new Date(`${isoDay}T23:59:59.999Z`);

      for (let stIdx = 0; stIdx < finalEnrolledList.length; stIdx += 1) {
        const enr = finalEnrolledList[stIdx];
        const existsAtt = await Attendance.exists({
          class: cls._id,
          student: enr.student,
          sessionDate: { $gte: startBound, $lte: endBound },
        });
        if (existsAtt) continue;

        let status: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED' = 'PRESENT';
        let notes = '';
        if (stIdx === 7 && sIdx === 0) {
          status = 'LATE';
          notes = 'Đến muộn 10 phút do kẹt xe';
        } else if (stIdx === 8 && sIdx === 1) {
          status = 'EXCUSED';
          notes = 'Xin nghỉ phép có báo trước';
        } else if (stIdx === 9 && sIdx === 0) {
          status = 'ABSENT';
          notes = 'Vắng không phép';
        } else if (stIdx % 3 === 0) {
          notes = 'Tích cực phát biểu trên lớp';
        }

        await Attendance.create({
          class: cls._id,
          classSchedule: sched._id,
          student: enr.student,
          sessionDate: startBound,
          status,
          notes,
          recordedBy: cls.teacher,
        });
        totalNewAttendances += 1;
      }
    }

    // 5. Tạo điểm kiểm tra định kỳ (Đầu vào, Giữa kỳ) & Nhận xét tháng 11/2026 cho học sinh trong lớp
    for (let stIdx = 0; stIdx < finalEnrolledList.length; stIdx += 1) {
      const stId = finalEnrolledList[stIdx].student;

      // 5a. Điểm kiểm tra đầu vào cho 5 học viên đầu mỗi lớp
      if (stIdx < 5) {
        const entryTitle = `Kiểm tra đầu vào lớp ${cls.classCode}`;
        const hasEntry = await Grade.exists({
          student: stId,
          class: cls._id,
          evaluationType: 'ENTRY_TEST',
          title: entryTitle,
        });
        if (!hasEntry) {
          const base = 4.5 + (stIdx % 4) * 0.5;
          await Grade.create({
            student: stId,
            class: cls._id,
            teacher: cls.teacher,
            evaluationType: 'ENTRY_TEST',
            title: entryTitle,
            testDate: new Date('2026-10-28T00:00:00.000Z'),
            overallBand: base,
            listening: base + 0.5,
            reading: base,
            writing: Math.max(4.0, base - 0.5),
            speaking: base,
            feedback: 'Đánh giá trình độ đầu vào trước khi xếp nhóm luyện tập.',
            status: 'PUBLISHED',
          });
          totalNewGrades += 1;
        }
      }

      // 5b. Điểm kiểm tra giữa kỳ cho 4 học viên đầu mỗi lớp
      if (stIdx < 4) {
        const midTitle = `Kiểm tra giữa kỳ ${cls.classCode}`;
        const hasMid = await Grade.exists({
          student: stId,
          class: cls._id,
          evaluationType: 'MID_TERM',
          title: midTitle,
        });
        if (!hasMid) {
          const base = 5.5 + (stIdx % 3) * 0.5;
          await Grade.create({
            student: stId,
            class: cls._id,
            teacher: cls.teacher,
            evaluationType: 'MID_TERM',
            title: midTitle,
            rating: base >= 6.5 ? 'EXCELLENT' : 'GOOD',
            testDate: new Date('2026-11-08T00:00:00.000Z'),
            overallBand: base,
            listening: base + 0.5,
            reading: base,
            writing: base - 0.5,
            speaking: base,
            feedback: 'Có tiến bộ rõ rệt ở kỹ năng Nghe và Đọc; cần chú ý cấu trúc câu Writing.',
            status: 'PUBLISHED',
          });
          totalNewGrades += 1;
        }
      }

      // 5c. Nhận xét chung tháng 11/2026 cho 4 học viên tiếp theo (stIdx 3..6)
      if (stIdx >= 3 && stIdx <= 6) {
        const evalTitle = `Nhận xét học tập Tháng 11/2026 (${cls.classCode})`;
        const hasEval = await Grade.exists({
          student: stId,
          class: cls._id,
          evaluationType: 'MONTHLY_EVALUATION',
          title: evalTitle,
        });
        if (!hasEval) {
          const ratings = ['EXCELLENT', 'GOOD', 'GOOD', 'SATISFACTORY'] as const;
          const feedbacks = [
            'Tham gia đầy đủ các buổi học, phản xạ nói tự tin và hoàn thành tốt nội dung trên lớp.',
            'Tiếp thu bài nhanh, ghi chép cẩn thận; nên luyện nghe thêm 20 phút mỗi ngày.',
            'Thái độ học tập nghiêm túc, tiến bộ đều ở phần từ vựng học thuật.',
            'Cần đi học đúng giờ hơn và chủ động tương tác trong phần thảo luận nhóm.',
          ];
          await Grade.create({
            student: stId,
            class: cls._id,
            teacher: cls.teacher,
            evaluationType: 'MONTHLY_EVALUATION',
            title: evalTitle,
            period: 'Tháng 11/2026',
            rating: ratings[stIdx - 3],
            testDate: new Date('2026-11-11T00:00:00.000Z'),
            feedback: feedbacks[stIdx - 3],
            status: 'PUBLISHED',
          });
          totalNewGrades += 1;
        }
      }
    }

    console.log(
      `🏫 Lớp ${cls.classCode}: ${finalEnrolledList.length} học viên đang học (${pastSchedules.length} buổi điểm danh).`
    );
  }

  console.log('\n🎉 HOÀN TẤT BỔ SUNG DỮ LIỆU TRỰC TIẾP VÀO MONGODB ATLAS!');
  console.log(`- Ghi danh mới: +${totalNewEnrollments}`);
  console.log(`- Giao dịch học phí mới: +${totalNewPayments}`);
  console.log(`- Bản ghi điểm danh mới: +${totalNewAttendances}`);
  console.log(`- Điểm định kỳ & nhận xét mới: +${totalNewGrades}`);
  console.log('- Mật khẩu chung cho các học viên mới (hv.k26.01..45@educenter.edu.vn): Student123!');

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('❌ Lỗi khi seed dữ liệu:', err);
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  process.exit(1);
});

