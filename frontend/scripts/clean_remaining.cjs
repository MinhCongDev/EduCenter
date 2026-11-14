const fs = require('fs');

function cleanFile(filePath, replacements) {
  if (!fs.existsSync(filePath)) {
    console.log('File not found:', filePath);
    return;
  }
  let code = fs.readFileSync(filePath, 'utf8');
  let count = 0;
  for (const [target, repl] of replacements) {
    if (code.includes(target)) {
      code = code.split(target).join(repl);
      count++;
    }
  }
  console.log(`Updated ${filePath}: replaced ${count} patterns.`);
  fs.writeFileSync(filePath, code, 'utf8');
}

// 1. PlacementTestDetailPage.tsx
cleanFile('frontend/src/pages/public/PlacementTestDetailPage.tsx', [
  // Navbar padding & contrast
  ["minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', backgroundColor: '#F8FAFC'", "minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'calc(76px + 2rem) 1rem 2rem', backgroundColor: '#F8FAFC'"],
  ["maxWidth: '600px', margin: '4rem auto', textAlign: 'center', padding: '2rem', backgroundColor: '#ffffff'", "maxWidth: '600px', margin: 'calc(76px + 3rem) auto 4rem', textAlign: 'center', padding: '2rem', backgroundColor: '#ffffff'"],
  ["minHeight: '100vh', padding: '2.5rem 1rem 5rem'", "minHeight: '100vh', padding: 'calc(76px + 2rem) 1rem 5rem'"],
  ["minHeight: '100vh', display: 'flex', flexDirection: 'column'", "minHeight: '100vh', display: 'flex', flexDirection: 'column', paddingTop: '76px'"],
  ["top: 0,\n          zIndex: 100,\n          backgroundColor: '#0f172a'", "top: '76px',\n          zIndex: 100,\n          backgroundColor: '#0f172a'"],
  ["<h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.3rem)', fontWeight: 900, margin: '0 0 0.5rem', lineHeight: 1.2 }}>", "<h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.3rem)', fontWeight: 900, margin: '0 0 0.5rem', lineHeight: 1.2, color: '#ffffff' }}>"],

  // Emojis
  ["<div style={{ width: '68px', height: '68px', borderRadius: '50%', backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem', margin: '0 auto 1.25rem' }}>\n            🔒\n          </div>", "<div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', margin: '0 auto 1.25rem', fontWeight: 800 }}>!</div>"],
  ["<span style={{ fontSize: '3rem' }}>⚠️</span>", ""],
  ["<span>🎉</span>", ""],
  ["📊 Phân Tích Năng Lực Chi Tiết Theo Kỹ Năng", "Phân Tích Năng Lực Chi Tiết Theo Kỹ Năng"],
  ["<span style={{ fontSize: '1.75rem' }}>🎯</span>", ""],
  ["💡 Lý do khóa học này là bước đi hoàn hảo nhất cho bạn:", "Lý do khóa học này là bước đi hoàn hảo nhất cho bạn:"],
  ["<span>⚡ Đăng Ký Khóa Học Này Ngay</span>", "<span>Đăng Ký Khóa Học Này Ngay</span>"],
  ["<span>🔍 Xem Tất Cả Khóa Học", "<span>Xem Tất Cả Khóa Học"],
  ["<span>📞 Tư Vấn Lịch Học</span>", "<span>Tư Vấn Lịch Học</span>"],
  ["📚 Khóa học cùng trình độ Band", "Khóa học cùng trình độ Band"],
  ["📖 Đáp Án &amp; Lời Giải Thích Chi Tiết Từng Câu", "Đáp Án &amp; Lời Giải Thích Chi Tiết Từng Câu"],
  ["'⚠️ Chưa trả lời'", "'Chưa trả lời'"],
  ["<strong style={{ color: '#047857' }}>💡 Giải thích chi tiết: </strong>", "<strong style={{ color: '#047857' }}>Giải thích chi tiết: </strong>"],
  ["🔄 Làm Lại Bài Thi Này", "Làm Lại Bài Thi Này"],
  ["🎯 Chọn Bài Test Khác", "Chọn Bài Test Khác"],
  ["'🚩 Đã cắm cờ' : '🏳️ Đặt cờ xem lại'", "'Đã cắm cờ' : 'Đặt cờ xem lại'"],
  ["<span style={{ position: 'absolute', top: '-4px', right: '-4px', fontSize: '0.65rem' }}>🚩</span>", "<span style={{ position: 'absolute', top: '2px', right: '2px', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ef4444' }} />"],
  ["{unansweredCount > 0 ? '⚠️' : '📝'}", ""],
]);

// 2. Footer.tsx
cleanFile('frontend/src/components/Footer.tsx', [
  ['🏢 Cơ sở 1 (Trụ sở Cầu Giấy):', 'Cơ sở 1 (Trụ sở Cầu Giấy):'],
  ['📞 024 3789 6868', '024 3789 6868'],
  ['🏫 Cơ sở 2 (Đống Đa):', 'Cơ sở 2 (Đống Đa):'],
  ['📞 024 3789 6869', '024 3789 6869'],
  ['🏫 Cơ sở 3 (Bách Khoa):', 'Cơ sở 3 (Bách Khoa):'],
  ['📞 024 3789 6870', '024 3789 6870'],
  ['🏫 Cơ sở 4 (TP. HCM - Quận 1):', 'Cơ sở 4 (TP. HCM - Quận 1):'],
  ['📞 028 3988 6868', '028 3988 6868'],
  ['🏫 Cơ sở 5 (TP. HCM - Quận 10):', 'Cơ sở 5 (TP. HCM - Quận 10):'],
  ['📞 028 3988 6869', '028 3988 6869'],
  ['⏰ <b>Giờ làm việc', '<b>Giờ làm việc'],
  ['✉️ <b>Email liên hệ', '<b>Email liên hệ'],
  ['🔥 <b>Hotline Tuyển sinh', '<b>Hotline Tuyển sinh'],
  ["<span style={{ fontSize: '20px' }}>🎓</span>", ""],
]);

// 3. DirectorDashboard.tsx
cleanFile('frontend/src/pages/director/DirectorDashboard.tsx', [
  ['👔 Ban Giám Đốc • Điều Hành Trung Tâm EduCenter', 'Quản Trị Viên (Admin) • Điều Hành Trung Tâm EduCenter'],
  ['Kính chào, {user?.fullName || \'Nguyễn Minh Công (Giám đốc Điều hành)\'}!', 'Kính chào, {user?.fullName || \'Nguyễn Minh Công (Quản Trị Viên / Admin)\'}!'],
  ['<span>📑</span> Đề Xuất &amp; Phê Duyệt Của Ban Giám Đốc', 'Đề Xuất &amp; Phê Duyệt Của Ban Quản Trị / Admin'],
  ['Đề Xuất &amp; Phê Duyệt Của Ban Giám Đốc', 'Đề Xuất &amp; Phê Duyệt Của Ban Quản Trị / Admin'],
  ['📅 {new Date(item.publicationDate || item.createdAt).toLocaleDateString(\'vi-VN\')}', '{new Date(item.publicationDate || item.createdAt).toLocaleDateString(\'vi-VN\')}'],
  ['👁️ {item.views || 0}', '{item.views || 0}'],
  ['👥 Sĩ số:', 'Sĩ số:'],
  ['📖 Lớp:', 'Lớp:'],
  ['⚡ {t.grade}', '{t.grade}'],
  ['👥 Tổng học viên khảo sát:', 'Tổng học viên khảo sát:'],
  ['🏆 {t.courseCount}', '{t.courseCount}'],
  ['📍 {cls.room}', '{cls.room}'],
  ['📅 Tất cả thời gian', 'Tất cả thời gian'],
  ['🏷️ Tất cả phân loại', 'Tất cả phân loại'],
  ['🏷️ Loại: {cat}', 'Loại: {cat}'],
  ['📚 {txnCategoryFilter !== \'ALL\'', '{txnCategoryFilter !== \'ALL\''],
  [': \'📚 Tất cả khóa học\'', ': \'Tất cả khóa học\''],
  ['💳 Mọi phương thức', 'Mọi phương thức'],
  ['📅 {dateFormatted}', '{dateFormatted}'],
  ['{editingAnnouncement ? \'✏️\' : \'📢\'}', ''],
  ['📁 Danh mục:', 'Danh mục:'],
  ['<span style={{ fontSize: \'1.25rem\' }}>📌</span>', ''],
  ['<div style={{ fontSize: \'2.5rem\', marginBottom: \'1rem\' }}>📑</div>', ''],
  ['📤 Gửi Đề Xuất Ban Giám Đốc', 'Gửi Đề Xuất Ban Quản Trị / Admin'],
]);

// 4. TeacherDashboard.tsx
cleanFile('frontend/src/pages/teacher/TeacherDashboard.tsx', [
  ['🗑️', 'Xóa'],
  ["? '📊 Nhập Điểm Kiểm Tra Định Kỳ'", "? 'Nhập Điểm Kiểm Tra Định Kỳ'"],
  [": '📝 Đánh Giá & Nhận Xét Chung (Tháng / Khóa)'}", ": 'Đánh Giá & Nhận Xét Chung (Tháng / Khóa)'}"],
  ['📈 Chuyên cần:', 'Chuyên cần:'],
]);

// 5. StaffDashboard.tsx
cleanFile('frontend/src/pages/staff/StaffDashboard.tsx', [
  ['<span className="staff-empty-icon">📡</span>', ''],
]);

// 6. StudentPaymentsPage.tsx
cleanFile('frontend/src/pages/student/StudentPaymentsPage.tsx', [
  ['💳 Tài Chính & Học Phí • EduCenter Portal', 'Tài Chính & Học Phí • EduCenter Portal'],
  ['<span>📱</span>', ''],
  ['<span>🔄</span>', ''],
  ['<div className="dash-metric-icon icon-emerald">💰</div>', '<div className="dash-metric-icon icon-emerald"></div>'],
  ['<div className="dash-metric-icon icon-blue">📋</div>', '<div className="dash-metric-icon icon-blue"></div>'],
  ['<div className="dash-metric-icon icon-emerald">{activeCoursePayment ? \'📱\' : \'🔒\'}</div>', '<div className="dash-metric-icon icon-emerald"></div>'],
  ['<span style={{ fontSize: \'1.5rem\' }}>💳</span>', ''],
  ['<span>📚</span>', ''],
  ['<span>📝</span>', ''],
  ['<span>💳</span>', ''],
  ['<span>🧾</span> Lịch Sử Giao Dịch & Hóa Đơn Điện Tử', 'Lịch Sử Giao Dịch & Hóa Đơn Điện Tử'],
  ['placeholder="🔍 Tìm mã GD hoặc ghi chú..."', 'placeholder="Tìm mã GD hoặc ghi chú..."'],
  ['<div style={{ fontSize: \'3rem\', marginBottom: \'0.75rem\' }}>📭</div>', ''],
  ['{p.method === \'VNPAY\' && \'🔴 VNPAY QR\'}', '{p.method === \'VNPAY\' && \'VNPAY QR\'}'],
  ['{p.method === \'BANK_TRANSFER\' && \'🏦 Chuyển khoản MB\'}', '{p.method === \'BANK_TRANSFER\' && \'Chuyển khoản MB\'}'],
  ['{p.method === \'CREDIT_CARD\' && \'💳 Thẻ Quốc tế\'}', '{p.method === \'CREDIT_CARD\' && \'Thẻ Quốc tế\'}'],
  ['{p.method === \'CASH\' && \'💵 Tiền mặt tại quầy\'}', '{p.method === \'CASH\' && \'Tiền mặt tại quầy\'}'],
  ['<span>📄</span>', ''],
  ['<div style={{ fontSize: \'1.3rem\', marginBottom: \'0.2rem\' }}>⚡</div>', ''],
  ['<div style={{ fontSize: \'1.3rem\', marginBottom: \'0.2rem\' }}>💳</div>', ''],
  ['<span>⚡</span>', ''],
  ['<span>🔍</span>', ''],
  ['<span>🔒</span>', ''],
  ['<span>🖨️</span>', ''],
]);

console.log('Finished clean_remaining.');

