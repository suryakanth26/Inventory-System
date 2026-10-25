import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Menu, RefreshCw, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { RoleBadge } from '../ui/Badge';
import { productsApi } from '../../api/productsApi';
import apiClient from '../../api/client';

const PAGE_META = {
  '/': { title: 'Dashboard', crumb: 'Overview' },
  '/products': { title: 'Inventory', crumb: 'Catalog' },
  '/categories': { title: 'Categories', crumb: 'Catalog' },
  '/low-stock': { title: 'Low-Stock Alerts', crumb: 'Operations' },
  '/suppliers': { title: 'Suppliers', crumb: 'Vendors' },
  '/transactions': { title: 'Stock Movements', crumb: 'Ledger' },
  '/reports': { title: 'Reports', crumb: 'Analytics' },
  '/users': { title: 'Users', crumb: 'Administration' },
};

export const Header = ({ onMenuClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [apiOnline, setApiOnline] = useState(true);
  const [pingLatency, setPingLatency] = useState(null);
  const [checking, setChecking] = useState(false);
  const [query, setQuery] = useState('');
  const [alertCount, setAlertCount] = useState(0);

  const meta = PAGE_META[location.pathname] || { title: 'Our Store', crumb: 'Inventory' };

  const checkHealth = async () => {
    setChecking(true);
    const start = performance.now();
    try {
      await apiClient.get('/products');
      setPingLatency(Math.round(performance.now() - start));
      setApiOnline(true);
    } catch {
      setApiOnline(false);
      setPingLatency(null);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 45000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    productsApi.getLowStock()
      .then((data) => setAlertCount((data || []).length))
      .catch(() => setAlertCount(0));
  }, [location.pathname]);

  const submitSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/products?q=${encodeURIComponent(q)}` : '/products');
  };

  return (
    <header className="glass-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
        <button
          type="button"
          className="neu-button neu-button-icon menu-toggle"
          onClick={onMenuClick}
          aria-label="Open navigation"
        >
          <Menu size={18} />
        </button>
        <div key={location.pathname} className="topbar-title-swap" style={{ minWidth: 0 }}>
          <div className="crumb">{meta.crumb} / {meta.title}</div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, lineHeight: 1.2 }}>{meta.title}</h1>
        </div>
      </div>

      <form className="topbar-search" onSubmit={submitSearch}>
        <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
        <input
          className="neu-input"
          placeholder="Search inventory…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search inventory"
        />
      </form>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          type="button"
          className="pill"
          onClick={checkHealth}
          title="Refresh API status"
          style={{ cursor: 'pointer', border: '1px solid rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.32)' }}
        >
          <span
            className="status-dot"
            style={{ background: apiOnline ? '#0f766e' : '#be123c' }}
          />
          {apiOnline ? `Live ${pingLatency ? `${pingLatency}ms` : ''}` : 'Offline'}
          <RefreshCw size={12} className={checking ? 'animate-spin' : ''} />
        </button>

        <button
          type="button"
          className="neu-button neu-button-icon"
          onClick={() => navigate('/low-stock')}
          aria-label="Low-stock notifications"
          title="Low-stock alerts"
          style={{ position: 'relative' }}
        >
          <Bell size={16} />
          {alertCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: 4,
                right: 4,
                minWidth: 14,
                height: 14,
                borderRadius: 99,
                background: '#be123c',
                color: '#fff',
                fontSize: 9,
                fontWeight: 700,
                display: 'grid',
                placeItems: 'center',
                padding: '0 3px',
              }}
            >
              {alertCount}
            </span>
          )}
        </button>

        {user && (
          <div className="pill">
            <span style={{ fontWeight: 650 }}>{user.username}</span>
            <RoleBadge role={user.role} />
          </div>
        )}
      </div>
    </header>
  );
};
