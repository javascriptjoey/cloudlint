import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'
  const isGitHubPages = process.env.GITHUB_PAGES === 'true'
  
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      proxy: {
        '/validate': {
          target: 'http://localhost:3001',
          changeOrigin: true
        },
        '/suggest': {
          target: 'http://localhost:3001', 
          changeOrigin: true
        },
        '/convert': {
          target: 'http://localhost:3001',
          changeOrigin: true
        },
        '/autofix': {
          target: 'http://localhost:3001',
          changeOrigin: true
        },
        '/diff-preview': {
          target: 'http://localhost:3001',
          changeOrigin: true
        },
        '/schema-validate': {
          target: 'http://localhost:3001',
          changeOrigin: true
        }
      }
    },
    base: isProduction && isGitHubPages ? '/cloudlint/' : '/',
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: true,
      target: 'es2020',
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-slot'],
            'utils': ['clsx', 'tailwind-merge', 'class-variance-authority'],
            // Icon chunks
            'lucide': ['lucide-react'],
            // Backend utilities
            'yaml-utils': ['yaml', 'ajv', 'diff']
          }
        }
      }
    },
  }
})
