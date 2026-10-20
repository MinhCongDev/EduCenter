import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  directorService,
  DirectorSummary,
  StaffAccount,
  AddStaffPayload,
  CenterOperationsData,
  StudentActivitiesData,
  TeacherActivitiesData,
  StudentReportsData,
  TeacherReportsData,
  ClassAndCourseReportsData,
  RevenueReportsData,
} from '../../services/director.service';

export type DirectorTab =
  | 'overview'
  | 'staff_accounts'
  | 'monitoring'
  | 'student_reports'
  | 'teacher_reports'
  | 'class_course_reports'
  | 'revenue_reports';

export const DirectorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<DirectorTab>('overview');

  // Synchronize activeTab with URL ?tab=...
  useEffect(() => {
    const tabParam = searchParams.get('tab') as DirectorTab | null;
    if (
      tabParam &&
      [
        'overview',
        'staff_accounts',
        'monitoring',
        'student_reports',
        'teacher_reports',
        'class_course_reports',
        'revenue_reports',
      ].includes(tabParam)
    ) {
      setActiveTab(tabParam);
    } else {
      setActiveTab('overview');
    }
  }, [searchParams]);

  const handleTabChange = (newTab: DirectorTab) => {
    setActiveTab(newTab);
    if (newTab === 'overview') {
      setSearchParams({});
    } else {
      setSearchParams({ tab: newTab });
    }
  };

  // Toast & Loading
  const [loading, setLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ── Data States ──
  const [summary, setSummary] = useState<DirectorSummary>({
    totalRevenue: 168500000,
    studentsCount: 186,
    classesCount: 12,
    activeClassesCount: 9,
    staffCount: 5,
    teachersCount: 8,
    graduationRate: 96.2,
    averageSatisfaction: 4.88,
  });

  const [staffAccounts, setStaffAccounts] = useState<StaffAccount[]>([]);
  const [staffFilterRole, setStaffFilterRole] = useState<'ALL' | 'TRAINING_STAFF' | 'TEACHER'>('ALL');
  const [staffSearch, setStaffSearch] = useState<string>('');

  // Modals state
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState<boolean>(false);
  const [isSubmittingStaff, setIsSubmittingStaff] = useState<boolean>(false);
  const [newStaffForm, setNewStaffForm] = useState<AddStaffPayload>({
    fullName: '',
    email: '',
    password: 'Password123@',
    phone: '',
    role: 'TRAINING_STAFF',
    department: 'Phòng Đào tạo & Khảo thí',
    position: 'Chuyên viên Đào tạo',
    specialization: 'IELTS 4 Kỹ Năng',
    ieltsBand: 8.5,
    yearsOfExperience: 3,
  });

  // Monitoring Sub-tabs: 'operations' | 'students' | 'teachers'
  const [monitoringSubTab, setMonitoringSubTab] = useState<'operations' | 'students' | 'teachers'>('operations');
  const [operationsData, setOperationsData] = useState<CenterOperationsData | null>(null);
  const [studentActivities, setStudentActivities] = useState<StudentActivitiesData | null>(null);
  const [teacherActivities, setTeacherActivities] = useState<TeacherActivitiesData | null>(null);

  // Reports state
  const [studentReports, setStudentReports] = useState<StudentReportsData | null>(null);
  const [teacherReports, setTeacherReports] = useState<TeacherReportsData | null>(null);
  const [classCourseReports, setClassCourseReports] = useState<ClassAndCourseReportsData | null>(null);
  const [classCourseSubTab, setClassCourseSubTab] = useState<'classes' | 'courses'>('classes');
  const [revenueReports, setRevenueReports] = useState<RevenueReportsData | null>(null);

  // Approvals on overview
  const [approvals, setApprovals] = useState([
    {
      id: 'AP-101',
      title: 'Mở thêm lớp cấp tốc IELTS 7.0+ (IELTS-K27-Exp)',
      proposer: 'Trần Thị Thu Thảo (Trưởng ban Giáo vụ)',
      date: 'Hôm nay, 09:30',
      status: 'PENDING',
    },
    {
      id: 'AP-102',
      title: 'Học bổng khuyến học 20% cho học viên khó khăn (Vũ Ngọc Mai)',
      proposer: 'Phòng Đào tạo',
      date: 'Hôm qua, 15:45',
      status: 'PENDING',
    },
    {
      id: 'AP-103',
      title: 'Duyệt bảng điểm thi thử IELTS Mock Test Lần 3',
      proposer: 'ThS. Nguyễn Hoàng Nam (Giảng viên)',
      date: '06/10/2026',
      status: 'APPROVED',
    },
  ]);

  const handleApprove = (id: string) => {
    setApprovals((prev) => prev.map((item) => (item.id === id ? { ...item, status: 'APPROVED' } : item)));
    showToast('✅ Đã phê duyệt đề xuất thành công!');
  };

  const handleReject = (id: string) => {
    setApprovals((prev) => prev.map((item) => (item.id === id ? { ...item, status: 'REJECTED' } : item)));
    showToast('⚠️ Đã từ chối đề xuất.');
  };

  // ── Load All Data ──
  const loadDirectorData = async () => {
    try {
      setLoading(true);
      const [statsRes, staffRes, opsRes, stuActRes, teaActRes, stuRepRes, teaRepRes, clsRepRes, revRepRes] =
        await Promise.all([
          directorService.getDashboardStats().catch(() => null),
          directorService.getStaffAccounts().catch(() => null),
          directorService.getOperationsMonitoring().catch(() => null),
          directorService.getStudentActivities().catch(() => null),
          directorService.getTeacherActivities().catch(() => null),
          directorService.getStudentReports().catch(() => null),
          directorService.getTeacherReports().catch(() => null),
          directorService.getClassAndCourseReports().catch(() => null),
          directorService.getRevenueReports().catch(() => null),
        ]);

      if (statsRes?.data?.data?.summary) {
        setSummary(statsRes.data.data.summary);
      }
      if (staffRes?.data?.data?.accounts) {
        setStaffAccounts(staffRes.data.data.accounts);
      }
      if (opsRes?.data?.data) {
        setOperationsData(opsRes.data.data);
      }
      if (stuActRes?.data?.data) {
        setStudentActivities(stuActRes.data.data);
      }
      if (teaActRes?.data?.data) {
        setTeacherActivities(teaActRes.data.data);
      }
      if (stuRepRes?.data?.data) {
        setStudentReports(stuRepRes.data.data);
      }
      if (teaRepRes?.data?.data) {
        setTeacherReports(teaRepRes.data.data);
      }
      if (clsRepRes?.data?.data) {
        setClassCourseReports(clsRepRes.data.data);
      }
      if (revRepRes?.data?.data) {
        setRevenueReports(revRepRes.data.data);
      }
    } catch (err: any) {
      showToast('⚠️ Lỗi đồng bộ dữ liệu giám đốc: ' + (err?.message || 'Lỗi mạng'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDirectorData();
  }, []);

  // ── Handler: Add Staff Account ──
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffForm.fullName.trim() || !newStaffForm.email.trim() || !newStaffForm.password) {
      showToast('Vui lòng điền đủ họ tên, email và mật khẩu');
      return;
    }
    setIsSubmittingStaff(true);
    try {
      await directorService.addStaffAccount(newStaffForm);
      showToast(`🎉 Tạo tài khoản ${newStaffForm.role === 'TEACHER' ? 'Giảng viên' : 'Giáo vụ'} thành công!`);
      setIsAddStaffModalOpen(false);
      setNewStaffForm({
        fullName: '',
        email: '',
        password: 'Password123@',
        phone: '',
        role: 'TRAINING_STAFF',
        department: 'Phòng Đào tạo & Khảo thí',
        position: 'Chuyên viên Đào tạo',
        specialization: 'IELTS 4 Kỹ Năng',
        ieltsBand: 8.5,
        yearsOfExperience: 3,
      });
      // Refresh staff list
      const res = await directorService.getStaffAccounts();
      if (res?.data?.data?.accounts) setStaffAccounts(res.data.data.accounts);
    } catch (err: any) {
      showToast('❌ Lỗi tạo tài khoản: ' + (err?.response?.data?.message || err.message));
    } finally {
      setIsSubmittingStaff(false);
    }
  };

  // ── Handler: Toggle Staff Status ──
  const handleToggleStaffStatus = async (account: StaffAccount) => {
    const nextStatus = account.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await directorService.updateStaffStatus(account._id, nextStatus);
      showToast(`Đã chuyển trạng thái tài khoản ${account.fullName} sang: ${nextStatus}`);
      setStaffAccounts((prev) =>
        prev.map((a) => (a._id === account._id ? { ...a, status: nextStatus } : a))
      );
    } catch (err: any) {
      showToast('❌ Không thể đổi trạng thái: ' + (err?.response?.data?.message || err.message));
    }
  };

  // Filtered staff list
  const filteredStaff = staffAccounts.filter((s) => {
    if (staffFilterRole !== 'ALL' && s.role !== staffFilterRole) return false;
    if (staffSearch.trim()) {
      const q = staffSearch.toLowerCase();
      return (
        s.fullName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.code && s.code.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const currentDate = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="dash-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="dmr-toast" role="status" style={{ zIndex: 9999 }}>
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Syncing Badge */}
      {loading && (
        <div
          style={{
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#047857',
            padding: '8px 16px',
            borderRadius: '10px',
            fontSize: '0.82rem',
            fontWeight: 700,
            textAlign: 'center',
          }}
        >
          ⏳ Đang đồng bộ số liệu điều hành thời gian thực từ máy chủ EduCenter...
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          1. VIEW DASHBOARD (TỔNG QUAN)
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <>
          {/* Welcome Banner */}
          <div className="dash-banner" style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)' }}>
            <div className="dash-banner-content">
              <div className="dash-banner-badge">👔 Ban Giám Đốc • Điều Hành Trung Tâm EduCenter</div>
              <h1>Kính chào, {user?.fullName || 'Nguyễn Minh Công (Giám đốc Điều hành)'}!</h1>
              <p>Hệ thống ghi nhận hoạt động đào tạo, tỷ lệ chuyên cần và doanh thu học viện ổn định trong kỳ này.</p>
            </div>
            <div className="dash-banner-right">
              <div className="dash-date-pill">
                <div>📅 {currentDate}</div>
                <div className="sub">Học viện EduCenter • Khóa 2026</div>
              </div>
            </div>
          </div>

          {/* Executive Quick Actions Row */}
          <div className="dash-actions-row">
            <button
              type="button"
              className="dash-quick-btn"
              onClick={() => handleTabChange('staff_accounts')}
            >
              👥 Quản lý nhân sự ({staffAccounts.length || summary.staffCount + summary.teachersCount})
            </button>
            <button
              type="button"
              className="dash-quick-btn"
              onClick={() => handleTabChange('monitoring')}
            >
              📡 Giám sát vận hành
            </button>
            <button
              type="button"
              className="dash-quick-btn"
              onClick={() => handleTabChange('student_reports')}
            >
              📈 Báo cáo học viên
            </button>
            <button
              type="button"
              className="dash-quick-btn"
              onClick={() => handleTabChange('teacher_reports')}
            >
              👨‍🏫 Báo cáo giảng viên
            </button>
            <button
              type="button"
              className="dash-quick-btn"
              onClick={() => handleTabChange('class_course_reports')}
            >
              🏫 Báo cáo lớp &amp; khóa
            </button>
            <button
              type="button"
              className="dash-quick-btn"
              onClick={() => handleTabChange('revenue_reports')}
            >
              💰 Báo cáo tài chính
            </button>
            <button
              type="button"
              className="dash-quick-btn primary"
              onClick={() => setIsAddStaffModalOpen(true)}
            >
              ➕ Thêm nhân sự mới
            </button>
          </div>

          {/* Key Metrics */}
          <div className="dash-metrics-grid">
            <div className="dash-metric-card" onClick={() => handleTabChange('revenue_reports')} style={{ cursor: 'pointer' }}>
              <div className="dash-metric-info">
                <span className="dash-metric-label">Doanh thu quý hiện tại</span>
                <span className="dash-metric-val">{summary.totalRevenue.toLocaleString('vi-VN')} đ</span>
                <span className="dash-metric-trend up">↗ +16.4% so với quý trước</span>
              </div>
              <div className="dash-metric-icon icon-emerald">💰</div>
            </div>

            <div className="dash-metric-card" onClick={() => handleTabChange('student_reports')} style={{ cursor: 'pointer' }}>
              <div className="dash-metric-info">
                <span className="dash-metric-label">Tổng học viên đang học</span>
                <span className="dash-metric-val">{summary.studentsCount} học viên</span>
                <span className="dash-metric-trend up">↗ +28 học viên mới</span>
              </div>
              <div className="dash-metric-icon icon-blue">🎓</div>
            </div>

            <div className="dash-metric-card" onClick={() => handleTabChange('class_course_reports')} style={{ cursor: 'pointer' }}>
              <div className="dash-metric-info">
                <span className="dash-metric-label">Lớp học đang vận hành</span>
                <span className="dash-metric-val">{summary.classesCount} lớp</span>
                <span className="dash-metric-trend up">↗ 88.5% công suất phòng</span>
              </div>
              <div className="dash-metric-icon icon-purple">🏫</div>
            </div>

            <div className="dash-metric-card" onClick={() => handleTabChange('staff_accounts')} style={{ cursor: 'pointer' }}>
              <div className="dash-metric-info">
                <span className="dash-metric-label">Đội ngũ nhân sự &amp; GV</span>
                <span className="dash-metric-val">{staffAccounts.length || summary.staffCount + summary.teachersCount} thành viên</span>
                <span className="dash-metric-trend neutral">⭐ Đánh giá 4.88 / 5.0</span>
              </div>
              <div className="dash-metric-icon icon-amber">🏆</div>
            </div>
          </div>

          {/* Overview Two Column Grid */}
          <div className="dash-two-col">
            {/* Left Col */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 0 }}>
              {/* Revenue by Course */}
              <div className="dash-card">
                <div className="dash-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 className="dash-card-title">
                    <span>📊</span> Doanh Thu &amp; Tỷ Trọng Theo Khóa Học
                  </h2>
                  <button
                    type="button"
                    onClick={() => handleTabChange('revenue_reports')}
                    style={{ fontSize: '0.8rem', color: '#059669', background: 'none', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Xem báo cáo tài chính ➔
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                  <div className="dash-subcard">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: 700 }}>
                      <span>IELTS Intensive Academic 7.5+ (12.500.000 đ/HV)</span>
                      <span style={{ color: '#047857' }}>76.500.000 đ (45%)</span>
                    </div>
                    <div className="dash-progress">
                      <div className="dash-progress-fill" style={{ width: '45%' }} />
                    </div>
                  </div>

                  <div className="dash-subcard">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: 700 }}>
                      <span>IELTS Master Speaking &amp; Writing 7.0+ (9.800.000 đ/HV)</span>
                      <span style={{ color: '#06b6d4' }}>54.600.000 đ (32%)</span>
                    </div>
                    <div className="dash-progress">
                      <div className="dash-progress-fill" style={{ width: '32%', background: 'linear-gradient(90deg, #06b6d4, #10b981)' }} />
                    </div>
                  </div>

                  <div className="dash-subcard">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: 700 }}>
                      <span>IELTS Foundation &amp; Pre-IELTS (7.500.000 đ/HV)</span>
                      <span style={{ color: '#f59e0b' }}>29.250.000 đ (18%)</span>
                    </div>
                    <div className="dash-progress">
                      <div className="dash-progress-fill" style={{ width: '18%', background: 'linear-gradient(90deg, #f59e0b, #ec4899)' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Pending Approvals */}
              <div className="dash-card">
                <div className="dash-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 className="dash-card-title">
                    <span>📑</span> Đề Xuất &amp; Phê Duyệt Của Ban Giám Đốc
                  </h2>
                  <span className="badge-pill badge-amber">
                    {approvals.filter((a) => a.status === 'PENDING').length} cần xử lý
                  </span>
                </div>

                <div className="dash-table-wrapper" style={{ marginTop: '0.5rem' }}>
                  <table className="dash-table">
                    <thead>
                      <tr>
                        <th>Mã</th>
                        <th>Nội dung đề xuất</th>
                        <th>Người gửi</th>
                        <th>Trạng thái</th>
                        <th style={{ textAlign: 'right' }}>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {approvals.map((item) => (
                        <tr key={item.id}>
                          <td style={{ fontWeight: 700, color: '#047857' }}>{item.id}</td>
                          <td>
                            <strong>{item.title}</strong>
                            <div className="dash-subcard-meta">{item.date}</div>
                          </td>
                          <td>{item.proposer}</td>
                          <td>
                            {item.status === 'PENDING' && <span className="badge-pill badge-amber">Chờ duyệt</span>}
                            {item.status === 'APPROVED' && <span className="badge-pill badge-green">Đã duyệt</span>}
                            {item.status === 'REJECTED' && <span className="badge-pill badge-red">Từ chối</span>}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {item.status === 'PENDING' ? (
                              <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                <button
                                  type="button"
                                  onClick={() => handleApprove(item.id)}
                                  className="dash-quick-btn primary"
                                  style={{ padding: '0.3rem 0.7rem', fontSize: '0.75rem' }}
                                >
                                  Duyệt
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleReject(item.id)}
                                  className="dash-quick-btn"
                                  style={{ padding: '0.3rem 0.7rem', fontSize: '0.75rem', color: '#ef4444' }}
                                >
                                  Bác
                                </button>
                              </div>
                            ) : (
                              <span className="dash-subcard-meta">Đã hoàn tất</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Col */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Executive Quick Actions */}
              <div className="dash-card">
                <div className="dash-card-header">
                  <h2 className="dash-card-title">
                    <span>⚡</span> Thao Tác Quản Trị Cấp Cao
                  </h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <button
                    type="button"
                    className="dash-quick-btn primary"
                    onClick={() => handleTabChange('staff_accounts')}
                  >
                    <span>👥</span>
                    <span>Quản Lý Danh Sách Nhân Sự &amp; Giảng Viên</span>
                  </button>
                  <button
                    type="button"
                    className="dash-quick-btn"
                    onClick={() => handleTabChange('revenue_reports')}
                  >
                    <span>📥</span>
                    <span>Xuất Báo Cáo Tài Chính (Excel / PDF)</span>
                  </button>
                  <button
                    type="button"
                    className="dash-quick-btn"
                    onClick={() => handleTabChange('monitoring')}
                  >
                    <span>📡</span>
                    <span>Giám Sát Vận Hành Phòng Học Hôm Nay</span>
                  </button>
                </div>
              </div>

              {/* Top Instructors */}
              <div className="dash-card">
                <div className="dash-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 className="dash-card-title">
                    <span>🌟</span> Giảng Viên Tiêu Biểu
                  </h2>
                  <button
                    type="button"
                    onClick={() => handleTabChange('teacher_reports')}
                    style={{ fontSize: '0.78rem', color: '#059669', background: 'none', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Báo cáo GV ➔
                  </button>
                </div>
                <div className="dash-item-list">
                  <div className="dash-item">
                    <div className="dash-item-main">
                      <div className="dash-item-icon">👨‍🏫</div>
                      <div>
                        <div className="dash-item-title">ThS. Nguyễn Hoàng Nam</div>
                        <div className="dash-item-sub">IELTS 9.0 • 3 lớp active • Khoa Đào tạo</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, color: '#f59e0b', fontSize: '0.9rem' }}>⭐ 4.95 / 5.0</div>
                      <div className="dash-subcard-meta">99% hài lòng</div>
                    </div>
                  </div>

                  <div className="dash-item">
                    <div className="dash-item-main">
                      <div className="dash-item-icon">👨‍🏫</div>
                      <div>
                        <div className="dash-item-title">Thầy Alex Nguyễn</div>
                        <div className="dash-item-sub">Head Teacher • IELTS 9.0 • 4 lớp active</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, color: '#f59e0b', fontSize: '0.9rem' }}>⭐ 4.92 / 5.0</div>
                      <div className="dash-subcard-meta">98% hài lòng</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Notice */}
              <div className="dash-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>📢</span>
                  <strong className="dash-subcard-title">Nhắc việc Ban Giám Đốc</strong>
                </div>
                <p className="dash-subcard-body" style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.5 }}>
                  Cuộc họp giao ban định kỳ với phòng Giáo vụ và các Trưởng bộ môn lúc <strong>16:00 chiều nay</strong> tại Phòng Hội thảo 1.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─────────────────────────────────────────────────────────────
          NÚT QUAY LẠI TỔNG QUAN KHI Ở CÁC PHẦN CHUYÊN BIỆT
          ───────────────────────────────────────────────────────────── */}
      {activeTab !== 'overview' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <button
            type="button"
            onClick={() => handleTabChange('overview')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 16px',
              borderRadius: '8px',
              border: '1px solid #d7e3d9',
              background: '#ffffff',
              color: '#26743d',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <span>⬅</span>
            <span>Quay lại Bảng điều khiển Tổng quan</span>
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. VIEW STAFF ACCOUNTS LIST & ADD STAFF ACCOUNT
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'staff_accounts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                👥 Quản Lý Tài Khoản Nhân Sự &amp; Giảng Viên (Staff Accounts)
              </h2>
              <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                Xem danh sách tài khoản, kiểm soát trạng thái hoạt động và cấp tài khoản nhân sự mới
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsAddStaffModalOpen(true)}
              style={{
                backgroundColor: '#059669',
                color: '#ffffff',
                border: 'none',
                padding: '0.6rem 1.25rem',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
              }}
            >
              <span>➕</span>
              <span>Thêm Tài Khoản Nhân Sự Mới</span>
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="dash-card" style={{ padding: '1rem', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setStaffFilterRole('ALL')}
                className={`dash-quick-btn ${staffFilterRole === 'ALL' ? 'primary' : ''}`}
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
              >
                Tất cả ({staffAccounts.length})
              </button>
              <button
                type="button"
                onClick={() => setStaffFilterRole('TRAINING_STAFF')}
                className={`dash-quick-btn ${staffFilterRole === 'TRAINING_STAFF' ? 'primary' : ''}`}
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
              >
                Phòng Giáo Vụ ({staffAccounts.filter((s) => s.role === 'TRAINING_STAFF').length})
              </button>
              <button
                type="button"
                onClick={() => setStaffFilterRole('TEACHER')}
                className={`dash-quick-btn ${staffFilterRole === 'TEACHER' ? 'primary' : ''}`}
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
              >
                Giảng Viên ({staffAccounts.filter((s) => s.role === 'TEACHER').length})
              </button>
            </div>

            <div>
              <input
                type="text"
                placeholder="🔍 Tìm theo tên, email, mã nhân sự..."
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.82rem',
                  width: '280px',
                }}
              />
            </div>
          </div>

          {/* Staff Accounts Table */}
          <div className="dash-card" style={{ padding: '0.5rem', borderRadius: '16px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', backgroundColor: '#f8fafc', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '10px 14px' }}>Mã &amp; Họ Tên</th>
                  <th style={{ padding: '10px 14px' }}>Vai Trò</th>
                  <th style={{ padding: '10px 14px' }}>Bộ Phận / Chuyên Môn</th>
                  <th style={{ padding: '10px 14px' }}>Liên Hệ</th>
                  <th style={{ padding: '10px 14px' }}>Trạng Thái</th>
                  <th style={{ padding: '10px 14px' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.length > 0 ? (
                  filteredStaff.map((account) => (
                    <tr key={account._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              backgroundColor: account.role === 'TEACHER' ? '#ecfdf5' : '#eff6ff',
                              color: account.role === 'TEACHER' ? '#047857' : '#1d4ed8',
                              fontWeight: 800,
                              display: 'grid',
                              placeItems: 'center',
                              fontSize: '0.9rem',
                            }}
                          >
                            {account.fullName.charAt(0).toUpperCase()}
                          </span>
                          <div>
                            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>{account.fullName}</div>
                            <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>{account.code}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        {account.role === 'TEACHER' ? (
                          <span style={{ backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                            👨‍🏫 Giảng Viên (Band {account.ieltsBand || 8.5})
                          </span>
                        ) : (
                          <span style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                            💼 Phòng Giáo Vụ
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{account.department}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{account.position}</div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ color: '#1e293b' }}>{account.email}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{account.phone || '—'}</div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            backgroundColor: account.status === 'ACTIVE' ? '#ecfdf5' : '#fee2e2',
                            color: account.status === 'ACTIVE' ? '#047857' : '#b91c1c',
                            border: account.status === 'ACTIVE' ? '1px solid #a7f3d0' : '1px solid #fca5a5',
                          }}
                        >
                          {account.status === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm khóa'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleStaffStatus(account)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            border: account.status === 'ACTIVE' ? '1px solid #fca5a5' : '1px solid #a7f3d0',
                            backgroundColor: account.status === 'ACTIVE' ? '#fef2f2' : '#ecfdf5',
                            color: account.status === 'ACTIVE' ? '#dc2626' : '#047857',
                          }}
                        >
                          {account.status === 'ACTIVE' ? 'Khóa TK' : 'Kích hoạt'}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                      Không tìm thấy tài khoản nhân sự nào phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. MONITOR OPERATIONS, STUDENT ACTIVITIES & TEACHER ACTIVITIES
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'monitoring' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h2 style={{ margin: '0 0 0.35rem', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
              📡 Trung Tâm Giám Sát Hoạt Động (Center Operations &amp; Activities Monitoring)
            </h2>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Theo dõi thời gian thực công suất phòng học, tiến độ học viên và hiệu suất giảng viên
            </span>
          </div>

          {/* Sub-tab segmented control */}
          <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '10px', width: 'fit-content' }}>
            <button
              type="button"
              onClick={() => setMonitoringSubTab('operations')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                backgroundColor: monitoringSubTab === 'operations' ? '#ffffff' : 'transparent',
                color: monitoringSubTab === 'operations' ? '#064e3b' : '#64748b',
                boxShadow: monitoringSubTab === 'operations' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              🏢 Giám Sát Phòng Học &amp; Cơ Sở
            </button>
            <button
              type="button"
              onClick={() => setMonitoringSubTab('students')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                backgroundColor: monitoringSubTab === 'students' ? '#ffffff' : 'transparent',
                color: monitoringSubTab === 'students' ? '#064e3b' : '#64748b',
                boxShadow: monitoringSubTab === 'students' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              🎓 Giám Sát Học Viên
            </button>
            <button
              type="button"
              onClick={() => setMonitoringSubTab('teachers')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                backgroundColor: monitoringSubTab === 'teachers' ? '#ffffff' : 'transparent',
                color: monitoringSubTab === 'teachers' ? '#064e3b' : '#64748b',
                boxShadow: monitoringSubTab === 'teachers' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              👨‍🏫 Giám Sát Giảng Viên
            </button>
          </div>

          {/* Sub-tab 1: Center Operations */}
          {monitoringSubTab === 'operations' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div className="dash-card" style={{ padding: '1.25rem', borderLeft: '4px solid #059669' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Tỷ lệ sử dụng phòng</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
                    {operationsData?.capacityUtilizationRate || 86.5}%
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#047857', marginTop: '0.25rem' }}>Đạt tiêu chuẩn cao</div>
                </div>

                <div className="dash-card" style={{ padding: '1.25rem', borderLeft: '4px solid #3b82f6' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Phòng đang sử dụng</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
                    {operationsData?.inUseRooms || 3} / {operationsData?.totalRooms || 5} phòng
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#1d4ed8', marginTop: '0.25rem' }}>Ca tối 18:30 - 21:00</div>
                </div>

                <div className="dash-card" style={{ padding: '1.25rem', borderLeft: '4px solid #f59e0b' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Lớp đang vận hành</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
                    {summary.classesCount} lớp học
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#b45309', marginTop: '0.25rem' }}>100% đúng tiến độ</div>
                </div>
              </div>

              {/* Classrooms Status Grid */}
              <div className="dash-card" style={{ padding: '1.25rem', borderRadius: '16px' }}>
                <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                  🏢 Trạng Thái Phòng Máy &amp; Giảng Đường Hôm Nay
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                  {(operationsData?.classrooms || [
                    { room: 'Phòng Lab 301', type: 'Computer Lab (Thi thử IDP/BC)', capacity: 30, occupied: 24, status: 'IN_USE', currentClass: 'IELTS-K26-A' },
                    { room: 'Phòng Lab 302', type: 'Smart Classroom 4K', capacity: 25, occupied: 20, status: 'IN_USE', currentClass: 'IELTS-K25-B' },
                    { room: 'Phòng Lab 303', type: 'Speaking Studio 1:1', capacity: 10, occupied: 8, status: 'IN_USE', currentClass: 'Speaking Coaching' },
                    { room: 'Phòng Lab 401', type: 'Lý thuyết & Thảo luận', capacity: 35, occupied: 0, status: 'AVAILABLE', currentClass: 'Trống' },
                    { room: 'Phòng Hội thảo', type: 'Hội trường & Thi thử lớn', capacity: 80, occupied: 0, status: 'MAINTENANCE', currentClass: 'Bảo trì định kỳ' },
                  ]).map((cr, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '1rem',
                        borderRadius: '12px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderLeft: cr.status === 'IN_USE' ? '4px solid #059669' : cr.status === 'AVAILABLE' ? '4px solid #3b82f6' : '4px solid #f59e0b',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem' }}>{cr.room}</span>
                        <span
                          style={{
                            padding: '2px 7px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            backgroundColor: cr.status === 'IN_USE' ? '#ecfdf5' : cr.status === 'AVAILABLE' ? '#eff6ff' : '#fef3c7',
                            color: cr.status === 'IN_USE' ? '#047857' : cr.status === 'AVAILABLE' ? '#1d4ed8' : '#b45309',
                          }}
                        >
                          {cr.status === 'IN_USE' ? 'Đang dùng' : cr.status === 'AVAILABLE' ? 'Trống' : 'Bảo trì'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>{cr.type}</div>
                      <div style={{ marginTop: '0.65rem', fontSize: '0.82rem' }}>
                        <div>👥 Sĩ số: <strong style={{ color: '#0f172a' }}>{cr.occupied} / {cr.capacity}</strong> máy/chỗ</div>
                        <div style={{ marginTop: '2px' }}>📖 Lớp: <strong style={{ color: '#047857' }}>{cr.currentClass}</strong></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sub-tab 2: Student Activities */}
          {monitoringSubTab === 'students' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div className="dash-card" style={{ padding: '1.25rem', borderLeft: '4px solid #059669' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Tỷ lệ chuyên cần trung bình</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#047857', marginTop: '0.2rem' }}>
                    {studentActivities?.averageAttendanceRate || '94.2%'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>4/4 buổi diễn ra đúng giờ</div>
                </div>

                <div className="dash-card" style={{ padding: '1.25rem', borderLeft: '4px solid #3b82f6' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Tỷ lệ nộp bài tập đúng hạn</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1d4ed8', marginTop: '0.2rem' }}>
                    {studentActivities?.assignmentSubmissionRate || '91.8%'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Writing Task 1 &amp; 2</div>
                </div>
              </div>

              {/* Recent Student Submissions */}
              <div className="dash-card" style={{ padding: '1.25rem', borderRadius: '16px' }}>
                <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                  📝 Bài Làm &amp; Hoạt Động Mới Nhất Của Học Viên
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {(studentActivities?.recentSubmissions?.length ? studentActivities.recentSubmissions : [
                    { id: '1', title: 'Writing Task 1 - Bar Chart', student: 'Phạm Hải Đăng', skill: 'Writing', time: '10 phút trước', score: 'Band 7.5' },
                    { id: '2', title: 'Speaking Part 2 Self-Introduction', student: 'Vũ Ngọc Mai', skill: 'Speaking', time: '35 phút trước', score: 'Chờ chấm' },
                    { id: '3', title: 'Reading Passage Practice Vol 19', student: 'Lê Minh Khôi', skill: 'Reading', time: '1 giờ trước', score: 'Band 8.0' },
                    { id: '4', title: 'Writing Task 2 - Education Topic', student: 'Nguyễn Thị Lan Anh', skill: 'Writing', time: '2 giờ trước', score: 'Band 7.0' },
                  ]).map((item: any, idx: number) => (
                    <div
                      key={item.id || idx}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: '10px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>
                          {item.title || item.assignment?.title}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                          Học viên: <strong style={{ color: '#0f172a' }}>{item.student?.fullName || item.student}</strong> • {item.time || new Date(item.submittedAt).toLocaleTimeString('vi-VN')}
                        </div>
                      </div>
                      <div>
                        <span style={{ backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '3px 8px', borderRadius: '6px', fontWeight: 800, fontSize: '0.75rem' }}>
                          {item.score || (item.grade ? `Band ${item.grade}` : 'Đã nộp')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sub-tab 3: Teacher Activities */}
          {monitoringSubTab === 'teachers' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div className="dash-card" style={{ padding: '1.25rem', borderLeft: '4px solid #059669' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Tổng giờ dạy trong tuần</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#047857', marginTop: '0.2rem' }}>
                    {teacherActivities?.totalTeachingHoursWeek || 48} giờ
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Đúng lịch 100%</div>
                </div>

                <div className="dash-card" style={{ padding: '1.25rem', borderLeft: '4px solid #f59e0b' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Đánh giá trung bình từ học viên</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#b45309', marginTop: '0.2rem' }}>
                    ⭐ {teacherActivities?.averageFeedbackScore || 4.88} / 5.0
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#047857', marginTop: '0.25rem' }}>Top 1 học viện</div>
                </div>
              </div>

              {/* Teacher Performance Grid */}
              <div className="dash-card" style={{ padding: '0.5rem', borderRadius: '16px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', backgroundColor: '#f8fafc', textAlign: 'left', color: '#475569' }}>
                      <th style={{ padding: '10px 14px' }}>Giảng Viên</th>
                      <th style={{ padding: '10px 14px' }}>IELTS Band</th>
                      <th style={{ padding: '10px 14px' }}>Lớp Phụ Trách</th>
                      <th style={{ padding: '10px 14px' }}>Giờ Dạy / Tuần</th>
                      <th style={{ padding: '10px 14px' }}>Tốc Độ Chấm Bài</th>
                      <th style={{ padding: '10px 14px' }}>Đánh Giá Học Viên</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(teacherActivities?.teachers?.length ? teacherActivities.teachers : [
                      { id: '1', fullName: 'ThS. Nguyễn Hoàng Nam', ieltsBand: 9.0, assignedClassesCount: 3, weeklyHours: 18, gradingSpeed: 'Dưới 12 giờ', satisfactionRating: 4.95 },
                      { id: '2', fullName: 'Thầy Alex Nguyễn', ieltsBand: 9.0, assignedClassesCount: 4, weeklyHours: 24, gradingSpeed: 'Dưới 24 giờ', satisfactionRating: 4.92 },
                      { id: '3', fullName: 'Cô Sarah Phương', ieltsBand: 8.5, assignedClassesCount: 3, weeklyHours: 18, gradingSpeed: 'Dưới 24 giờ', satisfactionRating: 4.88 },
                      { id: '4', fullName: 'Thầy Michael Trần', ieltsBand: 8.5, assignedClassesCount: 2, weeklyHours: 12, gradingSpeed: 'Dưới 24 giờ', satisfactionRating: 4.85 },
                    ]).map((t: any, idx: number) => (
                      <tr key={t.id || idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0f172a' }}>{t.fullName}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '2px 7px', borderRadius: '6px', fontWeight: 800 }}>
                            Band {t.ieltsBand}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 600 }}>{t.assignedClassesCount} lớp active</td>
                        <td style={{ padding: '12px 14px', color: '#334155' }}>{t.weeklyHours} giờ / tuần</td>
                        <td style={{ padding: '12px 14px', color: '#047857', fontWeight: 600 }}>⚡ {t.gradingSpeed}</td>
                        <td style={{ padding: '12px 14px', fontWeight: 800, color: '#f59e0b' }}>⭐ {t.satisfactionRating?.toFixed(2)} / 5.0</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. VIEW STUDENT REPORTS
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'student_reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h2 style={{ margin: '0 0 0.35rem', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
              📈 Báo Cáo Thống Kê Học Viên (Student Reports)
            </h2>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Phân tích tăng trưởng số lượng học viên, tỷ lệ duy trì và phân bố phổ điểm mục tiêu
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="dash-card" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Tổng học viên đang học</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
                {studentReports?.totalStudents || 186} học viên
              </div>
              <div style={{ fontSize: '0.75rem', color: '#047857', marginTop: '0.25rem' }}>↗ Tăng 12% so với tháng trước</div>
            </div>

            <div className="dash-card" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Tỷ lệ duy trì &amp; hoàn thành</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#047857', marginTop: '0.2rem' }}>
                {studentReports?.retentionRate || '96.5%'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#047857', marginTop: '0.25rem' }}>Cam kết chuẩn đầu ra</div>
            </div>

            <div className="dash-card" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Bài thi thử đã tổ chức</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3b82f6', marginTop: '0.2rem' }}>
                {studentReports?.totalTestsConducted || 68} kỳ thi
              </div>
              <div style={{ fontSize: '0.75rem', color: '#1d4ed8', marginTop: '0.25rem' }}>Mock Test chuẩn khảo thí IDP/BC</div>
            </div>
          </div>

          {/* Target Bands Distribution */}
          <div className="dash-card" style={{ padding: '1.5rem', borderRadius: '16px' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
              🎯 Phân Bố Mục Tiêu Đầu Ra Học Viên (Target Bands)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(studentReports?.targetBandsDistribution || [
                { band: 'IELTS 6.5 - 7.0', count: 74, percentage: 40 },
                { band: 'IELTS 7.5', count: 56, percentage: 30 },
                { band: 'IELTS 8.0 - 8.5+', count: 37, percentage: 20 },
                { band: 'IELTS 5.5 - 6.0', count: 19, percentage: 10 },
              ]).map((b, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>
                    <span>{b.band}</span>
                    <span style={{ color: '#047857' }}>{b.count} học viên ({b.percentage}%)</span>
                  </div>
                  <div className="dash-progress" style={{ height: '8px' }}>
                    <div className="dash-progress-fill" style={{ width: `${b.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. VIEW TEACHER REPORTS
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'teacher_reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h2 style={{ margin: '0 0 0.35rem', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
              👨‍🏫 Báo Cáo Hiệu Suất Giảng Viên (Teacher Reports)
            </h2>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Đánh giá chất lượng giảng dạy, tỷ lệ đúng giờ và phản hồi của học viên đối với đội ngũ giảng viên
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="dash-card" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Điểm hài lòng trung bình</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b', marginTop: '0.2rem' }}>
                ⭐ {teacherReports?.averageSatisfaction || 4.88} / 5.0
              </div>
              <div style={{ fontSize: '0.75rem', color: '#047857', marginTop: '0.25rem' }}>Đạt chuẩn kiểm định quốc tế</div>
            </div>

            <div className="dash-card" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Tỷ lệ đi dạy đúng giờ</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#047857', marginTop: '0.2rem' }}>
                {teacherReports?.punctualityRate || '99.2%'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Chuyên cần giảng dạy tuyệt đối</div>
            </div>

            <div className="dash-card" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Chấm bài đúng cam kết 24h</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3b82f6', marginTop: '0.2rem' }}>
                {teacherReports?.gradingOnTimeRate || '97.4%'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#1d4ed8', marginTop: '0.25rem' }}>Phản hồi bài tập chi tiết</div>
            </div>
          </div>

          {/* Ranking Table */}
          <div className="dash-card" style={{ padding: '0.5rem', borderRadius: '16px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', backgroundColor: '#f8fafc', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '10px 14px' }}>Giảng Viên</th>
                  <th style={{ padding: '10px 14px' }}>IELTS Band</th>
                  <th style={{ padding: '10px 14px' }}>Đánh Giá</th>
                  <th style={{ padding: '10px 14px' }}>Lớp Học</th>
                  <th style={{ padding: '10px 14px' }}>Giờ Dạy Tích Lũy</th>
                  <th style={{ padding: '10px 14px' }}>Khen Thưởng / Nhận Xét Của BGD</th>
                </tr>
              </thead>
              <tbody>
                {(teacherReports?.ranking || [
                  { name: 'ThS. Nguyễn Hoàng Nam', band: 9.0, rating: 4.95, classes: 3, hours: 36, commendation: 'Giảng viên xuất sắc tháng' },
                  { name: 'Thầy Alex Nguyễn', band: 9.0, rating: 4.92, classes: 4, hours: 44, commendation: 'Head Teacher tích cực' },
                  { name: 'Cô Sarah Phương', band: 8.5, rating: 4.88, classes: 3, hours: 32, commendation: 'Chấm bài Writing tận tâm' },
                  { name: 'Thầy Michael Trần', band: 8.5, rating: 4.85, classes: 2, hours: 24, commendation: 'Tương tác Speaking nhiệt huyết' },
                ]).map((t, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0f172a' }}>{t.name}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '2px 7px', borderRadius: '6px', fontWeight: 800 }}>
                        Band {t.band}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: '#f59e0b' }}>⭐ {t.rating}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 600 }}>{t.classes} lớp</td>
                    <td style={{ padding: '12px 14px' }}>{t.hours} giờ</td>
                    <td style={{ padding: '12px 14px', color: '#047857', fontWeight: 700 }}>🏆 {t.commendation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          6. VIEW CLASS REPORTS & COURSE REPORTS
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'class_course_reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                🏫 Báo Cáo Lớp Học &amp; Khóa Học (Class &amp; Course Reports)
              </h2>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Thống kê tỷ lệ lấp đầy sĩ số các lớp và hiệu quả tuyển sinh theo từng khóa học
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
              <button
                type="button"
                onClick={() => setClassCourseSubTab('classes')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  backgroundColor: classCourseSubTab === 'classes' ? '#ffffff' : 'transparent',
                  color: classCourseSubTab === 'classes' ? '#064e3b' : '#64748b',
                }}
              >
                🏫 Báo Cáo Lớp Học ({classCourseReports?.classes?.length || 12})
              </button>
              <button
                type="button"
                onClick={() => setClassCourseSubTab('courses')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  backgroundColor: classCourseSubTab === 'courses' ? '#ffffff' : 'transparent',
                  color: classCourseSubTab === 'courses' ? '#064e3b' : '#64748b',
                }}
              >
                📚 Báo Cáo Khóa Học ({classCourseReports?.courses?.length || 4})
              </button>
            </div>
          </div>

          {classCourseSubTab === 'classes' ? (
            <div className="dash-card" style={{ padding: '0.5rem', borderRadius: '16px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', backgroundColor: '#f8fafc', textAlign: 'left', color: '#475569' }}>
                    <th style={{ padding: '10px 14px' }}>Mã &amp; Tên Lớp</th>
                    <th style={{ padding: '10px 14px' }}>Khóa Học</th>
                    <th style={{ padding: '10px 14px' }}>Sĩ Số / Sức Chứa</th>
                    <th style={{ padding: '10px 14px' }}>Tỷ Lệ Lấp Đầy</th>
                    <th style={{ padding: '10px 14px' }}>Phòng &amp; Lịch Học</th>
                    <th style={{ padding: '10px 14px' }}>Trạng Thái</th>
                  </tr>
                </thead>
                <tbody>
                  {(classCourseReports?.classes || []).map((cls) => (
                    <tr key={cls._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{cls.code}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{cls.name}</div>
                      </td>
                      <td style={{ padding: '12px 14px', color: '#334155' }}>{cls.courseName}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 700 }}>
                        {cls.enrolled} / {cls.capacity} học viên
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '3px 8px', borderRadius: '6px', fontWeight: 800 }}>
                          {cls.fillRate}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div>📍 {cls.room}</div>
                        <div style={{ fontSize: '0.76rem', color: '#64748b' }}>{cls.schedule}</div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '2px 7px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                          {cls.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
              {(classCourseReports?.courses || []).map((crs) => (
                <div key={crs._id} className="dash-card" style={{ padding: '1.25rem', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, color: '#047857', fontSize: '1rem' }}>{crs.code}</span>
                    <span style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                      Target {crs.targetBand}
                    </span>
                  </div>
                  <h3 style={{ margin: '0.4rem 0 0.2rem', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>{crs.name}</h3>
                  <div style={{ fontSize: '0.82rem', color: '#64748b' }}>Thời lượng: {crs.duration}</div>

                  <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '0.76rem', color: '#64748b' }}>Học phí niêm yết:</div>
                      <strong style={{ color: '#0f172a' }}>{crs.fee.toLocaleString('vi-VN')} đ</strong>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.76rem', color: '#64748b' }}>Đã đăng ký:</div>
                      <strong style={{ color: '#047857' }}>{crs.enrolledCount} học viên</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          7. VIEW REVENUE REPORTS
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'revenue_reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                💰 Báo Cáo Tài Chính &amp; Doanh Thu (Revenue Reports)
              </h2>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Thống kê doanh thu theo tháng, cơ cấu nguồn thu và lịch sử giao dịch học phí
              </span>
            </div>

            <button
              type="button"
              onClick={() => showToast('🎉 Đang xuất file Excel Báo Cáo Tài Chính Quý...')}
              style={{
                backgroundColor: '#059669',
                color: '#ffffff',
                border: 'none',
                padding: '0.6rem 1.25rem',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
              }}
            >
              <span>📥</span>
              <span>Xuất Báo Cáo Excel (Tài Chính)</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="dash-card" style={{ padding: '1.25rem', borderLeft: '4px solid #059669' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Tổng doanh thu thực tế</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#047857', marginTop: '0.2rem' }}>
                {(revenueReports?.totalRevenue || summary.totalRevenue).toLocaleString('vi-VN')} đ
              </div>
              <div style={{ fontSize: '0.75rem', color: '#047857', marginTop: '0.25rem' }}>↗ Tăng 16.4% so với quý trước</div>
            </div>

            <div className="dash-card" style={{ padding: '1.25rem', borderLeft: '4px solid #3b82f6' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Cổng thanh toán trực tuyến</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1d4ed8', marginTop: '0.2rem' }}>
                90% Không tiền mặt
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>VNPAY &amp; Chuyển khoản QR</div>
            </div>
          </div>

          {/* Monthly Revenue Breakdown */}
          <div className="dash-card" style={{ padding: '1.5rem', borderRadius: '16px' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
              📈 Tăng Trưởng Doanh Thu 6 Tháng Gần Nhất
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {(revenueReports?.monthlyRevenue || [
                { month: 'T05/2026', amount: 112000000 },
                { month: 'T06/2026', amount: 128500000 },
                { month: 'T07/2026', amount: 145000000 },
                { month: 'T08/2026', amount: 154000000 },
                { month: 'T09/2026', amount: 162500000 },
                { month: 'T10/2026 (Hiện tại)', amount: 168500000 },
              ]).map((m, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>
                    <span>{m.month}</span>
                    <span style={{ color: '#047857' }}>{m.amount.toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className="dash-progress" style={{ height: '8px' }}>
                    <div className="dash-progress-fill" style={{ width: `${Math.round((m.amount / 180000000) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Payment Transactions */}
          <div className="dash-card" style={{ padding: '0.5rem', borderRadius: '16px', overflowX: 'auto' }}>
            <div style={{ padding: '0.75rem 0.9rem', fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
              🧾 Lịch Sử Các Giao Dịch Học Phí Gần Nhất
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', backgroundColor: '#f8fafc', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '10px 14px' }}>Mã Giao Dịch</th>
                  <th style={{ padding: '10px 14px' }}>Học Viên</th>
                  <th style={{ padding: '10px 14px' }}>Khóa Học</th>
                  <th style={{ padding: '10px 14px' }}>Số Tiền</th>
                  <th style={{ padding: '10px 14px' }}>Phương Thức</th>
                  <th style={{ padding: '10px 14px' }}>Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                {(revenueReports?.recentTransactions?.length ? revenueReports.recentTransactions : [
                  { transactionCode: 'TXN-98432', student: { fullName: 'Phạm Hải Đăng' }, course: { name: 'IELTS Intensive 7.5+' }, amount: 12500000, method: 'VNPAY', status: 'SUCCESS' },
                  { transactionCode: 'TXN-98433', student: { fullName: 'Vũ Ngọc Mai' }, course: { name: 'IELTS Master Speaking 7.0+' }, amount: 9800000, method: 'BANK_TRANSFER', status: 'SUCCESS' },
                  { transactionCode: 'TXN-98434', student: { fullName: 'Lê Minh Khôi' }, course: { name: 'IELTS Foundation B1' }, amount: 7500000, method: 'VNPAY', status: 'SUCCESS' },
                ]).map((txn: any, idx: number) => (
                  <tr key={txn._id || idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#047857' }}>{txn.transactionCode}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>{txn.student?.fullName}</td>
                    <td style={{ padding: '12px 14px', color: '#334155' }}>{txn.course?.name}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: '#047857' }}>
                      {Number(txn.amount).toLocaleString('vi-VN')} đ
                    </td>
                    <td style={{ padding: '12px 14px', color: '#64748b' }}>{txn.method}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '2px 7px', borderRadius: '6px', fontWeight: 700, fontSize: '0.75rem' }}>
                        {txn.status === 'SUCCESS' ? 'Thành công' : txn.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: THÊM TÀI KHOẢN NHÂN SỰ MỚI
          ───────────────────────────────────────────────────────────── */}
      {isAddStaffModalOpen && (
        <div className="dmr-modal-overlay" onClick={() => setIsAddStaffModalOpen(false)}>
          <div className="dmr-modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                ➕ Cấp Tài Khoản Nhân Sự / Giảng Viên Mới
              </h3>
              <button
                type="button"
                onClick={() => setIsAddStaffModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStaff} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                  Họ và tên nhân sự:
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: ThS. Lê Hoàng Bách"
                  value={newStaffForm.fullName}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, fullName: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                    Email đăng nhập:
                  </label>
                  <input
                    type="email"
                    placeholder="bach.le@educenter.edu.vn"
                    value={newStaffForm.email}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, email: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                    Số điện thoại:
                  </label>
                  <input
                    type="tel"
                    placeholder="0988 123 456"
                    value={newStaffForm.phone}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, phone: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                    Vai trò:
                  </label>
                  <select
                    value={newStaffForm.role}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, role: e.target.value as any })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 600 }}
                  >
                    <option value="TRAINING_STAFF">💼 Chuyên viên Giáo vụ (TRAINING_STAFF)</option>
                    <option value="TEACHER">👨‍🏫 Giảng viên IELTS (TEACHER)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                    Mật khẩu khởi tạo:
                  </label>
                  <input
                    type="text"
                    value={newStaffForm.password}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, password: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    required
                  />
                </div>
              </div>

              {newStaffForm.role === 'TRAINING_STAFF' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                      Phòng ban:
                    </label>
                    <input
                      type="text"
                      value={newStaffForm.department}
                      onChange={(e) => setNewStaffForm({ ...newStaffForm, department: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                      Chức danh:
                    </label>
                    <input
                      type="text"
                      value={newStaffForm.position}
                      onChange={(e) => setNewStaffForm({ ...newStaffForm, position: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                      Chuyên môn:
                    </label>
                    <input
                      type="text"
                      placeholder="Writing / Speaking"
                      value={newStaffForm.specialization}
                      onChange={(e) => setNewStaffForm({ ...newStaffForm, specialization: e.target.value })}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                      IELTS Band:
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="7.0"
                      max="9.0"
                      value={newStaffForm.ieltsBand}
                      onChange={(e) => setNewStaffForm({ ...newStaffForm, ieltsBand: Number(e.target.value) })}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                      Kinh nghiệm (năm):
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={newStaffForm.yearsOfExperience}
                      onChange={(e) => setNewStaffForm({ ...newStaffForm, yearsOfExperience: Number(e.target.value) })}
                      style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setIsAddStaffModalOpen(false)}
                  style={{ padding: '0.55rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingStaff}
                  style={{
                    padding: '0.55rem 1.25rem',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#059669',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {isSubmittingStaff ? 'Đang tạo...' : '💾 Cấp Tài Khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectorDashboard;
