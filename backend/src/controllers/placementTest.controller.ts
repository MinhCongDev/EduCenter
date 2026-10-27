import { Request, Response } from 'express';
import { PLACEMENT_TESTS } from '../data/placementTests.data';
import { AuthRequest } from '../middlewares/auth.middleware';

// In-memory store for recent test submissions (or persisted per user)
const userTestHistoryMap = new Map<string, any[]>();

/**
 * 1. GET /api/placement-tests
 * List all available placement tests (summary info)
 */
export const getPlacementTests = async (_req: Request, res: Response): Promise<void> => {
  try {
    const list = PLACEMENT_TESTS.map((t) => ({
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
    }));

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách bài thi test đầu vào thành công',
      data: list,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Lỗi tải danh sách bài thi: ' + err.message,
    });
  }
};

/**
 * 2. GET /api/placement-tests/:id
 * Get full test paper for taking the test (answers masked for security)
 */
export const getPlacementTestById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const test = PLACEMENT_TESTS.find((t) => t.id === id);

    if (!test) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài test đầu vào yêu cầu',
      });
      return;
    }

    // Sanitize questions: strip correctAnswer and explanation before exam submission
    const sanitizedQuestions = test.questions.map((q) => ({
      id: q.id,
      questionNumber: q.questionNumber,
      type: q.type,
      section: q.section,
      passageId: q.passageId,
      questionText: q.questionText,
      options: q.options,
      skill: q.skill,
    }));

    res.status(200).json({
      success: true,
      message: 'Tải đề thi thành công',
      data: {
        id: test.id,
        title: test.title,
        subtitle: test.subtitle,
        category: test.category,
        targetLevel: test.targetLevel,
        durationMinutes: test.durationMinutes,
        totalQuestions: test.totalQuestions,
        difficulty: test.difficulty,
        bannerUrl: test.bannerUrl,
        description: test.description,
        instructions: test.instructions,
        passages: test.passages || [],
        questions: sanitizedQuestions,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Lỗi tải đề thi: ' + err.message,
    });
  }
};

/**
 * 3. POST /api/placement-tests/:id/submit
 * Submit answers, score, evaluate skills, and generate course recommendations
 */
export const submitPlacementTest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { answers } = req.body as { answers: Record<string, string> };

    const test = PLACEMENT_TESTS.find((t) => t.id === id);
    if (!test) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài test đầu vào',
      });
      return;
    }

    const submittedAnswers = answers || {};
    let correctCount = 0;

    // Skill breakdown tracking
    const skillStats: Record<string, { total: number; correct: number }> = {
      Grammar: { total: 0, correct: 0 },
      Vocabulary: { total: 0, correct: 0 },
      Reading: { total: 0, correct: 0 },
      'Critical Reasoning': { total: 0, correct: 0 },
    };

    const detailedResults = test.questions.map((q) => {
      const userChoice = (submittedAnswers[q.id] || '').trim().toUpperCase();
      const isCorrect = userChoice === q.correctAnswer.toUpperCase();

      if (isCorrect) {
        correctCount += 1;
      }

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

    // Calculate skill radar/breakdown percentages
    const skillBreakdown = Object.entries(skillStats).map(([skill, stats]) => ({
      skill,
      correct: stats.correct,
      total: stats.total,
      percentage: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
    }));

    // Generate accurate recommendations
    const recommendations = test.getRecommendations(correctCount, totalQuestions);

    const resultPayload = {
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

    // If student is logged in, save to history
    if (req.user?._id) {
      const userId = req.user._id.toString();
      const history = userTestHistoryMap.get(userId) || [];
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
      userTestHistoryMap.set(userId, history.slice(0, 20));
    }

    res.status(200).json({
      success: true,
      message: 'Chấm điểm và gợi ý khóa học thành công!',
      data: resultPayload,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Lỗi xử lý kết quả thi: ' + err.message,
    });
  }
};

/**
 * 4. GET /api/placement-tests/my/history
 * Get logged-in user's test history
 */
export const getMyTestHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id?.toString();
    const history = userId ? userTestHistoryMap.get(userId) || [] : [];

    res.status(200).json({
      success: true,
      message: 'Lấy lịch sử làm bài test thành công',
      data: history,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Lỗi tải lịch sử test: ' + err.message,
    });
  }
};
