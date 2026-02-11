
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false, // Disabling sourcemaps significantly speeds up build time
    minify: 'esbuild', // Uses the extremely fast esbuild minifier
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Strategic code splitting: separates large dependencies into a vendor chunk
        // This speeds up subsequent deployments and improves caching performance
        manualChunks: {
          vendor: ['react', 'react-dom', 'framer-motion', 'lucide-react'],
          supabase: ['@supabase/supabase-js'],
          utils: ['html-to-image']
        },
        // Optimize asset naming for better CDN delivery
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    }
  },
  // Optimize dependency pre-bundling for faster cold starts
  optimizeDeps: {
    include: ['react', 'react-dom', 'framer-motion', 'lucide-react', '@supabase/supabase-js']
  }
});
