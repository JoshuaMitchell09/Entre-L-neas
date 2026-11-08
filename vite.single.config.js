// Versión de un solo archivo HTML (sin servidor ni instalación): se abre con doble clic en Chrome/Edge.
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
  publicDir: false,
  build: { target: 'es2020', outDir: 'dist-single', chunkSizeWarningLimit: 4000, assetsInlineLimit: 100000000 },
});
