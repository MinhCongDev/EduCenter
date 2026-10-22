import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { timetableService } from '../../services/timetable.service';
import type { TimetableEvent, TimetableFormData, TimetableOptions, TimetableWeek } from '../../types';

const DAYS = [
  { label: 'Thứ 2', index: 1 },
  { label: 'Thứ 3', index: 2 },
  { label: 'Thứ 4', index: 3 },
  { label: 'Thứ 5', index: 4 },
  { label: 'Thứ 6', index: 5 },
  { label: 'Thứ 7', index: 6 },
  { label: 'Chủ Nhật', index: 0 },
];

const ROOM_OPTIONS = ['Phòng 101', 'Phòng 102', 'Phòng 201', 'Phòng 202', 'Phòng 301', 'Phòng 302'];
const EMPTY_WEEK: TimetableWeek = { weekStart: '', weekEnd: '', events: [] };
const EMPTY_FORM: TimetableFormData = {
  sessionDate: '',
  startTime: '18:00',
  endTime: '19:30',
  classroom: ROOM_OPTIONS[0],
  topic: '',
};

const formatDate = (date: string) => new Date(`${date}T00:00:00.000Z`).toLocaleDateString('vi-VN', { timeZone: 'UTC' });
const formatWeekDay = (date: string) => new Date(`${date}T00:00:00.000Z`).toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric', timeZone: 'UTC' });
const getLocalDateString = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const getCurrentMonday = () => {
  const today = new Date();
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return getLocalDateString(monday);
};

const addDays = (date: string, days: number) => {
  const result = new Date(`${date}T00:00:00`);
  result.setDate(result.getDate() + days);
  return getLocalDateString(result);
};

const getEventColors = (classCode: string) => {
  let hash = 2166136261;
  for (const character of classCode.toLocaleUpperCase()) {
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  }
  const hue = (hash >>> 0) % 360;
  return {
    '--event-color': `hsl(${hue} 55% 48%)`,
    '--event-background': `hsl(${hue} 75% 95%)`,
    '--event-text': `hsl(${hue} 45% 26%)`,
  };
};

interface ScheduleFormModalProps {
  schedule: TimetableEvent;
  onSave: (data: TimetableFormData) => Promise<void>;
  onClose: () => void;
  error: string;
  saving: boolean;
}

const ScheduleFormModal: React.FC<ScheduleFormModalProps> = ({ schedule, onSave, onClose, error, saving }) => {
  const [form, setForm] = useState<TimetableFormData>(
    {
      ...EMPTY_FORM,
      sessionDate: schedule.date,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      classroom: schedule.classroom,
      topic: schedule.topic ?? '',
    }
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (form.endTime <= form.startTime) return;
    void onSave(form);
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Cập nhật lịch học">
      <div className="modal-box modal-lg">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Cập nhật lịch học</h2>
            <p className="modal-subtitle">Chỉnh sửa riêng buổi học đã chọn</p>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Đóng">✕</button>
        </div>
        {error && <div className="form-error-banner" role="alert">{error}</div>}
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Lớp học</label>
              <div className="form-input" aria-readonly="true">{schedule.class.classCode}</div>
            </div>
            <div className="form-group">
              <label className="form-label">Ngày học</label>
              <div className="form-input" aria-readonly="true">{schedule.dayOfWeek}, {formatDate(schedule.date)}</div>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="schedule-room">Phòng học <span className="required">*</span></label>
              <select id="schedule-room" className="form-input" value={form.classroom} onChange={(event) => setForm((previous) => ({ ...previous, classroom: event.target.value }))} required>
                <option value="" disabled>Chọn phòng học</option>
                {form.classroom && !ROOM_OPTIONS.includes(form.classroom) && <option value={form.classroom}>{form.classroom} (phòng hiện có)</option>}
                {ROOM_OPTIONS.map((room) => <option key={room} value={room}>{room}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="schedule-start">Giờ bắt đầu <span className="required">*</span></label>
              <input id="schedule-start" type="time" className="form-input" value={form.startTime} onChange={(event) => setForm((previous) => ({ ...previous, startTime: event.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="schedule-end">Giờ kết thúc <span className="required">*</span></label>
              <input id="schedule-end" type="time" className="form-input" value={form.endTime} onChange={(event) => setForm((previous) => ({ ...previous, endTime: event.target.value }))} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="schedule-topic">Nội dung buổi học</label>
            <input id="schedule-topic" className="form-input" value={form.topic} onChange={(event) => setForm((previous) => ({ ...previous, topic: event.target.value }))} />
          </div>
          {form.endTime <= form.startTime && <div className="form-error-banner" role="alert">Giờ kết thúc phải sau giờ bắt đầu.</div>}
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>Hủy</button>
            <button type="submit" className="btn btn-primary" disabled={saving || !form.classroom}>
              {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const TimetableManagementPage: React.FC = () => {
  const [weekStart, setWeekStart] = useState(getCurrentMonday);
  const [week, setWeek] = useState<TimetableWeek>(EMPTY_WEEK);
  const [options, setOptions] = useState<TimetableOptions>({ classes: [], teachers: [], rooms: [] });
  const [classFilter, setClassFilter] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('');
  const [roomFilter, setRoomFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [optionsError, setOptionsError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<TimetableEvent | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<TimetableEvent | null>(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    void timetableService.getOptions().then((response) => {
      if (response.data) setOptions(response.data);
    }).catch(() => {
      setOptionsError('Không tải được danh sách lớp và giảng viên.');
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadWeek = async () => {
      try {
        const response = await timetableService.getWeek({
          weekStart,
          classId: classFilter,
          teacherId: teacherFilter,
          room: roomFilter,
        });
        if (!cancelled && response.data) {
          setWeek(response.data);
          setError('');
        }
      } catch (requestError: unknown) {
        if (!cancelled) {
          const details = requestError as {
            response?: { status?: number; data?: { message?: unknown } };
            message?: string;
          };
          const status = details.response?.status;
          const message = details.response?.data?.message;
          const errorMessage = typeof message === 'string' ? message : details.message;
          setError(status
            ? `Không tải được thời khóa biểu (HTTP ${status})${errorMessage ? `: ${errorMessage}` : '.'}`
            : `Không tải được thời khóa biểu${errorMessage ? `: ${errorMessage}` : '. Vui lòng kiểm tra backend/API đang chạy.'}`);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void loadWeek();
    return () => { cancelled = true; };
  }, [weekStart, classFilter, teacherFilter, roomFilter, reloadKey]);

  const shiftWeek = (amount: number) => {
    setLoading(true);
    setWeekStart((current) => addDays(current, amount * 7));
  };

  const showSuccess = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 3000);
  };

  const handleSave = async (data: TimetableFormData) => {
    setSaving(true);
    setFormError('');
    try {
      if (!editingSchedule) return;
      await timetableService.updateSchedule(editingSchedule._id, data);
      showSuccess('Đã cập nhật lịch học.');
      setShowForm(false);
      setEditingSchedule(null);
      setLoading(true);
      const response = await timetableService.getWeek({
        weekStart,
        classId: classFilter,
        teacherId: teacherFilter,
        room: roomFilter,
      });
      if (response.data) setWeek(response.data);
    } catch (requestError: unknown) {
      const message = (requestError as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(message ?? 'Không thể lưu lịch học. Vui lòng thử lại.');
    } finally {
      setLoading(false);
      setSaving(false);
    }
  };

  const weekLabel = week.weekStart && week.weekEnd
    ? `${formatDate(week.weekStart)} – ${formatDate(week.weekEnd)}`
    : `${formatDate(weekStart)} – ${formatDate(addDays(weekStart, 6))}`;
  const filteredTeachers = classFilter
    ? options.classes.find((classItem) => classItem._id === classFilter)?.teachers ?? []
    : options.teachers;

  return (
    <div className="courses-page timetable-page">
      <nav className="staff-breadcrumb" aria-label="Breadcrumb">
        <Link to="/staff/dashboard">Tổng quan</Link>
        <span className="breadcrumb-sep">›</span>
        <span>Thời khóa biểu</span>
      </nav>
      <div className="courses-page-header">
        <div>
          <h1 className="courses-page-title">Thời khóa biểu</h1>
          <p className="courses-page-subtitle">Lịch các buổi học đã được tạo từ lớp học · chỉ chỉnh sửa lịch có sẵn</p>
        </div>
      </div>

      {optionsError && <div className="form-error-banner" role="alert">{optionsError}</div>}
      <div className="courses-filter-bar timetable-filter-bar">
        <select className="form-input courses-filter-select" value={classFilter} onChange={(event) => { setLoading(true); setClassFilter(event.target.value); setTeacherFilter(''); }}>
          <option value="">Tất cả lớp</option>
          {options.classes.map((classItem) => <option key={classItem._id} value={classItem._id}>{classItem.classCode}</option>)}
        </select>
        <select className="form-input courses-filter-select" value={teacherFilter} onChange={(event) => { setLoading(true); setTeacherFilter(event.target.value); }}>
          <option value="">Tất cả giảng viên</option>
          {filteredTeachers.map((teacher) => <option key={teacher._id} value={teacher._id}>{teacher.fullName}</option>)}
        </select>
        <select className="form-input courses-filter-select" value={roomFilter} onChange={(event) => { setLoading(true); setRoomFilter(event.target.value); }}>
          <option value="">Tất cả phòng</option>
          {options.rooms.map((room) => <option key={room} value={room}>{room}</option>)}
        </select>
      </div>

      <div className="timetable-week-toolbar">
        <button className="btn btn-outline" onClick={() => shiftWeek(-1)}>← Tuần trước</button>
        <strong>{weekLabel}</strong>
        <button className="btn btn-outline" onClick={() => shiftWeek(1)}>Tuần sau →</button>
      </div>

      {error && !loading && (
        <div className="form-error-banner" role="alert">
          {error}
          <button className="btn btn-ghost" style={{ marginLeft: '1rem' }} onClick={() => { setLoading(true); setReloadKey((current) => current + 1); }}>Thử lại</button>
        </div>
      )}

      {loading ? (
        <div className="courses-table-wrap courses-loading"><div className="loading-spinner" /><p>Đang tải thời khóa biểu…</p></div>
      ) : (
        <section className="timetable-calendar" aria-label="Lịch học tuần">
          {DAYS.map((day) => {
            const date = addDays(week.weekStart || weekStart, (day.index + 6) % 7);
            const events = week.events
              .filter((event) => event.date === date)
              .sort((left, right) => left.startTime.localeCompare(right.startTime));
            return (
              <div className="timetable-day-column" key={day.label}>
                <header className="timetable-day-header">
                  <strong>{day.label}</strong>
                  <span>{formatWeekDay(date)}</span>
                </header>
                <div className="timetable-day-events">
                  {events.length === 0 ? (
                    <span className="timetable-day-empty">Không có lịch</span>
                  ) : events.map((event) => (
                    <button
                      type="button"
                      className="timetable-event"
                      key={`${event._id}-${event.date}`}
                      style={getEventColors(event.class.classCode) as React.CSSProperties}
                      onClick={() => setSelectedEvent(event)}
                    >
                      <strong>{event.class.classCode}</strong>
                      <span>{event.startTime} – {event.endTime}</span>
                      <span>{event.classroom}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {selectedEvent && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Chi tiết lịch học">
          <div className="modal-box modal-lg">
            <div className="modal-header">
              <div><h2 className="modal-title">Chi tiết lịch học</h2><p className="modal-subtitle">{selectedEvent.class.classCode} · {selectedEvent.dayOfWeek}, {formatDate(selectedEvent.date)}</p></div>
              <button type="button" className="modal-close-btn" onClick={() => setSelectedEvent(null)} aria-label="Đóng">✕</button>
            </div>
            <div className="enrollment-detail-grid">
              <div><span>Lớp học</span><strong>{selectedEvent.class.name || selectedEvent.class.classCode}</strong></div>
              <div><span>Khóa học</span><strong>{selectedEvent.class.course?.title ?? 'Chưa có dữ liệu khóa học'}</strong></div>
              <div><span>Ngày và giờ</span><strong>{selectedEvent.dayOfWeek} · {selectedEvent.startTime} – {selectedEvent.endTime}</strong></div>
              <div><span>Phòng</span><strong>{selectedEvent.classroom}</strong></div>
              <div><span>Thời gian lớp</span><strong>{formatDate(selectedEvent.class.startDate)} – {formatDate(selectedEvent.class.endDate)}</strong></div>
              <div><span>Nội dung</span><strong>{selectedEvent.topic || 'Chưa có nội dung buổi học'}</strong></div>
              <div className="enrollment-detail-wide"><span>Giảng viên</span><strong>{selectedEvent.teachers.length ? selectedEvent.teachers.map((teacher) => teacher.fullName).join(', ') : 'Chưa có giảng viên được phân công'}</strong></div>
            </div>
            <div className="modal-footer timetable-detail-actions">
              <Link className="btn btn-outline" to="/staff/classes">Mở quản lý lớp</Link>
              <button className="btn btn-primary" onClick={() => { setEditingSchedule(selectedEvent); setSelectedEvent(null); setFormError(''); setShowForm(true); }}>Cập nhật lịch</button>
            </div>
          </div>
        </div>
      )}

      {showForm && editingSchedule && (
        <ScheduleFormModal
          schedule={editingSchedule}
          onSave={handleSave}
          onClose={() => setShowForm(false)}
          error={formError}
          saving={saving}
        />
      )}
      {toast && <div className="toast toast-success" role="status">{toast}</div>}
    </div>
  );
};

export default TimetableManagementPage;
