import api from './api';

export interface PlacementTestSummary {
  _id?: string;
  id: string;
  slug?: string;
  title: string;
  subtitle: string;
  category: string;
  targetLevel: string;
  durationMinutes: number;
  totalQuestions: number;
  skills: string[];
  difficulty: string;
  bannerUrl: string;
  description: string;
  instructions: string[];
  course?: { _id: string; code: string; title: string };
  status?: string;
}

export interface PlacementPassage {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
}

export interface PlacementQuestion {
  id: string;
  questionNumber: number;
  type: string;
  section: string;
  passageId?: string;
  questionText: string;
  options: Array<{ key: string; text: string }>;
  skill: string;
}

export interface PlacementTestDetail extends PlacementTestSummary {
  passages: PlacementPassage[];
  questions: PlacementQuestion[];
}

export interface RecommendedCourseDetail {
  _id?: string;
  code: string;
  title: string;
  targetLevel: string;
  entryLevel?: string;
  tuitionFee: number;
  durationWeeks: number;
  sessions?: number;
  badge: string;
  description: string;
  whyRecommended: string;
  highlights: string[];
}

export interface SkillBreakdown {
  skill: string;
  correct: number;
  total: number;
  percentage: number;
}

export interface DetailedQuestionResult {
  id: string;
  questionNumber: number;
  type: string;
  section: string;
  questionText: string;
  options: Array<{ key: string; text: string }>;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
  skill: string;
}

export interface PlacementResultResponse {
  testId: string;
  testTitle: string;
  submittedAt: string;
  score: number;
  totalQuestions: number;
  scorePercentage: number;
  predictedBand: number;
  bandRange: string;
  levelName: string;
  matchedLevel?: string;
  summaryFeedback: string;
  primaryCourse: RecommendedCourseDetail;
  secondaryCourses: RecommendedCourseDetail[];
  skillBreakdown: SkillBreakdown[];
  detailedResults: DetailedQuestionResult[];
}

export interface TestHistoryItem {
  id: string;
  testId: string;
  testTitle: string;
  submittedAt: string;
  score: number;
  totalQuestions: number;
  scorePercentage: number;
  predictedBand: number;
  levelName: string;
  matchedLevel?: string;
  recommendedCourse: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data?: T;
}

const getApiData = <T>(response: ApiEnvelope<T>): T => {
  if (!response.success || response.data === undefined) {
    throw new Error(response.message || 'Phản hồi API bài kiểm tra không hợp lệ.');
  }
  return response.data;
};

const readLocalHistory = (): TestHistoryItem[] => {
  try {
    const saved = localStorage.getItem('educenter_placement_history');
    if (!saved) return [];
    const parsed: unknown = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed as TestHistoryItem[] : [];
  } catch {
    return [];
  }
};

export const placementTestService = {
  async getTests(): Promise<PlacementTestSummary[]> {
    const response = await api.get<ApiEnvelope<PlacementTestSummary[]>>('/placement-tests');
    const tests = getApiData(response.data);
    if (!Array.isArray(tests)) throw new Error('Danh sách bài kiểm tra trả về không hợp lệ.');
    return tests;
  },

  async getTestById(id: string): Promise<PlacementTestDetail | null> {
    const response = await api.get<ApiEnvelope<PlacementTestDetail>>(`/placement-tests/${encodeURIComponent(id)}`);
    return getApiData(response.data);
  },

  async submitTest(id: string, answers: Record<string, string>): Promise<PlacementResultResponse> {
    const response = await api.post<ApiEnvelope<PlacementResultResponse>>(
      `/placement-tests/${encodeURIComponent(id)}/submit`,
      { answers }
    );
    const result = getApiData(response.data);

    try {
      const history = readLocalHistory();
      history.unshift({
        id: `RES-${Date.now()}`,
        testId: result.testId,
        testTitle: result.testTitle,
        submittedAt: result.submittedAt,
        score: result.score,
        totalQuestions: result.totalQuestions,
        scorePercentage: result.scorePercentage,
        predictedBand: result.predictedBand,
        levelName: result.levelName,
        matchedLevel: result.matchedLevel,
        recommendedCourse: result.primaryCourse?.title || '',
      });
      localStorage.setItem('educenter_placement_history', JSON.stringify(history.slice(0, 15)));
    } catch {
      // The server result remains valid if browser storage is unavailable.
    }

    return result;
  },

  async getMyHistory(): Promise<TestHistoryItem[]> {
    try {
      const response = await api.get<ApiEnvelope<TestHistoryItem[]>>('/placement-tests/my/history');
      return getApiData(response.data);
    } catch {
      return readLocalHistory();
    }
  },
};
