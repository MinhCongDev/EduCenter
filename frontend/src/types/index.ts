// ===========================
// EduCenter – Shared Types
// (Single source of truth – aligned with backend models)
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
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentProfile {
  studentCode: string;
  birthDate?: string;
  address?: string;
  major?: string;
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
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

// ─── API Wrapper ──────────────────────────
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

// ─── Navigation ──────────────────────────
export interface NavItem {
  label: string;
  path: string;
  icon?: string;
  children?: NavItem[];
}

// ============================================
// STUDENT MODULE TYPES (aligned with backend)
// ============================================

// Course
export interface Course {
  _id: string;
  code: string;
  title: string;
  description: string;
  category: string;
  durationWeeks: number;
  tuitionFee: number;
  status: 'ACTIVE' | 'INACTIVE';
  sessions?: number;
}

// Class
export type ClassStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
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
  currentStudents?: number;
  sessions?: number;
  status: ClassStatus;
}

// Class Schedule
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

// Assignment
export type AssignmentStatus = 'ACTIVE' | 'CLOSED';
export type AssignmentSkill =
  | 'LISTENING'
  | 'READING'
  | 'WRITING'
  | 'SPEAKING'
  | 'OVERALL'
  | 'VOCABULARY'
  | 'GRAMMAR'
  | 'OTHER';
export type SubmissionStatus = 'PENDING' | 'SUBMITTED' | 'LATE' | 'GRADED';

export interface Assignment {
  _id: string;
  class: string;
  teacher?: string;
  title: string;
  description: string;
  skill: AssignmentSkill;
  dueDate: string;
  maxScore: number;
  status: AssignmentStatus;
  attachmentUrl?: string;
  // enriched fields from backend
  submissionStatus?: SubmissionStatus | null;
  submissionId?: string;
  submissionDate?: string;
  score?: number;
  feedback?: string;
}

// Submission
export interface Submission {
  _id: string;
  assignment: string;
  student: string;
  content: string;
  attachmentUrl?: string;
  submittedAt: string;
  status: 'SUBMITTED' | 'LATE' | 'GRADED';
  score?: number;
  feedback?: string;
  gradedAt?: string;
  gradedBy?: string;
}

// Grade
export type GradeEvaluationType =
  | 'LISTENING'
  | 'READING'
  | 'WRITING'
  | 'SPEAKING'
  | 'OVERALL'
  | 'QUIZ'
  | 'MIDTERM'
  | 'FINAL'
  | 'OTHER';
export type GradeStatus = 'DRAFT' | 'PUBLISHED';

export interface Grade {
  _id: string;
  student: string;
  class: string;
  teacher: Pick<User, '_id' | 'fullName' | 'email'>;
  evaluationType: GradeEvaluationType;
  title: string;
  testDate: string;
  maxScore: number;
  score: number;
  listening?: number;
  reading?: number;
  writing?: number;
  speaking?: number;
  overallBand?: number;
  feedback?: string;
  status: GradeStatus;
}

// Attendance
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
export interface Attendance {
  _id: string;
  class: string;
  student?: string;
  schedule?: string;
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

// Payment
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'VNPAY' | 'MOMO' | 'CARD';

export interface Payment {
  _id: string;
  student: string;
  enrollment?: string;
  class?: Pick<Class, '_id' | 'classCode' | 'room' | 'course'>;
  amount: number;
  method: PaymentMethod;
  transactionId?: string;
  paymentDate?: string;
  dueDate?: string;
  status: PaymentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentStats {
  total: number;
  paidCount: number;
  pendingCount: number;
  failedCount: number;
  totalPaid: number;
  totalPending: number;
}

// Change Request
export type ChangeRequestType = 'CHANGE_CLASS' | 'CHANGE_SCHEDULE' | 'WITHDRAW';
export type ChangeRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ChangeRequest {
  _id: string;
  student: string;
  type: ChangeRequestType;
  currentClass?: Pick<Class, '_id' | 'classCode'> | string;
  targetClass?: Pick<Class, '_id' | 'classCode'> | string;
  currentClassCode?: string;
  targetClassCode?: string;
  currentSchedule?: string;
  targetSchedule?: string;
  reason: string;
  status: ChangeRequestStatus;
  adminNote?: string;
  processedBy?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChangeRequestInput {
  type: ChangeRequestType;
  reason: string;
  currentClass?: string;
  targetClass?: string;
  currentClassCode?: string;
  targetClassCode?: string;
  currentSchedule?: string;
  targetSchedule?: string;
}

// Enrollment / My Class
export type EnrollmentStatus = 'ENROLLED' | 'DROPPED' | 'COMPLETED';
export type TuitionStatus = 'PENDING' | 'PAID';

export interface Enrollment {
  _id: string;
  enrollmentId: string;
  class: Class;
  status: EnrollmentStatus;
  enrollmentStatus: EnrollmentStatus;
  tuitionStatus: TuitionStatus;
  enrollmentDate: string;
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

// ─── Notifications (M4) ──────────────────────────
export type NotificationType =
  | 'GRADE_PUBLISHED'
  | 'ASSIGNMENT_GRADED'
  | 'REQUEST_APPROVED'
  | 'REQUEST_REJECTED'
  | 'PAYMENT_RECEIVED'
  | 'CLASS_ANNOUNCEMENT'
  | 'ATTENDANCE_MARKED'
  | 'SYSTEM';

export interface NotificationItem {
  _id: string;
  user: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Toast & UI ──────────────────────────
export type ToastType = 'success' | 'error' | 'warning' | 'info';
export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}
