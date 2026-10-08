import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const UnauthorizedPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="error-page">
      <div className="error-content">
        <div className="error-code">403</div>
        <h1 className="error-title">Access Denied</h1>
        <p className="error-message">
          You don&apos;t have permission to access this page.
          {user && ` Your current role is: ${user.role}.`}
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

export default UnauthorizedPage;
