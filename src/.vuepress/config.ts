import { defineUserConfig } from "vuepress";
import { viteBundler } from "@vuepress/bundler-vite";
import { llmsPlugin } from "@vuepress/plugin-llms";

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
      build: {
        rolldownOptions: {
          external: ['mermaid'],
        },
      },
    },
  }),
  
  plugins: [
    llmsPlugin({
      domain: "https://xuda.live",
    }),
  ],

  theme,
});
