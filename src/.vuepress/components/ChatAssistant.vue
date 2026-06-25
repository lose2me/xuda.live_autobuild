<template>
  <div class="chat-assistant">
    <div class="chat-header">
      <span class="chat-title">
徐工校园助手
      </span>
    </div>

    <div class="chat-body">
      <div class="chat-messages" ref="msgList">
        <div v-if="messages.length === 0" class="chat-hint">
          问我任何关于徐工的问题：宿舍、食堂、军训、转专业……
        </div>
        <div
          v-for="(m, i) in messages"
          :key="i"
          :class="['chat-msg', m.role]"
        >
          <div class="msg-role">{{ m.role === 'user' ? '你' : '助手' }}</div>
          <div class="msg-content" v-html="renderContent(m.content)"></div>
        </div>
        <div v-if="streaming" class="chat-msg assistant streaming">
          <div class="msg-role">助手</div>
          <div class="msg-content" v-html="renderContent(streamText)"></div>
          <span class="cursor">|</span>
        </div>
      </div>

      <div class="chat-input-row">
        <input
          v-model="input"
          class="chat-input"
          placeholder="输入问题，按回车发送..."
          :disabled="loading"
          @keydown.enter="send"
        />
        <button class="chat-send" :disabled="loading || !input.trim()" @click="send">
          发送
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';

const CHAT_URL = 'https://search.xuda.live/chats/xuda-assistant/chat/completions';
const CHAT_KEY = 'e1c235a8f87cad6e9afbec885c0a3c1d356b268985261add1c16c6f171d86938';

const input = ref('');
const messages = ref([]);
const streamText = ref('');
const streaming = ref(false);
const loading = ref(false);
const msgList = ref(null);

function scrollBottom() {
  nextTick(() => {
    if (msgList.value) {
      msgList.value.scrollTop = msgList.value.scrollHeight;
    }
  });
}

function renderContent(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

async function send() {
  const q = input.value.trim();
  if (!q || loading.value) return;
  input.value = '';
  messages.value.push({ role: 'user', content: q });
  scrollBottom();

  loading.value = true;
  streaming.value = true;
  streamText.value = '';

  try {
    const res = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CHAT_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: q }],
        stream: true,
        tools: [
          { type: 'function', function: { name: '_meiliSearchProgress', description: 'Reports real-time search progress to the user' } },
          { type: 'function', function: { name: '_meiliSearchSources', description: 'Provides sources and references for the information' } },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(err);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              streamText.value += delta;
              scrollBottom();
            }
          } catch {}
        }
      }
    }
  } catch (e) {
    streamText.value = '出错了：' + (e.message || '网络异常');
  }

  if (streamText.value) {
    messages.value.push({ role: 'assistant', content: streamText.value });
  }
  streamText.value = '';
  streaming.value = false;
  loading.value = false;
  scrollBottom();
}
</script>

<style scoped>
.chat-assistant {
  margin: 0.5rem auto 0;
  max-width: 860px;
  border: 1px solid var(--vp-c-border);
  border-radius: 12px;
  overflow: hidden;
  background: var(--vp-c-bg);
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.9rem 1.2rem;
  background: var(--vp-c-bg-soft);
}

.chat-title {
  font-weight: 600;
  font-size: 1rem;
  color: var(--vp-c-text);
}

.chat-body {
  border-top: 1px solid var(--vp-c-border);
}

.chat-messages {
  max-height: 400px;
  overflow-y: auto;
  padding: 1rem 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.chat-hint {
  text-align: center;
  color: var(--vp-c-text-subtle);
  font-size: 0.9rem;
  padding: 1.5rem 0;
}

.chat-msg {
  max-width: 85%;
}

.chat-msg.user {
  align-self: flex-end;
}

.chat-msg.assistant {
  align-self: flex-start;
}

.msg-role {
  font-size: 0.75rem;
  color: var(--vp-c-text-subtle);
  margin-bottom: 0.2rem;
}

.chat-msg.user .msg-role {
  text-align: right;
}

.msg-content {
  padding: 0.6rem 0.9rem;
  border-radius: 10px;
  font-size: 0.92rem;
  line-height: 1.6;
  color: var(--vp-c-text);
  word-break: break-word;
}

.chat-msg.user .msg-content {
  background: var(--vp-c-accent-soft);
}

.chat-msg.assistant .msg-content {
  background: var(--vp-c-bg-soft);
}

.chat-msg.streaming .msg-content {
  display: inline;
  background: var(--vp-c-bg-soft);
  border-radius: 10px 10px 0 10px;
}

.cursor {
  animation: blink 1s step-end infinite;
  color: var(--vp-c-accent);
}

@keyframes blink {
  50% { opacity: 0; }
}

.msg-content :deep(code) {
  background: var(--vp-c-bg-mute);
  padding: 0.1rem 0.35rem;
  border-radius: 3px;
  font-size: 0.85rem;
}

.msg-content :deep(strong) {
  font-weight: 600;
}

.chat-input-row {
  display: flex;
  gap: 0.5rem;
  padding: 0.8rem 1.2rem;
  border-top: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg-soft);
}

.chat-input {
  flex: 1;
  padding: 0.55rem 0.8rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  font-size: 0.92rem;
  background: var(--vp-c-bg);
  color: var(--vp-c-text);
  outline: none;
}

.chat-input:focus {
  border-color: var(--vp-c-accent);
}

.chat-send {
  padding: 0.55rem 1.2rem;
  border: none;
  border-radius: 8px;
  background: var(--vp-c-accent);
  color: #fff;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}

.chat-send:hover:not(:disabled) {
  opacity: 0.85;
}

.chat-send:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
