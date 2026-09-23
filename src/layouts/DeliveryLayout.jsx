import React from 'react';
import { Outlet } from 'react-router-dom';
import { DeliverySidebar } from '../components/DeliverySidebar';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

export const DeliveryLayout = () => {
  const { user, logout } = useAuth();

  return (
    <div className="portal-container">
      <DeliverySidebar />
      <div className="portal-main">
        <header className="portal-header">
          <div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem' }}>Express Delivery Dispatch</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>Driver Navigation & Fulfillment Statuses</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{user?.displayName || 'Dave Driver'}</div>
              <div style={{ fontSize: '0.75rem', color: '#d97706' }}>Express Courier</div>
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
