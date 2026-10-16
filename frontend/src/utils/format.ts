// ===========================
// UI utility helpers
// ===========================

export const formatVND = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null) return '—';
  return amount.toLocaleString('vi-VN') + ' ₫';
};

export const formatDate = (date: string | Date | undefined | null, withTime = false): string => {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  if (withTime) {
    return d.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const daysFromNow = (date: string | Date): number => {
  const target = new Date(date).getTime();
  const now = Date.now();
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
};

export const isPast = (date: string | Date): boolean => {
  return new Date(date).getTime() < Date.now();
};

export const bandColor = (band: number | undefined | null): string => {
  if (band === undefined || band === null) return '#64748b';
  if (band >= 8.0) return '#10b981';
  if (band >= 6.5) return '#3b82f6';
  if (band >= 5.0) return '#f59e0b';
  return '#ef4444';
};

export const bandLabel = (band: number): string => {
  if (band >= 8.0) return 'Xuất sắc';
  if (band >= 6.5) return 'Khá';
  if (band >= 5.0) return 'Trung bình';
  if (band >= 4.0) return 'Yếu';
  return 'Cần cố gắng';
};

export const truncate = (str: string, max = 50): string => {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '…' : str;
};
