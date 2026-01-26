# 徐工生活指南 Web 构建仓库
![](https://img.shields.io/badge/发起人-盐泡-blue.svg?style=for-the-badge)

> 请注意: 本项目的文本部分，除采集于公共领域(均标注了引用来源)的部份外，其余文本使用[署名-非商业性使用-禁止演绎 4.0 国际许可证](https://creativecommons.org/licenses/by-nc-nd/4.0/)。

## 项目说明

这里是 **徐工生活指南** Web的资源仓库。欢迎大家检查并提交错误。

每个 Web 页面都是根据对应的一个 .md 文件渲染而成。.md 文件使用记事本或文本编辑器(如 VSCode) 即可编写。
  
```
  A[触发：push 到 main] --> B[Job: generator (ubuntu-latest)]
  B --> C[Checkout 仓库]
  C --> D[安装 pnpm v9]
  D --> E[安装 Node.js 22 + pnpm 缓存]
  E --> F[pnpm install --frozen-lockfile]
  F --> G[pnpm run docs:build<br/>输出：src/.vuepress/dist]
  G --> H[检测 dist 内 cdn.jsdelivr.net 引用<br/>下载到本地：src/.vuepress/dist/_cdn/jsdelivr<br/>并替换为本地路径]
  H --> I[校验 dist 不再包含 cdn.jsdelivr.net 引用]
  I --> J[git archive 打包源码<br/>repo-${{github.sha}}.zip]
  J --> K[发布 GitHub Release<br/>tag: autobuild-${{github.run_number}}<br/>上传 zip]
  K --> L[pip3 安装 coscmd/tccli]
  L --> M[coscmd config（读取 Secrets）]
  M --> N[上传到腾讯云 COS<br/>coscmd upload --delete]
```
