import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { studentService } from '../../services/student.service';
import type { ChangeRequestItem } from '../../types';

const RequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<ChangeRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    requestType: 'CHANGE_CLASS' as 'CHANGE_CLASS' | 'CHANGE_SCHEDULE' | 'WITHDRAW',
    currentClass: '',
    targetClass: '',
    reason: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await studentService.getChangeRequests();
      if (res.success && res.data) setRequests(res.data.requests);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Không thể tải yêu cầu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.reason.trim()) {
      setFormError('Vui lòng nhập lý do yêu cầu');
      return;
    }
    try {
      setSubmitting(true);
      setFormError(null);
      await studentService.createChangeRequest(formData);
      await fetchRequests();
      setShowForm(false);
      setFormData({ requestType: 'CHANGE_CLASS', currentClass: '', targetClass: '', reason: '' });
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Tạo yêu cầu thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const statusConfig = (s: string) => {
    if (s === 'PENDING') return { label: 'Đang chờ', cls: 'badge-amber', icon: '⏳' };
    if (s === 'APPROVED') return { label: 'Đã duyệt', cls: 'badge-green', icon: '✅' };
    if (s === 'REJECTED') return { label: 'Từ chối', cls: 'badge-purple', icon: '❌' };
    return { label: s, cls: 'badge-amber', icon: '❓' };
  };

  const typeConfig = (t: string) => {
    if (t === 'CHANGE_CLASS') return { label: 'Đổi lớp', icon: '🔄' };
    if (t === 'CHANGE_SCHEDULE') return { label: 'Đổi lịch học', icon: '🗓️' };
    if (t === 'WITHDRAW') return { label: 'Rút khỏi lớp', icon: '🚪' };
    return { label: t, icon: '📋' };
  };

  const filtered = requests.filter(r => {
    if (filter === 'ALL') return true;
    return r.status === filter;
  });

  const filterTabs: { key: typeof filter; label: string }[] = [
    { key: 'ALL', label: `Tất cả (${requests.length})` },
    { key: 'PENDING', label: `⏳ Chờ duyệt (${requests.filter(r => r.status === 'PENDING').length})` },
    { key: 'APPROVED', label: `✅ Đã duyệt (${requests.filter(r => r.status === 'APPROVED').length})` },
    { key: 'REJECTED', label: `❌ Từ chối (${requests.filter(r => r.status === 'REJECTED').length})` },
  ];

  if (isLoading) {
    return (
      <div className="dash-container" style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p>Đang tải yêu cầu...</p>
      </div>
    );
  }

  return (
    <div className="dash-container">
      {/* ── Page Header ── */}
      <div className="dash-banner">
        <div className="dash-banner-content">
          <div className="dash-banner-badge">🔄 Yêu Cầu</div>
          <h1>Yêu Cầu Thay Đổi</h1>
          <p>
            {requests.length > 0
              ? `${requests.filter(r => r.status === 'PENDING').length} yêu cầu đang chờ duyệt`
              : 'Gửi yêu cầu thay đổi lớp, lịch học hoặc rút khỏi lớp.'}
          </p>
        </div>
        <div className="dash-banner-right">
          <div className="dash-date-pill">
            <div>🔄 {requests.length} yêu cầu</div>
            <div className="sub">{requests.filter(r => r.status === 'PENDING').length} đang chờ</div>
          </div>
        </div>
      </div>

      {/* ── Quick Nav ── */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <Link to="/student/dashboard" className="dash-quick-btn" style={{ textDecoration: 'none' }}>
          ← Dashboard
        </Link>
        <Link to="/student/classes" className="dash-quick-btn" style={{ textDecoration: 'none' }}>
          📚 Lớp Học
        </Link>
        <Link to="/student/payments" className="dash-quick-btn" style={{ textDecoration: 'none' }}>
          💳 Thanh Toán
        </Link>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(239,68,68,0.1)', borderRadius: '12px', marginBottom: '1.5rem' }}>
          <p style={{ color: '#ef4444', marginBottom: '0.75rem' }}>{error}</p>
          <button className="dash-quick-btn primary" onClick={fetchRequests}>Thử lại</button>
        </div>
      )}

      {/* ── Metrics ── */}
      {requests.length > 0 && (
        <div className="dash-metrics-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Tổng yêu cầu</span>
              <span className="dash-metric-val">{requests.length}</span>
              <span className="dash-metric-trend">
                {requests.filter(r => r.status === 'APPROVED').length} đã duyệt
              </span>
            </div>
            <div className="dash-metric-icon icon-blue">📋</div>
          </div>
          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Đang chờ duyệt</span>
              <span className="dash-metric-val" style={{ color: '#f59e0b' }}>
                {requests.filter(r => r.status === 'PENDING').length}
              </span>
              <span className="dash-metric-trend">
                Đang chờ nhân viên xử lý
              </span>
            </div>
            <div className="dash-metric-icon icon-amber">⏳</div>
          </div>
          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Đã duyệt</span>
              <span className="dash-metric-val" style={{ color: '#10b981' }}>
                {requests.filter(r => r.status === 'APPROVED').length}
              </span>
              <span className="dash-metric-trend up">
                {requests.filter(r => r.status === 'REJECTED').length} bị từ chối
              </span>
            </div>
            <div className="dash-metric-icon icon-emerald">✅</div>
          </div>
        </div>
      )}

      {/* ── Filter + New Request ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {filterTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`dash-quick-btn ${filter === tab.key ? 'primary' : ''}`}
              style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          className="dash-quick-btn primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '✕ Đóng' : '➕ Tạo Yêu Cầu Mới'}
        </button>
      </div>

      {/* ── New Request Form ── */}
      {showForm && (
        <div className="dash-card" style={{ marginBottom: '1.5rem', border: '2px solid rgba(59,130,246,0.4)' }}>
          <div className="dash-card-header">
            <h2 className="dash-card-title"><span>➕</span> Tạo Yêu Cầu Mới</h2>
          </div>
          <div className="dash-subcard">
            <form onSubmit={handleCreate}>
              {formError && (
                <div style={{ background: 'rgba(239,68,68,0.1)', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem', color: '#ef4444', fontSize: '0.9rem' }}>
                  ⚠️ {formError}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="dash-subcard-label">Loại yêu cầu *</label>
                  <select
                    value={formData.requestType}
                    onChange={e => setFormData({ ...formData, requestType: e.target.value as any })}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.9rem', marginTop: '0.25rem', fontFamily: 'inherit' }}
                  >
                    <option value="CHANGE_CLASS">🔄 Đổi lớp</option>
                    <option value="CHANGE_SCHEDULE">🗓️ Đổi lịch học</option>
                    <option value="WITHDRAW">🚪 Rút khỏi lớp</option>
                  </select>
                </div>
                <div>
                  <label className="dash-subcard-label">Lớp hiện tại (mã lớp)</label>
                  <input
                    type="text"
                    value={formData.currentClass}
                    onChange={e => setFormData({ ...formData, currentClass: e.target.value })}
                    placeholder="VD: IELTS-PRE-01"
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.9rem', marginTop: '0.25rem', fontFamily: 'inherit' }}
                  />
                </div>
                {(formData.requestType === 'CHANGE_CLASS' || formData.requestType === 'CHANGE_SCHEDULE') && (
                  <div>
                    <label className="dash-subcard-label">Lớp/Lịch mong muốn</label>
                    <input
                      type="text"
                      value={formData.targetClass}
                      onChange={e => setFormData({ ...formData, targetClass: e.target.value })}
                      placeholder="VD: IELTS-FOUND-02"
                      style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.9rem', marginTop: '0.25rem', fontFamily: 'inherit' }}
                    />
                  </div>
                )}
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label className="dash-subcard-label">Lý do *</label>
                <textarea
                  value={formData.reason}
                  onChange={e => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Mô tả chi tiết lý do bạn muốn thay đổi..."
                  required
                  rows={4}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.9rem', marginTop: '0.25rem', fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="submit" className="dash-quick-btn primary" disabled={submitting}>
                  {submitting ? '⏳ Đang gửi...' : '📤 Gửi Yêu Cầu'}
                </button>
                <button type="button" className="dash-quick-btn" onClick={() => setShowForm(false)}>
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Requests List ── */}
      {filtered.length === 0 && !isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--dash-card-subtle)', borderRadius: '16px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
          <h2>Không có yêu cầu nào</h2>
          <p style={{ opacity: 0.7, marginBottom: '1.5rem' }}>
            {filter !== 'ALL' ? 'Không có yêu cầu nào phù hợp với bộ lọc.' : 'Bạn chưa gửi yêu cầu nào.'}
          </p>
          {filter === 'ALL' && !showForm && (
            <button className="dash-quick-btn primary" onClick={() => setShowForm(true)}>
              ➕ Tạo Yêu Cầu Đầu Tiên
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map((r) => {
            const status = statusConfig(r.status);
            const type = typeConfig(r.type);
            return (
              <div key={r._id} className="dash-card">
                <div className="dash-card-header">
                  <h2 className="dash-card-title">
                    <span>{type.icon}</span>
                    {type.label}
                  </h2>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span className={`badge-pill ${status.cls}`}>
                      {status.icon} {status.label}
                    </span>
                  </div>
                </div>

                <div className="dash-subcard">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem 1.5rem', marginBottom: '0.75rem' }}>
                    <div>
                      <div className="dash-subcard-label">Loại yêu cầu</div>
                      <div className="dash-subcard-value">{type.label}</div>
                    </div>
                    {r.currentClass && (
                      <div>
                        <div className="dash-subcard-label">Lớp hiện tại</div>
                        <div className="dash-subcard-value">{r.currentClass}</div>
                      </div>
                    )}
                    {r.requestedClass && (
                      <div>
                        <div className="dash-subcard-label">Lớp mong muốn</div>
                        <div className="dash-subcard-value">{r.requestedClass}</div>
                      </div>
                    )}
                    <div>
                      <div className="dash-subcard-label">Ngày gửi</div>
                      <div className="dash-subcard-value">
                        {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                    {r.processedAt && (
                      <div>
                        <div className="dash-subcard-label">Ngày xử lý</div>
                        <div className="dash-subcard-value">
                          {new Date(r.processedAt).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ background: 'rgba(59,130,246,0.06)', borderRadius: '8px', padding: '0.75rem' }}>
                    <div className="dash-subcard-label">📝 Lý do</div>
                    <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: '#475569' }}>{r.reason}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RequestsPage;
