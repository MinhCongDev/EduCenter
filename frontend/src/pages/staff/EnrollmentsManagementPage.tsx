import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { enrollmentService } from '../../services/enrollment.service';
import type {
  EnrollmentOptions,
  EnrollmentRecord,
  EnrollmentStatus,
  PaymentRecordStatus,
} from '../../types';

const ENROLLMENT_STATUS: Record<EnrollmentStatus, string> = {
  PENDING: 'Chờ xử lý',
  ENROLLED: 'Đã ghi danh',
  DROPPED: 'Đã hủy',
  COMPLETED: 'Hoàn thành',
};

const PAYMENT_STATUS: Record<PaymentRecordStatus, string> = {
  PENDING: 'Chờ thanh toán',
  SUCCESS: 'Đã thanh toán',
  FAILED: 'Thanh toán thất bại',
  REFUNDED: 'Đã hoàn tiền',
};

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('vi-VN');
};
const formatCurrency = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

const paymentBadgeClass = (status?: PaymentRecordStatus) => {
  if (status === 'SUCCESS') return 'badge-active';
  if (status === 'FAILED' || status === 'REFUNDED') return 'badge-inactive';
  return 'class-status-open';
};

const enrollmentBadgeClass = (status: EnrollmentStatus) => {
  if (status === 'ENROLLED' || status === 'COMPLETED') return 'badge-active';
  if (status === 'DROPPED') return 'class-status-cancelled';
  return 'class-status-open';
};

const EnrollmentDetailModal: React.FC<{
  enrollment: EnrollmentRecord;
  classes: EnrollmentOptions['classes'];
  onClose: () => void;
  onAssignClass: (classId: string) => void;
  assigning: boolean;
  assignmentError: string;
  assignmentMessage: string;
}> = ({ enrollment, classes, onClose, onAssignClass, assigning, assignmentError, assignmentMessage }) => {
  const [selectedClassId, setSelectedClassId] = useState(enrollment.class?._id ?? '');
  const availableClasses = classes.filter((classItem) =>
    classItem.course?._id === enrollment.course?._id
    && (
      classItem._id === enrollment.class?._id
      || ((classItem.status === 'OPEN' || classItem.status === 'IN_PROGRESS')
        && (classItem.currentEnrollment ?? 0) < classItem.capacity)
    )
  );
  const canAssign = enrollment.status !== 'DROPPED' && enrollment.status !== 'COMPLETED';
  const alreadyAssigned = enrollment.class !== undefined
    && enrollment.class !== null
    && selectedClassId === enrollment.class._id;

  return (
  <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Chi tiết ghi danh">
    <div className="modal-box modal-lg enrollment-detail-modal">
      <div className="modal-header">
        <div>
          <h2 className="modal-title">Chi tiết ghi danh</h2>
          <p className="modal-subtitle">ID ghi danh: {enrollment._id}</p>
        </div>
        <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Đóng">✕</button>
      </div>
      <div className="enrollment-detail-grid">
        <div><span>Học viên</span><strong>{enrollment.student?.fullName ?? 'Không có dữ liệu'}</strong></div>
        <div><span>Mã học viên</span><strong>{enrollment.studentProfile?.studentCode ?? 'Chưa có mã học viên'}</strong></div>
        <div><span>Email</span><strong>{enrollment.student?.email ?? '—'}</strong></div>
        <div><span>Số điện thoại</span><strong>{enrollment.student?.phone || '—'}</strong></div>
        <div><span>Khóa học</span><strong>{enrollment.course?.title ?? 'Chưa có thông tin khóa học'}</strong></div>
        <div><span>Chuẩn đầu vào</span><strong>{enrollment.course?.entryLevel || '—'}</strong></div>
        <div><span>Trình độ học viên</span><strong>{enrollment.studentProfile?.currentBand ? `Band ${enrollment.studentProfile.currentBand}` : 'Chưa có điểm Band'}</strong></div>
        <div><span>Học phí khóa học</span><strong>{enrollment.course ? formatCurrency(enrollment.course.tuitionFee) : '—'}</strong></div>
        <div><span>Lớp học</span><strong>{enrollment.class?.classCode ?? 'Chưa được xếp lớp'}</strong></div>
        <div><span>Ngày ghi danh</span><strong>{formatDate(enrollment.registrationDate)}</strong></div>
        <div>
          <span>Trạng thái ghi danh</span>
          <strong><span className={`course-status-badge ${enrollmentBadgeClass(enrollment.status)}`}>{ENROLLMENT_STATUS[enrollment.status]}</span></strong>
        </div>
      </div>

      <section className="enrollment-class-assignment">
        <h3 className="enrollment-payment-heading">Xếp lớp theo trình độ</h3>

        {/* Level matching advisory */}
        {enrollment.course?.entryLevel && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              marginBottom: '14px',
              fontSize: '0.85rem',
              backgroundColor:
                (enrollment.studentProfile?.currentBand ?? 0) >= 5.0
                  ? '#f0fdf4'
                  : enrollment.studentProfile?.currentBand
                  ? '#fffbeb'
                  : '#f8fafc',
              border:
                (enrollment.studentProfile?.currentBand ?? 0) >= 5.0
                  ? '1px solid #bbf7d0'
                  : enrollment.studentProfile?.currentBand
                  ? '1px solid #fde68a'
                  : '1px solid #e2e8f0',
              color:
                (enrollment.studentProfile?.currentBand ?? 0) >= 5.0
                  ? '#166534'
                  : enrollment.studentProfile?.currentBand
                  ? '#92400e'
                  : '#475569',
            }}
          >
            <strong>🎯 Đánh giá trình độ xếp lớp:</strong>
            <div style={{ marginTop: '4px', lineHeight: 1.4 }}>
              • Chuẩn đầu vào khóa học: <strong>{enrollment.course.entryLevel}</strong>
              <br />
              • Band điểm học viên: <strong>{enrollment.studentProfile?.currentBand ? `Band ${enrollment.studentProfile.currentBand}` : 'Chưa kiểm tra đầu vào'}</strong>
              {enrollment.studentProfile?.placementTestScore !== undefined && (
                <span> (Điểm Test: Band {enrollment.studentProfile.placementTestScore})</span>
              )}
            </div>
          </div>
        )}
        {enrollment.course ? (
          <>
            <label className="form-label" htmlFor="enrollment-class-select">Lớp thuộc khóa học {enrollment.course.code}</label>
            <select
              id="enrollment-class-select"
              className="form-input"
              value={selectedClassId}
              disabled={!canAssign || assigning}
              onChange={(event) => {
                setSelectedClassId(event.target.value);
              }}
            >
              <option value="">Chọn lớp học</option>
              {availableClasses.map((classItem) => (
                <option key={classItem._id} value={classItem._id}>
                  {classItem.classCode} ({classItem.currentEnrollment ?? 0}/{classItem.capacity} học viên)
                </option>
              ))}
            </select>
            {!availableClasses.length && <p className="form-hint">Khóa học này hiện chưa có lớp còn chỗ để xếp.</p>}
            {selectedClassId === enrollment.class?._id && enrollment.class && (
              <p className="form-hint">Học viên hiện đã được xếp vào lớp này.</p>
            )}
            {!canAssign && <p className="form-hint">Ghi danh đã hủy hoặc hoàn thành nên không thể thay đổi lớp.</p>}
            {assignmentError && <div className="form-error-banner" role="alert">{assignmentError}</div>}
            {assignmentMessage && <p className="form-hint" role="status">{assignmentMessage}</p>}
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-primary"
                disabled={!canAssign || assigning || !selectedClassId || selectedClassId === enrollment.class?._id}
                onClick={() => onAssignClass(selectedClassId)}
              >
                {assigning
                  ? 'Đang lưu…'
                  : alreadyAssigned
                    ? 'Đã xếp lớp'
                    : enrollment.class
                      ? 'Chuyển lớp'
                      : 'Xếp lớp'}
              </button>
            </div>
          </>
        ) : (
          <p className="form-hint">Không xác định được khóa học đã đăng ký nên chưa thể chọn lớp.</p>
        )}
      </section>

      <h3 className="enrollment-payment-heading">Thanh toán liên quan</h3>
      {enrollment.payments.length === 0 ? (
        <div className="enrollment-no-payment">Chưa có bản ghi thanh toán cho ghi danh này.</div>
      ) : (
        <div className="courses-table-wrap class-table-wrap">
          <table className="courses-table">
            <thead><tr><th>Mã giao dịch</th><th>Số tiền</th><th>Phương thức</th><th>Ngày</th><th>Trạng thái</th></tr></thead>
            <tbody>
              {enrollment.payments.map((payment) => (
                <tr key={payment._id} className="courses-table-row">
                  <td>{payment.transactionCode}</td>
                  <td>{formatCurrency(payment.amount)}</td>
                  <td>{payment.method}</td>
                  <td>{formatDate(payment.paymentDate)}</td>
                  <td><span className={`course-status-badge ${paymentBadgeClass(payment.status)}`}>{PAYMENT_STATUS[payment.status]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="modal-footer">
        <button type="button" className="btn btn-outline" onClick={onClose}>Đóng</button>
      </div>
    </div>
  </div>
  );
};

const EnrollmentsManagementPage: React.FC = () => {
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([]);
  const [options, setOptions] = useState<EnrollmentOptions>({ courses: [], classes: [] });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [courseId, setCourseId] = useState('');
  const [classId, setClassId] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [optionsError, setOptionsError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentRecord | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [assigningClass, setAssigningClass] = useState(false);
  const [assignmentError, setAssignmentError] = useState('');
  const [assignmentMessage, setAssignmentMessage] = useState('');
  const limit = 10;

  useEffect(() => {
    void enrollmentService.getOptions().then((response) => {
      if (response.data) {
        setOptions(response.data);
        setOptionsError('');
      }
    }).catch(() => {
      setOptionsError('Không tải được danh sách khóa học/lớp để lọc.');
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const result = await enrollmentService.getEnrollments({
          search,
          status,
          paymentStatus,
          courseId,
          classId,
          page,
          limit,
        });
        if (!cancelled) {
          setEnrollments(result.data);
          setTotal(result.pagination.total);
          setError('');
        }
      } catch {
        if (!cancelled) setError('Không tải được danh sách ghi danh. Vui lòng thử lại.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [search, status, paymentStatus, courseId, classId, page, reloadKey]);

  const resetPage = () => {
    setLoading(true);
    setPage(1);
  };

  const openDetails = async (id: string) => {
    setDetailLoading(true);
    setDetailError('');
    setAssignmentError('');
    setAssignmentMessage('');
    try {
      const response = await enrollmentService.getEnrollment(id);
      if (!response.data) throw new Error('Không nhận được dữ liệu chi tiết ghi danh.');
      setSelectedEnrollment(response.data);
    } catch {
      setDetailError('Không tải được chi tiết ghi danh. Vui lòng thử lại.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAssignClass = async (classId: string) => {
    if (!selectedEnrollment) return;
    setAssigningClass(true);
    setAssignmentError('');
    setAssignmentMessage('');
    try {
      const classItem = options.classes.find((item) => item._id === classId);
      if (!classItem) throw new Error('Không tìm thấy thông tin lớp vừa chọn.');
      await enrollmentService.assignClass(selectedEnrollment._id, classId);
      const previousClassId = selectedEnrollment.class?._id;
      setOptions((current) => ({
        ...current,
        classes: current.classes.map((item) => {
          if (item._id === classId) return { ...item, currentEnrollment: item.currentEnrollment + 1 };
          if (item._id === previousClassId && item.currentEnrollment > 0) {
            return { ...item, currentEnrollment: item.currentEnrollment - 1 };
          }
          return item;
        }),
      }));
      setSelectedEnrollment((current) => current ? {
        ...current,
        class: {
          _id: classItem._id,
          classCode: classItem.classCode,
          name: classItem.name,
          startDate: classItem.startDate,
          endDate: classItem.endDate,
        },
      } : current);
      setAssignmentMessage('Đã xếp lớp cho học viên thành công.');
      setReloadKey((current) => current + 1);
    } catch (requestError) {
      const message = (requestError as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setAssignmentError(message || (requestError instanceof Error ? requestError.message : 'Không thể xếp lớp. Vui lòng thử lại.'));
    } finally {
      setAssigningClass(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="courses-page">
      <nav className="staff-breadcrumb" aria-label="Breadcrumb">
        <Link to="/staff/dashboard">Tổng quan</Link>
        <span className="breadcrumb-sep">›</span>
        <span>Quản lý ghi danh</span>
      </nav>

      <div className="courses-page-header">
        <div>
          <h1 className="courses-page-title">Quản lý ghi danh</h1>
          <p className="courses-page-subtitle">Tra cứu học viên, lớp đã xếp và tình trạng thanh toán</p>
        </div>
      </div>

      {optionsError && <div className="form-error-banner" role="alert">{optionsError}</div>}
      <div className="courses-filter-bar enrollment-filter-bar">
        <div className="courses-search-wrap">
          <input
            className="form-input courses-search-input"
            placeholder="Tìm mã học viên, tên hoặc email…"
            value={search}
            onChange={(event) => { resetPage(); setSearch(event.target.value); }}
          />
        </div>
        <select className="form-input courses-filter-select" value={courseId} onChange={(event) => { resetPage(); setCourseId(event.target.value); }}>
          <option value="">Tất cả khóa học</option>
          {options.courses.map((course) => <option key={course._id} value={course._id}>{course.code} - {course.title}</option>)}
        </select>
        <select className="form-input courses-filter-select" value={classId} onChange={(event) => { resetPage(); setClassId(event.target.value); }}>
          <option value="">Tất cả lớp</option>
          {options.classes.map((classItem) => <option key={classItem._id} value={classItem._id}>{classItem.classCode}</option>)}
        </select>
        <select className="form-input courses-filter-select" value={status} onChange={(event) => { resetPage(); setStatus(event.target.value); }}>
          <option value="">Mọi trạng thái ghi danh</option>
          {Object.entries(ENROLLMENT_STATUS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select className="form-input courses-filter-select" value={paymentStatus} onChange={(event) => { resetPage(); setPaymentStatus(event.target.value); }}>
          <option value="">Mọi trạng thái thanh toán</option>
          <option value="NONE">Chưa có thanh toán</option>
          {Object.entries(PAYMENT_STATUS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <span className="courses-total-badge">{total} ghi danh</span>
      </div>

      {error && !loading && (
        <div className="form-error-banner courses-error" role="alert">
          {error}
          <button className="btn btn-ghost" style={{ marginLeft: '1rem' }} onClick={() => { setLoading(true); setReloadKey((current) => current + 1); }}>Thử lại</button>
        </div>
      )}

      {detailError && <div className="form-error-banner" role="alert">{detailError}</div>}
      {detailLoading && <div className="courses-loading"><div className="loading-spinner" /><p>Đang tải chi tiết ghi danh…</p></div>}

      <div className="courses-table-wrap class-table-wrap">
        {loading ? (
          <div className="courses-loading"><div className="loading-spinner" /><p>Đang tải danh sách ghi danh…</p></div>
        ) : enrollments.length === 0 ? (
          <div className="courses-empty"><h3>Không có ghi danh phù hợp</h3><p>Thử thay đổi điều kiện tìm kiếm hoặc bộ lọc.</p></div>
        ) : (
          <table className="courses-table enrollment-table" aria-label="Danh sách ghi danh">
            <thead><tr><th>Mã ghi danh</th><th>Học viên</th><th>Khóa học</th><th>Trình độ / Chuẩn</th><th>Học phí</th><th>Lớp</th><th>Ngày đăng ký</th><th>Trạng thái ghi danh</th><th>Thanh toán gần nhất</th><th>Thao tác</th></tr></thead>
            <tbody>
              {enrollments.map((enrollment) => {
                const latestPayment = enrollment.payments[0];
                return (
                  <tr key={enrollment._id} className="courses-table-row">
                    <td><span className="course-code-chip">{enrollment._id}</span></td>
                    <td><div className="course-title-cell"><strong>{enrollment.student?.fullName ?? 'Không có dữ liệu'}</strong><span className="course-desc-preview">{enrollment.studentProfile?.studentCode ?? enrollment.student?.email ?? '—'}</span></div></td>
                    <td>{enrollment.course?.title ?? 'Chưa có thông tin'}</td>
                    <td>
                      <div style={{ fontSize: '0.82rem' }}>
                        <div>Band: <strong>{enrollment.studentProfile?.currentBand ?? '—'}</strong></div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Y/c: {enrollment.course?.entryLevel ?? '—'}</div>
                      </div>
                    </td>
                    <td>{enrollment.course ? formatCurrency(enrollment.course.tuitionFee) : '—'}</td>
                    <td>{enrollment.class?.classCode ?? 'Chưa xếp lớp'}</td>
                    <td>{formatDate(enrollment.registrationDate)}</td>
                    <td><span className={`course-status-badge ${enrollmentBadgeClass(enrollment.status)}`}>{ENROLLMENT_STATUS[enrollment.status]}</span></td>
                    <td>
                      {latestPayment ? (
                        <div className="course-title-cell">
                          <strong>{formatCurrency(latestPayment.amount)}</strong>
                          <span className={`course-status-badge ${paymentBadgeClass(latestPayment.status)}`}>{PAYMENT_STATUS[latestPayment.status]}</span>
                        </div>
                      ) : <span className="course-desc-preview">Chưa có thanh toán</span>}
                    </td>
                    <td><button className="btn btn-outline btn-sm" onClick={() => void openDetails(enrollment._id)}>Xem chi tiết</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="courses-pagination" role="navigation" aria-label="Phân trang">
          <button className="btn btn-outline btn-sm" onClick={() => { setLoading(true); setPage((current) => Math.max(1, current - 1)); }} disabled={page <= 1}>← Trước</button>
          <span className="pagination-info">Trang {page} / {totalPages}</span>
          <button className="btn btn-outline btn-sm" onClick={() => { setLoading(true); setPage((current) => Math.min(totalPages, current + 1)); }} disabled={page >= totalPages}>Sau →</button>
        </div>
      )}

      {selectedEnrollment && (
        <EnrollmentDetailModal
          key={`${selectedEnrollment._id}-${selectedEnrollment.class?._id ?? 'unassigned'}`}
          enrollment={selectedEnrollment}
          classes={options.classes}
          onClose={() => setSelectedEnrollment(null)}
          onAssignClass={(id) => void handleAssignClass(id)}
          assigning={assigningClass}
          assignmentError={assignmentError}
          assignmentMessage={assignmentMessage}
        />
      )}
    </div>
  );
};

export default EnrollmentsManagementPage;
