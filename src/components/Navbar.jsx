import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaSearch, FaBars, FaTimes } from 'react-icons/fa';
import '../styles/Home.css';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <FaShoppingCart className="logo-icon" />
          <span style={{ lineHeight: '1.1', fontSize: '1.3rem' }}>TNT<br />Supermarket</span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="navbar-links">
          <Link to="/">Home</Link>
          <Link to="/categories">Categories</Link>
          <Link to="/products">Products</Link>
          <Link to="/offers">Offers</Link>
          <Link to="/about">About Us</Link>
          <Link to="/contact">Contact</Link>
        </div>

        {/* Search Bar */}
        <div className="navbar-search">
          <input type="text" placeholder="Search products..." />
          <button className="search-btn" aria-label="Search">
            <FaSearch />
          </button>
        </div>

        {/* Actions */}
        <div className="navbar-actions">
          <button className="cart-btn" aria-label="Cart">
            <FaShoppingCart />
            <span className="cart-badge">{cartCount}</span>
          </button>
          <button className="btn-login" onClick={() => navigate('/login')}>Login / Sign up</button>
        </div>

        {/* Hamburger Menu Icon */}
        <div className="mobile-menu-icon" onClick={toggleMobileMenu}>
          {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-menu">
          <Link to="/" onClick={toggleMobileMenu}>Home</Link>
          <Link to="/categories" onClick={toggleMobileMenu}>Categories</Link>
          <Link to="/products" onClick={toggleMobileMenu}>Products</Link>
          <Link to="/offers" onClick={toggleMobileMenu}>Offers</Link>
          <Link to="/about" onClick={toggleMobileMenu}>About Us</Link>
          <Link to="/contact" onClick={toggleMobileMenu}>Contact</Link>
          <div className="mobile-actions">
             <button className="btn-login-mobile" onClick={() => { navigate('/login'); toggleMobileMenu(); }}>Login / Sign up</button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
