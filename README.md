# huinavigate

> 探索、构建、创造。一个苹果官网风格的个人主页 —— 粉金配色、沉浸式 3D、丝滑交互动效。

huinavigate 是 1Charizard 的个人主页，参考苹果官网的视觉语言设计：开机式开场动画、毛玻璃导航、水晶渐变背景、Three.js 3D 粒子、GSAP 滚动编舞。访问时会**自动检测设备**，跳转到对应的电脑版 / 平板版 / 手机版页面，三端各有独立的交互方案。

🔗 线上地址：<https://1charizard.github.io/huinavigate/>

## ✨ 特性

- **设备自适应**：入口页自动检测（桌面 / 平板 / 手机），三端独立页面，各端体验量身定制
- **沉浸式开场**：PixelSwap 像素扩散开场动画 + Scroll Expand 粉金媒体窗口揭幕
- **3D 粒子背景**：Three.js WebGL 粒子层，跟随光标与滚动响应，移动端自动降级
- **滚动编舞**：GSAP + ScrollTrigger 驱动背景渐变、板块入场、Card Swap 卡片切换
- **底部小白条抽屉**：点击小白条丝滑上滑弹出导航，交互热区严格贴合白条
- **苹果风 UI**：SF Pro 字体栈、毛玻璃（backdrop-filter）、粉嫩水晶渐变 + 金黄色点缀
- **骨架屏占位**：内容加载前以骨架屏占位，加载后平滑呈现
- **零构建**：纯 HTML/CSS/JS + CDN 风格本地 vendor 依赖，无需打包即可运行

## 🛠 技术栈

| 类别 | 技术 |
| --- | --- |
| 语言 | 原生 HTML / CSS / JavaScript（ES Module 按需加载） |
| 3D | [Three.js](https://threejs.org/)（本地 vendor 包，WebGL 粒子） |
| 动效 | [GSAP](https://gsap.com/) + ScrollTrigger（滚动编舞） |
| 自定义动效 | PixelSwap（像素切换）、Scroll Expand（展开揭幕）、Dark Veil（暗纱）、Gradual Blur（渐晕）—— 均为零依赖自研模块 |
| 部署 | GitHub Pages（自动构建部署） |

## 📁 目录结构

```
huinavigate/
├── index.html            # 设备检测入口页（3 秒倒计时自动跳转 + 手动选择）
├── desktop/index.html    # 电脑版（完整 6 板块 + 玻璃切换按钮 + 抽屉导航）
├── tablet/index.html     # 平板版（触屏大按钮 + 滑动切换板块 + 抽屉导航）
├── mobile/index.html     # 手机版（单栏布局 + 底部小白条抽屉导航）
├── styles.css            # 三端共享样式（响应式三级：桌面/平板/手机）
├── main.js               # 界面逻辑（开场/光标/磁吸/ripple/i18n/骨架屏/抽屉）
├── device.js             # 设备检测模块（零依赖，最先加载）
├── three-scene.js        # Three.js 3D 粒子背景（ESM，失败静默降级）
├── dark-veil.js          # 全屏暗纱背景（WebGL 粉金流动）
├── gradual-blur.js       # 顶部渐晕（导航下方毛玻璃过渡）
├── scroll-expand-open.js # Scroll Expand 开场揭幕动画
├── pixel-swap.js         # PixelSwap 像素切换过渡
├── scene.js              # 背景渐变 + 滚动编舞（GSAP）
└── vendor/               # 本地第三方库（gsap / ScrollTrigger / three）
```

## 🚀 本地运行

项目是纯静态站点，任意静态服务器均可启动：

```bash
# 方式一：Python（推荐）
cd huinavigate
python3 -m http.server 8080
# 打开 http://localhost:8080

# 方式二：Node
npx serve .
```

> 提示：直接双击打开 `index.html` 也能浏览，但部分模块（ES Module、`fetch` 类能力）建议通过本地服务器访问以获得完整体验。

## ☁️ 部署到 GitHub Pages

项目已配置 GitHub Actions 自动构建部署，推到 `main` 分支即自动上线：

```bash
git add -A
git commit -m "your message"
git push origin main
```

等待 Actions 中的 `pages build and deployment` 成功后即可访问：

```
https://<你的用户名>.github.io/huinavigate/
```

首次使用请确认：
1. 仓库 **Settings → Pages** 中 Source 选择 `GitHub Actions`（或 `Deploy from a branch` + `main / (root)`）
2. 如使用自定义域名，在 Pages 设置中绑定 CNAME

## 📱 三端说明

| 端 | 判定规则 | 特点 |
| --- | --- | --- |
| 电脑版 desktop | 精细指针 + 宽度 > 1024px | 完整板块、玻璃上下切换按钮、自定义光标、3D 粒子全效 |
| 平板版 tablet | 触屏 + 宽度 > 720px（或小屏笔记本） | 大触控按钮、左右滑动切板块、3D 粒子降密度 |
| 手机版 mobile | 其余（触屏 + ≤720px） | 单栏布局、底部小白条抽屉导航、3D 粒子最低密度 |

三端均提供底部**小白条抽屉**：默认只露出小白条，点击后整个窗口（含白条）丝滑上滑，弹出导航与链接。

## 📄 许可

© 1Charizard · huinavigate。个人项目，欢迎参考学习。
