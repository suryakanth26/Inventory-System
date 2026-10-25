import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  Layers,
  AlertTriangle,
  Truck,
  ArrowLeftRight,
  Users,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Store,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { RoleBadge } from '../ui/Badge';

export const Sidebar = ({ isCollapsed, setIsCollapsed, mobileOpen, setMobileOpen }) => {
  const { user, isAdmin, logout } = useAuth();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/products', label: 'Inventory', icon: Boxes },
    { to: '/categories', label: 'Categories', icon: Layers },
    { to: '/transactions', label: 'Stock Movements', icon: ArrowLeftRight },
    { to: '/low-stock', label: 'Low-Stock Alerts', icon: AlertTriangle, highlight: true },
    { to: '/suppliers', label: 'Suppliers', icon: Truck },
    { to: '/reports', label: 'Reports', icon: BarChart3 },
  ];

  if (isAdmin) {
    navItems.push({ to: '/users', label: 'Users', icon: Users });
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && mobileOpen) setMobileOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen, setMobileOpen]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const closeMobile = () => setMobileOpen(false);

  return (
    <aside
      className={`glass-sidebar ${isCollapsed ? 'is-collapsed' : ''} ${mobileOpen ? 'is-open' : ''}`}
      aria-label="Primary"
    >
      <div className="sidebar-brand">
        <div className="brand-mark">
          <Store size={20} strokeWidth={1.8} />
        </div>
        <div className="brand-copy">
          <div className="brand-title">Our Store</div>
          <div className="brand-sub">Inventory & POS</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              title={isCollapsed ? item.label : undefined}
              className={({ isActive }) => `nav-item ${isActive ? 'is-active' : ''}`}
              style={{ animationDelay: `${40 + index * 28}ms` }}
              onClick={closeMobile}
            >
              <Icon size={18} strokeWidth={1.7} />
              <span>{item.label}</span>
              {item.highlight && !isCollapsed && (
                <span
                  className="status-dot"
                  style={{ marginLeft: 'auto', background: 'var(--warning-text)' }}
                />
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        {!isCollapsed && user && (
          <div className="sidebar-user">
            <div className="sidebar-user-meta" style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user.username}
              </div>
              <div style={{ marginTop: '3px' }}>
                <RoleBadge role={user.role} />
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className="neu-button neu-button-icon"
              aria-label="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>
        )}

        {isCollapsed && (
          <button onClick={logout} title="Sign out" className="neu-button neu-button-icon" style={{ width: '100%' }}>
            <LogOut size={16} />
          </button>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="neu-button neu-button-sm"
          style={{ width: '100%' }}
          title={isCollapsed ? 'Expand menu' : 'Collapse menu'}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          <span className="collapse-label">{isCollapsed ? '' : 'Collapse'}</span>
        </button>
      </div>
    </aside>
  );
};
