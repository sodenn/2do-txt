/// <reference types="vitest" />
import { defineConfig } from "vite";

export default defineConfig({
  // @ts-ignore
  test: {
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
  },
});
