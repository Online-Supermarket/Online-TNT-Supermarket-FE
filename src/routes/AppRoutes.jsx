import {Navigate,Route,Routes} from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import RoleRoute from '../components/RoleRoute';
import MainLayout from '../layouts/MainLayout';
import AdminLayout from '../layouts/AdminLayout';
import StaffLayout from '../layouts/StaffLayout';
import DeliveryLayout from '../layouts/DeliveryLayout';

import Home from '../pages/public/Home';
import About from '../pages/public/About';
import Categories from '../pages/public/Categories';
import Offers from '../pages/public/Offers';
import Contact from '../pages/public/Contact';
import Login from '../pages/public/Login';
import Register from '../pages/public/Register';
import CustomerProfile from '../pages/customer/CustomerProfile';
import Cart from '../pages/customer/Cart';
import Checkout from '../pages/customer/Checkout';
import OrderHistory from '../pages/customer/OrderHistory';

import AdminDashboard from '../pages/admin/AdminDashboard';
import ManageUsers from '../pages/admin/ManageUsers';
import ManageProducts from '../pages/admin/ManageProducts';
import ManageCategories from '../pages/admin/ManageCategories';
import ManageOrders from '../pages/admin/ManageOrders';
import ManageOffers from '../pages/admin/ManageOffers';
import ManageStaff from '../pages/admin/ManageStaff';
import ManageDelivery from '../pages/admin/ManageDelivery';
import Reports from '../pages/admin/Reports';
import Profile from '../pages/admin/Profile';

import StaffDashboard from '../pages/staff/StaffDashboard';
import StaffProducts from '../pages/staff/StaffProducts';
import Inventory from '../pages/staff/Inventory';
import StaffOrders from '../pages/staff/StaffOrders';

import DeliveryDashboard from '../pages/delivery/DeliveryDashboard';
import AssignedDeliveries from '../pages/delivery/AssignedDeliveries';
import DeliveryHistory from '../pages/delivery/DeliveryHistory';
import DeliveryProfile from '../pages/delivery/DeliveryProfile';

/** Convenience wrapper: requires auth + the given role. */
const Guard = ({role, children}) =>
  <ProtectedRoute><RoleRoute roles={[role]}>{children}</RoleRoute></ProtectedRoute>;

export default function AppRoutes() {
  return (
    <Routes>
      {/* ── Public / customer routes ─────────────────────────────── */}
      <Route element={<MainLayout/>}>
        <Route index element={<Home/>}/>
        <Route path="about"      element={<About/>}/>
        <Route path="categories" element={<Categories/>}/>
        <Route path="offers"     element={<Offers/>}/>
        <Route path="contact"    element={<Contact/>}/>
        <Route path="cart"       element={<Cart/>}/>
        <Route path="profile"    element={<Guard role="CUSTOMER"><CustomerProfile/></Guard>}/>
        <Route path="checkout"   element={<Guard role="CUSTOMER"><Checkout/></Guard>}/>
        <Route path="orders"     element={<Guard role="CUSTOMER"><OrderHistory/></Guard>}/>
      </Route>

      {/* ── Auth pages ───────────────────────────────────────────── */}
      <Route path="login"    element={<Login/>}/>
      <Route path="register" element={<Register/>}/>

      {/* ── Admin portal ─────────────────────────────────────────── */}
      <Route path="admin" element={<Guard role="ADMIN"><AdminLayout/></Guard>}>
        <Route index element={<Navigate to="dashboard"/>}/>
        <Route path="dashboard"  element={<AdminDashboard/>}/>
        <Route path="users"      element={<ManageUsers/>}/>
        <Route path="products"   element={<ManageProducts/>}/>
        <Route path="categories" element={<ManageCategories/>}/>
        <Route path="inventory"  element={<Inventory/>}/>
        <Route path="orders"     element={<ManageOrders/>}/>
        <Route path="offers"     element={<ManageOffers/>}/>
        <Route path="staff"      element={<ManageStaff/>}/>
        <Route path="delivery"   element={<ManageDelivery/>}/>
        <Route path="reports"    element={<Reports/>}/>
        <Route path="profile"    element={<Profile/>}/>
      </Route>

      {/* ── Staff portal ─────────────────────────────────────────── */}
      <Route path="staff" element={<Guard role="STAFF"><StaffLayout/></Guard>}>
        <Route index element={<Navigate to="dashboard"/>}/>
        <Route path="dashboard" element={<StaffDashboard/>}/>
        <Route path="products"  element={<StaffProducts/>}/>
        <Route path="inventory" element={<Inventory/>}/>
        <Route path="orders"    element={<StaffOrders/>}/>
        <Route path="profile"   element={<Profile/>}/>
      </Route>

      {/* ── Delivery portal ──────────────────────────────────────── */}
      <Route path="delivery" element={<Guard role="DELIVERY"><DeliveryLayout/></Guard>}>
        <Route index element={<Navigate to="dashboard"/>}/>
        <Route path="dashboard" element={<DeliveryDashboard/>}/>
        <Route path="orders"    element={<AssignedDeliveries/>}/>
        <Route path="assigned"  element={<Navigate to="/delivery/orders" replace/>}/>
        <Route path="history"   element={<DeliveryHistory/>}/>
        <Route path="profile"   element={<DeliveryProfile/>}/>
      </Route>

      <Route path="*" element={<Navigate to="/" replace/>}/>
    </Routes>
  );
}
