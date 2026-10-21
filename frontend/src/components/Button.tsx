import React, { type ButtonHTMLAttributes, type ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
}

const VARIANTS: Record<Variant, React.CSSProperties> = {
  primary: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    color: 'white',
    border: '1px solid #2563eb',
  },
  secondary: {
    background: 'white',
    color: '#475569',
    border: '1px solid #cbd5e1',
  },
  danger: {
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: 'white',
    border: '1px solid #dc2626',
  },
  success: {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    border: '1px solid #059669',
  },
  ghost: {
    background: 'transparent',
    color: '#475569',
    border: '1px solid transparent',
  },
};

const SIZES: Record<Size, React.CSSProperties> = {
  sm: { padding: '0.35rem 0.75rem', fontSize: '0.8rem' },
  md: { padding: '0.55rem 1.1rem', fontSize: '0.9rem' },
  lg: { padding: '0.75rem 1.5rem', fontSize: '1rem' },
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  icon,
  fullWidth,
  loading,
  disabled,
  children,
  style,
  ...rest
}) => {
  const isDisabled = disabled || loading;
  return (
    <button
      {...rest}
      disabled={isDisabled}
      style={{
        ...VARIANTS[variant],
        ...SIZES[size],
        borderRadius: '8px',
        fontWeight: 600,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.65 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap',
        width: fullWidth ? '100%' : undefined,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!isDisabled && variant !== 'ghost') {
          (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
      }}
    >
      {loading ? <span>⏳</span> : icon}
      {children}
    </button>
  );
};
