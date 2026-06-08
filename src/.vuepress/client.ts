import { defineClientConfig } from "vuepress/client";
import GitHubActivity from "./components/GitHubActivity.vue";
import xzitpocketConfig from "../../xzitpocket.config.json";

export default defineClientConfig({
  enhance({ app }) {
    app.component("GitHubActivity", GitHubActivity);
    app.provide("xzitpocketConfig", xzitpocketConfig);
  },
});
