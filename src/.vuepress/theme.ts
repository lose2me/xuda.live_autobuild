import { hopeTheme } from "vuepress-theme-hope";

import navbar from "./navbar.js";
import sidebar from "./sidebar.js";

export default hopeTheme({
  hostname: "https://xuda.live",
  favicon: "/favicon.ico",
  docsDir: "src",
  // 导航栏
  navbar,

  // 侧边栏
  sidebar,

  // 页脚
  footer: "合法备案 | 苏ICP备2024137980号",
  copyright: `使用 <a href="http://creativecommons.org/licenses/by-nc-nd/4.0/deed.zh-hans">CC BY-NC-ND 4.0</a> 协议`,
  displayFooter: true,

  pageInfo: false,
  darkmode: "disable",

  // 仅保留用到的功能。
    markdown: {
      component: true,
      imgLazyload: true,
      imgSize: true,
      tabs: true,
      hint: true,
      footnote: true,
      mark: true,
    },

  // 在这里配置主题提供的插件
  plugins: {
    /*meilisearch: {
      host: "https://srch.yezer.cn",
      apiKey: "27d6028ff5ad7ac2b3e8ab2845a3e6c7de01cf3db6b49886cd25a5adc76e0ee9",
      indexUid: "xuda_website",
      hotKeys: [],
    },*/

    components: {
      components: ["VPCard","Badge"],
    },

    icon: {
      prefix: "fa6-solid:",
    },
  },
});