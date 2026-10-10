import { downloadInvoicePdf } from '../../components/invoice/downloadInvoice';
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Banknote, Building2, CheckCircle, Download, Eye, FileCheck, Trash2, Truck, Upload, X } from 'lucide-react';
import MobileNumberInput from '../../components/MobileNumberInput';
import { SL_DISTRICTS } from '../../utils/districts';
import InvoiceModal from '../../components/invoice/InvoiceModal';
import { paymentLabel } from '../../components/invoice/invoicePdf';
import { useCart } from '../../context/CartContext';
import axiosInstance, { apiUrl } from '../../services/axiosInstance';

const emptyAddress = { fullName: '', fullAddress: '', district: '', contactNumber: '07' };
const newKey = () => globalThis.crypto?.randomUUID?.() || `checkout-${Date.now()}`;
const fieldStyle = { display: 'grid', gap: 6, fontWeight: 700, fontSize: '.9rem' };
const inputStyle = { padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: 6, font: 'inherit' };

// JSON receipt fallback avoids gateways that reject otherwise valid multipart boundaries.
// The Order Service validates the decoded PDF exactly as it validates multipart uploads.
const postReceiptOrder = async (addressId, receiptFile, idempotencyKey) => {
  const baseUrl = apiUrl('').replace(/\/$/, '');
  const token = localStorage.getItem('marketflowToken');
  const bytes = new Uint8Array(await receiptFile.arrayBuffer());
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  const response = await fetch(`${baseUrl}/order/orders`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Idempotency-Key': idempotencyKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ addressId, paymentMethod: 'BankTransfer', receiptName: receiptFile.name, receiptContentType: receiptFile.type || 'application/pdf', receiptBase64: btoa(binary) }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const validation = payload?.errors && Object.entries(payload.errors).map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`).join(' | ');
    const error = new Error(payload?.message || payload?.error || validation || payload?.title || `Order request failed (${response.status}).`);
    error.status = response.status;
    throw error;
  }
  return payload;
};

export const CheckoutPage = () => {
  const { cartItems, refreshBasket, discardCheckoutSnapshot } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [checkoutSnapshot] = useState(() => {
    if (location.state?.checkoutSnapshot) return location.state.checkoutSnapshot;
    try { return JSON.parse(sessionStorage.getItem('tnt-checkout-basket') || 'null'); } catch { return null; }
  });
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
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptError, setReceiptError] = useState('');
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState('');
  const [showInvoice, setShowInvoice] = useState(false);
  const [idempotencyKey] = useState(newKey);

  useEffect(() => {
    const requests = [
      axiosInstance.get('/order/addresses'),
      axiosInstance.get('/identity/users/me').catch(() => null)
    ];
    if (!checkoutSnapshot) requests.splice(1, 0, refreshBasket());
    Promise.all(requests)
      .then(([data, ...rest]) => {
        const profile = checkoutSnapshot ? rest[0] : rest[1];
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
  }, [refreshBasket, checkoutSnapshot]);

  const selected = useMemo(() => addresses.find((address) => address.id === selectedAddressId) || (accountAddress?.id === selectedAddressId ? accountAddress : null), [addresses, accountAddress, selectedAddressId]);
  const checkoutLines = checkoutSnapshot?.lines || cartItems;
  const unavailable = checkoutLines.some((item) => item.available === false);
  const restoreCart = async () => { discardCheckoutSnapshot(); await refreshBasket(); };
  const failCheckout = (message) => { setError(message); restoreCart().catch(() => {}); };
  const setAddressField = (field, value) => setNewAddress((current) => ({ ...current, [field]: value }));

  const handleReceiptChange = (e) => {
    setReceiptError('');
    const file = e.target.files?.[0];
    if (!file) {
      setReceiptFile(null);
      return;
    }
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setReceiptError('Only PDF documents (.pdf) are accepted as payment receipts.');
      setReceiptFile(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setReceiptError(`Receipt PDF exceeds the 5 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
      setReceiptFile(null);
      return;
    }
    setReceiptFile(file);
  };

  const saveAddress = async () => {
    setError('');
    
    const name = newAddress.fullName.trim();
    const address = newAddress.fullAddress.trim();
    const district = newAddress.district.trim();
    const phone = newAddress.contactNumber.trim();

    if (!name || !address || !district || !phone) {
      setError('Please fill in all required fields (Name, Address, District, and Contact Number).');
      return;
    }

    if (name.length < 3) {
      setError('Please enter a valid full name (minimum 3 characters).');
      return;
    }

    if (address.length < 10) {
      setError('Please enter a complete, detailed delivery address.');
      return;
    }

    if (!SL_DISTRICTS.includes(district)) {
      setError('Please select a district from the list.');
      return;
    }

    const phoneRegex = /^07[0-9]{8}$/;
    if (!phoneRegex.test(phone)) {
      setError('Please enter all 10 digits of your mobile number (e.g., 077-1234567).');
      return;
    }

    const payload = {
      recipientName: name,
      line1: address,
      line2: null,
      city: district,
      zone: district,
      phone: phone,
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
    if (!selectedAddressId) return failCheckout('Select a delivery address.');
    if (!checkoutLines.length) return failCheckout('Your basket is empty.');
    if (unavailable) return failCheckout('Remove unavailable products before checkout.');

    if (paymentMethod === 'BankTransfer' && !receiptFile) {
      return failCheckout('Please select and upload your bank transfer payment receipt PDF.');
    }

    setPlacing(true);
    setError('');
    let orderCreated = false;
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

      let createdOrder;
      if (paymentMethod === 'BankTransfer') {
        createdOrder = await postReceiptOrder(addressId, receiptFile, idempotencyKey);
      } else {
        createdOrder = await axiosInstance.post('/order/orders', {
          addressId,
          paymentMethod: 'CashOnDelivery',
        }, {
          headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
        });
      }

      orderCreated = true;
      setOrder(createdOrder);
      discardCheckoutSnapshot();
      // These are follow-up reads. They must never turn a successfully created order into
      // an error state or trigger cart restoration/another order submission.
      await loadInvoice(createdOrder.orderId);
      await refreshBasket().catch(() => null);
    } catch (err) {
      if (!orderCreated) {
        setError(err.message || 'Unable to place order.');
        await restoreCart();
      }
    } finally {
      setPlacing(false);
    }
  };

  const downloadInvoice = () => {
    if (!invoice) return;
    downloadInvoicePdf(invoice, paymentMethod);
  };

  if (order) return <div style={{ maxWidth: 640, margin: '60px auto', textAlign: 'center', background: '#fff', padding: '40px 32px', borderRadius: 12, border: '1px solid var(--color-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
    <CheckCircle size={64} color="var(--color-primary)" style={{ margin: '0 auto 16px' }} />
    <h1 style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-primary-dark)', marginBottom: 8 }}>Order Received!</h1>
    <p style={{ fontSize: '1.1rem', marginBottom: 12 }}>Order <strong>#{order.orderId}</strong> is {order.status}.</p>
    <div style={{ display: 'inline-block', background: 'var(--color-soft-mint)', padding: '8px 16px', borderRadius: 20, fontWeight: 600, color: 'var(--color-primary-dark)', marginBottom: 16 }}>
      Payment: {paymentLabel(paymentMethod === 'BankTransfer' ? 'BankTransfer' : 'COD')}
    </div>
    {paymentMethod === 'BankTransfer' && (
      <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 8, padding: '14px 18px', textAlign: 'left', margin: '16px 0 24px', fontSize: '0.92rem', color: '#92400e' }}>
        <strong>Payment Status: Pending Verification</strong>
        <p style={{ margin: '4px 0 0' }}>Your payment receipt was uploaded successfully. Our operations team will review and verify your receipt before confirming the order for delivery.</p>
      </div>
    )}
    {invoiceLoading ? <p>Preparing your invoice…</p> : invoice ? <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', margin: '24px 0' }}>
      <button className="btn btn-outline" onClick={() => setShowInvoice(true)}><Eye size={18} /> View Invoice</button>
      <button className="btn btn-primary" onClick={downloadInvoice}><Download size={18} /> Download PDF</button>
    </div> : <div role="alert" style={{ margin: '24px 0' }}><p>{invoiceError || 'Your invoice is not available yet.'}</p><button className="btn btn-outline" onClick={() => loadInvoice(order.orderId)}>Retry Invoice</button></div>}
    <button className="btn btn-outline" onClick={() => navigate('/orders')}>View My Orders</button>
    {showInvoice && invoice && <InvoiceModal invoice={invoice} paymentMethod={paymentMethod} onClose={() => setShowInvoice(false)} onDownload={downloadInvoice} />}
  </div>;

  return <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 80px' }}>
    <h1 style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-primary-dark)' }}>Express Checkout</h1>
    {error && <div role="alert" style={{ color: '#b91c1c', background: '#fee2e2', border: '1px solid #fecaca', padding: '12px 16px', borderRadius: 8, marginBottom: 20 }}>{error}</div>}
    {loading ? <p>Loading checkout…</p> : <form onSubmit={placeOrder}>
      <section style={{ background: '#fff', padding: 28, borderRadius: 8, border: '1px solid var(--color-border)' }}>
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
          <label style={fieldStyle}><span>District <span style={{ color: '#dc2626' }}>*</span></span><select required value={newAddress.district} onChange={(event) => setAddressField('district', event.target.value)} style={{ ...inputStyle, background: '#fff', color: 'inherit', width: '100%' }}><option value="" disabled>Select your district</option>{SL_DISTRICTS.map(district => <option key={district} value={district}>{district}</option>)}</select></label>
          <div style={fieldStyle}><label htmlFor="delivery-contact-number">Contact Number <span style={{ color: '#dc2626' }}>*</span></label><MobileNumberInput id="delivery-contact-number" value={newAddress.contactNumber} onChange={value => setAddressField('contactNumber', value)} /></div>
          <button type="button" className="btn btn-primary" onClick={saveAddress} disabled={saving}>{saving ? 'Saving…' : 'Save Address'}</button>
        </div>}
        <div style={{ marginTop: 28, paddingTop: 22, borderTop: '1px solid var(--color-border)' }}>
          <h2 style={{ marginBottom: 14 }}>Payment Method</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <button type="button" onClick={() => setPaymentMethod('COD')} style={{ textAlign: 'left', padding: 16, borderRadius: 8, border: `2px solid ${paymentMethod === 'COD' ? 'var(--color-primary)' : 'var(--color-border)'}`, background: paymentMethod === 'COD' ? 'var(--color-soft-mint)' : '#fff', cursor: 'pointer' }}>
              <Banknote size={22} color="var(--color-primary)" />
              <strong style={{ display: 'block', marginTop: 8 }}>Cash on Delivery</strong>
              <small style={{ color: 'var(--color-muted)' }}>Pay with cash when your order is delivered to your door.</small>
            </button>
            <button type="button" onClick={() => setPaymentMethod('BankTransfer')} style={{ textAlign: 'left', padding: 16, borderRadius: 8, border: `2px solid ${paymentMethod === 'BankTransfer' ? 'var(--color-primary)' : 'var(--color-border)'}`, background: paymentMethod === 'BankTransfer' ? 'var(--color-soft-mint)' : '#fff', cursor: 'pointer' }}>
              <Building2 size={22} color="var(--color-primary)" />
              <strong style={{ display: 'block', marginTop: 8 }}>Bank Transfer</strong>
              <small style={{ color: 'var(--color-muted)' }}>Direct deposit / online transfer with PDF receipt upload.</small>
            </button>
          </div>

          {paymentMethod === 'BankTransfer' && (
            <div style={{ marginTop: 20, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 22 }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 12px', color: 'var(--color-primary-dark)', fontSize: '1.05rem' }}>
                <Building2 size={18} /> Bank Account Details
              </h3>
              <p style={{ margin: '0 0 14px', fontSize: '0.88rem', color: 'var(--color-muted)' }}>
                Please transfer the exact total amount to our bank account below, then upload the deposit slip or transaction receipt as a PDF.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, background: '#fff', padding: 16, borderRadius: 8, border: '1px solid var(--color-border)', marginBottom: 20 }}>
                <div>
                  <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--color-muted)', fontWeight: 600 }}>Bank Name</span>
                  <div style={{ fontWeight: 700, color: 'var(--color-text-dark)', marginTop: 2 }}>Bank of Ceylon</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--color-muted)', fontWeight: 600 }}>Account Name</span>
                  <div style={{ fontWeight: 700, color: 'var(--color-text-dark)', marginTop: 2 }}>TNT Supermarket</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--color-muted)', fontWeight: 600 }}>Account Number</span>
                  <div style={{ fontWeight: 700, color: 'var(--color-text-dark)', marginTop: 2, fontFamily: 'monospace', fontSize: '1.05rem' }}>0012345678</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--color-muted)', fontWeight: 600 }}>Branch</span>
                  <div style={{ fontWeight: 700, color: 'var(--color-text-dark)', marginTop: 2 }}>Colombo Main Branch</div>
                </div>
              </div>

              <h4 style={{ margin: '0 0 8px', fontSize: '0.95rem' }}>Upload Payment Receipt (PDF) <span style={{ color: '#dc2626' }}>*</span></h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--color-muted)', margin: '0 0 10px' }}>Only PDF files up to 5 MB are accepted.</p>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: '#fff', border: '1px dashed var(--color-primary)', borderRadius: 8, cursor: 'pointer', fontWeight: 600, color: 'var(--color-primary)' }}>
                  <Upload size={18} /> {receiptFile ? 'Change Receipt PDF' : 'Select PDF Receipt'}
                  <input type="file" accept=".pdf,application/pdf" onChange={handleReceiptChange} style={{ display: 'none' }} />
                </label>
                {receiptFile && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '8px 14px', borderRadius: 8, fontSize: '0.88rem', color: '#065f46' }}>
                    <FileCheck size={16} />
                    <span><strong>{receiptFile.name}</strong> ({(receiptFile.size / 1024).toFixed(0)} KB)</span>
                    <button type="button" className="btn btn-ghost" onClick={() => setReceiptFile(null)} style={{ padding: 2, color: '#dc2626' }} title="Remove file"><X size={16} /></button>
                  </div>
                )}
              </div>
              {receiptError && <div style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: 8 }}>{receiptError}</div>}
            </div>
          )}
        </div>
        <button type="submit" className="btn btn-primary" style={{ marginTop: 28, width: '100%' }} disabled={placing || !selected || !checkoutLines.length || unavailable || (paymentMethod === 'BankTransfer' && !receiptFile)}>{placing ? 'Processing…' : 'Place Order'}</button>
      </section>
    </form>}
  </div>;
};
