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
      <main className="dashboard-main-content" style={{ flex: 1, padding: '2rem 1rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DashboardLayout;
