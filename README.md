# 百度网盘授权示例

一个简单的前端应用，演示如何使用 OAuth 2.0 授权访问百度网盘 API，获取用户信息和文件列表。

**✨ 特点：** 纯前端 + Cloudflare Worker，无需后端服务器，5分钟部署上线。

## 🎯 功能

- ✅ OAuth 2.0 简化模式授权
- ✅ 获取用户网盘信息
- ✅ 查看文件列表
- ✅ 自动检测配置
- ✅ CORS跨域解决方案

## 🚀 快速开始

想要3分钟快速部署？查看 → [**QUICKSTART.md**](./QUICKSTART.md)

## 📋 详细部署指南

### 前提条件

- Cloudflare 账号（[注册地址](https://dash.cloudflare.com/sign-up)）
- 百度网盘账号

### 步骤1：部署Worker代理（5分钟）

**为什么需要Worker？**  
百度网盘API不支持浏览器跨域访问，需要Worker作为代理。

#### 1.1 创建Worker

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 点击 **Workers & Pages** → **Create** → **Create Worker**
3. 名称：`baidu-pan-proxy`（或任意名称）
4. 点击 **Deploy**

#### 1.2 配置Worker代码

1. 点击 **Edit code**
2. 删除默认代码，复制粘贴 `worker.js` 的内容：

```javascript
export default {
  async fetch(request, env, ctx) {
    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Max-Age': '86400',
        }
      });
    }

    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');
    
    if (!targetUrl) {
      return new Response('Missing url parameter', { status: 400 });
    }

    // 只允许访问百度域名
    const target = new URL(targetUrl);
    if (!target.hostname.includes('baidu.com')) {
      return new Response('Invalid target domain', { status: 403 });
    }

    // 转发请求
    const response = await fetch(targetUrl);
    const responseBody = await response.text();
    
    return new Response(responseBody, {
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Content-Type': 'application/json'
      }
    });
  }
};
```

3. 点击 **Save and Deploy**
4. 记下Worker URL，格式：`https://baidu-pan-proxy.xxx.workers.dev`

### 步骤2：部署页面到Cloudflare Pages（3分钟）

#### 方法A：通过GitHub（推荐）

```bash
# 1. 推送到GitHub
git init
git add .
git commit -m "百度网盘授权页面"
git remote add origin https://github.com/你的用户名/仓库名.git
git push -u origin main

# 2. 在Cloudflare Pages连接GitHub仓库
# 3. 构建设置选择 "None"，直接部署
```

#### 方法B：直接上传

1. 访问 [Cloudflare Pages](https://dash.cloudflare.com/)
2. **Workers & Pages** → **Create** → **Pages** → **Upload assets**
3. 上传 `index.html` 和 `baidu-pan-auth.html`
4. 点击 **Deploy**

### 步骤3：配置百度开放平台（2分钟）

⚠️ **这一步必须完成，否则授权会失败！**

1. 访问 [百度网盘开放平台](https://pan.baidu.com/union/console/applist)
2. 找到应用"百度网盘api测试"（AppID: 120275887）
3. 进入应用设置 → 授权设置
4. 添加回调地址：
   ```
   https://你的项目名.pages.dev/baidu-pan-auth.html
   ```
   例如：`https://langya-ai.pages.dev/baidu-pan-auth.html`
5. 保存

### 步骤4：配置页面（1分钟）

1. 访问你的页面：`https://你的项目名.pages.dev/baidu-pan-auth.html`
2. 在"CORS代理地址"输入框填入：
   ```
   https://baidu-pan-proxy.xxx.workers.dev/?url=
   ```
   **注意：** 末尾必须有 `?url=`
3. 点击 **"自动检测并保存"**

### 步骤5：开始使用 ✅

1. 点击 **"1. 点击授权"**
2. 登录百度账号并授权
3. 点击 **"2. 获取用户信息"** 查看账号信息
4. 点击 **"3. 获取文件列表"** 查看网盘文件

## 🔧 应用信息

本项目已预配置应用：

```
AppID:   120275887
AppKey:  AQoN4IEJyNj71Sp51rl3378udvSuknBu
应用名称: 百度网盘api测试
授权模式: OAuth 2.0 简化模式
```

## 📁 项目结构

```
.
├── index.html              # 首页（自动跳转）
├── baidu-pan-auth.html     # 主功能页面
├── worker.js               # Cloudflare Worker代理
├── README.md               # 本文档
└── QUICKSTART.md           # 快速开始指南
```

## 🐛 常见问题

### 1. 授权时提示 `redirect_uri_mismatch`

**原因：** 回调地址不匹配

**解决：**
- 确保百度开放平台配置的回调地址与页面URL完全一致
- 包括 `https://` 协议和文件名 `/baidu-pan-auth.html`
- 不要有多余的空格或斜杠

### 2. CORS跨域错误

**原因：** Worker未配置或配置错误

**解决：**
- 确认Worker已部署成功
- 检查代理地址末尾是否有 `?url=`
- 在浏览器访问Worker URL，应该返回 "Missing url parameter"
- 清除浏览器缓存并刷新

### 3. 无法获取文件列表

**检查：**
- 授权是否成功？页面应显示 "授权成功"
- Access Token是否有效？（有效期30天）
- Worker代理是否正常工作？
- 浏览器控制台是否有错误信息？

### 4. Worker 503 错误

**原因：** Worker正在部署中

**解决：** 等待1-2分钟后再试

## 💡 技术说明

### 授权流程

```
用户点击授权
    ↓
跳转到百度登录页
    ↓
用户登录并同意授权
    ↓
跳转回页面（携带Access Token）
    ↓
Token保存在localStorage
    ↓
通过Worker代理访问API
```

### 授权模式

使用 **OAuth 2.0 简化模式（Implicit Grant）**：
- ✅ 适合纯前端应用
- ✅ 无需后端服务器
- ✅ Access Token有效期30天
- ⚠️ Token过期后需重新授权（不支持刷新）

### API端点

- **授权接口：** `http://openapi.baidu.com/oauth/2.0/authorize`
- **用户信息：** `https://pan.baidu.com/rest/2.0/xpan/nas?method=uinfo`
- **文件列表：** `https://pan.baidu.com/rest/2.0/xpan/file?method=list`

### Worker限制

Cloudflare Workers 免费套餐：
- 每天 100,000 次请求
- 每次请求最多 10ms CPU时间
- 完全够用于个人使用

## 🔒 安全说明

- Access Token 只存储在浏览器 localStorage
- Worker 不记录任何用户数据
- Worker 只转发到 `baidu.com` 域名（防止滥用）
- 所有通信使用 HTTPS 加密

**注意：** 不要将 Access Token 分享给他人！

## 📚 扩展功能

基于此项目，你可以实现更多功能：

- 📤 上传文件到网盘
- 📥 下载网盘文件  
- 🗂️ 创建/删除文件夹
- 🔍 搜索文件
- 🔗 生成分享链接
- 📝 文件重命名/移动

### 参考文档

- [百度网盘开放平台文档](https://pan.baidu.com/union/doc/)
- [OAuth 2.0 简化模式](https://pan.baidu.com/union/doc/nksg0saze)
- [文件上传API](https://pan.baidu.com/union/doc/nksg0sbak)
- [文件管理API](https://pan.baidu.com/union/doc/6ksg0s9i4)

## 📞 获取帮助

遇到问题？

1. 查看 [QUICKSTART.md](./QUICKSTART.md) 快速故障排查
2. 检查浏览器控制台错误信息
3. 查看 [百度网盘开放平台文档](https://pan.baidu.com/union/doc/)
4. 提交 Issue 到项目仓库

## ⚖️ 注意事项

- 这是演示项目，生产环境建议使用授权码模式（需要后端）
- Token保存在localStorage，清除浏览器缓存会丢失
- 简化模式的Token过期后不能刷新，需重新授权
- 请遵守百度网盘开放平台的使用规范

## 📝 更新日志

- **2025-10-10：** 初始版本，支持OAuth授权和文件列表获取

---

**License:** MIT  
**Author:** Langya-AI  
**Version:** 1.0.0
