import {
  defineConfig,
  minimal2023Preset as preset,
} from "@vite-pwa/assets-generator/config";

export default defineConfig({
  headLinkOptions: {
    preset: "2023",
  },
  preset: {
    ...preset,
    apple: {
      ...preset.apple,
      padding: 0.1,
      resizeOptions: {
        background: "#90CAF9",
      },
    },
    maskable: {
      ...preset.maskable,
      padding: 0.25,
      resizeOptions: {
        background: "#90CAF9",
      },
    },
  },
  images: ["public/logo.svg"],
});
