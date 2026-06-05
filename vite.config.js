import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode (development, production)
  // Vite automatically loads .env files. This makes process.env available to Vite's Node.js context.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Expose environment variables to your client-side code
      // IMPORTANT: Only prefix variables with VITE_ to expose them by default.
      // For other variables like API_KEY, you need to explicitly define them like this.
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
    server: {
      open: true, // Automatically open the app in the browser on server start
      port: 3000, // You can specify a port
    },
  };
});
