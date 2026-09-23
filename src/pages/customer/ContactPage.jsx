import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react';

export const ContactPage = () => {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '56px 24px 80px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 48 }}>
        <div>
          <span className="kicker-badge">GET IN TOUCH</span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.8rem', color: 'var(--color-primary-dark)', marginBottom: 20 }}>
            We're here to help you live fresh.
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '1.05rem', marginBottom: 32 }}>
            Have questions about an active order, product sourcing, or delivery windows? Send us a message and our support team will respond within 15 minutes.
          </p>

          <div style={{ display: 'grid', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className="benefit-icon"><MapPin size={20} /></div>
              <div>
                <div style={{ fontWeight: 700 }}>Headquarters Address</div>
                <div style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>100 Market St, Fresh City, FC 90210</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className="benefit-icon"><Phone size={20} /></div>
              <div>
                <div style={{ fontWeight: 700 }}>Toll-Free Phone Hotline</div>
                <div style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>+1 (800) 868-3737 (24/7 Available)</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className="benefit-icon"><Mail size={20} /></div>
              <div>
                <div style={{ fontWeight: 700 }}>Support Email</div>
                <div style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>support@tntmarket.local</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 40, boxShadow: 'var(--shadow-md)' }}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <CheckCircle size={48} color="var(--color-primary)" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', marginBottom: 8 }}>Thank You!</h3>
              <p style={{ color: 'var(--color-muted)' }}>Your inquiry has been received. Our team will contact you shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: 6 }}>Your Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: 6 }}>Email Address</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: 6 }}>Subject</label>
                <input
                  type="text"
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: 6 }}>Message</label>
                <textarea
                  rows={4}
                  required
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', outline: 'none', fontFamily: 'var(--font-sans)' }}
                />
              </div>

              <button className="btn btn-primary" style={{ width: '100%' }}><Send size={16} /> Send Message</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
