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
        if (!option.text.trim()) throw createError(`Phương án ${optionIndex + 1} của câu ${index + 1} không được để trống`, 400);
        const optionKey = typeof option.key === 'string' && option.key.trim() ? option.key.trim() : String.fromCharCode(65 + optionIndex);
        return { key: optionKey, text: option.text.trim() };
      }
      throw createError(`Phương án ${optionIndex + 1} của câu ${index + 1} không hợp lệ`, 400);
    });

    const optionTexts = normalizedOptions.map((option) =>
      (typeof option === 'string' ? option : option.text).trim().toLocaleLowerCase()
    );
    if (new Set(optionTexts).size !== optionTexts.length) {
      throw createError(`Phương án của câu ${index + 1} có phương án bị trùng`, 400);
    }

    const parsedCorrect = Number.isInteger(correctOption) ? (correctOption as number) : 0;
    if (parsedCorrect < 0 || parsedCorrect >= normalizedOptions.length) {
      throw createError(`Đáp án đúng của câu ${index + 1} không hợp lệ`, 400);
    }

    const normalizedQuestion: IPlacementTestQuestion = {
      skill: (skill || 'READING').toString(),
      prompt: finalPrompt,
      options: normalizedOptions,
      correctOption: parsedCorrect,
    };
    if (typeof questionText === 'string') normalizedQuestion.questionText = finalPrompt;
    if (typeof explanation === 'string' && explanation) normalizedQuestion.explanation = explanation;
    return normalizedQuestion;
  });

  if (status === 'PUBLISHED') {
    const requiredSkills = ['LISTENING', 'SPEAKING', 'READING', 'WRITING'];
    const includedSkills = new Set(normalizedQuestions.map((question) => question.skill));
    if (requiredSkills.some((skill) => !includedSkills.has(skill))) {
      throw createError('Bài kiểm tra cần có câu hỏi cho đủ 4 kỹ năng', 400);
    }
  }

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
      skills: [...new Set((t.questions || []).map((question) => question.skill).filter(Boolean))],
      bannerUrl: t.bannerUrl || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800&auto=format&fit=crop',
      description: t.description || '',
      instructions: t.instructions || [],
      status: t.status,
      course: t.course,
      ...(isStaffOrDirector && {
        questions: (t.questions || []).map((question) => ({
          _id: question._id?.toString(),
          skill: question.skill,
          prompt: question.prompt || question.questionText || '',
          options: Array.isArray(question.options)
            ? question.options.map((option: any) => (typeof option === 'string' ? option : option.text || String(option)))
            : [],
          correctOption: question.correctOption,
        })),
      }),
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
    const { id } = req.params;
    let query: Record<string, unknown> = { slug: id };
    if (mongoose.isValidObjectId(id)) {
      query = { $or: [{ _id: id }, { slug: id }] };
    }

    const test = await PlacementTest.findOne(query).populate('course', 'code title').lean();
    if (!test) {
      throw createError('Không tìm thấy bài kiểm tra đầu vào', 404);
    }

    const isStaffOrDirector = req.user?.role === 'TRAINING_STAFF' || req.user?.role === 'DIRECTOR';
    if (test.status !== 'PUBLISHED' && !isStaffOrDirector) {
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
    if (!req.user) {
      throw createError('Vui lòng đăng nhập bằng tài khoản học viên để nộp bài', 401);
    }
    const isStudentRole = String(req.user.role).trim().toUpperCase() === 'STUDENT';
    if (!isStudentRole) {
      throw createError(
        `Tài khoản hiện tại (vai trò: ${req.user.role}) không được phép nộp bài kiểm tra đầu vào`,
        403
      );
    }

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
    if (test.status !== 'PUBLISHED') throw createError('Không tìm thấy bài kiểm tra', 404);

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

    // Tính toán Band điểm dự đoán và phân loại trình độ theo chuẩn khảo thí EduCenter
    let predictedBand = 2.5;
    let bandRange = '0 - 3.5';
    let matchedLevel = '0 - 3.5';
    let levelName = 'Mất gốc (0 - 3.5)';
    let summaryFeedback =
      'Kết quả phản ánh bạn đang bị mất gốc tiếng Anh hoặc chưa tiếp cận ngữ âm & ngữ pháp căn bản. Khóa học Mất gốc & Phát âm chuẩn sẽ giúp bạn xây lại nền móng vững chắc.';

    if (scorePercentage >= 90) {
      predictedBand = 8.0;
      bandRange = '8.0+';
      matchedLevel = '8.0+';
      levelName = 'Master (8.0+)';
      summaryFeedback =
        'Khả năng ngôn ngữ học thuật xuất sắc, tư duy phản biện sắc bén và độ chính xác gần như tuyệt đối.';
    } else if (scorePercentage >= 75) {
      predictedBand = 6.5;
      bandRange = '6.5 - 7.5+';
      matchedLevel = '6.5 - 7.5+';
      levelName = 'Chuyên sâu (6.5 - 7.5+)';
      summaryFeedback =
        'Nắm vững kiến thức cốt lõi, cần luyện tập chuyên sâu giải đề áp lực thời gian và tối ưu hóa bài viết.';
    } else if (scorePercentage >= 55) {
      predictedBand = 5.5;
      bandRange = '5.5 - 6.5';
      matchedLevel = '5.5 - 6.5';
      levelName = 'Bứt phá (5.5 - 6.5)';
      summaryFeedback =
        'Đã có nền tảng đọc hiểu tương đối tốt, cần chú ý các cấu trúc câu phức và từ vựng học thuật theo chủ đề.';
    } else if (scorePercentage >= 35) {
      predictedBand = 4.5;
      bandRange = '4.5 - 5.5';
      matchedLevel = '4.5 - 5.5';
      levelName = 'Foundation (4.5 - 5.5)';
      summaryFeedback =
        'Bạn đã có nền tảng cơ bản nhưng cần củng cố thêm chiến thuật làm bài, kỹ năng Skimming/Scanning và ngữ pháp trọng tâm.';
    } else if (scorePercentage >= 20) {
      predictedBand = 3.5;
      bandRange = '3.5 - 4.5';
      matchedLevel = '3.5 - 4.5';
      levelName = 'Pre-IELTS (3.5 - 4.5)';
      summaryFeedback =
        'Bạn nhận biết được một số từ vựng căn bản nhưng chưa quen với format đề thi IELTS chuẩn. Khóa học Pre-IELTS là bước khởi đầu phù hợp.';
    }

    const skillBreakdown = Object.entries(skillStats).map(([skill, stats]) => ({
      skill,
      correct: stats.correct,
      total: stats.total,
      percentage: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
    }));

    // Gợi ý khóa học phù hợp trực tiếp từ database MongoDB theo trình độ vừa đạt được
    const escapedMatchedLevel = escapeRegex(matchedLevel);
    const matchedCourses = await Course.find({
      status: { $ne: 'INACTIVE' },
      $or: [
        { entryLevel: new RegExp(escapedMatchedLevel, 'i') },
        { targetLevel: new RegExp(escapedMatchedLevel, 'i') },
        { title: new RegExp(escapedMatchedLevel, 'i') },
      ],
    })
      .sort({ featured: -1, tuitionFee: 1 })
      .lean();

    // Chọn khóa học chính: ưu tiên khóa học có entryLevel khớp với matchedLevel
    let primaryDoc: any =
      matchedCourses.find((c: any) => c.entryLevel === matchedLevel) ||
      matchedCourses[0];

    // Fallback nếu chưa tìm thấy khóa học trong DB
    if (!primaryDoc) {
      primaryDoc = (test.course as any) || (await Course.findOne({ status: 'ACTIVE' }).lean());
    }

    const primaryCourse = {
      _id: primaryDoc?._id?.toString() || '',
      code: primaryDoc?.code || `IELTS-${matchedLevel.replace(/[^a-zA-Z0-9]/g, '')}`,
      title: primaryDoc?.title || `IELTS Khóa Học Trình Độ ${levelName}`,
      targetLevel: primaryDoc?.targetLevel || bandRange,
      entryLevel: primaryDoc?.entryLevel || matchedLevel,
      tuitionFee: primaryDoc?.tuitionFee || 6500000,
      durationWeeks: Math.max(8, Math.ceil((primaryDoc?.sessions || 30) / 3)),
      sessions: primaryDoc?.sessions || 30,
      badge: 'ĐỀ XUẤT TỐI ƯU NHẤT CHO BẠN',
      description:
        primaryDoc?.description ||
        `Khóa học được thiết kế sát với kết quả khảo thí Band ${predictedBand} (${levelName}) của bạn.`,
      whyRecommended: `Phù hợp chính xác với kết quả bài test đạt ${scorePercentage}% (Dự đoán Band ${predictedBand}). Lộ trình được thiết kế chuẩn theo trình độ ${levelName}.`,
      highlights:
        primaryDoc?.learningObjectives && primaryDoc.learningObjectives.length > 0
          ? primaryDoc.learningObjectives.slice(0, 4)
          : [
              'Giáo viên bản ngữ và 8.5+ IELTS trực tiếp đứng lớp',
              'Cam kết chuẩn đầu ra bằng văn bản',
              'Lớp học sĩ số nhỏ tương tác cao',
              'Lộ trình được thiết kế cá nhân hóa theo barem IDP & British Council',
            ],
    };

    // Các khóa học bổ trợ / lựa chọn khác cùng tầm điểm
    const secondaryCourses = matchedCourses
      .filter((c: any) => c._id.toString() !== primaryDoc?._id?.toString())
      .map((c: any) => ({
        _id: c._id.toString(),
        code: c.code,
        title: c.title,
        targetLevel: c.targetLevel,
        entryLevel: c.entryLevel,
        tuitionFee: c.tuitionFee,
        durationWeeks: Math.max(8, Math.ceil((c.sessions || 30) / 3)),
        sessions: c.sessions,
        badge: 'LỰA CHỌN PHÙ HỢP CÙNG TRÌNH ĐỘ',
        description: c.description,
        whyRecommended: `Khóa học cùng nhóm năng lực Band ${predictedBand} (${matchedLevel})`,
        highlights: c.learningObjectives?.slice(0, 3) || ['Giáo trình cập nhật', 'Luyện tập thực chiến'],
      }));

    const submittedAt = new Date();
    const placementResult = {
      placementTestScore: predictedBand,
      placementTestDate: submittedAt,
      currentBand: predictedBand,
      placementNotes: `Hoàn thành bài test "${test.title}" đạt ${correctCount}/${totalQuestions} câu (${scorePercentage}%).`,
    };
    const savedStudent = await Student.findOneAndUpdate(
      { user: req.user._id },
      { $set: placementResult },
      { new: true, runValidators: true }
    ).select('_id').lean();

    if (!savedStudent) {
      try {
        await Student.create({
          user: req.user._id,
          studentCode: `STU-${req.user._id.toString()}`,
          status: 'ACTIVE',
          ...placementResult,
        });
      } catch (error) {
        if (!isRecord(error) || error.code !== 11000) throw error;

        const studentCreatedConcurrently = await Student.findOneAndUpdate(
          { user: req.user._id },
          { $set: placementResult },
          { new: true, runValidators: true }
        ).select('_id').lean();
        if (!studentCreatedConcurrently) throw error;
      }
    }

    res.status(200).json({
      success: true,
      message: 'Chấm điểm bài kiểm tra thành công',
      data: {
        testId: test.slug || test._id.toString(),
        testTitle: test.title,
        submittedAt: submittedAt.toISOString(),
        score: correctCount,
        totalQuestions,
        scorePercentage,
        predictedBand,
        bandRange,
        matchedLevel,
        levelName,
        summaryFeedback,
        primaryCourse,
        secondaryCourses,
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
