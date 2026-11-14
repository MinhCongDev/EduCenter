import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { studentService } from '../../services/student.service';
import { useToast } from '../../contexts/ToastContext';
import type { Grade, GradeEvaluationType, Enrollment } from '../../types';
import { EmptyState, SkeletonPage } from '../../components/Skeleton';
import { formatDate, bandColor, bandLabel } from '../../utils/format';

const typeCfg = (t: GradeEvaluationType) => {
  const map: Record<GradeEvaluationType, { label: string; color: string; icon: string }> = {
    ENTRY_TEST: { label: 'Kiểm tra đầu vào', color: '#0ea5e9', icon: '🎯' },
    MOCK_TEST: { label: 'Mock Test', color: '#3b82f6', icon: '🎧' },
    MID_TERM: { label: 'Giữa kỳ', color: '#ec4899', icon: '📋' },
    FINAL_TEST: { label: 'Cuối kỳ', color: '#dc2626', icon: '🎓' },
    MONTHLY_EVALUATION: { label: 'Nhận xét theo tháng', color: '#10b981', icon: '🗓️' },
    COURSE_EVALUATION: { label: 'Đánh giá cuối khóa', color: '#6366f1', icon: '🏅' },
    ASSIGNMENT: { label: 'Bài tập', color: '#06b6d4', icon: '📝' },
    SPEAKING_ASSESSMENT: { label: 'Speaking', color: '#8b5cf6', icon: '🎙️' },
    WRITING_ASSESSMENT: { label: 'Writing', color: '#f59e0b', icon: '✍️' },
  };
  return map[t] ?? { label: t, color: '#64748b', icon: '📊' };
};

const GradesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const [classes, setClasses] = useState<Enrollment[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>(id || '');
  const [grades, setGrades] = useState<Grade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load danh sách lớp nếu không có id truyền qua URL
  useEffect(() => {
    const initClasses = async () => {
      try {
        setIsLoading(true);
        if (id) {
          setSelectedClassId(id);
          await fetchGrades(id);
        } else {
          const res = await studentService.getMyClasses();
          if (res.success && res.data?.classes) {
            setClasses(res.data.classes);
            if (res.data.classes.length > 0) {
              const firstClassId = (res.data.classes[0].class as any)?._id || '';
              setSelectedClassId(firstClassId);
              if (firstClassId) {
                await fetchGrades(firstClassId);
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

  const fetchGrades = async (classId: string) => {
    if (!classId) return;
    try {
      setIsLoading(true);
      const res = await studentService.getGrades(classId);
      if (res.success && res.data) {
        setGrades(res.data.grades || []);
      } else {
        toast.error(res.message || 'Không thể tải bảng điểm');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể tải bảng điểm');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    fetchGrades(classId);
  };

  const withBand = grades.filter((g) => g.overallBand !== undefined && g.overallBand !== null);
  const avgBand =
    withBand.length > 0
      ? (withBand.reduce((sum, g) => sum + (g.overallBand || 0), 0) / withBand.length).toFixed(1)
      : null;
  const maxBand = withBand.length > 0 ? Math.max(...withBand.map((g) => g.overallBand!)).toFixed(1) : null;

  if (isLoading) return <SkeletonPage message="Đang tải dữ liệu điểm số..." />;

  const currentEnrollment = classes.find((c) => (c.class as any)?._id === selectedClassId);
  const currentClassData = currentEnrollment?.class as any;

  return (
    <div className="dash-container">
      <div className="dash-banner">
        <div className="dash-banner-content">
          <div className="dash-banner-badge">📊 Điểm Số & Khảo Thí</div>
          <h1>Bảng Điểm & Đánh Giá Năng Lực</h1>
          <p>
            {grades.length > 0
              ? `Tổng cộng ${grades.length} bài đánh giá. Band trung bình: ${avgBand || '—'}`
              : 'Theo dõi điểm số chi tiết từng kỹ năng IELTS (Listening, Reading, Writing, Speaking).'}
          </p>
        </div>
        <div className="dash-banner-right">
          <div className="dash-date-pill">
            {avgBand ? (
              <>
                <div>
                  🎯 Band hiện tại:{' '}
                  <strong style={{ color: bandColor(parseFloat(avgBand)) }}>{avgBand}</strong>
                </div>
                <div className="sub">{bandLabel(parseFloat(avgBand))}</div>
              </>
            ) : (
              <div>
                📊 {currentClassData?.classCode ? `Lớp ${currentClassData.classCode}` : 'Bảng điểm'}
              </div>
            )}
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
        <Link to="/student/attendance" className="dash-quick-btn" style={{ textDecoration: 'none' }}>
          📅 Chuyên Cần
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
              🏫 Chọn lớp học cần xem điểm số:
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

      {grades.length > 0 && (
        <div className="dash-metrics-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Band trung bình</span>
              <span
                className="dash-metric-val"
                style={{ color: bandColor(avgBand ? parseFloat(avgBand) : undefined) }}
              >
                {avgBand || '—'}
              </span>
              <span className="dash-metric-trend up">
                {avgBand ? `${withBand.length} bài có band` : 'Chưa có điểm Overall'}
              </span>
            </div>
            <div className="dash-metric-icon icon-emerald">🏆</div>
          </div>
          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Band cao nhất</span>
              <span
                className="dash-metric-val"
                style={{ color: bandColor(maxBand ? parseFloat(maxBand) : undefined) }}
              >
                {maxBand || '—'}
              </span>
              <span className="dash-metric-trend up">
                {maxBand ? bandLabel(parseFloat(maxBand)) : '—'}
              </span>
            </div>
            <div className="dash-metric-icon icon-amber">⭐</div>
          </div>
          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Tổng bài đánh giá</span>
              <span className="dash-metric-val">{grades.length} bài</span>
              <span className="dash-metric-trend">{withBand.length} đã chấm</span>
            </div>
            <div className="dash-metric-icon icon-blue">📋</div>
          </div>
        </div>
      )}

      {grades.length === 0 ? (
        <EmptyState
          icon="📊"
          title="Chưa có dữ liệu điểm số"
          description="Hiện tại chưa có dữ liệu điểm số. Nếu bạn vừa đăng ký khóa học, nhân viên giáo vụ (Staff) đang xử lý xếp lớp cho bạn. Bảng điểm sẽ hiển thị ngay khi lớp bắt đầu và giảng viên nhập điểm các bài kiểm tra."
          action={
            <Link to="/student/classes" className="dash-quick-btn primary">
              📚 Xem khóa học của tôi
            </Link>
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {grades.map((grade) => {
            const cfg = typeCfg(grade.evaluationType);
            return (
              <div key={grade._id} className="dash-card">
                <div className="dash-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>{cfg.icon}</span>
                    <h2 className="dash-card-title">{grade.title}</h2>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span className="badge-pill" style={{ background: `${cfg.color}18`, color: cfg.color }}>
                      {cfg.label}
                    </span>
                    {grade.overallBand !== undefined && grade.overallBand !== null ? (
                      <span
                        className="badge-pill"
                        style={{
                          background: `${bandColor(grade.overallBand)}22`,
                          color: bandColor(grade.overallBand),
                          fontWeight: 700,
                          fontSize: '0.85rem',
                        }}
                      >
                        Band {grade.overallBand}
                      </span>
                    ) : grade.score !== undefined ? (
                      <span className="badge-pill badge-blue">
                        {grade.score}/{grade.maxScore || 100}
                      </span>
                    ) : (
                      <span className="badge-pill badge-blue">
                        📝 Nhận xét
                      </span>
                    )}
                  </div>
                </div>

                <div className="dash-subcard">
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                      gap: '0.75rem 1.25rem',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <SkillBand label="🎧 Listening" band={grade.listening} />
                    <SkillBand label="📖 Reading"   band={grade.reading} />
                    <SkillBand label="✍️ Writing"   band={grade.writing} />
                    <SkillBand label="🎙️ Speaking"  band={grade.speaking} />
                    {grade.score !== undefined && (
                      <div className="dash-field">
                        <span className="dash-field-label">Điểm số</span>
                        <span className="dash-field-value" style={{ fontWeight: 700 }}>
                          {grade.score} / {grade.maxScore || 100}
                        </span>
                      </div>
                    )}
                    <div className="dash-field">
                      <span className="dash-field-label">Ngày đánh giá</span>
                      <span className="dash-field-value">{formatDate(grade.testDate)}</span>
                    </div>
                  </div>

                  {grade.feedback && (
                    <div
                      style={{
                        padding: '0.75rem 1rem',
                        background: 'var(--dash-card-subtle)',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        marginTop: '0.5rem',
                      }}
                    >
                      <strong style={{ color: '#475569' }}>Nhận xét của giảng viên:</strong>{' '}
                      <span>{grade.feedback}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const SkillBand: React.FC<{ label: string; band?: number | null }> = ({ label, band }) => (
  <div className="dash-field">
    <span className="dash-field-label">{label}</span>
    <span
      className="dash-field-value"
      style={{
        fontWeight: 700,
        color: band ? bandColor(band) : '#94a3b8',
      }}
    >
      {band !== undefined && band !== null ? `Band ${band}` : '—'}
    </span>
  </div>
);

export default GradesPage;
