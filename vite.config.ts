import { fileURLToPath, URL } from 'node:url'

import { defineConfig, type UserConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import viteCompression from 'vite-plugin-compression'
import { visualizer } from 'rollup-plugin-visualizer'

export function createViteConfig(mode: string): UserConfig {
  return {
    plugins: [
      vue(),
      tailwindcss(),
      viteCompression({ algorithm: 'gzip', ext: '.gz', deleteOriginFile: false, threshold: 1024 }),
      ...(mode === 'analyze'
        ? [visualizer({ open: true, gzipSize: true, brotliSize: true })]
        : []),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      target: 'es2015',
      cssCodeSplit: false,
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules/vue') || id.includes('node_modules/pinia') || id.includes('node_modules/vue-router')) return 'vendor-vue'
            if (id.includes('node_modules/element-plus') || id.includes('node_modules/@element-plus')) return 'vendor-element'
            if (id.includes('node_modules/echarts')) return 'vendor-echarts'
            if (id.includes('node_modules/axios')) return 'vendor-axios'
          },
        },
      },
      minify: 'esbuild',
      sourcemap: false,
      reportCompressedSize: false,
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },

  }
}

export default defineConfig(({ mode }) => createViteConfig(mode))
