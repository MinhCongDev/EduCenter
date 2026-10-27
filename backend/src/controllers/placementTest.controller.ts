import { NextFunction, Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middlewares/auth.middleware';
import { createError } from '../middlewares/error.middleware';
import {
  IPlacementTestQuestion,
  PlacementTest,
  PlacementTestDifficulty,
  PlacementTestStatus,
} from '../models/placementTest.model';
import { Course } from '../models/course.model';
import { Student } from '../models/student.model';
import { PLACEMENT_TESTS } from '../data/placementTests.data';

interface PlacementTestInput {
  title: string;
  course?: string;
  difficulty: PlacementTestDifficulty;
  durationMinutes: number;
  status: PlacementTestStatus;
  questions: IPlacementTestQuestion[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Tự động đồng bộ / nạp 3 bài kiểm tra đầu vào có sẵn vào MongoDB nếu chưa có
 */
export const ensureDefaultPlacementTests = async (): Promise<void> => {
  try {
    const count = await PlacementTest.countDocuments();
    if (count >= 3) return;

    // Tìm các khóa học để liên kết
    const [courseLost, coursePre, courseIntensive, anyCourse] = await Promise.all([
      Course.findOne({ code: { $in: ['IELTS-LOST', 'IELTS-FOUNDATION', 'IELTS-FOU'] } }).select('_id'),
      Course.findOne({ code: { $in: ['IELTS-PRE', 'IELTS-BASIC'] } }).select('_id'),
      Course.findOne({ code: { $in: ['IELTS-INTENSIVE', 'IELTS-MASTER'] } }).select('_id'),
      Course.findOne().select('_id'),
    ]);

    const fallbackCourseId = anyCourse?._id;

    for (const testData of PLACEMENT_TESTS) {
      const existing = await PlacementTest.findOne({
        $or: [{ slug: testData.id }, { title: testData.title }],
      });
      if (existing) continue;

      let courseId = fallbackCourseId;
      if (testData.id === 'ielts-diagnostic-01') {
        courseId = courseLost?._id || coursePre?._id || fallbackCourseId;
      } else if (testData.id === 'ielts-reading-real-02') {
        courseId = coursePre?._id || courseIntensive?._id || fallbackCourseId;
      } else {
        courseId = courseIntensive?._id || fallbackCourseId;
      }

      // Chuẩn hóa câu hỏi
      const formattedQuestions = testData.questions.map((q, idx) => {
        let correctOption = 0;
        if (Array.isArray(q.options)) {
          const foundIdx = q.options.findIndex((opt: any) =>
            typeof opt === 'string'
              ? opt.toUpperCase() === q.correctAnswer.toUpperCase()
              : opt.key.toUpperCase() === q.correctAnswer.toUpperCase()
          );
          if (foundIdx >= 0) correctOption = foundIdx;
        }

        const skillMapped =
          q.skill === 'Grammar'
            ? 'WRITING'
            : q.skill === 'Vocabulary'
            ? 'READING'
            : q.skill === 'Reading'
            ? 'READING'
            : q.skill === 'Critical Reasoning'
            ? 'SPEAKING'
            : q.skill || 'READING';

        return {
          id: q.id || `q_${idx + 1}`,
          questionNumber: q.questionNumber || idx + 1,
          skill: skillMapped,
          prompt: q.questionText || '',
          questionText: q.questionText || '',
          section: q.section || '',
          passageId: q.passageId || '',
          type: q.type || 'MULTIPLE_CHOICE',
          options: q.options,
          correctOption,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || '',
        };
      });

      await PlacementTest.create({
        slug: testData.id,
        title: testData.title,
        subtitle: testData.subtitle,
        category: testData.category,
        targetLevel: testData.targetLevel,
        difficulty:
          testData.id === 'ielts-diagnostic-01'
            ? 'BEGINNER'
            : testData.id === 'ielts-reading-real-02'
            ? 'INTERMEDIATE'
            : 'ADVANCED',
        durationMinutes: testData.durationMinutes,
        status: 'PUBLISHED',
        bannerUrl: testData.bannerUrl,
        description: testData.description,
        instructions: testData.instructions,
        passages: testData.passages || [],
        course: courseId,
        questions: formattedQuestions,
      });
    }
  } catch (error) {
    console.warn('⚠️ Lỗi khi nạp dữ liệu bài kiểm tra mặc định vào MongoDB:', error);
  }
};

export const parsePlacementTest = (input: unknown): PlacementTestInput => {
  if (!isRecord(input)) throw createError('Dữ liệu bài kiểm tra không hợp lệ', 400);

  const { title, course, difficulty, durationMinutes, status, questions } = input;
  if (typeof title !== 'string' || !title.trim() || title.trim().length > 250) {
    throw createError('Tên bài kiểm tra là bắt buộc và không vượt quá 250 ký tự', 400);
  }
  if (course && !mongoose.isValidObjectId(course)) {
    throw createError('Khóa học không hợp lệ', 400);
  }
  if (!difficulty || typeof difficulty !== 'string') {
    throw createError('Độ khó bài kiểm tra không hợp lệ', 400);
  }
  if (!Number.isInteger(durationMinutes) || (durationMinutes as number) < 5 || (durationMinutes as number) > 240) {
    throw createError('Thời lượng phải từ 5 đến 240 phút', 400);
  }
  if (status !== 'DRAFT' && status !== 'PUBLISHED') {
    throw createError('Trạng thái bài kiểm tra không hợp lệ', 400);
  }
  if (!Array.isArray(questions) || questions.length > 100) {
    throw createError('Bài kiểm tra cần có tối đa 100 câu hỏi', 400);
  }

  const normalizedQuestions = questions.map((question, index): IPlacementTestQuestion => {
    if (!isRecord(question)) throw createError(`Câu ${index + 1} không hợp lệ`, 400);
    const { skill, prompt, options, correctOption, explanation, questionText } = question;
    const finalPrompt = (prompt || questionText || '').toString().trim();
    if (!finalPrompt) {
      throw createError(`Nội dung câu ${index + 1} là bắt buộc`, 400);
    }
    if (!Array.isArray(options) || options.length < 2 || options.length > 6) {
      throw createError(`Câu ${index + 1} cần từ 2 đến 6 phương án`, 400);
    }
    const normalizedOptions = options.map((option, optionIndex) => {
      if (typeof option === 'string') {
        if (!option.trim()) throw createError(`Phương án ${optionIndex + 1} của câu ${index + 1} không được để trống`, 400);
        return option.trim();
      }
      if (isRecord(option) && typeof option.text === 'string') {
        const optionKey = typeof option.key === 'string' && option.key.trim() ? option.key.trim() : String.fromCharCode(65 + optionIndex);
        return { key: optionKey, text: option.text.trim() };
      }
      throw createError(`Phương án ${optionIndex + 1} của câu ${index + 1} không hợp lệ`, 400);
    });

    const parsedCorrect = Number.isInteger(correctOption) ? (correctOption as number) : 0;

    return {
      skill: (skill || 'READING').toString(),
      prompt: finalPrompt,
      questionText: finalPrompt,
      options: normalizedOptions,
      correctOption: parsedCorrect,
      explanation: typeof explanation === 'string' ? explanation : '',
    };
  });

  return {
    title: title.trim(),
    course: course as string | undefined,
    difficulty: difficulty as PlacementTestDifficulty,
    durationMinutes: durationMinutes as number,
    status,
    questions: normalizedQuestions,
  };
};

/**
 * 1. GET /api/placement-tests
 * Danh sách bài kiểm tra (Dùng cho cả Staff và Student)
 */
export const getPlacementTests = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Tự động đảm bảo các bài test mặc định đã có trong MongoDB
    await ensureDefaultPlacementTests();

    const { courseId, difficulty, status, search, page = '1', limit = '50' } = req.query;
    const filter: Record<string, unknown> = {};

    // Nếu người dùng không phải Staff/Director thì chỉ hiển thị bài thi PUBLISHED
    const isStaffOrDirector = req.user?.role === 'TRAINING_STAFF' || req.user?.role === 'DIRECTOR';
    if (!isStaffOrDirector) {
      filter.status = 'PUBLISHED';
    } else if (status === 'DRAFT' || status === 'PUBLISHED') {
      filter.status = status;
    }

    if (typeof courseId === 'string' && courseId) {
      if (!mongoose.isValidObjectId(courseId)) throw createError('Mã khóa học không hợp lệ', 400);
      filter.course = courseId;
    }
    if (typeof difficulty === 'string' && difficulty) {
      filter.difficulty = difficulty;
    }
    if (typeof search === 'string' && search.trim()) {
      filter.title = { $regex: escapeRegex(search.trim()), $options: 'i' };
    }

    const pageNumber = Math.max(1, Number.parseInt(String(page), 10) || 1);
    const limitNumber = Math.min(100, Math.max(1, Number.parseInt(String(limit), 10) || 50));

    const [tests, total] = await Promise.all([
      PlacementTest.find(filter)
        .populate('course', 'code title')
        .sort({ createdAt: 1 })
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber)
        .lean(),
      PlacementTest.countDocuments(filter),
    ]);

    // Format response để tương thích cả Staff Portal và Student Portal
    const formattedData = tests.map((t) => ({
      _id: t._id,
      id: t.slug || t._id.toString(),
      slug: t.slug || t._id.toString(),
      title: t.title,
      subtitle: t.subtitle || '',
      category: t.category || 'Chẩn đoán trình độ',
      targetLevel: t.targetLevel || 'Band 0.0 - 5.5',
      difficulty: t.difficulty,
      durationMinutes: t.durationMinutes,
      totalQuestions: t.questions?.length || 0,
      bannerUrl: t.bannerUrl || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800&auto=format&fit=crop',
      description: t.description || '',
      instructions: t.instructions || [],
      status: t.status,
      course: t.course,
      questions: t.questions?.map((q) => ({
        ...q,
        // Đảm bảo options có thể đọc cả dạng string[] lẫn { key, text }[]
        options: Array.isArray(q.options)
          ? q.options.map((opt: any) => (typeof opt === 'string' ? opt : opt.text || String(opt)))
          : [],
      })),
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách bài kiểm tra thành công',
      data: formattedData,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. GET /api/placement-tests/:id
 * Lấy chi tiết bài kiểm tra để học viên làm bài hoặc giáo vụ chỉnh sửa
 */
export const getPlacementTestById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await ensureDefaultPlacementTests();

    const { id } = req.params;
    let query: Record<string, unknown> = { slug: id };
    if (mongoose.isValidObjectId(id)) {
      query = { $or: [{ _id: id }, { slug: id }] };
    }

    const test = await PlacementTest.findOne(query).populate('course', 'code title').lean();
    if (!test) {
      throw createError('Không tìm thấy bài kiểm tra đầu vào', 404);
    }

    // Format questions với options chuẩn cho giao diện làm bài
    const formattedQuestions = (test.questions || []).map((q, idx) => {
      let formattedOptions: Array<{ key: string; text: string }> = [];

      if (Array.isArray(q.options)) {
        formattedOptions = q.options.map((opt: any, optIdx: number) => {
          if (typeof opt === 'string') {
            return { key: String.fromCharCode(65 + optIdx), text: opt };
          }
          if (isRecord(opt)) {
            return { key: (opt.key || String.fromCharCode(65 + optIdx)).toString(), text: (opt.text || '').toString() };
          }
          return { key: String.fromCharCode(65 + optIdx), text: String(opt) };
        });
      }

      return {
        id: q.id || q._id?.toString() || `q_${idx + 1}`,
        questionNumber: q.questionNumber || idx + 1,
        type: q.type || 'MULTIPLE_CHOICE',
        section: q.section || '',
        passageId: q.passageId || '',
        prompt: q.prompt || q.questionText || '',
        questionText: q.questionText || q.prompt || '',
        options: formattedOptions,
        skill: q.skill,
        explanation: q.explanation || '',
      };
    });

    res.status(200).json({
      success: true,
      message: 'Lấy chi tiết bài kiểm tra thành công',
      data: {
        _id: test._id,
        id: test.slug || test._id.toString(),
        slug: test.slug,
        title: test.title,
        subtitle: test.subtitle,
        category: test.category,
        targetLevel: test.targetLevel,
        difficulty: test.difficulty,
        durationMinutes: test.durationMinutes,
        totalQuestions: formattedQuestions.length,
        bannerUrl: test.bannerUrl,
        description: test.description,
        instructions: test.instructions,
        passages: test.passages || [],
        questions: formattedQuestions,
        status: test.status,
        course: test.course,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. POST /api/placement-tests/:id/submit
 * Học viên nộp bài làm: Hệ thống chấm điểm trực tiếp từ database MongoDB
 */
export const submitPlacementTest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { answers } = req.body as { answers?: Record<string, string> };

    if (!answers || typeof answers !== 'object') {
      throw createError('Dữ liệu bài làm không hợp lệ', 400);
    }

    let query: Record<string, unknown> = { slug: id };
    if (mongoose.isValidObjectId(id)) {
      query = { $or: [{ _id: id }, { slug: id }] };
    }

    const test = await PlacementTest.findOne(query).populate('course').lean();
    if (!test) throw createError('Không tìm thấy bài kiểm tra', 404);

    let correctCount = 0;
    const skillStats: Record<string, { total: number; correct: number }> = {};

    const detailedResults = (test.questions || []).map((q, idx) => {
      const qKey = q.id || q._id?.toString() || `q_${idx + 1}`;
      const userChoice = (answers[qKey] || answers[q._id?.toString() || ''] || '').trim().toUpperCase();

      // Xác định đáp án đúng
      let expectedAnswer = (q.correctAnswer || '').trim().toUpperCase();
      if (!expectedAnswer && Array.isArray(q.options) && typeof q.correctOption === 'number') {
        const targetOpt = q.options[q.correctOption];
        if (isRecord(targetOpt) && targetOpt.key) {
          expectedAnswer = targetOpt.key.toUpperCase();
        } else {
          expectedAnswer = String.fromCharCode(65 + q.correctOption);
        }
      }

      const isCorrect = userChoice !== '' && userChoice === expectedAnswer;
      if (isCorrect) correctCount += 1;

      const skillName = q.skill || 'General';
      if (!skillStats[skillName]) skillStats[skillName] = { total: 0, correct: 0 };
      skillStats[skillName].total += 1;
      if (isCorrect) skillStats[skillName].correct += 1;

      // Format options
      const formattedOptions = (q.options || []).map((opt: any, optIdx: number) => {
        if (typeof opt === 'string') return { key: String.fromCharCode(65 + optIdx), text: opt };
        if (isRecord(opt)) return { key: (opt.key || String.fromCharCode(65 + optIdx)).toString(), text: (opt.text || '').toString() };
        return { key: String.fromCharCode(65 + optIdx), text: String(opt) };
      });

      return {
        id: qKey,
        questionNumber: q.questionNumber || idx + 1,
        type: q.type || 'MULTIPLE_CHOICE',
        section: q.section || '',
        questionText: q.questionText || q.prompt || '',
        options: formattedOptions,
        userAnswer: userChoice || 'UNANSWERED',
        correctAnswer: expectedAnswer,
        isCorrect,
        explanation: q.explanation || '',
        skill: skillName,
      };
    });

    const totalQuestions = test.questions.length || 1;
    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);

    // Tính toán Band điểm dự đoán dựa trên tỉ lệ đúng
    let predictedBand = 4.0;
    let bandRange = '4.0 - 4.5';
    let levelName = 'Mất gốc / Nền tảng cơ bản';
    let summaryFeedback = 'Bạn cần củng cố lại ngữ pháp trọng tâm và mở rộng vốn từ vựng học thuật.';

    if (scorePercentage >= 90) {
      predictedBand = 7.5;
      bandRange = '7.5 - 8.5+';
      levelName = 'Xuất sắc / Chuẩn cựu giám khảo';
      summaryFeedback = 'Khả năng ngôn ngữ học thuật rất tốt, phản xạ chính xác các dạng bẫy phức tạp.';
    } else if (scorePercentage >= 75) {
      predictedBand = 6.5;
      bandRange = '6.5 - 7.5';
      levelName = 'Khá giỏi / Sẵn sàng thi thật';
      summaryFeedback = 'Nắm vững kiến thức cốt lõi, cần luyện tập chuyên sâu giải đề áp lực thời gian.';
    } else if (scorePercentage >= 55) {
      predictedBand = 5.5;
      bandRange = '5.0 - 6.0';
      levelName = 'Trung cấp / Đang phát triển';
      summaryFeedback = 'Đã có nền tảng đọc hiểu tương đối, cần chú ý các cấu trúc ngữ pháp đảo ngữ và từ đồng nghĩa.';
    } else if (scorePercentage >= 35) {
      predictedBand = 4.5;
      bandRange = '4.5 - 5.0';
      levelName = 'Sơ cấp / Nền tảng';
      summaryFeedback = 'Cần luyện tập thêm phương pháp Skimming / Scanning và phát hiện từ khóa trong bài đọc.';
    }

    const skillBreakdown = Object.entries(skillStats).map(([skill, stats]) => ({
      skill,
      correct: stats.correct,
      total: stats.total,
      percentage: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
    }));

    // Gợi ý khóa học phù hợp từ database
    const courseDoc: any = test.course;
    const primaryCourse = {
      code: courseDoc?.code || 'IELTS-PRE',
      title: courseDoc?.title || 'IELTS Pre - Làm Quen Format Đề Thi Chuẩn',
      targetLevel: courseDoc?.targetLevel || bandRange,
      tuitionFee: courseDoc?.tuitionFee || 5800000,
      durationWeeks: 10,
      badge: 'ĐỀ XUẤT TỐI ƯU',
      description: courseDoc?.description || 'Khóa học được thiết kế sát với năng lực chẩn đoán hiện tại của bạn.',
      whyRecommended: `Phù hợp với kết quả bài test đạt ${scorePercentage}% (Band ${predictedBand}).`,
      highlights: ['Giáo viên bản ngữ và 8.5+ IELTS trực tiếp đứng lớp', 'Cam kết chuẩn đầu ra bằng văn bản', 'Lớp học sĩ số nhỏ tương tác cao'],
    };

    // Nếu học viên đã đăng nhập, tự động lưu kết quả vào Profile Student
    if (req.user && req.user.role === 'STUDENT') {
      await Student.findOneAndUpdate(
        { user: req.user._id },
        {
          placementTestScore: predictedBand,
          placementTestDate: new Date(),
          currentBand: predictedBand,
          placementNotes: `Hoàn thành bài test "${test.title}" đạt ${correctCount}/${totalQuestions} câu (${scorePercentage}%).`,
        }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Chấm điểm bài kiểm tra thành công',
      data: {
        testId: test.slug || test._id.toString(),
        testTitle: test.title,
        submittedAt: new Date().toISOString(),
        score: correctCount,
        totalQuestions,
        scorePercentage,
        predictedBand,
        bandRange,
        levelName,
        summaryFeedback,
        primaryCourse,
        secondaryCourses: [],
        skillBreakdown,
        detailedResults,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. POST /api/placement-tests
 * Giáo vụ / Giám đốc tạo bài kiểm tra mới và lưu vào MongoDB
 */
export const createPlacementTest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = parsePlacementTest(req.body);
    if (data.course) {
      const course = await Course.findById(data.course).select('_id');
      if (!course) throw createError('Không tìm thấy khóa học', 404);
    }

    const test = await PlacementTest.create({
      ...data,
      slug: `pt-${Date.now().toString(36)}`,
    });
    if (test.course) {
      await test.populate('course', 'code title');
    }

    res.status(201).json({
      success: true,
      message: 'Tạo bài kiểm tra thành công và đã lưu vào CSDL',
      data: test,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. PUT /api/placement-tests/:id
 * Giáo vụ cập nhật bài kiểm tra trong MongoDB
 */
export const updatePlacementTest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    let query: Record<string, unknown> = { slug: id };
    if (mongoose.isValidObjectId(id)) {
      query = { $or: [{ _id: id }, { slug: id }] };
    }

    const data = parsePlacementTest(req.body);
    if (data.course) {
      const course = await Course.findById(data.course).select('_id');
      if (!course) throw createError('Không tìm thấy khóa học', 404);
    }

    const test = await PlacementTest.findOneAndUpdate(query, data, {
      new: true,
      runValidators: true,
    }).populate('course', 'code title');

    if (!test) throw createError('Không tìm thấy bài kiểm tra', 404);

    res.status(200).json({
      success: true,
      message: 'Cập nhật bài kiểm tra thành công trong CSDL',
      data: test,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 6. DELETE /api/placement-tests/:id
 * Giáo vụ xóa bài kiểm tra khỏi MongoDB
 */
export const deletePlacementTest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    let query: Record<string, unknown> = { slug: id };
    if (mongoose.isValidObjectId(id)) {
      query = { $or: [{ _id: id }, { slug: id }] };
    }

    const test = await PlacementTest.findOneAndDelete(query);
    if (!test) throw createError('Không tìm thấy bài kiểm tra', 404);

    res.status(200).json({
      success: true,
      message: 'Xóa bài kiểm tra khỏi CSDL thành công',
    });
  } catch (error) {
    next(error);
  }
};
