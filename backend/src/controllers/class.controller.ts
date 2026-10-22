import { Response, NextFunction } from 'express';
import { Class } from '../models/class.model';
import { Course } from '../models/course.model';
import { User } from '../models/user.model';
import { Enrollment } from '../models/enrollment.model';
import { AuthRequest } from '../middlewares/auth.middleware';
import { createError } from '../middlewares/error.middleware';
import mongoose, { Types } from 'mongoose';
import { Attendance } from '../models/attendance.model';
import { ClassSchedule } from '../models/classSchedule.model';
import {
  buildScheduleCandidates,
  generateSessionDates,
  getTeacherIdsForClass,
  parseTimeSlot,
  validateScheduleConflicts,
} from '../utils/classSchedule.utils';

const classPopulate = [
  { path: 'course', select: 'code title sessions' },
  { path: 'teacher', select: 'fullName email' },
];

const validateAssignments = async (courseId?: string, teacherId?: string) => {
  let course;
  if (courseId) {
    course = await Course.findOne({ _id: courseId, status: 'ACTIVE' });
    if (!course) throw createError('Không tìm thấy khóa học đang hoạt động', 400);
  }

  if (teacherId) {
    const teacher = await User.findOne({ _id: teacherId, role: 'TEACHER', status: 'ACTIVE' });
    if (!teacher) throw createError('Không tìm thấy giảng viên đang hoạt động', 400);
  }
  return course;
};

export const getClassOptions = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [courses, teachers] = await Promise.all([
      Course.find({ status: 'ACTIVE' }).select('code title sessions').sort({ title: 1 }),
      User.find({ role: 'TEACHER', status: 'ACTIVE' }).select('fullName email').sort({ fullName: 1 }),
    ]);

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách khóa học và giảng viên thành công',
      data: { courses, teachers },
    });
  } catch (error) {
    next(error);
  }
};

export const getClasses = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, search, page = '1', limit = '10' } = req.query;
    const filter: Record<string, unknown> = {};

    if (status) filter.status = status;
    if (search) filter.classCode = { $regex: search, $options: 'i' };

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 10));
    const [classes, total] = await Promise.all([
      Class.find(filter)
        .populate(classPopulate)
        .sort({ startDate: 1, createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Class.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách lớp học thành công',
      data: classes,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    next(error);
  }
};

export const createClass = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { classCode, course, teacher, ...classData } = req.body;
    const normalizedCode = typeof classCode === 'string' ? classCode.trim().toUpperCase() : '';
    const existing = await Class.findOne({ classCode: normalizedCode });
    if (existing) {
      res.status(409).json({ success: false, message: 'Mã lớp học đã tồn tại' });
      return;
    }

    const courseDocument = await validateAssignments(course, teacher);
    if (!courseDocument) throw createError('Không tìm thấy khóa học đang hoạt động', 400);
    const startDate = parseClassStartDate(classData.startDate);
    const dates = generateSessionDates(startDate, classData.scheduleDays, courseDocument.sessions);
    const { startTime, endTime } = parseTimeSlot(classData.timeSlot);
    const room = typeof classData.room === 'string' && classData.room.trim() ? classData.room.trim() : 'Phòng học 101';
    const candidates = buildScheduleCandidates(dates, startTime, endTime, room);
    await validateScheduleConflicts({ teacherIds: [new Types.ObjectId(teacher)], candidates });

    const session = await mongoose.startSession();
    let createdId: Types.ObjectId | undefined;
    try {
      await session.withTransaction(async () => {
        const [created] = await Class.create([{
          ...classData,
          startDate,
          endDate: dates[dates.length - 1],
          scheduleDays: [...new Set(classData.scheduleDays.map(normalizeClassWeekday))],
          timeSlot: `${startTime} - ${endTime}`,
          room,
          classCode: normalizedCode,
          course,
          teacher,
        }], { session });
        createdId = created._id;
        await ClassSchedule.insertMany(candidates.map((candidate) => ({
          class: created._id,
          ...candidate,
          topic: '',
        })), { session });
      });
    } finally {
      await session.endSession();
    }
    const classroom = await Class.findById(createdId).populate(classPopulate);
    res.status(201).json({ success: true, message: 'Tạo lớp học thành công', data: classroom });
  } catch (error) {
    next(error);
  }
};

export const updateClass = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const classroom = await Class.findById(req.params.id);
    if (!classroom) {
      res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' });
      return;
    }

    const { classCode, course, teacher, ...classData } = req.body;
    if (classCode) {
      const normalizedCode = classCode.trim().toUpperCase();
      const duplicate = await Class.findOne({ classCode: normalizedCode, _id: { $ne: classroom._id } });
      if (duplicate) {
        res.status(409).json({ success: false, message: 'Mã lớp học đã tồn tại' });
        return;
      }
      classroom.classCode = normalizedCode;
    }

    const courseDocument = await validateAssignments(course || classroom.course.toString(), teacher || classroom.teacher.toString());
    if (!courseDocument) throw createError('Không tìm thấy khóa học đang hoạt động', 400);
    const startDate = parseClassStartDate(classData.startDate);
    const dates = generateSessionDates(startDate, classData.scheduleDays, courseDocument.sessions);
    const { startTime, endTime } = parseTimeSlot(classData.timeSlot);
    const room = typeof classData.room === 'string' && classData.room.trim() ? classData.room.trim() : 'Phòng học 101';
    const candidates = buildScheduleCandidates(dates, startTime, endTime, room);
    const teacherId = new Types.ObjectId(teacher || classroom.teacher.toString());
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await validateScheduleConflicts({
          teacherIds: await getTeacherIdsForClass(classroom._id, teacherId),
          candidates,
          ignoreClassId: classroom._id,
        });

        const currentSchedules = await ClassSchedule.find({ class: classroom._id }).session(session);
        const scheduleIds = currentSchedules.map((schedule) => schedule._id);
        const linkedAttendanceCount = scheduleIds.length
          ? await Attendance.countDocuments({ classSchedule: { $in: scheduleIds } }).session(session)
          : 0;
        const expectedDates = new Set(dates.map((date) => date.toISOString().slice(0, 10)));
        const existingDates = new Set(currentSchedules
          .filter((schedule) => schedule.sessionDate)
          .map((schedule) => new Date(schedule.sessionDate!).toISOString().slice(0, 10)));
        const scheduleConfigurationChanged = classroom.course.toString() !== courseDocument._id.toString()
          || classroom.teacher.toString() !== teacherId.toString()
          || classroom.room !== room
          || classroom.timeSlot !== `${startTime} - ${endTime}`
          || JSON.stringify(classroom.scheduleDays.map(normalizeClassWeekday).sort())
            !== JSON.stringify([...new Set(classData.scheduleDays.map(normalizeClassWeekday))].sort())
          || classroom.startDate.toISOString().slice(0, 10) !== startDate.toISOString().slice(0, 10)
          || classroom.endDate.toISOString().slice(0, 10) !== dates[dates.length - 1].toISOString().slice(0, 10)
          || currentSchedules.some((schedule) => !schedule.sessionDate)
          || expectedDates.size !== existingDates.size
          || [...expectedDates].some((date) => !existingDates.has(date))
          || currentSchedules.some((schedule) => {
            const candidate = candidates.find((item) => item.sessionDate.toISOString().slice(0, 10) === schedule.sessionDate?.toISOString().slice(0, 10));
            return candidate && (schedule.startTime !== candidate.startTime || schedule.endTime !== candidate.endTime || schedule.classroom !== candidate.classroom);
          });

        if (scheduleConfigurationChanged && (classroom.status === 'CANCELLED' || classroom.status === 'COMPLETED')) {
          throw createError('Không thể cập nhật lịch cho lớp đã hủy hoặc hoàn thành', 400);
        }
        if (scheduleConfigurationChanged && linkedAttendanceCount > 0) {
          throw createError('Không thể thay đổi lịch vì đã có điểm danh gắn với các buổi học hiện tại', 409);
        }

        Object.assign(classroom, classData, {
          startDate,
          endDate: dates[dates.length - 1],
          scheduleDays: [...new Set(classData.scheduleDays.map(normalizeClassWeekday))],
          timeSlot: `${startTime} - ${endTime}`,
          room,
          course: courseDocument._id,
          teacher: teacherId,
        });
        await classroom.save({ session });

        const byDate = new Map(currentSchedules
          .filter((schedule) => schedule.sessionDate)
          .map((schedule) => [schedule.sessionDate!.toISOString().slice(0, 10), schedule]));
        const legacySchedules = currentSchedules.filter((schedule) => !schedule.sessionDate);
        const retainedIds: Types.ObjectId[] = [];
        for (const [index, candidate] of candidates.entries()) {
          const dateKey = candidate.sessionDate.toISOString().slice(0, 10);
          const existingSchedule = byDate.get(dateKey) ?? (index === 0 ? legacySchedules.shift() : undefined);
          if (existingSchedule) {
            Object.assign(existingSchedule, candidate, { class: classroom._id });
            await existingSchedule.save({ session });
            retainedIds.push(existingSchedule._id);
          } else {
            const [createdSchedule] = await ClassSchedule.create([{ class: classroom._id, ...candidate, topic: '' }], { session });
            retainedIds.push(createdSchedule._id);
          }
        }
        const currentIds = currentSchedules.map((schedule) => schedule._id);
        const removableIds = currentIds.filter((id) => !retainedIds.some((retainedId) => retainedId.equals(id)));
        if (removableIds.length) await ClassSchedule.deleteMany({ _id: { $in: removableIds } }).session(session);
      });
    } finally {
      await session.endSession();
    }

    const updated = await Class.findById(classroom._id).populate(classPopulate);
    res.status(200).json({ success: true, message: 'Cập nhật lớp học thành công', data: updated });
  } catch (error) {
    next(error);
  }
};

const parseClassStartDate = (value: unknown): Date => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw createError('Ngày bắt đầu phải có định dạng YYYY-MM-DD', 400);
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw createError('Ngày bắt đầu không hợp lệ', 400);
  }
  return date;
};

const normalizeClassWeekday = (value: string): string => value.toLocaleLowerCase() === 'chủ nhật' ? 'Chủ Nhật' : value;

export const deleteClass = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const classroom = await Class.findById(req.params.id);
    if (!classroom) {
      res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' });
      return;
    }

    const enrolledCount = await Enrollment.countDocuments({ class: classroom._id, status: 'ENROLLED' });
    if (enrolledCount > 0) {
      res.status(409).json({
        success: false,
        message: 'Không thể xóa lớp đang có học viên ghi danh. Hãy chuyển trạng thái lớp thay vì xóa.',
      });
      return;
    }

    const attendanceCount = await Attendance.countDocuments({ class: classroom._id });
    if (attendanceCount > 0) {
      res.status(409).json({
        success: false,
        message: 'Không thể xóa lớp đã có dữ liệu điểm danh.',
      });
      return;
    }

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await ClassSchedule.deleteMany({ class: classroom._id }).session(session);
        await classroom.deleteOne({ session });
      });
    } finally {
      await session.endSession();
    }
    res.status(200).json({ success: true, message: 'Xóa lớp học thành công' });
  } catch (error) {
    next(error);
  }
};
