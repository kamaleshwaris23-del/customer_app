import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, ChevronDown, LogOut, CheckCheck, X } from 'lucide-react';
import { useDemoRole } from '../../services/roleStorage';
import { logoutLocalSession } from '../../services/authStorage';

interface HeaderProps {
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, setDemoRole } = useDemoRole();
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const notificationContainerRef = useRef<HTMLDivElement>(null);
  const profileContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click or Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setNotificationMenuOpen(false);
        setProfileMenuOpen(false);
      }
    };

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (
        notificationContainerRef.current &&
        !notificationContainerRef.current.contains(e.target as Node)
      ) {
        setNotificationMenuOpen(false);
      }
      if (
        profileContainerRef.current &&
        !profileContainerRef.current.contains(e.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    };

    if (notificationMenuOpen || profileMenuOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handlePointerDown);
      document.addEventListener('touchstart', handlePointerDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [notificationMenuOpen, profileMenuOpen]);

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

        {/* Notification Bell with Functional Dropdown */}
        <div ref={notificationContainerRef} className="header-notification-container">
          <button
            type="button"
            className={`header-icon-btn ${notificationMenuOpen ? 'active' : ''}`}
            aria-label="Notifications"
            aria-haspopup="dialog"
            aria-expanded={notificationMenuOpen}
            title="Notifications"
            onClick={() => {
              setNotificationMenuOpen((prev) => !prev);
              setProfileMenuOpen(false);
            }}
          >
            <Bell size={18} />
          </button>

          {notificationMenuOpen && (
            <div
              className="header-notification-dropdown"
              role="dialog"
              aria-label="Notifications panel"
              aria-modal="false"
            >
              <div className="notification-dropdown-header">
                <div className="notification-dropdown-title-wrap">
                  <span className="notification-dropdown-title">Notifications</span>
                  <span className="notification-dropdown-badge">0 unread</span>
                </div>
                <button
                  type="button"
                  className="notification-dropdown-close"
                  aria-label="Close notifications panel"
                  onClick={() => setNotificationMenuOpen(false)}
                >
                  <X size={15} />
                </button>
              </div>

              <div className="notification-dropdown-body">
                <div className="notification-empty-state">
                  <div className="notification-empty-icon" aria-hidden="true">
                    <Bell size={24} strokeWidth={1.8} />
                  </div>
                  <h4 className="notification-empty-title">You're all caught up</h4>
                  <p className="notification-empty-desc">
                    No new notifications at this time. System updates and customer alerts will appear here.
                  </p>
                </div>
              </div>

              <div className="notification-dropdown-footer">
                <span className="notification-dropdown-status">
                  <CheckCheck size={13} style={{ color: '#10b981' }} />
                  Local system notifications
                </span>
              </div>
            </div>
          )}
        </div>

        {/* User Profile / Avatar with Viewport-Safe Dropdown */}
        <div ref={profileContainerRef} style={{ position: 'relative' }}>
          <div
            className={`user-profile-btn ${profileMenuOpen ? 'active' : ''}`}
            role="button"
            tabIndex={0}
            aria-haspopup="menu"
            aria-expanded={profileMenuOpen}
            title={`Current User (${role} Role)`}
            onClick={() => {
              setProfileMenuOpen((prev) => !prev);
              setNotificationMenuOpen(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setProfileMenuOpen((prev) => !prev);
                setNotificationMenuOpen(false);
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
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
