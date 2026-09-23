import React from 'react';
import { Outlet } from 'react-router-dom';
import { StaffSidebar } from '../components/StaffSidebar';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

export const StaffLayout = () => {
  const { user, logout } = useAuth();

  return (
    <div className="portal-container">
      <StaffSidebar />
      <div className="portal-main">
        <header className="portal-header">
          <div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem' }}>Staff Fulfillment & Catalog</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>Inventory Management & Packing Workflows</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{user?.displayName || 'Sam Staff'}</div>
              <div style={{ fontSize: '0.75rem', color: '#2563eb' }}>Inventory & Catalog Staff</div>
            </div>
            <button className="btn btn-ghost" onClick={logout} title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <div className="portal-body">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
