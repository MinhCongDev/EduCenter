import { Request, Response } from 'express';
import { Center } from '../models/center.model';

const DEFAULT_CENTER_DATA = {
  name: 'EduCenter IELTS Academy',
  slogan: 'Học viện Luyện thi IELTS 8.0+ Chuẩn Khảo thí Quốc tế',
  introduction:
    'EduCenter là tổ chức đào tạo tiếng Anh học thuật và luyện thi IELTS hàng đầu Việt Nam, đối tác đối tác khảo thí chính thức của IDP và British Council. Với phương pháp giảng dạy độc quyền, đội ngũ 100% giảng viên 8.5 - 9.0 IELTS và hợp đồng cam kết đầu ra bằng văn bản, EduCenter tự hào đã đồng hành cùng hơn 50.000 học viên chinh phục mục tiêu xét tuyển thẳng đại học, du học và định cư toàn cầu.',
  vision: 'Trở thành học viện đào tạo và khảo thí IELTS số 1 tại Đông Nam Á về chất lượng đào tạo và tỷ lệ học viên đạt điểm cao.',
  mission: 'Kiến tạo môi trường học tập tiếng Anh chuẩn học thuật quốc tế, giúp học viên Việt Nam tự tin hội nhập thế giới.',
  hotline: '1900 6868 - 0988 123 456',
  email: 'contact@educenter.edu.vn',
  workingHours: 'Thứ 2 - Chủ Nhật: 08:00 - 21:30',
  address: 'Tòa nhà EduCenter Tower, 128 Cầu Giấy, TP. Hà Nội',
  branches: [
    {
      branchName: 'Cơ sở 1 (Trụ sở chính - Cầu Giấy)',
      address: 'EduCenter Tower, 128 Cầu Giấy, Q. Cầu Giấy, Hà Nội',
      phone: '024 3789 6868',
      isHeadquarters: true,
    },
    {
      branchName: 'Cơ sở 2 (Đống Đa)',
      address: 'Số 254 Tây Sơn, P. Trung Liệt, Q. Đống Đa, Hà Nội',
      phone: '024 3789 6869',
      isHeadquarters: false,
    },
    {
      branchName: 'Cơ sở 3 (Bách Khoa - Hai Bà Trưng)',
      address: 'Số 86 Lê Thanh Nghị, P. Đồng Tâm, Q. Hai Bà Trưng, Hà Nội',
      phone: '024 3789 6870',
      isHeadquarters: false,
    },
    {
      branchName: 'Cơ sở 4 (Quận 1 - TP. Hồ Chí Minh)',
      address: 'Tòa nhà Bitexco Nam, 180 Nguyễn Thị Minh Khai, P. 6, Q. 1, TP. HCM',
      phone: '028 3988 6868',
      isHeadquarters: false,
    },
    {
      branchName: 'Cơ sở 5 (Quận 10 - TP. Hồ Chí Minh)',
      address: 'Số 387 Sư Vạn Hạnh, P. 12, Q. 10, TP. HCM',
      phone: '028 3988 6869',
      isHeadquarters: false,
    },
  ],
  facilities: [
    {
      name: 'Phòng thi thử IELTS trên máy tính (Computer-delivered IELTS Lab)',
      description: 'Hệ thống 60 máy tính cấu hình cao màn hình 24-inch, tai nghe chống ồn chủ động chuyên dụng chuẩn định dạng IDP & British Council.',
      imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop',
    },
    {
      name: 'Phòng thi Mock Speaking 1:1 cách âm tiêu chuẩn phòng thu Studio',
      description: 'Không gian riêng tư mô phỏng chân thực 100% không khí phòng thi vấn đáp cùng giảng viên hoặc cựu giám khảo chấm thi.',
      imageUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=800&auto=format&fit=crop',
    },
    {
      name: 'Thư viện học thuật IELTS & Không gian Co-working tự học',
      description: 'Kho tài liệu độc quyền Cambridge IELTS 10-19, hơn 1.000 đầu sách ngoại văn, trà bánh miễn phí mở cửa từ 8h - 22h hàng ngày.',
      imageUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=800&auto=format&fit=crop',
    },
    {
      name: 'Phòng học tương tác thông minh (Smart Classrooms)',
      description: 'Màn hình cảm ứng 86-inch 4K, hệ thống âm thanh vòm giảng đường và camera trực tuyến phục vụ ghi hình bài học.',
      imageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=800&auto=format&fit=crop',
    },
  ],
  achievements: [
    { label: 'Học viên đạt Target 6.5 - 8.5', value: '50.000+', icon: '🎓' },
    { label: 'Giảng viên đạt 8.5 - 9.0 IELTS', value: '100%', icon: '👨‍🏫' },
    { label: 'Năm kinh nghiệm đào tạo học thuật', value: '11 Năm', icon: '⭐' },
    { label: 'Đối tác khảo thí Kim Cương IDP & BC', value: 'Top 1', icon: '🏆' },
  ],
  socialLinks: {
    facebook: 'https://facebook.com/educenter.ielts',
    youtube: 'https://youtube.com/@educenter.ielts',
    tiktok: 'https://tiktok.com/@educenter.ielts',
    website: 'https://educenter.edu.vn',
  },
};

/**
 * View Center Information
 * GET /api/center
 */
export const getCenterInfo = async (_req: Request, res: Response): Promise<void> => {
  try {
    let center = await Center.findOne();
    if (!center) {
      center = await Center.create(DEFAULT_CENTER_DATA);
    }

    res.status(200).json({
      success: true,
      message: 'Lấy thông tin trung tâm thành công',
      data: center,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy thông tin trung tâm',
    });
  }
};

/**
 * Update Center Information (Director/Staff)
 * PUT /api/center
 */
export const updateCenterInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    let center = await Center.findOne();
    if (!center) {
      center = await Center.create({ ...DEFAULT_CENTER_DATA, ...req.body });
    } else {
      Object.assign(center, req.body);
      await center.save();
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin trung tâm thành công',
      data: center,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi cập nhật thông tin trung tâm',
    });
  }
};
