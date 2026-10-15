import api from './api';

export interface StudentService {
  getClasses: () => Promise<any>;
  getSchedule: () => Promise<any>;
  getAssignments: () => Promise<any>;
  submitAssignment: (id: string, data: { content: string; attachments?: string[] }) => Promise<any>;
  getAcademicResults: () => Promise<any>;
  createChangeRequest: (data: {
    requestType: 'CLASS_CHANGE' | 'SCHEDULE_CHANGE';
    currentClass: string;
    targetClass?: string;
    targetSchedule?: string;
    reason: string;
  }) => Promise<any>;
  getChangeRequests: () => Promise<any>;
  getAttendance: () => Promise<any>;
  submitFeedback: (data: {
    receiver?: string;
    classId?: string;
    courseId?: string;
    content: string;
    rating: number;
    tags?: string[];
  }) => Promise<any>;
  getRegistrations: () => Promise<any>;
  makePayment: (data: {
    enrollmentId?: string;
    courseId?: string;
    amount: number;
    method?: string;
    note?: string;
  }) => Promise<any>;
}

export const studentService: StudentService = {
  getClasses: async () => {
    const res = await api.get('/student/classes');
    return res.data?.data;
  },

  getSchedule: async () => {
    const res = await api.get('/student/schedule');
    return res.data?.data;
  },

  getAssignments: async () => {
    const res = await api.get('/student/assignments');
    return res.data?.data;
  },

  submitAssignment: async (id: string, data) => {
    const res = await api.post(`/student/assignments/${id}/submit`, data);
    return res.data;
  },

  getAcademicResults: async () => {
    const res = await api.get('/student/academic-results');
    return res.data?.data;
  },

  createChangeRequest: async (data) => {
    const res = await api.post('/student/change-requests', data);
    return res.data;
  },

  getChangeRequests: async () => {
    const res = await api.get('/student/change-requests');
    return res.data?.data;
  },

  getAttendance: async () => {
    const res = await api.get('/student/attendance');
    return res.data?.data;
  },

  submitFeedback: async (data) => {
    const res = await api.post('/student/feedback', data);
    return res.data;
  },

  getRegistrations: async () => {
    const res = await api.get('/student/registrations');
    return res.data?.data;
  },

  makePayment: async (data) => {
    const res = await api.post('/student/payments', data);
    return res.data;
  },
};

export default studentService;
