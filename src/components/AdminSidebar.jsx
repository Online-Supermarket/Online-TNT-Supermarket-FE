import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Package, Layers, Warehouse, ShoppingCart, Tag, BarChart3, ArrowLeft, Truck, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AdminSidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleBackToShop = async () => {
    await logout();
    navigate('/');
  };

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
        <NavLink to="/admin/customers" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <UserCheck size={18} /> Customer Management
        </NavLink>
        <NavLink to="/admin/staff" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Users size={18} /> Staff Management
        </NavLink>
        <NavLink to="/admin/riders" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Truck size={18} /> Rider Management
        </NavLink>
        <NavLink to="/admin/products" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Package size={18} /> Product Management
        </NavLink>
        <NavLink to="/admin/categories" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Layers size={18} /> Category Management
        </NavLink>

        <NavLink to="/admin/inventory" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Warehouse size={18} /> Inventory Management
        </NavLink>
        <NavLink to="/admin/orders" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <ShoppingCart size={18} /> Order Management
        </NavLink>
        <NavLink to="/admin/reports" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <BarChart3 size={18} /> Reports
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
