import { Response, NextFunction } from 'express';
import mongoose, { PipelineStage } from 'mongoose';
import { AuthRequest } from '../middlewares/auth.middleware';
import { createError } from '../middlewares/error.middleware';
import { Class } from '../models/class.model';
import { Course } from '../models/course.model';
import { Enrollment } from '../models/enrollment.model';

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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
