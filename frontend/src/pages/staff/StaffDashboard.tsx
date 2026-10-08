import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const StaffDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Training Staff Dashboard</h1>
        <p>Welcome back, <strong>{user?.fullName}</strong>!</p>
      </div>
      <div className="dashboard-grid">
        {[
          { icon: '👩‍🎓', label: 'Students', value: '–' },
          { icon: '👨‍🏫', label: 'Teachers', value: '–' },
          { icon: '📚', label: 'Courses', value: '–' },
          { icon: '🏫', label: 'Classes', value: '–' },
          { icon: '📋', label: 'Enrollments', value: '–' },
          { icon: '💳', label: 'Payments', value: '–' },
        ].map((card) => (
          <div key={card.label} className="stat-card">
            <span className="stat-icon">{card.icon}</span>
            <div className="stat-info">
              <span className="stat-value">{card.value}</span>
              <span className="stat-label">{card.label}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="dashboard-placeholder">
        <p>📡 Connect the backend to see real data.</p>
      </div>
    </div>
  );
};

export default StaffDashboard;
