
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import { useAuth } from './AuthContext';
import {
  loadCart,
  saveCart,
  fetchBackendCart,
  addBackendCartItem,
  updateBackendCartItem,
  removeBackendCartItem,
} from '../api/client';

const CartContext = createContext(null);

export const DELIVERY_FREE_ABOVE = 0;
export const money = (n) => '₹' + Number(n).toLocaleString('en-IN');

export function CartProvider({ children }) {
  const { user } = useAuth();

  const [items, setItems] = useState([]);
  const [loadedUserId, setLoadedUserId] = useState(null);

  const itemsRef = useRef([]);
  const userIdRef = useRef(null);
  const syncQueue = useRef(Promise.resolve());

  const keyOf = useCallback(
    (item) => `${item.product.id}-${item.size}`,
    []
  );

  // Restore the correct user's saved cart.
  // Never save an empty cart during the loading transition.
  useEffect(() => {
    const userId = user?.id ?? null;

    userIdRef.current = userId;
    setLoadedUserId(null);

    if (userId == null) {
      itemsRef.current = [];
      setItems([]);
      return;
    }

    const savedItems = loadCart(userId);

    itemsRef.current = savedItems;
    setItems(savedItems);
    setLoadedUserId(String(userId));
  }, [user?.id]);

  // Persist only after the current user's cart has loaded.
  useEffect(() => {
    if (user?.id == null) return;
    if (loadedUserId !== String(user.id)) return;

    saveCart(user.id, items);
  }, [items, user?.id, loadedUserId]);

  // Match frontend items to backend rows by product ID.
  // The backend currently does not store product size.
  const syncBackendCart = useCallback(async (userId, localItems) => {
    if (userId == null) return;

    const desiredByProduct = new Map();

    for (const item of localItems) {
      const productId = Number(item.product.id);
      const quantity = Number(item.qty);

      if (!Number.isFinite(productId) || productId <= 0) {
        throw new Error(`Invalid product ID: ${item.product.id}`);
      }

      desiredByProduct.set(
        productId,
        (desiredByProduct.get(productId) || 0) + quantity
      );
    }

    const backendItems = await fetchBackendCart(userId);
    const backendByProduct = new Map();

    for (const item of backendItems) {
      const productId = Number(item.productId);

      if (backendByProduct.has(productId)) {
        throw new Error(
          `Duplicate backend cart rows for product ${productId}.`
        );
      }

      backendByProduct.set(productId, item);
    }

    // Remove items no longer present in the frontend cart.
    for (const [productId, backendItem] of backendByProduct) {
      if (!desiredByProduct.has(productId)) {
        await removeBackendCartItem(userId, backendItem.id);
        backendByProduct.delete(productId);
      }
    }

    // Add missing products or update their quantities.
    for (const [productId, quantity] of desiredByProduct) {
      const backendItem = backendByProduct.get(productId);

      if (!backendItem) {
        await addBackendCartItem(userId, productId, quantity);
      } else if (Number(backendItem.quantity) !== quantity) {
        await updateBackendCartItem(
          userId,
          backendItem.id,
          quantity
        );
      }
    }
  }, []);

  // Serialize synchronization requests.
  const queueSync = useCallback((userId, nextItems) => {
    if (userId == null) return Promise.resolve();

    const operation = syncQueue.current.then(() =>
      syncBackendCart(userId, nextItems)
    );

    syncQueue.current = operation.catch((error) => {
      console.error('Cart synchronization failed:', error);
    });

    return operation;
  }, [syncBackendCart]);

  const updateItems = useCallback((updater) => {
    const userId = userIdRef.current;

    // Ignore actions until the current user's cart is restored.
    if (
      userId != null &&
      loadedUserId !== String(userId)
    ) {
      return itemsRef.current;
    }

    const nextItems = updater(itemsRef.current);

    itemsRef.current = nextItems;
    setItems(nextItems);

    if (userId != null) {
      // Persist immediately before starting network synchronization.
      saveCart(userId, nextItems);

      void queueSync(userId, nextItems).catch((error) => {
        console.error('Could not synchronize cart:', error);
      });
    }

    return nextItems;
  }, [loadedUserId, queueSync]);

  const addItem = useCallback((product, size, qty = 1) => {
    updateItems((previous) => {
      const key = `${product.id}-${size}`;
      const existing = previous.find(
        (item) => `${item.product.id}-${item.size}` === key
      );

      if (existing) {
        return previous.map((item) =>
          `${item.product.id}-${item.size}` === key
            ? { ...item, qty: Math.min(10, item.qty + qty) }
            : item
        );
      }

      return [
        ...previous,
        {
          product,
          size,
          qty: Math.max(1, Math.min(10, qty)),
        },
      ];
    });
  }, [updateItems]);

  const removeItem = useCallback((key) => {
    updateItems((previous) =>
      previous.filter(
        (item) => `${item.product.id}-${item.size}` !== key
      )
    );
  }, [updateItems]);

  const setQty = useCallback((key, qty) => {
    updateItems((previous) =>
      previous.map((item) =>
        `${item.product.id}-${item.size}` === key
          ? {
              ...item,
              qty: Math.max(1, Math.min(10, qty)),
            }
          : item
      )
    );
  }, [updateItems]);

  const clear = useCallback(() => {
    updateItems(() => []);
  }, [updateItems]);

  const totals = useMemo(() => {
    const mrp = items.reduce(
      (sum, item) => sum + item.product.mrp * item.qty,
      0
    );

    const subtotal = items.reduce(
      (sum, item) => sum + item.product.price * item.qty,
      0
    );

    const delivery =
      items.length && subtotal < DELIVERY_FREE_ABOVE ? 40 : 0;

    return {
      mrp,
      subtotal,
      discount: mrp - subtotal,
      delivery,
      total: subtotal + delivery,
      count: items.reduce((sum, item) => sum + item.qty, 0),
    };
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        setQty,
        clear,
        totals,
        keyOf,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
