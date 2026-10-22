import {
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
});
