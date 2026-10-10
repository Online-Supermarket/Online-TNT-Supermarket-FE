import React, { useEffect, useRef } from 'react';
import { Download, Leaf, MapPin, X } from 'lucide-react';
import { invoiceDate, money, paymentLabel, readableStatus } from './invoicePdf';
import './invoice.css';

export default function InvoiceModal({ invoice, paymentMethod, onClose, onDownload }) {
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element.showModal();
    return () => { element.close(); document.body.style.overflow = overflow; previousFocus?.focus(); };
  }, []);
  const address = invoice.address || {};
  return <dialog className="tnt-invoice-modal" ref={dialog} onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }} aria-labelledby="invoice-title">
    <div className="tnt-invoice-toolbar"><span><span className="tnt-invoice-dot" /> Your order, beautifully itemized</span><button autoFocus onClick={onClose} aria-label="Close invoice"><X size={20} /></button></div>
    <article className="tnt-invoice-paper">
      <header className="tnt-invoice-header">
        <div><div className="tnt-invoice-brand"><span className="tnt-invoice-logo"><Leaf size={29} /></span><div><strong>TNT ONLINE</strong><span>SUPERMARKET</span></div></div><p>Fresh essentials. Delivered with care.</p></div>
        <div className="tnt-invoice-heading"><span className="tnt-invoice-eyebrow">A LITTLE FRESHNESS, DELIVERED</span><h2 id="invoice-title">Invoice</h2><span className="tnt-invoice-status">{readableStatus(invoice.status)}</span></div>
      </header>
      <div className="tnt-invoice-content">
        <div className="tnt-invoice-reference"><div><span className="tnt-invoice-label">INVOICE / ORDER REFERENCE</span><strong>{invoice.id}</strong></div><div><span className="tnt-invoice-label">ISSUED ON</span><strong>{invoiceDate(invoice.createdAt)}</strong></div></div>
        <div className="tnt-invoice-details">
          <section><h3><MapPin size={15} /> Deliver to</h3><strong>{address.recipientName || 'Customer'}</strong><address>{[address.line1, address.line2, address.city].filter(Boolean).map((line, i) => <span key={i}>{line}</span>)}{address.phone && <span className="tnt-invoice-phone">{address.phone}</span>}</address></section>
          <section><h3>Payment details</h3><strong>{paymentLabel(invoice.paymentMethod || paymentMethod)}</strong>{invoice.paymentStatus && <p>{readableStatus(invoice.paymentStatus)}</p>}<p className="tnt-invoice-muted">Currency: Sri Lankan Rupee (LKR)</p></section>
        </div>
        <div className="tnt-invoice-table-wrap"><table className="tnt-invoice-table"><caption>Order items</caption><thead><tr><th scope="col">Item description</th><th scope="col">Qty</th><th scope="col">Unit price</th><th scope="col">Amount</th></tr></thead><tbody>{(invoice.items || []).map((item, i) => <tr key={`${item.productId}-${i}`}><td><span className="tnt-invoice-item-number">{String(i + 1).padStart(2, '0')}</span><strong>{item.name}</strong></td><td>{item.quantity}</td><td>{money(item.unitPrice)}</td><td><strong>{money(item.lineTotal)}</strong></td></tr>)}</tbody></table></div>
        <div className="tnt-invoice-summary"><div className="tnt-invoice-note"><Leaf size={24} strokeWidth={1.5} /><h3>Fresh picks.<br />Everyday happiness.</h3><p>Thank you for making TNT part of your day.</p></div><div className="tnt-invoice-totals"><div><span>Subtotal</span><strong>{money(invoice.subtotal)}</strong></div><div><span>Delivery fee</span><strong>{money(invoice.deliveryFee)}</strong></div><div className="tnt-invoice-total"><span>Total <small>LKR</small></span><strong>{money(invoice.total)}</strong></div></div></div>
        <footer className="tnt-invoice-footer"><span>Thank you for shopping with <strong>TNT.</strong></span><span>Please keep this invoice for your records.</span></footer>
      </div>
    </article>
    <div className="tnt-invoice-actions"><span>A fresh look for your records.</span><button className="btn btn-primary" onClick={onDownload}><Download size={17} /> Download PDF Invoice</button></div>
  </dialog>;
}
