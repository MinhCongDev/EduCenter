import api from './api';

export interface TeacherService {
  getClasses: () => Promise<any>;
  getClassStudents: (classId: string) => Promise<any>;
  getSchedule: () => Promise<any>;
  getAssignments: () => Promise<any>;
  createAssignment: (data: {
    classId: string;
    title: string;
    description?: string;
    dueDate: string;
    maxScore?: number;
    attachments?: string[];
    type?: string;
  }) => Promise<any>;
  getSubmissions: (assignmentId: string) => Promise<any>;
  gradeSubmission: (
    submissionId: string,
    data: { grade: number; feedback?: string }
  ) => Promise<any>;
  updateStudentGrade: (
    enrollmentId: string,
    data: { finalScore?: number; midtermScore?: number; academicResult?: string }
  ) => Promise<any>;
  createScheduleChangeRequest: (data: {
    currentClass: string;
    targetSchedule?: string;
    reason: string;
  }) => Promise<any>;
  getChangeRequests: () => Promise<any>;
  getClassAttendance: (classId: string) => Promise<any>;
  checkAttendance: (data: {
    classId: string;
    sessionDate?: string;
    records: Array<{ studentId: string; status: string; notes?: string }>;
  }) => Promise<any>;
}

export const teacherService: TeacherService = {
  getClasses: async () => {
    const res = await api.get('/teacher/classes');
    return res.data?.data;
  },

  getClassStudents: async (classId: string) => {
    const res = await api.get(`/teacher/classes/${classId}/students`);
    return res.data?.data;
  },

  getSchedule: async () => {
    const res = await api.get('/teacher/schedule');
    return res.data?.data;
  },

  getAssignments: async () => {
    const res = await api.get('/teacher/assignments');
    return res.data?.data;
  },

  createAssignment: async (data) => {
    const res = await api.post('/teacher/assignments', data);
    return res.data;
  },

  getSubmissions: async (assignmentId: string) => {
    const res = await api.get(`/teacher/assignments/${assignmentId}/submissions`);
    return res.data?.data;
  },

  gradeSubmission: async (submissionId, data) => {
    const res = await api.post(`/teacher/submissions/${submissionId}/grade`, data);
    return res.data;
  },

  updateStudentGrade: async (enrollmentId, data) => {
    const res = await api.put(`/teacher/enrollments/${enrollmentId}/grade`, data);
    return res.data;
  },

  createScheduleChangeRequest: async (data) => {
    const res = await api.post('/teacher/schedule-change-request', data);
    return res.data;
  },

  getChangeRequests: async () => {
    const res = await api.get('/teacher/change-requests');
    return res.data?.data;
  },

  getClassAttendance: async (classId: string) => {
    const res = await api.get(`/teacher/attendance/${classId}`);
    return res.data?.data;
  },

  checkAttendance: async (data) => {
    const res = await api.post('/teacher/attendance', data);
    return res.data;
  },
};

export default teacherService;
