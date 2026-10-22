import { Request, Response, NextFunction } from 'express';
import mongoose, { Types } from 'mongoose';
import { AuthRequest } from '../middlewares/auth.middleware';
import { createError } from '../middlewares/error.middleware';
import { ClassSchedule } from '../models/classSchedule.model';
import { Class, IClass } from '../models/class.model';
import { ClassTeacher } from '../models/classTeacher.model';
import { ICourse } from '../models/course.model';
import { User, IUser } from '../models/user.model';
import {
  buildScheduleCandidates,
  getTeacherIdsForClass,
  parseTimeSlot,
  validateScheduleConflicts,
  weekdayForDate,
} from '../utils/classSchedule.utils';

const WEEK_DAYS = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

interface PopulatedClass extends Omit<IClass, 'course' | 'teacher'> {
  course: Pick<ICourse, '_id' | 'code' | 'title'>;
  teacher: Pick<IUser, '_id' | 'fullName' | 'email'>;
}

interface SchedulePayload {
  sessionDate?: string;
  startTime?: string;
  endTime?: string;
  classroom?: string;
  topic?: string;
  status?: 'ACTIVE' | 'CANCELLED';
}

const parseDateOnly = (value: unknown, label: string): Date => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw createError(`${label} phải có định dạng YYYY-MM-DD`, 400);
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw createError(`${label} không hợp lệ`, 400);
  }
  return date;
};

const mondayOf = (date: Date): Date => {
  const monday = new Date(date);
  const day = monday.getUTCDay();
  monday.setUTCDate(monday.getUTCDate() - ((day + 6) % 7));
  return monday;
};

const toDateString = (date: Date): string => date.toISOString().slice(0, 10);

const getAssignedTeachers = async (classroomIds: Types.ObjectId[]): Promise<Map<string, { _id: Types.ObjectId; fullName: string; email: string }[]>> => {
  const assignments = await ClassTeacher.find({ class: { $in: classroomIds }, status: 'ACTIVE' })
    .populate<{ teacher: Pick<IUser, '_id' | 'fullName' | 'email'> }>({ path: 'teacher', select: 'fullName email' })
    .lean();
  const result = new Map<string, { _id: Types.ObjectId; fullName: string; email: string }[]>();

  for (const assignment of assignments) {
    if (!assignment.teacher || typeof assignment.teacher === 'string') continue;
    const key = assignment.class.toString();
    const teachers = result.get(key) ?? [];
    if (!teachers.some((teacher) => teacher._id.toString() === assignment.teacher._id.toString())) {
      teachers.push(assignment.teacher);
    }
    result.set(key, teachers);
  }
  return result;
};

const getScheduleDetails = async (scheduleId: Types.ObjectId | string) => {
  return ClassSchedule.findById(scheduleId)
    .populate<{ class: PopulatedClass }>({
      path: 'class',
      populate: [
        { path: 'course', select: 'code title' },
        { path: 'teacher', select: 'fullName email' },
      ],
    })
    .lean();
};

const getDetailedSchedule = async (scheduleId: Types.ObjectId | string) => {
  const schedule = await getScheduleDetails(scheduleId);
  if (!schedule?.class) return null;
  const teacherMap = await getAssignedTeachers([schedule.class._id]);
  const teachers = teacherMap.get(schedule.class._id.toString()) ?? [];
  if (schedule.class.teacher && !teachers.some((teacher) => teacher._id.toString() === schedule.class.teacher._id.toString())) {
    teachers.unshift(schedule.class.teacher);
  }
  return { ...schedule, teachers };
};

export const getScheduleOptions = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const [classes, rooms] = await Promise.all([
      Class.find({ status: { $nin: ['CANCELLED', 'COMPLETED'] }, endDate: { $gte: today } })
        .populate('course', 'code title')
        .sort({ startDate: 1 })
        .select('classCode name course teacher startDate endDate')
        .lean(),
      ClassSchedule.distinct('classroom', { status: 'ACTIVE' }),
    ]);
    const [assignedTeachers, primaryTeachers] = await Promise.all([
      getAssignedTeachers(classes.map((classroom) => classroom._id)),
      User.find({
        _id: { $in: classes.map((classroom) => classroom.teacher) },
        role: 'TEACHER',
        status: 'ACTIVE',
      }).select('fullName email').lean(),
    ]);
    const primaryTeacherById = new Map(primaryTeachers.map((teacher) => [teacher._id.toString(), teacher]));
    const classesWithTeachers = classes.map((classroom) => {
      const teachers = assignedTeachers.get(classroom._id.toString()) ?? [];
      const primaryTeacher = primaryTeacherById.get(classroom.teacher.toString());
      if (primaryTeacher && !teachers.some((teacher) => teacher._id.toString() === primaryTeacher._id.toString())) {
        teachers.unshift(primaryTeacher);
      }
      return { ...classroom, teachers };
    });
    const teachersById = new Map<string, { _id: Types.ObjectId; fullName: string; email: string }>();
    for (const classroom of classesWithTeachers) {
      for (const teacher of classroom.teachers) teachersById.set(teacher._id.toString(), teacher);
    }
    const teachers = [...teachersById.values()].sort((left, right) => left.fullName.localeCompare(right.fullName));
    const availableRooms = rooms.filter((room): room is string => typeof room === 'string' && Boolean(room.trim())).sort();
    res.status(200).json({
      success: true,
      message: 'Lấy dữ liệu lọc lịch thành công',
      data: { classes: classesWithTeachers, teachers, rooms: availableRooms },
    });
  } catch (error) {
    next(error);
  }
};

export const getWeeklySchedule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const startDate = req.query.weekStart === undefined
      ? mondayOf(new Date())
      : mondayOf(parseDateOnly(req.query.weekStart, 'weekStart'));
    const endDate = new Date(startDate);
    endDate.setUTCDate(endDate.getUTCDate() + 6);
    const classId = typeof req.query.classId === 'string' ? req.query.classId.trim() : '';
    const teacherId = typeof req.query.teacherId === 'string' ? req.query.teacherId.trim() : '';
    const room = typeof req.query.room === 'string' ? req.query.room.trim() : '';
    if (classId && !mongoose.isValidObjectId(classId)) throw createError('Mã lớp học không hợp lệ', 400);
    if (teacherId && !mongoose.isValidObjectId(teacherId)) throw createError('Mã giảng viên không hợp lệ', 400);

    const schedules = await ClassSchedule.find({
      status: 'ACTIVE',
      ...(classId ? { class: new Types.ObjectId(classId) } : {}),
      ...(room ? { classroom: room } : {}),
      $or: [
        { sessionDate: { $gte: startDate, $lte: endDate } },
        { sessionDate: { $exists: false } },
        { sessionDate: null },
      ],
    })
      .populate<{ class: PopulatedClass }>({
        path: 'class',
        match: {
          status: { $ne: 'CANCELLED' },
          startDate: { $lte: endDate },
          endDate: { $gte: startDate },
        },
        populate: [
          { path: 'course', select: 'code title' },
          { path: 'teacher', select: 'fullName email' },
        ],
      })
      .sort({ startTime: 1 })
      .lean();
    const validSchedules = schedules.filter((schedule) => schedule.class);
    const teachersByClass = await getAssignedTeachers(validSchedules.map((schedule) => schedule.class._id));
    const events: Record<string, unknown>[] = [];

    for (const schedule of validSchedules) {
      const classroom = schedule.class;
      const teachers = teachersByClass.get(classroom._id.toString()) ?? [];
      if (classroom.teacher && !teachers.some((teacher) => teacher._id.toString() === classroom.teacher._id.toString())) {
        teachers.unshift(classroom.teacher);
      }
      if (teacherId && !teachers.some((teacher) => teacher._id.toString() === teacherId)) continue;

      if (schedule.sessionDate) {
        const date = new Date(schedule.sessionDate);
        if (date >= startDate && date <= endDate) {
          events.push({
            _id: schedule._id,
            date: toDateString(date),
            dayOfWeek: schedule.dayOfWeek,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            classroom: schedule.classroom,
            topic: schedule.topic ?? '',
            status: schedule.status,
            class: {
              _id: classroom._id,
              classCode: classroom.classCode,
              name: classroom.name,
              startDate: classroom.startDate,
              endDate: classroom.endDate,
              course: classroom.course,
            },
            teachers,
          });
        }
        continue;
      }

      const scheduleDay = schedule.dayOfWeek.toLocaleLowerCase();
      for (let offset = 0; offset < 7; offset += 1) {
        const date = new Date(startDate);
        date.setUTCDate(startDate.getUTCDate() + offset);
        const weekdayName = WEEK_DAYS[date.getUTCDay()];
        if (weekdayName.toLocaleLowerCase() !== scheduleDay) continue;
        if (date < new Date(classroom.startDate) || date > new Date(classroom.endDate)) continue;
        if (schedule.excludedDates?.some((excludedDate) => toDateString(new Date(excludedDate)) === toDateString(date))) continue;
        events.push({
          _id: schedule._id,
          date: toDateString(date),
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          classroom: schedule.classroom,
          topic: schedule.topic ?? '',
          status: schedule.status,
          class: {
            _id: classroom._id,
            classCode: classroom.classCode,
            name: classroom.name,
            startDate: classroom.startDate,
            endDate: classroom.endDate,
            course: classroom.course,
          },
          teachers,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Lấy thời khóa biểu tuần thành công',
      data: { weekStart: toDateString(startDate), weekEnd: toDateString(endDate), events },
    });
  } catch (error) {
    next(error);
  }
};

export const getClassScheduleById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw createError('Mã lịch học không hợp lệ', 400);
    const schedule = await getDetailedSchedule(req.params.id);
    if (!schedule || !schedule.class) {
      res.status(404).json({ success: false, message: 'Không tìm thấy lịch học' });
      return;
    }
    res.status(200).json({ success: true, message: 'Lấy chi tiết lịch học thành công', data: schedule });
  } catch (error) {
    next(error);
  }
};

export const updateClassSchedule = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw createError('Mã lịch học không hợp lệ', 400);
    const schedule = await ClassSchedule.findById(req.params.id);
    if (!schedule) {
      res.status(404).json({ success: false, message: 'Không tìm thấy lịch học' });
      return;
    }
    const payload = req.body as SchedulePayload;
    if (!payload.startTime || !payload.endTime || !payload.classroom?.trim()) {
      throw createError('Giờ bắt đầu, giờ kết thúc và phòng học là bắt buộc', 400);
    }
    const { startTime, endTime } = parseTimeSlot(`${payload.startTime} - ${payload.endTime}`);
    const room = payload.classroom.trim();
    const classroom = await Class.findById(schedule.class);
    if (!classroom) throw createError('Không tìm thấy lớp học', 404);

    const sessionDate = schedule.sessionDate
      ? new Date(schedule.sessionDate)
      : parseDateOnly(payload.sessionDate, 'sessionDate');
    if (schedule.sessionDate && payload.sessionDate && toDateString(sessionDate) !== payload.sessionDate) {
      throw createError('Không thể thay đổi ngày của buổi học tại thời khóa biểu', 400);
    }
    if (sessionDate < new Date(classroom.startDate) || sessionDate > new Date(classroom.endDate)) {
      throw createError('Ngày học phải nằm trong thời gian của lớp', 400);
    }
    const dayOfWeek = weekdayForDate(sessionDate);
    if (!schedule.sessionDate && schedule.dayOfWeek !== dayOfWeek) {
      throw createError('Buổi học này không thuộc ngày đã chọn của lịch lớp', 400);
    }
    if (classroom.status === 'CANCELLED' || classroom.status === 'COMPLETED') {
      throw createError('Không thể cập nhật lịch cho lớp đã hủy hoặc hoàn thành', 400);
    }

    const candidate = buildScheduleCandidates(
      [sessionDate],
      startTime,
      endTime,
      room
    )[0];
    if (payload.status !== 'CANCELLED') {
      await validateScheduleConflicts({
        teacherIds: await getTeacherIdsForClass(classroom._id, classroom.teacher),
        candidates: [candidate],
        ignoreScheduleId: schedule._id,
      });
    }

    let updatedScheduleId = schedule._id;
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        if (!schedule.sessionDate) {
          const dateKey = toDateString(sessionDate);
          if (!schedule.excludedDates.some((date) => toDateString(new Date(date)) === dateKey)) {
            schedule.excludedDates.push(sessionDate);
          }
          await schedule.save({ session });
          const [createdSchedule] = await ClassSchedule.create([{
            class: classroom._id,
            sessionDate,
            dayOfWeek,
            startTime,
            endTime,
            classroom: room,
            topic: payload.topic?.trim() ?? '',
            status: payload.status ?? 'ACTIVE',
          }], { session });
          updatedScheduleId = createdSchedule._id;
        } else {
          schedule.dayOfWeek = dayOfWeek;
          schedule.startTime = startTime;
          schedule.endTime = endTime;
          schedule.classroom = room;
          schedule.topic = payload.topic?.trim() ?? '';
          if (payload.status) schedule.status = payload.status;
          await schedule.save({ session });
        }
      });
    } finally {
      await session.endSession();
    }

    const result = await getDetailedSchedule(updatedScheduleId);
    res.status(200).json({ success: true, message: 'Cập nhật lịch học thành công', data: result });
  } catch (error) {
    next(error);
  }
};
