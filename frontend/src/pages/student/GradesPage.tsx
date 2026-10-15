import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { studentService } from '../../services/student.service';
import type { GradeItem } from '../../types';

const GradesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchGrades();
  }, [id]);

  const fetchGrades = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await studentService.getGrades(id);
      if (res.success && res.data) setGrades(res.data.grades);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Không thể tải điểm');
    } finally {
      setIsLoading(false);
    }
  };

  const typeConfig = (t: string) => {
    if (t === 'LISTENING') return { label: 'Listening', color: '#3b82f6', icon: '🎧' };
    if (t === 'READING') return { label: 'Reading', color: '#10b981', icon: '📖' };
    if (t === 'WRITING') return { label: 'Writing', color: '#f59e0b', icon: '✍️' };
    if (t === 'SPEAKING') return { label: 'Speaking', color: '#8b5cf6', icon: '🎙️' };
    if (t === 'OVERALL') return { label: 'Overall', color: '#ef4444', icon: '🏆' };
    return { label: t, color: '#64748b', icon: '📊' };
  };

  const bandColor = (band?: number) => {
    if (!band) return '#64748b';
    if (band >= 8.0) return '#10b981';
    if (band >= 6.5) return '#3b82f6';
    if (band >= 5.0) return '#f59e0b';
    return '#ef4444';
  };

  const avgBand = grades.filter(g => g.overallBand).length > 0
    ? (grades.filter(g => g.overallBand).reduce((sum, g) => sum + (g.overallBand || 0), 0) / grades.filter(g => g.overallBand).length).toFixed(1)
    : null;

  if (isLoading) {
    return (
      <div className="dash-container" style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p>Đang tải bảng điểm...</p>
      </div>
    );
  }

  return (
    <div className="dash-container">
      {/* ── Page Header ── */}
      <div className="dash-banner">
        <div className="dash-banner-content">
          <div className="dash-banner-badge">📊 Bảng Điểm</div>
          <h1>Kết Quả Học Tập</h1>
          <p>
            {grades.length > 0
              ? `Tổng cộng ${grades.length} bài đánh giá`
              : 'Chưa có kết quả đánh giá nào.'}
          </p>
        </div>
        <div className="dash-banner-right">
          <div className="dash-date-pill">
            {avgBand ? (
              <>
                <div>🎯 Band hiện tại: <strong style={{ color: bandColor(parseFloat(avgBand)) }}>{avgBand}</strong></div>
                <div className="sub">Xem chi tiết từng bài đánh giá</div>
              </>
            ) : (
              <div>📊 Bảng điểm</div>
            )}
          </div>
        </div>
      </div>

      {/* ── Quick Nav ── */}
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

      {/* ── Error ── */}
      {error && (
        <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(239,68,68,0.1)', borderRadius: '12px', marginBottom: '1.5rem' }}>
          <p style={{ color: '#ef4444', marginBottom: '0.75rem' }}>{error}</p>
          <button className="dash-quick-btn primary" onClick={fetchGrades}>Thử lại</button>
        </div>
      )}

      {/* ── Metrics ── */}
      {grades.length > 0 && (
        <div className="dash-metrics-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Band hiện tại</span>
              <span className="dash-metric-val" style={{ color: bandColor(avgBand ? parseFloat(avgBand) : undefined) }}>
                {avgBand || '—'}
              </span>
              <span className="dash-metric-trend up">
                {avgBand ? `${grades.length} bài đánh giá` : 'Chưa có điểm Overall'}
              </span>
            </div>
            <div className="dash-metric-icon icon-emerald">🏆</div>
          </div>
          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Tổng bài đánh giá</span>
              <span className="dash-metric-val">{grades.length}</span>
              <span className="dash-metric-trend">
                {grades.filter(g => g.status === 'PUBLISHED').length} đã công bố
              </span>
            </div>
            <div className="dash-metric-icon icon-blue">📝</div>
          </div>
          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Điểm cao nhất</span>
              <span className="dash-metric-val">
                {grades.filter(g => g.overallBand).length > 0
                  ? Math.max(...grades.filter(g => g.overallBand).map(g => g.overallBand!)).toFixed(1)
                  : '—'}
              </span>
              <span className="dash-metric-trend up">
                {grades.filter(g => g.overallBand && g.overallBand >= 6.5).length} bài đạt 6.5+
              </span>
            </div>
            <div className="dash-metric-icon icon-amber">⭐</div>
          </div>
        </div>
      )}

      {/* ── IELTS Score Breakdown (if any) ── */}
      {grades.length === 0 && !isLoading && !error ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--dash-card-subtle)', borderRadius: '16px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
          <h2>Chưa có kết quả đánh giá</h2>
          <p style={{ opacity: 0.7 }}>Kết quả học tập sẽ được cập nhật sau mỗi bài kiểm tra.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {grades.map((g) => {
            const type = typeConfig(g.evaluationType);
            const isPublished = g.status === 'PUBLISHED';
            return (
              <div key={g._id} className="dash-card">
                <div className="dash-card-header">
                  <h2 className="dash-card-title">
                    <span>{type.icon}</span>
                    {g.title}
                  </h2>
                  <span className={`badge-pill ${isPublished ? 'badge-green' : 'badge-amber'}`}>
                    {isPublished ? '✅ Đã công bố' : '📝 Đang chấm'}
                  </span>
                </div>

                <div className="dash-subcard">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem 1.5rem', marginBottom: '1rem' }}>
                    <div>
                      <div className="dash-subcard-label">Loại đánh giá</div>
                      <div className="dash-subcard-value" style={{ color: type.color, fontWeight: 700 }}>
                        {type.label}
                      </div>
                    </div>
                    <div>
                      <div className="dash-subcard-label">Ngày thi</div>
                      <div className="dash-subcard-value">
                        {new Date(g.testDate).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                    {g.overallBand !== undefined && (
                      <div>
                        <div className="dash-subcard-label">Band điểm</div>
                        <div className="dash-subcard-value" style={{ color: bandColor(g.overallBand), fontSize: '1.3rem', fontWeight: 800 }}>
                          {g.overallBand.toFixed(1)}
                        </div>
                      </div>
                    )}
                    {g.listening !== undefined && (
                      <div>
                        <div className="dash-subcard-label">Listening</div>
                        <div className="dash-subcard-value">{g.listening.toFixed(1)}</div>
                      </div>
                    )}
                    {g.reading !== undefined && (
                      <div>
                        <div className="dash-subcard-label">Reading</div>
                        <div className="dash-subcard-value">{g.reading.toFixed(1)}</div>
                      </div>
                    )}
                    {g.writing !== undefined && (
                      <div>
                        <div className="dash-subcard-label">Writing</div>
                        <div className="dash-subcard-value">{g.writing.toFixed(1)}</div>
                      </div>
                    )}
                    {g.speaking !== undefined && (
                      <div>
                        <div className="dash-subcard-label">Speaking</div>
                        <div className="dash-subcard-value">{g.speaking.toFixed(1)}</div>
                      </div>
                    )}
                  </div>

                  {g.feedback && (
                    <div style={{ background: 'rgba(245,158,11,0.08)', borderRadius: '8px', padding: '0.75rem', marginTop: '0.5rem' }}>
                      <div className="dash-subcard-label">📝 Nhận xét của giảng viên</div>
                      <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: '#475569' }}>{g.feedback}</div>
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

export default GradesPage;
