import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const AppLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="app-container">
      {/* Left Sidebar */}
      <Sidebar isOpen={mobileMenuOpen} onClose={closeMobileMenu} />

      {/* Mobile Backdrop Overlay */}
      <div
        className={`sidebar-backdrop ${mobileMenuOpen ? 'active' : ''}`}
        onClick={closeMobileMenu}
        aria-hidden="true"
      />

      {/* Main Viewport */}
      <div className="app-main-viewport">
        <Header onToggleMobileMenu={toggleMobileMenu} />
        <main className="page-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
