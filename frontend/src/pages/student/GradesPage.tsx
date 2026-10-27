import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { studentService } from '../../services/student.service';
import { useToast } from '../../contexts/ToastContext';
import type { Grade, GradeEvaluationType } from '../../types';
import { EmptyState, SkeletonPage } from '../../components/Skeleton';
import { formatDate, bandColor, bandLabel } from '../../utils/format';
import { computeAggregateBand } from '../../utils/band';

/** Nhãn + icon cho 4 kỹ năng IELTS. */
const SKILL_LABELS = {
  listening: 'Listening',
  reading: 'Reading',
  writing: 'Writing',
  speaking: 'Speaking',
} as const;

const SKILL_ICONS = {
  listening: '🎧',
  reading: '📖',
  writing: '✍️',
  speaking: '🎙️',
} as const;

const typeCfg = (t: GradeEvaluationType) => {
  const map: Record<GradeEvaluationType, { label: string; color: string; icon: string }> = {
    MOCK_TEST:            { label: 'Mock Test',      color: '#3b82f6', icon: '🎧' },
    MID_TERM:             { label: 'Giữa kỳ',       color: '#ec4899', icon: '📋' },
    FINAL_TEST:           { label: 'Cuối kỳ',       color: '#dc2626', icon: '🎓' },
    ASSIGNMENT:           { label: 'Bài tập',       color: '#06b6d4', icon: '📝' },
    SPEAKING_ASSESSMENT:  { label: 'Speaking',       color: '#8b5cf6', icon: '🎙️' },
    WRITING_ASSESSMENT:  { label: 'Writing',        color: '#f59e0b', icon: '✍️' },
  };
  return map[t] ?? { label: t, color: '#64748b', icon: '📊' };
};

const GradesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [classCode, setClassCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) fetchGrades();
  }, [id]);

  const fetchGrades = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const [res, clsRes] = await Promise.all([
        studentService.getGrades(id),
        studentService.getClassDetails(id).catch(() => null),
      ]);
      if (res.success && res.data) setGrades(res.data.grades);
      else toast.error(res.message || 'Không thể tải bảng điểm');
      const c = (clsRes?.data?.class as any)?.class;
      if (c) setClassCode(c.classCode || '');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể tải bảng điểm');
    } finally {
      setIsLoading(false);
    }
  };

  // Band đã công bố (có overallBand) — dùng cho max / đếm số bài.
  const withBand = grades.filter((g) => g.overallBand !== undefined && g.overallBand !== null);
  // Band tổng hợp theo chuẩn IELTS: ưu tiên band chính thức của giảng viên,
  // nếu bản ghi chỉ có band 4 kỹ năng thì suy ra overall theo trọng số.
  const overallBand = computeAggregateBand(grades);
  const avgBand = overallBand !== null ? overallBand.toFixed(1) : null;
  const maxBand = withBand.length > 0 ? Math.max(...withBand.map((g) => g.overallBand!)).toFixed(1) : null;

  // Band trung bình theo từng kỹ năng — cho học viên thấy điểm yếu của mình.
  const skillAverages = (['listening', 'reading', 'writing', 'speaking'] as const).map(
    (skill) => {
      const vals = grades
        .map((g) => g[skill])
        .filter((v): v is number => v !== undefined && v !== null && !Number.isNaN(v));
      return {
        skill,
        label: SKILL_LABELS[skill],
        icon: SKILL_ICONS[skill],
        value: vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null,
        count: vals.length,
      };
    }
  );
  const hasSkillData = skillAverages.some((s) => s.value !== null);

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
            {classCode ? ` • Lớp ${classCode}` : ''}
          </p>
        </div>
        <div className="dash-banner-right">
          <div className="dash-date-pill">
            {avgBand ? (
              <>
                <div>
                  🎯 Band tổng hợp:{' '}
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
              <span className="dash-metric-label">Band tổng hợp</span>
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

      {/* ── Band theo 4 kỹ năng ──
          Giúp học viên thấy rõ kỹ năng mạnh/yếu của mình, thay vì chỉ
          nhìn 1 con số Overall duy nhất. */}
      {hasSkillData && (
        <div className="dash-card" style={{ marginBottom: '1.5rem' }}>
          <div className="dash-card-header">
            <h2 className="dash-card-title"><span>🎯</span> Phân Tích 4 Kỹ Năng</h2>
            <span className="badge-pill badge-blue">Trung bình mỗi kỹ năng</span>
          </div>
          <div className="dash-subcard">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '1rem',
              }}
            >
              {skillAverages.map((s) => (
                <div
                  key={s.skill}
                  style={{
                    background: 'var(--dash-card-subtle)',
                    borderRadius: '10px',
                    padding: '0.85rem 1rem',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.8rem',
                      color: '#64748b',
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    {s.icon} {s.label}
                  </div>
                  <div
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 800,
                      color: s.value !== null ? bandColor(s.value) : '#94a3b8',
                    }}
                  >
                    {s.value !== null ? s.value.toFixed(1) : '—'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                    {s.count > 0 ? `${s.count} bài có điểm` : 'Chưa có điểm'}
                  </div>
                </div>
              ))}
            </div>
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
            const hasScore = g.score !== undefined && g.maxScore !== undefined && g.maxScore > 0;
            const percent = hasScore ? ((g.score as number) / (g.maxScore as number)) * 100 : 0;
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
                    {hasScore ? (
                      <span className="badge-pill badge-blue">
                        {g.score}/{g.maxScore} ({percent.toFixed(0)}%)
                      </span>
                    ) : g.overallBand !== undefined && g.overallBand !== null ? (
                      <span className="badge-pill badge-purple">
                        Band {g.overallBand.toFixed(1)}
                      </span>
                    ) : (
                      <span className="badge-pill badge-amber">Chưa có điểm</span>
                    )}
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
