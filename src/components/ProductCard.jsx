import React from 'react';
import { FaStar, FaShoppingCart } from 'react-icons/fa';
import '../styles/Home.css';

const ProductCard = ({ image, name, category, price, rating }) => {
  const handleAddToCart = () => {
    alert(`${name} added to cart!`);
  };

  return (
    <div className="product-card">
      <div className="product-image-container">
        {image ? (
          <img src={image} alt={name} className="product-image" />
        ) : (
          <div className="product-image-placeholder">No Image Available</div>
        )}
      </div>
      <div className="product-info">
        <span className="product-category">{category}</span>
        <h4 className="product-name">{name}</h4>
        
        <div className="product-rating">
          {[...Array(5)].map((_, index) => (
            <FaStar
              key={index}
              className={index < rating ? 'star-filled' : 'star-empty'}
            />
          ))}
        </div>
        
        <div className="product-bottom">
          <span className="product-price">{price}</span>
          <button className="add-to-cart-btn" onClick={handleAddToCart} aria-label="Add to Cart">
            <FaShoppingCart />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
