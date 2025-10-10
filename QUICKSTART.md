# ⚡ 快速开始

5分钟部署百度网盘授权页面到 Cloudflare。

## 🎯 三步部署

### 第1步：部署Worker代理（2分钟）

1. 访问 https://dash.cloudflare.com/
2. 点击 **Workers & Pages** → **Create** → **Create Worker**
3. 名称输入：`baidu-pan-proxy`
4. 点击 **Deploy** → **Edit code**
5. 删除默认代码，粘贴项目中 `worker.js` 的内容
6. 点击 **Save and Deploy**
7. ✅ 记下Worker URL：`https://baidu-pan-proxy.xxx.workers.dev`

### 第2步：部署页面（2分钟）

**方法A - 上传文件（最快）：**
1. 访问 https://dash.cloudflare.com/
2. **Workers & Pages** → **Create** → **Pages** → **Upload assets**
3. 上传 `index.html` 和 `baidu-pan-auth.html`
4. 点击 **Deploy**
5. ✅ 记下页面URL：`https://your-project.pages.dev`

**方法B - 连接GitHub：**
```bash
git init
git add .
git commit -m "百度网盘授权页面"
git remote add origin https://github.com/你的用户名/仓库名.git
git push -u origin main
# 然后在Cloudflare Pages连接仓库
```

### 第3步：配置（1分钟）

#### 3.1 配置百度回调地址

1. 访问 https://pan.baidu.com/union/console/applist
2. 找到"百度网盘api测试"应用
3. 授权设置 → 添加回调地址：
   ```
   https://your-project.pages.dev/baidu-pan-auth.html
   ```
4. 保存

#### 3.2 配置页面代理

1. 打开你的页面：`https://your-project.pages.dev/baidu-pan-auth.html`
2. 在"CORS代理地址"填入：
   ```
   https://baidu-pan-proxy.xxx.workers.dev/?url=
   ```
   **注意末尾的 `?url=`**
3. 点击 **"自动检测并保存"**

## ✅ 开始使用

1. 点击 **"1. 点击授权"**
2. 登录百度账号
3. 同意授权
4. ✅ 完成！现在可以获取用户信息和文件列表了

## 🐛 快速故障排查

### 问题：授权时提示 `redirect_uri_mismatch`

**解决：** 确保百度平台配置的回调地址与页面URL完全一致

### 问题：CORS跨域错误

**解决：**
- 检查Worker是否部署成功
- 确认代理地址末尾有 `?url=`
- 刷新页面

### 问题：无法获取文件列表

**解决：**
- 确认已成功授权（页面显示Token）
- 检查Worker是否正常（访问Worker URL应返回 "Missing url parameter"）
- 查看浏览器控制台错误

## 📚 需要更多帮助？

查看完整文档：[README.md](./README.md)

---

**预计时间：** 5分钟  
**难度：** ⭐⭐☆☆☆

现在开始部署吧！🚀
