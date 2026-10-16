/**
 * API layer. Per-service mock flags: oka service ready ayyaaka aa flag false cheyyi.
 *
 *   AUTH    -> user-service (port 8802)  REAL
 *   CATALOG -> product-service           mock (localStorage / local data)
 *   ORDERS  -> order-service             mock (localStorage)
 *
 * Browser always calls relative /api/... ; vite.config.js proxy forwards to the right service,
 * so CORS issues undavu.
 */
import { PRODUCTS } from '../data/products';

export const MOCK = {
  AUTH: false,
  CATALOG: true,
  ORDERS: true,
};

const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const delay = (ms = 450) => new Promise((r) => setTimeout(r, ms));

export const getToken = () => localStorage.getItem('shop_token');

/* Token expiry (JWT exp claim) - user-service token 1 hour lo expire avtundi */
export function tokenExpiry(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  let res;
  try {
    res = await fetch(path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(auth && getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Cannot reach the server. Please check that the service is running.', 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Spring GlobalExceptionHandler: { timestamp, status, error, message }
    throw new ApiError(data.message || `Request failed (${res.status})`, res.status);
  }
  return data;
}

/* ---------------- AUTH (user-service) ---------------- */
// Backend AuthResponse: { message, tokenType, accessToken, userId, name, email }
const fromAuthResponse = (r) => ({
  user: { id: r.userId, name: r.name, email: r.email },
  token: r.accessToken,
});

export async function registerUser({ name, email, password }) {
  if (!MOCK.AUTH) {
    const r = await request('/api/auth/register', { method: 'POST', auth: false, body: { name, email, password } });
    return fromAuthResponse(r);
  }
  await delay();
  const users = read('shop_users', []);
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) throw new ApiError('Email is already registered', 409);
  const user = { id: Date.now(), name, email, password };
  write('shop_users', [...users, user]);
  return { user: { id: user.id, name, email }, token: `mock-${user.id}` };
}

export async function loginUser({ email, password }) {
  if (!MOCK.AUTH) {
    const r = await request('/api/auth/login', { method: 'POST', auth: false, body: { email, password } });
    return fromAuthResponse(r);
  }
  await delay();
  const found = read('shop_users', []).find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!found || found.password !== password) throw new ApiError('Invalid email or password', 401);
  return { user: { id: found.id, name: found.name, email: found.email }, token: `mock-${found.id}` };
}

// GET /api/users/me -> { id, name, email, role, createdAt }  (session verify cheyyadaniki)
export async function fetchMe() {
  return request('/api/users/me');
}

/* ---------------- PRODUCTS (mock for now) ---------------- */
export async function fetchProducts({ q = '', category = 'All' } = {}) {
  if (!MOCK.CATALOG) return request(`/api/products?q=${encodeURIComponent(q)}&category=${encodeURIComponent(category)}`);
  await delay(250);
  const term = q.trim().toLowerCase();
  return PRODUCTS.filter(
    (p) => (category === 'All' || p.category === category) && (!term || p.name.toLowerCase().includes(term) || p.category.toLowerCase().includes(term))
  );
}

export async function fetchProduct(id) {
  if (!MOCK.CATALOG) return request(`/api/products/${id}`);
  await delay(200);
  const p = PRODUCTS.find((x) => String(x.id) === String(id));
  if (!p) throw new ApiError('Product not found', 404);
  return p;
}

/* ---------------- ORDERS (mock for now) ---------------- */
export async function createOrder(userId, { items, address, paymentMethod, totals }) {
  if (!MOCK.ORDERS) return request('/api/orders', { method: 'POST', body: { items, address, paymentMethod } });
  await delay(1600); // payment processing simulate
  const orders = read(`shop_orders_${userId}`, []);
  const order = {
    id: 'OD' + Math.floor(100000000 + Math.random() * 900000000),
    createdAt: Date.now(),
    items,
    address,
    paymentMethod,
    totals,
    paymentStatus: paymentMethod === 'COD' ? 'Pay on delivery' : 'Paid',
  };
  write(`shop_orders_${userId}`, [order, ...orders]);
  return order;
}

export async function fetchOrders(userId) {
  if (!MOCK.ORDERS) return request('/api/orders');
  await delay(300);
  return read(`shop_orders_${userId}`, []);
}

/* ---------------- CART persistence (mock) ---------------- */
export const loadCart = (userId) => read(`shop_cart_${userId}`, []);
export const saveCart = (userId, items) => write(`shop_cart_${userId}`, items);
