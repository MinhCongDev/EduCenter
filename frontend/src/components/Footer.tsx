import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="dmr-footer" role="contentinfo">
      <div className="dmr-footer-container">
        {/* Top 4 Columns */}
        <div className="dmr-footer-top">
          {/* Column 1: Về EduCenter IELTS */}
          <div>
            <div className="dmr-footer-heading">Học Viện IELTS</div>
            <ul className="dmr-footer-links">
              <li><Link to="/#about">Về EduCenter IELTS</Link></li>
              <li><Link to="/#teachers">Đội ngũ giảng viên 8.5+ - 9.0</Link></li>
              <li><Link to="/#reviews">Bảng vàng học viên đạt 7.5+ - 8.5</Link></li>
              <li><Link to="/courses">Cam kết đầu ra bằng hợp đồng</Link></li>
              <li><Link to="/courses">Chính sách học lại miễn phí 100%</Link></li>
              <li><Link to="/announcements">Tuyển dụng Giảng viên IELTS</Link></li>
            </ul>
          </div>

          {/* Column 2: Cộng đồng luyện thi */}
          <div>
            <div className="dmr-footer-heading">Cộng đồng IELTS</div>
            <ul className="dmr-footer-links">
              <li><a href="https://www.facebook.com" target="_blank" rel="noreferrer">Cộng đồng Tự học IELTS 8.0+</a></li>
              <li><a href="https://www.facebook.com" target="_blank" rel="noreferrer">CLB Luyện Speaking Cùng Cựu Giám Khảo</a></li>
              <li><a href="https://www.facebook.com" target="_blank" rel="noreferrer">Góc Chữa Writing Task 1 &amp; 2 Miễn Phí</a></li>
              <li><a href="https://www.youtube.com" target="_blank" rel="noreferrer">Kênh Bài Giảng IELTS Chuyên Sâu</a></li>
              <li><a href="https://www.facebook.com" target="_blank" rel="noreferrer">Săn Học Bổng Du Học UK, US, Australia</a></li>
            </ul>
          </div>

          {/* Column 3: Thi thử & Tài liệu */}
          <div>
            <div className="dmr-footer-heading">Thi thử &amp; Tài liệu</div>
            <ul className="dmr-footer-links">
              <li><Link to="/courses">Thi thử IELTS on Computer Chuẩn IDP</Link></li>
              <li><Link to="/courses">Bộ đề Cambridge IELTS 10 - 19 Có Lời Giải</Link></li>
              <li><Link to="/courses">Forecast Đề Thi Speaking Quý Mới Nhất</Link></li>
              <li><Link to="/courses">100 Bài Mẫu Writing Task 2 Band 8.0+</Link></li>
              <li><Link to="/courses">Tổng hợp 1.200 Từ Vựng Academic Cốt Lõi</Link></li>
            </ul>
          </div>

          {/* Column 4: Đối tác & Kết nối */}
          <div>
            <div className="dmr-footer-heading">Đối tác &amp; Ứng dụng</div>
            <p style={{ fontSize: '0.88rem', color: '#CBD5E0', lineHeight: 1.5, marginBottom: '12px' }}>
              Đối tác đăng ký thi chính thức của <b>IDP Education</b> &amp; <b>British Council</b> tại Việt Nam.
            </p>
            <div className="dmr-social-icons">
              <a href="https://www.facebook.com" target="_blank" rel="noreferrer" className="dmr-social-btn" title="Facebook">
                f
              </a>
              <a href="https://www.youtube.com" target="_blank" rel="noreferrer" className="dmr-social-btn" title="YouTube">
                ▶
              </a>
              <a href="https://www.tiktok.com" target="_blank" rel="noreferrer" className="dmr-social-btn" title="TikTok">
                ♪
              </a>
              <a href="https://zalo.me" target="_blank" rel="noreferrer" className="dmr-social-btn" title="Zalo">
                Z
              </a>
            </div>

            <div className="dmr-app-btns">
              <a href="https://apps.apple.com" target="_blank" rel="noreferrer" className="dmr-app-badge">
                <span>🍎</span> App Store
              </a>
              <a href="https://play.google.com" target="_blank" rel="noreferrer" className="dmr-app-badge">
                <span>🤖</span> Google Play
              </a>
            </div>
          </div>
        </div>

        {/* Middle: 4 Cơ sở IELTS Campus */}
        <div className="dmr-footer-locations">
          <div className="dmr-location-item">
            <div className="dmr-location-name">🏢 Campus 1 (Hà Đông):</div>
            <div>Số 49 Galaxy 3, Vạn Phúc, Hà Đông, Hà Nội.</div>
            <a href="tel:+84336283595" className="dmr-location-phone">
              📞 (+84) 336 283 595
            </a>
          </div>

          <div className="dmr-location-item">
            <div className="dmr-location-name">🏫 Campus 2 (Thanh Xuân):</div>
            <div>Tòa nhà VNT TOWER, Số 19 Nguyễn Trãi, Thanh Xuân, Hà Nội.</div>
            <a href="tel:+84969856116" className="dmr-location-phone">
              📞 (+84) 969 856 116
            </a>
          </div>

          <div className="dmr-location-item">
            <div className="dmr-location-name">🏫 Campus 3 (Cầu Giấy):</div>
            <div>Số 457 Hoàng Quốc Việt, Cổ Nhuế, Bắc Từ Liêm, Hà Nội.</div>
            <a href="tel:+84833532039" className="dmr-location-phone">
              📞 (+84) 833 532 039
            </a>
          </div>

          <div className="dmr-location-item">
            <div className="dmr-location-name">🏫 Campus 4 (TP. HCM):</div>
            <div>Số 32 Đường số 2, P10, Q. Gò Vấp, TP. Hồ Chí Minh.</div>
            <a href="tel:+84988938364" className="dmr-location-phone">
              📞 (+84) 988 938 364
            </a>
          </div>
        </div>

        {/* Hours & Hotline bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 0',
            borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
            fontSize: '0.88rem',
            color: '#E2E8F0',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>⏰ <b>Giờ học &amp; Thi thử:</b> Thứ 2 - Thứ 6: 7h30 - 21h30 | Thứ 7 &amp; CN: 8h00 - 18h00</div>
          <div>✉️ <b>Email Học thuật:</b> academic@educenter.edu.vn</div>
          <div>🔥 <b>Hotline Test trình độ &amp; Tư vấn Lộ trình:</b> <span style={{ color: '#FCD34D', fontWeight: 800 }}>+84.981.060.702</span></div>
        </div>

        {/* Bottom Legal / Copyright */}
        <div className="dmr-footer-bottom">
          <div style={{ maxWidth: '820px', lineHeight: 1.6 }}>
            <div><b>Copyright © {currentYear} EduCenter IELTS Academy – Học viện Luyện thi IELTS Chuẩn Khảo thí Quốc tế</b></div>
            <div style={{ fontSize: '0.78rem', marginTop: '4px' }}>
              Quyết định thành lập và cấp phép hoạt động đào tạo khảo thí số 3920 do Sở Giáo dục &amp; Đào tạo cấp. Trung tâm khảo thí liên kết trực tiếp đối tác khảo thí quốc tế.
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: 'rgba(255,255,255,0.08)',
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            <span style={{ fontSize: '20px' }}>🎖️</span>
            <div>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ĐỐI TÁC CHÍNH THỨC</div>
              <div style={{ fontWeight: 800, fontSize: '12px', color: '#FCD34D' }}>IDP &amp; BRITISH COUNCIL</div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
