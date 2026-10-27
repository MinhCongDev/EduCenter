import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { studentService } from '../../services/student.service';
import type { Enrollment, OpenClass, TuitionStatus } from '../../types';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { EmptyState, SkeletonPage } from '../../components/Skeleton';
import { formatDate, formatVND } from '../../utils/format';
import { classStatusMeta, enrollmentStatusMeta, tuitionStatusMeta } from '../../utils/labels';

const MyClassesPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [classes, setClasses] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tuitionFilter, setTuitionFilter] = useState<'ALL' | TuitionStatus>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ENROLLED' | 'COMPLETED'>('ALL');
  const [dropTarget, setDropTarget] = useState<Enrollment | null>(null);
  const [isDropping, setIsDropping] = useState(false);
  // Đăng ký lớp mới (M7)
  const [isOpenClassesOpen, setIsOpenClassesOpen] = useState(false);
  const [openClasses, setOpenClasses] = useState<OpenClass[]>([]);
  const [isLoadingOpen, setIsLoadingOpen] = useState(false);
  const [openSearch, setOpenSearch] = useState('');
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchOpenClasses = async (keyword?: string) => {
    try {
      setIsLoadingOpen(true);
      const res = await studentService.getOpenClasses(keyword);
      if (res.success && res.data) setOpenClasses(res.data.classes);
      else toast.error(res.message || 'Không thể tải danh sách lớp đang mở');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể tải danh sách lớp đang mở');
    } finally {
      setIsLoadingOpen(false);
    }
  };

  const handleEnroll = async (classId: string) => {
    try {
      setEnrollingId(classId);
      const res = await studentService.enrollIntoClass(classId);
      if (res.success) {
        toast.success(res.message || 'Đăng ký lớp học thành công');
        setIsOpenClassesOpen(false);
        await fetchClasses();
        await fetchOpenClasses(openSearch);
      } else {
        toast.error(res.message || 'Đăng ký lớp học thất bại');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Đăng ký lớp học thất bại');
    } finally {
      setEnrollingId(null);
    }
  };

  const fetchClasses = async () => {
    try {
      setIsLoading(true);
      const res = await studentService.getMyClasses();
      if (res.success && res.data) setClasses(res.data.classes);
      else toast.error(res.message || 'Không thể tải danh sách lớp học');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể tải danh sách lớp học');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = async () => {
    if (!dropTarget) return;
    try {
      setIsDropping(true);
      const res = await studentService.dropFromClass(dropTarget.enrollmentId);
      if (res.success) {
        toast.success(res.message || 'Đã rút khỏi lớp học thành công');
        setDropTarget(null);
        await fetchClasses();
      } else {
        toast.error(res.message || 'Rút khỏi lớp học thất bại');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Rút khỏi lớp học thất bại');
    } finally {
      setIsDropping(false);
    }
  };

  if (isLoading) return <SkeletonPage message="Đang tải danh sách lớp học..." />;

  const totalPaid = classes.filter((c) => c.tuitionStatus === 'PAID').length;
  // Lớp chưa thanh toán = PENDING. Lớp đã hoàn (REFUNDED) không tính vào
  // "chưa thanh toán" — trước đây nó bị đếm nhầm.
  const totalUnpaid = classes.filter((c) => c.tuitionStatus === 'PENDING').length;
  const totalRefunded = classes.filter((c) => c.tuitionStatus === 'REFUNDED').length;
  const inProgress = classes.filter((c) => (c.class as any).status === 'IN_PROGRESS').length;

  // ── M5: search & filter ──
  const filtered = classes.filter((item) => {
    const cls = item.class as any;
    if (tuitionFilter !== 'ALL' && item.tuitionStatus !== tuitionFilter) return false;
    if (statusFilter !== 'ALL' && item.enrollmentStatus !== statusFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const hay = [
        cls.classCode,
        cls.course?.code,
        cls.course?.title,
        cls.teacher?.fullName,
        cls.room,
        cls.scheduleDays?.join(' '),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="dash-container">
      <div className="dash-banner">
        <div className="dash-banner-content">
          <div className="dash-banner-badge">📚 Lớp Học Của Tôi</div>
          <h1>Danh Sách Lớp Học</h1>
          <p>
            {classes.length > 0
              ? `Bạn đang theo học ${classes.length} lớp. Nhấn vào lớp để xem chi tiết.`
              : 'Bạn chưa đăng ký lớp học nào.'}
          </p>
        </div>
        <div className="dash-banner-right">
          <div className="dash-date-pill">
            <div>📚 {classes.length} lớp đã đăng ký</div>
            <div className="sub">Học viên: {user?.fullName}</div>
          </div>
          <Button
            variant="primary"
            size="sm"
            icon={<span>➕</span>}
            onClick={() => {
              setIsOpenClassesOpen(true);
              fetchOpenClasses(openSearch);
            }}
            style={{ marginTop: '0.75rem' }}
          >
            Đăng ký lớp mới
          </Button>
        </div>
      </div>

      {classes.length > 0 && (
        <div className="dash-metrics-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Tổng số lớp</span>
              <span className="dash-metric-val">{classes.length} lớp</span>
              <span className="dash-metric-trend up">{totalPaid} đã thanh toán</span>
            </div>
            <div className="dash-metric-icon icon-blue">📚</div>
          </div>
          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Đã thanh toán</span>
              <span className="dash-metric-val">{totalPaid}</span>
              <span className="dash-metric-trend up">
                {totalUnpaid} chưa thanh toán
                {totalRefunded > 0 ? ` • ${totalRefunded} đã hoàn` : ''}
              </span>
            </div>
            <div className="dash-metric-icon icon-emerald">✅</div>
          </div>
          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Đang học</span>
              <span className="dash-metric-val">{inProgress}</span>
              <span className="dash-metric-trend">
                {classes.filter((c) => (c.class as any).status === 'OPEN').length} đang mở
              </span>
            </div>
            <div className="dash-metric-icon icon-purple">🎓</div>
          </div>
        </div>
      )}

      {classes.length === 0 ? (
        <EmptyState
          icon="📭"
          title="Chưa có lớp học nào"
          description="Bạn chưa đăng ký lớp học nào. Vui lòng liên hệ trung tâm để được tư vấn."
          action={
            <Link to="/courses" className="dash-quick-btn primary" style={{ textDecoration: 'none' }}>
              📖 Xem các khóa học
            </Link>
          }
        />
      ) : (
        <>
          {/* ── M5: Search & Filter bar ── */}
          <div
            className="dash-card"
            style={{ marginBottom: '1rem', padding: '0.75rem 1rem' }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(220px, 2fr) 1fr 1fr auto',
                gap: '0.75rem',
                alignItems: 'center',
              }}
            >
              <input
                type="text"
                placeholder="🔍 Tìm theo mã lớp, tên khóa học, giảng viên..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  fontSize: '0.9rem',
                }}
              />
              <select
                value={tuitionFilter}
                onChange={(e) => setTuitionFilter(e.target.value as any)}
                style={selectStyle}
              >
                <option value="ALL">💳 Tất cả học phí</option>
                <option value="PAID">✅ Đã thanh toán</option>
                <option value="PENDING">⏳ Chưa thanh toán</option>
                <option value="REFUNDED">↩️ Đã hoàn</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                style={selectStyle}
              >
                <option value="ALL">📊 Tất cả trạng thái</option>
                <option value="ENROLLED">🎓 Đang học</option>
                <option value="COMPLETED">🏆 Hoàn thành</option>
              </select>
              <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
                {filtered.length}/{classes.length} lớp
              </span>
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon="🔍"
              title="Không tìm thấy lớp phù hợp"
              description="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filtered.map((item) => {
            const tuition = tuitionStatusMeta(item.tuitionStatus);
            const enrollment = enrollmentStatusMeta(item.enrollmentStatus);
            const cls = item.class as any;
            const classStatus = classStatusMeta(cls.status);
            return (
              <div key={item._id} className="dash-card">
                <div className="dash-card-header">
                  <h2 className="dash-card-title">
                    <span>📘</span>
                    {cls.course?.code || 'Khóa học'} — {cls.course?.title || ''}
                  </h2>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span className={`badge-pill ${enrollment.cls}`}>{enrollment.label}</span>
                    <span className={`badge-pill ${tuition.cls}`}>{tuition.label}</span>
                    <span className={`badge-pill ${classStatus.cls}`}>{classStatus.label}</span>
                  </div>
                </div>

                <div className="dash-subcard">
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '0.75rem 1.5rem',
                    }}
                  >
                    <Field label="Mã lớp" value={cls.classCode} />
                    <Field label="Giảng viên" value={cls.teacher?.fullName || '—'} />
                    <Field label="Phòng học" value={cls.room} />
                    <Field label="Lịch học" value={cls.scheduleDays?.join(', ')} />
                    <Field label="Ca học" value={cls.timeSlot} />
                    <Field
                      label="Thời gian"
                      value={`${formatDate(cls.startDate)} — ${formatDate(cls.endDate)}`}
                    />
                    {cls.course?.tuitionFee !== undefined && (
                      <Field label="Học phí" value={formatVND(cls.course.tuitionFee)} />
                    )}
                    <Field label="Ngày đăng ký" value={formatDate(item.enrollmentDate)} />
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: '0.75rem',
                      marginTop: '1.25rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <Link
                      to={`/student/classes/${cls._id}`}
                      className="dash-quick-btn primary"
                      style={{ textDecoration: 'none' }}
                    >
                      ℹ️ Xem Chi Tiết
                    </Link>
                    <Link
                      to={`/student/classes/${cls._id}/assignments`}
                      className="dash-quick-btn"
                      style={{ textDecoration: 'none' }}
                    >
                      📝 Bài Tập
                    </Link>
                    <Link
                      to={`/student/classes/${cls._id}/attendance`}
                      className="dash-quick-btn"
                      style={{ textDecoration: 'none' }}
                    >
                      📅 Điểm Danh
                    </Link>
                    <Link
                      to={`/student/classes/${cls._id}/grades`}
                      className="dash-quick-btn"
                      style={{ textDecoration: 'none' }}
                    >
                      📊 Bảng Điểm
                    </Link>
                    <Link
                      to={`/student/classes/${cls._id}/schedule`}
                      className="dash-quick-btn"
                      style={{ textDecoration: 'none' }}
                    >
                      🗓️ Lịch Học
                    </Link>
                    {item.enrollmentStatus === 'ENROLLED' && cls.status === 'OPEN' && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setDropTarget(item)}
                        icon={<span>🚪</span>}
                      >
                        Rút khỏi lớp
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
            </div>
          )}
        </>
      )}

      <Modal
        isOpen={!!dropTarget}
        onClose={() => (isDropping ? undefined : setDropTarget(null))}
        title="Xác nhận rút khỏi lớp học"
        icon="🚪"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDropTarget(null)} disabled={isDropping}>
              Hủy
            </Button>
            <Button variant="danger" onClick={handleDrop} loading={isDropping}>
              Xác nhận rút
            </Button>
          </>
        }
      >
        <p style={{ marginTop: 0, lineHeight: 1.6 }}>
          Bạn có chắc muốn rút khỏi lớp{' '}
          <strong>
            {(dropTarget?.class as any)?.course?.title ?? 'lớp học'}
            {(dropTarget?.class as any)?.classCode
              ? ` (${(dropTarget?.class as any).classCode})`
              : ''}
          </strong>{' '}
          không?
        </p>
        <ul style={{ lineHeight: 1.8, color: '#475569' }}>
          <li>Đăng ký của bạn sẽ chuyển sang trạng thái <strong>Đã rút</strong>.</li>
          <li>Chỗ học sẽ được giải phóng cho học viên khác.</li>
          <li>Học phí đã thanh toán sẽ được đánh dấu <strong>Đã hoàn</strong> (không tự động hoàn tiền).</li>
        </ul>
      </Modal>

      {/* ── M7: Đăng ký lớp đang mở ── */}
      <Modal
        isOpen={isOpenClassesOpen}
        onClose={() => setIsOpenClassesOpen(false)}
        title="Đăng ký lớp học mới"
        icon="➕"
        size="lg"
        footer={
          <Button variant="secondary" onClick={() => setIsOpenClassesOpen(false)}>
            Đóng
          </Button>
        }
      >
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="🔍 Tìm theo mã lớp, tên lớp, phòng học..."
            value={openSearch}
            onChange={(e) => setOpenSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') fetchOpenClasses(openSearch);
            }}
            style={{
              width: '100%',
              padding: '0.6rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              fontSize: '0.9rem',
            }}
          />
          <div style={{ marginTop: '0.5rem' }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fetchOpenClasses(openSearch)}
              loading={isLoadingOpen}
            >
              🔍 Tìm kiếm
            </Button>
          </div>
        </div>

        {isLoadingOpen ? (
          <p style={{ color: '#64748b' }}>Đang tải danh sách lớp đang mở...</p>
        ) : openClasses.length === 0 ? (
          <EmptyState
            icon="📭"
            title="Không có lớp đang mở"
            description="Hiện chưa có lớp nào đang nhận đăng ký. Vui lòng quay lại sau hoặc liên hệ phòng giáo vụ."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {openClasses.map((c) => {
              const already = c.myEnrollmentStatus;
              const full = c.seatsLeft <= 0;
              return (
                <div
                  key={c._id}
                  className="dash-subcard"
                  style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>
                        {c.course?.code || 'Khóa học'} — {c.course?.title || ''}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                        Mã lớp: {c.classCode} • GV: {c.teacher?.fullName || '—'} • Phòng: {c.room}
                      </div>
                    </div>
                    <span
                      className={`badge-pill ${full ? 'badge-red' : 'badge-green'}`}
                    >
                      {full ? '🔒 Đã đầy' : `🪑 Còn ${c.seatsLeft} chỗ`}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                      gap: '0.5rem 1.25rem',
                      fontSize: '0.85rem',
                      color: '#475569',
                    }}
                  >
                    <div>Lịch học: {c.scheduleDays?.join(', ') || '—'}</div>
                    <div>Ca học: {c.timeSlot || '—'}</div>
                    <div>
                      Thời gian: {formatDate(c.startDate)} — {formatDate(c.endDate)}
                    </div>
                    <div>
                      Sĩ số: {c.currentStudents}/{c.capacity}
                    </div>
                    {c.course?.tuitionFee !== undefined && (
                      <div>Học phí: {formatVND(c.course.tuitionFee)}</div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    {already === 'ENROLLED' || already === 'COMPLETED' ? (
                      <span className="badge-pill badge-green">✅ Bạn đã đăng ký lớp này</span>
                    ) : already === 'PENDING' ? (
                      <span className="badge-pill badge-amber">⏳ Đang chờ phòng giáo vụ duyệt</span>
                    ) : already === 'DROPPED' ? (
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={full}
                        loading={enrollingId === c._id}
                        onClick={() => handleEnroll(c._id)}
                      >
                        ↻ Đăng ký lại
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={full}
                        loading={enrollingId === c._id}
                        onClick={() => handleEnroll(c._id)}
                      >
                        {full ? 'Lớp đã đầy' : '✍️ Đăng ký ngay'}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Modal>
    </div>
  );
};

const selectStyle: React.CSSProperties = {
  padding: '0.5rem 0.75rem',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
  fontSize: '0.9rem',
  background: 'white',
};

const Field: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div>
    <div className="dash-subcard-label">{label}</div>
    <div className="dash-subcard-value">{value || '—'}</div>
  </div>
);

export default MyClassesPage;
