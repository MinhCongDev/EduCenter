import api from './api';
import type { EvaluationRating, GradeEvaluationType } from '../types';

export interface AssignedClass {
  _id: string;
  classCode: string;
  name: string;
  room: string;
  scheduleDays: string[];
  timeSlot: string;
  startDate: string;
  endDate: string;
  capacity: number;
  currentEnrollment: number;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  course?: {
    _id: string;
    title: string;
    code: string;
    tuitionFee: number;
    targetLevel: string;
    bannerUrl?: string;
    sessions?: number;
  };
  schedules?: Array<{
    _id: string;
    sessionDate?: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    classroom: string;
    topic?: string;
  }>;
}

export interface TeacherStudent {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  studentCode: string;
  currentBand: number;
  targetBand: number;
  learningGoal: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  classes: Array<{
    _id: string;
    classCode: string;
    name: string;
  }>;
  attendanceStats: {
    total: number;
    present: number;
    attendanceRate: number;
  };
  latestGrade?: {
    title: string;
    overallBand?: number;
    evaluationType?: GradeEvaluationType;
    testDate: string;
  } | null;
}

export interface StudentDetailData {
  student: TeacherStudent;
  enrollments: any[];
  grades: AcademicGrade[];
  attendance: any[];
}

export interface TeachingScheduleItem {
  _id: string;
  sessionDate?: string;
  class: {
    _id: string;
    classCode: string;
    name: string;
    room: string;
    timeSlot: string;
    capacity: number;
    currentEnrollment: number;
    status?: string;
    course?: {
      _id: string;
      code: string;
      title: string;
    };
  };
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  classroom: string;
  topic?: string;
  status: 'ACTIVE' | 'CANCELLED';
}

export interface AcademicGrade {
  _id: string;
  student: {
    _id: string;
    fullName: string;
    email: string;
    phone?: string;
  };
  class: {
    _id: string;
    classCode: string;
    name: string;
  };
  evaluationType: GradeEvaluationType;
  title: string;
  period?: string;
  rating?: EvaluationRating;
  testDate: string;
  overallBand?: number;
  listening?: number;
  reading?: number;
  writing?: number;
  speaking?: number;
  feedback?: string;
  status: 'DRAFT' | 'PUBLISHED';
}

export interface ScheduleChangeRequest {
  _id: string;
  currentClass: {
    _id: string;
    classCode: string;
    name: string;
    room?: string;
  };
  currentSchedule?: string;
  targetSchedule?: string;
  sessionDate?: string;
  targetDate?: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy?: {
    _id: string;
    fullName: string;
  };
  reviewNote?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface AttendanceRecord {
  _id: string;
  class: {
    _id: string;
    classCode: string;
    name: string;
  };
  classSchedule?: string;
  student: {
    _id: string;
    fullName: string;
    email: string;
  };
  sessionDate: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  notes?: string;
}

export const teacherService = {
  // 1. Classes
  getAssignedClasses: async () => {
    const res = await api.get('/teacher/classes');
    return res.data;
  },
  getClassDetail: async (classId: string) => {
    const res = await api.get(`/teacher/classes/${classId}`);
    return res.data;
  },

  // 2. Students & Information
  getStudents: async (params?: { classId?: string; search?: string }) => {
    const res = await api.get('/teacher/students', { params });
    return res.data;
  },
  getStudentDetail: async (studentId: string) => {
    const res = await api.get(`/teacher/students/${studentId}`);
    return res.data;
  },

  // 3. Teaching Schedule (Timetable)
  getTeachingSchedule: async (params?: { classId?: string }) => {
    const res = await api.get('/teacher/schedule', { params });
    return res.data;
  },

  // 4. Periodic Grades & General Evaluations (Monthly / Course)
  getStudentAcademicResults: async (params?: {
    classId?: string;
    studentId?: string;
    evaluationType?: string;
    category?: 'TESTS' | 'EVALUATIONS';
  }) => {
    const res = await api.get('/teacher/grades', { params });
    return res.data;
  },
  createGrade: async (data: {
    studentId: string;
    classId: string;
    evaluationType: GradeEvaluationType;
    title: string;
    period?: string;
    rating?: EvaluationRating;
    testDate?: string;
    overallBand?: number;
    listening?: number;
    reading?: number;
    writing?: number;
    speaking?: number;
    feedback?: string;
  }) => {
    const res = await api.post('/teacher/grades', data);
    return res.data;
  },
  updateGrade: async (gradeId: string, data: any) => {
    const res = await api.put(`/teacher/grades/${gradeId}`, data);
    return res.data;
  },
  deleteGrade: async (gradeId: string) => {
    const res = await api.delete(`/teacher/grades/${gradeId}`);
    return res.data;
  },

  // 5. Schedule Change Requests & Tracking
  submitScheduleChangeRequest: async (data: {
    currentClassId: string;
    currentSchedule?: string;
    targetSchedule?: string;
    sessionDate?: string;
    targetDate?: string;
    reason: string;
  }) => {
    const res = await api.post('/teacher/schedule-requests', data);
    return res.data;
  },
  getScheduleChangeRequests: async () => {
    const res = await api.get('/teacher/schedule-requests');
    return res.data;
  },

  // 6. Session Attendance
  getAttendance: async (params?: { classId?: string; sessionDate?: string; classScheduleId?: string }) => {
    const res = await api.get('/teacher/attendance', { params });
    return res.data;
  },
  checkAttendance: async (data: {
    classId: string;
    sessionDate?: string;
    classScheduleId?: string;
    records: Array<{
      studentId: string;
      status: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED';
      notes?: string;
    }>;
  }) => {
    const res = await api.post('/teacher/attendance', data);
    return res.data;
  },
};
