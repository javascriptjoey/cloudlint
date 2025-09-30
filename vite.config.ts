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
    optimizeDeps: {
      include: ["@lottiefiles/dotlottie-react", "@lottiefiles/dotlottie-web"],
    },
    base: isProduction && isGitHubPages ? '/cloudlint/' : '/',
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: true,
      target: 'es2020',
    },
  }
})
