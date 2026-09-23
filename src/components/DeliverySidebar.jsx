import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Truck, History, UserCheck, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const DeliverySidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleBackToShop = async () => {
    await logout();
    navigate('/');
  };

  return (
    <aside className="sidebar-panel" style={{ background: '#172e27' }}>
      <div className="sidebar-brand">
        <div style={{ background: '#d97706', width: 36, height: 36, borderRadius: 8, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800 }}>
          D
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>DRIVER PORTAL</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-soft-mint)', opacity: 0.8 }}>EXPRESS FULFILLMENT</div>
        </div>
      </div>

      <nav className="sidebar-menu">
        <NavLink to="/delivery/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={18} /> Driver Dashboard
        </NavLink>
        <NavLink to="/delivery/orders" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Truck size={18} /> Active Deliveries
        </NavLink>
        <NavLink to="/delivery/history" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <History size={18} /> Delivery History
        </NavLink>
        <NavLink to="/delivery/profile" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <UserCheck size={18} /> Driver Profile
        </NavLink>

        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button className="sidebar-link" onClick={handleBackToShop} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
            <ArrowLeft size={18} /> Back to Customer Shop
          </button>
        </div>
      </nav>
    </aside>
  );
};

