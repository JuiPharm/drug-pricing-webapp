import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// IMPORTANT for GitHub Pages:
// base should be '/<repo-name>/' when deploying.
// Example: repo name = drug-pricing-webapp -> base: '/drug-pricing-webapp/'
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/',
})