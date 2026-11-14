import {
  expandScheduleInstances,
  findScheduleTimeConflict,
  generateSessionDates,
  normalizeWeekday,
  parseTimeSlot,
  weekdayForDate,
} from './classSchedule.utils';

describe('class schedule utilities', () => {
  it('generates exactly the configured number of sessions across selected weekdays', () => {
    const dates = generateSessionDates(
      new Date('2026-01-05T00:00:00.000Z'),
      ['Thứ 2', 'Thứ 4', 'Thứ 6'],
      10
    );

    expect(dates).toHaveLength(10);
    expect(dates[0].toISOString().slice(0, 10)).toBe('2026-01-05');
    expect(dates[9].toISOString().slice(0, 10)).toBe('2026-01-26');
    expect(dates.every((date) => ['Thứ 2', 'Thứ 4', 'Thứ 6'].includes(weekdayForDate(date)))).toBe(true);
  });

  it('normalizes the Sunday label used by the class form', () => {
    expect(normalizeWeekday('Chủ nhật')).toBe('Chủ Nhật');
  });

  it('parses valid time ranges and rejects an invalid or reversed range', () => {
    expect(parseTimeSlot('18:30 - 20:00')).toEqual({ startTime: '18:30', endTime: '20:00' });
    expect(() => parseTimeSlot('20:00 - 18:30')).toThrow('Giờ kết thúc phải sau giờ bắt đầu');
    expect(() => parseTimeSlot('6pm - 8pm')).toThrow('Khung giờ phải có dạng HH:mm - HH:mm');
  });

  it('expands recurring schedules and omits excluded dates', () => {
    const instances = expandScheduleInstances(
      {
        startDate: '2026-01-05T00:00:00.000Z',
        endDate: '2026-01-12T00:00:00.000Z',
        scheduleDays: ['Thứ 2'],
        timeSlot: '08:00 - 10:00',
        room: 'Phòng 101',
      },
      [{
        dayOfWeek: 'Thứ 2',
        startTime: '08:00',
        endTime: '10:00',
        classroom: 'Phòng 101',
        excludedDates: ['2026-01-12T00:00:00.000Z'],
      }]
    );

    expect(instances.map((instance) => instance.sessionDate.toISOString().slice(0, 10))).toEqual(['2026-01-05']);
  });

  it('does not restore a cancelled recurring schedule from class defaults', () => {
    const instances = expandScheduleInstances(
      {
        startDate: '2026-01-05T00:00:00.000Z',
        endDate: '2026-01-12T00:00:00.000Z',
        scheduleDays: ['Thứ 2'],
        timeSlot: '08:00 - 10:00',
        room: 'Phòng 101',
      },
      [{
        dayOfWeek: 'Thứ 2',
        startTime: '08:00',
        endTime: '10:00',
        classroom: 'Phòng 101',
        status: 'CANCELLED',
      }]
    );

    expect(instances).toHaveLength(0);
  });

  it('detects overlapping times on the same date but allows adjacent sessions', () => {
    const session = (startTime: string, endTime: string) => ({
      sessionDate: new Date('2026-01-05T00:00:00.000Z'),
      startTime,
      endTime,
      classroom: 'Phòng 101',
    });

    expect(findScheduleTimeConflict([session('08:00', '10:00')], [session('09:30', '11:00')])).toBeDefined();
    expect(findScheduleTimeConflict([session('08:00', '10:00')], [session('10:00', '12:00')])).toBeUndefined();
  });
});
