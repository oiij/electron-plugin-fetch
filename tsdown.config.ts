import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/fetch.ts',
    'src/preload.ts',
    'src/main.ts',
  ],
  unbundle: true,
})
