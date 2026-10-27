import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { authService } from '../services/auth.service';
import type { UserPreferences } from '../types';
import { DEFAULT_PREFERENCES } from '../types';
import { Button } from './Button';

interface SettingsPanelProps {
  /** Gọi sau khi lưu thành công (dùng để đồng bộ context/profile). */
  onSaved?: (prefs: UserPreferences) => void;
}

/**
 * Bảng "Cài đặt" — dùng chung cho trang Hồ sơ cá nhân (tab Cài đặt) và
 * hộp thoại Hồ sơ của các vai trò khác.
 *
 * Cài đặt được lưu thật vào `User.preferences` qua `PUT /api/auth/preferences`
 * và có tác dụng thật: `notification.service` bỏ qua việc gửi thông báo loại
 * mà người dùng đã tắt.
 */

const NOTIFICATION_ROWS: Array<{
  key: keyof UserPreferences;
  icon: string;
  title: string;
  desc: string;
}> = [
  {
    key: 'inAppNotifications',
    icon: '🔔',
    title: 'Thông báo trong hệ thống',
    desc: 'Nhận thông báo tại chuông thông báo trên thanh công cụ.',
  },
  {
    key: 'emailNotifications',
    icon: '📧',
    title: 'Thông báo qua email',
    desc: 'Gửi thông báo quan trọng tới địa chỉ email của bạn.',
  },
  {
    key: 'notifyGrades',
    icon: '📝',
    title: 'Kết quả học tập',
    desc: 'Thông báo khi có điểm bài tập hoặc điểm tổng kết mới.',
  },
  {
    key: 'notifyAttendance',
    icon: '📅',
    title: 'Điểm danh',
    desc: 'Thông báo khi bị đánh dấu vắng hoặc điểm danh muộn.',
  },
  {
    key: 'notifyAnnouncements',
    icon: '📢',
    title: 'Thông báo lớp & chương trình',
    desc: 'Thông báo khi giảng viên hoặc phòng giáo vụ đăng thông báo mới.',
  },
  {
    key: 'notifyPayments',
    icon: '💳',
    title: 'Thanh toán',
    desc: 'Thông báo khi có cập nhật về học phí và giao dịch.',
  },
];

export const applyCompactMode = (compact: boolean): void => {
  document.body.classList.toggle('dash-compact-mode', compact);
};

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onSaved }) => {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await authService.getPreferences();
      if (res.success && res.data?.preferences) {
        const merged = { ...DEFAULT_PREFERENCES, ...res.data.preferences };
        setPreferences(merged);
        applyCompactMode(merged.compactMode);
      }
    } catch {
      // Giữ giá trị mặc định nếu không tải được.
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await authService.updatePreferences(preferences);
      if (res.success && res.data?.preferences) {
        const saved = { ...DEFAULT_PREFERENCES, ...res.data.preferences };
        setPreferences(saved);
        applyCompactMode(saved.compactMode);
        toast.success(res.message || 'Cập nhật cài đặt thành công');
        if (user && typeof updateUser === 'function') {
          updateUser({ ...user, preferences: saved });
        }
        onSaved?.(saved);
      } else {
        toast.error(res.message || 'Cập nhật cài đặt thất bại');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Cập nhật cài đặt thất bại');
    } finally {
      setSaving(false);
    }
  };

  const toggle = (key: keyof UserPreferences, value: boolean) => {
    setPreferences((prev) => {
      const next = { ...prev, [key]: value };
      // Giao diện gọn áp dụng ngay để người dùng thấy tác dụng.
      if (key === 'compactMode') applyCompactMode(value);
      return next;
    });
  };

  return (
    <div className="dash-settings-wrap">
      <div className="dash-settings-block">
        <div className="dash-settings-block-title">🔔 Thông báo</div>
        <p className="dash-settings-block-desc">
          Chọn loại thông báo bạn muốn nhận. Thông báo đã tắt sẽ không được gửi tới bạn.
        </p>
        <div className="dash-settings-list">
          {NOTIFICATION_ROWS.map((row) => (
            <label key={row.key} className="dash-settings-row">
              <span className="dash-settings-row-icon" aria-hidden="true">
                {row.icon}
              </span>
              <span className="dash-settings-row-text">
                <strong>{row.title}</strong>
                <small>{row.desc}</small>
              </span>
              <span className="dash-switch">
                <input
                  type="checkbox"
                  checked={preferences[row.key]}
                  onChange={(e) => toggle(row.key, e.target.checked)}
                  aria-label={row.title}
                />
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="dash-settings-block">
        <div className="dash-settings-block-title">🖥️ Hiển thị</div>
        <p className="dash-settings-block-desc">
          Tùy chỉnh giao diện khi làm việc trên hệ thống.
        </p>
        <div className="dash-settings-list">
          <label className="dash-settings-row">
            <span className="dash-settings-row-icon" aria-hidden="true">
              📐
            </span>
            <span className="dash-settings-row-text">
              <strong>Chế độ gọn</strong>
              <small>Giảm khoảng trắng và cỡ chữ để hiển thị nhiều thông tin hơn.</small>
            </span>
            <span className="dash-switch">
              <input
                type="checkbox"
                checked={preferences.compactMode}
                onChange={(e) => toggle('compactMode', e.target.checked)}
                aria-label="Chế độ gọn"
              />
            </span>
          </label>
        </div>
      </div>

      <div className="dash-settings-actions">
        <Button type="button" variant="primary" loading={saving} icon="💾" onClick={handleSave}>
          Lưu cài đặt
        </Button>
      </div>
    </div>
  );
};

export default SettingsPanel;
