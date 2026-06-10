<template>
  <div class="github-activity">
    <div v-if="loading" class="loading"><div class="spinner"></div></div>

    <!-- 简介 -->
    <template v-else-if="view === 'readme'">
      <div v-if="!readme" class="empty">暂无简介</div>
      <div v-else class="readme-body" v-html="readme"></div>
    </template>

    <!-- 版本发布 -->
    <template v-else-if="view === 'releases'">
      <div v-if="latestRelease" class="latest-card">
        <div class="latest-header">
          <span class="latest-label">最新版本</span>
          <span class="tag">{{ latestRelease.tag_name }}</span>
          <span class="date">{{ formatDate(latestRelease.published_at) }}</span>
        </div>
        <div v-if="latestRelease.body" class="card-body-wrap">
          <div
            class="card-body"
            v-html="renderBody(latestRelease.body)"
          ></div>
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

      <h3 v-if="historyReleases.length" class="section-title">历史版本 [{{ historyReleases.length }}]</h3>
      <div v-if="releases.length === 0" class="empty">暂无版本发布</div>
      <template v-else>
        <div v-for="r in historyReleases" :key="r.id" class="card">
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
            在 GitHub 上查看
          </a>
        </div>

      </template>
    </template>

    <!-- 历史提交 -->
    <template v-else-if="view === 'changelog'">
      <div v-if="commits.length === 0" class="empty">暂无提交记录</div>
      <template v-else>
        <h3 v-if="showUpdateTime" class="update-time-title">
          文档已更新 {{ commits.length }} 次，最后编辑于 {{ formatDate(commits[0].commit.author.date, false) }}
        </h3>
        <div v-for="(c, index) in displayCommits" :key="c.sha" class="card">
          <div class="card-header">
            <code class="sha">[{{ commits.length - index }}] {{ c.sha.slice(0, 7) }}</code>
            <span class="committer">{{ c.committer?.login }}</span>
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
            在 GitHub 上查看
          </a>
        </div>

      </template>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, reactive, inject, onMounted } from "vue";

const props = defineProps({
  repo: { type: String, required: true },
  view: { type: String, default: "readme" },
  apiBase: { type: String, default: "/api/xzitpocket" },
  limit: { type: Number, default: 0 },
  showUpdateTime: { type: Boolean, default: false },
});

const config = inject("xzitpocketConfig", {});
const androidUrl = computed(() => config.androidUrl || "");
const iosUrl = computed(() => config.iosUrl || "");

const releases = ref([]);
const commits = ref([]);
const readme = ref("");
const loading = ref(true);
const expanded = reactive(new Set());

const latestRelease = computed(() => releases.value.length ? releases.value[0] : null);
const historyReleases = computed(() => releases.value.slice(1));
const hasAndroid = computed(() => androidUrl.value && androidUrl.value !== "#");
const hasIos = computed(() => iosUrl.value && iosUrl.value !== "#");
const displayCommits = computed(() =>
  props.limit > 0 ? commits.value.slice(0, props.limit) : commits.value
);

function toggleExpand(key) {
  if (expanded.has(key)) expanded.delete(key);
  else expanded.add(key);
}

function isLong(body) {
  return body && body.split("\n").length > 5;
}

function formatDate(iso, showTime = true) {
  const d = new Date(iso);
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  if (!showTime) return date;
  return `${date} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
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
    const fetches = [];
    if (props.view === "releases") {
      fetches.push(fetch(`${props.apiBase}/releases.json`).then(r => r.ok && r.headers.get("content-type")?.includes("json") ? r.json() : []));
    } else {
      fetches.push(Promise.resolve([]));
    }
    if (props.view === "changelog") {
      fetches.push(fetch(`${props.apiBase}/commits.json`).then(r => r.ok && r.headers.get("content-type")?.includes("json") ? r.json() : []));
    } else {
      fetches.push(Promise.resolve([]));
    }
    if (props.view === "readme") {
      fetches.push(fetch(`${props.apiBase}/readme.html`).then(async r => {
        if (!r.ok) return "";
        const t = await r.text();
        return t.startsWith("<!DOCTYPE") ? "" : t;
      }));
    } else {
      fetches.push(Promise.resolve(""));
    }

    const [rel, com, rm] = await Promise.all(fetches);
    releases.value = rel;
    commits.value = com;
    readme.value = rm;

    const hasData =
      (props.view === "releases" && rel.length > 0) ||
      (props.view === "changelog" && com.length > 0) ||
      (props.view === "readme" && rm);
    if (hasData) loading.value = false;
  } catch (e) {
    // keep loading spinner
  }
});
</script>

<style scoped>
.loading {
  display: flex;
  justify-content: center;
  padding: 3rem;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--vp-c-border);
  border-top-color: var(--vp-c-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.update-time-title {
  font-size: 1.1rem;
  color: var(--vp-c-text);
  margin-bottom: 0.8rem;
  font-weight: 600;
  font-variant-numeric: lining-nums;
}

.empty {
  text-align: center;
  padding: 2rem;
  color: var(--vp-c-text-subtle);
}

.section-title {
  font-size: 0.95rem;
  color: var(--vp-c-text-mute);
  margin: 1.5rem 0 0.8rem;
  font-weight: 600;
}

.latest-card {
  border: 2px solid var(--vp-c-accent);
  border-radius: 8px;
  padding: 1.2rem;
  margin-bottom: 1rem;
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
.link::after,
.asset-item a::after {
  display: none !important;
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
  overflow-x: hidden;
  word-break: break-word;
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
  overflow-x: hidden;
  word-break: break-word;
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

.sha {
  background: var(--vp-c-bg-soft);
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  font-size: 0.82rem;
  color: var(--vp-c-text);
}

.committer {
  font-size: 0.85rem;
  color: var(--vp-c-text-subtle);
}

.link {
  display: block;
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: var(--vp-c-accent);
  text-decoration: none;
  text-align: right;
}

.link:hover {
  text-decoration: underline;
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

.readme-body {
  line-height: 1.7;
  color: var(--vp-c-text);
  overflow-x: hidden;
  word-break: break-word;
}

.readme-body :deep(h1),
.readme-body :deep(h2),
.readme-body :deep(h3) {
  margin-top: 1.2rem;
  margin-bottom: 0.6rem;
  font-weight: 600;
  color: var(--vp-c-accent);
}

.readme-body :deep(h1) { font-size: 1.4rem; }
.readme-body :deep(h2) { font-size: 1.2rem; }
.readme-body :deep(h3) { font-size: 1.05rem; }

.readme-body :deep(p) {
  margin: 0.5rem 0;
}

.readme-body :deep(a) {
  color: var(--vp-c-accent);
}

.readme-body :deep(a)::after {
  display: none !important;
}

.readme-body :deep(ul),
.readme-body :deep(ol) {
  padding-left: 1.5rem;
  margin: 0.5rem 0;
}

.readme-body :deep(li) {
  margin: 0.3rem 0;
}

.readme-body :deep(code) {
  background: var(--vp-c-bg-soft);
  padding: 0.15rem 0.4rem;
  border-radius: 3px;
  font-size: 0.88rem;
}

.readme-body :deep(blockquote) {
  border-left: 3px solid var(--vp-c-accent);
  padding-left: 0.8rem;
  margin: 0.5rem 0;
  color: var(--vp-c-text-mute);
}

.readme-body :deep(pre) {
  overflow-x: auto;
  max-width: 100%;
}

.readme-body :deep(table) {
  display: block;
  overflow-x: auto;
  max-width: 100%;
}

.readme-body :deep(img) {
  max-width: 100%;
  height: auto;
}

.readme-body :deep(.anchor) {
  display: none;
}
</style>
