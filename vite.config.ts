import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // React plugin with fast refresh
    react({
      // Enable React Fast Refresh
      fastRefresh: true,
      // Add JSX runtime automatic
      jsxRuntime: 'automatic',
    }),
    // SVG handling - allows importing SVGs as React components
    svgr({
      svgrOptions: {
        // SVGR options
        icon: true,
        typescript: true,
        dimensions: false,
      },
      include: '**/*.svg',
    }),
  ],
  // Path aliases for cleaner imports
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@api': resolve(__dirname, './src/api'),
      '@assets': resolve(__dirname, './src/assets'),
      '@components': resolve(__dirname, './src/components'),
      '@contexts': resolve(__dirname, './src/contexts'),
      '@features': resolve(__dirname, './src/features'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@pages': resolve(__dirname, './src/pages'),
      '@stores': resolve(__dirname, './src/stores'),
      '@styles': resolve(__dirname, './src/styles'),
      '@utils': resolve(__dirname, './src/utils'),
    },
  },
  // Development server configuration
  server: {
    port: 3000,
    open: true,
    // Proxy API requests to n8n backend
    proxy: {
      // Forward all /api requests to n8n
      '/api': {
        target: 'http://localhost:5678',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: false,
      },
      // Forward WebSocket connections
      '/ws': {
        target: 'ws://localhost:5678',
        ws: true,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ws/, ''),
      },
    },
    // CORS settings
    cors: true,
  },
  // Build optimizations
  build: {
    // Target modern browsers
    target: 'esnext',
    // Output directory
    outDir: 'dist',
    // Source maps in production
    sourcemap: process.env.NODE_ENV !== 'production',
    // Chunk size warnings at 500kb
    chunkSizeWarningLimit: 500,
    // Minification options
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: process.env.NODE_ENV === 'production',
      },
    },
    // CSS code splitting
    cssCodeSplit: true,
    // Rollup options
    rollupOptions: {
      output: {
        // Chunk files by type
        manualChunks: {
          vendor: [
            'react',
            'react-dom',
            'react-router-dom',
            '@tanstack/react-query',
            'zustand',
          ],
          ui: [
            '@headlessui/react',
            '@heroicons/react',
          ],
          charts: ['recharts'],
          markdown: ['react-markdown', 'remark-gfm', 'react-syntax-highlighter'],
        },
      },
    },
  },
  // Preview server (for testing production builds locally)
  preview: {
    port: 4173,
    open: true,
  },
  // Enable optimized deps
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'zustand',
      'axios',
    ],
  },
});
