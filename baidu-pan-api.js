/**
 * 百度网盘 API 工具类
 * 用于处理百度网盘的OAuth授权和API调用
 * Version: 2.0.0 - 完整集成版
 */

class BaiduPanAPI {
  constructor() {
    console.log('==================== 百度网盘 API 初始化开始 ====================');
    console.log('[BaiduPan][Constructor] 开始初始化...');
    
    // 百度网盘应用配置
    this.APP_ID = '120275887';
    this.APP_KEY = 'AQoN4IEJyNj71Sp51rl3378udvSuknBu';
    console.log('[BaiduPan][Constructor] 应用配置:', {
      APP_ID: this.APP_ID,
      APP_KEY_LENGTH: this.APP_KEY.length
    });
    
    // CORS代理配置
    this.CORS_PROXY = localStorage.getItem('baiduPanCorsProxy') || '';
    console.log('[BaiduPan][Constructor] CORS代理配置:', {
      proxy: this.CORS_PROXY || '未配置',
      isConfigured: !!this.CORS_PROXY
    });
    
    // 百度网盘API端点
    this.ENDPOINTS = {
      authorize: 'http://openapi.baidu.com/oauth/2.0/authorize',
      userInfo: 'https://pan.baidu.com/rest/2.0/xpan/nas?method=uinfo',
      fileList: 'https://pan.baidu.com/rest/2.0/xpan/file?method=list',
      fileUpload: 'https://pan.baidu.com/rest/2.0/xpan/file?method=upload',
      createFolder: 'https://pan.baidu.com/rest/2.0/xpan/file?method=create'
    };
    
    // Token存储
    this.accessToken = localStorage.getItem('baiduPanAccessToken') || null;
    console.log('[BaiduPan][Constructor] Token状态:', {
      hasToken: !!this.accessToken,
      tokenLength: this.accessToken ? this.accessToken.length : 0
    });
    
    console.log('[BaiduPan][Constructor] ✅ API初始化完成');
    console.log('==================== 百度网盘 API 初始化结束 ====================\n');
  }

  /**
   * 设置CORS代理地址
   */
  setCorsProxy(proxyUrl) {
    console.log('[BaiduPan][setCorsProxy] 设置CORS代理:', proxyUrl);
    this.CORS_PROXY = proxyUrl;
    localStorage.setItem('baiduPanCorsProxy', proxyUrl);
  }

  /**
   * 获取OAuth授权URL
   */
  getAuthUrl(redirectUri) {
    console.log('[BaiduPan][getAuthUrl] 生成授权URL');
    const params = new URLSearchParams({
      response_type: 'token',
      client_id: this.APP_ID,
      redirect_uri: redirectUri,
      scope: 'basic,netdisk',
      display: 'popup'
    });
    
    const authUrl = `${this.ENDPOINTS.authorize}?${params.toString()}`;
    console.log('[BaiduPan][getAuthUrl] 授权URL:', authUrl);
    return authUrl;
  }

  /**
   * 从URL hash中提取access token
   */
  parseTokenFromHash(hash) {
    console.log('[BaiduPan][parseTokenFromHash] 解析hash');
    
    if (!hash || !hash.includes('access_token=')) {
      console.warn('[BaiduPan][parseTokenFromHash] Hash中没有access_token');
      return null;
    }
    
    const hashContent = hash.substring(1);
    const params = new URLSearchParams(hashContent);
    const accessToken = params.get('access_token');
    const expiresIn = params.get('expires_in');
    
    if (accessToken) {
      console.log('[BaiduPan][parseTokenFromHash] ✅ Token解析成功');
      this.setAccessToken(accessToken);
      return { accessToken, expiresIn };
    }
    
    return null;
  }

  /**
   * 设置access token
   */
  setAccessToken(token) {
    console.log('[BaiduPan][setAccessToken] 保存token');
    this.accessToken = token;
    localStorage.setItem('baiduPanAccessToken', token);
  }

  /**
   * 获取access token
   */
  getAccessToken() {
    return this.accessToken;
  }

  /**
   * 清除access token
   */
  clearAccessToken() {
    console.log('[BaiduPan][clearAccessToken] 清除token');
    this.accessToken = null;
    localStorage.removeItem('baiduPanAccessToken');
  }

  /**
   * 通过CORS代理发送请求
   */
  async proxyFetch(url, options = {}) {
    if (!this.CORS_PROXY) {
      throw new Error('CORS代理未配置');
    }
    
    const proxyUrl = this.CORS_PROXY + encodeURIComponent(url);
    console.log('[BaiduPan][proxyFetch] 请求URL:', proxyUrl);
    
    const response = await fetch(proxyUrl, {
      ...options,
      mode: 'cors'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.errno && data.errno !== 0) {
      throw new Error(`百度网盘API错误: ${data.errmsg || data.errno}`);
    }
    
    return data;
  }

  /**
   * 获取用户信息
   */
  async getUserInfo() {
    if (!this.accessToken) {
      throw new Error('未授权');
    }
    
    const url = `${this.ENDPOINTS.userInfo}&access_token=${this.accessToken}`;
    return await this.proxyFetch(url);
  }

  /**
   * 获取文件列表
   */
  async getFileList(dir = '/', start = 0, limit = 1000) {
    if (!this.accessToken) {
      throw new Error('未授权');
    }
    
    const params = new URLSearchParams({
      access_token: this.accessToken,
      dir: dir,
      start: start.toString(),
      limit: limit.toString(),
      order: 'name',
      desc: '0'
    });
    
    const url = `${this.ENDPOINTS.fileList}&${params.toString()}`;
    return await this.proxyFetch(url);
  }

  /**
   * 获取文件夹统计信息
   */
  async getFolderStats(folderId) {
    console.log('[BaiduPan][getFolderStats] 获取文件夹统计:', folderId);
    
    const data = await this.getFileList(folderId);
    
    if (!data.list || !Array.isArray(data.list)) {
      throw new Error('无效的文件夹数据');
    }
    
    const files = data.list.filter(item => item.isdir === 0);
    const totalSizeBytes = files.reduce((sum, file) => sum + (file.size || 0), 0);
    
    const stats = {
      totalFiles: files.length,
      totalSize: this.formatFileSize(totalSizeBytes),
      totalSizeBytes: totalSizeBytes,
      files: files.map(file => ({
        name: file.server_filename,
        size: this.formatFileSize(file.size),
        sizeBytes: file.size,
        path: file.path,
        fs_id: file.fs_id
      }))
    };
    
    console.log('[BaiduPan][getFolderStats] ✅ 统计完成:', stats);
    return stats;
  }

  /**
   * 格式化文件大小
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 创建文件夹
   */
  async createFolder(path) {
    if (!this.accessToken) {
      throw new Error('未授权');
    }
    
    const params = new URLSearchParams({
      access_token: this.accessToken,
      path: path,
      isdir: '1',
      rtype: '1'
    });
    
    const url = `${this.ENDPOINTS.createFolder}&${params.toString()}`;
    return await this.proxyFetch(url, { method: 'POST' });
  }

  /**
   * 检查是否已授权
   */
  isAuthenticated() {
    return !!this.accessToken;
  }

  /**
   * 调试信息
   */
  getDebugInfo() {
    return {
      hasToken: this.isAuthenticated(),
      tokenLength: this.accessToken ? this.accessToken.length : 0,
      hasCorsProxy: !!this.CORS_PROXY,
      corsProxy: this.CORS_PROXY || '未配置',
      appId: this.APP_ID,
      isReady: this.isAuthenticated() && !!this.CORS_PROXY,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * 百度网盘管理器 - 整合所有UI和业务逻辑
 * Version: 2.0.0
 */
class BaiduPanManager {
  constructor(config = {}) {
    console.log('[BaiduPanManager] 初始化管理器...');
    
    this.config = {
      corsProxyUrl: config.corsProxyUrl || '',
      redirectUri: config.redirectUri || window.location.href.split('#')[0].split('?')[0],
      showSnackbar: config.showSnackbar || this.defaultShowSnackbar,
      onFolderSelected: config.onFolderSelected || null,
      onError: config.onError || null
    };
    
    this.api = null;
    this.initialized = false;
    this.elements = {
      inputButton: null,
      outputButton: null,
      inputDisplay: null,
      outputDisplay: null
    };
    
    console.log('[BaiduPanManager] ✅ 管理器初始化完成');
  }

  /**
   * 默认的消息显示函数
   */
  defaultShowSnackbar(message, color) {
    console.log(`[Snackbar] ${message}`, color);
    alert(message);
  }

  /**
   * 初始化百度网盘API
   */
  init() {
    console.log('[BaiduPanManager] 初始化API...');
    
    if (!window.BaiduPanAPI) {
      console.error('[BaiduPanManager] BaiduPanAPI未加载');
      this.config.showSnackbar('百度网盘 API 加载失败', 'rgb(255, 100, 100)');
      return false;
    }
    
    this.api = new window.BaiduPanAPI();
    
    // 设置CORS代理
    const savedProxy = localStorage.getItem('baiduPanCorsProxy');
    if (savedProxy) {
      this.api.setCorsProxy(savedProxy);
      console.log('[BaiduPanManager] 使用保存的CORS代理');
    } else if (this.config.corsProxyUrl && !this.config.corsProxyUrl.includes('YOUR_')) {
      this.api.setCorsProxy(this.config.corsProxyUrl);
      console.log('[BaiduPanManager] 使用配置的CORS代理');
    } else {
      console.warn('[BaiduPanManager] ⚠️ CORS代理未配置');
      this.config.showSnackbar('⚠️ 百度网盘 CORS 代理未配置', 'rgb(255, 133, 32)');
    }
    
    this.initialized = true;
    const debugInfo = this.api.getDebugInfo();
    console.log('[BaiduPanManager] API初始化完成:', debugInfo);
    
    return true;
  }

  /**
   * 绑定UI元素
   */
  bindElements(elements) {
    console.log('[BaiduPanManager] 绑定UI元素');
    this.elements = { ...this.elements, ...elements };
    
    // 绑定按钮事件
    if (this.elements.inputButton) {
      this.elements.inputButton.addEventListener('click', () => this.showFolderPicker(false));
    }
    if (this.elements.outputButton) {
      this.elements.outputButton.addEventListener('click', () => this.showFolderPicker(true));
    }
    
    console.log('[BaiduPanManager] ✅ UI元素绑定完成');
  }

  /**
   * 显示/隐藏按钮
   */
  toggleButtons(show) {
    const display = show ? 'block' : 'none';
    if (this.elements.inputButton) this.elements.inputButton.style.display = display;
    if (this.elements.outputButton) this.elements.outputButton.style.display = display;
  }

  /**
   * 处理OAuth回调
   */
  handleCallback() {
    console.log('[BaiduPanManager] 检查OAuth回调');
    const hash = window.location.hash;
    
    if (hash && hash.includes('access_token=')) {
      console.log('[BaiduPanManager] 检测到OAuth回调');
      
      if (!this.initialized) {
        this.init();
      }
      
      const tokenInfo = this.api.parseTokenFromHash(hash);
      if (tokenInfo) {
        console.log('[BaiduPanManager] Token保存成功');
        window.history.replaceState(null, null, ' ');
        setTimeout(() => {
          this.config.showSnackbar('百度网盘授权成功！', 'rgb(0, 167, 44)');
        }, 500);
        return true;
      }
    }
    return false;
  }

  /**
   * 显示文件夹选择器
   */
  async showFolderPicker(isOutput = false) {
    console.log('[BaiduPanManager] 打开文件夹选择器, isOutput:', isOutput);
    
    if (!this.initialized) {
      this.init();
    }
    
    // 检查CORS代理
    if (!this.api || !this.api.CORS_PROXY || this.api.CORS_PROXY.includes('YOUR_')) {
      console.error('[BaiduPanManager] CORS代理未配置');
      this.config.showSnackbar('❌ 百度网盘 CORS 代理未配置！', 'rgb(255, 100, 100)');
      return null;
    }
    
    // 检查授权
    if (!this.api.isAuthenticated()) {
      this.config.showSnackbar('请先授权百度网盘', 'rgb(255, 133, 32)');
      const authUrl = this.api.getAuthUrl(this.config.redirectUri);
      console.log('[BaiduPanManager] 跳转授权URL:', authUrl);
      setTimeout(() => {
        window.location.href = authUrl;
      }, 1000);
      return null;
    }
    
    try {
      // 获取文件列表
      const data = await this.api.getFileList('/');
      console.log('[BaiduPanManager] 获取文件列表成功');
      
      if (!data.list || data.list.length === 0) {
        this.config.showSnackbar('网盘中没有文件夹', 'rgb(255, 133, 32)');
        return null;
      }
      
      // 筛选文件夹
      const folders = data.list.filter(item => item.isdir === 1);
      
      if (folders.length === 0) {
        this.config.showSnackbar('网盘中没有文件夹', 'rgb(255, 133, 32)');
        return null;
      }
      
      // 简单的文件夹选择器
      const folderPath = prompt(
        '请输入文件夹路径（从列表中选择）：\n\n可用文件夹：\n' + 
        folders.map(f => `- ${f.path}`).join('\n'),
        folders[0].path
      );
      
      if (!folderPath) {
        console.log('[BaiduPanManager] 用户取消选择');
        return null;
      }
      
      const folderName = folderPath.split('/').pop();
      
      // 更新显示
      const displayElement = isOutput ? this.elements.outputDisplay : this.elements.inputDisplay;
      if (displayElement) {
        displayElement.textContent = `Selected ${isOutput ? 'Output' : 'Input'} Folder: ${folderName}`;
      }
      
      // 回调通知
      if (this.config.onFolderSelected) {
        this.config.onFolderSelected({
          isOutput: isOutput,
          path: folderPath,
          name: folderName
        });
      }
      
      this.config.showSnackbar('文件夹选择成功', 'rgb(0, 167, 44)');
      
      return {
        path: folderPath,
        name: folderName
      };
      
    } catch (error) {
      console.error('[BaiduPanManager] 文件夹选择器错误:', error);
      this.config.showSnackbar('获取文件夹列表失败: ' + error.message, 'rgb(255, 100, 100)');
      
      if (this.config.onError) {
        this.config.onError(error);
      }
      
      return null;
    }
  }

  /**
   * 获取文件夹统计信息
   */
  async getFolderStats(folderId) {
    if (!this.initialized) {
      this.init();
    }
    
    if (!this.api.isAuthenticated()) {
      throw new Error('百度网盘未授权');
    }
    
    return await this.api.getFolderStats(folderId);
  }

  /**
   * 检查是否已授权
   */
  isAuthenticated() {
    return this.initialized && this.api && this.api.isAuthenticated();
  }

  /**
   * 获取调试信息
   */
  getDebugInfo() {
    if (!this.api) return { initialized: false };
    return {
      initialized: this.initialized,
      ...this.api.getDebugInfo()
    };
  }
}

// 导出到全局
window.BaiduPanAPI = BaiduPanAPI;
window.BaiduPanManager = BaiduPanManager;

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║  百度网盘 API 模块已加载 (完整集成版 v2.0)              ║');
console.log('║  BaiduPan API Module Loaded (Full Integration v2.0)       ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log('[BaiduPan] 使用方法:');
console.log('[BaiduPan] const manager = new BaiduPanManager({ ... });');
console.log('[BaiduPan] manager.init();');
console.log('');
