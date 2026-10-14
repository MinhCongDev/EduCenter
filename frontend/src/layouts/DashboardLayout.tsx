import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout for authenticated dashboard pages (Student, Teacher, Staff, Director)
 */
const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="dashboard-layout" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main className="dashboard-main-content" style={{ flex: 1, paddingTop: '96px', paddingBottom: '3rem', paddingLeft: '1.25rem', paddingRight: '1.25rem' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DashboardLayout;
