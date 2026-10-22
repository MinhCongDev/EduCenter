import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { classService } from '../../services/class.service';
import type { ClassOptions } from '../../services/class.service';
import type { ClassFormData, ClassStatus, TrainingClass } from '../../types';

const WEEK_DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
const EMPTY_FORM: ClassFormData = {
  classCode: '',
  course: '',
  teacher: '',
  room: '',
  scheduleDays: [],
  timeSlot: '',
  startDate: '',
  capacity: 20,
  status: 'OPEN',
};

const STATUS_LABELS: Record<ClassStatus, string> = {
  OPEN: 'Đang tuyển sinh',
  IN_PROGRESS: 'Đang diễn ra',
  COMPLETED: 'Đã hoàn thành',
  CANCELLED: 'Đã hủy',
};

const formatDate = (date: string) => new Date(date).toLocaleDateString('vi-VN');

interface ClassFormModalProps {
  classItem: TrainingClass | null;
  options: ClassOptions;
  onSave: (data: ClassFormData) => Promise<void>;
  onClose: () => void;
  saving: boolean;
  error: string;
}

const ClassFormModal: React.FC<ClassFormModalProps> = ({ classItem, options, onSave, onClose, saving, error }) => {
  const [form, setForm] = useState<ClassFormData>(
    classItem
      ? {
          classCode: classItem.classCode,
          course: classItem.course._id,
          teacher: classItem.teacher._id,
          room: classItem.room,
          scheduleDays: classItem.scheduleDays,
          timeSlot: classItem.timeSlot,
          startDate: classItem.startDate.slice(0, 10),
          capacity: classItem.capacity,
          status: classItem.status,
        }
      : { ...EMPTY_FORM, course: options.courses[0]?._id ?? '', teacher: options.teachers[0]?._id ?? '' }
  );

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: name === 'capacity' ? Number(value) : value,
    }));
  };

  const toggleDay = (day: string) => {
    setForm((previous) => ({
      ...previous,
      scheduleDays: previous.scheduleDays.includes(day)
        ? previous.scheduleDays.filter((item) => item !== day)
        : [...previous.scheduleDays, day],
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void onSave(form);
  };
  const selectedCourse = options.courses.find((course) => course._id === form.course);

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={classItem ? 'Chỉnh sửa lớp học' : 'Thêm lớp học'}>
      <div className="modal-box modal-lg">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{classItem ? 'Chỉnh sửa lớp học' : 'Thêm lớp học mới'}</h2>
            <p className="modal-subtitle">{classItem ? `Cập nhật thông tin lớp ${classItem.classCode}` : 'Nhập thông tin lớp học mới'}</p>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>Đóng</button>
        </div>

        {error && <div className="form-error-banner" role="alert">⚠️ {error}</div>}
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="class-code">Mã lớp <span className="required">*</span></label>
              <input id="class-code" name="classCode" className="form-input" placeholder="VD: ENG-K01-A" value={form.classCode} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="class-course">Khóa học <span className="required">*</span></label>
              <select id="class-course" name="course" className="form-input" value={form.course} onChange={handleChange} required>
                {options.courses.map((course) => <option key={course._id} value={course._id}>{course.code} - {course.title}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="class-teacher">Giảng viên <span className="required">*</span></label>
              <select id="class-teacher" name="teacher" className="form-input" value={form.teacher} onChange={handleChange} required>
                {options.teachers.map((teacher) => <option key={teacher._id} value={teacher._id}>{teacher.fullName}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="class-room">Phòng học</label>
              <input id="class-room" name="room" className="form-input" placeholder="VD: Phòng 101" value={form.room} onChange={handleChange} />
            </div>
          </div>

          <fieldset className="form-group class-days-field">
            <legend className="form-label">Ngày học</legend>
            <div className="class-days-options">
              {WEEK_DAYS.map((day) => (
                <label key={day} className="class-day-option">
                  <input type="checkbox" checked={form.scheduleDays.includes(day)} onChange={() => toggleDay(day)} />
                  {day}
                </label>
              ))}
            </div>
          </fieldset>
          {selectedCourse && (
            <div className="form-hint" role="status">
              Khóa học gồm <strong>{selectedCourse.sessions} buổi</strong>. Hệ thống tự xếp đủ số buổi theo các ngày đã chọn và tính ngày kết thúc.
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="class-time">Khung giờ học</label>
              <input id="class-time" name="timeSlot" className="form-input" placeholder="18:30 - 20:30" value={form.timeSlot} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="class-capacity">Sĩ số tối đa <span className="required">*</span></label>
              <input id="class-capacity" name="capacity" type="number" min={1} className="form-input" value={form.capacity} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="class-start-date">Ngày bắt đầu <span className="required">*</span></label>
            <input id="class-start-date" name="startDate" type="date" className="form-input" value={form.startDate} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="class-status">Trạng thái</label>
            <select id="class-status" name="status" className="form-input" value={form.status} onChange={handleChange}>
              {Object.entries(STATUS_LABELS).map(([status, label]) => <option key={status} value={status}>{label}</option>)}
            </select>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>Hủy</button>
            <button type="submit" className="btn btn-primary" disabled={saving || options.courses.length === 0 || options.teachers.length === 0}>
              {saving ? 'Đang lưu…' : classItem ? 'Cập nhật' : 'Tạo lớp học'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ClassesManagementPage: React.FC = () => {
  const [classes, setClasses] = useState<TrainingClass[]>([]);
  const [options, setOptions] = useState<ClassOptions>({ courses: [], teachers: [] });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [optionsError, setOptionsError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;
  const [editingClass, setEditingClass] = useState<TrainingClass | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deletingClass, setDeletingClass] = useState<TrainingClass | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState('');

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await classService.getClasses({ search, status: statusFilter, page, limit });
      setClasses(response.data);
      setTotal(response.pagination?.total ?? 0);
    } catch {
      setError('Không thể tải danh sách lớp học. Vui lòng kiểm tra kết nối backend.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    let cancelled = false;
    const loadClasses = async () => {
      try {
        const response = await classService.getClasses({ search, status: statusFilter, page, limit });
        if (!cancelled) {
          setError('');
          setClasses(response.data);
          setTotal(response.pagination?.total ?? 0);
        }
      } catch {
        if (!cancelled) setError('Không thể tải danh sách lớp học. Vui lòng kiểm tra kết nối backend.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void loadClasses();
    return () => { cancelled = true; };
  }, [search, statusFilter, page]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await classService.getOptions();
        setOptions(response.data ?? { courses: [], teachers: [] });
        setOptionsError('');
      } catch {
        setOptionsError('Không tải được danh sách khóa học và giảng viên.');
      }
    };
    void fetchOptions();
  }, []);

  const showSuccess = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 3000);
  };

  const handleSave = async (data: ClassFormData) => {
    setSaving(true);
    setFormError('');
    try {
      if (editingClass) {
        await classService.updateClass(editingClass._id, data);
        showSuccess('Cập nhật lớp học thành công.');
      } else {
        await classService.createClass(data);
        showSuccess('Tạo lớp học thành công.');
      }
      setShowForm(false);
      setEditingClass(null);
      await fetchClasses();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(message ?? 'Không thể lưu lớp học. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingClass) return;
    try {
      await classService.deleteClass(deletingClass._id);
      setDeletingClass(null);
      showSuccess('Xóa lớp học thành công.');
      await fetchClasses();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(message ?? 'Không thể xóa lớp học. Vui lòng thử lại.');
      setDeletingClass(null);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="courses-page">
      <nav className="staff-breadcrumb" aria-label="Breadcrumb">
        <Link to="/staff/dashboard">Tổng quan</Link>
        <span className="breadcrumb-sep">›</span>
        <span>Quản lý Lớp học</span>
      </nav>

      <div className="courses-page-header">
        <div>
          <h1 className="courses-page-title">Quản lý lớp học</h1>
          <p className="courses-page-subtitle">Tạo lớp, phân công giảng viên và sắp xếp lịch học</p>
        </div>
        <button
          className="btn btn-primary btn-lg"
          onClick={() => { setEditingClass(null); setFormError(''); setShowForm(true); }}
          disabled={options.courses.length === 0 || options.teachers.length === 0}
        >
          + Thêm lớp học
        </button>
      </div>

      {optionsError && <div className="form-error-banner" role="alert">⚠️ {optionsError}</div>}
      {!optionsError && (options.courses.length === 0 || options.teachers.length === 0) && (
        <div className="form-error-banner" role="status">
          Cần có ít nhất một khóa học đang hoạt động và một giảng viên đang hoạt động để tạo lớp.
        </div>
      )}

      <div className="courses-filter-bar">
        <div className="courses-search-wrap">
          <input className="form-input courses-search-input" placeholder="Tìm theo mã lớp…" value={search} onChange={(event) => { setLoading(true); setPage(1); setSearch(event.target.value); }} />
        </div>
        <select className="form-input courses-filter-select" value={statusFilter} onChange={(event) => { setLoading(true); setPage(1); setStatusFilter(event.target.value); }}>
          <option value="">Tất cả trạng thái</option>
          {Object.entries(STATUS_LABELS).map(([status, label]) => <option key={status} value={status}>{label}</option>)}
        </select>
        <span className="courses-total-badge">{total} lớp học</span>
      </div>

      {error && !loading && (
        <div className="form-error-banner courses-error" role="alert">
          {error}
          <button className="btn btn-ghost" style={{ marginLeft: '1rem' }} onClick={() => void fetchClasses()}>Thử lại</button>
        </div>
      )}

      <div className="courses-table-wrap class-table-wrap">
        {loading ? (
          <div className="courses-loading"><div className="loading-spinner" /><p>Đang tải danh sách lớp học…</p></div>
        ) : classes.length === 0 ? (
          <div className="courses-empty"><h3>Chưa có lớp học nào</h3><p>Bấm <strong>+ Thêm lớp học</strong> để bắt đầu.</p></div>
        ) : (
          <table className="courses-table class-table" aria-label="Danh sách lớp học">
            <thead>
              <tr><th>Mã lớp</th><th>Khóa học</th><th>Giảng viên</th><th>Lịch học</th><th>Thời gian</th><th>Sĩ số</th><th>Trạng thái</th><th>Hành động</th></tr>
            </thead>
            <tbody>
              {classes.map((classItem) => (
                <tr key={classItem._id} className="courses-table-row">
                  <td><span className="course-code-chip">{classItem.classCode}</span></td>
                  <td><div className="course-title-cell"><strong>{classItem.course.title}</strong><span className="course-desc-preview">{classItem.course.code}</span></div></td>
                  <td>{classItem.teacher.fullName}</td>
                  <td><div className="course-title-cell"><strong>{classItem.scheduleDays.join(', ') || 'Chưa xếp lịch'}</strong><span className="course-desc-preview">{classItem.timeSlot || 'Chưa có khung giờ'}</span></div></td>
                  <td>{formatDate(classItem.startDate)} – {formatDate(classItem.endDate)}</td>
                  <td>{classItem.capacity}</td>
                  <td><span className={`course-status-badge class-status-${classItem.status.toLowerCase()}`}>{STATUS_LABELS[classItem.status]}</span></td>
                  <td>
                    <div className="courses-actions">
                      <button className="btn btn-outline btn-sm" onClick={() => { setEditingClass(classItem); setFormError(''); setShowForm(true); }}>Sửa</button>
                      <button className="btn btn-danger-outline btn-sm" onClick={() => setDeletingClass(classItem)}>Xóa</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="courses-pagination" role="navigation" aria-label="Phân trang">
          <button className="btn btn-outline btn-sm" onClick={() => { setLoading(true); setPage((current) => Math.max(1, current - 1)); }} disabled={page <= 1}>Trước</button>
          <span className="pagination-info">Trang {page} / {totalPages}</span>
          <button className="btn btn-outline btn-sm" onClick={() => { setLoading(true); setPage((current) => Math.min(totalPages, current + 1)); }} disabled={page >= totalPages}>Sau</button>
        </div>
      )}

      {showForm && <ClassFormModal classItem={editingClass} options={options} onSave={handleSave} onClose={() => setShowForm(false)} saving={saving} error={formError} />}
      {deletingClass && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Xác nhận xóa lớp học">
          <div className="modal-box modal-sm">
            <div className="modal-delete-icon">🗑️</div>
            <h2 className="modal-title">Xóa lớp học?</h2>
            <p className="modal-desc">Bạn có chắc muốn xóa lớp <strong>{deletingClass.classCode}</strong>? Lớp có học viên đang ghi danh sẽ không thể xóa.</p>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setDeletingClass(null)}>Hủy</button>
              <button className="btn btn-danger" onClick={() => void handleDelete()}>Xóa</button>
            </div>
          </div>
        </div>
      )}
      {toast && <div className="toast toast-success" role="status">{toast}</div>}
    </div>
  );
};

export default ClassesManagementPage;
