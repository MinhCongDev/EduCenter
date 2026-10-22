import { Request, Response } from 'express';
import { Course } from '../models/course.model';
import { Class } from '../models/class.model';

/**
 * View Courses List
 * Search Courses
 * Filter Courses
 * GET /api/courses
 */
export const getCourses = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      search,
      level,
      category,
      format,
      status,
      minPrice,
      maxPrice,
      sortBy = 'newest',
      page = 1,
      limit = 20,
    } = req.query;

    const query: any = {};
    if (status && status !== 'ALL') {
      query.status = status;
    } else if (!status) {
      query.status = 'ACTIVE';
    }

    // Search Courses by keyword
    if (search && typeof search === 'string' && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { code: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
        { entryLevel: searchRegex },
        { targetLevel: searchRegex },
      ];
    }

    // Filter Courses
    if (level && typeof level === 'string' && level !== 'ALL') {
      query.$or = [
        ...(query.$or || []),
        { entryLevel: new RegExp(level, 'i') },
        { targetLevel: new RegExp(level, 'i') },
      ];
    }

    if (category && typeof category === 'string' && category !== 'ALL') {
      query.category = new RegExp(category, 'i');
    }

    if (format && typeof format === 'string' && format !== 'ALL') {
      query.format = format.toUpperCase();
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.tuitionFee = {};
      if (minPrice !== undefined && !isNaN(Number(minPrice))) {
        query.tuitionFee.$gte = Number(minPrice);
      }
      if (maxPrice !== undefined && !isNaN(Number(maxPrice))) {
        query.tuitionFee.$lte = Number(maxPrice);
      }
    }

    // Sorting
    let sortOptions: any = { createdAt: -1 };
    if (sortBy === 'price_asc') {
      sortOptions = { tuitionFee: 1 };
    } else if (sortBy === 'price_desc') {
      sortOptions = { tuitionFee: -1 };
    } else if (sortBy === 'duration') {
      sortOptions = { durationWeeks: 1 };
    } else if (sortBy === 'title') {
      sortOptions = { title: 1 };
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const [courses, total] = await Promise.all([
      Course.find(query).sort(sortOptions).skip(skip).limit(limitNum),
      Course.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách khóa học thành công',
      data: courses,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy danh sách khóa học',
    });
  }
};

/**
 * View Courses Detail
 * GET /api/courses/:id
 */
export const getCourseById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Search by ID or by Course Code
    let course;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      course = await Course.findById(id);
    } else {
      course = await Course.findOne({ code: id.toUpperCase() });
    }

    if (!course) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin khóa học',
      });
      return;
    }

    // Also fetch upcoming / active classes for this course
    const classes = await Class.find({
      course: course._id,
      status: { $in: ['OPEN', 'IN_PROGRESS'] },
    })
      .populate('teacher', 'fullName email avatarUrl phone')
      .lean();

    res.status(200).json({
      success: true,
      message: 'Lấy chi tiết khóa học thành công',
      data: {
        ...course.toObject(),
        classes,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy chi tiết khóa học',
    });
  }
};

/**
 * Create Course (Staff/Director)
 * POST /api/courses
 */
export const createCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, title } = req.body;
    if (!code || !title) {
      res.status(400).json({
        success: false,
        message: 'Mã khóa học và tên khóa học là bắt buộc',
      });
      return;
    }

    const existing = await Course.findOne({ code: code.toUpperCase() });
    if (existing) {
      res.status(400).json({
        success: false,
        message: 'Mã khóa học đã tồn tại trong hệ thống',
      });
      return;
    }

    const course = await Course.create({
      ...req.body,
      code: code.toUpperCase(),
    });

    res.status(201).json({
      success: true,
      message: 'Tạo khóa học mới thành công',
      data: course,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi tạo khóa học',
    });
  }
};

/**
 * Update Course (Staff/Director)
 * PUT /api/courses/:id
 */
export const updateCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      ...(req.body.code ? { code: req.body.code.toUpperCase() } : {}),
    };

    const course = await Course.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    if (!course) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy khóa học cần cập nhật',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật khóa học thành công',
      data: course,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi cập nhật khóa học',
    });
  }
};

/**
 * Delete Course (Director)
 * DELETE /api/courses/:id
 */
export const deleteCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const course = await Course.findByIdAndDelete(id);

    if (!course) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy khóa học để xóa',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Xóa khóa học thành công',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi xóa khóa học',
    });
  }
};
