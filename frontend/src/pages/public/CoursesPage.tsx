import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { publicService } from '../../services/public.service';
import { studentService } from '../../services/student.service';
import { Button } from '../../components/Button';
import { SkeletonPage } from '../../components/Skeleton';
import { EmptyState } from '../../components/Skeleton';
import type { Class } from '../../types';
import { formatDate, formatVND } from '../../utils/format';

const CoursesPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('ALL');
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const res = await publicService.getOpenClasses();
        if (res.success && res.data) setClasses(res.data.classes);
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Không thể tải danh sách lớp');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    classes.forEach((c) => {
      const cat = (c.course as any)?.category;
      if (cat) set.add(cat);
    });
    return ['ALL', ...Array.from(set)];
  }, [classes]);

  const filtered = useMemo(() => {
    return classes.filter((c) => {
      if (category !== 'ALL' && (c.course as any)?.category !== category) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const hay = [
          c.classCode,
          (c.course as any)?.code,
          (c.course as any)?.title,
          (c.teacher as any)?.fullName,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [classes, search, category]);

  const handleEnroll = async (classId: string) => {
    if (!isAuthenticated) {
      toast.warning('Vui lòng đăng nhập để ghi danh');
      navigate('/login');
      return;
    }
    if (user?.role !== 'STUDENT') {
      toast.error('Chỉ học viên mới có thể ghi danh');
      return;
    }
    if (!window.confirm('Bạn có chắc muốn ghi danh vào lớp này?')) return;
    try {
      setEnrollingId(classId);
      const res = await studentService.enrollIntoClass(classId);
      if (res.success) {
        toast.success(res.message || 'Ghi danh thành công!');
        // Refresh list (capacity may change)
        const list = await publicService.getOpenClasses();
        if (list.success && list.data) setClasses(list.data.classes);
        // Navigate to dashboard after success
        setTimeout(() => navigate('/student/dashboard'), 800);
      } else {
        toast.error(res.message || 'Ghi danh thất bại');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Ghi danh thất bại');
    } finally {
      setEnrollingId(null);
    }
  };

  if (isLoading) return <SkeletonPage message="Đang tải danh sách lớp..." />;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>📚 Danh Sách Lớp Học</h1>
        <p>Khám phá các lớp học đang mở tại EduCenter</p>
      </div>

      {!isAuthenticated && (
        <div
          style={{
            background: 'rgba(59,130,246,0.08)',
            border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: 8,
            padding: '0.75rem 1rem',
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
            color: '#1e40af',
          }}
        >
          💡 Bạn cần <Link to="/login" style={{ fontWeight: 700 }}>đăng nhập</Link> với tài khoản
          học viên để ghi danh vào lớp.
        </div>
      )}

      {classes.length === 0 ? (
        <EmptyState
          icon="📭"
          title="Chưa có lớp mở"
          description="Hiện chưa có lớp học nào đang mở đăng ký. Vui lòng quay lại sau."
        />
      ) : (
        <>
          {/* Search + filter */}
          <div
            className="dash-card"
            style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem' }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(220px, 2fr) minmax(180px, 1fr) auto',
                gap: '0.75rem',
                alignItems: 'center',
              }}
            >
              <input
                type="text"
                placeholder="🔍 Tìm theo mã lớp, tên khóa, giảng viên..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                  fontSize: '0.9rem',
                }}
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                  fontSize: '0.9rem',
                  background: 'white',
                }}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === 'ALL' ? 'Tất cả danh mục' : c}
                  </option>
                ))}
              </select>
              <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
                {filtered.length}/{classes.length} lớp
              </span>
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon="🔍"
              title="Không có lớp phù hợp"
              description="Thử thay đổi từ khóa hoặc bộ lọc."
            />
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '1.25rem',
              }}
            >
              {filtered.map((c) => {
                const cAny = c as any;
                const seatsLeft =
                  typeof cAny.capacity === 'number' && typeof cAny.currentStudents === 'number'
                    ? cAny.capacity - cAny.currentStudents
                    : null;
                const isFull = seatsLeft !== null && seatsLeft <= 0;
                return (
                  <div key={c._id} className="dash-card">
                    <div className="dash-card-header">
                      <h3 className="dash-card-title" style={{ fontSize: '1rem' }}>
                        <span>📘</span>
                        {cAny.course?.code || 'Khóa học'}
                      </h3>
                      <span
                        className={`badge-pill ${
                          c.status === 'OPEN' ? 'badge-green' : 'badge-blue'
                        }`}
                      >
                        {c.status === 'OPEN' ? '🟢 Đang mở' : '🔵 Đang học'}
                      </span>
                    </div>
                    <div className="dash-subcard">
                      <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>
                        {cAny.course?.title}
                      </h4>
                      <p
                        style={{
                          margin: '0 0 0.75rem 0',
                          fontSize: '0.85rem',
                          color: '#64748b',
                          minHeight: 36,
                        }}
                      >
                        {cAny.course?.description?.slice(0, 100) || '—'}
                      </p>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '0.5rem 0.75rem',
                          fontSize: '0.8rem',
                          color: '#475569',
                        }}
                      >
                        <div>
                          <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Mã lớp</div>
                          <strong>{c.classCode}</strong>
                        </div>
                        <div>
                          <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Giảng viên</div>
                          <strong>{cAny.teacher?.fullName || '—'}</strong>
                        </div>
                        <div>
                          <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Phòng</div>
                          <strong>{c.room}</strong>
                        </div>
                        <div>
                          <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Lịch học</div>
                          <strong style={{ fontSize: '0.78rem' }}>
                            {c.scheduleDays?.join(', ')}
                          </strong>
                        </div>
                        <div>
                          <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Bắt đầu</div>
                          <strong>{formatDate(c.startDate)}</strong>
                        </div>
                        <div>
                          <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Học phí</div>
                          <strong style={{ color: '#3b82f6' }}>
                            {formatVND(cAny.course?.tuitionFee || 0)}
                          </strong>
                        </div>
                      </div>
                      {seatsLeft !== null && (
                        <div
                          style={{
                            marginTop: '0.75rem',
                            fontSize: '0.8rem',
                            color: isFull ? '#ef4444' : seatsLeft < 5 ? '#f59e0b' : '#10b981',
                            fontWeight: 600,
                          }}
                        >
                          {isFull
                            ? '❌ Lớp đã đầy'
                            : `🪑 Còn ${seatsLeft}/${cAny.capacity} chỗ`}
                        </div>
                      )}
                      <div style={{ marginTop: '1rem' }}>
                        {isAuthenticated && user?.role === 'STUDENT' ? (
                          <Button
                            variant="primary"
                            onClick={() => handleEnroll(c._id)}
                            loading={enrollingId === c._id}
                            disabled={isFull}
                            icon={isFull ? '🔒' : '✍️'}
                          >
                            {isFull ? 'Đã đầy' : 'Ghi danh'}
                          </Button>
                        ) : (
                          <Link
                            to="/login"
                            className="dash-quick-btn primary"
                            style={{ textDecoration: 'none', display: 'inline-block' }}
                          >
                            🔐 Đăng nhập để ghi danh
                          </Link>
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
    </div>
  );
};

export default CoursesPage;
