import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { courseService } from '../../services/course.service';
import type { Course, CourseFormData } from '../../types';

// =====================================================================
// Constants
// =====================================================================
const COURSE_CATEGORIES = [
  'Tiếng Anh Giao Tiếp',
  'Tiếng Anh Kinh Doanh',
  'Tiếng Anh Học Thuật',
  'Luyện Thi IELTS',
  'Luyện Thi TOEIC',
  'Tiếng Anh Trẻ Em',
  'Tiếng Anh Online',
];

const EMPTY_FORM: CourseFormData = {
  code: '',
  title: '',
  description: '',
  category: COURSE_CATEGORIES[0],
  durationWeeks: 8,
  tuitionFee: 0,
  status: 'ACTIVE',
  syllabus: [],
};

// =====================================================================
// Sub-components
// =====================================================================

/** Badge for course status */
const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span className={`course-status-badge ${status === 'ACTIVE' ? 'badge-active' : 'badge-inactive'}`}>
    {status === 'ACTIVE' ? '✅ Hoạt động' : '⏸ Tạm dừng'}
  </span>
);

/** Confirm delete dialog */
interface ConfirmDeleteProps {
  course: Course;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}
const ConfirmDeleteDialog: React.FC<ConfirmDeleteProps> = ({ course, onConfirm, onCancel, loading }) => (
  <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Xác nhận xóa">
    <div className="modal-box modal-sm">
      <div className="modal-delete-icon">🗑️</div>
      <h2 className="modal-title">Xóa khóa học?</h2>
      <p className="modal-desc">
        Bạn có chắc muốn xóa khóa học <strong>{course.title}</strong> ({course.code})?
        <br />
        Hành động này không thể hoàn tác.
      </p>
      <div className="modal-footer">
        <button id="btn-cancel-delete" className="btn btn-outline" onClick={onCancel} disabled={loading}>
          Hủy
        </button>
        <button id="btn-confirm-delete" className="btn btn-danger" onClick={onConfirm} disabled={loading}>
          {loading ? <><span className="spinner-sm" /> Đang xóa…</> : 'Xóa'}
        </button>
      </div>
    </div>
  </div>
);

// =====================================================================
// Course Form Modal
// =====================================================================
interface CourseFormModalProps {
  course?: Course | null;
  onSave: (data: CourseFormData) => Promise<void>;
  onClose: () => void;
  saving: boolean;
  error: string;
}

const CourseFormModal: React.FC<CourseFormModalProps> = ({ course, onSave, onClose, saving, error }) => {
  const isEditing = Boolean(course);
  const [form, setForm] = useState<CourseFormData>(
    course
      ? {
          code: course.code,
          title: course.title,
          description: course.description,
          category: course.category,
          durationWeeks: course.durationWeeks,
          tuitionFee: course.tuitionFee,
          status: course.status,
          syllabus: course.syllabus ?? [],
        }
      : { ...EMPTY_FORM }
  );
  const [syllabusInput, setSyllabusInput] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'durationWeeks' || name === 'tuitionFee' ? Number(value) : value,
    }));
  };

  const addSyllabusItem = () => {
    const trimmed = syllabusInput.trim();
    if (trimmed && !form.syllabus.includes(trimmed)) {
      setForm((prev) => ({ ...prev, syllabus: [...prev.syllabus, trimmed] }));
      setSyllabusInput('');
    }
  };

  const removeSyllabusItem = (item: string) => {
    setForm((prev) => ({ ...prev, syllabus: prev.syllabus.filter((s) => s !== item) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(form);
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={isEditing ? 'Chỉnh sửa khóa học' : 'Thêm khóa học'}>
      <div className="modal-box modal-lg">
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{isEditing ? '✏️ Chỉnh sửa khóa học' : '➕ Thêm khóa học mới'}</h2>
            <p className="modal-subtitle">{isEditing ? `Cập nhật thông tin cho ${course?.code}` : 'Điền thông tin khóa học bên dưới'}</p>
          </div>
          <button id="btn-close-modal" className="modal-close-btn" onClick={onClose} aria-label="Đóng">✕</button>
        </div>

        {/* Error banner */}
        {error && <div className="form-error-banner" role="alert">⚠️ {error}</div>}

        {/* Form */}
        <form id="course-form" onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="course-code">
                Mã khóa học <span className="required">*</span>
              </label>
              <input
                id="course-code"
                name="code"
                className="form-input"
                placeholder="VD: ENG101"
                value={form.code}
                onChange={handleChange}
                required
                disabled={isEditing}
                style={isEditing ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="course-category">
                Danh mục <span className="required">*</span>
              </label>
              <select id="course-category" name="category" className="form-input" value={form.category} onChange={handleChange} required>
                {COURSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="course-title">
              Tên khóa học <span className="required">*</span>
            </label>
            <input
              id="course-title"
              name="title"
              className="form-input"
              placeholder="VD: Tiếng Anh Giao Tiếp Cơ Bản"
              value={form.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="course-description">
              Mô tả khóa học
            </label>
            <textarea
              id="course-description"
              name="description"
              className="form-input form-textarea"
              placeholder="Mô tả ngắn gọn về khóa học…"
              value={form.description}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="course-duration">
                Thời lượng (tuần) <span className="required">*</span>
              </label>
              <input
                id="course-duration"
                name="durationWeeks"
                type="number"
                min={1}
                max={104}
                className="form-input"
                value={form.durationWeeks}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="course-fee">
                Học phí (VNĐ) <span className="required">*</span>
              </label>
              <input
                id="course-fee"
                name="tuitionFee"
                type="number"
                min={0}
                step={50000}
                className="form-input"
                value={form.tuitionFee}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="course-status">Trạng thái</label>
            <select id="course-status" name="status" className="form-input" value={form.status} onChange={handleChange}>
              <option value="ACTIVE">Hoạt động</option>
              <option value="INACTIVE">Tạm dừng</option>
            </select>
          </div>

          {/* Syllabus */}
          <div className="form-group">
            <label className="form-label">Nội dung chương trình</label>
            <div className="syllabus-input-row">
              <input
                id="syllabus-item-input"
                className="form-input"
                placeholder="Thêm chủ đề / module…"
                value={syllabusInput}
                onChange={(e) => setSyllabusInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); addSyllabusItem(); }
                }}
              />
              <button id="btn-add-syllabus" type="button" className="btn btn-outline" onClick={addSyllabusItem}>
                + Thêm
              </button>
            </div>
            {form.syllabus.length > 0 && (
              <ul className="syllabus-list">
                {form.syllabus.map((item, idx) => (
                  <li key={idx} className="syllabus-item">
                    <span className="syllabus-bullet">📌</span>
                    <span className="syllabus-text">{item}</span>
                    <button
                      type="button"
                      className="syllabus-remove"
                      onClick={() => removeSyllabusItem(item)}
                      aria-label={`Xóa ${item}`}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="modal-footer">
            <button id="btn-cancel-form" type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>
              Hủy
            </button>
            <button id="btn-save-course" type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><span className="spinner-sm" /> Đang lưu…</> : isEditing ? '💾 Cập nhật' : '✅ Tạo khóa học'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =====================================================================
// Main Page
// =====================================================================
const CoursesManagementPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Modal state
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // ── Fetch courses ──
  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await courseService.getCourses({ search, status: statusFilter, category: categoryFilter, page, limit });
      setCourses(res.data);
      setTotal(res.pagination?.total ?? 0);
    } catch {
      setError('Không thể tải danh sách khóa học. Vui lòng kiểm tra kết nối backend.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, categoryFilter, page]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [search, statusFilter, categoryFilter]);

  // ── Toast helper ──
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Handlers ──
  const handleSave = async (data: CourseFormData) => {
    setSaving(true);
    setFormError('');
    try {
      if (editingCourse) {
        await courseService.updateCourse(editingCourse._id, data);
        showToast('Cập nhật khóa học thành công!', 'success');
      } else {
        await courseService.createCourse(data);
        showToast('Tạo khóa học thành công!', 'success');
      }
      setShowForm(false);
      setEditingCourse(null);
      fetchCourses();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Có lỗi xảy ra, vui lòng thử lại.';
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCourse) return;
    setDeleting(true);
    try {
      await courseService.deleteCourse(deletingCourse._id);
      showToast('Xóa khóa học thành công!', 'success');
      setDeletingCourse(null);
      fetchCourses();
    } catch {
      showToast('Xóa thất bại. Vui lòng thử lại.', 'error');
      setDeletingCourse(null);
    } finally {
      setDeleting(false);
    }
  };

  const openCreate = () => { setEditingCourse(null); setFormError(''); setShowForm(true); };
  const openEdit = (course: Course) => { setEditingCourse(course); setFormError(''); setShowForm(true); };

  const totalPages = Math.ceil(total / limit);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  return (
    <div className="courses-page">
      {/* ── Breadcrumb ── */}
      <nav className="staff-breadcrumb" aria-label="Breadcrumb">
        <Link to="/staff/dashboard" id="breadcrumb-dashboard">🏠 Dashboard</Link>
        <span className="breadcrumb-sep">›</span>
        <span>Quản lý Khóa học</span>
      </nav>

      {/* ── Page Header ── */}
      <div className="courses-page-header">
        <div>
          <h1 className="courses-page-title">📚 Quản lý Khóa học</h1>
          <p className="courses-page-subtitle">Thêm, sửa, xóa các khóa học của trung tâm</p>
        </div>
        <button id="btn-add-course" className="btn btn-primary btn-lg" onClick={openCreate}>
          + Thêm khóa học
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="courses-filter-bar">
        <div className="courses-search-wrap">
          <span className="search-icon">🔍</span>
          <input
            id="course-search-input"
            className="form-input courses-search-input"
            placeholder="Tìm theo tên hoặc mã khóa học…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          id="filter-status"
          className="form-input courses-filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">Hoạt động</option>
          <option value="INACTIVE">Tạm dừng</option>
        </select>
        <select
          id="filter-category"
          className="form-input courses-filter-select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">Tất cả danh mục</option>
          {COURSE_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <span className="courses-total-badge">{total} khóa học</span>
      </div>

      {/* ── Error State ── */}
      {error && !loading && (
        <div className="form-error-banner courses-error" role="alert">
          ⚠️ {error}
          <button className="btn btn-ghost" style={{ marginLeft: '1rem' }} onClick={fetchCourses}>Thử lại</button>
        </div>
      )}

      {/* ── Table ── */}
      <div className="courses-table-wrap">
        {loading ? (
          <div className="courses-loading">
            <div className="loading-spinner" />
            <p>Đang tải danh sách khóa học…</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="courses-empty">
            <span className="courses-empty-icon">📭</span>
            <h3>Chưa có khóa học nào</h3>
            <p>Bấm <strong>+ Thêm khóa học</strong> để bắt đầu.</p>
          </div>
        ) : (
          <table className="courses-table" aria-label="Danh sách khóa học">
            <thead>
              <tr>
                <th>Mã KH</th>
                <th>Tên khóa học</th>
                <th>Danh mục</th>
                <th>Thời lượng</th>
                <th>Học phí</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course._id} className="courses-table-row">
                  <td>
                    <span className="course-code-chip">{course.code}</span>
                  </td>
                  <td>
                    <div className="course-title-cell">
                      <strong>{course.title}</strong>
                      {course.description && (
                        <span className="course-desc-preview">{course.description.slice(0, 60)}{course.description.length > 60 ? '…' : ''}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="course-category-chip">{course.category}</span>
                  </td>
                  <td>{course.durationWeeks} tuần</td>
                  <td className="course-fee">{formatCurrency(course.tuitionFee)}</td>
                  <td>
                    <StatusBadge status={course.status} />
                  </td>
                  <td>
                    <div className="courses-actions">
                      <button
                        id={`btn-edit-${course._id}`}
                        className="btn btn-outline btn-sm"
                        onClick={() => openEdit(course)}
                        aria-label={`Chỉnh sửa ${course.title}`}
                      >
                        ✏️ Sửa
                      </button>
                      <button
                        id={`btn-delete-${course._id}`}
                        className="btn btn-danger-outline btn-sm"
                        onClick={() => setDeletingCourse(course)}
                        aria-label={`Xóa ${course.title}`}
                      >
                        🗑️ Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="courses-pagination" role="navigation" aria-label="Phân trang">
          <button
            id="btn-prev-page"
            className="btn btn-outline btn-sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Trước
          </button>
          <span className="pagination-info">Trang {page} / {totalPages}</span>
          <button
            id="btn-next-page"
            className="btn btn-outline btn-sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Sau →
          </button>
        </div>
      )}

      {/* ── Modals ── */}
      {showForm && (
        <CourseFormModal
          course={editingCourse}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingCourse(null); }}
          saving={saving}
          error={formError}
        />
      )}

      {deletingCourse && (
        <ConfirmDeleteDialog
          course={deletingCourse}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingCourse(null)}
          loading={deleting}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className={`courses-toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`} role="status">
          {toast.type === 'success' ? '✅' : '❌'} {toast.message}
        </div>
      )}
    </div>
  );
};

export default CoursesManagementPage;
