import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// No proxy on purpose: the server sends its own CORS headers.
export default defineConfig({
  plugins: [react()],
});
