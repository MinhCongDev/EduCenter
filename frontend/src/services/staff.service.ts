import api from './api';

export const staffService = {
  // UC39: Courses
  getCourses: async () => {
    const res = await api.get('/staff/courses');
    return res.data?.data;
  },
  createCourse: async (data: any) => {
    const res = await api.post('/staff/courses', data);
    return res.data;
  },
  updateCourse: async (id: string, data: any) => {
    const res = await api.put(`/staff/courses/${id}`, data);
    return res.data;
  },

  // UC40: Students
  getStudents: async (search?: string) => {
    const res = await api.get('/staff/students', { params: { search } });
    return res.data?.data;
  },
  updateStudent: async (id: string, data: any) => {
    const res = await api.put(`/staff/students/${id}`, data);
    return res.data;
  },

  // UC41: Teachers
  getTeachers: async () => {
    const res = await api.get('/staff/teachers');
    return res.data?.data;
  },
  updateTeacher: async (id: string, data: any) => {
    const res = await api.put(`/staff/teachers/${id}`, data);
    return res.data;
  },

  // UC42: Classes
  getClasses: async () => {
    const res = await api.get('/staff/classes');
    return res.data?.data;
  },
  createClass: async (data: any) => {
    const res = await api.post('/staff/classes', data);
    return res.data;
  },
  updateClass: async (id: string, data: any) => {
    const res = await api.put(`/staff/classes/${id}`, data);
    return res.data;
  },

  // UC43: Assign student
  assignStudent: async (classId: string, studentId: string) => {
    const res = await api.post(`/staff/classes/${classId}/assign-student`, { studentId });
    return res.data;
  },

  // UC44: Assign teacher
  assignTeacher: async (classId: string, teacherId: string) => {
    const res = await api.post(`/staff/classes/${classId}/assign-teacher`, { teacherId });
    return res.data;
  },

  // UC45: Schedules
  getSchedules: async () => {
    const res = await api.get('/staff/schedules');
    return res.data?.data;
  },
  createSchedule: async (data: any) => {
    const res = await api.post('/staff/schedules', data);
    return res.data;
  },

  // UC46: Registrations
  getRegistrations: async () => {
    const res = await api.get('/staff/registrations');
    return res.data?.data;
  },

  // UC47: Payments
  getPayments: async () => {
    const res = await api.get('/staff/payments');
    return res.data?.data;
  },
  confirmPayment: async (id: string, status = 'SUCCESS') => {
    const res = await api.put(`/staff/payments/${id}/confirm`, { status });
    return res.data;
  },

  // UC48 & UC49: Change requests
  getChangeRequests: async () => {
    const res = await api.get('/staff/change-requests');
    return res.data?.data;
  },
  processChangeRequest: async (id: string, data: { status: string; reviewNote?: string }) => {
    const res = await api.put(`/staff/change-requests/${id}`, data);
    return res.data;
  },

  // UC50 & UC51: Academic results
  getAcademicResults: async (classId?: string) => {
    const res = await api.get('/staff/academic-results', { params: { classId } });
    return res.data?.data;
  },

  // Final Exam
  getFinalExams: async () => {
    const res = await api.get('/staff/final-exams');
    return res.data?.data;
  },
  createFinalExam: async (data: any) => {
    const res = await api.post('/staff/final-exams', data);
    return res.data;
  },
};

export default staffService;
