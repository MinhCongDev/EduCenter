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
            <div className="dmr-footer-heading">Về EduCenter</div>
            <ul className="dmr-footer-links">
              <li><Link to="/#about">Giới thiệu Học viện EduCenter</Link></li>
              <li><Link to="/courses">Lộ trình đào tạo chuẩn quốc tế</Link></li>
              <li><Link to="/placement-test">Hệ thống khảo thí &amp; Thi thử</Link></li>
              <li><Link to="/announcements">Bảng tin &amp; Thông báo mới</Link></li>
              <li><Link to="/courses">Cam kết đầu ra theo hợp đồng</Link></li>
            </ul>
          </div>

          {/* Column 2: Các khóa học IELTS */}
          <div>
            <div className="dmr-footer-heading">Khóa học IELTS</div>
            <ul className="dmr-footer-links">
              <li><Link to="/courses">IELTS Beginner – Mất gốc (0 - 3.5)</Link></li>
              <li><Link to="/courses">IELTS Pre – Làm quen format (3.5 - 4.5)</Link></li>
              <li><Link to="/courses">IELTS Foundation – Nền tảng (4.5 - 5.5)</Link></li>
              <li><Link to="/courses">IELTS Breakthrough – Bứt phá (5.5 - 6.5)</Link></li>
              <li><Link to="/courses">IELTS Advanced &amp; Master (7.5 - 8.0+)</Link></li>
            </ul>
          </div>

          {/* Column 3: Khảo thí & Thi thử */}
          <div>
            <div className="dmr-footer-heading">Thi thử Online</div>
            <ul className="dmr-footer-links">
              <li><Link to="/placement-test">Danh sách bài thi thử IELTS</Link></li>
              <li><Link to="/placement-test/ielts-diagnostic-01">Diagnostic Test: Ngữ pháp &amp; Từ vựng</Link></li>
              <li><Link to="/placement-test/ielts-reading-real-02">Reading Test: Đọc hiểu thực chiến</Link></li>
              <li><Link to="/placement-test/ielts-comprehensive-predictor-03">Comprehensive Band Predictor</Link></li>
              <li><Link to="/courses">Tư vấn lộ trình điểm số cá nhân</Link></li>
            </ul>
          </div>

          {/* Column 4: Cổng học viên & Quản trị */}
          <div>
            <div className="dmr-footer-heading">Cổng học tập &amp; Dịch vụ</div>
            <ul className="dmr-footer-links">
              <li><Link to="/login">Đăng nhập tài khoản hệ thống</Link></li>
              <li><Link to="/register">Đăng ký tài khoản học viên mới</Link></li>
              <li><Link to="/student/payments">Học phí &amp; Thanh toán QR chuyển khoản</Link></li>
              <li><Link to="/student/dashboard">Không gian học tập cá nhân (LMS)</Link></li>
              <li><Link to="/announcements">Lịch thi thử &amp; Khai giảng mới nhất</Link></li>
            </ul>
          </div>
        </div>

        {/* Middle: Hệ thống Cơ sở Đào tạo EduCenter */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
            padding: '30px 0',
            borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          <div className="dmr-location-item">
            <div className="dmr-location-name">🏢 Cơ sở 1 (Trụ sở Cầu Giấy):</div>
            <div>EduCenter Tower, 128 Cầu Giấy, Q. Cầu Giấy, Hà Nội.</div>
            <a href="tel:02437896868" className="dmr-location-phone">
              📞 024 3789 6868
            </a>
          </div>

          <div className="dmr-location-item">
            <div className="dmr-location-name">🏫 Cơ sở 2 (Đống Đa):</div>
            <div>Số 254 Tây Sơn, P. Trung Liệt, Q. Đống Đa, Hà Nội.</div>
            <a href="tel:02437896869" className="dmr-location-phone">
              📞 024 3789 6869
            </a>
          </div>

          <div className="dmr-location-item">
            <div className="dmr-location-name">🏫 Cơ sở 3 (Bách Khoa):</div>
            <div>Số 86 Lê Thanh Nghị, P. Đồng Tâm, Q. Hai Bà Trưng, Hà Nội.</div>
            <a href="tel:02437896870" className="dmr-location-phone">
              📞 024 3789 6870
            </a>
          </div>

          <div className="dmr-location-item">
            <div className="dmr-location-name">🏫 Cơ sở 4 (TP. HCM - Quận 1):</div>
            <div>Tòa nhà Bitexco Nam, 180 Nguyễn Thị Minh Khai, Q. 1, TP. HCM.</div>
            <a href="tel:02839886868" className="dmr-location-phone">
              📞 028 3988 6868
            </a>
          </div>

          <div className="dmr-location-item">
            <div className="dmr-location-name">🏫 Cơ sở 5 (TP. HCM - Quận 10):</div>
            <div>Số 387 Sư Vạn Hạnh, P. 12, Q. 10, TP. HCM.</div>
            <a href="tel:02839886869" className="dmr-location-phone">
              📞 028 3988 6869
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
          <div>⏰ <b>Giờ làm việc &amp; Thi thử:</b> Thứ 2 - Chủ Nhật: 08:00 - 21:30</div>
          <div>✉️ <b>Email liên hệ:</b> contact@educenter.edu.vn</div>
          <div>🔥 <b>Hotline Tuyển sinh &amp; Thi thử:</b> <span style={{ color: '#FCD34D', fontWeight: 800 }}>1900 6868 - 0988 123 456</span></div>
        </div>

        {/* Bottom Legal / Copyright */}
        <div className="dmr-footer-bottom">
          <div style={{ maxWidth: '820px', lineHeight: 1.6 }}>
            <div><b>Copyright © {currentYear} EduCenter IELTS Academy – Hệ sinh thái Quản lý Đào tạo &amp; Khảo thí IELTS Chuyên sâu</b></div>
            <div style={{ fontSize: '0.78rem', marginTop: '4px', color: '#94A3B8' }}>
              Quyết định thành lập và cấp phép hoạt động đào tạo số 3920 do Sở Giáo dục &amp; Đào tạo cấp. Nền tảng học tập trực tuyến tích hợp thi thử, quản lý điểm số và thanh toán học phí tự động.
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
            <span style={{ fontSize: '20px' }}>🎓</span>
            <div>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>HỆ THỐNG ĐÀO TẠO</div>
              <div style={{ fontWeight: 800, fontSize: '12px', color: '#FCD34D' }}>EDUCENTER IELTS LMS</div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
