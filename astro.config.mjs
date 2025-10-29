import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://incierge.jp",
  integrations: [
    tailwind({ applyBaseStyles: false }),
    mdx(),
    sitemap({
      serialize(item) {
        const out = { ...item };
        const u = item.url;

        if (u === "https://incierge.jp/") { out.changefreq = "weekly"; out.priority = 0.9; }
        else if (u.endsWith("/services/")) { out.changefreq = "weekly"; out.priority = 0.8; }
        else if (u.endsWith("/local-ai-startup/")) { out.changefreq = "weekly"; out.priority = 0.8; }
        else if (u.endsWith("/faq/")) { out.changefreq = "weekly"; out.priority = 0.7; }
        else if (u.includes("/insights/")) { out.changefreq = "daily"; out.priority = 0.8; }

        return out;
      },
    }),
  ],
});
