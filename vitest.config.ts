/// <reference types="vitest" />
import { defineConfig } from "vite";

export default defineConfig({
  // @ts-ignore
  test: {
    environment: "happy-dom",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
