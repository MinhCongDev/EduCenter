import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { studentService } from '../../services/student.service';
import { courseService } from '../../services/course.service';
import type { Course, Enrollment, TuitionStatus } from '../../types';
import { EmptyState, SkeletonPage } from '../../components/Skeleton';
import { CourseDetailModal } from '../../components/CourseDetailModal';
import { formatDate, formatVND } from '../../utils/format';

const tuitionLabel = (s: TuitionStatus) => {
  if (s === 'PAID') return { label: 'Đã thanh toán', cls: 'badge-green' };
  return { label: 'Chưa thanh toán', cls: 'badge-amber' };
};

const enrollmentLabel = (s: string) => {
  if (s === 'PENDING') return { label: '⏳ Đang chờ staff xếp lớp', cls: 'badge-amber' };
  if (s === 'ENROLLED') return { label: '🎓 Đang học', cls: 'badge-green' };
  if (s === 'COMPLETED') return { label: '🏆 Hoàn thành', cls: 'badge-blue' };
  return { label: s, cls: 'badge-purple' };
};

const MyClassesPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [classes, setClasses] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'ENROLLED' | 'COMPLETED'>('ALL');
  const [selectedCourseDetail, setSelectedCourseDetail] = useState<Course | null>(null);

  const handleOpenCourseDetail = async (courseData: any) => {
    if (!courseData) return;
    const targetIdOrCode = courseData._id || courseData.code || courseData.id;

    const fallbackCourse: Course = {
      _id: courseData._id || (typeof targetIdOrCode === 'string' ? targetIdOrCode : 'course_detail'),
      code: courseData.code || 'IELTS',
      title: courseData.title || 'Khóa học IELTS',
      description:
        courseData.description ||
        'Khóa học được thiết kế sát với năng lực học viên, nâng cao toàn diện 4 kỹ năng chuẩn khảo thí quốc tế.',
      category: courseData.category || 'Nền tảng IELTS',
      entryLevel: courseData.entryLevel || 'Nền tảng',
      targetLevel: courseData.targetLevel || 'IELTS 6.5+',
      sessions: courseData.sessions || 30,
      tuitionFee: courseData.tuitionFee || 0,
      format: courseData.format || 'OFFLINE',
      status: 'ACTIVE',
      learningObjectives: Array.isArray(courseData.learningObjectives) && courseData.learningObjectives.length > 0
        ? courseData.learningObjectives
        : [
          'Hiểu rõ tiêu chí chấm điểm và format bài thi chuẩn quốc tế',
          'Rèn luyện kỹ năng Skimming & Scanning trong bài đọc',
          'Luyện phản xạ từ khóa và phương pháp tư duy học thuật',
          'Cam kết chuẩn đầu ra văn bằng chứng chỉ trung tâm',
        ],
      syllabus: Array.isArray(courseData.syllabus) && courseData.syllabus.length > 0
        ? courseData.syllabus
        : [
          'Tuần 1-3: Xây dựng nền tảng ngữ âm, từ vựng và ngữ pháp trọng tâm',
          'Tuần 4-6: Rèn luyện chiến thuật giải đề thi 4 kỹ năng chi tiết',
          'Tuần 7-9: Luyện đề thực chiến với áp lực thời gian',
          'Tuần 10: Mock test kiểm tra đầu ra và đánh giá xếp hạng',
        ],
      classes: Array.isArray(courseData.classes) ? courseData.classes : [],
      createdAt: '',
      updatedAt: '',
    };

    if (targetIdOrCode) {
      try {
        const res = await courseService.getCourseById(targetIdOrCode);
        if (res.success && res.data) {
          setSelectedCourseDetail(res.data);
          return;
        }
      } catch {
        // Fallback
      }
    }

    setSelectedCourseDetail(fallbackCourse);
  };

  useEffect(() => {
    fetchClasses();
  }, []);

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

  if (isLoading) return <SkeletonPage message="Đang tải danh sách lớp học..." />;

  const paidOnlyClasses = classes.filter((c) => c.tuitionStatus === 'PAID');
  const inProgress = paidOnlyClasses.filter((c) => (c.class as any)?.status === 'IN_PROGRESS').length;

  // ── M5: search & filter (chỉ hiển thị những khóa học đã thanh toán thành công) ──
  const filtered = paidOnlyClasses.filter((item) => {
    const cls = (item.class as any) || {};
    const course = cls.course || item.course || {};
    if (statusFilter !== 'ALL' && item.enrollmentStatus !== statusFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const hay = [
        cls.classCode,
        course.code,
        course.title,
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
          <div className="dash-banner-badge">📚 Khóa Học Của Tôi</div>
          <h1>Khóa Học Đã Đăng Ký &amp; Đã Thanh Toán</h1>
          <p>
            {paidOnlyClasses.length > 0
              ? `Bạn có ${paidOnlyClasses.length} khóa học đã thanh toán thành công.`
              : 'Bạn chưa có khóa học nào đã thanh toán.'}
          </p>
        </div>
        <div className="dash-banner-right">
          <div className="dash-date-pill">
            <div>✅ {paidOnlyClasses.length} khóa đã thanh toán</div>
            <div className="sub">Học viên: {user?.fullName}</div>
          </div>
        </div>
      </div>

      {paidOnlyClasses.length > 0 && (
        <div className="dash-metrics-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Khóa học đã đăng ký</span>
              <span className="dash-metric-val">{paidOnlyClasses.length} khóa</span>
              <span className="dash-metric-trend up">✅ 100% đã thanh toán</span>
            </div>
            <div className="dash-metric-icon icon-blue">📚</div>
          </div>
          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Trạng thái học phí</span>
              <span className="dash-metric-val">Đã Hoàn Tất</span>
              <span className="dash-metric-trend up">
                {paidOnlyClasses.length} khóa học hợp lệ
              </span>
            </div>
            <div className="dash-metric-icon icon-emerald">✅</div>
          </div>
          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Đang học tại lớp</span>
              <span className="dash-metric-val">{inProgress}</span>
              <span className="dash-metric-trend">
                {paidOnlyClasses.filter((c) => (c.class as any)?.status === 'OPEN').length} lớp đang mở
              </span>
            </div>
            <div className="dash-metric-icon icon-purple">🎓</div>
          </div>
        </div>
      )}

      {paidOnlyClasses.length === 0 ? (
        <EmptyState
          icon="📭"
          title="Chưa có khóa học nào đã thanh toán"
          description="Bạn chưa có khóa học nào đã thanh toán học phí thành công. Hãy khám phá danh sách các khóa học để đăng ký ngay."
          action={
            <Link to="/courses" className="dash-quick-btn primary" style={{ textDecoration: 'none' }}>
              📖 Xem các khóa học &amp; Đăng ký
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
                gridTemplateColumns: 'minmax(220px, 2fr) 1fr auto',
                gap: '0.75rem',
                alignItems: 'center',
              }}
            >
              <input
                type="text"
                placeholder=" Tìm theo mã lớp, tên khóa học, giảng viên..."
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
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                style={selectStyle}
              >
                <option value="ALL">📊 Tất cả trạng thái</option>
                <option value="PENDING">⏳ Chờ xếp lớp</option>
                <option value="ENROLLED">🎓 Đang học</option>
                <option value="COMPLETED">🏆 Hoàn thành</option>
              </select>
              <span style={{ color: '#047857', fontWeight: 600, fontSize: '0.85rem' }}>
                ✅ {filtered.length}/{paidOnlyClasses.length} khóa đã thanh toán
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
                const tuition = tuitionLabel(item.tuitionStatus);
                const enrollment = enrollmentLabel(item.enrollmentStatus);
                const cls = item.class as any;
                const isPending = item.isPendingClass || item.enrollmentStatus === 'PENDING' || !cls?._id;
                const courseData = cls?.course || item.course;

                if (isPending) {
                  return (
                    <div key={item._id} className="dash-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                      <div className="dash-card-header">
                        <h2 className="dash-card-title">
                          <span>📘</span>
                          {courseData?.code || 'Khóa học'} — {courseData?.title || 'Khóa học đã đăng ký'}
                        </h2>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <span className="badge-pill badge-amber">⏳ Đang chờ staff xếp lớp</span>
                          <span className={`badge-pill ${tuition.cls}`}>{tuition.label}</span>
                        </div>
                      </div>

                      <div className="dash-subcard">
                        <div
                          style={{
                            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                            border: '1px solid #fde68a',
                            padding: '0.9rem 1.15rem',
                            borderRadius: '10px',
                            marginBottom: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                          }}
                        >
                          <span style={{ fontSize: '1.4rem' }}>⏳</span>
                          <div>
                            <strong style={{ color: '#92400e', fontSize: '0.9rem', display: 'block' }}>
                              Khóa học đã được đăng ký thành công – Đang chờ phòng giáo vụ xếp lớp
                            </strong>
                            <span style={{ color: '#b45309', fontSize: '0.82rem', marginTop: '2px', display: 'block' }}>
                              Hệ thống đã ghi nhận đăng ký và học phí của bạn. Nhân viên giáo vụ (Staff) sẽ xếp bạn vào lớp học phù hợp trong thời gian sớm nhất. Lịch học và giảng viên sẽ tự động cập nhật ngay sau khi xếp lớp.
                            </span>
                          </div>
                        </div>

                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                            gap: '0.75rem 1.5rem',
                          }}
                        >
                          <Field label="Khóa học" value={courseData?.title || '—'} />
                          <Field label="Mã khóa" value={courseData?.code || '—'} />
                          <Field
                            label="Trạng thái lớp"
                            value={<span style={{ color: '#d97706', fontWeight: 700 }}>Đang chờ staff xếp lớp</span>}
                          />
                          <Field label="Lịch học & Phòng" value="Sẽ cập nhật sau khi xếp lớp" />
                          <Field label="Giảng viên" value="Đang chỉ định" />
                          {courseData?.tuitionFee !== undefined && (
                            <Field label="Học phí" value={formatVND(courseData.tuitionFee)} />
                          )}
                          <Field label="Ngày đăng ký" value={formatDate(item.registrationDate || item.enrollmentDate)} />
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            gap: '0.75rem',
                            marginTop: '1.25rem',
                            flexWrap: 'wrap',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => handleOpenCourseDetail(courseData)}
                            className="dash-quick-btn"
                            style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            📖 Xem Thông Tin Khóa Học
                          </button>
                          <Link
                            to="/student/payments"
                            className="dash-quick-btn primary"
                            style={{ textDecoration: 'none' }}
                          >
                            💳 Xem Hóa Đơn &amp; Lịch Sử Thanh Toán
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                }

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
                        <button
                          type="button"
                          onClick={() => handleOpenCourseDetail(cls.course || item.course)}
                          className="dash-quick-btn"
                          style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                          📖 Thông Tin Khóa Học
                        </button>
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
                          to={`/student/progress?classId=${cls._id}&tab=grades`}
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
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Modal xem thông tin chi tiết khóa học đã đăng ký */}
      <CourseDetailModal
        course={selectedCourseDetail}
        isOpen={Boolean(selectedCourseDetail)}
        onClose={() => setSelectedCourseDetail(null)}
        alreadyEnrolled={true}
      />
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
