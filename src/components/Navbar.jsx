import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ShoppingBag, Leaf, User, LogOut, ShieldAlert, PackageCheck, Truck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export const Navbar = () => {
  const { user, activeRole, logout } = useAuth();
  const { cartCount } = useCart();




  return (
    <header className="navbar-container">
      <div className="navbar-inner">
        <Link to="/" className="brand-logo">
          <div className="brand-badge">
            <Leaf size={24} />
          </div>
          <div className="brand-text">
            <span className="brand-title">TNT ONLINE</span>
            <span className="brand-subtitle">SUPERMARKET</span>
          </div>
        </Link>

        <nav className="nav-menu">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
            Home
          </NavLink>
          <NavLink to="/categories" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Shop Catalog
          </NavLink>
          <NavLink to="/offers" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Special Offers
          </NavLink>
          <NavLink to="/about" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            About
          </NavLink>
          <NavLink to="/contact" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Contact
          </NavLink>

          {/* Quick jump to active role portal */}
          {activeRole === 'ADMIN' && (
            <NavLink to="/admin/dashboard" className="nav-link" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
              <ShieldAlert size={16} style={{ display: 'inline', marginRight: 4 }} /> Admin Portal
            </NavLink>
          )}
          {activeRole === 'STAFF' && (
            <NavLink to="/staff/dashboard" className="nav-link" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
              <PackageCheck size={16} style={{ display: 'inline', marginRight: 4 }} /> Staff Portal
            </NavLink>
          )}
          {activeRole === 'DELIVERY' && (
            <NavLink to="/delivery/dashboard" className="nav-link" style={{ color: '#d97706', fontWeight: 700 }}>
              <Truck size={16} style={{ display: 'inline', marginRight: 4 }} /> Rider Portal
            </NavLink>
          )}

        </nav>

        <div className="nav-actions">


          <Link to="/cart" className="btn btn-cart">
            <ShoppingBag size={18} />
            <span>Cart</span>
            {cartCount > 0 && <span className="badge-count">{cartCount}</span>}
          </Link>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Link to="/orders" className="btn btn-ghost" title="My Orders">
                <User size={18} />
                <span style={{ fontSize: '0.85rem' }}>{user.displayName || 'Account'}</span>
              </Link>
              <button className="btn btn-ghost" onClick={logout} title="Sign Out">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary">
                Create account
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
