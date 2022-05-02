import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import eslintPlugin from "vite-plugin-eslint";

const eslintOptions: any = {
  cache: false,
  emitWarning: true,
  emitError: true,
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  // expose .env as process.env instead of import.meta since jest does not import meta yet
  const envWithProcessPrefix = Object.entries(env).reduce(
    (prev, [key, val]) => {
      return {
        ...prev,
        ["process.env." + key]: `"${val}"`,
      };
    },
    {}
  );

  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  return {
    define: envWithProcessPrefix,
    plugins: [eslintPlugin(eslintOptions), react()],
  };
});
