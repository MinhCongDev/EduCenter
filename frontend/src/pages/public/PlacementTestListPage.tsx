import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { placementTestService, type PlacementTestSummary, type TestHistoryItem } from '../../services/placementTest.service';

const getHistoryLevel = (item: TestHistoryItem): string => {
  if (item.matchedLevel) return item.matchedLevel;
  const b = item.predictedBand;
  if (b >= 7.5) return '8.0+';
  if (b >= 6.5) return '6.5 - 7.5+';
  if (b >= 5.5) return '5.5 - 6.5';
  if (b >= 4.5) return '4.5 - 5.5';
  if (b >= 3.5) return '3.5 - 4.5';
  return '0 - 3.5';
};

export const PlacementTestListPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [tests, setTests] = useState<PlacementTestSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [history, setHistory] = useState<TestHistoryItem[]>([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchData = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const testList = await placementTestService.getTests();
        setTests(testList);

        if (isAuthenticated && user?._id) {
          const historyList = await placementTestService.getMyHistory(user._id);
          setHistory(historyList);
        } else {
          setHistory([]);
        }
      } catch (err: unknown) {
        setTests([]);
        setLoadError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [loadAttempt, isAuthenticated, user?._id]);

  const handleStartTest = (testId: string) => {
    if (!isAuthenticated) {
      navigate('/login', {
        state: {
          from: { pathname: `/placement-test/${testId}` },
          message: 'Vui lòng đăng nhập tài khoản học viên để bắt đầu làm bài thi thử.',
        },
      });
      return;
    }
    navigate(`/placement-test/${testId}`);
  };

  return (
    <div className="placement-list-page" style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '4rem' }}>
      {/* Hero Banner */}
      <section
        style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #065f46 40%, #047857 100%)',
          color: '#ffffff',
          padding: '4rem 1.5rem 3.5rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at top right, rgba(252, 211, 77, 0.15) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              padding: '6px 16px',
              borderRadius: '999px',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#fef3c7',
              marginBottom: '1.25rem',
            }}
          >
            <span>BÀI KIỂM TRA ĐẦU VÀO</span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(2rem, 4vw, 3.2rem)',
              fontWeight: 900,
              lineHeight: 1.2,
              margin: '0 0 1rem',
              letterSpacing: '-0.02em',
            }}
          >
            Kiểm Tra Trình Độ Đầu Vào <br />
            <span style={{ color: '#fcd34d' }}>Chọn bài kiểm tra phù hợp với khóa học</span>
          </h1>

          <p
            style={{
              fontSize: 'clamp(1rem, 1.8vw, 1.15rem)',
              color: '#e2e8f0',
              maxWidth: '820px',
              margin: '0 auto 2rem',
              lineHeight: 1.6,
            }}
          >
            Danh sách dưới đây gồm các bài kiểm tra đã được trung tâm công bố. Chọn bài phù hợp để xem hướng dẫn và bắt đầu làm bài.
          </p>

          {/* Quick Metrics Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '1.5rem',
              maxWidth: '900px',
              margin: '0 auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f1f5f9', fontSize: '0.9rem', fontWeight: 600 }}>
              <span style={{ color: '#fcd34d', fontSize: '1.2rem' }}>✓</span>
              <span>Đề thi được lấy từ hệ thống của trung tâm</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f1f5f9', fontSize: '0.9rem', fontWeight: 600 }}>
              <span style={{ color: '#fcd34d', fontSize: '1.2rem' }}>✓</span>
              <span>Bài trắc nghiệm được chấm tự động sau khi nộp</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f1f5f9', fontSize: '0.9rem', fontWeight: 600 }}>
              <span style={{ color: '#fcd34d', fontSize: '1.2rem' }}>✓</span>
              <span>Hiển thị độ khó và khóa học liên quan</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f1f5f9', fontSize: '0.9rem', fontWeight: 600 }}>
              <span style={{ color: '#fcd34d', fontSize: '1.2rem' }}>✓</span>
              <span>Chỉ hiển thị đề đã được xuất bản</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div style={{ maxWidth: '1200px', margin: '-2rem auto 0', padding: '0 1.25rem', position: 'relative', zIndex: 10 }}>
        {/* Auth Required Notice Banner */}
        {!isAuthenticated && (
          <div
            style={{
              backgroundColor: '#FEF3C7',
              border: '1.5px solid #F59E0B',
              borderRadius: '16px',
              padding: '14px 20px',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.15)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.4rem' }}>🔒</span>
              <span style={{ color: '#92400E', fontWeight: 700, fontSize: '0.92rem' }}>
                Yêu cầu đăng nhập: Bạn cần đăng nhập tài khoản học viên để vào phòng thi thử và lưu trữ kết quả phân tích Band điểm.
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/login', { state: { from: { pathname: '/placement-test' }, message: 'Vui lòng đăng nhập để làm bài thi thử.' } })}
              style={{
                backgroundColor: '#B45309',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '7px 16px',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
              }}
            >
              Đăng nhập ngay →
            </button>
          </div>
        )}

        {/* Test Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {loading ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <div className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
              <p style={{ color: '#64748b', fontWeight: 600 }}>Đang tải danh sách bài kiểm tra...</p>
            </div>
          ) : loadError ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #fecaca' }}>
              <h2 style={{ color: '#b91c1c', marginTop: 0 }}>Không thể tải bài kiểm tra</h2>
              <p style={{ color: '#64748b' }}>{loadError}</p>
              <button
                type="button"
                onClick={() => setLoadAttempt((attempt) => attempt + 1)}
                style={{ backgroundColor: '#047857', color: '#ffffff', border: 0, borderRadius: '8px', padding: '0.7rem 1.2rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Thử tải lại
              </button>
            </div>
          ) : tests.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <h2 style={{ color: '#0f172a', marginTop: 0 }}>Chưa có bài kiểm tra được công bố</h2>
              <p style={{ color: '#64748b', marginBottom: 0 }}>
                Bài kiểm tra ở trạng thái Bản nháp chưa hiển thị cho học viên. Vui lòng quay lại sau khi trung tâm xuất bản đề.
              </p>
            </div>
          ) : (
            tests.map((test) => (
                <div
                  key={test.id}
                  onClick={() => handleStartTest(test.id)}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '20px',
                    boxShadow: '0 6px 24px rgba(0,0,0,0.06)',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    position: 'relative',
                    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-6px)';
                    e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.06)';
                  }}
                >
                  {/* Card Cover Image with Overlay */}
                  <div style={{ height: '170px', position: 'relative', overflow: 'hidden' }}>
                    <img
                      src={test.bannerUrl}
                      alt={test.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to top, rgba(15, 23, 42, 0.85) 0%, rgba(15, 23, 42, 0.2) 60%)',
                      }}
                    />

                    <div style={{ position: 'absolute', bottom: '12px', left: '16px', right: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <span
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.92)',
                          color: '#064e3b',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          padding: '4px 10px',
                          borderRadius: '6px',
                        }}
                      >
                        {test.category}
                      </span>
                      <span
                        style={{
                          backgroundColor: '#fcd34d',
                          color: '#78350f',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          padding: '4px 10px',
                          borderRadius: '6px',
                        }}
                      >
                        Mục tiêu: {test.targetLevel}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                        {test.course?.title || test.category}
                      </span>
                    </div>

                    <h2
                      style={{
                        margin: '0 0 0.5rem',
                        fontSize: '1.2rem',
                        fontWeight: 800,
                        color: '#0f172a',
                        lineHeight: 1.4,
                      }}
                    >
                      {test.title}
                    </h2>

                    <p style={{ margin: '0 0 1.25rem', fontSize: '0.86rem', color: '#475569', lineHeight: 1.5, flex: 1 }}>
                      {test.description}
                    </p>

                    {/* Meta stats pills */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '8px',
                        backgroundColor: '#f8fafc',
                        padding: '10px 12px',
                        borderRadius: '12px',
                        marginBottom: '1.5rem',
                        border: '1px solid #e2e8f0',
                        textAlign: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Thời gian</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                          ⏱️ {test.durationMinutes}p
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Số câu hỏi</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#047857', marginTop: '2px' }}>
                          📝 {test.totalQuestions} câu
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Độ khó</div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#b45309', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {test.difficulty.split(' - ')[0]}
                        </div>
                      </div>
                    </div>

                    {/* What this test covers */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        💡 Kỹ năng đánh giá chính:
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.82rem', color: '#64748b', lineHeight: 1.6 }}>
                        {test.skills.length > 0
                          ? test.skills.map((skill) => <li key={skill}>{skill}</li>)
                          : <li>Bài kiểm tra trắc nghiệm</li>}
                      </ul>
                    </div>

                    {/* Action Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartTest(test.id);
                      }}
                      style={{
                        backgroundColor: isAuthenticated ? '#047857' : '#D97706',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.85rem 1.25rem',
                        borderRadius: '12px',
                        fontSize: '0.95rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: 'none',
                        transition: 'background-color 0.2s',
                      }}
                    >
                      <span>{isAuthenticated ? 'Bắt Đầu Làm Bài Ngay' : '🔒 Đăng Nhập Để Làm Bài'}</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
            ))
          )}
        </div>

        {/* History of Past Tests Section */}
        {isAuthenticated && history.length > 0 && (
          <div
            style={{
              marginTop: '3.5rem',
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              padding: '1.75rem',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  📊 Lịch Sử Các Lần Làm Bài Thi Của Bạn
                </h2>
                <span style={{ fontSize: '0.84rem', color: '#64748b' }}>
                  Theo dõi sự tiến bộ và lộ trình khóa học đã được gợi ý
                </span>
              </div>
              <span style={{ backgroundColor: '#ecfdf5', color: '#047857', padding: '4px 10px', borderRadius: '8px', fontWeight: 700, fontSize: '0.8rem' }}>
                Đã hoàn thành {history.length} lượt thi
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#475569', backgroundColor: '#f8fafc' }}>
                    <th style={{ padding: '10px 14px' }}>Bài thi</th>
                    <th style={{ padding: '10px 14px' }}>Thời gian nộp</th>
                    <th style={{ padding: '10px 14px' }}>Điểm số</th>
                    <th style={{ padding: '10px 14px' }}>Dự đoán Band</th>
                    <th style={{ padding: '10px 14px' }}>Khóa học gợi ý</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>{item.testTitle}</td>
                      <td style={{ padding: '12px 14px', color: '#64748b' }}>
                        {new Date(item.submittedAt).toLocaleDateString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 800, color: '#047857' }}>
                        {item.score} / {item.totalQuestions} ({item.scorePercentage}%)
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '3px 8px', borderRadius: '6px', fontWeight: 800, fontSize: '0.8rem' }}>
                          Band {item.predictedBand}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <Link
                          to={`/courses?level=${encodeURIComponent(getHistoryLevel(item))}&band=${item.predictedBand}`}
                          style={{
                            fontWeight: 700,
                            color: '#047857',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          title={`Xem các khóa học trình độ ${getHistoryLevel(item)}`}
                        >
                          <span>{item.recommendedCourse}</span>
                          <span style={{ fontSize: '0.8rem' }}>↗</span>
                        </Link>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                          <Link
                            to={`/courses?level=${encodeURIComponent(getHistoryLevel(item))}&band=${item.predictedBand}`}
                            style={{
                              backgroundColor: '#ecfdf5',
                              color: '#047857',
                              border: '1px solid #a7f3d0',
                              padding: '5px 12px',
                              borderRadius: '8px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <span>Xem khóa học</span>
                            <span>→</span>
                          </Link>
                          <button
                            type="button"
                            onClick={() => navigate(`/placement-test/${item.testId}`)}
                            style={{
                              backgroundColor: '#eff6ff',
                              color: '#1d4ed8',
                              border: '1px solid #bfdbfe',
                              padding: '5px 10px',
                              borderRadius: '8px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Thi lại ↺
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3 Steps Guide Section */}
        <section
          style={{
            marginTop: '3.5rem',
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            padding: '2.5rem 2rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            border: '1px solid #e2e8f0',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 2.5rem' }}>
            <span style={{ color: '#047857', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              QUY TRÌNH KIỂM TRA ĐẦU VÀO
            </span>
            <h2 style={{ margin: '0.4rem 0 0.5rem', fontSize: '1.75rem', fontWeight: 900, color: '#0f172a' }}>
              3 Bước Đơn Giản Nhận Ngay Lộ Trình Học Cá Nhân Hóa
            </h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>
              Quy trình khảo thí độc quyền tại EduCenter giúp hàng chục ngàn học viên định vị chính xác năng lực và tiết kiệm 30% thời gian luyện thi.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#ecfdf5',
                  color: '#047857',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 900,
                  marginBottom: '1rem',
                  boxShadow: '0 4px 12px rgba(4, 120, 87, 0.15)',
                }}
              >
                1
              </div>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                Chọn Bài Thi Thích Hợp
              </h3>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b', lineHeight: 1.6 }}>
                Lựa chọn bài kiểm tra phù hợp với xuất phát điểm của bạn: Mất gốc (0 - 5.5), Đọc hiểu thực chiến (5.0 - 7.5), hoặc Dự đoán Overall Band (4.5 - 8.5+).
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#eff6ff',
                  color: '#1d4ed8',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 900,
                  marginBottom: '1rem',
                  boxShadow: '0 4px 12px rgba(29, 78, 216, 0.15)',
                }}
              >
                2
              </div>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                Làm Bài Trực Tuyến 30 - 45 Phút
              </h3>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b', lineHeight: 1.6 }}>
                Giao diện mô phỏng 100% phần mềm thi IELTS trên máy tính với đồng hồ đếm ngược, chia đôi màn hình đọc passage và điều hướng câu hỏi thông minh.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#fef3c7',
                  color: '#b45309',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 900,
                  marginBottom: '1rem',
                  boxShadow: '0 4px 12px rgba(180, 83, 9, 0.15)',
                }}
              >
                3
              </div>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                Nhận Kết Quả &amp; Gợi Ý Khóa Học
              </h3>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b', lineHeight: 1.6 }}>
                Xem bảng phân tích phổ điểm, giải thích chi tiết đáp án từng câu và nhận gợi ý khóa học EduCenter sát nhất kèm học phí và lộ trình tuần.
              </p>
            </div>
          </div>

          {/* Need Consultation Box */}
          <div
            style={{
              marginTop: '2.5rem',
              backgroundColor: '#f8fafc',
              borderRadius: '16px',
              padding: '1.5rem',
              border: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.05rem' }}>
                💬 Bạn cần tư vấn trực tiếp 1:1 cùng Chuyên viên Giáo vụ?
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '3px' }}>
                Hỗ trợ phân tích chuyên sâu bài thi Speaking &amp; Writing và lập kế hoạch mục tiêu du học/xét tuyển ĐH miễn phí.
              </div>
            </div>

            <a
              href="tel:19006868"
              style={{
                backgroundColor: '#047857',
                color: '#ffffff',
                textDecoration: 'none',
                padding: '0.65rem 1.25rem',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.88rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>📞</span>
              <span>Hotline: 1900 6868</span>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PlacementTestListPage;
