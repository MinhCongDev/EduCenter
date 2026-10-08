import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types';

// Role-based dashboard path mapping
const getDashboardPath = (role: UserRole): string => {
  const paths: Record<UserRole, string> = {
    STUDENT: '/student/dashboard',
    TEACHER: '/teacher/dashboard',
    TRAINING_STAFF: '/staff/dashboard',
    DIRECTOR: '/director/dashboard',
  };
  return paths[role] || '/';
};

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand" aria-label="EduCenter Home">
          <div className="navbar-logo">
            <span className="logo-icon">🎓</span>
            <span className="logo-text">EduCenter</span>
          </div>
        </Link>

        <div className="navbar-links">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/courses" className="nav-link">Courses</Link>
          <Link to="/announcements" className="nav-link">Announcements</Link>
        </div>

        <div className="navbar-auth">
          {isAuthenticated && user ? (
            <div className="navbar-user">
              <Link to={getDashboardPath(user.role)} className="btn btn-ghost">
                Dashboard
              </Link>
              <div className="user-avatar" aria-label={`Logged in as ${user.fullName}`}>
                {user.fullName.charAt(0).toUpperCase()}
              </div>
              <button
                id="logout-button"
                type="button"
                className="btn btn-outline"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="navbar-guest">
              <Link to="/login" className="btn btn-ghost">Login</Link>
              <Link to="/register" id="register-btn" className="btn btn-primary">Get Started</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
