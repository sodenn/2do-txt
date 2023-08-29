import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import eslintPlugin from "vite-plugin-eslint";
import path from "path";

const eslintOptions: any = {
  cache: false,
  emitWarning: true,
  emitError: true,
};

const aliases = ["components", "images", "native-api", "stores", "utils"];

export default defineConfig({
  build: {
    outDir: "./build",
    sourcemap: true,
  },
  resolve: {
    alias: aliases.map((alias) => ({
      find: `@/${alias}`,
      replacement: path.resolve(__dirname, `src/${alias}`),
    })),
  },
  plugins: [eslintPlugin(eslintOptions), react()],
});
