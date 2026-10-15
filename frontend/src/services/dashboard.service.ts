import api from './api';

export interface DirectorDashboardData {
  stats: {
    revenue: string;
    revenueGrowth: string;
    totalStudents: number;
    activeClasses: number;
    totalTeachers: number;
    totalCourses: number;
    totalEnrollments?: number;
    targetAchievementRate: string;
  };
  campusStats: Array<{
    id: string;
    name: string;
    address?: string;
    students: number;
    classes: number;
    revenue: string;
    fillRate: number;
    status: string;
  }>;
  recentClasses: Array<{
    id: string;
    classCode: string;
    name: string;
    teacherName: string;
    room: string;
    currentEnrollment: number;
    capacity: number;
    status: string;
  }>;
  recentApprovals: Array<{
    id: number;
    title: string;
    time: string;
    status: string;
  }>;
}

export interface TeacherDashboardData {
  stats: {
    activeClasses: number;
    totalStudents: number;
    pendingSubmissions: number;
    weeklySessions: number;
  };
  classes: Array<{
    id: string;
    name: string;
    room: string;
    time: string;
    students: number;
    progress: string;
  }>;
  submissions: Array<{
    id: string;
    student: string;
    class: string;
    task: string;
    date: string;
    status: string;
  }>;
}

export interface StaffDashboardData {
  stats: {
    newStudents: number;
    activeClasses: number;
    mockTestCandidates: number;
    pendingPayments: number;
  };
  recentEnrollments: Array<{
    id: string;
    name: string;
    phone: string;
    course: string;
    campus: string;
    fee: string;
    payment: string;
  }>;
  roomStatus: Array<{
    id: string;
    room: string;
    campus: string;
    event: string;
    time: string;
    status: string;
  }>;
}

export interface StudentDashboardData {
  stats: {
    currentClass: string;
    teacherName: string;
    latestScore: string;
    attendanceRate: string;
    pendingTasks: number;
  };
  schedule: Array<{
    id: string;
    day: string;
    time: string;
    title: string;
    room: string;
    teacher: string;
    status: string;
  }>;
  homework: Array<{
    id: string;
    title: string;
    deadline: string;
    status: string;
    priority: string;
  }>;
}

export interface DashboardApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const dashboardService = {
  getDirectorDashboard: async (): Promise<DirectorDashboardData> => {
    const response = await api.get<DashboardApiResponse<DirectorDashboardData>>('/dashboard/director');
    return response.data.data;
  },

  getTeacherDashboard: async (): Promise<TeacherDashboardData> => {
    const response = await api.get<DashboardApiResponse<TeacherDashboardData>>('/dashboard/teacher');
    return response.data.data;
  },

  getStaffDashboard: async (): Promise<StaffDashboardData> => {
    const response = await api.get<DashboardApiResponse<StaffDashboardData>>('/dashboard/staff');
    return response.data.data;
  },

  getStudentDashboard: async (): Promise<StudentDashboardData> => {
    const response = await api.get<DashboardApiResponse<StudentDashboardData>>('/dashboard/student');
    return response.data.data;
  },
};

export default dashboardService;
