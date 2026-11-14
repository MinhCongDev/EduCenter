import React from 'react';
import type { Course } from '../types';
import { formatVND } from '../utils/format';

export interface CourseDetailModalProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
  onEnrollClass?: (classId: string, classCode: string) => void;
  enrollingClassId?: string | null;
  registrationNotice?: string | null;
  onRegisterCourse?: (course: Course) => void;
  alreadyEnrolled?: boolean;
}

export const CourseDetailModal: React.FC<CourseDetailModalProps> = ({
  course,
  isOpen,
  onClose,
  onEnrollClass,
  enrollingClassId,
  registrationNotice,
  onRegisterCourse,
  alreadyEnrolled = false,
}) => {
  if (!isOpen || !course) return null;

  return (
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
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '750px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.25)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
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
            type="button"
            onClick={onClose}
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
              display: 'grid',
              placeItems: 'center',
            }}
          >
            ✕
          </button>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <span
              style={{
                backgroundColor: '#FCD34D',
                color: '#07403F',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 800,
              }}
            >
              MÃ: {course.code}
            </span>
            <span
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: '#FFF',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.75rem',
              }}
            >
              {course.format || 'OFFLINE'}
            </span>
          </div>

          <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.4rem', fontWeight: 800 }}>
            {course.title}
          </h2>

          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: '#E2E8F0', flexWrap: 'wrap' }}>
            <span>🎯 Đầu vào: <strong>{course.entryLevel || 'Nền tảng'}</strong></span>
            <span>🏆 Mục tiêu: <strong>{course.targetLevel || 'IELTS 6.5+'}</strong></span>
            <span>⏱️ Thời lượng: <strong>{course.sessions || 30} buổi học</strong></span>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.75rem' }}>
          {registrationNotice && (
            <div
              style={{
                padding: '0.85rem 1rem',
                borderRadius: '8px',
                backgroundColor: '#ECFDF5',
                border: '1px solid #10B981',
                color: '#065F46',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span>🎉</span>
              <span>{registrationNotice}</span>
            </div>
          )}

          {/* Description */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ margin: '0 0 0.5rem', color: '#07403F', fontSize: '1rem', fontWeight: 700 }}>
              📖 Giới thiệu khóa học
            </h4>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569', lineHeight: 1.6 }}>
              {course.description || 'Khóa học được thiết kế chuẩn quốc tế theo khung năng lực IELTS.'}
            </p>
          </div>

          {/* Learning Objectives */}
          {course.learningObjectives &&
            (Array.isArray(course.learningObjectives)
              ? course.learningObjectives
              : [course.learningObjectives]
            ).filter(Boolean).length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ margin: '0 0 0.5rem', color: '#07403F', fontSize: '1rem', fontWeight: 700 }}>
                🎯 Mục tiêu học tập đạt được
              </h4>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#334155', lineHeight: 1.6 }}>
                {(Array.isArray(course.learningObjectives)
                  ? course.learningObjectives
                  : [course.learningObjectives]
                ).map((obj, i) => (
                  <li key={i} style={{ marginBottom: '0.25rem' }}>{obj}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Syllabus */}
          {course.syllabus &&
            (Array.isArray(course.syllabus)
              ? course.syllabus
              : [course.syllabus]
            ).filter(Boolean).length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ margin: '0 0 0.5rem', color: '#07403F', fontSize: '1rem', fontWeight: 700 }}>
                📊 Khung chương trình chi tiết
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {(Array.isArray(course.syllabus)
                  ? course.syllabus
                  : [course.syllabus]
                ).map((syl, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '0.65rem 0.85rem',
                      backgroundColor: '#F8FAFC',
                      borderRadius: '8px',
                      borderLeft: '3px solid #57D061',
                      fontSize: '0.85rem',
                      color: '#334155',
                    }}
                  >
                    {syl}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Classes Available */}
          {course.classes && course.classes.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ margin: '0 0 0.5rem', color: '#07403F', fontSize: '1rem', fontWeight: 700 }}>
                🏫 Các lớp học đang mở tuyển sinh
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {course.classes.map((cls) => (
                  <div
                    key={cls._id}
                    style={{
                      padding: '0.75rem',
                      backgroundColor: '#F0FDF4',
                      border: '1px solid #BBF7D0',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                    }}
                  >
                    <div>
                      <strong style={{ color: '#166534', fontSize: '0.9rem' }}>
                        {cls.classCode} - {cls.name || 'Lớp IELTS'}
                      </strong>
                      <div style={{ fontSize: '0.8rem', color: '#4B5563', marginTop: '2px' }}>
                        📍 {cls.room} | ⏰ {cls.scheduleDays?.join(', ')} ({cls.timeSlot})
                      </div>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#15803D', fontWeight: 700 }}>
                      Sĩ số: {cls.currentEnrollment}/{cls.capacity} học viên
                    </div>
                    {cls.status === 'OPEN' && onEnrollClass && (
                      <button
                        type="button"
                        onClick={() => onEnrollClass(cls._id, cls.classCode)}
                        disabled={enrollingClassId === cls._id}
                        style={{
                          padding: '0.45rem 0.9rem',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: enrollingClassId === cls._id ? '#94A3B8' : '#EC6E23',
                          color: '#FFFFFF',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          cursor: enrollingClassId === cls._id ? 'default' : 'pointer',
                        }}
                      >
                        {enrollingClassId === cls._id ? 'Đang ghi danh...' : '✍️ Ghi danh lớp này'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Price & Action footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '1.25rem',
              borderTop: '1px solid #E2E8F0',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <span style={{ display: 'block', fontSize: '0.8rem', color: '#64748B' }}>Học phí toàn khóa:</span>
              <strong style={{ fontSize: '1.5rem', color: '#EC6E23', fontWeight: 800 }}>
                {formatVND(course.tuitionFee || course.price || 0)}
              </strong>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '0.65rem 1.25rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFF',
                  color: '#475569',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Đóng
              </button>

              {alreadyEnrolled ? (
                <span
                  style={{
                    backgroundColor: '#ECFDF5',
                    color: '#065F46',
                    border: '1px solid #10B981',
                    padding: '0.65rem 1.25rem',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>✓</span>
                  <span>Đã Đăng Ký Khóa Học Này</span>
                </span>
              ) : onRegisterCourse ? (
                <button
                  type="button"
                  onClick={() => onRegisterCourse(course)}
                  style={{
                    padding: '0.65rem 1.75rem',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#EC6E23',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    boxShadow: '0 4px 12px rgba(236, 110, 35, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#d35b15';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#EC6E23';
                  }}
                >
                  <span>✍️</span>
                  <span>Đăng kí học</span>
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailModal;

