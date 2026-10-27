import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { staffManagementService } from '../../services/staff-management.service';
import type { ManagedTeacher } from '../../types';

const PAGE_SIZE = 10;

const TeachersManagementPage: React.FC = () => {
  const [teachers, setTeachers] = useState<ManagedTeacher[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState('');
  const [notice, setNotice] = useState('');
  const [confirmingTeacher, setConfirmingTeacher] = useState<ManagedTeacher | null>(null);

  useEffect(() => {
    let cancelled = false;
    void staffManagementService.getTeachers({ search, page, limit: PAGE_SIZE })
      .then((response) => {
        if (cancelled) return;
        setTeachers(response.data);
        setTotal(response.pagination.total);
        setError('');
      })
      .catch((requestError: unknown) => {
        if (cancelled) return;
        const message = (requestError as { response?: { data?: { message?: string } } })?.response?.data?.message;
        setError(message ?? 'Không tải được danh sách giảng viên.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [search, page]);

  const toggleStatus = async (teacher: ManagedTeacher) => {
    const nextStatus = teacher.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    setUpdatingId(teacher._id);
    setNotice('');
    try {
      await staffManagementService.updateAccountStatus(teacher._id, nextStatus);
      setTeachers((current) => current.map((item) => item._id === teacher._id ? { ...item, status: nextStatus } : item));
      setNotice(`Đã ${nextStatus === 'ACTIVE' ? 'mở hoạt động' : 'đình chỉ'} tài khoản ${teacher.fullName}.`);
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
        <Link to="/staff/dashboard">Tổng quan</Link><span className="breadcrumb-sep">›</span><span>Quản lý giảng viên</span>
      </nav>
      <div className="courses-page-header">
        <div>
          <h1 className="courses-page-title">Quản lý giảng viên</h1>
          <p className="courses-page-subtitle">Tra cứu giảng viên, lớp phụ trách và trạng thái tài khoản</p>
        </div>
      </div>
      <div className="courses-filter-bar">
        <div className="courses-search-wrap">
          <input
            className="form-input courses-search-input"
            placeholder="Tìm tên, email hoặc số điện thoại"
            value={search}
            onChange={(event) => { setLoading(true); setPage(1); setSearch(event.target.value); }}
          />
        </div>
        <span className="courses-total-badge">{total} giảng viên</span>
      </div>
      {notice && <div className="form-hint" role="status">{notice}</div>}
      {error && <div className="form-error-banner" role="alert">{error}</div>}
      <div className="courses-table-wrap class-table-wrap">
        {loading ? (
          <div className="courses-loading"><div className="loading-spinner" /><p>Đang tải giảng viên…</p></div>
        ) : teachers.length === 0 ? (
          <div className="courses-empty"><h3>Không có giảng viên phù hợp</h3><p>Thử từ khóa khác.</p></div>
        ) : (
          <table className="courses-table" aria-label="Danh sách giảng viên">
            <thead><tr><th>Giảng viên</th><th>Mã GV</th><th>Chuyên môn</th><th>Kinh nghiệm</th><th>Lớp phụ trách</th><th>Tài khoản</th><th>Thao tác</th></tr></thead>
            <tbody>
              {teachers.map((teacher) => (
                <tr className="courses-table-row" key={teacher._id}>
                  <td>
                    <div className="course-title-cell">
                      <Link to={`/staff/teachers/${teacher._id}`}><strong>{teacher.fullName}</strong></Link>
                      <span className="course-desc-preview">{teacher.email}{teacher.phone ? ` · ${teacher.phone}` : ''}</span>
                    </div>
                  </td>
                  <td>{teacher.profile?.teacherCode ?? '—'}</td>
                  <td>{teacher.profile?.specialization.join(', ') || '—'}</td>
                  <td>{teacher.profile?.yearsOfExperience ?? '—'} năm</td>
                  <td>{teacher.assignedClasses}</td>
                  <td><span className={`course-status-badge ${teacher.status === 'ACTIVE' ? 'badge-active' : 'badge-inactive'}`}>{teacher.status === 'ACTIVE' ? 'Đang hoạt động' : teacher.status === 'SUSPENDED' ? 'Đình chỉ' : 'Ngừng hoạt động'}</span></td>
                  <td><button
                    className="btn btn-danger-outline btn-sm"
                    disabled={updatingId === teacher._id}
                    onClick={() => setConfirmingTeacher(teacher)}
                  >
                    {updatingId === teacher._id ? 'Đang cập nhật…' : teacher.status === 'SUSPENDED' ? 'Mở tài khoản' : 'Đình chỉ'}
                  </button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {totalPages > 1 && (
        <div className="courses-pagination" role="navigation" aria-label="Phân trang giảng viên">
          <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => { setLoading(true); setPage((value) => value - 1); }}>← Trước</button>
          <span className="pagination-info">Trang {page} / {totalPages}</span>
          <button className="btn btn-outline btn-sm" disabled={page >= totalPages} onClick={() => { setLoading(true); setPage((value) => value + 1); }}>Sau →</button>
        </div>
      )}
      {!loading && error && <button className="btn btn-outline" onClick={() => setLoading(true)}>Thử tải lại</button>}
      {confirmingTeacher && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="teacher-status-confirm-title">
          <div className="modal-box modal-sm">
            <h2 className="modal-title" id="teacher-status-confirm-title">
              {confirmingTeacher.status === 'SUSPENDED' ? 'Mở lại tài khoản giảng viên?' : 'Đình chỉ tài khoản giảng viên?'}
            </h2>
            <p className="modal-desc">
              {confirmingTeacher.status === 'SUSPENDED'
                ? <>Tài khoản của <strong>{confirmingTeacher.fullName}</strong> sẽ được phép đăng nhập và sử dụng hệ thống trở lại.</>
                : <>Tài khoản của <strong>{confirmingTeacher.fullName}</strong> sẽ không thể đăng nhập cho đến khi được mở lại.</>}
            </p>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setConfirmingTeacher(null)} disabled={updatingId === confirmingTeacher._id}>Hủy</button>
              <button
                className={`btn ${confirmingTeacher.status === 'SUSPENDED' ? 'btn-primary' : 'btn-danger'}`}
                disabled={updatingId === confirmingTeacher._id}
                onClick={() => {
                  const target = confirmingTeacher;
                  setConfirmingTeacher(null);
                  void toggleStatus(target);
                }}
              >
                {updatingId === confirmingTeacher._id
                  ? 'Đang cập nhật…'
                  : confirmingTeacher.status === 'SUSPENDED'
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

export default TeachersManagementPage;
