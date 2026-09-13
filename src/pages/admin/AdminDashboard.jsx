import {ClipboardClock, Package, ShoppingCart, TriangleAlert} from 'lucide-react';
import DataTable from '../../components/DataTable';
import StatCard from '../../components/StatCard';
import {PageHeader, Status} from '../../components/Ui';
import useApiCollection from '../../hooks/useApiCollection';

export default function AdminDashboard() {
  const {data: orders} = useApiCollection('/api/orders');
  const {data: products} = useApiCollection('/api/products');
  const pendingOrders = orders.filter((order) => order.status === 'Pending');
  const lowStockProducts = products.filter((product) => Number(product.stock) < 15);
  const totalSales = orders.reduce((total, order) => total + Number(order.total || 0), 0);

  return <>
    <PageHeader title="Dashboard" description="Live supermarket activity." />
    <div className="stats-grid">
      <StatCard icon={Package} label="Products" value={products.length} trend="Live catalog" />
      <StatCard icon={ShoppingCart} label="Orders" value={orders.length} trend="Live orders" tone="blue" />
      <StatCard icon={ClipboardClock} label="Pending orders" value={pendingOrders.length} trend="Needs attention" tone="orange" />
      <StatCard icon={TriangleAlert} label="Low stock" value={lowStockProducts.length} trend="Needs restocking" tone="purple" />
    </div>
    <section className="panel"><div className="panel-head"><div><h2>Total sales</h2><p>Calculated from live orders</p></div><strong>${totalSales.toFixed(2)}</strong></div></section>
    <section className="panel"><div className="panel-head"><div><h2>Recent orders</h2><p>Latest live order activity</p></div></div><DataTable rows={orders.slice(0, 10)} columns={[{key:'id',label:'ORDER ID',render:r=><b>{r.id}</b>},{key:'customer',label:'CUSTOMER'},{key:'date',label:'DATE'},{key:'total',label:'TOTAL',render:r=>`$${Number(r.total || 0).toFixed(2)}`},{key:'payment',label:'PAYMENT',status:true},{key:'status',label:'STATUS',status:true}]} /></section>
    <section className="panel low-stock"><div className="panel-head"><div><h2>Low stock alerts</h2><p>Live product inventory</p></div></div>{lowStockProducts.length ? lowStockProducts.map((product) => <div key={product.id}><img src={product.image} alt=""/><span><b>{product.name}</b><small>{product.category}</small></span><strong>{product.stock} left</strong><Status>{product.stock ? 'Low Stock' : 'Out of Stock'}</Status></div>) : <p>No low-stock products.</p>}</section>
  </>;
}
