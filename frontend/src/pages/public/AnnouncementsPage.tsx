import React from 'react';

const AnnouncementsPage: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Announcements</h1>
        <p>Stay up to date with the latest news from EduCenter</p>
      </div>
      <div className="placeholder-content">
        <div className="placeholder-icon">📣</div>
        <h2>No announcements yet</h2>
        <p>Announcements from the training center will appear here.</p>
      </div>
    </div>
  );
};

export default AnnouncementsPage;
