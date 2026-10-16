import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { loadCart, saveCart } from '../api/client';

const CartContext = createContext(null);

export const DELIVERY_FREE_ABOVE = 0; // Meesho style: free delivery always
export const money = (n) => '₹' + Number(n).toLocaleString('en-IN');

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]); // [{ product, size, qty }]

  // user marinappudu aa user cart load avvali
  useEffect(() => {
    setItems(user ? loadCart(user.id) : []);
  }, [user]);

  useEffect(() => {
    if (user) saveCart(user.id, items);
  }, [items, user]);

  const keyOf = (i) => `${i.product.id}-${i.size}`;

  const addItem = useCallback((product, size, qty = 1) => {
    setItems((prev) => {
      const key = `${product.id}-${size}`;
      const exists = prev.find((i) => keyOf(i) === key);
      if (exists) return prev.map((i) => (keyOf(i) === key ? { ...i, qty: Math.min(10, i.qty + qty) } : i));
      return [...prev, { product, size, qty }];
    });
  }, []);

  const removeItem = useCallback((key) => setItems((prev) => prev.filter((i) => keyOf(i) !== key)), []);

  const setQty = useCallback(
    (key, qty) => setItems((prev) => prev.map((i) => (keyOf(i) === key ? { ...i, qty: Math.max(1, Math.min(10, qty)) } : i))),
    []
  );

  const clear = useCallback(() => setItems([]), []);

  const totals = useMemo(() => {
    const mrp = items.reduce((s, i) => s + i.product.mrp * i.qty, 0);
    const subtotal = items.reduce((s, i) => s + i.product.price * i.qty, 0);
    const delivery = items.length && subtotal < DELIVERY_FREE_ABOVE ? 40 : 0;
    return { mrp, subtotal, discount: mrp - subtotal, delivery, total: subtotal + delivery, count: items.reduce((s, i) => s + i.qty, 0) };
  }, [items]);

  return <CartContext.Provider value={{ items, addItem, removeItem, setQty, clear, totals, keyOf }}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
