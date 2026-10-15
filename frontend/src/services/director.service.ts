import api from './api';

export const directorService = {
  // UC52: View Staff Accounts List
  getStaffList: async () => {
    const res = await api.get('/director/staff-list');
    return res.data?.data;
  },

  // UC53: Add Staff Account
  addStaffAccount: async (data: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
    department?: string;
    position?: string;
  }) => {
    const res = await api.post('/director/staff-account', data);
    return res.data;
  },

  // UC54: Monitor Center Operations
  getOperations: async () => {
    const res = await api.get('/director/operations');
    return res.data?.data;
  },

  // Monitor Student Activities
  getStudentActivities: async () => {
    const res = await api.get('/director/student-activities');
    return res.data?.data;
  },

  // Monitor Teacher Activities
  getTeacherActivities: async () => {
    const res = await api.get('/director/teacher-activities');
    return res.data?.data;
  },

  // UC56: View Student Reports
  getStudentReports: async () => {
    const res = await api.get('/director/reports/students');
    return res.data?.data;
  },

  // UC57: View Teacher Reports
  getTeacherReports: async () => {
    const res = await api.get('/director/reports/teachers');
    return res.data?.data;
  },

  // UC58: View Class Reports
  getClassReports: async () => {
    const res = await api.get('/director/reports/classes');
    return res.data?.data;
  },

  // UC59: View Course Reports
  getCourseReports: async () => {
    const res = await api.get('/director/reports/courses');
    return res.data?.data;
  },

  // UC60: View Revenue Reports (Real transactions from DB)
  getRevenueReports: async () => {
    const res = await api.get('/director/reports/revenue');
    return res.data?.data;
  },
};

export default directorService;
