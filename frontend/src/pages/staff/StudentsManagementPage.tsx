import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { staffManagementService } from '../../services/staff-management.service';
import type { ManagedStudent } from '../../types';

const PAGE_SIZE = 10;
const formatDate = (value?: string) => value ? new Date(value).toLocaleDateString('vi-VN') : '—';

const StudentsManagementPage: React.FC = () => {
  const [students, setStudents] = useState<ManagedStudent[]>([]);
  const [classes, setClasses] = useState<{ _id: string; classCode: string; course: { code: string; title: string } | null }[]>([]);
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [classId, setClassId] = useState('');
  const [completion, setCompletion] = useState<'' | 'COMPLETED' | 'IN_PROGRESS'>('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [optionsError, setOptionsError] = useState('');
  const [updatingId, setUpdatingId] = useState('');
  const [notice, setNotice] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [confirmingStudent, setConfirmingStudent] = useState<ManagedStudent | null>(null);

  useEffect(() => {
    let cancelled = false;
    void staffManagementService.getStudentOptions()
      .then((response) => {
        if (cancelled) return;
        setClasses(response.data?.classes ?? []);
        setOptionsError('');
      })
      .catch(() => {
        if (!cancelled) setOptionsError('Không tải được danh sách lớp dùng để lọc.');
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void staffManagementService.getStudents({
      search,
      fromDate,
      toDate,
      classId,
      completion,
      page,
      limit: PAGE_SIZE,
    }).then((response) => {
      if (cancelled) return;
      setStudents(response.data);
      setTotal(response.pagination.total);
      setError('');
    }).catch((requestError: unknown) => {
      if (cancelled) return;
      const message = (requestError as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(message ?? 'Không tải được danh sách học viên.');
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [search, fromDate, toDate, classId, completion, page, reloadKey]);

  const setFilter = (update: () => void) => {
    setLoading(true);
    setPage(1);
    update();
  };

  const toggleStatus = async (student: ManagedStudent) => {
    const nextStatus = student.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    setUpdatingId(student._id);
    setNotice('');
    try {
      await staffManagementService.updateAccountStatus(student._id, nextStatus);
      setStudents((current) => current.map((item) => item._id === student._id ? { ...item, status: nextStatus } : item));
      setNotice(`Đã ${nextStatus === 'ACTIVE' ? 'mở hoạt động' : 'đình chỉ'} tài khoản ${student.fullName}.`);
    } catch (requestError) {
      const message = (requestError as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(message ?? 'Không thể cập nhật trạng thái tài khoản.');
    } finally {
      setUpdatingId('');
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="courses-page">
      <nav className="staff-breadcrumb" aria-label="Breadcrumb">
        <Link to="/staff/dashboard">Tổng quan</Link><span className="breadcrumb-sep">›</span><span>Quản lý học viên</span>
      </nav>
      <div className="courses-page-header">
        <div>
          <h1 className="courses-page-title">Quản lý học viên</h1>
          <p className="courses-page-subtitle">Tra cứu tài khoản, tình trạng học tập và lớp đã đăng ký</p>
        </div>
      </div>

      {optionsError && <div className="form-error-banner" role="alert">{optionsError}</div>}
      {notice && <div className="form-hint" role="status">{notice}</div>}
      {error && <div className="form-error-banner" role="alert">{error}</div>}
      <div className="courses-filter-bar">
        <div className="courses-search-wrap">
          <input
            className="form-input courses-search-input"
            placeholder="Tìm tên, email, số điện thoại hoặc mã học viên"
            value={search}
            onChange={(event) => setFilter(() => setSearch(event.target.value))}
          />
        </div>
        <label className="form-label">Đăng ký từ <input className="form-input" type="date" value={fromDate} onChange={(event) => setFilter(() => setFromDate(event.target.value))} /></label>
        <label className="form-label">Đến <input className="form-input" type="date" value={toDate} onChange={(event) => setFilter(() => setToDate(event.target.value))} /></label>
        <select className="form-input courses-filter-select" value={classId} onChange={(event) => setFilter(() => setClassId(event.target.value))}>
          <option value="">Tất cả lớp</option>
          {classes.map((item) => <option key={item._id} value={item._id}>{item.classCode}{item.course ? ` · ${item.course.code}` : ''}</option>)}
        </select>
        <select className="form-input courses-filter-select" value={completion} onChange={(event) => setFilter(() => {
          const value = event.target.value;
          if (value === '' || value === 'COMPLETED' || value === 'IN_PROGRESS') setCompletion(value);
        })}>
          <option value="">Mọi tình trạng học</option>
          <option value="IN_PROGRESS">Đang học / chưa hoàn thành</option>
          <option value="COMPLETED">Đã hoàn thành lớp</option>
        </select>
        <span className="courses-total-badge">{total} học viên</span>
      </div>

      <div className="courses-table-wrap class-table-wrap">
        {loading ? (
          <div className="courses-loading"><div className="loading-spinner" /><p>Đang tải học viên…</p></div>
        ) : students.length === 0 ? (
          <div className="courses-empty"><h3>Không có học viên phù hợp</h3><p>Thử thay đổi từ khóa hoặc bộ lọc.</p></div>
        ) : (
          <table className="courses-table" aria-label="Danh sách học viên">
            <thead><tr><th>Học viên</th><th>Mã HV</th><th>Ngày đăng ký</th><th>Lớp đang học</th><th>Đã hoàn thành</th><th>Tài khoản</th><th>Thao tác</th></tr></thead>
            <tbody>
              {students.map((student) => (
                <tr key={student._id} className="courses-table-row">
                  <td>
                    <div className="course-title-cell">
                      <Link to={`/staff/students/${student._id}`}><strong>{student.fullName}</strong></Link>
                      <span className="course-desc-preview">{student.email}{student.phone ? ` · ${student.phone}` : ''}</span>
                    </div>
                  </td>
                  <td>{student.profile?.studentCode ?? '—'}</td>
                  <td>{formatDate(student.createdAt)}</td>
                  <td>{student.activeClasses}</td>
                  <td>{student.completedClasses}</td>
                  <td><span className={`course-status-badge ${student.status === 'ACTIVE' ? 'badge-active' : 'badge-inactive'}`}>{student.status === 'ACTIVE' ? 'Đang hoạt động' : student.status === 'SUSPENDED' ? 'Đình chỉ' : 'Ngừng hoạt động'}</span></td>
                  <td>
                    <button
                      className="btn btn-danger-outline btn-sm"
                      disabled={updatingId === student._id}
                      onClick={() => setConfirmingStudent(student)}
                    >
                      {updatingId === student._id ? 'Đang cập nhật…' : student.status === 'SUSPENDED' ? 'Mở tài khoản' : 'Đình chỉ'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {totalPages > 1 && (
        <div className="courses-pagination" role="navigation" aria-label="Phân trang học viên">
          <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => { setLoading(true); setPage((value) => value - 1); }}>← Trước</button>
          <span className="pagination-info">Trang {page} / {totalPages}</span>
          <button className="btn btn-outline btn-sm" disabled={page >= totalPages} onClick={() => { setLoading(true); setPage((value) => value + 1); }}>Sau →</button>
        </div>
      )}
      {!loading && error && <button className="btn btn-outline" onClick={() => { setLoading(true); setReloadKey((value) => value + 1); }}>Thử tải lại</button>}
      {confirmingStudent && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="student-status-confirm-title">
          <div className="modal-box modal-sm">
            <h2 className="modal-title" id="student-status-confirm-title">
              {confirmingStudent.status === 'SUSPENDED' ? 'Mở lại tài khoản học viên?' : 'Đình chỉ tài khoản học viên?'}
            </h2>
            <p className="modal-desc">
              {confirmingStudent.status === 'SUSPENDED'
                ? <>Tài khoản của <strong>{confirmingStudent.fullName}</strong> sẽ được phép đăng nhập và sử dụng hệ thống trở lại.</>
                : <>Tài khoản của <strong>{confirmingStudent.fullName}</strong> sẽ không thể đăng nhập cho đến khi được mở lại.</>}
            </p>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setConfirmingStudent(null)} disabled={updatingId === confirmingStudent._id}>Hủy</button>
              <button
                className={`btn ${confirmingStudent.status === 'SUSPENDED' ? 'btn-primary' : 'btn-danger'}`}
                disabled={updatingId === confirmingStudent._id}
                onClick={() => {
                  const target = confirmingStudent;
                  setConfirmingStudent(null);
                  void toggleStatus(target);
                }}
              >
                {updatingId === confirmingStudent._id
                  ? 'Đang cập nhật…'
                  : confirmingStudent.status === 'SUSPENDED'
                    ? 'Mở tài khoản'
                    : 'Xác nhận đình chỉ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsManagementPage;
