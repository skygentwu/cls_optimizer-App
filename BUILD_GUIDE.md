# CLS Optimizer App - 安装包构建指南

## 📦 已生成的文件

| 文件 | 说明 | 大小 |
|------|------|------|
| `dist/` | 生产构建的 Web 应用（可直接部署） | ~550KB |
| `cls_optimizer-app-release.tar.gz` | 完整项目包（含 Android/iOS 原生项目） | 875KB |
| `android/` | Capacitor Android 项目 | - |
| `ios/` | Capacitor iOS 项目 | - |

---

## 方案一：Web 直接使用（推荐，零安装）

**无需任何构建工具**，直接用浏览器访问：

```bash
cd D:\python\cls_optimizer-App
npx serve dist
```

然后手机浏览器访问同一局域网地址即可。

或者将 `dist/` 目录部署到任何静态服务器（Nginx、Apache、Vercel、GitHub Pages 等）。

---

## 方案二：构建 Android APK

### 前置要求

1. **Java JDK 17+** - [下载地址](https://www.oracle.com/java/technologies/downloads/)
2. **Android Studio**（含 Android SDK）- [下载地址](https://developer.android.com/studio)
3. 环境变量配置：
   - `JAVA_HOME` → JDK 安装路径
   - `ANDROID_HOME` → Android SDK 路径

### 构建步骤

```bash
# 1. 解压项目包
tar -xzf cls_optimizer-app-release.tar.gz

# 2. 进入 Android 项目
cd android

# 3. 构建调试版 APK
./gradlew assembleDebug

# 4. 构建发布版 APK（需要签名配置）
./gradlew assembleRelease
```

### 输出位置

- 调试版：`android/app/build/outputs/apk/debug/app-debug.apk`
- 发布版：`android/app/build/outputs/apk/release/app-release-unsigned.apk`

### Windows 用户

在 PowerShell 中执行：
```powershell
cd D:\python\cls_optimizer-App\android
.\gradlew.bat assembleDebug
```

---

## 方案三：构建 iOS IPA

### 前置要求

- **macOS** + **Xcode**（iOS 构建必须在 Mac 上进行）
- Apple Developer 账号（如需发布到 App Store）

### 构建步骤

```bash
# 1. 打开 iOS 项目
cd ios/App
pod install
open App.xcworkspace

# 2. 在 Xcode 中：
#    - 选择目标设备/模拟器
#    - 配置签名（Signing & Capabilities）
#    - Product → Archive → Distribute App
```

---

## 方案四：PWA 添加到主屏幕（最简单）

无需构建 APK，将 Web 应用安装为手机桌面图标：

### Android Chrome
1. 用手机浏览器访问应用地址
2. 点击菜单 → "添加到主屏幕"
3. 确认添加，图标会出现在桌面

### iOS Safari
1. 用 Safari 访问应用地址
2. 点击分享按钮 → "添加到主屏幕"
3. 确认添加

### 已配置的 PWA 支持

- ✅ `manifest.json` 已配置
- ✅ 主题色 `#1890ff`
- ✅ 全屏模式支持
- ✅ iOS Safari 独立运行模式

---

## 🔧 如需重新构建

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 生产构建 + Capacitor 同步
npm run build
npx cap sync

# 打开 Android Studio
npx cap open android

# 打开 Xcode
npx cap open ios
```

---

## 📋 应用信息

| 属性 | 值 |
|------|-----|
| 应用 ID | `com.chloralkali.clsoptimizer` |
| 应用名称 | CLS Optimizer |
| 版本 | 1.0.0 |
| 最低 Android 版本 | API 22 (Android 5.1) |
| 最低 iOS 版本 | iOS 13 |
| 后端地址 | `http://localhost:8000` |
