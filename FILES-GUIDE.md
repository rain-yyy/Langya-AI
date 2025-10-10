# 📁 项目文件说明

本文档说明项目中每个文件的作用，帮助你快速了解项目结构。

## 🌐 网页文件

### `index.html`
**作用：** 首页/欢迎页面
- 自动重定向到 `baidu-pan-auth.html`
- 如果用户直接访问域名根目录，会自动跳转到授权页面
- 有一个简单的欢迎界面

### `baidu-pan-auth.html`
**作用：** 主功能页面 ⭐️ **核心文件**
- 百度网盘OAuth授权
- 用户信息获取
- 文件列表展示
- 配置管理（AppKey、回调地址、CORS代理）
- 所有业务逻辑都在这个文件中

## 🔧 后端/代理文件

### `worker.js`
**作用：** Cloudflare Worker CORS代理 ⭐️ **解决跨域问题的关键**
- 接收网页的请求
- 转发请求到百度网盘API
- 添加CORS头，解决跨域问题
- 需要部署到Cloudflare Workers

**使用方法：**
1. 在Cloudflare Dashboard创建Worker
2. 将此文件内容粘贴到Worker编辑器
3. 部署

## 📖 文档文件

### `README.md`
**作用：** 项目主文档
- 项目介绍
- 功能特点
- 完整使用流程
- 部署步骤（Cloudflare Pages）
- 技术说明
- 常见问题

**适合：** 想全面了解项目的用户

---

### `QUICKSTART.md`
**作用：** 5分钟快速开始指南
- 最简化的部署流程
- 3步完成部署
- 快速故障排查

**适合：** 想快速上手的用户

---

### `DEPLOY.md`
**作用：** 详细部署指南
- Cloudflare Pages详细部署步骤
- 百度开放平台配置说明
- 测试验证流程
- 自定义域名配置
- 完整的故障排查

**适合：** 第一次部署，需要详细指导的用户

---

### `CORS-SOLUTION.md`
**作用：** CORS跨域问题解决方案 ⭐️ **遇到跨域错误必看**
- 解释CORS错误原因
- 3步快速解决方案
- Worker代码快速复制
- 验证配置
- 常见问题FAQ

**适合：** 遇到CORS错误的用户

---

### `WORKER-SETUP.md`
**作用：** Cloudflare Worker详细部署指南
- Worker是什么
- 两种部署方法（Dashboard / CLI）
- 详细的步骤说明
- 测试Worker
- 故障排查
- 安全配置说明

**适合：** 需要详细了解Worker配置的用户

---

### `FILES-GUIDE.md`（本文件）
**作用：** 项目文件说明
- 列出所有文件及其作用
- 帮助用户快速定位需要的信息

## 📊 文件依赖关系

```
部署流程：
1. index.html + baidu-pan-auth.html → 部署到 Cloudflare Pages
2. worker.js → 部署到 Cloudflare Workers
3. 在页面中配置Worker URL

运行时：
用户访问 → index.html → baidu-pan-auth.html
                              ↓
                        发起API请求
                              ↓
                        通过Worker代理
                              ↓
                        访问百度网盘API
```

## 🎯 快速导航

### 我想...

#### ...快速开始部署
👉 查看 [`QUICKSTART.md`](./QUICKSTART.md)

#### ...详细了解部署步骤
👉 查看 [`DEPLOY.md`](./DEPLOY.md)

#### ...解决CORS错误
👉 查看 [`CORS-SOLUTION.md`](./CORS-SOLUTION.md)

#### ...配置Worker
👉 查看 [`WORKER-SETUP.md`](./WORKER-SETUP.md)

#### ...全面了解项目
👉 查看 [`README.md`](./README.md)

#### ...修改功能/看代码
👉 查看 `baidu-pan-auth.html` 和 `worker.js`

## 📝 配置文件

项目中没有独立的配置文件，所有配置都在：
- **AppKey** - 硬编码在 `baidu-pan-auth.html` 中
- **回调地址** - 页面自动检测或用户输入
- **Worker URL** - 用户输入并保存在 localStorage

## 🔐 敏感信息

项目中包含的敏感信息：
- ✅ **AppKey** - `AQoN4IEJyNj71Sp51rl3378udvSuknBu` (已公开，测试用)
- ✅ **SecretKey** - 未在代码中使用（简化模式不需要）
- ⚠️ **Access Token** - 用户授权后保存在浏览器 localStorage

**注意：** 不要将 Access Token 分享给他人！

## 🗂️ 文件大小

| 文件 | 大小 | 类型 |
|------|------|------|
| `index.html` | ~2KB | 网页 |
| `baidu-pan-auth.html` | ~15KB | 网页 |
| `worker.js` | ~2KB | JavaScript |
| `README.md` | ~8KB | 文档 |
| `QUICKSTART.md` | ~3KB | 文档 |
| `DEPLOY.md` | ~12KB | 文档 |
| `CORS-SOLUTION.md` | ~4KB | 文档 |
| `WORKER-SETUP.md` | ~10KB | 文档 |

**总计：** ~56KB

## 🚀 部署需要哪些文件？

### Cloudflare Pages（必需）
- ✅ `index.html`
- ✅ `baidu-pan-auth.html`

### Cloudflare Worker（必需）
- ✅ `worker.js` 的内容

### 文档（可选，但建议上传到GitHub）
- ✅ 所有 `.md` 文件

## 📦 最小部署

如果只想快速测试，最少需要：
1. `baidu-pan-auth.html` - 上传到Cloudflare Pages
2. `worker.js` - 部署到Cloudflare Workers
3. 配置Worker URL

## 🎓 学习路径

**新手推荐学习顺序：**
1. 📖 先看 `README.md` - 了解项目概况
2. 🚀 跟着 `QUICKSTART.md` - 快速部署
3. ⚠️ 遇到CORS错误看 `CORS-SOLUTION.md` - 解决跨域
4. 🔧 需要详细配置看 `WORKER-SETUP.md` - Worker详解
5. 📚 想深入了解看 `DEPLOY.md` - 完整指南

## 💡 提示

- 所有文档都是中文的，方便阅读
- 所有文档都有目录和跳转链接
- 遇到问题先查看对应的文档
- 文档中有很多实用的命令和代码，可以直接复制使用

---

**最后更新：** 2025-10-10  
**项目名称：** Langya-AI - 百度网盘授权示例  
**作者：** 你的名字

