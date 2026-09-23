import React from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from '../components/AdminSidebar';
import { useAuth } from '../context/AuthContext';
import { LogOut, Bell } from 'lucide-react';

export const AdminLayout = () => {
  const { user, logout } = useAuth();

  return (
    <div className="portal-container">
      <AdminSidebar />
      <div className="portal-main">
        <header className="portal-header">
          <div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem' }}>Admin Operations Portal</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>Supermarket Management & Analytics</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button className="btn btn-ghost" style={{ padding: 8 }}>
              <Bell size={18} />
            </button>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{user?.displayName || 'Alex Admin'}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>Operations Admin</div>
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
