import { Types } from 'mongoose';
import { parsePlacementTest } from '../src/controllers/placementTest.controller';

const course = new Types.ObjectId().toString();
const skills = ['LISTENING', 'SPEAKING', 'READING', 'WRITING'] as const;

const createQuestion = (skill: typeof skills[number]) => ({
  skill,
  prompt: `Question for ${skill}`,
  options: ['First choice', 'Second choice'],
  correctOption: 1,
});

const validPayload = {
  title: 'Placement test — Beginner',
  course,
  difficulty: 'BEGINNER',
  durationMinutes: 30,
  status: 'PUBLISHED',
  questions: skills.map(createQuestion),
};

describe('parsePlacementTest', () => {
  it('accepts a published multiple-choice test covering all four skills', () => {
    expect(parsePlacementTest(validPayload)).toEqual(validPayload);
  });

  it('allows incomplete questions while the test remains a draft', () => {
    const draft = {
      ...validPayload,
      status: 'DRAFT',
      questions: [createQuestion('READING')],
    };

    expect(parsePlacementTest(draft)).toEqual(draft);
  });

  it('requires all four skills before publishing', () => {
    expect(() => parsePlacementTest({
      ...validPayload,
      questions: [createQuestion('READING')],
    })).toThrow('Bài kiểm tra cần có câu hỏi cho đủ 4 kỹ năng');
  });

  it('rejects duplicated choices and out-of-range answer indexes', () => {
    expect(() => parsePlacementTest({
      ...validPayload,
      status: 'DRAFT',
      questions: [{
        ...createQuestion('READING'),
        options: ['Duplicate', 'Duplicate'],
      }],
    })).toThrow('có phương án bị trùng');

    expect(() => parsePlacementTest({
      ...validPayload,
      status: 'DRAFT',
      questions: [{
        ...createQuestion('READING'),
        correctOption: 2,
      }],
    })).toThrow('Đáp án đúng của câu 1 không hợp lệ');
  });
});
