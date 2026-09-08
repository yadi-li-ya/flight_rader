# 特价雷达 FareRadar · 特价机票发现平台

一个纯静态（HTML + CSS + 原生 JS，无构建步骤）的特价机票发现平台高保真原型。

## 功能
- **任意飞反向搜索**：给预算 + 假期天数 + 出发城市，AI 反推最值目的地
- **综合评分 / 真实到手价预估**：5 维加权评分（性价比/退改/舒适/准点/行李）+ 隐性成本折算
- **实时捡漏流** + **降价提醒** + **特价日历**（点击日期 → 航班对比弹窗，可跳官网购买）
- **航司活动通知**：大白话解读规则，直达航司官网

## 本地预览
直接双击 `index.html` 即可（无需服务器）。若浏览器对本地文件有限制，可起一个静态服务：
```bash
python3 -m http.server 8080
# 打开 http://localhost:8080
```

## 部署到 GitHub Pages（零构建）
1. 在 GitHub 新建一个仓库（例如 `fare-radar`）
2. 把本仓库全部文件（含 `index.html`、`css/`、`js/`、`.nojekyll`）上传/推送到仓库
3. 仓库 **Settings → Pages → Build and deployment → Source: Deploy from a branch**
4. Branch 选 `main`（或 `master`），目录选 `/ (root)`，点 **Save**
5. 约 1 分钟后访问 `https://<你的用户名>.github.io/<仓库名>/`

> 已包含 `.nojekyll`，确保 `css/`、`js/` 等资源按原样提供，不被 Jekyll 处理。

## 目录结构
```
index.html        # 主页面
css/style.css     # 主样式
css/effects.css   # 视觉特效层（光斑/玻璃拟态/滚动揭示）
js/data.js        # 数据池（城市/航线/特价/日历/航司）
js/app.js         # 核心逻辑（搜索/评分/日历/弹窗）
PRD.md            # 产品需求文档
```
