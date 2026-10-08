import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const DirectorDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Director Dashboard</h1>
        <p>Welcome back, <strong>{user?.fullName}</strong>!</p>
      </div>
      <div className="dashboard-grid">
        {[
          { icon: '💰', label: 'Revenue', value: '–' },
          { icon: '👩‍🎓', label: 'Total Students', value: '–' },
          { icon: '👨‍🏫', label: 'Total Teachers', value: '–' },
          { icon: '📚', label: 'Total Courses', value: '–' },
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
        <p>📡 Connect the backend to see real reports and analytics.</p>
      </div>
    </div>
  );
};

export default DirectorDashboard;
