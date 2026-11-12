import { Types } from 'mongoose';
import {
  checkAttendance,
  createOrEnterGrade,
  getTeachingSchedule,
} from '../src/controllers/teacher.controller';
import { Attendance, Class, ClassSchedule, Course, Grade } from '../src/models';
import { ClassTeacher } from '../src/models/classTeacher.model';

const createMockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('teacher.controller', () => {
  const teacherId = new Types.ObjectId();
  const classId = new Types.ObjectId();
  const studentId = new Types.ObjectId();

  describe('createOrEnterGrade', () => {
    it('requires overallBand for periodic tests such as MID_TERM', async () => {
      const req: any = {
        user: { _id: teacherId },
        body: {
          studentId: studentId.toString(),
          classId: classId.toString(),
          evaluationType: 'MID_TERM',
          title: 'Kiểm tra giữa kỳ',
        },
      };
      const res = createMockResponse();

      await createOrEnterGrade(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Vui lòng nhập điểm Overall Band cho bài kiểm tra định kỳ',
        })
      );
    });

    it('creates a periodic test grade (ENTRY_TEST / FINAL_TEST) with 4 skills and overallBand', async () => {
      const gradeId = new Types.ObjectId();
      const createSpy = jest.spyOn(Grade, 'create').mockResolvedValue({ _id: gradeId } as any);
      const populatedDoc = { _id: gradeId, evaluationType: 'ENTRY_TEST', overallBand: 6.0 };
      const populateChain = {
        populate: jest.fn().mockReturnThis(),
      };
      populateChain.populate
        .mockReturnValueOnce(populateChain)
        .mockResolvedValueOnce(populatedDoc);
      jest.spyOn(Grade, 'findById').mockReturnValue(populateChain as any);

      const req: any = {
        user: { _id: teacherId },
        body: {
          studentId: studentId.toString(),
          classId: classId.toString(),
          evaluationType: 'ENTRY_TEST',
          title: 'Kiểm tra đầu vào K26',
          overallBand: 6.0,
          listening: 6.5,
          reading: 6.0,
          writing: 5.5,
          speaking: 6.0,
          feedback: 'Nền tảng từ vựng tốt',
        },
      };
      const res = createMockResponse();

      await createOrEnterGrade(req, res);

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          evaluationType: 'ENTRY_TEST',
          overallBand: 6.0,
          listening: 6.5,
          reading: 6.0,
          writing: 5.5,
          speaking: 6.0,
          status: 'PUBLISHED',
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('allows MONTHLY_EVALUATION without overallBand when feedback and rating are provided', async () => {
      const gradeId = new Types.ObjectId();
      const createSpy = jest.spyOn(Grade, 'create').mockResolvedValue({ _id: gradeId } as any);
      const populateChain = {
        populate: jest.fn().mockReturnThis(),
      };
      populateChain.populate
        .mockReturnValueOnce(populateChain)
        .mockResolvedValueOnce({ _id: gradeId, evaluationType: 'MONTHLY_EVALUATION' });
      jest.spyOn(Grade, 'findById').mockReturnValue(populateChain as any);

      const req: any = {
        user: { _id: teacherId },
        body: {
          studentId: studentId.toString(),
          classId: classId.toString(),
          evaluationType: 'MONTHLY_EVALUATION',
          title: 'Nhận xét tháng 11/2026',
          period: 'Tháng 11/2026',
          rating: 'GOOD',
          feedback: 'Học viên đi học đều, tiến bộ kỹ năng nghe.',
        },
      };
      const res = createMockResponse();

      await createOrEnterGrade(req, res);

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          evaluationType: 'MONTHLY_EVALUATION',
          period: 'Tháng 11/2026',
          rating: 'GOOD',
          feedback: 'Học viên đi học đều, tiến bộ kỹ năng nghe.',
        })
      );
      expect(createSpy.mock.calls[0][0]).not.toHaveProperty('overallBand');
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('rejects COURSE_EVALUATION when feedback, rating, and overallBand are all missing', async () => {
      const req: any = {
        user: { _id: teacherId },
        body: {
          studentId: studentId.toString(),
          classId: classId.toString(),
          evaluationType: 'COURSE_EVALUATION',
          title: 'Đánh giá cuối khóa',
          feedback: '   ',
        },
      };
      const res = createMockResponse();

      await createOrEnterGrade(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('checkAttendance', () => {
    it('rejects invalid attendance status', async () => {
      const req: any = {
        user: { _id: teacherId },
        body: {
          classId: classId.toString(),
          sessionDate: '2026-11-12',
          records: [{ studentId: studentId.toString(), status: 'INVALID' }],
        },
      };
      const res = createMockResponse();

      await checkAttendance(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('upserts session attendance records with UTC day bounds', async () => {
      const upsertSpy = jest.spyOn(Attendance, 'findOneAndUpdate').mockResolvedValue({
        _id: new Types.ObjectId(),
        status: 'PRESENT',
      } as any);

      const req: any = {
        user: { _id: teacherId },
        body: {
          classId: classId.toString(),
          sessionDate: '2026-11-12',
          records: [{ studentId: studentId.toString(), status: 'PRESENT', notes: 'Đúng giờ' }],
        },
      };
      const res = createMockResponse();

      await checkAttendance(req, res);

      expect(upsertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          class: classId.toString(),
          student: studentId.toString(),
          sessionDate: {
            $gte: new Date('2026-11-12T00:00:00.000Z'),
            $lte: new Date('2026-11-12T23:59:59.999Z'),
          },
        }),
        expect.objectContaining({
          status: 'PRESENT',
          notes: 'Đúng giờ',
          recordedBy: teacherId,
        }),
        expect.objectContaining({ upsert: true, new: true })
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getTeachingSchedule', () => {
    it('synthesizes fallback schedules from class scheduleDays when ClassSchedule is empty', async () => {
      const courseId = new Types.ObjectId();
      jest.spyOn(ClassTeacher, 'find').mockReturnValue({
        select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
      } as any);
      jest.spyOn(Class, 'find').mockResolvedValue([
        {
          _id: classId,
          classCode: 'IELTS-K26',
          name: 'IELTS Foundation',
          course: courseId,
          room: 'Lab 301',
          scheduleDays: ['Thứ 2', 'Thứ 4'],
          timeSlot: '18:30 - 20:30',
          status: 'IN_PROGRESS',
        },
      ] as any);
      jest.spyOn(ClassSchedule, 'find').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
        }),
      } as any);
      jest.spyOn(Course, 'findById').mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ _id: courseId, code: 'IELTS-F', title: 'Foundation' }),
        }),
      } as any);

      const req: any = { user: { _id: teacherId }, query: {} };
      const res = createMockResponse();

      await getTeachingSchedule(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const payload = res.json.mock.calls[0][0];
      expect(payload.data.schedules).toHaveLength(2);
      expect(payload.data.schedules[0]).toMatchObject({
        dayOfWeek: 'Thứ 2',
        startTime: '18:30',
        endTime: '20:30',
        classroom: 'Lab 301',
      });
    });
  });
});

