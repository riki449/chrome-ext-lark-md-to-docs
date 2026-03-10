import react from '@vitejs/plugin-react';
import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { resolve } from 'path';
import { build, defineConfig } from 'vite';

function copyExtFiles() {
  return {
    name: 'copy-ext-files',
    closeBundle() {
      const distDir = resolve(__dirname, 'dist');
      const iconsDir = resolve(distDir, 'icons');
      const srcIcons = resolve(__dirname, 'public/icons');

      if (!existsSync(iconsDir)) mkdirSync(iconsDir, { recursive: true });
      copyFileSync(resolve(__dirname, 'manifest.json'), resolve(distDir, 'manifest.json'));

      // Copy icons
      if (existsSync(srcIcons)) {
        for (const file of readdirSync(srcIcons)) {
          copyFileSync(resolve(srcIcons, file), resolve(iconsDir, file));
        }
      }
    },
  };
}

function buildExtraScripts() {
  return {
    name: 'build-extra-scripts',
    async closeBundle() {
      // Build background service worker
      await build({
        configFile: false,
        build: {
          emptyOutDir: false,
          outDir: resolve(__dirname, 'dist'),
          lib: {
            entry: resolve(__dirname, 'src/background.ts'),
            formats: ['es'],
            fileName: () => 'background.js',
          },
          rollupOptions: {
            output: { inlineDynamicImports: true },
          },
        },
      });

      // Build content script
      await build({
        configFile: false,
        build: {
          emptyOutDir: false,
          outDir: resolve(__dirname, 'dist'),
          lib: {
            entry: resolve(__dirname, 'src/content-script.ts'),
            formats: ['iife'],
            name: 'md2larkContent',
            fileName: () => 'content-script.js',
          },
          rollupOptions: {
            output: { inlineDynamicImports: true },
          },
        },
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), copyExtFiles(), buildExtraScripts()],
  root: 'src/popup',
  base: './',
  build: {
    outDir: resolve(__dirname, 'dist/popup'),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'src/popup/index.html'),
    },
  },
});
