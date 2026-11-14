import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { courseService } from '../../services/course.service';
import type { Course, CourseFormData } from '../../types';

// =====================================================================
// Constants
// =====================================================================
const COURSE_CATEGORIES = [
  'Lộ trình IELTS',
  'IELTS Toàn Diện',
  'IELTS Kỹ Năng Chuyên Sâu',
  'IELTS Cấp Tốc',
];

const LEVEL_OPTIONS = [
  '0 - 3.5',
  '3.5 - 4.5',
  '4.5 - 5.5',
  '5.5 - 6.5',
  '6.5 - 7.5',
  '8.0+',
];

const EMPTY_FORM: CourseFormData = {
  code: '',
  title: '',
  description: '',
  category: 'Lộ trình IELTS',
  entryLevel: '0 - 3.5',
  targetLevel: '3.5',
  sessions: 30,
  tuitionFee: 5000000,
  format: 'OFFLINE',
  status: 'ACTIVE',
  bannerUrl: '',
  syllabus: [],
  learningObjectives: [],
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

/** Badge for IELTS Band / Level */
const LevelBadge: React.FC<{ level?: string }> = ({ level }) => {
  if (!level) return null;
  const isMaster = level.includes('8.0');
  const bg = isMaster ? '#f3e8ff' : '#dcfce7';
  const color = isMaster ? '#7e22ce' : '#15803d';
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '9999px',
        fontSize: '11px',
        fontWeight: 700,
        backgroundColor: bg,
        color: color,
        marginLeft: '6px',
        verticalAlign: 'middle',
      }}
    >
      {level}
    </span>
  );
};

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
// Course Form Modal (with Image Upload & Band Alignment)
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadImageError, setUploadImageError] = useState('');

  const [form, setForm] = useState<CourseFormData>(
    course
      ? {
          code: course.code,
          title: course.title,
          description: course.description,
          category: course.category || 'Lộ trình IELTS',
          entryLevel: course.entryLevel || '0 - 3.5',
          targetLevel: course.targetLevel || '',
          sessions: course.sessions || 30,
          tuitionFee: course.tuitionFee || 0,
          format: course.format || 'OFFLINE',
          status: course.status || 'ACTIVE',
          bannerUrl: course.bannerUrl || '',
          syllabus: course.syllabus ?? [],
          learningObjectives: course.learningObjectives ?? [],
        }
      : { ...EMPTY_FORM }
  );
  const [syllabusInput, setSyllabusInput] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'sessions' || name === 'tuitionFee' ? Number(value) : value,
    }));
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    setUploadImageError('');
    try {
      const res = await courseService.uploadCourseImage(file);
      if (res.success && res.data && res.data.url) {
        const uploadedUrl = res.data.url;
        setForm((prev) => ({ ...prev, bannerUrl: uploadedUrl }));
      } else {
        setUploadImageError(res.message || 'Tải ảnh thất bại');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Lỗi khi tải ảnh lên';
      setUploadImageError(msg);
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
      <div className="modal-box modal-lg" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{isEditing ? 'Chỉnh sửa khóa học' : 'Thêm khóa học mới'}</h2>
            <p className="modal-subtitle">{isEditing ? `Cập nhật thông tin cho [${course?.code}]` : 'Điền thông tin chuẩn hóa khóa học bên dưới'}</p>
          </div>
          <button id="btn-close-modal" className="modal-close-btn" onClick={onClose}>Đóng</button>
        </div>

        {/* Error banner */}
        {error && <div className="form-error-banner" role="alert">⚠️ {error}</div>}

        {/* Form */}
        <form id="course-form" onSubmit={handleSubmit} className="modal-form">
          {/* Ảnh khóa học */}
          <div className="form-group">
            <label className="form-label">
              Hình ảnh khóa học (Banner / Thumbnail)
            </label>
            <div
              style={{
                display: 'flex',
                gap: '16px',
                alignItems: 'flex-start',
                background: '#f8fafc',
                padding: '12px',
                borderRadius: '8px',
                border: '1px dashed #cbd5e1',
              }}
            >
              {form.bannerUrl ? (
                <div
                  style={{
                    position: 'relative',
                    width: '120px',
                    height: '80px',
                    flexShrink: 0,
                    borderRadius: '6px',
                    overflow: 'hidden',
                    border: '1px solid #e2e8f0',
                    background: '#f1f5f9',
                  }}
                >
                  <img
                    src={form.bannerUrl}
                    alt="Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, bannerUrl: '' }))}
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      background: 'rgba(0,0,0,0.65)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title="Xóa ảnh"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    width: '120px',
                    height: '80px',
                    flexShrink: 0,
                    borderRadius: '6px',
                    background: '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#64748b',
                    fontSize: '28px',
                  }}
                >
                  🖼️
                </div>
              )}

              <div style={{ flex: 1 }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                  style={{ display: 'none' }}
                  onChange={handleImageFileChange}
                />
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                  >
                    {isUploadingImage ? <><span className="spinner-sm" /> Đang tải ảnh…</> : '📁 Tải ảnh từ máy tính'}
                  </button>
                  {form.bannerUrl && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setForm((prev) => ({ ...prev, bannerUrl: '' }))}
                    >
                      Gỡ ảnh
                    </button>
                  )}
                </div>
                <input
                  className="form-input"
                  placeholder="Hoặc dán URL hình ảnh trực tiếp (https://...)"
                  name="bannerUrl"
                  value={form.bannerUrl || ''}
                  onChange={handleChange}
                  style={{ fontSize: '13px', padding: '6px 10px' }}
                />
                {uploadImageError && (
                  <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                    ⚠️ {uploadImageError}
                  </div>
                )}
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                  Hỗ trợ JPG, PNG, WEBP, GIF tối đa 10MB. Ảnh sẽ được lưu trữ và hiển thị trực tiếp.
                </div>
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="course-code">
                Mã khóa học <span className="required">*</span>
              </label>
              <input
                id="course-code"
                name="code"
                className="form-input"
                placeholder="VD: IELTS-PRE"
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
              placeholder="VD: IELTS Breakthrough – Bứt Phá"
              value={form.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="course-entry-level">
                Trình độ đầu vào (Band)
              </label>
              <input
                id="course-entry-level"
                name="entryLevel"
                className="form-input"
                placeholder="VD: 0 - 3.5, 4.5 - 5.5..."
                value={form.entryLevel || ''}
                onChange={handleChange}
                list="entry-level-suggestions"
              />
              <datalist id="entry-level-suggestions">
                {LEVEL_OPTIONS.map((lvl) => <option key={lvl} value={lvl} />)}
              </datalist>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="course-target-level">
                Mục tiêu đầu ra (Target)
              </label>
              <input
                id="course-target-level"
                name="targetLevel"
                className="form-input"
                placeholder="VD: 3.5, 5.5, 6.5, 8.0+..."
                value={form.targetLevel || ''}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="course-description">
              Mô tả ngắn gọn nội dung
            </label>
            <textarea
              id="course-description"
              name="description"
              className="form-input form-textarea"
              placeholder="Nội dung tóm tắt mục tiêu và phương pháp đào tạo…"
              value={form.description}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="course-duration">
                Số buổi học <span className="required">*</span>
              </label>
              <input
                id="course-duration"
                name="sessions"
                type="number"
                min={1}
                max={500}
                className="form-input"
                value={form.sessions}
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

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="course-format">Hình thức đào tạo</label>
              <select id="course-format" name="format" className="form-input" value={form.format || 'OFFLINE'} onChange={handleChange}>
                <option value="OFFLINE">Trực tiếp tại trung tâm (Offline)</option>
                <option value="ONLINE">Trực tuyến qua Zoom (Online)</option>
                <option value="BLENDED">Kết hợp Trực tiếp & Trực tuyến (Blended)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="course-status">Trạng thái</label>
              <select id="course-status" name="status" className="form-input" value={form.status} onChange={handleChange}>
                <option value="ACTIVE">Hoạt động</option>
                <option value="INACTIVE">Tạm dừng</option>
              </select>
            </div>
          </div>

          {/* Syllabus */}
          <div className="form-group">
            <label className="form-label">Nội dung chương trình (Syllabus theo tuần)</label>
            <div className="syllabus-input-row">
              <input
                id="syllabus-item-input"
                className="form-input"
                placeholder="Thêm chủ đề / module / tuần học…"
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
                      Xóa
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
              {saving ? <><span className="spinner-sm" /> Đang lưu…</> : isEditing ? 'Cập nhật' : 'Tạo khóa học'}
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
      showToast('Xóa thất bại. Vui lòng kiểm tra xem khóa học có lớp đang hoạt động hay không.', 'error');
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
        <Link to="/staff/dashboard" id="breadcrumb-dashboard">Tổng quan</Link>
        <span className="breadcrumb-sep">›</span>
        <span>Quản lý Khóa học</span>
      </nav>

      {/* ── Page Header ── */}
      <div className="courses-page-header">
        <div>
          <h1 className="courses-page-title">Quản lý khóa học</h1>
          <p className="courses-page-subtitle">Chuẩn hóa danh mục, lộ trình đào tạo IELTS và học phí</p>
        </div>
        <button id="btn-add-course" className="btn btn-primary btn-lg" onClick={openCreate}>
          + Thêm khóa học
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="courses-filter-bar">
        <div className="courses-search-wrap">
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
          {error}
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
            <h3>Chưa có khóa học nào</h3>
            <p>Bấm <strong>+ Thêm khóa học</strong> để bắt đầu.</p>
          </div>
        ) : (
          <table className="courses-table" aria-label="Danh sách khóa học">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Hình ảnh</th>
                <th>Mã & Tên khóa học</th>
                <th>Danh mục</th>
                <th>Thời lượng</th>
                <th>Học phí</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'right' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course._id} className="courses-table-row">
                  <td>
                    {course.bannerUrl ? (
                      <div
                        style={{
                          width: '64px',
                          height: '42px',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          background: '#f1f5f9',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        <img
                          src={course.bannerUrl}
                          alt={course.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <div
                        style={{
                          width: '64px',
                          height: '42px',
                          borderRadius: '6px',
                          background: '#e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          color: '#64748b',
                        }}
                      >
                        🎓
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="course-title-cell">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span className="course-code-chip">{course.code}</span>
                        <strong>{course.title}</strong>
                        <LevelBadge level={course.entryLevel} />
                      </div>
                      {course.description && (
                        <span
                          className="course-desc-preview"
                          style={{ marginTop: '3px', color: '#64748b', fontSize: '12px' }}
                        >
                          {course.description}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="course-category-chip">{course.category}</span>
                  </td>
                  <td>
                    {course.sessions} buổi
                    <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>
                      {course.format === 'BLENDED' ? 'Kết hợp' : course.format === 'ONLINE' ? 'Trực tuyến' : 'Tại lớp'}
                    </span>
                  </td>
                  <td className="course-fee">{formatCurrency(course.tuitionFee)}</td>
                  <td>
                    <StatusBadge status={course.status} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="courses-actions" style={{ justifyContent: 'flex-end' }}>
                      <button
                        id={`btn-edit-${course._id}`}
                        className="btn btn-outline btn-sm"
                        onClick={() => openEdit(course)}
                        aria-label={`Chỉnh sửa ${course.title}`}
                      >
                        Sửa
                      </button>
                      <button
                        id={`btn-delete-${course._id}`}
                        className="btn btn-danger-outline btn-sm"
                        onClick={() => setDeletingCourse(course)}
                        aria-label={`Xóa ${course.title}`}
                      >
                        Xóa
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
            Trước
          </button>
          <span className="pagination-info">Trang {page} / {totalPages}</span>
          <button
            id="btn-next-page"
            className="btn btn-outline btn-sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Sau
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
