import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentService } from '../services/student.service';
import { useToast } from '../contexts/ToastContext';
import type { NotificationItem } from '../types';
import { NOTIFICATION_META } from '../types';

function timeAgo(iso: string): string {
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
}

const NotificationBell: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const toast = useToast();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await studentService.getMyNotifications(20);
      if (res.success && res.data) {
        setItems(res.data.items || []);
        setUnread(res.data.unreadCount || 0);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 60s
    const t = setInterval(fetchNotifications, 60000);
    return () => clearInterval(t);
  }, []);

  // Click outside to close
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const handleItemClick = async (n: NotificationItem) => {
    setOpen(false);
    if (!n.isRead) {
      try {
        await studentService.markNotificationAsRead(n._id);
        setItems((prev) =>
          prev.map((x) =>
            x._id === n._id ? { ...x, isRead: true } : x
          )
        );
        setUnread((u) => Math.max(0, u - 1));
      } catch {
        // ignore
      }
    }
    if (n.linkUrl) navigate(n.linkUrl);
  };

  const handleMarkAll = async () => {
    try {
      const res = await studentService.markAllNotificationsAsRead();
      if (res.success) {
        toast.success(res.message || 'Đã đánh dấu tất cả là đã đọc');
        setItems((prev) =>
          prev.map((x) => ({ ...x, isRead: true }))
        );
        setUnread(0);
      }
    } catch (err: any) {
      toast.error('Không thể đánh dấu');
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await studentService.deleteNotification(id);
      setItems((prev) => prev.filter((x) => x._id !== id));
    } catch {
      toast.error('Không thể xóa');
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        type="button"
        aria-label="Thông báo"
        onClick={() => setOpen((v) => !v)}
        style={{
          position: 'relative',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontSize: '1.25rem',
          padding: '0.4rem 0.6rem',
          color: 'inherit',
        }}
      >
        🔔
        {unread > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              background: '#ef4444',
              color: 'white',
              borderRadius: '999px',
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '2px 6px',
              minWidth: 18,
              textAlign: 'center',
              border: '2px solid white',
            }}
          >
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 360,
            maxHeight: 480,
            overflowY: 'auto',
            background: 'white',
            borderRadius: 12,
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            border: '1px solid #e5e7eb',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              padding: '0.75rem 1rem',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <strong style={{ fontSize: '0.95rem' }}>🔔 Thông báo</strong>
            {unread > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#3b82f6',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                Đọc tất cả
              </button>
            )}
          </div>

          {loading && items.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8' }}>
              Đang tải...
            </div>
          ) : items.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: '2rem' }}>📭</div>
              <div style={{ marginTop: '0.5rem' }}>Chưa có thông báo</div>
            </div>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {items.map((n) => {
                const meta = NOTIFICATION_META[n.type] ?? NOTIFICATION_META.INFO;
                return (
                  <li
                    key={n._id}
                    onClick={() => handleItemClick(n)}
                    style={{
                      padding: '0.75rem 1rem',
                      borderBottom: '1px solid #f1f5f9',
                      cursor: 'pointer',
                      background: n.isRead ? 'white' : 'rgba(59,130,246,0.05)',
                      display: 'flex',
                      gap: '0.75rem',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '1.25rem',
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: meta.color + '20',
                        color: meta.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {meta.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: n.isRead ? 400 : 600,
                          color: '#0f172a',
                          marginBottom: 2,
                        }}
                      >
                        {n.title}
                      </div>
                      <div
                        style={{
                          fontSize: '0.8rem',
                          color: '#64748b',
                          marginBottom: 4,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {n.content}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                        {timeAgo(n.createdAt)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, n._id)}
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
                      ✕
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
