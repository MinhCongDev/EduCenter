import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { studentService } from '../../services/student.service';
import { useToast } from '../../contexts/ToastContext';
import { SkeletonPage } from '../../components/Skeleton';
import { EmptyState } from '../../components/Skeleton';

const DAYS = [
  { key: 'MONDAY', label: 'Thứ 2', short: 'T2' },
  { key: 'TUESDAY', label: 'Thứ 3', short: 'T3' },
  { key: 'WEDNESDAY', label: 'Thứ 4', short: 'T4' },
  { key: 'THURSDAY', label: 'Thứ 5', short: 'T5' },
  { key: 'FRIDAY', label: 'Thứ 6', short: 'T6' },
  { key: 'SATURDAY', label: 'Thứ 7', short: 'T7' },
  { key: 'SUNDAY', label: 'Chủ nhật', short: 'CN' },
];

// Allow English or Vietnamese day names
const normDay = (d: string): string => {
  const x = (d || '').toUpperCase();
  const map: Record<string, string> = {
    MONDAY: 'MONDAY', TUE: 'TUESDAY', TUESDAY: 'TUESDAY',
    WED: 'WEDNESDAY', WEDNESDAY: 'WEDNESDAY',
    THU: 'THURSDAY', THURSDAY: 'THURSDAY', THUR: 'THURSDAY',
    FRI: 'FRIDAY', FRIDAY: 'FRIDAY',
    SAT: 'SATURDAY', SATURDAY: 'SATURDAY',
    SUN: 'SUNDAY', SUNDAY: 'SUNDAY',
  };
  return map[x] || x;
};

const PALETTE = [
  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1',
];

const CombinedSchedulePage: React.FC = () => {
  const toast = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [classCount, setClassCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeClass, setActiveClass] = useState<string>('ALL');

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const res = await studentService.getCombinedSchedule();
        if (res.success && res.data) {
          setItems(res.data.schedule || []);
          setClassCount(res.data.classCount || 0);
        } else {
          toast.error(res.message || 'Không thể tải lịch học');
        }
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Không thể tải lịch học');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const classMap = useMemo(() => {
    const m = new Map<string, { code: string; course?: any }>();
    items.forEach((it: any) => {
      if (it.class && it.class._id) {
        m.set(it.class._id, {
          code: it.class.classCode,
          course: it.class.course,
        });
      }
    });
    return m;
  }, [items]);

  // unique classes for filter
  const uniqueClasses = useMemo(() => {
    const arr = Array.from(classMap.entries()).map(([id, v]) => ({
      _id: id,
      label: v.course ? `${v.course.code} — ${v.course.title}` : v.code,
    }));
    return arr;
  }, [classMap]);

  const filteredItems = useMemo(() => {
    if (activeClass === 'ALL') return items;
    return items.filter((i: any) => i.class?._id === activeClass);
  }, [items, activeClass]);

  // Map: dayKey -> items[]
  const byDay = useMemo(() => {
    const m: Record<string, any[]> = {};
    DAYS.forEach((d) => (m[d.key] = []));
    filteredItems.forEach((it: any) => {
      const k = normDay(it.dayOfWeek);
      if (m[k]) m[k].push(it);
    });
    Object.values(m).forEach((arr) =>
      arr.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
    );
    return m;
  }, [filteredItems]);

  // Detect time-slot buckets (Morning/Afternoon/Evening) for visual
  const slotOf = (t: string): 'MORNING' | 'AFTERNOON' | 'EVENING' => {
    const hour = parseInt((t || '0').split(':')[0], 10);
    if (hour < 12) return 'MORNING';
    if (hour < 18) return 'AFTERNOON';
    return 'EVENING';
  };

  if (isLoading) return <SkeletonPage message="Đang tải lịch học..." />;

  return (
    <div className="dash-container">
      <div className="dash-banner">
        <div className="dash-banner-content">
          <div className="dash-banner-badge">🗓️ Lịch Học</div>
          <h1>Lịch Học Tổng Hợp</h1>
          <p>
            {items.length > 0
              ? `Tổng hợp lịch học của ${classCount} lớp trong tuần.`
              : 'Bạn chưa có lịch học nào.'}
          </p>
        </div>
        <div className="dash-banner-right">
          <div className="dash-date-pill">
            <div>📅 {items.length} buổi/tuần</div>
            <div className="sub">{classCount} lớp đang học</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <Link to="/student/dashboard" className="dash-quick-btn" style={{ textDecoration: 'none' }}>
          ← Dashboard
        </Link>
        <Link to="/student/classes" className="dash-quick-btn" style={{ textDecoration: 'none' }}>
          📚 Lớp Học
        </Link>
      </div>

      {uniqueClasses.length > 1 && (
        <div className="dash-card" style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem', marginRight: '0.5rem' }}>
              🎯 Lọc theo lớp:
            </span>
            <button
              type="button"
              onClick={() => setActiveClass('ALL')}
              className={`dash-quick-btn ${activeClass === 'ALL' ? 'primary' : ''}`}
              style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
            >
              Tất cả ({classCount})
            </button>
            {uniqueClasses.map((c) => (
              <button
                key={c._id}
                type="button"
                onClick={() => setActiveClass(c._id)}
                className={`dash-quick-btn ${activeClass === c._id ? 'primary' : ''}`}
                style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {filteredItems.length === 0 ? (
        <EmptyState
          icon="📅"
          title="Chưa có lịch học"
          description="Các lớp của bạn chưa được xếp lịch cố định. Vui lòng liên hệ trung tâm."
        />
      ) : (
        <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Desktop: grid tuần */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              minHeight: 200,
              borderBottom: '1px solid #e5e7eb',
            }}
          >
            {DAYS.map((d) => {
              const list = byDay[d.key] || [];
              return (
                <div
                  key={d.key}
                  style={{
                    borderRight: '1px solid #e5e7eb',
                    padding: '0.75rem 0.5rem',
                    background: list.length > 0 ? '#f8fafc' : 'white',
                  }}
                >
                  <div
                    style={{
                      textAlign: 'center',
                      fontWeight: 700,
                      color: list.length > 0 ? '#0f172a' : '#94a3b8',
                      marginBottom: '0.5rem',
                      fontSize: '0.9rem',
                    }}
                  >
                    {d.label}
                  </div>
                  {list.length === 0 ? (
                    <div
                      style={{
                        textAlign: 'center',
                        color: '#cbd5e1',
                        fontSize: '0.8rem',
                        padding: '1.5rem 0',
                      }}
                    >
                      —
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {list.map((s: any) => {
                        const colorIdx = uniqueClasses.findIndex(
                          (c) => c._id === s.class?._id
                        );
                        const color = PALETTE[colorIdx % PALETTE.length];
                        const slot = slotOf(s.startTime);
                        return (
                          <Link
                            key={s._id}
                            to={`/student/classes/${s.class?._id}`}
                            style={{
                              textDecoration: 'none',
                              background: 'white',
                              borderLeft: `4px solid ${color}`,
                              borderRadius: '6px',
                              padding: '0.5rem',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                              fontSize: '0.78rem',
                              color: '#0f172a',
                            }}
                          >
                            <div style={{ fontWeight: 700, marginBottom: 2 }}>
                              {s.startTime}–{s.endTime}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                              {slot === 'MORNING' ? '🌅' : slot === 'AFTERNOON' ? '☀️' : '🌙'}{' '}
                              {s.class?.course?.code || s.class?.classCode}
                            </div>
                            {s.room && (
                              <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 2 }}>
                                📍 {s.room}
                              </div>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ padding: '1rem', background: 'white' }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              🎨 Chú thích màu theo lớp:
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {uniqueClasses.map((c, idx) => (
                <div
                  key={c._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.85rem',
                  }}
                >
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 4,
                      background: PALETTE[idx % PALETTE.length],
                    }}
                  />
                  {c.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CombinedSchedulePage;
