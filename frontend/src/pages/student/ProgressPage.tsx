import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { progressService } from '../../services/progress.service';
import type { StudentProgressSummary } from '../../services/progress.service';
import { useToast } from '../../contexts/ToastContext';
import { EmptyState, SkeletonPage } from '../../components/Skeleton';
import { formatDate } from '../../utils/format';

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

const ProgressPage: React.FC = () => {
  const toast = useToast();
  const [classesProgress, setClassesProgress] = useState<StudentProgressSummary[]>([]);
  const [selectedClassIndex, setSelectedClassIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      setIsLoading(true);
      const res = await progressService.getMyProgress();
      if (res.success && res.data) {
        setClassesProgress(res.data);
      } else {
        toast.error('Không thể tải tiến độ khóa học');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi tải tiến độ khóa học');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <SkeletonPage message="Đang tải dữ liệu tiến độ khóa học..." />;
  }

  if (classesProgress.length === 0) {
    return (
      <div className="dash-container">
        <div className="dash-banner">
          <div className="dash-banner-content">
            <div className="dash-banner-badge">🎯 Tiến Độ Học Tập</div>
            <h1>Tiến Độ Hoàn Thành Khóa Học</h1>
            <p>Theo dõi từng mốc kiến thức, bài thi định kỳ và mức độ đạt chuẩn đầu ra</p>
          </div>
        </div>
        <EmptyState
          icon="📚"
          title="Bạn chưa tham gia lớp học nào"
          description="Hãy đăng ký khóa học để bắt đầu theo dõi lộ trình và các mốc hoàn thành."
          action={
            <Link to="/courses" className="btn btn-primary">
              Khám phá khóa học
            </Link>
          }
        />
      </div>
    );
  }

  const currentClass = classesProgress[selectedClassIndex] || classesProgress[0];

  return (
    <div className="dash-container">
      {/* Top Banner */}
      <div className="dash-banner">
        <div className="dash-banner-content">
          <div className="dash-banner-badge">🎯 Lộ Trình &amp; Cột Mốc</div>
          <h1>Tiến Độ Hoàn Thành Khóa Học</h1>
          <p>
            Theo dõi chi tiết các mốc hoàn thành nội dung, bài thi định kỳ và đánh giá chuẩn đầu ra từ giảng viên
          </p>
        </div>
      </div>

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
                backgroundColor: selectedClassIndex === idx ? '#1e293b' : '#f1f5f9',
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
            Tỉ Lệ Hoàn Thành
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b', margin: '6px 0' }}>
            {currentClass.progressPercentage}%
          </div>
          <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${currentClass.progressPercentage}%`,
                height: '100%',
                backgroundColor: currentClass.progressPercentage >= 80 ? '#10b981' : '#3b82f6',
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
            {currentClass.completedCount} <span style={{ fontSize: '1rem', color: '#64748b' }}>/ {currentClass.totalMilestones} mốc</span>
          </div>
          <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
            Còn {currentClass.totalMilestones - currentClass.completedCount} mốc nữa để về đích
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
            Lớp &amp; Giảng Viên
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', margin: '6px 0' }}>
            {currentClass.classCode}
          </div>
          <div style={{ fontSize: '0.82rem', color: '#475569' }}>
            GV: <strong>{currentClass.teacherName}</strong>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
            Phòng: {currentClass.room || 'Phòng học trung tâm'}
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
            {currentClass.targetLevel || 'IELTS 6.5 - 7.5+'}
          </div>
          <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
            Thời lượng: {currentClass.sessions} buổi đào tạo
          </div>
        </div>
      </div>

      {/* Next Milestone Spotlight if exists */}
      {currentClass.nextMilestone && (
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
              Mốc {currentClass.nextMilestone.order}: {currentClass.nextMilestone.title}
            </h3>
            {currentClass.nextMilestone.description && (
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#475569', maxWidth: '750px' }}>
                {currentClass.nextMilestone.description}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link
              to={`/student/classes/${currentClass.classId}`}
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
              Lộ Trình Các Cột Mốc ({currentClass.courseTitle})
            </h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
              Mỗi mốc được giảng viên đánh giá và nghiệm thu sau khi học viên hoàn thành bài tập, bài kiểm tra hoặc đạt chuẩn kỹ năng
            </p>
          </div>
          <button
            type="button"
            onClick={fetchProgress}
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
          {currentClass.milestones.map((milestone, idx) => {
            const badge = milestoneTypeBadge(milestone.type);
            const isCompleted = Boolean(milestone.isCompleted);
            const isLast = idx === currentClass.milestones.length - 1;

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

                  {/* Completion details if completed */}
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
  );
};

export default ProgressPage;
