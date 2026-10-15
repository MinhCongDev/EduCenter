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
  role: UserRole;
  status: UserStatus;
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
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

// API response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown;
}

// Pagination
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

// ============================================
// STUDENT MODULE TYPES
// ============================================

// Enrollment
export interface Enrollment {
  _id: string;
  student: string;
  class: Class;
  enrollmentDate: string;
  status: 'ENROLLED' | 'DROPPED' | 'COMPLETED';
  tuitionStatus: 'PENDING' | 'PAID';
  createdAt: string;
  updatedAt: string;
}

// Class
export interface Class {
  _id: string;
  classCode: string;
  course: Course;
  teacher: User;
  room: string;
  scheduleDays: string[];
  timeSlot: string;
  startDate: string;
  endDate: string;
  capacity: number;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

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
}

// Class Schedule
export interface ClassSchedule {
  _id: string;
  class: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string;
}

// Assignment
export interface Assignment {
  _id: string;
  class: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  status: 'ACTIVE' | 'CLOSED';
  submissionStatus?: 'SUBMITTED' | 'LATE' | 'GRADED' | null;
  submittedAt?: string | null;
  submissionId?: string | null;
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
}

// Grade
export interface Grade {
  assignment: Assignment;
  submission: {
    _id: string;
    content: string;
    submittedAt: string;
    status: string;
  };
  grade: {
    score: number;
    feedback: string;
    gradedAt: string;
    teacher: { fullName: string };
  } | null;
}

// Attendance
export interface Attendance {
  _id: string;
  schedule: ClassSchedule;
  student: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  note?: string;
  date: string;
}

export interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
}

// Payment
export interface Payment {
  _id: string;
  enrollment: string;
  amount: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'VNPAY' | 'MOMO';
  transactionCode?: string;
  paymentDate: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
}

// Change Request
export interface ChangeRequest {
  _id: string;
  student: string;
  type: 'CLASS_CHANGE' | 'SCHEDULE_CHANGE';
  currentClass?: Class;
  targetClass?: Class;
  currentSchedule?: ClassSchedule;
  targetSchedule?: ClassSchedule;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNote?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// My Class (with enrollment info)
export interface MyClass {
  enrollmentId: string;
  enrollmentStatus: string;
  tuitionStatus: string;
  enrolledAt: string;
  class: Class;
}

// ===========================
// Student Portal Types
// ===========================

export interface MyClass {
  _id: string;
  enrollmentId: string;
  class: {
    _id: string;
    classCode: string;
    room: string;
    scheduleDays: string[];
    timeSlot: string;
    startDate: string;
    endDate: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    course?: {
      _id: string;
      code: string;
      title: string;
      description?: string;
      durationWeeks?: number;
      sessions?: number;
      tuitionFee?: number;
    };
    teacher?: {
      _id: string;
      fullName: string;
      email: string;
      avatarUrl?: string;
    };
  };
  status: string;
  enrollmentStatus: string;
  tuitionStatus: 'PAID' | 'PENDING' | 'UNPAID';
  enrollmentDate: string;
}

export interface AssignmentItem {
  _id: string;
  class: string;
  teacher: string;
  title: string;
  description: string;
  skill: string;
  dueDate: string;
  maxScore: number;
  status: string;
  submissionStatus?: 'PENDING' | 'SUBMITTED' | 'LATE' | 'GRADED';
  submissionId?: string;
  submissionDate?: string;
  score?: number;
}

export interface AttendanceItem {
  _id: string;
  class: string;
  sessionDate: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  notes?: string;
}

export interface GradeItem {
  _id: string;
  student: string;
  class: string;
  teacher: string;
  evaluationType: string;
  title: string;
  testDate: string;
  overallBand?: number;
  listening?: number;
  reading?: number;
  writing?: number;
  speaking?: number;
  feedback?: string;
  status: string;
}

export interface PaymentItem {
  _id: string;
  student: string;
  class: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  method?: string;
  transactionId?: string;
  paymentDate?: string;
  dueDate?: string;
  createdAt: string;
}

export interface ScheduleItem {
  _id: string;
  class: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  classroom: string;
  topic?: string;
}

export interface ChangeRequestItem {
  _id: string;
  student: string;
  type: 'CHANGE_CLASS' | 'CHANGE_SCHEDULE' | 'WITHDRAW';
  currentClass?: string;
  requestedClass?: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  processedBy?: string;
  processedAt?: string;
  createdAt: string;
}
