import build from '@hono/vite-build/cloudflare-pages'
import devServer from '@hono/vite-dev-server'
import adapter from '@hono/vite-dev-server/cloudflare'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    build(),
    devServer({
      adapter,
      entry: 'src/index.tsx',
      env: {
        PANEL_TOKEN: 'aline-andrade-secret-123',
        STUDIO_PHONE: '5547991518816'
      }
    })
  ]
})
