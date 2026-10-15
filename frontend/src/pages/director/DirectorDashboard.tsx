import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import directorService from '../../services/director.service';
import '../dashboard/Dashboard.css';

export const DirectorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'operations' | 'staff' | 'studentActs' | 'teacherActs' | 'studentRpt' | 'teacherRpt' | 'classRpt' | 'courseRpt' | 'revenueRpt'>('overview');

  // Database Data States
  const [operationsData, setOperationsData] = useState<any>(null);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [studentActivities, setStudentActivities] = useState<any>(null);
  const [teacherActivities, setTeacherActivities] = useState<any[]>([]);
  const [studentReports, setStudentReports] = useState<any>(null);
  const [teacherReports, setTeacherReports] = useState<any[]>([]);
  const [classReports, setClassReports] = useState<any>(null);
  const [courseReports, setCourseReports] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Add Staff Account Modal (UC53)
  const [isAddStaffOpen, setIsAddStaffOpen] = useState<boolean>(false);
  const [staffName, setStaffName] = useState<string>('');
  const [staffEmail, setStaffEmail] = useState<string>('');
  const [staffPassword, setStaffPassword] = useState<string>('Password123@');
  const [staffPhone, setStaffPhone] = useState<string>('');
  const [staffDepartment, setStaffDepartment] = useState<string>('Phòng Giáo Vụ & Đào Tạo');
  const [staffPosition, setStaffPosition] = useState<string>('Chuyên viên Giáo vụ');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [ops, stf, stdAct, tchAct, stdRpt, tchRpt, clsRpt, crsRpt, rev] = await Promise.all([
        directorService.getOperations(),
        directorService.getStaffList(),
        directorService.getStudentActivities(),
        directorService.getTeacherActivities(),
        directorService.getStudentReports(),
        directorService.getTeacherReports(),
        directorService.getClassReports(),
        directorService.getCourseReports(),
        directorService.getRevenueReports(),
      ]);

      setOperationsData(ops || null);
      setStaffList(stf || []);
      setStudentActivities(stdAct || null);
      setTeacherActivities(tchAct || []);
      setStudentReports(stdRpt || null);
      setTeacherReports(tchRpt || []);
      setClassReports(clsRpt || null);
      setCourseReports(crsRpt || []);
      setRevenueData(rev || null);
    } catch (err: any) {
      console.error('Lỗi khi nạp dữ liệu Ban Giám Đốc:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName || !staffEmail || !staffPassword) {
      setMessage({ type: 'error', text: 'Vui lòng điền đầy đủ họ tên, email và mật khẩu' });
      return;
    }

    try {
      await directorService.addStaffAccount({
        fullName: staffName,
        email: staffEmail,
        password: staffPassword,
        phone: staffPhone,
        department: staffDepartment,
        position: staffPosition,
      });
      setMessage({ type: 'success', text: 'Thêm tài khoản nhân viên giáo vụ thành công!' });
      setIsAddStaffOpen(false);
      setStaffName('');
      setStaffEmail('');
      setStaffPhone('');
      const stf = await directorService.getStaffList();
      setStaffList(stf || []);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi khi tạo tài khoản' });
    }
  };

  const counts = operationsData?.counts;
  const revSummary = revenueData?.summary;

  return (
    <div className="dmr-dashboard-wrapper">
      <div className="dmr-dashboard-container">
        {/* Top Header */}
        <div className="dmr-dash-header">
          <div className="dmr-dash-welcome">
            <span className="dmr-dash-role-badge">👔 Ban Giám Đốc • Điều Hành Trung Tâm EduCenter</span>
            <h1 className="dmr-dash-title">Hệ Thống Báo Cáo &amp; Giám Sát Hoạt Động Toàn Diện</h1>
            <p className="dmr-dash-subtitle">
              Xin chào, <strong>{user?.fullName}</strong> • Dữ liệu kết xuất thời gian thực trực tiếp từ Database
            </p>
          </div>

          <div className="dmr-dash-actions">
            <button
              type="button"
              className="dmr-dash-btn dmr-dash-btn-secondary"
              onClick={() => setActiveTab('revenueRpt')}
            >
              💰 Báo cáo Doanh thu
            </button>
            <button
              type="button"
              className="dmr-dash-btn dmr-dash-btn-primary"
              onClick={() => {
                setActiveTab('staff');
                setIsAddStaffOpen(true);
              }}
            >
              ➕ Thêm nhân viên giáo vụ
            </button>
          </div>
        </div>

        {/* Global Notice message */}
        {message && (
          <div
            style={{
              padding: '12px 18px',
              borderRadius: '10px',
              marginBottom: '20px',
              backgroundColor: message.type === 'success' ? 'rgba(87, 208, 97, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${message.type === 'success' ? '#57D061' : '#EF4444'}`,
              color: '#FFF',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>{message.text}</span>
            <button
              type="button"
              onClick={() => setMessage(null)}
              style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', fontSize: '1rem' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '24px', paddingBottom: '4px' }}>
          {[
            { id: 'overview', label: '📊 Tổng quan (UC55)' },
            { id: 'operations', label: '🏛️ Vận hành (UC54)' },
            { id: 'staff', label: '👥 Nhân viên (UC52, UC53)' },
            { id: 'studentActs', label: '🎓 Hoạt động Học viên' },
            { id: 'teacherActs', label: '👨‍🏫 Hoạt động Giảng viên' },
            { id: 'revenueRpt', label: '💰 Báo cáo Doanh thu (UC60)' },
            { id: 'studentRpt', label: '📈 Báo cáo Học viên (UC56)' },
            { id: 'teacherRpt', label: '📋 Báo cáo Giảng viên (UC57)' },
            { id: 'classRpt', label: '🏫 Báo cáo Lớp học (UC58)' },
            { id: 'courseRpt', label: '📚 Báo cáo Khóa học (UC59)' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '10px 16px',
                borderRadius: '25px',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
                backgroundColor: activeTab === tab.id ? '#57D061' : 'rgba(255,255,255,0.08)',
                color: activeTab === tab.id ? '#052F2E' : '#FFFFFF',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#DDD' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 16px' }} />
            Đang tổng hợp dữ liệu thời gian thực từ database...
          </div>
        ) : (
          <>
            {/* ── TAB 1: OVERVIEW (UC55) ──────────────────────────────── */}
            {activeTab === 'overview' && (
              <div>
                <div className="dmr-kpi-grid">
                  <div className="dmr-kpi-card">
                    <div className="dmr-kpi-icon" style={{ background: 'rgba(87, 208, 97, 0.2)', borderColor: '#57D061' }}>
                      💰
                    </div>
                    <div className="dmr-kpi-info">
                      <span className="dmr-kpi-value" style={{ fontSize: '1.25rem' }}>
                        {revSummary?.totalRevenueFormatted || '0 ₫'}
                      </span>
                      <span className="dmr-kpi-label">Tổng doanh thu thực tế</span>
                      <span className="dmr-kpi-trend dmr-trend-up">
                        Khớp {revSummary?.totalTransactions || 0} giao dịch trong DB
                      </span>
                    </div>
                  </div>

                  <div className="dmr-kpi-card">
                    <div className="dmr-kpi-icon">🎓</div>
                    <div className="dmr-kpi-info">
                      <span className="dmr-kpi-value">{counts?.totalStudents || 0} Học viên</span>
                      <span className="dmr-kpi-label">Tổng số học viên</span>
                      <span className="dmr-kpi-trend dmr-trend-highlight">
                        {counts?.totalEnrollments || 0} lượt ghi danh
                      </span>
                    </div>
                  </div>

                  <div className="dmr-kpi-card">
                    <div className="dmr-kpi-icon" style={{ background: 'rgba(59, 130, 246, 0.2)', borderColor: '#3B82F6' }}>
                      🏫
                    </div>
                    <div className="dmr-kpi-info">
                      <span className="dmr-kpi-value">{counts?.totalClasses || 0} Lớp học</span>
                      <span className="dmr-kpi-label">Quy mô lớp đào tạo</span>
                      <span className="dmr-kpi-trend dmr-trend-up">
                        {counts?.activeClasses || 0} lớp đang chạy
                      </span>
                    </div>
                  </div>

                  <div className="dmr-kpi-card">
                    <div className="dmr-kpi-icon" style={{ background: 'rgba(236, 110, 35, 0.2)', borderColor: '#EC6E23' }}>
                      👨‍🏫
                    </div>
                    <div className="dmr-kpi-info">
                      <span className="dmr-kpi-value">{counts?.totalTeachers || 0} Giảng viên</span>
                      <span className="dmr-kpi-label">Đội ngũ GV 8.5 - 9.0</span>
                      <span className="dmr-kpi-trend" style={{ color: '#FCD34D' }}>
                        100% chuẩn quốc tế
                      </span>
                    </div>
                  </div>
                </div>

                <div className="dmr-dash-content-grid" style={{ marginTop: '24px' }}>
                  {/* Left: Quick Revenue Summary */}
                  <div className="dmr-card">
                    <div className="dmr-card-header">
                      <h3 className="dmr-card-title">💰 Tổng Quan Dòng Tiền Học Phí</h3>
                      <button
                        type="button"
                        className="dmr-card-action"
                        onClick={() => setActiveTab('revenueRpt')}
                      >
                        Chi tiết sổ cái ➔
                      </button>
                    </div>
                    <div style={{ padding: '10px 0' }}>
                      <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#57D061', margin: '0 0 10px' }}>
                        {revSummary?.totalRevenueFormatted}
                      </p>
                      <p style={{ margin: '4px 0', fontSize: '0.88rem', color: 'rgba(255,255,255,0.7)' }}>
                        Tổng số giao dịch thành công: <strong>{revSummary?.totalTransactions} giao dịch</strong>
                      </p>
                      <p style={{ margin: '4px 0', fontSize: '0.88rem', color: 'rgba(255,255,255,0.7)' }}>
                        Giao dịch đang chờ thu/đối soát: <strong>{revSummary?.pendingTransactions} giao dịch ({revSummary?.pendingTotalFormatted})</strong>
                      </p>
                      <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#A0EC1D' }}>
                        ✓ Số liệu doanh thu được tính tự động bằng tổng chính xác tất cả các giao dịch trong Payment Collection (Không phân chia cơ sở).
                      </p>
                    </div>
                  </div>

                  {/* Right: Operations Quick Links */}
                  <div className="dmr-card">
                    <div className="dmr-card-header">
                      <h3 className="dmr-card-title">🏛️ Giám Sát Hoạt Động</h3>
                      <button
                        type="button"
                        className="dmr-card-action"
                        onClick={() => setActiveTab('operations')}
                      >
                        Nhật ký vận hành ➔
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ padding: '10px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Chương trình khóa học IELTS đang mở:</span>
                        <strong style={{ color: '#FCD34D' }}>{counts?.totalCourses || 0} khóa</strong>
                      </div>
                      <div style={{ padding: '10px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Nhân sự phòng Giáo vụ:</span>
                        <strong style={{ color: '#57D061' }}>{counts?.totalStaff || 0} chuyên viên</strong>
                      </div>
                      <div style={{ padding: '10px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Lớp học có học viên:</span>
                        <strong style={{ color: '#3B82F6' }}>{classesCount(classReports)} lớp</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 2: MONITOR OPERATIONS (UC54) ─────────────────────── */}
            {activeTab === 'operations' && (
              <div>
                <h2 style={{ fontSize: '1.3rem', color: '#FFF', marginBottom: '16px' }}>
                  Giám Sát Vận Hành Toàn Trung Tâm (UC54)
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
                  {/* Recent Enrollments */}
                  <div className="dmr-card">
                    <h3 className="dmr-card-title" style={{ marginBottom: '12px' }}>📝 Ghi Danh Học Viên Gần Đây</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {operationsData?.recentActivities?.enrollments?.map((en: any) => (
                        <div key={en._id} style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong style={{ color: '#FFF' }}>{en.student?.fullName}</strong>
                            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>{en.course?.title}</div>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: '#57D061', fontWeight: 700 }}>{en.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Submissions */}
                  <div className="dmr-card">
                    <h3 className="dmr-card-title" style={{ marginBottom: '12px' }}>✍️ Bài Làm Của Học Viên</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {operationsData?.recentActivities?.submissions?.map((sub: any) => (
                        <div key={sub._id} style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong style={{ color: '#FFF' }}>{sub.student?.fullName}</strong>
                            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>{sub.assignment?.title}</div>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: sub.status === 'GRADED' ? '#57D061' : '#F59E0B', fontWeight: 700 }}>
                            {sub.status === 'GRADED' ? `${sub.grade} Điểm` : 'Chờ chấm'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 3: STAFF MANAGEMENT (UC52, UC53) ─────────────────── */}
            {activeTab === 'staff' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '1.3rem', color: '#FFF', margin: 0 }}>
                    Danh Sách &amp; Quản Lý Nhân Sự Giáo Vụ (UC52, UC53)
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsAddStaffOpen(true)}
                    style={{
                      backgroundColor: '#57D061',
                      border: 'none',
                      color: '#052F2E',
                      padding: '8px 20px',
                      borderRadius: '20px',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    + Thêm tài khoản nhân viên (UC53)
                  </button>
                </div>

                <div className="dmr-card">
                  <table style={{ width: '100%', borderCollapse: 'collapse', color: '#FFF' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                        <th style={{ padding: '10px' }}>Mã NV &amp; Họ tên</th>
                        <th style={{ padding: '10px' }}>Email &amp; SĐT</th>
                        <th style={{ padding: '10px' }}>Phòng ban &amp; Vị trí</th>
                        <th style={{ padding: '10px' }}>Ngày gia nhập</th>
                        <th style={{ padding: '10px' }}>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffList.map((st) => (
                        <tr key={st._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem' }}>
                          <td style={{ padding: '12px 10px' }}>
                            <strong style={{ color: '#FFF' }}>{st.fullName}</strong>
                            <div style={{ fontSize: '0.75rem', color: '#FCD34D' }}>{st.staffCode}</div>
                          </td>
                          <td style={{ padding: '12px 10px', fontSize: '0.85rem' }}>
                            <div>{st.email}</div>
                            <span style={{ color: 'rgba(255,255,255,0.6)' }}>{st.phone}</span>
                          </td>
                          <td style={{ padding: '12px 10px' }}>
                            <div>{st.position}</div>
                            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>{st.department}</span>
                          </td>
                          <td style={{ padding: '12px 10px', fontSize: '0.85rem' }}>
                            {new Date(st.createdAt).toLocaleDateString('vi-VN')}
                          </td>
                          <td style={{ padding: '12px 10px' }}>
                            <span style={{ padding: '3px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800, backgroundColor: 'rgba(87,208,97,0.2)', color: '#57D061' }}>
                              {st.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── TAB 4: STUDENT ACTIVITIES ────────────────────────────── */}
            {activeTab === 'studentActs' && (
              <div>
                <h2 style={{ fontSize: '1.3rem', color: '#FFF', marginBottom: '16px' }}>
                  Giám Sát Hoạt Động Học Tập Của Học Viên
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
                  <div className="dmr-card">
                    <h3 className="dmr-card-title" style={{ marginBottom: '12px' }}>📝 Bài Nộp Mới Nhất</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {studentActivities?.submissions?.map((s: any) => (
                        <div key={s._id} style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between' }}>
                          <span>{s.student?.fullName} ({s.assignment?.title})</span>
                          <strong style={{ color: '#57D061' }}>{s.grade !== undefined ? `${s.grade}đ` : 'Chờ chấm'}</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="dmr-card">
                    <h3 className="dmr-card-title" style={{ marginBottom: '12px' }}>✅ Chuyên Cần Gần Đây</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {studentActivities?.attendances?.map((a: any) => (
                        <div key={a._id} style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between' }}>
                          <span>{a.student?.fullName} ({a.class?.name || a.class?.classCode})</span>
                          <span style={{ color: a.status === 'PRESENT' ? '#57D061' : '#EF4444', fontWeight: 700 }}>{a.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 5: TEACHER ACTIVITIES ────────────────────────────── */}
            {activeTab === 'teacherActs' && (
              <div>
                <h2 style={{ fontSize: '1.3rem', color: '#FFF', marginBottom: '16px' }}>
                  Giám Sát Hoạt Động &amp; Năng Suất Giảng Viên
                </h2>
                <div className="dmr-card">
                  <table style={{ width: '100%', borderCollapse: 'collapse', color: '#FFF' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                        <th style={{ padding: '10px' }}>Giảng viên</th>
                        <th style={{ padding: '10px' }}>Lớp phụ trách</th>
                        <th style={{ padding: '10px' }}>Bài tập đã tạo</th>
                        <th style={{ padding: '10px' }}>Bài đã chấm</th>
                        <th style={{ padding: '10px' }}>Đánh giá trung bình</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teacherActivities.map((t) => (
                        <tr key={t._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem' }}>
                          <td style={{ padding: '12px 10px' }}>
                            <strong>{t.fullName}</strong>
                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>{t.email}</div>
                          </td>
                          <td style={{ padding: '12px 10px', color: '#FCD34D', fontWeight: 700 }}>{t.activeClasses} lớp</td>
                          <td style={{ padding: '12px 10px' }}>{t.assignmentsCreated} bài</td>
                          <td style={{ padding: '12px 10px', color: '#57D061', fontWeight: 700 }}>{t.submissionsGraded} bài</td>
                          <td style={{ padding: '12px 10px', color: '#FCD34D', fontWeight: 800 }}>
                            ⭐ {t.averageRating} / 5.0 ({t.feedbacksCount} đánh giá)
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── TAB 6: REVENUE REPORTS (UC60) ────────────────────────── */}
            {activeTab === 'revenueRpt' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.3rem', color: '#FFF', margin: 0 }}>
                      Báo Cáo Doanh Thu Thực Tế (UC60)
                    </h2>
                    <span style={{ fontSize: '0.85rem', color: '#A0EC1D' }}>
                      Tổng hợp toàn bộ giao dịch từ database • Không cần chia theo cơ sở
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>TỔNG DOANH THU:</span>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#57D061' }}>
                      {revSummary?.totalRevenueFormatted}
                    </div>
                  </div>
                </div>

                {/* Sổ cái giao dịch học phí chi tiết */}
                <div className="dmr-card">
                  <div className="dmr-card-header">
                    <h3 className="dmr-card-title">
                      Danh Sách Các Giao Dịch Học Phí Cấu Thành Doanh Thu ({revenueData?.transactions?.length} Giao Dịch)
                    </h3>
                    <span style={{ color: '#FCD34D', fontWeight: 700 }}>
                      Tổng: {revSummary?.totalRevenueFormatted}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', margin: '4px 0 14px' }}>
                    Tất cả dữ liệu dưới đây được lấy từ `Payment` Collection trong database. Tổng các dòng bằng chính xác số doanh thu tổng ở trên!
                  </p>

                  <table style={{ width: '100%', borderCollapse: 'collapse', color: '#FFF' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                        <th style={{ padding: '10px' }}>Mã GD</th>
                        <th style={{ padding: '10px' }}>Học viên</th>
                        <th style={{ padding: '10px' }}>Khóa học / Lớp</th>
                        <th style={{ padding: '10px' }}>Số tiền</th>
                        <th style={{ padding: '10px' }}>Phương thức</th>
                        <th style={{ padding: '10px' }}>Thời gian GD</th>
                        <th style={{ padding: '10px' }}>Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody>
                      {revenueData?.transactions?.map((t: any) => (
                        <tr key={t._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem' }}>
                          <td style={{ padding: '12px 10px', color: '#FCD34D', fontWeight: 700 }}>{t.transactionCode}</td>
                          <td style={{ padding: '12px 10px' }}>
                            <strong>{t.studentName}</strong>
                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>{t.studentEmail}</div>
                          </td>
                          <td style={{ padding: '12px 10px' }}>
                            <div>{t.courseTitle}</div>
                            <span style={{ fontSize: '0.75rem', color: '#A0EC1D' }}>{t.className}</span>
                          </td>
                          <td style={{ padding: '12px 10px', color: '#57D061', fontWeight: 800 }}>
                            {t.amountFormatted}
                          </td>
                          <td style={{ padding: '12px 10px', fontSize: '0.85rem' }}>{t.method}</td>
                          <td style={{ padding: '12px 10px', fontSize: '0.85rem' }}>{new Date(t.paymentDate).toLocaleDateString('vi-VN')}</td>
                          <td style={{ padding: '12px 10px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', maxWidth: '200px' }}>{t.note || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── TAB 7: STUDENT REPORTS (UC56) ────────────────────────── */}
            {activeTab === 'studentRpt' && (
              <div>
                <h2 style={{ fontSize: '1.3rem', color: '#FFF', marginBottom: '16px' }}>
                  Báo Cáo &amp; Phân Tích Dữ Liệu Học Viên (UC56)
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  <div className="dmr-card">
                    <h3 className="dmr-card-title">Phân Bố Band Điểm Đầu Vào</h3>
                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {Object.keys(studentReports?.bandDistribution || {}).map((band) => (
                        <div key={band} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                          <span>{band}:</span>
                          <strong style={{ color: '#FCD34D' }}>{studentReports.bandDistribution[band]} học viên</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="dmr-card">
                    <h3 className="dmr-card-title">Chỉ Số Chuyên Cần &amp; Duy Trì</h3>
                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                        <span>Tỷ lệ chuyên cần bình quân:</span>
                        <strong style={{ color: '#57D061' }}>{studentReports?.avgAttendanceRate}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                        <span>Học viên hoạt động (Active):</span>
                        <strong style={{ color: '#57D061' }}>{studentReports?.activeLearners} HV</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                        <span>Tổng số lượt ghi danh:</span>
                        <strong style={{ color: '#FCD34D' }}>{studentReports?.totalEnrollments} lượt</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 8: TEACHER REPORTS (UC57) ────────────────────────── */}
            {activeTab === 'teacherRpt' && (
              <div>
                <h2 style={{ fontSize: '1.3rem', color: '#FFF', marginBottom: '16px' }}>
                  Báo Cáo Năng Lực &amp; Hiệu Suất Giảng Viên (UC57)
                </h2>
                <div className="dmr-card">
                  <table style={{ width: '100%', borderCollapse: 'collapse', color: '#FFF' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                        <th style={{ padding: '10px' }}>Giảng viên</th>
                        <th style={{ padding: '10px' }}>IELTS Band</th>
                        <th style={{ padding: '10px' }}>Số lớp đang dạy</th>
                        <th style={{ padding: '10px' }}>Tổng số học viên</th>
                        <th style={{ padding: '10px' }}>Đánh giá phản hồi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teacherReports.map((t) => (
                        <tr key={t._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem' }}>
                          <td style={{ padding: '12px 10px' }}>
                            <strong>{t.fullName}</strong>
                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>{t.email}</div>
                          </td>
                          <td style={{ padding: '12px 10px', color: '#FCD34D', fontWeight: 800 }}>IELTS {t.ieltsBand}</td>
                          <td style={{ padding: '12px 10px' }}>{t.classesCount} lớp</td>
                          <td style={{ padding: '12px 10px', color: '#57D061', fontWeight: 700 }}>{t.totalStudentsTaught} học viên</td>
                          <td style={{ padding: '12px 10px' }}>
                            ⭐ <strong>{t.feedbackRating}</strong> / 5.0 ({t.feedbackCount} lượt)
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── TAB 9: CLASS REPORTS (UC58) ──────────────────────────── */}
            {activeTab === 'classRpt' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '1.3rem', color: '#FFF', margin: 0 }}>
                    Báo Cáo Lấp Đầy &amp; Hoạt Động Lớp Học (UC58)
                  </h2>
                  <span style={{ color: '#57D061', fontWeight: 800 }}>
                    Tỷ lệ lấp đầy toàn hệ thống: {classReports?.overallFillRate}
                  </span>
                </div>

                <div className="dmr-card">
                  <table style={{ width: '100%', borderCollapse: 'collapse', color: '#FFF' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                        <th style={{ padding: '10px' }}>Mã lớp / Tên</th>
                        <th style={{ padding: '10px' }}>Khóa học</th>
                        <th style={{ padding: '10px' }}>Giảng viên</th>
                        <th style={{ padding: '10px' }}>Sĩ số / Sức chứa</th>
                        <th style={{ padding: '10px' }}>Tỷ lệ lấp đầy</th>
                        <th style={{ padding: '10px' }}>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classReports?.classes?.map((c: any) => (
                        <tr key={c._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem' }}>
                          <td style={{ padding: '12px 10px' }}>
                            <strong>{c.name}</strong>
                            <div style={{ fontSize: '0.75rem', color: '#FCD34D' }}>{c.classCode}</div>
                          </td>
                          <td style={{ padding: '12px 10px' }}>{c.courseTitle}</td>
                          <td style={{ padding: '12px 10px' }}>{c.teacherName}</td>
                          <td style={{ padding: '12px 10px' }}>{c.currentEnrollment} / {c.capacity}</td>
                          <td style={{ padding: '12px 10px', color: '#57D061', fontWeight: 700 }}>{c.fillRate}%</td>
                          <td style={{ padding: '12px 10px' }}>{c.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── TAB 10: COURSE REPORTS (UC59) ────────────────────────── */}
            {activeTab === 'courseRpt' && (
              <div>
                <h2 style={{ fontSize: '1.3rem', color: '#FFF', marginBottom: '16px' }}>
                  Báo Cáo Hiệu Quả Chương Trình Đào Tạo (UC59)
                </h2>
                <div className="dmr-card">
                  <table style={{ width: '100%', borderCollapse: 'collapse', color: '#FFF' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                        <th style={{ padding: '10px' }}>Mã &amp; Khóa học</th>
                        <th style={{ padding: '10px' }}>Học phí</th>
                        <th style={{ padding: '10px' }}>Số lớp mở</th>
                        <th style={{ padding: '10px' }}>Học viên ghi danh</th>
                        <th style={{ padding: '10px' }}>Doanh thu ghi nhận</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courseReports.map((c) => (
                        <tr key={c._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem' }}>
                          <td style={{ padding: '12px 10px' }}>
                            <strong>{c.title}</strong>
                            <div style={{ fontSize: '0.75rem', color: '#FCD34D' }}>{c.code}</div>
                          </td>
                          <td style={{ padding: '12px 10px' }}>{c.tuitionFee?.toLocaleString('vi-VN')} ₫</td>
                          <td style={{ padding: '12px 10px', fontWeight: 700 }}>{c.classesCount} lớp</td>
                          <td style={{ padding: '12px 10px', color: '#57D061', fontWeight: 700 }}>{c.enrollmentsCount} HV</td>
                          <td style={{ padding: '12px 10px', color: '#FCD34D', fontWeight: 800 }}>
                            {c.estimatedRevenueFormatted}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── ADD STAFF MODAL (UC53) ─────────────────────────────────── */}
        {isAddStaffOpen && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
            <div style={{ backgroundColor: '#0F2F2E', border: '1px solid #1E4E4D', borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '24px', color: '#FFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h3 style={{ margin: 0, color: '#57D061' }}>Thêm Tài Khoản Giáo Vụ Mới (UC53)</h3>
                <button type="button" onClick={() => setIsAddStaffOpen(false)} style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
              </div>
              <form onSubmit={handleAddStaff} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Họ và tên nhân viên:</label>
                  <input type="text" value={staffName} onChange={(e) => setStaffName(e.target.value)} placeholder="VD: Hoàng Lan Anh" style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Email đăng nhập:</label>
                  <input type="email" value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} placeholder="lananh@educenter.edu.vn" style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Mật khẩu khởi tạo:</label>
                  <input type="password" value={staffPassword} onChange={(e) => setStaffPassword(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Số điện thoại:</label>
                    <input type="text" value={staffPhone} onChange={(e) => setStaffPhone(e.target.value)} placeholder="0988..." style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Vị trí công tác:</label>
                    <input type="text" value={staffPosition} onChange={(e) => setStaffPosition(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Phòng ban / Đơn vị:</label>
                  <input type="text" value={staffDepartment} onChange={(e) => setStaffDepartment(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button type="button" onClick={() => setIsAddStaffOpen(false)} style={{ padding: '8px 16px', borderRadius: '20px', background: 'none', border: '1px solid #666', color: '#FFF', cursor: 'pointer' }}>Hủy</button>
                  <button type="submit" style={{ padding: '8px 20px', borderRadius: '20px', backgroundColor: '#57D061', border: 'none', color: '#052F2E', fontWeight: 800, cursor: 'pointer' }}>Tạo tài khoản</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function classesCount(classReports: any) {
  return classReports?.classes?.length || 0;
}

export default DirectorDashboard;
