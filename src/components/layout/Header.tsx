import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, ChevronDown, LogOut } from 'lucide-react';
import { useDemoRole } from '../../services/roleStorage';
import { logoutLocalSession } from '../../services/authStorage';

interface HeaderProps {
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, setDemoRole } = useDemoRole();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

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
    if (/^\/customers\/[^/]+$/.test(normalizedPath)) {
      return { title: 'Customer Profile', category: 'Data Collection' };
    }

    switch (normalizedPath) {
      case '/':
      case '/welcome':
        return { title: 'Welcome Guide', category: 'Overview' };
      case '/dashboard':
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
          <span className="breadcrumb-category">{routeInfo.category}</span>
          <span className="breadcrumb-separator">/</span>
          <span className="current" title={routeInfo.title}>{routeInfo.title}</span>
        </div>
      </div>

      {/* Right: Search, Demo Role Switcher, Notifications, Avatar */}
      <div className="header-right">
        {/* Search input */}
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

        {/* Demo Role Selector Widget */}
        <div
          className="header-role-widget"
          title="Demo Role Simulator (UI permissions only — not secure authentication)"
        >
          <span className="header-role-label">Demo Role:</span>
          <select
            className="form-select header-role-select"
            value={role}
            onChange={(e) => setDemoRole(e.target.value as any)}
            aria-label="Demo role selector"
          >
            <option value="Admin">Admin</option>
            <option value="Team Member">Team Member</option>
          </select>
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

        {/* User Profile / Avatar with Viewport-Safe Dropdown */}
        <div style={{ position: 'relative' }}>
          <div
            className="user-profile-btn"
            role="button"
            tabIndex={0}
            title={`Current User (${role} Role)`}
            onClick={() => setProfileMenuOpen((prev) => !prev)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setProfileMenuOpen((prev) => !prev);
              }
            }}
          >
            <div className="user-avatar-circle">
              <span>{role === 'Admin' ? 'SJ' : 'TM'}</span>
            </div>
            <div className="user-details">
              <span className="user-name">{role === 'Admin' ? 'Sarah Jenkins' : 'Field Operator'}</span>
              <span className="user-role">{role} (Demo)</span>
            </div>
            <ChevronDown size={14} color="#64748b" />
          </div>

          {profileMenuOpen && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 45 }}
                onClick={() => setProfileMenuOpen(false)}
                aria-hidden="true"
              />
              <div className="header-profile-dropdown" role="menu">
                <div className="profile-dropdown-header">
                  <div className="profile-dropdown-name">
                    {role === 'Admin' ? 'Sarah Jenkins' : 'Field Operator'}
                  </div>
                  <div className="profile-dropdown-email">
                    {role === 'Admin' ? 'admin@door2life.local' : 'operator@door2life.local'}
                  </div>
                  <div className="profile-dropdown-badge">{role} Access</div>
                </div>
                <div className="profile-dropdown-divider" />
                <button
                  type="button"
                  className="profile-dropdown-item"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    navigate(role === 'Admin' ? '/settings' : '/customers');
                  }}
                >
                  {role === 'Admin' ? 'System Settings' : 'Customer Directory'}
                </button>
                <button
                  type="button"
                  className="profile-dropdown-item text-danger"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    logoutLocalSession();
                    navigate('/login');
                  }}
                >
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>

        {/* Sign Out Action Button */}
        <button
          type="button"
          className="header-icon-btn"
          aria-label="Sign Out"
          title="Sign Out of Session"
          onClick={() => {
            logoutLocalSession();
            navigate('/login');
          }}
          style={{ color: '#dc2626' }}
        >
          <LogOut size={17} />
        </button>
      </div>
    </header>
  );
};
