<template>
  <div class="chat-wrapper">
    <div class="chat-header">
      <img class="header-avatar" src="/cat.webp" alt="" />
      徐小咪助手
    </div>
    <McLayoutContent ref="msgAreaRef" class="msg-area">
      <div v-if="messages.length === 0" class="chat-empty">
        <div class="intro-center">
          <McIntroduction
            :title="'徐小咪助手'"
            :subTitle="'Hi，有什么可以帮你的？'"
            :description="description"
          />
        </div>
        <McPrompt :list="prompts" direction="vertical" class="prompt-list" @itemClick="send($event.label)" />
      </div>
      <div v-for="(m, i) in messages" :key="i" class="msg-row">
      <McBubble
        :align="m.from === 'user' ? 'right' : 'left'"
        :variant="m.from === 'user' ? 'filled' : 'bordered'"
        :loading="m.loading"
        avatarPosition="side"
        :avatarConfig="m.from === 'user' ? { imgSrc: '/dog.webp' } : { imgSrc: '/cat.webp' }"
      >
        <template #loadingTpl>
          <span>咪正在思考 ...</span>
        </template>
        <div :class="{ 'msg-content': true, 'is-streaming': m.streaming }">
          <McMarkdownCard v-if="m.from === 'model'" :content="m.content" :typing="true" />
          <span v-else>{{ m.content }}</span>
        </div>
      </McBubble>
      </div>
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
import { ref, nextTick, watch } from 'vue';
import OpenAI from 'openai';
import { McBubble, McLayoutContent, McPrompt, McMarkdownCard, McIntroduction } from '@matechat/core';


const client = new OpenAI({
  baseURL: 'https://search.xuda.live/chats/xuda-assistant',
  apiKey: 'e1c235a8f87cad6e9afbec885c0a3c1d356b268985261add1c16c6f171d86938',
  dangerouslyAllowBrowser: true,
});

const input = ref('');
const messages = ref([]);
const msgAreaRef = ref(null);

watch(() => messages.value.length, () => {
  nextTick(() => {
    if (msgAreaRef.value) {
      const el = msgAreaRef.value.$el || msgAreaRef.value;
      el.scrollTop = el.scrollHeight;
    }
  });
});
const description = [
  '基于徐工生活指南文档，为你解答宿舍、食堂、课程、军训等校园问题。',
  '答案由 AI 生成，仅供参考，具体以学校最新通知为准。',
];

const prompts = [
  { label: '宿舍是几人间，有独立卫浴和空调吗？', desc: '了解宿舍配置' },
  { label: '学校里有什么好吃的？', desc: '食堂、周边美食' },
  { label: '有晚自习、校园跑吗？', desc: '日常作息安排' },
  { label: '寒暑假一般放多久？', desc: '假期时长' },
];

async function send(q) {
  if (!q?.trim()) return;
  input.value = '';

  messages.value.push({ from: 'user', content: q });

  const msgIdx = messages.value.length;
  messages.value.push({ from: 'model', content: '', loading: true, streaming: true });

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
        nextTick(() => {
          if (msgAreaRef.value) {
            const el = msgAreaRef.value.$el || msgAreaRef.value;
            el.scrollTop = el.scrollHeight;
          }
        });
      }
    }
    messages.value[msgIdx].streaming = false;
  } catch (e) {
    messages.value[msgIdx].loading = false;
    messages.value[msgIdx].streaming = false;
    messages.value[msgIdx].content = '出错了：' + e.message;
  }
}
</script>

<style scoped>
.chat-wrapper {
  margin: 0 auto;
  max-width: 1040px;
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

.msg-row {
  margin-bottom: 0.6rem;
}

.chat-header {
  padding: 0.9rem 1.2rem;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-border);
  font-weight: 600;
  font-size: 1rem;
  color: var(--vp-c-text);
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.header-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
}

.chat-empty {
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1.5rem;
}

.intro-center {
  width: 100%;
  display: flex;
  justify-content: center;
}

.prompt-list {
  width: 260px;
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

/* streaming spinner — injected inline at end of markdown text */
.is-streaming :deep(.mc-markdown-render > :last-child)::after {
  content: '';
  display: inline-block;
  width: 12px;
  height: 12px;
  margin-left: 4px;
  border: 2px solid var(--vp-c-border);
  border-top-color: var(--vp-c-accent);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  vertical-align: middle;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
