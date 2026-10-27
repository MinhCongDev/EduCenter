import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middlewares/auth.middleware';
import { createError } from '../middlewares/error.middleware';
import { Feedback } from '../models/feedback.model';
import { Enrollment } from '../models/enrollment.model';
import { Class } from '../models/class.model';
import { activeEnrollmentFilter } from '../utils/enrollment';

const isValidId = (id: string): boolean => mongoose.Types.ObjectId.isValid(id);

// =====================================================
//  GET /api/student/classes/:id/feedback
//  Phản hồi của học viên về lớp học (do học viên gửi).
//  Học viên chỉ xem được phản hồi của chính mình.
// =====================================================
export const getMyClassFeedback = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) throw createError('Chưa xác thực', 401);
    const { id } = req.params;
    if (!isValidId(id)) throw createError('ID lớp học không hợp lệ', 400);

    const enrolled = await Enrollment.exists({
      student: user._id,
      class: id,
      ...activeEnrollmentFilter(),
    });
    if (!enrolled) throw createError('Bạn chưa đăng ký lớp học này', 403);

    const items = await Feedback.find({ sender: user._id, class: id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Lấy phản hồi thành công',
      data: { items },
    });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy phản hồi',
    });
  }
};

// =====================================================
//  POST /api/student/classes/:id/feedback
//  Học viên gửi phản hồi / đánh giá về lớp học.
//
//  Quy tắc nghiệp vụ:
//   - Chỉ học viên đang theo học lớp đó mới được gửi.
//   - Mỗi học viên chỉ được gửi 1 phản hồi cho mỗi lớp (có thể cập nhật).
//   - Đánh giá 1-5 sao, nội dung tối thiểu 5 ký tự.
// =====================================================
export const submitClassFeedback = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) throw createError('Chưa xác thực', 401);
    const { id } = req.params;
    if (!isValidId(id)) throw createError('ID lớp học không hợp lệ', 400);

    const enrolled = await Enrollment.exists({
      student: user._id,
      class: id,
      ...activeEnrollmentFilter(),
    });
    if (!enrolled) throw createError('Bạn chưa đăng ký lớp học này', 403);

    const { content, rating, tags } = req.body || {};

    const text = String(content || '').trim();
    if (text.length < 5) {
      throw createError('Nội dung phản hồi phải có ít nhất 5 ký tự', 400);
    }
    if (text.length > 1000) {
      throw createError('Nội dung phản hồi không được vượt quá 1000 ký tự', 400);
    }

    const score = Number(rating);
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      throw createError('Đánh giá phải từ 1 đến 5 sao', 400);
    }

    const cleanTags = Array.isArray(tags)
      ? tags
          .map((t: any) => String(t || '').trim())
          .filter((t: string) => t.length > 0)
          .slice(0, 6)
      : [];

    // 1 phản hồi / 1 lớp / 1 học viên — nếu đã có thì cập nhật.
    const existing = await Feedback.findOne({ sender: user._id, class: id });
    let feedback;
    if (existing) {
      existing.content = text;
      existing.rating = score;
      existing.tags = cleanTags;
      await existing.save();
      feedback = existing;
    } else {
      feedback = await Feedback.create({
        sender: user._id,
        class: id,
        content: text,
        rating: score,
        tags: cleanTags,
      });
    }

    res.status(existing ? 200 : 201).json({
      success: true,
      message: existing
        ? 'Đã cập nhật phản hồi của bạn'
        : 'Cảm ơn bạn đã gửi phản hồi!',
      data: { feedback },
    });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    if (error.name === 'ValidationError') {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi gửi phản hồi',
    });
  }
};

// =====================================================
//  GET /api/staff/feedback
//  Phòng giáo vụ xem toàn bộ phản hồi của học viên + thống kê.
//
//  Trước đây model `Feedback` có sẵn nhưng không có API nào dùng → tính
//  năng thu thập ý kiến học viên không hoạt động.
// =====================================================
export const getAllFeedback = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { classId, minRating, page = '1', limit = '20' } = req.query;

    const query: any = {};
    // Ép về ObjectId: trong aggregation `$match`, so sánh chuỗi với field
    // ObjectId không bao giờ khớp → thống kê "theo lớp" luôn rỗng khi lọc.
    if (classId && typeof classId === 'string' && isValidId(classId)) {
      query.class = new mongoose.Types.ObjectId(classId);
    }
    if (minRating && typeof minRating === 'string') {
      const r = Number(minRating);
      if (!Number.isNaN(r)) query.rating = { $gte: r };
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(Math.max(1, Number(limit) || 20), 100);
    const skip = (pageNum - 1) * limitNum;

    const [items, total, agg] = await Promise.all([
      Feedback.find(query)
        .populate('sender', 'fullName email avatarUrl')
        .populate('class', 'classCode')
        .populate('course', 'code title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Feedback.countDocuments(query),
      Feedback.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$class',
            avgRating: { $avg: '$rating' },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const overall = agg.length
      ? agg.reduce((s: number, a: any) => s + a.avgRating * a.count, 0) /
        agg.reduce((s: number, a: any) => s + a.count, 0)
      : 0;

    // Tên/mã lớp cho từng nhóm để UI hiển thị được (chỉ cần _id thì UI
    // không biết nhóm đó là lớp nào).
    const classIdsForStats = agg.map((a: any) => a._id).filter(Boolean);
    const classDocs = await Class.find({ _id: { $in: classIdsForStats } }).select('classCode');
    const classCodeMap = new Map<string, string>(
      classDocs.map((c: any) => [c._id.toString(), c.classCode])
    );

    res.json({
      success: true,
      message: 'Lấy danh sách phản hồi thành công',
      data: { items },
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
      stats: {
        total,
        avgRating: Number(overall.toFixed(2)),
        byClass: agg.map((a: any) => ({
          classId: a._id,
          classCode: classCodeMap.get(a._id?.toString()) || '',
          avgRating: Number(a.avgRating.toFixed(2)),
          count: a.count,
        })),
      },
    });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy danh sách phản hồi',
    });
  }
};

// =====================================================
//  GET /api/staff/feedback/:classId/summary
//  Tổng hợp điểm đánh giá theo lớp (dùng cho báo cáo giáo vụ).
// =====================================================
export const getClassFeedbackSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { classId } = req.params;
    if (!isValidId(classId)) throw createError('ID lớp học không hợp lệ', 400);

    const cls = await Class.findById(classId).select('classCode');
    if (!cls) throw createError('Không tìm thấy lớp học', 404);

    const [agg, distribution] = await Promise.all([
      Feedback.aggregate([
        { $match: { class: new mongoose.Types.ObjectId(classId) } },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
            count: { $sum: 1 },
          },
        },
      ]),
      Feedback.aggregate([
        { $match: { class: new mongoose.Types.ObjectId(classId) } },
        { $group: { _id: '$rating', count: { $sum: 1 } } },
      ]),
    ]);

    const summary = agg[0] || { avgRating: 0, count: 0 };

    res.json({
      success: true,
      message: 'Lấy tổng hợp phản hồi thành công',
      data: {
        class: { _id: cls._id, classCode: cls.classCode },
        avgRating: Number((summary.avgRating || 0).toFixed(2)),
        count: summary.count,
        distribution: [5, 4, 3, 2, 1].map((star) => ({
          star,
          count: distribution.find((d: any) => d._id === star)?.count || 0,
        })),
      },
    });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy tổng hợp phản hồi',
    });
  }
};
