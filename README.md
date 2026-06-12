# Ancient Page Converter

古籍页面转换工具，基于 Vue 3 + TypeScript + Vite 构建。

## 环境要求

- **Node.js**: >= 20.0.0 (推荐使用 LTS 版本)
- **npm**: >= 10.0.0
- **Git**: 最新版本

## 常用命令

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 类型检查

```bash
npm run type-check
```

### 代码风格检查（不自动修复）

```bash
npm run lint:check
```

### 代码风格检查并自动修复

```bash
npm run lint
```

### 代码格式化

```bash
npm run format
```

### 格式化检查（不自动修复）

```bash
npm run format:check
```

### 生产构建

```bash
npm run build
```

### 预览生产构建结果

```bash
npm run preview
```

## 代码规范

本项目使用以下工具进行代码质量控制：

- **ESLint**: 代码风格和语法检查
- **Prettier**: 代码格式化
- **TypeScript**: 类型安全

提交代码前，请确保已通过以下检查：

```bash
npm run type-check
npm run lint:check
npm run build
```

## 持续集成（CI）

项目配置了 GitHub Actions 工作流，在代码推送（push）或创建合并请求（pull request）时会自动执行以下检查：

1. 类型检查 (`npm run type-check`)
2. 代码风格检查 (`npm run lint:check`)
3. 生产构建 (`npm run build`)

任一环节失败都会阻断合并，确保主干代码的质量。
