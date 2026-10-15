import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { studentService } from '../../services/student.service';
import type { AttendanceItem } from '../../types';

const AttendancePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [attendance, setAttendance] = useState<AttendanceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchAttendance();
  }, [id]);

  const fetchAttendance = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await studentService.getAttendance(id);
      if (res.success && res.data) setAttendance(res.data.attendance);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Không thể tải điểm danh');
    } finally {
      setIsLoading(false);
    }
  };

  const statusConfig = (s: string) => {
    if (s === 'PRESENT') return { label: 'Có mặt', cls: 'badge-green', icon: '✅' };
    if (s === 'ABSENT') return { label: 'Vắng mặt', cls: 'badge-purple', icon: '❌' };
    if (s === 'LATE') return { label: 'Đi trễ', cls: 'badge-amber', icon: '⏰' };
    if (s === 'EXCUSED') return { label: 'Có phép', cls: 'badge-blue', icon: '📋' };
    return { label: s, cls: 'badge-amber', icon: '❓' };
  };

  const presentCount = attendance.filter(a => a.status === 'PRESENT').length;
  const absentCount = attendance.filter(a => a.status === 'ABSENT').length;
  const lateCount = attendance.filter(a => a.status === 'LATE').length;
  const excusedCount = attendance.filter(a => a.status === 'EXCUSED').length;
  const rate = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0;

  if (isLoading) {
    return (
      <div className="dash-container" style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p>Đang tải điểm danh...</p>
      </div>
    );
  }

  return (
    <div className="dash-container">
      {/* ── Page Header ── */}
      <div className="dash-banner">
        <div className="dash-banner-content">
          <div className="dash-banner-badge">📅 Điểm Danh</div>
          <h1>Bảng Điểm Danh</h1>
          <p>
            {attendance.length > 0
              ? `Tổng cộng ${attendance.length} buổi học. Tỷ lệ có mặt: ${rate}%`
              : 'Chưa có dữ liệu điểm danh.'}
          </p>
        </div>
        <div className="dash-banner-right">
          <div className="dash-date-pill">
            <div>📅 {attendance.length} buổi học</div>
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
        <Link to={`/student/classes/${id}/grades`} className="dash-quick-btn" style={{ textDecoration: 'none' }}>
          📊 Bảng Điểm
        </Link>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(239,68,68,0.1)', borderRadius: '12px', marginBottom: '1.5rem' }}>
          <p style={{ color: '#ef4444', marginBottom: '0.75rem' }}>{error}</p>
          <button className="dash-quick-btn primary" onClick={fetchAttendance}>Thử lại</button>
        </div>
      )}

      {/* ── Metrics ── */}
      {attendance.length > 0 && (
        <div className="dash-metrics-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Tổng buổi học</span>
              <span className="dash-metric-val">{attendance.length}</span>
              <span className="dash-metric-trend">Tỷ lệ có mặt: {rate}%</span>
            </div>
            <div className="dash-metric-icon icon-blue">📅</div>
          </div>
          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Có mặt</span>
              <span className="dash-metric-val" style={{ color: '#10b981' }}>{presentCount}</span>
              <span className="dash-metric-trend up">Tỷ lệ {rate}%</span>
            </div>
            <div className="dash-metric-icon icon-emerald">✅</div>
          </div>
          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Vắng mặt</span>
              <span className="dash-metric-val" style={{ color: '#8b5cf6' }}>{absentCount}</span>
              <span className="dash-metric-trend">
                {lateCount > 0 ? `${lateCount} đi trễ` : 'Không đi trễ'}
              </span>
            </div>
            <div className="dash-metric-icon icon-purple">❌</div>
          </div>
        </div>
      )}

      {/* ── Attendance Table ── */}
      {attendance.length === 0 && !isLoading && !error ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--dash-card-subtle)', borderRadius: '16px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
          <h2>Chưa có dữ liệu điểm danh</h2>
          <p style={{ opacity: 0.7 }}>Dữ liệu điểm danh sẽ được cập nhật sau mỗi buổi học.</p>
        </div>
      ) : (
        <div className="dash-card">
          <div className="dash-card-header">
            <h2 className="dash-card-title"><span>📋</span> Lịch Sử Điểm Danh</h2>
            <span className="badge-pill badge-blue">{attendance.length} buổi</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
              <thead>
                <tr style={{ background: 'var(--dash-card-subtle)' }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>#</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Ngày học</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Ngày trong tuần</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Trạng thái</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((item, idx) => {
                  const status = statusConfig(item.status);
                  const date = new Date(item.sessionDate);
                  const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
                  return (
                    <tr key={item._id} style={{ borderBottom: '1px solid var(--dash-card-subtle)' }}>
                      <td style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.85rem' }}>{idx + 1}</td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                        {date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>{dayNames[date.getDay()]}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span className={`badge-pill ${status.cls}`}>
                          {status.icon} {status.label}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#64748b' }}>
                        {item.notes || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendancePage;
