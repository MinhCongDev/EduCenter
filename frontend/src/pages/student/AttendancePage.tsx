import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { studentService } from '../../services/student.service';
import type { Attendance, AttendanceStats } from '../../types';

const AttendancePage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (classId) {
      fetchAttendance();
    }
  }, [classId]);

  const fetchAttendance = async () => {
    try {
      setIsLoading(true);
      const res = await studentService.getAttendance(classId!);
      if (res.success && res.data) {
        setAttendance(res.data.attendance);
        setStats(res.data.stats);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return { class: 'badge-green', text: '✅ Có mặt' };
      case 'ABSENT':
        return { class: 'badge-red', text: '❌ Vắng mặt' };
      case 'LATE':
        return { class: 'badge-amber', text: '⏰ Đi trễ' };
      case 'EXCUSED':
        return { class: 'badge-blue', text: '📋 Có phép' };
      default:
        return { class: 'badge-gray', text: status };
    }
  };

  const getPercentage = (value: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  if (isLoading) {
    return (
      <div className="dash-container" style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p>Đang tải thông tin điểm danh...</p>
      </div>
    );
  }

  return (
    <div className="dash-container">
      {/* Header */}
      <div className="dash-banner" style={{ marginBottom: '1.5rem' }}>
        <div className="dash-banner-content">
          <div className="dash-banner-badge">✅ Theo Dõi Điểm Danh</div>
          <h1>Bảng Điểm Danh</h1>
          <p>Xem lịch sử điểm danh các buổi học</p>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: '#fee2e2', borderRadius: '8px', marginBottom: '1rem', color: '#dc2626' }}>
          ❌ {error}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="dash-card" style={{ textAlign: 'center', borderTop: '4px solid #10b981' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>{stats.present}</div>
            <div style={{ opacity: 0.7 }}>Có mặt ({getPercentage(stats.present, stats.total)}%)</div>
          </div>
          <div className="dash-card" style={{ textAlign: 'center', borderTop: '4px solid #ef4444' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>❌</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444' }}>{stats.absent}</div>
            <div style={{ opacity: 0.7 }}>Vắng mặt ({getPercentage(stats.absent, stats.total)}%)</div>
          </div>
          <div className="dash-card" style={{ textAlign: 'center', borderTop: '4px solid #f59e0b' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏰</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b' }}>{stats.late}</div>
            <div style={{ opacity: 0.7 }}>Đi trễ ({getPercentage(stats.late, stats.total)}%)</div>
          </div>
          <div className="dash-card" style={{ textAlign: 'center', borderTop: '4px solid #6366f1' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#6366f1' }}>{stats.excused}</div>
            <div style={{ opacity: 0.7 }}>Có phép ({getPercentage(stats.excused, stats.total)}%)</div>
          </div>
        </div>
      )}

      {/* Overall Progress */}
      {stats && stats.total > 0 && (
        <div className="dash-card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 600 }}>Tỷ lệ có mặt</span>
            <span style={{ fontWeight: 700, color: '#10b981' }}>{getPercentage(stats.present + stats.excused, stats.total)}%</span>
          </div>
          <div className="dash-progress" style={{ height: '12px' }}>
            <div
              className="dash-progress-fill"
              style={{
                width: `${getPercentage(stats.present + stats.excused, stats.total)}%`,
                background: 'linear-gradient(90deg, #10b981, #34d399)'
              }}
            />
          </div>
        </div>
      )}

      {/* Attendance History */}
      <div className="dash-card">
        <div className="dash-card-header">
          <h2 className="dash-card-title">
            <span>📅</span> Lịch Sử Điểm Danh
          </h2>
          <span className="badge-pill badge-purple">{attendance.length} buổi</span>
        </div>

        {attendance.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', opacity: 0.7 }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📅</div>
            <p>Chưa có thông tin điểm danh</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem 0' }}>
            {[...attendance].reverse().map((record, index) => {
              const status = getStatusBadge(record.status);
              return (
                <div
                  key={record._id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    background: '#f9fafb',
                    borderRadius: '8px',
                    borderLeft: `4px solid ${record.status === 'PRESENT' ? '#10b981' : record.status === 'ABSENT' ? '#ef4444' : record.status === 'LATE' ? '#f59e0b' : '#6366f1'}`
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      Buổi học {attendance.length - index}
                    </div>
                    <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                      {record.schedule?.dayOfWeek} • {record.schedule?.startTime} - {record.schedule?.endTime}
                      {record.schedule?.room && ` • Phòng ${record.schedule.room}`}
                    </div>
                    <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                      Ngày: {new Date(record.date).toLocaleDateString('vi-VN', {
                        weekday: 'long',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </div>
                    {record.note && (
                      <div style={{ fontSize: '0.85rem', color: '#6366f1', marginTop: '0.25rem' }}>
                        Ghi chú: {record.note}
                      </div>
                    )}
                  </div>
                  <span className={`badge-pill ${status.class}`}>{status.text}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Back Button */}
      <div style={{ marginTop: '1.5rem' }}>
        <button
          type="button"
          className="dash-quick-btn"
          onClick={() => window.history.back()}
        >
          ← Quay lại
        </button>
      </div>
    </div>
  );
};

export default AttendancePage;
