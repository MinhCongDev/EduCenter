import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <div className="error-page">
      <div className="error-content">
        <div className="error-code">404</div>
        <h1 className="error-title">Page Not Found</h1>
        <p className="error-message">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="error-actions">
          <Link to="/" className="btn btn-primary">Go Home</Link>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => window.history.back()}
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
