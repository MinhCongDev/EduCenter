import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { studentService } from '../../services/student.service';
import type { Grade } from '../../types';

const GradesPage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (classId) {
      fetchGrades();
    }
  }, [classId]);

  const fetchGrades = async () => {
    try {
      setIsLoading(true);
      const res = await studentService.getGrades(classId!);
      if (res.success && res.data) {
        setGrades(res.data.grades);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate stats
  const totalAssignments = grades.length;
  const gradedCount = grades.filter(g => g.grade?.score !== undefined).length;
  const averageScore = gradedCount > 0
    ? (grades.reduce((sum, g) => sum + (g.grade?.score || 0), 0) / gradedCount).toFixed(1)
    : 'N/A';

  const getScoreColor = (score: number | undefined, maxScore: number = 10) => {
    if (score === undefined) return '#6b7280';
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return '#10b981';
    if (percentage >= 60) return '#f59e0b';
    return '#ef4444';
  };

  if (isLoading) {
    return (
      <div className="dash-container" style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p>Đang tải điểm...</p>
      </div>
    );
  }

  return (
    <div className="dash-container">
      {/* Header */}
      <div className="dash-banner" style={{ marginBottom: '1.5rem' }}>
        <div className="dash-banner-content">
          <div className="dash-banner-badge">📊 Bảng Điểm</div>
          <h1>Kết Quả Học Tập</h1>
          <p>Theo dõi điểm số các bài tập đã nộp</p>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: '#fee2e2', borderRadius: '8px', marginBottom: '1rem', color: '#dc2626' }}>
          ❌ {error}
        </div>
      )}

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="dash-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📝</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{totalAssignments}</div>
          <div style={{ opacity: 0.7 }}>Tổng bài tập</div>
        </div>
        <div className="dash-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{gradedCount}</div>
          <div style={{ opacity: 0.7 }}>Đã chấm điểm</div>
        </div>
        <div className="dash-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📈</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: getScoreColor(parseFloat(averageScore)) }}>
            {averageScore}
          </div>
          <div style={{ opacity: 0.7 }}>Điểm trung bình</div>
        </div>
      </div>

      {/* Grades List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {grades.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', background: '#f9fafb', borderRadius: '12px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
            <h3>Chưa có điểm</h3>
            <p style={{ opacity: 0.7 }}>Bạn chưa nộp bài tập nào hoặc bài tập chưa được chấm điểm</p>
          </div>
        ) : (
          grades.map((item, index) => {
            const maxScore = item.assignment?.maxScore || 10;
            const hasGrade = item.grade?.score !== undefined;

            return (
              <div key={index} className="dash-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 0.5rem 0' }}>{item.assignment?.title || `Bài tập ${index + 1}`}</h3>
                    
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.85rem', opacity: 0.7 }}>
                      <span>📅 Hạn nộp: {item.assignment?.dueDate ? new Date(item.assignment.dueDate).toLocaleDateString('vi-VN') : 'N/A'}</span>
                      <span>📤 Đã nộp: {item.submission?.submittedAt ? new Date(item.submission.submittedAt).toLocaleDateString('vi-VN') : 'N/A'}</span>
                      <span>📊 Thang điểm: {maxScore}</span>
                    </div>

                    {hasGrade && item.grade?.feedback && (
                      <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#f9fafb', borderRadius: '8px', fontSize: '0.9rem' }}>
                        <strong>💬 Nhận xét của giảng viên:</strong>
                        <p style={{ margin: '0.25rem 0 0 0', fontStyle: 'italic' }}>{item.grade.feedback}</p>
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'center', minWidth: '120px' }}>
                    {hasGrade ? (
                      <>
                        <div style={{
                          fontSize: '2.5rem',
                          fontWeight: 700,
                          color: getScoreColor(item.grade?.score, maxScore)
                        }}>
                          {item.grade?.score?.toFixed(1)}
                        </div>
                        <div style={{ opacity: 0.5, fontSize: '0.85rem' }}>/ {maxScore}</div>
                        {item.grade?.gradedAt && (
                          <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.25rem' }}>
                            Chấm: {new Date(item.grade.gradedAt).toLocaleDateString('vi-VN')}
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ opacity: 0.5 }}>
                        <div style={{ fontSize: '1.5rem' }}>⏳</div>
                        <div>Chưa chấm</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Back Button */}
      <div style={{ marginTop: '1.5rem' }}>
        <button
          type="button"
          className="dash-quick-btn"
          onClick={() => window.history.back()}
        >
          ← Quay lại
        </button>
      </div>
    </div>
  );
};

export default GradesPage;
