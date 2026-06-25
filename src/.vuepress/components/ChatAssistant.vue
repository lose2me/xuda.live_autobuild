<template>
  <div class="chat-wrapper">
    <McLayoutContent class="msg-area">
      <div v-if="messages.length === 0" class="chat-empty">
        问我任何关于徐工的问题：宿舍、食堂、军训、转专业……
      </div>
      <McBubble
        v-for="(m, i) in messages"
        :key="i"
        :content="m.content"
        :align="m.from === 'user' ? 'right' : 'left'"
        :variant="m.from === 'user' ? 'filled' : 'bordered'"
        :loading="m.loading"
      />
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
import { McBubble, McInput, McLayoutContent, McLayoutSender } from '@matechat/core';

const client = new OpenAI({
  baseURL: 'https://search.xuda.live/chats/xuda-assistant',
  apiKey: 'e1c235a8f87cad6e9afbec885c0a3c1d356b268985261add1c16c6f171d86938',
  dangerouslyAllowBrowser: true,
});

const input = ref('');
const messages = ref([]);

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

.chat-empty {
  text-align: center;
  color: var(--vp-c-text-subtle);
  font-size: 0.9rem;
  padding: 2rem 0;
}
</style>
