import { defineClientConfig } from "vuepress/client";
import { defineAsyncComponent, h } from "vue";
import GitHubActivity from "./components/GitHubActivity.vue";
import xzitpocketConfig from "../../xzitpocket.config.json";

const ChatAssistant = () => {
  if (__VUEPRESS_SSR__) return null;
  return h(defineAsyncComponent(() => import("./components/ChatAssistant.vue")));
};

export default defineClientConfig({
  enhance({ app }) {
    app.component("GitHubActivity", GitHubActivity);
    app.component("ChatAssistant", ChatAssistant);
    app.provide("xzitpocketConfig", xzitpocketConfig);
  },
  layoutSlots: {
    heroAfter: ChatAssistant,
  },
});
