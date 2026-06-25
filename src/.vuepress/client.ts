import { defineClientConfig } from "vuepress/client";
import GitHubActivity from "./components/GitHubActivity.vue";
import ChatAssistant from "./components/ChatAssistant.vue";
import xzitpocketConfig from "../../xzitpocket.config.json";

export default defineClientConfig({
  enhance({ app }) {
    app.component("GitHubActivity", GitHubActivity);
    app.component("ChatAssistant", ChatAssistant);
    app.provide("xzitpocketConfig", xzitpocketConfig);
  },
});
