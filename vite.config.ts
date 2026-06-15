/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' 让构建产物可部署到任意子路径 (GitHub Pages / Vercel)
export default defineConfig({
  plugins: [react()],
  base: './',
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
