<script setup lang="ts">
import { Layout } from "vuepress-theme-hope/client";
import { defineAsyncComponent } from "vue";

const ChatAssistant = defineAsyncComponent(() => import("../components/ChatAssistant.vue"));
</script>

<template>
  <Layout>
    <template #heroAfter>
      <ClientOnly>
        <ChatAssistant />
      </ClientOnly>
    </template>
  </Layout>
</template>
