import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Clock,
  ArrowLeftRight,
  ShieldCheck,
  Settings,
  History,
  X,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { useCustomers } from '../../services/customerStorage';
import { useFollowUps } from '../../services/followUpStorage';
import { useAuthSession } from '../../services/authService';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { totalCount } = useCustomers();
  const { pendingCount } = useFollowUps();
  const { isSuperAdmin, isAdmin, logout } = useAuthSession();

  let mainNavItems: { label: string; path: string; icon: React.ReactNode; badge?: string }[] = [];
  let adminNavItems: { label: string; path: string; icon: React.ReactNode; badge?: string }[] = [];

  if (isSuperAdmin) {
    mainNavItems = [
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
    ];
    adminNavItems = [
      {
        label: 'Team Management',
        path: '/team',
        icon: <ShieldCheck size={19} />,
      },
      {
        label: 'Import / Export',
        path: '/import-export',
        icon: <ArrowLeftRight size={19} />,
      },
      {
        label: 'Settings',
        path: '/settings',
        icon: <Settings size={19} />,
      },
      {
        label: 'Audit Logs',
        path: '/audit-logs',
        icon: <History size={19} />,
      },
    ];
  } else if (isAdmin) {
    mainNavItems = [
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
    ];
    adminNavItems = [
      {
        label: 'Team Overview',
        path: '/team',
        icon: <ShieldCheck size={19} />,
      },
    ];
  } else {
    // Team Member
    mainNavItems = [
      {
        label: 'My Dashboard',
        path: '/dashboard',
        icon: <LayoutDashboard size={19} />,
      },
      {
        label: 'My Customers',
        path: '/customers',
        icon: <Users size={19} />,
      },
      {
        label: 'Add Customer',
        path: '/add-customer',
        icon: <UserPlus size={19} />,
      },
      {
        label: 'My Follow-ups',
        path: '/follow-ups',
        icon: <Clock size={19} />,
      },
      {
        label: 'My Activity',
        path: '/audit-logs',
        icon: <History size={19} />,
      },
    ];
    adminNavItems = [];
  }

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
          <div className="nav-section-title">
            {isSuperAdmin ? 'Main Menu' : isAdmin ? 'Main Menu' : 'My Workspace'}
          </div>
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

        {adminNavItems.length > 0 && (
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
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        <button
          type="button"
          onClick={async () => {
            await logout();
            onClose();
            navigate('/login');
          }}
          className="sidebar-logout-btn"
          title="Sign out of your account"
        >
          <LogOut size={15} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
