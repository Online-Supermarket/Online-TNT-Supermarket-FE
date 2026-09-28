import React, { useState } from 'react';
import { ShoppingBag, Eye } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { QuickViewModal } from './QuickViewModal';
import { PRODUCT_PLACEHOLDER_IMAGE } from '../models/Product';

export const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [showQuickView, setShowQuickView] = useState(false);
  const [stockMessage, setStockMessage] = useState('');

  const price = Number(product.price);
  const originalPrice = product.originalPrice ? Number(product.originalPrice) : null;
  const inStock = product.stockQuantity === undefined ? true : product.stockQuantity > 0;
  const displayImage = product.imageUrl || product.image_url || product.category?.imageUrl || product.category?.image_url || PRODUCT_PLACEHOLDER_IMAGE;

  return (
    <>
      <div className="product-card">
        {product.discountBadge && (
          <span className="product-card-badge">{product.discountBadge}</span>
        )}

        <div className="product-image-area">
          <img
            src={displayImage}
            alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              e.currentTarget.src = PRODUCT_PLACEHOLDER_IMAGE;
            }}
          />

          <button
            onClick={() => setShowQuickView(true)}
            className="btn btn-ghost"
            style={{
              position: 'absolute',
              bottom: 10,
              right: 10,
              background: 'rgba(255,255,255,0.9)',
              borderRadius: '50%',
              padding: 8,
            }}
            title="Quick View"
          >
            <Eye size={16} color="var(--color-primary)" />
          </button>
        </div>

        <div className="product-category-tag">{product.category?.name || product.category || 'Produce'}</div>
        <h3 className="product-name">{product.name}</h3>
        {product.stockQuantity !== undefined && <div style={{ fontSize: '0.78rem', color: inStock ? 'var(--color-muted)' : '#b91c1c', marginBottom: 6 }}>{inStock ? `${product.stockQuantity} items available` : 'Out of Stock'}</div>}
        {stockMessage && <div role="alert" style={{ fontSize: '0.78rem', color: '#b45309', marginBottom: 6 }}>{stockMessage}</div>}

        <div className="product-price-row">
          <div>
            <span className="price-tag">Rs. {price.toFixed(2)}</span>
            {originalPrice && (
              <span style={{ textDecoration: 'line-through', color: 'var(--color-muted)', fontSize: '0.85rem', marginLeft: 6 }}>
                Rs. {originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          <button
            className="btn btn-primary"
            style={{ padding: '8px 14px', fontSize: '0.85rem' }}
            disabled={!inStock}
            onClick={async () => {
              const result = await addToCart(product);
              if (!result) setStockMessage(`Only ${product.stockQuantity} items are available in stock.`);
            }}
          >
            <ShoppingBag size={16} />
            {inStock ? 'Add' : 'Out'}
          </button>
        </div>
      </div>

      {showQuickView && (
        <QuickViewModal product={product} onClose={() => setShowQuickView(false)} />
      )}
    </>
  );
};
