import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  count?: number;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  borderRadius = '6px',
  count = 1,
  style,
}) => {
  if (count > 1) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', ...style }}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            style={{
              width,
              height,
              borderRadius,
              background: 'linear-gradient(90deg, #e2e8f0 0%, #f1f5f9 50%, #e2e8f0 100%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.4s ease-in-out infinite',
            }}
          />
        ))}
        <style>{`@keyframes shimmer { from { background-position: 200% 0 } to { background-position: -200% 0 } }`}</style>
      </div>
    );
  }
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background: 'linear-gradient(90deg, #e2e8f0 0%, #f1f5f9 50%, #e2e8f0 100%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.4s ease-in-out infinite',
        ...style,
      }}
    >
      <style>{`@keyframes shimmer { from { background-position: 200% 0 } to { background-position: -200% 0 } }`}</style>
    </div>
  );
};

export const SkeletonCard: React.FC = () => (
  <div
    style={{
      background: 'white',
      borderRadius: '12px',
      padding: '1.25rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}
  >
    <Skeleton width="60%" height="1.25rem" />
    <div style={{ marginTop: '0.75rem' }}>
      <Skeleton count={3} height="0.9rem" />
    </div>
  </div>
);

export const SkeletonPage: React.FC<{ message?: string }> = ({ message = 'Đang tải...' }) => (
  <div className="dash-container" style={{ padding: '2rem 0' }}>
    <SkeletonCard />
    <div style={{ marginTop: '1.5rem' }}>
      <Skeleton width="40%" height="1.5rem" />
    </div>
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginTop: '1rem',
      }}
    >
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
    <p style={{ textAlign: 'center', marginTop: '2rem', opacity: 0.6 }}>⏳ {message}</p>
  </div>
);

export const EmptyState: React.FC<{
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}> = ({ icon = '📭', title, description, action }) => (
  <div
    style={{
      textAlign: 'center',
      padding: '3rem 1.5rem',
      background: 'var(--dash-card-subtle, #f8fafc)',
      borderRadius: '16px',
    }}
  >
    <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>{icon}</div>
    <h2 style={{ margin: 0, marginBottom: '0.5rem', fontSize: '1.1rem', color: '#0f172a' }}>{title}</h2>
    {description && (
      <p style={{ margin: 0, opacity: 0.65, marginBottom: action ? '1.5rem' : 0 }}>{description}</p>
    )}
    {action}
  </div>
);
