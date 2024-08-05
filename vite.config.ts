import react from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const resolve = {
  alias: ["components", "images", "native-api", "stores", "utils"].map(
    (alias) => ({
      find: `@/${alias}`,
      replacement: path.resolve(__dirname, `src/${alias}`),
    }),
  ),
};

export default defineConfig({
  build: {
    outDir: "./build",
    sourcemap: false,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      external: ["crypto"],
    },
  },
  resolve,
  test: {
    globals: true,
    environment: "happy-dom",
    include: ["src/**/*.test.{ts,tsx}"],
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.ico",
        "apple-touch-icon-180x180.png",
        "maskable-icon-512x512.png",
      ],
      workbox: {
        globPatterns: ["**/*.{js,css,html,json,png,woff2}"],
      },
      manifest: {
        name: "2do.txt",
        short_name: "2do.txt",
        description: "todo.txt-compatible task manager",
        theme_color: "#f1f5f966",
        display_override: ["window-controls-overlay"],
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
});
