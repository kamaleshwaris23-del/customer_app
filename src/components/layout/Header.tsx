import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, ChevronDown, LogOut, CheckCheck, X } from 'lucide-react';
import { useAuthSession } from '../../services/authService';
import { ROLE_LABELS } from '../../types/auth';

interface HeaderProps {
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, logout } = useAuthSession();
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
        return { title: role === 'team_member' ? 'My Dashboard' : 'Dashboard', category: 'Overview' };
      case '/customers':
        return { title: role === 'team_member' ? 'My Customers' : 'Customer Directory', category: 'Data Collection' };
      case '/add-customer':
        return { title: 'Add New Customer', category: 'Data Collection' };
      case '/follow-ups':
        return { title: role === 'team_member' ? 'My Follow-ups' : 'Follow-ups & Reminders', category: 'Workflow' };
      case '/audit-logs':
        return { title: role === 'super_admin' ? 'Security Audit Logs' : 'My Activity History', category: 'Security' };
      case '/import-export':
        return { title: 'Import / Export Hub', category: 'Tools' };
      case '/team':
        return { title: role === 'super_admin' ? 'Team Management' : 'Team Overview', category: 'Administration' };
      case '/settings':
        return { title: 'System Settings', category: 'Administration' };
      default:
        return { title: 'Door2Life', category: 'Platform' };
    }
  };

  const routeInfo = getRouteInfo(location.pathname);

  // Compute initials
  const initials = (user?.full_name || 'User')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0].toUpperCase())
    .join('') || 'U';

  const roleLabel = role ? ROLE_LABELS[role] : 'Team Member';

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

      {/* Right: Search, Notifications, User Avatar */}
      <div className="header-right">
        {/* Search input */}
        <div className="header-search-wrap">
          <span className="header-search-icon">
            <Search size={15} />
          </span>
          <input
            type="text"
            className="header-search-input"
            placeholder="Search records..."
            aria-label="Search records"
          />
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
                    No new notifications at this time. Security alerts and customer updates will appear here.
                  </p>
                </div>
              </div>

              <div className="notification-dropdown-footer">
                <span className="notification-dropdown-status">
                  <CheckCheck size={13} style={{ color: '#10b981' }} />
                  System Notifications
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Authenticated User Profile with Viewport-Safe Dropdown */}
        <div ref={profileContainerRef} style={{ position: 'relative' }}>
          <div
            className={`user-profile-btn ${profileMenuOpen ? 'active' : ''}`}
            role="button"
            tabIndex={0}
            aria-haspopup="menu"
            aria-expanded={profileMenuOpen}
            title={`${user?.full_name || 'User'} (${roleLabel})`}
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
              <span>{initials}</span>
            </div>
            <div className="user-details">
              <span className="user-name">{user?.full_name || 'Authenticated User'}</span>
              <span className="user-role">{roleLabel}</span>
            </div>
            <ChevronDown size={14} color="#64748b" />
          </div>

          {profileMenuOpen && (
            <div className="header-profile-dropdown" role="menu">
              <div className="profile-dropdown-header">
                <div className="profile-dropdown-name">
                  {user?.full_name || 'User Profile'}
                </div>
                <div className="profile-dropdown-email">
                  {user?.email || 'user@door2life.local'}
                </div>
                <div className="profile-dropdown-badge">{roleLabel}</div>
              </div>
              <div className="profile-dropdown-divider" />
              <button
                type="button"
                className="profile-dropdown-item text-danger"
                onClick={async () => {
                  setProfileMenuOpen(false);
                  await logout();
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
