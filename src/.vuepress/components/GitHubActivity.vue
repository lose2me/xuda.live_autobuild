<template>
  <div class="github-activity">
    <div v-if="!loading && !error && latestRelease" class="latest-card">
      <div class="latest-header">
        <span class="latest-label">最新版本</span>
        <span class="tag">{{ latestRelease.tag_name }}</span>
        <span class="date">{{ formatDate(latestRelease.published_at) }}</span>
      </div>
      <div v-if="latestRelease.body" class="card-body-wrap">
        <div
          :class="['card-body', { collapsed: !expanded.has('latest') }]"
          v-html="renderBody(latestRelease.body)"
        ></div>
        <button
          v-if="isLong(latestRelease.body)"
          class="expand-btn"
          @click="toggleExpand('latest')"
        >
          {{ expanded.has('latest') ? '收起' : '展开' }}
        </button>
      </div>
      <div v-if="hasAndroid || hasIos" class="latest-downloads">
        <a v-if="hasAndroid" :href="androidUrl" target="_blank" rel="noopener" class="dl-btn">
          Android 下载
        </a>
        <a v-if="hasIos" :href="iosUrl" target="_blank" rel="noopener" class="dl-btn">
          iOS 下载
        </a>
      </div>
    </div>

    <div class="tab-bar">
      <button
        :class="['tab-btn', { active: activeTab === 'releases' }]"
        @click="activeTab = 'releases'; relPage = 1"
      >
        历史版本 [{{ historyReleases.length }}]
      </button>
      <button
        :class="['tab-btn', { active: activeTab === 'commits' }]"
        @click="activeTab = 'commits'; comPage = 1"
      >
        更新记录 [{{ commits.length }}]
      </button>
    </div>

    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else-if="activeTab === 'releases'" class="tab-content">
      <div v-if="historyReleases.length === 0" class="empty">暂无历史版本</div>
      <template v-else>
        <div v-for="r in pagedReleases" :key="r.id" class="card">
          <div class="card-header">
            <span class="tag">{{ r.tag_name }}</span>
            <span class="date">{{ formatDate(r.published_at) }}</span>
          </div>
          <div v-if="r.body" class="card-body-wrap">
            <div
              :class="['card-body', { collapsed: !expanded.has('r-' + r.id) }]"
              v-html="renderBody(r.body)"
            ></div>
            <button
              v-if="isLong(r.body)"
              class="expand-btn"
              @click="toggleExpand('r-' + r.id)"
            >
              {{ expanded.has('r-' + r.id) ? '收起' : '展开' }}
            </button>
          </div>
          <details v-if="r.assets && r.assets.length" class="assets">
            <summary class="assets-title">附件 ({{ r.assets.length }})</summary>
            <div v-for="a in r.assets" :key="a.id" class="asset-item">
              <a :href="a.browser_download_url" target="_blank" rel="noopener">
                {{ a.name }}
              </a>
              <span class="asset-size">{{ formatSize(a.size) }}</span>
            </div>
          </details>
          <a :href="r.html_url" target="_blank" rel="noopener" class="link">
            在 GitHub 上查看 &rarr;
          </a>
        </div>
        <div class="pager">
          <button :disabled="relPage <= 1" @click="relPage--">&lsaquo; 上一页</button>
          <span>{{ relPage }} / {{ relTotalPages }}</span>
          <button :disabled="relPage >= relTotalPages" @click="relPage++">下一页 &rsaquo;</button>
        </div>
      </template>
    </div>

    <div v-else-if="activeTab === 'commits'" class="tab-content">
      <div v-if="commits.length === 0" class="empty">暂无提交记录</div>
      <template v-else>
        <div v-for="c in pagedCommits" :key="c.sha" class="card commit-card">
          <div class="card-header">
            <code class="sha">{{ c.sha.slice(0, 7) }}</code>
            <span class="date">{{ formatDate(c.commit.author.date) }}</span>
          </div>
          <div class="card-body-wrap">
            <div
              :class="['commit-msg', { collapsed: !expanded.has('c-' + c.sha) }]"
            >{{ c.commit.message }}</div>
            <button
              v-if="c.commit.message.split('\n').length > 5"
              class="expand-btn"
              @click="toggleExpand('c-' + c.sha)"
            >
              {{ expanded.has('c-' + c.sha) ? '收起' : '展开' }}
            </button>
          </div>
          <a :href="c.html_url" target="_blank" rel="noopener" class="link">
            在 GitHub 上查看 &rarr;
          </a>
        </div>
        <div class="pager">
          <button :disabled="comPage <= 1" @click="comPage--">&lsaquo; 上一页</button>
          <span>{{ comPage }} / {{ comTotalPages }}</span>
          <button :disabled="comPage >= comTotalPages" @click="comPage++">下一页 &rsaquo;</button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, inject, onMounted } from "vue";

const PAGE_SIZE = 5;

const props = defineProps({
  repo: { type: String, required: true },
});

const config = inject("xzitpocketConfig", {});
const androidUrl = computed(() => config.androidUrl || "");
const iosUrl = computed(() => config.iosUrl || "");

const activeTab = ref("releases");
const releases = ref([]);
const commits = ref([]);
const loading = ref(true);
const error = ref("");
const relPage = ref(1);
const comPage = ref(1);
const expanded = reactive(new Set());

const API = `https://api.github.com/repos/${props.repo}`;

const latestRelease = computed(() => releases.value.length ? releases.value[0] : null);
const historyReleases = computed(() => releases.value.slice(1));
const hasAndroid = computed(() => androidUrl.value && androidUrl.value !== "#");
const hasIos = computed(() => iosUrl.value && iosUrl.value !== "#");

const relTotalPages = computed(() => Math.max(1, Math.ceil(historyReleases.value.length / PAGE_SIZE)));
const comTotalPages = computed(() => Math.max(1, Math.ceil(commits.value.length / PAGE_SIZE)));

const pagedReleases = computed(() => {
  const start = (relPage.value - 1) * PAGE_SIZE;
  return historyReleases.value.slice(start, start + PAGE_SIZE);
});

const pagedCommits = computed(() => {
  const start = (comPage.value - 1) * PAGE_SIZE;
  return commits.value.slice(start, start + PAGE_SIZE);
});

function toggleExpand(key) {
  if (expanded.has(key)) expanded.delete(key);
  else expanded.add(key);
}

function isLong(body) {
  return body && body.split("\n").length > 5;
}

function formatDate(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

function renderBody(md) {
  return md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/^### (.+)$/gm, "<strong>$1</strong>")
    .replace(/^## (.+)$/gm, "<strong>$1</strong>")
    .replace(/^- (.+)$/gm, "&#8226; $1")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br>");
}

onMounted(async () => {
  try {
    const [relRes, comRes] = await Promise.all([
      fetch(`${API}/releases?per_page=30`),
      fetch(`${API}/commits?per_page=30`),
    ]);
    if (!relRes.ok && !comRes.ok) {
      error.value = "无法获取仓库数据，请稍后再试";
      return;
    }
    if (relRes.ok) releases.value = await relRes.json();
    if (comRes.ok) commits.value = await comRes.json();
    if (releases.value.length === 0) activeTab.value = "commits";
  } catch (e) {
    error.value = "网络请求失败，请检查网络连接";
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.github-activity {
  max-width: 800px;
  margin: 1rem auto;
}

.latest-card {
  border: 2px solid var(--vp-c-accent);
  border-radius: 8px;
  padding: 1.2rem;
  margin-bottom: 1.2rem;
  background: var(--vp-c-bg);
}

.latest-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
  margin-bottom: 0.8rem;
}

.latest-label {
  font-weight: 700;
  font-size: 1rem;
  color: var(--vp-c-accent);
}

.latest-downloads {
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
  margin-top: 0.8rem;
  padding-top: 0.8rem;
  border-top: 1px solid var(--vp-c-border);
}

.dl-btn {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1.2rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
  color: #fff;
  background: var(--vp-c-accent);
}

.dl-btn:hover {
  opacity: 0.85;
}

.dl-btn::after,
.link::after {
  display: none !important;
}

.tab-bar {
  display: flex;
  gap: 0;
  border-bottom: 2px solid var(--vp-c-border);
  margin-bottom: 1.2rem;
}

.tab-btn {
  padding: 0.5rem 1.2rem;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.95rem;
  color: var(--vp-c-text-mute);
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all 0.2s;
}

.tab-btn.active {
  color: var(--vp-c-accent);
  border-bottom-color: var(--vp-c-accent);
  font-weight: 600;
}

.tab-btn:hover {
  color: var(--vp-c-accent);
}

.loading,
.empty {
  text-align: center;
  padding: 2rem;
  color: var(--vp-c-text-subtle);
}

.error {
  text-align: center;
  padding: 2rem;
  color: #ef4444;
}

.card {
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  padding: 1rem 1.2rem;
  margin-bottom: 0.8rem;
  background: var(--vp-c-bg);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.tag {
  background: var(--vp-c-accent-soft);
  color: var(--vp-c-accent);
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 600;
}

.date {
  margin-left: auto;
  color: var(--vp-c-text-subtle);
  font-size: 0.85rem;
}

.card-body-wrap {
  margin-top: 0.6rem;
  padding-top: 0.6rem;
  border-top: 1px solid var(--vp-c-border);
}

.card-body {
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--vp-c-text);
}

.card-body.collapsed {
  max-height: 8em;
  overflow: hidden;
}

.commit-msg {
  font-size: 0.92rem;
  color: var(--vp-c-text);
  white-space: pre-line;
  line-height: 1.5;
}

.commit-msg.collapsed {
  max-height: 7.5em;
  overflow: hidden;
}

.expand-btn {
  border: none;
  background: none;
  color: var(--vp-c-accent);
  cursor: pointer;
  font-size: 0.82rem;
  padding: 0.2rem 0;
}

.expand-btn:hover {
  text-decoration: underline;
}

.link {
  display: inline-block;
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: var(--vp-c-accent);
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}

.sha {
  background: var(--vp-c-bg-soft);
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  font-size: 0.82rem;
  color: var(--vp-c-text);
}

.assets {
  margin-top: 0.6rem;
  padding-top: 0.6rem;
  border-top: 1px solid var(--vp-c-border);
}

.assets-title {
  font-size: 0.82rem;
  color: var(--vp-c-text-subtle);
  cursor: pointer;
  list-style: none;
  margin-bottom: 0.3rem;
}

.assets-title::before {
  content: "\25B6 ";
  font-size: 0.7rem;
}

.assets[open] > .assets-title::before {
  content: "\25BC ";
}

.assets-title::-webkit-details-marker {
  display: none;
}

.asset-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0;
}

.asset-item a {
  color: var(--vp-c-accent);
  text-decoration: none;
  font-size: 0.9rem;
}

.asset-item a:hover {
  text-decoration: underline;
}

.asset-size {
  color: var(--vp-c-text-subtle);
  font-size: 0.8rem;
}

.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 0.8rem;
  padding-top: 0.8rem;
}

.pager button {
  border: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg);
  color: var(--vp-c-accent);
  padding: 0.3rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
}

.pager button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pager button:not(:disabled):hover {
  background: var(--vp-c-accent-soft);
}

.pager span {
  font-size: 0.85rem;
  color: var(--vp-c-text-mute);
}
</style>
