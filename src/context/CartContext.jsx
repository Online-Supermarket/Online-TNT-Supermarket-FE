import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('tntCartItems');
    return saved ? JSON.parse(saved) : [
      {
        id: 'p1',
        name: 'Farm Fresh Organic Kale',
        price: 4.99,
        quantity: 2,
        category: 'Produce',
        image: '🥬'
      },
      {
        id: 'p2',
        name: 'Artisanal Whole Wheat Bread',
        price: 6.49,
        quantity: 1,
        category: 'Bakery',
        image: '🍞'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('tntCartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, quantity = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: Number(product.price),
          category: product.category?.name || product.category || 'Grocery',
          image: product.image || '🥦',
          quantity,
        },
      ];
    });
  };

  const removeFromCart = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => setCartItems([]);

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax = subtotal * 0.08;
  const shipping = subtotal > 50 || subtotal === 0 ? 0 : 5.99;
  const total = subtotal + tax + shipping;

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        subtotal,
        tax,
        shipping,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
