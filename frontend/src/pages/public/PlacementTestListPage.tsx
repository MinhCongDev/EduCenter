import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { placementTestService, type PlacementTestSummary, type TestHistoryItem } from '../../services/placementTest.service';

export const PlacementTestListPage: React.FC = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState<PlacementTestSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [history, setHistory] = useState<TestHistoryItem[]>([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchData = async () => {
      setLoading(true);
      try {
        const [testList, historyList] = await Promise.all([
          placementTestService.getTests(),
          placementTestService.getMyHistory(),
        ]);
        setTests(testList);
        setHistory(historyList);
      } catch (err) {
        console.error('Lỗi tải danh sách bài test:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
            <span>🎯</span>
            <span>HỆ THỐNG KIỂM TRA ĐẦU VÀO CHUẨN KHẢO THÍ IDP &amp; BC</span>
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
            Kiểm Tra Trình Độ IELTS Đầu Vào <br />
            <span style={{ color: '#fcd34d' }}>Nhận Ngay Lộ Trình &amp; Gợi Ý Khóa Học Cá Nhân Hóa</span>
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
            Làm 3 bài thi dài chuẩn đề thi thật để đánh giá chính xác năng lực 4 khía cạnh học thuật (Band 0.0 - 8.5+).
            Hệ thống phân tích điểm số, phát hiện lỗ hổng và đề xuất khóa học EduCenter tối ưu nhất cho bạn.
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
              <span>100% Đề thi thật Cambridge &amp; Oxford</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f1f5f9', fontSize: '0.9rem', fontWeight: 600 }}>
              <span style={{ color: '#fcd34d', fontSize: '1.2rem' }}>✓</span>
              <span>Chấm điểm &amp; Dự đoán Band ngay sau khi nộp</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f1f5f9', fontSize: '0.9rem', fontWeight: 600 }}>
              <span style={{ color: '#fcd34d', fontSize: '1.2rem' }}>✓</span>
              <span>Gợi ý khóa học sát với trình độ thực tế</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f1f5f9', fontSize: '0.9rem', fontWeight: 600 }}>
              <span style={{ color: '#fcd34d', fontSize: '1.2rem' }}>✓</span>
              <span>Giải thích đáp án chi tiết từng câu tiếng Việt</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div style={{ maxWidth: '1200px', margin: '-2rem auto 0', padding: '0 1.25rem', position: 'relative', zIndex: 10 }}>
        {/* Test Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {loading ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <div className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
              <p style={{ color: '#64748b', fontWeight: 600 }}>Đang chuẩn bị danh sách 3 bài thi chuẩn quốc tế...</p>
            </div>
          ) : (
            tests.map((test, index) => {
              const isPopular = index === 1;
              const isAdvanced = index === 2;

              return (
                <div
                  key={test.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '20px',
                    boxShadow: isPopular ? '0 12px 36px rgba(4, 120, 87, 0.16)' : '0 6px 24px rgba(0,0,0,0.06)',
                    border: isPopular ? '2px solid #059669' : '1px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    position: 'relative',
                    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-6px)';
                    e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = isPopular ? '0 12px 36px rgba(4, 120, 87, 0.16)' : '0 6px 24px rgba(0,0,0,0.06)';
                  }}
                >
                  {/* Top Badge */}
                  {isPopular && (
                    <div
                      style={{
                        backgroundColor: '#059669',
                        color: '#ffffff',
                        textAlign: 'center',
                        padding: '6px 12px',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                      }}
                    >
                      🔥 ĐƯỢC CHỌN NHIỀU NHẤT • CAMBRIDGE REAL TEST
                    </div>
                  )}

                  {isAdvanced && (
                    <div
                      style={{
                        backgroundColor: '#1e293b',
                        color: '#fcd34d',
                        textAlign: 'center',
                        padding: '6px 12px',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                      }}
                    >
                      ⭐ BÀI TEST CHUYÊN SÂU • DỰ ĐOÁN BAND 8.0+
                    </div>
                  )}

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
                      <span style={{ fontSize: '1.25rem' }}>
                        {index === 0 ? '📘' : index === 1 ? '📖' : '🎓'}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                        BÀI TEST #{index + 1}
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
                        {index === 0 && (
                          <>
                            <li>12 chủ điểm ngữ pháp cốt lõi hay gặp trong IELTS</li>
                            <li>Từ vựng học thuật &amp; Collocations thông dụng</li>
                            <li>Đọc hiểu đoạn văn khoa học ngắn (True/False/Not Given)</li>
                          </>
                        )}
                        {index === 1 && (
                          <>
                            <li>Passage 1: Roman Tunnel Engineering (Lịch sử &amp; Xây dựng)</li>
                            <li>Passage 2: AI in Healthcare &amp; Ethics (Công nghệ &amp; Y khoa)</li>
                            <li>Bẫy True/False/Not Given, Matching Headings, Multiple Choice</li>
                          </>
                        )}
                        {index === 2 && (
                          <>
                            <li>Vốn từ vựng nâng cao C1-C2 &amp; Academic Collocations</li>
                            <li>Cấu trúc đảo ngữ, mệnh đề phân từ &amp; câu điều kiện phức</li>
                            <li>Phản biện luận điểm PEEL &amp; Nhận diện lỗi ngụy biện logic</li>
                          </>
                        )}
                      </ul>
                    </div>

                    {/* Action Button */}
                    <button
                      type="button"
                      onClick={() => navigate(`/placement-test/${test.id}`)}
                      style={{
                        backgroundColor: isPopular ? '#059669' : '#047857',
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
                        boxShadow: isPopular ? '0 4px 14px rgba(5, 150, 105, 0.35)' : 'none',
                        transition: 'background-color 0.2s',
                      }}
                    >
                      <span>Bắt Đầu Làm Bài Ngay</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* History of Past Tests Section */}
        {history.length > 0 && (
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
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1d4ed8' }}>{item.recommendedCourse}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => navigate(`/placement-test/${item.testId}`)}
                          style={{
                            backgroundColor: '#eff6ff',
                            color: '#1d4ed8',
                            border: '1px solid #bfdbfe',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Thi lại ↺
                        </button>
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
