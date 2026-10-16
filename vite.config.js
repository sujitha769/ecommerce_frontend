import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const USER_SERVICE =
  process.env.USER_SERVICE_URL || 'http://localhost:8802';

const PRODUCT_SERVICE =
  process.env.PRODUCT_SERVICE_URL || 'http://localhost:8801';

const CART_SERVICE =
  process.env.CART_SERVICE_URL || 'http://localhost:8805';

const ORDER_SERVICE =
  process.env.ORDER_SERVICE_URL || 'http://localhost:8806';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api/auth': {
        target: USER_SERVICE,
        changeOrigin: true,
      },

      '/api/users': {
        target: USER_SERVICE,
        changeOrigin: true,
      },

      '/api/products': {
        target: PRODUCT_SERVICE,
        changeOrigin: true,
      },

      '/api/cart': {
        target: CART_SERVICE,
        changeOrigin: true,
      },

      '/api/orders': {
        target: ORDER_SERVICE,
        changeOrigin: true,
      },
    },
  },
});