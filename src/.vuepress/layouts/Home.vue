<script setup lang="ts">
import { Layout } from "vuepress-theme-hope/client";
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
