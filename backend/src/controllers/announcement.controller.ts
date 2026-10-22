import { Request, Response } from 'express';
import { Announcement } from '../models/announcement.model';
import { AuthRequest } from '../middlewares/auth.middleware';

/**
 * UC06: View Announcements
 * GET /api/announcements
 */
export const getAnnouncements = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, category, audience, page = 1, limit = 20 } = req.query;

    const query: any = { status: 'PUBLISHED' };

    if (search && typeof search === 'string' && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: regex }, { content: regex }, { summary: regex }];
    }

    if (category && typeof category === 'string' && category !== 'ALL') {
      query.category = category;
    }

    if (audience && typeof audience === 'string' && audience !== 'ALL') {
      query.targetAudience = { $in: ['ALL', audience] };
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const [announcements, total] = await Promise.all([
      Announcement.find(query)
        .populate('author', 'fullName role avatarUrl')
        .sort({ isPinned: -1, publicationDate: -1 })
        .skip(skip)
        .limit(limitNum),
      Announcement.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách thông báo thành công',
      data: announcements,
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
      message: error.message || 'Lỗi server khi lấy danh sách thông báo',
    });
  }
};

/**
 * View Announcement Detail
 * GET /api/announcements/:id
 */
export const getAnnouncementById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate('author', 'fullName role avatarUrl');

    if (!announcement) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Lấy chi tiết thông báo thành công',
      data: announcement,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy chi tiết thông báo',
    });
  }
};

/**
 * Create Announcement (Staff/Director)
 * POST /api/announcements
 */
export const createAnnouncement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, content, summary, category, targetAudience, isPinned, imageUrl } = req.body;

    if (!title || !content) {
      res.status(400).json({
        success: false,
        message: 'Tiêu đề và nội dung thông báo là bắt buộc',
      });
      return;
    }

    const announcement = await Announcement.create({
      title,
      content,
      summary: summary || '',
      author: req.user?._id,
      category: category || 'Chung',
      targetAudience: targetAudience || 'ALL',
      isPinned: isPinned || false,
      imageUrl: imageUrl || '',
      status: 'PUBLISHED',
      publicationDate: new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Tạo thông báo thành công',
      data: announcement,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi tạo thông báo',
    });
  }
};

/**
 * Update Announcement (Staff/Director)
 * PUT /api/announcements/:id
 */
export const updateAnnouncement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, content, summary, category, targetAudience, isPinned, imageUrl, status } = req.body;

    const announcement = await Announcement.findByIdAndUpdate(
      id,
      {
        ...(title && { title }),
        ...(content && { content }),
        ...(summary !== undefined && { summary }),
        ...(category && { category }),
        ...(targetAudience && { targetAudience }),
        ...(isPinned !== undefined && { isPinned }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(status && { status }),
      },
      { new: true }
    );

    if (!announcement) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật thông báo thành công',
      data: announcement,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi cập nhật thông báo',
    });
  }
};

/**
 * Delete Announcement (Staff/Director)
 * DELETE /api/announcements/:id
 */
export const deleteAnnouncement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findByIdAndDelete(id);

    if (!announcement) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo để xóa',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Xóa thông báo thành công',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi xóa thông báo',
    });
  }
};
