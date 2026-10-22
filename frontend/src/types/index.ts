// ===========================
// EduCenter – Shared Types
// (Single source of truth – aligned with backend models)
// Merged: main (origin/main) + datlt (student module)
// ===========================

// ─── User & Auth ──────────────────────────
export type UserRole = 'STUDENT' | 'TEACHER' | 'TRAINING_STAFF' | 'DIRECTOR';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface User {
  _id: string;
  email: string;
  fullName: string;
  phone?: string;
  address?: string;
  dob?: string;
  role: UserRole;
  status: UserStatus;
  isVerified?: boolean;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  currentClass?: {
    _id: string;
    name: string;
  };
}

// Student profile (datlt)
export interface StudentProfile {
  studentCode: string;
  dob?: string;
  currentBand?: number;
  targetBand?: number;
  learningGoal?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  status: 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'SUSPENDED';
}

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

export interface RegisterResult {
  email: string;
  verificationRequired: boolean;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: RegisterResult;
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

// ─── Course types (UC02, UC03, UC04, UC05) ──────────────────────────
export type CourseFormat = 'ONLINE' | 'OFFLINE' | 'BLENDED';
export type CourseStatus = 'ACTIVE' | 'INACTIVE' | 'DRAFT';

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

// Rich Course (main canonical)
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
  status: CourseStatus;
  learningObjectives: string[];
  syllabus: string[];
  bannerUrl?: string;
  featured?: boolean;
  classes?: ClassItem[];
  createdAt: string;
  updatedAt: string;
}

// Course CRUD form data
export interface CourseFormData {
  code: string;
  title: string;
  description: string;
  category: string;
  entryLevel?: string;
  targetLevel?: string;
  durationWeeks: number;
  tuitionFee: number;
  status: CourseStatus;
  syllabus: string[];
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

// ─── Announcement types (UC06) ──────────────────────────
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
  status?: string;
  page?: number;
  limit?: number;
}

export interface ProposalItem {
  _id: string;
  code: string;
  title: string;
  description?: string;
  proposerName: string;
  proposerRole?: string;
  category: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy?: {
    _id: string;
    fullName: string;
    email: string;
  };
  reviewNote?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── API Wrapper ──────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  code?: string;
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

// ─── Navigation ──────────────────────────
export interface NavItem {
  label: string;
  path: string;
  icon?: string;
  children?: NavItem[];
}

// ============================================
// SHARED / STAFF MODULE TYPES (main)
// ============================================

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

// ============================================
// STUDENT MODULE TYPES (datlt – aligned with backend after merge)
// ============================================

// Student module's Class (references full Course)
export interface Class {
  _id: string;
  classCode: string;
  course: Course;
  teacher: Pick<User, '_id' | 'fullName' | 'email' | 'phone' | 'avatarUrl'>;
  room: string;
  scheduleDays: string[];
  timeSlot: string;
  startDate: string;
  endDate: string;
  capacity: number;
  currentEnrollment?: number;
  /** Field tương thích ngược (một số endpoint cũ trả `currentStudents`). */
  currentStudents?: number;
  sessions?: number;
  status: ClassStatus;
}

// Class Schedule (datlt)
export interface ClassSchedule {
  _id: string;
  class: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string;
  createdAt?: string;
  updatedAt?: string;
}

// Assignment (aligned with backend IAssignment + enriched from Submission)
export type AssignmentStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED';

export interface Assignment {
  _id: string;
  class: string;
  teacher?: string;
  title: string;
  description?: string;
  skill?: string;
  dueDate: string;
  maxScore: number;
  status: AssignmentStatus;
  attachments: string[];
  // Fields enriched from Submission (populated by getAssignments controller)
  submissionStatus?: 'PENDING' | 'SUBMITTED' | 'LATE' | 'GRADED' | null;
  submissionId?: string;
  submissionTime?: string;
  /** Điểm chấm (lấy từ Submission.grade khi đã được chấm) */
  grade?: number;
  feedback?: string;
}

// Submission (datlt – aligned with main's schema: attachments[], submissionTime, grade)
export type SubmissionStatus = 'PENDING' | 'SUBMITTED' | 'LATE' | 'GRADED';

export interface Submission {
  _id: string;
  assignment: string;
  student: string;
  content: string;
  attachments: string[];
  submissionTime: string;
  grade?: number;
  feedback?: string;
  gradedBy?: string;
  status: 'SUBMITTED' | 'LATE' | 'GRADED' | 'PENDING';
  createdAt: string;
  updatedAt: string;
}

// Grade (IELTS band scores, plus optional raw score for numeric grading)
export type GradeEvaluationType =
  | 'MOCK_TEST'
  | 'MID_TERM'
  | 'FINAL_TEST'
  | 'ASSIGNMENT'
  | 'SPEAKING_ASSESSMENT'
  | 'WRITING_ASSESSMENT';
export type GradeStatus = 'DRAFT' | 'PUBLISHED';

export interface Grade {
  _id: string;
  student: string;
  class: string;
  teacher: Pick<User, '_id' | 'fullName' | 'email'>;
  evaluationType: GradeEvaluationType;
  title: string;
  testDate: string;
  score?: number;       // Raw score (backend may return it)
  maxScore?: number;    // Max possible score
  overallBand: number; // IELTS band score (0-9)
  listening?: number;
  reading?: number;
  writing?: number;
  speaking?: number;
  feedback?: string;
  status: GradeStatus;
}

// Attendance (datlt – aligned with main's schema)
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
export interface Attendance {
  _id: string;
  class: string;
  classSchedule?: string;
  student: string;
  sessionDate: string;
  status: AttendanceStatus;
  notes?: string;
  recordedBy?: string;
}

export interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  rate: number;
}

// Payment (datlt – aligned with main's schema: course ref, transactionCode, SUCCESS status)
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
export type PaymentMethod = 'VNPAY' | 'BANK_TRANSFER' | 'CASH' | 'CREDIT_CARD';

export interface Payment {
  _id: string;
  student: string;
  enrollment?: string;
  // class may be populated: { classCode, room, course: { code, title } }
  // or just an ObjectId string
  class?: string | {
    classCode: string;
    room?: string;
    course?: { code: string; title: string };
  };
  // course may be populated: { code, title } or just an ObjectId string
  course?: string | { code: string; title: string };
  amount: number;
  method: PaymentMethod;
  transactionCode?: string;
  paymentDate?: string;
  dueDate?: string;
  status: PaymentStatus;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentStats {
  total: number;
  paidCount: number;
  pendingCount: number;
  failedCount: number;
  refundedCount?: number;
  totalPaid: number;
  totalPending: number;
}

// Change Request (datlt – aligned with main's schema: requestType, reviewedBy, reviewNote)
export type RequestType = 'CLASS_CHANGE' | 'SCHEDULE_CHANGE' | 'TEACHER_SCHEDULE_CHANGE';
export type ChangeRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ChangeRequest {
  _id: string;
  student?: string;
  teacher?: string;
  requesterRole: 'STUDENT' | 'TEACHER';
  requestType: RequestType;
  currentClass: string | { classCode: string };
  targetClass?: string | { classCode: string };
  currentSchedule?: string;
  targetSchedule?: string;
  sessionDate?: string;
  targetDate?: string;
  reason: string;
  status: ChangeRequestStatus;
  reviewedBy?: string;
  reviewNote?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChangeRequestInput {
  requestType: RequestType;
  reason: string;
  currentClass?: string;
  targetClass?: string;
  currentSchedule?: string;
  targetSchedule?: string;
}

// Enrollment / My Class
export type EnrollmentStatus = 'PENDING' | 'ENROLLED' | 'DROPPED' | 'COMPLETED';
export type TuitionStatus = 'PENDING' | 'PAID' | 'REFUNDED';

export interface Enrollment {
  _id: string;
  enrollmentId: string;
  class: Class;
  status: EnrollmentStatus;
  enrollmentStatus: EnrollmentStatus;
  tuitionStatus: TuitionStatus;
  enrollmentDate: string;
}

// ─── Tuition (M8) — học phí theo từng lớp đã ghi danh ───
export interface TuitionPayment {
  _id: string;
  amount: number;
  method: PaymentMethod;
  transactionCode: string;
  status: PaymentStatus;
  paymentDate: string;
  createdAt: string;
}

export interface TuitionItem {
  enrollmentId: string;
  classId: string;
  classCode: string;
  room: string;
  scheduleDays: string[];
  timeSlot: string;
  startDate: string;
  endDate: string;
  course: {
    _id: string;
    code: string;
    title: string;
    description?: string;
    durationWeeks?: number;
    sessions?: number;
    tuitionFee: number;
  } | null;
  teacher: {
    _id: string;
    fullName: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
  } | null;
  tuitionFee: number;
  tuitionStatus: TuitionStatus;
  enrollmentStatus: EnrollmentStatus;
  enrollmentDate: string;
  payments: TuitionPayment[];
}

export interface TuitionStats {
  total: number;
  paidCount: number;
  pendingCount: number;
  refundedCount: number;
  totalPaid: number;
  totalPending: number;
  totalRefunded: number;
}

export interface DashboardStats {
  totalClasses: number;
  pendingAssignments: number;
  totalAssignments: number;
  pendingRequests: number;
  tuitionPaid: number;
  tuitionPending: number;
}

export interface DashboardData {
  stats: DashboardStats;
  currentClass: (Enrollment & { _id: string }) | null;
  myClasses: Enrollment[];
}

// ─── Notifications (M4) – aligned with main's schema: recipient, isRead, content ───
// Supports both main's generic types (INFO/ALERT/SUCCESS/WARNING) and
// student-specific semantic types for rich rendering in the bell UI.
export type NotificationType =
  | 'INFO' | 'ALERT' | 'SUCCESS' | 'WARNING'  // main schema
  | 'GRADE_PUBLISHED' | 'ASSIGNMENT_GRADED'   // student-specific
  | 'REQUEST_APPROVED' | 'REQUEST_REJECTED'
  | 'PAYMENT_RECEIVED' | 'CLASS_ANNOUNCEMENT'
  | 'ATTENDANCE_MARKED';

export interface NotificationItem {
  _id: string;
  recipient: string;
  title: string;
  content: string;   // main uses 'content' (not 'message')
  type: NotificationType;
  isRead: boolean;  // main uses 'isRead' (not 'read')
  linkUrl?: string; // main uses 'linkUrl' (not 'link')
  createdAt: string;
  updatedAt: string;
}

// Notification type metadata for NotificationBell rendering
export const NOTIFICATION_META: Record<NotificationType, { icon: string; color: string; label: string }> = {
  INFO:               { icon: 'ℹ️',  color: '#3b82f6', label: 'Thông tin' },
  ALERT:              { icon: '🚨',  color: '#f59e0b', label: 'Cảnh báo' },
  SUCCESS:            { icon: '✅',  color: '#10b981', label: 'Thành công' },
  WARNING:            { icon: '⚠️',  color: '#f97316', label: 'Cảnh báo' },
  GRADE_PUBLISHED:    { icon: '📊',  color: '#3b82f6', label: 'Điểm mới' },
  ASSIGNMENT_GRADED:  { icon: '✅',  color: '#10b981', label: 'Chấm bài' },
  REQUEST_APPROVED:   { icon: '👍',  color: '#10b981', label: 'Duyệt yêu cầu' },
  REQUEST_REJECTED:   { icon: '⛔',  color: '#ef4444', label: 'Từ chối' },
  PAYMENT_RECEIVED:   { icon: '💰',  color: '#10b981', label: 'Thanh toán' },
  CLASS_ANNOUNCEMENT:{ icon: '📢',  color: '#8b5cf6', label: 'Thông báo lớp' },
  ATTENDANCE_MARKED:  { icon: '🗓️',  color: '#f59e0b', label: 'Điểm danh' },
};

// ─── Toast & UI ──────────────────────────
export type ToastType = 'success' | 'error' | 'warning' | 'info';
export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}
