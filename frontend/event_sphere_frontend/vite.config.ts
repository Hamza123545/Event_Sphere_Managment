import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// https://vite.dev/config/

/**
 * Vite configuration
 * Implements T241 - CDN for static assets (configure Vite build to output assets with content hashes)
 * Content hashes are automatically enabled by Vite for cache busting
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Generate source maps for production debugging (optional)
    sourcemap: false,
    // Rollup options
    rollupOptions: {
      output: {
        // Enable content hashing for cache busting (default behavior)
        // Assets with content hashes: [name].[hash].[ext]
        // This allows CDN caching with cache invalidation on updates
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
    // Chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },
  // For CDN support, set base path in production
  // Example: base: process.env.VITE_CDN_URL || '/',
})
