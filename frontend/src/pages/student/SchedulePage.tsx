import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { studentService } from '../../services/student.service';
import type { ScheduleItem } from '../../types';

const SchedulePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchSchedule();
  }, [id]);

  const fetchSchedule = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await studentService.getSchedule(id);
      if (res.success && res.data) setSchedule(res.data.schedule);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Không thể tải lịch học');
    } finally {
      setIsLoading(false);
    }
  };

  const dayColors: Record<string, string> = {
    'Thứ Hai': '#3b82f6',
    'Thứ Ba': '#10b981',
    'Thứ Tư': '#f59e0b',
    'Thứ Năm': '#8b5cf6',
    'Thứ Sáu': '#ec4899',
    'Thứ Bảy': '#f97316',
    'Chủ Nhật': '#ef4444',
  };

  const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

  const getDayLabel = (d: string) => {
    const normalized = dayNames.find(n => n.toLowerCase().includes(d.toLowerCase())) || d;
    return normalized;
  };

  const groupedByDay: Record<string, ScheduleItem[]> = {};
  schedule.forEach(s => {
    const day = getDayLabel(s.dayOfWeek);
    if (!groupedByDay[day]) groupedByDay[day] = [];
    groupedByDay[day].push(s);
  });

  if (isLoading) {
    return (
      <div className="dash-container" style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p>Đang tải lịch học...</p>
      </div>
    );
  }

  return (
    <div className="dash-container">
      {/* ── Page Header ── */}
      <div className="dash-banner">
        <div className="dash-banner-content">
          <div className="dash-banner-badge">🗓️ Lịch Học</div>
          <h1>Lịch Học Chi Tiết</h1>
          <p>
            {schedule.length > 0
              ? `Tổng cộng ${schedule.length} buổi học trong tuần`
              : 'Chưa có lịch học cho lớp này.'}
          </p>
        </div>
        <div className="dash-banner-right">
          <div className="dash-date-pill">
            <div>🗓️ {Object.keys(groupedByDay).length} ngày học/tuần</div>
            <div className="sub">Lớp ID: {id}</div>
          </div>
        </div>
      </div>

      {/* ── Quick Nav ── */}
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

      {/* ── Error ── */}
      {error && (
        <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(239,68,68,0.1)', borderRadius: '12px', marginBottom: '1.5rem' }}>
          <p style={{ color: '#ef4444', marginBottom: '0.75rem' }}>{error}</p>
          <button className="dash-quick-btn primary" onClick={fetchSchedule}>Thử lại</button>
        </div>
      )}

      {/* ── Metrics ── */}
      {schedule.length > 0 && (
        <div className="dash-metrics-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Số buổi / tuần</span>
              <span className="dash-metric-val">{schedule.length}</span>
              <span className="dash-metric-trend up">{Object.keys(groupedByDay).length} ngày học</span>
            </div>
            <div className="dash-metric-icon icon-blue">📅</div>
          </div>
          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Ngày nghỉ</span>
              <span className="dash-metric-val">{7 - Object.keys(groupedByDay).length}</span>
              <span className="dash-metric-trend">
                {7 - Object.keys(groupedByDay).length === 0 ? 'Học đủ 7 ngày' : 'Có thể nghỉ ngơi'}
              </span>
            </div>
            <div className="dash-metric-icon icon-emerald">🏖️</div>
          </div>
          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Phòng học</span>
              <span className="dash-metric-val">{schedule[0]?.classroom || '—'}</span>
              <span className="dash-metric-trend">
                {schedule.length > 0 ? 'Cố định phòng' : 'Chưa có thông tin'}
              </span>
            </div>
            <div className="dash-metric-icon icon-purple">🏫</div>
          </div>
        </div>
      )}

      {/* ── Weekly Calendar View ── */}
      {schedule.length === 0 && !isLoading && !error ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--dash-card-subtle)', borderRadius: '16px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
          <h2>Chưa có lịch học</h2>
          <p style={{ opacity: 0.7 }}>Lịch học sẽ được cập nhật bởi trung tâm.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {dayNames
            .filter(day => groupedByDay[day])
            .map(day => (
              <div key={day} className="dash-card">
                <div className="dash-card-header" style={{ borderLeft: `4px solid ${dayColors[day] || '#64748b'}` }}>
                  <h2 className="dash-card-title">
                    <span>📅</span> {day}
                  </h2>
                  <span className="badge-pill badge-blue">{groupedByDay[day].length} buổi</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.5rem 0' }}>
                  {groupedByDay[day].map((item) => (
                    <div
                      key={item._id}
                      style={{
                        background: 'var(--dash-card-subtle)',
                        borderRadius: '10px',
                        padding: '0.75rem 1rem',
                        borderLeft: `3px solid ${dayColors[day] || '#64748b'}`,
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                        🕐 {item.startTime} — {item.endTime}
                      </div>
                      {item.topic && (
                        <div style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '0.25rem' }}>
                          📖 {item.topic}
                        </div>
                      )}
                      <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                        🏫 Phòng: {item.classroom}
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
