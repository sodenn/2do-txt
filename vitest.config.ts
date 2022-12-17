/// <reference types="vitest" />
import { defineConfig } from "vite";

export default defineConfig({
  // @ts-ignore
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
