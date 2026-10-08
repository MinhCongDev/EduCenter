import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';
import { config } from '../config';
import { AuthRequest } from '../middlewares/auth.middleware';

const generateToken = (userId: string, role: string): string => {
  return jwt.sign({ id: userId, role }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as any,
  });
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, fullName, phone } = req.body;

    if (!email || !password || !fullName) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ email, mật khẩu và họ tên',
      });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'Email này đã được sử dụng',
      });
      return;
    }

    const user = await User.create({
      email: email.toLowerCase(),
      password,
      fullName,
      phone: phone || '',
      role: 'STUDENT',
      status: 'ACTIVE',
    });

    const token = generateToken(user._id.toString(), user.role);

    // Exclude password from response
    const userResponse = {
      _id: user._id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      status: user.status,
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

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
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
      role: user.role,
      status: user.status,
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
