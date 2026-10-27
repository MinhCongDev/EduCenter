import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { studentService } from '../../services/student.service';
import { useToast } from '../../contexts/ToastContext';
import type { ClassSchedule } from '../../types';
import { EmptyState, SkeletonPage } from '../../components/Skeleton';
import { canonicalDay, dayIndex, normalizeDay } from '../../utils/schedule';

const DAY_COLORS: Record<string, string> = {
  'Thứ 2': '#3b82f6',
  'Thứ 3': '#10b981',
  'Thứ 4': '#f59e0b',
  'Thứ 5': '#8b5cf6',
  'Thứ 6': '#ec4899',
  'Thứ 7': '#f97316',
  'Chủ Nhật': '#ef4444',
};

/** Tra màu theo ngày, không phân biệt hoa/thường ('Chủ Nhật' vs 'chủ nhật'). */
const dayColor = (day: string): string => {
  const found = Object.keys(DAY_COLORS).find(
    (k) => normalizeDay(k) === normalizeDay(day)
  );
  return (found && DAY_COLORS[found]) || '#64748b';
};

const SchedulePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchData = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const res = await studentService.getSchedule(id);
      if (res.success && res.data) setSchedules(res.data.schedule);
      else toast.error(res.message || 'Không thể tải lịch học');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể tải lịch học');
    } finally {
      setIsLoading(false);
    }
  };

  const grouped = useMemo(() => {
    const map: Record<string, ClassSchedule[]> = {};
    schedules.forEach((s) => {
      // Gom theo ngày đã chuẩn hoá để 'Chủ Nhật' và 'chủ nhật' là một nhóm.
      const key = canonicalDay(s.dayOfWeek);
      if (!map[key]) map[key] = [];
      map[key].push(s);
    });
    return map;
  }, [schedules]);

  const orderedDays = useMemo(() => {
    // Sắp xếp theo thứ tự trong tuần, không phụ thuộc hoa/thường.
    // Ngày lạ (không nằm trong danh sách) đưa xuống cuối.
    return Object.keys(grouped).sort((a, b) => {
      const ia = dayIndex(a);
      const ib = dayIndex(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  }, [grouped]);

  // Thông tin lớp để hiển thị mã lớp thay vì MongoDB ID
  const classInfo = (schedules[0] as any)?.class;

  if (isLoading) return <SkeletonPage message="Đang tải lịch học..." />;

  return (
    <div className="dash-container">
      <div className="dash-banner">
        <div className="dash-banner-content">
          <div className="dash-banner-badge">🗓️ Lịch Học</div>
          <h1>Lịch Học Chi Tiết</h1>
          <p>
            {schedules.length > 0
              ? `Tổng cộng ${schedules.length} buổi học trong tuần`
              : 'Chưa có lịch học cho lớp này.'}
          </p>
        </div>
        <div className="dash-banner-right">
          <div className="dash-date-pill">
            <div>🗓️ {orderedDays.length} ngày học/tuần</div>
            <div className="sub">
              Mã lớp: {classInfo?.classCode || '—'}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <Link to={`/student/classes/${id}`} className="dash-quick-btn" style={{ textDecoration: 'none' }}>
          ← Chi Tiết Lớp
        </Link>
        <Link to={`/student/classes/${id}/assignments`} className="dash-quick-btn" style={{ textDecoration: 'none' }}>
          📝 Bài Tập
        </Link>
        <Link to={`/student/classes/${id}/attendance`} className="dash-quick-btn" style={{ textDecoration: 'none' }}>
          📅 Điểm Danh
        </Link>
        <Link to={`/student/classes/${id}/grades`} className="dash-quick-btn" style={{ textDecoration: 'none' }}>
          📊 Bảng Điểm
        </Link>
      </div>

      {schedules.length > 0 && (
        <div className="dash-metrics-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Số buổi / tuần</span>
              <span className="dash-metric-val">{schedules.length}</span>
              <span className="dash-metric-trend up">{orderedDays.length} ngày học</span>
            </div>
            <div className="dash-metric-icon icon-blue">📅</div>
          </div>
          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Ngày nghỉ</span>
              <span className="dash-metric-val">{7 - orderedDays.length}</span>
              <span className="dash-metric-trend">
                {7 - orderedDays.length === 0 ? 'Học đủ 7 ngày' : 'Có thể nghỉ ngơi'}
              </span>
            </div>
            <div className="dash-metric-icon icon-emerald">🏖️</div>
          </div>
          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Phòng học</span>
              <span className="dash-metric-val">
                {schedules[0]?.room || schedules[0]?.classroom || '—'}
              </span>
              <span className="dash-metric-trend">
                {schedules.length > 0 ? 'Cố định phòng' : 'Chưa có thông tin'}
              </span>
            </div>
            <div className="dash-metric-icon icon-purple">🏫</div>
          </div>
        </div>
      )}

      {schedules.length === 0 ? (
        <EmptyState
          icon="📭"
          title="Chưa có lịch học"
          description="Lịch học sẽ được cập nhật bởi trung tâm."
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1rem',
          }}
        >
          {orderedDays.map((day) => (
            <div
              key={day}
              className="dash-card"
              style={{ borderLeft: `4px solid ${dayColor(day)}` }}
            >
              <div className="dash-card-header">
                <h2 className="dash-card-title">
                  <span>📅</span> {day}
                </h2>
                <span className="badge-pill badge-blue">{grouped[day].length} buổi</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.5rem 0' }}>
                {grouped[day].map((item) => (
                  <div
                    key={item._id}
                    style={{
                      background: 'var(--dash-card-subtle)',
                      borderRadius: '10px',
                      padding: '0.75rem 1rem',
                      borderLeft: `3px solid ${dayColor(day)}`,
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                      🕐 {item.startTime} — {item.endTime}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                      🏫 Phòng: {item.room || item.classroom || '—'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SchedulePage;
