# 百度网盘授权示例

这是一个简单的前端页面，用于演示如何接入百度网盘开放平台的OAuth授权，并获取用户的文件信息。

本项目已配置应用信息，可直接部署到 **Cloudflare Pages** 使用。

## 功能特点

- ✅ 使用OAuth 2.0简化模式进行授权
- ✅ 获取用户网盘信息
- ✅ 获取用户文件列表
- ✅ 展示文件/文件夹基本信息
- ✅ 本地保存配置和Token
- ✅ 自动检测回调URL
- ✅ 无需后端服务器

## 应用信息

```
AppID: 120275887
AppKey: AQoN4IEJyNj71Sp51rl3378udvSuknBu
应用名称: 百度网盘api测试
应用类型: 软件应用
```

## 快速部署到 Cloudflare Pages

### 方法1: 通过GitHub部署（推荐）

1. **将代码推送到GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/你的用户名/你的仓库名.git
   git push -u origin main
   ```

2. **在Cloudflare Pages创建项目**
   - 访问 [Cloudflare Pages](https://pages.cloudflare.com/)
   - 登录Cloudflare账号
   - 点击"Create a project"
   - 选择"Connect to Git"
   - 连接你的GitHub仓库
   - 选择刚才创建的仓库

3. **配置构建设置**
   - Framework preset: 选择 **None**
   - Build command: 留空（不需要构建）
   - Build output directory: `/`
   - 点击"Save and Deploy"

4. **获取部署URL**
   - 部署完成后，你会得到一个URL，格式如：`https://your-project.pages.dev`
   - 完整的回调地址是：`https://your-project.pages.dev/baidu-pan-auth.html`

5. **配置百度网盘回调地址**
   - 访问 [百度网盘开放平台](https://pan.baidu.com/union/console/applist)
   - 进入你的应用设置
   - 在"授权回调地址"中添加：`https://your-project.pages.dev/baidu-pan-auth.html`
   - 保存设置

### 方法2: 直接上传部署

1. **访问Cloudflare Pages**
   - 登录 [Cloudflare Pages](https://pages.cloudflare.com/)
   - 点击"Create a project"
   - 选择"Upload assets"

2. **上传文件**
   - 将 `baidu-pan-auth.html` 拖入上传区域
   - 点击"Deploy site"

3. **配置回调地址**（同上）

## 使用步骤

### 1. 访问部署的页面

在浏览器中打开你的Cloudflare Pages URL，例如：
```
https://your-project.pages.dev/baidu-pan-auth.html
```

### 2. 配置回调地址

1. 页面会自动检测当前URL作为回调地址
2. 点击"**自动检测并保存**"按钮
3. 页面会提示你需要在百度网盘开放平台配置相同的回调地址

### 3. 在百度开放平台配置回调地址

⚠️ **这一步非常重要！**

1. 访问 [百度网盘开放平台 - 应用列表](https://pan.baidu.com/union/console/applist)
2. 找到应用"百度网盘api测试"，点击进入
3. 在"安全设置"或"授权设置"中找到"授权回调地址"
4. 添加你的Cloudflare Pages URL：
   ```
   https://your-project.pages.dev/baidu-pan-auth.html
   ```
5. 保存设置

### 4. 开始授权

1. 回到你的页面
2. 点击"**1. 点击授权**"按钮
3. 自动跳转到百度登录页面
4. 登录你的百度账号
5. 同意授权应用访问你的网盘
6. 自动跳转回页面，获取Access Token

### 5. 获取文件信息

授权成功后：
1. 点击"**2. 获取用户信息**"查看网盘账号信息
2. 点击"**3. 获取文件列表**"查看根目录的文件和文件夹

## 本地测试（可选）

如果需要本地测试，可以使用Python启动服务器：

```bash
# 在项目目录下运行
python3 -m http.server 8000

# 然后访问
# http://localhost:8000/baidu-pan-auth.html
```

**注意：** 本地测试时，需要在百度开放平台添加本地回调地址：`http://localhost:8000/baidu-pan-auth.html`

## 技术说明

### 授权模式

使用 **简化模式（Implicit Grant）**：
- 适合纯前端应用
- 无需后端服务器
- Access Token有效期30天
- 过期后需要重新授权（不支持刷新）

### API接口

1. **授权接口**：`http://openapi.baidu.com/oauth/2.0/authorize`
2. **用户信息接口**：`https://pan.baidu.com/rest/2.0/xpan/nas?method=uinfo`
3. **文件列表接口**：`https://pan.baidu.com/rest/2.0/xpan/file?method=list`

### 权限范围（scope）

- `basic`：基础权限
- `netdisk`：网盘文件访问权限

## 常见问题

### 1. 回调地址不匹配

**错误**：`redirect_uri_mismatch`

**解决**：确保填写的回调地址与百度开放平台配置的完全一致，包括协议（http/https）、端口号等。

### 2. CORS跨域问题

百度网盘API支持跨域请求，如果遇到跨域问题，检查：
- 是否通过HTTP服务器访问（不能直接打开HTML文件）
- 浏览器控制台是否有其他错误信息

### 3. Access Token失效

简化模式的Token有效期30天，过期后需要重新授权。点击"清除授权"后重新进行授权流程。

### 4. 无法获取文件列表

检查：
- Access Token是否有效
- 网盘根目录是否有文件
- 网络连接是否正常

## 文件说明

- `baidu-pan-auth.html`：主页面，包含所有功能
- `README.md`：使用说明文档

## 注意事项

1. **不要泄露你的App Key和Access Token**
2. 这只是一个演示demo，生产环境建议使用授权码模式（需要后端配合）
3. Token保存在localStorage中，清除浏览器缓存会丢失
4. 简化模式的Token过期后不能刷新，需要重新授权

## 参考文档

- [百度网盘开放平台文档](https://pan.baidu.com/union/doc/ol0rsap9s)
- [OAuth 2.0简化模式](https://pan.baidu.com/union/doc/nksg0saze)

## 更多功能

如需实现更多功能，可参考百度网盘API文档：
- 上传文件
- 下载文件
- 创建文件夹
- 文件搜索
- 文件分享
- 等等...

