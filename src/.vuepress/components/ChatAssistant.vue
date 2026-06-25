<template>
  <div class="chat-wrapper">
    <div class="chat-header">徐工校园助手</div>
    <McLayoutContent class="msg-area">
      <div v-if="messages.length === 0" class="chat-empty">
        <McIntroduction
          :title="'徐工校园助手'"
          :subTitle="'Hi，有什么可以帮你的？'"
          :description="description"
        />
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

    <div class="chat-sender">
      <input
        v-model="input"
        class="chat-input"
        placeholder="输入问题..."
        @keydown.enter="send(input); input=''"
      />
      <button class="chat-send" @click="send(input); input=''">发送</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import OpenAI from 'openai';
import { McBubble, McLayoutContent, McPrompt, McMarkdownCard, McIntroduction } from '@matechat/core';


const client = new OpenAI({
  baseURL: 'https://search.xuda.live/chats/xuda-assistant',
  apiKey: 'e1c235a8f87cad6e9afbec885c0a3c1d356b268985261add1c16c6f171d86938',
  dangerouslyAllowBrowser: true,
});

const input = ref('');
const messages = ref([]);
const description = [
  '基于徐工生活指南文档，为你解答宿舍、食堂、课程、军训等校园问题。',
  '答案由 AI 生成，仅供参考，具体以学校最新通知为准。',
];

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

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) {
        if (messages.value[msgIdx].loading) {
          messages.value[msgIdx].loading = false;
        }
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
  height: 600px;
}

.msg-area {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
}

.msg-area > * {
  margin-bottom: 1.5rem;
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
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.prompt-list {
  max-width: 360px;
  width: 100%;
}

.chat-sender {
  display: flex;
  gap: 0.5rem;
  padding: 0.8rem 1rem;
  border-top: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg-soft);
}

.chat-input {
  flex: 1;
  padding: 0.5rem 0.8rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  font-size: 0.9rem;
  background: var(--vp-c-bg);
  color: var(--vp-c-text);
  outline: none;
}

.chat-input:focus {
  border-color: var(--vp-c-accent);
}

.chat-send {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  background: var(--vp-c-accent);
  color: #fff;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.chat-send:hover {
  opacity: 0.85;
}
</style>
