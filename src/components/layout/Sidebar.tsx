import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Clock,
  ArrowLeftRight,
  ShieldCheck,
  Settings,
  X,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { useCustomers } from '../../services/customerStorage';
import { useFollowUps } from '../../services/followUpStorage';
import { useDemoRole } from '../../services/roleStorage';
import { logoutLocalSession } from '../../services/authStorage';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { totalCount } = useCustomers();
  const { pendingCount } = useFollowUps();
  const { role, isAdmin } = useDemoRole();

  const mainNavItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: <LayoutDashboard size={19} />,
    },
    {
      label: 'Customers',
      path: '/customers',
      icon: <Users size={19} />,
      badge: totalCount > 0 ? String(totalCount) : undefined,
    },
    {
      label: 'Add Customer',
      path: '/add-customer',
      icon: <UserPlus size={19} />,
    },
    {
      label: 'Follow-ups',
      path: '/follow-ups',
      icon: <Clock size={19} />,
      badge: pendingCount > 0 ? String(pendingCount) : undefined,
    },
    {
      label: 'Import / Export',
      path: '/import-export',
      icon: <ArrowLeftRight size={19} />,
    },
  ];

  const adminNavItems = [
    {
      label: 'Team Members',
      path: '/team',
      icon: <ShieldCheck size={19} />,
      badge: !isAdmin ? 'Admin' : undefined,
    },
    {
      label: 'Settings',
      path: '/settings',
      icon: <Settings size={19} />,
      badge: !isAdmin ? 'Admin' : undefined,
    },
  ];

  return (
    <aside className={`app-sidebar ${isOpen ? 'mobile-open' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-header">
        <NavLink to="/dashboard" className="brand-link" onClick={onClose}>
          <div className="brand-logo-mark">
            <Sparkles size={20} strokeWidth={2.5} />
          </div>
          <div className="brand-title-wrap">
            <span className="brand-name">
              Door<span>2</span>Life
            </span>
            <span className="brand-tagline">Data Platform</span>
          </div>
        </NavLink>

        <button
          type="button"
          className="sidebar-close-btn"
          onClick={onClose}
          aria-label="Close navigation sidebar"
        >
          <X size={20} />
        </button>
      </div>

      {/* Nav List */}
      <div className="sidebar-nav-container">
        <div>
          <div className="nav-section-title">Main Menu</div>
          <ul className="nav-list">
            {mainNavItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/dashboard'}
                  className={({ isActive }) =>
                    `nav-item-link ${isActive ? 'active' : ''}`
                  }
                  onClick={onClose}
                >
                  <span className="nav-item-icon">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge && <span className="nav-badge">{item.badge}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="nav-section-title">Administration</div>
          <ul className="nav-list">
            {adminNavItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `nav-item-link ${isActive ? 'active' : ''}`
                  }
                  onClick={onClose}
                >
                  <span className="nav-item-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        <div className="system-status-card">
          <div className="status-dot-pulse" />
          <div className="status-info">
            <span className="status-title">Door2Life Core</span>
            <span className="status-meta">Online • {role} Role (Demo)</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            logoutLocalSession();
            onClose();
            navigate('/login');
          }}
          style={{
            marginTop: '0.65rem',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.45rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            backgroundColor: '#ffffff',
            color: '#dc2626',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          title="Sign out of local session"
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
