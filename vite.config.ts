import { defineConfig } from 'vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
export default defineConfig({resolve:{tsconfigPaths:true},plugins:[cloudflare({configPath:process.env.FIT_WRANGLER_CONFIG??'wrangler.jsonc',viteEnvironment:{name:'ssr'}}),tanstackStart(),react(),tailwind()]});
