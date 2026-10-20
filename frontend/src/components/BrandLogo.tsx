import React from 'react';
import './BrandLogo.css';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  /** Use on dark/green backgrounds. */
  variant?: 'default' | 'light';
  /** Set to null to hide the line under the wordmark. */
  tagline?: string | null;
  className?: string;
}

/**
 * EduCenter wordmark: a green tile with an open-book glyph plus the name.
 * Replaces the emoji flag that used to stand in for a logo.
 */
const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  variant = 'default',
  tagline = 'IELTS ACADEMY',
  className,
}) => (
  <span className={`brand-logo brand-logo--${size} brand-logo--${variant}${className ? ` ${className}` : ''}`}>
    <span className="brand-logo__mark" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none">
        <path
          d="M12 6.4C9.9 5.1 7.3 4.5 4.2 4.6v12.2c3.1-.1 5.7.5 7.8 1.8 2.1-1.3 4.7-1.9 7.8-1.8V4.6c-3.1-.1-5.7.5-7.8 1.8Z"
          fill="currentColor"
        />
        <path d="M12 6.4v12.2" stroke="#308560" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    </span>
    <span className="brand-logo__text">
      <span className="brand-logo__name">
        Edu<span>Center</span>
      </span>
      {tagline && <span className="brand-logo__tagline">{tagline}</span>}
    </span>
  </span>
);

export default BrandLogo;
