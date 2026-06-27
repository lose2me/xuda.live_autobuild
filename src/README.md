---
home: true
icon: house
title: 首页
heroImage: cat.webp
heroText: 徐工生活指南
tagline: 旨在为徐工在校学生提供必要的生活指南

actions:
  - text: 新生知道
    icon: book
    link: /guide/score.html
    type: primary

  - text: 校园社群
    icon: streamline-flex-color:user-collaborate-group-flat
    link: /guide/contact.html
    type: default

highlights:
  - features:
      - title: 分数预测
        icon: chart-line
        details: 高考分数线预测与录取参考（仅供参考）
        link: /guide/score.html

      - title: 常见问题
        icon: fluent-emoji-flat:thinking-face
        details: 宿舍、课程、网络、门禁等高频问题
        link: /guide/faq.html

      - title: 掌上徐工
        icon: mobile-screen-button
        details: 开源，高性能，高颜值的校园助手APP
        link: /xzitpocket/releases.html
---

<ClientOnly><ChatAssistant /></ClientOnly>

<GitHubActivity repo="lose2me/xuda.live_autobuild" view="changelog" apiBase="/api/xuda" :limit="1" showUpdateTime />