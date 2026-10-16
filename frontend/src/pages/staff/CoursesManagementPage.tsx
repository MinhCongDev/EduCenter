import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Placeholder for Training Staff feature (outside the Student actor scope).
 * Created so the Vite build can resolve the lazy import in App.tsx and the
 * `/staff/courses` route does not 500 the entire SPA bundle.
 */
const CoursesManagementPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="dash-container">
      <div
        className="dash-banner"
        style={{
          background:
            'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)',
        }}
      >
        <div className="dash-banner-content">
          <div className="dash-banner-badge">📚 Phòng Giáo Vụ • Quản Lý Khóa Học</div>
          <h1>Quản lý chương trình đào tạo</h1>
          <p>
            Xin chào {user?.fullName || 'cán bộ giáo vụ'}. Tính năng tạo / sửa /
            xoá khóa học sẽ do thành viên phụ trách actor Training Staff triển
            khai.
          </p>
        </div>
        <div className="dash-banner-right">
          <div className="dash-date-pill">
            <div>🛠️ Trạng thái: Đang phát triển</div>
            <div className="sub">Tham khảo use case UC-09 — UC-11</div>
          </div>
        </div>
      </div>

      <div className="dash-card">
        <div className="dash-card-header">
          <h2 className="dash-card-title">
            <span>📚</span> Danh sách chương trình (placeholder)
          </h2>
        </div>
        <p className="dash-subcard-meta">
          Trang này hiện chỉ là skeleton để hệ thống load được. Vui lòng chuyển
          sang <strong>Staff Dashboard</strong> hoặc đăng nhập với tài khoản học
          viên để dùng các chức năng thuộc actor Student.
        </p>
      </div>
    </div>
  );
};

export default CoursesManagementPage;
