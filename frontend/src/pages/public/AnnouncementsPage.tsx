import React, { useState, useEffect, useCallback } from 'react';
import { announcementService } from '../../services/announcement.service';
import type { Announcement, AnnouncementQueryParams } from '../../types';

export const AnnouncementsPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  const categories = [
    { label: 'Tất cả tin tức', value: 'ALL' },
    { label: 'Workshop 8.0+', value: 'Workshop' },
    { label: 'Thi thử IELTS', value: 'Thi thử IELTS' },
    { label: 'Vinh danh học viên', value: 'Vinh danh' },
    { label: 'Thông báo học vụ', value: 'Thông báo học vụ' },
  ];

  const fetchAnnouncements = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: AnnouncementQueryParams = {};
      if (search.trim()) params.search = search.trim();
      if (selectedCategory !== 'ALL') params.category = selectedCategory;

      const res = await announcementService.getAnnouncements(params);
      if (res.success) {
        setAnnouncements(res.data);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể tải danh sách thông báo.');
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedCategory]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleOpenDetail = async (item: Announcement) => {
    setSelectedAnnouncement(item);
    try {
      const res = await announcementService.getAnnouncementById(item._id);
      if (res.success && res.data) {
        setSelectedAnnouncement(res.data);
      }
    } catch {
      // Keep existing
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '80vh', paddingBottom: '4rem' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #07403F 0%, #052F2E 100%)',
          color: '#FFFFFF',
          padding: '3rem 1.5rem',
          textAlign: 'center',
          borderBottom: '4px solid #EC6E23',
        }}
      >
        <div style={{ maxWidth: '850px', margin: '0 auto' }}>
          <div
            style={{
              display: 'inline-block',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              padding: '4px 14px',
              borderRadius: '20px',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#FCD34D',
              marginBottom: '1rem',
            }}
          >
            BẢN TIN HỌC THUẬT &amp; SỰ KIỆN KHẢO THÍ
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 1rem', color: '#FFFFFF' }}>
            Thông Báo Từ Trung Tâm
          </h1>
          <p style={{ fontSize: '1.05rem', color: '#E2E8F0', maxWidth: '650px', margin: '0 auto', lineHeight: 1.6 }}>
            Cập nhật lịch thi thử IELTS trên máy tính, workshop cùng giáo viên 8.5+ - 9.0 và các thông báo học vụ quan trọng.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Search & Category Filter Toolbar */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '1.25rem 1.5rem',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
            marginBottom: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Tìm kiếm thông báo theo tiêu đề, nội dung..."
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                border: '1.5px solid #CBD5E1',
                fontSize: '0.95rem',
                boxSizing: 'border-box',
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Pills */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {categories.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setSelectedCategory(c.value)}
                style={{
                  padding: '0.4rem 0.9rem',
                  borderRadius: '20px',
                  border: selectedCategory === c.value ? '2px solid #07403F' : '1px solid #E2E8F0',
                  backgroundColor: selectedCategory === c.value ? '#07403F' : '#FFFFFF',
                  color: selectedCategory === c.value ? '#FFFFFF' : '#475569',
                  fontSize: '0.85rem',
                  fontWeight: selectedCategory === c.value ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Announcements List */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
            <p style={{ color: '#64748B' }}>Đang tải thông báo từ EduCenter...</p>
          </div>
        ) : error ? (
          <div
            style={{
              padding: '1.5rem',
              backgroundColor: '#FEE2E2',
              borderRadius: '12px',
              textAlign: 'center',
              color: '#991B1B',
            }}
          >
            {error}
          </div>
        ) : announcements.length === 0 ? (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '3rem',
              textAlign: 'center',
              color: '#64748B',
            }}
          >
            <span style={{ fontSize: '3rem' }}>📣</span>
            <h3>Chưa có thông báo nào trong mục này</h3>
            <p>Vui lòng chọn danh mục khác hoặc đặt lại từ khóa tìm kiếm.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {announcements.map((item) => (
              <div
                key={item._id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '14px',
                  padding: '1.5rem',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
                  border: item.isPinned ? '2px solid #57D061' : '1px solid #E2E8F0',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
                onClick={() => handleOpenDetail(item)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.04)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {item.isPinned && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '16px',
                      backgroundColor: '#FEF3C7',
                      color: '#B45309',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    📌 Ghim nổi bật
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span
                    style={{
                      backgroundColor: '#E0F2FE',
                      color: '#0369A1',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}
                  >
                    {item.category}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>•</span>
                  <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                    {formatDate(item.publicationDate)}
                  </span>
                </div>

                <h3
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    color: '#0F172A',
                    margin: '0 0 0.5rem',
                    lineHeight: 1.4,
                  }}
                >
                  {item.title}
                </h3>

                <p
                  style={{
                    fontSize: '0.9rem',
                    color: '#475569',
                    margin: '0 0 1rem',
                    lineHeight: 1.5,
                  }}
                >
                  {item.summary || item.content.slice(0, 150) + '...'}
                </p>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.8rem',
                    color: '#64748B',
                    borderTop: '1px solid #F1F5F9',
                    paddingTop: '0.75rem',
                  }}
                >
                  <span>
                    ✍️ Tác giả: <strong>{item.author?.fullName || 'Ban Giám Đốc EduCenter'}</strong>
                  </span>
                  <span style={{ color: '#2563EB', fontWeight: 600 }}>
                    Đọc tiếp →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Announcement Detail Modal */}
      {selectedAnnouncement && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
            backdropFilter: 'blur(3px)',
          }}
          onClick={() => setSelectedAnnouncement(null)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '720px',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 24px 48px rgba(0, 0, 0, 0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                background: 'linear-gradient(135deg, #07403F 0%, #052F2E 100%)',
                color: '#FFFFFF',
                padding: '1.75rem',
                borderTopLeftRadius: '20px',
                borderTopRightRadius: '20px',
                position: 'relative',
              }}
            >
              <button
                onClick={() => setSelectedAnnouncement(null)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: '#FFFFFF',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                ✕
              </button>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <span style={{ backgroundColor: '#FCD34D', color: '#07403F', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                  {selectedAnnouncement.category}
                </span>
                <span style={{ color: '#E2E8F0', fontSize: '0.8rem' }}>
                  {formatDate(selectedAnnouncement.publicationDate)}
                </span>
              </div>

              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, lineHeight: 1.4 }}>
                {selectedAnnouncement.title}
              </h2>
            </div>

            {/* Content Body */}
            <div style={{ padding: '1.75rem' }}>
              <div
                style={{
                  fontSize: '0.95rem',
                  color: '#334155',
                  lineHeight: 1.8,
                  whiteSpace: 'pre-line',
                }}
              >
                {selectedAnnouncement.content}
              </div>

              <div
                style={{
                  marginTop: '2rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid #E2E8F0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.85rem',
                  color: '#64748B',
                }}
              >
                <span>Người đăng: <strong>{selectedAnnouncement.author?.fullName}</strong></span>
                <button
                  type="button"
                  onClick={() => setSelectedAnnouncement(null)}
                  style={{
                    padding: '0.5rem 1.25rem',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#07403F',
                    color: '#FFF',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementsPage;
