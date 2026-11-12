import mongoose, { Types } from 'mongoose';
import { assignEnrollmentClass } from '../src/controllers/enrollment.controller';
import { Enrollment } from '../src/models/enrollment.model';
import { Payment } from '../src/models/payment.model';

describe('enrollment.controller assignEnrollmentClass', () => {
  it('blocks class assignment when enrollment tuition is unpaid/pending', async () => {
    const enrollmentId = new Types.ObjectId().toString();
    const classId = new Types.ObjectId().toString();

    const mockSession: any = {
      withTransaction: async (fn: () => Promise<void>) => fn(),
      endSession: jest.fn().mockResolvedValue(undefined),
    };
    jest.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession);

    jest.spyOn(Enrollment, 'findById').mockReturnValue({
      session: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(enrollmentId),
        status: 'PENDING',
        tuitionStatus: 'PENDING',
        course: new Types.ObjectId(),
      }),
    } as any);

    jest.spyOn(Payment, 'exists').mockReturnValue({
      session: jest.fn().mockResolvedValue(null),
    } as any);

    const req: any = {
      params: { id: enrollmentId },
      body: { classId },
    };
    const res: any = {};
    const next = jest.fn();

    await assignEnrollmentClass(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(409);
    expect(err.message).toContain('chưa thanh toán hoặc đang chờ thanh toán');
    expect(mockSession.endSession).toHaveBeenCalled();
  });

  it('blocks class assignment when tuitionStatus is REFUNDED even if a prior SUCCESS payment existed', async () => {
    const enrollmentId = new Types.ObjectId().toString();
    const classId = new Types.ObjectId().toString();

    const mockSession: any = {
      withTransaction: async (fn: () => Promise<void>) => fn(),
      endSession: jest.fn().mockResolvedValue(undefined),
    };
    jest.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession);

    jest.spyOn(Enrollment, 'findById').mockReturnValue({
      session: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(enrollmentId),
        status: 'ENROLLED',
        tuitionStatus: 'REFUNDED',
        course: new Types.ObjectId(),
      }),
    } as any);

    jest.spyOn(Payment, 'exists').mockReturnValue({
      session: jest.fn().mockResolvedValue({ _id: new Types.ObjectId() }),
    } as any);

    const req: any = {
      params: { id: enrollmentId },
      body: { classId },
    };
    const res: any = {};
    const next = jest.fn();

    await assignEnrollmentClass(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(409);
  });
});

