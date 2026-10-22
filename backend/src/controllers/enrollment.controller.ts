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
      },
      course: {
        _id: '$course._id',
        code: '$course.code',
        title: '$course.title',
        tuitionFee: '$course.tuitionFee',
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
    const [courses, classes] = await Promise.all([
      Course.find().select('code title').sort({ title: 1 }).lean(),
      Class.find().select('classCode name course').populate('course', 'code title').sort({ classCode: 1 }).lean(),
    ]);
    res.status(200).json({
      success: true,
      message: 'Lấy tùy chọn lọc ghi danh thành công',
      data: { courses, classes },
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
