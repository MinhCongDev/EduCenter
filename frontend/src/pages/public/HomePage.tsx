import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';


const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section" aria-labelledby="hero-heading">
        <div className="hero-content">
          <div className="hero-badge">🎓 Training Center Management</div>
          <h1 id="hero-heading" className="hero-title">
            Welcome to <span className="gradient-text">EduCenter</span>
          </h1>
          <p className="hero-subtitle">
            A modern, centralized platform for managing all your training center operations —
            from student enrollments to academic results, payments, and beyond.
          </p>
          <div className="hero-actions">
            {isAuthenticated ? (
              <Link to="/student/dashboard" className="btn btn-primary btn-lg">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/register" id="hero-register-btn" className="btn btn-primary btn-lg">
                  Get Started Free
                </Link>
                <Link to="/courses" className="btn btn-ghost btn-lg">
                  Browse Courses
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="hero-card hero-card-1">
            <span className="card-icon">📚</span>
            <span className="card-label">Courses</span>
          </div>
          <div className="hero-card hero-card-2">
            <span className="card-icon">👩‍🎓</span>
            <span className="card-label">Students</span>
          </div>
          <div className="hero-card hero-card-3">
            <span className="card-icon">📊</span>
            <span className="card-label">Reports</span>
          </div>
          <div className="hero-card hero-card-4">
            <span className="card-icon">💳</span>
            <span className="card-label">Payments</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" aria-labelledby="features-heading">
        <div className="section-header">
          <h2 id="features-heading">Everything You Need</h2>
          <p>A complete management solution for modern training centers</p>
        </div>
        <div className="features-grid">
          {features.map((feature) => (
            <div key={feature.title} className="feature-card">
              <div className="feature-icon" aria-hidden="true">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Roles Section */}
      <section className="roles-section" aria-labelledby="roles-heading">
        <div className="section-header">
          <h2 id="roles-heading">Built for Everyone</h2>
          <p>Role-based access tailored to every member of your training center</p>
        </div>
        <div className="roles-grid">
          {roles.map((role) => (
            <div key={role.title} className="role-card">
              <div className="role-icon" aria-hidden="true">{role.icon}</div>
              <h3 className="role-title">{role.title}</h3>
              <ul className="role-features">
                {role.features.map((f) => <li key={f}>✓ {f}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="cta-section" aria-labelledby="cta-heading">
          <div className="cta-content">
            <h2 id="cta-heading">Ready to get started?</h2>
            <p>Join EduCenter today and streamline your training center operations.</p>
            <Link to="/register" className="btn btn-primary btn-lg">
              Create Your Account
            </Link>
          </div>
        </section>
      )}
    </div>
  );
};

const features = [
  { icon: '📚', title: 'Course Management', description: 'Create and manage courses, track enrollments, and organize curricula.' },
  { icon: '🏫', title: 'Class Scheduling', description: 'Schedule classes, manage rooms, and prevent conflicts automatically.' },
  { icon: '👥', title: 'Student & Teacher Management', description: 'Maintain profiles, track performance, and manage assignments.' },
  { icon: '📝', title: 'Assignments & Grades', description: 'Create assignments, collect submissions, and publish grades efficiently.' },
  { icon: '✅', title: 'Attendance Tracking', description: 'Track attendance digitally and generate reports instantly.' },
  { icon: '💳', title: 'Payment Processing', description: 'Handle tuition payments with full transaction history and status tracking.' },
  { icon: '📣', title: 'Announcements', description: 'Broadcast important updates to students, teachers, and staff.' },
  { icon: '📊', title: 'Director Reports', description: 'Comprehensive dashboards and reports for center-wide insights.' },
];

const roles = [
  {
    icon: '👩‍🎓',
    title: 'Students',
    features: ['Enroll in classes', 'Submit assignments', 'View grades', 'Track attendance', 'Make payments'],
  },
  {
    icon: '👨‍🏫',
    title: 'Teachers',
    features: ['Manage classes', 'Create assignments', 'Grade submissions', 'Track attendance', 'View schedules'],
  },
  {
    icon: '🖥️',
    title: 'Training Staff',
    features: ['Manage all users', 'Handle enrollments', 'Process requests', 'Send notifications', 'Generate reports'],
  },
  {
    icon: '👔',
    title: 'Directors',
    features: ['View dashboards', 'Access all reports', 'Monitor revenue', 'Track performance', 'Make decisions'],
  },
];

export default HomePage;
