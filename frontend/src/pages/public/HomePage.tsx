import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

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
    tag: 'LỘ TRÌNH ĐẶC QUYỀN 2026',
    title: 'Luyện thi JLPT N5 - N1',
    highlight: 'Đỗ Ngay Lần Đầu',
    desc: 'Hơn 660.000 học viên đã tin tưởng lựa chọn khóa học tiếng Nhật online và offline cùng EduCenter. Lộ trình bài bản, cam kết chuẩn đầu ra.',
    buttonText: 'Học thử miễn phí ngay',
    buttonLink: '/courses',
    bgUrl: 'https://dungmori.com/cdn/qc/default/1791187757_1259190_44427.jpeg',
  },
  {
    id: 2,
    tag: 'TƯƠNG TÁC TRỰC TIẾP 1:1',
    title: 'Lớp Học Online VIP',
    highlight: 'Trực Tiếp Qua Zoom',
    desc: 'Tương tác trực tiếp cùng Giảng viên Nhật - Việt giàu kinh nghiệm. Có trợ giảng hỗ trợ giải đáp 24/7 suốt quá trình học tập.',
    buttonText: 'Xem lịch khai giảng',
    buttonLink: '/courses',
    bgUrl: 'https://dungmori.com/cdn/qc/default/1791421314_1234500_25285.png',
  },
  {
    id: 3,
    tag: 'HOÀN TOÀN MIỄN PHÍ',
    title: 'Đề Thi Thử JFT-Basic & Tokutei',
    highlight: 'Có Lời Giải Chi Tiết',
    desc: 'Hệ thống thi thử mô phỏng chuẩn xác định dạng đề thi thực tế trên máy tính, giúp học viên rèn luyện phản xạ và tâm lý phòng thi tốt nhất.',
    buttonText: 'Làm bài thi thử ngay',
    buttonLink: '/courses',
    bgUrl: 'https://dungmori.com/cdn/qc/default/1789616784_1185120_51119.jpeg',
  },
  {
    id: 4,
    tag: 'CHÍNH SÁCH ĐỘC QUYỀN',
    title: 'Cam Kết Đảm Bảo Đầu Ra',
    highlight: 'Bằng Văn Bản',
    desc: 'Khích lệ tinh thần nỗ lực của học viên. Học viên đạt mục tiêu kỳ thi nhận ngay quà tặng học bổng và hoàn học phí hấp dẫn.',
    buttonText: 'Tìm hiểu chính sách',
    buttonLink: '/courses',
    bgUrl: 'https://dungmori.com/cdn/qc/default/1789378060_962910_41484.jpeg',
  },
];

const teachers = [
  {
    id: 1,
    name: 'NGUYỄN VĂN DŨNG',
    role: 'Giám đốc Trung tâm EduCenter',
    motto: 'TÂM HUYẾT',
    bio: [
      'Cử nhân khoa Giáo dục, Đại học Nhật Bản (日本大学)',
      'Đạt học bổng toàn phần danh giá Mitsubishi',
      'Hơn 10 năm kinh nghiệm giảng dạy tiếng Nhật cho người Việt',
    ],
    bgColor: '#D7D6FF',
    imgUrl: 'https://cdn.dungmori.com/assets/img/new_home/06-2024/thaydung.png',
  },
  {
    id: 2,
    name: 'PHƯƠNG THỊ THANH',
    role: 'Phó giám đốc Trung tâm',
    motto: 'SÁNG TẠO',
    bio: [
      'Cử nhân khoa Tiếng Nhật, Đại học Hà Nội',
      'Thạc sĩ chuyên ngành Giáo dục tiếng Nhật, Đại học Ngoại ngữ Tokyo',
      'Đạt học bổng chính phủ Nhật Bản - MEXT',
    ],
    bgColor: '#B2CFDB',
    imgUrl: 'https://cdn.dungmori.com/assets/img/new_home/06-2024/cothanh.png',
  },
  {
    id: 3,
    name: 'ĐAN HOÀNG NGHĨA',
    role: 'Phó giám đốc Chuyên môn',
    motto: 'ĐA DẠNG',
    bio: [
      'Cử nhân Luật Đại học Aomori Chuo',
      'Thạc sĩ KHTT Đại học Quốc gia Nagoya (học bổng Tokyo Marine)',
      'Đạt điểm tuyệt đối 180/180 JLPT N1 (60/60 Từ vựng, 60/60 Đọc, 60/60 Nghe)',
    ],
    bgColor: '#AFEBB4',
    imgUrl: 'https://cdn.dungmori.com/assets/img/new_home/06-2024/thaynghia.png',
  },
  {
    id: 4,
    name: 'ĐINH THỊ HIỀN',
    role: 'Trưởng phòng Đào tạo',
    motto: 'BỀN BỈ',
    bio: [
      'Thành thạo song ngữ Nhật - Trung',
      'Đạt chứng chỉ JLPT N1 xuất sắc',
      'Chuyên gia xây dựng phương pháp phản xạ từ vựng và ngữ pháp',
    ],
    bgColor: '#F8C8B9',
    imgUrl: 'https://cdn.dungmori.com/assets/img/new_home/06-2024/cohien.png',
  },
  {
    id: 5,
    name: 'PHƯƠNG THỊ NHÀN',
    role: 'Trưởng phòng Phát triển sản phẩm',
    motto: 'KẾT NỐI',
    bio: [
      'Cử nhân Đại học Toyo Nhật Bản',
      'Chứng chỉ JLPT N1 với điểm Đọc 60/60 và Nghe 60/60',
      'Chứng chỉ J1+ tiếng Nhật thương mại quốc tế',
    ],
    bgColor: '#F2E8B2',
    imgUrl: 'https://cdn.dungmori.com/assets/img/new_home/06-2024/conhan.png',
  },
];

const reviews = [
  {
    name: 'Nguyễn Vũ Đức Anh',
    job: 'Nhân viên văn phòng',
    comment: '役に立つコース！！ Khóa học rất hữu ích và bám sát thực tế công việc tại công ty Nhật của mình. Thầy cô truyền đạt cực kỳ dễ hiểu!',
    avatar: 'https://dungmori.com/cdn/feedback/default/1609906434_1730966520_7e310d.png',
  },
  {
    name: 'Cám Em',
    job: 'Nhân viên văn phòng',
    comment: 'Em cảm ơn thầy cô vì đã thật tâm huyết qua từng bài giảng để việc học tiếng Nhật của em trở nên dễ dàng hơn. Nhờ thầy cô mà em đã đỗ N2!',
    avatar: 'https://dungmori.com/cdn/feedback/default/1721186619_3377122890_33433.jpeg',
  },
  {
    name: 'Phạm Thị Hạnh',
    job: 'Kỹ sư phần mềm',
    comment: 'Em rất may mắn khi được bạn bè giới thiệu EduCenter. Khóa học đã giúp em có động lực học và thi đỗ ngay kỳ thi JLPT N3 chỉ sau 5 tháng!',
    avatar: 'https://dungmori.com/cdn/feedback/default/1721186661_106463280_34555.jpeg',
  },
];

const partners = [
  { name: 'Canon', src: 'https://cdn.dungmori.com/assets/img/new_home/06-2024/canon.svg' },
  { name: 'Hitachi', src: 'https://cdn.dungmori.com/assets/img/new_home/06-2024/hitachi.svg' },
  { name: 'FPT Software', src: 'https://cdn.dungmori.com/assets/img/new_home/06-2024/fsoft.svg' },
  { name: 'Nissan', src: 'https://cdn.dungmori.com/assets/img/new_home/06-2024/nissan.svg' },
  { name: 'Aeon', src: 'https://cdn.dungmori.com/assets/img/new_home/06-2024/aeon.svg' },
  { name: 'Rikkei', src: 'https://cdn.dungmori.com/assets/img/new_home/06-2024/rikkei.svg' },
];

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [activeTeacher, setActiveTeacher] = useState<number>(1);

  // Auto slide interval
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) {
      setCouponMessage('Vui lòng nhập mã ưu đãi.');
      return;
    }
    setCouponMessage(`🎉 Chúc mừng! Mã "${couponCode.toUpperCase()}" đã kích hoạt mở toàn bộ khóa học Sơ cấp 24h!`);
  };

  const selectedTeacher = teachers.find((t) => t.id === activeTeacher) || teachers[0];

  return (
    <div style={{ backgroundColor: '#F0F0F0', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* ------------------------------------------------------------------
          1. HERO BANNER CAROUSEL
          ------------------------------------------------------------------ */}
      <section className="dmr-hero-carousel" aria-label="Khuyến mãi & Banner nổi bật">
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
                  <div className="dmr-slide-tag">{s.tag}</div>
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
      <section className="dmr-coupon-section" aria-label="Mã giới thiệu">
        <div className="dmr-coupon-container">
          <div className="dmr-coupon-info">
            <span className="dmr-coupon-icon">🎁</span>
            <div>
              <div className="dmr-coupon-title">Có mã giới thiệu?</div>
              <div className="dmr-coupon-sub">
                Mở toàn bộ khóa học <b>N5 - N4 sơ cấp mới</b> trong vòng 24 giờ hoàn toàn miễn phí!
              </div>
            </div>
          </div>
          <form className="dmr-coupon-form" onSubmit={handleApplyCoupon}>
            <input
              type="text"
              placeholder="Nhập mã ưu đãi..."
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="dmr-coupon-input"
            />
            <button type="submit" className="dmr-coupon-submit">
              Áp dụng mã
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
        {/* Floating Japanese motifs */}
        <div className="dmr-floating-shape" style={{ top: '80px', left: '20px', fontSize: '28px' }}>🌸</div>
        <div className="dmr-floating-shape" style={{ top: '350px', right: '30px', fontSize: '24px' }}>🍁</div>
        <div className="dmr-floating-shape" style={{ top: '800px', left: '40px', fontSize: '26px' }}>⛩️</div>

        {/* SECTION: SẢN PHẨM ĐỘC QUYỀN */}
        <section className="dmr-section" id="products">
          <div className="dmr-section-header">
            <h2 className="dmr-main-title">
              Sản phẩm độc quyền
              <span className="dmr-badge-orange" style={{ fontSize: '14px', padding: '6px 14px' }}>
                HỌC THỬ MIỄN PHÍ [MỚI]
              </span>
            </h2>
          </div>

          <div className="dmr-exclusive-grid">
            {/* Card 1: Khóa N5-N4 */}
            <div className="dmr-exclusive-card">
              <img
                src="https://cdn.dungmori.com/assets/img/new_home/06-2024/jlpt-new-n54-banner.png"
                alt="Khóa JLPT N5 & N4"
                className="dmr-card-banner-img"
              />
              <div className="dmr-card-body">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span className="dmr-badge-green">BÁN CHẠY NHẤT</span>
                    <span style={{ fontSize: '0.85rem', color: '#718096' }}>Hơn 120.000 học viên</span>
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-beanbag)', fontSize: '1.4rem', fontWeight: 800, color: '#07403F', marginBottom: '6px' }}>
                    Khóa Học Sơ Cấp JLPT N5 - N4
                  </h3>
                  <p style={{ color: '#4A5568', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: '16px' }}>
                    Giáo trình chuẩn hoá Gungun thế hệ mới. Đầy đủ chữ Hán, ngữ pháp, từ vựng và bài tập giải thích cặn kẽ từng câu.
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
                  Đăng ký học thử ngay →
                </Link>
              </div>
            </div>

            {/* Card 2: Khóa trước sơ cấp */}
            <div className="dmr-exclusive-card" style={{ background: '#FFFFFF' }}>
              <img
                src="https://cdn.dungmori.com/assets/img/new_home/06-2024/so-cap-banner.png"
                alt="Khóa học trước sơ cấp"
                className="dmr-card-banner-img"
                style={{ height: '240px' }}
              />
              <div className="dmr-card-body">
                <div>
                  <span className="dmr-badge-orange" style={{ marginBottom: '8px', display: 'inline-block' }}>
                    DÀNH CHO NGƯỜI MỚI BẮT ĐẦU
                  </span>
                  <h3 style={{ fontFamily: 'var(--font-beanbag)', fontSize: '1.45rem', fontWeight: 800, color: '#07403F', marginBottom: '8px' }}>
                    Khóa Học Tiếng Nhật Nhập Môn – Trước Sơ Cấp
                  </h3>
                  <p style={{ color: '#4A5568', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '18px' }}>
                    Bắt đầu từ con số 0: Nắm vững trọn vẹn 2 bảng chữ cái Hiragana và Katakana trong 5 ngày, cách ghép âm và phát âm chuẩn bản xứ Tokyo.
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
                    Học thử MIỄN PHÍ
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
                    Xem chi tiết giáo trình
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: LUYỆN THI JLPT ONLINE (ONLINE VIP & ONLINE BASIC) */}
        <section className="dmr-section">
          <div className="dmr-section-header">
            <div className="dmr-sub-title-row">
              <span className="dmr-sub-title-dark">Luyện thi JLPT online</span>
              <span className="dmr-sub-title-light">Học qua nền tảng App/Website, Zoom</span>
            </div>
          </div>

          <div className="dmr-cards-row">
            {/* Card: Online VIP */}
            <div className="dmr-tier-card">
              <div>
                <div className="dmr-tier-header">
                  <img
                    src="https://cdn.dungmori.com/assets/img/new_home/06-2024/mori-online-basic.png"
                    alt="Online VIP"
                    className="dmr-tier-img"
                  />
                  <div>
                    <div className="dmr-tier-name">Online VIP ⭐</div>
                    <div className="dmr-tier-tagline">Học trực tiếp với giáo viên qua Zoom</div>
                    <div className="dmr-tier-desc">
                      Lộ trình khoa học bài bản, có giáo viên hướng dẫn trực tiếp và trợ giảng hỗ trợ ngoài giờ. Cam kết cung cấp đầy đủ kiến thức theo từng level.
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', color: '#718096', marginBottom: '8px' }}>
                  CHỌN TRÌNH ĐỘ HỌC:
                </div>
                <ul className="dmr-level-list">
                  <li><Link to="/courses" className="dmr-level-pill">N1</Link></li>
                  <li><Link to="/courses" className="dmr-level-pill">N2</Link></li>
                  <li><Link to="/courses" className="dmr-level-pill">N3</Link></li>
                  <li><Link to="/courses" className="dmr-level-pill">N4</Link></li>
                  <li><Link to="/courses" className="dmr-level-pill">N5</Link></li>
                </ul>
              </div>
            </div>

            {/* Card: Online Basic */}
            <div className="dmr-tier-card">
              <div>
                <div className="dmr-tier-header">
                  <img
                    src="https://cdn.dungmori.com/assets/img/new_home/06-2024/mori-3d.png"
                    alt="Online Basic"
                    className="dmr-tier-img"
                  />
                  <div>
                    <div className="dmr-tier-name">Online Basic 🚀</div>
                    <div className="dmr-tier-tagline">Học online qua video bài giảng &amp; bài test</div>
                    <div className="dmr-tier-desc">
                      Với lộ trình được cá nhân hóa và hệ thống bài giảng lên tới hàng nghìn video / bài test có lời giải thích chi tiết, học mọi lúc mọi nơi.
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', color: '#718096', marginBottom: '8px' }}>
                  CHỌN TRÌNH ĐỘ HỌC:
                </div>
                <ul className="dmr-level-list">
                  <li>
                    <Link to="/courses" className="dmr-level-pill">
                      N1 <span className="dmr-pill-tag">MỚI</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/courses" className="dmr-level-pill">
                      N2 <span className="dmr-pill-tag">MỚI</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/courses" className="dmr-level-pill">
                      N3 <span className="dmr-pill-tag">MỚI</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/courses" className="dmr-level-pill">
                      N4
                    </Link>
                  </li>
                  <li>
                    <Link to="/courses" className="dmr-level-pill">
                      N5
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: LUYỆN THI JLPT OFFLINE */}
        <section className="dmr-section">
          <div className="dmr-section-header">
            <div className="dmr-sub-title-row">
              <span className="dmr-sub-title-dark">Luyện thi JLPT offline</span>
              <span className="dmr-sub-title-light">Học trực tiếp tại các cơ sở Hà Nội &amp; TP. HCM</span>
            </div>
          </div>

          <div className="dmr-offline-card">
            <div style={{ maxWidth: '680px' }}>
              <div className="dmr-offline-title">Lớp Học Trực Tiếp Offline 🏫</div>
              <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1A202C', marginBottom: '6px' }}>
                Học trực tiếp cùng các giảng viên giàu kinh nghiệm tại Hà Nội và TP. HCM
              </p>
              <p style={{ color: '#718096', fontSize: '0.95rem', lineHeight: 1.5 }}>
                Lớp học sĩ số nhỏ, kèm cặp trực tiếp từng học viên. Cam kết đầu ra bằng văn bản, hỗ trợ học lại miễn phí nếu chưa đạt mục tiêu.
              </p>
            </div>

            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', color: '#718096', marginBottom: '8px' }}>
                CÁC CẤP ĐỘ KHAI GIẢNG OFFLINE:
              </div>
              <ul className="dmr-level-list">
                <li><Link to="/courses" className="dmr-level-pill">N2</Link></li>
                <li><Link to="/courses" className="dmr-level-pill">N3</Link></li>
                <li><Link to="/courses" className="dmr-level-pill">N4</Link></li>
                <li><Link to="/courses" className="dmr-level-pill">N5</Link></li>
              </ul>
            </div>
          </div>
        </section>

        {/* SECTION: LUYỆN GIAO TIẾP (KAIWA) */}
        <section className="dmr-section">
          <div className="dmr-section-header">
            <div className="dmr-sub-title-row">
              <span className="dmr-sub-title-dark">Luyện Giao tiếp</span>
              <span className="dmr-sub-title-light">Luyện nói tiếng Nhật phản xạ qua lớp Zoom &amp; AI</span>
            </div>
          </div>

          <div className="dmr-cards-row">
            {/* Kaiwa VIP */}
            <div className="dmr-tier-card">
              <div>
                <div className="dmr-tier-name orange">KAIWA VIP 🗣️</div>
                <div className="dmr-tier-tagline">Học Kaiwa trực tiếp với giáo viên Nhật / Việt qua Zoom</div>
                <div className="dmr-tier-desc">
                  Thực hành hội thoại tình huống đời sống &amp; công sở. Giáo viên chỉnh sửa phát âm, ngữ điệu và phản xạ giao tiếp tự nhiên.
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
                  Xem chi tiết lớp Kaiwa VIP →
                </Link>
              </div>
            </div>

            {/* Kaiwa Basic */}
            <div className="dmr-tier-card">
              <div>
                <div className="dmr-tier-name orange">KAIWA BASIC 📱</div>
                <div className="dmr-tier-tagline">Tự luyện Kaiwa với ứng dụng EduCenter AI</div>
                <div className="dmr-tier-desc">
                  Luyện nghe, phát âm và đối thoại tình huống với trí tuệ nhân tạo nhận diện giọng nói chuẩn tiếng Nhật.
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
                  Kaiwa Sơ Cấp
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
                  Kaiwa Trung Cấp
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: TRỌN BỘ SÁCH TIẾNG NHẬT */}
        <section className="dmr-section" id="books">
          <div className="dmr-section-header">
            <div className="dmr-sub-title-row">
              <span className="dmr-sub-title-dark">Sách &amp; Giáo trình độc quyền</span>
              <span className="dmr-sub-title-light">Trọn bộ sách tiếng Nhật cho mọi cấp độ của EduCenter</span>
            </div>
          </div>

          <div className="dmr-book-card">
            <div>
              <div style={{ fontFamily: 'var(--font-beanbag)', fontSize: '2.5rem', fontWeight: 800, color: '#1E9AA5', lineHeight: 1, marginBottom: '14px' }}>
                Bộ Sách Tiếng Nhật 📚
              </div>
              <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#2D3748', marginBottom: '8px' }}>
                Lộ trình học khoa học từ N5 đến N2 được biên soạn công phu
              </p>
              <p style={{ color: '#718096', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '20px' }}>
                Tích hợp đầy đủ từ vựng, ngữ pháp, chữ Hán, nghe – đọc và bài luyện tập giúp học nhanh, nhớ lâu. Kèm mã QR quét xem video giảng bài trực tiếp từ tác giả.
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Link to="/courses" className="dmr-level-pill" style={{ width: 'auto', padding: '0 24px', borderRadius: '50px', borderColor: '#1E9AA5', color: '#1E9AA5' }}>
                  Sơ cấp
                </Link>
                <Link to="/courses" className="dmr-level-pill" style={{ width: 'auto', padding: '0 24px', borderRadius: '50px', borderColor: '#1E9AA5', color: '#1E9AA5' }}>
                  Trung cấp
                </Link>
                <Link to="/courses" className="dmr-level-pill" style={{ width: 'auto', padding: '0 24px', borderRadius: '50px', borderColor: '#1E9AA5', color: '#1E9AA5' }}>
                  Cao cấp
                </Link>
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <img
                src="https://cdn.dungmori.com/assets/img/new_home/06-2024/newbookbanner.png"
                alt="Bộ sách tiếng Nhật"
                style={{ maxHeight: '250px', margin: '0 auto', objectFit: 'contain' }}
              />
            </div>
          </div>
        </section>

        {/* SECTION: CON SỐ ẤN TƯỢNG (STATS) */}
        <section className="dmr-stats-section">
          <div className="dmr-stats-container">
            <div className="dmr-stat-item">
              <div className="dmr-stat-number">99%</div>
              <div className="dmr-stat-label">Học viên hài lòng với chất lượng giảng dạy</div>
            </div>
            <div className="dmr-stat-item">
              <div className="dmr-stat-number">660.185</div>
              <div className="dmr-stat-label">Học viên tin tưởng lựa chọn đồng hành</div>
            </div>
            <div className="dmr-stat-item">
              <div className="dmr-stat-number">462.130</div>
              <div className="dmr-stat-label">Học viên đỗ chứng chỉ JLPT &amp; sang Nhật</div>
            </div>
            <div className="dmr-stat-item">
              <div className="dmr-stat-number">#1</div>
              <div className="dmr-stat-label">Nền tảng học tiếng Nhật online số 1 Việt Nam</div>
            </div>
          </div>
        </section>

        {/* SECTION: ĐỘI NGŨ GIẢNG VIÊN (INTERACTIVE SHOWCASE) */}
        <section className="dmr-section" id="teachers">
          <div className="dmr-section-header" style={{ textAlign: 'center' }}>
            <h2 className="dmr-main-title" style={{ justifyContent: 'center' }}>
              Đội ngũ giảng viên ưu tú
            </h2>
            <p style={{ color: '#718096', fontSize: '1.05rem', marginTop: '6px' }}>
              Những người thầy, người cô tận tâm truyền cảm hứng trên hành trình chinh phục tiếng Nhật của bạn
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
                CHÂM NGÔN: {selectedTeacher.motto}
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

        {/* SECTION: REVIEW HỌC VIÊN */}
        <section className="dmr-section" id="reviews">
          <div className="dmr-section-header" style={{ textAlign: 'center' }}>
            <h2 className="dmr-main-title" style={{ justifyContent: 'center' }}>
              Cảm nhận từ học viên
            </h2>
            <p style={{ color: '#EC6E23', fontFamily: 'var(--font-beanbag)', fontWeight: 800, fontSize: '1.4rem', marginTop: '6px' }}>
              "Học để thay đổi – Học để thành công"
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
                      <div className="dmr-review-job">{r.job}</div>
                    </div>
                  </div>
                  <div className="dmr-review-comment">"{r.comment}"</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION: DOANH NGHIỆP ĐỐI TÁC */}
        <section className="dmr-section">
          <div className="dmr-section-header" style={{ textAlign: 'center' }}>
            <h3 style={{ fontFamily: 'var(--font-beanbag)', fontSize: '1.6rem', fontWeight: 800, color: '#07403F' }}>
              Doanh nghiệp hợp tác cùng EduCenter
            </h3>
          </div>

          <div className="dmr-partners-bar">
            {partners.map((p, i) => (
              <img key={i} src={p.src} alt={p.name} className="dmr-partner-logo" />
            ))}
          </div>
        </section>

        {/* SECTION: TIN TỨC & KINH NGHIỆM */}
        <section className="dmr-section" id="news">
          <div className="dmr-section-header">
            <h2 className="dmr-main-title">Tin tức &amp; Bí quyết học tập</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
              <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#07403F', borderBottom: '2px solid #07403F', paddingBottom: '10px', marginBottom: '14px' }}>
                Kinh nghiệm học tiếng Nhật
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <Link to="/announcements" style={{ color: '#1A202C', textDecoration: 'none', display: 'flex', gap: '12px', alignItems: 'baseline' }}>
                  <span style={{ color: '#57D061', fontWeight: 800, fontSize: '0.85rem' }}>[28.01]</span>
                  <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Lộ trình tự học tiếng Nhật chuẩn nhất cho người mới bắt đầu từ con số 0</span>
                </Link>
                <Link to="/announcements" style={{ color: '#1A202C', textDecoration: 'none', display: 'flex', gap: '12px', alignItems: 'baseline' }}>
                  <span style={{ color: '#57D061', fontWeight: 800, fontSize: '0.85rem' }}>[05.05]</span>
                  <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Tuyệt chiêu ghi nhớ 2.000 chữ Hán Kanji nhanh chóng không bị quên</span>
                </Link>
              </div>
            </div>

            <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
              <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#07403F', borderBottom: '2px solid #07403F', paddingBottom: '10px', marginBottom: '14px' }}>
                Thông tin kỳ thi JLPT
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <Link to="/announcements" style={{ color: '#1A202C', textDecoration: 'none', display: 'flex', gap: '12px', alignItems: 'baseline' }}>
                  <span style={{ color: '#EC6E23', fontWeight: 800, fontSize: '0.85rem' }}>[30.04]</span>
                  <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Cách tính điểm JLPT từ N5 đến N1 theo cấu trúc đề mới nhất của Hiệp hội</span>
                </Link>
                <Link to="/announcements" style={{ color: '#1A202C', textDecoration: 'none', display: 'flex', gap: '12px', alignItems: 'baseline' }}>
                  <span style={{ color: '#EC6E23', fontWeight: 800, fontSize: '0.85rem' }}>[05.06]</span>
                  <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Tìm hiểu thang điểm lệch và thuật toán tính điểm độc lạ của kỳ thi JLPT</span>
                </Link>
              </div>
            </div>
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
                Sẵn sàng đồng hành cùng EduCenter?
              </h2>
              <p style={{ fontSize: '1.1rem', maxWidth: '640px', margin: '0 auto 26px', color: '#E2E8F0' }}>
                Tạo tài khoản ngay hôm nay để nhận quyền truy cập bài học thử miễn phí và nhận tư vấn lộ trình học phù hợp nhất.
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
                  Tạo tài khoản miễn phí
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
                  Khám phá khóa học
                </Link>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Floating Action Buttons */}
      <div className="dmr-floating-actions">
        <Link to="/courses" className="dmr-fab-btn dmr-fab-test" title="Làm bài thi thử">
          📝
        </Link>
        <a
          href="https://m.me/dungmori"
          target="_blank"
          rel="noreferrer"
          className="dmr-fab-btn dmr-fab-chat"
          title="Tư vấn trực tiếp 24/7"
        >
          💬
        </a>
      </div>
    </div>
  );
};

export default HomePage;
