import { Response, NextFunction } from 'express';
import mongoose, { Types } from 'mongoose';
import { AuthRequest } from '../middlewares/auth.middleware';
import { createError } from '../middlewares/error.middleware';
import { Class } from '../models/class.model';
import { ClassTeacher } from '../models/classTeacher.model';
import { Course } from '../models/course.model';
import { Enrollment } from '../models/enrollment.model';
import { Grade } from '../models/grade.model';
import { Student } from '../models/student.model';
import { Teacher } from '../models/teacher.model';
import { User } from '../models/user.model';

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseDateFilter = (value: unknown, endOfDay = false): Date | undefined => {
  if (typeof value !== 'string' || !value) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw createError('Ngày lọc không hợp lệ', 400);
  const date = new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw createError('Ngày lọc không hợp lệ', 400);
  }
  return date;
};

const getPagination = (req: AuthRequest) => {
  const page = Math.max(1, Number.parseInt(String(req.query.page ?? '1'), 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(String(req.query.limit ?? '10'), 10) || 10));
  return { page, limit };
};

export const getStudentManagementOptions = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const classes = await Class.find()
      .select('classCode course')
      .populate('course', 'code title')
      .sort({ classCode: 1 })
      .lean();
    res.status(200).json({ success: true, message: 'Lấy tùy chọn học viên thành công', data: { classes } });
  } catch (error) {
    next(error);
  }
};

export const getManagedStudents = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page, limit } = getPagination(req);
    const filters: Record<string, unknown> = { role: 'STUDENT' };
    const createdAt: Record<string, Date> = {};
    const fromDate = parseDateFilter(req.query.fromDate);
    const toDate = parseDateFilter(req.query.toDate, true);
    if (fromDate) createdAt.$gte = fromDate;
    if (toDate) createdAt.$lte = toDate;
    if (fromDate && toDate && fromDate > toDate) throw createError('Khoảng ngày lọc không hợp lệ', 400);
    if (Object.keys(createdAt).length) filters.createdAt = createdAt;
    if (typeof req.query.search === 'string' && req.query.search.trim()) {
      const pattern = new RegExp(escapeRegex(req.query.search.trim()), 'i');
      const matchingProfiles = await Student.find({ studentCode: pattern }).select('user').lean();
      filters.$or = [
        { fullName: pattern },
        { email: pattern },
        { phone: pattern },
        { _id: { $in: matchingProfiles.map((profile) => profile.user) } },
      ];
    }

    const enrollmentFilters: Record<string, unknown> = {};
    const classId = typeof req.query.classId === 'string' ? req.query.classId : '';
    if (classId) {
      if (!mongoose.isValidObjectId(classId)) throw createError('Mã lớp học không hợp lệ', 400);
      enrollmentFilters.class = new Types.ObjectId(classId);
    }
    if (
      req.query.completion !== undefined
      && req.query.completion !== ''
      && req.query.completion !== 'COMPLETED'
      && req.query.completion !== 'IN_PROGRESS'
    ) {
      throw createError('Bộ lọc tình trạng học không hợp lệ', 400);
    }
    if (req.query.completion === 'COMPLETED') enrollmentFilters.status = 'COMPLETED';
    if (req.query.completion === 'IN_PROGRESS') enrollmentFilters.status = { $in: ['PENDING', 'ENROLLED'] };

    let studentIds: Types.ObjectId[] | undefined;
    if (Object.keys(enrollmentFilters).length) {
      const matchingEnrollments = await Enrollment.aggregate<{ _id: Types.ObjectId }>([
        { $match: enrollmentFilters },
        { $group: { _id: '$student' } },
      ]);
      studentIds = matchingEnrollments.map(({ _id }) => _id);
      filters._id = { $in: studentIds };
    }

    const [users, total] = await Promise.all([
      User.find(filters)
        .select('fullName email phone status createdAt')
        .sort({ createdAt: -1, fullName: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(filters),
    ]);
    const userIds = users.map((user) => user._id);
    const [profiles, enrollments] = await Promise.all([
      Student.find({ user: { $in: userIds } })
        .select('user studentCode status currentBand targetBand')
        .lean(),
      Enrollment.find({ student: { $in: userIds } })
        .select('student status registrationDate')
        .sort({ registrationDate: -1 })
        .lean(),
    ]);
    const profilesByUserId = new Map(profiles.map((profile) => [profile.user.toString(), profile]));
    const enrollmentsByUserId = new Map<string, typeof enrollments>();
    for (const enrollment of enrollments) {
      const userId = enrollment.student.toString();
      const values = enrollmentsByUserId.get(userId) ?? [];
      values.push(enrollment);
      enrollmentsByUserId.set(userId, values);
    }

    const data = users.map((user) => {
      const studentEnrollments = enrollmentsByUserId.get(user._id.toString()) ?? [];
      return {
        ...user,
        profile: profilesByUserId.get(user._id.toString()) ?? null,
        activeClasses: studentEnrollments.filter((enrollment) => enrollment.status === 'ENROLLED').length,
        completedClasses: studentEnrollments.filter((enrollment) => enrollment.status === 'COMPLETED').length,
      };
    });

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách học viên thành công',
      data,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

export const getManagedStudentById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw createError('Mã học viên không hợp lệ', 400);
    const user = await User.findOne({ _id: req.params.id, role: 'STUDENT' })
      .select('fullName email phone address dob status createdAt')
      .lean();
    if (!user) throw createError('Không tìm thấy học viên', 404);

    const [profile, enrollments] = await Promise.all([
      Student.findOne({ user: user._id }).lean(),
      Enrollment.find({ student: user._id })
        .sort({ registrationDate: -1, createdAt: -1 })
        .lean(),
    ]);
    const classIds = enrollments.flatMap((enrollment) => enrollment.class ? [enrollment.class] : []);
    const courseIds = enrollments.flatMap((enrollment) => enrollment.course ? [enrollment.course] : []);
    const [classes, courses] = await Promise.all([
      classIds.length
        ? Class.find({ _id: { $in: classIds } })
          .select('classCode name course teacher room scheduleDays timeSlot startDate endDate status')
          .populate('course', 'code title sessions')
          .populate('teacher', 'fullName email')
          .lean()
        : Promise.resolve([]),
      courseIds.length
        ? Course.find({ _id: { $in: courseIds } }).select('code title sessions').lean()
        : Promise.resolve([]),
    ]);
    const classesById = new Map(classes.map((classroom) => [classroom._id.toString(), classroom]));
    const coursesById = new Map(courses.map((course) => [course._id.toString(), course]));
    const grades = classIds.length
      ? await Grade.find({ student: user._id, class: { $in: classIds } })
        .sort({ testDate: -1, createdAt: -1 })
        .populate('teacher', 'fullName')
        .lean()
      : [];
    const gradesByClassId = new Map<string, typeof grades>();
    for (const grade of grades) {
      const classId = grade.class.toString();
      const values = gradesByClassId.get(classId) ?? [];
      values.push(grade);
      gradesByClassId.set(classId, values);
    }
    const enrollmentsWithGrades = enrollments.map((enrollment) => {
      const classId = enrollment.class?.toString();
      return {
        ...enrollment,
        course: enrollment.course ? coursesById.get(enrollment.course.toString()) ?? null : null,
        class: classId ? classesById.get(classId) ?? null : null,
        grades: classId ? gradesByClassId.get(classId) ?? [] : [],
      };
    });

    res.status(200).json({
      success: true,
      message: 'Lấy hồ sơ học viên thành công',
      data: { user, profile, enrollments: enrollmentsWithGrades },
    });
  } catch (error) {
    next(error);
  }
};

export const getManagedTeachers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page, limit } = getPagination(req);
    const filters: Record<string, unknown> = { role: 'TEACHER' };
    if (typeof req.query.search === 'string' && req.query.search.trim()) {
      const pattern = new RegExp(escapeRegex(req.query.search.trim()), 'i');
      filters.$or = [{ fullName: pattern }, { email: pattern }, { phone: pattern }];
    }
    const [users, total] = await Promise.all([
      User.find(filters)
        .select('fullName email phone status createdAt')
        .sort({ fullName: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(filters),
    ]);
    const userIds = users.map((user) => user._id);
    const [profiles, primaryClasses, additionalAssignments] = await Promise.all([
      Teacher.find({ user: { $in: userIds } }).select('user teacherCode specialization yearsOfExperience').lean(),
      Class.find({ teacher: { $in: userIds } }).select('_id teacher').lean(),
      ClassTeacher.find({ teacher: { $in: userIds }, status: 'ACTIVE' }).select('class teacher').lean(),
    ]);
    const profileByUserId = new Map(profiles.map((profile) => [profile.user.toString(), profile]));
    const classIdsByTeacher = new Map<string, Set<string>>();
    for (const assignment of primaryClasses) {
      const teacherId = assignment.teacher.toString();
      const classIds = classIdsByTeacher.get(teacherId) ?? new Set<string>();
      classIds.add(assignment._id.toString());
      classIdsByTeacher.set(teacherId, classIds);
    }
    for (const assignment of additionalAssignments) {
      const teacherId = assignment.teacher.toString();
      const classIds = classIdsByTeacher.get(teacherId) ?? new Set<string>();
      classIds.add(assignment.class.toString());
      classIdsByTeacher.set(teacherId, classIds);
    }
    const data = users.map((user) => ({
      ...user,
      profile: profileByUserId.get(user._id.toString()) ?? null,
      assignedClasses: classIdsByTeacher.get(user._id.toString())?.size ?? 0,
    }));
    res.status(200).json({
      success: true,
      message: 'Lấy danh sách giảng viên thành công',
      data,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

export const getManagedTeacherById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw createError('Mã giảng viên không hợp lệ', 400);
    const user = await User.findOne({ _id: req.params.id, role: 'TEACHER' })
      .select('fullName email phone address dob status createdAt')
      .lean();
    if (!user) throw createError('Không tìm thấy giảng viên', 404);

    const [profile, primaryClasses, additionalAssignments] = await Promise.all([
      Teacher.findOne({ user: user._id }).lean(),
      Class.find({ teacher: user._id })
        .populate('course', 'code title')
        .sort({ startDate: -1 })
        .lean(),
      ClassTeacher.find({ teacher: user._id, status: 'ACTIVE' }).select('class').lean(),
    ]);
    const additionalClassIds = additionalAssignments
      .map((assignment) => assignment.class)
      .filter((classId) => !primaryClasses.some((classroom) => classroom._id.toString() === classId.toString()));
    const additionalClasses = additionalClassIds.length
      ? await Class.find({ _id: { $in: additionalClassIds } })
        .populate('course', 'code title')
        .sort({ startDate: -1 })
        .lean()
      : [];
    const classesById = new Map<string, (typeof primaryClasses)[number]>();
    for (const classroom of primaryClasses) classesById.set(classroom._id.toString(), classroom);
    for (const classroom of additionalClasses) classesById.set(classroom._id.toString(), classroom);
    res.status(200).json({
      success: true,
      message: 'Lấy hồ sơ giảng viên thành công',
      data: { user, profile, classes: [...classesById.values()] },
    });
  } catch (error) {
    next(error);
  }
};

export const updateManagedAccountStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw createError('Mã tài khoản không hợp lệ', 400);
    const { status } = req.body as { status?: string };
    if (status !== 'ACTIVE' && status !== 'SUSPENDED') {
      throw createError('Trạng thái tài khoản không hợp lệ', 400);
    }
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: { $in: ['STUDENT', 'TEACHER'] } },
      { $set: { status } },
      { new: true, runValidators: true }
    ).select('fullName email role status');
    if (!user) throw createError('Không tìm thấy học viên hoặc giảng viên', 404);
    res.status(200).json({ success: true, message: 'Cập nhật trạng thái tài khoản thành công', data: user });
  } catch (error) {
    next(error);
  }
};

export const updateStudentPlacement = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw createError('Mã học viên không hợp lệ', 400);

    const { currentBand, targetBand, placementTestScore, placementTestDate, placementNotes } = req.body as {
      currentBand?: number;
      targetBand?: number;
      placementTestScore?: number;
      placementTestDate?: string;
      placementNotes?: string;
    };

    const studentProfile = await Student.findOneAndUpdate(
      { $or: [{ user: req.params.id }, { _id: req.params.id }] },
      {
        ...(currentBand !== undefined && { currentBand: Number(currentBand) }),
        ...(targetBand !== undefined && { targetBand: Number(targetBand) }),
        ...(placementTestScore !== undefined && { placementTestScore: Number(placementTestScore) }),
        ...(placementTestDate !== undefined && { placementTestDate: new Date(placementTestDate) }),
        ...(placementNotes !== undefined && { placementNotes: String(placementNotes) }),
      },
      { new: true }
    );

    if (!studentProfile) throw createError('Không tìm thấy hồ sơ học viên', 404);

    res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin trình độ và kết quả kiểm tra đầu vào thành công',
      data: studentProfile,
    });
  } catch (error) {
    next(error);
  }
};

