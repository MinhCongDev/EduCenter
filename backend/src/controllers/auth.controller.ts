import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { User, IUser, IUserPreferences } from '../models/user.model';
import { Student } from '../models/student.model';
import { Enrollment } from '../models/enrollment.model';
import { config } from '../config';
import { AuthRequest } from '../middlewares/auth.middleware';
import { buildAvatarUrl } from '../middlewares/upload.middleware';
import { sendPasswordResetEmail, sendVerificationEmail } from '../services/email.service';
import {
  PASSWORD_POLICY_MESSAGE,
  isValidEmail,
  isValidPassword,
} from '../utils/validation';
import {
  VERIFICATION_TOKEN_TTL_MS,
  canSendVerificationEmail,
  generateVerificationToken,
  hashVerificationToken,
  recordVerificationEmailSent,
} from '../utils/emailVerification';

const generateToken = (userId: string, role: string): string => {
  return jwt.sign({ id: userId, role }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as any,
  });
};

let googleClient: OAuth2Client | null = null;

const getGoogleClient = (): OAuth2Client => {
  if (!googleClient) {
    googleClient = new OAuth2Client(config.google.clientId);
  }
  return googleClient;
};

const toUserResponse = (user: IUser) => ({
  _id: user._id,
  email: user.email,
  fullName: user.fullName,
  phone: user.phone,
  address: user.address,
  dob: user.dob,
  role: user.role,
  status: user.status,
  isVerified: user.isVerified,
  avatarUrl: user.avatarUrl,
  preferences: user.preferences,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

/**
 * Register Account
 * POST /api/auth/register
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, fullName, phone, address, dob } = req.body || {};
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!normalizedEmail || !password || !fullName || !String(fullName).trim()) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ email, mật khẩu và họ tên',
      });
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      res.status(400).json({
        success: false,
        message: 'Địa chỉ email không đúng định dạng',
      });
      return;
    }

    if (!isValidPassword(password)) {
      res.status(400).json({
        success: false,
        message: PASSWORD_POLICY_MESSAGE,
      });
      return;
    }

    const rateLimit = canSendVerificationEmail(normalizedEmail);
    if (!rateLimit.allowed) {
      const retryAfter = rateLimit.retryAfterSeconds ?? 0;
      res.setHeader('Retry-After', String(retryAfter));
      res.status(429).json({
        success: false,
        code: 'VALIDATION_RATE_LIMIT_EXCEEDED',
        message: `Bạn đã yêu cầu gửi email xác thực quá nhiều lần. Vui lòng thử lại sau ${Math.max(
          1,
          Math.ceil(retryAfter / 60)
        )} phút.`,
      });
      return;
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'Email này đã được đăng ký trong hệ thống',
      });
      return;
    }

    const verificationToken = generateVerificationToken();

    const user = await User.create({
      email: normalizedEmail,
      password,
      fullName: String(fullName).trim(),
      phone: typeof phone === 'string' ? phone.trim() : '',
      address: typeof address === 'string' ? address.trim() : '',
      dob: dob ? new Date(dob) : undefined,
      role: 'STUDENT',
      status: 'ACTIVE',
      isVerified: false,
      emailVerificationToken: hashVerificationToken(verificationToken),
      emailVerificationExpires: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
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

    await sendVerificationEmail({
      to: user.email,
      fullName: user.fullName,
      token: verificationToken,
    });
    recordVerificationEmailSent(normalizedEmail);

    res.status(201).json({
      success: true,
      message:
        'Đăng ký tài khoản thành công! Vui lòng kiểm tra email để xác thực tài khoản trước khi đăng nhập.',
      data: {
        email: user.email,
        verificationRequired: true,
      },
    });
  } catch (error: any) {
    if (error?.code === 11000) {
      res.status(400).json({
        success: false,
        message: 'Email này đã được đăng ký trong hệ thống',
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi đăng ký',
    });
  }
};

/**
 * Log In
 * POST /api/auth/login
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!normalizedEmail || !password) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng nhập email và mật khẩu',
      });
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      res.status(400).json({
        success: false,
        message: 'Địa chỉ email không đúng định dạng',
      });
      return;
    }

    const user = await User.findOne({ email: normalizedEmail }).select('+password');
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

    // Checked only after the password is verified to avoid disclosing
    // verification status to unauthenticated attackers.
    if (!user.isVerified) {
      res.status(403).json({
        success: false,
        code: 'AUTH_ACCOUNT_NOT_VERIFIED',
        message:
          'Tài khoản chưa được xác thực email. Vui lòng kiểm tra hộp thư hoặc gửi lại email xác thực.',
      });
      return;
    }

    const token = generateToken(user._id.toString(), user.role);

// Get current enrolled class for students
    let currentClass = null;
    if (user.role === 'STUDENT') {
      const enrollment = await Enrollment.findOne({
        student: user._id,
        status: 'ENROLLED',
      }).populate('class', 'name').sort({ enrollmentDate: -1 });
      if (enrollment?.class) {
        currentClass = {
          _id: (enrollment.class as any)._id.toString(),
          name: (enrollment.class as any).name,
        };
      }
    }

    const userResponse = {
      ...toUserResponse(user),
      currentClass,
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
 * Log in or sign up with a Google ID token.
 * POST /api/auth/google
 */
export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!config.isGoogleConfigured) {
      res.status(503).json({
        success: false,
        message: 'Đăng nhập Google chưa được cấu hình trên server (thiếu GOOGLE_CLIENT_ID).',
      });
      return;
    }

    const { idToken } = req.body || {};
    if (!idToken || typeof idToken !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Thiếu Google ID token',
      });
      return;
    }

    let payload: TokenPayload | undefined;
    try {
      const ticket = await getGoogleClient().verifyIdToken({
        idToken,
        audience: config.google.clientId,
      });
      payload = ticket.getPayload();
    } catch {
      res.status(401).json({
        success: false,
        message: 'Token Google không hợp lệ hoặc đã hết hạn',
      });
      return;
    }

    if (!payload?.email || !payload.email_verified) {
      res.status(401).json({
        success: false,
        message: 'Không thể xác thực email từ tài khoản Google',
      });
      return;
    }

    const email = payload.email.trim().toLowerCase();
    let user = await User.findOne({ email });

    if (!user) {
      // Google users have no local password. Generate a random one so the
      // required field is satisfied and password login is impossible until reset.
      const randomPassword = crypto.randomBytes(32).toString('hex');

      try {
        user = await User.create({
          email,
          password: randomPassword,
          fullName: payload.name?.trim() || email.split('@')[0],
          avatarUrl: payload.picture || '',
          role: 'STUDENT',
          status: 'ACTIVE',
          isVerified: true,
        });
      } catch (error: any) {
        if (error?.code === 11000) {
          // Created concurrently by another request – reuse it.
          user = await User.findOne({ email });
        } else {
          throw error;
        }
      }

      if (user) {
        try {
          const studentCode = `STU${Date.now().toString().slice(-6)}`;
          await Student.create({
            user: user._id,
            studentCode,
            status: 'ACTIVE',
          });
        } catch {
          // Non-fatal if student profile creation fails
        }
      }
    } else {
      if (user.status !== 'ACTIVE') {
        res.status(403).json({
          success: false,
          message: 'Tài khoản của bạn đã bị khóa hoặc ngừng hoạt động',
        });
        return;
      }

      let changed = false;
      if (!user.isVerified) {
        user.isVerified = true;
        changed = true;
        await User.updateOne(
          { _id: user._id },
          { $unset: { emailVerificationToken: 1, emailVerificationExpires: 1 } }
        );
      }
      if (!user.avatarUrl && payload.picture) {
        user.avatarUrl = payload.picture;
        changed = true;
      }
      if (changed) {
        await user.save();
      }
    }

    if (!user) {
      res.status(500).json({
        success: false,
        message: 'Không thể tạo tài khoản từ Google',
      });
      return;
    }

    const token = generateToken(user._id.toString(), user.role);

    res.status(200).json({
      success: true,
      message: 'Đăng nhập bằng Google thành công',
      data: {
        user: toUserResponse(user),
        token,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi đăng nhập bằng Google',
    });
  }
};

/**
 * Verify the email address using the token from the registration email.
 * GET /api/auth/verify-email?token=...
 */
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.query;

    if (typeof token !== 'string' || !token.trim()) {
      res.status(400).json({
        success: false,
        code: 'VALIDATION_INVALID_TOKEN',
        message: 'Liên kết xác thực không hợp lệ hoặc đã hết hạn',
      });
      return;
    }

    const hashedToken = hashVerificationToken(token.trim());

    // Atomic + single-use: the same link cannot verify twice.
    const user = await User.findOneAndUpdate(
      {
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { $gt: new Date() },
      },
      {
        $set: { isVerified: true },
        $unset: { emailVerificationToken: 1, emailVerificationExpires: 1 },
      },
      { new: true }
    );

    if (!user) {
      res.status(400).json({
        success: false,
        code: 'VALIDATION_INVALID_TOKEN',
        message:
          'Liên kết xác thực không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu gửi lại email xác thực.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Xác thực email thành công! Bạn có thể đăng nhập ngay bây giờ.',
      data: { email: user.email },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi xác thực email',
    });
  }
};

/**
 * Resend the registration verification email.
 * POST /api/auth/resend-email-verify
 */
export const resendVerificationEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body || {};
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!normalizedEmail) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng nhập địa chỉ email',
      });
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      res.status(400).json({
        success: false,
        message: 'Địa chỉ email không đúng định dạng',
      });
      return;
    }

    const rateLimit = canSendVerificationEmail(normalizedEmail);
    if (!rateLimit.allowed) {
      const retryAfter = rateLimit.retryAfterSeconds ?? 0;
      res.setHeader('Retry-After', String(retryAfter));
      res.status(429).json({
        success: false,
        code: 'VALIDATION_RATE_LIMIT_EXCEEDED',
        message: `Bạn đã yêu cầu gửi email xác thực quá nhiều lần. Vui lòng thử lại sau ${Math.max(
          1,
          Math.ceil(retryAfter / 60)
        )} phút.`,
      });
      return;
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản nào gắn với email này',
      });
      return;
    }

    if (user.isVerified) {
      res.status(400).json({
        success: false,
        message: 'Email này đã được xác thực. Bạn có thể đăng nhập.',
      });
      return;
    }

    const verificationToken = generateVerificationToken();
    user.emailVerificationToken = hashVerificationToken(verificationToken);
    user.emailVerificationExpires = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);
    await user.save();

    await sendVerificationEmail({
      to: user.email,
      fullName: user.fullName,
      token: verificationToken,
    });
    recordVerificationEmailSent(normalizedEmail);

    res.status(200).json({
      success: true,
      message: 'Email xác thực đã được gửi lại. Vui lòng kiểm tra hộp thư của bạn.',
      data: {
        email: user.email,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi gửi lại email xác thực',
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

    // Get current enrolled class for students
    let currentClass = null;
    if (req.user.role === 'STUDENT') {
      const enrollment = await Enrollment.findOne({
        student: req.user._id,
        status: 'ENROLLED',
      }).populate('class', 'name').sort({ enrollmentDate: -1 });
      if (enrollment?.class) {
        currentClass = {
          _id: (enrollment.class as any)._id.toString(),
          name: (enrollment.class as any).name,
        };
      }
    }

    res.status(200).json({
      success: true,
      data: {
        user: { ...req.user.toObject(), currentClass },
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
 * Upload Avatar (multipart)
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
 * Update Personal Information
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

    const userResponse = toUserResponse(user);

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
 * Lấy / cập nhật tùy chọn hiển thị & thông báo (tab "Cài đặt" trong Hồ sơ cá nhân).
 *
 * GET  /api/auth/preferences
 * PUT  /api/auth/preferences
 */
export const getPreferences = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Vui lòng đăng nhập' });
      return;
    }
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });
      return;
    }
    res.status(200).json({
      success: true,
      message: 'Lấy tùy chọn thành công',
      data: { preferences: user.preferences || {} },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy tùy chọn',
    });
  }
};

export const updatePreferences = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Vui lòng đăng nhập' });
      return;
    }
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });
      return;
    }

    const body = (req.body || {}) as Record<string, unknown>;
    const allowed: Array<keyof IUserPreferences> = [
      'inAppNotifications',
      'emailNotifications',
      'notifyGrades',
      'notifyAttendance',
      'notifyAnnouncements',
      'notifyPayments',
      'compactMode',
    ];

    // `user.preferences` là Mongoose sub-document: phải `.toObject()` mới lấy
    // được giá trị thực (spread trực tiếp sẽ ra object rỗng → mất cấu hình
    // đã lưu và reset về mặc định).
    const existing = (user.preferences as any)?.toObject?.() ?? {};
    const prefs: IUserPreferences = {
      inAppNotifications: true,
      emailNotifications: true,
      notifyGrades: true,
      notifyAttendance: true,
      notifyAnnouncements: true,
      notifyPayments: true,
      compactMode: false,
      ...existing,
    };
    for (const key of allowed) {
      if (typeof body[key] === 'boolean') {
        prefs[key] = body[key] as boolean;
      }
    }

    user.preferences = prefs;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật tùy chọn thành công',
      data: { preferences: user.preferences },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi cập nhật tùy chọn',
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
 * Forgot Password - Request Reset Code / Token
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!normalizedEmail) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng nhập địa chỉ email đã đăng ký',
      });
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      res.status(400).json({
        success: false,
        message: 'Địa chỉ email không đúng định dạng',
      });
      return;
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản nào gắn với email này',
      });
      return;
    }

    const rateLimit = canSendVerificationEmail(normalizedEmail);
    if (!rateLimit.allowed) {
      const retryAfter = rateLimit.retryAfterSeconds ?? 0;
      res.setHeader('Retry-After', String(retryAfter));
      res.status(429).json({
        success: false,
        code: 'VALIDATION_RATE_LIMIT_EXCEEDED',
        message: `Bạn đã yêu cầu gửi email quá nhiều lần. Vui lòng thử lại sau ${Math.max(
          1,
          Math.ceil(retryAfter / 60)
        )} phút.`,
      });
      return;
    }

    // Generate a 6-digit code, store only its hash in the database.
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedCode = crypto.createHash('sha256').update(resetCode).digest('hex');

    user.resetPasswordToken = hashedCode;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry
    await user.save();

    const { delivered } = await sendPasswordResetEmail({
      to: user.email,
      fullName: user.fullName,
      code: resetCode,
    });
    recordVerificationEmailSent(normalizedEmail);

    res.status(200).json({
      success: true,
      message: delivered
        ? 'Mã xác nhận đặt lại mật khẩu đã được gửi tới email của bạn (hiệu lực trong 15 phút).'
        : config.isDevelopment
          ? 'Chưa cấu hình SMTP. Mã xác nhận đã được in ở console của server (chỉ môi trường development).'
          : 'Yêu cầu đặt lại mật khẩu đã được ghi nhận. Vui lòng kiểm tra email của bạn.',
      data: {
        email: user.email,
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
 * Reset Password - Verify Code and Update Password
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
