import { Response, NextFunction } from 'express';
import { Class } from '../models/class.model';
import { Course } from '../models/course.model';
import { User } from '../models/user.model';
import { Enrollment } from '../models/enrollment.model';
import { AuthRequest } from '../middlewares/auth.middleware';
import { createError } from '../middlewares/error.middleware';

const classPopulate = [
  { path: 'course', select: 'code title' },
  { path: 'teacher', select: 'fullName email' },
];

const validateAssignments = async (courseId?: string, teacherId?: string): Promise<void> => {
  if (courseId) {
    const course = await Course.findOne({ _id: courseId, status: 'ACTIVE' });
    if (!course) throw createError('Không tìm thấy khóa học đang hoạt động', 400);
  }

  if (teacherId) {
    const teacher = await User.findOne({ _id: teacherId, role: 'TEACHER', status: 'ACTIVE' });
    if (!teacher) throw createError('Không tìm thấy giảng viên đang hoạt động', 400);
  }
};

export const getClassOptions = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [courses, teachers] = await Promise.all([
      Course.find({ status: 'ACTIVE' }).select('code title').sort({ title: 1 }),
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

    await validateAssignments(course, teacher);
    const created = await Class.create({ ...classData, classCode: normalizedCode, course, teacher });
    const classroom = await Class.findById(created._id).populate(classPopulate);
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

    await validateAssignments(course, teacher);
    Object.assign(classroom, classData);
    if (course) classroom.course = course;
    if (teacher) classroom.teacher = teacher;
    await classroom.save();

    const updated = await Class.findById(classroom._id).populate(classPopulate);
    res.status(200).json({ success: true, message: 'Cập nhật lớp học thành công', data: updated });
  } catch (error) {
    next(error);
  }
};

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

    await classroom.deleteOne();
    res.status(200).json({ success: true, message: 'Xóa lớp học thành công' });
  } catch (error) {
    next(error);
  }
};
