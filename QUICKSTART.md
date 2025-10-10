# ⚡ 快速开始

一个5分钟的快速部署指南，让你的百度网盘授权页面快速上线。

## 🎯 目标

将页面部署到 Cloudflare Pages，并完成百度网盘授权配置。

## 📝 只需3步

### 第1步：部署到 Cloudflare Pages（2分钟）

**选项A - 直接上传（最简单）：**

1. 访问 https://dash.cloudflare.com/
2. 登录账号（没有账号就注册一个）
3. 点击 **Workers & Pages** → **Create** → **Pages** → **Upload assets**
4. 上传这两个文件：
   - `index.html`
   - `baidu-pan-auth.html`
5. 点击 **Deploy**
6. ✅ 完成！记下你的URL，例如：`https://langya-ai-xxx.pages.dev`

**选项B - Git部署：**

```bash
# 推送到GitHub
git init
git add .
git commit -m "百度网盘授权页面"
git remote add origin https://github.com/你的用户名/仓库名.git
git push -u origin main

# 然后在Cloudflare Pages连接GitHub仓库
```

### 第2步：配置百度回调地址（2分钟）

1. 访问 https://pan.baidu.com/union/console/applist
2. 找到应用 **"百度网盘api测试"**
3. 进入 **授权设置**
4. 添加回调地址：
   ```
   https://你的域名.pages.dev/baidu-pan-auth.html
   ```
   例如：`https://langya-ai-xxx.pages.dev/baidu-pan-auth.html`
5. 保存

### 第3步：测试（1分钟）

1. 打开：`https://你的域名.pages.dev`
2. 点击 **"自动检测并保存"**
3. 点击 **"1. 点击授权"**
4. 登录百度账号并授权
5. ✅ 成功！现在可以获取文件列表了

## 🎊 完成！

现在你可以：
- 📱 获取用户信息
- 📁 查看文件列表
- 🔗 分享链接给其他人使用

## ❓ 遇到问题？

### 问题1：`redirect_uri_mismatch` 错误

**原因：** 回调地址不匹配

**解决：**
- 确保百度开放平台配置的地址与页面完全一致
- 包括 `https://` 和文件名 `/baidu-pan-auth.html`

### 问题2：无法获取文件列表

**检查：**
- 是否成功授权？
- Access Token是否显示？
- 网络是否正常？

### 问题3：页面打不开

**等待：**
- Cloudflare部署需要1-3分钟
- 刷新页面试试

## 📚 更多信息

- 详细部署指南：查看 `DEPLOY.md`
- 完整使用说明：查看 `README.md`
- 百度API文档：https://pan.baidu.com/union/doc/

---

**预配置信息：**
- AppID: 120275887
- AppKey: AQoN4IEJyNj71Sp51rl3378udvSuknBu
- 应用名称: 百度网盘api测试

所有配置已经内置在代码中，你只需要配置回调地址即可！🚀

