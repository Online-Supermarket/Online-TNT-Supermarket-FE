import React from 'react';
import { Truck, ShieldCheck, PhoneCall } from 'lucide-react';

export const AnnouncementBar = () => {
  return (
    <div className="announcement-bar">
      <div className="announcement-item">
        <ShieldCheck size={16} />
        <span>Fresh groceries, happier homes.</span>
      </div>
      <div className="announcement-item" style={{ fontWeight: 600 }}>
        <Truck size={16} />
        <span>Free express delivery on orders over $50</span>
      </div>
      <div className="announcement-item">
        <PhoneCall size={16} />
        <span>Help & Support: 1-800-TNT-FRESH</span>
      </div>
    </div>
  );
};
