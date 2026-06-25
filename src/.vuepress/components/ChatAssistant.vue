<template>
  <div class="chat-wrapper">
    <div class="chat-header">徐工校园助手</div>
    <McLayoutContent class="msg-area">
      <div v-if="messages.length === 0" class="chat-empty">
        <div class="prompt-label">试试问：</div>
        <McPrompt :list="prompts" direction="vertical" class="prompt-list" @itemClick="send($event.label)" />
      </div>
      <McBubble
        v-for="(m, i) in messages"
        :key="i"
        :align="m.from === 'user' ? 'right' : 'left'"
        :variant="m.from === 'user' ? 'filled' : 'bordered'"
        :loading="m.loading"
      >
        <McMarkdownCard v-if="m.from === 'model'" :content="m.content" />
        <span v-else>{{ m.content }}</span>
      </McBubble>
    </McLayoutContent>

    <McLayoutSender>
      <McInput
        :value="input"
        :maxLength="2000"
        @change="e => input = e"
        @submit="send"
      />
    </McLayoutSender>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import OpenAI from 'openai';
import { McBubble, McInput, McLayoutContent, McLayoutSender, McPrompt, McMarkdownCard } from '@matechat/core';

const client = new OpenAI({
  baseURL: 'https://search.xuda.live/chats/xuda-assistant',
  apiKey: 'e1c235a8f87cad6e9afbec885c0a3c1d356b268985261add1c16c6f171d86938',
  dangerouslyAllowBrowser: true,
});

const input = ref('');
const messages = ref([]);
const prompts = [
  { value: 'dorm', label: '住宿条件', desc: '宿舍配置、空调、卫浴等' },
  { value: 'campus', label: '校园环境', desc: '食堂、超市、交通等' },
];

async function send(q) {
  if (!q?.trim()) return;
  input.value = '';

  messages.value.push({ from: 'user', content: q });

  const msgIdx = messages.value.length;
  messages.value.push({ from: 'model', content: '', loading: true });

  try {
    const stream = await client.chat.completions.create({
      model: 'deepseek-v4-flash',
      messages: [{ role: 'user', content: q }],
      stream: true,
    });

    messages.value[msgIdx].loading = false;

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) {
        messages.value[msgIdx].content += delta;
      }
    }
  } catch (e) {
    messages.value[msgIdx].loading = false;
    messages.value[msgIdx].content = '出错了：' + e.message;
  }
}
</script>

<style scoped>
.chat-wrapper {
  margin: 0.5rem auto 0;
  max-width: 880px;
  border: 1px solid var(--vp-c-border);
  border-radius: 12px;
  overflow: hidden;
  background: var(--vp-c-bg);
  display: flex;
  flex-direction: column;
  height: 420px;
}

.msg-area {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.chat-header {
  padding: 0.9rem 1.2rem;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-border);
  font-weight: 600;
  font-size: 1rem;
  color: var(--vp-c-text);
}

.chat-empty {
  padding: 1.5rem 1rem;
}

.prompt-label {
  color: var(--vp-c-text-subtle);
  font-size: 0.85rem;
  margin-bottom: 0.8rem;
}

.prompt-list {
  max-width: 360px;
}
</style>
