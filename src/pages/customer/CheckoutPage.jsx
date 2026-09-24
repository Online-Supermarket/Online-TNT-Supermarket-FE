import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Truck } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import axiosInstance from '../../services/axiosInstance';

const emptyAddress = { fullName: '', fullAddress: '', district: '', contactNumber: '' };
const newKey = () => globalThis.crypto?.randomUUID?.() || `checkout-${Date.now()}`;
const fieldStyle = { display: 'grid', gap: 6, fontWeight: 700, fontSize: '.9rem' };
const inputStyle = { padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: 6, font: 'inherit' };

export const CheckoutPage = () => {
  const { cartItems, refreshBasket } = useCart();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [newAddress, setNewAddress] = useState(emptyAddress);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);
  const [idempotencyKey] = useState(newKey);

  useEffect(() => {
    Promise.all([axiosInstance.get('/order/addresses'), refreshBasket()])
      .then(([data]) => {
        const list = Array.isArray(data) ? data : [];
        setAddresses(list);
        if (list[0]) setSelectedAddressId(list[0].id);
      })
      .catch((err) => setError(err.message || 'Unable to load checkout.'))
      .finally(() => setLoading(false));
  }, [refreshBasket]);

  const selected = useMemo(() => addresses.find((address) => address.id === selectedAddressId), [addresses, selectedAddressId]);
  const unavailable = cartItems.some((item) => item.available === false);
  const setAddressField = (field, value) => setNewAddress((current) => ({ ...current, [field]: value }));

  const saveAddress = async () => {
    if (!newAddress.fullName.trim() || !newAddress.fullAddress.trim() || !newAddress.district.trim() || !newAddress.contactNumber.trim()) {
      setError('Full name, full address, district, and contact number are required.');
      return;
    }

    const payload = {
      recipientName: newAddress.fullName.trim(),
      line1: newAddress.fullAddress.trim(),
      line2: null,
      city: newAddress.district.trim(),
      zone: newAddress.district.trim(),
      phone: newAddress.contactNumber.trim(),
    };

    setSaving(true);
    setError('');
    try {
      const result = await axiosInstance.post('/order/addresses', payload);
      const address = { ...payload, id: result.id };
      setAddresses((current) => [...current, address]);
      setSelectedAddressId(address.id);
      setNewAddress(emptyAddress);
      setShowForm(false);
    } catch (err) {
      setError(err.message || 'Unable to save address.');
    } finally {
      setSaving(false);
    }
  };

  const placeOrder = async (event) => {
    event.preventDefault();
    if (!selectedAddressId) return setError('Select a delivery address.');
    if (!cartItems.length) return setError('Your basket is empty.');
    if (unavailable) return setError('Remove unavailable products before checkout.');

    setPlacing(true);
    setError('');
    try {
      setOrder(await axiosInstance.post('/order/orders', { addressId: selectedAddressId }, { headers: { 'Idempotency-Key': idempotencyKey } }));
      await refreshBasket();
    } catch (err) {
      setError(err.message || 'Unable to place order.');
    } finally {
      setPlacing(false);
    }
  };

  if (order) return <div style={{ maxWidth: 640, margin: '60px auto', textAlign: 'center' }}><CheckCircle size={64} color="var(--color-primary)" /><h1>Order received</h1><p>Order <strong>#{order.orderId}</strong> is {order.status}.</p><button className="btn btn-primary" onClick={() => navigate('/orders')}>View My Orders</button></div>;

  return <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 80px' }}>
    <h1 style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-primary-dark)' }}>Express Checkout</h1>
    {error && <div role="alert" style={{ color: '#b91c1c', padding: 12 }}>{error}</div>}
    {loading ? <p>Loading checkout…</p> : <form onSubmit={placeOrder}>
      <section style={{ background: '#fff', padding: 28, borderRadius: 8 }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Truck size={20} /> Delivery Address</h2>
        {addresses.map((address) => <label key={address.id} style={{ display: 'block', padding: 12, border: `2px solid ${selectedAddressId === address.id ? 'var(--color-primary)' : 'var(--color-border)'}`, borderRadius: 6, marginTop: 10 }}>
          <input type="radio" name="address" checked={selectedAddressId === address.id} onChange={() => setSelectedAddressId(address.id)} /> {address.recipientName}
          <div style={{ marginLeft: 22 }}>{address.line1}, {address.city} · {address.phone}</div>
        </label>)}
        <button type="button" className="btn btn-outline" onClick={() => setShowForm((current) => !current)} style={{ marginTop: 16 }}>{showForm ? 'Close' : 'Add New Address'}</button>
        {showForm && <div style={{ display: 'grid', gap: 14, marginTop: 18, paddingTop: 18, borderTop: '1px solid var(--color-border)' }}>
          <label style={fieldStyle}>Full Name <span style={{ color: '#dc2626' }}>*</span><input required value={newAddress.fullName} onChange={(event) => setAddressField('fullName', event.target.value)} style={inputStyle} /></label>
          <label style={fieldStyle}>Full Address <span style={{ color: '#dc2626' }}>*</span><textarea required rows="3" value={newAddress.fullAddress} onChange={(event) => setAddressField('fullAddress', event.target.value)} style={inputStyle} /></label>
          <label style={fieldStyle}>District <span style={{ color: '#dc2626' }}>*</span><input required value={newAddress.district} onChange={(event) => setAddressField('district', event.target.value)} style={inputStyle} /></label>
          <label style={fieldStyle}>Contact Number <span style={{ color: '#dc2626' }}>*</span><input required type="tel" value={newAddress.contactNumber} onChange={(event) => setAddressField('contactNumber', event.target.value)} style={inputStyle} /></label>
          <button type="button" className="btn btn-primary" onClick={saveAddress} disabled={saving}>{saving ? 'Saving…' : 'Save Address'}</button>
        </div>}
        <button className="btn btn-primary" style={{ marginTop: 28, width: '100%' }} disabled={placing || !selected || !cartItems.length || unavailable}>{placing ? 'Processing…' : 'Place Order'}</button>
      </section>
    </form>}
  </div>;
};
