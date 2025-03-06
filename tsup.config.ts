import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['./src/index.ts', './src/plugin.ts'],
  clean: true,
  format: ['cjs', 'esm'],
  external: ['electron', 'axios'],
  dts: true,
  minify: false,
})
