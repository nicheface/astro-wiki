// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/postcss";

// https://astro.build/config
export default defineConfig({
  site: "https://nicheface.github.io",
  base: "/astro-wiki",
  integrations: [
    mdx({
      extendMarkdownConfig: true,
    }),
    react(),
  ],
  vite: {
    css: {
      postcss: {
        plugins: [tailwindcss()],
      },
    },
  },
});
