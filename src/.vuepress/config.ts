import { defineUserConfig } from "vuepress";
import { viteBundler } from "@vuepress/bundler-vite";
import { meilisearchPlugin } from "@vuepress/plugin-meilisearch";

import theme from "./theme.js";

export default defineUserConfig({
  base: "/",
  head: [
    [
      "link",
      { rel: "icon", href: "/favicon.ico" },
    ],
  ],
  lang: "zh-CN",
  title: "徐工生活指南",
  description: "旨在为徐工在校学生提供必要的生活指南",

  bundler: viteBundler({
    viteOptions: {
      css: {
        preprocessorOptions: {
          scss: {
            quietDeps: true,
            silenceDeprecations: ["if-function"],
          },
        },
      },
    },
  }),
  
  theme,

  plugins: [
    meilisearchPlugin({
      host: "https://search.xuda.live",
      apiKey: "6c15af9a2b4be8b991517f6c91f943a938d2464c2ab8dbe510f11b90f0f89b83",
      indexUid: "xuda",
    }),
  ],
});
