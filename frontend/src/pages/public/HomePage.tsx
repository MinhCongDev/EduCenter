import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { centerService } from '../../services/center.service';
import { announcementService } from '../../services/announcement.service';
import type { CenterInfo, Announcement } from '../../types';

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
    buttonText: 'Test trình độ 4 kỹ năng miễn phí',
    buttonLink: '/courses',
    bgUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1600&auto=format&fit=crop',
  },
  {
    id: 2,
    tag: 'CÔNG NGHỆ KHẢO THÍ CHUẨN QUỐC TẾ',
    title: 'Phòng Thi Thử IELTS On Computer',
    highlight: 'Chuẩn 100% Format IDP & British Council',
    desc: 'Trải nghiệm giao diện thi máy tính thực chiến, tai nghe khử ồn chuyên dụng, nhận kết quả và phân tích chi tiết điểm mạnh - điểm yếu trong 24 giờ.',
    buttonText: 'Đặt lịch thi thử máy tính ngay',
    buttonLink: '/courses',
    bgUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1600&auto=format&fit=crop',
  },
  {
    id: 3,
    tag: 'COACHING CHUYÊN SÂU 1:1',
    title: 'Chấm Chữa Writing & Mock Speaking',
    highlight: 'Cùng Giảng Viên 8.5+ - 9.0 IELTS',
    desc: 'Chữa chi tiết từng câu chữ theo 4 tiêu chí chấm điểm IELTS của Cambridge: Task Achievement, Coherence, Lexical Resource và Grammatical Range.',
    buttonText: 'Đăng ký sửa bài 1:1',
    buttonLink: '/courses',
    bgUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=1600&auto=format&fit=crop',
  },
  {
    id: 4,
    tag: 'CAM KẾT ĐẦU RA BẰNG VĂN BẢN',
    title: 'Hợp Đồng Đào Tạo Minh Bạch',
    highlight: 'Học Lại Miễn Phí 100% Nếu Không Đạt Band',
    desc: 'An tâm tuyệt đối trên con đường du học, săn học bổng, xét tuyển thẳng Đại học Top đầu và định cư quốc tế.',
    buttonText: 'Tìm hiểu lộ trình cam kết',
    buttonLink: '/courses',
    bgUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1600&auto=format&fit=crop',
  },
];

const teachers = [
  {
    id: 1,
    name: 'THẦY ALEX NGUYỄN',
    role: 'Giám đốc Học thuật – Academic Director',
    motto: 'CHIẾN THUẬT',
    bio: [
      'Điểm số IELTS 9.0 Overall tuyệt đối (9.0 Listening, 9.0 Reading, 8.5 Speaking)',
      'Thạc sĩ Phương pháp Giảng dạy tiếng Anh (MA TESOL) – University of Leeds (Anh Quốc)',
      'Hơn 11 năm đào tạo và huấn luyện học viên đạt 7.5 - 8.5 IELTS',
    ],
    bgColor: '#D7D6FF',
    imgUrl: 'https://cdn.dungmori.com/assets/img/new_home/06-2024/thaydung.png',
  },
  {
    id: 2,
    name: 'CÔ SARAH PHƯƠNG',
    role: 'Phó giám đốc Chuyên môn & Luyện Speaking',
    motto: 'TRUYỀN CẢM HỨNG',
    bio: [
      'Điểm số IELTS 8.5 Overall (9.0 Speaking, 8.5 Listening)',
      'Cựu du học sinh xuất sắc tại Đại học Sydney (Australia)',
      'Chứng chỉ nghiệp vụ giảng dạy quốc tế CELTA hạng xuất sắc của Cambridge',
    ],
    bgColor: '#B2CFDB',
    imgUrl: 'https://cdn.dungmori.com/assets/img/new_home/06-2024/cothanh.png',
  },
  {
    id: 3,
    name: 'THẦY MARK ĐAN',
    role: 'Trưởng ban Đề thi & Chữa Writing Chuyên sâu',
    motto: 'LOGIC & CHUẨN XÁC',
    bio: [
      'Điểm số IELTS 8.5 Overall (8.5 Writing Task 1 & Task 2)',
      'Thạc sĩ Ngôn ngữ Ứng dụng (MA in Applied Linguistics)',
      'Chuyên gia giải mã tư duy lập luận và phát triển ý tưởng bài viết học thuật',
    ],
    bgColor: '#AFEBB4',
    imgUrl: 'https://cdn.dungmori.com/assets/img/new_home/06-2024/thaynghia.png',
  },
  {
    id: 4,
    name: 'CÔ EMMA ĐINH',
    role: 'Trưởng nhóm IELTS Foundation & Pre-IELTS',
    motto: 'BỀN BỈ',
    bio: [
      'Điểm số IELTS 8.0 Overall (8.5 Reading & 8.5 Listening)',
      'Thạc sĩ Sư phạm Ngôn ngữ Anh – Đại học Quốc gia',
      'Chuyên gia xây dựng nền tảng phát âm IPA và ngữ pháp học thuật cho người mất gốc',
    ],
    bgColor: '#F8C8B9',
    imgUrl: 'https://cdn.dungmori.com/assets/img/new_home/06-2024/cohien.png',
  },
  {
    id: 5,
    name: 'THẦY DAVID TRẦN',
    role: 'Chuyên gia Phản xạ Speaking & Mock Interview',
    motto: 'TỰ TIN',
    bio: [
      'Điểm số IELTS 8.5 Overall (8.5 Speaking)',
      'Tốt nghiệp cử nhân Ngôn ngữ tại Đại học Melbourne (Australia)',
      'Cựu giám khảo Mock Test với hơn 5.000 giờ phỏng vấn trực tiếp',
    ],
    bgColor: '#F2E8B2',
    imgUrl: 'https://cdn.dungmori.com/assets/img/new_home/06-2024/conhan.png',
  },
];

const reviews = [
  {
    name: 'Hoàng Minh Tuấn',
    band: '8.5 IELTS Overall',
    detail: 'L: 9.0 | R: 9.0 | W: 8.0 | S: 8.0',
    comment: 'Khóa học IELTS Chuyên sâu tại EduCenter thực sự là bước ngoặt đối với mình! Nhờ phương pháp chữa Writing 1:1 siêu chi tiết của thầy Mark và kỹ thuật Skim/Scan của thầy Alex, mình đã đạt 8.5 ngay trong lần thi đầu tiên và giành học bổng du học Anh!',
    avatar: 'https://dungmori.com/cdn/feedback/default/1609906434_1730966520_7e310d.png',
  },
  {
    name: 'Lê Mai Anh',
    band: '8.0 IELTS Overall',
    detail: 'L: 8.5 | R: 8.5 | W: 7.5 | S: 8.0',
    comment: 'Trước đây mình rất sợ Speaking Part 3 vì hay bí ý tưởng. Được cô Sarah rèn luyện phản xạ PEEL và mở rộng từ vựng C1/C2 theo chủ đề, mình tự tin nói lưu loát trước giám khảo. Mình đã dùng chứng chỉ này để tuyển thẳng ĐH Ngoại Thương!',
    avatar: 'https://dungmori.com/cdn/feedback/default/1721186619_3377122890_33433.jpeg',
  },
  {
    name: 'Trần Đức Hải',
    band: '7.5 IELTS Overall',
    detail: 'Tăng từ 5.5 lên 7.5 chỉ sau 4 tháng',
    comment: 'Lộ trình tại EduCenter được cá nhân hóa rất thực tế. Phòng thi thử trên máy tính của trung tâm giống hệt phòng thi thật tại IDP giúp mình hoàn toàn không bị bỡ ngỡ về tâm lý khi đi thi thật!',
    avatar: 'https://dungmori.com/cdn/feedback/default/1721186661_106463280_34555.jpeg',
  },
];

const partnerLogos = [
  { name: 'IDP IELTS', label: 'IDP Education' },
  { name: 'British Council', label: 'British Council' },
  { name: 'Cambridge Assessment', label: 'Cambridge English' },
  { name: 'Foreign Trade University', label: 'ĐH Ngoại Thương' },
  { name: 'RMIT University', label: 'RMIT Vietnam' },
  { name: 'National Economics University', label: 'ĐH Kinh Tế Quốc Dân' },
];

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [activeTeacher, setActiveTeacher] = useState<number>(1);
  const [centerInfo, setCenterInfo] = useState<CenterInfo | null>(null);
  const [dynamicAnnouncements, setDynamicAnnouncements] = useState<Announcement[]>([]);
  const [centerTab, setCenterTab] = useState<'branches' | 'facilities' | 'mission'>('branches');

  // Auto slide interval
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  // UC01 & UC06: Fetch Center Info & Announcements
  useEffect(() => {
    const loadCenterAndNews = async () => {
      try {
        const [centerRes, newsRes] = await Promise.all([
          centerService.getCenterInfo(),
          announcementService.getAnnouncements({ limit: 4 }),
        ]);
        if (centerRes.success && centerRes.data) {
          setCenterInfo(centerRes.data);
        }
        if (newsRes.success && newsRes.data) {
          setDynamicAnnouncements(newsRes.data);
        }
      } catch (e) {
        console.error('Error fetching center info / announcements:', e);
      }
    };
    loadCenterAndNews();
  }, []);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) {
      setCouponMessage('Vui lòng nhập mã ưu đãi IELTS.');
      return;
    }
    setCouponMessage(`🎉 Chúc mừng! Mã "${couponCode.toUpperCase()}" đã mở khóa trọn bộ Ebook "1.000 Từ vựng Academic" & 01 suất Mock Test Full 4 kỹ năng!`);
  };

  const selectedTeacher = teachers.find((t) => t.id === activeTeacher) || teachers[0];

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
          2. COUPON PROMO STRIP
          ------------------------------------------------------------------ */}
      <section className="dmr-coupon-section" aria-label="Nhận tài liệu IELTS miễn phí">
        <div className="dmr-coupon-container">
          <div className="dmr-coupon-info">
            <span className="dmr-coupon-icon">🎁</span>
            <div>
              <div className="dmr-coupon-title">Có mã ưu đãi học viên IELTS?</div>
              <div className="dmr-coupon-sub">
                Nhập mã để nhận ngay <b>Ebook 1.000 Từ vựng Academic Cốt Lõi</b> + 01 suất <b>Thi thử Full 4 kỹ năng miễn phí</b>!
              </div>
            </div>
          </div>
          <form className="dmr-coupon-form" onSubmit={handleApplyCoupon}>
            <input
              type="text"
              placeholder="Nhập mã ưu đãi (VD: IELTS80)..."
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="dmr-coupon-input"
            />
            <button type="submit" className="dmr-coupon-submit">
              Nhận tài liệu
            </button>
          </form>
        </div>
        {couponMessage && (
          <div style={{ maxWidth: '1300px', margin: '8px auto 0', color: '#10B981', fontWeight: 700, fontSize: '0.9rem', textAlign: 'right' }}>
            {couponMessage}
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------------
          3. MAIN CONTENT BODY
          ------------------------------------------------------------------ */}
      <div className="dmr-main-body">
        {/* Floating Motifs */}
        <div className="dmr-floating-shape" style={{ top: '80px', left: '20px', fontSize: '28px' }}>🎓</div>
        <div className="dmr-floating-shape" style={{ top: '350px', right: '30px', fontSize: '24px' }}>🎯</div>
        <div className="dmr-floating-shape" style={{ top: '800px', left: '40px', fontSize: '26px' }}>🇬🇧</div>

        {/* SECTION: KHÓA HỌC IELTS NỔI BẬT */}
        <section className="dmr-section" id="courses">
          <div className="dmr-section-header">
            <h2 className="dmr-main-title">
              Lộ trình luyện thi IELTS chuyên sâu
              <span className="dmr-badge-orange" style={{ fontSize: '14px', padding: '6px 14px' }}>
                CAM KẾT ĐẦU RA 100% [MỚI]
              </span>
            </h2>
          </div>

          <div className="dmr-exclusive-grid">
            {/* Card 1: Khóa 5.5 - 6.5 */}
            <div className="dmr-exclusive-card">
              <div
                style={{
                  height: '240px',
                  background: 'linear-gradient(135deg, #07403F 0%, #1E9AA5 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  position: 'relative',
                  padding: '24px',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', letterSpacing: '1px', textTransform: 'uppercase', color: '#A0EC1D', fontWeight: 800 }}>
                    MỤC TIÊU XÉT TUYỂN ĐẠI HỌC &amp; DU HỌC
                  </div>
                  <div style={{ fontFamily: 'var(--font-beanbag)', fontSize: '2.4rem', fontWeight: 800, marginTop: '6px' }}>
                    IELTS BỨT PHÁ 6.5+
                  </div>
                  <div style={{ fontSize: '15px', color: '#E2E8F0', marginTop: '6px' }}>
                    Lộ trình tinh gọn 4 kỹ năng trong 12 tuần
                  </div>
                </div>
              </div>
              <div className="dmr-card-body">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span className="dmr-badge-green">BÁN CHẠY NHẤT</span>
                    <span style={{ fontSize: '0.85rem', color: '#718096' }}>Hơn 28.000 học viên</span>
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-beanbag)', fontSize: '1.4rem', fontWeight: 800, color: '#07403F', marginBottom: '6px' }}>
                    Khóa Học IELTS Bứt Phá (5.5 → 6.5+)
                  </h3>
                  <p style={{ color: '#4A5568', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: '16px' }}>
                    Tập trung chuyên sâu chiến thuật xử lý các dạng bài khó trong Listening &amp; Reading, làm chủ cấu trúc Writing Task 1 &amp; 2, phản xạ Speaking tự nhiên theo chủ đề.
                  </p>
                </div>
                <Link
                  to="/courses"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#57D061',
                    color: '#07403F',
                    fontWeight: 800,
                    padding: '12px 20px',
                    borderRadius: '50px',
                    textDecoration: 'none',
                    fontFamily: 'var(--font-beanbag)',
                    textTransform: 'uppercase',
                    fontSize: '0.9rem',
                  }}
                >
                  Nhận tư vấn lộ trình 6.5+ →
                </Link>
              </div>
            </div>

            {/* Card 2: Khóa 6.5 - 7.5+ Master */}
            <div className="dmr-exclusive-card" style={{ background: '#FFFFFF' }}>
              <div
                style={{
                  height: '240px',
                  background: 'linear-gradient(135deg, #EC6E23 0%, #D85611 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  padding: '24px',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', letterSpacing: '1px', textTransform: 'uppercase', color: '#FEF08A', fontWeight: 800 }}>
                    HỌC CÙNG GIẢNG VIÊN 8.5+ - 9.0
                  </div>
                  <div style={{ fontFamily: 'var(--font-beanbag)', fontSize: '2.4rem', fontWeight: 800, marginTop: '6px' }}>
                    IELTS MASTER 7.5+ - 8.0+
                  </div>
                  <div style={{ fontSize: '15px', color: '#FFF275', marginTop: '6px' }}>
                    Coaching chuyên sâu Writing &amp; Speaking 1:1
                  </div>
                </div>
              </div>
              <div className="dmr-card-body">
                <div>
                  <span className="dmr-badge-orange" style={{ marginBottom: '8px', display: 'inline-block' }}>
                    MỤC TIÊU SĂN HỌC BỔNG TOÀN PHẦN
                  </span>
                  <h3 style={{ fontFamily: 'var(--font-beanbag)', fontSize: '1.45rem', fontWeight: 800, color: '#07403F', marginBottom: '8px' }}>
                    Khóa Chuyên Sâu IELTS Master (6.5 → 7.5+ - 8.0+)
                  </h3>
                  <p style={{ color: '#4A5568', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '18px' }}>
                    Nâng tầm từ vựng C1-C2 và cấu trúc ngữ pháp phức tạp. Sửa bài Writing không giới hạn, Mock Interview 1:1 trực tiếp với cựu giám khảo chấm thi khảo thí quốc tế.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <Link
                    to="/courses"
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      backgroundColor: '#EC6E23',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      padding: '12px 24px',
                      borderRadius: '50px',
                      textDecoration: 'none',
                      fontFamily: 'var(--font-beanbag)',
                      textTransform: 'uppercase',
                      fontSize: '0.9rem',
                    }}
                  >
                    Đăng ký Test 1:1 Miễn Phí
                  </Link>
                  <Link
                    to="/courses"
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      border: '2px solid #57D061',
                      color: '#07403F',
                      fontWeight: 800,
                      padding: '12px 24px',
                      borderRadius: '50px',
                      textDecoration: 'none',
                      fontFamily: 'var(--font-beanbag)',
                      textTransform: 'uppercase',
                      fontSize: '0.9rem',
                    }}
                  >
                    Xem chi tiết học phần
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: MÔ HÌNH HỌC IELTS ONLINE (ONLINE VIP & ONLINE BASIC) */}
        <section className="dmr-section">
          <div className="dmr-section-header">
            <div className="dmr-sub-title-row">
              <span className="dmr-sub-title-dark">Luyện thi IELTS Online</span>
              <span className="dmr-sub-title-light">Học qua nền tảng Zoom tương tác &amp; Kho bài giảng số</span>
            </div>
          </div>

          <div className="dmr-cards-row">
            {/* Card: Online VIP */}
            <div className="dmr-tier-card">
              <div>
                <div className="dmr-tier-header">
                  <div
                    style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '18px',
                      backgroundColor: '#E6FFFA',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '52px',
                      flexShrink: 0,
                    }}
                  >
                    💻
                  </div>
                  <div>
                    <div className="dmr-tier-name">IELTS VIP Zoom ⭐</div>
                    <div className="dmr-tier-tagline">Học trực tiếp với giảng viên 8.5+ IELTS</div>
                    <div className="dmr-tier-desc">
                      Lớp học quy mô nhỏ (tối đa 8 học viên), tương tác 2 chiều liên tục. Có trợ giảng hỗ trợ chữa bài tập và giải đáp thắc mắc 24/7 suốt khóa học.
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', color: '#718096', marginBottom: '8px' }}>
                  CHỌN BAND ĐIỂM MỤC TIÊU:
                </div>
                <ul className="dmr-level-list">
                  <li><Link to="/courses" className="dmr-level-pill">5.0+</Link></li>
                  <li><Link to="/courses" className="dmr-level-pill">6.0+</Link></li>
                  <li><Link to="/courses" className="dmr-level-pill">6.5+</Link></li>
                  <li><Link to="/courses" className="dmr-level-pill">7.5+</Link></li>
                  <li><Link to="/courses" className="dmr-level-pill">8.0+</Link></li>
                </ul>
              </div>
            </div>

            {/* Card: Online Basic */}
            <div className="dmr-tier-card">
              <div>
                <div className="dmr-tier-header">
                  <div
                    style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '18px',
                      backgroundColor: '#FEF3C7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '52px',
                      flexShrink: 0,
                    }}
                  >
                    📱
                  </div>
                  <div>
                    <div className="dmr-tier-name">IELTS Self-Study 🚀</div>
                    <div className="dmr-tier-tagline">Học online qua video bài giảng &amp; Ngân hàng đề thi</div>
                    <div className="dmr-tier-desc">
                      Hơn 500+ bài giảng video chuyên sâu từ cựu giám khảo, tích hợp kho đề Cambridge 10-19 có chấm điểm tự động và phân tích giải thích cặn kẽ.
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', color: '#718096', marginBottom: '8px' }}>
                  CHỌN BAND ĐIỂM MỤC TIÊU:
                </div>
                <ul className="dmr-level-list">
                  <li>
                    <Link to="/courses" className="dmr-level-pill">
                      4.5+
                    </Link>
                  </li>
                  <li>
                    <Link to="/courses" className="dmr-level-pill">
                      5.5+
                    </Link>
                  </li>
                  <li>
                    <Link to="/courses" className="dmr-level-pill">
                      6.5+ <span className="dmr-pill-tag">HOT</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/courses" className="dmr-level-pill">
                      7.5+ <span className="dmr-pill-tag">MỚI</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/courses" className="dmr-level-pill">
                      8.0+
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: LUYỆN THI IELTS OFFLINE CAMPUS */}
        <section className="dmr-section">
          <div className="dmr-section-header">
            <div className="dmr-sub-title-row">
              <span className="dmr-sub-title-dark">IELTS Offline Campus</span>
              <span className="dmr-sub-title-light">Học trực tiếp tại hệ thống Campus Hà Nội &amp; TP. HCM</span>
            </div>
          </div>

          <div className="dmr-offline-card">
            <div style={{ maxWidth: '680px' }}>
              <div className="dmr-offline-title">Môi Trường Học Tập Chuẩn Quốc Tế 🏫</div>
              <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1A202C', marginBottom: '6px' }}>
                Phòng máy tính trang bị tai nghe chuyên dụng mô phỏng 100% phòng thi thật của IDP &amp; British Council
              </p>
              <p style={{ color: '#718096', fontSize: '0.95rem', lineHeight: 1.5 }}>
                Không gian học tập sáng tạo, phòng tự học mở cửa 7 ngày/tuần. Học viên được thi thử miễn phí hàng tháng và ký cam kết đầu ra bằng văn bản pháp lý.
              </p>
            </div>

            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', color: '#718096', marginBottom: '8px' }}>
                KHÓA KHAI GIẢNG TRỰC TIẾP:
              </div>
              <ul className="dmr-level-list">
                <li><Link to="/courses" className="dmr-level-pill">5.5+</Link></li>
                <li><Link to="/courses" className="dmr-level-pill">6.5+</Link></li>
                <li><Link to="/courses" className="dmr-level-pill">7.5+</Link></li>
                <li><Link to="/courses" className="dmr-level-pill">8.0+</Link></li>
              </ul>
            </div>
          </div>
        </section>

        {/* SECTION: CHUYÊN SÂU WRITING & SPEAKING */}
        <section className="dmr-section">
          <div className="dmr-section-header">
            <div className="dmr-sub-title-row">
              <span className="dmr-sub-title-dark">Chuyên sâu 2 kỹ năng đầu ra</span>
              <span className="dmr-sub-title-light">Bứt phá điểm số với dịch vụ Coaching 1:1 Writing &amp; Speaking</span>
            </div>
          </div>

          <div className="dmr-cards-row">
            {/* Speaking */}
            <div className="dmr-tier-card">
              <div>
                <div className="dmr-tier-name orange">SPEAKING COACHING 1:1 🎙️</div>
                <div className="dmr-tier-tagline">Luyện phản xạ trực tiếp cùng cựu Giám khảo khảo thí</div>
                <div className="dmr-tier-desc">
                  Thực chiến trọn bộ đề thi Forecast Speaking theo quý mới nhất. Giáo viên trực tiếp chỉnh sửa phát âm, trọng âm câu và cách phát triển ý Part 3 mạch lạc.
                </div>
              </div>
              <div style={{ marginTop: '24px' }}>
                <Link
                  to="/courses"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    backgroundColor: '#EC6E23',
                    color: '#FFFFFF',
                    padding: '12px 28px',
                    borderRadius: '50px',
                    fontWeight: 800,
                    textDecoration: 'none',
                    fontFamily: 'var(--font-beanbag)',
                    textTransform: 'uppercase',
                    fontSize: '0.9rem',
                  }}
                >
                  Đăng ký Test Speaking 1:1 →
                </Link>
              </div>
            </div>

            {/* Writing */}
            <div className="dmr-tier-card">
              <div>
                <div className="dmr-tier-name orange">WRITING INTENSIVE ✍️</div>
                <div className="dmr-tier-tagline">Sửa bài chi tiết theo chuẩn 4 tiêu chí Band Descriptors</div>
                <div className="dmr-tier-desc">
                  Chấm chữa chi tiết từng lỗi dùng từ, ngữ pháp và lập luận luận điểm Task 1 &amp; Task 2. Cung cấp bài mẫu Band 8.0+ viết lại cho từng bài nộp của học viên.
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <Link
                  to="/courses"
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    border: '2px solid #EC6E23',
                    color: '#EC6E23',
                    padding: '12px',
                    borderRadius: '50px',
                    fontWeight: 800,
                    textDecoration: 'none',
                    fontFamily: 'var(--font-beanbag)',
                    textTransform: 'uppercase',
                    fontSize: '0.85rem',
                  }}
                >
                  Writing Task 1
                </Link>
                <Link
                  to="/courses"
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    border: '2px solid #EC6E23',
                    color: '#EC6E23',
                    padding: '12px',
                    borderRadius: '50px',
                    fontWeight: 800,
                    textDecoration: 'none',
                    fontFamily: 'var(--font-beanbag)',
                    textTransform: 'uppercase',
                    fontSize: '0.85rem',
                  }}
                >
                  Writing Task 2
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: TÀI LIỆU & GIÁO TRÌNH ĐỘC QUYỀN */}
        <section className="dmr-section" id="books">
          <div className="dmr-section-header">
            <div className="dmr-sub-title-row">
              <span className="dmr-sub-title-dark">Thư viện Giáo trình &amp; Tài liệu IELTS</span>
              <span className="dmr-sub-title-light">Biên soạn bởi Hội đồng Chuyên môn EduCenter IELTS</span>
            </div>
          </div>

          <div className="dmr-book-card">
            <div>
              <div style={{ fontFamily: 'var(--font-beanbag)', fontSize: '2.5rem', fontWeight: 800, color: '#1E9AA5', lineHeight: 1, marginBottom: '14px' }}>
                Bộ Sách IELTS Breakthrough 📚
              </div>
              <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#2D3748', marginBottom: '8px' }}>
                Trọn bộ giáo trình từ Foundation đến Master Band 8.0+
              </p>
              <p style={{ color: '#718096', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '20px' }}>
                Tích hợp giải chi tiết bộ Cambridge IELTS 10-19, Ebook 1.200 từ vựng Academic theo 20 chủ đề trọng tâm và tuyển tập 100 bài luận mẫu Task 2 đạt band 8.0+.
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Link to="/courses" className="dmr-level-pill" style={{ width: 'auto', padding: '0 24px', borderRadius: '50px', borderColor: '#1E9AA5', color: '#1E9AA5' }}>
                  Band 4.5 - 5.5
                </Link>
                <Link to="/courses" className="dmr-level-pill" style={{ width: 'auto', padding: '0 24px', borderRadius: '50px', borderColor: '#1E9AA5', color: '#1E9AA5' }}>
                  Band 5.5 - 6.5
                </Link>
                <Link to="/courses" className="dmr-level-pill" style={{ width: 'auto', padding: '0 24px', borderRadius: '50px', borderColor: '#1E9AA5', color: '#1E9AA5' }}>
                  Band 7.5+ Master
                </Link>
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSUL0LDWoPjyq2tFR61JGFWr-WmaF10GR4oj7KTckPDfMpLWlWSIUwvAdw&s=10"
                alt="Bộ sách IELTS Breakthrough"
                style={{ maxHeight: '250px', margin: '0 auto', objectFit: 'contain' }}
              />
            </div>
          </div>
        </section>

        {/* SECTION: CON SỐ ẤN TƯỢNG (STATS) */}
        <section className="dmr-stats-section">
          <div className="dmr-stats-container">
            <div className="dmr-stat-item">
              <div className="dmr-stat-number">98.5%</div>
              <div className="dmr-stat-label">Học viên đạt và vượt band điểm mục tiêu cam kết</div>
            </div>
            <div className="dmr-stat-item">
              <div className="dmr-stat-number">52.480+</div>
              <div className="dmr-stat-label">Học viên đã tốt nghiệp các khóa học IELTS</div>
            </div>
            <div className="dmr-stat-item">
              <div className="dmr-stat-number">18.650+</div>
              <div className="dmr-stat-label">Học viên đạt chứng chỉ 7.0 – 8.5 IELTS</div>
            </div>
            <div className="dmr-stat-item">
              <div className="dmr-stat-number">#1</div>
              <div className="dmr-stat-label">Đối tác đào tạo IELTS cam kết chuẩn đầu ra uy tín</div>
            </div>
          </div>
        </section>

        {/* SECTION: ĐỘI NGŨ GIẢNG VIÊN 8.5+ - 9.0 (INTERACTIVE SHOWCASE) */}
        <section className="dmr-section" id="teachers">
          <div className="dmr-section-header" style={{ textAlign: 'center' }}>
            <h2 className="dmr-main-title" style={{ justifyContent: 'center' }}>
              Đội ngũ giảng viên 8.5+ - 9.0 IELTS
            </h2>
            <p style={{ color: '#718096', fontSize: '1.05rem', marginTop: '6px' }}>
              100% giáo viên sở hữu chứng chỉ IELTS từ 8.5 trở lên, cựu du học sinh Anh, Úc, Mỹ với bề dày kinh nghiệm sư phạm
            </p>
          </div>

          {/* Selected Teacher Detailed Hero Box */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              padding: '36px',
              boxShadow: '0 12px 36px rgba(0,0,0,0.07)',
              display: 'grid',
              gridTemplateColumns: '1.4fr 1fr',
              gap: '30px',
              alignItems: 'center',
              marginBottom: '30px',
            }}
          >
            <div>
              <div style={{ display: 'inline-block', backgroundColor: '#EC6E23', color: '#FFF', fontWeight: 800, padding: '6px 18px', borderRadius: '12px', fontFamily: 'var(--font-beanbag)', fontSize: '1.1rem', marginBottom: '14px' }}>
                TRIẾT LÝ: {selectedTeacher.motto}
              </div>
              <h3 style={{ fontFamily: 'var(--font-beanbag)', fontSize: '2.2rem', fontWeight: 800, color: '#07403F', marginBottom: '6px' }}>
                {selectedTeacher.name}
              </h3>
              <div style={{ color: '#57D061', fontWeight: 700, fontSize: '1.1rem', marginBottom: '18px' }}>
                {selectedTeacher.role}
              </div>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: 0, margin: 0 }}>
                {selectedTeacher.bio.map((item, idx) => (
                  <li key={idx} style={{ color: '#4A5568', fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#57D061', fontWeight: 800 }}>•</span> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ textAlign: 'center', backgroundColor: selectedTeacher.bgColor, borderRadius: '20px', padding: '10px' }}>
              <img
                src={selectedTeacher.imgUrl}
                alt={selectedTeacher.name}
                style={{ height: '340px', objectFit: 'contain', margin: '0 auto' }}
              />
            </div>
          </div>

          {/* Teacher Selector Thumbnails */}
          <div className="dmr-teachers-row">
            {teachers.map((t) => (
              <div
                key={t.id}
                className={`dmr-teacher-card ${activeTeacher === t.id ? 'active' : ''}`}
                onClick={() => setActiveTeacher(t.id)}
              >
                <div className="dmr-teacher-img-wrap" style={{ backgroundColor: t.bgColor }}>
                  <img src={t.imgUrl} alt={t.name} className="dmr-teacher-img" />
                  <div className="dmr-teacher-badge">{t.motto}</div>
                </div>
                <div className="dmr-teacher-info">
                  <div className="dmr-teacher-name">{t.name}</div>
                  <div className="dmr-teacher-role">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION: BẢNG VÀNG THÀNH TÍCH (REVIEWS) */}
        <section className="dmr-section" id="reviews">
          <div className="dmr-section-header" style={{ textAlign: 'center' }}>
            <h2 className="dmr-main-title" style={{ justifyContent: 'center' }}>
              Bảng vàng thành tích học viên
            </h2>
            <p style={{ color: '#EC6E23', fontFamily: 'var(--font-beanbag)', fontWeight: 800, fontSize: '1.4rem', marginTop: '6px' }}>
              "Học đúng phương pháp – Bứt phá 8.0+ trong tầm tay"
            </p>
          </div>

          <div className="dmr-reviews-grid">
            {reviews.map((r, i) => (
              <div key={i} className="dmr-review-card">
                <div>
                  <div className="dmr-review-header">
                    <img src={r.avatar} alt={r.name} className="dmr-review-avatar" />
                    <div>
                      <div className="dmr-review-name">{r.name}</div>
                      <div style={{ color: '#EC6E23', fontWeight: 800, fontSize: '0.95rem' }}>{r.band}</div>
                      <div className="dmr-review-job">{r.detail}</div>
                    </div>
                  </div>
                  <div className="dmr-review-comment">"{r.comment}"</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION: ĐỐI TÁC KHẢO THÍ */}
        <section className="dmr-section" id="partners">
          <div className="dmr-section-header" style={{ textAlign: 'center' }}>
            <h3 style={{ fontFamily: 'var(--font-beanbag)', fontSize: '1.6rem', fontWeight: 800, color: '#07403F' }}>
              Đối tác Khảo thí &amp; Đại học bảo trợ chuyên môn
            </h3>
          </div>

          <div className="dmr-partners-bar" style={{ justifyContent: 'center', gap: '40px' }}>
            {partnerLogos.map((p, i) => (
              <div
                key={i}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '12px',
                  border: '1.5px solid #E2E8F0',
                  fontWeight: 800,
                  color: '#07403F',
                  fontSize: '1rem',
                  fontFamily: 'var(--font-beanbag)',
                }}
              >
                {p.label}
              </div>
            ))}
          </div>
        </section>

        {/* SECTION: THÔNG BÁO TỪ TRUNG TÂM (UC06) */}
        <section className="dmr-section" id="news">
          <div className="dmr-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ color: '#EC6E23', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                BẢN TIN KHẢO THÍ &amp; SỰ KIỆN MỚI NHẤT
              </div>
              <h2 className="dmr-main-title" style={{ margin: 0 }}>
                Thông Báo &amp; Sự Kiện Từ EduCenter
              </h2>
            </div>
            <Link
              to="/announcements"
              style={{
                backgroundColor: '#07403F',
                color: '#FFFFFF',
                padding: '8px 20px',
                borderRadius: '50px',
                fontWeight: 700,
                textDecoration: 'none',
                fontSize: '0.875rem',
              }}
            >
              Xem tất cả thông báo →
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {dynamicAnnouncements.length > 0 ? (
              dynamicAnnouncements.map((item) => (
                <div
                  key={item._id}
                  style={{
                    background: '#FFFFFF',
                    padding: '20px',
                    borderRadius: '16px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
                    border: item.isPinned ? '2px solid #57D061' : '1px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0369A1', backgroundColor: '#E0F2FE', padding: '2px 8px', borderRadius: '4px' }}>
                      {item.category}
                    </span>
                    {item.isPinned && (
                      <span style={{ fontSize: '0.75rem', color: '#B45309', fontWeight: 700 }}>
                        📌 Nổi bật
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#07403F', margin: '0 0 8px', lineHeight: 1.4 }}>
                    {item.title}
                  </h3>

                  <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 14px', lineHeight: 1.5, flex: 1 }}>
                    {item.summary || item.content.slice(0, 110) + '...'}
                  </p>

                  <Link
                    to="/announcements"
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: '#EC6E23',
                      textDecoration: 'none',
                      marginTop: 'auto',
                    }}
                  >
                    Xem chi tiết thông báo →
                  </Link>
                </div>
              ))
            ) : (
              <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '16px', gridColumn: '1 / -1', textAlign: 'center', color: '#64748B' }}>
                Đang cập nhật thông báo mới...
              </div>
            )}
          </div>
        </section>

        {/* SECTION: THÔNG TIN TRUNG TÂM EDUCENTER (UC01) */}
        <section className="dmr-section" id="about">
          <div className="dmr-section-header" style={{ textAlign: 'center' }}>
            <div style={{ color: '#07403F', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
              GIỚI THIỆU TỔ CHỨC ĐÀO TẠO
            </div>
            <h2 className="dmr-main-title" style={{ justifyContent: 'center' }}>
              Thông Tin Trung Tâm EduCenter
            </h2>
            <p style={{ color: '#64748B', fontSize: '1.05rem', maxWidth: '750px', margin: '8px auto 0' }}>
              {centerInfo?.slogan || 'Học viện Luyện thi IELTS 8.0+ Chuẩn Khảo thí Quốc tế'}
            </p>
          </div>

          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              padding: '32px',
              boxShadow: '0 12px 36px rgba(0,0,0,0.06)',
              marginBottom: '24px',
            }}
          >
            {/* Intro paragraph */}
            <p style={{ fontSize: '1rem', color: '#334155', lineHeight: 1.8, marginBottom: '24px' }}>
              {centerInfo?.introduction}
            </p>

            {/* Quick Contact & Working Hours Bar */}
            <div
              style={{
                backgroundColor: '#F8FAFC',
                borderRadius: '16px',
                padding: '18px 24px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
                marginBottom: '28px',
                border: '1px solid #E2E8F0',
              }}
            >
              <div>
                <span style={{ display: 'block', fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>Hotline Tư vấn:</span>
                <strong style={{ fontSize: '1.1rem', color: '#EC6E23' }}>{centerInfo?.hotline || '1900 6868'}</strong>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>Email Liên hệ:</span>
                <strong style={{ fontSize: '0.95rem', color: '#07403F' }}>{centerInfo?.email || 'contact@educenter.edu.vn'}</strong>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>Giờ mở cửa tự học &amp; tư vấn:</span>
                <strong style={{ fontSize: '0.95rem', color: '#334155' }}>{centerInfo?.workingHours || '08:00 - 21:30'}</strong>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>Trụ sở chính:</span>
                <strong style={{ fontSize: '0.9rem', color: '#334155' }}>{centerInfo?.address || '128 Cầu Giấy, Hà Nội'}</strong>
              </div>
            </div>

            {/* Sub-tabs: Chi nhánh, Cơ sở vật chất, Sứ mệnh */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #E2E8F0', paddingBottom: '12px', marginBottom: '24px' }}>
              <button
                type="button"
                onClick={() => setCenterTab('branches')}
                style={{
                  padding: '8px 18px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: centerTab === 'branches' ? '#07403F' : '#F1F5F9',
                  color: centerTab === 'branches' ? '#FFFFFF' : '#475569',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                🏢 Hệ thống {centerInfo?.branches?.length || 5} Cơ sở đào tạo
              </button>

              <button
                type="button"
                onClick={() => setCenterTab('facilities')}
                style={{
                  padding: '8px 18px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: centerTab === 'facilities' ? '#07403F' : '#F1F5F9',
                  color: centerTab === 'facilities' ? '#FFFFFF' : '#475569',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                🏫 Cơ sở vật chất phòng thi chuẩn quốc tế
              </button>

              <button
                type="button"
                onClick={() => setCenterTab('mission')}
                style={{
                  padding: '8px 18px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: centerTab === 'mission' ? '#07403F' : '#F1F5F9',
                  color: centerTab === 'mission' ? '#FFFFFF' : '#475569',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                🎯 Tầm nhìn &amp; Cam kết đầu ra
              </button>
            </div>

            {/* Tab 1: Branches */}
            {centerTab === 'branches' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {centerInfo?.branches?.map((b, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '16px',
                      backgroundColor: b.isHeadquarters ? '#F0FDF4' : '#F8FAFC',
                      border: b.isHeadquarters ? '2px solid #57D061' : '1px solid #E2E8F0',
                      borderRadius: '14px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <strong style={{ color: '#07403F', fontSize: '0.95rem' }}>{b.branchName}</strong>
                      {b.isHeadquarters && (
                        <span style={{ fontSize: '0.7rem', backgroundColor: '#57D061', color: '#07403F', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                          TRỤ SỞ CHÍNH
                        </span>
                      )}
                    </div>
                    <p style={{ margin: '0 0 6px', fontSize: '0.85rem', color: '#475569' }}>
                      📍 {b.address}
                    </p>
                    <span style={{ fontSize: '0.85rem', color: '#EC6E23', fontWeight: 700 }}>
                      📞 {b.phone}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 2: Facilities */}
            {centerTab === 'facilities' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                {centerInfo?.facilities?.map((f, i) => (
                  <div
                    key={i}
                    style={{
                      backgroundColor: '#F8FAFC',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    {f.imageUrl && (
                      <img
                        src={f.imageUrl}
                        alt={f.name}
                        style={{ width: '100%', height: '160px', objectFit: 'cover' }}
                      />
                    )}
                    <div style={{ padding: '16px' }}>
                      <h4 style={{ margin: '0 0 6px', color: '#07403F', fontSize: '1rem', fontWeight: 700 }}>
                        {f.name}
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B', lineHeight: 1.5 }}>
                        {f.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 3: Mission & Vision */}
            {centerTab === 'mission' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={{ backgroundColor: '#F0FDF4', padding: '24px', borderRadius: '16px', border: '1px solid #BBF7D0' }}>
                  <h4 style={{ color: '#166534', fontSize: '1.1rem', margin: '0 0 8px', fontWeight: 800 }}>
                    🌟 Tầm nhìn chiến lược
                  </h4>
                  <p style={{ color: '#374151', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
                    {centerInfo?.vision}
                  </p>
                </div>
                <div style={{ backgroundColor: '#FFF7ED', padding: '24px', borderRadius: '16px', border: '1px solid #FED7AA' }}>
                  <h4 style={{ color: '#9A3412', fontSize: '1.1rem', margin: '0 0 8px', fontWeight: 800 }}>
                    🎯 Sứ mệnh giáo dục
                  </h4>
                  <p style={{ color: '#374151', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
                    {centerInfo?.mission}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* SECTION: CTA CUỐI TRANG */}
        {!isAuthenticated && (
          <section className="dmr-section" style={{ textAlign: 'center', marginTop: '40px' }}>
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
        )}
      </div>

      {/* Floating Action Buttons */}
      <div className="dmr-floating-actions">
        <Link to="/courses" className="dmr-fab-btn dmr-fab-test" title="Làm bài thi thử IELTS">
          📝
        </Link>
        <a
          href="https://m.me/educenter"
          target="_blank"
          rel="noreferrer"
          className="dmr-fab-btn dmr-fab-chat"
          title="Tư vấn lộ trình IELTS 24/7"
        >
          💬
        </a>
      </div>
    </div>
  );
};

export default HomePage;
