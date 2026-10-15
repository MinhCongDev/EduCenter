import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

interface AttendanceRecord {
  id: string;
  date: string;
  sessionNumber: number;
  topic: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  note?: string;
}

const AttendancePage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PRESENT' | 'ABSENT' | 'LATE'>('ALL');

  useEffect(() => {
    // Mock data - sẽ thay bằng API: GET /api/student/classes/:classId/attendance
    setTimeout(() => {
      const mockRecords: AttendanceRecord[] = [
        { id: 'r1', date: '15/10/2026', sessionNumber: 12, topic: 'Express Router & Middleware', status: 'PRESENT' },
        { id: 'r2', date: '13/10/2026', sessionNumber: 11, topic: 'MongoDB CRUD Operations', status: 'PRESENT' },
        { id: 'r3', date: '10/10/2026', sessionNumber: 10, topic: 'Mongoose Schema & Model', status: 'LATE', note: 'Đi học muộn 15 phút' },
        { id: 'r4', date: '08/10/2026', sessionNumber: 9, topic: 'Node.js cơ bản', status: 'PRESENT' },
        { id: 'r5', date: '06/10/2026', sessionNumber: 8, topic: 'Async/Await & Promises', status: 'EXCUSED', note: 'Có việc gia đình' },
        { id: 'r6', date: '03/10/2026', sessionNumber: 7, topic: 'ES6+ Advanced', status: 'PRESENT' },
        { id: 'r7', date: '01/10/2026', sessionNumber: 6, topic: 'DOM Manipulation', status: 'PRESENT' },
        { id: 'r8', date: '29/09/2026', sessionNumber: 5, topic: 'JavaScript OOP', status: 'ABSENT', note: 'Nghỉ không phép' },
        { id: 'r9', date: '27/09/2026', sessionNumber: 4, topic: 'JavaScript ES6', status: 'PRESENT' },
        { id: 'r10', date: '24/09/2026', sessionNumber: 3, topic: 'CSS3 Flexbox & Grid', status: 'PRESENT' },
        { id: 'r11', date: '22/09/2026', sessionNumber: 2, topic: 'HTML5 Semantic', status: 'LATE' },
        { id: 'r12', date: '20/09/2026', sessionNumber: 1, topic: 'Khai giảng & Tổng quan', status: 'PRESENT' },
      ];
      setRecords(mockRecords);
      setLoading(false);
    }, 500);
  }, [classId]);

  if (loading) {
    return (
      <div className="dash-container">
        <div className="dash-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Đang tải dữ liệu điểm danh...</p>
        </div>
      </div>
    );
  }

  const filtered = records.filter((r) => filter === 'ALL' || r.status === filter);

  const stats = {
    total: records.length,
    present: records.filter((r) => r.status === 'PRESENT').length,
    absent: records.filter((r) => r.status === 'ABSENT').length,
    late: records.filter((r) => r.status === 'LATE').length,
    excused: records.filter((r) => r.status === 'EXCUSED').length,
  };

  const attendanceRate = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;
  const onTimeRate = stats.total > 0 ? Math.round(((stats.present + stats.late) / stats.total) * 100) : 0;

  return (
    <div className="dash-container">
      {/* ── Banner ── */}
      <div className="dash-banner">
        <div className="dash-banner-content">
          <div className="dash-banner-badge">✅ Điểm Danh • EduCenter Portal</div>
          <h1>Lịch sử điểm danh</h1>
          <p>Theo dõi tỷ lệ chuyên cần và chi tiết từng buổi học.</p>
        </div>
        <div className="dash-banner-right">
          <div className="dash-date-pill">
            <div>📚 Lớp: WEB-K24-A</div>
            <div className="sub">MERN Full-Stack</div>
          </div>
        </div>
      </div>

      {/* ── Hero Stats ── */}
      <div className="dash-two-col">
        <div
          className="dash-card"
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
            borderLeft: '4px solid #10b981',
          }}
        >
          <h3 className="dash-card-title" style={{ margin: 0, fontSize: '0.95rem' }}>
            📊 Tỷ lệ chuyên cần (Có mặt)
          </h3>
          <div style={{ fontSize: '3rem', fontWeight: 800, color: '#10b981', marginTop: '0.5rem' }}>
            {attendanceRate}%
          </div>
          <div className="dash-progress" style={{ height: '10px', marginTop: '0.5rem' }}>
            <div className="dash-progress-fill" style={{ width: `${attendanceRate}%`, background: '#10b981' }} />
          </div>
          <p style={{ fontSize: '0.85rem', opacity: 0.7, margin: '0.5rem 0 0 0' }}>
            {stats.present} / {stats.total} buổi có mặt đúng giờ
          </p>
        </div>

        <div
          className="dash-card"
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%)',
            borderLeft: '4px solid #6366f1',
          }}
        >
          <h3 className="dash-card-title" style={{ margin: 0, fontSize: '0.95rem' }}>
            ⏰ Tỷ lệ tham gia (Tính cả đi muộn)
          </h3>
          <div style={{ fontSize: '3rem', fontWeight: 800, color: '#6366f1', marginTop: '0.5rem' }}>
            {onTimeRate}%
          </div>
          <div className="dash-progress" style={{ height: '10px', marginTop: '0.5rem' }}>
            <div className="dash-progress-fill" style={{ width: `${onTimeRate}%` }} />
          </div>
          <p style={{ fontSize: '0.85rem', opacity: 0.7, margin: '0.5rem 0 0 0' }}>
            {stats.present + stats.late} / {stats.total} buổi có tham gia
          </p>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="dash-metrics-grid">
        <div className="dash-metric-card">
          <div className="dash-metric-info">
            <span className="dash-metric-label">Có mặt</span>
            <span className="dash-metric-val">{stats.present} buổi</span>
            <span className="dash-metric-trend up">✅ Tốt</span>
          </div>
          <div className="dash-metric-icon icon-emerald">✅</div>
        </div>
        <div className="dash-metric-card">
          <div className="dash-metric-info">
            <span className="dash-metric-label">Đi muộn</span>
            <span className="dash-metric-val">{stats.late} buổi</span>
            <span className="dash-metric-trend neutral">⏰ Lưu ý</span>
          </div>
          <div className="dash-metric-icon icon-amber">⏰</div>
        </div>
        <div className="dash-metric-card">
          <div className="dash-metric-info">
            <span className="dash-metric-label">Vắng có phép</span>
            <span className="dash-metric-val">{stats.excused} buổi</span>
            <span className="dash-metric-trend neutral">📋 Hợp lệ</span>
          </div>
          <div className="dash-metric-icon icon-blue">📋</div>
        </div>
        <div className="dash-metric-card">
          <div className="dash-metric-info">
            <span className="dash-metric-label">Vắng không phép</span>
            <span className="dash-metric-val">{stats.absent} buổi</span>
            <span className={`dash-metric-trend ${stats.absent > 0 ? 'down' : 'up'}`}>
              {stats.absent > 0 ? '⚠️ Cần cải thiện' : '🎉 Tuyệt vời'}
            </span>
          </div>
          <div className="dash-metric-icon" style={{ background: stats.absent > 0 ? '#fee2e2' : '#d1fae5' }}>
            {stats.absent > 0 ? '⚠️' : '🎉'}
          </div>
        </div>
      </div>

      {/* ── Filter + List ── */}
      <div className="dash-card">
        <div className="dash-card-header">
          <h2 className="dash-card-title">
            <span>📋</span> Lịch Sử Điểm Danh
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link
              to={`/student/classes/${classId}`}
              className="dash-quick-btn"
              style={{ textDecoration: 'none', padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
            >
              ← Quay lại
            </Link>
            {(['ALL', 'PRESENT', 'LATE', 'ABSENT'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`dash-quick-btn ${filter === f ? 'primary' : ''}`}
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
              >
                {f === 'ALL'
                  ? 'Tất cả'
                  : f === 'PRESENT'
                    ? 'Có mặt'
                    : f === 'LATE'
                      ? 'Muộn'
                      : 'Vắng'}
              </button>
            ))}
          </div>
        </div>

        <div className="dash-item-list">
          {filtered.length === 0 ? (
            <div className="dash-subcard" style={{ textAlign: 'center', padding: '2rem' }}>
              <p style={{ opacity: 0.6, margin: 0 }}>Không có dữ liệu trong mục này.</p>
            </div>
          ) : (
            filtered.map((r) => (
              <div key={r.id} className="dash-subcard">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ flex: 1, minWidth: '250px' }}>
                    <h3 className="dash-subcard-title" style={{ margin: 0 }}>
                      Buổi {r.sessionNumber}: {r.topic}
                    </h3>
                    <div className="dash-subcard-meta" style={{ marginTop: '0.4rem' }}>
                      📅 <strong>{r.date}</strong>
                    </div>
                    {r.note && (
                      <div
                        className="dash-subcard"
                        style={{
                          marginTop: '0.5rem',
                          background: 'rgba(245, 158, 11, 0.08)',
                          borderLeft: '3px solid #f59e0b',
                          padding: '0.5rem 0.75rem',
                        }}
                      >
                        <strong style={{ fontSize: '0.8rem', color: '#f59e0b' }}>📝 Ghi chú:</strong>
                        <p style={{ fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>{r.note}</p>
                      </div>
                    )}
                  </div>
                  <div>
                    {r.status === 'PRESENT' && (
                      <span className="badge-pill badge-green" style={{ fontSize: '0.9rem', padding: '0.4rem 1rem' }}>
                        ✅ Có mặt
                      </span>
                    )}
                    {r.status === 'LATE' && (
                      <span className="badge-pill badge-amber" style={{ fontSize: '0.9rem', padding: '0.4rem 1rem' }}>
                        ⏰ Đi muộn
                      </span>
                    )}
                    {r.status === 'ABSENT' && (
                      <span
                        className="badge-pill"
                        style={{ background: '#ef4444', color: 'white', fontSize: '0.9rem', padding: '0.4rem 1rem' }}
                      >
                        ❌ Vắng KP
                      </span>
                    )}
                    {r.status === 'EXCUSED' && (
                      <span className="badge-pill badge-blue" style={{ fontSize: '0.9rem', padding: '0.4rem 1rem' }}>
                        📋 Có phép
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;
