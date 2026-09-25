import React, { useState } from 'react';
import { X, ShoppingBag, Star, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { PRODUCT_PLACEHOLDER_IMAGE } from '../models/Product';

export const QuickViewModal = ({ product, onClose }) => {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const displayImage = product.imageUrl || product.image_url || product.category?.imageUrl || product.category?.image_url || PRODUCT_PLACEHOLDER_IMAGE;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 20,
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          maxWidth: 600,
          width: '100%',
          padding: 32,
          position: 'relative',
          boxShadow: 'var(--shadow-lg)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
          }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'center' }}>
          <div
            style={{
              height: 220,
              background: '#f8fafc',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--color-border)',
            }}
          >
            <img
              src={displayImage}
              alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                e.currentTarget.src = PRODUCT_PLACEHOLDER_IMAGE;
              }}
            />
          </div>

          <div>
            <span className="product-category-tag">{product.category?.name || product.category || 'Produce'}</span>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', margin: '6px 0 10px' }}>{product.name}</h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, fontSize: '0.85rem', color: 'var(--color-accent-gold)' }}>
              <Star size={14} fill="var(--color-accent-gold)" />
              <span style={{ fontWeight: 700 }}>4.9</span>
              <span style={{ color: 'var(--color-muted)' }}>(Verified Organic)</span>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--color-muted)', marginBottom: 16 }}>
              {product.description || 'Farm-fresh, carefully handpicked local organic produce delivered directly to your doorstep.'}
            </p>

            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-primary-dark)', marginBottom: 20 }}>
              Rs. {Number(product.price).toFixed(2)}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-full)' }}>
                <button
                  className="btn btn-ghost"
                  style={{ padding: '6px 12px' }}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  -
                </button>
                <span style={{ fontWeight: 700, padding: '0 8px' }}>{quantity}</span>
                <button
                  className="btn btn-ghost"
                  style={{ padding: '6px 12px' }}
                  onClick={() => setQuantity((q) => q + 1)}
                >
                  +
                </button>
              </div>

              <button
                className="btn btn-primary"
                onClick={() => {
                  addToCart(product, quantity);
                  onClose();
                }}
              >
                <ShoppingBag size={18} /> Add to Cart
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--color-primary)' }}>
              <ShieldCheck size={14} /> 100% Satisfaction Guarantee & Express Delivery
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
