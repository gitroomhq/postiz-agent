import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  noExternal: ['node-fetch'],
  dts: false, // Disable DTS generation to avoid type issues
  splitting: false,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  banner: {
    js: '#!/usr/bin/env node',
  },
});
