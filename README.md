# CLS Optimizer App

CLS Optimizer 的移动端 H5 App 前端，基于 React + TypeScript + Vite + Capacitor 构建。

本项目是 [`cls_optimizer`](D:/python/cls_optimizer) 的移动端配套前端，需配合后端服务使用。

---

## 技术栈

- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **移动端**: Capacitor (支持 Android / iOS)
- **UI 组件**: antd-mobile
- **状态管理**: Zustand
- **图表**: ECharts / Recharts

---

## 前置条件

- [Node.js](https://nodejs.org/) (建议 v18 或以上)
- npm (随 Node.js 安装)
- [Python](https://www.python.org/) 3.10+ (如需运行后端)
- Android Studio (如需构建 Android 应用)
- Xcode (如需构建 iOS 应用，仅限 macOS)

---

## 安装依赖

```bash
npm install
```

---

## 启动开发服务器

```bash
npm run dev
```

开发服务器默认运行于 `http://localhost:5173`，支持热更新 (HMR)。

> **注意**：部分功能需要后端服务配合，请先启动 [`cls_optimizer`](D:/python/cls_optimizer) 后端。

---

## 构建生产版本

```bash
npm run build
```

构建产物输出至 `dist/` 目录，随后 Capacitor 会将该目录同步到原生平台。

---

## 移动端平台运行

### 1. 构建 Web 资源并同步到原生平台

```bash
npm run build
npx cap sync
```

### 2. 打开原生 IDE

**Android:**

```bash
npx cap open android
```

在 Android Studio 中连接设备或启动模拟器，点击 **Run** 即可。

**iOS:** (仅限 macOS)

```bash
npx cap open ios
```

在 Xcode 中选择目标设备或模拟器，点击 **Run** 即可。

---

## 代码检查

```bash
npm run lint
```

---

## 后端服务

本应用依赖 `cls_optimizer` 的 FastAPI 后端，请按以下步骤启动：

```bash
cd D:/python/cls_optimizer
# 根据后端项目说明安装依赖并启动
```

确保后端服务地址与 `src/api/client.ts` 中的配置一致。

---

## 项目结构

```
├── src/               # 源代码
│   ├── api/           # API 客户端
│   ├── components/    # 公共组件
│   ├── constants/     # 常量定义
│   ├── hooks/         # 自定义 Hooks
│   ├── pages/         # 页面组件
│   ├── stores/        # Zustand 状态管理
│   ├── theme/         # 主题配置
│   ├── types/         # TypeScript 类型
│   └── utils/         # 工具函数
├── android/           # Capacitor Android 工程
├── ios/               # Capacitor iOS 工程
├── public/            # 静态资源
└── capacitor.config.ts # Capacitor 配置
```

---

## 相关项目

- **后端 & Web 前端**: [`cls_optimizer`](D:/python/cls_optimizer)
