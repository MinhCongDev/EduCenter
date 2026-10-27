import { NextFunction, Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middlewares/auth.middleware';
import { createError } from '../middlewares/error.middleware';
import {
  IPlacementTestQuestion,
  PLACEMENT_TEST_DIFFICULTIES,
  PLACEMENT_TEST_SKILLS,
  PlacementTest,
  PlacementTestDifficulty,
  PlacementTestSkill,
  PlacementTestStatus,
} from '../models/placementTest.model';
import { Course } from '../models/course.model';

interface PlacementTestInput {
  title: string;
  course: string;
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
  if (typeof title !== 'string' || !title.trim() || title.trim().length > 150) {
    throw createError('Tên bài kiểm tra là bắt buộc và không vượt quá 150 ký tự', 400);
  }
  if (typeof course !== 'string' || !mongoose.isValidObjectId(course)) {
    throw createError('Khóa học không hợp lệ', 400);
  }
  if (
    typeof difficulty !== 'string'
    || !PLACEMENT_TEST_DIFFICULTIES.includes(difficulty as PlacementTestDifficulty)
  ) {
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
    const { skill, prompt, options, correctOption } = question;
    if (
      typeof skill !== 'string'
      || !PLACEMENT_TEST_SKILLS.includes(skill as PlacementTestSkill)
    ) {
      throw createError(`Kỹ năng của câu ${index + 1} không hợp lệ`, 400);
    }
    if (typeof prompt !== 'string' || !prompt.trim() || prompt.trim().length > 1000) {
      throw createError(`Nội dung câu ${index + 1} là bắt buộc và không vượt quá 1000 ký tự`, 400);
    }
    if (!Array.isArray(options) || options.length < 2 || options.length > 6) {
      throw createError(`Câu ${index + 1} cần từ 2 đến 6 phương án`, 400);
    }
    const normalizedOptions = options.map((option, optionIndex) => {
      if (typeof option !== 'string' || !option.trim() || option.trim().length > 500) {
        throw createError(`Phương án ${optionIndex + 1} của câu ${index + 1} không hợp lệ`, 400);
      }
      return option.trim();
    });
    if (new Set(normalizedOptions.map((option) => option.toLocaleLowerCase())).size !== normalizedOptions.length) {
      throw createError(`Câu ${index + 1} có phương án bị trùng`, 400);
    }
    if (!Number.isInteger(correctOption) || (correctOption as number) < 0 || (correctOption as number) >= options.length) {
      throw createError(`Đáp án đúng của câu ${index + 1} không hợp lệ`, 400);
    }

    return {
      skill: skill as PlacementTestSkill,
      prompt: prompt.trim(),
      options: normalizedOptions,
      correctOption: correctOption as number,
    };
  });

  if (status === 'PUBLISHED') {
    if (normalizedQuestions.length === 0) {
      throw createError('Cần có câu hỏi trước khi xuất bản bài kiểm tra', 400);
    }
    const includedSkills = new Set(normalizedQuestions.map((question) => question.skill));
    const missingSkills = PLACEMENT_TEST_SKILLS.filter((skill) => !includedSkills.has(skill));
    if (missingSkills.length) {
      throw createError(`Bài kiểm tra cần có câu hỏi cho đủ 4 kỹ năng: ${missingSkills.join(', ')}`, 400);
    }
  }

  return {
    title: title.trim(),
    course,
    difficulty: difficulty as PlacementTestDifficulty,
    durationMinutes: durationMinutes as number,
    status,
    questions: normalizedQuestions,
  };
};

const handleDuplicateKey = (error: unknown, next: NextFunction): void => {
  if (isRecord(error) && error.code === 11000) {
    next(createError('Khóa học đã có bài kiểm tra ở độ khó này', 409));
    return;
  }
  next(error);
};

export const getPlacementTests = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { courseId, difficulty, status, search, page = '1', limit = '20' } = req.query;
    const filter: Record<string, unknown> = {};

    if (typeof courseId === 'string' && courseId) {
      if (!mongoose.isValidObjectId(courseId)) throw createError('Mã khóa học không hợp lệ', 400);
      filter.course = courseId;
    }
    if (typeof difficulty === 'string' && difficulty) {
      if (!PLACEMENT_TEST_DIFFICULTIES.includes(difficulty as PlacementTestDifficulty)) {
        throw createError('Độ khó bài kiểm tra không hợp lệ', 400);
      }
      filter.difficulty = difficulty;
    }
    if (status === 'DRAFT' || status === 'PUBLISHED') filter.status = status;
    if (typeof search === 'string' && search.trim()) {
      filter.title = { $regex: escapeRegex(search.trim()), $options: 'i' };
    }

    const pageNumber = Math.max(1, Number.parseInt(String(page), 10) || 1);
    const limitNumber = Math.min(100, Math.max(1, Number.parseInt(String(limit), 10) || 20));
    const [tests, total] = await Promise.all([
      PlacementTest.find(filter)
        .populate('course', 'code title')
        .sort({ updatedAt: -1 })
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber),
      PlacementTest.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách bài kiểm tra thành công',
      data: tests,
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

export const createPlacementTest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = parsePlacementTest(req.body);
    const course = await Course.findById(data.course).select('_id');
    if (!course) throw createError('Không tìm thấy khóa học', 404);

    const test = await PlacementTest.create(data);
    await test.populate('course', 'code title');
    res.status(201).json({
      success: true,
      message: 'Tạo bài kiểm tra thành công',
      data: test,
    });
  } catch (error) {
    handleDuplicateKey(error, next);
  }
};

export const updatePlacementTest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw createError('Mã bài kiểm tra không hợp lệ', 400);
    const data = parsePlacementTest(req.body);
    const course = await Course.findById(data.course).select('_id');
    if (!course) throw createError('Không tìm thấy khóa học', 404);

    const test = await PlacementTest.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    }).populate('course', 'code title');
    if (!test) throw createError('Không tìm thấy bài kiểm tra', 404);

    res.status(200).json({
      success: true,
      message: 'Cập nhật bài kiểm tra thành công',
      data: test,
    });
  } catch (error) {
    handleDuplicateKey(error, next);
  }
};

export const deletePlacementTest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw createError('Mã bài kiểm tra không hợp lệ', 400);
    const test = await PlacementTest.findByIdAndDelete(req.params.id);
    if (!test) throw createError('Không tìm thấy bài kiểm tra', 404);

    res.status(200).json({
      success: true,
      message: 'Xóa bài kiểm tra thành công',
    });
  } catch (error) {
    next(error);
  }
};
