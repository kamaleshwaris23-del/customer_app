import React from 'react';
import { NavLink } from 'react-router-dom';
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
} from 'lucide-react';
import { useCustomers } from '../../services/customerStorage';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { totalCount } = useCustomers();

  const mainNavItems = [
    {
      label: 'Dashboard',
      path: '/',
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
      badge: '5',
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
    },
    {
      label: 'Settings',
      path: '/settings',
      icon: <Settings size={19} />,
    },
  ];

  return (
    <aside className={`app-sidebar ${isOpen ? 'mobile-open' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-header">
        <NavLink to="/" className="brand-link" onClick={onClose}>
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
                  end={item.path === '/'}
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
            <span className="status-meta">Online • Storage v1 Active</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
