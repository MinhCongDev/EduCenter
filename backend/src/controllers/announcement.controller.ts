import { Request, Response } from 'express';
import { Announcement } from '../models/announcement.model';
import { AuthRequest } from '../middlewares/auth.middleware';
import { User } from '../models/user.model';
import { notifyMany } from '../services/notification.service';

/**
 * View Announcements
 * GET /api/announcements
 */
export const getAnnouncements = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, category, audience, status, page = 1, limit = 20 } = req.query;

    const query: any = {};

    if (status && status !== 'ALL') {
      query.status = status;
    } else if (!status) {
      query.status = 'PUBLISHED';
    }

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

    // ── Gửi thông báo tới người nhận phù hợp ──
    // Thông báo trên trang public chỉ hiện khi học viên chủ động vào xem —
    // học viên không biết thông báo mới đã có. Gửi qua hệ thống Notification
    // để chuông thông báo hiện ngay cho đúng nhóm đối tượng.
    const audience = announcement.targetAudience;
    const roleMap: Record<string, string[]> = {
      ALL: ['STUDENT', 'TEACHER', 'TRAINING_STAFF', 'DIRECTOR'],
      STUDENTS: ['STUDENT'],
      TEACHERS: ['TEACHER'],
      STAFF: ['TRAINING_STAFF', 'DIRECTOR'],
    };
    const roles = roleMap[audience] || roleMap.ALL;

    const recipients = await User.find({
      role: { $in: roles },
      status: 'ACTIVE',
    }).select('_id');

    if (recipients.length) {
      await notifyMany(
        recipients.map((u) => u._id),
        {
          type: 'CLASS_ANNOUNCEMENT',
          title: `📢 ${announcement.title}`,
          message:
            announcement.summary ||
            announcement.content?.slice(0, 200) ||
            'Trung tâm vừa đăng thông báo mới.',
          link: '/announcements',
        }
      );
    }

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
    const { title, content, summary, category, targetAudience, isPinned, status, imageUrl } = req.body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (content !== undefined) updateData.content = content;
    if (summary !== undefined) updateData.summary = summary ? summary.trim() : '';
    if (category !== undefined) updateData.category = category;
    if (targetAudience !== undefined) updateData.targetAudience = targetAudience;
    if (isPinned !== undefined) updateData.isPinned = Boolean(isPinned);
    if (status !== undefined) updateData.status = status;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

    const updated = await Announcement.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('author', 'fullName role avatarUrl');

    if (!updated) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo cần sửa',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật thông báo thành công!',
      data: updated,
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
export const deleteAnnouncement = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = _req.params;
    const deleted = await Announcement.findByIdAndDelete(id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo cần xóa',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Đã xóa thông báo thành công!',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi xóa thông báo',
    });
  }
};
