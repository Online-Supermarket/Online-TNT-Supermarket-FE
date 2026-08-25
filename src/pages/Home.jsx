import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CategoryCard from '../components/CategoryCard';
import ProductCard from '../components/ProductCard';
import { 
  FaCarrot, FaDrumstickBite, FaCheese, FaBreadSlice, 
  FaWineBottle, FaBroom, FaSpa, FaCookie 
} from 'react-icons/fa';
import { FaCheckCircle, FaTruck, FaLock, FaTags } from 'react-icons/fa';
import '../styles/Home.css';

const Home = () => {
  const navigate = useNavigate();

  const categories = [
    { id: 1, name: 'Fruits & Vegetables', icon: FaCarrot },
    { id: 2, name: 'Meat & Seafood', icon: FaDrumstickBite },
    { id: 3, name: 'Dairy & Eggs', icon: FaCheese },
    { id: 4, name: 'Bakery', icon: FaBreadSlice },
    { id: 5, name: 'Beverages', icon: FaWineBottle },
    { id: 6, name: 'Household Items', icon: FaBroom },
    { id: 7, name: 'Personal Care', icon: FaSpa },
    { id: 8, name: 'Snacks & Biscuits', icon: FaCookie },
  ];

  const featuredProducts = [
    { id: 1, name: 'Fresh Red Apples', category: 'Fruits', price: 'Rs. 850.00', rating: 5, image: null },
    { id: 2, name: 'Farm Fresh Milk 1L', category: 'Dairy', price: 'Rs. 480.00', rating: 4, image: null },
    { id: 3, name: 'White Bread', category: 'Bakery', price: 'Rs. 220.00', rating: 4, image: null },
    { id: 4, name: 'Basmati Rice 5kg', category: 'Groceries', price: 'Rs. 2,250.00', rating: 5, image: null },
  ];

  const benefits = [
    { id: 1, title: 'Fresh Quality Products', icon: FaCheckCircle, desc: 'We guarantee fresh and high-quality items.' },
    { id: 2, title: 'Fast and Reliable Delivery', icon: FaTruck, desc: 'Quick delivery right to your doorstep.' },
    { id: 3, title: 'Secure Online Payments', icon: FaLock, desc: '100% secure payment gateways.' },
    { id: 4, title: 'Best Prices and Special Offers', icon: FaTags, desc: 'Enjoy our weekend mega sales and daily offers.' },
  ];

  return (
    <div className="home-page">
      <Navbar />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <span className="hero-badge">Fast Delivery | Fresh Products | Great Offers</span>
          <h1 className="hero-title">Fresh Groceries Delivered to Your Doorstep</h1>
          <p className="hero-subtitle">
            Shop fresh vegetables, fruits, groceries, household essentials, and more from TNT Supermarket.
          </p>
          <div className="hero-buttons">
            <button className="btn-primary" onClick={() => navigate('/products')}>Shop Now</button>
            <button className="btn-secondary" onClick={() => navigate('/register')}>Create Account</button>
          </div>
        </div>
        <div className="hero-image-placeholder">
          <span>Supermarket / Grocery Illustration</span>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section container">
        <div className="section-header">
          <div>
            <h2 className="section-title">Shop by Category</h2>
            <p className="section-subtitle">Find all your daily essentials in one place.</p>
          </div>
          <button className="btn-outline" onClick={() => navigate('/categories')}>View All Categories</button>
        </div>
        <div className="categories-grid">
          {categories.map((cat) => (
            <CategoryCard key={cat.id} name={cat.name} icon={cat.icon} />
          ))}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="featured-products-section container">
        <h2 className="section-title">Featured Products</h2>
        <div className="products-grid">
          {featuredProducts.map((prod) => (
            <ProductCard 
              key={prod.id} 
              name={prod.name} 
              category={prod.category} 
              price={prod.price} 
              rating={prod.rating} 
              image={prod.image}
            />
          ))}
        </div>
      </section>

      {/* Special Offer Banner */}
      <section className="offer-banner-section container">
        <div className="offer-banner">
          <div className="offer-content">
            <h2>Weekend Mega Sale — Save up to 30% on selected items!</h2>
            <p>Hurry up! Offer ends in a few hours.</p>
          </div>
          <div className="offer-action">
            <div className="countdown-placeholder">00:00:00</div>
            <button className="btn-offer" onClick={() => navigate('/offers')}>View Offers</button>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="benefits-section container">
        <h2 className="section-title text-center">Why Choose TNT Supermarket</h2>
        <div className="benefits-grid">
          {benefits.map((benefit) => (
            <div key={benefit.id} className="benefit-card">
              <benefit.icon className="benefit-icon" />
              <h4>{benefit.title}</h4>
              <p>{benefit.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Registration CTA Section */}
      <section className="cta-section">
        <div className="cta-container text-center">
          <h2>Create Your TNT Supermarket Account Today</h2>
          <p>Register to shop faster, track orders, save your favourites, and receive exclusive offers.</p>
          <button className="btn-primary" onClick={() => navigate('/register')}>Register Now</button>
          <p className="cta-login-link">
            Already have an account? <span onClick={() => navigate('/login')}>Login</span>
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
