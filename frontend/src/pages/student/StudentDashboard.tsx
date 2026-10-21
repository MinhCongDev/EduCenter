import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { studentService } from '../../services/student.service';
import { SkeletonPage } from '../../components/Skeleton';
import { EmptyState } from '../../components/Skeleton';
import { formatDate, formatVND, bandColor, bandLabel } from '../../utils/format';
import type {
  DashboardData,
  Assignment,
  Enrollment,
  Grade,
  ClassSchedule,
  TuitionStats,
} from '../../types';

export type StudentTab = 'overview' | 'courses' | 'schedule' | 'assignments' | 'grades';

interface DashAssignment {
  id: string;
  title: string;
  course: string;
  deadline: string;
  status: 'PENDING' | 'SUBMITTED' | 'GRADED' | 'LATE';
  score?: string;
  classId: string;
}

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<StudentTab>('overview');

  // ── Dữ liệu thật từ API ──
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [assignments, setAssignments] = useState<DashAssignment[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [schedule, setSchedule] = useState<ClassSchedule[]>([]);
  const [tuitionStats, setTuitionStats] = useState<TuitionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const tabParam = searchParams.get('tab') as StudentTab | null;
    if (tabParam && ['overview', 'courses', 'schedule', 'assignments', 'grades'].includes(tabParam)) {
      setActiveTab(tabParam);
    } else {
      setActiveTab('overview');
    }
  }, [searchParams]);

  const handleTabChange = (newTab: StudentTab) => {
    setActiveTab(newTab);
    if (newTab === 'overview') {
      setSearchParams({});
    } else {
      setSearchParams({ tab: newTab });
    }
  };

  // ── Load dashboard + dữ liệu theo từng lớp ──
  const fetchAll = useCallback(async () => {
    try {
      setIsLoading(true);
      const dashRes = await studentService.getDashboard();
      if (!dashRes.success || !dashRes.data) {
        toast.error(dashRes.message || 'Không thể tải dữ liệu dashboard');
        return;
      }
      setDashboard(dashRes.data);

      const myClasses: Enrollment[] = dashRes.data.myClasses || [];

      // Bài tập trên tất cả lớp đang theo học
      const assignmentLists = await Promise.all(
        myClasses.map((e) =>
          studentService.getAssignments((e.class as any)?._id).catch(() => null)
        )
      );
      const flat: DashAssignment[] = [];
      assignmentLists.forEach((res, idx) => {
        const cls = myClasses[idx]?.class as any;
        const courseName = cls?.course?.title || cls?.course?.code || 'Khóa học';
        (res?.data?.assignments || []).forEach((a: Assignment) => {
          flat.push({
            id: a._id,
            title: a.title,
            course: courseName,
            deadline: formatDate(a.dueDate, true),
            status:
              a.submissionStatus === 'GRADED'
                ? 'GRADED'
                : a.submissionStatus === 'LATE'
                ? 'LATE'
                : a.submissionStatus
                ? 'SUBMITTED'
                : 'PENDING',
            score:
              a.submissionStatus === 'GRADED' && a.grade !== undefined
                ? `${a.grade} / ${a.maxScore ?? '—'}`
                : undefined,
            classId: cls?._id || '',
          });
        });
      });
      flat.sort((a, b) => {
        if ((a.status === 'PENDING') !== (b.status === 'PENDING')) {
          return a.status === 'PENDING' ? -1 : 1;
        }
        return 0;
      });
      setAssignments(flat);

      // Điểm trên tất cả lớp
      const gradeLists = await Promise.all(
        myClasses.map((e) => studentService.getGrades((e.class as any)?._id).catch(() => null))
      );
      const allGrades: Grade[] = [];
      gradeLists.forEach((res) => {
        if (res?.data?.grades) allGrades.push(...res.data.grades);
      });
      setGrades(allGrades);

      // Lịch học tổng hợp
      const schedRes = await studentService.getCombinedSchedule().catch(() => null);
      if (schedRes?.data?.schedule) setSchedule(schedRes.data.schedule);

      // Thống kê học phí (đã/chưa thanh toán)
      const tuitionRes = await studentService.getTuition().catch(() => null);
      if (tuitionRes?.data?.stats) setTuitionStats(tuitionRes.data.stats);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể tải dữ liệu dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const stats = dashboard?.stats;
  const currentClass = dashboard?.currentClass;
  const currentClassData = currentClass?.class as any;
  const myClasses = dashboard?.myClasses || [];

  const graded = grades.filter((g) => g.overallBand !== undefined && g.overallBand !== null);
  const avgBand = graded.length
    ? (graded.reduce((s, g) => s + (g.overallBand || 0), 0) / graded.length).toFixed(1)
    : null;

  const nextSession = schedule.length
    ? [...schedule].sort((a: any, b: any) =>
        (a.startTime || '').localeCompare(b.startTime || '')
      )[0]
    : null;

  const pendingAssignments = assignments.filter((a) => a.status === 'PENDING');

  if (isLoading) return <SkeletonPage message="Đang tải bảng điều khiển..." />;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

  return (
    <div className="dash-container">
      {/* ── TỔNG QUAN: CHỈ HIỂN THỊ NỘI DUNG TỔNG QUAN ── */}
      {activeTab === 'overview' && (
        <>
          {/* Welcome Banner */}
          <div className="dash-banner" style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)' }}>
            <div className="dash-banner-content">
              <div className="dash-banner-badge">
                Cổng Học Viên • EduCenter Portal
              </div>
              <h1>{greeting}, {user?.fullName || 'Học viên'}!</h1>
              <p>
                Chúc bạn một tuần học tập hiệu quả.
                {nextSession
                  ? ` Buổi học gần nhất: ${(nextSession as any).dayOfWeek} lúc ${(nextSession as any).startTime}.`
                  : ' Bạn chưa có lịch học nào được xếp.'}
              </p>
            </div>
            <div className="dash-banner-right">
              <div className="dash-date-pill">
                <div>Trạng thái: Đang theo học</div>
                <div className="sub">
                  {stats?.totalClasses || 0} lớp • {stats?.pendingAssignments || 0} bài chưa nộp
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Toolbar */}
          <div className="dash-actions-row">
            <button
              type="button"
              className="dash-quick-btn"
              onClick={() => handleTabChange('courses')}
            >
              📚 Khóa học của tôi
            </button>
            <button
              type="button"
              className="dash-quick-btn"
              onClick={() => handleTabChange('assignments')}
            >
              📝 Nộp bài tập về nhà
            </button>
            <button
              type="button"
              className="dash-quick-btn"
              onClick={() => handleTabChange('schedule')}
            >
              🗓️ Xem lịch học
            </button>
            <button
              type="button"
              className="dash-quick-btn"
              onClick={() => handleTabChange('grades')}
            >
              📊 Kết quả học tập
            </button>
            <button
              type="button"
              className="dash-quick-btn"
              onClick={() => navigate('/student/tuition')}
            >
              💳 Thanh toán khóa học
            </button>
          </div>

          {/* Key Metrics */}
          <div className="dash-metrics-grid">
            <div className="dash-metric-card" onClick={() => handleTabChange('courses')} style={{ cursor: 'pointer' }}>
              <div className="dash-metric-info">
                <span className="dash-metric-label">Lớp học đang theo</span>
                <span className="dash-metric-val">{stats?.totalClasses || 0} lớp</span>
                <span className="dash-metric-trend up">
                  {myClasses[0]?.class?.course?.code || '—'} ➔
                </span>
              </div>
              <div className="dash-metric-icon icon-blue">📚</div>
            </div>

            <div className="dash-metric-card" onClick={() => handleTabChange('schedule')} style={{ cursor: 'pointer' }}>
              <div className="dash-metric-info">
                <span className="dash-metric-label">Buổi học / tuần</span>
                <span className="dash-metric-val">{schedule.length} buổi</span>
                <span className="dash-metric-trend up">
                  {nextSession
                    ? `Gần nhất: ${(nextSession as any).dayOfWeek} ${(nextSession as any).startTime}`
                    : 'Chưa có lịch'}
                </span>
              </div>
              <div className="dash-metric-icon icon-emerald">✅</div>
            </div>

            <div className="dash-metric-card" onClick={() => handleTabChange('grades')} style={{ cursor: 'pointer' }}>
              <div className="dash-metric-info">
                <span className="dash-metric-label">Band trung bình</span>
                <span
                  className="dash-metric-val"
                  style={{ color: avgBand ? bandColor(parseFloat(avgBand)) : undefined }}
                >
                  {avgBand || '—'}
                </span>
                <span className="dash-metric-trend up">
                  {avgBand ? `⭐ ${bandLabel(parseFloat(avgBand))}` : 'Chưa có điểm'} ➔
                </span>
              </div>
              <div className="dash-metric-icon icon-amber">🏆</div>
            </div>

            <div className="dash-metric-card" onClick={() => handleTabChange('assignments')} style={{ cursor: 'pointer' }}>
              <div className="dash-metric-info">
                <span className="dash-metric-label">Bài tập chưa nộp</span>
                <span className="dash-metric-val">{pendingAssignments.length} bài</span>
                <span className="dash-metric-trend neutral">
                  {pendingAssignments[0]
                    ? `Hạn: ${pendingAssignments[0].deadline} ➔`
                    : 'Đã nộp đủ'}
                </span>
              </div>
              <div className="dash-metric-icon icon-purple">⏰</div>
            </div>

            <div
              className="dash-metric-card"
              onClick={() => navigate('/student/tuition')}
              style={{ cursor: 'pointer' }}
            >
              <div className="dash-metric-info">
                <span className="dash-metric-label">Học phí chờ thanh toán</span>
                <span
                  className="dash-metric-val"
                  style={{ color: tuitionStats?.pendingCount ? '#f59e0b' : '#10b981' }}
                >
                  {tuitionStats?.pendingCount || 0} khoản
                </span>
                <span className="dash-metric-trend neutral">
                  {tuitionStats?.pendingCount
                    ? `Cần thanh toán ${formatVND(tuitionStats.totalPending)} ➔`
                    : 'Đã thanh toán đủ ➔'}
                </span>
              </div>
              <div className="dash-metric-icon icon-blue">💳</div>
            </div>
          </div>

          {/* Main Two Column Grid */}
          <div className="dash-two-col">
            {/* Left Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Upcoming Class Session */}
              <div className="dash-card">
                <div className="dash-card-header">
                  <h2 className="dash-card-title">
                    <span>⏰</span> Buổi Học Kế Tiếp
                  </h2>
                  {nextSession && (
                    <span className="badge-pill badge-green">
                      {(nextSession as any).dayOfWeek} lúc {(nextSession as any).startTime}
                    </span>
                  )}
                </div>

                <div className="dash-subcard">
                  {nextSession ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h3 className="dash-subcard-title">
                            {(nextSession as any).class?.course?.title ||
                              (nextSession as any).class?.course?.code ||
                              'Lớp học'}
                          </h3>
                          <div className="dash-subcard-meta" style={{ marginTop: '0.25rem' }}>
                            Mã lớp: <strong>{(nextSession as any).class?.classCode || '—'}</strong>
                            {currentClassData?.teacher?.fullName && (
                              <>
                                {' '}• Giảng viên: <strong>{currentClassData.teacher.fullName}</strong>
                              </>
                            )}
                          </div>
                        </div>
                        <span className="badge-pill badge-blue">
                          {(nextSession as any).room || (nextSession as any).classroom || '—'}
                        </span>
                      </div>

                      {(nextSession as any).topic && (
                        <div className="dash-subcard-body">
                          🎯 <strong>Nội dung buổi học:</strong> {(nextSession as any).topic}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="dash-quick-btn primary"
                          onClick={() => navigate('/student/schedule')}
                        >
                          🗓️ Xem lịch học đầy đủ
                        </button>
                        {(nextSession as any).class?._id && (
                          <button
                            type="button"
                            className="dash-quick-btn"
                            onClick={() => navigate(`/student/classes/${(nextSession as any).class._id}/assignments`)}
                          >
                            📝 Bài tập lớp này
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="dash-subcard-body">
                      Chưa có buổi học nào được xếp. Vui lòng liên hệ phòng giáo vụ.
                    </div>
                  )}
                </div>
              </div>

              {/* Enrolled Classes & Progress */}
              <div className="dash-card">
                <div className="dash-card-header">
                  <h2 className="dash-card-title">
                    <span>📚</span> Tiến Độ Lớp Học Của Tôi
                  </h2>
                  <button
                    type="button"
                    onClick={() => handleTabChange('courses')}
                    style={{ fontSize: '0.8rem', color: '#059669', background: 'none', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Xem chi tiết khóa học ➔
                  </button>
                </div>

                <div className="dash-subcard">
                  {myClasses.length === 0 ? (
                    <div className="dash-subcard-body">Bạn chưa đăng ký lớp học nào.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {myClasses.map((e) => {
                        const cls = e.class as any;
                        const total = assignments.filter((a) => a.classId === cls?._id).length;
                        const done = assignments.filter(
                          (a) => a.classId === cls?._id && a.status !== 'PENDING'
                        ).length;
                        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                        return (
                          <div key={e._id}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 700 }}>
                                Lớp {cls?.classCode} ({cls?.course?.title || '—'})
                              </span>
                              <span style={{ fontWeight: 700, color: '#6366f1' }}>
                                {pct}% đã nộp
                              </span>
                            </div>
                            <div className="dash-progress" style={{ height: '10px' }}>
                              <div className="dash-progress-fill" style={{ width: `${pct}%` }} />
                            </div>
                            <div
                              style={{
                                marginTop: '0.25rem',
                                fontSize: '0.78rem',
                                color: '#64748b',
                              }}
                            >
                              {done}/{total} bài tập • {cls?.scheduleDays?.join(', ')} • {cls?.timeSlot}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Assignments Due */}
              <div className="dash-card">
                <div className="dash-card-header">
                  <h2 className="dash-card-title">
                    <span>📝</span> Bài Tập Về Nhà
                  </h2>
                  <span className="badge-pill badge-amber">
                    {assignments.filter((a) => a.status === 'PENDING').length} cần nộp
                  </span>
                </div>

                <div className="dash-item-list">
                  {assignments.length === 0 ? (
                    <div className="dash-subcard-body">Chưa có bài tập nào được giao.</div>
                  ) : (
                    assignments.slice(0, 6).map((item) => (
                      <div key={item.id} className="dash-item">
                        <div className="dash-item-main">
                          <div className="dash-item-icon">
                            {item.status === 'PENDING'
                              ? '⏳'
                              : item.status === 'GRADED'
                              ? '🏆'
                              : item.status === 'LATE'
                              ? '⏰'
                              : '✅'}
                          </div>
                          <div>
                            <div className="dash-item-title">{item.title}</div>
                            <div className="dash-item-sub">
                              {item.course} • Hạn nộp: {item.deadline}
                            </div>
                          </div>
                        </div>

                        <div>
                          {item.status === 'PENDING' ? (
                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/student/classes/${item.classId}/assignments`)
                              }
                              className="dash-quick-btn primary"
                              style={{ padding: '0.35rem 0.85rem', fontSize: '0.775rem' }}
                            >
                              Nộp bài
                            </button>
                          ) : (
                            <span
                              className={`badge-pill ${
                                item.status === 'GRADED' ? 'badge-blue' : 'badge-green'
                              }`}
                            >
                              {item.score || 'Đã nộp'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Announcements */}
              <div className="dash-card">
                <div className="dash-card-header">
                  <h2 className="dash-card-title">
                    <span>📢</span> Thông Báo Từ Trung Tâm
                  </h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div className="dash-subcard" style={{ borderLeft: '4px solid #6366f1' }}>
                    <strong className="dash-subcard-title" style={{ fontSize: '0.9rem' }}>
                      Khai giảng các lớp chuyên đề công nghệ tháng 11
                    </strong>
                    <p className="dash-subcard-meta" style={{ margin: 0, lineHeight: 1.5 }}>
                      Học viên EduCenter được ưu đãi 20% học phí khi đăng ký thêm khóa thứ 2.
                    </p>
                  </div>

                  <div className="dash-subcard" style={{ borderLeft: '4px solid #10b981' }}>
                    <strong className="dash-subcard-title" style={{ fontSize: '0.9rem' }}>
                      Hướng dẫn sử dụng hệ thống Portal EduCenter
                    </strong>
                    <p className="dash-subcard-meta" style={{ margin: 0, lineHeight: 1.5 }}>
                      Học viên có thể tra cứu lịch học, xem danh sách bài tập và nộp bài trực tiếp qua đây.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── CÁC PHẦN CHUYÊN BIỆT: CHỈ HIỂN THỊ NỘI DUNG CỦA PHẦN ĐÓ ── */}
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

      {/* TAB: KHÓA HỌC CỦA TÔI */}
      {activeTab === 'courses' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h2 style={{ margin: '0 0 0.35rem', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
              📚 Lớp Học Của Tôi
            </h2>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Theo dõi tiến độ nộp bài, học phí và thông tin giảng viên của từng lớp
            </span>
          </div>

          {myClasses.length === 0 ? (
            <EmptyState
              icon="📭"
              title="Chưa có lớp học nào"
              description="Bạn chưa đăng ký lớp học nào. Hãy đến trang Khóa học để ghi danh."
              action={
                <button
                  type="button"
                  className="dash-quick-btn primary"
                  onClick={() => navigate('/courses')}
                >
                  📖 Xem các khóa học
                </button>
              }
            />
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '1.25rem',
              }}
            >
              {myClasses.map((e) => {
                const cls = e.class as any;
                const total = assignments.filter((a) => a.classId === cls?._id).length;
                const done = assignments.filter(
                  (a) => a.classId === cls?._id && a.status !== 'PENDING'
                ).length;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                return (
                  <div
                    key={e._id}
                    className="dash-card"
                    style={{ padding: '1.5rem', borderRadius: '16px' }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        flexWrap: 'wrap',
                        gap: '1rem',
                      }}
                    >
                      <div>
                        <span
                          className={`badge-pill ${
                            e.tuitionStatus === 'PAID' ? 'badge-green' : 'badge-amber'
                          }`}
                        >
                          {e.tuitionStatus === 'PAID' ? '✅ Đã thanh toán' : '⏳ Chưa thanh toán'}
                        </span>
                        <h3
                          style={{
                            margin: '0.5rem 0 0.25rem',
                            fontSize: '1.15rem',
                            fontWeight: 800,
                            color: '#0f172a',
                          }}
                        >
                          {cls?.course?.title || cls?.course?.code || 'Lớp học'}
                        </h3>
                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                          Mã lớp:{' '}
                          <strong style={{ color: '#0f172a' }}>{cls?.classCode || '—'}</strong> •
                          Giảng viên:{' '}
                          <strong style={{ color: '#0f172a' }}>
                            {cls?.teacher?.fullName || '—'}
                          </strong>{' '}
                          • Phòng: <strong style={{ color: '#0f172a' }}>{cls?.room || '—'}</strong>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#047857' }}>
                          Tiến độ: {pct}%
                        </span>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          {done} / {total} bài tập
                        </div>
                      </div>
                    </div>

                    <div className="dash-progress" style={{ height: '12px', margin: '1.25rem 0' }}>
                      <div className="dash-progress-fill" style={{ width: `${pct}%` }} />
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: '0.75rem',
                        marginBottom: '1.25rem',
                        fontSize: '0.85rem',
                      }}
                    >
                      <div>
                        <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Lịch học</div>
                        <strong>{cls?.scheduleDays?.join(', ') || '—'}</strong>
                      </div>
                      <div>
                        <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Ca học</div>
                        <strong>{cls?.timeSlot || '—'}</strong>
                      </div>
                      <div>
                        <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Thời gian</div>
                        <strong>
                          {formatDate(cls?.startDate)} — {formatDate(cls?.endDate)}
                        </strong>
                      </div>
                      <div>
                        <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Học phí</div>
                        <strong style={{ color: '#3b82f6' }}>
                          {cls?.course?.tuitionFee?.toLocaleString('vi-VN')} đ
                        </strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="dash-quick-btn primary"
                        onClick={() => navigate(`/student/classes/${cls?._id}`)}
                      >
                        ℹ️ Chi Tiết
                      </button>
                      <button
                        type="button"
                        className="dash-quick-btn"
                        onClick={() => navigate(`/student/classes/${cls?._id}/assignments`)}
                      >
                        📝 Bài Tập
                      </button>
                      <button
                        type="button"
                        className="dash-quick-btn"
                        onClick={() => navigate(`/student/classes/${cls?._id}/grades`)}
                      >
                        📊 Điểm
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB: LỊCH HỌC */}
      {activeTab === 'schedule' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h2 style={{ margin: '0 0 0.35rem', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
              🗓️ Lịch Học Tổng Hợp
            </h2>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Thời khóa biểu tuần của tất cả lớp bạn đang theo học
            </span>
          </div>

          {schedule.length === 0 ? (
            <EmptyState
              icon="📅"
              title="Chưa có lịch học"
              description="Các lớp của bạn chưa được xếp lịch cố định. Vui lòng liên hệ trung tâm."
            />
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1.25rem',
              }}
            >
              {schedule.map((s: any) => (
                <div
                  key={s._id}
                  className="dash-card"
                  style={{ padding: '1.25rem', borderRadius: '16px' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>
                      {s.dayOfWeek}
                    </strong>
                    <span className="badge-pill badge-blue">{s.startTime} – {s.endTime}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    📍 Phòng: {s.room || s.classroom || '—'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#334155', marginTop: '0.35rem', fontWeight: 600 }}>
                    {s.class?.course?.title || s.class?.course?.code || s.class?.classCode || '—'}
                  </div>
                  {s.topic && (
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.35rem' }}>
                      🎯 {s.topic}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                    {s.class?._id && (
                      <>
                        <button
                          type="button"
                          className="dash-quick-btn"
                          onClick={() => navigate(`/student/classes/${s.class._id}`)}
                          style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}
                        >
                          Chi tiết lớp
                        </button>
                        <button
                          type="button"
                          className="dash-quick-btn"
                          onClick={() => navigate(`/student/classes/${s.class._id}/attendance`)}
                          style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}
                        >
                          Điểm danh
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* TAB: BÀI TẬP VỀ NHÀ */}
      {activeTab === 'assignments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h2 style={{ margin: '0 0 0.35rem', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
              📝 Bài Tập Về Nhà &amp; Thực Hành
            </h2>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Xem hạn nộp, nộp link bài làm và theo dõi nhận xét chi tiết của giảng viên
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
            {assignments.map((item) => (
              <div
                key={item.id}
                className="dash-card"
                style={{
                  padding: '1.25rem',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  borderTop: item.status === 'PENDING' ? '4px solid #ea580c' : '4px solid #059669',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#047857', backgroundColor: '#ecfdf5', padding: '2px 8px', borderRadius: '6px' }}>
                      {item.course}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.deadline}</span>
                  </div>
                  <h3 style={{ margin: '0.5rem 0', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.35 }}>
                    {item.title}
                  </h3>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0' }}>
                  <div>
                    {item.status === 'PENDING' ? (
                      <span className="badge-pill badge-amber">Chưa nộp</span>
                    ) : (
                      <span
                        className={`badge-pill ${
                          item.status === 'GRADED' ? 'badge-blue' : 'badge-green'
                        }`}
                      >
                        {item.status === 'GRADED'
                          ? `Đã chấm • ${item.score || ''}`
                          : item.status === 'LATE'
                          ? 'Đã nộp (trễ hạn)'
                          : 'Đã nộp • Chờ chấm'}
                      </span>
                    )}
                  </div>
                  {item.status === 'PENDING' ? (
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/student/classes/${item.classId}/assignments`)
                      }
                      className="dash-quick-btn primary"
                      style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}
                    >
                      🚀 Nộp bài ngay
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/student/classes/${item.classId}/assignments`)
                      }
                      className="dash-quick-btn"
                      style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
                    >
                      👁️ Xem nhận xét
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: KẾT QUẢ HỌC TẬP */}
      {activeTab === 'grades' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h2 style={{ margin: '0 0 0.35rem', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
              📊 Bảng Điểm &amp; Kết Quả Học Tập
            </h2>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Tổng hợp điểm các bài tập, đánh giá chuyên cần và xếp loại học tập
            </span>
          </div>

          <div className="dash-card" style={{ padding: '1.5rem', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <span className="badge-pill badge-green">
                  {avgBand ? `⭐ ${bandLabel(parseFloat(avgBand))}` : '⭐ Chưa có điểm'}
                </span>
                <h3 style={{ margin: '0.4rem 0 0', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                  Band Trung Bình:{' '}
                  <span style={{ color: avgBand ? bandColor(parseFloat(avgBand)) : '#64748b' }}>
                    {avgBand || '—'}
                  </span>
                </h3>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                {grades.length} bài đánh giá • {graded.length} bài có band
              </div>
            </div>

            {grades.length === 0 ? (
              <EmptyState
                icon="📭"
                title="Chưa có kết quả đánh giá"
                description="Kết quả học tập sẽ được cập nhật sau mỗi bài kiểm tra."
              />
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', backgroundColor: '#f8fafc', textAlign: 'left', color: '#475569' }}>
                      <th style={{ padding: '10px 14px' }}>Nội Dung Đánh Giá</th>
                      <th style={{ padding: '10px 14px' }}>Ngày</th>
                      <th style={{ padding: '10px 14px' }}>Band</th>
                      <th style={{ padding: '10px 14px' }}>Trạng Thái</th>
                      <th style={{ padding: '10px 14px' }}>Nhận Xét Của Giảng Viên</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades.map((g) => (
                      <tr key={g._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>
                          {g.title}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#64748b' }}>
                          {formatDate(g.testDate)}
                        </td>
                        <td
                          style={{
                            padding: '12px 14px',
                            fontWeight: 800,
                            color: bandColor(g.overallBand),
                          }}
                        >
                          {g.overallBand?.toFixed(1)}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span
                            className={`badge-pill ${
                              g.status === 'PUBLISHED' ? 'badge-green' : 'badge-amber'
                            }`}
                          >
                            {g.status === 'PUBLISHED' ? 'Đã công bố' : 'Nháp'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', color: '#475569', fontSize: '0.82rem' }}>
                          {g.feedback || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Thanh toán khóa học (đặt dưới phần Kết quả học tập) ── */}
          <div
            className="dash-card"
            style={{
              padding: '1.25rem 1.5rem',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)',
              border: '1px solid #dbeafe',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    color: '#0f172a',
                  }}
                >
                  💳 Thanh Toán Khóa Học
                </h3>
                <p
                  style={{
                    margin: '0.35rem 0 0',
                    fontSize: '0.85rem',
                    color: '#64748b',
                  }}
                >
                  Xem các khóa học đã thanh toán và chưa thanh toán, bấm để xem chi tiết.
                </p>
              </div>
              <button
                type="button"
                className="dash-quick-btn primary"
                onClick={() => navigate('/student/tuition')}
              >
                💳 Xem Thanh Toán
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;

