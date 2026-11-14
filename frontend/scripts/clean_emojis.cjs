const fs = require('fs');
const path = require('path');

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

// 1. DirectorDashboard.tsx
cleanFile('frontend/src/pages/director/DirectorDashboard.tsx', [
  ['🏢 Giám Sát Phòng Học &amp; Cơ Sở', 'Giám Sát Phòng Học &amp; Cơ Sở'],
  ['🎓 Giám Sát Học Viên', 'Giám Sát Học Viên'],
  ['👨‍🏫 Giám Sát Giảng Viên', 'Giám Sát Giảng Viên'],
  ['🏫 Báo Cáo Lớp Học', 'Báo Cáo Lớp Học'],
  ['📚 Báo Cáo Khóa Học', 'Báo Cáo Khóa Học'],
  ['🛡️ Tài khoản &amp; Phân quyền', 'Tài khoản &amp; Phân quyền'],
  ['📡 Giám sát vận hành', 'Giám sát vận hành'],
  ['📈 Báo cáo học viên', 'Báo cáo học viên'],
  ['👨‍🏫 Báo cáo giảng viên', 'Báo cáo giảng viên'],
  ['🏫 Báo cáo lớp &amp; khóa', 'Báo cáo lớp &amp; khóa'],
  ['📢 Quản lý thông báo', 'Quản lý thông báo'],
  ['💰 Báo cáo tài chính', 'Báo cáo tài chính'],
  ['➕ Thêm nhân sự mới', 'Thêm nhân sự mới'],
  ['➕ Tạo đề xuất', 'Tạo đề xuất'],
  ['👔 Quản Trị Viên (Admin) • Điều Hành Trung Tâm EduCenter', 'Quản Trị Viên (Admin) • Điều Hành Trung Tâm EduCenter'],
  ['📅 {currentDate}', '{currentDate}'],
  ['<span>📊</span> Doanh Thu &amp; Tỷ Trọng Theo Khóa Học', 'Doanh Thu &amp; Tỷ Trọng Theo Khóa Học'],
  ['<span>📑</span> Đề Xuất &amp; Phê Duyệt Của Ban Quản Trị / Admin', 'Đề Xuất &amp; Phê Duyệt Của Ban Quản Trị / Admin'],
  ['<span>⚡</span> Thao Tác Quản Trị Cấp Cao', 'Thao Tác Quản Trị Cấp Cao'],
  ['<span>🌟</span> Giảng Viên Tiêu Biểu', 'Giảng Viên Tiêu Biểu'],
  ['📢 Quản Lý Thông Báo Trung Tâm', 'Quản Lý Thông Báo Trung Tâm'],
  ['🛡️ Quản Lý Tài Khoản &amp; Phân Quyền Hệ Thống', 'Quản Lý Tài Khoản &amp; Phân Quyền Hệ Thống'],
  ['➕ Cấp Tài Khoản Nhân Sự / GV', 'Cấp Tài Khoản Nhân Sự / GV'],
  ['📡 Trung Tâm Giám Sát Hoạt Động', 'Trung Tâm Giám Sát Hoạt Động'],
  ['🏢 Trạng Thái Phòng Máy &amp; Giảng Đường Hôm Nay', 'Trạng Thái Phòng Máy &amp; Giảng Đường Hôm Nay'],
  ['📝 Bài Làm &amp; Hoạt Động Mới Nhất Của Học Viên', 'Bài Làm &amp; Hoạt Động Mới Nhất Của Học Viên'],
  ['📈 Báo Cáo Thống Kê Học Viên', 'Báo Cáo Thống Kê Học Viên'],
  ['🎯 Phân Bố Mục Tiêu Đầu Ra Học Viên', 'Phân Bố Mục Tiêu Đầu Ra Học Viên'],
  ['👨‍🏫 Báo Cáo Hiệu Suất Giảng Viên', 'Báo Cáo Hiệu Suất Giảng Viên'],
  ['🏫 Báo Cáo Lớp Học &amp; Khóa Học', 'Báo Cáo Lớp Học &amp; Khóa Học'],
  ['💰 Báo Cáo Tài Chính &amp; Doanh Thu', 'Báo Cáo Tài Chính &amp; Doanh Thu'],
  ['📈 Tăng Trưởng Doanh Thu', 'Tăng Trưởng Doanh Thu'],
  ['🧾 Lịch Sử Các Giao Dịch Học Phí Gần Nhất', 'Lịch Sử Các Giao Dịch Học Phí Gần Nhất'],
  ['Nhắc việc Quản Trị Viên (Admin)', 'Nhắc việc Quản Trị Viên (Admin)'],
  ["<span style={{ fontSize: '1.2rem' }}>📢</span>", ''],
  ["{ id: 'WEEK', label: '📅 Theo Tuần' }", "{ id: 'WEEK', label: 'Theo Tuần' }"],
  ["{ id: 'MONTH', label: '📆 Theo Tháng' }", "{ id: 'MONTH', label: 'Theo Tháng' }"],
  ["{ id: 'YEAR', label: '📈 Theo Năm' }", "{ id: 'YEAR', label: 'Theo Năm' }"],
  ['✏️ Sửa', 'Sửa'],
  ['🗑️ Xóa', 'Xóa'],
  ['📌 Ghim', 'Ghim'],
  ["'Bỏ ghim' : '📌 Ghim'", "'Bỏ ghim' : 'Ghim'"],
  ['💾 Cấp Tài Khoản', 'Cấp Tài Khoản'],
  ['💾 Cập Nhật Thông Báo', 'Cập Nhật Thông Báo'],
  ['🚀 Xuất Bản Thông Báo', 'Xuất Bản Thông Báo'],
  ['📤 Gửi Đề Xuất Ban Quản Trị / Admin', 'Gửi Đề Xuất Ban Quản Trị / Admin'],
  ['👁️ Chi tiết', 'Chi tiết'],
  ['<div className="dash-metric-icon icon-emerald">💰</div>', '<div className="dash-metric-icon icon-emerald"></div>'],
  ['<div className="dash-metric-icon icon-blue">🎓</div>', '<div className="dash-metric-icon icon-blue"></div>'],
  ['<div className="dash-metric-icon icon-purple">🏫</div>', '<div className="dash-metric-icon icon-purple"></div>'],
  ['<div className="dash-metric-icon icon-amber">🏆</div>', '<div className="dash-metric-icon icon-amber"></div>'],
  ['<div className="dash-item-icon">👨‍🏫</div>', ''],
  ['placeholder="🔍 ', 'placeholder="'],
  ['<span>🔍</span>', ''],
  ['<span>✨</span>', ''],
  ['<span>🛡️</span>', ''],
  ['<span>📢</span>', ''],
  ['<span>📥</span>', ''],
  ['<span>📡</span>', ''],
  ['<span>🌐</span>', ''],
  ['<span>➕</span>', ''],
  ['<span>🏷️</span>', ''],
  ['<span>📝</span>', ''],
  ['<span>👤</span>', ''],
  ['<span>✉️</span>', ''],
  ['<span>📱</span>', ''],
  ['<span>💼</span>', ''],
  ['<span>🔑</span>', ''],
  ['<span>🖼️</span>', ''],
  ['<span>📄</span>', ''],
  ['<span>📁</span>', ''],
  ['🌐 Tất cả', 'Tất cả'],
  ['🎓 Học viên', 'Học viên'],
  ['👨‍🏫 Giảng viên', 'Giảng viên'],
  ['👥 Nhân sự', 'Nhân sự'],
  ['👥 Danh mục:', 'Danh mục:'],
  ['👥 Đối tượng nhận tin:', 'Đối tượng nhận tin:'],
  ['👁️ Trạng thái hiển thị:', 'Trạng thái hiển thị:'],
  ['✅ Xuất bản ngay', 'Xuất bản ngay'],
  ['📋 Lưu bản nháp', 'Lưu bản nháp'],
  ['🏢 Mở lớp học mới', 'Mở lớp học mới'],
  ['🎓 Học bổng &amp; Ưu đãi học phí', 'Học bổng &amp; Ưu đãi học phí'],
  ['📊 Khảo thí &amp; Điểm thi', 'Khảo thí &amp; Điểm thi'],
  ['🏛️ Cơ sở vật chất &amp; Thiết bị', 'Cơ sở vật chất &amp; Thiết bị'],
  ['📚 Giáo trình &amp; Học liệu', 'Giáo trình &amp; Học liệu'],
  ['📌 Đề xuất vận hành khác', 'Đề xuất vận hành khác'],
  ['💼 Chuyên viên Giáo vụ', 'Chuyên viên Giáo vụ'],
  ['👨‍🏫 Giảng viên IELTS', 'Giảng viên IELTS'],
]);

// 2. TeacherDashboard.tsx
cleanFile('frontend/src/pages/teacher/TeacherDashboard.tsx', [
  ['🗓️ Lịch dạy tuần này', 'Lịch dạy tuần này'],
  ['✅ Điểm danh buổi học', 'Điểm danh buổi học'],
  ['📊 Nhập điểm định kỳ', 'Nhập điểm định kỳ'],
  ['📝 Nhận xét tháng / khóa', 'Nhận xét tháng / khóa'],
  ['🏫 Lớp học &amp; Học viên', 'Lớp học &amp; Học viên'],
  ['🔄 Xin đổi lịch dạy', 'Xin đổi lịch dạy'],
  ["{ id: 'classes_students', label: '🏫 Lớp học & Học viên' }", "{ id: 'classes_students', label: 'Lớp học & Học viên' }"],
  ["{ id: 'schedule', label: '🗓️ Lịch dạy' }", "{ id: 'schedule', label: 'Lịch dạy' }"],
  ["{ id: 'attendance', label: '✅ Điểm danh buổi học' }", "{ id: 'attendance', label: 'Điểm danh buổi học' }"],
  ["{ id: 'grades', label: '📊 Điểm định kỳ & Nhận xét' }", "{ id: 'grades', label: 'Điểm định kỳ & Nhận xét' }"],
  ['🗓️ Thời Khóa Biểu &amp; Lịch Giảng Dạy', 'Thời Khóa Biểu &amp; Lịch Giảng Dạy'],
  ['✅ Điểm danh buổi này', 'Điểm danh buổi này'],
  ['✅ Điểm danh', 'Điểm danh'],
  ['✅ Điểm Danh Từng Buổi Học', 'Điểm Danh Từng Buổi Học'],
  ["{attendanceViewMode === 'check' ? '📜 Xem Lịch Sử Điểm Danh' : '✏️ Điểm Danh Buổi Học'}", "{attendanceViewMode === 'check' ? 'Xem Lịch Sử Điểm Danh' : 'Điểm Danh Buổi Học'}"],
  ['💾 Lưu Điểm Danh', 'Lưu Điểm Danh'],
  ['🏫 Lớp Học Phụ Trách', 'Lớp Học Phụ Trách'],
  ['👥 Danh Sách Học Viên', 'Danh Sách Học Viên'],
  ['📊 Điểm Kiểm Tra Định Kỳ &amp; Nhận Xét Học Viên', 'Điểm Kiểm Tra Định Kỳ &amp; Nhận Xét Học Viên'],
  ['➕ Nhập Điểm Kiểm Tra Định Kỳ', 'Nhập Điểm Kiểm Tra Định Kỳ'],
  ['📝 Đánh Giá / Nhận Xét Tháng &amp; Khóa', 'Đánh Giá / Nhận Xét Tháng &amp; Khóa'],
  ['✏️ Sửa', 'Sửa'],
  ['🔄 Đơn Xin Đổi Lịch Dạy', 'Đơn Xin Đổi Lịch Dạy'],
  ['📝 Gửi Đơn Mới', 'Gửi Đơn Mới'],
  ['📋 Lịch Sử', 'Lịch Sử'],
  ['👁️ Chi tiết', 'Chi tiết'],
  ['📊 Điểm kiểm tra định kỳ', 'Điểm kiểm tra định kỳ'],
  ['📝 Nhận xét tháng / cuối khóa', 'Nhận xét tháng / cuối khóa'],
  ['🧮 Tự tính Overall từ 4 kỹ năng', 'Tự tính Overall từ 4 kỹ năng'],
  ['<span>🗓️</span>', ''],
  ['<span>📊</span>', ''],
  ['<span>🏫</span>', ''],
  ['<span>⚡</span>', ''],
  ['<div className="dash-metric-icon icon-blue">🏫</div>', '<div className="dash-metric-icon icon-blue"></div>'],
  ['<div className="dash-metric-icon icon-purple">🗓️</div>', '<div className="dash-metric-icon icon-purple"></div>'],
  ['<div className="dash-metric-icon icon-emerald">👩‍🎓</div>', '<div className="dash-metric-icon icon-emerald"></div>'],
  ['<div className="dash-metric-icon icon-amber">📊</div>', '<div className="dash-metric-icon icon-amber"></div>'],
  ['<div className="dash-item-icon">🏫</div>', ''],
  ['<div className="dash-item-icon">📝</div>', ''],
  ['<div className="dash-item-icon">🎯</div>', ''],
  ['<div className="dash-item-icon">🔄</div>', ''],
  ['placeholder="🔍 ', 'placeholder="'],
  ['📍 ', ''],
  ['📖 ', ''],
  ['👥 ', ''],
]);

// 3. StudentDashboard.tsx
cleanFile('frontend/src/pages/student/StudentDashboard.tsx', [
  ['🎓 Cổng Học Viên • EduCenter Portal', 'Cổng Học Viên • EduCenter Portal'],
  ['<span>💳</span>', ''],
  ['📚 Khóa học của tôi', 'Khóa học của tôi'],
  ['📝 Nộp bài tập về nhà', 'Nộp bài tập về nhà'],
  ['🗓️ Xem lịch học', 'Xem lịch học'],
  ['📊 Kết quả học tập', 'Kết quả học tập'],
  ['🎯 Tiến độ khóa học', 'Tiến độ khóa học'],
  ['<div className="dash-metric-icon icon-blue">📚</div>', '<div className="dash-metric-icon icon-blue"></div>'],
  ['<div className="dash-metric-icon icon-emerald">✅</div>', '<div className="dash-metric-icon icon-emerald"></div>'],
  ['<div className="dash-metric-icon icon-amber">🏆</div>', '<div className="dash-metric-icon icon-amber"></div>'],
  ['<div className="dash-metric-icon icon-blue">💳</div>', '<div className="dash-metric-icon icon-blue"></div>'],
  ['🎯 <strong>Nội dung buổi học:</strong>', '<strong>Nội dung buổi học:</strong>'],
  ['🗓️ Xem lịch học đầy đủ', 'Xem lịch học đầy đủ'],
  ['📝 Bài tập lớp này', 'Bài tập lớp này'],
  ['<span>📚</span> Tiến Độ Lớp Học Của Tôi', 'Tiến Độ Lớp Học Của Tôi'],
  ['<span>📝</span> Bài Tập Về Nhà', 'Bài Tập Về Nhà'],
  ['<span>📢</span> Thông Báo Từ Trung Tâm', 'Thông Báo Từ Trung Tâm'],
  ['📚 Lớp Học Của Tôi', 'Lớp Học Của Tôi'],
  ['📖 Xem các khóa học', 'Xem các khóa học'],
  ['✅ Đã thanh toán', 'Đã thanh toán'],
  ['⏳ Chưa thanh toán', 'Chưa thanh toán'],
  ['📝 Bài Tập', 'Bài Tập'],
  ['📊 Điểm', 'Điểm'],
  ['🗓️ Lịch Học Tổng Hợp', 'Lịch Học Tổng Hợp'],
  ['📝 Bài Tập Về Nhà &amp; Thực Hành', 'Bài Tập Về Nhà &amp; Thực Hành'],
  ['🚀 Nộp bài ngay', 'Nộp bài ngay'],
  ['👁️ Xem nhận xét', 'Xem nhận xét'],
  ['📊 Bảng Điểm &amp; Kết Quả Học Tập', 'Bảng Điểm &amp; Kết Quả Học Tập'],
  ['<span>⬅</span>', ''],
]);

// 4. Navbar.tsx
cleanFile('frontend/src/components/Navbar.tsx', [
  ['<span>🚪</span>', ''],
  ['<span>📊</span>', ''],
  ['<span>💳</span>', ''],
  ['<span>👤</span>', ''],
  ['<span>🔐</span>', ''],
  ['🏠 Trang chủ', 'Trang chủ'],
  ['📚 Khóa học', 'Khóa học'],
  ['🎯 Thi thử', 'Thi thử'],
  ['ℹ️ Giới thiệu', 'Giới thiệu'],
  ['📢 Thông báo', 'Thông báo'],
  ['📊 Dashboard', 'Dashboard'],
  ['🚪 Đăng xuất', 'Đăng xuất'],
]);

// 5. PlacementTestListPage.tsx
cleanFile('frontend/src/pages/public/PlacementTestListPage.tsx', [
  ['📝 {test.totalQuestions} câu', '{test.totalQuestions} câu'],
  ['💡 Kỹ năng đánh giá chính:', 'Kỹ năng đánh giá chính:'],
  ["<span>{isAuthenticated ? 'Bắt Đầu Làm Bài Ngay' : '🔒 Đăng Nhập Để Làm Bài'}</span>", "<span>{isAuthenticated ? 'Bắt Đầu Làm Bài Ngay' : 'Đăng Nhập Để Làm Bài'}</span>"],
  ['📊 Lịch Sử Các Lần Làm Bài Thi Của Bạn', 'Lịch Sử Các Lần Làm Bài Thi Của Bạn'],
  ['💬 Bạn cần tư vấn trực tiếp 1:1 cùng Chuyên viên Giáo vụ?', 'Bạn cần tư vấn trực tiếp 1:1 cùng Chuyên viên Giáo vụ?'],
  ['<span>📞</span>', ''],
]);

// 6. ProfilePage.tsx
cleanFile('frontend/src/pages/student/ProfilePage.tsx', [
  ["STUDENT: { badge: 'Học viên', icon: '🎓', idLabel: 'Mã học viên'", "STUDENT: { badge: 'Học viên', icon: '', idLabel: 'Mã học viên'"],
  ["TEACHER: { badge: 'Giảng viên IELTS', icon: '👨‍🏫', idLabel: 'Mã giảng viên'", "TEACHER: { badge: 'Giảng viên IELTS', icon: '', idLabel: 'Mã giảng viên'"],
  ["TRAINING_STAFF: { badge: 'Giáo vụ đào tạo', icon: '📋', idLabel: 'Mã nhân sự'", "TRAINING_STAFF: { badge: 'Giáo vụ đào tạo', icon: '', idLabel: 'Mã nhân sự'"],
  ["ADMIN: { badge: 'Quản trị viên (Admin)', icon: '🏛️', idLabel: 'Mã quản trị'", "ADMIN: { badge: 'Quản trị viên (Admin)', icon: '', idLabel: 'Mã quản trị'"],
  ["DIRECTOR: { badge: 'Quản trị viên (Admin)', icon: '🏛️', idLabel: 'Mã quản trị'", "DIRECTOR: { badge: 'Quản trị viên (Admin)', icon: '', idLabel: 'Mã quản trị'"],
  ['<span>🎓</span>', ''],
  ['<span>👨‍🏫</span>', ''],
  ['<span>📋</span>', ''],
  ['<span>👤</span>', ''],
  ['<span>✉</span>', ''],
  ['icon="💾"', ''],
  ['icon="🔐"', ''],
  ['🔒 Bảo mật tài khoản', 'Bảo mật tài khoản'],
]);

// 7. StaffDashboard.tsx
cleanFile('frontend/src/pages/staff/StaffDashboard.tsx', [
  ["icon: '📚',", "icon: '',"],
  ["icon: '✅',", "icon: '',"],
  ["icon: '👩‍🎓',", "icon: '',"],
  ["icon: '👨‍🏫',", "icon: '',"],
  ["icon: '📋',", "icon: '',"],
  ['<div className="dash-metric-icon icon-blue">🏫</div>', '<div className="dash-metric-icon icon-blue"></div>'],
  ['<div className="dash-metric-icon icon-emerald">👩‍🎓</div>', '<div className="dash-metric-icon icon-emerald"></div>'],
  ['<div className="dash-metric-icon icon-purple">💳</div>', '<div className="dash-metric-icon icon-purple"></div>'],
  ['<span>🏫</span>', ''],
  ['<span>🏢</span>', ''],
  ['<span>📌</span>', ''],
  ['<div className="dash-item-icon">🖥️</div>', ''],
  ['<div className="dash-item-icon">🏫</div>', ''],
  ['✉️ ', ''],
  ['🛠️ ', ''],
  ['💰 ', ''],
]);

// 8. PaymentsPage.tsx
cleanFile('frontend/src/pages/student/PaymentsPage.tsx', [
  ["{ key: 'SUCCESS', label: '✅ Đã thanh toán'", "{ key: 'SUCCESS', label: 'Đã thanh toán'"],
  ["{ key: 'FAILED', label: '❌ Thất bại'", "{ key: 'FAILED', label: 'Thất bại'"],
  ["{ key: 'REFUNDED', label: '💸 Đã hoàn tiền'", "{ key: 'REFUNDED', label: 'Đã hoàn tiền'"],
  ['💳 Thanh Toán', 'Thanh Toán'],
  ['<div>💳 ', '<div>'],
  ['📚 Lớp Học', 'Lớp Học'],
  ['🔄 Yêu Cầu', 'Yêu Cầu'],
  ['<div className="dash-metric-icon icon-emerald">✅</div>', '<div className="dash-metric-icon icon-emerald"></div>'],
  ['<div className="dash-metric-icon icon-blue">💰</div>', '<div className="dash-metric-icon icon-blue"></div>'],
  ['placeholder="🔍 ', 'placeholder="'],
]);

// 9. MyClassesPage.tsx
cleanFile('frontend/src/pages/student/MyClassesPage.tsx', [
  ['📚 Lớp Học Của Tôi', 'Lớp Học Của Tôi'],
  ['<div>📚 ', '<div>'],
  ['<div className="dash-metric-icon icon-blue">📚</div>', '<div className="dash-metric-icon icon-blue"></div>'],
  ['<div className="dash-metric-icon icon-emerald">✅</div>', '<div className="dash-metric-icon icon-emerald"></div>'],
  ['<div className="dash-metric-icon icon-purple">🎓</div>', '<div className="dash-metric-icon icon-purple"></div>'],
  ['📖 Xem các khóa học', 'Xem các khóa học'],
  ['placeholder="🔍 ', 'placeholder="'],
  ['<option value="ALL">💳 Tất cả học phí</option>', '<option value="ALL">Tất cả học phí</option>'],
  ['<option value="PAID">✅ Đã thanh toán</option>', '<option value="PAID">Đã thanh toán</option>'],
  ['<option value="ALL">📊 Tất cả trạng thái</option>', '<option value="ALL">Tất cả trạng thái</option>'],
  ['<option value="ENROLLED">🎓 Đang học</option>', '<option value="ENROLLED">Đang học</option>'],
  ['<option value="COMPLETED">🏆 Hoàn thành</option>', '<option value="COMPLETED">Hoàn thành</option>'],
  ['<span>📘</span>', ''],
  ['📝 Bài Tập', 'Bài Tập'],
  ['📅 Điểm Danh', 'Điểm Danh'],
  ['📊 Bảng Điểm', 'Bảng Điểm'],
  ['🗓️ Lịch Học', 'Lịch Học'],
]);

// 10. AttendancePage.tsx
cleanFile('frontend/src/pages/student/AttendancePage.tsx', [
  ['📅 Điểm Danh', 'Điểm Danh'],
  ['<div>📅 ', '<div>'],
  ['📝 Bài Tập', 'Bài Tập'],
  ['📊 Bảng Điểm', 'Bảng Điểm'],
  ['<div className="dash-metric-icon icon-blue">📅</div>', '<div className="dash-metric-icon icon-blue"></div>'],
  ['<div className="dash-metric-icon icon-emerald">✅</div>', '<div className="dash-metric-icon icon-emerald"></div>'],
  ['<div className="dash-metric-icon icon-purple">❌</div>', '<div className="dash-metric-icon icon-purple"></div>'],
  ['<span>📋</span> Lịch Sử Điểm Danh', 'Lịch Sử Điểm Danh'],
]);

// 11. GradesPage.tsx
cleanFile('frontend/src/pages/student/GradesPage.tsx', [
  ['📊 Bảng Điểm', 'Bảng Điểm'],
  ['<div>📊 ', '<div>'],
  ['📝 Bài Tập', 'Bài Tập'],
  ['📅 Điểm Danh', 'Điểm Danh'],
  ['🎯 Band hiện tại', 'Band hiện tại'],
  ['<div className="dash-metric-icon icon-emerald">🏆</div>', '<div className="dash-metric-icon icon-emerald"></div>'],
  ['<div className="dash-metric-icon icon-blue">📝</div>', '<div className="dash-metric-icon icon-blue"></div>'],
  ['✅ Đã công bố', 'Đã công bố'],
  ['📝 Nháp', 'Bản nháp'],
  ['📝 Nhận xét', 'Nhận xét'],
]);

// 12. AssignmentsPage.tsx
cleanFile('frontend/src/pages/student/AssignmentsPage.tsx', [
  ['📝 Bài Tập', 'Bài Tập'],
  ['<div>📝 ', '<div>'],
  ['📅 Điểm Danh', 'Điểm Danh'],
  ['📊 Bảng Điểm', 'Bảng Điểm'],
  ['placeholder="🔍 ', 'placeholder="'],
  ['📤 Nộp bài ngay', 'Nộp bài ngay'],
  ['🔄 Nộp lại', 'Nộp lại'],
  ['💬 Nhận xét', 'Nhận xét'],
  ['<div className="dash-metric-icon icon-blue">📝</div>', '<div className="dash-metric-icon icon-blue"></div>'],
  ['<div className="dash-metric-icon icon-emerald">🏆</div>', '<div className="dash-metric-icon icon-emerald"></div>'],
  ['🎧 Listening', 'Listening'],
  ['📖 Reading', 'Reading'],
  ['✍️ Writing', 'Writing'],
  ['🎤 Speaking', 'Speaking'],
  ['📚 Overall', 'Overall'],
  ['📝 Vocabulary', 'Vocabulary'],
  ['🔤 Grammar', 'Grammar'],
  ['📌 Khác', 'Khác'],
]);

// 13. RequestsPage.tsx
cleanFile('frontend/src/pages/student/RequestsPage.tsx', [
  ['🔄 Yêu Cầu', 'Yêu Cầu'],
  ['<div>🔄 ', '<div>'],
  ['📚 Lớp Học', 'Lớp Học'],
  ['💳 Thanh Toán', 'Thanh Toán'],
  ['<div className="dash-metric-icon icon-blue">📋</div>', '<div className="dash-metric-icon icon-blue"></div>'],
  ['<div className="dash-metric-icon icon-emerald">✅</div>', '<div className="dash-metric-icon icon-emerald"></div>'],
  ['{showForm ? \'✕ Đóng\' : \'➕ Tạo Yêu Cầu Mới\'}', '{showForm ? \'Đóng\' : \'Tạo Yêu Cầu Mới\'}'],
  ['<span>➕</span> Tạo Yêu Cầu Mới', 'Tạo Yêu Cầu Mới'],
  ['<option value="CLASS_CHANGE">🔄 Đổi lớp</option>', '<option value="CLASS_CHANGE">Đổi lớp</option>'],
  ['<option value="SCHEDULE_CHANGE">🗓️ Đổi lịch học</option>', '<option value="SCHEDULE_CHANGE">Đổi lịch học</option>'],
  ['➕ Tạo Yêu Cầu Đầu Tiên', 'Tạo Yêu Cầu Đầu Tiên'],
  ['📝 Lý do', 'Lý do'],
  ['💬 Phản hồi', 'Phản hồi'],
]);

// 14. SchedulePage.tsx
cleanFile('frontend/src/pages/student/SchedulePage.tsx', [
  ['🗓️ Lịch Học', 'Lịch Học'],
  ['<div>🗓️ ', '<div>'],
  ['📝 Bài Tập', 'Bài Tập'],
  ['📅 Điểm Danh', 'Điểm Danh'],
  ['📊 Bảng Điểm', 'Bảng Điểm'],
  ['<div className="dash-metric-icon icon-blue">📅</div>', '<div className="dash-metric-icon icon-blue"></div>'],
  ['<div className="dash-metric-icon icon-emerald">🏖️</div>', '<div className="dash-metric-icon icon-emerald"></div>'],
  ['<div className="dash-metric-icon icon-purple">🏫</div>', '<div className="dash-metric-icon icon-purple"></div>'],
  ['<span>📅</span> ', ''],
  ['🕐 ', ''],
  ['🏫 Phòng: ', 'Phòng: '],
]);

console.log('Finished cleaning emojis.');
