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
      E
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
