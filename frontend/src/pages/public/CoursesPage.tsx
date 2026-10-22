import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseService } from '../../services/course.service';
import { studentService } from '../../services/student.service';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import type { Course, CourseQueryParams } from '../../types';

export const CoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [enrollingClassId, setEnrollingClassId] = useState<string | null>(null);

  // Search & Filter state
  const [search, setSearch] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [selectedFormat, setSelectedFormat] = useState<string>('ALL');
  const [priceRange, setPriceRange] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'duration'>('newest');

  // Detail Modal state
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [registrationNotice, setRegistrationNotice] = useState<string | null>(null);

  const levelOptions = [
    { label: 'Tất cả trình độ', value: 'ALL' },
    { label: 'Mất gốc (0 - 3.5)', value: '0 - 3.5' },
    { label: 'Pre-IELTS (3.5 - 4.5)', value: '3.5 - 4.5' },
    { label: 'Foundation (4.5 - 5.5)', value: '4.5 - 5.5' },
    { label: 'Bứt phá (5.5 - 6.5)', value: '5.5 - 6.5' },
    { label: 'Chuyên sâu (6.5 - 7.5+)', value: '6.5 - 7.5+' },
    { label: 'Master (8.0+)', value: '8.0+' },
  ];

  const formatOptions = [
    { label: 'Tất cả hình thức', value: 'ALL' },
    { label: 'Trực tiếp tại lớp (Offline)', value: 'OFFLINE' },
    { label: 'Học trực tuyến (Online)', value: 'ONLINE' },
    { label: 'Kết hợp (Blended)', value: 'BLENDED' },
  ];

  const fetchCourses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: CourseQueryParams = {
        sortBy,
      };

      if (search.trim()) params.search = search.trim();
      if (selectedLevel !== 'ALL') params.level = selectedLevel;
      if (selectedFormat !== 'ALL') params.format = selectedFormat;

      if (priceRange === 'under6') {
        params.maxPrice = 6000000;
      } else if (priceRange === '6to9') {
        params.minPrice = 6000000;
        params.maxPrice = 9000000;
      } else if (priceRange === 'above9') {
        params.minPrice = 9000000;
      }

      const res = await courseService.getCourses(params);
      if (res.success) {
        setCourses(res.data);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể tải danh sách khóa học.');
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedLevel, selectedFormat, priceRange, sortBy]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // View Courses Detail
  const handleOpenDetail = async (courseId: string) => {
    setRegistrationNotice(null);
    try {
      const res = await courseService.getCourseById(courseId);
      if (res.success && res.data) {
        setSelectedCourse(res.data);
      }
    } catch {
      // Fallback to existing course in state
      const found = courses.find((c) => c._id === courseId);
      if (found) setSelectedCourse(found);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedLevel('ALL');
    setSelectedFormat('ALL');
    setPriceRange('ALL');
    setSortBy('newest');
  };

  // M7: Ghi danh trực tiếp vào một lớp học (Student actor)
  const handleEnroll = async (classId: string, classCode: string) => {
    if (!isAuthenticated) {
      toast.warning('Vui lòng đăng nhập để ghi danh');
      navigate('/login');
      return;
    }
    if (user?.role !== 'STUDENT') {
      toast.error('Chỉ học viên mới có thể ghi danh');
      return;
    }
    if (!window.confirm(`Bạn có chắc muốn ghi danh vào lớp ${classCode}?`)) return;
    try {
      setEnrollingClassId(classId);
      const res = await studentService.enrollIntoClass(classId);
      if (res.success) {
        toast.success(res.message || `Ghi danh lớp ${classCode} thành công!`);
        setRegistrationNotice(`Đã ghi danh thành công vào lớp ${classCode}.`);
        // Refresh course để cập nhật sĩ số
        await fetchCourses();
        setTimeout(() => navigate('/student/classes'), 1200);
      } else {
        toast.error(res.message || 'Ghi danh thất bại');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Ghi danh thất bại');
    } finally {
      setEnrollingClassId(null);
    }
  };

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '80vh', paddingBottom: '4rem' }}>
      {/* Hero Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #07403F 0%, #052F2E 100%)',
          color: '#FFFFFF',
          padding: '3rem 1.5rem',
          textAlign: 'center',
          borderBottom: '4px solid #57D061',
        }}
      >
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div
            style={{
              display: 'inline-block',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              padding: '4px 14px',
              borderRadius: '20px',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#FCD34D',
              marginBottom: '1rem',
              letterSpacing: '1px',
            }}
          >
            LỘ TRÌNH ĐÀO TẠO IELTS CHUẨN KHẢO THÍ IDP &amp; BC
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 1rem 0' }}>
            Danh Sách Khóa Học IELTS
          </h1>
          <p style={{ fontSize: '1.05rem', color: '#E2E8F0', maxWidth: '700px', margin: '0 auto' }}>
            Tìm kiếm và lựa chọn khóa học phù hợp với trình độ đầu vào và mục tiêu Band điểm mong muốn. 
            Cam kết chuẩn đầu ra bằng hợp đồng đào tạo pháp lý.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Search & Filter Toolbar */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
            marginBottom: '2rem',
          }}
        >
          {/* Row 1: Search Input */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 320px', position: 'relative' }}>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="🔍 Tìm kiếm khóa học theo tên, mã khóa, từ khóa..."
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    fontSize: '1rem',
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  border: '1.5px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                <option value="newest">Mới nhất</option>
                <option value="price_asc">Học phí: Thấp đến Cao</option>
                <option value="price_desc">Học phí: Cao đến Thấp</option>
                <option value="duration">Thời lượng học</option>
              </select>

              <button
                type="button"
                onClick={handleResetFilters}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  backgroundColor: '#F8FAFC',
                  color: '#64748B',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Đặt lại bộ lọc
              </button>
            </div>
          </div>

          {/* Row 2: Level Filter Pills */}
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginRight: '0.75rem' }}>
              Trình độ đầu vào:
            </span>
            <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.35rem' }}>
              {levelOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSelectedLevel(opt.value)}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: '20px',
                    border: selectedLevel === opt.value ? '2px solid #07403F' : '1px solid #E2E8F0',
                    backgroundColor: selectedLevel === opt.value ? '#07403F' : '#FFFFFF',
                    color: selectedLevel === opt.value ? '#FFFFFF' : '#334155',
                    fontSize: '0.8rem',
                    fontWeight: selectedLevel === opt.value ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Row 3: Format & Price Filter */}
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', paddingTop: '0.75rem', borderTop: '1px solid #F1F5F9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B' }}>Hình thức:</span>
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value)}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                {formatOptions.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B' }}>Khoảng học phí:</span>
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                <option value="ALL">Tất cả mức giá</option>
                <option value="under6">Dưới 6.000.000 ₫</option>
                <option value="6to9">6.000.000 ₫ - 9.000.000 ₫</option>
                <option value="above9">Trên 9.000.000 ₫</option>
              </select>
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', fontSize: '0.85rem', color: '#64748B' }}>
              Tìm thấy <strong style={{ color: '#07403F', margin: '0 4px' }}>{courses.length}</strong> khóa học
            </div>
          </div>
        </div>

        {/* Course Cards Grid */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
            <p style={{ color: '#64748B' }}>Đang tải danh sách khóa học EduCenter...</p>
          </div>
        ) : error ? (
          <div
            style={{
              padding: '2rem',
              backgroundColor: '#FEE2E2',
              borderRadius: '12px',
              textAlign: 'center',
              color: '#991B1B',
            }}
          >
            <p style={{ fontWeight: 600, margin: '0 0 1rem 0' }}>{error}</p>
            <button
              onClick={fetchCourses}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#DC2626',
                color: '#FFF',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Thử lại
            </button>
          </div>
        ) : courses.length === 0 ? (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '4rem 2rem',
              textAlign: 'center',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
            }}
          >
            <span style={{ fontSize: '3rem' }}>🔍</span>
            <h3 style={{ margin: '1rem 0 0.5rem', color: '#1E293B' }}>Không tìm thấy khóa học nào phù hợp</h3>
            <p style={{ color: '#64748B', maxWidth: '480px', margin: '0 auto 1.5rem' }}>
              Vui lòng thử thay đổi từ khóa tìm kiếm hoặc bấm đặt lại bộ lọc để xem toàn bộ danh mục khóa học.
            </p>
            <button
              onClick={handleResetFilters}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#07403F',
                color: '#FFF',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Xem tất cả khóa học
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {courses.map((course) => (
              <div
                key={course._id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)';
                }}
              >
                {/* Banner Thumbnail */}
                <div style={{ position: 'relative', height: '180px', overflow: 'hidden' }}>
                  <img
                    src={course.bannerUrl || 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800&auto=format&fit=crop'}
                    alt={course.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      backgroundColor: 'rgba(7, 64, 63, 0.9)',
                      color: '#FCD34D',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    TARGET {course.targetLevel || 'IELTS 6.5+'}
                  </div>

                  <div
                    style={{
                      position: 'absolute',
                      bottom: '12px',
                      right: '12px',
                      backgroundColor: course.format === 'OFFLINE' ? '#0284C7' : course.format === 'ONLINE' ? '#16A34A' : '#7C3AED',
                      color: '#FFFFFF',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                    }}
                  >
                    {course.format}
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>
                      MÃ: {course.code}
                    </span>
                    <span style={{ fontSize: '0.75rem', backgroundColor: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: '4px' }}>
                      {course.category}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.5rem', lineHeight: 1.4 }}>
                    {course.title}
                  </h3>

                  <p
                    style={{
                      fontSize: '0.85rem',
                      color: '#64748B',
                      margin: '0 0 1rem',
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {course.description}
                  </p>

                  {/* Highlights */}
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', fontSize: '0.8rem', color: '#475569' }}>
                    <span>📅 {course.sessions} buổi</span>
                    <span>🎯 Đầu vào: {course.entryLevel}</span>
                  </div>

                  {/* Price & CTA */}
                  <div
                    style={{
                      marginTop: 'auto',
                      paddingTop: '1rem',
                      borderTop: '1px solid #F1F5F9',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748B' }}>Học phí ưu đãi:</span>
                      <strong style={{ fontSize: '1.15rem', color: '#EC6E23', fontWeight: 800 }}>
                        {formatVND(course.tuitionFee)}
                      </strong>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenDetail(course._id)}
                      style={{
                        padding: '0.55rem 1.1rem',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: '#07403F',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#052F2E';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#07403F';
                      }}
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Course Detail Modal */}
      {selectedCourse && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
            backdropFilter: 'blur(3px)',
          }}
          onClick={() => setSelectedCourse(null)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '750px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 24px 48px rgba(0, 0, 0, 0.25)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                background: 'linear-gradient(135deg, #07403F 0%, #052F2E 100%)',
                color: '#FFFFFF',
                padding: '1.75rem',
                borderTopLeftRadius: '20px',
                borderTopRightRadius: '20px',
                position: 'relative',
              }}
            >
              <button
                onClick={() => setSelectedCourse(null)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: '#FFFFFF',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                ✕
              </button>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <span style={{ backgroundColor: '#FCD34D', color: '#07403F', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800 }}>
                  MÃ: {selectedCourse.code}
                </span>
                <span style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#FFF', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>
                  {selectedCourse.format}
                </span>
              </div>

              <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.4rem', fontWeight: 800 }}>
                {selectedCourse.title}
              </h2>

              <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: '#E2E8F0', flexWrap: 'wrap' }}>
                <span>🎯 Đầu vào: <strong>{selectedCourse.entryLevel}</strong></span>
                <span>🏆 Mục tiêu: <strong>{selectedCourse.targetLevel || 'IELTS 6.5+'}</strong></span>
                <span>⏱️ Thời lượng: <strong>{selectedCourse.sessions} buổi học</strong></span>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.75rem' }}>
              {registrationNotice && (
                <div
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '8px',
                    backgroundColor: '#ECFDF5',
                    border: '1px solid #10B981',
                    color: '#065F46',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <span>🎉</span>
                  <span>{registrationNotice}</span>
                </div>
              )}

              {/* Description */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 0.5rem', color: '#07403F', fontSize: '1rem', fontWeight: 700 }}>
                  📖 Giới thiệu khóa học
                </h4>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569', lineHeight: 1.6 }}>
                  {selectedCourse.description}
                </p>
              </div>

              {/* Learning Objectives */}
              {selectedCourse.learningObjectives && selectedCourse.learningObjectives.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem', color: '#07403F', fontSize: '1rem', fontWeight: 700 }}>
                    🎯 Mục tiêu học tập đạt được
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#334155', lineHeight: 1.6 }}>
                    {selectedCourse.learningObjectives.map((obj, i) => (
                      <li key={i} style={{ marginBottom: '0.25rem' }}>{obj}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Syllabus */}
              {selectedCourse.syllabus && selectedCourse.syllabus.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem', color: '#07403F', fontSize: '1rem', fontWeight: 700 }}>
                    📚 Khung chương trình chi tiết
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {selectedCourse.syllabus.map((syl, i) => (
                      <div
                        key={i}
                        style={{
                          padding: '0.65rem 0.85rem',
                          backgroundColor: '#F8FAFC',
                          borderRadius: '8px',
                          borderLeft: '3px solid #57D061',
                          fontSize: '0.85rem',
                          color: '#334155',
                        }}
                      >
                        {syl}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Classes Available */}
              {selectedCourse.classes && selectedCourse.classes.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem', color: '#07403F', fontSize: '1rem', fontWeight: 700 }}>
                    🏫 Các lớp học đang mở tuyển sinh
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {selectedCourse.classes.map((cls) => (
                      <div
                        key={cls._id}
                        style={{
                          padding: '0.75rem',
                          backgroundColor: '#F0FDF4',
                          border: '1px solid #BBF7D0',
                          borderRadius: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '0.5rem',
                        }}
                      >
                        <div>
                          <strong style={{ color: '#166534', fontSize: '0.9rem' }}>
                            {cls.classCode} - {cls.name || 'Lớp IELTS'}
                          </strong>
                          <div style={{ fontSize: '0.8rem', color: '#4B5563', marginTop: '2px' }}>
                            📍 {cls.room} | ⏰ {cls.scheduleDays?.join(', ')} ({cls.timeSlot})
                          </div>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#15803D', fontWeight: 700 }}>
                          Sĩ số: {cls.currentEnrollment}/{cls.capacity} học viên
                        </div>
                        {cls.status === 'OPEN' && (
                          <button
                            type="button"
                            onClick={() => handleEnroll(cls._id, cls.classCode)}
                            disabled={enrollingClassId === cls._id}
                            style={{
                              padding: '0.45rem 0.9rem',
                              borderRadius: '8px',
                              border: 'none',
                              backgroundColor: enrollingClassId === cls._id ? '#94A3B8' : '#EC6E23',
                              color: '#FFFFFF',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              cursor: enrollingClassId === cls._id ? 'default' : 'pointer',
                            }}
                          >
                            {enrollingClassId === cls._id ? 'Đang ghi danh...' : '✍️ Ghi danh lớp này'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Price & Action footer */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '1.25rem',
                  borderTop: '1px solid #E2E8F0',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div>
                  <span style={{ display: 'block', fontSize: '0.8rem', color: '#64748B' }}>Học phí toàn khóa:</span>
                  <strong style={{ fontSize: '1.5rem', color: '#EC6E23', fontWeight: 800 }}>
                    {formatVND(selectedCourse.tuitionFee)}
                  </strong>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedCourse(null)}
                    style={{
                      padding: '0.65rem 1.25rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      backgroundColor: '#FFF',
                      color: '#475569',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Đóng
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRegistrationNotice('Đã ghi nhận yêu cầu tư vấn & ghi danh cho khóa học ' + selectedCourse.title + '! Chuyên viên khảo thí sẽ liên hệ với bạn trong 15 phút.');
                    }}
                    style={{
                      padding: '0.65rem 1.5rem',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#EC6E23',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                      boxShadow: '0 4px 12px rgba(236, 110, 35, 0.3)',
                    }}
                  >
                    Đăng Ký Tư Vấn &amp; Giữ Chỗ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursesPage;
