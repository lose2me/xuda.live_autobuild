import { defineClientConfig } from "vuepress/client";
import { defineAsyncComponent } from "vue";
import GitHubActivity from "./components/GitHubActivity.vue";
import Home from "./layouts/Home.vue";
import xzitpocketConfig from "../../xzitpocket.config.json";

export default defineClientConfig({
  layouts: {
    Home,
  },
  enhance({ app }) {
    app.component("GitHubActivity", GitHubActivity);
    if (!__VUEPRESS_SSR__) {
      app.component("ChatAssistant", defineAsyncComponent(() => import("./components/ChatAssistant.vue")));
    }
    app.provide("xzitpocketConfig", xzitpocketConfig);
  },
});