import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { studentService } from '../../services/student.service';
import type { Assignment } from '../../types';

const AssignmentsPage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all');

  useEffect(() => {
    if (classId) {
      fetchAssignments();
    }
  }, [classId]);

  const fetchAssignments = async () => {
    try {
      setIsLoading(true);
      const res = await studentService.getAssignments(classId!);
      if (res.success && res.data) {
        setAssignments(res.data.assignments);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAssignment = async (assignment: Assignment) => {
    const content = prompt('Nhập nội dung bài nộp (link GitHub, mô tả, v.v.):');
    if (!content) return;

    try {
      setSubmittingId(assignment._id);
      const res = await studentService.submitAssignment({
        assignmentId: assignment._id,
        content,
        attachmentUrl: content,
      });

      if (res.success) {
        setAssignments(prev =>
          prev.map(a =>
            a._id === assignment._id
              ? { ...a, submissionStatus: 'SUBMITTED', submittedAt: new Date().toISOString() }
              : a
          )
        );
        alert('Nộp bài thành công!');
      } else {
        alert(res.message || 'Nộp bài thất bại');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi nộp bài');
    } finally {
      setSubmittingId(null);
    }
  };

  const filteredAssignments = assignments.filter(a => {
    if (filter === 'all') return true;
    if (filter === 'pending') return !a.submissionStatus;
    if (filter === 'submitted') return a.submissionStatus === 'SUBMITTED' || a.submissionStatus === 'LATE';
    if (filter === 'graded') return a.submissionStatus === 'GRADED';
    return true;
  });

  const getStatusBadge = (status: string | undefined) => {
    if (!status) return { class: 'badge-amber', text: '⏳ Chưa nộp' };
    switch (status) {
      case 'SUBMITTED':
        return { class: 'badge-blue', text: '✅ Đã nộp' };
      case 'LATE':
        return { class: 'badge-red', text: '⏰ Nộp trễ' };
      case 'GRADED':
        return { class: 'badge-green', text: '🏆 Đã chấm điểm' };
      default:
        return { class: 'badge-gray', text: status };
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && !assignments.find(a => new Date(a.dueDate) < new Date())?.submissionStatus;
  };

  if (isLoading) {
    return (
      <div className="dash-container" style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p>Đang tải danh sách bài tập...</p>
      </div>
    );
  }

  return (
    <div className="dash-container">
      {/* Header */}
      <div className="dash-banner" style={{ marginBottom: '1.5rem' }}>
        <div className="dash-banner-content">
          <div className="dash-banner-badge">📝 Danh Sách Bài Tập</div>
          <h1>Bài Tập Về Nhà</h1>
          <p>{assignments.length} bài tập được giao</p>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: '#fee2e2', borderRadius: '8px', marginBottom: '1rem', color: '#dc2626' }}>
          ❌ {error}
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: 'Tất cả', count: assignments.length },
          { key: 'pending', label: 'Chưa nộp', count: assignments.filter(a => !a.submissionStatus).length },
          { key: 'submitted', label: 'Đã nộp', count: assignments.filter(a => a.submissionStatus === 'SUBMITTED' || a.submissionStatus === 'LATE').length },
          { key: 'graded', label: 'Đã chấm', count: assignments.filter(a => a.submissionStatus === 'GRADED').length },
        ].map(tab => (
          <button
            key={tab.key}
            type="button"
            className={`dash-quick-btn ${filter === tab.key ? 'primary' : ''}`}
            onClick={() => setFilter(tab.key as any)}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Assignments List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredAssignments.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', background: '#f9fafb', borderRadius: '12px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
            <h3>Không có bài tập</h3>
            <p style={{ opacity: 0.7 }}>
              {filter === 'all' ? 'Lớp học chưa có bài tập nào' : 'Không có bài tập nào phù hợp với bộ lọc'}
            </p>
          </div>
        ) : (
          filteredAssignments.map(assignment => {
            const status = getStatusBadge(assignment.submissionStatus);
            const overdue = new Date(assignment.dueDate) < new Date() && !assignment.submissionStatus;

            return (
              <div key={assignment._id} className="dash-card" style={{ borderLeft: overdue ? '4px solid #ef4444' : undefined }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{assignment.title}</h3>
                      <span className={`badge-pill ${status.class}`}>{status.text}</span>
                      {overdue && <span className="badge-pill badge-red">⚠️ Quá hạn</span>}
                    </div>

                    {assignment.description && (
                      <p style={{ margin: '0.5rem 0', opacity: 0.8, fontSize: '0.9rem' }}>
                        {assignment.description}
                      </p>
                    )}

                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.85rem', opacity: 0.7 }}>
                      <span>📅 Hạn nộp: {new Date(assignment.dueDate).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                      <span>📊 Điểm tối đa: {assignment.maxScore}</span>
                      <span>📌 Trạng thái: {assignment.status === 'ACTIVE' ? 'Đang mở' : 'Đã đóng'}</span>
                    </div>

                    {assignment.submittedAt && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#10b981' }}>
                        ✅ Đã nộp lúc: {new Date(assignment.submittedAt).toLocaleString('vi-VN')}
                      </div>
                    )}
                  </div>

                  <div>
                    {!assignment.submissionStatus && assignment.status === 'ACTIVE' ? (
                      <button
                        type="button"
                        className="dash-quick-btn primary"
                        onClick={() => handleSubmitAssignment(assignment)}
                        disabled={submittingId === assignment._id}
                      >
                        {submittingId === assignment._id ? '⏳ Đang nộp...' : '📤 Nộp bài'}
                      </button>
                    ) : assignment.submissionStatus === 'GRADED' ? (
                      <button
                        type="button"
                        className="dash-quick-btn"
                        onClick={() => window.location.href = `/student/classes/${classId}/grades`}
                      >
                        📊 Xem điểm
                      </button>
                    ) : null}
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

export default AssignmentsPage;
