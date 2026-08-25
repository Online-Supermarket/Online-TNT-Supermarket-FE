import React from 'react';
import { Link } from 'react-router-dom';
import { FaShoppingCart, FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';
import '../styles/Home.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            <FaShoppingCart className="logo-icon" />
            <span style={{ lineHeight: '1.1', fontSize: '1.3rem' }}>TNT<br />Supermarket</span>
          </Link>
          <p className="footer-description">
            Your one-stop shop for fresh groceries, household essentials, and daily needs. Quality delivered to your doorstep.
          </p>
        </div>

        <div className="footer-links">
          <h3>Quick Links</h3>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/products">Products</Link></li>
            <li><Link to="/categories">Categories</Link></li>
            <li><Link to="/offers">Offers</Link></li>
            <li><Link to="/about">About Us</Link></li>
          </ul>
        </div>

        <div className="footer-links">
          <h3>Customer</h3>
          <ul>
            <li><Link to="/login">Login</Link></li>
            <li><Link to="/register">Register</Link></li>
            <li><Link to="/account">My Account</Link></li>
            <li><Link to="/orders">My Orders</Link></li>
          </ul>
        </div>

        <div className="footer-contact">
          <h3>Contact Us</h3>
          <p><strong>Address:</strong> TNT Supermarket, Sri Lanka</p>
          <p><strong>Phone:</strong> +94 77 123 4567</p>
          <p><strong>Email:</strong> support@tntsupermarket.lk</p>
          <div className="social-icons">
            <a href="#" aria-label="Facebook"><FaFacebook /></a>
            <a href="#" aria-label="Twitter"><FaTwitter /></a>
            <a href="#" aria-label="Instagram"><FaInstagram /></a>
            <a href="#" aria-label="LinkedIn"><FaLinkedin /></a>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; 2026 TNT Supermarket. All Rights Reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
