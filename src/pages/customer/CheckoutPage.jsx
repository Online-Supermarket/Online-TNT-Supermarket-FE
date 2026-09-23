import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Truck, CreditCard, Banknote, CheckCircle, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import axiosInstance from '../../services/axiosInstance';

export const CheckoutPage = () => {
  const { cartItems, total, clearCart } = useCart();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [placed, setPlaced] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);

  const [address, setAddress] = useState({
    recipientName: 'Sarah Customer',
    phone: '+1 (555) 234-5678',
    line1: '742 Evergreen Terrace',
    city: 'Springfield',
    zone: '97477',
  });

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Attempt API backend order placement
      const res = await axiosInstance.post('/order/orders', {
        addressId: 'addr_default',
        items: cartItems.map(i => ({ productId: i.id, quantity: i.quantity })),
        paymentMethod
      });
      setOrderId(res.orderId || `ORD-${Math.floor(100000 + Math.random() * 900000)}`);
      setPlaced(true);
      clearCart();
    } catch {
      // Demo fallback
      const mockId = `TNT-ORD-${Math.floor(100000 + Math.random() * 900000)}`;
      setOrderId(mockId);
      setPlaced(true);
      clearCart();
    } finally {
      setLoading(false);
    }
  };

  if (placed) {
    return (
      <div style={{ maxWidth: 640, margin: '60px auto', padding: '0 24px' }}>
        <div style={{ background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 48, textAlign: 'center', boxShadow: 'var(--shadow-lg)' }}>
          <CheckCircle size={64} color="var(--color-primary)" style={{ margin: '0 auto 20px' }} />
          <span className="kicker-badge">ORDER CONFIRMED</span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.4rem', color: 'var(--color-primary-dark)', margin: '12px 0' }}>
            Thank You for Your Order!
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '1.05rem', marginBottom: 24 }}>
            Order <strong>#{orderId}</strong> has been received and sent to our packing queue.
          </p>

          <div style={{ background: 'var(--color-soft-mint)', padding: 20, borderRadius: 'var(--radius-md)', marginBottom: 32, textAlign: 'left' }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>🚚 Estimated Delivery Window:</div>
            <div style={{ color: 'var(--color-primary)', fontWeight: 800, fontSize: '1.1rem' }}>Today in 28 - 35 minutes</div>
          </div>

          <button className="btn btn-primary" onClick={() => navigate('/orders')}>
            View Order Status <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px 80px' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', color: 'var(--color-primary-dark)', marginBottom: 24 }}>
        Express Checkout
      </h1>

      <form onSubmit={handlePlaceOrder} style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 32 }}>
        {/* LEFT: SHIPPING & PAYMENT DETAILS */}
        <div style={{ display: 'grid', gap: 24 }}>
          {/* Address Box */}
          <div style={{ background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 28 }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Truck size={20} color="var(--color-primary)" /> Delivery Address
            </h2>

            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6 }}>Full Name</label>
                <input
                  type="text"
                  required
                  value={address.recipientName}
                  onChange={(e) => setAddress({ ...address, recipientName: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6 }}>Phone Number</label>
                  <input
                    type="text"
                    required
                    value={address.phone}
                    onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6 }}>Zip / Postal Code</label>
                  <input
                    type="text"
                    required
                    value={address.zone}
                    onChange={(e) => setAddress({ ...address, zone: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', outline: 'none' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6 }}>Street Address</label>
                <input
                  type="text"
                  required
                  value={address.line1}
                  onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', outline: 'none' }}
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div style={{ background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 28 }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <CreditCard size={20} color="var(--color-primary)" /> Payment Method
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div
                onClick={() => setPaymentMethod('COD')}
                style={{
                  border: `2px solid ${paymentMethod === 'COD' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  background: paymentMethod === 'COD' ? 'var(--color-soft-mint)' : '#ffffff',
                  borderRadius: 'var(--radius-md)',
                  padding: 20,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <Banknote size={24} color="var(--color-primary)" />
                <div>
                  <div style={{ fontWeight: 700 }}>Cash on Delivery</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>Pay upon doorstep arrival</div>
                </div>
              </div>

              <div
                onClick={() => setPaymentMethod('CARD')}
                style={{
                  border: `2px solid ${paymentMethod === 'CARD' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  background: paymentMethod === 'CARD' ? 'var(--color-soft-mint)' : '#ffffff',
                  borderRadius: 'var(--radius-md)',
                  padding: 20,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <CreditCard size={24} color="var(--color-primary)" />
                <div>
                  <div style={{ fontWeight: 700 }}>Credit / Debit Card</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>100% Encrypted Payment</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: SUMMARY & PLACE ORDER BUTTON */}
        <div style={{ background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 28, height: 'fit-content' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', marginBottom: 20 }}>Order Items</h2>

          <div style={{ display: 'grid', gap: 12, marginBottom: 24, maxHeight: 200, overflowY: 'auto' }}>
            {cartItems.map((item) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span>{item.name} × {item.quantity}</span>
                <strong>${(item.price * item.quantity).toFixed(2)}</strong>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
              <span>Total Pay</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: '100%', padding: '14px 20px' }} disabled={loading}>
            {loading ? 'Processing Order...' : 'Place Order Now'}
          </button>
        </div>
      </form>
    </div>
  );
};
