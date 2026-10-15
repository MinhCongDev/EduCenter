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
    <div className="dashboard-layout" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#052F2E' }}>
      <Navbar />
      <main className="dashboard-main-content" style={{ flex: 1 }}>
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default DashboardLayout;
