import { Response, NextFunction } from 'express';
import mongoose, { PipelineStage, Types } from 'mongoose';
import { AuthRequest } from '../middlewares/auth.middleware';
import { createError } from '../middlewares/error.middleware';
import { Class, IClass } from '../models/class.model';
import { ClassSchedule } from '../models/classSchedule.model';
import { Course } from '../models/course.model';
import { Enrollment } from '../models/enrollment.model';
import { Payment } from '../models/payment.model';
import {
  expandScheduleInstances,
  findScheduleTimeConflict,
  ScheduleRecordInput,
} from '../utils/classSchedule.utils';

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

interface StudentScheduleConflict {
  classId: string;
  classCode: string;
  conflictingClassCode: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  room: string;
}

const getStudentScheduleConflicts = async (
  studentId: Types.ObjectId,
  excludedEnrollmentId: Types.ObjectId,
  candidateClasses: IClass[],
  session?: mongoose.ClientSession
): Promise<StudentScheduleConflict[]> => {
  const enrollmentsQuery = Enrollment.find({
    student: studentId,
    status: 'ENROLLED',
    class: { $exists: true, $ne: null },
    _id: { $ne: excludedEnrollmentId },
  }).select('class');
  if (session) enrollmentsQuery.session(session);
  const activeEnrollments = await enrollmentsQuery.lean();
  const enrolledClassIds = [...new Set(activeEnrollments
    .map((enrollment) => enrollment.class?.toString())
    .filter((classId): classId is string => Boolean(classId)))];
  if (enrolledClassIds.length === 0 || candidateClasses.length === 0) return [];

  const classesQuery = Class.find({
    _id: { $in: enrolledClassIds },
    status: { $in: ['OPEN', 'IN_PROGRESS'] },
  });
  if (session) classesQuery.session(session);
  const enrolledClasses = await classesQuery;
  if (enrolledClasses.length === 0) return [];

  const allClassIds = [...new Set([
    ...enrolledClasses.map((classroom) => classroom._id.toString()),
    ...candidateClasses.map((classroom) => classroom._id.toString()),
  ])].map((classId) => new Types.ObjectId(classId));
  const schedulesQuery = ClassSchedule.find({ class: { $in: allClassIds } });
  if (session) schedulesQuery.session(session);
  const schedules = await schedulesQuery.lean();
  const schedulesByClassId = new Map<string, ScheduleRecordInput[]>();
  for (const schedule of schedules) {
    const classId = schedule.class.toString();
    const classSchedules = schedulesByClassId.get(classId) ?? [];
    classSchedules.push(schedule);
    schedulesByClassId.set(classId, classSchedules);
  }

  const enrolledInstances = enrolledClasses.map((classroom) => ({
    classroom,
    instances: expandScheduleInstances(classroom, schedulesByClassId.get(classroom._id.toString()) ?? []),
  }));
  const conflicts: StudentScheduleConflict[] = [];
  for (const candidateClass of candidateClasses) {
    const candidateInstances = expandScheduleInstances(
      candidateClass,
      schedulesByClassId.get(candidateClass._id.toString()) ?? []
    );
    for (const enrolledClass of enrolledInstances) {
      if (candidateClass._id.equals(enrolledClass.classroom._id)) continue;
      const overlap = findScheduleTimeConflict(candidateInstances, enrolledClass.instances);
      if (!overlap) continue;
      conflicts.push({
        classId: candidateClass._id.toString(),
        classCode: candidateClass.classCode,
        conflictingClassCode: enrolledClass.classroom.classCode,
        sessionDate: overlap.left.sessionDate.toISOString().slice(0, 10),
        startTime: overlap.left.startTime,
        endTime: overlap.left.endTime,
        room: overlap.left.classroom,
      });
      break;
    }
  }
  return conflicts;
};

const enrollmentLookupPipeline: PipelineStage[] = [
  {
    $addFields: {
      _studentRef: { $ifNull: ['$student', '$studentId'] },
      _classRef: { $ifNull: ['$class', '$classId'] },
    },
  },
  {
    $lookup: {
      from: 'students',
      localField: '_studentRef',
      foreignField: '_id',
      as: 'directStudentProfile',
    },
  },
  {
    $addFields: {
      _studentUserRef: {
        $ifNull: [{ $arrayElemAt: ['$directStudentProfile.user', 0] }, '$_studentRef'],
      },
    },
  },
  {
    $lookup: {
      from: 'users',
      localField: '_studentUserRef',
      foreignField: '_id',
      as: 'student',
    },
  },
  { $unwind: { path: '$student', preserveNullAndEmptyArrays: true } },
  {
    $lookup: {
      from: 'students',
      localField: 'student._id',
      foreignField: 'user',
      as: 'linkedStudentProfiles',
    },
  },
  {
    $addFields: {
      studentProfile: {
        $ifNull: [
          { $arrayElemAt: ['$directStudentProfile', 0] },
          { $arrayElemAt: ['$linkedStudentProfiles', 0] },
        ],
      },
    },
  },
  {
    $lookup: {
      from: 'classes',
      localField: '_classRef',
      foreignField: '_id',
      as: 'class',
    },
  },
  { $unwind: { path: '$class', preserveNullAndEmptyArrays: true } },
  {
    $lookup: {
      from: 'courses',
      let: { courseId: { $ifNull: ['$course', { $ifNull: ['$courseId', '$class.course'] }] } },
      pipeline: [{ $match: { $expr: { $eq: ['$_id', '$$courseId'] } } }],
      as: 'course',
    },
  },
  { $unwind: { path: '$course', preserveNullAndEmptyArrays: true } },
  {
    $lookup: {
      from: 'payments',
      let: { enrollmentId: '$_id' },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: [{ $ifNull: ['$enrollment', '$enrollmentId'] }, '$$enrollmentId'],
            },
          },
        },
        { $sort: { paymentDate: -1, createdAt: -1 } },
      ],
      as: 'payments',
    },
  },
  {
    $addFields: {
      latestPayment: { $arrayElemAt: ['$payments', 0] },
    },
  },
];

const buildEnrollmentFilters = (query: AuthRequest['query']): Record<string, unknown>[] => {
  const filters: Record<string, unknown>[] = [];
  const { status, paymentStatus, courseId, classId, search } = query;

  if (typeof status === 'string' && status) filters.push({ status });
  if (typeof classId === 'string' && classId) {
    if (!mongoose.isValidObjectId(classId)) throw createError('Mã lớp học không hợp lệ', 400);
    filters.push({ _classRef: new mongoose.Types.ObjectId(classId) });
  }
  if (typeof courseId === 'string' && courseId) {
    if (!mongoose.isValidObjectId(courseId)) throw createError('Mã khóa học không hợp lệ', 400);
    filters.push({ 'course._id': new mongoose.Types.ObjectId(courseId) });
  }
  if (typeof paymentStatus === 'string' && paymentStatus) {
    if (paymentStatus === 'NONE') {
      filters.push({ payments: { $size: 0 } });
    } else {
      filters.push({ 'payments.status': paymentStatus });
    }
  }
  if (typeof search === 'string' && search.trim()) {
    const pattern = new RegExp(escapeRegex(search.trim()), 'i');
    filters.push({
      $or: [
        { 'student.fullName': pattern },
        { 'student.email': pattern },
        { 'studentProfile.studentCode': pattern },
      ],
    });
  }
  return filters;
};

const buildResultPipeline = (
  filters: Record<string, unknown>[],
  page?: number,
  limit?: number
): PipelineStage[] => [
  ...enrollmentLookupPipeline,
  ...(filters.length ? [{ $match: { $and: filters } }] : []),
  { $sort: { registrationDate: -1, createdAt: -1 } },
  ...(page !== undefined && limit !== undefined ? [{ $skip: (page - 1) * limit }, { $limit: limit }] : []),
  {
    $project: {
      student: {
        _id: '$student._id',
        fullName: '$student.fullName',
        email: '$student.email',
        phone: '$student.phone',
      },
      studentProfile: {
        studentCode: '$studentProfile.studentCode',
        status: '$studentProfile.status',
        currentBand: '$studentProfile.currentBand',
        targetBand: '$studentProfile.targetBand',
        placementTestScore: '$studentProfile.placementTestScore',
        placementTestDate: '$studentProfile.placementTestDate',
        placementNotes: '$studentProfile.placementNotes',
      },
      course: {
        _id: '$course._id',
        code: '$course.code',
        title: '$course.title',
        tuitionFee: '$course.tuitionFee',
        entryLevel: '$course.entryLevel',
        targetLevel: '$course.targetLevel',
      },
      class: {
        _id: '$class._id',
        classCode: '$class.classCode',
        name: '$class.name',
        startDate: '$class.startDate',
        endDate: '$class.endDate',
      },
      registrationDate: { $ifNull: ['$registrationDate', { $ifNull: ['$enrollmentDate', '$registeredAt'] }] },
      status: 1,
      tuitionStatus: 1,
      payments: {
        $map: {
          input: '$payments',
          as: 'payment',
          in: {
            _id: '$$payment._id',
            amount: '$$payment.amount',
            method: { $ifNull: ['$$payment.method', '$$payment.paymentMethod'] },
            transactionCode: '$$payment.transactionCode',
            status: '$$payment.status',
            paymentDate: { $ifNull: ['$$payment.paymentDate', '$$payment.paidAt'] },
          },
        },
      },
      createdAt: 1,
    },
  },
];

export const getEnrollmentOptions = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [courses, classes, enrollmentCounts] = await Promise.all([
      Course.find().select('code title').sort({ title: 1 }).lean(),
      Class.find()
        .select('classCode name course status capacity currentEnrollment startDate endDate')
        .populate('course', 'code title')
        .sort({ classCode: 1 })
        .lean(),
      Enrollment.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
        { $match: { status: 'ENROLLED', class: { $exists: true, $ne: null } } },
        { $group: { _id: '$class', count: { $sum: 1 } } },
      ]),
    ]);
    const countsByClassId = new Map(enrollmentCounts.map(({ _id, count }) => [_id.toString(), count]));
    const classesWithEnrollmentCounts = classes.map((classItem) => ({
      ...classItem,
      currentEnrollment: countsByClassId.get(classItem._id.toString()) ?? 0,
    }));
    res.status(200).json({
      success: true,
      message: 'Lấy tùy chọn lọc ghi danh thành công',
      data: { courses, classes: classesWithEnrollmentCounts },
    });
  } catch (error) {
    next(error);
  }
};

export const getEnrollments = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = Math.max(1, Number.parseInt(String(req.query.page ?? '1'), 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(String(req.query.limit ?? '10'), 10) || 10));
    const filters = buildEnrollmentFilters(req.query);
    const [data, countResult] = await Promise.all([
      Enrollment.aggregate(buildResultPipeline(filters, page, limit)),
      Enrollment.aggregate([...enrollmentLookupPipeline, ...(filters.length ? [{ $match: { $and: filters } }] : []), { $count: 'total' }]),
    ]);
    const total = countResult[0]?.total ?? 0;

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách ghi danh thành công',
      data,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

export const getEnrollmentById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw createError('Mã ghi danh không hợp lệ', 400);
    const [enrollment] = await Enrollment.aggregate([
      ...enrollmentLookupPipeline,
      { $match: { _id: new mongoose.Types.ObjectId(req.params.id) } },
      ...buildResultPipeline([]).slice(enrollmentLookupPipeline.length),
    ]);

    if (!enrollment) {
      res.status(404).json({ success: false, message: 'Không tìm thấy ghi danh' });
      return;
    }

    const sourceEnrollment = await Enrollment.findById(enrollment._id).select('student').lean();
    if (sourceEnrollment?.student && enrollment.course?._id) {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const candidateClasses = await Class.find({
        course: enrollment.course._id,
        status: { $in: ['OPEN', 'IN_PROGRESS'] },
        endDate: { $gte: today },
      });
      const scheduleConflicts = await getStudentScheduleConflicts(
        sourceEnrollment.student,
        new Types.ObjectId(enrollment._id),
        candidateClasses
      );
      enrollment.scheduleConflictClassIds = scheduleConflicts.map((conflict) => conflict.classId);
    } else {
      enrollment.scheduleConflictClassIds = [];
    }

    res.status(200).json({ success: true, message: 'Lấy chi tiết ghi danh thành công', data: enrollment });
  } catch (error) {
    next(error);
  }
};

export const assignEnrollmentClass = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  let session: mongoose.ClientSession | undefined;
  try {
    const { id } = req.params;
    const { classId } = req.body as { classId?: string };
    if (!mongoose.isValidObjectId(id)) throw createError('Mã ghi danh không hợp lệ', 400);
    if (typeof classId !== 'string' || !mongoose.isValidObjectId(classId)) {
      throw createError('Mã lớp học không hợp lệ', 400);
    }

    const transactionSession = await mongoose.startSession();
    session = transactionSession;
    await transactionSession.withTransaction(async () => {
      const enrollment = await Enrollment.findById(id).session(transactionSession);
      if (!enrollment) throw createError('Không tìm thấy ghi danh', 404);
      if (enrollment.status === 'DROPPED' || enrollment.status === 'COMPLETED') {
        throw createError('Không thể xếp lớp cho ghi danh đã hủy hoặc hoàn thành', 409);
      }

      const hasSuccessPayment = await Payment.exists({
        $or: [{ enrollment: enrollment._id }, { enrollmentId: enrollment._id }],
        status: 'SUCCESS',
      }).session(transactionSession);
      const isPaid =
        (enrollment.tuitionStatus === 'PAID' || Boolean(hasSuccessPayment)) &&
        enrollment.tuitionStatus !== 'REFUNDED';
      if (!isPaid) {
        throw createError(
          'Học viên chưa thanh toán hoặc đang chờ thanh toán học phí nên không thể xếp lớp',
          409
        );
      }

      const currentClass = enrollment.class
        ? await Class.findById(enrollment.class).select('course').session(transactionSession)
        : null;
      const courseId = enrollment.course?.toString() || currentClass?.course?.toString();
      if (!courseId) throw createError('Không xác định được khóa học của ghi danh này', 409);

      const targetClass = await Class.findById(classId).session(transactionSession);
      if (!targetClass) throw createError('Không tìm thấy lớp học', 404);
      if (targetClass.course.toString() !== courseId) {
        throw createError('Chỉ được xếp học viên vào lớp thuộc khóa học đã đăng ký', 400);
      }

      const alreadyInTargetClass = currentClass?._id.toString() === targetClass._id.toString();
      if (alreadyInTargetClass && enrollment.status === 'ENROLLED') return;

      if (!alreadyInTargetClass && targetClass.status !== 'OPEN' && targetClass.status !== 'IN_PROGRESS') {
        throw createError('Chỉ có thể xếp vào lớp đang mở hoặc đang diễn ra', 409);
      }

      const targetEnrollmentCount = await Enrollment.countDocuments({
        class: targetClass._id,
        status: 'ENROLLED',
      }).session(transactionSession);
      if (targetEnrollmentCount >= targetClass.capacity) {
        throw createError('Lớp đã đầy hoặc không còn nhận học viên', 409);
      }

      if (!alreadyInTargetClass) {
        const duplicateEnrollment = await Enrollment.exists({
          student: enrollment.student,
          class: targetClass._id,
          _id: { $ne: enrollment._id },
        }).session(transactionSession);
        if (duplicateEnrollment) {
          throw createError('Học viên đã có ghi danh vào lớp này', 409);
        }
      }

      const scheduleConflicts = await getStudentScheduleConflicts(
        enrollment.student,
        enrollment._id,
        [targetClass],
        transactionSession
      );
      const scheduleConflict = scheduleConflicts[0];
      if (scheduleConflict) {
        throw createError(
          `Lịch học bị trùng với lớp ${scheduleConflict.conflictingClassCode} vào ${scheduleConflict.sessionDate} (${scheduleConflict.startTime} - ${scheduleConflict.endTime}, ${scheduleConflict.room})`,
          409
        );
      }

      await Class.updateOne(
        { _id: targetClass._id },
        { $set: { currentEnrollment: targetEnrollmentCount + 1 } },
        { session: transactionSession }
      );

      if (currentClass && !alreadyInTargetClass && enrollment.status === 'ENROLLED') {
        const currentEnrollmentCount = await Enrollment.countDocuments({
          class: currentClass._id,
          status: 'ENROLLED',
        }).session(transactionSession);
        await Class.updateOne(
          { _id: currentClass._id },
          { $set: { currentEnrollment: Math.max(0, currentEnrollmentCount - 1) } },
          { session: transactionSession }
        );
      }

      enrollment.class = targetClass._id;
      enrollment.course = targetClass.course;
      enrollment.status = 'ENROLLED';
      await enrollment.save({ session: transactionSession });
    });

    res.status(200).json({ success: true, message: 'Xếp lớp cho học viên thành công' });
  } catch (error) {
    next(error);
  } finally {
    await session?.endSession();
  }
};
