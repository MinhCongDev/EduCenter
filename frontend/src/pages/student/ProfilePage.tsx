import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { authService } from '../../services/auth.service';
import { studentService } from '../../services/student.service';
import type { StudentProfile } from '../../types';
import { Button } from '../../components/Button';
import { SettingsPanel } from '../../components/SettingsPanel';
import { SkeletonPage } from '../../components/Skeleton';
import { formatDate } from '../../utils/format';
import { studentStatusMeta } from '../../utils/labels';

type ProfileTab = 'profile' | 'settings';

const PROFILE_TABS: Array<{ key: ProfileTab; label: string; icon: string }> = [
  { key: 'profile', label: 'Hồ sơ cá nhân', icon: '👤' },
  { key: 'settings', label: 'Cài đặt', icon: '⚙️' },
];

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab: ProfileTab = tabParam === 'settings' ? 'settings' : 'profile';
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingStudent, setSavingStudent] = useState(false);

  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    address: user?.address || '',
    dob: user?.dob ? new Date(user.dob).toISOString().slice(0, 10) : '',
    avatarUrl: user?.avatarUrl || '',
  });

  // ── Form hồ sơ học viên (PUT /api/student/profile) ──
  const [studentForm, setStudentForm] = useState({
    targetBand: '',
    learningGoal: '',
    ecName: '',
    ecRelationship: '',
    ecPhone: '',
  });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const res = await studentService.getMyProfile();
      if (res.success && res.data) {
        const u = res.data.user;
        setStudent(res.data.student);
        setForm({
          fullName: u.fullName || '',
          phone: u.phone || '',
          address: u.address || '',
          dob: u.dob ? new Date(u.dob).toISOString().slice(0, 10) : '',
          avatarUrl: u.avatarUrl || '',
        });
        // Nạp sẵn form hồ sơ học viên để học viên chỉ cần chỉnh sửa.
        const s = res.data.student;
        setStudentForm({
          targetBand: s?.targetBand != null ? String(s.targetBand) : '',
          learningGoal: s?.learningGoal || '',
          ecName: s?.emergencyContact?.name || '',
          ecRelationship: s?.emergencyContact?.relationship || '',
          ecPhone: s?.emergencyContact?.phone || '',
        });
      } else {
        toast.error(res.message || 'Không thể tải thông tin cá nhân');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể tải thông tin cá nhân');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Lưu phần hồ sơ RIÊNG của học viên (band mục tiêu, mục tiêu học tập,
   * liên hệ khẩn cấp). `currentBand` là kết quả đánh giá của giảng viên
   * nên không cho học viên tự sửa.
   */
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();

    // Ô trống = xoá band mục tiêu → gửi `null` xuống backend.
    // Trước đây gửi `undefined` nên backend bỏ qua field và giữ giá trị
    // cũ → học viên không bao giờ xoá được band mục tiêu.
    const targetBand = studentForm.targetBand.trim()
      ? Number(studentForm.targetBand)
      : null;
    if (
      targetBand !== null &&
      (Number.isNaN(targetBand) || targetBand < 0 || targetBand > 9)
    ) {
      toast.warning('Band mục tiêu phải trong khoảng 0 - 9');
      return;
    }
    // Liên hệ khẩn cấp: nếu nhập tên thì bắt buộc có số điện thoại.
    if (studentForm.ecName.trim() && !/^\d{9,11}$/.test(studentForm.ecPhone.replace(/\s/g, ''))) {
      toast.warning('Số điện thoại liên hệ khẩn cấp không hợp lệ');
      return;
    }

    try {
      setSavingStudent(true);
      const res = await studentService.updateMyProfile({
        targetBand,
        learningGoal: studentForm.learningGoal.trim(),
        emergencyContact: {
          name: studentForm.ecName.trim(),
          relationship: studentForm.ecRelationship.trim(),
          phone: studentForm.ecPhone.trim(),
        },
      });
      if (res.success && res.data?.student) {
        toast.success(res.message || 'Cập nhật hồ sơ học viên thành công');
        setStudent(res.data.student);
        await fetchProfile();
      } else {
        toast.error(res.message || 'Cập nhật hồ sơ học viên thất bại');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Cập nhật hồ sơ học viên thất bại');
    } finally {
      setSavingStudent(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim()) {
      toast.warning('Vui lòng nhập họ tên');
      return;
    }
    try {
      setSaving(true);
      const res = await authService.updateProfile({
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        dob: form.dob || undefined,
        avatarUrl: form.avatarUrl.trim(),
      });
      if (res.success && res.data?.user) {
        toast.success('Cập nhật thông tin thành công');
        // Update auth context
        if (typeof updateUser === 'function') {
          updateUser(res.data.user);
        }
        // Re-fetch full profile
        await fetchProfile();
      } else {
        toast.error(res.message || 'Cập nhật thất bại');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh quá lớn (tối đa 5MB)');
      return;
    }
    try {
      setUploadingAvatar(true);
      const res = await authService.uploadAvatar(file);
      if (res.success && res.data?.user) {
        toast.success('Cập nhật ảnh đại diện thành công');
        if (typeof updateUser === 'function') {
          updateUser(res.data.user);
        }
        setForm((f) => ({ ...f, avatarUrl: res.data!.user.avatarUrl || '' }));
      } else {
        toast.error(res.message || 'Upload thất bại');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload thất bại');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── M2: Change password ──
  const [showPwd, setShowPwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingPwd, setSavingPwd] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwdForm.currentPassword || !pwdForm.newPassword) {
      toast.warning('Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới');
      return;
    }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      toast.error('Mật khẩu mới và xác nhận không khớp');
      return;
    }
    if (pwdForm.newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có tối thiểu 6 ký tự');
      return;
    }
    try {
      setSavingPwd(true);
      const res = await authService.changePassword(pwdForm);
      if (res.success) {
        toast.success('Đổi mật khẩu thành công. Hãy dùng mật khẩu mới cho lần đăng nhập sau.');
        setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowPwd(false);
      } else {
        toast.error(res.message || 'Đổi mật khẩu thất bại');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Đổi mật khẩu thất bại');
    } finally {
      setSavingPwd(false);
    }
  };

  if (isLoading) return <SkeletonPage message="Đang tải thông tin cá nhân..." />;

  const switchTab = (tab: ProfileTab) => {
    if (tab === activeTab) return;
    setSearchParams(tab === 'profile' ? {} : { tab });
  };

  return (
    <div className="dash-container">
      <div className="dash-banner">
        <div className="dash-banner-content">
          <div className="dash-banner-badge">👤 Hồ Sơ</div>
          <h1>Thông Tin Cá Nhân</h1>
          <p>Cập nhật thông tin cá nhân và cài đặt tài khoản của bạn. Những thay đổi sẽ được áp dụng ngay lập tức.</p>
        </div>
        <div className="dash-banner-right">
          <div className="dash-date-pill">
            <div>🆔 {student?.studentCode || '—'}</div>
            <div className="sub">Mã học viên</div>
          </div>
        </div>
      </div>

      {/* ── Tab: Hồ sơ cá nhân / Cài đặt ── */}
      <div className="dash-tabs" role="tablist" aria-label="Hồ sơ và cài đặt">
        {PROFILE_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={activeTab === t.key}
            className={`dash-tab${activeTab === t.key ? ' is-active' : ''}`}
            onClick={() => switchTab(t.key)}
          >
            <span aria-hidden="true">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'settings' ? (
        /* ══════════════ TAB: CÀI ĐẶT ══════════════ */
        <div className="dash-card">
          <div className="dash-card-header">
            <h2 className="dash-card-title"><span>⚙️</span> Cài Đặt Tài Khoản</h2>
          </div>
          <SettingsPanel />
        </div>
      ) : (
        <>
      <div className="dash-two-col">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Avatar + summary */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h2 className="dash-card-title"><span>👤</span> Tài Khoản</h2>
            </div>
            <div className="dash-subcard" style={{ textAlign: 'center', padding: '1.5rem' }}>
              <div
                style={{
                  width: '96px',
                  height: '96px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  margin: '0 auto 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                  color: 'white',
                  fontWeight: 700,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {form.avatarUrl ? (
                  <img
                    src={form.avatarUrl}
                    alt={form.fullName}
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  form.fullName?.charAt(0)?.toUpperCase() || 'U'
                )}
              </div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{form.fullName || '—'}</h3>
              <p style={{ margin: '0.25rem 0', color: '#64748b', fontSize: '0.9rem' }}>{user?.email}</p>
              <span className="badge-pill badge-blue" style={{ marginTop: '0.5rem', display: 'inline-block' }}>
                🎓 Học viên
              </span>
              <div style={{ marginTop: '1rem' }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  style={{ display: 'none' }}
                  onChange={handleAvatarFile}
                />
                <Button
                  type="button"
                  variant="secondary"
                  icon={uploadingAvatar ? '⏳' : '📷'}
                  loading={uploadingAvatar}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadingAvatar ? 'Đang tải lên...' : 'Đổi ảnh đại diện'}
                </Button>
                <p style={{ margin: '0.5rem 0 0', color: '#94a3b8', fontSize: '0.75rem' }}>
                  JPG/PNG/GIF/WEBP, tối đa 5MB
                </p>
              </div>
            </div>
          </div>

          {/* Student-specific */}
          {student && (
            <div className="dash-card">
              <div className="dash-card-header">
                <h2 className="dash-card-title"><span>🎓</span> Thông Tin Học Viên</h2>
              </div>
              <div className="dash-subcard">
                <Field label="Mã học viên" value={student.studentCode} />
                <Field
                  label="Trạng thái"
                  value={
                    <span className={`badge-pill ${studentStatusMeta(student.status).cls}`}>
                      {studentStatusMeta(student.status).icon} {studentStatusMeta(student.status).label}
                    </span>
                  }
                />
                {student.currentBand != null && (
                  <Field label="Band hiện tại" value={`IELTS ${student.currentBand}`} />
                )}
                {student.targetBand != null && (
                  <Field label="Band mục tiêu" value={`IELTS ${student.targetBand}`} />
                )}
                {student.dob && <Field label="Ngày sinh" value={formatDate(student.dob)} />}
              </div>
            </div>
          )}
        </div>

        {/* Edit form */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h2 className="dash-card-title"><span>✏️</span> Cập Nhật Thông Tin</h2>
          </div>
          <div className="dash-subcard">
            <form onSubmit={handleSave}>
              <Field label="Email" value={user?.email} muted />
              <Field label="Vai trò" value="Học viên (STUDENT)" muted />

              <div style={{ marginBottom: '1rem' }}>
                <label className="dash-subcard-label">Họ và tên *</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  required
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label className="dash-subcard-label">Số điện thoại</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="VD: 0901234567"
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label className="dash-subcard-label">Ngày sinh</label>
                <input
                  type="date"
                  value={form.dob}
                  onChange={(e) => setForm({ ...form, dob: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label className="dash-subcard-label">Địa chỉ</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="dash-subcard-label">URL ảnh đại diện (tùy chọn)</label>
                <input
                  type="url"
                  value={form.avatarUrl}
                  onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
                  placeholder="https://... hoặc dùng nút Đổi ảnh đại diện ở trên"
                  style={inputStyle}
                />
                <p style={{ margin: '0.4rem 0 0', color: '#94a3b8', fontSize: '0.75rem' }}>
                  Nếu đã upload qua nút "Đổi ảnh đại diện", ô này sẽ tự cập nhật.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <Button type="submit" variant="primary" loading={saving} icon="💾">
                  Lưu thay đổi
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={fetchProfile}
                  disabled={saving}
                >
                  🔄 Tải lại
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* ── Hồ sơ học viên: band mục tiêu, mục tiêu học tập, liên hệ khẩn cấp ── */}
      {student && (
        <div className="dash-card" style={{ marginTop: '1.5rem' }}>
          <div className="dash-card-header">
            <h2 className="dash-card-title">
              <span>🎯</span> Hồ Sơ Học Viên
            </h2>
            <span className="badge-pill badge-blue">Mã: {student.studentCode}</span>
          </div>
          <div className="dash-subcard">
            <form onSubmit={handleSaveStudent}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '0 1.5rem',
                }}
              >
                <div style={{ marginBottom: '1rem' }}>
                  <label className="dash-subcard-label">Band mục tiêu (IELTS 0 - 9)</label>
                  <input
                    type="number"
                    min={0}
                    max={9}
                    step={0.5}
                    value={studentForm.targetBand}
                    onChange={(e) =>
                      setStudentForm({ ...studentForm, targetBand: e.target.value })
                    }
                    placeholder="VD: 7.0"
                    style={inputStyle}
                  />
                  <p style={{ margin: '0.35rem 0 0', color: '#94a3b8', fontSize: '0.72rem' }}>
                    Band hiện tại do giảng viên đánh giá — không thể tự sửa.
                  </p>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label className="dash-subcard-label">Mục tiêu học tập</label>
                  <input
                    type="text"
                    value={studentForm.learningGoal}
                    onChange={(e) =>
                      setStudentForm({ ...studentForm, learningGoal: e.target.value })
                    }
                    placeholder="VD: Du học & Định cư"
                    style={inputStyle}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label className="dash-subcard-label">Người liên hệ khẩn cấp</label>
                  <input
                    type="text"
                    value={studentForm.ecName}
                    onChange={(e) =>
                      setStudentForm({ ...studentForm, ecName: e.target.value })
                    }
                    placeholder="Họ và tên"
                    style={inputStyle}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label className="dash-subcard-label">Quan hệ với người liên hệ</label>
                  <input
                    type="text"
                    value={studentForm.ecRelationship}
                    onChange={(e) =>
                      setStudentForm({ ...studentForm, ecRelationship: e.target.value })
                    }
                    placeholder="VD: Bố, Mẹ, Anh chị"
                    style={inputStyle}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label className="dash-subcard-label">SĐT liên hệ khẩn cấp</label>
                  <input
                    type="tel"
                    value={studentForm.ecPhone}
                    onChange={(e) =>
                      setStudentForm({ ...studentForm, ecPhone: e.target.value })
                    }
                    placeholder="VD: 0901234567"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <Button type="submit" variant="primary" loading={savingStudent} icon="💾">
                  Lưu hồ sơ học viên
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={fetchProfile}
                  disabled={savingStudent}
                >
                  🔄 Tải lại
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── M2: Change Password Card ── */}
      <div className="dash-card" style={{ marginTop: '1.5rem' }}>
        <div className="dash-card-header">
          <h2 className="dash-card-title">
            <span>🔒</span> Bảo Mật
          </h2>
          {!showPwd && (
            <Button type="button" variant="secondary" onClick={() => setShowPwd(true)}>
              🔑 Đổi mật khẩu
            </Button>
          )}
        </div>
        <div className="dash-subcard">
          {!showPwd ? (
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
              Mật khẩu hiện tại được bảo mật. Nhấn <strong>"Đổi mật khẩu"</strong> ở trên để cập nhật mật khẩu mới.
            </p>
          ) : (
            <form onSubmit={handleChangePassword}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="dash-subcard-label">Mật khẩu hiện tại *</label>
                <input
                  type="password"
                  value={pwdForm.currentPassword}
                  onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
                  placeholder="Nhập mật khẩu hiện tại"
                  style={inputStyle}
                  autoComplete="current-password"
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label className="dash-subcard-label">Mật khẩu mới *</label>
                <input
                  type="password"
                  value={pwdForm.newPassword}
                  onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                  placeholder="Tối thiểu 6 ký tự"
                  style={inputStyle}
                  autoComplete="new-password"
                />
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="dash-subcard-label">Xác nhận mật khẩu mới *</label>
                <input
                  type="password"
                  value={pwdForm.confirmPassword}
                  onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
                  placeholder="Nhập lại mật khẩu mới"
                  style={inputStyle}
                  autoComplete="new-password"
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <Button type="submit" variant="primary" loading={savingPwd} icon="🔐">
                  Xác nhận đổi mật khẩu
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowPwd(false);
                    setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                  disabled={savingPwd}
                >
                  ❌ Hủy
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
        </>
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

const Field: React.FC<{ label: string; value: React.ReactNode; muted?: boolean }> = ({
  label,
  value,
  muted,
}) => (
  <div style={{ marginBottom: '1rem' }}>
    <div className="dash-subcard-label">{label}</div>
    <div
      className="dash-subcard-value"
      style={{
        background: muted ? 'var(--dash-card-subtle)' : 'transparent',
        padding: muted ? '0.5rem 0.75rem' : 0,
        borderRadius: '6px',
        color: muted ? '#64748b' : 'inherit',
      }}
    >
      {value || '—'}
    </div>
  </div>
);

export default ProfilePage;
