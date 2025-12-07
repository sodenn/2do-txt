import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import unfonts from "unplugin-fonts/vite";
import { defineConfig } from "vite";

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
    chunkSizeWarningLimit: 2000,
  },
  resolve,
  test: {
    globals: true,
    environment: "happy-dom",
    include: ["src/**/*.test.{ts,tsx}"],
  },
  plugins: [
    react(),
    unfonts({
      custom: {
        families: [
          {
            name: "Geist Sans",
            src: "node_modules/geist/dist/fonts/geist-sans/*.woff2",
          },
          {
            name: "Geist Mono",
            src: "node_modules/geist/dist/fonts/geist-mono/*.woff2",
          },
        ],
      },
    }),
    tailwindcss(),
  ],
});
