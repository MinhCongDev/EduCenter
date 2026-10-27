import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { courseService } from '../../services/course.service';
import { placementTestService } from '../../services/placement-test.service';
import type {
  Course,
  PlacementTest,
  PlacementTestDifficulty,
  PlacementTestFormData,
  PlacementTestQuestion,
  PlacementTestSkill,
  PlacementTestStatus,
} from '../../types';

const SKILLS: { value: PlacementTestSkill; label: string }[] = [
  { value: 'LISTENING', label: 'Nghe' },
  { value: 'SPEAKING', label: 'Nói' },
  { value: 'READING', label: 'Đọc' },
  { value: 'WRITING', label: 'Viết' },
];

const DIFFICULTIES: { value: PlacementTestDifficulty; label: string }[] = [
  { value: 'BEGINNER', label: 'Cơ bản' },
  { value: 'INTERMEDIATE', label: 'Trung bình' },
  { value: 'ADVANCED', label: 'Nâng cao' },
];

const EMPTY_QUESTION: PlacementTestQuestion = {
  skill: 'READING',
  prompt: '',
  options: ['', '', '', ''],
  correctOption: 0,
};

const createEmptyForm = (course = ''): PlacementTestFormData => ({
  title: '',
  course,
  difficulty: 'BEGINNER',
  durationMinutes: 30,
  status: 'DRAFT',
  questions: [],
});

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (
    typeof error === 'object'
    && error !== null
    && 'response' in error
    && typeof error.response === 'object'
    && error.response !== null
    && 'data' in error.response
    && typeof error.response.data === 'object'
    && error.response.data !== null
    && 'message' in error.response.data
    && typeof error.response.data.message === 'string'
  ) {
    return error.response.data.message;
  }
  return fallback;
};

const QuestionEditor: React.FC<{
  question: PlacementTestQuestion;
  index: number;
  onChange: (question: PlacementTestQuestion) => void;
  onRemove: () => void;
}> = ({ question, index, onChange, onRemove }) => {
  const updateOption = (optionIndex: number, value: string) => {
    const options = [...question.options];
    options[optionIndex] = value;
    onChange({ ...question, options });
  };

  const addOption = () => {
    if (question.options.length < 6) onChange({ ...question, options: [...question.options, ''] });
  };

  const removeOption = (optionIndex: number) => {
    if (question.options.length <= 2) return;
    const options = question.options.filter((_, currentIndex) => currentIndex !== optionIndex);
    const correctOption = question.correctOption === optionIndex
      ? 0
      : question.correctOption > optionIndex
        ? question.correctOption - 1
        : question.correctOption;
    onChange({ ...question, options, correctOption });
  };

  return (
    <details className="placement-question" open>
      <summary>
        <span>Câu {index + 1} · {SKILLS.find((skill) => skill.value === question.skill)?.label}</span>
        <span className="placement-question-summary">Mở / thu gọn</span>
      </summary>
      <div className="placement-question-fields">
        <div className="placement-question-heading">
          <label className="form-group">
            <span className="form-label">Kỹ năng</span>
            <select
              className="form-input"
              value={question.skill}
              onChange={(event) => onChange({ ...question, skill: event.target.value as PlacementTestSkill })}
            >
              {SKILLS.map((skill) => <option key={skill.value} value={skill.value}>{skill.label}</option>)}
            </select>
          </label>
          <button type="button" className="btn btn-danger-outline btn-sm" onClick={onRemove}>
            Xóa câu hỏi
          </button>
        </div>
        <label className="form-group">
          <span className="form-label">Nội dung câu hỏi</span>
          <textarea
            className="form-input form-textarea"
            rows={3}
            maxLength={1000}
            value={question.prompt}
            placeholder="Nhập nội dung câu hỏi"
            onChange={(event) => onChange({ ...question, prompt: event.target.value })}
            required
          />
        </label>
        <div className="placement-options-heading">
          <span className="form-label">Phương án trả lời</span>
          <span className="form-hint">Chọn đáp án đúng bên cạnh mỗi phương án</span>
        </div>
        <div className="placement-options-list">
          {question.options.map((option, optionIndex) => (
            <div className="placement-option-row" key={optionIndex}>
              <input
                type="radio"
                name={`correct-answer-${index}`}
                aria-label={`Chọn phương án ${optionIndex + 1} là đáp án đúng`}
                checked={question.correctOption === optionIndex}
                onChange={() => onChange({ ...question, correctOption: optionIndex })}
              />
              <input
                className="form-input"
                value={option}
                maxLength={500}
                placeholder={`Phương án ${optionIndex + 1}`}
                aria-label={`Nội dung phương án ${optionIndex + 1}`}
                onChange={(event) => updateOption(optionIndex, event.target.value)}
                required
              />
              <button
                type="button"
                className="placement-remove-option"
                onClick={() => removeOption(optionIndex)}
                disabled={question.options.length <= 2}
                aria-label={`Xóa phương án ${optionIndex + 1}`}
              >
                Xóa
              </button>
            </div>
          ))}
        </div>
        <button type="button" className="btn btn-outline btn-sm" onClick={addOption} disabled={question.options.length >= 6}>
          Thêm phương án
        </button>
      </div>
    </details>
  );
};

const PlacementTestFormModal: React.FC<{
  test: PlacementTest | null;
  courses: Course[];
  onSave: (data: PlacementTestFormData) => Promise<void>;
  onClose: () => void;
  saving: boolean;
  error: string;
}> = ({ test, courses, onSave, onClose, saving, error }) => {
  const [form, setForm] = useState<PlacementTestFormData>(() => test
    ? {
        title: test.title,
        course: test.course._id,
        difficulty: test.difficulty,
        durationMinutes: test.durationMinutes,
        status: test.status,
        questions: test.questions.map((question) => ({
          skill: question.skill,
          prompt: question.prompt,
          options: question.options,
          correctOption: question.correctOption,
        })),
      }
    : createEmptyForm(courses[0]?._id ?? ''));

  const addQuestion = (skill: PlacementTestSkill) => {
    setForm((previous) => ({
      ...previous,
      questions: [...previous.questions, { ...EMPTY_QUESTION, skill, options: [...EMPTY_QUESTION.options] }],
    }));
  };

  const updateQuestion = (index: number, question: PlacementTestQuestion) => {
    setForm((previous) => ({
      ...previous,
      questions: previous.questions.map((current, currentIndex) => currentIndex === index ? question : current),
    }));
  };

  const removeQuestion = (index: number) => {
    setForm((previous) => ({
      ...previous,
      questions: previous.questions.filter((_, currentIndex) => currentIndex !== index),
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void onSave(form);
  };

  const questionCountBySkill = SKILLS.map(({ value, label }) => ({
    value,
    label,
    count: form.questions.filter((question) => question.skill === value).length,
  }));

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={test ? 'Chỉnh sửa bài kiểm tra' : 'Tạo bài kiểm tra'}>
      <div className="modal-box modal-lg placement-test-modal">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{test ? 'Chỉnh sửa bài kiểm tra' : 'Tạo bài kiểm tra đầu vào'}</h2>
            <p className="modal-subtitle">Nhập câu hỏi trắc nghiệm và chọn đáp án đúng cho từng câu.</p>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>Đóng</button>
        </div>
        {error && <div className="form-error-banner" role="alert">{error}</div>}
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label className="form-group">
              <span className="form-label">Khóa học <span className="required">*</span></span>
              <select
                className="form-input"
                value={form.course}
                onChange={(event) => setForm((previous) => ({ ...previous, course: event.target.value }))}
                required
              >
                {courses.map((course) => <option key={course._id} value={course._id}>{course.code} — {course.title}</option>)}
              </select>
            </label>
            <label className="form-group">
              <span className="form-label">Độ khó <span className="required">*</span></span>
              <select
                className="form-input"
                value={form.difficulty}
                onChange={(event) => setForm((previous) => ({ ...previous, difficulty: event.target.value as PlacementTestDifficulty }))}
              >
                {DIFFICULTIES.map((difficulty) => <option key={difficulty.value} value={difficulty.value}>{difficulty.label}</option>)}
              </select>
            </label>
          </div>
          <label className="form-group">
            <span className="form-label">Tên bài kiểm tra <span className="required">*</span></span>
            <input
              className="form-input"
              value={form.title}
              maxLength={150}
              placeholder="Ví dụ: Kiểm tra đầu vào IELTS — Cơ bản"
              onChange={(event) => setForm((previous) => ({ ...previous, title: event.target.value }))}
              required
            />
          </label>
          <div className="form-row">
            <label className="form-group">
              <span className="form-label">Thời lượng (phút) <span className="required">*</span></span>
              <input
                className="form-input"
                type="number"
                min={5}
                max={240}
                value={form.durationMinutes}
                onChange={(event) => setForm((previous) => ({ ...previous, durationMinutes: Number(event.target.value) }))}
                required
              />
            </label>
            <label className="form-group">
              <span className="form-label">Trạng thái</span>
              <select
                className="form-input"
                value={form.status}
                onChange={(event) => setForm((previous) => ({ ...previous, status: event.target.value as PlacementTestStatus }))}
              >
                <option value="DRAFT">Bản nháp</option>
                <option value="PUBLISHED">Đã xuất bản</option>
              </select>
            </label>
          </div>

          <section className="placement-question-section">
            <div className="placement-question-section-heading">
              <div>
                <h3>Câu hỏi trắc nghiệm</h3>
                <p>Khi xuất bản, bài kiểm tra cần có ít nhất một câu hỏi cho mỗi kỹ năng.</p>
              </div>
              <span className="courses-total-badge">{form.questions.length} câu</span>
            </div>
            <div className="placement-skill-actions">
              {questionCountBySkill.map(({ value, label, count }) => (
                <button key={value} type="button" className="btn btn-outline btn-sm" onClick={() => addQuestion(value)}>
                  Thêm câu {label.toLowerCase()} ({count})
                </button>
              ))}
            </div>
            {form.questions.length === 0 ? (
              <p className="placement-no-questions">Chưa có câu hỏi. Chọn kỹ năng để thêm câu hỏi mới.</p>
            ) : (
              <div className="placement-question-list">
                {form.questions.map((question, index) => (
                  <QuestionEditor
                    key={question._id ?? index}
                    question={question}
                    index={index}
                    onChange={(updated) => updateQuestion(index, updated)}
                    onRemove={() => removeQuestion(index)}
                  />
                ))}
              </div>
            )}
          </section>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>Hủy</button>
            <button type="submit" className="btn btn-primary" disabled={saving || courses.length === 0}>
              {saving ? 'Đang lưu…' : test ? 'Lưu thay đổi' : 'Tạo bài kiểm tra'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PlacementTestsManagementPage: React.FC = () => {
  const [tests, setTests] = useState<PlacementTest[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [error, setError] = useState('');
  const [courseError, setCourseError] = useState('');
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTest, setEditingTest] = useState<PlacementTest | null>(null);
  const [deletingTest, setDeletingTest] = useState<PlacementTest | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    let active = true;
    courseService.getCourses({ status: 'ALL', limit: 100, sortBy: 'title' })
      .then((response) => {
        if (active) setCourses(response.data);
      })
      .catch(() => {
        if (active) setCourseError('Không thể tải danh sách khóa học. Vui lòng thử lại.');
      })
      .finally(() => {
        if (active) setCoursesLoading(false);
      });

    return () => { active = false; };
  }, []);

  const fetchTests = useCallback(async () => {
    setError('');
    try {
      const response = await placementTestService.getPlacementTests({
        search: search.trim() || undefined,
        courseId: courseFilter || undefined,
        difficulty: difficultyFilter ? difficultyFilter as PlacementTestDifficulty : undefined,
        limit: 100,
      });
      setTests(response.data);
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError, 'Không thể tải danh sách bài kiểm tra.'));
    } finally {
      setLoading(false);
    }
  }, [courseFilter, difficultyFilter, search]);

  useEffect(() => {
    let active = true;
    placementTestService.getPlacementTests({
      search: search.trim() || undefined,
      courseId: courseFilter || undefined,
      difficulty: difficultyFilter ? difficultyFilter as PlacementTestDifficulty : undefined,
      limit: 100,
    })
      .then((response) => {
        if (active) {
          setTests(response.data);
          setError('');
        }
      })
      .catch((requestError: unknown) => {
        if (active) setError(getErrorMessage(requestError, 'Không thể tải danh sách bài kiểm tra.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [courseFilter, difficultyFilter, search]);

  const showSuccess = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 3000);
  };

  const handleSave = async (data: PlacementTestFormData) => {
    setSaving(true);
    setFormError('');
    try {
      if (editingTest) {
        await placementTestService.updatePlacementTest(editingTest._id, data);
        showSuccess('Cập nhật bài kiểm tra thành công.');
      } else {
        await placementTestService.createPlacementTest(data);
        showSuccess('Tạo bài kiểm tra thành công.');
      }
      setShowForm(false);
      setEditingTest(null);
      setLoading(true);
      await fetchTests();
    } catch (requestError: unknown) {
      setFormError(getErrorMessage(requestError, 'Không thể lưu bài kiểm tra. Vui lòng thử lại.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingTest) return;
    setDeleting(true);
    try {
      await placementTestService.deletePlacementTest(deletingTest._id);
      setDeletingTest(null);
      showSuccess('Xóa bài kiểm tra thành công.');
      setLoading(true);
      await fetchTests();
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError, 'Không thể xóa bài kiểm tra.'));
      setDeletingTest(null);
    } finally {
      setDeleting(false);
    }
  };

  const openCreate = () => {
    setEditingTest(null);
    setFormError('');
    setShowForm(true);
  };

  return (
    <div className="courses-page placement-tests-page">
      <nav className="staff-breadcrumb" aria-label="Breadcrumb">
        <Link to="/staff/dashboard">Tổng quan</Link>
        <span className="breadcrumb-sep">›</span>
        <span>Quản lý bài kiểm tra đầu vào</span>
      </nav>

      <div className="courses-page-header">
        <div>
          <h1 className="courses-page-title">Quản lý bài kiểm tra đầu vào</h1>
          <p className="courses-page-subtitle">Tạo đề trắc nghiệm theo khóa học, độ khó và 4 kỹ năng.</p>
        </div>
        <button type="button" className="btn btn-primary btn-lg" onClick={openCreate} disabled={coursesLoading || courses.length === 0}>
          Tạo bài kiểm tra
        </button>
      </div>

      {courseError && <div className="form-error-banner" role="alert">{courseError}</div>}
      {!coursesLoading && courses.length === 0 && !courseError && (
        <div className="form-error-banner" role="status">Cần tạo khóa học trước khi thiết lập bài kiểm tra đầu vào.</div>
      )}
      {!coursesLoading && courses.length > 0 && (
        <div className="courses-filter-bar">
          <input
            className="form-input placement-search"
            value={search}
            onChange={(event) => { setLoading(true); setSearch(event.target.value); }}
            placeholder="Tìm tên bài kiểm tra…"
            aria-label="Tìm bài kiểm tra"
          />
          <select className="form-input courses-filter-select" value={courseFilter} onChange={(event) => { setLoading(true); setCourseFilter(event.target.value); }} aria-label="Lọc theo khóa học">
            <option value="">Tất cả khóa học</option>
            {courses.map((course) => <option key={course._id} value={course._id}>{course.code} — {course.title}</option>)}
          </select>
          <select className="form-input courses-filter-select" value={difficultyFilter} onChange={(event) => { setLoading(true); setDifficultyFilter(event.target.value); }} aria-label="Lọc theo độ khó">
            <option value="">Tất cả độ khó</option>
            {DIFFICULTIES.map((difficulty) => <option key={difficulty.value} value={difficulty.value}>{difficulty.label}</option>)}
          </select>
          <span className="courses-total-badge">{tests.length} bài kiểm tra</span>
        </div>
      )}

      {error && !loading && <div className="form-error-banner courses-error" role="alert">{error}</div>}
      <div className="courses-table-wrap">
        {loading || coursesLoading ? (
          <div className="courses-loading"><div className="loading-spinner" /><p>Đang tải bài kiểm tra…</p></div>
        ) : tests.length === 0 ? (
          <div className="courses-empty">
            <h3>Chưa có bài kiểm tra nào</h3>
            <p>Tạo đề trắc nghiệm đầu vào cho từng khóa học và mức độ.</p>
          </div>
        ) : (
          <table className="courses-table placement-tests-table" aria-label="Danh sách bài kiểm tra đầu vào">
            <thead>
              <tr><th>Tên bài kiểm tra</th><th>Khóa học</th><th>Độ khó</th><th>Số câu</th><th>Thời lượng</th><th>Trạng thái</th><th>Thao tác</th></tr>
            </thead>
            <tbody>
              {tests.map((test) => (
                <tr key={test._id} className="courses-table-row">
                  <td><strong>{test.title}</strong></td>
                  <td>{test.course?.code} — {test.course?.title}</td>
                  <td>{DIFFICULTIES.find(({ value }) => value === test.difficulty)?.label}</td>
                  <td>{test.questions.length}</td>
                  <td>{test.durationMinutes} phút</td>
                  <td><span className={`course-status-badge ${test.status === 'PUBLISHED' ? 'badge-active' : 'badge-inactive'}`}>{test.status === 'PUBLISHED' ? 'Đã xuất bản' : 'Bản nháp'}</span></td>
                  <td>
                    <div className="courses-actions">
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => { setEditingTest(test); setFormError(''); setShowForm(true); }}>Sửa</button>
                      <button type="button" className="btn btn-danger-outline btn-sm" onClick={() => setDeletingTest(test)}>Xóa</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <PlacementTestFormModal
          test={editingTest}
          courses={courses}
          onSave={handleSave}
          onClose={() => setShowForm(false)}
          saving={saving}
          error={formError}
        />
      )}
      {deletingTest && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Xác nhận xóa bài kiểm tra">
          <div className="modal-box modal-sm">
            <h2 className="modal-title">Xóa bài kiểm tra?</h2>
            <p className="modal-desc">Bạn có chắc muốn xóa <strong>{deletingTest.title}</strong>? Thao tác này không thể hoàn tác.</p>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setDeletingTest(null)} disabled={deleting}>Hủy</button>
              <button type="button" className="btn btn-danger" onClick={() => void handleDelete()} disabled={deleting}>{deleting ? 'Đang xóa…' : 'Xóa bài kiểm tra'}</button>
            </div>
          </div>
        </div>
      )}
      {toast && <div className="toast toast-success" role="status">{toast}</div>}
    </div>
  );
};

export default PlacementTestsManagementPage;
