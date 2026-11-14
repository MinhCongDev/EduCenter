import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { progressService, type StudentProgressSummary } from '../../services/progress.service';
import { studentService, type AcademicResultsData, type PlacementTestResult } from '../../services/student.service';
import { useToast } from '../../contexts/ToastContext';
import { EmptyState, SkeletonPage } from '../../components/Skeleton';
import { formatDate, bandColor, bandLabel } from '../../utils/format';
import type { Grade } from '../../types';

// =====================================================
// Helper formatters & badges
// =====================================================

const typeCfg = (t: string) => {
  const map: Record<string, { label: string; color: string; icon: string }> = {
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

const ratingCfg = (r?: string) => {
  switch (r) {
    case 'EXCELLENT':
      return { label: 'Xuất sắc', color: '#15803d', bg: '#dcfce7' };
    case 'GOOD':
      return { label: 'Tốt / Giỏi', color: '#1d4ed8', bg: '#dbeafe' };
    case 'AVERAGE':
      return { label: 'Khá / Đạt', color: '#b45309', bg: '#fef3c7' };
    case 'BELOW_AVERAGE':
      return { label: 'Cần cố gắng', color: '#b91c1c', bg: '#fee2e2' };
    default:
      return null;
  }
};

const milestoneTypeBadge = (type?: string) => {
  switch (type) {
    case 'LESSON_COMPLETION':
      return { label: 'Bài học', bg: '#eff6ff', color: '#1d4ed8', icon: '📖' };
    case 'MOCK_TEST':
      return { label: 'Thi thử / Khảo thí', bg: '#fef2f2', color: '#b91c1c', icon: '🏆' };
    case 'SKILL_CHECK':
      return { label: 'Kiểm tra kỹ năng', bg: '#fdf4ff', color: '#86198f', icon: '🎯' };
    case 'ASSIGNMENT':
      return { label: 'Bài tập / Writing', bg: '#f0fdf4', color: '#15803d', icon: '✍️' };
    case 'CHECKPOINT':
    default:
      return { label: 'Chuẩn đầu ra', bg: '#fffbeb', color: '#b45309', icon: '🎓' };
  }
};

const SkillBand: React.FC<{ label: string; band?: number | null }> = ({ label, band }) => (
  <div className="dash-field" style={{ minWidth: '100px' }}>
    <span className="dash-field-label" style={{ fontSize: '0.78rem', color: '#64748b' }}>{label}</span>
    <span
      className="dash-field-value"
      style={{
        fontWeight: 700,
        fontSize: '1rem',
        color: band ? bandColor(band) : '#94a3b8',
      }}
    >
      {band !== undefined && band !== null ? `Band ${band}` : '—'}
    </span>
  </div>
);

// =====================================================
// Main Component
// =====================================================

type TabType = 'grades' | 'placement' | 'milestones';

const ProgressPage: React.FC = () => {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab from query param or default 'grades'
  const initialTab = (searchParams.get('tab') as TabType) || 'grades';
  const initialClassId = searchParams.get('classId') || '';

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [selectedClassId, setSelectedClassId] = useState<string>(initialClassId);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Data states
  const [academicData, setAcademicData] = useState<AcademicResultsData | null>(null);
  const [classesProgress, setClassesProgress] = useState<StudentProgressSummary[]>([]);
  const [selectedClassIndex, setSelectedClassIndex] = useState<number>(0);

  useEffect(() => {
    loadAllData();
  }, []);

  // Sync tab with URL
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', tab);
    if (selectedClassId) {
      newParams.set('classId', selectedClassId);
    }
    setSearchParams(newParams);
  };

  const handleClassFilterChange = (classId: string) => {
    setSelectedClassId(classId);
    const newParams = new URLSearchParams(searchParams);
    if (classId) {
      newParams.set('classId', classId);
    } else {
      newParams.delete('classId');
    }
    setSearchParams(newParams);
    fetchGradesByClass(classId);
  };

  const loadAllData = async () => {
    try {
      setIsLoading(true);
      const [academicRes, progressRes] = await Promise.allSettled([
        studentService.getAcademicResults(initialClassId || undefined),
        progressService.getMyProgress(),
      ]);

      if (academicRes.status === 'fulfilled' && academicRes.value?.success && academicRes.value.data) {
        setAcademicData(academicRes.value.data);
      }

      if (progressRes.status === 'fulfilled' && progressRes.value?.success && progressRes.value.data) {
        setClassesProgress(progressRes.value.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi tải kết quả học tập');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGradesByClass = async (classId: string) => {
    try {
      const res = await studentService.getAcademicResults(classId || undefined);
      if (res.success && res.data) {
        setAcademicData(res.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể tải điểm cho lớp này');
    }
  };

  if (isLoading) {
    return <SkeletonPage message="Đang tải dữ liệu kết quả học tập và điểm số..." />;
  }

  const placementTest: PlacementTestResult | null = academicData?.placementTest || null;
  const grades: Grade[] = academicData?.grades || [];
  const classesList = academicData?.classes || [];
  const stats = academicData?.stats;

  const withBand = grades.filter((g) => g.overallBand !== undefined && g.overallBand !== null);
  const avgBand = stats?.avgBand !== null && stats?.avgBand !== undefined ? stats.avgBand.toFixed(1) : null;
  const maxBand = stats?.maxBand !== null && stats?.maxBand !== undefined ? stats.maxBand.toFixed(1) : null;

  const currentClassProgress = classesProgress[selectedClassIndex] || classesProgress[0];

  return (
    <div className="dash-container">
      {/* Top Banner */}
      <div className="dash-banner" style={{ background: 'linear-gradient(135deg, #07403F 0%, #0d5c5a 100%)' }}>
        <div className="dash-banner-content">
          <div className="dash-banner-badge" style={{ backgroundColor: 'rgba(255,255,255,0.18)', color: '#a7f3d0' }}>
            🎯 Kết Quả Học Tập & Điểm Số
          </div>
          <h1>Bảng Điểm & Kết Quả Học Tập</h1>
          <p>
            Tổng hợp kết quả bài test đầu vào, bảng điểm chi tiết 4 kỹ năng từ giảng viên và tiến độ hoàn thành các khóa học.
          </p>
        </div>
        <div className="dash-banner-right">
          <div className="dash-date-pill" style={{ backgroundColor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}>
            {placementTest?.score ? (
              <div>
                <div style={{ fontSize: '0.78rem', color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Điểm Test Đầu Vào
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                  Band {placementTest.score}{' '}
                  <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#cbd5e1' }}>
                    ({placementTest.matchedLevel})
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>Trạng thái khảo thí</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
                  {grades.length > 0 ? `${grades.length} bài đã chấm` : 'Đang theo học'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Navigation Links */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <Link to="/student/dashboard" className="dash-quick-btn" style={{ textDecoration: 'none' }}>
          ← Dashboard
        </Link>
        <Link to="/student/classes" className="dash-quick-btn" style={{ textDecoration: 'none' }}>
          📚 Khóa Học Của Tôi
        </Link>
        <Link to="/student/schedule" className="dash-quick-btn" style={{ textDecoration: 'none' }}>
          🗓️ Xem Lịch Học
        </Link>
        <Link to="/student/attendance" className="dash-quick-btn" style={{ textDecoration: 'none' }}>
          📅 Chuyên Cần
        </Link>
      </div>

      {/* Main Tab Navigation Buttons */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          padding: '6px',
          backgroundColor: '#f1f5f9',
          borderRadius: '12px',
          marginBottom: '24px',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={() => handleTabChange('grades')}
          style={{
            flex: '1 1 200px',
            padding: '12px 18px',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.92rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            backgroundColor: activeTab === 'grades' ? '#07403F' : 'transparent',
            color: activeTab === 'grades' ? '#ffffff' : '#475569',
            boxShadow: activeTab === 'grades' ? '0 2px 6px rgba(7,64,63,0.25)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <span>📊</span>
          <span>Bảng Điểm & Đánh Giá Giảng Viên</span>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '0.75rem',
              backgroundColor: activeTab === 'grades' ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
              color: activeTab === 'grades' ? '#ffffff' : '#334155',
            }}
          >
            {grades.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('placement')}
          style={{
            flex: '1 1 200px',
            padding: '12px 18px',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.92rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            backgroundColor: activeTab === 'placement' ? '#07403F' : 'transparent',
            color: activeTab === 'placement' ? '#ffffff' : '#475569',
            boxShadow: activeTab === 'placement' ? '0 2px 6px rgba(7,64,63,0.25)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <span>🎯</span>
          <span>Kết Quả Test Đầu Vào</span>
          {placementTest ? (
            <span
              style={{
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '0.75rem',
                backgroundColor: activeTab === 'placement' ? '#10b981' : '#dcfce7',
                color: activeTab === 'placement' ? '#ffffff' : '#15803d',
              }}
            >
              Band {placementTest.score}
            </span>
          ) : (
            <span
              style={{
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '0.75rem',
                backgroundColor: activeTab === 'placement' ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
                color: activeTab === 'placement' ? '#ffffff' : '#64748b',
              }}
            >
              Chưa thi
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('milestones')}
          style={{
            flex: '1 1 200px',
            padding: '12px 18px',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.92rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            backgroundColor: activeTab === 'milestones' ? '#07403F' : 'transparent',
            color: activeTab === 'milestones' ? '#ffffff' : '#475569',
            boxShadow: activeTab === 'milestones' ? '0 2px 6px rgba(7,64,63,0.25)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <span>🚀</span>
          <span>Tiến Độ Khóa Học & Cột Mốc</span>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '0.75rem',
              backgroundColor: activeTab === 'milestones' ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
              color: activeTab === 'milestones' ? '#ffffff' : '#334155',
            }}
          >
            {classesProgress.length} khóa
          </span>
        </button>
      </div>

      {/* =====================================================
          TAB 1: BẢNG ĐIỂM & ĐÁNH GIÁ TỪ TEACHER
         ===================================================== */}
      {activeTab === 'grades' && (
        <div>
          {/* Metrics summary cards */}
          <div className="dash-metrics-grid" style={{ marginBottom: '1.5rem' }}>
            <div className="dash-metric-card">
              <div className="dash-metric-info">
                <span className="dash-metric-label">Band trung bình (Overall)</span>
                <span
                  className="dash-metric-val"
                  style={{ color: avgBand ? bandColor(parseFloat(avgBand)) : '#07403F' }}
                >
                  {avgBand ? `Band ${avgBand}` : '—'}
                </span>
                <span className="dash-metric-trend up">
                  {avgBand ? `Dựa trên ${withBand.length} bài kiểm tra` : 'Chưa có điểm Overall'}
                </span>
              </div>
            </div>

            <div className="dash-metric-card">
              <div className="dash-metric-info">
                <span className="dash-metric-label">Band cao nhất</span>
                <span
                  className="dash-metric-val"
                  style={{ color: maxBand ? bandColor(parseFloat(maxBand)) : '#10b981' }}
                >
                  {maxBand ? `Band ${maxBand}` : '—'}
                </span>
                <span className="dash-metric-trend up">
                  {maxBand ? bandLabel(parseFloat(maxBand)) : '—'}
                </span>
              </div>
            </div>

            <div className="dash-metric-card">
              <div className="dash-metric-info">
                <span className="dash-metric-label">Tổng bài đánh giá từ GV</span>
                <span className="dash-metric-val">{grades.length} bài</span>
                <span className="dash-metric-trend">
                  {grades.length > 0 ? 'Đã công bố kết quả' : 'Chờ giảng viên nhập'}
                </span>
              </div>
            </div>
          </div>

          {/* Class Filter Bar */}
          <div
            className="dash-card"
            style={{
              marginBottom: '1.5rem',
              padding: '1rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>
                🏫 Lọc theo lớp học:
              </span>
              <select
                value={selectedClassId}
                onChange={(e) => handleClassFilterChange(e.target.value)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#0f172a',
                  backgroundColor: '#ffffff',
                  cursor: 'pointer',
                  minWidth: '240px',
                }}
              >
                <option value="">-- Tất cả các lớp học ({classesList.length} lớp) --</option>
                {classesList.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.classCode} — {item.courseTitle || item.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Hiển thị: <strong>{grades.length}</strong> bài đánh giá
            </div>
          </div>

          {/* Grade Items */}
          {grades.length === 0 ? (
            <EmptyState
              icon="📊"
              title="Chưa có dữ liệu điểm số từ giảng viên"
              description="Hiện tại chưa có bài kiểm tra nào được công bố điểm. Khi giảng viên hoàn thành chấm thi giữa kỳ, cuối kỳ hoặc Mock Test, kết quả và nhận xét chi tiết sẽ hiển thị đầy đủ tại đây."
              action={
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1rem' }}>
                  <Link to="/student/classes" className="dash-quick-btn primary">
                    📚 Xem khóa học của tôi
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleTabChange('placement')}
                    className="dash-quick-btn secondary"
                    style={{ cursor: 'pointer' }}
                  >
                    🎯 Xem kết quả Test đầu vào
                  </button>
                </div>
              }
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {grades.map((grade) => {
                const cfg = typeCfg(grade.evaluationType);
                const rating = ratingCfg(grade.rating);
                const teacher = (grade as any).teacher;
                const cls = (grade as any).class;

                return (
                  <div
                    key={grade._id}
                    className="dash-card"
                    style={{
                      borderLeft: `5px solid ${cfg.color}`,
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    }}
                  >
                    {/* Header */}
                    <div className="dash-card-header" style={{ paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>{cfg.icon}</span>
                        <div>
                          <h2 className="dash-card-title" style={{ margin: 0, fontSize: '1.15rem' }}>
                            {grade.title}
                          </h2>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px', fontSize: '0.8rem', color: '#64748b' }}>
                            <span>🏫 {cls?.name || cls?.classCode || 'Lớp học'}</span>
                            <span>•</span>
                            <span>📅 Ngày kiểm tra: {formatDate(grade.testDate)}</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span className="badge-pill" style={{ background: `${cfg.color}18`, color: cfg.color, fontWeight: 700 }}>
                          {cfg.label}
                        </span>

                        {rating && (
                          <span
                            className="badge-pill"
                            style={{
                              backgroundColor: rating.bg,
                              color: rating.color,
                              fontWeight: 700,
                            }}
                          >
                            ★ {rating.label}
                          </span>
                        )}

                        {grade.overallBand !== undefined && grade.overallBand !== null ? (
                          <span
                            className="badge-pill"
                            style={{
                              background: `${bandColor(grade.overallBand)}22`,
                              color: bandColor(grade.overallBand),
                              fontWeight: 800,
                              fontSize: '0.95rem',
                              padding: '6px 12px',
                            }}
                          >
                            Overall Band {grade.overallBand}
                          </span>
                        ) : grade.score !== undefined ? (
                          <span className="badge-pill badge-blue" style={{ fontWeight: 700 }}>
                            {grade.score}/{grade.maxScore || 100} điểm
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Breakdown 4 kỹ năng */}
                    <div style={{ padding: '1rem 0' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>
                        Điểm thành phần 4 kỹ năng IELTS:
                      </div>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                          gap: '12px',
                          padding: '12px 16px',
                          backgroundColor: '#f8fafc',
                          borderRadius: '10px',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        <SkillBand label="🎧 Listening (Nghe)" band={grade.listening} />
                        <SkillBand label="📖 Reading (Đọc)" band={grade.reading} />
                        <SkillBand label="✍️ Writing (Viết)" band={grade.writing} />
                        <SkillBand label="🎙️ Speaking (Nói)" band={grade.speaking} />
                      </div>
                    </div>

                    {/* Teacher Info & Detailed Feedback */}
                    <div
                      style={{
                        padding: '1rem 1.25rem',
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: '10px',
                        marginTop: '0.5rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1.2rem' }}>👨‍🏫</span>
                          <span style={{ fontWeight: 700, color: '#166534', fontSize: '0.9rem' }}>
                            Giảng viên chấm bài: {teacher?.fullName || 'Giảng viên phụ trách'}
                          </span>
                          {teacher?.email && (
                            <span style={{ fontSize: '0.78rem', color: '#15803d' }}>({teacher.email})</span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.78rem', color: '#166534', fontWeight: 600 }}>
                          ✓ Đã kiểm duyệt & công bố
                        </span>
                      </div>

                      {grade.feedback ? (
                        <div style={{ fontSize: '0.9rem', color: '#14532d', lineHeight: 1.6, fontStyle: 'italic', paddingLeft: '8px', borderLeft: '3px solid #16a34a' }}>
                          &ldquo;{grade.feedback}&rdquo;
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.85rem', color: '#4b7c59' }}>
                          (Giảng viên chưa để lại lời nhận xét bổ sung)
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =====================================================
          TAB 2: KẾT QUẢ BÀI TEST ĐẦU VÀO (PLACEMENT TEST)
         ===================================================== */}
      {activeTab === 'placement' && (
        <div>
          {placementTest && placementTest.hasTest ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Diagnostic Overview Card */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '28px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                  border: '1.5px solid #e2e8f0',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '6px',
                    background: 'linear-gradient(90deg, #10b981 0%, #3b82f6 50%, #8b5cf6 100%)',
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                  <div>
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: '20px',
                        backgroundColor: '#ecfdf5',
                        color: '#059669',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        display: 'inline-block',
                        marginBottom: '8px',
                      }}
                    >
                      ✓ Đã hoàn thành bài kiểm tra chẩn đoán
                    </span>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                      {placementTest.testTitle}
                    </h2>
                    <p style={{ margin: '6px 0 0 0', fontSize: '0.88rem', color: '#64748b' }}>
                      Ngày thực hiện test: <strong>{formatDate(placementTest.testDate)}</strong>
                    </p>
                  </div>

                  <Link
                    to="/placement-tests"
                    className="dash-quick-btn primary"
                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    📝 Làm bài test mới / Thi thử
                  </Link>
                </div>

                {/* Score & Band Highlights Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                    marginBottom: '28px',
                  }}
                >
                  <div
                    style={{
                      padding: '20px',
                      borderRadius: '12px',
                      backgroundColor: '#f0fdf4',
                      border: '1.5px solid #86efac',
                    }}
                  >
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>
                      Điểm chẩn đoán (Band Score)
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#15803d', margin: '4px 0' }}>
                      Band {placementTest.score}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#166534', fontWeight: 600 }}>
                      Tương đương: {placementTest.levelName}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '20px',
                      borderRadius: '12px',
                      backgroundColor: '#eff6ff',
                      border: '1.5px solid #93c5fd',
                    }}
                  >
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e40af', textTransform: 'uppercase' }}>
                      Phân loại trình độ đầu vào
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1d4ed8', margin: '8px 0' }}>
                      {placementTest.matchedLevel}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#3b82f6', fontWeight: 600 }}>
                      Khung đánh giá: {placementTest.levelName}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '20px',
                      borderRadius: '12px',
                      backgroundColor: '#faf5ff',
                      border: '1.5px solid #d8b4fe',
                    }}
                  >
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6b21a8', textTransform: 'uppercase' }}>
                      Mục tiêu cam kết đầu ra
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#7e22ce', margin: '4px 0' }}>
                      Band {placementTest.targetBand || 6.5}+
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#9333ea', fontWeight: 600 }}>
                      Mục tiêu học viên hướng tới
                    </div>
                  </div>
                </div>

                {/* Detailed Analysis & Diagnosis Notes */}
                <div
                  style={{
                    padding: '20px 24px',
                    borderRadius: '12px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    marginBottom: '20px',
                  }}
                >
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
                    💡 Đánh Giá & Nhận Xét Năng Lực Đầu Vào
                  </h3>
                  <div style={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.7 }}>
                    {placementTest.notes}
                  </div>
                  {placementTest.learningGoal && (
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #cbd5e1', fontSize: '0.88rem', color: '#475569' }}>
                      🎯 <strong>Mục tiêu học tập cá nhân:</strong> {placementTest.learningGoal}
                    </div>
                  )}
                </div>

                {/* Course Recommendation Box */}
                <div
                  style={{
                    padding: '18px 22px',
                    borderRadius: '12px',
                    backgroundColor: '#fefce8',
                    border: '1px solid #fde047',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '14px',
                  }}
                >
                  <div>
                    <strong style={{ color: '#854d0e', fontSize: '0.95rem' }}>
                      🌟 Lộ trình phù hợp đề xuất cho bạn:
                    </strong>
                    <div style={{ fontSize: '0.85rem', color: '#713f12', marginTop: '3px' }}>
                      Dựa trên kết quả test (Band {placementTest.score}), lộ trình đề xuất là khóa học chuẩn bị nền tảng hoặc nâng band phù hợp.
                    </div>
                  </div>
                  <Link
                    to="/courses"
                    className="dash-quick-btn"
                    style={{ backgroundColor: '#ca8a04', color: '#ffffff', textDecoration: 'none', fontWeight: 700 }}
                  >
                    Xem Khóa Học Phù Hợp
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              icon="🎯"
              title="Bạn chưa thực hiện bài kiểm tra chẩn đoán đầu vào"
              description="Để xác định chính xác trình độ IELTS hiện tại và xây dựng lộ trình học tập tối ưu, bạn hãy làm bài kiểm tra chẩn đoán năng lực 4 kỹ năng miễn phí ngay hôm nay."
              action={
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
                  <Link to="/placement-tests" className="dash-quick-btn primary">
                    🎯 Làm bài test đầu vào ngay
                  </Link>
                  <Link to="/courses" className="dash-quick-btn secondary" style={{ textDecoration: 'none' }}>
                    Khám phá danh sách khóa học
                  </Link>
                </div>
              }
            />
          )}
        </div>
      )}

      {/* =====================================================
          TAB 3: LỘ TRÌNH KHÓA HỌC & CỘT MỐC (MILESTONES)
         ===================================================== */}
      {activeTab === 'milestones' && (
        <div>
          {classesProgress.length === 0 ? (
            <EmptyState
              icon="🚀"
              title="Chưa có dữ liệu tiến độ & cột mốc khóa học"
              description="Hiện tại bạn chưa có tiến độ học tập nào. Nếu bạn vừa đăng ký và thanh toán khóa học, nhân viên giáo vụ (Staff) đang xử lý xếp lớp cho bạn. Tiến độ và các cột mốc sẽ được kích hoạt ngay khi lớp học bắt đầu."
              action={
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
                  <Link to="/student/classes" className="dash-quick-btn primary">
                    📚 Xem khóa học của tôi
                  </Link>
                  <Link to="/courses" className="dash-quick-btn secondary" style={{ textDecoration: 'none' }}>
                    Khám phá thêm khóa học
                  </Link>
                </div>
              }
            />
          ) : (
            <div>
              {/* Tabs if student is in multiple classes */}
              {classesProgress.length > 1 && (
                <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
                  {classesProgress.map((item, idx) => (
                    <button
                      key={item.classId}
                      type="button"
                      onClick={() => setSelectedClassIndex(idx)}
                      style={{
                        padding: '10px 18px',
                        borderRadius: '10px',
                        border: 'none',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        backgroundColor: selectedClassIndex === idx ? '#07403F' : '#f1f5f9',
                        color: selectedClassIndex === idx ? '#ffffff' : '#475569',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {item.classCode} — {item.courseTitle} ({item.progressPercentage}%)
                    </button>
                  ))}
                </div>
              )}

              {/* Overview Metric Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '16px',
                  marginBottom: '28px',
                }}
              >
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    padding: '20px',
                    borderRadius: '14px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    borderLeft: '4px solid #3b82f6',
                  }}
                >
                  <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                    Tỉ Lệ Hoàn Thành Khóa
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b', margin: '6px 0' }}>
                    {currentClassProgress.progressPercentage}%
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${currentClassProgress.progressPercentage}%`,
                        height: '100%',
                        backgroundColor: currentClassProgress.progressPercentage >= 80 ? '#10b981' : '#3b82f6',
                        borderRadius: '4px',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: '#ffffff',
                    padding: '20px',
                    borderRadius: '14px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    borderLeft: '4px solid #10b981',
                  }}
                >
                  <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                    Số Mốc Đạt Được
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981', margin: '6px 0' }}>
                    {currentClassProgress.completedCount}{' '}
                    <span style={{ fontSize: '1rem', color: '#64748b' }}>
                      / {currentClassProgress.totalMilestones} mốc
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                    Còn {currentClassProgress.totalMilestones - currentClassProgress.completedCount} mốc nữa để về đích
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: '#ffffff',
                    padding: '20px',
                    borderRadius: '14px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    borderLeft: '4px solid #f59e0b',
                  }}
                >
                  <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                    Lớp & Giảng Viên
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', margin: '6px 0' }}>
                    {currentClassProgress.classCode}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#475569' }}>
                    GV: <strong>{currentClassProgress.teacherName}</strong>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Phòng: {currentClassProgress.room || 'Phòng học trung tâm'}
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: '#ffffff',
                    padding: '20px',
                    borderRadius: '14px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    borderLeft: '4px solid #8b5cf6',
                  }}
                >
                  <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                    Mục Tiêu Khóa Học
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#8b5cf6', margin: '6px 0' }}>
                    {currentClassProgress.targetLevel || 'IELTS 6.5 - 7.5+'}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                    Thời lượng: {currentClassProgress.sessions} buổi đào tạo
                  </div>
                </div>
              </div>

              {/* Next Milestone Spotlight if exists */}
              {currentClassProgress.nextMilestone && (
                <div
                  style={{
                    background: 'linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)',
                    padding: '20px 24px',
                    borderRadius: '16px',
                    border: '1px solid #bfdbfe',
                    marginBottom: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '1.2rem' }}>⚡</span>
                      <strong style={{ fontSize: '0.9rem', color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Cột mốc tiếp theo cần hoàn thành
                      </strong>
                    </div>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', color: '#1e293b' }}>
                      Mốc {currentClassProgress.nextMilestone.order}: {currentClassProgress.nextMilestone.title}
                    </h3>
                    {currentClassProgress.nextMilestone.description && (
                      <p style={{ margin: 0, fontSize: '0.88rem', color: '#475569', maxWidth: '750px' }}>
                        {currentClassProgress.nextMilestone.description}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <Link
                      to={`/student/classes/${currentClassProgress.classId}`}
                      style={{
                        padding: '9px 18px',
                        borderRadius: '8px',
                        backgroundColor: '#2563eb',
                        color: '#ffffff',
                        textDecoration: 'none',
                        fontWeight: 600,
                        fontSize: '0.88rem',
                      }}
                    >
                      Vào lớp học
                    </Link>
                  </div>
                </div>
              )}

              {/* Stepper Timeline */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '28px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 4px 0', color: '#1e293b' }}>
                      Lộ Trình Các Cột Mốc ({currentClassProgress.courseTitle})
                    </h2>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                      Mỗi mốc được giảng viên đánh giá và nghiệm thu sau khi học viên hoàn thành bài tập, bài kiểm tra hoặc đạt chuẩn kỹ năng
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={loadAllData}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: '#334155',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                    }}
                  >
                    🔄 Làm mới
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {currentClassProgress.milestones.map((milestone, idx) => {
                    const badge = milestoneTypeBadge(milestone.type);
                    const isCompleted = Boolean(milestone.isCompleted);
                    const isLast = idx === currentClassProgress.milestones.length - 1;

                    return (
                      <div
                        key={milestone.milestoneId || idx}
                        style={{
                          display: 'flex',
                          gap: '20px',
                          position: 'relative',
                        }}
                      >
                        {/* Connecting line */}
                        {!isLast && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '40px',
                              left: '20px',
                              bottom: '-20px',
                              width: '2px',
                              backgroundColor: isCompleted ? '#10b981' : '#e2e8f0',
                              zIndex: 1,
                            }}
                          />
                        )}

                        {/* Status Icon */}
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            backgroundColor: isCompleted ? '#10b981' : '#f1f5f9',
                            color: isCompleted ? '#ffffff' : '#64748b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: isCompleted ? '1.2rem' : '0.9rem',
                            fontWeight: 700,
                            zIndex: 2,
                            flexShrink: 0,
                            border: isCompleted ? '3px solid #d1fae5' : '2px solid #cbd5e1',
                            boxShadow: isCompleted ? '0 0 0 2px #10b981' : 'none',
                          }}
                        >
                          {isCompleted ? '✓' : milestone.order}
                        </div>

                        {/* Milestone Content Card */}
                        <div
                          style={{
                            flex: 1,
                            backgroundColor: isCompleted ? '#f0fdf4' : '#fafafa',
                            border: isCompleted ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                            borderRadius: '12px',
                            padding: '18px 22px',
                            marginBottom: '8px',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                <span
                                  style={{
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    backgroundColor: badge.bg,
                                    color: badge.color,
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                  }}
                                >
                                  {badge.icon} {badge.label}
                                </span>
                                {milestone.targetSession && (
                                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                    Mục tiêu: Buổi {milestone.targetSession}
                                  </span>
                                )}
                              </div>
                              <h4 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', color: '#1e293b' }}>
                                Mốc {milestone.order}: {milestone.title}
                              </h4>
                            </div>

                            <div>
                              {isCompleted ? (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '5px 12px',
                                    borderRadius: '20px',
                                    backgroundColor: '#dcfce7',
                                    color: '#15803d',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                  }}
                                >
                                  ✓ Đã hoàn thành
                                </span>
                              ) : (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '5px 12px',
                                    borderRadius: '20px',
                                    backgroundColor: '#f1f5f9',
                                    color: '#64748b',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                  }}
                                >
                                  ⏳ Đang tiến hành
                                </span>
                              )}
                            </div>
                          </div>

                          {milestone.description && (
                            <p style={{ margin: '6px 0 10px 0', fontSize: '0.88rem', color: '#475569', lineHeight: 1.5 }}>
                              {milestone.description}
                            </p>
                          )}

                          {isCompleted && (
                            <div
                              style={{
                                marginTop: '10px',
                                paddingTop: '10px',
                                borderTop: '1px dashed #bbf7d0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                fontSize: '0.8rem',
                                color: '#166534',
                                flexWrap: 'wrap',
                                gap: '8px',
                              }}
                            >
                              <div>
                                Ngày đạt: <strong>{formatDate(milestone.completedAt)}</strong>
                                {milestone.markedByName && <span> • Giáo viên xác nhận: <strong>{milestone.markedByName}</strong></span>}
                              </div>
                              {milestone.score !== undefined && (
                                <div style={{ fontWeight: 700, color: '#15803d' }}>
                                  Điểm đánh giá: Band {milestone.score}
                                </div>
                              )}
                            </div>
                          )}

                          {milestone.note && (
                            <div style={{ marginTop: '8px', fontSize: '0.82rem', color: '#047857', fontStyle: 'italic' }}>
                              💬 Nhận xét: &ldquo;{milestone.note}&rdquo;
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProgressPage;
