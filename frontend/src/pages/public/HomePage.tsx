import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { courseService } from '../../services/course.service';
import type { Course } from '../../types';

const formatVND = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const defaultCourses: Course[] = [
  {
    _id: '6af80ad87196444ae0f96040',
    code: 'IELTS-BEGINNER',
    title: 'IELTS Beginner – Mất Gốc',
    description: 'Xây dựng nền tảng từ vựng, ngữ pháp, phát âm và kỹ năng tiếng Anh cơ bản.',
    category: 'Lộ trình IELTS',
    entryLevel: '0 - 3.5',
    targetLevel: '3.5',
    sessions: 30,
    tuitionFee: 4500000,
    format: 'OFFLINE',
    status: 'ACTIVE',
    bannerUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800&auto=format&fit=crop',
    learningObjectives: [],
    syllabus: [],
    createdAt: '',
    updatedAt: '',
  },
  {
    _id: '6af80ad87196444ae0f96047',
    code: 'IELTS-PRE',
    title: 'IELTS Pre',
    description: 'Làm quen cấu trúc đề thi IELTS và phát triển 4 kỹ năng Nghe, Nói, Đọc, Viết.',
    category: 'Lộ trình IELTS',
    entryLevel: '3.5 - 4.5',
    targetLevel: '4.5',
    sessions: 30,
    tuitionFee: 5800000,
    format: 'OFFLINE',
    status: 'ACTIVE',
    bannerUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800&auto=format&fit=crop',
    learningObjectives: [],
    syllabus: [],
    createdAt: '',
    updatedAt: '',
  },
  {
    _id: '6ad0e51dbba27df34719e8e4',
    code: 'IELTS-FOUNDATION',
    title: 'IELTS Foundation',
    description: 'Củng cố kỹ năng, mở rộng từ vựng và áp dụng chiến thuật làm bài cơ bản.',
    category: 'Lộ trình IELTS',
    entryLevel: '4.5 - 5.5',
    targetLevel: '5.5',
    sessions: 36,
    tuitionFee: 6800000,
    format: 'OFFLINE',
    status: 'ACTIVE',
    bannerUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop',
    learningObjectives: [],
    syllabus: [],
    createdAt: '',
    updatedAt: '',
  },
  {
    _id: '6af80ad87196444ae0f9605c',
    code: 'IELTS-BREAKTHROUGH',
    title: 'IELTS Breakthrough – Bứt Phá',
    description: 'Nâng cao khả năng xử lý đề, luyện đề chuyên sâu và cải thiện band điểm.',
    category: 'Lộ trình IELTS',
    entryLevel: '5.5 - 6.5',
    targetLevel: '6.5',
    sessions: 36,
    tuitionFee: 8800000,
    format: 'BLENDED',
    status: 'ACTIVE',
    bannerUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=800&auto=format&fit=crop',
    learningObjectives: [],
    syllabus: [],
    createdAt: '',
    updatedAt: '',
  },
  {
    _id: '6ad0e51dbba27df34719e8e5',
    code: 'IELTS-ADVANCED',
    title: 'IELTS Advanced – Chuyên Sâu',
    description: 'Phát triển tư duy học thuật, nâng cao Writing và Speaking, luyện đề chuyên sâu.',
    category: 'Lộ trình IELTS',
    entryLevel: '6.5 - 7.5',
    targetLevel: '7.5',
    sessions: 30,
    tuitionFee: 9800000,
    format: 'OFFLINE',
    status: 'ACTIVE',
    bannerUrl: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?q=80&w=800&auto=format&fit=crop',
    learningObjectives: [],
    syllabus: [],
    createdAt: '',
    updatedAt: '',
  },
  {
    _id: '6af80ad97196444ae0f96071',
    code: 'IELTS-MASTER',
    title: 'IELTS Master',
    description: 'Hoàn thiện năng lực ngôn ngữ, tối ưu chiến thuật và nâng cao độ chính xác theo tiêu chí chấm thi IELTS.',
    category: 'Lộ trình IELTS',
    entryLevel: '8.0+',
    targetLevel: '8.0+',
    sessions: 30,
    tuitionFee: 12500000,
    format: 'BLENDED',
    status: 'ACTIVE',
    bannerUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=800&auto=format&fit=crop',
    learningObjectives: [],
    syllabus: [],
    createdAt: '',
    updatedAt: '',
  },
];

interface CarouselSlide {
  id: number;
  tag: string;
  title: string;
  highlight: string;
  desc: string;
  buttonText: string;
  buttonLink: string;
  bgUrl: string;
}

const slides: CarouselSlide[] = [
  {
    id: 1,
    tag: 'LỘ TRÌNH BỨT PHÁ 2026',
    title: 'Luyện Thi IELTS Chuyên Sâu',
    highlight: 'Chinh Phục Band 7.5+ Thần Tốc',
    desc: 'Hơn 50.000 học viên đã tin tưởng lựa chọn khóa học IELTS tại EduCenter. Cam kết bứt phá 1.0 - 1.5 Band điểm chỉ sau 3 tháng với hợp đồng đào tạo pháp lý.',
    buttonText: 'Đăng ký học',
    buttonLink: '/courses',
    bgUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1600&auto=format&fit=crop',
  },
  {
    id: 2,
    tag: 'CÔNG NGHỆ KHẢO THÍ CHUẨN QUỐC TẾ',
    title: 'Phòng Thi Thử IELTS On Computer',
    highlight: 'Chuẩn 100% Format IDP & British Council',
    desc: 'Trải nghiệm giao diện thi máy tính thực chiến, tai nghe khử ồn chuyên dụng, nhận kết quả và phân tích chi tiết điểm mạnh - điểm yếu trong 24 giờ.',
    buttonText: 'Thi thử',
    buttonLink: '/placement-test',
    bgUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1600&auto=format&fit=crop',
  },
  {
    id: 3,
    tag: 'COACHING CHUYÊN SÂU 1:1',
    title: 'Chấm Chữa Writing & Mock Speaking',
    highlight: 'Cùng Giảng Viên 8.5+ - 9.0 IELTS',
    desc: 'Chữa chi tiết từng câu chữ theo 4 tiêu chí chấm điểm IELTS của Cambridge: Task Achievement, Coherence, Lexical Resource và Grammatical Range.',
    buttonText: 'Đăng ký học',
    buttonLink: '/courses',
    bgUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=1600&auto=format&fit=crop',
  },
  {
    id: 4,
    tag: 'CAM KẾT ĐẦU RA BẰNG VĂN BẢN',
    title: 'Hợp Đồng Đào Tạo Minh Bạch',
    highlight: 'Học Lại Miễn Phí 100% Nếu Không Đạt Band',
    desc: 'An tâm tuyệt đối trên con đường du học, săn học bổng, xét tuyển thẳng Đại học Top đầu và định cư quốc tế.',
    buttonText: 'Thi thử',
    buttonLink: '/placement-test',
    bgUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1600&auto=format&fit=crop',
  },
];

const HomePage: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [courses, setCourses] = useState<Course[]>([]);

  // Auto slide interval
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  // Fetch Courses
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const courseRes = await courseService.getCourses({ sortBy: 'newest' });
        if (courseRes.success && courseRes.data && courseRes.data.length > 0) {
          setCourses(courseRes.data);
        }
      } catch (e) {
        console.error('Error fetching courses:', e);
      }
    };
    loadCourses();

    // Auto scroll to section if URL has hash (e.g. /#about), otherwise ensure top
    if (window.location.hash) {
      const id = window.location.hash.replace('#', '');
      const timer = setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
      return () => clearTimeout(timer);
    } else {
      window.scrollTo(0, 0);
    }
  }, []);

  const displayedCourses = courses.length > 0 ? courses : defaultCourses;

  return (
    <div style={{ backgroundColor: '#F0F0F0', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* ------------------------------------------------------------------
          1. HERO BANNER CAROUSEL
          ------------------------------------------------------------------ */}
      <section className="dmr-hero-carousel" aria-label="IELTS Banners nổi bật">
        <div
          className="dmr-carousel-track"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {slides.map((s) => (
            <div
              key={s.id}
              className="dmr-carousel-slide"
              style={{ backgroundImage: `url('${s.bgUrl}')` }}
            >
              <div className="dmr-slide-overlay">
                <div className="dmr-slide-content">
                  <div className="dmr-slide-tag" style={{ backgroundColor: '#EC6E23' }}>{s.tag}</div>
                  <h1 className="dmr-slide-heading">
                    {s.title} <br />
                    <span>{s.highlight}</span>
                  </h1>
                  <p className="dmr-slide-desc">{s.desc}</p>
                  <Link to={s.buttonLink} className="dmr-slide-btn">
                    <span>{s.buttonText}</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Carousel Arrows */}
        <button
          type="button"
          className="dmr-carousel-arrow dmr-carousel-prev"
          onClick={() => setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1))}
          aria-label="Previous slide"
        >
          ❮
        </button>
        <button
          type="button"
          className="dmr-carousel-arrow dmr-carousel-next"
          onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
          aria-label="Next slide"
        >
          ❯
        </button>

        {/* Carousel Dots */}
        <div className="dmr-carousel-dots">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              className={`dmr-dot ${currentSlide === idx ? 'active' : ''}`}
              onClick={() => setCurrentSlide(idx)}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------------
          2. MAIN CONTENT BODY
          ------------------------------------------------------------------ */}
      <div className="dmr-main-body">
        {/* SECTION: BÀI TEST ĐẦU VÀO GỢI Ý KHÓA HỌC */}
        <section className="dmr-section" id="placement-test" style={{ marginBottom: '3.5rem' }}>
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              border: '2px solid #059669',
              padding: '2.5rem 2rem',
              boxShadow: '0 8px 30px rgba(4, 120, 87, 0.08)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1.5rem',
              marginBottom: '2rem',
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#ecfdf5',
                  color: '#047857',
                  padding: '4px 12px',
                  borderRadius: '999px',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  marginBottom: '0.5rem',
                }}
              >

                <span>HỆ THỐNG KHẢO THÍ CHUẨN QUỐC TẾ</span>
              </div>
              <h2 style={{ fontFamily: 'var(--font-beanbag)', fontSize: '2rem', fontWeight: 900, color: '#07403F', margin: 0 }}>
                Kiểm Tra Trình Độ Đầu Vào &amp; Gợi Ý Khóa Học Cá Nhân Hóa
              </h2>
              <p style={{ margin: '0.4rem 0 0', color: '#4a5568', fontSize: '0.95rem' }}>
                Hoàn thành 1 trong 6 bài test để chẩn đoán chính xác Band điểm hiện tại và nhận gợi ý khóa học phù hợp nhất.
              </p>
            </div>

            <Link
              to="/placement-test"
              style={{
                backgroundColor: '#059669',
                color: '#ffffff',
                textDecoration: 'none',
                padding: '0.85rem 1.75rem',
                borderRadius: '50px',
                fontWeight: 800,
                fontSize: '0.95rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)',
              }}
            >
              <span>Xem tất cả 6 bài test</span>
              <span>→</span>
            </Link>
          </div>

          {/* 3 Test Mini Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {/* Test 1 */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ backgroundColor: '#ecfdf5', color: '#047857', fontSize: '0.75rem', fontWeight: 800, padding: '3px 8px', borderRadius: '6px' }}>
                    Band 0.0 - 5.5
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}> 30 phút • 25 câu</span>
                </div>
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                  IELTS Diagnostic Test - Ngữ Pháp &amp; Từ Vựng
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                  Chẩn đoán nền tảng cho người mất gốc hoặc mới bắt đầu. Gợi ý khóa học: IELTS Mất Gốc hoặc Pre-IELTS.
                </p>
              </div>

              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                <Link
                  to="/placement-test/ielts-diagnostic-01"
                  style={{
                    color: '#047857',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>Bắt đầu bài test 1</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            {/* Test 2 */}
            <div
              style={{
                backgroundColor: '#f0fdf4',
                borderRadius: '16px',
                border: '1.5px solid #a7f3d0',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ backgroundColor: '#059669', color: '#ffffff', fontSize: '0.75rem', fontWeight: 800, padding: '3px 8px', borderRadius: '6px' }}>
                    Band 5.0 - 7.5+ • ĐỀ THI THẬT
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#047857', fontWeight: 700 }}> 40 phút • 28 câu</span>
                </div>
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.15rem', fontWeight: 800, color: '#064e3b' }}>
                  IELTS Academic Reading - Đọc Hiểu Thực Chiến
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#334155', lineHeight: 1.5 }}>
                  2 bài đọc Cambridge dài thật (Roman Tunnels &amp; AI Healthcare). Bẫy True/False/Not Given &amp; Matching Headings.
                </p>
              </div>

              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #a7f3d0' }}>
                <Link
                  to="/placement-test/ielts-reading-real-02"
                  style={{
                    color: '#059669',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>Bắt đầu bài test 2</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            {/* Test 3 */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ backgroundColor: '#fef3c7', color: '#b45309', fontSize: '0.75rem', fontWeight: 800, padding: '3px 8px', borderRadius: '6px' }}>
                    Band 4.5 - 8.5+ • DỰ ĐOÁN TOÀN DIỆN
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}> 45 phút • 30 câu</span>
                </div>
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                  IELTS Comprehensive Band Predictor
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                  Đánh giá toàn diện từ vựng C2, ngữ pháp đảo ngữ, đọc hiểu phản biện &amp; phân tích tính mạch lạc PEEL.
                </p>
              </div>

              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                <Link
                  to="/placement-test/ielts-comprehensive-predictor-03"
                  style={{
                    color: '#047857',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>Bắt đầu bài test 3</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

        {/* SECTION: DANH SÁCH KHÓA HỌC IELTS */}
        <section className="dmr-section" id="courses">
          <div
            className="dmr-section-header"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '2rem',
            }}
          >
            <div>
              <div
                style={{
                  color: '#047857',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: '0.4rem',
                }}
              >
                LỘ TRÌNH ĐÀO TẠO IELTS CHUẨN KHẢO THÍ IDP &amp; BC
              </div>
              <h2 className="dmr-main-title" style={{ margin: 0 }}>
                Danh Sách Khóa Học IELTS
                <span className="dmr-badge-orange" style={{ fontSize: '13px', padding: '4px 12px' }}>
                  CAM KẾT ĐẦU RA 100%
                </span>
              </h2>
              <p style={{ color: '#64748B', fontSize: '1rem', margin: '0.5rem 0 0', maxWidth: '720px' }}>
                Lộ trình tinh gọn từ người mất gốc đến mục tiêu 8.0+ với hợp đồng đào tạo pháp lý và đội ngũ giáo viên 8.5+.
              </p>
            </div>
            <Link
              to="/courses"
              style={{
                backgroundColor: '#07403F',
                color: '#FFFFFF',
                padding: '0.75rem 1.5rem',
                borderRadius: '50px',
                fontWeight: 700,
                fontSize: '0.92rem',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(7, 64, 63, 0.2)',
              }}
            >
              <span>Xem Tất Cả Khóa Học</span>
              <span>→</span>
            </Link>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {displayedCourses.map((course) => (
              <div
                key={course._id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '18px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 18px rgba(0, 0, 0, 0.06)',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 18px rgba(0,0,0,0.06)';
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
                      backgroundColor: 'rgba(7, 64, 63, 0.92)',
                      color: '#FCD34D',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    BAND {course.entryLevel} → {course.targetLevel}
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
                    <span style={{ fontSize: '0.75rem', backgroundColor: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                      {course.category}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.5rem', lineHeight: 1.4 }}>
                    {course.title}
                  </h3>

                  <p
                    style={{
                      fontSize: '0.86rem',
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

                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', fontSize: '0.82rem', color: '#475569' }}>
                    <span>📅 {course.sessions} buổi</span>
                    <span>🎯 Đầu vào: <strong>{course.entryLevel}</strong></span>
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

                    <Link
                      to={`/courses?courseId=${course._id}&level=${encodeURIComponent(course.entryLevel)}`}
                      style={{
                        padding: '0.55rem 1.15rem',
                        borderRadius: '8px',
                        backgroundColor: '#07403F',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      <span>Xem lộ trình</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION: CTA CUỐI TRANG */}
        <section className="dmr-section" id="about" style={{ textAlign: 'center', marginTop: '40px', scrollMarginTop: '90px' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #07403F, #1E9AA5)',
              color: '#FFFFFF',
              padding: '50px 30px',
              borderRadius: '28px',
              boxShadow: '0 16px 40px rgba(7, 64, 63, 0.25)',
            }}
          >
            <h2 style={{ fontFamily: 'var(--font-beanbag)', fontSize: '2.4rem', fontWeight: 800, marginBottom: '12px' }}>
              Sẵn sàng bứt phá mục tiêu IELTS 7.5+?
            </h2>
            <p style={{ fontSize: '1.1rem', maxWidth: '640px', margin: '0 auto 26px', color: '#E2E8F0' }}>
              Đăng ký tài khoản ngay hôm nay để nhận quyền truy cập phòng thi thử online miễn phí và được giáo viên 8.5+ đánh giá lộ trình cá nhân hóa.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <Link
                to="/register"
                style={{
                  backgroundColor: '#EC6E23',
                  color: '#FFFFFF',
                  padding: '14px 38px',
                  borderRadius: '50px',
                  fontWeight: 800,
                  textDecoration: 'none',
                  fontFamily: 'var(--font-beanbag)',
                  fontSize: '1rem',
                  textTransform: 'uppercase',
                  boxShadow: '0 6px 18px rgba(236,110,35,0.4)',
                }}
              >
                Tạo tài khoản học thử miễn phí
              </Link>
              <Link
                to="/courses"
                style={{
                  border: '2px solid #57D061',
                  color: '#FFFFFF',
                  padding: '14px 34px',
                  borderRadius: '50px',
                  fontWeight: 800,
                  textDecoration: 'none',
                  fontFamily: 'var(--font-beanbag)',
                  fontSize: '1rem',
                  textTransform: 'uppercase',
                }}
              >
                Khám phá các khóa học IELTS
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* Floating Action Buttons */}
      <div className="dmr-floating-actions">
        <Link to="/placement-test" className="dmr-fab-btn dmr-fab-test" title="Làm bài thi thử IELTS">
          Thi thử
        </Link>
        <a
          href="https://m.me/educenter"
          target="_blank"
          rel="noreferrer"
          className="dmr-fab-btn dmr-fab-chat"
          title="Tư vấn lộ trình IELTS 24/7"
        >
          Tư vấn
        </a>
      </div>
    </div>
  );
};

export default HomePage;
