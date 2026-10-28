import React from 'react';
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
          <span>{routeInfo.category}</span>
          <span>/</span>
          <span className="current">{routeInfo.title}</span>
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
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            backgroundColor: '#f1f5f9',
            padding: '0.2rem 0.5rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}
          title="Demo Role Simulator (UI permissions only — not secure authentication)"
        >
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Demo Role:</span>
          <select
            className="form-select"
            style={{
              width: 'auto',
              padding: '0.2rem 1.6rem 0.2rem 0.5rem',
              fontSize: '0.78rem',
              height: 'auto',
              border: 'none',
              backgroundColor: '#ffffff',
              fontWeight: 700,
              color: role === 'Admin' ? 'var(--primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
            }}
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

        {/* User Profile / Avatar */}
        <div className="user-profile-btn" role="button" tabIndex={0} title={`Current User (${role} Role)`}>
          <div className="user-avatar-circle">
            <span>{role === 'Admin' ? 'SJ' : 'TM'}</span>
          </div>
          <div className="user-details">
            <span className="user-name">{role === 'Admin' ? 'Sarah Jenkins' : 'Field Operator'}</span>
            <span className="user-role">{role} (Demo)</span>
          </div>
          <ChevronDown size={14} color="#64748b" />
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
