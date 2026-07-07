import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { createRequire } from 'node:module'

const pkg = createRequire(import.meta.url)('./package.json')

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/rasf-app/',
  define: {
    // رقم الإصدار من package.json — مصدر واحد
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
})
