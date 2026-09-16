import {Menu,ShoppingCart,UserRound,X} from 'lucide-react';
import {useState} from 'react';
import {Link,NavLink} from 'react-router-dom';
import {useAuth} from '../context/AuthContext';
import {useCart} from '../context/CartContext';
import Logo from './Logo';

export default function Navbar(){
  const [open,setOpen]=useState(false);
  const {user,logout}=useAuth();
  const {count}=useCart();
  const close=()=>setOpen(false);

  const isStaffOrAdmin = user?.role === 'ADMIN' || user?.role === 'STAFF';

  return (
    <>
      <div className="announcement">
        <span>Fresh groceries, happier homes.</span>
        <span>Free delivery on orders over $50</span>
        <span>Help & Support</span>
      </div>
      <header className="navbar">
        <Link to="/" aria-label="TNT home"><Logo/></Link>
        <button className="menu-toggle" onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button>
        <nav className={open?'open':''}>
          {['Home','About','Categories','Offers','Contact'].map(x=>(
            <NavLink key={x} onClick={close} to={x==='Home'?'/':`/${x.toLowerCase()}`}>{x}</NavLink>
          ))}
          {user?.role==='CUSTOMER' && (
            <>
              <NavLink to="/profile" onClick={close}>Profile</NavLink>
              <NavLink to="/orders" onClick={close}>Orders</NavLink>
            </>
          )}
          {user?.role==='ADMIN' && (
            <NavLink to="/admin" onClick={close}>Admin Dashboard</NavLink>
          )}
          {user?.role==='STAFF' && (
            <NavLink to="/staff" onClick={close}>Staff Dashboard</NavLink>
          )}
          {user?.role==='DELIVERY' && (
            <NavLink to="/delivery" onClick={close}>Delivery Dashboard</NavLink>
          )}
          {isStaffOrAdmin && (
            <NavLink to="/inventory" onClick={close}>Inventory</NavLink>
          )}
        </nav>
        <div className="nav-actions">
          <Link to="/cart" className="cart-link" aria-label="Cart"><ShoppingCart/><b>{count}</b></Link>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--muted)', fontWeight: 600 }}>
                {user.name || user.email} ({user.role})
              </span>
              <button className="btn btn-outline btn-small" onClick={logout}>Logout</button>
            </div>
          ) : (
            <>
              <Link className="login-link" to="/login"><UserRound size={18}/> Login</Link>
              <Link className="btn btn-primary btn-small" to="/register">Create account</Link>
            </>
          )}
        </div>
      </header>
    </>
  );
}
