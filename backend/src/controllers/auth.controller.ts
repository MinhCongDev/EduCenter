import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { User } from '../models/user.model';
import { Student } from '../models/student.model';
import { config } from '../config';
import { AuthRequest } from '../middlewares/auth.middleware';
import { buildAvatarUrl } from '../middlewares/upload.middleware';

const generateToken = (userId: string, role: string): string => {
  return jwt.sign({ id: userId, role }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as any,
  });
};

/**
 * UC08: Register Account
 * POST /api/auth/register
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, fullName, phone, address, dob } = req.body;

    if (!email || !password || !fullName) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ email, mật khẩu và họ tên',
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có độ dài tối thiểu 6 ký tự',
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        message: 'Địa chỉ email không đúng định dạng',
      });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'Email này đã được đăng ký trong hệ thống',
      });
      return;
    }

    const user = await User.create({
      email: email.toLowerCase(),
      password,
      fullName: fullName.trim(),
      phone: phone?.trim() || '',
      address: address?.trim() || '',
      dob: dob ? new Date(dob) : undefined,
      role: 'STUDENT',
      status: 'ACTIVE',
    });

    // Create student profile record automatically
    try {
      const studentCode = `STU${Date.now().toString().slice(-6)}`;
      await Student.create({
        user: user._id,
        studentCode,
        dob: dob ? new Date(dob) : undefined,
        status: 'ACTIVE',
      });
    } catch (e) {
      // Non-fatal if student profile creation fails
    }

    const token = generateToken(user._id.toString(), user.role);

    const userResponse = {
      _id: user._id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      address: user.address,
      dob: user.dob,
      role: user.role,
      status: user.status,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công',
      data: {
        user: userResponse,
        token,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi đăng ký',
    });
  }
};

/**
 * UC09: Log In
 * POST /api/auth/login
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng nhập email và mật khẩu',
      });
      return;
    }

    const cleanEmail = email ? email.toString().trim().toLowerCase() : '';
    const user = await User.findOne({ email: cleanEmail }).select('+password');
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không chính xác',
      });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không chính xác',
      });
      return;
    }

    if (user.status !== 'ACTIVE') {
      res.status(403).json({
        success: false,
        message: 'Tài khoản của bạn đã bị khóa hoặc ngừng hoạt động',
      });
      return;
    }

    const token = generateToken(user._id.toString(), user.role);

    const userResponse = {
      _id: user._id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      address: user.address,
      dob: user.dob,
      role: user.role,
      status: user.status,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        user: userResponse,
        token,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi đăng nhập',
    });
  }
};

/**
 * Get current authenticated user
 * GET /api/auth/me
 */
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Chưa xác thực',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy thông tin tài khoản',
    });
  }
};

/**
 * UC07: Upload Avatar (multipart)
 * POST /api/auth/avatar
 * FormData: avatar=<file>
 */
export const uploadAvatar = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Vui lòng đăng nhập' });
      return;
    }
    const file = (req as any).file;
    if (!file) {
      res.status(400).json({ success: false, message: 'Vui lòng chọn file ảnh' });
      return;
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });
      return;
    }

    // Delete old avatar file (if it was an uploaded one)
    if (user.avatarUrl && user.avatarUrl.includes('/uploads/avatars/')) {
      try {
        const oldFilename = user.avatarUrl.split('/uploads/avatars/')[1];
        const oldPath = path.join(process.cwd(), 'uploads', 'avatars', oldFilename);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      } catch (_) {
        // Non-fatal
      }
    }

    const url = buildAvatarUrl(req, file.filename);
    user.avatarUrl = url;
    await user.save();

    const userResponse = {
      _id: user._id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      address: user.address,
      dob: user.dob,
      role: user.role,
      status: user.status,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.status(200).json({
      success: true,
      message: 'Cập nhật ảnh đại diện thành công',
      data: { user: userResponse },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi upload ảnh đại diện',
    });
  }
};

/**
 * UC07: Update Personal Information
 * PUT /api/auth/profile
 */
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để cập nhật thông tin',
      });
      return;
    }

    const { fullName, phone, address, dob, avatarUrl } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản người dùng',
      });
      return;
    }

    if (fullName) user.fullName = fullName.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (address !== undefined) user.address = address.trim();
    if (dob) user.dob = new Date(dob);
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl.trim();

    await user.save();

    // If student, also sync DOB
    if (user.role === 'STUDENT' && dob) {
      await Student.updateOne({ user: user._id }, { dob: new Date(dob) });
    }

    const userResponse = {
      _id: user._id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      address: user.address,
      dob: user.dob,
      role: user.role,
      status: user.status,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin cá nhân thành công',
      data: {
        user: userResponse,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi cập nhật thông tin cá nhân',
    });
  }
};

/**
 * UC10: Change Password
 * POST /api/auth/change-password
 */
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để đổi mật khẩu',
      });
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới',
      });
      return;
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      res.status(400).json({
        success: false,
        message: 'Xác nhận mật khẩu mới không khớp',
      });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có tối thiểu 6 ký tự',
      });
      return;
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản người dùng',
      });
      return;
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      res.status(400).json({
        success: false,
        message: 'Mật khẩu hiện tại không chính xác',
      });
      return;
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Đổi mật khẩu thành công. Vui lòng sử dụng mật khẩu mới cho các lần đăng nhập sau.',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi đổi mật khẩu',
    });
  }
};

/**
 * UC11: Forgot Password - Request Reset Code / Token
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng nhập địa chỉ email đã đăng ký',
      });
      return;
    }

    const cleanEmail = email ? email.toString().trim().toLowerCase() : '';
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      // Don't disclose if user doesn't exist for security, but return generic success or standard notice
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản nào gắn với email này',
      });
      return;
    }

    // Generate 6-digit verification code or token
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedCode = crypto.createHash('sha256').update(resetCode).digest('hex');

    user.resetPasswordToken = hashedCode;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry
    await user.save();

    // In production, an email would be sent. For this system/demo, we return the reset code in the response
    // so user can easily test and complete the verification immediately without external mail SMTP dependencies.
    res.status(200).json({
      success: true,
      message: 'Mã xác nhận đặt lại mật khẩu đã được tạo (hiệu lực trong 15 phút).',
      data: {
        email: user.email,
        resetCode, // Provided for instant demo verification
        expiresInMinutes: 15,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi yêu cầu quên mật khẩu',
    });
  }
};

/**
 * UC11: Reset Password - Verify Code and Update Password
 * POST /api/auth/reset-password
 */
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, resetCode, newPassword } = req.body;

    if (!email || !resetCode || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ email, mã xác nhận và mật khẩu mới',
      });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có tối thiểu 6 ký tự',
      });
      return;
    }

    const cleanEmail = email.toString().trim().toLowerCase();
    const hashedCode = crypto.createHash('sha256').update(resetCode.trim()).digest('hex');

    const user = await User.findOne({
      email: cleanEmail,
      resetPasswordToken: hashedCode,
      resetPasswordExpires: { $gt: new Date() },
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Mã xác thực không hợp lệ hoặc đã hết hạn (15 phút). Vui lòng thử lại.',
      });
      return;
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ.',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi đặt lại mật khẩu',
    });
  }
};
