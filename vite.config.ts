import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import eslintPlugin from "vite-plugin-eslint";

const eslintOptions: any = {
  cache: false,
  emitWarning: true,
  emitError: true,
};

export default defineConfig({
  build: {
    outDir: "./build",
  },
  plugins: [eslintPlugin(eslintOptions), react()],
});
