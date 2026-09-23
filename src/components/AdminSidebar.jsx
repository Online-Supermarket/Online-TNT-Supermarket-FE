import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Package, Layers, Warehouse, ShoppingCart, Tag, BarChart3, ArrowLeft } from 'lucide-react';

export const AdminSidebar = () => {
  return (
    <aside className="sidebar-panel">
      <div className="sidebar-brand">
        <div style={{ background: 'var(--color-primary)', width: 36, height: 36, borderRadius: 8, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800 }}>
          A
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>ADMIN PORTAL</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-soft-mint)', opacity: 0.8 }}>TNT SUPERMARKET</div>
        </div>
      </div>

      <nav className="sidebar-menu">
        <NavLink to="/admin/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={18} /> Dashboard
        </NavLink>
        <NavLink to="/admin/users" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Users size={18} /> Users & Roles
        </NavLink>
        <NavLink to="/admin/products" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Package size={18} /> Manage Products
        </NavLink>
        <NavLink to="/admin/categories" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Layers size={18} /> Categories
        </NavLink>
        <NavLink to="/admin/inventory" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Warehouse size={18} /> Inventory Stock
        </NavLink>
        <NavLink to="/admin/orders" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <ShoppingCart size={18} /> Order Management
        </NavLink>
        <NavLink to="/admin/offers" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Tag size={18} /> Special Offers
        </NavLink>
        <NavLink to="/admin/reports" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <BarChart3 size={18} /> Sales Reports
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
