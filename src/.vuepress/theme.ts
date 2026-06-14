import { hopeTheme } from "vuepress-theme-hope";

import navbar from "./navbar.js";
import sidebar from "./sidebar.js";

export default hopeTheme({
  hostname: "https://xuda.live",
  favicon: "/favicon.ico",
  docsDir: "src",
  repo: "lose2me/xuda.live_autobuild",
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

    redirect: {
      config: {
        "/download": "/xzitpocket/releases.html",
        "/download.html": "/xzitpocket/releases.html",
      },
    },

    slimsearch: false,

    meilisearch: {
      host: "https://search.xuda.live",
      apiKey: "6c15af9a2b4be8b991517f6c91f943a938d2464c2ab8dbe510f11b90f0f89b83",
      indexUid: "xuda",
      translations: {
        button: {
          buttonText: "搜索",
          buttonAriaLabel: "搜索",
        },
        modal: {
          searchDocsPlaceHolder: "搜索文档",
          resetButtonTitle: "清除搜索",
          resetButtonAriaLabel: "清除搜索",
          cancelButtonText: "取消",
          cancelButtonAriaLabel: "取消",
          selectText: "选择",
          navigateText: "导航",
          closeText: "关闭",
          poweredByText: "技术支持",
        },
      },
    },

    git: {
      contributors: {
        avatar: false,
        info: [
          {
            username: "lose2me",
            alias: ["yezerpo"],
          },
        ],
      },
    },

    components: {
      components: ["Badge"],
    },

    icon: {
      prefix: "fa6-solid:",
    },
  },
});