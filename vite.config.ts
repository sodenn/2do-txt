/// <reference types="vitest" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import eslintPlugin from "vite-plugin-eslint";

const eslintOptions: any = {
  cache: false,
  emitWarning: true,
  emitError: true,
};

export default defineConfig({
  // @ts-ignore
  test: {
    environment: "jsdom",
  },
  plugins: [eslintPlugin(eslintOptions), react()],
});
