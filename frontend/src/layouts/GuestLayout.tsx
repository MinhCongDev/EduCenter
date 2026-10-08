import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

interface GuestLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout for public (Guest) pages: Home, Courses, Announcements, Login, Register
 */
const GuestLayout: React.FC<GuestLayoutProps> = ({ children }) => {
  return (
    <div className="guest-layout">
      <Navbar />
      <main className="main-content" id="main-content" role="main">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default GuestLayout;
