import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': { target: 'http://localhost:8000', changeOrigin: true },
      '/users': { target: 'http://localhost:8000', changeOrigin: true },
      '/user': { target: 'http://localhost:8000', changeOrigin: true },
      '/Category': { target: 'http://localhost:8000', changeOrigin: true },
      '/Product': { target: 'http://localhost:8000', changeOrigin: true },
      '/Vendor': { target: 'http://localhost:8000', changeOrigin: true },
      '/variants': { target: 'http://localhost:8000', changeOrigin: true },
      '/Variant': { target: 'http://localhost:8000', changeOrigin: true },
      '/chat': { target: 'http://localhost:8000', changeOrigin: true },
      '/Attribute': { target: 'http://localhost:8000', changeOrigin: true },
      '/AttributeValue': { target: 'http://localhost:8000', changeOrigin: true },
      '/cart': { target: 'http://localhost:8000', changeOrigin: true },
      '/wishlist': { target: 'http://localhost:8000', changeOrigin: true },
      '/payments': { target: 'http://localhost:8000', changeOrigin: true },
      '/payment': { target: 'http://localhost:8000', changeOrigin: true },
      '/orders': { target: 'http://localhost:8000', changeOrigin: true },
      '/uploads': { target: 'http://localhost:8000', changeOrigin: true },
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
    },                                                        
  },
})
                          