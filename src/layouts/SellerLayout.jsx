import PortalLayout from './PortalLayout';

const items = [
  ['/seller/dashboard', 'Dashboard',  'LayoutDashboard'],
  ['/seller/profile',   'Profile',    'CircleUserRound'],
].map(([to, label, icon]) => ({ to, label, icon }));

export default function SellerLayout() {
  return <PortalLayout role="Seller" items={items} />;
}
