import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { staffService } from '../../services/staff.service';
import { useToast } from '../../contexts/ToastContext';
import type { ChangeRequest, ChangeRequestStatus, RequestType } from '../../types';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { EmptyState, SkeletonPage } from '../../components/Skeleton';
import { formatDate } from '../../utils/format';
import { requestStatusMeta } from '../../utils/labels';

type FilterKey = 'ALL' | ChangeRequestStatus;

const typeCfg = (t: RequestType) => {
  const map: Record<RequestType, { label: string; icon: string }> = {
    CLASS_CHANGE: { label: 'Đổi lớp', icon: '🔄' },
    SCHEDULE_CHANGE: { label: 'Đổi lịch học', icon: '🗓️' },
    TEACHER_SCHEDULE_CHANGE: { label: 'Đổi lịch giảng viên', icon: '👨‍🏫' },
  };
  return map[t] || { label: t, icon: '📄' };
};

const RequestsManagementPage: React.FC = () => {
  const toast = useToast();
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('ALL');
  const [typeFilter, setTypeFilter] = useState<RequestType | 'ALL'>('ALL');
  const [search, setSearch] = useState('');

  // Modal duyệt / từ chối
  const [reviewTarget, setReviewTarget] = useState<ChangeRequest | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [reviewNote, setReviewNote] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await staffService.getRequests({
        status: filter,
        requestType: typeFilter,
        search: search.trim() || undefined,
        limit: 50,
      });
      if (res.success && res.data) {
        setRequests(res.data.requests || []);
      } else {
        toast.error(res.message || 'Không thể tải danh sách yêu cầu');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể tải danh sách yêu cầu');
    } finally {
      setIsLoading(false);
    }
  }, [filter, typeFilter, search, toast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const openReview = (r: ChangeRequest, status: 'APPROVED' | 'REJECTED') => {
    setReviewTarget(r);
    setReviewStatus(status);
    setReviewNote('');
    setReviewError(null);
  };

  const handleReview = async () => {
    if (!reviewTarget) return;
    if (reviewStatus === 'REJECTED' && !reviewNote.trim()) {
      setReviewError('Vui lòng ghi lý do từ chối để học viên hiểu lý do');
      return;
    }
    try {
      setIsReviewing(true);
      setReviewError(null);
      const res = await staffService.reviewRequest(reviewTarget._id, {
        status: reviewStatus,
        reviewNote: reviewNote.trim() || undefined,
      });
      if (res.success) {
        toast.success(res.message || 'Xử lý yêu cầu thành công');
        setReviewTarget(null);
        await fetchRequests();
      } else {
        setReviewError(res.message || 'Xử lý yêu cầu thất bại');
      }
    } catch (err: any) {
      setReviewError(err.response?.data?.message || 'Xử lý yêu cầu thất bại');
    } finally {
      setIsReviewing(false);
    }
  };

  if (isLoading) return <SkeletonPage message="Đang tải yêu cầu..." />;

  const pending = requests.filter((r) => r.status === 'PENDING');

  const tabs: { key: FilterKey; label: string }[] = [
    { key: 'ALL', label: 'Tất cả' },
    { key: 'PENDING', label: '⏳ Chờ duyệt' },
    { key: 'APPROVED', label: '✅ Đã duyệt' },
    { key: 'REJECTED', label: '❌ Từ chối' },
  ];

  return (
    <div className="dash-container">
      <div className="dash-banner">
        <div className="dash-banner-content">
          <div className="dash-banner-badge">🔄 Yêu Cầu</div>
          <h1>Quản Lý Yêu Cầu Học Viên</h1>
          <p>
            {pending.length > 0
              ? `${pending.length} yêu cầu đang chờ xử lý.`
              : 'Không có yêu cầu nào đang chờ xử lý.'}
          </p>
        </div>
        <div className="dash-banner-right">
          <div className="dash-date-pill">
            <div>🔄 {requests.length} yêu cầu</div>
            <div className="sub">{pending.length} đang chờ</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <Link to="/staff/dashboard" className="dash-quick-btn" style={{ textDecoration: 'none' }}>
          ← Tổng quan
        </Link>
        <Link to="/staff/feedback" className="dash-quick-btn" style={{ textDecoration: 'none' }}>
          💬 Phản hồi học viên
        </Link>
      </div>

      {requests.length > 0 && (
        <div className="dash-metrics-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Tổng yêu cầu</span>
              <span className="dash-metric-val">{requests.length}</span>
              <span className="dash-metric-trend">
                {requests.filter((r) => r.status === 'APPROVED').length} đã duyệt
              </span>
            </div>
            <div className="dash-metric-icon icon-blue">📋</div>
          </div>
          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Đang chờ duyệt</span>
              <span className="dash-metric-val" style={{ color: '#f59e0b' }}>
                {pending.length}
              </span>
              <span className="dash-metric-trend">Cần xử lý</span>
            </div>
            <div className="dash-metric-icon icon-amber">⏳</div>
          </div>
          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Đã từ chối</span>
              <span className="dash-metric-val" style={{ color: '#8b5cf6' }}>
                {requests.filter((r) => r.status === 'REJECTED').length}
              </span>
              <span className="dash-metric-trend">
                {requests.filter((r) => r.status === 'APPROVED').length} đã duyệt
              </span>
            </div>
            <div className="dash-metric-icon icon-purple">❌</div>
          </div>
        </div>
      )}

      <div
        className="dash-card"
        style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem' }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(200px, 2fr) 1fr auto',
            gap: '0.75rem',
            alignItems: 'center',
          }}
        >
          <input
            type="text"
            placeholder="🔍 Tìm theo tên/email học viên, mã lớp, lý do..."
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
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            style={selectStyle}
          >
            <option value="ALL">📄 Tất cả loại yêu cầu</option>
            <option value="CLASS_CHANGE">🔄 Đổi lớp</option>
            <option value="SCHEDULE_CHANGE">🗓️ Đổi lịch học</option>
            <option value="TEACHER_SCHEDULE_CHANGE">👨‍🏫 Đổi lịch giảng viên</option>
          </select>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                className={`dash-quick-btn ${filter === tab.key ? 'primary' : ''}`}
                style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {requests.length === 0 ? (
        <EmptyState
          icon="📭"
          title="Không có yêu cầu nào"
          description={
            filter !== 'ALL' || typeFilter !== 'ALL'
              ? 'Không có yêu cầu nào phù hợp với bộ lọc hiện tại.'
              : 'Chưa có yêu cầu nào từ học viên.'
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {requests.map((r) => {
            const status = requestStatusMeta(r.status);
            const type = typeCfg(r.requestType);
            const student: any = r.student;
            const currentCode = (r.currentClass as any)?.classCode || r.currentClass;
            const targetCode = (r.targetClass as any)?.classCode || r.targetClass;
            return (
              <div key={r._id} className="dash-card">
                <div className="dash-card-header">
                  <h2 className="dash-card-title">
                    <span>{type.icon}</span> {type.label}
                  </h2>
                  <span className={`badge-pill ${status.cls}`}>
                    {status.icon} {status.label}
                  </span>
                </div>

                <div className="dash-subcard">
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                      gap: '0.75rem 1.5rem',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <Field label="Học viên" value={student?.fullName || '—'} />
                    <Field label="Email" value={student?.email || '—'} />
                    <Field label="SĐT" value={student?.phone || '—'} />
                    {currentCode && <Field label="Lớp hiện tại" value={currentCode} />}
                    {targetCode && <Field label="Lớp mong muốn" value={targetCode} />}
                    {r.currentSchedule && (
                      <Field label="Lịch hiện tại" value={r.currentSchedule} />
                    )}
                    {r.targetSchedule && (
                      <Field label="Lịch mong muốn" value={r.targetSchedule} />
                    )}
                    <Field label="Ngày gửi" value={formatDate(r.createdAt, true)} />
                    {r.reviewedAt && (
                      <Field label="Ngày xử lý" value={formatDate(r.reviewedAt, true)} />
                    )}
                  </div>

                  <div
                    style={{
                      background: 'rgba(59,130,246,0.06)',
                      borderRadius: '8px',
                      padding: '0.75rem',
                    }}
                  >
                    <div className="dash-subcard-label">📝 Lý do</div>
                    <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: '#475569' }}>
                      {r.reason}
                    </div>
                  </div>

                  {r.reviewNote && (
                    <div
                      style={{
                        background: 'rgba(245,158,11,0.08)',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        marginTop: '0.5rem',
                      }}
                    >
                      <div className="dash-subcard-label">💬 Ghi chú xử lý</div>
                      <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: '#475569' }}>
                        {r.reviewNote}
                      </div>
                    </div>
                  )}

                  {r.status === 'PENDING' && (
                    <div
                      style={{
                        display: 'flex',
                        gap: '0.75rem',
                        marginTop: '0.75rem',
                        justifyContent: 'flex-end',
                        flexWrap: 'wrap',
                      }}
                    >
                      <Button
                        variant="danger"
                        size="sm"
                        icon="❌"
                        onClick={() => openReview(r, 'REJECTED')}
                      >
                        Từ chối
                      </Button>
                      <Button
                        variant="success"
                        size="sm"
                        icon="✅"
                        onClick={() => openReview(r, 'APPROVED')}
                      >
                        Duyệt yêu cầu
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal duyệt / từ chối ── */}
      <Modal
        isOpen={!!reviewTarget}
        onClose={() => (isReviewing ? undefined : setReviewTarget(null))}
        title={reviewStatus === 'APPROVED' ? 'Duyệt yêu cầu' : 'Từ chối yêu cầu'}
        icon={reviewStatus === 'APPROVED' ? '✅' : '❌'}
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setReviewTarget(null)}
              disabled={isReviewing}
            >
              Hủy
            </Button>
            <Button
              variant={reviewStatus === 'APPROVED' ? 'success' : 'danger'}
              onClick={handleReview}
              loading={isReviewing}
            >
              {reviewStatus === 'APPROVED' ? 'Xác nhận duyệt' : 'Xác nhận từ chối'}
            </Button>
          </>
        }
      >
        {reviewError && (
          <div
            style={{
              background: 'rgba(239,68,68,0.1)',
              borderRadius: '8px',
              padding: '0.75rem',
              marginBottom: '1rem',
              color: '#ef4444',
              fontSize: '0.9rem',
            }}
          >
            ⚠️ {reviewError}
          </div>
        )}

        <div
          style={{
            background: 'var(--dash-card-subtle)',
            borderRadius: '8px',
            padding: '0.85rem',
            marginBottom: '1rem',
            fontSize: '0.9rem',
            color: '#475569',
            lineHeight: 1.7,
          }}
        >
          <div>
            <strong>Học viên:</strong> {(reviewTarget?.student as any)?.fullName || '—'}
          </div>
          {reviewTarget?.requestType === 'CLASS_CHANGE' && (
            <div>
              <strong>Chuyển từ:</strong>{' '}
              {(reviewTarget?.currentClass as any)?.classCode || '—'} →{' '}
              <strong>{(reviewTarget?.targetClass as any)?.classCode || '—'}</strong>
            </div>
          )}
          {reviewTarget?.requestType === 'SCHEDULE_CHANGE' && (
            <div>
              <strong>Lịch:</strong> {reviewTarget?.currentSchedule || '—'} →{' '}
              {reviewTarget?.targetSchedule || '—'}
            </div>
          )}
          <div>
            <strong>Lý do:</strong> {reviewTarget?.reason}
          </div>
        </div>

        {reviewStatus === 'APPROVED' && reviewTarget?.requestType === 'CLASS_CHANGE' && (
          <div
            style={{
              background: 'rgba(245,158,11,0.1)',
              borderRadius: '8px',
              padding: '0.75rem',
              marginBottom: '1rem',
              fontSize: '0.85rem',
              color: '#b45309',
              lineHeight: 1.6,
            }}
          >
            ⚠️ Khi duyệt, hệ thống sẽ <strong>tự động chuyển enrollment</strong> của
            học viên sang lớp đích và cập nhật sĩ số hai lớp. Học phí của lớp mới
            được đặt về <strong>Chưa thanh toán</strong>.
          </div>
        )}

        <div>
          <label className="dash-subcard-label">
            Ghi chú {reviewStatus === 'REJECTED' ? '*' : '(không bắt buộc)'}
          </label>
          <textarea
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder={
              reviewStatus === 'REJECTED'
                ? 'Nêu rõ lý do từ chối để học viên hiểu và gửi yêu cầu khác...'
                : 'Ghi chú cho học viên (nếu có)...'
            }
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              fontSize: '0.9rem',
              marginTop: '0.25rem',
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
          />
        </div>
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

export default RequestsManagementPage;
