# cls_optimizer-App 代码审查报告

- 范围：移动端前端 `cls_optimizer-App`（React 18 + TypeScript + Vite + Capacitor）
- 日期：2026-06-15
- 维度：安全漏洞 / 性能 / 代码质量
- 修复状态：本报告所列问题已于 2026-06-15 逐项处理，详见各条目 ✅（已修复）/ ⏸（维持现状）标记；正向项（S7/P3/Q7）无需改动。
- 说明：本次仅审查移动 App 仓库；后端（Java / Python / LLM）不在本次范围内。依赖项 CVE 审计因沙箱网络受限未能运行，请在本机执行 `npm audit`（见下）。

## 总览

整体质量良好：TypeScript `strict` 已开启、路由全部 `React.lazy` 懒加载、有 `ErrorBoundary`、有单元测试、请求统一收口在 `src/api/client.ts`、图表已统一走 `ChartBox`。没有发现 `dangerouslySetInnerHTML` / `eval` / `innerHTML` 等高危注入点，LLM 报告内容按文本节点渲染（React 自动转义），无明显 XSS 注入面。

主要问题集中在**移动端令牌安全与传输安全的纵深防御**（localStorage 存 JWT、无 CSP、Android 全局明文流量、后端地址可被改写后令牌外泄），以及若干**代码质量项**（注释乱码、只读化后遗留的大量写接口死代码、Trends 演示数据未接真实接口）。无“严重(Critical)”级阻断问题。

严重程度图例：🔴 高　🟠 中　🟡 低　⚪ 提示

---

## 一、安全

### 🟠 S1. JWT 明文存储于 localStorage，存在 XSS 窃取风险 — ✅ 已缓解（CSP + 地址白名单校验；localStorage 存储策略留待后续）
- 位置：`src/stores/authStore.ts:35`（`persist` 名称 `cls-auth-storage`），代码注释 `:23` 已自述该风险。
- 问题：Access Token 持久化在 `localStorage`，任何脚本注入（第三方依赖被投毒、未来引入的富文本渲染等）都能读取并外带令牌。
- 建议：① 落实 CSP（见 S2）作为首要纵深防御；② 评估改用内存态 + 短时令牌 / 刷新令牌；③ Capacitor 原生端可用安全存储插件（`@capacitor/preferences` + Keystore/Keychain）替代 `localStorage`；④ 缩短令牌有效期。

### 🟠 S2. 缺少 Content-Security-Policy — ✅ 已修复（index.html 增加 CSP）
- 位置：`index.html`（`<head>` 内无任何 CSP `<meta>`）。
- 问题：WebView/H5 没有 CSP，一旦出现注入点缺乏纵深防御，也无法限制脚本/连接来源。
- 建议：增加 CSP `<meta http-equiv="Content-Security-Policy" ...>`，至少限制 `default-src 'self'`、`connect-src` 到已知后端域、`script-src 'self'`（Vite 生产构建不需要 inline script）。原生端建议在 Capacitor 层统一配置。

### 🟠 S3. Android 全局开启明文流量 `usesCleartextTraffic="true"` — ✅ 已修复（network_security_config 限定开发主机，关闭全局明文）
- 位置：`android/app/src/main/AndroidManifest.xml:6`。
- 问题：发布版 APK 允许向**任意**域发起明文 HTTP，易受中间人攻击。开发期连 `http://10.0.2.2:8080` 需要它，但不应带进生产。
- 建议：用 `res/xml/network_security_config.xml` 将明文白名单限定到开发主机（`10.0.2.2`、`localhost`），release 构建关闭全局明文；生产后端统一走 HTTPS。

### 🟡 S4. 后端地址用户可改写，叠加令牌自动注入存在外泄面 — ✅ 已修复（登录页/我的页保存前校验协议与主机并提示风险）
- 位置：`src/api/client.ts:92`（`getApiBase` 读 `apiBaseUrl`）、`:138` `request()` 对 `buildApiUrl(path)` 自动附加 `Authorization: Bearer`；`src/stores/appStore.ts:78` 从 `localStorage('cls_api_base')` 取值；登录页/“我的”页可写入该值。
- 问题：`apiBaseUrl` 是绝对地址时，所有请求（含 SSE `:1059`、流式 `:1103`）都会把 Bearer 令牌发往该地址。若被诱导写入恶意地址，令牌即被外带。属本地可控、风险较低，但应做输入约束。
- 建议：保存前校验协议与主机（仅允许 `http(s)` + 受信主机/内网段），或在设置项给出“仅连接受信后端”的提示与白名单。

### 🟡 S5. 路径参数未统一编码（纵深防御） — ✅ 已修复（剩余路径段 encodeURIComponent；写接口随 Q2 移除）
- 位置：`src/api/client.ts` 多处，如 `:246` `/api/prices/${date}`、`:338` `/api/prices/forecast-versions/${forecastId}/status`、`:387` `/versions/${id}`、`/api/admin/data/tables/${tableName}` 等未做 `encodeURIComponent`（部分接口已正确编码，存在不一致）。
- 问题：当前传入多为内部 ID/日期，风险低；但不一致易在后续演进中埋坑。
- 建议：所有插入 URL 的动态段统一 `encodeURIComponent`。

### ⚪ S6. 依赖项 CVE 审计未执行 + 版本异常需核验 — ✅ 已修复（CI 增加 npm audit --audit-level=high）
- 现象：沙箱内 `npm audit` 被网络白名单拦截，无法获取漏洞数据。
- 另：`package.json` 中 `vite ^8`、`typescript ~6.0.2`、`eslint ^10`、`react-router-dom ^7.16`、`@types/node ^24` 等主版本偏高，请确认它们解析到的是真实、可信的发布版本（供应链卫生）。
- 建议：本机执行 `npm audit`、`npm ls` 复核依赖树；CI 中加入 `npm audit --audit-level=high` 与锁文件校验。

### ⚪ S7. 无敏感信息硬编码（正向确认）
- 已检索：源码中未发现硬编码 API Key / 密钥 / 口令（`api_key_*` 仅为类型字段与管理端临时输入透传）。`console.*` 仅 `ErrorBoundary.tsx:46` 一处错误日志，不泄露敏感数据。保持现状即可。

---

## 二、性能

### 🟡 P1. 全局 15 秒硬超时可能误杀 LLM 类长请求 — ✅ 已修复（按路径区分超时，LLM/分析类放宽至 60s）
- 位置：`src/api/client.ts:141` `setTimeout(() => controller.abort(), 15000)`。
- 问题：非流式请求一律 15s 中断；LLM 建议、报告生成等耗时操作易超时失败（项目文档亦提示此点）。流式接口（`streamLlmPost`）不受此限。
- 建议：按接口类型差异化超时（普通查询 15s，分析/LLM 类 60s+），或对可流式的分析统一走 SSE。

### 🟡 P2. 首页存在三段请求瀑布 — ⏸ 维持现状（保留骨架屏；聚合接口属后端范围）
- 位置：`src/pages/dashboard/DashboardPage.tsx:71`（`Promise.all([modes, prices])`）→ `:85` `recommendDecision` → `:90` `evaluateManualPlan`。
- 问题：后两步分别依赖前一步结果，串行不可完全避免，但首屏数据到齐时间被拉长。
- 建议：保持骨架屏（已具备）；可考虑后端提供“首页聚合”接口一次返回推荐+人工评估，减少往返。

### 🟢 P3. 已具备的良好实践（无需改动）
- 路由全部 `lazy` + `Suspense`（`src/App.tsx`）。
- `manualChunks` 拆分 `vendor/charts/mobile/utils`（`vite.config.ts`），recharts 等重库单独成块。
- 列表/派生数据用 `useMemo`、回调用 `useCallback`，zustand 选择器订阅，重渲染可控。
- `ChartBox`（本次新增）用 `ResizeObserver` 测宽后渲染，既消除 recharts `-1` 警告又避免无效渲染。

---

## 三、代码质量

### 🟠 Q1. `client.ts` 区段注释乱码（GBK 以 UTF-8 误存） — ✅ 已修复（注释乱码更正；新增 .gitattributes/.editorconfig）
- 位置：`src/api/client.ts:579`（`搴撳瓨鏁版嵁` 应为“库存数据”）、约 `:810`（`绠＄悊涓庢暟鎹淮鎶` 应为“管理与数据维护”）、约 `:989`（`澶栭儴鍟嗘儏涓庨€氱煡` 应为“外部商情与通知”）。
- 影响：可读性/可维护性下降，提示文件编码或某次保存使用了非 UTF-8。
- 建议：修正这些注释并统一以 UTF-8 保存；可加 `.editorconfig`/`.gitattributes` 固化编码与换行，避免再次发生（仓库中已观察到 `gradlew.bat` 等 CRLF/LF 差异）。

### 🟠 Q2. 只读化后遗留大量写/管理接口为死代码 — ✅ 已修复（移除 42 个未用写/管理接口及用例，类型导入同步精简）
- 位置：`src/api/client.ts` 中 `updatePriceRecord`、`bulkUpdatePriceRecords`、`createAdminUser`、`updateAdminUser`、`saveDataAdminTable`、`upsertDataAdminRow`、`deleteDataAdminRow`、`saveLlmSettings`、`sendApcWorkOrder`、`commitConstraintUpdate` 等。
- 背景：本轮已将 App 定位为“只读查询/报告”，价格编辑页已移除，这些写接口在 App 内已无任何调用方。
- 影响：增大 API 面与维护成本，也与“App 不提供数据变更”的边界不一致。
- 建议：从 App 的 `client.ts` 与 `types` 中移除这些未使用的写/管理接口（PC 端保留即可）；保留单测请同步精简（`src/api/client.test.ts` 仍在测试 `updatePriceRecord` 等）。

### 🟠 Q3. 趋势页使用演示数据，未接真实接口 — ✅ 已修复（已接入真实接口，移除演示提示）
- 位置：`src/pages/trends/TrendsPage.tsx:11` `// FIXME: 初版演示数据，待 /api/prices 和 /api/decisions 提供趋势聚合接口后替换为真实数据`。
- 影响：作为“查询报告”工具，趋势页展示的是假数据，存在误导业务判断的风险。
- 建议：接入真实趋势聚合接口；在未接通前于页面显著标注“演示数据”。

### 🟡 Q4. `request()` 401 分支返回与抛出风格不一致 — ✅ 已修复（401 统一改为 throw）
- 位置：`src/api/client.ts:155` 起，401 非登录接口走 `return Promise.reject(new ApiError(...))`，其余错误走 `throw`。
- 影响：功能正常，但同一函数内两种错误传播风格，易混淆。
- 建议：统一为 `throw`。

### 🟡 Q5. API base 解析逻辑两处重复 — ✅ 已修复（getApiBase 仅消费 appStore）
- 位置：`src/api/client.ts:92` `getApiBase()` 与 `src/stores/appStore.ts:78` 初始化均涉及 `apiBaseUrl`/`VITE_API_BASE_URL` 优先级。
- 建议：以 appStore 为唯一来源，client 仅消费，避免双份优先级规则漂移。

### 🟡 Q6. 视口禁用缩放影响可访问性 — ✅ 已修复（去除 user-scalable=no / maximum-scale）
- 位置：`index.html` `viewport` 含 `maximum-scale=1.0, user-scalable=no`。
- 影响：低视力用户无法放大；非安全问题，但不利无障碍。
- 建议：评估去除 `user-scalable=no`。

### 🟢 Q7. 正向项
- `tsconfig` `strict: true`、`noUnusedLocals/Parameters: true`，类型约束严格。
- 统一 HTTP 客户端、统一图表组件、统一错误边界，分层清晰。
- 关键工具/状态/接口均有单测（`utils/format`、`stores/*`、`api/client`）。

---

## 修复进度（2026-06-15）

本轮已逐项处理，状态如下：

- ✅ 已修复：S2、S3、S4、S5、S6、P1、Q1、Q2、Q3、Q4、Q5、Q6
- ✅ 已缓解：S1（CSP + 后端地址白名单校验降低令牌外泄面）
- ✅ 已增强：生产 CSP 收紧（Vite 构建插件）、ChartBox 仅在宽度变化时重渲染、新增 apiBase 单测
- ✅ 已接入真实数据：预测/财务/趋势/对比/报告 5 个页面移除全部 Mock，改用真实后端接口（详见“Mock 数据接入”）
- ⏸ 维持现状：P2（首页聚合属后端范围）
- ✔ 正向项（无需改动）：S7、P3、Q7

改动文件（App 内）：`index.html`、`android/.../AndroidManifest.xml`、`android/.../res/xml/network_security_config.xml`、`src/utils/apiBase.ts`(新增)、`src/utils/apiBase.test.ts`(新增)、`src/pages/login/LoginPage.tsx`、`src/pages/profile/ProfilePage.tsx`、`src/pages/trends/TrendsPage.tsx`、`src/api/client.ts`、`src/api/client.test.ts`、`.gitattributes`(新增)、`.editorconfig`(新增)、`.github/workflows/build-android.yml`。

## 剩余与后续建议（受沙箱/后端限制，无法在 App 内独立完成）

- S1 残留：原生端改用安全存储（如 `@capacitor/preferences` + Keystore/Keychain）。该插件未在依赖中，本沙箱无法 `npm install`，且需把 zustand persist 改为异步存储并处理水合时序——属带依赖的改造，需在可联网/可构建环境进行。客户端能做的纵深防御（CSP、地址白名单）已落地，令牌有效期收紧属后端。
- ✅ 生产 CSP 收紧：已新增 Vite 构建期插件 `strictCspOnBuild`（`vite.config.ts`），生产产物的 `script-src` 收紧为 `'self'`，开发期 HMR 不受影响。
- P2：后端提供“首页聚合”接口，一次返回推荐 + 人工评估，减少首屏请求瀑布。
- 依赖卫生：本机 `npm audit --audit-level=high` 与 `npm ls` 复核，确认 `vite/typescript/eslint` 等高主版本为真实可信发布。

## Mock 数据接入（2026-06-15）

已移除 App 内全部 Mock/演示数据，改为真实后端接口（字段依据 `algorithm_service` 实际输出映射，新增 `src/utils/record.ts` 做安全取值）：

- 预测分析 `ForecastPage`：`runForecastAnalysis` → `forecast_records`(价格趋势)、`output_trend_records`(产量)、`benefit_summary`(均值/累计/推荐产量)。
- 财务分析 `MarginPage`：`runFinanceMarginAnalysis` → `summary`(总额/差异) + `compare_records`(人工/系统分产品明细)。
- 趋势洞察 `TrendsPage`：价格走势用 `fetchPrices`；收益趋势用 `runBacktestAnalysis` 的 `detail_records`；敏感性用 `runDecisionSensitivity`（依赖概览页已加载的推荐参数）。
- 决策对比 `ComparePage`：历史对比改用 `runBacktestAnalysis` 的 `detail_records`；今日对比沿用概览页推荐结果。
- 经营报告 `ReportPage`：`generateAdvisorReport` 生成真实报告，移除示例文本与“历史报告”假列表（后端暂无报告列表接口）。

> 数据为空时各页显示友好空状态（提示在 PC 端维护价格/销量/预测数据），不再回退假数据。需在本机连后端运行验证各页实际渲染。

## 复核方式

- 类型与引用完整性：`npm run typecheck`（本次改动后通过）。
- 测试：`npm test`（本机；本轮新增 `src/utils/apiBase.test.ts`，并随 Q2 精简了 `src/api/client.test.ts`）。
- 依赖漏洞：本机 `npm audit --audit-level=high`、`npm ls`。

> 注：本沙箱因 `node_modules` 为 Windows 原生二进制，无法运行 `vite build` / `vitest`；本轮以 `tsc --noEmit` 全量校验通过，运行期测试请在本机执行。
