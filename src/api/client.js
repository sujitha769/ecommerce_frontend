const API = '/api';

export const MOCK = {
  AUTH: false,
  CATALOG: false,
  ORDERS: false,
};

const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const write = (key, value) =>
  localStorage.setItem(key, JSON.stringify(value));

export const getToken = () => localStorage.getItem('shop_token');

export function tokenExpiry(token) {
  try {
    const payload = JSON.parse(
      atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
    );

    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request(
  path,
  { method = 'GET', body, auth = true } = {}
) {
  let response;

  try {
    response = await fetch(`${API}${path}`, {
      method,
      headers: {
        ...(body !== undefined
          ? { 'Content-Type': 'application/json' }
          : {}),
        ...(auth && getToken()
          ? { Authorization: `Bearer ${getToken()}` }
          : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      'Cannot reach the server. Check that the required service is running.',
      0
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      data.message ||
        data.detail ||
        data.error ||
        `Request failed (${response.status})`,
      response.status
    );
  }

  return data;
}

/* ---------------- AUTH: REAL BACKEND ---------------- */

const fromAuthResponse = (response) => ({
  user: {
    id: response.userId,
    name: response.name,
    email: response.email,
  },
  token: response.accessToken,
});

export async function registerUser({ name, email, password }) {
  const response = await request('/auth/register', {
    method: 'POST',
    auth: false,
    body: { name, email, password },
  });

  return fromAuthResponse(response);
}

export async function loginUser({ email, password }) {
  const response = await request('/auth/login', {
    method: 'POST',
    auth: false,
    body: { email, password },
  });

  return fromAuthResponse(response);
}

export async function fetchMe() {
  return request('/users/me');
}

/* ---------------- PRODUCTS: REAL BACKEND ---------------- */

export async function fetchProducts({
  q = '',
  category = 'All',
} = {}) {
  const params = new URLSearchParams();

  if (q.trim()) {
    params.set('search', q.trim());
  }

  if (category !== 'All') {
    params.set('category', category);
  }

  const query = params.toString();

  return request(`/products${query ? `?${query}` : ''}`, {
    auth: false,
  });
}

export async function fetchProduct(id) {
  return request(`/products/${id}`, {
    auth: false,
  });
}

export async function createProduct(product, image) {
  const formData = new FormData();

  formData.append(
    'product',
    new Blob([JSON.stringify(product)], {
      type: 'application/json',
    })
  );

  if (image) {
    formData.append('file', image);
  }

  let response;

  try {
    response = await fetch(`${API}/products`, {
      method: 'POST',
      headers: getToken()
        ? { Authorization: `Bearer ${getToken()}` }
        : {},
      body: formData,
    });
  } catch {
    throw new ApiError('Cannot reach Product Service.', 0);
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      data.message ||
        data.error ||
        `Product creation failed (${response.status})`,
      response.status
    );
  }

  return data;
}

/* ---------------- CART: LOCAL STORAGE ---------------- */

export const loadCart = (userId) =>
  read(`shop_cart_${userId}`, []);

export const saveCart = (userId, items) =>
  write(`shop_cart_${userId}`, items);

/* ---------------- CART: REAL BACKEND ---------------- */

export async function fetchBackendCart(userId) {
  if (!userId) {
    throw new ApiError('Please log in to view your cart.', 401);
  }

  return request(`/cart/${userId}`);
}

export async function addBackendCartItem(
  userId,
  productId,
  quantity
) {
  if (!userId) {
    throw new ApiError('Please log in to add items to your cart.', 401);
  }

  return request(`/cart/${userId}/items`, {
    method: 'POST',
    body: {
      productId: Number(productId),
      quantity: Number(quantity),
    },
  });
}

export async function updateBackendCartItem(
  userId,
  itemId,
  quantity
) {
  if (!userId) {
    throw new ApiError('Please log in to update your cart.', 401);
  }

  return request(`/cart/${userId}/items/${itemId}`, {
    method: 'PUT',
    body: {
      quantity: Number(quantity),
    },
  });
}

export async function removeBackendCartItem(userId, itemId) {
  if (!userId) {
    throw new ApiError('Please log in to update your cart.', 401);
  }

  return request(`/cart/${userId}/items/${itemId}`, {
    method: 'DELETE',
  });
}

/* ---------------- ORDERS: REAL BACKEND ---------------- */

/**
 * Order Service reads items from the backend Cart Service.
 * The frontend must synchronize its cart before calling this function.
 */
export async function createOrder(
  userId,
  { items = [], address, paymentMethod, totals } = {}
) {
  if (!userId) {
    throw new ApiError('Please log in to place an order.', 401);
  }

  if (!paymentMethod) {
    throw new ApiError('Please select a payment method.', 400);
  }

  const order = await request(`/orders/checkout/${userId}`, {
    method: 'POST',
    body: {
      paymentMethod,
      simulateFailure: false,
    },
  });

  if (order.status === 'CANCELLED') {
    throw new ApiError(
      'Payment failed and the order was cancelled. Your cart is available for retry.',
      402
    );
  }

  if (
    !['CONFIRMED', 'AWAITING_PAYMENT_ON_DELIVERY'].includes(order.status)
  ) {
    throw new ApiError(
      `Order was not confirmed. Current status: ${order.status}`,
      409
    );
  }

  saveCart(userId, []);

  return {
    ...order,
    address,
    paymentMethod,
    totals: totals ?? { total: order.totalAmount },
    paymentStatus:
      order.status === 'AWAITING_PAYMENT_ON_DELIVERY'
        ? 'Pay on delivery'
        : 'SUCCESS',
  };
}

export async function fetchOrders(userId) {
  if (!userId) {
    throw new ApiError('Please log in to view your orders.', 401);
  }

  return request(`/orders/user/${userId}`);
}
