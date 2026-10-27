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
  skill: 'Grammar' | 'Vocabulary' | 'Reading' | 'Critical Reasoning' | string;
}

export interface PlacementTestDetail extends PlacementTestSummary {
  passages: PlacementPassage[];
  questions: PlacementQuestion[];
}

export interface RecommendedCourseDetail {
  code: string;
  title: string;
  targetLevel: string;
  tuitionFee: number;
  durationWeeks: number;
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
  recommendedCourse: string;
}

export const placementTestService = {
  // 1. Lấy danh sách tất cả bài kiểm tra đầu vào trực tiếp từ MongoDB Atlas
  getTests: async (): Promise<PlacementTestSummary[]> => {
    try {
      const res = await api.get<{ success: boolean; data: PlacementTestSummary[] }>('/placement-tests');
      if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        return res.data.data;
      }
    } catch (e) {
      console.warn('Backend API /placement-tests không phản hồi, sử dụng dữ liệu dự phòng:', e);
    }
    return FALLBACK_TEST_SUMMARIES;
  },

  // 2. Lấy chi tiết bài kiểm tra theo ID / Slug trực tiếp từ MongoDB
  getTestById: async (id: string): Promise<PlacementTestDetail | null> => {
    try {
      const res = await api.get<{ success: boolean; data: PlacementTestDetail }>(`/placement-tests/${id}`);
      if (res.data?.success && res.data.data) {
        return res.data.data;
      }
    } catch (e) {
      console.warn('Backend API /placement-tests/:id không phản hồi, sử dụng fallback:', e);
    }
    return FALLBACK_TEST_DETAILS[id] || null;
  },

  // 3. Nộp bài làm: Hệ thống chấm điểm trực tiếp trên MongoDB và lưu điểm vào hồ sơ học viên
  submitTest: async (id: string, answers: Record<string, string>): Promise<PlacementResultResponse> => {
    try {
      const res = await api.post<{ success: boolean; data: PlacementResultResponse }>(
        `/placement-tests/${id}/submit`,
        { answers }
      );
      if (res.data?.success && res.data.data) {
        const result = res.data.data;
        // Lưu lịch sử vào local storage backup
        try {
          const history = JSON.parse(localStorage.getItem('educenter_placement_history') || '[]');
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
            recommendedCourse: result.primaryCourse?.title || '',
          });
          localStorage.setItem('educenter_placement_history', JSON.stringify(history.slice(0, 15)));
        } catch {
          // ignore
        }
        return result;
      }
    } catch (e) {
      console.warn('Lỗi khi nộp bài lên server, chuyển sang chấm điểm cục bộ:', e);
    }

    return evaluateLocally(id, answers);
  },

  // 4. Lấy lịch sử làm bài kiểm tra
  getMyHistory: async (): Promise<TestHistoryItem[]> => {
    try {
      const res = await api.get<{ success: boolean; data: TestHistoryItem[] }>('/placement-tests/my/history');
      if (res.data?.success && res.data.data) {
        return res.data.data;
      }
    } catch {
      // Ignore
    }
    // Local storage fallback
    const saved = localStorage.getItem('educenter_placement_history');
    return saved ? JSON.parse(saved) : [];
  },
};

// ==========================================
// Fallback Summaries & Offline Evaluation
// ==========================================
const FALLBACK_TEST_SUMMARIES: PlacementTestSummary[] = [
  {
    id: 'ielts-diagnostic-01',
    title: 'IELTS Diagnostic Placement Test - Ngữ Pháp & Từ Vựng Cốt Lõi',
    subtitle: 'Đánh giá năng lực xuất phát điểm từ Mất gốc đến Trung cấp (Band 0 - 5.5)',
    category: 'Chẩn đoán nền tảng',
    targetLevel: 'Band 0.0 - 5.5',
    durationMinutes: 30,
    totalQuestions: 25,
    difficulty: 'Cơ bản - Trung cấp',
    bannerUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800&auto=format&fit=crop',
    description:
      'Bài thi chẩn đoán tổng quan các chủ điểm ngữ pháp cốt lõi, từ vựng học thuật thiết yếu và kỹ năng đọc hiểu văn bản ngắn. Phù hợp cho người bắt đầu hoặc cần xác định lộ trình học từ con số 0.',
    instructions: [
      'Bài thi gồm 25 câu hỏi trắc nghiệm, thời gian làm bài là 30 phút.',
      'Không sử dụng từ điển hoặc công cụ tra cứu trong quá trình làm bài.',
      'Hệ thống tự động nộp bài khi hết thời gian quy định.',
      'Nhận ngay kết quả, phân tích điểm mạnh/yếu và gợi ý khóa học phù hợp.',
    ],
  },
  {
    id: 'ielts-reading-real-02',
    title: 'IELTS Academic Reading Real Test - Đọc Hiểu Học Thuật Thực Chiến',
    subtitle: 'Đề thi thật Cambridge IELTS 16-19 • Đo lường khả năng đọc hiểu & bẫy học thuật (Band 5.0 - 7.5+)',
    category: 'Đề thi thật Reading',
    targetLevel: 'Band 5.0 - 7.5+',
    durationMinutes: 40,
    totalQuestions: 28,
    difficulty: 'Trung cấp - Khá',
    bannerUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=800&auto=format&fit=crop',
    description:
      'Đề thi đọc hiểu học thuật thực chiến trích xuất từ ngân hàng đề thi thật Cambridge IELTS. Thử thách kỹ năng đọc lướt, định vị từ khóa tinh vi, dạng bài True/False/Not Given, Matching Headings và Multiple Choice.',
    instructions: [
      'Bài thi gồm 2 bài đọc dài chuẩn học thuật (Passages 1 & 2) với 28 câu hỏi.',
      'Thời gian làm bài quy định: 40 phút.',
      'Giao diện chia đôi màn hình: Bên trái đọc bài, bên phải trả lời câu hỏi.',
      'Hệ thống tính toán band điểm Reading và gợi ý khóa học chuyên sâu.',
    ],
  },
  {
    id: 'ielts-comprehensive-predictor-03',
    title: 'IELTS Comprehensive Band Predictor - Dự Đoán Overall Band',
    subtitle: 'Đánh giá năng lực toàn diện 4 khía cạnh học thuật • Dự đoán chính xác Overall Band (Band 4.5 - 8.5+)',
    category: 'Dự đoán Band toàn diện',
    targetLevel: 'Band 4.5 - 8.5+',
    durationMinutes: 45,
    totalQuestions: 30,
    difficulty: 'Nâng cao - Chuyên sâu',
    bannerUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop',
    description:
      'Bài thi toàn diện phân hóa chuyên sâu kiểm tra vốn từ vựng học thuật cao cấp C1-C2, cấu trúc ngữ pháp đảo ngữ / phức hợp, đọc hiểu tư duy phản biện và phân tích tính liên kết logic trong bài viết học thuật.',
    instructions: [
      'Bài thi gồm 30 câu hỏi phân bổ qua 4 phần chuyên biệt, thời lượng: 45 phút.',
      'Bao gồm 1 bài đọc nghiên cứu nhận thức học thuật chuyên sâu.',
      'Dự đoán chính xác Band điểm Overall IELTS (từ 4.5 đến 8.5+).',
      'Đề xuất lộ trình học và khóa học EduCenter tối ưu nhất.',
    ],
  },
];

// Fallback test details registry (imported dynamically or minimal fallback)
import { PLACEMENT_TESTS } from './placementDataFallback';

const FALLBACK_TEST_DETAILS: Record<string, PlacementTestDetail> = {};
PLACEMENT_TESTS.forEach((t) => {
  FALLBACK_TEST_DETAILS[t.id] = {
    id: t.id,
    title: t.title,
    subtitle: t.subtitle,
    category: t.category,
    targetLevel: t.targetLevel,
    durationMinutes: t.durationMinutes,
    totalQuestions: t.totalQuestions,
    difficulty: t.difficulty,
    bannerUrl: t.bannerUrl,
    description: t.description,
    instructions: t.instructions,
    passages: t.passages || [],
    questions: t.questions.map((q) => ({
      id: q.id,
      questionNumber: q.questionNumber,
      type: q.type,
      section: q.section,
      passageId: q.passageId,
      questionText: q.questionText,
      options: q.options,
      skill: q.skill,
    })),
  };
});

// Evaluate locally if backend offline
function evaluateLocally(testId: string, submittedAnswers: Record<string, string>): PlacementResultResponse {
  const test = PLACEMENT_TESTS.find((t) => t.id === testId) || PLACEMENT_TESTS[0];
  let correctCount = 0;

  const skillStats: Record<string, { total: number; correct: number }> = {
    Grammar: { total: 0, correct: 0 },
    Vocabulary: { total: 0, correct: 0 },
    Reading: { total: 0, correct: 0 },
    'Critical Reasoning': { total: 0, correct: 0 },
  };

  const detailedResults = test.questions.map((q) => {
    const userChoice = (submittedAnswers[q.id] || '').trim().toUpperCase();
    const isCorrect = userChoice === q.correctAnswer.toUpperCase();

    if (isCorrect) correctCount += 1;

    if (skillStats[q.skill]) {
      skillStats[q.skill].total += 1;
      if (isCorrect) skillStats[q.skill].correct += 1;
    }

    return {
      id: q.id,
      questionNumber: q.questionNumber,
      type: q.type,
      section: q.section,
      questionText: q.questionText,
      options: q.options,
      userAnswer: userChoice || 'UNANSWERED',
      correctAnswer: q.correctAnswer,
      isCorrect,
      explanation: q.explanation,
      skill: q.skill,
    };
  });

  const totalQuestions = test.questions.length;
  const scorePercentage = Math.round((correctCount / totalQuestions) * 100);

  const skillBreakdown = Object.entries(skillStats).map(([skill, stats]) => ({
    skill,
    correct: stats.correct,
    total: stats.total,
    percentage: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
  }));

  const recommendations = test.getRecommendations(correctCount, totalQuestions);

  const result: PlacementResultResponse = {
    testId: test.id,
    testTitle: test.title,
    submittedAt: new Date().toISOString(),
    score: correctCount,
    totalQuestions,
    scorePercentage,
    predictedBand: recommendations.predictedBand,
    bandRange: recommendations.bandRange,
    levelName: recommendations.levelName,
    summaryFeedback: recommendations.summaryFeedback,
    primaryCourse: recommendations.primaryCourse,
    secondaryCourses: recommendations.secondaryCourses,
    skillBreakdown,
    detailedResults,
  };

  // Save to local storage history
  try {
    const history = JSON.parse(localStorage.getItem('educenter_placement_history') || '[]');
    history.unshift({
      id: `RES-${Date.now()}`,
      testId: test.id,
      testTitle: test.title,
      submittedAt: new Date().toISOString(),
      score: correctCount,
      totalQuestions,
      scorePercentage,
      predictedBand: recommendations.predictedBand,
      levelName: recommendations.levelName,
      recommendedCourse: recommendations.primaryCourse.title,
    });
    localStorage.setItem('educenter_placement_history', JSON.stringify(history.slice(0, 15)));
  } catch (e) {
    // Ignore storage issues
  }

  return result;
}
