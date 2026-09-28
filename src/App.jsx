import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import { CustomerLayout } from './layouts/CustomerLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { StaffLayout } from './layouts/StaffLayout';
import { DeliveryLayout } from './layouts/DeliveryLayout';

// Guard Components
import { ProtectedRoute } from './routes/ProtectedRoute';
import { RoleRoute } from './routes/RoleRoute';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Customer Pages
import { HomePage } from './pages/customer/HomePage';
import { ShopPage } from './pages/customer/ShopPage';
import { OffersPage } from './pages/customer/OffersPage';
import { AboutPage } from './pages/customer/AboutPage';
import { ContactPage } from './pages/customer/ContactPage';
import { CartPage } from './pages/customer/CartPage';
import { CheckoutPage } from './pages/customer/CheckoutPage';
import { OrderHistoryPage } from './pages/customer/OrderHistoryPage';
import { ProfilePage } from './pages/customer/ProfilePage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ManageUsers } from './pages/admin/ManageUsers';
import { ManageProducts } from './pages/admin/ManageProducts';
import { ManageCategories } from './pages/admin/ManageCategories';
import { ManageInventory } from './pages/admin/ManageInventory';
import { ManageOrders } from './pages/admin/ManageOrders';
import { ManageOffers } from './pages/admin/ManageOffers';
import { AdminReports } from './pages/admin/AdminReports';
import { AdminStaffManagement } from './pages/admin/AdminStaffManagement';
import { AdminRiderManagement } from './pages/admin/AdminRiderManagement';
import { AdminCustomerManagement } from './pages/admin/AdminCustomerManagement';


// Staff Pages
import { StaffDashboard } from './pages/staff/StaffDashboard';
import { StaffProducts } from './pages/staff/StaffProducts';
import { StaffInventory } from './pages/staff/StaffInventory';
import { StaffOrders } from './pages/staff/StaffOrders';

// Delivery Driver Pages
import { DeliveryDashboard } from './pages/delivery/DeliveryDashboard';
import { AssignedDeliveries } from './pages/delivery/AssignedDeliveries';
import { DeliveryHistory } from './pages/delivery/DeliveryHistory';
import { DeliveryProfile } from './pages/delivery/DeliveryProfile';

export default function App() {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Customer Portal Layout */}
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/categories" element={<ShopPage />} />
        <Route path="/offers" element={<OffersPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/cart" element={<RoleRoute allowedRoles={['Customer']}><CartPage /></RoleRoute>} />

        {/* Protected Customer Routes */}
        <Route path="/checkout" element={<RoleRoute allowedRoles={['Customer']}><CheckoutPage /></RoleRoute>} />
        <Route path="/orders" element={<RoleRoute allowedRoles={['Customer']}><OrderHistoryPage /></RoleRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      </Route>

      {/* Admin Portal Layout */}
      <Route
        path="/admin"
        element={
          <RoleRoute allowedRoles={['Admin']}>
            <AdminLayout />
          </RoleRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="customers" element={<AdminCustomerManagement />} />
        <Route path="staff" element={<AdminStaffManagement />} />
        <Route path="riders" element={<AdminRiderManagement />} />
        <Route path="users" element={<ManageUsers />} />
        <Route path="products" element={<ManageProducts />} />
        <Route path="categories" element={<ManageCategories />} />

        <Route path="inventory" element={<ManageInventory />} />
        <Route path="orders" element={<ManageOrders />} />
        <Route path="offers" element={<ManageOffers />} />
        <Route path="reports" element={<AdminReports />} />
      </Route>

      {/* Staff Portal Layout */}
      <Route
        path="/staff"
        element={
          <RoleRoute allowedRoles={['Staff', 'Admin']}>
            <StaffLayout />
          </RoleRoute>
        }
      >
        <Route index element={<Navigate to="/staff/dashboard" replace />} />
        <Route path="dashboard" element={<StaffDashboard />} />
        <Route path="products" element={<StaffProducts />} />
        <Route path="categories" element={<ManageCategories />} />
        <Route path="inventory" element={<StaffInventory />} />
        <Route path="orders" element={<StaffOrders />} />
        <Route path="reports" element={<AdminReports />} />
      </Route>

      {/* Delivery Driver Portal Layout */}
      <Route
        path="/delivery"
        element={
          <RoleRoute allowedRoles={['Rider', 'Admin']}>
            <DeliveryLayout />
          </RoleRoute>
        }
      >
        <Route index element={<Navigate to="/delivery/dashboard" replace />} />
        <Route path="dashboard" element={<DeliveryDashboard />} />
        <Route path="orders" element={<AssignedDeliveries />} />
        <Route path="history" element={<DeliveryHistory />} />
        <Route path="profile" element={<DeliveryProfile />} />
      </Route>

      {/* Fallback redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
