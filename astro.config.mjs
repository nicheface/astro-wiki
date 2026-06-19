// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/postcss";
import rehypeSlug from "rehype-slug";

// https://astro.build/config
export default defineConfig({
  site: "https://nicheface.github.io",
  base: "/astro-wiki",
  integrations: [
    mdx({
      extendMarkdownConfig: true,
      rehypePlugins: [rehypeSlug],
    }),
    react(),
  ],
  vite: {
    css: {
      postcss: {
        plugins: [tailwindcss()],
      },
    },
    build: {
      rollupOptions: {
        external: [/\/pagefind\/.*/],
      },
    },
  },
});
