# 🔧 CORS 跨域问题解决方案

## ⚠️ 问题描述

你遇到的CORS错误：
```
Access to fetch at 'https://pan.baidu.com/rest/2.0/xpan/nas...' 
from origin 'https://langya-ai.pages.dev' 
has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## 💡 原因

百度网盘API不允许浏览器直接跨域访问，这是浏览器的安全限制。

## ✅ 解决方案：Cloudflare Worker 代理

使用Cloudflare Worker作为中间代理，绕过CORS限制。

```
你的网页 → Worker代理 → 百度网盘API
         ↑ 添加CORS头 ↓
         ← 返回数据 ←
```

## 🚀 3步解决

### 第1步：创建 Worker（2分钟）

1. 访问 https://dash.cloudflare.com/
2. 点击 **Workers & Pages** → **Create** → **Create Worker**
3. 名称：`baidu-pan-proxy`
4. 点击 **Deploy**

### 第2步：复制代码（1分钟）

1. 点击 **Edit code**
2. 删除所有默认代码
3. 粘贴项目中的 `worker.js` 文件内容
4. 点击 **Save and Deploy**

### 第3步：配置地址（1分钟）

获得Worker URL后（例如：`https://baidu-pan-proxy.xxx.workers.dev`）

在你的页面中填入：
```
https://baidu-pan-proxy.xxx.workers.dev/?url=
```
**注意：末尾必须有 `?url=`**

## 📝 快速复制：Worker 代码

```javascript
export default {
  async fetch(request, env, ctx) {
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

    const target = new URL(targetUrl);
    if (!target.hostname.includes('baidu.com')) {
      return new Response('Invalid target domain', { status: 403 });
    }

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

## ✅ 验证配置

配置完成后，你的设置：

| 配置项 | 值 |
|--------|-----|
| **Pages URL** | `https://langya-ai.pages.dev` |
| **Worker URL** | `https://baidu-pan-proxy.xxx.workers.dev` |
| **代理地址**（填入页面） | `https://baidu-pan-proxy.xxx.workers.dev/?url=` |

## 🧪 测试

保存配置后：
1. 点击 "2. 获取用户信息"
2. 应该能看到你的账号信息
3. 点击 "3. 获取文件列表"
4. 应该能看到文件列表

## ❓ 常见问题

### Q1: Worker URL 在哪里找？

**A:** 部署Worker后，在Worker详情页面顶部会显示URL

### Q2: 还是有CORS错误？

**A:** 检查：
- [ ] Worker是否部署成功？
- [ ] 代理地址是否保存？
- [ ] 代理地址末尾有 `?url=` 吗？
- [ ] 刷新页面试试

### Q3: 免费吗？

**A:** 是的！Cloudflare Workers 免费套餐：
- 每天 100,000 次请求
- 完全够用

### Q4: Worker 代码在哪？

**A:** 项目根目录的 `worker.js` 文件

### Q5: 需要自定义域名吗？

**A:** 不需要，`.workers.dev` 域名就可以用

## 📚 详细文档

需要更多信息？查看：
- `WORKER-SETUP.md` - 详细的Worker部署指南
- `worker.js` - Worker源代码及注释

## 🎉 完成！

部署Worker后，CORS问题就解决了，可以正常使用所有功能！

---

**预计时间：** 5分钟  
**难度：** ⭐⭐☆☆☆（简单）

