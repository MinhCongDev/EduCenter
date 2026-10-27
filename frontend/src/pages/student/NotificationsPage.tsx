import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { studentService } from '../../services/student.service';
import { useToast } from '../../contexts/ToastContext';
import type { NotificationItem, NotificationType } from '../../types';
import { NOTIFICATION_META } from '../../types';
import { Button } from '../../components/Button';
import { EmptyState, SkeletonPage } from '../../components/Skeleton';
import { resolveInternalLink } from '../../utils/routes';

type FilterKey = 'ALL' | 'UNREAD' | 'READ';

const timeAgo = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'vừa xong';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} ngày trước`;
  return new Date(iso).toLocaleDateString('vi-VN');
};

/** Nhóm thông báo theo ngày để dễ đọc: Hôm nay / Hôm qua / Cũ hơn. */
const dateGroup = (iso: string): 'today' | 'yesterday' | 'older' => {
  const d = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
  const t = d.getTime();
  if (t >= startOfToday) return 'today';
  if (t >= startOfYesterday) return 'yesterday';
  return 'older';
};

const GROUP_LABEL: Record<'today' | 'yesterday' | 'older', string> = {
  today: 'Hôm nay',
  yesterday: 'Hôm qua',
  older: 'Trước đó',
};

const NotificationsPage: React.FC = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('ALL');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      // Lấy tối đa 100 mục — backend giới hạn tối đa 100.
      const res = await studentService.getMyNotifications(100);
      if (res.success && res.data) {
        setItems(res.data.items || []);
        setUnreadCount(res.data.unreadCount || 0);
      } else {
        toast.error(res.message || 'Không thể tải thông báo');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể tải thông báo');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleItemClick = async (n: NotificationItem) => {
    // Đánh dấu đã đọc trước khi điều hướng.
    if (!n.isRead) {
      try {
        await studentService.markNotificationAsRead(n._id);
        setItems((prev) => prev.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)));
        setUnreadCount((u) => Math.max(0, u - 1));
      } catch {
        // Không chặn điều hướng nếu việc đánh dấu đã đọc thất bại.
      }
    }
    // Chỉ điều hướng tới link nội bộ hợp lệ (link sai sẽ bị bỏ qua
    // thay vì đưa người dùng tới trang 404).
    const target = resolveInternalLink(n.linkUrl);
    if (target) navigate(target);
  };

  const handleMarkAll = async () => {
    try {
      const res = await studentService.markAllNotificationsAsRead();
      if (res.success) {
        toast.success(res.message || 'Đã đánh dấu tất cả là đã đọc');
        setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể đánh dấu');
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      setDeletingId(id);
      await studentService.deleteNotification(id);
      setItems((prev) => {
        const target = prev.find((x) => x._id === id);
        if (target && !target.isRead) setUnreadCount((u) => Math.max(0, u - 1));
        return prev.filter((x) => x._id !== id);
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể xóa thông báo');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = items.filter((n) => {
    if (filter === 'UNREAD') return !n.isRead;
    if (filter === 'READ') return n.isRead;
    return true;
  });

  // Gom nhóm theo ngày, giữ thứ tự thời gian mới nhất trước.
  const grouped: { key: 'today' | 'yesterday' | 'older'; items: NotificationItem[] }[] = (
    ['today', 'yesterday', 'older'] as const
  )
    .map((key) => ({
      key,
      items: filtered.filter((n) => dateGroup(n.createdAt) === key),
    }))
    .filter((g) => g.items.length > 0);

  const tabs: { key: FilterKey; label: string; count: number }[] = [
    { key: 'ALL', label: 'Tất cả', count: items.length },
    { key: 'UNREAD', label: '🔔 Chưa đọc', count: items.filter((n) => !n.isRead).length },
    { key: 'READ', label: '✓ Đã đọc', count: items.filter((n) => n.isRead).length },
  ];

  if (isLoading) return <SkeletonPage message="Đang tải thông báo..." />;

  return (
    <div className="dash-container">
      <div className="dash-banner">
        <div className="dash-banner-content">
          <div className="dash-banner-badge">🔔 Thông Báo</div>
          <h1>Thông Báo</h1>
          <p>
            {items.length > 0
              ? `Bạn có ${items.length} thông báo${
                  unreadCount > 0 ? `, trong đó ${unreadCount} chưa đọc` : ''
                }.`
              : 'Chưa có thông báo nào.'}
          </p>
        </div>
        <div className="dash-banner-right">
          <div className="dash-date-pill">
            <div>🔔 {unreadCount} chưa đọc</div>
            <div className="sub">{items.length} thông báo</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <Link to="/student/dashboard" className="dash-quick-btn" style={{ textDecoration: 'none' }}>
          ← Dashboard
        </Link>
        <Link to="/student/classes" className="dash-quick-btn" style={{ textDecoration: 'none' }}>
          📚 Lớp Học
        </Link>
        {unreadCount > 0 && (
          <Button variant="secondary" onClick={handleMarkAll} icon="✓">
            Đánh dấu tất cả đã đọc
          </Button>
        )}
      </div>

      {items.length > 0 && (
        <div className="dash-card" style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`dash-quick-btn ${filter === tab.key ? 'primary' : ''}`}
                style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon="📭"
          title={filter === 'ALL' ? 'Chưa có thông báo' : 'Không có thông báo phù hợp'}
          description={
            filter === 'ALL'
              ? 'Các thông báo về điểm, lịch học, thanh toán sẽ hiển thị tại đây.'
              : 'Thử chọn bộ lọc khác để xem thông báo.'
          }
        />
      ) : (
        grouped.map((group) => (
          <div key={group.key} className="dash-card" style={{ marginBottom: '1rem' }}>
            <div className="dash-card-header">
              <h2 className="dash-card-title">
                <span>🗂️</span> {GROUP_LABEL[group.key]}
              </h2>
              <span className="badge-pill badge-blue">{group.items.length}</span>
            </div>
            <div className="dash-item-list">
              {group.items.map((n) => {
                const meta = NOTIFICATION_META[n.type as NotificationType] ?? NOTIFICATION_META.INFO;
                const target = resolveInternalLink(n.linkUrl);
                return (
                  <div
                    key={n._id}
                    className="dash-item"
                    onClick={() => handleItemClick(n)}
                    style={{
                      cursor: 'pointer',
                      background: n.isRead ? 'transparent' : 'rgba(59,130,246,0.05)',
                    }}
                  >
                    <div className="dash-item-main">
                      <div
                        className="dash-item-icon"
                        style={{
                          background: meta.color + '20',
                          color: meta.color,
                        }}
                      >
                        {meta.icon}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div className="dash-item-title">
                          {n.title}
                          {!n.isRead && (
                            <span
                              aria-label="Chưa đọc"
                              style={{
                                display: 'inline-block',
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: '#3b82f6',
                                marginLeft: 8,
                                verticalAlign: 'middle',
                              }}
                            />
                          )}
                        </div>
                        <div className="dash-item-sub">{n.content}</div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 4 }}>
                          {timeAgo(n.createdAt)}
                          {target && ' · Xem chi tiết →'}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span className="badge-pill badge-blue">{meta.label}</span>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, n._id)}
                        disabled={deletingId === n._id}
                        aria-label="Xóa thông báo"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          padding: '0.2rem',
                        }}
                      >
                        {deletingId === n._id ? '⏳' : '✕'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default NotificationsPage;
