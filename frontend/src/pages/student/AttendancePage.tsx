import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { studentService } from '../../services/student.service';
import { useToast } from '../../contexts/ToastContext';
import type { Attendance, AttendanceStats, AttendanceStatus, Enrollment } from '../../types';
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

const DAY_NAMES = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

const AttendancePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const [classes, setClasses] = useState<Enrollment[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>(id || '');
  const [records, setRecords] = useState<Attendance[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load danh sách lớp nếu không có id truyền qua URL
  useEffect(() => {
    const initClasses = async () => {
      try {
        setIsLoading(true);
        if (id) {
          setSelectedClassId(id);
          await fetchAttendance(id);
        } else {
          const res = await studentService.getMyClasses();
          if (res.success && res.data?.classes) {
            setClasses(res.data.classes);
            if (res.data.classes.length > 0) {
              const firstClassId = (res.data.classes[0].class as any)?._id || '';
              setSelectedClassId(firstClassId);
              if (firstClassId) {
                await fetchAttendance(firstClassId);
              } else {
                setIsLoading(false);
              }
            } else {
              setIsLoading(false);
            }
          } else {
            setIsLoading(false);
          }
        }
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Không thể tải danh sách lớp học');
        setIsLoading(false);
      }
    };

    initClasses();
  }, [id]);

  const fetchAttendance = async (classId: string) => {
    if (!classId) return;
    try {
      setIsLoading(true);
      const res = await studentService.getAttendance(classId);
      if (res.success && res.data) {
        setRecords(res.data.attendance || []);
        setStats(res.data.stats || null);
      } else {
        toast.error(res.message || 'Không thể tải điểm danh');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể tải điểm danh');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    fetchAttendance(classId);
  };

  if (isLoading) return <SkeletonPage message="Đang tải dữ liệu điểm danh & chuyên cần..." />;

  const currentEnrollment = classes.find((c) => (c.class as any)?._id === selectedClassId);
  const currentClassData = currentEnrollment?.class as any;

  return (
    <div className="dash-container">
      <div className="dash-banner">
        <div className="dash-banner-content">
          <div className="dash-banner-badge">📅 Chuyên Cần & Điểm Danh</div>
          <h1>Bảng Chuyên Cần & Điểm Danh</h1>
          <p>
            {stats && stats.total > 0
              ? `Tổng cộng ${stats.total} buổi học. Tỷ lệ có mặt: ${stats.rate}%`
              : 'Theo dõi sự có mặt, vắng mặt và đi trễ của học viên trong từng khóa học.'}
          </p>
        </div>
        <div className="dash-banner-right">
          <div className="dash-date-pill">
            <div>{stats?.total || 0} buổi học</div>
            <div className="sub">
              {currentClassData?.classCode ? `Lớp ${currentClassData.classCode}` : 'Chuyên cần học viên'}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <Link to="/student/dashboard" className="dash-quick-btn" style={{ textDecoration: 'none' }}>
          ← Dashboard
        </Link>
        <Link to="/student/classes" className="dash-quick-btn" style={{ textDecoration: 'none' }}>
          📚 Khóa Học
        </Link>
        <Link to="/student/schedule" className="dash-quick-btn" style={{ textDecoration: 'none' }}>
          🗓️ Xem Lịch Học
        </Link>
        <Link to="/student/progress" className="dash-quick-btn" style={{ textDecoration: 'none' }}>
          🎯 Kết Quả Học Tập
        </Link>
      </div>

      {/* Class Selector Dropdown nếu học viên có nhiều hơn 1 lớp */}
      {classes.length > 1 && (
        <div className="dash-card" style={{ marginBottom: '1.25rem', padding: '0.85rem 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>
              🏫 Chọn lớp học cần xem chuyên cần:
            </span>
            <select
              value={selectedClassId}
              onChange={(e) => handleClassChange(e.target.value)}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '8px',
                border: '1.5px solid #cbd5e1',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: '#0f172a',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
              }}
            >
              {classes.map((item) => {
                const cls = item.class as any;
                return (
                  <option key={cls?._id} value={cls?._id}>
                    {cls?.classCode} — {cls?.course?.title || cls?.course?.code || 'Khóa học'}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      )}

      {stats && stats.total > 0 && (
        <div className="dash-metrics-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Tổng buổi học</span>
              <span className="dash-metric-val">{stats.total}</span>
              <span className="dash-metric-trend">Tỷ lệ có mặt: {stats.rate}%</span>
            </div>
            <div className="dash-metric-icon icon-blue"></div>
          </div>
          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Có mặt</span>
              <span className="dash-metric-val" style={{ color: '#10b981' }}>
                {stats.present}
              </span>
              <span className="dash-metric-trend up">Tỷ lệ {stats.rate}%</span>
            </div>
            <div className="dash-metric-icon icon-emerald"></div>
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
            <div className="dash-metric-icon icon-purple"></div>
          </div>
        </div>
      )}

      {records.length === 0 ? (
        <EmptyState
          icon="📅"
          title="Chưa có dữ liệu chuyên cần & điểm danh"
          description="Hiện tại chưa có dữ liệu điểm danh. Nếu bạn vừa đăng ký khóa học, nhân viên giáo vụ (Staff) đang xử lý xếp lớp cho bạn. Dữ liệu chuyên cần sẽ tự động hiển thị sau khi lớp học chính thức bắt đầu."
          action={
            <Link to="/student/classes" className="dash-quick-btn primary">
              📚 Xem khóa học của tôi
            </Link>
          }
        />
      ) : (
        <div className="dash-card">
          <div className="dash-card-header">
            <h2 className="dash-card-title">Lịch Sử Điểm Danh & Chuyên Cần</h2>
            <span className="badge-pill badge-blue">{records.length} buổi học</span>
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
