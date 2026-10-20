// ===========================
// EduCenter – Shared Types
// ===========================

// User roles as defined in the system spec
export type UserRole = 'STUDENT' | 'TEACHER' | 'TRAINING_STAFF' | 'DIRECTOR';

// User status
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

// Base user interface (matches backend User model)
export interface User {
  _id: string;
  email: string;
  fullName: string;
  phone?: string;
  address?: string;
  dob?: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Auth-related types
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  address?: string;
  dob?: string;
}

export interface UpdateProfileData {
  fullName?: string;
  phone?: string;
  address?: string;
  dob?: string;
  avatarUrl?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword?: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  email: string;
  resetCode: string;
  newPassword: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

// Center Information types (UC01)
export interface Branch {
  _id?: string;
  branchName: string;
  address: string;
  phone: string;
  isHeadquarters: boolean;
}

export interface Facility {
  _id?: string;
  name: string;
  description: string;
  imageUrl?: string;
}

export interface CenterInfo {
  _id: string;
  name: string;
  slogan: string;
  introduction: string;
  vision?: string;
  mission?: string;
  hotline: string;
  email: string;
  workingHours: string;
  address: string;
  branches: Branch[];
  facilities: Facility[];
  achievements: { label: string; value: string; icon?: string }[];
  socialLinks: {
    facebook?: string;
    youtube?: string;
    tiktok?: string;
    website?: string;
  };
}

// Course types (UC02, UC03, UC04, UC05)
export type CourseFormat = 'ONLINE' | 'OFFLINE' | 'BLENDED';

export interface ClassScheduleItem {
  _id?: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  classroom: string;
  topic?: string;
}

export interface ClassItem {
  _id: string;
  classCode: string;
  name?: string;
  room: string;
  scheduleDays: string[];
  timeSlot: string;
  startDate: string;
  endDate: string;
  capacity: number;
  currentEnrollment: number;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  teacher?: {
    _id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
  };
}

export interface Course {
  _id: string;
  code: string;
  title: string;
  name?: string;
  description: string;
  category: string;
  entryLevel: string;
  targetLevel?: string;
  durationWeeks: number;
  sessions: number;
  tuitionFee: number;
  price?: number;
  format: CourseFormat;
  status: 'ACTIVE' | 'INACTIVE' | 'DRAFT';
  learningObjectives: string[];
  syllabus: string[];
  bannerUrl?: string;
  featured?: boolean;
  classes?: ClassItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CourseQueryParams {
  search?: string;
  level?: string;
  category?: string;
  format?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'duration' | 'title';
  page?: number;
  limit?: number;
}

// Announcement types (UC06)
export interface Announcement {
  _id: string;
  title: string;
  content: string;
  summary?: string;
  author: {
    _id: string;
    fullName: string;
    role: UserRole;
    avatarUrl?: string;
  };
  category: string;
  targetAudience: 'ALL' | 'STUDENTS' | 'TEACHERS' | 'STAFF';
  isPinned: boolean;
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  publicationDate: string;
  imageUrl?: string;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementQueryParams {
  search?: string;
  category?: string;
  audience?: string;
  page?: number;
  limit?: number;
}

// API response wrappers
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Navigation item for role-based menus
export interface NavItem {
  label: string;
  path: string;
  icon?: string;
  children?: NavItem[];
}

// ── Course Types ─────────────────────────────
export type CourseStatus = 'ACTIVE' | 'INACTIVE' | 'DRAFT';

export interface CourseFormData {
  code: string;
  title: string;
  description: string;
  category: string;
  durationWeeks: number;
  tuitionFee: number;
  status: CourseStatus;
  syllabus: string[];
}

export type ClassStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface ClassCourseOption {
  _id: string;
  code: string;
  title: string;
}

export interface ClassTeacherOption {
  _id: string;
  fullName: string;
  email: string;
}

export interface TrainingClass {
  _id: string;
  classCode: string;
  course: ClassCourseOption;
  teacher: ClassTeacherOption;
  room: string;
  scheduleDays: string[];
  timeSlot: string;
  startDate: string;
  endDate: string;
  capacity: number;
  status: ClassStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ClassFormData {
  classCode: string;
  course: string;
  teacher: string;
  room: string;
  scheduleDays: string[];
  timeSlot: string;
  startDate: string;
  endDate: string;
  capacity: number;
  status: ClassStatus;
}

// ── Payment Types ────────────────────────────
export type PaymentMethod = 'VNPAY' | 'BANK_TRANSFER' | 'CASH' | 'CREDIT_CARD';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export interface PaymentCourseInfo {
  _id: string;
  title: string;
  code: string;
  tuitionFee: number;
  durationWeeks?: number;
  level?: string;
  category?: string;
}

export interface PaymentClassInfo {
  _id: string;
  classCode: string;
  room?: string;
  scheduleDays?: string[];
  timeSlot?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaymentEnrollmentInfo {
  _id: string;
  status: string;
  tuitionStatus: string;
  registrationDate?: string;
  enrollmentDate?: string;
  class?: PaymentClassInfo;
}

export interface Payment {
  _id: string;
  student: string | User;
  course?: PaymentCourseInfo;
  enrollment?: PaymentEnrollmentInfo;
  amount: number;
  method: PaymentMethod;
  transactionCode: string;
  status: PaymentStatus;
  paymentDate: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentSummary {
  totalPaid: number;
  successCount: number;
  pendingCount: number;
  pendingTuitionCount: number;
  totalPendingTuitionAmount: number;
}

export interface PendingTuitionItem {
  _id: string;
  student: string;
  course: {
    _id: string;
    title: string;
    code: string;
    description?: string;
    tuitionFee: number;
    originalPrice?: number;
    durationWeeks?: number;
    level?: string;
    format?: string;
  };
  class?: {
    _id: string;
    classCode: string;
    room?: string;
    scheduleDays?: string[];
    timeSlot?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  };
  registrationDate: string;
  enrollmentDate: string;
  status: string;
  tuitionStatus: 'PENDING' | 'PAID' | 'REFUNDED';
}

export interface PaymentReceiptData {
  payment: Payment;
  center: {
    name: string;
    hotline: string;
    email: string;
    address: string;
    slogan?: string;
  };
}
