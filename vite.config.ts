import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' ? (await import('lovable-tagger')).componentTagger() : null,
  ].filter(Boolean),
  resolve: {
    alias: {
      // Alias the monorepo package to its source directory
      'qakulib': path.resolve(__dirname, './packages/lib/src/index.ts'),
      '@': path.resolve(__dirname, './src'),
    },
    // Dedupe dependencies to avoid multiple instances
    dedupe: ['ethers', 'react', 'react-dom', '@waku/sdk', '@waku/interfaces'],
  },
  optimizeDeps: {
    exclude: ['qakulib'],
  },
}))
