<template>
  <div class="vp-feature-wrapper">
    <div class="vp-feature">
      <div class="vp-features">
        <template v-for="item in features" :key="item.title">
          <RouteLink
            v-if="item.link"
            class="vp-feature-item link"
            :to="item.link"
            :aria-label="item.title"
          >
            <h3 class="vp-feature-title">
              <VPIcon :icon="item.icon" />
              <span v-html="item.title" />
            </h3>
            <div class="vp-feature-details" v-html="item.details" />
          </RouteLink>
          <div v-else class="vp-feature-item">
            <h3 class="vp-feature-title">
              <VPIcon :icon="item.icon" />
              <span v-html="item.title" />
            </h3>
            <div class="vp-feature-details" v-html="item.details" />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import "vuepress-theme-hope/styles/home/feature-panel.scss";

const features = [
  {
    title: '分数预测',
    icon: 'chart-line',
    details: '高考分数线预测与录取参考（仅供参考）',
    link: '/guide/score.html',
  },
  {
    title: '常见问题',
    icon: 'fluent-emoji-flat:thinking-face',
    details: '宿舍、课程、网络、门禁等高频问题',
    link: '/guide/faq.html',
  },
  {
    title: '掌上徐工',
    icon: 'mobile-screen-button',
    details: '开源，高性能，高颜值的校园助手APP',
    link: '/xzitpocket/releases.html',
  },
];
</script>

<style scoped>
.vp-features {
  border-top: none !important;
}
</style>
