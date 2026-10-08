import React from 'react';

const CoursesPage: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Available Courses</h1>
        <p>Explore our wide range of courses and programs</p>
      </div>
      <div className="placeholder-content">
        <div className="placeholder-icon">📚</div>
        <h2>Courses coming soon</h2>
        <p>Course listings will be available once the backend is configured.</p>
      </div>
    </div>
  );
};

export default CoursesPage;
