import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PackageCheck, Warehouse, ClipboardList, ArrowLeft } from 'lucide-react';

export const StaffSidebar = () => {
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

        <NavLink to="/staff/inventory" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Warehouse size={18} /> Stock Updates
        </NavLink>
        <NavLink to="/staff/orders" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <ClipboardList size={18} /> Packing Queue
        </NavLink>

        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <NavLink to="/" className="sidebar-link">
            <ArrowLeft size={18} /> Back to Customer Shop
          </NavLink>
        </div>
      </nav>
    </aside>
  );
};
