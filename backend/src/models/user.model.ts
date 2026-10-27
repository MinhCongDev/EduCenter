import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'STUDENT' | 'TEACHER' | 'TRAINING_STAFF' | 'DIRECTOR';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

/**
 * Tùy chọn hiển thị / thông báo của người dùng.
 *
 * Lưu trong `User.preferences` (đặt trong hồ sơ cá nhân → tab "Cài đặt").
 * `notification.service.notify()` đọc các cờ này để không tạo thông báo
 * mà người dùng đã tắt — nhờ vậy tùy chọn có tác dụng thật chứ không chỉ
 * là giao diện.
 */
export interface IUserPreferences {
  /** Nhận thông báo trong hệ thống (chuông thông báo). */
  inAppNotifications: boolean;
  /** Nhận thông báo qua email. */
  emailNotifications: boolean;
  /** Thông báo khi có điểm / kết quả bài tập mới. */
  notifyGrades: boolean;
  /** Thông báo khi giảng viên điểm danh (vắng / trễ). */
  notifyAttendance: boolean;
  /** Thông báo khi có thông báo lớp / thông báo chung. */
  notifyAnnouncements: boolean;
  /** Thông báo khi có cập nhật thanh toán. */
  notifyPayments: boolean;
  /** Giao diện mật độ thoáng (gọn) — lưu cục bộ ở máy người dùng. */
  compactMode: boolean;
}

export interface IUser extends Document {
  email: string;
  password?: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string;
  address?: string;
  dob?: Date;
  isVerified: boolean;
  preferences?: IUserPreferences;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email là bắt buộc'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Mật khẩu là bắt buộc'],
      minlength: [6, 'Mật khẩu tối thiểu 6 ký tự'],
      select: false, // Don't return password by default
    },
    fullName: {
      type: String,
      required: [true, 'Họ và tên là bắt buộc'],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    role: {
      type: String,
      enum: ['STUDENT', 'TEACHER', 'TRAINING_STAFF', 'DIRECTOR'],
      default: 'STUDENT',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
      default: 'ACTIVE',
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    address: {
      type: String,
      default: '',
    },
    dob: {
      type: Date,
    },
    isVerified: {
      // Default true keeps legacy/seeded/admin-created accounts working.
      // Registration explicitly sets this to false until the email is verified.
      type: Boolean,
      default: true,
    },
    preferences: {
      type: new Schema<IUserPreferences>(
        {
          inAppNotifications: { type: Boolean, default: true },
          emailNotifications: { type: Boolean, default: true },
          notifyGrades: { type: Boolean, default: true },
          notifyAttendance: { type: Boolean, default: true },
          notifyAnnouncements: { type: Boolean, default: true },
          notifyPayments: { type: Boolean, default: true },
          compactMode: { type: Boolean, default: false },
        },
        { _id: false }
      ),
      default: () => ({
        inAppNotifications: true,
        emailNotifications: true,
        notifyGrades: true,
        notifyAttendance: true,
        notifyAnnouncements: true,
        notifyPayments: true,
        compactMode: false,
      }),
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for verification-token lookups (not unique – the token is a SHA-256 hash)
userSchema.index(
  { emailVerificationToken: 1 },
  { partialFilterExpression: { emailVerificationToken: { $type: 'string' } } }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

// Method to verify password
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);
