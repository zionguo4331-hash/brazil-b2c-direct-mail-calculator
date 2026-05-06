# Share With Team

## 项目类型

纯 `HTML / JS` 静态页面，前端直接调用浏览器内的核心计算函数，不依赖 React、Next.js 或 Vite 运行时。零外部 npm 依赖，构建脚本仅使用 Node.js 标准库。

## 零、前置准备

```bash
# 安装 Node.js（macOS）
brew install node

# 验证
node --version   # 需要 v20+
npm --version
```

## 一、本地运行与测试

```bash
cd brazil-b2c-direct-mail-calculator
npm install
npm run test       # 运行 20 个单元测试
npm run dev        # 启动本地服务
```

浏览器打开：

```text
http://localhost:3000
```

## 二、本地构建

```bash
npm run build
```

构建完成后，静态发布目录为 `dist/`，包含：

```text
dist/
  .nojekyll               ← GitHub Pages 必需
  index.html              ← 页面入口
  app.js                  ← 浏览器端应用
  calculator-core.js      ← 核心计算函数
  defaults.js             ← 默认参数
  styles.css              ← 样式
  engines/
    DirectMailEngine.js
    LocalWarehouseEngine.js
    ChannelCostEngine.js
```

验证构建产物可直接在浏览器打开（双击 `dist/index.html` 即可计算）。

## 三、推送到 GitHub

```bash
git init
git add .
git commit -m "Brazil SKU profit calculator"
git branch -M main
git remote add origin https://github.com/zionguo4331-hash/brazil-b2c-direct-mail-calculator.git
git push -u origin main
```

如果是新仓库，先在 GitHub 网页创建空仓库 `brazil-b2c-direct-mail-calculator`（不要勾选 README），再执行上述命令。

## 四、启用 GitHub Pages

推送 main 分支后，GitHub Actions 会自动触发部署（见 `.github/workflows/deploy.yml`）。

首次需要手动开启 Pages：

1. 进入 GitHub 仓库 → `Settings` → `Pages`
2. `Source` 选择 `GitHub Actions`
3. 等待 Actions 中的 `Deploy GitHub Pages` 任务完成

## 五、查看发布链接

部署完成后：

1. `Settings → Pages` 页面会显示发布 URL
2. 或访问 `Actions` 标签查看最新 `pages-build-deployment` 的运行详情
3. 链接格式：`https://zionguo4331-hash.github.io/brazil-b2c-direct-mail-calculator/`

## 六、分享给同事

1. 复制 GitHub Pages 链接
2. 直接发给同事，浏览器打开即用
3. 同事项无需安装任何软件

## 七、常见问题

### 页面空白
- 原因：JS 文件加载失败
- 排查：F12 → Console 查看报错；确认 `dist/` 中所有文件完整

### 计算没反应
- 原因：calculator-core.js 或引擎文件加载失败
- 排查：F12 → Network 标签，确认无 404；确认 `dist/engines/` 目录完整

### 404
- 原因：GitHub Pages Source 未选 `GitHub Actions`
- 修复：`Settings → Pages → Source` 选 `GitHub Actions`

### 样式丢失
- 确认 `dist/styles.css` 存在
- 确认不是 `<base href="...">` 覆盖了相对路径

### 刷新后 404
- 当前项目是单页面，不是 SPA 多路由，正常不会出现此问题

### 本地 `npm run dev` 失败
- 确认 `npm install` 已执行
- 确认 Node.js 版本 >= 20

### 推送后 Actions 未触发
- 检查 `.github/workflows/deploy.yml` 中 `branches` 是否为 `main`
- 检查 GitHub 仓库 `Settings → Actions → General` 是否允许运行 Workflows

## 八、说明

- GitHub Pages 版本是纯前端本地计算，不依赖后端 API
- 不依赖 `localhost`、`127.0.0.1` 或 Codex 内置浏览器
- 所有计算在浏览器端完成，数据不离开用户浏览器
- 汇率数据从 `api.frankfurter.dev` 获取（外部公开 API）

## 九、Dify 后续接入

项目保留了后端 API 服务（`src/server.js`），如未来要接 Dify 工作流：

1. 将 API 服务部署到服务器：`npm start`（监听 3000 端口）
2. 在 Dify HTTP Request 节点中配置：
   - URL: `http://<你的服务器>:3000/api/brazil-cost-calculator/b2c-direct-mail`
   - Method: `POST`
   - 详情参考 `docs/dify-http-request-setup.md`
3. 注意：API 服务需要能接收来自 Dify 的网络请求（不要只绑 `0.0.0.0` 就行）
