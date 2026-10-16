import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Each microservice ki oka proxy rule. Kotha service add chesinappudu ikkada add cheyyi.
const USER_SERVICE = process.env.USER_SERVICE_URL || 'http://localhost:8802';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api/auth': { target: USER_SERVICE, changeOrigin: true },
      '/api/users': { target: USER_SERVICE, changeOrigin: true },
      // '/api/products': { target: 'http://localhost:XXXX', changeOrigin: true },
      // '/api/orders':   { target: 'http://localhost:XXXX', changeOrigin: true },
    },
  },
});
