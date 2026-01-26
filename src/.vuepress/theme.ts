import { hopeTheme } from "vuepress-theme-hope";

import navbar from "./navbar.js";
import sidebar from "./sidebar.js";

export default hopeTheme({
  hostname: "https://xuda.live",
  favicon: "/favicon.ico",
  docsDir: "src",
  navbar,

  sidebar,

  footer: "苏ICP备2024137980号",
  copyright: `<a href="http://creativecommons.org/licenses/by-nc-nd/4.0/deed.zh-hans">CC BY-NC-ND 4.0</a> Licensed`,
  displayFooter: true,

  pageInfo: false,
  darkmode: "disable",

    markdown: {
      component: true,
      imgLazyload: true,
      imgSize: true,
      tabs: true,
      hint: true,
      footnote: true,
      mark: true,
    },

  plugins: {

    components: {
      components: ["Badge"],
    },

    icon: {
      prefix: "fa6-solid:",
    },
  },
});