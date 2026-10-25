import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const AppLayout = () => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 960) setMobileOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <>
      <div className="app-shell">
        <div
          className={`sidebar-overlay ${mobileOpen ? 'is-visible' : ''}`}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
        <Sidebar
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />
        <div className="workspace">
          <Header
            onMenuClick={() => setMobileOpen(true)}
            isCollapsed={isCollapsed}
            onToggleCollapse={() => setIsCollapsed((v) => !v)}
          />
          <main className="workspace-main">
            <div key={location.pathname} className="page-transition">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </>
  );
};
