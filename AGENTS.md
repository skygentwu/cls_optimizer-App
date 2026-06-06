# cls_optimizer-App — Agent 开发指南

> 本文件面向 AI 编程助手。阅读本文件前，默认你对本项目一无所知。

---

## 项目概述

`cls_optimizer-App` 是 [`cls_optimizer`](D:/python/cls_optimizer) 的**移动端 H5 App 前端**，服务于氯碱厂氯产品组合优化场景。在烧碱折百日产量固定、氯气总量确定的前提下，结合每日价格、成本、产能、合同和安全约束，计算液氯、31%盐酸、10%次氯酸钠的推荐产量组合与总边际贡献。

本项目采用 **React 18 + TypeScript + Vite + Capacitor** 技术栈构建，可同时输出：
- 纯 Web 应用（部署到静态服务器或 GitHub Pages）
- Android APK / AAB（Capacitor + Gradle）
- iOS App（Capacitor + Xcode，仅限 macOS）

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | React 18、TypeScript ~6.0、JSX (react-jsx) |
| 构建工具 | Vite 8、Rollup（手动分块） |
| 移动端容器 | Capacitor 8（`@capacitor/core/cli/android/ios`） |
| UI 组件 | antd-mobile 5、antd-mobile-icons |
| 状态管理 | Zustand 5（authStore 使用 `persist` 中间件写入 localStorage） |
| 路由 | react-router-dom 7（**必须使用 `HashRouter`**，因 Capacitor 使用 `file://` 协议） |
| 图表 | Recharts 3 |
| 手势 | react-swipeable 7 |
| 截图导出 | html2canvas 1（动态 `import()` 懒加载） |
| 日期 | dayjs 1 |
| 代码检查 | ESLint 10 + typescript-eslint + react-hooks + react-refresh |

---

## 项目结构

```
├── src/
│   ├── api/
│   │   └── client.ts          # 所有后端 API 封装（fetch-based，无 axios）
│   ├── components/
│   │   ├── AppShell.tsx       # 底部 TabBar + 手势返回外壳
│   │   └── common/
│   │       ├── EmptyState.tsx
│   │       ├── ErrorBoundary.tsx
│   │       ├── ErrorRetry.tsx
│   │       └── SkeletonCard.tsx
│   ├── constants/
│   │   ├── index.ts           # 默认产量、localStorage 键名、价格单位
│   │   └── products.ts        # 产品默认值与标签（与源项目同步）
│   ├── hooks/                 # 自定义 Hooks（目前为空，可扩展）
│   ├── pages/                 # 页面组件，每个页面独占一个目录
│   │   ├── dashboard/
│   │   ├── compare/
│   │   ├── trends/
│   │   ├── insights/
│   │   ├── backtest/
│   │   ├── forecast/
│   │   ├── margin/
│   │   ├── report/
│   │   ├── profile/
│   │   ├── login/
│   │   ├── manual/
│   │   ├── prices/
│   │   └── recommendation/
│   ├── stores/
│   │   ├── appStore.ts        # 全局计算参数、主题、API 地址、推荐结果
│   │   └── authStore.ts       # JWT Token / 用户信息 / 登录态（持久化）
│   ├── theme/                 # 主题目录（当前为空，样式写在 src/index.css）
│   ├── types/
│   │   ├── index.ts           # 移动端精简类型（人工维护）
│   │   ├── original.ts        # 从源项目自动同步的完整类型
│   │   ├── css.d.ts
│   │   └── env.d.ts
│   ├── utils/
│   │   └── format.ts          # 数字、金额、产量、百分比、日期格式化
│   ├── App.tsx                # HashRouter + 懒加载路由 + 登录守卫
│   ├── main.tsx               # 根渲染：StrictMode + ErrorBoundary + ConfigProvider
│   └── index.css              # 全局样式、深色模式覆盖、安全区适配
├── android/                   # Capacitor Android 原生工程
├── ios/                       # Capacitor iOS 原生工程
├── public/                    # 静态资源（favicon、icons）
├── scripts/
│   ├── sync_from_source.py    # 与源项目文件同步脚本
│   └── watch_source.py        # 持续监控源项目变更
├── .github/workflows/
│   ├── build-android.yml      # CI：构建 Android Debug / Release APK + AAB
│   └── deploy-web.yml         # CI：构建并部署到 GitHub Pages
├── capacitor.config.ts        # Capacitor 配置（应用 ID、SplashScreen、webDir: dist）
├── vite.config.ts             # Vite 配置（路径别名 @/、代理、手动分块）
├── tsconfig.json              # TypeScript 严格模式配置
├── eslint.config.js           # ESLint Flat Config
└── package.json
```

---

## 构建与开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器（默认 http://localhost:5173，HMR 已启用）
npm run dev

# 类型检查（不输出文件）
npm run typecheck

# 代码检查
npm run lint

# 生产构建（输出到 dist/）
npm run build

# 预览生产构建
npm run preview
```

### 移动端构建流程

```bash
# 1. 构建 Web 资源
npm run build

# 2. 同步到原生平台
npx cap sync

# 3. 打开原生 IDE
npx cap open android   # 需 Android Studio + JDK 17+
npx cap open ios       # 需 macOS + Xcode
```

Android 构建产物路径：
- Debug APK：`android/app/build/outputs/apk/debug/app-debug.apk`
- Release APK：`android/app/build/outputs/apk/release/app-release-unsigned.apk`
- AAB：`android/app/build/outputs/bundle/release/app-release.aab`

---

## 代码组织与模块划分

### 1. API 层 (`src/api/client.ts`)
- **唯一**的 HTTP 客户端，基于原生 `fetch` 封装。
- 所有请求统一 15 秒超时（`AbortController`）。
- 自动在 `Authorization` Header 中注入 JWT Token（从 `authStore` 读取）。
- 遇到 401 自动清除登录态并跳转到 `#/login`。
- 提供 `ApiError` 异常类，上层通过 `status` 区分错误类型。
- API Base URL 优先级：`appStore.apiBaseUrl` > `import.meta.env.VITE_API_BASE_URL` > 空字符串（开发环境走 Vite proxy）。
- Capacitor 原生环境（模拟器/真机）默认指向 `http://10.0.2.2:8000`。

### 2. 状态管理 (`src/stores/`)
- **appStore**：全局业务状态（烧碱日产量 `naohDaily`、当前价格 `prices`、决策模式 `decisionName`、推荐结果 `recommendation`、手动模拟产量/结果、全局加载态、API 地址、主题）。
  - 主题和 API 地址持久化到 `localStorage`。
- **authStore**：登录态（`token`、`user`、`isLoggedIn`），使用 Zustand `persist` 中间件持久化到 `localStorage`（键名：`cls-auth-storage`）。

### 3. 路由 (`src/App.tsx`)
- 使用 **`HashRouter`**，这是 Capacitor 应用的要求（`file://` 协议不支持 BrowserRouter）。
- `/login` 为独立路由，未登录时所有路径重定向至此。
- 非首屏页面使用 `React.lazy()` + `Suspense` 懒加载，fallback 为 `SkeletonCard`。
- `AppShell` 包裹所有已登录页面，提供底部 TabBar 和右滑返回手势。

### 4. 页面 (`src/pages/`)
- 每个页面一个目录，包含 `*.tsx` 和同名的 `*.css`。
- 页面组件使用**默认导出**（Default Export）。
- 首屏（Dashboard）不懒加载，其余页面懒加载。

### 5. 类型 (`src/types/`)
- `index.ts`：移动端实际使用的**精简类型**，需人工维护。
- `original.ts`：从源项目 `frontend/src/types.ts` **自动复制**的完整类型，仅作参考，不直接引用。
- 新增后端接口时，必须同时在 `src/types/index.ts` 和 `src/api/client.ts` 中添加。

---

## 代码风格规范

- **语言**：TypeScript；UI 文本和注释使用**中文**。
- **严格模式**：`strict: true`、`noUnusedLocals: true`、`noUnusedParameters: true`、`noFallthroughCasesInSwitch: true`。
- **导入**：使用 `@/` 路径别名指向 `src/`。
- **命名**：
  - 组件 / 页面：PascalCase（如 `DashboardPage.tsx`）
  - API 函数 / Hooks / 工具函数：camelCase（如 `recommendDecision`）
  - 类型 / 接口：PascalCase（如 `PricePayload`）
- **组件**：函数组件 + Hooks，无 Class Component。
- **样式**：每个页面独立 `.css` 文件，全局共享样式在 `src/index.css`。
- **深色模式**：通过 `document.documentElement.setAttribute('data-theme', 'dark')` 切换，`index.css` 中提供 `[data-theme='dark']` 覆盖 antd-mobile 组件样式。

---

## 测试策略

> **当前项目没有测试代码。** 项目未配置 Jest、Vitest、Playwright 或 Cypress。

如需添加测试，建议：
- 单元测试：使用 Vitest（与 Vite 生态一致）。
- 组件测试：`@testing-library/react` + `jsdom`。
- E2E：考虑 Playwright 或 Appium（针对 Capacitor 原生层）。

---

## CI / CD 与部署

### GitHub Actions

| 工作流 | 触发条件 | 说明 |
|--------|---------|------|
| `build-android.yml` | push 到 `main`/`master`、PR、手动触发 | 安装 Node + JDK 21 + Android SDK → `npm ci` → `npm run build` → `npx cap sync android` → 构建 Debug APK / Release APK / AAB → 上传 Artifact |
| `deploy-web.yml` | push 到 `main`/`master`、手动触发 | `npm ci` → `npm run build`（带 `VITE_BASE_PATH`）→ 部署到 GitHub Pages |

### 部署形态

1. **Web 直接使用（推荐）**：`dist/` 目录可部署到任意静态服务器（Nginx、Vercel、GitHub Pages 等）。
2. **PWA**：已配置 `manifest.json`、主题色 `#1890ff`、全屏模式、iOS Safari 独立运行模式。
3. **Android APK/AAB**：通过上述 CI 或本地 Gradle 构建。
4. **iOS IPA**：需在 macOS 上通过 Xcode Archive + Distribute。

---

## 安全与运行时注意事项

- **Token 存储**：JWT 存储在 `localStorage`（通过 Zustand `persist`），非 HttpOnly Cookie。需警惕 XSS 风险。
- **API 超时**：所有请求硬编码 15 秒超时，后端长时间计算（如 LLM 建议）可能触发超时，需在前端做好 Loading 和重试提示。
- **CORS / 网络**：Capacitor 原生应用内嵌 WebView，开发时通过 `10.0.2.2`（Android 模拟器环回地址）访问本机后端；生产环境需确保内网/API 地址可达。
- **环境变量**：Vite 环境变量必须以 `VITE_` 开头才能在客户端代码中通过 `import.meta.env` 访问。

---

## 与源项目（`cls_optimizer`）的同步规则

### 项目关系

- **源项目**：`D:/python/cls_optimizer`
  - 后端：FastAPI（`backend/app/`）
  - Web 前端（React）：`frontend/src/`
  - 前端（Streamlit）：`app.py`、`tabs/`
- **目标项目**：`D:/python/cls_optimizer-App`
  - 移动端 H5 App：`src/`

### 同步原则

1. **API 层优先复用**：尽量复用源项目的 API 接口定义和类型。
2. **类型自动同步**：`types.ts` 和 `products.ts` 可直接复制复用。
3. **React 逻辑参考**：参考源项目 React 前端的 hooks、状态管理、页面逻辑。
4. **Streamlit 不参考**：忽略 Streamlit 版本（`app.py`、`tabs/`）。
5. **人工审核**：API client 和页面组件的变更需人工审核后同步。

### 文件映射

| 源文件 | 目标文件 | 同步方式 | 说明 |
|--------|---------|---------|------|
| `frontend/src/types.ts` | `src/types/original.ts` | 自动复制 | 类型定义直接复用 |
| `frontend/src/domain/products.ts` | `src/constants/products.ts` | 自动复制 | 产品常量直接复用 |
| `frontend/src/api/client.ts` | `src/api/client.ts` | 人工参考 | 参考函数签名，适配移动端 |
| `backend/app/schemas.py` | `src/types/index.ts` | 人工参考 | Pydantic 模型变更时同步 |
| `backend/app/routers/*.py` | `src/api/client.ts` | 人工参考 | 路由变更时同步 API |
| `doc/API接口合同.md` | `src/api/client.ts` | 人工参考 | 接口合同变更时同步 |

### 同步工具

```bash
# 检查变更
cd D:/python/cls_optimizer-App
python scripts/sync_from_source.py --check-only

# 执行同步
cd D:/python/cls_optimizer-App
python scripts/sync_from_source.py

# 持续监控
cd D:/python/cls_optimizer-App
python scripts/watch_source.py --interval 60
```

### 开发流程（涉及后端变更时）

1. 修改 `cls_optimizer` 后端的 API 或类型
2. 运行同步检查：`python scripts/sync_from_source.py --check-only`
3. 根据提示同步变更到移动端
4. 运行 `npm run typecheck` 确保类型一致
5. 运行 `npm run build` 确保构建成功

### 同步注意事项

- `src/types/index.ts` 是移动端定制版本，比 `original.ts` 更精简。
- API client 移除了 `token` 参数，改为从 `localStorage`（Zustand persist）自动读取。
- 移动端页面使用 `antd-mobile` 替代 `antd`。
- 新增 API 端点时，需在 `src/api/client.ts` 和 `src/types/index.ts` 同步添加。

---

## 关键配置速查

| 配置项 | 文件 | 说明 |
|--------|------|------|
| Capacitor 应用 ID | `capacitor.config.ts` | `com.chloralkali.clsoptimizer` |
| Web 构建输出目录 | `capacitor.config.ts` | `webDir: 'dist'` |
| 路径别名 | `vite.config.ts`、`tsconfig.json` | `@/` → `src/` |
| 开发代理 | `vite.config.ts` | `/api` → `http://localhost:8000` |
| 基础路径 | `vite.config.ts` | `base: process.env.VITE_BASE_PATH || '/'` |
| 严格 TS 选项 | `tsconfig.json` | `strict`、`noUnusedLocals`、`noUnusedParameters` |
| ESLint 忽略 | `eslint.config.js` | `dist/` |
| 应用默认后端地址 | `src/stores/appStore.ts` | 原生环境 `http://10.0.2.2:8000`，浏览器环境走相对路径 |
| 本地存储键名 | `src/constants/index.ts`、`src/stores/` | `cls_auth_token`、`cls_auth_user`、`cls_api_base`、`cls_theme` |
