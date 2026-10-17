
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const USER_SERVICE =
  process.env.USER_SERVICE_URL ||
  'https://suzi-ecom-user.onrender.com';

const PRODUCT_SERVICE =
  process.env.PRODUCT_SERVICE_URL ||
  'https://suzi-ecom-product.onrender.com';

const CART_SERVICE =
  process.env.CART_SERVICE_URL ||
  'https://suzi-ecom-cart.onrender.com';

const ORDER_SERVICE =
  process.env.ORDER_SERVICE_URL ||
  'https://suzi-ecom-order.onrender.com';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api/auth': {
        target: USER_SERVICE,
        changeOrigin: true,
        secure: true,
      },

      '/api/users': {
        target: USER_SERVICE,
        changeOrigin: true,
        secure: true,
      },

      '/api/products': {
        target: PRODUCT_SERVICE,
        changeOrigin: true,
        secure: true,
      },

      '/api/cart': {
        target: CART_SERVICE,
        changeOrigin: true,
        secure: true,
      },

      '/api/orders': {
        target: ORDER_SERVICE,
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
