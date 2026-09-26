import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ShoppingBag, Leaf, User, LogOut, ShieldAlert, PackageCheck, Truck, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { roleHome } from '../utils/roles';

export const Navbar = () => {
  const { user, activeRole, logout } = useAuth();
  const { cartCount } = useCart();
  const [menuOpen, setMenuOpen] = React.useState(false);




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

        <button className="mobile-menu-toggle" aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <nav className={`nav-menu ${menuOpen ? 'is-open' : ''}`} onClick={() => setMenuOpen(false)}>
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
          {activeRole === 'Admin' && (
            <NavLink to="/admin/dashboard" className="nav-link" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
              <ShieldAlert size={16} style={{ display: 'inline', marginRight: 4 }} /> Admin Portal
            </NavLink>
          )}
          {activeRole === 'Staff' && (
            <NavLink to="/staff/dashboard" className="nav-link" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
              <PackageCheck size={16} style={{ display: 'inline', marginRight: 4 }} /> Staff Portal
            </NavLink>
          )}
          {activeRole === 'Rider' && (
            <NavLink to="/delivery/dashboard" className="nav-link" style={{ color: '#d97706', fontWeight: 700 }}>
              <Truck size={16} style={{ display: 'inline', marginRight: 4 }} /> Rider Portal
            </NavLink>
          )}

        </nav>

        <div className={`nav-actions ${menuOpen ? 'is-open' : ''}`}>


          <Link to="/cart" className="btn btn-cart">
            <ShoppingBag size={18} />
            <span>Cart</span>
            {cartCount > 0 && <span className="badge-count">{cartCount}</span>}
          </Link>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Link to={roleHome(activeRole)} className="btn btn-ghost" title={activeRole === 'Customer' ? 'My Orders' : `${activeRole || 'Account'} Dashboard`}>
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
