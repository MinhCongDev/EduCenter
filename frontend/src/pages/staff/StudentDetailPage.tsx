import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { staffManagementService } from '../../services/staff-management.service';
import type { ManagedStudentDetail } from '../../types';

const formatDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('vi-VN');
};

const ENROLLMENT_LABELS: Record<string, string> = {
  PENDING: 'Chờ xử lý',
  ENROLLED: 'Đang học',
  DROPPED: 'Đã hủy',
  COMPLETED: 'Đã hoàn thành',
};

const StudentDetailPage: React.FC = () => {
  const { id = '' } = useParams();
  const [detail, setDetail] = useState<ManagedStudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    void staffManagementService.getStudent(id)
      .then((response) => {
        if (!cancelled && response.data) {
          setDetail(response.data);
          setError('');
        }
      })
      .catch((requestError: unknown) => {
        if (cancelled) return;
        const message = (requestError as { response?: { data?: { message?: string } } })?.response?.data?.message;
        setError(message ?? 'Không tải được hồ sơ học viên.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <div className="courses-loading"><div className="loading-spinner" /><p>Đang tải hồ sơ học viên…</p></div>;
  if (error || !detail) {
    return (
      <div className="courses-page">
        <div className="form-error-banner" role="alert">{error || 'Không tìm thấy học viên.'}</div>
        <Link className="btn btn-outline" to="/staff/students">Quay lại danh sách</Link>
      </div>
    );
  }

  const { user, profile, enrollments } = detail;
  return (
    <div className="courses-page">
      <nav className="staff-breadcrumb" aria-label="Breadcrumb">
        <Link to="/staff/dashboard">Tổng quan</Link><span className="breadcrumb-sep">›</span>
        <Link to="/staff/students">Quản lý học viên</Link><span className="breadcrumb-sep">›</span><span>Hồ sơ học viên</span>
      </nav>
      <div className="courses-page-header">
        <div>
          <h1 className="courses-page-title">{user.fullName}</h1>
          <p className="courses-page-subtitle">Hồ sơ học viên · {profile?.studentCode ?? 'Chưa có mã học viên'}</p>
        </div>
        <Link className="btn btn-outline" to="/staff/students">Quay lại danh sách</Link>
      </div>
      <section className="dash-card">
        <h2 className="dash-card-title">Thông tin cá nhân</h2>
        <div className="enrollment-detail-grid">
          <div><span>Email</span><strong>{user.email}</strong></div>
          <div><span>Số điện thoại</span><strong>{user.phone || '—'}</strong></div>
          <div><span>Ngày sinh</span><strong>{formatDate(user.dob)}</strong></div>
          <div><span>Địa chỉ</span><strong>{user.address || '—'}</strong></div>
          <div><span>Ngày đăng ký</span><strong>{formatDate(user.createdAt)}</strong></div>
          <div><span>Tình trạng tài khoản</span><strong>{user.status === 'ACTIVE' ? 'Đang hoạt động' : user.status === 'SUSPENDED' ? 'Đình chỉ' : 'Ngừng hoạt động'}</strong></div>
          <div><span>Band hiện tại / mục tiêu</span><strong>{profile?.currentBand ?? '—'} / {profile?.targetBand ?? '—'}</strong></div>
          <div><span>Mục tiêu học tập</span><strong>{profile?.learningGoal || '—'}</strong></div>
          <div><span>Người liên hệ khẩn cấp</span><strong>{profile?.emergencyContact?.name || '—'}{profile?.emergencyContact?.phone ? ` · ${profile.emergencyContact.phone}` : ''}</strong></div>
        </div>
      </section>

      <h2 className="enrollment-payment-heading">Lớp đã và đang học ({enrollments.length})</h2>
      {enrollments.length === 0 ? (
        <div className="courses-empty"><h3>Chưa có lịch sử ghi danh</h3></div>
      ) : enrollments.map((enrollment) => {
        const classroom = enrollment.class;
        const course = classroom?.course ?? enrollment.course;
        return (
          <section className="dash-card" key={enrollment._id}>
            <div className="dash-card-header">
              <div>
                <h3 className="dash-card-title">{classroom?.classCode ?? 'Chưa xếp lớp'} · {course?.title ?? 'Chưa có khóa học'}</h3>
                <p className="dash-subcard-meta">
                  {classroom?.scheduleDays.join(', ') || 'Chưa xếp lịch'} · {classroom?.timeSlot || '—'} · {classroom?.room || '—'}
                </p>
              </div>
              <span className={`course-status-badge class-status-${enrollment.status.toLowerCase()}`}>{ENROLLMENT_LABELS[enrollment.status] ?? enrollment.status}</span>
            </div>
            <div className="enrollment-detail-grid">
              <div><span>Giảng viên</span><strong>{classroom?.teacher?.fullName ?? '—'}</strong></div>
              <div><span>Thời gian học</span><strong>{formatDate(classroom?.startDate)} – {formatDate(classroom?.endDate)}</strong></div>
              <div><span>Ngày đăng ký lớp</span><strong>{formatDate(enrollment.registrationDate)}</strong></div>
              <div><span>Học phí</span><strong>{enrollment.tuitionStatus === 'PAID' ? 'Đã thanh toán' : enrollment.tuitionStatus === 'REFUNDED' ? 'Đã hoàn tiền' : 'Chưa thanh toán'}</strong></div>
            </div>
            <h4 className="enrollment-payment-heading">Điểm số và nhận xét giảng viên</h4>
            {enrollment.grades.length === 0 ? (
              <p className="enrollment-no-payment">Chưa có điểm đánh giá cho lớp này.</p>
            ) : (
              <div className="courses-table-wrap class-table-wrap">
                <table className="courses-table">
                  <thead><tr><th>Bài đánh giá</th><th>Ngày</th><th>Overall</th><th>Listening</th><th>Reading</th><th>Writing</th><th>Speaking</th><th>Giảng viên / nhận xét</th></tr></thead>
                  <tbody>
                    {enrollment.grades.map((grade) => (
                      <tr className="courses-table-row" key={grade._id}>
                        <td>{grade.title}</td>
                        <td>{formatDate(grade.testDate)}</td>
                        <td>{grade.overallBand}</td>
                        <td>{grade.listening ?? '—'}</td>
                        <td>{grade.reading ?? '—'}</td>
                        <td>{grade.writing ?? '—'}</td>
                        <td>{grade.speaking ?? '—'}</td>
                        <td><div className="course-title-cell"><strong>{typeof grade.teacher === 'object' ? grade.teacher.fullName : '—'}</strong><span className="course-desc-preview">{grade.feedback || 'Chưa có nhận xét'}</span></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
};

export default StudentDetailPage;
