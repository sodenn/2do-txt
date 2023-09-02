import react from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig } from "vite";
import eslintPlugin from "vite-plugin-eslint";

const eslintOptions: any = {
  cache: false,
  emitWarning: true,
  emitError: true,
};

const resolve = {
  alias: ["components", "images", "native-api", "stores", "utils"].map(
    (alias) => ({
      find: `@/${alias}`,
      replacement: path.resolve(__dirname, `src/${alias}`),
    }),
  ),
};

const plugins =
  process.env.NODE_ENV === "test"
    ? [react()]
    : [eslintPlugin(eslintOptions), react()];

export default defineConfig({
  build: {
    outDir: "./build",
    sourcemap: true,
  },
  resolve,
  test: {
    environment: "happy-dom",
    include: ["src/**/*.test.{ts,tsx}"],
  },
  plugins,
});
