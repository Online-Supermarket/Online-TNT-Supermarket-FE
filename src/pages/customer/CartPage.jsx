import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, ShieldCheck, Truck } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export const CartPage = () => {
  const { cartItems, updateQuantity, removeFromCart, subtotal, tax, shipping, total } = useCart();
  const navigate = useNavigate();

  const freeShippingThreshold = 50;
  const progressPercent = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px 80px' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', color: 'var(--color-primary-dark)', marginBottom: 24 }}>
        Your Shopping Cart
      </h1>

      {cartItems.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 32 }}>
          {/* LEFT: CART ITEMS LIST */}
          <div>
            {/* Free Shipping Progress Indicator */}
            <div style={{ background: 'var(--color-soft-mint)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-primary-dark)', marginBottom: 8 }}>
                <Truck size={18} />
                {subtotal >= freeShippingThreshold ? (
                  <span>🎉 You qualified for <strong>FREE Express Shipping!</strong></span>
                ) : (
                  <span>Add <strong>${(freeShippingThreshold - subtotal).toFixed(2)}</strong> more to get FREE Express Shipping!</span>
                )}
              </div>
              <div style={{ height: 6, background: '#cbd5e1', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progressPercent}%`, background: 'var(--color-primary)', transition: 'width 0.3s ease' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gap: 16 }}>
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 64, height: 64, background: 'var(--color-soft-mint)', borderRadius: 'var(--radius-sm)', display: 'grid', placeItems: 'center', fontSize: '2rem' }}>
                      {item.image || '🥗'}
                    </div>
                    <div>
                      <span className="product-category-tag">{item.category}</span>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{item.name}</h3>
                      <div style={{ fontWeight: 700, color: 'var(--color-primary-dark)', marginTop: 4 }}>
                        ${item.price.toFixed(2)} each
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-full)' }}>
                      <button className="btn btn-ghost" style={{ padding: '4px 12px' }} onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                      <span style={{ fontWeight: 700, padding: '0 8px' }}>{item.quantity}</span>
                      <button className="btn btn-ghost" style={{ padding: '4px 12px' }} onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                    </div>

                    <div style={{ fontWeight: 800, fontSize: '1.2rem', minWidth: 80, textAlign: 'right' }}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>

                    <button className="btn btn-ghost" style={{ color: '#dc2626' }} onClick={() => removeFromCart(item.id)}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: ORDER SUMMARY */}
          <div style={{ background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 28, height: 'fit-content', boxShadow: 'var(--shadow-md)' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: 20 }}>Order Summary</h2>

            <div style={{ display: 'grid', gap: 12, fontSize: '0.95rem', borderBottom: '1px solid var(--color-border)', paddingBottom: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-muted)' }}>Subtotal</span>
                <strong>${subtotal.toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-muted)' }}>Estimated Tax (8%)</span>
                <strong>${tax.toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-muted)' }}>Express Shipping</span>
                <strong>{shipping === 0 ? <span style={{ color: 'var(--color-primary)' }}>FREE</span> : `$${shipping.toFixed(2)}`}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary-dark)', marginBottom: 24 }}>
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>

            <button className="btn btn-primary" style={{ width: '100%', marginBottom: 16 }} onClick={() => navigate('/checkout')}>
              Proceed to Checkout <ArrowRight size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--color-muted)' }}>
              <ShieldCheck size={16} color="var(--color-primary)" /> Guaranteed Safe Checkout
            </div>
          </div>
        </div>
      ) : (
        <div style={{ background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 60, textAlign: 'center' }}>
          <ShoppingBag size={48} color="var(--color-muted)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', marginBottom: 8 }}>Your Cart is Empty</h2>
          <p style={{ color: 'var(--color-muted)', marginBottom: 24 }}>Explore our fresh organic harvest and artisan catalog to add items.</p>
          <Link to="/categories" className="btn btn-primary">Start Shopping</Link>
        </div>
      )}
    </div>
  );
};
