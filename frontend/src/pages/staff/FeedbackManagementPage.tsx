import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { staffService } from '../../services/staff.service';
import { useToast } from '../../contexts/ToastContext';
import type { ClassFeedback } from '../../types';
import { EmptyState, SkeletonPage } from '../../components/Skeleton';
import { formatDate } from '../../utils/format';

const StarRow: React.FC<{ rating: number; size?: number }> = ({ rating, size = 14 }) => (
  <span style={{ letterSpacing: 1 }}>
    {[1, 2, 3, 4, 5].map((i) => (
      <span key={i} style={{ opacity: i <= rating ? 1 : 0.25, fontSize: size }}>
        ⭐
      </span>
    ))}
  </span>
);

const FeedbackManagementPage: React.FC = () => {
  const toast = useToast();
  const [items, setItems] = useState<ClassFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [minRating, setMinRating] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [total, setTotal] = useState(0);
  const [byClass, setByClass] = useState<
    { classId: string; avgRating: number; count: number }[]
  >([]);

  const fetchFeedback = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await staffService.getFeedback({
        minRating: minRating || undefined,
        limit: 50,
      });
      if (res.success && res.data) {
        setItems(res.data.items || []);
        setAvgRating(res.stats?.avgRating ?? 0);
        setTotal(res.stats?.total ?? 0);
        setByClass(res.stats?.byClass || []);
      } else {
        toast.error(res.message || 'Không thể tải phản hồi');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể tải phản hồi');
    } finally {
      setIsLoading(false);
    }
  }, [minRating, toast]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  if (isLoading) return <SkeletonPage message="Đang tải phản hồi học viên..." />;

  return (
    <div className="dash-container">
      <div className="dash-banner">
        <div className="dash-banner-content">
          <div className="dash-banner-badge">💬 Phản Hồi</div>
          <h1>Phản Hồi Học Viên</h1>
          <p>
            Ý kiến đánh giá của học viên về từng lớp học. Dùng để điều chỉnh
            chất lượng giảng dạy và chăm sóc học viên.
          </p>
        </div>
        <div className="dash-banner-right">
          <div className="dash-date-pill">
            <div>
              ⭐ {avgRating ? avgRating.toFixed(2) : '—'}/5
            </div>
            <div className="sub">{total} phản hồi</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <Link to="/staff/dashboard" className="dash-quick-btn" style={{ textDecoration: 'none' }}>
          ← Tổng quan
        </Link>
        <Link to="/staff/requests" className="dash-quick-btn" style={{ textDecoration: 'none' }}>
          🔄 Yêu cầu học viên
        </Link>
      </div>

      {items.length > 0 && (
        <div className="dash-metrics-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Điểm trung bình</span>
              <span className="dash-metric-val">{avgRating ? avgRating.toFixed(2) : '—'}</span>
              <span className="dash-metric-trend up">Trên thang 5 sao</span>
            </div>
            <div className="dash-metric-icon icon-amber">⭐</div>
          </div>
          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Tổng phản hồi</span>
              <span className="dash-metric-val">{total}</span>
              <span className="dash-metric-trend">Đã thu thập</span>
            </div>
            <div className="dash-metric-icon icon-blue">💬</div>
          </div>
          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Lớp có phản hồi</span>
              <span className="dash-metric-val">{byClass.length}</span>
              <span className="dash-metric-trend">
                {avgRating >= 4
                  ? 'Chất lượng tốt 👍'
                  : avgRating > 0
                  ? 'Cần cải thiện'
                  : 'Chưa có dữ liệu'}
              </span>
            </div>
            <div className="dash-metric-icon icon-emerald">📊</div>
          </div>
        </div>
      )}

      <div
        className="dash-card"
        style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem' }}
      >
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, fontSize: '0.9rem', marginRight: '0.5rem' }}>
            🎯 Lọc theo mức đánh giá:
          </span>
          <button
            type="button"
            onClick={() => setMinRating(0)}
            className={`dash-quick-btn ${minRating === 0 ? 'primary' : ''}`}
            style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
          >
            Tất cả
          </button>
          {[5, 4, 3, 2, 1].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setMinRating(star)}
              className={`dash-quick-btn ${minRating === star ? 'primary' : ''}`}
              style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
            >
              {'⭐'.repeat(star)} {star}+
            </button>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon="📭"
          title="Chưa có phản hồi"
          description="Phản hồi của học viên sẽ xuất hiện ở đây khi học viên đánh giá lớp học."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {items.map((f) => {
            const sender: any = f.sender;
            const cls: any = f.class;
            return (
              <div key={f._id} className="dash-card">
                <div className="dash-card-header">
                  <h2 className="dash-card-title">
                    <span>💬</span> {sender?.fullName || 'Học viên'}
                  </h2>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <StarRow rating={f.rating} />
                    <span className="badge-pill badge-amber">{f.rating}/5</span>
                  </div>
                </div>
                <div className="dash-subcard">
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: '0.75rem 1.5rem',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <Field label="Email" value={sender?.email || '—'} />
                    <Field label="Mã lớp" value={cls?.classCode || '—'} />
                    <Field label="Ngày gửi" value={formatDate(f.createdAt, true)} />
                  </div>

                  <div
                    style={{
                      background: 'rgba(59,130,246,0.06)',
                      borderRadius: '8px',
                      padding: '0.75rem',
                    }}
                  >
                    <div style={{ fontSize: '0.9rem', color: '#475569' }}>{f.content}</div>
                  </div>

                  {f.tags && f.tags.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        gap: '0.4rem',
                        flexWrap: 'wrap',
                        marginTop: '0.75rem',
                      }}
                    >
                      {f.tags.map((tag) => (
                        <span key={tag} className="badge-pill badge-blue">
                          {tag}
                        </span>
                      ))}
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

export default FeedbackManagementPage;
