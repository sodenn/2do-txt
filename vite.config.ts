import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import eslintPlugin from "vite-plugin-eslint";

const eslintOptions: any = {
  cache: false,
  emitWarning: true,
  emitError: true,
};

export default defineConfig({
  server: {
    proxy: {
      "/webdav": "http://localhost:8080/remote.php",
    },
  },
  build: {
    outDir: "./build",
  },
  plugins: [eslintPlugin(eslintOptions), react()],
});
