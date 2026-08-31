import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      input: {
        main: 'index.html',
        dashboard: 'dashboard.html',
        'reset-password': 'reset-password.html'
      },
      output: {
        manualChunks: undefined
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
})