import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  placementTestService,
  type PlacementTestDetail,
  type PlacementResultResponse,
  type PlacementPassage,
} from '../../services/placementTest.service';

export const PlacementTestDetailPage: React.FC = () => {
  const { id, testId } = useParams<{ id?: string; testId?: string }>();
  const activeTestId = id || testId;
  const navigate = useNavigate();

  // Test state
  const [test, setTest] = useState<PlacementTestDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Exam taking state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [activePassageId, setActivePassageId] = useState<string>('');
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  // Result state
  const [result, setResult] = useState<PlacementResultResponse | null>(null);
  const [reviewFilter, setReviewFilter] = useState<'ALL' | 'CORRECT' | 'INCORRECT' | 'UNANSWERED'>('ALL');

  const timerRef = useRef<any>(null);

  // 1. Fetch test details
  useEffect(() => {
    window.scrollTo(0, 0);
    if (!activeTestId) {
      setLoading(false);
      setError('Mã bài thi không hợp lệ.');
      return;
    }

    const loadTest = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await placementTestService.getTestById(activeTestId);
        if (data) {
          setTest(data);
          setTimeLeftSeconds(data.durationMinutes * 60);
          if (data.passages && data.passages.length > 0) {
            setActivePassageId(data.passages[0].id);
          }
        } else {
          setError('Không tìm thấy bài thi kiểm tra đầu vào này.');
        }
      } catch (err: any) {
        setError(err?.message || 'Lỗi khi tải đề thi.');
      } finally {
        setLoading(false);
      }
    };

    loadTest();
  }, [activeTestId]);

  // 2. Countdown Timer
  useEffect(() => {
    if (result || timeLeftSeconds <= 0 || !test) return;

    timerRef.current = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [test, result]);

  // Format time MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 3. Selection Handlers
  const handleSelectAnswer = (questionId: string, optionKey: string) => {
    if (result) return; // Prevent changing after submission
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionKey,
    }));
  };

  const handleToggleFlag = (questionId: string) => {
    setFlaggedQuestions((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  // 4. Submission
  const handleAutoSubmit = () => {
    if (isSubmitting || result) return;
    executeSubmit();
  };

  const executeSubmit = async () => {
    const targetId = activeTestId || test?.id;
    if (!targetId || !test) return;
    setIsSubmitting(true);
    setShowConfirmModal(false);
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const evalResult = await placementTestService.submitTest(targetId, userAnswers);
      setResult(evalResult);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      alert('Lỗi nộp bài thi: ' + (err?.message || 'Lỗi mạng'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Current active question
  const currentQuestion = test?.questions[currentQuestionIndex];
  const totalQuestions = test?.questions.length || 0;
  const answeredCount = Object.keys(userAnswers).length;
  const unansweredCount = totalQuestions - answeredCount;

  // Auto switch passage when question has passageId
  useEffect(() => {
    if (currentQuestion?.passageId && currentQuestion.passageId !== activePassageId) {
      setActivePassageId(currentQuestion.passageId);
    }
  }, [currentQuestionIndex, currentQuestion, activePassageId]);

  const activePassage = useMemo<PlacementPassage | undefined>(() => {
    if (!test?.passages) return undefined;
    return test.passages.find((p) => p.id === activePassageId) || test.passages[0];
  }, [test, activePassageId]);

  // Filtered review results
  const filteredReviewQuestions = useMemo(() => {
    if (!result) return [];
    return result.detailedResults.filter((q) => {
      if (reviewFilter === 'CORRECT') return q.isCorrect;
      if (reviewFilter === 'INCORRECT') return !q.isCorrect && q.userAnswer !== 'UNANSWERED';
      if (reviewFilter === 'UNANSWERED') return q.userAnswer === 'UNANSWERED';
      return true;
    });
  }, [result, reviewFilter]);

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loading-spinner" />
        <p style={{ marginTop: '1rem', color: '#64748b', fontWeight: 600 }}>Đang chuẩn bị phòng thi khảo thí trực tuyến...</p>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', padding: '2rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #fee2e2' }}>
        <span style={{ fontSize: '3rem' }}>⚠️</span>
        <h2 style={{ color: '#b91c1c', margin: '1rem 0 0.5rem' }}>Không thể tải bài thi</h2>
        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>{error || 'Bài thi không tồn tại.'}</p>
        <Link to="/placement-test" className="dash-quick-btn primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
          ← Quay lại danh sách bài test
        </Link>
      </div>
    );
  }

  // =========================================================================
  // RENDER: EXAM RESULT & COURSE RECOMMENDATION VIEW
  // =========================================================================
  if (result) {
    return (
      <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '2.5rem 1rem 5rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          {/* Back link */}
          <div style={{ marginBottom: '1.5rem' }}>
            <Link
              to="/placement-test"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: '#047857',
                fontWeight: 700,
                textDecoration: 'none',
                fontSize: '0.9rem',
              }}
            >
              <span>←</span>
              <span>Quay lại danh sách bài test đầu vào</span>
            </Link>
          </div>

          {/* Hero Scorecard */}
          <div
            style={{
              background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)',
              borderRadius: '24px',
              color: '#ffffff',
              padding: '2.5rem 2rem',
              boxShadow: '0 12px 36px rgba(4, 120, 87, 0.25)',
              marginBottom: '2.5rem',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '2rem',
                alignItems: 'center',
                position: 'relative',
                zIndex: 2,
              }}
            >
              {/* Left Column: Band Prediction & Score */}
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    padding: '4px 12px',
                    borderRadius: '999px',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    color: '#fef3c7',
                    marginBottom: '1rem',
                  }}
                >
                  <span>🎉</span>
                  <span>KẾT QUẢ KHẢO THÍ CHUẨN XÁC</span>
                </div>

                <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.3rem)', fontWeight: 900, margin: '0 0 0.5rem', lineHeight: 1.2 }}>
                  {result.testTitle}
                </h1>

                <p style={{ margin: '0 0 1.5rem', color: '#e2e8f0', fontSize: '0.95rem', lineHeight: 1.5 }}>
                  {result.summaryFeedback}
                </p>

                {/* Score Pills */}
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '10px 16px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
                    <div style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 600 }}>Điểm số đạt được</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#ffffff', marginTop: '2px' }}>
                      {result.score} / {result.totalQuestions} <span style={{ fontSize: '0.9rem', color: '#fcd34d' }}>({result.scorePercentage}%)</span>
                    </div>
                  </div>

                  <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '10px 16px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
                    <div style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 600 }}>Phân hạng trình độ</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
                      {result.levelName}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Giant Band Badge */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    color: '#064e3b',
                    borderRadius: '24px',
                    padding: '2rem 2.5rem',
                    textAlign: 'center',
                    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.2)',
                    minWidth: '240px',
                  }}
                >
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    DỰ ĐOÁN BAND ĐIỂM
                  </div>
                  <div style={{ fontSize: '4.5rem', fontWeight: 900, color: '#047857', lineHeight: 1, margin: '0.5rem 0' }}>
                    {result.predictedBand}
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#b45309', backgroundColor: '#fef3c7', padding: '4px 12px', borderRadius: '999px', display: 'inline-block' }}>
                    Khoảng Band: {result.bandRange}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Skill Breakdown Radar/Bars */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              padding: '1.75rem 2rem',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              border: '1px solid #e2e8f0',
              marginBottom: '2.5rem',
            }}
          >
            <h2 style={{ margin: '0 0 1.25rem', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
              📊 Phân Tích Năng Lực Chi Tiết Theo Kỹ Năng
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
              {result.skillBreakdown.map((item) => (
                <div
                  key={item.skill}
                  style={{
                    padding: '1rem',
                    borderRadius: '14px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>{item.skill}</span>
                    <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#047857' }}>
                      {item.correct}/{item.total} ({item.percentage}%)
                    </span>
                  </div>

                  <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${item.percentage}%`,
                        height: '100%',
                        backgroundColor: item.percentage >= 75 ? '#059669' : item.percentage >= 50 ? '#f59e0b' : '#ef4444',
                        borderRadius: '999px',
                        transition: 'width 0.6s ease',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* =========================================================================
              COURSE RECOMMENDATIONS SECTION (GỢI Ý KHÓA HỌC TỐI ƯU)
              ========================================================================= */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              padding: '2.5rem 2rem',
              boxShadow: '0 8px 30px rgba(4, 120, 87, 0.12)',
              border: '2px solid #059669',
              marginBottom: '3rem',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.75rem' }}>🎯</span>
              <div>
                <span style={{ color: '#047857', fontWeight: 800, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  GỢI Ý LỘ TRÌNH KHÓA HỌC DÀNH RIÊNG CHO BẠN
                </span>
                <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: '#0f172a' }}>
                  Khóa Học EduCenter Được Khuyến Nghị Tối Ưu Nhất
                </h2>
              </div>
            </div>

            <p style={{ margin: '0.5rem 0 1.75rem', color: '#64748b', fontSize: '0.95rem' }}>
              Dựa trên kết quả bài thi kiểm tra đầu vào và phân tích các điểm cần cải thiện, EduCenter đề xuất lộ trình khóa học phù hợp nhất giúp bạn tiết kiệm thời gian và đảm bảo chuẩn đầu ra.
            </p>

            {/* Primary Recommended Course Card */}
            <div
              style={{
                backgroundColor: '#f0fdf4',
                borderRadius: '18px',
                border: '1.5px solid #a7f3d0',
                padding: '2rem',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <span
                    style={{
                      backgroundColor: '#059669',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.78rem',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      letterSpacing: '0.02em',
                    }}
                  >
                    ⭐ {result.primaryCourse.badge}
                  </span>
                  <h3 style={{ margin: '0.75rem 0 0.35rem', fontSize: '1.45rem', fontWeight: 900, color: '#064e3b' }}>
                    {result.primaryCourse.title}
                  </h3>
                  <div style={{ fontSize: '0.88rem', color: '#047857', fontWeight: 700 }}>
                    Mã khóa: {result.primaryCourse.code} • Mục tiêu đầu ra: Band {result.primaryCourse.targetLevel} • Thời lượng: {result.primaryCourse.durationWeeks} tuần
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Học phí ưu đãi trọn gói:</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#047857', marginTop: '2px' }}>
                    {result.primaryCourse.tuitionFee.toLocaleString('vi-VN')} đ
                  </div>
                </div>
              </div>

              {/* Why recommended box */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  padding: '1rem 1.25rem',
                  borderRadius: '12px',
                  border: '1px solid #d1fae5',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ fontWeight: 800, color: '#064e3b', fontSize: '0.88rem', marginBottom: '4px' }}>
                  💡 Lý do khóa học này là bước đi hoàn hảo nhất cho bạn:
                </div>
                <div style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.5 }}>
                  {result.primaryCourse.whyRecommended}
                </div>
              </div>

              {/* Highlights checklist */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem', marginBottom: '8px' }}>
                  Điểm nổi bật của chương trình đào tạo:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '8px' }}>
                  {result.primaryCourse.highlights.map((h, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', color: '#334155' }}>
                      <span style={{ color: '#059669', fontWeight: 900 }}>✓</span>
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <Link
                  to="/courses"
                  style={{
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    padding: '0.75rem 1.75rem',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)',
                  }}
                >
                  <span>Đăng Ký Khóa Học Ngay</span>
                  <span>→</span>
                </Link>

                <a
                  href="tel:19006868"
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#047857',
                    border: '1.5px solid #a7f3d0',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>📞 Tư Vấn Lịch Học &amp; Ưu Đãi</span>
                </a>
              </div>
            </div>

            {/* Secondary Courses (Alternative options) */}
            {result.secondaryCourses.length > 0 && (
              <div style={{ marginTop: '1.5rem' }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#334155', marginBottom: '0.75rem' }}>
                  📚 Khóa học bổ trợ hoặc mục tiêu kế tiếp:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                  {result.secondaryCourses.map((sec) => (
                    <div
                      key={sec.code}
                      style={{
                        backgroundColor: '#f8fafc',
                        borderRadius: '14px',
                        border: '1px solid #e2e8f0',
                        padding: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <span style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', fontSize: '0.72rem', fontWeight: 800, padding: '3px 8px', borderRadius: '4px' }}>
                          {sec.badge}
                        </span>
                        <h4 style={{ margin: '0.5rem 0 0.25rem', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                          {sec.title}
                        </h4>
                        <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.75rem' }}>
                          Mục tiêu: {sec.targetLevel} • Học phí: {sec.tuitionFee.toLocaleString('vi-VN')} đ
                        </div>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569', lineHeight: 1.5 }}>
                          {sec.description}
                        </p>
                      </div>

                      <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0' }}>
                        <Link
                          to="/courses"
                          style={{
                            color: '#047857',
                            fontWeight: 700,
                            fontSize: '0.84rem',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <span>Xem chi tiết khóa học</span>
                          <span>→</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* =========================================================================
              DETAILED QUESTION REVIEW & EXPLANATIONS (XEM LẠI ĐÁP ÁN & LỜI GIẢI)
              ========================================================================= */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              padding: '2rem',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                  📖 Đáp Án &amp; Lời Giải Thích Chi Tiết Từng Câu
                </h2>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Học từ những lỗi sai để cải thiện phản xạ và ghi nhớ ngữ pháp / từ vựng học thuật
                </span>
              </div>

              {/* Filter Tabs */}
              <div style={{ display: 'flex', gap: '6px', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
                <button
                  type="button"
                  onClick={() => setReviewFilter('ALL')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    backgroundColor: reviewFilter === 'ALL' ? '#ffffff' : 'transparent',
                    color: reviewFilter === 'ALL' ? '#064e3b' : '#64748b',
                  }}
                >
                  Tất cả ({result.detailedResults.length})
                </button>
                <button
                  type="button"
                  onClick={() => setReviewFilter('CORRECT')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    backgroundColor: reviewFilter === 'CORRECT' ? '#ffffff' : 'transparent',
                    color: reviewFilter === 'CORRECT' ? '#047857' : '#64748b',
                  }}
                >
                  ✓ Câu đúng ({result.detailedResults.filter((q) => q.isCorrect).length})
                </button>
                <button
                  type="button"
                  onClick={() => setReviewFilter('INCORRECT')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    backgroundColor: reviewFilter === 'INCORRECT' ? '#ffffff' : 'transparent',
                    color: reviewFilter === 'INCORRECT' ? '#b91c1c' : '#64748b',
                  }}
                >
                  ✕ Câu sai ({result.detailedResults.filter((q) => !q.isCorrect && q.userAnswer !== 'UNANSWERED').length})
                </button>
              </div>
            </div>

            {/* Questions List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {filteredReviewQuestions.map((q) => (
                <div
                  key={q.id}
                  style={{
                    padding: '1.25rem',
                    borderRadius: '14px',
                    border: q.isCorrect ? '1.5px solid #a7f3d0' : '1.5px solid #fecaca',
                    backgroundColor: q.isCorrect ? '#f0fdf4' : '#fff5f5',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          backgroundColor: q.isCorrect ? '#059669' : '#dc2626',
                          color: '#ffffff',
                          fontWeight: 800,
                          fontSize: '0.8rem',
                          padding: '2px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        Câu {q.questionNumber}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>{q.section}</span>
                    </div>

                    <span
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        color: q.isCorrect ? '#047857' : '#b91c1c',
                      }}
                    >
                      {q.isCorrect ? '✓ Đúng' : q.userAnswer === 'UNANSWERED' ? '⚠️ Chưa trả lời' : '✕ Sai'}
                    </span>
                  </div>

                  <p style={{ margin: '0 0 1rem', fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.5 }}>
                    {q.questionText}
                  </p>

                  {/* Options List */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '6px', marginBottom: '1rem' }}>
                    {q.options.map((opt) => {
                      const isChosen = q.userAnswer === opt.key;
                      const isKey = q.correctAnswer === opt.key;

                      let optBg = '#ffffff';
                      let optBorder = '#e2e8f0';
                      let optColor = '#334155';

                      if (isKey) {
                        optBg = '#dcfce7';
                        optBorder = '#86efac';
                        optColor = '#065f46';
                      } else if (isChosen && !q.isCorrect) {
                        optBg = '#fee2e2';
                        optBorder = '#fca5a5';
                        optColor = '#991b1b';
                      }

                      return (
                        <div
                          key={opt.key}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: `1px solid ${optBorder}`,
                            backgroundColor: optBg,
                            color: optColor,
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontWeight: isKey || isChosen ? 700 : 500,
                          }}
                        >
                          <span style={{ fontWeight: 800 }}>{opt.key}.</span>
                          <span>{opt.text}</span>
                          {isKey && <span style={{ marginLeft: 'auto', color: '#059669', fontSize: '0.75rem' }}>[Đáp án đúng]</span>}
                          {isChosen && !isKey && <span style={{ marginLeft: 'auto', color: '#dc2626', fontSize: '0.75rem' }}>[Lựa chọn của bạn]</span>}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation box */}
                  <div
                    style={{
                      backgroundColor: '#ffffff',
                      padding: '0.85rem 1rem',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.84rem',
                      color: '#334155',
                      lineHeight: 1.5,
                    }}
                  >
                    <strong style={{ color: '#047857' }}>💡 Giải thích chi tiết: </strong>
                    {q.explanation}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Actions */}
            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  setUserAnswers({});
                  setFlaggedQuestions({});
                  setCurrentQuestionIndex(0);
                  setTimeLeftSeconds(test.durationMinutes * 60);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="dash-quick-btn"
                style={{ padding: '0.75rem 1.5rem', fontWeight: 700 }}
              >
                🔄 Làm Lại Bài Thi Này
              </button>

              <Link
                to="/placement-test"
                className="dash-quick-btn primary"
                style={{ padding: '0.75rem 1.5rem', fontWeight: 700, textDecoration: 'none' }}
              >
                🎯 Chọn Bài Test Khác
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER: EXAM TAKING INTERFACE (PHÒNG THI TRỰC TUYẾN)
  // =========================================================================
  const isPassageBased = Boolean(test.passages && test.passages.length > 0);

  return (
    <div style={{ backgroundColor: '#f1f5f9', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Sticky Exam Top Bar */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: '#0f172a',
          color: '#ffffff',
          padding: '0.75rem 1.5rem',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Bạn có chắc chắn muốn rời khỏi phòng thi? Kết quả hiện tại sẽ không được lưu.')) {
                navigate('/placement-test');
              }
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '1.25rem',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Thoát phòng thi"
          >
            ←
          </button>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc' }}>
              {test.title}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Câu hỏi: <strong style={{ color: '#fcd34d' }}>{currentQuestionIndex + 1}</strong> / {totalQuestions} • Đã làm: {answeredCount}/{totalQuestions}
            </div>
          </div>
        </div>

        {/* Timer & Submit Group */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {/* Countdown Clock */}
          <div
            style={{
              backgroundColor: timeLeftSeconds <= 300 ? '#7f1d1d' : 'rgba(255, 255, 255, 0.1)',
              border: timeLeftSeconds <= 300 ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.2)',
              color: timeLeftSeconds <= 300 ? '#fca5a5' : '#ffffff',
              padding: '6px 14px',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '1.1rem',
              fontVariantNumeric: 'tabular-nums',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>⏱️</span>
            <span>{formatTime(timeLeftSeconds)}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            style={{
              backgroundColor: '#059669',
              color: '#ffffff',
              border: 'none',
              padding: '0.6rem 1.25rem',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)',
            }}
          >
            <span>Nộp Bài Thi</span>
            <span>✓</span>
          </button>
        </div>
      </header>

      {/* Main Split Screen Area */}
      <main
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: isPassageBased ? '1fr 1fr' : '1fr',
          gap: '1rem',
          padding: '1rem',
          maxWidth: '1600px',
          width: '100%',
          margin: '0 auto',
          boxSizing: 'border-box',
        }}
      >
        {/* Left Pane: Reading Passage (if applicable) */}
        {isPassageBased && activePassage && (
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #cbd5e1',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              padding: '1.5rem',
              overflowY: 'auto',
              maxHeight: 'calc(100vh - 170px)',
            }}
          >
            {/* Passage tabs if multiple */}
            {test.passages && test.passages.length > 1 && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                {test.passages.map((p, idx) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setActivePassageId(p.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      backgroundColor: activePassageId === p.id ? '#047857' : '#f1f5f9',
                      color: activePassageId === p.id ? '#ffffff' : '#64748b',
                    }}
                  >
                    Bài đọc {idx + 1}
                  </button>
                ))}
              </div>
            )}

            <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
              {activePassage.title}
            </h3>
            {activePassage.subtitle && (
              <div style={{ fontSize: '0.85rem', color: '#047857', fontWeight: 700, marginBottom: '1.25rem' }}>
                {activePassage.subtitle}
              </div>
            )}

            <div
              style={{
                fontSize: '0.95rem',
                color: '#334155',
                lineHeight: 1.8,
                whiteSpace: 'pre-line',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              {activePassage.content}
            </div>
          </div>
        )}

        {/* Right Pane: Question & Options */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            maxHeight: 'calc(100vh - 170px)',
            overflowY: 'auto',
          }}
        >
          {currentQuestion && (
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #cbd5e1',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                padding: '1.75rem',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Question Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      backgroundColor: '#047857',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      padding: '4px 10px',
                      borderRadius: '8px',
                    }}
                  >
                    Câu {currentQuestion.questionNumber}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                    {currentQuestion.section}
                  </span>
                </div>

                {/* Flag for review button */}
                <button
                  type="button"
                  onClick={() => handleToggleFlag(currentQuestion.id)}
                  style={{
                    backgroundColor: flaggedQuestions[currentQuestion.id] ? '#fef3c7' : '#f8fafc',
                    color: flaggedQuestions[currentQuestion.id] ? '#b45309' : '#64748b',
                    border: flaggedQuestions[currentQuestion.id] ? '1px solid #fcd34d' : '1px solid #e2e8f0',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>{flaggedQuestions[currentQuestion.id] ? '🚩 Đã cắm cờ' : '🏳️ Đặt cờ xem lại'}</span>
                </button>
              </div>

              {/* Question Text */}
              <h2
                style={{
                  margin: '0 0 1.5rem',
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  lineHeight: 1.5,
                }}
              >
                {currentQuestion.questionText}
              </h2>

              {/* Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                {currentQuestion.options.map((opt) => {
                  const isSelected = userAnswers[currentQuestion.id] === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => handleSelectAnswer(currentQuestion.id, opt.key)}
                      style={{
                        padding: '1rem 1.25rem',
                        borderRadius: '12px',
                        border: isSelected ? '2px solid #059669' : '1px solid #cbd5e1',
                        backgroundColor: isSelected ? '#ecfdf5' : '#ffffff',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: isSelected ? '#059669' : '#f1f5f9',
                          color: isSelected ? '#ffffff' : '#475569',
                          display: 'grid',
                          placeItems: 'center',
                          fontWeight: 800,
                          fontSize: '0.9rem',
                          flexShrink: 0,
                        }}
                      >
                        {opt.key}
                      </span>
                      <span style={{ fontSize: '0.95rem', color: isSelected ? '#064e3b' : '#334155', fontWeight: isSelected ? 700 : 500 }}>
                        {opt.text}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Next & Previous navigation buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                <button
                  type="button"
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                  style={{
                    padding: '0.65rem 1.25rem',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: currentQuestionIndex === 0 ? '#f1f5f9' : '#ffffff',
                    color: currentQuestionIndex === 0 ? '#94a3b8' : '#334155',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  ← Câu Trước
                </button>

                {currentQuestionIndex < totalQuestions - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentQuestionIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                    style={{
                      padding: '0.65rem 1.5rem',
                      borderRadius: '10px',
                      border: 'none',
                      backgroundColor: '#047857',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                    }}
                  >
                    Câu Tiếp Theo →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(true)}
                    style={{
                      padding: '0.65rem 1.5rem',
                      borderRadius: '10px',
                      border: 'none',
                      backgroundColor: '#059669',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)',
                    }}
                  >
                    Hoàn Thành &amp; Nộp Bài ✓
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Palette Question Navigator Box */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #cbd5e1',
              padding: '1.25rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
              <span>BẢNG ĐIỀU HƯỚNG CÂU HỎI ({totalQuestions} CÂU)</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#059669' }} /> Đã làm
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b' }} /> Cắm cờ
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#e2e8f0' }} /> Chưa làm
                </span>
              </div>
            </div>

            {/* Questions Number Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(36px, 1fr))',
                gap: '6px',
              }}
            >
              {test.questions.map((q, idx) => {
                const isCurrent = idx === currentQuestionIndex;
                const isAnswered = Boolean(userAnswers[q.id]);
                const isFlagged = Boolean(flaggedQuestions[q.id]);

                let bg = '#f8fafc';
                let color = '#475569';
                let border = '1px solid #e2e8f0';

                if (isAnswered) {
                  bg = '#ecfdf5';
                  color = '#047857';
                  border = '1px solid #a7f3d0';
                }
                if (isFlagged) {
                  bg = '#fef3c7';
                  color = '#b45309';
                  border = '1px solid #fcd34d';
                }
                if (isCurrent) {
                  border = '2px solid #0f172a';
                }

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentQuestionIndex(idx)}
                    style={{
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: bg,
                      color: color,
                      border: border,
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'grid',
                      placeItems: 'center',
                      position: 'relative',
                    }}
                  >
                    {idx + 1}
                    {isFlagged && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '-3px',
                          right: '-3px',
                          fontSize: '0.6rem',
                        }}
                      >
                        🚩
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Confirmation Modal Before Submit */}
      {showConfirmModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              padding: '2rem',
              maxWidth: '460px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
              {unansweredCount > 0 ? '⚠️' : '📝'}
            </div>

            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.35rem', fontWeight: 900, color: '#0f172a' }}>
              Xác Nhận Nộp Bài Thi
            </h3>

            {unansweredCount > 0 ? (
              <p style={{ margin: '0 0 1.5rem', fontSize: '0.9rem', color: '#b45309', lineHeight: 1.5 }}>
                Bạn vẫn còn <strong style={{ color: '#b91c1c' }}>{unansweredCount} câu hỏi chưa trả lời</strong>. Bạn có chắc chắn muốn nộp bài thi ngay bây giờ không?
              </p>
            ) : (
              <p style={{ margin: '0 0 1.5rem', fontSize: '0.9rem', color: '#64748b', lineHeight: 1.5 }}>
                Bạn đã hoàn thành toàn bộ {totalQuestions} câu hỏi. Hệ thống sẽ chấm điểm và phân tích gợi ý khóa học ngay lập tức.
              </p>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                style={{
                  padding: '0.65rem 1.25rem',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#f8fafc',
                  color: '#475569',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                }}
              >
                Tiếp tục làm bài
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={executeSubmit}
                style={{
                  padding: '0.65rem 1.5rem',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)',
                }}
              >
                {isSubmitting ? 'Đang chấm điểm...' : 'Đồng ý nộp bài'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlacementTestDetailPage;
