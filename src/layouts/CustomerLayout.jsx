import React from 'react';
import { Outlet } from 'react-router-dom';
import { AnnouncementBar } from '../components/AnnouncementBar';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const CustomerLayout = () => {
  return (
    <div className="app-container">
      <AnnouncementBar />
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
