import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Class } from '../models/class.model';
import { Course } from '../models/course.model';

export const publicRouter = Router();

const isValidId = (id: string): boolean => mongoose.Types.ObjectId.isValid(id);

/**
 * @route   GET /api/public/classes
 * @desc    List all OPEN/IN_PROGRESS classes (public catalog)
 * @access  Public
 */
publicRouter.get('/classes', async (_req: Request, res: Response) => {
  try {
    const classes = await Class.find({ status: { $in: ['OPEN', 'IN_PROGRESS'] } })
      .populate('course', 'code title description category durationWeeks tuitionFee')
      .populate('teacher', 'fullName email avatarUrl')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Lấy danh sách lớp công khai thành công',
      data: { classes, total: classes.length },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message || 'Lỗi server khi lấy danh sách lớp',
    });
  }
});

/**
 * @route   GET /api/public/classes/:id
 * @desc    Public class detail
 * @access  Public
 */
publicRouter.get('/classes/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      res.status(400).json({ success: false, message: 'ID lớp học không hợp lệ' });
      return;
    }
    const cls = await Class.findById(id)
      .populate('course', 'code title description category durationWeeks tuitionFee sessions')
      .populate('teacher', 'fullName email phone avatarUrl');
    if (!cls) {
      res.status(404).json({ success: false, message: 'Không tìm thấy lớp học' });
      return;
    }
    res.json({
      success: true,
      message: 'Lấy chi tiết lớp học thành công',
      data: { class: cls },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message || 'Lỗi server khi lấy chi tiết lớp học',
    });
  }
});

/**
 * @route   GET /api/public/courses
 * @desc    List all ACTIVE courses
 * @access  Public
 */
publicRouter.get('/courses', async (_req: Request, res: Response) => {
  try {
    const courses = await Course.find({ status: 'ACTIVE' }).sort({ createdAt: -1 });
    res.json({
      success: true,
      message: 'Lấy danh sách khóa học thành công',
      data: { courses, total: courses.length },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message || 'Lỗi server khi lấy danh sách khóa học',
    });
  }
});
