import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { studentService } from '../../services/student.service';
import { useToast } from '../../contexts/ToastContext';
import type {
  ChangeRequest,
  ChangeRequestStatus,
  RequestType,
  CreateChangeRequestInput,
  Enrollment,
  OpenClass,
} from '../../types';
import { Button } from '../../components/Button';
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

const RequestsPage: React.FC = () => {
  const toast = useToast();
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  /** Danh mục lớp đích — dùng để chọn lớp đích khi yêu cầu đổi lớp. */
  const [openClasses, setOpenClasses] = useState<OpenClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('ALL');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<CreateChangeRequestInput>({
    requestType: 'CLASS_CHANGE',
    reason: '',
    currentClass: '',
    targetClass: '',
    currentSchedule: '',
    targetSchedule: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
    studentService
      .getMyClasses()
      .then((res) => {
        if (res.success && res.data) setEnrollments(res.data.classes || []);
      })
      .catch(() => {});
    // Lấy danh mục lớp đích để học viên chọn được lớp muốn chuyển sang.
    // Trước đây dropdown chỉ có lớp đang học nên không thể gửi yêu cầu đổi
    // lớp hợp lệ.
    //
    // Dùng endpoint `/student/transfer-target-classes` (không phải
    // `open-classes`): yêu cầu đổi lớp giữa kỳ cần chọn được lớp ĐANG CHẠY
    // (`IN_PROGRESS`), còn `open-classes` chỉ có lớp chưa bắt đầu.
    studentService
      .getTransferTargetClasses()
      .then((res) => {
        if (res.success && res.data) {
          setOpenClasses(res.data.classes || []);
        }
      })
      .catch(() => {});
  }, []);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const res = await studentService.getChangeRequests();
      if (res.success && res.data) setRequests(res.data.requests);
      else toast.error(res.message || 'Không thể tải yêu cầu');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể tải yêu cầu');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      requestType: 'CLASS_CHANGE',
      reason: '',
      currentClass: '',
      targetClass: '',
      currentSchedule: '',
      targetSchedule: '',
    });
    setFormError(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.reason.trim() || form.reason.trim().length < 5) {
      setFormError('Lý do phải có ít nhất 5 ký tự');
      return;
    }
    if (!form.currentClass) {
      setFormError('Vui lòng chọn lớp học hiện tại');
      return;
    }
    if (form.requestType === 'SCHEDULE_CHANGE' && !form.targetSchedule?.trim()) {
      setFormError('Vui lòng nhập lịch học mong muốn');
      return;
    }
    // Yêu cầu đổi lớp bắt buộc có lớp đích (backend cũng kiểm tra lại).
    if (form.requestType === 'CLASS_CHANGE' && !form.targetClass) {
      setFormError('Vui lòng chọn lớp học mong muốn chuyển sang');
      return;
    }
    try {
      setSubmitting(true);
      setFormError(null);
      const res = await studentService.createChangeRequest(form);
      if (res.success) {
        toast.success(res.message || 'Tạo yêu cầu thành công');
        setShowForm(false);
        resetForm();
        await fetchRequests();
      } else {
        setFormError(res.message || 'Tạo yêu cầu thất bại');
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Tạo yêu cầu thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn hủy yêu cầu này? Hành động này không thể hoàn tác.')) {
      return;
    }
    try {
      setCancellingId(id);
      const res = await studentService.cancelChangeRequest(id);
      if (res.success) {
        toast.success('Đã hủy yêu cầu thành công');
        await fetchRequests();
      } else {
        toast.error(res.message || 'Hủy yêu cầu thất bại');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Hủy yêu cầu thất bại');
    } finally {
      setCancellingId(null);
    }
  };

  const filtered = requests.filter((r) => filter === 'ALL' || r.status === filter);

  if (isLoading) return <SkeletonPage message="Đang tải yêu cầu..." />;

  const tabs: { key: FilterKey; label: string; count: number }[] = [
    { key: 'ALL', label: 'Tất cả', count: requests.length },
    { key: 'PENDING', label: '⏳ Chờ duyệt', count: requests.filter((r) => r.status === 'PENDING').length },
    { key: 'APPROVED', label: '✅ Đã duyệt', count: requests.filter((r) => r.status === 'APPROVED').length },
    { key: 'REJECTED', label: '❌ Từ chối', count: requests.filter((r) => r.status === 'REJECTED').length },
  ];

  const showScheduleFields = form.requestType === 'SCHEDULE_CHANGE';
  const showTargetClass = form.requestType === 'CLASS_CHANGE';

  return (
    <div className="dash-container">
      <div className="dash-banner">
        <div className="dash-banner-content">
          <div className="dash-banner-badge">🔄 Yêu Cầu</div>
          <h1>Yêu Cầu Thay Đổi</h1>
          <p>
            {requests.length > 0
              ? `${requests.filter((r) => r.status === 'PENDING').length} yêu cầu đang chờ duyệt`
              : 'Gửi yêu cầu thay đổi lớp, lịch học hoặc rút khỏi lớp.'}
          </p>
        </div>
        <div className="dash-banner-right">
          <div className="dash-date-pill">
            <div>🔄 {requests.length} yêu cầu</div>
            <div className="sub">{requests.filter((r) => r.status === 'PENDING').length} đang chờ</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <Link to="/student/dashboard" className="dash-quick-btn" style={{ textDecoration: 'none' }}>
          ← Dashboard
        </Link>
        <Link to="/student/classes" className="dash-quick-btn" style={{ textDecoration: 'none' }}>
          📚 Lớp Học
        </Link>
        <Link to="/student/tuition" className="dash-quick-btn" style={{ textDecoration: 'none' }}>
          💳 Thanh Toán
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
                {requests.filter((r) => r.status === 'PENDING').length}
              </span>
              <span className="dash-metric-trend">Đang chờ nhân viên xử lý</span>
            </div>
            <div className="dash-metric-icon icon-amber">⏳</div>
          </div>
          <div className="dash-metric-card">
            <div className="dash-metric-info">
              <span className="dash-metric-label">Đã duyệt</span>
              <span className="dash-metric-val" style={{ color: '#10b981' }}>
                {requests.filter((r) => r.status === 'APPROVED').length}
              </span>
              <span className="dash-metric-trend up">
                {requests.filter((r) => r.status === 'REJECTED').length} bị từ chối
              </span>
            </div>
            <div className="dash-metric-icon icon-emerald">✅</div>
          </div>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`dash-quick-btn ${filter === tab.key ? 'primary' : ''}`}
              style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
        <Button variant="primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? '✕ Đóng' : '➕ Tạo Yêu Cầu Mới'}
        </Button>
      </div>

      {showForm && (
        <div
          className="dash-card"
          style={{ marginBottom: '1.5rem', border: '2px solid rgba(59,130,246,0.4)' }}
        >
          <div className="dash-card-header">
            <h2 className="dash-card-title"><span>➕</span> Tạo Yêu Cầu Mới</h2>
          </div>
          <div className="dash-subcard">
            <form onSubmit={handleCreate}>
              {formError && (
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
                  ⚠️ {formError}
                </div>
              )}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1rem',
                }}
              >
<div>
                    <label className="dash-subcard-label">Loại yêu cầu *</label>
                    <select
                      value={form.requestType}
                      onChange={(e) =>
                        setForm({ ...form, requestType: e.target.value as RequestType })
                      }
                      style={inputStyle}
                    >
                      <option value="CLASS_CHANGE">🔄 Đổi lớp</option>
                      <option value="SCHEDULE_CHANGE">🗓️ Đổi lịch học</option>
                    </select>
                  </div>
                  <div>
                    <label className="dash-subcard-label">Lớp học hiện tại *</label>
                    <select
                      value={form.currentClass || ''}
                      onChange={(e) => {
                        const clsId = e.target.value;
                        const enrolled = enrollments.find((e2) => e2.class?._id === clsId);
                        setForm({
                          ...form,
                          currentClass: clsId,
                          currentSchedule: enrolled?.class?.timeSlot || '',
                        });
                      }}
                      style={inputStyle}
                    >
                      <option value="">-- Chọn lớp --</option>
                      {enrollments.map((e2) => (
                        <option key={e2.class?._id} value={e2.class?._id}>
                          {e2.class?.classCode} - {e2.class?.course?.code}
                        </option>
                      ))}
                    </select>
                  </div>
                  {showTargetClass && (
                    <div>
                      <label className="dash-subcard-label">Lớp mong muốn *</label>
                      <select
                        value={form.targetClass || ''}
                        onChange={(e) => setForm({ ...form, targetClass: e.target.value })}
                        style={inputStyle}
                      >
                        <option value="">-- Chọn lớp mong muốn --</option>
                        {openClasses
                          .filter((c) => c._id !== form.currentClass)
                          .map((c) => (
                            <option key={c._id} value={c._id}>
                              {c.classCode} - {c.course?.code} - {c.course?.title}
                            </option>
                          ))}
                      </select>
                      <p style={{ margin: '0.35rem 0 0', color: '#94a3b8', fontSize: '0.72rem' }}>
                        Hiển thị các lớp còn hoạt động và còn chỗ trống (kể cả lớp
                        đang chạy). Phòng giáo vụ sẽ xử lý việc chuyển lớp khi duyệt
                        yêu cầu.
                      </p>
                    </div>
                  )}
                  {showScheduleFields && (
                    <>
                      <div>
                        <label className="dash-subcard-label">Lịch học hiện tại</label>
                        <input
                          type="text"
                          value={form.currentSchedule || ''}
                          onChange={(e) => setForm({ ...form, currentSchedule: e.target.value })}
                          placeholder="VD: Thứ 2,4,6 - 18:30-20:30"
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label className="dash-subcard-label">Lịch học mong muốn *</label>
                        <input
                          type="text"
                          value={form.targetSchedule || ''}
                          onChange={(e) => setForm({ ...form, targetSchedule: e.target.value })}
                          placeholder="VD: Thứ 3,5,7 - 19:00-21:00"
                          style={inputStyle}
                        />
                      </div>
                    </>
                  )}
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label className="dash-subcard-label">Lý do * (tối thiểu 5 ký tự)</label>
                <textarea
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="Mô tả chi tiết lý do bạn muốn thay đổi..."
                  rows={4}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Button type="submit" variant="primary" loading={submitting} icon="📤">
                  Gửi Yêu Cầu
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                >
                  Hủy
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon="📭"
          title="Không có yêu cầu nào"
          description={
            filter !== 'ALL'
              ? 'Không có yêu cầu nào phù hợp với bộ lọc.'
              : 'Bạn chưa gửi yêu cầu nào.'
          }
          action={
            filter === 'ALL' && !showForm ? (
              <Button variant="primary" onClick={() => setShowForm(true)}>
                ➕ Tạo Yêu Cầu Đầu Tiên
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map((r) => {
            const status = requestStatusMeta(r.status);
            const type = typeCfg(r.requestType);
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
                    <Field label="Loại yêu cầu" value={type.label} />
                    {currentCode && <Field label="Lớp hiện tại" value={currentCode} />}
                    {targetCode && <Field label="Lớp mong muốn" value={targetCode} />}
                    {r.currentSchedule && <Field label="Lịch hiện tại" value={r.currentSchedule} />}
                    {r.targetSchedule && <Field label="Lịch mong muốn" value={r.targetSchedule} />}
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
                      <div className="dash-subcard-label">💬 Phản hồi từ nhân viên</div>
                      <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: '#475569' }}>
                        {r.reviewNote}
                      </div>
                    </div>
                  )}

                  {r.status === 'PENDING' && (
                    <div
                      style={{
                        display: 'flex',
                        gap: '0.5rem',
                        marginTop: '0.75rem',
                        justifyContent: 'flex-end',
                      }}
                    >
                      <Button
                        variant="secondary"
                        onClick={() => handleCancel(r._id)}
                        loading={cancellingId === r._id}
                        icon="🗑️"
                      >
                        Hủy yêu cầu
                      </Button>
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

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.6rem 0.75rem',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
  fontSize: '0.9rem',
  marginTop: '0.25rem',
  fontFamily: 'inherit',
};

const Field: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div>
    <div className="dash-subcard-label">{label}</div>
    <div className="dash-subcard-value">{value || '—'}</div>
  </div>
);

export default RequestsPage;
