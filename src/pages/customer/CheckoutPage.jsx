import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Banknote, CheckCircle, CreditCard, Download, Eye, FileText, Trash2, Truck, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import axiosInstance from '../../services/axiosInstance';

const emptyAddress = { fullName: '', fullAddress: '', district: '', contactNumber: '' };
const newKey = () => globalThis.crypto?.randomUUID?.() || `checkout-${Date.now()}`;
const fieldStyle = { display: 'grid', gap: 6, fontWeight: 700, fontSize: '.9rem' };
const inputStyle = { padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: 6, font: 'inherit' };
const paymentLabel = (method) => method === 'CARD' ? 'Credit / Debit Card' : 'Cash on Delivery';

const pdfSafe = (value) => String(value ?? '').replace(/[^\x20-\x7E]/g, '?').replace(/[\\()]/g, '\\$&');
const createInvoicePdf = (invoice, paymentMethod) => {
  const money = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;
  const lines = [
    'TNT ONLINE SUPERMARKET',
    'INVOICE',
    `Invoice / Order: ${invoice.id}`,
    `Date: ${new Date(invoice.createdAt).toLocaleString()}`,
    `Order status: ${invoice.status}`,
    `Payment method: ${paymentLabel(paymentMethod)}`,
    '',
    'ITEMS',
    ...(invoice.items || []).flatMap((item) => [`${item.name} x ${item.quantity}`, `  ${money(item.unitPrice)} each     ${money(item.lineTotal)}`]),
    '',
    `Subtotal: ${money(invoice.subtotal)}`,
    `Tax: ${money(invoice.tax)}`,
    `Delivery: ${money(invoice.deliveryFee)}`,
    `TOTAL: ${money(invoice.total)}`,
    '',
    'Thank you for shopping with TNT Online Supermarket.',
  ];
  const stream = ['BT', '/F1 12 Tf', '50 760 Td', '16 TL', ...lines.flatMap((line, index) => [`(${pdfSafe(line)}) Tj`, index < lines.length - 1 ? 'T*' : '']), 'ET'].filter(Boolean).join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n'; const offsets = [0];
  objects.forEach((object, index) => { offsets.push(pdf.length); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: 'application/pdf' });
};

export const CheckoutPage = () => {
  const { cartItems, refreshBasket } = useCart();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [accountAddress, setAccountAddress] = useState(null);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [newAddress, setNewAddress] = useState(emptyAddress);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingAddressId, setDeletingAddressId] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState('');
  const [showInvoice, setShowInvoice] = useState(false);
  const [idempotencyKey] = useState(newKey);

  useEffect(() => {
    Promise.all([axiosInstance.get('/order/addresses'), refreshBasket(), axiosInstance.get('/identity/users/me').catch(() => null)])
      .then(([data, , profile]) => {
        const list = Array.isArray(data) ? data : [];
        setAddresses(list);
        const registeredAddress = profile?.address && profile?.district && profile?.contactNumber
          ? { id: 'account-address', recipientName: profile.fullName || profile.displayName, line1: profile.address, city: profile.district, zone: profile.district, phone: profile.contactNumber }
          : null;
        setAccountAddress(registeredAddress);
        if (list[0]) setSelectedAddressId(list[0].id);
        else if (registeredAddress) setSelectedAddressId(registeredAddress.id);
      })
      .catch((err) => setError(err.message || 'Unable to load checkout.'))
      .finally(() => setLoading(false));
  }, [refreshBasket]);

  const selected = useMemo(() => addresses.find((address) => address.id === selectedAddressId) || (accountAddress?.id === selectedAddressId ? accountAddress : null), [addresses, accountAddress, selectedAddressId]);
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

  const deleteAddress = async (event, addressId) => {
    event.preventDefault();
    event.stopPropagation();
    if (!window.confirm('Delete this saved delivery address?')) return;

    setDeletingAddressId(addressId);
    setError('');
    try {
      await axiosInstance.delete(`/order/addresses/${addressId}`);
      setAddresses((current) => {
        const remaining = current.filter((address) => address.id !== addressId);
        if (selectedAddressId === addressId) setSelectedAddressId(remaining[0]?.id || accountAddress?.id || '');
        return remaining;
      });
    } catch (err) {
      setError(err.message || 'Unable to delete address.');
    } finally {
      setDeletingAddressId(null);
    }
  };

  const loadInvoice = async (orderId) => {
    setInvoiceLoading(true);
    setInvoiceError('');
    try {
      setInvoice(await axiosInstance.get(`/order/orders/${orderId}`));
    } catch (invoiceRequestError) {
      setInvoiceError(invoiceRequestError.message || 'Your order was created, but the invoice could not be loaded yet.');
    } finally {
      setInvoiceLoading(false);
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
      let addressId = selectedAddressId;
      if (selectedAddressId === accountAddress?.id) {
        const saved = await axiosInstance.post('/order/addresses', {
          recipientName: accountAddress.recipientName,
          line1: accountAddress.line1,
          line2: null,
          city: accountAddress.city,
          zone: accountAddress.zone,
          phone: accountAddress.phone,
        });
        addressId = saved.id;
        const savedAddress = { ...accountAddress, id: addressId };
        setAddresses((current) => [...current, savedAddress]);
        setSelectedAddressId(addressId);
        setAccountAddress(null);
      }
      const createdOrder = await axiosInstance.post('/order/orders', { addressId }, { headers: { 'Idempotency-Key': idempotencyKey } });
      setOrder(createdOrder);
      await loadInvoice(createdOrder.orderId);
      await refreshBasket();
    } catch (err) {
      setError(err.message || 'Unable to place order.');
    } finally {
      setPlacing(false);
    }
  };

  const downloadInvoice = () => {
    if (!invoice) return;
    const url = URL.createObjectURL(createInvoicePdf(invoice, paymentMethod));
    const link = document.createElement('a');
    link.href = url;
    link.download = `TNT-invoice-${invoice.id}.pdf`;
    document.body.appendChild(link);
    link.click();
    window.setTimeout(() => {
      link.remove();
      URL.revokeObjectURL(url);
    }, 0);
  };

  if (order) return <div style={{ maxWidth: 640, margin: '60px auto', textAlign: 'center' }}>
    <CheckCircle size={64} color="var(--color-primary)" />
    <h1>Order received</h1>
    <p>Order <strong>#{order.orderId}</strong> is {order.status}.</p>
    <p style={{ color: 'var(--color-muted)' }}>Payment method: {paymentLabel(paymentMethod)}</p>
    {invoiceLoading ? <p>Preparing your invoice…</p> : invoice ? <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', margin: '24px 0' }}>
      <button className="btn btn-outline" onClick={() => setShowInvoice(true)}><Eye size={18} /> View Invoice</button>
      <button className="btn btn-primary" onClick={downloadInvoice}><Download size={18} /> Download PDF</button>
    </div> : <div role="alert" style={{ margin: '24px 0' }}><p>{invoiceError || 'Your invoice is not available yet.'}</p><button className="btn btn-outline" onClick={() => loadInvoice(order.orderId)}>Retry Invoice</button></div>}
    <button className="btn btn-outline" onClick={() => navigate('/orders')}>View My Orders</button>
    {showInvoice && invoice && <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'grid', placeItems: 'center', padding: 20, background: 'rgba(0,0,0,.45)' }}>
      <div style={{ maxWidth: 680, width: '100%', maxHeight: '85vh', overflowY: 'auto', background: '#fff', borderRadius: 12, padding: 28, textAlign: 'left' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div><h2 style={{ margin: 0 }}>TNT Online Supermarket</h2><p style={{ margin: '4px 0', color: 'var(--color-muted)' }}>Invoice #{invoice.id}</p></div><button className="btn btn-ghost" onClick={() => setShowInvoice(false)} aria-label="Close invoice"><X size={20} /></button></div>
        <p><strong>Order status:</strong> {invoice.status}<br /><strong>Payment method:</strong> {paymentLabel(paymentMethod)}<br /><strong>Date:</strong> {new Date(invoice.createdAt).toLocaleString()}</p>
        <p><strong>Delivery address:</strong><br />{invoice.address?.recipientName}<br />{invoice.address?.line1}, {invoice.address?.city}<br />{invoice.address?.phone}</p>
        <div style={{ borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', padding: '12px 0' }}>{invoice.items?.map((item) => <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '6px 0' }}><span>{item.name} × {item.quantity}</span><strong>Rs. {Number(item.lineTotal).toFixed(2)}</strong></div>)}</div>
        <div style={{ marginTop: 14, display: 'grid', gap: 6, textAlign: 'right' }}><span>Subtotal: Rs. {Number(invoice.subtotal).toFixed(2)}</span><span>Tax: Rs. {Number(invoice.tax).toFixed(2)}</span><span>Delivery: Rs. {Number(invoice.deliveryFee).toFixed(2)}</span><strong style={{ fontSize: '1.2rem' }}>Total: Rs. {Number(invoice.total).toFixed(2)}</strong></div>
        <button className="btn btn-primary" onClick={downloadInvoice} style={{ width: '100%', marginTop: 20 }}><FileText size={18} /> Download PDF Invoice</button>
      </div>
    </div>}
  </div>;

  return <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 80px' }}>
    <h1 style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-primary-dark)' }}>Express Checkout</h1>
    {error && <div role="alert" style={{ color: '#b91c1c', padding: 12 }}>{error}</div>}
    {loading ? <p>Loading checkout…</p> : <form onSubmit={placeOrder}>
      <section style={{ background: '#fff', padding: 28, borderRadius: 8 }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Truck size={20} /> Delivery Address</h2>
        {accountAddress && <label style={{ display: 'block', padding: 12, border: `2px solid ${selectedAddressId === accountAddress.id ? 'var(--color-primary)' : 'var(--color-border)'}`, borderRadius: 6, marginTop: 10, background: 'var(--color-soft-mint)' }}>
          <input type="radio" name="address" checked={selectedAddressId === accountAddress.id} onChange={() => setSelectedAddressId(accountAddress.id)} /> <strong>Account address</strong> · {accountAddress.recipientName}
          <div style={{ marginLeft: 22 }}>{accountAddress.line1}, {accountAddress.city} · {accountAddress.phone}</div>
        </label>}
        {addresses.map((address) => <label key={address.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 12, border: `2px solid ${selectedAddressId === address.id ? 'var(--color-primary)' : 'var(--color-border)'}`, borderRadius: 6, marginTop: 10 }}>
          <span><input type="radio" name="address" checked={selectedAddressId === address.id} onChange={() => setSelectedAddressId(address.id)} /> {address.recipientName}<span style={{ display: 'block', marginLeft: 22 }}>{address.line1}, {address.city} · {address.phone}</span></span>
          <button type="button" className="btn btn-ghost" title="Delete address" aria-label={`Delete ${address.recipientName}'s address`} disabled={deletingAddressId === address.id} onClick={(event) => deleteAddress(event, address.id)} style={{ color: '#dc2626', padding: 8 }}>{deletingAddressId === address.id ? 'Deleting…' : <Trash2 size={18} />}</button>
        </label>)}
        <button type="button" className="btn btn-outline" onClick={() => setShowForm((current) => !current)} style={{ marginTop: 16 }}>{showForm ? 'Close' : 'Add New Address'}</button>
        {showForm && <div style={{ display: 'grid', gap: 14, marginTop: 18, paddingTop: 18, borderTop: '1px solid var(--color-border)' }}>
          <label style={fieldStyle}>Full Name <span style={{ color: '#dc2626' }}>*</span><input required value={newAddress.fullName} onChange={(event) => setAddressField('fullName', event.target.value)} style={inputStyle} /></label>
          <label style={fieldStyle}>Full Address <span style={{ color: '#dc2626' }}>*</span><textarea required rows="3" value={newAddress.fullAddress} onChange={(event) => setAddressField('fullAddress', event.target.value)} style={inputStyle} /></label>
          <label style={fieldStyle}>District <span style={{ color: '#dc2626' }}>*</span><input required value={newAddress.district} onChange={(event) => setAddressField('district', event.target.value)} style={inputStyle} /></label>
          <label style={fieldStyle}>Contact Number <span style={{ color: '#dc2626' }}>*</span><input required type="tel" value={newAddress.contactNumber} onChange={(event) => setAddressField('contactNumber', event.target.value)} style={inputStyle} /></label>
          <button type="button" className="btn btn-primary" onClick={saveAddress} disabled={saving}>{saving ? 'Saving…' : 'Save Address'}</button>
        </div>}
        <div style={{ marginTop: 28, paddingTop: 22, borderTop: '1px solid var(--color-border)' }}>
          <h2 style={{ marginBottom: 14 }}>Payment Method</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <button type="button" onClick={() => setPaymentMethod('COD')} style={{ textAlign: 'left', padding: 16, borderRadius: 8, border: `2px solid ${paymentMethod === 'COD' ? 'var(--color-primary)' : 'var(--color-border)'}`, background: paymentMethod === 'COD' ? 'var(--color-soft-mint)' : '#fff', cursor: 'pointer' }}><Banknote size={22} color="var(--color-primary)" /><strong style={{ display: 'block', marginTop: 8 }}>Cash on Delivery</strong><small>Pay when your order arrives.</small></button>
            <button type="button" onClick={() => setPaymentMethod('CARD')} style={{ textAlign: 'left', padding: 16, borderRadius: 8, border: `2px solid ${paymentMethod === 'CARD' ? 'var(--color-primary)' : 'var(--color-border)'}`, background: paymentMethod === 'CARD' ? 'var(--color-soft-mint)' : '#fff', cursor: 'pointer' }}><CreditCard size={22} color="var(--color-primary)" /><strong style={{ display: 'block', marginTop: 8 }}>Credit / Debit Card</strong><small>Card payment is simulated; no card details are stored.</small></button>
          </div>
        </div>
        <button className="btn btn-primary" style={{ marginTop: 28, width: '100%' }} disabled={placing || !selected || !cartItems.length || unavailable}>{placing ? 'Processing…' : 'Place Order'}</button>
      </section>
    </form>}
  </div>;
};
