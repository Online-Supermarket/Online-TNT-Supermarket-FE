import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import axiosInstance from '../services/axiosInstance';
import { useAuth } from './AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

const CartContext = createContext(null);
const emptyBasket = { lines: [], subtotal: 0, tax: 0, deliveryFee: 0, total: 0, currency: 'Rs.' };
const toItem = (line) => ({ id: line.productId, name: line.name, sku: line.sku, image: line.imageUrl || null, price: Number(line.unitPrice), quantity: line.quantity, lineTotal: Number(line.lineTotal), available: line.available, stockQuantity: Number(line.stockQuantity || 0) });

export const CartProvider = ({ children }) => {
  const { token, activeRole, clearSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [basket, setBasket] = useState(emptyBasket);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const applyBasket = (data) => setBasket({ lines: Array.isArray(data?.lines) ? data.lines : [], subtotal: Number(data?.subtotal || 0), tax: Number(data?.tax || 0), deliveryFee: Number(data?.deliveryFee || 0), total: Number(data?.total || 0), currency: data?.currency || 'Rs.' });
  const refreshBasket = useCallback(async () => {
    if (!token || activeRole !== 'Customer') { setBasket(emptyBasket); return emptyBasket; }
    setLoading(true); setError(null);
    try { const data = await axiosInstance.get('/order/basket'); applyBasket(data); return data; }
    catch (err) { if (err?.status === 401) { clearSession(); navigate('/login', { state: { from: location }, replace: true }); return emptyBasket; } setError(err.message || 'Unable to load your basket.'); throw err; }
    finally { setLoading(false); }
  }, [token, activeRole]);
  useEffect(() => { refreshBasket().catch(() => {}); }, [refreshBasket]);
  const loginForCart = () => navigate('/login', { state: { from: location }, replace: false });
  const requireCustomer = () => { if (!token || activeRole !== 'Customer') { loginForCart(); return false; } return true; };
  const handleCartError = (err) => { if (err?.status === 401) { clearSession(); loginForCart(); } return false; };
  const removeFromCart = async (productId) => { if (!requireCustomer()) return false; try { const data = await axiosInstance.delete(`/order/basket/items/${productId}`); applyBasket(data); return data; } catch (err) { return handleCartError(err); } };
  const setQuantity = async (productId, quantity) => {
    if (!requireCustomer()) return false;
    if (quantity <= 0) return removeFromCart(productId);
    const line = basket.lines.find((item) => item.productId === productId);
    if (line?.stockQuantity !== undefined && quantity > Number(line.stockQuantity)) {
      setError(`Only ${line.stockQuantity} items are available in stock.`);
      return false;
    }
    try { const data = await axiosInstance.put(`/order/basket/items/${productId}`, { quantity }); applyBasket(data); return data; }
    catch (err) { setError(err.message || 'Unable to update quantity.'); return handleCartError(err); }
  };
  const addToCart = async (product, quantity = 1) => {
    const current = basket.lines.find((line) => line.productId === product.id)?.quantity || 0;
    const stock = Number(product.stockQuantity);
    if (Number.isFinite(stock) && current + quantity > stock) {
      setError(stock <= 0 ? 'This product is out of stock.' : `Only ${stock} items are available in stock.`);
      return false;
    }
    return setQuantity(product.id, current + quantity);
  };
  const clearCart = async () => { for (const line of basket.lines) await removeFromCart(line.productId); };
  // Checkout deliberately hides the cart locally but leaves the server basket available for
  // the order service to turn into its durable order snapshot.
  const beginCheckout = () => {
    if (!basket.lines.length) return null;
    const snapshot = { ...basket, lines: [...basket.lines] };
    sessionStorage.setItem('tnt-checkout-basket', JSON.stringify(snapshot));
    setBasket(emptyBasket);
    return snapshot;
  };
  const discardCheckoutSnapshot = () => sessionStorage.removeItem('tnt-checkout-basket');
  const cartItems = basket.lines.map(toItem);
  return <CartContext.Provider value={{ cartItems, basket, loading, error, refreshBasket, addToCart, removeFromCart, updateQuantity: setQuantity, clearCart, beginCheckout, discardCheckoutSnapshot, cartCount: cartItems.reduce((total, item) => total + item.quantity, 0), subtotal: basket.subtotal, tax: basket.tax, shipping: basket.deliveryFee, total: basket.total }}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);
