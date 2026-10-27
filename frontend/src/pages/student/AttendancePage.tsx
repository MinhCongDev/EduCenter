import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { studentService } from '../../services/student.service';
import { useToast } from '../../contexts/ToastContext';
import type { Attendance, AttendanceStats, AttendanceStatus } from '../../types';
import { EmptyState, SkeletonPage } from '../../components/Skeleton';
import { formatDate } from '../../utils/format';

const statusCfg = (s: AttendanceStatus) => {
  const map: Record<AttendanceStatus, { label: string; cls: string; icon: string }> = {
    PRESENT: { label: 'Có mặt', cls: 'badge-green', icon: '✅' },
    ABSENT: { label: 'Vắng mặt', cls: 'badge-purple', icon: '❌' },
    LATE: { label: 'Đi trễ', cls: 'badge-amber', icon: '⏰' },
    EXCUSED: { label: 'Có phép', cls: 'badge-blue', icon: '📋' },
  };
  return map[s] || { label: s, cls: 'badge-amber', icon: '❓' };
};

/** Tên thứ trong tuần theo thứ tự Date.getDay() (0 = Chủ Nhật). */
const DAY_NAMES = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

const AttendancePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const [records, setRecords] = useState<Attendance[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [classCode, setClassCode] = useState<string>('');
  const [courseTitle, setCourseTitle] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      // Tải song song dữ liệu điểm danh + thông tin lớp, để hiện mã lớp
      // thật thay vì ObjectId kỹ thuật trên banner.
      const [res, clsRes] = await Promise.all([
        studentService.getAttendance(id),
        studentService.getClassDetails(id).catch(() => null),
      ]);
      if (res.success && res.data) {
        setRecords(res.data.attendance);
        setStats(res.data.stats);
      } else {
        toast.error(res.message || 'Không thể tải điểm danh');
      }
      const c = (clsRes?.data?.class as any)?.class;
      if (c) {
        setClassCode(c.classCode || '');
        setCourseTitle(c.course?.title || '');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể tải điểm danh');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <SkeletonPage message="Đang tải điểm danh..." />;

  return (
    <div className="dash-container">
      <div className="dash-banner">
        <div className="dash-banner-content">
          <div className="dash-banner-badge">📅 Điểm Danh</div>
          <h1>Bảng Điểm Danh</h1>
          <p>
            {stats && stats.total > 0
              ? `Tổng cộng ${stats.total} buổi học. Tỷ lệ có mặt: ${stats.rate}%`
              : 'Chưa có dữ liệu điểm danh.'}
            {courseTitle ? ` ${courseTitle}` : ''}
          </p>
        </div>
        <div className="dash-banner-right">
          <div className="dash-date-pill">
            <div>📅 {stats?.total || 0} buổi học</div>
            <div className="sub">{classCode || 'Lớp học'}</div>
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
        <Link to={`/student/classes/${id}/grades`} className="dash-quick-btn" style={{ textDecoration: 'none' }}>
          📊 Bảng Điểm
        </Link>
      </div>

      {stats && stats.total > 0 && (
        <div className="dash-metrics-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Tổng buổi học</span>
              <span className="dash-metric-val">{stats.total}</span>
              <span className="dash-metric-trend">Tỷ lệ có mặt: {stats.rate}%</span>
            </div>
            <div className="dash-metric-icon icon-blue">📅</div>
          </div>
          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Có mặt</span>
              <span className="dash-metric-val" style={{ color: '#10b981' }}>
                {stats.attended ?? stats.present}
              </span>
              <span className="dash-metric-trend up">
                Tỷ lệ {stats.rate}%
                {stats.late > 0 ? ` (${stats.present} đúng giờ, ${stats.late} trễ)` : ''}
              </span>
            </div>
            <div className="dash-metric-icon icon-emerald">✅</div>
          </div>
          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Vắng mặt</span>
              <span className="dash-metric-val" style={{ color: '#8b5cf6' }}>
                {stats.absent}
              </span>
              <span className="dash-metric-trend">
                {stats.late > 0 ? `${stats.late} đi trễ` : 'Không đi trễ'}
              </span>
            </div>
            <div className="dash-metric-icon icon-purple">❌</div>
          </div>
          {stats.excused > 0 && (
            <div className="dash-metric-card">
              <div className="dash-metric-info">
                <span className="dash-metric-label">Có phép</span>
                <span className="dash-metric-val" style={{ color: '#3b82f6' }}>
                  {stats.excused}
                </span>
                <span className="dash-metric-trend">Được xin phép vắng</span>
              </div>
              <div className="dash-metric-icon icon-blue">📋</div>
            </div>
          )}
        </div>
      )}

      {records.length === 0 ? (
        <EmptyState
          icon="📭"
          title="Chưa có dữ liệu điểm danh"
          description="Dữ liệu điểm danh sẽ được cập nhật sau mỗi buổi học."
        />
      ) : (
        <div className="dash-card">
          <div className="dash-card-header">
            <h2 className="dash-card-title"><span>📋</span> Lịch Sử Điểm Danh</h2>
            <span className="badge-pill badge-blue">{records.length} buổi</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '480px' }}>
              <thead>
                <tr style={{ background: 'var(--dash-card-subtle)' }}>
                  <th style={th}>#</th>
                  <th style={th}>Ngày học</th>
                  <th style={th}>Thứ</th>
                  <th style={th}>Trạng thái</th>
                  <th style={th}>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {records.map((item, idx) => {
                  const status = statusCfg(item.status);
                  const date = new Date(item.sessionDate);
                  return (
                    <tr key={item._id} style={{ borderBottom: '1px solid var(--dash-card-subtle)' }}>
                      <td style={{ ...td, color: '#94a3b8' }}>{idx + 1}</td>
                      <td style={{ ...td, fontWeight: 600 }}>{formatDate(date)}</td>
                      <td style={td}>{DAY_NAMES[date.getDay()]}</td>
                      <td style={td}>
                        <span className={`badge-pill ${status.cls}`}>
                          {status.icon} {status.label}
                        </span>
                      </td>
                      <td style={{ ...td, fontSize: '0.85rem', color: '#64748b' }}>
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

const th: React.CSSProperties = {
  padding: '0.75rem 1rem',
  textAlign: 'left',
  fontSize: '0.8rem',
  color: '#64748b',
  fontWeight: 600,
};
const td: React.CSSProperties = {
  padding: '0.75rem 1rem',
  fontSize: '0.9rem',
};

export default AttendancePage;
