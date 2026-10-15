import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

interface ScheduleItem {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string;
  sessionNumber: number;
  topic: string;
  date: string;
}

const SchedulePage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'WEEKLY' | 'LIST'>('WEEKLY');

  useEffect(() => {
    // Mock data - sẽ thay bằng API: GET /api/student/classes/:classId/schedule
    setTimeout(() => {
      const mockSchedules: ScheduleItem[] = [
        { dayOfWeek: 'Thứ 2', startTime: '18:30', endTime: '20:30', room: 'Lab 302', sessionNumber: 13, topic: 'Middleware & Error Handling', date: '20/10/2026' },
        { dayOfWeek: 'Thứ 4', startTime: '18:30', endTime: '20:30', room: 'Lab 302', sessionNumber: 14, topic: 'Authentication với JWT', date: '22/10/2026' },
        { dayOfWeek: 'Thứ 6', startTime: '18:30', endTime: '20:30', room: 'Lab 302', sessionNumber: 15, topic: 'Upload file & Validation', date: '24/10/2026' },
        { dayOfWeek: 'Thứ 2', startTime: '18:30', endTime: '20:30', room: 'Lab 302', sessionNumber: 16, topic: 'React Hooks nâng cao', date: '27/10/2026' },
        { dayOfWeek: 'Thứ 4', startTime: '18:30', endTime: '20:30', room: 'Lab 302', sessionNumber: 17, topic: 'State Management với Redux Toolkit', date: '29/10/2026' },
        { dayOfWeek: 'Thứ 6', startTime: '18:30', endTime: '20:30', room: 'Lab 302', sessionNumber: 18, topic: 'React Router v6', date: '31/10/2026' },
      ];
      setSchedules(mockSchedules);
      setLoading(false);
    }, 500);
  }, [classId]);

  if (loading) {
    return (
      <div className="dash-container">
        <div className="dash-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Đang tải thời khóa biểu...</p>
        </div>
      </div>
    );
  }

  const days = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

  // Lấy tuần hiện tại
  const today = new Date();
  const currentWeek: ScheduleItem[] = schedules.filter((s) => {
    const itemDate = s.date.split('/').reverse().join('-');
    const itemD = new Date(itemDate);
    const diff = (itemD.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  });

  return (
    <div className="dash-container">
      {/* ── Banner ── */}
      <div className="dash-banner">
        <div className="dash-banner-content">
          <div className="dash-banner-badge">📅 Thời Khóa Biểu • EduCenter Portal</div>
          <h1>Lịch học tuần này</h1>
          <p>Xem lịch học chi tiết theo tuần hoặc danh sách toàn bộ.</p>
        </div>
        <div className="dash-banner-right">
          <div className="dash-date-pill">
            <div>📚 Lớp: WEB-K24-A</div>
            <div className="sub">MERN Full-Stack</div>
          </div>
        </div>
      </div>

      {/* ── Filter Tabs ── */}
      <div className="dash-card">
        <div className="dash-card-header">
          <h2 className="dash-card-title">
            <span>📆</span> Thời Khóa Biểu
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link
              to={`/student/classes/${classId}`}
              className="dash-quick-btn"
              style={{ textDecoration: 'none', padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
            >
              ← Quay lại
            </Link>
            {(['WEEKLY', 'LIST'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`dash-quick-btn ${view === v ? 'primary' : ''}`}
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
              >
                {v === 'WEEKLY' ? 'Theo tuần' : 'Danh sách'}
              </button>
            ))}
          </div>
        </div>

        {view === 'WEEKLY' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
            {days.map((day) => {
              const daySchedules = currentWeek.filter((s) => s.dayOfWeek === day);
              return (
                <div
                  key={day}
                  style={{
                    background: 'rgba(99, 102, 241, 0.05)',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    minHeight: '200px',
                  }}
                >
                  <h4
                    style={{
                      margin: '0 0 0.5rem 0',
                      fontSize: '0.85rem',
                      textAlign: 'center',
                      color: '#6366f1',
                      fontWeight: 700,
                    }}
                  >
                    {day}
                  </h4>
                  {daySchedules.length === 0 ? (
                    <p style={{ textAlign: 'center', fontSize: '0.75rem', opacity: 0.5 }}>—</p>
                  ) : (
                    daySchedules.map((s) => (
                      <div
                        key={s.sessionNumber}
                        style={{
                          background: 'white',
                          border: '2px solid #6366f1',
                          borderRadius: '6px',
                          padding: '0.5rem',
                          fontSize: '0.75rem',
                          marginBottom: '0.5rem',
                        }}
                      >
                        <div style={{ fontWeight: 700, color: '#6366f1' }}>Buổi {s.sessionNumber}</div>
                        <div style={{ marginTop: '0.25rem' }}>{s.startTime} - {s.endTime}</div>
                        <div style={{ marginTop: '0.25rem', opacity: 0.7 }}>📍 {s.room}</div>
                        <div style={{ marginTop: '0.4rem', fontWeight: 600, fontSize: '0.7rem' }}>
                          {s.topic}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="dash-item-list">
            {schedules.map((s) => (
              <div key={s.sessionNumber} className="dash-subcard">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <div>
                    <h3 className="dash-subcard-title" style={{ margin: 0 }}>
                      Buổi {s.sessionNumber}: {s.topic}
                    </h3>
                    <div className="dash-subcard-meta" style={{ marginTop: '0.4rem' }}>
                      📅 <strong>{s.dayOfWeek}, {s.date}</strong> • ⏰ {s.startTime} - {s.endTime}
                    </div>
                    <div className="dash-subcard-meta">📍 {s.room}</div>
                  </div>
                  <span className="badge-pill badge-blue">Buổi {s.sessionNumber}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SchedulePage;
