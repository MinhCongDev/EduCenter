import api from './api';
import type { ProposalItem } from '../types';

export interface DirectorSummary {
  totalRevenue: number;
  studentsCount: number;
  classesCount: number;
  activeClassesCount: number;
  staffCount: number;
  teachersCount: number;
  graduationRate: number;
  averageSatisfaction: number;
}

export interface StaffAccount {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: 'TRAINING_STAFF' | 'TEACHER';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  avatarUrl?: string;
  code: string;
  department: string;
  position: string;
  ieltsBand?: number;
  yearsOfExperience?: number;
  joinDate: string;
}

export interface AddStaffPayload {
  fullName: string;
  email: string;
  password?: string;
  phone?: string;
  role: 'TRAINING_STAFF' | 'TEACHER';
  department?: string;
  position?: string;
  specialization?: string;
  ieltsBand?: number;
  yearsOfExperience?: number;
}

export interface CenterOperationsData {
  totalRooms: number;
  inUseRooms: number;
  capacityUtilizationRate: number;
  totalClassesRunning: number;
  todayAttendanceRecordsCount: number;
  classrooms: Array<{
    room: string;
    type: string;
    capacity: number;
    occupied: number;
    status: 'IN_USE' | 'AVAILABLE' | 'MAINTENANCE';
    currentClass: string;
  }>;
}

export interface StudentActivitiesData {
  totalStudents: number;
  averageAttendanceRate: string;
  assignmentSubmissionRate: string;
  recentSubmissions: Array<{
    _id: string;
    assignment?: { title: string; skill: string };
    student?: { fullName: string; email: string };
    grade?: number;
    status: string;
    submittedAt: string;
  }>;
}

export interface TeacherActivitiesData {
  teachersCount: number;
  totalTeachingHoursWeek: number;
  averageFeedbackScore: number;
  teachers: Array<{
    id: string;
    fullName: string;
    email?: string;
    phone?: string;
    ieltsBand: number;
    assignedClassesCount: number;
    weeklyHours: number;
    satisfactionRating: number;
    gradingSpeed: string;
    status: string;
  }>;
}

export interface StudentReportsData {
  totalStudents: number;
  retentionRate: string;
  completionRate: string;
  targetBandsDistribution: Array<{
    band: string;
    count: number;
    percentage: number;
  }>;
  monthlyGrowth: Array<{
    month: string;
    students: number;
  }>;
  totalTestsConducted: number;
}

export interface TeacherReportsData {
  totalTeachers: number;
  averageSatisfaction: number;
  punctualityRate: string;
  gradingOnTimeRate: string;
  ranking: Array<{
    name: string;
    band: number;
    rating: number;
    classes: number;
    hours: number;
    commendation: string;
  }>;
}

export interface ClassAndCourseReportsData {
  totalClasses: number;
  totalCourses: number;
  averageClassFillRate: string;
  classes: Array<{
    _id: string;
    code: string;
    name: string;
    courseName: string;
    capacity: number;
    enrolled: number;
    fillRate: string;
    room: string;
    schedule: string;
    status: string;
  }>;
  courses: Array<{
    _id: string;
    code: string;
    name: string;
    targetBand?: string;
    fee: number;
    duration: string;
    enrolledCount: number;
    estimatedRevenue: number;
  }>;
}

export interface RevenueReportsData {
  totalRevenue: number;
  monthlyRevenue: Array<{
    month: string;
    amount: number;
  }>;
  revenueByCourse: Array<{
    course: string;
    amount: number;
    percentage: number;
  }>;
  paymentMethods: Array<{
    method: string;
    percentage: number;
  }>;
  recentTransactions: Array<{
    _id: string;
    student?: { fullName: string; email: string };
    course?: { name: string; code: string };
    amount: number;
    method: string;
    status: string;
    transactionCode: string;
    paymentDate: string;
  }>;
}

export const directorService = {
  // 1. Dashboard Stats & Approvals
  getDashboardStats: () => api.get<{ success: boolean; data: { summary: DirectorSummary; courseRevenue: any[]; recentApprovals: ProposalItem[] } }>('/director/dashboard-stats'),
  getApprovals: (params?: { status?: string; search?: string }) => api.get<{ success: boolean; data: ProposalItem[] }>('/director/approvals', { params }),
  reviewApproval: (id: string, status: 'APPROVED' | 'REJECTED', reviewNote?: string) => api.patch<{ success: boolean; message: string; data: ProposalItem }>(`/director/approvals/${id}/review`, { status, reviewNote }),
  createApproval: (payload: { title: string; description?: string; category?: string; proposerName?: string; proposerRole?: string }) => api.post<{ success: boolean; message: string; data: ProposalItem }>('/director/approvals', payload),

  // 2. Staff Accounts
  getStaffAccounts: () => api.get<{ success: boolean; data: { accounts: StaffAccount[] } }>('/director/staff'),
  addStaffAccount: (payload: AddStaffPayload) => api.post<{ success: boolean; message: string; data: { user: any } }>('/director/staff', payload),
  updateStaffStatus: (id: string, status: 'ACTIVE' | 'INACTIVE') => api.patch<{ success: boolean; message: string }>('/director/staff/' + id + '/status', { status }),

  // 3. Operations & Activities Monitoring
  getOperationsMonitoring: () => api.get<{ success: boolean; data: CenterOperationsData }>('/director/monitoring/operations'),
  getStudentActivities: () => api.get<{ success: boolean; data: StudentActivitiesData }>('/director/monitoring/students'),
  getTeacherActivities: () => api.get<{ success: boolean; data: TeacherActivitiesData }>('/director/monitoring/teachers'),

  // 4. Reports & Analytics
  getStudentReports: () => api.get<{ success: boolean; data: StudentReportsData }>('/director/reports/students'),
  getTeacherReports: () => api.get<{ success: boolean; data: TeacherReportsData }>('/director/reports/teachers'),
  getClassAndCourseReports: () => api.get<{ success: boolean; data: ClassAndCourseReportsData }>('/director/reports/classes'),
  getRevenueReports: () => api.get<{ success: boolean; data: RevenueReportsData }>('/director/reports/revenue'),
};
