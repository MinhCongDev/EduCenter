import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middlewares/auth.middleware';
import { createError } from '../middlewares/error.middleware';
import { Class } from '../models/class.model';
import { Course, ICourseMilestone } from '../models/course.model';
import { Enrollment } from '../models/enrollment.model';
import { Student } from '../models/student.model';
import { StudentProgress } from '../models/studentProgress.model';

/**
 * Generate default milestones for a course if none exist
 */
export const ensureCourseMilestones = async (course: any): Promise<ICourseMilestone[]> => {
  if (course.milestones && course.milestones.length > 0) {
    return course.milestones;
  }

  const defaultMilestones: ICourseMilestone[] = [
    {
      milestoneId: 'MS-1',
      title: 'Khởi động & Nắm vững nền tảng học thuật',
      description: 'Làm quen cấu trúc đề thi, củng cố từ vựng và ngữ pháp trọng tâm theo chuẩn Cambridge.',
      order: 1,
      type: 'LESSON_COMPLETION',
      targetSession: 6,
    },
    {
      milestoneId: 'MS-2',
      title: 'Hoàn thành Kỹ năng Listening & Reading',
      description: 'Nắm vững chiến thuật Skimming/Scanning và phân tích bẫy dạng bài Multiple Choice, Heading.',
      order: 2,
      type: 'SKILL_CHECK',
      targetSession: 14,
    },
    {
      milestoneId: 'MS-3',
      title: 'Bài thi đánh giá Giữa kỳ (Mid-term Test)',
      description: 'Kiểm tra đo lường độ tiến bộ sau 50% thời lượng khóa học, nhận diện điểm yếu kỹ năng.',
      order: 3,
      type: 'MOCK_TEST',
      targetSession: 18,
    },
    {
      milestoneId: 'MS-4',
      title: 'Chuyên sâu phản xạ Speaking & Bố cục Writing',
      description: 'Luyện tập Speaking Part 2-3 với giáo viên, hoàn thành tối thiểu 4 bài viết Task 1 & Task 2.',
      order: 4,
      type: 'ASSIGNMENT',
      targetSession: 28,
    },
    {
      milestoneId: 'MS-5',
      title: 'Thi thử 4 kỹ năng trọn vẹn (Full Mock Test)',
      description: 'Mô phỏng thi thực tế áp lực thời gian tại phòng khảo thí của trung tâm.',
      order: 5,
      type: 'MOCK_TEST',
      targetSession: 34,
    },
    {
      milestoneId: 'MS-6',
      title: 'Tổng kết & Đạt chuẩn đầu ra khóa học',
      description: 'Đánh giá tổng thể từ giáo viên phụ trách và cấp chứng nhận hoàn thành khóa học.',
      order: 6,
      type: 'CHECKPOINT',
      targetSession: course.sessions || 36,
    },
  ];

  course.milestones = defaultMilestones;
  await Course.findByIdAndUpdate(course._id, { milestones: defaultMilestones });
  return defaultMilestones;
};

/**
 * 1. GET /api/progress/class/:classId
 * Lấy toàn bộ tiến độ của các học viên trong lớp học (Dành cho Giáo viên / Giáo vụ / Giám đốc)
 */
export const getClassProgress = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { classId } = req.params;
    if (!mongoose.isValidObjectId(classId)) {
      throw createError('Mã lớp học không hợp lệ', 400);
    }

    const cls = await Class.findById(classId).populate('course');
    if (!cls) {
      throw createError('Không tìm thấy lớp học', 404);
    }

    // Role check: nếu là TEACHER thì phải là giáo viên của lớp (trừ khi là DIRECTOR / TRAINING_STAFF)
    if (
      req.user?.role === 'TEACHER' &&
      cls.teacher?.toString() !== req.user._id.toString()
    ) {
      throw createError('Bạn không có quyền xem tiến độ của lớp này', 403);
    }

    const course = cls.course as any;
    const milestones = await ensureCourseMilestones(course);

    // Lấy danh sách học viên đang ghi danh
    const enrollments = await Enrollment.find({
      class: cls._id,
      status: 'ENROLLED',
    }).populate('student', '_id fullName email phone');

    const studentUserIds = enrollments.map((e) => e.student?._id).filter(Boolean);

    // Lấy thông tin profile học viên (mã học viên, band điểm)
    const studentProfiles = await Student.find({ user: { $in: studentUserIds } });
    const profileMap = new Map(studentProfiles.map((p) => [p.user.toString(), p]));

    // Lấy tất cả records tiến độ của lớp
    const progressRecords = await StudentProgress.find({
      class: cls._id,
      completed: true,
    }).populate('markedBy', 'fullName');

    // Gom nhóm tiến độ theo từng học viên
    const studentList = enrollments
      .map((enr) => {
        const studentUser: any = enr.student;
        if (!studentUser) return null;
        const profile = profileMap.get(studentUser._id.toString());
        const studentRecords = progressRecords.filter(
          (r) => r.student.toString() === studentUser._id.toString()
        );
        const completedMilestoneIds = studentRecords.map((r) => r.milestoneId);
        const completedCount = completedMilestoneIds.length;
        const totalCount = milestones.length;
        const progressPercentage =
          totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

        return {
          studentId: studentUser._id,
          fullName: studentUser.fullName,
          email: studentUser.email,
          phone: studentUser.phone,
          studentCode: profile?.studentCode || '—',
          currentBand: profile?.currentBand ?? 0,
          targetBand: profile?.targetBand ?? 0,
          completedCount,
          totalMilestones: totalCount,
          progressPercentage,
          completedMilestoneIds,
          records: studentRecords.map((rec) => ({
            milestoneId: rec.milestoneId,
            completedAt: rec.completedAt,
            markedByName: (rec.markedBy as any)?.fullName || 'Giáo viên',
            note: rec.note,
            score: rec.score,
          })),
        };
      })
      .filter(Boolean);

    res.status(200).json({
      success: true,
      message: 'Lấy tiến độ lớp học thành công',
      data: {
        classInfo: {
          _id: cls._id,
          classCode: cls.classCode,
          name: cls.name,
          room: cls.room,
          timeSlot: cls.timeSlot,
          capacity: cls.capacity,
          currentEnrollment: studentList.length,
        },
        courseInfo: {
          _id: course._id,
          title: course.title,
          code: course.code,
          sessions: course.sessions,
          entryLevel: course.entryLevel,
          targetLevel: course.targetLevel,
        },
        milestones,
        students: studentList,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. POST /api/progress/mark
 * Đánh dấu hoặc hủy đánh dấu hoàn thành mốc học tập cho học viên
 */
export const markStudentMilestone = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { studentId, classId, milestoneId, completed, note, score } = req.body;

    if (!studentId || !classId || !milestoneId) {
      throw createError('Thiếu thông tin bắt buộc: studentId, classId, milestoneId', 400);
    }

    const cls = await Class.findById(classId);
    if (!cls) {
      throw createError('Không tìm thấy lớp học', 404);
    }

    // Role check: nếu là TEACHER thì phải là giáo viên của lớp
    if (
      req.user?.role === 'TEACHER' &&
      cls.teacher?.toString() !== req.user._id.toString()
    ) {
      throw createError('Bạn không có quyền đánh dấu tiến độ cho lớp này', 403);
    }

    // Học viên phải thực sự ghi danh lớp mới được đánh dấu tiến độ.
    // Thiếu check này thì giáo viên có thể đánh dấu cho bất kỳ userId nào,
    // kể cả người không học lớp đó → dữ liệu tiến độ sai.
    const enrollment = await Enrollment.findOne({
      class: classId,
      student: studentId,
      status: { $in: ['ENROLLED', 'COMPLETED'] },
    });
    if (!enrollment) {
      throw createError('Học viên không thuộc lớp học này', 400);
    }

    // Mốc tiến độ phải thuộc khóa học của lớp.
    const course: any = await Course.findById(cls.course);
    const milestones = course ? await ensureCourseMilestones(course) : [];
    if (milestones.length > 0 && !milestones.some((m) => m.milestoneId === milestoneId)) {
      throw createError('Mốc tiến độ không thuộc khóa học của lớp học này', 400);
    }

    if (completed === false) {
      // Xóa hoặc hủy hoàn thành
      await StudentProgress.findOneAndDelete({
        student: studentId,
        class: classId,
        milestoneId,
      });

      res.status(200).json({
        success: true,
        message: 'Đã hủy đánh dấu mốc tiến độ thành công',
        data: { completed: false, milestoneId, studentId },
      });
      return;
    }

    // Đánh dấu hoàn thành (upsert)
    const progress = await StudentProgress.findOneAndUpdate(
      { student: studentId, class: classId, milestoneId },
      {
        student: studentId,
        class: classId,
        course: cls.course,
        milestoneId,
        completed: true,
        completedAt: new Date(),
        markedBy: req.user?._id,
        note: note || '',
        score: score !== undefined ? Number(score) : undefined,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Cập nhật tiến độ học tập thành công',
      data: progress,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. GET /api/progress/my-progress
 * Lấy danh sách tiến độ các lớp học mà học viên hiện tại đang tham gia
 */
export const getMyProgress = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      throw createError('Không xác định được danh tính học viên', 401);
    }

    // Lấy tất cả lớp học của học viên
    const enrollments = await Enrollment.find({
      student: userId,
      status: { $in: ['ENROLLED', 'COMPLETED'] },
    }).populate({
      path: 'class',
      populate: [
        { path: 'course' },
        { path: 'teacher', select: 'fullName email' },
      ],
    });

    const results = [];

    for (const enr of enrollments) {
      const cls: any = enr.class;
      if (!cls || !cls.course) continue;

      const course = cls.course;
      const milestones = await ensureCourseMilestones(course);

      const records = await StudentProgress.find({
        student: userId,
        class: cls._id,
        completed: true,
      }).populate('markedBy', 'fullName');

      const completedMilestoneIds = new Set(records.map((r) => r.milestoneId));
      const completedCount = completedMilestoneIds.size;
      const totalCount = milestones.length;
      const progressPercentage =
        totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

      // Xác định mốc tiếp theo cần hoàn thành
      const nextMilestone = milestones.find((m) => !completedMilestoneIds.has(m.milestoneId));

      results.push({
        enrollmentId: enr._id,
        classId: cls._id,
        classCode: cls.classCode,
        className: cls.name || cls.classCode,
        room: cls.room,
        timeSlot: cls.timeSlot,
        teacherName: cls.teacher?.fullName || 'Chưa phân công',
        courseId: course._id,
        courseTitle: course.title,
        courseCode: course.code,
        sessions: course.sessions,
        targetLevel: course.targetLevel,
        progressPercentage,
        completedCount,
        totalMilestones: totalCount,
        nextMilestone,
        milestones: milestones.map((m) => {
          const record = records.find((r) => r.milestoneId === m.milestoneId);
          return {
            ...m,
            isCompleted: completedMilestoneIds.has(m.milestoneId),
            completedAt: record?.completedAt,
            markedByName: (record?.markedBy as any)?.fullName || '',
            note: record?.note,
            score: record?.score,
          };
        }),
      });
    }

    res.status(200).json({
      success: true,
      message: 'Lấy tiến độ học tập cá nhân thành công',
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. PUT /api/progress/course/:courseId/milestones
 * Quản lý & chỉnh sửa các mốc tiến độ chuẩn cho khóa học (Giáo vụ / Giám đốc)
 */
export const updateCourseMilestones = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { courseId } = req.params;
    const { milestones } = req.body;

    if (!mongoose.isValidObjectId(courseId)) {
      throw createError('Mã khóa học không hợp lệ', 400);
    }

    if (!Array.isArray(milestones)) {
      throw createError('Danh sách mốc tiến độ không đúng định dạng', 400);
    }

    const course = await Course.findByIdAndUpdate(
      courseId,
      { milestones },
      { new: true }
    );

    if (!course) {
      throw createError('Không tìm thấy khóa học', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật danh sách mốc tiến độ của khóa học thành công',
      data: course.milestones,
    });
  } catch (error) {
    next(error);
  }
};
