import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import EnvironmentPlugin from "vite-plugin-environment";
import eslintPlugin from "vite-plugin-eslint";

const eslintOptions: any = {
  cache: false,
  emitWarning: true,
  emitError: true,
};

export default defineConfig({
  plugins: [
    EnvironmentPlugin("all", { prefix: "VUE_" }),
    eslintPlugin(eslintOptions),
    react(),
  ],
});
