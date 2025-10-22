# 百度网盘集成使用指南

## 📦 架构说明

百度网盘功能现已完全模块化，所有逻辑都在 `baidu-pan-api.js` 中：

```
baidu-pan-api.js (CDN)
├── BaiduPanAPI       - 底层API类（OAuth、文件操作）
└── BaiduPanManager   - 高级管理器（UI交互、业务逻辑）

new.html
└── 只需配置 BAIDU_PAN_CONFIG 和调用管理器
```

## 🚀 快速开始

### 步骤 1: 部署 CORS 代理（必须！）

由于浏览器跨域限制，必须部署 Cloudflare Worker：

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Workers & Pages → Create Worker
3. 复制 `worker.js` 内容并粘贴
4. 部署后获得 URL（如：`https://baidu-cors.your-name.workers.dev`）

### 步骤 2: 配置百度开发者平台

1. 访问 [百度开发者中心](https://pan.baidu.com/union/console/applist)
2. 确认应用 ID: `120275887`
3. 添加 OAuth 回调地址（必须与你的页面URL完全一致）
   - 示例：`https://yourdomain.com/pages/your-page`

### 步骤 3: 更新 new.html 配置

在 `new.html` 中找到 `BAIDU_PAN_CONFIG`（约第 3906 行）：

```javascript
const BAIDU_PAN_CONFIG = {
  // ⚠️ 替换为你的 Cloudflare Worker URL
  corsProxyUrl: 'https://baidu-cors.your-name.workers.dev/?url=',  
  
  // OAuth 回调地址（自动获取，无需修改）
  redirectUri: window.location.href.split('#')[0].split('?')[0]
};
```

### 步骤 4: 引用 CDN（已完成）

`new.html` 已自动引用 CDN：

```html
<script src="https://cdn.jsdelivr.net/gh/rain-yyy/Langya-AI/baidu-pan-api.js"></script>
```

## 📝 代码结构

### baidu-pan-api.js 导出的类

#### 1. `BaiduPanAPI` - 底层 API 类

```javascript
const api = new BaiduPanAPI();

// 方法
api.setCorsProxy(url)           // 设置CORS代理
api.getAuthUrl(redirectUri)     // 获取OAuth授权URL
api.parseTokenFromHash(hash)    // 解析token（自动保存）
api.isAuthenticated()           // 检查是否已授权
api.getFileList(dir)            // 获取文件列表
api.getFolderStats(folderId)    // 获取文件夹统计
api.getDebugInfo()              // 获取调试信息
```

#### 2. `BaiduPanManager` - 高级管理器（推荐使用）

```javascript
const manager = new BaiduPanManager({
  corsProxyUrl: 'https://...',
  redirectUri: 'https://...',
  showSnackbar: (msg, color) => { ... },
  onFolderSelected: (data) => { ... }
});

manager.init()                          // 初始化
manager.bindElements({ ... })           // 绑定UI元素
manager.handleCallback()                // 处理OAuth回调
manager.toggleButtons(show)             // 显示/隐藏按钮
manager.showFolderPicker(isOutput)      // 显示文件夹选择器
manager.getFolderStats(folderId)        // 获取文件夹统计
manager.isAuthenticated()               // 检查授权状态
```

### new.html 中的集成代码

#### 初始化（约第 3948 行）

```javascript
function initBaiduPanManager() {
  baiduPanManager = new window.BaiduPanManager({
    corsProxyUrl: BAIDU_PAN_CONFIG.corsProxyUrl,
    redirectUri: BAIDU_PAN_CONFIG.redirectUri,
    showSnackbar: showSnackbar,
    onFolderSelected: async (data) => {
      if (data.isOutput) {
        OutputFolderId = data.path;
        outputfolderName = data.name;
        await populateOutputFolder(OutputFolderId);
      } else {
        selectedFolderId = data.path;
        folderName = data.name;
        await populateInputFolder(selectedFolderId);
      }
      useOrNot = true;
    }
  });
  
  baiduPanManager.init();
}
```

#### 绑定 UI 元素（约第 4370 行）

```javascript
// 初始化管理器
initBaiduPanManager();

// 绑定UI元素到管理器
if (baiduPanManager) {
  baiduPanManager.bindElements({
    inputButton: bdChooseFolderBtn,
    outputButton: bdChooseOutputBtn,
    inputDisplay: document.getElementById('selected-input-folder'),
    outputDisplay: document.getElementById('selected-output-folder')
  });
}
```

#### 处理回调（约第 4427 行）

```javascript
// 检查OAuth回调
if (baiduPanManager) {
  baiduPanManager.handleCallback();
}
```

#### Source Mode 切换（约第 4579 行）

```javascript
'premiumbdpan': () => {
  // 显示百度网盘按钮
  if (baiduPanManager) {
    baiduPanManager.toggleButtons(true);
  }
  document.getElementById('folder-inputs').style.display = 'block';
  
  // 检查授权
  if (baiduPanManager && !baiduPanManager.isAuthenticated()) {
    showSnackbar('正在跳转到百度网盘授权页面...', 'rgb(0, 167, 44)');
    setTimeout(() => {
      const authUrl = baiduPanManager.api.getAuthUrl(BAIDU_PAN_CONFIG.redirectUri);
      window.location.href = authUrl;
    }, 1000);
  }
}
```

## 🔍 调试

### 检查配置状态

打开浏览器控制台（F12）：

```javascript
// 查看调试信息
baiduPanManager.getDebugInfo()

// 应该看到：
// {
//   initialized: true,
//   hasToken: true/false,
//   hasCorsProxy: true,     // ← 必须为 true
//   corsProxy: "https://...",
//   isReady: true,
//   ...
// }
```

### 常见问题

#### 1. CORS 代理未配置

**症状**: 控制台显示 "⚠️ CORS 代理未配置"  
**解决**: 部署 Cloudflare Worker 并更新 `BAIDU_PAN_CONFIG.corsProxyUrl`

#### 2. OAuth 授权失败

**症状**: 授权后无法跳转回来  
**解决**: 检查百度开发者平台的回调地址是否与 `redirectUri` 完全一致

#### 3. 无法获取文件列表

**症状**: 点击按钮后报错  
**解决**: 
- 确认 CORS 代理正常工作
- 确认已完成授权
- 检查 `baiduPanManager.isAuthenticated()` 返回 `true`

## 📊 功能清单

- ✅ OAuth 授权自动处理
- ✅ Token 自动保存到 LocalStorage
- ✅ CORS 代理支持
- ✅ 文件夹列表获取
- ✅ 文件统计信息
- ✅ UI 自动绑定和管理
- ✅ 完整的错误处理
- ✅ 详细的调试日志

## 🎯 测试流程

1. **刷新页面** → 检查控制台，确认无 CORS 警告
2. **选择 "Premium Baidu Pan"** → 应跳转到授权页面
3. **完成授权** → 自动跳转回来，显示 "授权成功"
4. **点击 "Choose" 按钮** → 显示文件夹列表
5. **选择文件夹** → 显示文件统计信息

## 📚 更新日志

### v2.0.0 (当前版本)
- ✨ 完全模块化，所有逻辑移至 `baidu-pan-api.js`
- ✨ 新增 `BaiduPanManager` 高级管理器
- ✨ UI 自动绑定和管理
- ✨ 增强的错误处理和调试信息
- 📝 `new.html` 代码量减少 70%

### v1.0.0
- 初始版本，逻辑分散在 `new.html` 中

## 🔗 相关链接

- [百度网盘开放平台](https://pan.baidu.com/union/)
- [Cloudflare Workers](https://workers.cloudflare.com/)
- [GitHub 仓库](https://github.com/rain-yyy/Langya-AI)
- [CDN 地址](https://cdn.jsdelivr.net/gh/rain-yyy/Langya-AI/baidu-pan-api.js)

