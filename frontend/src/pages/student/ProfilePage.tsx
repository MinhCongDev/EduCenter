import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { authService } from '../../services/auth.service';
import { studentService } from '../../services/student.service';
import type { StudentProfile } from '../../types';
import { Button } from '../../components/Button';
import { SkeletonPage } from '../../components/Skeleton';
import { formatDate } from '../../utils/format';
import { getPhoneValidationError, sanitizePhoneInput } from '../../utils/phoneValidation';

type ProfileForm = {
  fullName: string;
  phone: string;
  address: string;
  dob: string;
  avatarUrl: string;
};

const makeForm = (user: any): ProfileForm => ({
  fullName: user?.fullName || '',
  phone: user?.phone || '',
  address: user?.address || '',
  dob: user?.dob ? new Date(user.dob).toISOString().slice(0, 10) : '',
  avatarUrl: user?.avatarUrl || '',
});

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<ProfileForm>(() => makeForm(user));
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const role = user?.role || 'STUDENT';

  useEffect(() => {
    void fetchProfile();
    // Load the latest profile once when the page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const res = await authService.getMe();
      if (res.success && res.data?.user) {
        const u = res.data.user;
        updateUser(u);
        setForm(makeForm(u));

        if (u.studentProfile) {
          setStudent(u.studentProfile);
        } else if (u.role === 'STUDENT') {
          try {
            const studentRes = await studentService.getMyProfile();
            if (studentRes.success && studentRes.data?.student) {
              setStudent(studentRes.data.student);
            }
          } catch {
            // ignore fallback error
          }
        }
      } else {
        toast.error('Không thể tải thông tin cá nhân');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể tải thông tin cá nhân');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim()) {
      toast.warning('Vui lòng nhập họ và tên.');
      return;
    }

    const phoneError = getPhoneValidationError(form.phone);
    if (phoneError) {
      toast.warning(phoneError);
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
        updateUser(res.data.user);
        setForm(makeForm(res.data.user));
        setIsEditing(false);
        toast.success('Cập nhật thông tin cá nhân thành công.');
        await fetchProfile();
      } else {
        toast.error(res.message || 'Cập nhật thông tin thất bại.');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Cập nhật thông tin thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh quá lớn. Vui lòng chọn ảnh tối đa 5MB.');
      e.target.value = '';
      return;
    }

    try {
      setUploadingAvatar(true);
      const res = await authService.uploadAvatar(file);
      if (res.success && res.data?.user) {
        updateUser(res.data.user);
        setForm((current) => ({ ...current, avatarUrl: res.data!.user.avatarUrl || '' }));
        toast.success('Cập nhật ảnh đại diện thành công.');
      } else {
        toast.error(res.message || 'Tải ảnh đại diện thất bại.');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Tải ảnh đại diện thất bại.');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCancelEdit = () => {
    setForm(makeForm(user));
    setIsEditing(false);
  };

  const [showPwd, setShowPwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [savingPwd, setSavingPwd] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwdForm.currentPassword || !pwdForm.newPassword) {
      toast.warning('Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới.');
      return;
    }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      toast.error('Mật khẩu mới và xác nhận mật khẩu không khớp.');
      return;
    }
    if (pwdForm.newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }

    try {
      setSavingPwd(true);
      const res = await authService.changePassword(pwdForm);
      if (res.success) {
        toast.success('Đổi mật khẩu thành công.');
        setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowPwd(false);
      } else {
        toast.error(res.message || 'Đổi mật khẩu thất bại.');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Đổi mật khẩu thất bại.');
    } finally {
      setSavingPwd(false);
    }
  };

  if (isLoading) return <SkeletonPage message="Đang tải thông tin cá nhân..." />;

  const initials = form.fullName.trim().split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase() || 'EC';

  // Role metadata
  const roleBadgeMap: Record<string, { badge: string; icon: string; idLabel: string; bg: string; color: string }> = {
    STUDENT: { badge: 'Học viên', icon: '🎓', idLabel: 'Mã học viên', bg: '#eaf7ef', color: '#27804a' },
    TEACHER: { badge: 'Giảng viên IELTS', icon: '👨‍🏫', idLabel: 'Mã giảng viên', bg: '#eff6ff', color: '#1d4ed8' },
    TRAINING_STAFF: { badge: 'Giáo vụ đào tạo', icon: '📋', idLabel: 'Mã nhân sự', bg: '#fef3c7', color: '#b45309' },
    DIRECTOR: { badge: 'Ban giám đốc', icon: '🏛️', idLabel: 'Mã quản trị', bg: '#f3e8ff', color: '#7e22ce' },
  };

  const currentRoleInfo = roleBadgeMap[role] || roleBadgeMap.STUDENT;

  const idCode =
    role === 'STUDENT'
      ? student?.studentCode || user?.studentProfile?.studentCode || 'HV'
      : role === 'TEACHER'
      ? user?.teacherProfile?.teacherCode || 'GV'
      : user?.staffProfile?.staffCode || (role === 'DIRECTOR' ? 'BGD' : 'NV');

  const statusLabel =
    user?.status === 'ACTIVE'
      ? 'Đang hoạt động'
      : user?.status === 'INACTIVE'
      ? 'Ngừng hoạt động'
      : 'Đang hoạt động';

  return (
    <div className="dash-container profile-page">
      <style>{`
        .profile-page { --profile-primary: #10b981; --profile-ink: #282238; --profile-muted: #7c7888; }
        .profile-page .profile-layout { display:grid; grid-template-columns:minmax(280px, .82fr) minmax(0, 1.55fr); gap:24px; align-items:start; }
        .profile-page .profile-card { background:#fff; border:1px solid #eceaf0; border-radius:16px; box-shadow:0 2px 10px rgba(35,27,48,.045); overflow:hidden; }
        .profile-page .profile-card-body { padding:24px; }
        .profile-page .profile-banner { height:104px; background:linear-gradient(120deg,#1e293b 0%,#0f766e 62%,#10b981 145%); }
        .profile-page .profile-avatar-wrap { position:relative; width:100px; height:100px; margin-top:-52px; }
        .profile-page .profile-avatar { width:100px; height:100px; border:4px solid #fff; border-radius:50%; background:linear-gradient(135deg,#059669,#10b981); box-shadow:0 4px 16px rgba(0,0,0,.14); object-fit:cover; display:flex; align-items:center; justify-content:center; color:#fff; font-size:30px; font-weight:800; }
        .profile-page .profile-avatar-edit { position:absolute; inset:0; border:4px solid transparent; border-radius:50%; background:rgba(25,20,35,.55); color:#fff; font-size:22px; cursor:pointer; opacity:0; transition:opacity .18s; display:flex; align-items:center; justify-content:center; }
        .profile-page .profile-avatar-wrap:hover .profile-avatar-edit { opacity:1; }
        .profile-page .profile-section-title { display:flex; align-items:center; gap:9px; color:#302a3c; font-size:14px; font-weight:750; margin:0 0 17px; }
        .profile-page .profile-section-title:after { content:""; height:1px; background:#eceaf0; flex:1; margin-left:5px; }
        .profile-page .profile-field { margin-bottom:16px; }
        .profile-page .profile-field label { display:block; color:#696576; font-size:12px; font-weight:650; margin-bottom:7px; }
        .profile-page .profile-field input { box-sizing:border-box; width:100%; min-height:42px; border:1px solid #e4e1e9; border-radius:9px; padding:9px 12px; background:#fff; color:#302a3c; font:inherit; font-size:14px; outline:none; transition:border-color .15s,box-shadow .15s; }
        .profile-page .profile-field input:focus { border-color:#10b981; box-shadow:0 0 0 3px rgba(16,185,129,.15); }
        .profile-page .profile-field input:disabled { background:#f7f6f8; color:#777382; cursor:not-allowed; }
        .profile-page .profile-info-row { display:flex; justify-content:space-between; gap:12px; padding:12px 0; border-bottom:1px solid #f0eef2; font-size:13px; }
        .profile-page .profile-info-row:last-child { border-bottom:0; }
        .profile-page .profile-info-label { color:#858190; }
        .profile-page .profile-info-value { color:#393447; font-weight:650; text-align:right; }
        .profile-page .profile-pill { display:inline-flex; align-items:center; border-radius:999px; padding:5px 12px; font-size:12px; font-weight:700; gap:5px; }
        .profile-page .profile-hint { margin:7px 0 0; color:#9692a0; font-size:11px; }
        .profile-page .profile-actions { display:flex; gap:9px; flex-wrap:wrap; justify-content:flex-end; }
        @media(max-width:850px) { .profile-page .profile-layout { grid-template-columns:1fr; } }
        @media(max-width:560px) { .profile-page .profile-card-body { padding:18px; } .profile-page .profile-form-grid { grid-template-columns:1fr !important; } }
      `}</style>

      {/* Header Banner */}
      <div className="dash-banner">
        <div className="dash-banner-content">
          <div className="dash-banner-badge">{currentRoleInfo.icon} Hồ sơ cá nhân · {currentRoleInfo.badge}</div>
          <h1>Thông tin tài khoản</h1>
          <p>Quản lý hồ sơ công tác, thông tin cá nhân và bảo mật tài khoản EduCenter của bạn.</p>
        </div>
        <div className="dash-banner-right">
          <div className="dash-date-pill">
            <div>ID: {idCode}</div>
            <div className="sub">{currentRoleInfo.idLabel}</div>
          </div>
        </div>
      </div>

      <div className="profile-layout">
        {/* Left Column: Avatar & Role Summary Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <section className="profile-card">
            <div className="profile-banner" />
            <div className="profile-card-body">
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
                <div className="profile-avatar-wrap">
                  {form.avatarUrl ? (
                    <img className="profile-avatar" src={form.avatarUrl} alt={`Ảnh đại diện ${form.fullName}`} />
                  ) : (
                    <div className="profile-avatar">{initials}</div>
                  )}
                  <span style={{ position: 'absolute', width: 13, height: 13, right: 3, bottom: 6, borderRadius: '50%', background: '#10b981', border: '2px solid white' }} />
                  {isEditing && (
                    <button className="profile-avatar-edit" type="button" title="Đổi ảnh đại diện" onClick={() => fileInputRef.current?.click()}>
                      📷
                    </button>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={handleAvatarFile} disabled={uploadingAvatar} style={{ display: 'none' }} />
                </div>
                {!isEditing && (
                  <Button type="button" variant="primary" onClick={() => setIsEditing(true)}>
                    Chỉnh sửa
                  </Button>
                )}
              </div>

              <h2 style={{ margin: '0 0 5px', color: '#302a3c', fontSize: 20, fontWeight: 800 }}>{form.fullName || 'Người dùng'}</h2>
              <p style={{ margin: '0 0 13px', color: '#858190', fontSize: 13, overflowWrap: 'anywhere' }}>✉ {user?.email || '—'}</p>
              <span className="profile-pill" style={{ background: currentRoleInfo.bg, color: currentRoleInfo.color }}>
                {currentRoleInfo.icon} {currentRoleInfo.badge}
              </span>
              {isEditing && (
                <p className="profile-hint">Ảnh JPG, PNG, GIF hoặc WEBP · Tối đa 5MB. Bấm vào biểu tượng máy ảnh trên avatar để đổi ảnh.</p>
              )}
            </div>
          </section>

          {/* Role Details Card */}
          <section className="profile-card">
            <div className="profile-card-body">
              {role === 'STUDENT' ? (
                <>
                  <h3 className="profile-section-title"><span>🎓</span> Thông tin học tập</h3>
                  <div className="profile-info-row">
                    <span className="profile-info-label">Mã học viên</span>
                    <span className="profile-info-value">{student?.studentCode || user?.studentProfile?.studentCode || '—'}</span>
                  </div>
                  <div className="profile-info-row">
                    <span className="profile-info-label">Trạng thái</span>
                    <span className="profile-info-value"><span className="profile-pill" style={{ background: '#eaf7ef', color: '#27804a' }}>{statusLabel}</span></span>
                  </div>
                  {(student?.currentBand != null || user?.studentProfile?.currentBand != null) && (
                    <div className="profile-info-row">
                      <span className="profile-info-label">Band hiện tại</span>
                      <span className="profile-info-value">IELTS {student?.currentBand ?? user?.studentProfile?.currentBand}</span>
                    </div>
                  )}
                  {(student?.targetBand != null || user?.studentProfile?.targetBand != null) && (
                    <div className="profile-info-row">
                      <span className="profile-info-label">Band mục tiêu</span>
                      <span className="profile-info-value">IELTS {student?.targetBand ?? user?.studentProfile?.targetBand}</span>
                    </div>
                  )}
                  {student?.dob && (
                    <div className="profile-info-row">
                      <span className="profile-info-label">Ngày sinh hồ sơ</span>
                      <span className="profile-info-value">{formatDate(student.dob)}</span>
                    </div>
                  )}
                </>
              ) : role === 'TEACHER' ? (
                <>
                  <h3 className="profile-section-title"><span>👨‍🏫</span> Hồ sơ chuyên môn</h3>
                  <div className="profile-info-row">
                    <span className="profile-info-label">Mã giảng viên</span>
                    <span className="profile-info-value">{user?.teacherProfile?.teacherCode || 'GV-IELTS'}</span>
                  </div>
                  <div className="profile-info-row">
                    <span className="profile-info-label">Chứng chỉ IELTS</span>
                    <span className="profile-info-value">IELTS {user?.teacherProfile?.ieltsBand || 8.5} Overall</span>
                  </div>
                  <div className="profile-info-row">
                    <span className="profile-info-label">Chuyên môn</span>
                    <span className="profile-info-value">{user?.teacherProfile?.specialization?.join(', ') || 'IELTS 4 Kỹ Năng'}</span>
                  </div>
                  <div className="profile-info-row">
                    <span className="profile-info-label">Bằng cấp</span>
                    <span className="profile-info-value">{user?.teacherProfile?.qualifications?.join(', ') || 'CELTA, Master of TESOL'}</span>
                  </div>
                  <div className="profile-info-row">
                    <span className="profile-info-label">Kinh nghiệm</span>
                    <span className="profile-info-value">{user?.teacherProfile?.yearsOfExperience || 3} năm giảng dạy</span>
                  </div>
                  <div className="profile-info-row">
                    <span className="profile-info-label">Trạng thái</span>
                    <span className="profile-info-value"><span className="profile-pill" style={{ background: '#eff6ff', color: '#1d4ed8' }}>{statusLabel}</span></span>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="profile-section-title"><span>📋</span> Thông tin công tác</h3>
                  <div className="profile-info-row">
                    <span className="profile-info-label">Mã nhân sự</span>
                    <span className="profile-info-value">{user?.staffProfile?.staffCode || (role === 'DIRECTOR' ? 'BGD-01' : 'NV-01')}</span>
                  </div>
                  <div className="profile-info-row">
                    <span className="profile-info-label">Phòng ban</span>
                    <span className="profile-info-value">{user?.staffProfile?.department || (role === 'DIRECTOR' ? 'Ban Giám Đốc' : 'Phòng Giáo vụ - Đào tạo')}</span>
                  </div>
                  <div className="profile-info-row">
                    <span className="profile-info-label">Chức vụ</span>
                    <span className="profile-info-value">{user?.staffProfile?.position || (role === 'DIRECTOR' ? 'Giám đốc trung tâm' : 'Chuyên viên Đào tạo')}</span>
                  </div>
                  <div className="profile-info-row">
                    <span className="profile-info-label">Ngày gia nhập</span>
                    <span className="profile-info-value">{formatDate(user?.staffProfile?.joinDate || user?.createdAt)}</span>
                  </div>
                  <div className="profile-info-row">
                    <span className="profile-info-label">Trạng thái</span>
                    <span className="profile-info-value"><span className="profile-pill" style={{ background: '#fef3c7', color: '#b45309' }}>{statusLabel}</span></span>
                  </div>
                </>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Personal & Contact Information Form */}
        <section className="profile-card">
          <div className="profile-card-body">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 22 }}>
              <div>
                <h2 style={{ margin: 0, color: '#302a3c', fontSize: 18, fontWeight: 800 }}>Thông tin cá nhân</h2>
                <p style={{ margin: '5px 0 0', color: '#858190', fontSize: 12 }}>{isEditing ? 'Cập nhật các thông tin bên dưới và bấm Lưu.' : 'Xem thông tin liên hệ và hồ sơ của bạn.'}</p>
              </div>
              {isEditing && <span className="profile-pill" style={{ background: '#ecfdf5', color: '#047857' }}>Đang chỉnh sửa</span>}
            </div>

            <form onSubmit={handleSave}>
              <h3 className="profile-section-title"><span>👤</span> Thông tin cơ bản</h3>
              <div className="profile-field">
                <label>Họ và tên *</label>
                <input type="text" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} disabled={!isEditing} required placeholder="Nhập họ và tên" />
              </div>

              <h3 className="profile-section-title" style={{ marginTop: 24 }}><span>✉</span> Thông tin liên hệ</h3>
              <div className="profile-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                <div className="profile-field">
                  <label>Địa chỉ email</label>
                  <input type="email" value={user?.email || ''} disabled />
                  <p className="profile-hint">Email đăng nhập duy nhất không thể thay đổi.</p>
                </div>
                <div className="profile-field">
                  <label>Số điện thoại</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: sanitizePhoneInput(e.target.value) }))}
                    disabled={!isEditing}
                    placeholder="Ví dụ: 0901234567"
                  />
                  <p className="profile-hint">10 chữ số · Đầu số 03, 05, 07, 08 hoặc 09.</p>
                </div>
                <div className="profile-field">
                  <label>Ngày sinh</label>
                  <input type="date" value={form.dob} onChange={(e) => setForm((f) => ({ ...f, dob: e.target.value }))} disabled={!isEditing} />
                </div>
                <div className="profile-field">
                  <label>Địa chỉ liên hệ</label>
                  <input type="text" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} disabled={!isEditing} placeholder="Nhập địa chỉ của bạn" />
                </div>
              </div>

              {isEditing && (
                <div className="profile-actions" style={{ borderTop: '1px solid #eeecf1', paddingTop: 20, marginTop: 10 }}>
                  <Button type="button" variant="secondary" onClick={handleCancelEdit} disabled={saving || uploadingAvatar}>Hủy</Button>
                  <Button type="submit" variant="primary" icon="💾" loading={saving} disabled={uploadingAvatar}>Lưu thay đổi</Button>
                </div>
              )}
            </form>
          </div>
        </section>
      </div>

      {/* Security & Password Card */}
      <section className="profile-card" style={{ marginTop: 22 }}>
        <div className="profile-card-body">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: 0, color: '#302a3c', fontSize: 18, fontWeight: 800 }}>🔒 Bảo mật tài khoản</h2>
              <p style={{ margin: '5px 0 0', color: '#858190', fontSize: 13 }}>Thay đổi mật khẩu đăng nhập định kỳ để tăng cường an toàn tài khoản.</p>
            </div>
            {!showPwd && (
              <Button type="button" variant="secondary" onClick={() => setShowPwd(true)}>Đổi mật khẩu</Button>
            )}
          </div>

          {showPwd && (
            <form onSubmit={handleChangePassword} style={{ marginTop: 22, maxWidth: 560 }}>
              <div className="profile-field">
                <label>Mật khẩu hiện tại *</label>
                <input type="password" value={pwdForm.currentPassword} onChange={(e) => setPwdForm((f) => ({ ...f, currentPassword: e.target.value }))} placeholder="Nhập mật khẩu hiện tại" autoComplete="current-password" required />
              </div>
              <div className="profile-field">
                <label>Mật khẩu mới *</label>
                <input type="password" value={pwdForm.newPassword} onChange={(e) => setPwdForm((f) => ({ ...f, newPassword: e.target.value }))} placeholder="Tối thiểu 6 ký tự" autoComplete="new-password" required />
              </div>
              <div className="profile-field">
                <label>Xác nhận mật khẩu mới *</label>
                <input type="password" value={pwdForm.confirmPassword} onChange={(e) => setPwdForm((f) => ({ ...f, confirmPassword: e.target.value }))} placeholder="Nhập lại mật khẩu mới" autoComplete="new-password" required />
              </div>
              <div className="profile-actions">
                <Button type="button" variant="secondary" onClick={() => { setShowPwd(false); setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); }} disabled={savingPwd}>Hủy</Button>
                <Button type="submit" variant="primary" icon="🔐" loading={savingPwd}>Xác nhận đổi mật khẩu</Button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};

export default ProfilePage;
