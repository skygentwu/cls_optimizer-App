# CLS Optimizer App - 原生 App 测试指南

## 构建状态

| 平台 | 状态 | 构建产物 |
|------|------|----------|
| Android | ✅ 构建成功 | `android/app/build/outputs/apk/debug/app-debug.apk` (4.8MB) |
| iOS | ⚠️ 需要 macOS + Xcode | 当前 Windows 环境不支持 |
| Web | ✅ 构建成功 | `dist/` 目录 |

---

## Android 测试

### 1. 环境要求
- JDK 21+ (已安装: OpenJDK 21.0.11)
- Android SDK (已配置)
- Gradle (已包含 wrapper)

### 2. 构建命令

```bash
# 构建 Web 资源
npm run build

# 同步到 Android
npx cap sync android

# 构建 Debug APK
cd android
./gradlew :app:assembleDebug

# 构建 Release APK (需要签名配置)
./gradlew :app:assembleRelease
```

### 3. 安装到设备

```bash
# 连接设备或启动模拟器
adb devices

# 安装 Debug APK
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# 查看日志
adb logcat -s "Capacitor" "AndroidRuntime" *:S
```

### 4. Android Studio 开发

```bash
# 打开 Android Studio
npx cap open android
```

在 Android Studio 中:
1. 连接设备或启动模拟器
2. 点击 **Run** (▶️) 按钮
3. 使用 Logcat 查看运行时日志

---

## iOS 测试 (仅限 macOS)

### 1. 环境要求
- macOS 12+
- Xcode 14+
- CocoaPods (用于某些 Capacitor 插件)

### 2. 构建命令

```bash
# 构建 Web 资源
npm run build

# 同步到 iOS
npx cap sync ios

# 打开 Xcode
npx cap open ios
```

在 Xcode 中:
1. 选择目标设备或模拟器
2. 点击 **Run** (▶️) 按钮
3. 使用 Console 查看运行时日志

### 3. 命令行构建 (无需打开 Xcode)

```bash
cd ios/App

# 构建并运行到模拟器
xcodebuild -scheme App -destination 'platform=iOS Simulator,name=iPhone 15' build

# 安装到模拟器
xcrun simctl install booted build/Build/Products/Debug-iphonesimulator/App.app
xcrun simctl launch booted com.chloralkali.clsoptimizer
```

---

## 网络配置

### 开发环境
- Android 模拟器: `http://10.0.2.2:8080` (访问本机后端)
- iOS 模拟器: `http://localhost:8080` (访问本机后端)
- 真机: 使用本机局域网 IP (如 `http://192.168.1.x:8080`)

### 生产环境
- 配置 HTTPS 后端地址
- 更新 `src/stores/appStore.ts` 中的默认 API 地址

---

## 常见问题

### Android 构建失败
1. **Gradle 同步失败**: 检查 `android/local.properties` 中的 SDK 路径
2. **依赖下载失败**: 检查网络连接，配置国内镜像
3. **签名错误**: Debug 构建使用默认签名，Release 需要配置签名密钥

### iOS 构建失败
1. **Xcode 版本过低**: 升级 Xcode 到 14+
2. **签名问题**: 在 Xcode 中配置 Team 和 Provisioning Profile
3. **CocoaPods 错误**: 运行 `pod install --repo-update`

### 运行时问题
1. **白屏**: 检查 Web 资源是否正确同步 (`npx cap sync`)
2. **API 请求失败**: 检查后端地址配置和网络权限
3. **CORS 错误**: 确保后端允许移动端域名

---

## CI/CD 自动化构建

项目已配置 GitHub Actions:
- `.github/workflows/build-android.yml`: 自动构建 Android APK/AAB
- `.github/workflows/deploy-web.yml`: 自动部署 Web 版本

触发条件:
- Push 到 `master` 分支
- Pull Request
- 手动触发 (Workflow dispatch)

---

## 测试检查清单

### Android
- [ ] Debug APK 安装成功
- [ ] 应用启动无白屏
- [ ] 登录功能正常
- [ ] 数据加载正常
- [ ] 图表显示正常
- [ ] 深色模式切换正常
- [ ] 后端 API 连接正常
- [ ] 离线提示正常

### iOS
- [ ] 模拟器启动成功
- [ ] 应用启动无白屏
- [ ] 登录功能正常
- [ ] 数据加载正常
- [ ] 图表显示正常
- [ ] 深色模式切换正常
- [ ] 后端 API 连接正常
- [ ] 安全区适配正常

---

## 构建产物路径

| 产物 | 路径 |
|------|------|
| Android Debug APK | `android/app/build/outputs/apk/debug/app-debug.apk` |
| Android Release APK | `android/app/build/outputs/apk/release/app-release-unsigned.apk` |
| Android AAB | `android/app/build/outputs/bundle/release/app-release.aab` |
| iOS Simulator | `ios/App/build/Build/Products/Debug-iphonesimulator/App.app` |
| iOS Device | `ios/App/build/Build/Products/Debug-iphoneos/App.app` |
| Web | `dist/` |

---

*最后更新: 2026-06-17*
