import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, PackageCheck, Layers, Warehouse, ClipboardList, ArrowLeft, BarChart2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const StaffSidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleBackToShop = async () => {
    await logout();
    navigate('/');
  };

  return (
    <aside className="sidebar-panel" style={{ background: '#1c3029' }}>
      <div className="sidebar-brand">
        <div style={{ background: '#2563eb', width: 36, height: 36, borderRadius: 8, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800 }}>
          S
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>STAFF PORTAL</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-soft-mint)', opacity: 0.8 }}>CATALOG & FULFILLMENT</div>
        </div>
      </div>

      <nav className="sidebar-menu">
        <NavLink to="/staff/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={18} /> Staff Dashboard
        </NavLink>
        <NavLink to="/staff/products" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <PackageCheck size={18} /> Products Catalog
        </NavLink>
        <NavLink to="/staff/categories" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Layers size={18} /> Categories
        </NavLink>
        <NavLink to="/staff/inventory" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Warehouse size={18} /> Inventory Management
        </NavLink>
        <NavLink to="/staff/orders" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <ClipboardList size={18} /> Packing Queue
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

