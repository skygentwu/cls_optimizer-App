# cls_optimizer-App 同步规则

## 项目关系

本项目 (`cls_optimizer-App`) 是 `cls_optimizer` (D:/python/cls_optimizer) 的移动端 H5 App 前端。

- **源项目** (Source): `D:/python/cls_optimizer`
  - 后端: FastAPI (`backend/app/`)
  - 前端 (React): `frontend/src/`
  - 前端 (Streamlit): `app.py`, `tabs/`
- **目标项目** (Target): `D:/python/cls_optimizer-App`
  - 移动端 H5 App: `src/`

## 同步原则

1. **API 层优先复用**: 尽量复用源项目的 API 接口定义和类型
2. **类型自动同步**: `types.ts` 和 `products.ts` 可直接复制复用
3. **React 逻辑参考**: 参考源项目 React 前端的 hooks、状态管理、页面逻辑
4. **Streamlit 不参考**: 忽略 Streamlit 版本 (`app.py`, `tabs/`)
5. **人工审核**: API client 和页面组件的变更需人工审核后同步

## 文件映射

| 源文件 | 目标文件 | 同步方式 | 说明 |
|--------|---------|---------|------|
| `frontend/src/types.ts` | `src/types/original.ts` | 自动复制 | 类型定义直接复用 |
| `frontend/src/domain/products.ts` | `src/constants/products.ts` | 自动复制 | 产品常量直接复用 |
| `frontend/src/api/client.ts` | `src/api/client.ts` | 人工参考 | 参考函数签名，适配移动端 |
| `backend/app/schemas.py` | `src/types/index.ts` | 人工参考 | Pydantic 模型变更时同步 |
| `backend/app/routers/*.py` | `src/api/client.ts` | 人工参考 | 路由变更时同步 API |
| `doc/API接口合同.md` | `src/api/client.ts` | 人工参考 | 接口合同变更时同步 |

## 同步工具

### 1. 检查变更

```bash
cd D:/python/cls_optimizer-App
python scripts/sync_from_source.py --check-only
```

### 2. 执行同步

```bash
cd D:/python/cls_optimizer-App
python scripts/sync_from_source.py
```

### 3. 持续监控

```bash
cd D:/python/cls_optimizer-App
python scripts/watch_source.py --interval 60
```

## 开发流程

1. 修改 `cls_optimizer` 后端的 API 或类型
2. 运行同步检查: `python scripts/sync_from_source.py --check-only`
3. 根据提示同步变更到移动端
4. 运行 `npm run typecheck` 确保类型一致
5. 运行 `npm run build` 确保构建成功

## 注意事项

- `src/types/index.ts` 是移动端定制版本，比 `original.ts` 更精简
- API client 移除了 `token` 参数，改为从 `localStorage` 自动读取
- 移动端页面使用 `antd-mobile` 替代 `antd`
- 新增 API 端点时，需在 `src/api/client.ts` 和 `src/types/index.ts` 同步添加
