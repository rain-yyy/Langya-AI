# Cloudflare Pages 部署指南

本文档详细说明如何将百度网盘授权页面部署到Cloudflare Pages。

## 📋 前提条件

- ✅ 已有Cloudflare账号（如果没有，请访问 https://dash.cloudflare.com/sign-up 注册）
- ✅ 已创建百度网盘开放平台应用（AppKey: AQoN4IEJyNj71Sp51rl3378udvSuknBu）
- ✅ 代码已准备好部署

## 🚀 部署步骤

### 方法一：通过 Git 部署（推荐）

#### 1. 推送代码到 GitHub

```bash
# 初始化 Git 仓库（如果还没有）
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: 百度网盘授权页面"

# 添加远程仓库（替换为你的GitHub仓库地址）
git remote add origin https://github.com/你的用户名/Langya-AI.git

# 推送到GitHub
git push -u origin main
```

#### 2. 连接到 Cloudflare Pages

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 在左侧菜单选择 **"Workers & Pages"**
3. 点击 **"Create application"**
4. 选择 **"Pages"** 标签页
5. 点击 **"Connect to Git"**

#### 3. 选择仓库

1. 首次使用需要连接GitHub账号，点击 **"Connect GitHub"**
2. 授权Cloudflare访问你的GitHub
3. 选择你的仓库（Langya-AI）
4. 点击 **"Begin setup"**

#### 4. 配置构建设置

```
Project name: langya-ai（或自定义名称）
Production branch: main
Build settings:
  - Framework preset: None
  - Build command: (留空)
  - Build output directory: /
```

5. 点击 **"Save and Deploy"**

#### 5. 等待部署完成

- 部署通常需要1-3分钟
- 完成后会显示你的项目URL，例如：`https://langya-ai.pages.dev`

### 方法二：直接上传文件

如果不想使用Git，可以直接上传文件：

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 选择 **"Workers & Pages"** > **"Create application"**
3. 选择 **"Pages"** > **"Upload assets"**
4. 拖拽以下文件到上传区域：
   - `index.html`
   - `baidu-pan-auth.html`
5. 点击 **"Deploy site"**

## 🔧 配置百度网盘回调地址

**这一步非常关键！必须完成才能正常授权。**

### 1. 获取你的Cloudflare Pages URL

部署完成后，你会得到类似这样的URL：
```
https://langya-ai.pages.dev
```

完整的回调地址是：
```
https://langya-ai.pages.dev/baidu-pan-auth.html
```

### 2. 在百度开放平台配置回调地址

1. 访问 [百度网盘开放平台 - 控制台](https://pan.baidu.com/union/console/applist)

2. 登录百度账号

3. 找到应用 **"百度网盘api测试"**（AppID: 120275887）

4. 点击进入应用详情

5. 找到 **"安全设置"** 或 **"授权设置"** 选项卡

6. 在 **"授权回调地址"** 中添加：
   ```
   https://langya-ai.pages.dev/baidu-pan-auth.html
   ```
   
   **注意：**
   - URL必须完全匹配，包括协议（https://）
   - 不要有多余的空格或斜杠
   - 可以添加多个回调地址（如本地测试地址）

7. 点击 **"保存"** 或 **"确定"**

### 3. 验证回调地址配置

配置完成后，应该能看到：
```
授权回调地址：
  https://langya-ai.pages.dev/baidu-pan-auth.html  ✓ 已保存
```

## ✅ 测试部署

### 1. 访问你的页面

在浏览器中打开：
```
https://langya-ai.pages.dev
```

或直接访问：
```
https://langya-ai.pages.dev/baidu-pan-auth.html
```

### 2. 配置回调地址

1. 页面会自动检测当前URL
2. 点击 **"自动检测并保存"** 按钮
3. 确认显示的URL与你在百度开放平台配置的一致

### 3. 测试授权流程

1. 点击 **"1. 点击授权"** 按钮
2. 应该会跳转到百度登录页面
3. 登录并同意授权
4. 自动跳转回你的页面
5. 页面应该显示 "授权成功！Access Token 已获取"

### 4. 测试API调用

授权成功后：
1. 点击 **"2. 获取用户信息"** - 应该显示你的百度网盘账号信息
2. 点击 **"3. 获取文件列表"** - 应该显示你的网盘根目录文件

## 🔄 更新部署

### Git 部署的更新方式

```bash
# 修改代码后
git add .
git commit -m "更新说明"
git push

# Cloudflare Pages 会自动检测并重新部署
```

### 直接上传的更新方式

1. 访问 Cloudflare Dashboard
2. 进入你的 Pages 项目
3. 点击 **"Create new deployment"**
4. 上传新的文件

## 🌐 自定义域名（可选）

如果你有自己的域名，可以配置自定义域名：

1. 在 Cloudflare Pages 项目页面
2. 点击 **"Custom domains"**
3. 点击 **"Set up a custom domain"**
4. 输入你的域名（如：`pan.yourdomain.com`）
5. 按照提示配置DNS记录
6. 配置完成后，**记得更新百度开放平台的回调地址**：
   ```
   https://pan.yourdomain.com/baidu-pan-auth.html
   ```

## 📊 监控和日志

### 查看部署状态

1. 访问 Cloudflare Dashboard
2. 进入你的 Pages 项目
3. 可以看到：
   - 部署历史
   - 访问统计
   - 构建日志

### 查看访问日志

在 **"Analytics"** 标签页可以看到：
- 访问量统计
- 流量分析
- 性能数据

## ⚠️ 常见问题

### 1. 回调地址不匹配错误

**错误信息：** `redirect_uri_mismatch`

**解决方法：**
- 检查Cloudflare Pages的URL是否正确
- 确认百度开放平台配置的回调地址完全一致
- 注意协议（http vs https）
- 检查是否有多余的斜杠或空格

### 2. 页面无法访问

**可能原因：**
- 部署尚未完成（等待1-3分钟）
- DNS尚未生效（等待5-10分钟）
- Cloudflare服务问题（查看状态页面）

### 3. 授权后无法返回页面

**检查：**
- 回调地址配置是否正确
- 浏览器是否阻止了重定向
- 检查浏览器控制台的错误信息

### 4. 无法获取文件列表

**检查：**
- Access Token是否有效
- 网络连接是否正常
- 百度网盘API是否正常（查看官方状态）
- 浏览器控制台是否有CORS错误

## 📞 获取帮助

如果遇到问题：

1. **百度网盘开放平台：**
   - 文档：https://pan.baidu.com/union/doc/
   - 工单支持：https://pan.baidu.com/union/feedback

2. **Cloudflare Pages：**
   - 文档：https://developers.cloudflare.com/pages/
   - 社区：https://community.cloudflare.com/

3. **项目问题：**
   - 查看 README.md
   - 检查浏览器控制台错误
   - 查看网络请求详情

## 🎉 部署完成

恭喜！你已成功将百度网盘授权页面部署到 Cloudflare Pages。

现在你可以：
- ✅ 通过网页授权访问百度网盘
- ✅ 获取用户信息和文件列表
- ✅ 分享给其他用户使用
- ✅ 基于此开发更多功能

祝使用愉快！🎊

