# 🔧 Cloudflare Worker CORS 代理部署指南

由于百度网盘API不支持跨域访问，需要部署一个Cloudflare Worker作为CORS代理。

## 📋 什么是CORS代理？

CORS（跨域资源共享）代理是一个中间服务器，它：
1. 接收来自你网页的请求
2. 转发请求到百度网盘API
3. 将响应返回给你的网页，并添加CORS头

这样就绕过了浏览器的跨域限制。

## 🚀 快速部署（5分钟）

### 方法1：通过 Cloudflare Dashboard（最简单）

#### 步骤1：登录 Cloudflare

1. 访问 https://dash.cloudflare.com/
2. 登录你的Cloudflare账号（和Pages用的同一个账号）

#### 步骤2：创建 Worker

1. 在左侧菜单选择 **"Workers & Pages"**
2. 点击 **"Create application"** 按钮
3. 选择 **"Create Worker"** 标签页
4. 给Worker起个名字，例如：`baidu-pan-proxy`
5. 点击 **"Deploy"** 按钮

#### 步骤3：编辑 Worker 代码

1. 部署完成后，点击 **"Edit code"** 按钮
2. 删除默认的代码
3. 复制以下代码并粘贴到编辑器中：

```javascript
/**
 * Cloudflare Worker - 百度网盘 API CORS 代理
 * 用于解决浏览器跨域访问百度网盘API的问题
 */

export default {
  async fetch(request, env, ctx) {
    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }

    const url = new URL(request.url);
    
    // 从查询参数中获取目标URL
    const targetUrl = url.searchParams.get('url');
    
    if (!targetUrl) {
      return new Response('Missing url parameter', { 
        status: 400,
        headers: corsHeaders()
      });
    }

    try {
      // 验证目标URL是百度网盘域名
      const target = new URL(targetUrl);
      if (!target.hostname.includes('baidu.com')) {
        return new Response('Invalid target domain', { 
          status: 403,
          headers: corsHeaders()
        });
      }

      // 转发请求到百度网盘API
      const response = await fetch(targetUrl, {
        method: request.method,
        headers: {
          'User-Agent': request.headers.get('User-Agent') || 'Mozilla/5.0'
        }
      });

      // 获取响应内容
      const responseBody = await response.text();
      
      // 返回响应并添加CORS头
      return new Response(responseBody, {
        status: response.status,
        headers: {
          ...corsHeaders(),
          'Content-Type': response.headers.get('Content-Type') || 'application/json'
        }
      });

    } catch (error) {
      return new Response(JSON.stringify({ 
        error: error.message 
      }), {
        status: 500,
        headers: {
          ...corsHeaders(),
          'Content-Type': 'application/json'
        }
      });
    }
  }
};

// CORS 头设置（最宽松配置）
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Max-Age': '86400',
  };
}

// 处理 OPTIONS 预检请求
function handleOptions(request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders()
  });
}
```

4. 点击右上角的 **"Save and Deploy"** 按钮

#### 步骤4：获取 Worker URL

部署成功后，你会看到Worker的URL，格式如：
```
https://baidu-pan-proxy.你的用户名.workers.dev
```

**完整的代理地址**（注意末尾要加 `?url=`）：
```
https://baidu-pan-proxy.你的用户名.workers.dev/?url=
```

#### 步骤5：在页面中配置代理地址

1. 访问你的页面：`https://langya-ai.pages.dev/baidu-pan-auth.html`
2. 在 **"CORS代理地址"** 输入框中填入：
   ```
   https://baidu-pan-proxy.你的用户名.workers.dev/?url=
   ```
3. 点击 **"自动检测并保存"** 或 **"手动保存配置"**

### 方法2：通过 Wrangler CLI（高级）

如果你熟悉命令行，可以使用Wrangler CLI：

```bash
# 安装 Wrangler
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 创建新项目
wrangler init baidu-pan-proxy

# 将 worker.js 的内容复制到 src/index.js

# 部署
wrangler deploy
```

## ✅ 测试代理

部署完成后，可以在浏览器中测试：

### 测试URL：
```
https://你的worker.workers.dev/?url=https://pan.baidu.com/rest/2.0/xpan/nas?method=uinfo&access_token=YOUR_TOKEN
```

**预期结果：**
- 如果配置正确，应该返回JSON数据
- 浏览器控制台不应该有CORS错误

## 🔍 故障排查

### 问题1：Worker URL找不到

**检查：**
- Worker是否部署成功？
- URL是否正确？应该是 `.workers.dev` 结尾

### 问题2：还是有CORS错误

**检查：**
- 代理地址是否正确？末尾要有 `?url=`
- 页面中是否保存了配置？
- 浏览器控制台查看实际请求的URL

### 问题3：403 Invalid target domain

**原因：** Worker拒绝了非百度域名的请求（安全保护）

**解决：** 确保请求的是 `baidu.com` 域名

### 问题4：Missing url parameter

**原因：** 没有传递 `url` 参数

**检查：** 
- 代理地址格式是否正确
- 应该是：`https://xxx.workers.dev/?url=` （注意末尾的 `?url=`）

## 📊 Worker 限制

Cloudflare Workers 免费套餐限制：
- ✅ 每天 100,000 次请求
- ✅ 每次请求最多 10ms CPU 时间
- ✅ 完全够用于测试和个人使用

如果需要更多请求：
- Workers Paid 计划：$5/月，1000万次请求

## 🔒 安全说明

当前Worker配置为：
- ✅ 只允许访问 `baidu.com` 域名（防止滥用）
- ✅ 允许所有来源的跨域请求（`Access-Control-Allow-Origin: *`）
- ⚠️ 这是测试配置，生产环境建议限制来源域名

### 生产环境增强安全性

如果要限制只允许你的域名访问，修改 `corsHeaders()` 函数：

```javascript
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': 'https://langya-ai.pages.dev',  // 只允许你的域名
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Max-Age': '86400',
  };
}
```

## 🎯 完整配置总结

配置完成后，你的设置应该是：

| 项目 | 值 |
|------|-----|
| **Cloudflare Pages** | `https://langya-ai.pages.dev` |
| **回调地址** | `https://langya-ai.pages.dev/baidu-pan-auth.html` |
| **Worker URL** | `https://baidu-pan-proxy.xxx.workers.dev` |
| **代理地址** | `https://baidu-pan-proxy.xxx.workers.dev/?url=` |
| **百度平台回调** | `https://langya-ai.pages.dev/baidu-pan-auth.html` |

## 📚 相关文档

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
- [CORS 详解](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CORS)

## 💡 提示

- Worker部署通常在1-2分钟内生效
- 如果修改了Worker代码，点击 "Save and Deploy" 后立即生效
- Worker URL可以使用自定义域名（需要配置DNS）
- 免费套餐完全够用，无需付费

---

**恭喜！** 完成Worker部署后，你的百度网盘授权页面就可以正常使用了！🎉

