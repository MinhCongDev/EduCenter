import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-logo">
              <span className="logo-icon">🎓</span>
              <span className="logo-text">EduCenter</span>
            </div>
            <p className="footer-tagline">
              A modern training center management system designed to streamline education operations.
            </p>
          </div>

          <div className="footer-links-group">
            <h3 className="footer-heading">Navigation</h3>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/courses">Courses</Link></li>
              <li><Link to="/announcements">Announcements</Link></li>
            </ul>
          </div>

          <div className="footer-links-group">
            <h3 className="footer-heading">Account</h3>
            <ul className="footer-links">
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/register">Register</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} EduCenter. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
