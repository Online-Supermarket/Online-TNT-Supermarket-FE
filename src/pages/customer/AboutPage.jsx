import React from 'react';
import { Leaf, Award, Users, Heart } from 'lucide-react';

export const AboutPage = () => {
  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '56px 24px 80px' }}>
      <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto 60px' }}>
        <span className="kicker-badge">OUR STORY</span>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '3rem', color: 'var(--color-primary-dark)', marginBottom: 20 }}>
          Cultivating a healthier, happier community.
        </h1>
        <p style={{ color: 'var(--color-muted)', fontSize: '1.15rem', lineHeight: 1.7 }}>
          TNT Online Supermarket was founded with a single mission: to eliminate the barrier between local organic farms and everyday household tables.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32, marginBottom: 80 }}>
        <div style={{ background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 32, textAlign: 'center' }}>
          <div className="benefit-icon" style={{ margin: '0 auto 16px' }}><Leaf size={28} /></div>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', marginBottom: 10 }}>100% Organic Sourcing</h3>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.95rem' }}>Partnered directly with non-GMO, zero-chemical certified local orchards and green farms.</p>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 32, textAlign: 'center' }}>
          <div className="benefit-icon" style={{ margin: '0 auto 16px' }}><Award size={28} /></div>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', marginBottom: 10 }}>Quality Inspected</h3>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.95rem' }}>Every produce item is individually inspected by catalog staff before loading into refrigerated vans.</p>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 32, textAlign: 'center' }}>
          <div className="benefit-icon" style={{ margin: '0 auto 16px' }}><Heart size={28} /></div>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', marginBottom: 10 }}>Community First</h3>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.95rem' }}>A portion of all monthly sales supports local food banks and sustainable agriculture education.</p>
        </div>
      </div>
    </div>
  );
};
