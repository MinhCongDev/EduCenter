import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { staffManagementService } from '../../services/staff-management.service';
import type { ManagedTeacherDetail } from '../../types';

const formatDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('vi-VN');
};

const TeacherDetailPage: React.FC = () => {
  const { id = '' } = useParams();
  const [detail, setDetail] = useState<ManagedTeacherDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    void staffManagementService.getTeacher(id)
      .then((response) => {
        if (!cancelled && response.data) {
          setDetail(response.data);
          setError('');
        }
      })
      .catch((requestError: unknown) => {
        if (cancelled) return;
        const message = (requestError as { response?: { data?: { message?: string } } })?.response?.data?.message;
        setError(message ?? 'Không tải được hồ sơ giảng viên.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <div className="courses-loading"><div className="loading-spinner" /><p>Đang tải hồ sơ giảng viên…</p></div>;
  if (error || !detail) {
    return (
      <div className="courses-page">
        <div className="form-error-banner" role="alert">{error || 'Không tìm thấy giảng viên.'}</div>
        <Link className="btn btn-outline" to="/staff/teachers">Quay lại danh sách</Link>
      </div>
    );
  }

  const { user, profile, classes } = detail;
  return (
    <div className="courses-page">
      <nav className="staff-breadcrumb" aria-label="Breadcrumb">
        <Link to="/staff/dashboard">Tổng quan</Link><span className="breadcrumb-sep">›</span>
        <Link to="/staff/teachers">Quản lý giảng viên</Link><span className="breadcrumb-sep">›</span><span>Hồ sơ giảng viên</span>
      </nav>
      <div className="courses-page-header">
        <div>
          <h1 className="courses-page-title">{user.fullName}</h1>
          <p className="courses-page-subtitle">Hồ sơ giảng viên · {profile?.teacherCode ?? 'Chưa có mã giảng viên'}</p>
        </div>
        <Link className="btn btn-outline" to="/staff/teachers">Quay lại danh sách</Link>
      </div>
      <section className="dash-card">
        <h2 className="dash-card-title">Thông tin cá nhân và chuyên môn</h2>
        <div className="enrollment-detail-grid">
          <div><span>Email</span><strong>{user.email}</strong></div>
          <div><span>Số điện thoại</span><strong>{user.phone || '—'}</strong></div>
          <div><span>Ngày sinh</span><strong>{formatDate(user.dob)}</strong></div>
          <div><span>Địa chỉ</span><strong>{user.address || '—'}</strong></div>
          <div><span>Ngày tạo tài khoản</span><strong>{formatDate(user.createdAt)}</strong></div>
          <div><span>Trạng thái tài khoản</span><strong>{user.status === 'ACTIVE' ? 'Đang hoạt động' : user.status === 'SUSPENDED' ? 'Đình chỉ' : 'Ngừng hoạt động'}</strong></div>
          <div><span>Chuyên môn</span><strong>{profile?.specialization.join(', ') || '—'}</strong></div>
          <div><span>Bằng cấp</span><strong>{profile?.qualifications.join(', ') || '—'}</strong></div>
          <div><span>Kinh nghiệm</span><strong>{profile?.yearsOfExperience ?? '—'} năm</strong></div>
          <div><span>IELTS</span><strong>{profile?.ieltsBand ?? '—'}</strong></div>
          <div><span>Giới thiệu</span><strong>{profile?.bio || '—'}</strong></div>
        </div>
      </section>
      <h2 className="enrollment-payment-heading">Lớp phụ trách ({classes.length})</h2>
      {classes.length === 0 ? (
        <div className="courses-empty"><h3>Giảng viên chưa được phân công lớp</h3></div>
      ) : (
        <div className="courses-table-wrap class-table-wrap">
          <table className="courses-table" aria-label="Các lớp giảng viên phụ trách">
            <thead><tr><th>Mã lớp</th><th>Khóa học</th><th>Thời gian</th><th>Trạng thái</th></tr></thead>
            <tbody>
              {classes.map((classroom) => (
                <tr className="courses-table-row" key={classroom._id}>
                  <td>{classroom.classCode}</td>
                  <td>{classroom.course?.code} · {classroom.course?.title}</td>
                  <td>{formatDate(classroom.startDate)} – {formatDate(classroom.endDate)}</td>
                  <td>{classroom.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TeacherDetailPage;
