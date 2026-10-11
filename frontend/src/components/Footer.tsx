import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="dmr-footer" role="contentinfo">
      <div className="dmr-footer-container">
        {/* Top 4 Columns */}
        <div className="dmr-footer-top">
          {/* Column 1: Về EduCenter */}
          <div>
            <div className="dmr-footer-heading">Về EduCenter</div>
            <ul className="dmr-footer-links">
              <li><Link to="/#about">Về chúng tôi</Link></li>
              <li><Link to="/#teachers">Đội ngũ giảng viên</Link></li>
              <li><Link to="/#reviews">Review học viên</Link></li>
              <li><Link to="/courses">Chính sách gia hạn khóa học</Link></li>
              <li><Link to="/courses">Chính sách đổi trả & hoàn học phí</Link></li>
              <li><Link to="/announcements">Tin tức & Tuyển dụng</Link></li>
            </ul>
          </div>

          {/* Column 2: Fanpage & Cộng đồng */}
          <div>
            <div className="dmr-footer-heading">Cộng đồng</div>
            <ul className="dmr-footer-links">
              <li><a href="https://www.facebook.com/dungmori" target="_blank" rel="noreferrer">EduCenter Official</a></li>
              <li><a href="https://www.facebook.com/dungmori" target="_blank" rel="noreferrer">Cộng đồng Luyện thi JLPT N5 - N1</a></li>
              <li><a href="https://www.facebook.com/dungmori" target="_blank" rel="noreferrer">CLB Kaiwa Tiếng Nhật Giao Tiếp</a></li>
              <li><a href="https://www.youtube.com/user/moridung" target="_blank" rel="noreferrer">Học tiếng Nhật cùng Thầy Dũng</a></li>
              <li><a href="https://www.facebook.com/dungmori" target="_blank" rel="noreferrer">Góc học tập Cô Thanh</a></li>
            </ul>
          </div>

          {/* Column 3: JFT & Tokutei */}
          <div>
            <div className="dmr-footer-heading">JFT &amp; TOKUTEI</div>
            <ul className="dmr-footer-links">
              <li><Link to="/courses">Thi thử JFT-Basic A2 Miễn phí</Link></li>
              <li><Link to="/courses">Đề thi Tokutei Ginou có lời giải</Link></li>
              <li><Link to="/courses">Từ vựng chuyên ngành Kaigo</Link></li>
              <li><Link to="/courses">Tiếng Nhật ngành Nhà hàng & Khách sạn</Link></li>
              <li><Link to="/courses">Luyện phỏng vấn Tokutei</Link></li>
            </ul>
          </div>

          {/* Column 4: Social & App di động */}
          <div>
            <div className="dmr-footer-heading">Kết nối &amp; Ứng dụng</div>
            <p style={{ fontSize: '0.88rem', color: '#CBD5E0', lineHeight: 1.5, marginBottom: '12px' }}>
              Theo dõi EduCenter trên các nền tảng xã hội và tải app học tiếng Nhật ngay hôm nay!
            </p>
            <div className="dmr-social-icons">
              <a href="https://www.facebook.com/dungmori" target="_blank" rel="noreferrer" className="dmr-social-btn" title="Facebook">
                f
              </a>
              <a href="https://www.youtube.com/user/moridung" target="_blank" rel="noreferrer" className="dmr-social-btn" title="YouTube">
                ▶
              </a>
              <a href="https://www.tiktok.com/@dungmoriofficial" target="_blank" rel="noreferrer" className="dmr-social-btn" title="TikTok">
                ♪
              </a>
              <a href="https://zalo.me/3424692655094534236" target="_blank" rel="noreferrer" className="dmr-social-btn" title="Zalo">
                Z
              </a>
              <a href="https://lin.ee/iNTtlvH" target="_blank" rel="noreferrer" className="dmr-social-btn" title="LINE">
                L
              </a>
            </div>

            <div className="dmr-app-btns">
              <a href="https://apps.apple.com/us/app/id1486123836" target="_blank" rel="noreferrer" className="dmr-app-badge">
                <span>🍎</span> App Store
              </a>
              <a href="https://play.google.com/store/apps/details?id=com.dungmori.dungmoriapp" target="_blank" rel="noreferrer" className="dmr-app-badge">
                <span>🤖</span> Google Play
              </a>
            </div>
          </div>
        </div>

        {/* Middle: 4 Cơ sở chi nhánh */}
        <div className="dmr-footer-locations">
          <div className="dmr-location-item">
            <div className="dmr-location-name">🏢 Trụ sở chính:</div>
            <div>Số 49 Galaxy 3, Vạn Phúc, Hà Đông, Hà Nội.</div>
            <a href="tel:+84336283595" className="dmr-location-phone">
              📞 (+84) 336 283 595
            </a>
          </div>

          <div className="dmr-location-item">
            <div className="dmr-location-name">🏫 Cơ sở 2 (Thanh Xuân):</div>
            <div>Nhà liền kề 03 VNT TOWER, Số 19 Nguyễn Trãi, Thanh Xuân, Hà Nội.</div>
            <a href="tel:+84969856116" className="dmr-location-phone">
              📞 (+84) 969 856 116
            </a>
          </div>

          <div className="dmr-location-item">
            <div className="dmr-location-name">🏫 Cơ sở 3 (Cầu Giấy):</div>
            <div>Số 457 Hoàng Quốc Việt, Cổ Nhuế, Bắc Từ Liêm, Hà Nội.</div>
            <a href="tel:+84833532039" className="dmr-location-phone">
              📞 (+84) 833 532 039
            </a>
          </div>

          <div className="dmr-location-item">
            <div className="dmr-location-name">🏫 Cơ sở 4 (TP. HCM):</div>
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
          <div>⏰ <b>Giờ làm việc:</b> Thứ 2 - Thứ 6: 7h00 - 21h00 | Thứ 7: 8h00 - 15h00</div>
          <div>✉️ <b>Email CSKH:</b> cskh@educenter.edu.vn</div>
          <div>🔥 <b>Hotline tư vấn Online 24/7:</b> <span style={{ color: '#A0EC1D', fontWeight: 800 }}>+84.981.060.702</span></div>
        </div>

        {/* Bottom Legal / Copyright */}
        <div className="dmr-footer-bottom">
          <div style={{ maxWidth: '820px', lineHeight: 1.6 }}>
            <div><b>Copyright © {currentYear} EduCenter – Hệ sinh thái học tiếng Nhật & Quản lý đào tạo</b></div>
            <div style={{ fontSize: '0.78rem', marginTop: '4px' }}>
              Mã số thuế: 0106799375 | Quyết định thành lập Trung tâm đào tạo tiếng Nhật số 3920 do Sở Giáo dục &amp; Đào tạo Hà Nội cấp ngày 09/09/2019.
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
            <span style={{ fontSize: '20px' }}>🛡️</span>
            <div>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ĐÃ ĐĂNG KÝ</div>
              <div style={{ fontWeight: 800, fontSize: '12px', color: '#A0EC1D' }}>BỘ CÔNG THƯƠNG</div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
