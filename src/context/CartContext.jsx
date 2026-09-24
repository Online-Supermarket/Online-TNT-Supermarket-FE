import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import axiosInstance from '../services/axiosInstance';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);
const emptyBasket = { lines: [], subtotal: 0, tax: 0, deliveryFee: 0, total: 0, currency: 'Rs.' };
const toItem = (line) => ({ id: line.productId, name: line.name, sku: line.sku, image: line.imageUrl || null, price: Number(line.unitPrice), quantity: line.quantity, lineTotal: Number(line.lineTotal), available: line.available });

export const CartProvider = ({ children }) => {
  const { token, activeRole } = useAuth();
  const [basket, setBasket] = useState(emptyBasket);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const applyBasket = (data) => setBasket({ lines: Array.isArray(data?.lines) ? data.lines : [], subtotal: Number(data?.subtotal || 0), tax: Number(data?.tax || 0), deliveryFee: Number(data?.deliveryFee || 0), total: Number(data?.total || 0), currency: data?.currency || 'Rs.' });
  const refreshBasket = useCallback(async () => {
    if (!token || activeRole !== 'CUSTOMER') { setBasket(emptyBasket); return emptyBasket; }
    setLoading(true); setError(null);
    try { const data = await axiosInstance.get('/order/basket'); applyBasket(data); return data; }
    catch (err) { setError(err.message || 'Unable to load your basket.'); throw err; }
    finally { setLoading(false); }
  }, [token, activeRole]);
  useEffect(() => { refreshBasket().catch(() => {}); }, [refreshBasket]);
  const requireCustomer = () => { if (!token || activeRole !== 'CUSTOMER') throw new Error('Sign in as a customer to manage a basket.'); };
  const removeFromCart = async (productId) => { requireCustomer(); const data = await axiosInstance.delete(`/order/basket/items/${productId}`); applyBasket(data); return data; };
  const setQuantity = async (productId, quantity) => { requireCustomer(); if (quantity <= 0) return removeFromCart(productId); const data = await axiosInstance.put(`/order/basket/items/${productId}`, { quantity }); applyBasket(data); return data; };
  const addToCart = async (product, quantity = 1) => setQuantity(product.id, (basket.lines.find((line) => line.productId === product.id)?.quantity || 0) + quantity);
  const clearCart = async () => { for (const line of basket.lines) await removeFromCart(line.productId); };
  const cartItems = basket.lines.map(toItem);
  return <CartContext.Provider value={{ cartItems, basket, loading, error, refreshBasket, addToCart, removeFromCart, updateQuantity: setQuantity, clearCart, cartCount: cartItems.reduce((total, item) => total + item.quantity, 0), subtotal: basket.subtotal, tax: basket.tax, shipping: basket.deliveryFee, total: basket.total }}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);
