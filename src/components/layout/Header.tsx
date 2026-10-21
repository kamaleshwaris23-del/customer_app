import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Search, Bell, ChevronDown } from 'lucide-react';

interface HeaderProps {
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const location = useLocation();

  // Helper to resolve title from pathname
  const getRouteInfo = (pathname: string) => {
    // Normalize trailing slash (except root '/')
    const normalizedPath =
      pathname.length > 1 && pathname.endsWith('/')
        ? pathname.slice(0, -1)
        : pathname;

    if (/^\/customers\/edit\/[^/]+$/.test(normalizedPath)) {
      return { title: 'Edit Customer Profile', category: 'Data Collection' };
    }

    switch (normalizedPath) {
      case '/':
        return { title: 'Dashboard', category: 'Overview' };
      case '/customers':
        return { title: 'Customer Directory', category: 'Data Collection' };
      case '/add-customer':
        return { title: 'Add New Customer', category: 'Data Collection' };
      case '/follow-ups':
        return { title: 'Follow-ups & Reminders', category: 'Workflow' };
      case '/import-export':
        return { title: 'Import / Export Hub', category: 'Tools' };
      case '/team':
        return { title: 'Team Members', category: 'Administration' };
      case '/settings':
        return { title: 'System Settings', category: 'Administration' };
      default:
        return { title: 'Door2Life', category: 'Platform' };
    }
  };

  const routeInfo = getRouteInfo(location.pathname);

  return (
    <header className="app-header">
      {/* Left: Mobile hamburger + Page Title & Breadcrumb */}
      <div className="header-left">
        <button
          type="button"
          className="mobile-menu-toggle"
          onClick={onToggleMobileMenu}
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        <div className="header-breadcrumb">
          <span>{routeInfo.category}</span>
          <span>/</span>
          <span className="current">{routeInfo.title}</span>
        </div>
      </div>

      {/* Right: Search, Notifications, Avatar placeholder */}
      <div className="header-right">
        {/* Search input placeholder */}
        <div className="header-search-wrap">
          <span className="header-search-icon">
            <Search size={15} />
          </span>
          <input
            type="text"
            className="header-search-input"
            placeholder="Search customers, ID, phone..."
            aria-label="Search records"
          />
        </div>

        {/* Notification Bell */}
        <button
          type="button"
          className="header-icon-btn"
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell size={18} />
          <span className="header-icon-badge" />
        </button>

        {/* User Profile / Avatar Placeholder */}
        <div className="user-profile-btn" role="button" tabIndex={0} title="User Profile">
          <div className="user-avatar-circle">
            <span>SJ</span>
          </div>
          <div className="user-details">
            <span className="user-name">Sarah Jenkins</span>
            <span className="user-role">Lead Admin</span>
          </div>
          <ChevronDown size={14} color="#64748b" />
        </div>
      </div>
    </header>
  );
};
