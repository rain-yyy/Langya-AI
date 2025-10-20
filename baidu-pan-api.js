/**
 * 百度网盘 API 工具类
 * 用于处理百度网盘的OAuth授权和API调用
 * Version: 1.0.0
 */

class BaiduPanAPI {
  constructor() {
    // 百度网盘应用配置
    this.APP_ID = '120275887';
    this.APP_KEY = 'AQoN4IEJyNj71Sp51rl3378udvSuknBu';
    
    // CORS代理配置（需要配置Cloudflare Worker）
    // 格式：https://your-worker.workers.dev/?url=
    this.CORS_PROXY = localStorage.getItem('baiduPanCorsProxy') || '';
    
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
    
    console.log('[BaiduPan] API initialized', {
      hasToken: !!this.accessToken,
      hasProxy: !!this.CORS_PROXY
    });
  }

  /**
   * 设置CORS代理地址
   * @param {string} proxyUrl - 代理URL（需要包含?url=）
   */
  setCorsProxy(proxyUrl) {
    this.CORS_PROXY = proxyUrl;
    localStorage.setItem('baiduPanCorsProxy', proxyUrl);
    console.log('[BaiduPan] CORS proxy set:', proxyUrl);
  }

  /**
   * 检测CORS代理是否配置且可用
   * @returns {Promise<boolean>}
   */
  async detectCorsProxy() {
    if (!this.CORS_PROXY) {
      console.error('[BaiduPan] CORS proxy not configured');
      return false;
    }

    try {
      const testUrl = this.CORS_PROXY + encodeURIComponent('https://pan.baidu.com/');
      const response = await fetch(testUrl, { method: 'HEAD', mode: 'cors' });
      console.log('[BaiduPan] CORS proxy test:', response.ok);
      return response.ok;
    } catch (error) {
      console.error('[BaiduPan] CORS proxy test failed:', error);
      return false;
    }
  }

  /**
   * 获取OAuth授权URL
   * @param {string} redirectUri - 回调地址
   * @returns {string}
   */
  getAuthUrl(redirectUri) {
    const params = new URLSearchParams({
      response_type: 'token',
      client_id: this.APP_ID,
      redirect_uri: redirectUri,
      scope: 'basic,netdisk',
      display: 'popup'
    });
    
    const authUrl = `${this.ENDPOINTS.authorize}?${params.toString()}`;
    console.log('[BaiduPan] Auth URL generated:', authUrl);
    return authUrl;
  }

  /**
   * 从URL hash中提取access token
   * @param {string} hash - URL hash部分
   * @returns {Object|null} - 包含token和expires_in的对象
   */
  parseTokenFromHash(hash) {
    console.log('[BaiduPan] Parsing token from hash:', hash);
    
    if (!hash || !hash.includes('access_token=')) {
      console.warn('[BaiduPan] No access_token in hash');
      return null;
    }

    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    const expiresIn = params.get('expires_in');

    if (accessToken) {
      this.setAccessToken(accessToken);
      console.log('[BaiduPan] Token parsed successfully', {
        tokenLength: accessToken.length,
        expiresIn: expiresIn
      });
      return { accessToken, expiresIn };
    }

    return null;
  }

  /**
   * 设置access token
   * @param {string} token
   */
  setAccessToken(token) {
    this.accessToken = token;
    localStorage.setItem('baiduPanAccessToken', token);
    console.log('[BaiduPan] Access token saved');
  }

  /**
   * 获取access token
   * @returns {string|null}
   */
  getAccessToken() {
    return this.accessToken;
  }

  /**
   * 清除access token
   */
  clearAccessToken() {
    this.accessToken = null;
    localStorage.removeItem('baiduPanAccessToken');
    console.log('[BaiduPan] Access token cleared');
  }

  /**
   * 通过CORS代理发起API请求
   * @param {string} url - API URL
   * @param {Object} options - fetch选项
   * @returns {Promise<Object>}
   */
  async proxyFetch(url, options = {}) {
    if (!this.CORS_PROXY) {
      throw new Error('CORS proxy not configured. Please set proxy first.');
    }

    const proxyUrl = this.CORS_PROXY + encodeURIComponent(url);
    console.log('[BaiduPan] Proxy fetch:', { originalUrl: url, proxyUrl });

    try {
      const response = await fetch(proxyUrl, {
        ...options,
        mode: 'cors'
      });

      const data = await response.json();
      console.log('[BaiduPan] Proxy fetch response:', data);

      if (data.errno !== undefined && data.errno !== 0) {
        throw new Error(`Baidu Pan API Error: ${data.errmsg || data.errno}`);
      }

      return data;
    } catch (error) {
      console.error('[BaiduPan] Proxy fetch error:', error);
      throw error;
    }
  }

  /**
   * 获取用户信息
   * @returns {Promise<Object>}
   */
  async getUserInfo() {
    if (!this.accessToken) {
      throw new Error('Not authenticated. Please login first.');
    }

    const url = `${this.ENDPOINTS.userInfo}&access_token=${this.accessToken}`;
    console.log('[BaiduPan] Getting user info...');
    
    const data = await this.proxyFetch(url);
    console.log('[BaiduPan] User info:', data);
    return data;
  }

  /**
   * 获取文件列表
   * @param {string} dir - 目录路径（默认为根目录）
   * @param {number} start - 起始位置
   * @param {number} limit - 返回数量
   * @returns {Promise<Object>}
   */
  async getFileList(dir = '/', start = 0, limit = 1000) {
    if (!this.accessToken) {
      throw new Error('Not authenticated. Please login first.');
    }

    const params = new URLSearchParams({
      access_token: this.accessToken,
      dir: dir,
      start: start.toString(),
      limit: limit.toString(),
      order: 'time',
      desc: '1'
    });

    const url = `${this.ENDPOINTS.fileList}&${params.toString()}`;
    console.log('[BaiduPan] Getting file list:', { dir, start, limit });
    
    const data = await this.proxyFetch(url);
    console.log('[BaiduPan] File list:', data);
    return data;
  }

  /**
   * 获取指定文件夹的统计信息
   * @param {string} folderId - 文件夹路径
   * @returns {Promise<Object>}
   */
  async getFolderStats(folderId) {
    console.log('[BaiduPan] Getting folder stats:', folderId);
    
    try {
      const data = await this.getFileList(folderId);
      
      if (!data.list || !Array.isArray(data.list)) {
        throw new Error('Invalid folder data');
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

      console.log('[BaiduPan] Folder stats:', stats);
      return stats;
    } catch (error) {
      console.error('[BaiduPan] Get folder stats error:', error);
      throw error;
    }
  }

  /**
   * 格式化文件大小
   * @param {number} bytes
   * @returns {string}
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
   * @param {string} path - 文件夹路径
   * @returns {Promise<Object>}
   */
  async createFolder(path) {
    if (!this.accessToken) {
      throw new Error('Not authenticated. Please login first.');
    }

    const params = new URLSearchParams({
      access_token: this.accessToken,
      path: path,
      isdir: '1',
      rtype: '1'
    });

    const url = `${this.ENDPOINTS.createFolder}&${params.toString()}`;
    console.log('[BaiduPan] Creating folder:', path);
    
    const data = await this.proxyFetch(url, { method: 'POST' });
    console.log('[BaiduPan] Folder created:', data);
    return data;
  }

  /**
   * 检查是否已授权
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!this.accessToken;
  }

  /**
   * 调试信息
   * @returns {Object}
   */
  getDebugInfo() {
    return {
      hasToken: this.isAuthenticated(),
      tokenLength: this.accessToken ? this.accessToken.length : 0,
      hasCorsProxy: !!this.CORS_PROXY,
      corsProxy: this.CORS_PROXY,
      appId: this.APP_ID
    };
  }
}

// 导出单例
window.BaiduPanAPI = BaiduPanAPI;
console.log('[BaiduPan] API module loaded');

