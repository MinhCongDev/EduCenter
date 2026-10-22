import { Types } from 'mongoose';
import { createError } from '../middlewares/error.middleware';
import { ClassSchedule } from '../models/classSchedule.model';
import { ClassTeacher } from '../models/classTeacher.model';
import { Class } from '../models/class.model';

export const normalizeWeekday = (value: string): string => {
  if (value.toLocaleLowerCase() === 'chủ nhật') return 'Chủ Nhật';
  return value;
};

export const weekdayForDate = (date: Date): string => {
  const weekdays = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  return weekdays[date.getUTCDay()];
};

export const parseTimeSlot = (timeSlot: string): { startTime: string; endTime: string } => {
  if (typeof timeSlot !== 'string') throw createError('Vui lòng nhập khung giờ học', 400);
  const match = /^([01]\d|2[0-3]):([0-5]\d)\s*-\s*([01]\d|2[0-3]):([0-5]\d)$/.exec(timeSlot.trim());
  if (!match) throw createError('Khung giờ phải có dạng HH:mm - HH:mm', 400);
  const startTime = `${match[1]}:${match[2]}`;
  const endTime = `${match[3]}:${match[4]}`;
  if (startTime >= endTime) throw createError('Giờ kết thúc phải sau giờ bắt đầu', 400);
  return { startTime, endTime };
};

export const generateSessionDates = (startDate: Date, scheduleDays: string[], sessions: number): Date[] => {
  if (!Number.isInteger(sessions) || sessions < 1 || sessions > 500) {
    throw createError('Số buổi học phải từ 1 đến 500', 400);
  }
  if (!Array.isArray(scheduleDays)) throw createError('Chọn ít nhất một ngày học trong tuần', 400);
  const normalizedDays = [...new Set(scheduleDays.map(normalizeWeekday))];
  if (normalizedDays.length === 0) throw createError('Chọn ít nhất một ngày học trong tuần', 400);
  const validDays = new Set(['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật']);
  if (normalizedDays.some((day) => !validDays.has(day))) throw createError('Ngày học trong tuần không hợp lệ', 400);

  const firstDate = new Date(startDate);
  firstDate.setUTCHours(0, 0, 0, 0);
  if (Number.isNaN(firstDate.getTime())) throw createError('Ngày bắt đầu không hợp lệ', 400);

  const selectedDays = new Set(normalizedDays);
  const dates: Date[] = [];
  const candidate = new Date(firstDate);
  const maximumDays = sessions * 7;
  for (let offset = 0; offset <= maximumDays && dates.length < sessions; offset += 1) {
    if (selectedDays.has(weekdayForDate(candidate))) dates.push(new Date(candidate));
    candidate.setUTCDate(candidate.getUTCDate() + 1);
  }
  if (dates.length !== sessions) throw createError('Không thể tạo đủ số buổi theo ngày học đã chọn', 400);
  return dates;
};

const timeToMinutes = (value: string): number | null => {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
};

const sameUtcDay = (left: Date, right: Date): boolean =>
  left.toISOString().slice(0, 10) === right.toISOString().slice(0, 10);

interface ScheduleCandidate {
  sessionDate: Date;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  classroom: string;
}

interface ConflictCheckOptions {
  teacherIds: Types.ObjectId[];
  candidates: ScheduleCandidate[];
  ignoreScheduleId?: Types.ObjectId;
  ignoreClassId?: Types.ObjectId;
}

export const validateScheduleConflicts = async ({
  teacherIds,
  candidates,
  ignoreScheduleId,
  ignoreClassId,
}: ConflictCheckOptions): Promise<void> => {
  if (candidates.length === 0) return;
  const relevantDates = candidates.map((candidate) => candidate.sessionDate);
  const minDate = new Date(Math.min(...relevantDates.map((date) => date.getTime())));
  const maxDate = new Date(Math.max(...relevantDates.map((date) => date.getTime())));
  const existingSchedules = await ClassSchedule.find({
    status: 'ACTIVE',
    ...(ignoreScheduleId ? { _id: { $ne: ignoreScheduleId } } : {}),
    ...(ignoreClassId ? { class: { $ne: ignoreClassId } } : {}),
    $or: [
      { sessionDate: { $gte: minDate, $lte: maxDate } },
      { sessionDate: { $exists: false } },
      { sessionDate: null },
    ],
  }).lean();
  if (!existingSchedules.length) return;

  const existingClasses = await Class.find({
    _id: { $in: existingSchedules.map((schedule) => schedule.class) },
    status: { $ne: 'CANCELLED' },
  }).select('_id classCode startDate endDate teacher').lean();
  const classById = new Map(existingClasses.map((classItem) => [classItem._id.toString(), classItem]));
  const assignments = await ClassTeacher.find({
    class: { $in: existingClasses.map((classItem) => classItem._id) },
    status: 'ACTIVE',
  }).select('class teacher').lean();
  const teachersByClass = new Map<string, Set<string>>();
  for (const classItem of existingClasses) {
    teachersByClass.set(classItem._id.toString(), new Set([classItem.teacher.toString()]));
  }
  for (const assignment of assignments) {
    teachersByClass.get(assignment.class.toString())?.add(assignment.teacher.toString());
  }

  for (const candidate of candidates) {
    const candidateStart = timeToMinutes(candidate.startTime);
    const candidateEnd = timeToMinutes(candidate.endTime);
    if (candidateStart === null || candidateEnd === null) throw createError('Khung giờ học không hợp lệ', 400);

    for (const existing of existingSchedules) {
      const existingClass = classById.get(existing.class.toString());
      if (!existingClass) continue;
      const explicitDate = existing.sessionDate as Date | undefined;
      const isSameDate = explicitDate
        ? sameUtcDay(new Date(explicitDate), candidate.sessionDate)
        : existing.dayOfWeek === candidate.dayOfWeek
          && candidate.sessionDate.toISOString().slice(0, 10) >= new Date(existingClass.startDate).toISOString().slice(0, 10)
          && candidate.sessionDate.toISOString().slice(0, 10) <= new Date(existingClass.endDate).toISOString().slice(0, 10);
      if (!isSameDate) continue;

      const existingStart = timeToMinutes(existing.startTime);
      const existingEnd = timeToMinutes(existing.endTime);
      if (existingStart === null || existingEnd === null || candidateStart >= existingEnd || existingStart >= candidateEnd) continue;

      if (existing.classroom.trim().toLocaleLowerCase() === candidate.classroom.trim().toLocaleLowerCase()) {
        throw createError(
          `Trùng phòng ${candidate.classroom} vào ${candidate.dayOfWeek} ${candidate.sessionDate.toISOString().slice(0, 10)} (${existing.startTime} - ${existing.endTime})${existingClass.classCode ? ` với lớp ${existingClass.classCode}` : ''}`,
          409
        );
      }

      const assignedTeachers = teachersByClass.get(existing.class.toString()) ?? new Set<string>();
      if (teacherIds.some((teacherId) => assignedTeachers.has(teacherId.toString()))) {
        throw createError(
          `Giảng viên đã có lịch vào ${candidate.dayOfWeek} ${candidate.sessionDate.toISOString().slice(0, 10)} (${existing.startTime} - ${existing.endTime})${existingClass.classCode ? ` với lớp ${existingClass.classCode}` : ''}`,
          409
        );
      }
    }
  }

};

export const getTeacherIdsForClass = async (classId: Types.ObjectId, primaryTeacherId: Types.ObjectId): Promise<Types.ObjectId[]> => {
  const assignments = await ClassTeacher.find({ class: classId, status: 'ACTIVE' }).select('teacher').lean();
  return [...new Set([primaryTeacherId.toString(), ...assignments.map((assignment) => assignment.teacher.toString())])]
    .map((id) => new Types.ObjectId(id));
};

export const buildScheduleCandidates = (
  dates: Date[],
  startTime: string,
  endTime: string,
  classroom: string
): ScheduleCandidate[] => dates.map((sessionDate) => ({
  sessionDate,
  dayOfWeek: weekdayForDate(sessionDate),
  startTime,
  endTime,
  classroom,
}));
