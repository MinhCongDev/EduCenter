import api from './api';

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
  };
  schedules?: Array<{
    _id: string;
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
    overallBand: number;
    testDate: string;
  } | null;
}

export interface StudentDetailData {
  student: TeacherStudent;
  enrollments: any[];
  grades: AcademicGrade[];
  attendance: any[];
  submissions: any[];
}

export interface TeachingScheduleItem {
  _id: string;
  class: {
    _id: string;
    classCode: string;
    name: string;
    room: string;
    timeSlot: string;
    capacity: number;
    currentEnrollment: number;
  };
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  classroom: string;
  topic?: string;
  status: 'ACTIVE' | 'CANCELLED';
}

export interface TeacherAssignment {
  _id: string;
  title: string;
  description: string;
  skill: string;
  dueDate: string;
  maxScore: number;
  attachments?: string[];
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  class: {
    _id: string;
    classCode: string;
    name: string;
    room?: string;
  };
  stats: {
    totalStudents: number;
    submittedCount: number;
    gradedCount: number;
    pendingCount: number;
  };
  createdAt: string;
}

export interface AssignmentSubmission {
  _id: string;
  assignment: any;
  student: {
    _id: string;
    fullName: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
  };
  content: string;
  attachments?: string[];
  submissionTime: string;
  grade?: number;
  feedback?: string;
  criteria?: {
    taskAchievement?: number;
    coherenceCohesion?: number;
    lexicalResource?: number;
    grammaticalAccuracy?: number;
  };
  status: 'SUBMITTED' | 'GRADED' | 'LATE' | 'PENDING';
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
  evaluationType: 'MOCK_TEST' | 'MID_TERM' | 'FINAL_TEST' | 'ASSIGNMENT' | 'SPEAKING_ASSESSMENT' | 'WRITING_ASSESSMENT';
  title: string;
  testDate: string;
  overallBand: number;
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
  getTeachingSchedule: async () => {
    const res = await api.get('/teacher/schedule');
    return res.data;
  },

  // 4. Assignments & Grading
  getAssignments: async (params?: { classId?: string }) => {
    const res = await api.get('/teacher/assignments', { params });
    return res.data;
  },
  createAssignment: async (data: {
    classId: string;
    title: string;
    description?: string;
    skill?: string;
    dueDate: string;
    maxScore?: number;
    status?: string;
  }) => {
    const res = await api.post('/teacher/assignments', data);
    return res.data;
  },
  updateAssignment: async (assignmentId: string, data: any) => {
    const res = await api.put(`/teacher/assignments/${assignmentId}`, data);
    return res.data;
  },
  deleteAssignment: async (assignmentId: string) => {
    const res = await api.delete(`/teacher/assignments/${assignmentId}`);
    return res.data;
  },
  getAssignmentSubmissions: async (assignmentId: string) => {
    const res = await api.get(`/teacher/assignments/${assignmentId}/submissions`);
    return res.data;
  },
  gradeSubmission: async (
    submissionId: string,
    data: {
      grade: number;
      feedback?: string;
      criteria?: {
        taskAchievement?: number;
        coherenceCohesion?: number;
        lexicalResource?: number;
        grammaticalAccuracy?: number;
      };
    }
  ) => {
    const res = await api.post(`/teacher/submissions/${submissionId}/grade`, data);
    return res.data;
  },

  // 5. Academic Results & Grade Updating
  getStudentAcademicResults: async (params?: { classId?: string; studentId?: string; evaluationType?: string }) => {
    const res = await api.get('/teacher/grades', { params });
    return res.data;
  },
  createGrade: async (data: {
    studentId: string;
    classId: string;
    evaluationType: string;
    title: string;
    testDate?: string;
    overallBand: number;
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

  // 6. Schedule Change Requests & Tracking
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

  // 7. Attendance
  getAttendance: async (params?: { classId?: string; sessionDate?: string }) => {
    const res = await api.get('/teacher/attendance', { params });
    return res.data;
  },
  checkAttendance: async (data: {
    classId: string;
    sessionDate?: string;
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
