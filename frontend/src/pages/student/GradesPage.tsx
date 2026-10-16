import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { studentService } from '../../services/student.service';
import { useToast } from '../../contexts/ToastContext';
import type { Grade, GradeEvaluationType } from '../../types';
import { EmptyState, SkeletonPage } from '../../components/Skeleton';
import { formatDate, bandColor, bandLabel, formatVND } from '../../utils/format';

const typeCfg = (t: GradeEvaluationType) => {
  const map: Record<GradeEvaluationType, { label: string; color: string; icon: string }> = {
    LISTENING: { label: 'Listening', color: '#3b82f6', icon: '🎧' },
    READING: { label: 'Reading', color: '#10b981', icon: '📖' },
    WRITING: { label: 'Writing', color: '#f59e0b', icon: '✍️' },
    SPEAKING: { label: 'Speaking', color: '#8b5cf6', icon: '🎙️' },
    OVERALL: { label: 'Overall', color: '#ef4444', icon: '🏆' },
    QUIZ: { label: 'Quiz', color: '#06b6d4', icon: '📝' },
    MIDTERM: { label: 'Giữa kỳ', color: '#ec4899', icon: '📋' },
    FINAL: { label: 'Cuối kỳ', color: '#dc2626', icon: '🎓' },
    OTHER: { label: 'Khác', color: '#64748b', icon: '📊' },
  };
  return map[t] || map.OTHER;
};

const GradesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) fetchGrades();
  }, [id]);

  const fetchGrades = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const res = await studentService.getGrades(id);
      if (res.success && res.data) setGrades(res.data.grades);
      else toast.error(res.message || 'Không thể tải bảng điểm');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể tải bảng điểm');
    } finally {
      setIsLoading(false);
    }
  };

  const withBand = grades.filter((g) => g.overallBand !== undefined && g.overallBand !== null);
  const avgBand =
    withBand.length > 0
      ? (withBand.reduce((sum, g) => sum + (g.overallBand || 0), 0) / withBand.length).toFixed(1)
      : null;
  const maxBand = withBand.length > 0 ? Math.max(...withBand.map((g) => g.overallBand!)).toFixed(1) : null;

  if (isLoading) return <SkeletonPage message="Đang tải bảng điểm..." />;

  return (
    <div className="dash-container">
      <div className="dash-banner">
        <div className="dash-banner-content">
          <div className="dash-banner-badge">📊 Bảng Điểm</div>
          <h1>Kết Quả Học Tập</h1>
          <p>
            {grades.length > 0
              ? `Tổng cộng ${grades.length} bài đánh giá.`
              : 'Chưa có kết quả đánh giá nào.'}
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
              <div>📊 Bảng điểm</div>
            )}
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
        <Link to={`/student/classes/${id}/attendance`} className="dash-quick-btn" style={{ textDecoration: 'none' }}>
          📅 Điểm Danh
        </Link>
      </div>

      {grades.length > 0 && (
        <div className="dash-metrics-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Band hiện tại</span>
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
              <span className="dash-metric-label">Tổng bài đánh giá</span>
              <span className="dash-metric-val">{grades.length}</span>
              <span className="dash-metric-trend">
                {grades.filter((g) => g.status === 'PUBLISHED').length} đã công bố
              </span>
            </div>
            <div className="dash-metric-icon icon-blue">📝</div>
          </div>
          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Điểm cao nhất</span>
              <span className="dash-metric-val">{maxBand || '—'}</span>
              <span className="dash-metric-trend up">
                {withBand.filter((g) => (g.overallBand || 0) >= 6.5).length} bài đạt 6.5+
              </span>
            </div>
            <div className="dash-metric-icon icon-amber">⭐</div>
          </div>
        </div>
      )}

      {grades.length === 0 ? (
        <EmptyState
          icon="📭"
          title="Chưa có kết quả đánh giá"
          description="Kết quả học tập sẽ được cập nhật sau mỗi bài kiểm tra."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {grades.map((g) => {
            const type = typeCfg(g.evaluationType);
            const isPublished = g.status === 'PUBLISHED';
            const percent = g.maxScore > 0 ? (g.score / g.maxScore) * 100 : 0;
            return (
              <div key={g._id} className="dash-card">
                <div className="dash-card-header">
                  <h2 className="dash-card-title">
                    <span>{type.icon}</span>
                    {g.title}
                  </h2>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span className={`badge-pill ${isPublished ? 'badge-green' : 'badge-amber'}`}>
                      {isPublished ? '✅ Đã công bố' : '📝 Nháp'}
                    </span>
                    <span className="badge-pill badge-blue">
                      {g.score}/{g.maxScore} ({percent.toFixed(0)}%)
                    </span>
                  </div>
                </div>

                <div className="dash-subcard">
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                      gap: '0.75rem 1.5rem',
                      marginBottom: '1rem',
                    }}
                  >
                    <Field label="Loại đánh giá" value={
                      <span style={{ color: type.color, fontWeight: 700 }}>{type.label}</span>
                    } />
                    <Field label="Ngày thi" value={formatDate(g.testDate)} />
                    {g.overallBand !== undefined && g.overallBand !== null && (
                      <Field label="Band điểm" value={
                        <span style={{ color: bandColor(g.overallBand), fontSize: '1.3rem', fontWeight: 800 }}>
                          {g.overallBand.toFixed(1)}
                        </span>
                      } />
                    )}
                    {g.listening !== undefined && g.listening !== null && (
                      <Field label="Listening" value={g.listening.toFixed(1)} />
                    )}
                    {g.reading !== undefined && g.reading !== null && (
                      <Field label="Reading" value={g.reading.toFixed(1)} />
                    )}
                    {g.writing !== undefined && g.writing !== null && (
                      <Field label="Writing" value={g.writing.toFixed(1)} />
                    )}
                    {g.speaking !== undefined && g.speaking !== null && (
                      <Field label="Speaking" value={g.speaking.toFixed(1)} />
                    )}
                  </div>

                  {g.feedback && (
                    <div
                      style={{
                        background: 'rgba(245,158,11,0.08)',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        marginTop: '0.5rem',
                      }}
                    >
                      <div className="dash-subcard-label">📝 Nhận xét của giảng viên</div>
                      <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: '#475569' }}>
                        {g.feedback}
                      </div>
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

const Field: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div>
    <div className="dash-subcard-label">{label}</div>
    <div className="dash-subcard-value">{value || '—'}</div>
  </div>
);

export default GradesPage;
