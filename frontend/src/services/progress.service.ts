import api from './api';

export interface MilestoneItem {
  milestoneId: string;
  title: string;
  description?: string;
  order: number;
  type?: 'LESSON_COMPLETION' | 'ASSIGNMENT' | 'MOCK_TEST' | 'SKILL_CHECK' | 'CHECKPOINT';
  targetSession?: number;
  isCompleted?: boolean;
  completedAt?: string;
  markedByName?: string;
  note?: string;
  score?: number;
}

export interface StudentProgressSummary {
  enrollmentId: string;
  classId: string;
  classCode: string;
  className: string;
  room?: string;
  timeSlot?: string;
  teacherName: string;
  courseId: string;
  courseTitle: string;
  courseCode: string;
  sessions: number;
  targetLevel?: string;
  progressPercentage: number;
  completedCount: number;
  totalMilestones: number;
  nextMilestone?: MilestoneItem;
  milestones: MilestoneItem[];
}

export interface StudentInClassProgress {
  studentId: string;
  fullName: string;
  email: string;
  phone?: string;
  studentCode: string;
  currentBand: number;
  targetBand: number;
  completedCount: number;
  totalMilestones: number;
  progressPercentage: number;
  completedMilestoneIds: string[];
  records: Array<{
    milestoneId: string;
    completedAt: string;
    markedByName: string;
    note?: string;
    score?: number;
  }>;
}

export interface ClassProgressData {
  classInfo: {
    _id: string;
    classCode: string;
    name: string;
    room: string;
    timeSlot: string;
    capacity: number;
    currentEnrollment: number;
  };
  courseInfo: {
    _id: string;
    title: string;
    code: string;
    sessions: number;
    entryLevel: string;
    targetLevel: string;
  };
  milestones: MilestoneItem[];
  students: StudentInClassProgress[];
}

export const progressService = {
  getMyProgress: async () => {
    const res = await api.get<{ success: boolean; data: StudentProgressSummary[] }>('/progress/my-progress');
    return res.data;
  },

  getClassProgress: async (classId: string) => {
    const res = await api.get<{ success: boolean; data: ClassProgressData }>(`/progress/class/${classId}`);
    return res.data;
  },

  markMilestone: async (payload: {
    studentId: string;
    classId: string;
    milestoneId: string;
    completed: boolean;
    note?: string;
    score?: number;
  }) => {
    const res = await api.post<{ success: boolean; data: any }>('/progress/mark', payload);
    return res.data;
  },

  updateCourseMilestones: async (courseId: string, milestones: MilestoneItem[]) => {
    const res = await api.put<{ success: boolean; data: any }>(`/progress/course/${courseId}/milestones`, { milestones });
    return res.data;
  },
};
