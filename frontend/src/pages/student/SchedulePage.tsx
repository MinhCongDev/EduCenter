import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { studentService } from '../../services/student.service';
import type { ClassSchedule } from '../../types';

const SchedulePage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (classId) {
      fetchSchedule();
    }
  }, [classId]);

  const fetchSchedule = async () => {
    try {
      setIsLoading(true);
      const res = await studentService.getWeeklySchedule(classId!);
      if (res.success && res.data) {
        setSchedules(res.data.schedules);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const dayOrder = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
  
  const sortedSchedules = [...schedules].sort((a, b) => {
    return dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek);
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
      {/* Header */}
      <div className="dash-banner" style={{ marginBottom: '1.5rem' }}>
        <div className="dash-banner-content">
          <div className="dash-banner-badge">📅 Thời Khóa Biểu</div>
          <h1>Lịch Học Trong Tuần</h1>
          <p>Xem lịch học chi tiết theo từng buổi</p>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: '#fee2e2', borderRadius: '8px', marginBottom: '1rem', color: '#dc2626' }}>
          ❌ {error}
        </div>
      )}

      {/* Schedule by Day */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {sortedSchedules.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', background: '#f9fafb', borderRadius: '12px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
            <h3>Chưa có lịch học</h3>
            <p style={{ opacity: 0.7 }}>Lớp học chưa được xếp lịch</p>
          </div>
        ) : (
          sortedSchedules.map((schedule, index) => (
            <div key={schedule._id} className="dash-card" style={{ borderLeft: `4px solid ${getDayColor(schedule.dayOfWeek)}` }}>
              <div className="dash-card-header">
                <h2 className="dash-card-title">
                  <span>{getDayEmoji(schedule.dayOfWeek)}</span> {schedule.dayOfWeek}
                </h2>
              </div>

              <div style={{ padding: '1rem 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>🕐</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.2rem', color: '#6366f1' }}>
                      {schedule.startTime} - {schedule.endTime}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>📍</span>
                  <div>
                    <div style={{ fontWeight: 600 }}>{schedule.room}</div>
                  </div>
                </div>
              </div>

              <div style={{ paddingTop: '0.75rem', borderTop: '1px solid #e5e7eb' }}>
                <span className="badge-pill badge-blue">Buổi {index + 1} trong tuần</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Links */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="dash-quick-btn"
          onClick={() => window.history.back()}
        >
          ← Quay lại
        </button>
        <button
          type="button"
          className="dash-quick-btn"
          onClick={() => window.location.href = `/student/classes/${classId}/assignments`}
        >
          📝 Bài tập của lớp
        </button>
      </div>
    </div>
  );
};

// Helper functions
const getDayEmoji = (day: string): string => {
  const emojis: Record<string, string> = {
    'Thứ 2': '🌟',
    'Thứ 3': '🌈',
    'Thứ 4': '☀️',
    'Thứ 5': '🌤️',
    'Thứ 6': '🎉',
    'Thứ 7': '🎊',
    'Chủ nhật': '🌙',
  };
  return emojis[day] || '📅';
};

const getDayColor = (day: string): string => {
  const colors: Record<string, string> = {
    'Thứ 2': '#6366f1',
    'Thứ 3': '#8b5cf6',
    'Thứ 4': '#06b6d4',
    'Thứ 5': '#10b981',
    'Thứ 6': '#f59e0b',
    'Thứ 7': '#ec4899',
    'Chủ nhật': '#ef4444',
  };
  return colors[day] || '#6366f1';
};

export default SchedulePage;
