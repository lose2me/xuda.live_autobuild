import { navbar } from "vuepress-theme-hope";

export default navbar([
  "/",
  {
    text: "新生知道",
    icon: "graduation-cap",
    link: "freshman/",
  },
  {
    text: "信息索引",
    icon: "compass",
    link: "freshman/",
  },
  {
    text: "掌上徐工",
    icon: "mobile-screen-button",
    link: "/xzitpocket/",
  },
  {
    text: "文档更新记录",
    icon: "clock-rotate-left",
    link: "/doc-updates.html",
  },
]);
