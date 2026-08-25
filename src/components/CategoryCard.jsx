import React from 'react';
import '../styles/Home.css';

const CategoryCard = ({ name, icon: Icon }) => {
  return (
    <div className="category-card">
      <div className="category-icon-container">
        {Icon ? <Icon className="category-icon" /> : <div className="icon-placeholder" />}
      </div>
      <h4 className="category-name">{name}</h4>
    </div>
  );
};

export default CategoryCard;
