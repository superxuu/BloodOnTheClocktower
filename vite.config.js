import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/BloodOnTheClocktower/',  // Gitee Pages 仓库名
  server: {
    port: 8058,
    host: true
  }
})
