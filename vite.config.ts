import react from "@vitejs/plugin-react-swc";
import path from "path";
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
  plugins: [react()],
});
