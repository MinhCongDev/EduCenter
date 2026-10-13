import { Response, NextFunction } from 'express';
import { Course } from '../models/course.model';
import { AuthRequest } from '../middlewares/auth.middleware';

// ===========================
// GET /api/courses
// Public – list all courses (with optional filters)
// ===========================
export const getCourses = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, category, search, page = '1', limit = '20' } = req.query;

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [courses, total] = await Promise.all([
      Course.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Course.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách khóa học thành công',
      data: courses,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ===========================
// GET /api/courses/:id
// ===========================
export const getCourseById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      res.status(404).json({ success: false, message: 'Không tìm thấy khóa học' });
      return;
    }
    res.status(200).json({ success: true, message: 'OK', data: course });
  } catch (error) {
    next(error);
  }
};

// ===========================
// POST /api/courses
// Staff / Director only
// ===========================
export const createCourse = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { code, title, description, category, durationWeeks, tuitionFee, status, syllabus } = req.body;

    const existing = await Course.findOne({ code: code?.toUpperCase() });
    if (existing) {
      res.status(409).json({ success: false, message: 'Mã khóa học đã tồn tại' });
      return;
    }

    const course = await Course.create({
      code,
      title,
      description,
      category,
      durationWeeks,
      tuitionFee,
      status,
      syllabus,
    });

    res.status(201).json({ success: true, message: 'Tạo khóa học thành công', data: course });
  } catch (error) {
    next(error);
  }
};

// ===========================
// PUT /api/courses/:id
// Staff / Director only
// ===========================
export const updateCourse = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      res.status(404).json({ success: false, message: 'Không tìm thấy khóa học' });
      return;
    }

    const { code, title, description, category, durationWeeks, tuitionFee, status, syllabus } = req.body;

    // If code changed, check uniqueness
    if (code && code.toUpperCase() !== course.code) {
      const existing = await Course.findOne({ code: code.toUpperCase() });
      if (existing) {
        res.status(409).json({ success: false, message: 'Mã khóa học đã tồn tại' });
        return;
      }
    }

    Object.assign(course, { code, title, description, category, durationWeeks, tuitionFee, status, syllabus });
    await course.save();

    res.status(200).json({ success: true, message: 'Cập nhật khóa học thành công', data: course });
  } catch (error) {
    next(error);
  }
};

// ===========================
// DELETE /api/courses/:id
// Staff / Director only
// ===========================
export const deleteCourse = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      res.status(404).json({ success: false, message: 'Không tìm thấy khóa học' });
      return;
    }

    await course.deleteOne();
    res.status(200).json({ success: true, message: 'Xóa khóa học thành công' });
  } catch (error) {
    next(error);
  }
};
