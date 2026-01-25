import { navbar } from "vuepress-theme-hope";

export default navbar([
  "/",
  {
    text: "新生知道",
    icon: "book",
    link: "freshman/",
  },
  {
    text: "知识库",
    icon: "ph:seal-question-fill",
    link: "achieve/",
  },
]);
