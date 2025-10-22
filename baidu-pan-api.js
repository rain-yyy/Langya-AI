/**
 * 百度网盘 API 工具类
 * 用于处理百度网盘的OAuth授权和API调用
 * Version: 1.0.0
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
      
      // CORS代理配置（需要配置Cloudflare Worker）
      // 格式：https://your-worker.workers.dev/?url=
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
      console.log('[BaiduPan][Constructor] API端点配置:', this.ENDPOINTS);
      
      // Token存储
      this.accessToken = localStorage.getItem('baiduPanAccessToken') || null;
      console.log('[BaiduPan][Constructor] Token状态:', {
        hasToken: !!this.accessToken,
        tokenLength: this.accessToken ? this.accessToken.length : 0,
        tokenPreview: this.accessToken ? this.accessToken.substring(0, 20) + '...' : 'null'
      });
      
      // LocalStorage 所有相关键值
      console.log('[BaiduPan][Constructor] LocalStorage内容:', {
        baiduPanAccessToken: localStorage.getItem('baiduPanAccessToken') ? '已存储' : '未存储',
        baiduPanCorsProxy: localStorage.getItem('baiduPanCorsProxy') ? '已存储' : '未存储'
      });
      
      console.log('[BaiduPan][Constructor] ✅ API初始化完成', {
        hasToken: !!this.accessToken,
        hasProxy: !!this.CORS_PROXY,
        isReady: !!this.accessToken && !!this.CORS_PROXY
      });
      console.log('==================== 百度网盘 API 初始化结束 ====================\n');
    }
  
    /**
     * 设置CORS代理地址
     * @param {string} proxyUrl - 代理URL（需要包含?url=）
     */
    setCorsProxy(proxyUrl) {
      console.log('---------- setCorsProxy() 调用 ----------');
      console.log('[BaiduPan][setCorsProxy] 输入参数:', {
        proxyUrl: proxyUrl,
        type: typeof proxyUrl,
        length: proxyUrl ? proxyUrl.length : 0
      });
      
      console.log('[BaiduPan][setCorsProxy] 设置前状态:', this.CORS_PROXY);
      this.CORS_PROXY = proxyUrl;
      console.log('[BaiduPan][setCorsProxy] 设置后状态:', this.CORS_PROXY);
      
      localStorage.setItem('baiduPanCorsProxy', proxyUrl);
      console.log('[BaiduPan][setCorsProxy] ✅ 已保存到LocalStorage');
      console.log('[BaiduPan][setCorsProxy] LocalStorage验证:', localStorage.getItem('baiduPanCorsProxy'));
      console.log('---------- setCorsProxy() 完成 ----------\n');
    }
  
    /**
     * 检测CORS代理是否配置且可用
     * @returns {Promise<boolean>}
     */
    async detectCorsProxy() {
      console.log('---------- detectCorsProxy() 调用 ----------');
      console.log('[BaiduPan][detectCorsProxy] 开始检测CORS代理...');
      console.log('[BaiduPan][detectCorsProxy] 当前代理配置:', this.CORS_PROXY);
      
      if (!this.CORS_PROXY) {
        console.error('[BaiduPan][detectCorsProxy] ❌ CORS代理未配置');
        console.log('---------- detectCorsProxy() 结束 (失败) ----------\n');
        return false;
      }
  
      try {
        const testTarget = 'https://pan.baidu.com/';
        const testUrl = this.CORS_PROXY + encodeURIComponent(testTarget);
        console.log('[BaiduPan][detectCorsProxy] 测试URL:', {
          target: testTarget,
          encoded: encodeURIComponent(testTarget),
          fullUrl: testUrl
        });
        
        console.log('[BaiduPan][detectCorsProxy] 发送HEAD请求...');
        const startTime = performance.now();
        const response = await fetch(testUrl, { method: 'HEAD', mode: 'cors' });
        const duration = performance.now() - startTime;
        
        console.log('[BaiduPan][detectCorsProxy] 响应详情:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: Object.fromEntries([...response.headers]),
          duration: `${duration.toFixed(2)}ms`
        });
        
        if (response.ok) {
          console.log('[BaiduPan][detectCorsProxy] ✅ CORS代理测试成功');
        } else {
          console.warn('[BaiduPan][detectCorsProxy] ⚠️ CORS代理响应异常');
        }
        console.log('---------- detectCorsProxy() 结束 ----------\n');
        return response.ok;
      } catch (error) {
        console.error('[BaiduPan][detectCorsProxy] ❌ CORS代理测试失败');
        console.error('[BaiduPan][detectCorsProxy] 错误详情:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        console.log('---------- detectCorsProxy() 结束 (异常) ----------\n');
        return false;
      }
    }
  
    /**
     * 获取OAuth授权URL
     * @param {string} redirectUri - 回调地址
     * @returns {string}
     */
    getAuthUrl(redirectUri) {
      console.log('---------- getAuthUrl() 调用 ----------');
      console.log('[BaiduPan][getAuthUrl] 输入参数:', {
        redirectUri: redirectUri,
        type: typeof redirectUri
      });
      
      const params = new URLSearchParams({
        response_type: 'token',
        client_id: this.APP_ID,
        redirect_uri: redirectUri,
        scope: 'basic,netdisk',
        display: 'popup'
      });
      
      console.log('[BaiduPan][getAuthUrl] 构建OAuth参数:', {
        response_type: 'token',
        client_id: this.APP_ID,
        redirect_uri: redirectUri,
        scope: 'basic,netdisk',
        display: 'popup',
        paramsString: params.toString()
      });
      
      const authUrl = `${this.ENDPOINTS.authorize}?${params.toString()}`;
      console.log('[BaiduPan][getAuthUrl] ✅ 授权URL生成完成:', {
        endpoint: this.ENDPOINTS.authorize,
        fullUrl: authUrl,
        urlLength: authUrl.length
      });
      console.log('[BaiduPan][getAuthUrl] 完整授权URL:', authUrl);
      console.log('---------- getAuthUrl() 完成 ----------\n');
      return authUrl;
    }
  
    /**
     * 从URL hash中提取access token
     * @param {string} hash - URL hash部分
     * @returns {Object|null} - 包含token和expires_in的对象
     */
    parseTokenFromHash(hash) {
      console.log('---------- parseTokenFromHash() 调用 ----------');
      console.log('[BaiduPan][parseTokenFromHash] 输入hash:', {
        hash: hash,
        type: typeof hash,
        length: hash ? hash.length : 0
      });
      
      if (!hash || !hash.includes('access_token=')) {
        console.warn('[BaiduPan][parseTokenFromHash] ⚠️ Hash中没有access_token');
        console.log('[BaiduPan][parseTokenFromHash] Hash内容:', hash);
        console.log('---------- parseTokenFromHash() 结束 (无token) ----------\n');
        return null;
      }
      
      console.log('[BaiduPan][parseTokenFromHash] 解析hash参数...');
      const hashContent = hash.substring(1);
      console.log('[BaiduPan][parseTokenFromHash] 去除#后的内容:', hashContent);
      
      const params = new URLSearchParams(hashContent);
      console.log('[BaiduPan][parseTokenFromHash] URLSearchParams解析结果:', {
        allParams: Object.fromEntries(params),
        paramKeys: Array.from(params.keys())
      });
      
      const accessToken = params.get('access_token');
      const expiresIn = params.get('expires_in');
      
      console.log('[BaiduPan][parseTokenFromHash] 提取的参数:', {
        hasAccessToken: !!accessToken,
        tokenLength: accessToken ? accessToken.length : 0,
        tokenPreview: accessToken ? accessToken.substring(0, 30) + '...' : 'null',
        expiresIn: expiresIn,
        expiresInSeconds: expiresIn ? parseInt(expiresIn) : null,
        expiresInHours: expiresIn ? (parseInt(expiresIn) / 3600).toFixed(2) : null
      });
  
      if (accessToken) {
        console.log('[BaiduPan][parseTokenFromHash] ✅ Token解析成功，保存token...');
        this.setAccessToken(accessToken);
        const result = { accessToken, expiresIn };
        console.log('[BaiduPan][parseTokenFromHash] 返回结果:', result);
        console.log('---------- parseTokenFromHash() 结束 (成功) ----------\n');
        return result;
      }
  
      console.warn('[BaiduPan][parseTokenFromHash] ⚠️ 未找到有效的access_token');
      console.log('---------- parseTokenFromHash() 结束 (失败) ----------\n');
      return null;
    }
  
    /**
     * 设置access token
     * @param {string} token
     */
    setAccessToken(token) {
      console.log('---------- setAccessToken() 调用 ----------');
      console.log('[BaiduPan][setAccessToken] 输入token:', {
        hasToken: !!token,
        type: typeof token,
        length: token ? token.length : 0,
        preview: token ? token.substring(0, 30) + '...' : 'null'
      });
      
      console.log('[BaiduPan][setAccessToken] 设置前状态:', {
        oldToken: this.accessToken ? this.accessToken.substring(0, 20) + '...' : 'null',
        oldTokenLength: this.accessToken ? this.accessToken.length : 0
      });
      
      this.accessToken = token;
      console.log('[BaiduPan][setAccessToken] 设置后状态:', {
        newToken: this.accessToken ? this.accessToken.substring(0, 20) + '...' : 'null',
        newTokenLength: this.accessToken ? this.accessToken.length : 0
      });
      
      localStorage.setItem('baiduPanAccessToken', token);
      console.log('[BaiduPan][setAccessToken] ✅ Token已保存到LocalStorage');
      console.log('[BaiduPan][setAccessToken] LocalStorage验证:', {
        stored: localStorage.getItem('baiduPanAccessToken') ? '已存储' : '未存储',
        storedLength: localStorage.getItem('baiduPanAccessToken') ? localStorage.getItem('baiduPanAccessToken').length : 0
      });
      console.log('---------- setAccessToken() 完成 ----------\n');
    }
  
    /**
     * 获取access token
     * @returns {string|null}
     */
    getAccessToken() {
      console.log('[BaiduPan][getAccessToken] 返回token:', {
        hasToken: !!this.accessToken,
        tokenLength: this.accessToken ? this.accessToken.length : 0
      });
      return this.accessToken;
    }
  
    /**
     * 清除access token
     */
    clearAccessToken() {
      console.log('---------- clearAccessToken() 调用 ----------');
      console.log('[BaiduPan][clearAccessToken] 清除前状态:', {
        hasToken: !!this.accessToken,
        tokenLength: this.accessToken ? this.accessToken.length : 0
      });
      
      this.accessToken = null;
      console.log('[BaiduPan][clearAccessToken] 实例token已清除:', this.accessToken);
      
      localStorage.removeItem('baiduPanAccessToken');
      console.log('[BaiduPan][clearAccessToken] ✅ LocalStorage token已移除');
      console.log('[BaiduPan][clearAccessToken] LocalStorage验证:', {
        stillExists: localStorage.getItem('baiduPanAccessToken') !== null,
        value: localStorage.getItem('baiduPanAccessToken')
      });
      console.log('---------- clearAccessToken() 完成 ----------\n');
    }
  
    /**
     * 通过CORS代理发起API请求
     * @param {string} url - API URL
     * @param {Object} options - fetch选项
     * @returns {Promise<Object>}
     */
    async proxyFetch(url, options = {}) {
      console.log('========== proxyFetch() 调用 ==========');
      console.log('[BaiduPan][proxyFetch] 输入参数:', {
        url: url,
        options: options,
        optionsKeys: Object.keys(options)
      });
      
      if (!this.CORS_PROXY) {
        console.error('[BaiduPan][proxyFetch] ❌ CORS代理未配置');
        const error = new Error('CORS proxy not configured. Please set proxy first.');
        console.error('[BaiduPan][proxyFetch] 抛出错误:', error);
        console.log('========== proxyFetch() 结束 (失败) ==========\n');
        throw error;
      }
  
      const proxyUrl = this.CORS_PROXY + encodeURIComponent(url);
      console.log('[BaiduPan][proxyFetch] URL构建:', {
        originalUrl: url,
        encodedUrl: encodeURIComponent(url),
        corsProxy: this.CORS_PROXY,
        finalProxyUrl: proxyUrl
      });
      
      const fetchOptions = {
        ...options,
        mode: 'cors'
      };
      console.log('[BaiduPan][proxyFetch] Fetch选项:', fetchOptions);
  
      try {
        console.log('[BaiduPan][proxyFetch] 🚀 发送请求...');
        const startTime = performance.now();
        const response = await fetch(proxyUrl, fetchOptions);
        const duration = performance.now() - startTime;
        
        console.log('[BaiduPan][proxyFetch] 响应接收:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: Object.fromEntries([...response.headers]),
          duration: `${duration.toFixed(2)}ms`
        });
        
        console.log('[BaiduPan][proxyFetch] 解析JSON响应...');
        const data = await response.json();
        console.log('[BaiduPan][proxyFetch] JSON解析完成:', {
          hasErrno: data.errno !== undefined,
          errno: data.errno,
          errmsg: data.errmsg,
          dataKeys: Object.keys(data),
          dataPreview: JSON.stringify(data).substring(0, 200) + '...'
        });
  
        if (data.errno !== undefined && data.errno !== 0) {
          console.error('[BaiduPan][proxyFetch] ❌ API返回错误:', {
            errno: data.errno,
            errmsg: data.errmsg,
            fullResponse: data
          });
          const error = new Error(`Baidu Pan API Error: ${data.errmsg || data.errno}`);
          console.error('[BaiduPan][proxyFetch] 抛出API错误:', error);
          console.log('========== proxyFetch() 结束 (API错误) ==========\n');
          throw error;
        }
  
        console.log('[BaiduPan][proxyFetch] ✅ 请求成功');
        console.log('========== proxyFetch() 结束 (成功) ==========\n');
        return data;
      } catch (error) {
        console.error('[BaiduPan][proxyFetch] ❌ 请求异常');
        console.error('[BaiduPan][proxyFetch] 错误详情:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
          type: error.constructor.name
        });
        console.log('========== proxyFetch() 结束 (异常) ==========\n');
        throw error;
      }
    }
  
    /**
     * 获取用户信息
     * @returns {Promise<Object>}
     */
    async getUserInfo() {
      console.log('---------- getUserInfo() 调用 ----------');
      console.log('[BaiduPan][getUserInfo] 检查认证状态...');
      console.log('[BaiduPan][getUserInfo] Token状态:', {
        hasToken: !!this.accessToken,
        tokenLength: this.accessToken ? this.accessToken.length : 0
      });
      
      if (!this.accessToken) {
        console.error('[BaiduPan][getUserInfo] ❌ 未认证');
        const error = new Error('Not authenticated. Please login first.');
        console.error('[BaiduPan][getUserInfo] 抛出错误:', error);
        console.log('---------- getUserInfo() 结束 (失败) ----------\n');
        throw error;
      }
  
      const url = `${this.ENDPOINTS.userInfo}&access_token=${this.accessToken}`;
      console.log('[BaiduPan][getUserInfo] 构建请求URL:', {
        endpoint: this.ENDPOINTS.userInfo,
        tokenPreview: this.accessToken.substring(0, 20) + '...',
        fullUrl: url
      });
      
      console.log('[BaiduPan][getUserInfo] 🚀 获取用户信息...');
      try {
        const data = await this.proxyFetch(url);
        console.log('[BaiduPan][getUserInfo] ✅ 用户信息获取成功:', {
          keys: Object.keys(data),
          data: data
        });
        console.log('---------- getUserInfo() 结束 (成功) ----------\n');
        return data;
      } catch (error) {
        console.error('[BaiduPan][getUserInfo] ❌ 获取用户信息失败:', error);
        console.log('---------- getUserInfo() 结束 (异常) ----------\n');
        throw error;
      }
    }
  
    /**
     * 获取文件列表
     * @param {string} dir - 目录路径（默认为根目录）
     * @param {number} start - 起始位置
     * @param {number} limit - 返回数量
     * @returns {Promise<Object>}
     */
    async getFileList(dir = '/', start = 0, limit = 1000) {
      console.log('---------- getFileList() 调用 ----------');
      console.log('[BaiduPan][getFileList] 输入参数:', {
        dir: dir,
        start: start,
        limit: limit
      });
      
      console.log('[BaiduPan][getFileList] 检查认证状态...');
      if (!this.accessToken) {
        console.error('[BaiduPan][getFileList] ❌ 未认证');
        const error = new Error('Not authenticated. Please login first.');
        console.error('[BaiduPan][getFileList] 抛出错误:', error);
        console.log('---------- getFileList() 结束 (失败) ----------\n');
        throw error;
      }
  
      const params = new URLSearchParams({
        access_token: this.accessToken,
        dir: dir,
        start: start.toString(),
        limit: limit.toString(),
        order: 'time',
        desc: '1'
      });
      
      console.log('[BaiduPan][getFileList] 构建请求参数:', {
        paramsObject: Object.fromEntries(params),
        paramsString: params.toString()
      });
  
      const url = `${this.ENDPOINTS.fileList}&${params.toString()}`;
      console.log('[BaiduPan][getFileList] 请求URL:', url);
      
      console.log('[BaiduPan][getFileList] 🚀 获取文件列表...');
      try {
        const data = await this.proxyFetch(url);
        console.log('[BaiduPan][getFileList] ✅ 文件列表获取成功:', {
          hasListArray: Array.isArray(data.list),
          listLength: data.list ? data.list.length : 0,
          keys: Object.keys(data),
          dataPreview: JSON.stringify(data).substring(0, 300) + '...'
        });
        console.log('---------- getFileList() 结束 (成功) ----------\n');
        return data;
      } catch (error) {
        console.error('[BaiduPan][getFileList] ❌ 获取文件列表失败:', error);
        console.log('---------- getFileList() 结束 (异常) ----------\n');
        throw error;
      }
    }
  
    /**
     * 获取指定文件夹的统计信息
     * @param {string} folderId - 文件夹路径
     * @returns {Promise<Object>}
     */
    async getFolderStats(folderId) {
      console.log('---------- getFolderStats() 调用 ----------');
      console.log('[BaiduPan][getFolderStats] 输入参数:', {
        folderId: folderId,
        type: typeof folderId
      });
      
      try {
        console.log('[BaiduPan][getFolderStats] 🚀 获取文件夹内容...');
        const data = await this.getFileList(folderId);
        
        console.log('[BaiduPan][getFolderStats] 验证返回数据...');
        console.log('[BaiduPan][getFolderStats] 数据结构:', {
          hasListProperty: 'list' in data,
          isListArray: Array.isArray(data.list),
          listLength: data.list ? data.list.length : 0,
          dataKeys: Object.keys(data)
        });
        
        if (!data.list || !Array.isArray(data.list)) {
          console.error('[BaiduPan][getFolderStats] ❌ 无效的文件夹数据');
          const error = new Error('Invalid folder data');
          console.error('[BaiduPan][getFolderStats] 抛出错误:', error);
          console.log('---------- getFolderStats() 结束 (失败) ----------\n');
          throw error;
        }
  
        console.log('[BaiduPan][getFolderStats] 过滤文件 (isdir === 0)...');
        const files = data.list.filter(item => item.isdir === 0);
        console.log('[BaiduPan][getFolderStats] 过滤结果:', {
          totalItems: data.list.length,
          filesCount: files.length,
          foldersCount: data.list.length - files.length
        });
        
        console.log('[BaiduPan][getFolderStats] 计算总大小...');
        const totalSizeBytes = files.reduce((sum, file) => sum + (file.size || 0), 0);
        console.log('[BaiduPan][getFolderStats] 大小统计:', {
          totalSizeBytes: totalSizeBytes,
          formatted: this.formatFileSize(totalSizeBytes)
        });
  
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
  
        console.log('[BaiduPan][getFolderStats] ✅ 统计信息生成完成:', {
          totalFiles: stats.totalFiles,
          totalSize: stats.totalSize,
          fileNamesPreview: stats.files.slice(0, 5).map(f => f.name)
        });
        console.log('[BaiduPan][getFolderStats] 完整统计信息:', stats);
        console.log('---------- getFolderStats() 结束 (成功) ----------\n');
        return stats;
      } catch (error) {
        console.error('[BaiduPan][getFolderStats] ❌ 获取文件夹统计失败');
        console.error('[BaiduPan][getFolderStats] 错误详情:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        console.log('---------- getFolderStats() 结束 (异常) ----------\n');
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
      console.log('---------- createFolder() 调用 ----------');
      console.log('[BaiduPan][createFolder] 输入参数:', {
        path: path,
        type: typeof path
      });
      
      console.log('[BaiduPan][createFolder] 检查认证状态...');
      if (!this.accessToken) {
        console.error('[BaiduPan][createFolder] ❌ 未认证');
        const error = new Error('Not authenticated. Please login first.');
        console.error('[BaiduPan][createFolder] 抛出错误:', error);
        console.log('---------- createFolder() 结束 (失败) ----------\n');
        throw error;
      }
  
      const params = new URLSearchParams({
        access_token: this.accessToken,
        path: path,
        isdir: '1',
        rtype: '1'
      });
      
      console.log('[BaiduPan][createFolder] 构建请求参数:', {
        paramsObject: Object.fromEntries(params),
        paramsString: params.toString()
      });
  
      const url = `${this.ENDPOINTS.createFolder}&${params.toString()}`;
      console.log('[BaiduPan][createFolder] 请求URL:', url);
      console.log('[BaiduPan][createFolder] 🚀 创建文件夹:', path);
      
      try {
        const data = await this.proxyFetch(url, { method: 'POST' });
        console.log('[BaiduPan][createFolder] ✅ 文件夹创建成功:', {
          path: path,
          response: data
        });
        console.log('---------- createFolder() 结束 (成功) ----------\n');
        return data;
      } catch (error) {
        console.error('[BaiduPan][createFolder] ❌ 创建文件夹失败:', error);
        console.log('---------- createFolder() 结束 (异常) ----------\n');
        throw error;
      }
    }
  
    /**
     * 检查是否已授权
     * @returns {boolean}
     */
    isAuthenticated() {
      const authenticated = !!this.accessToken;
      console.log('[BaiduPan][isAuthenticated] 认证检查:', {
        isAuthenticated: authenticated,
        hasToken: !!this.accessToken,
        tokenLength: this.accessToken ? this.accessToken.length : 0
      });
      return authenticated;
    }
  
    /**
     * 调试信息
     * @returns {Object}
     */
    getDebugInfo() {
      console.log('========== getDebugInfo() 调用 ==========');
      console.log('[BaiduPan][getDebugInfo] 收集调试信息...');
      
      const debugInfo = {
        // 认证信息
        hasToken: this.isAuthenticated(),
        tokenLength: this.accessToken ? this.accessToken.length : 0,
        tokenPreview: this.accessToken ? this.accessToken.substring(0, 30) + '...' : 'null',
        
        // 代理信息
        hasCorsProxy: !!this.CORS_PROXY,
        corsProxy: this.CORS_PROXY || '未配置',
        
        // 应用信息
        appId: this.APP_ID,
        appKey: this.APP_KEY ? '已配置' : '未配置',
        
        // API端点
        endpoints: this.ENDPOINTS,
        
        // LocalStorage状态
        localStorage: {
          hasToken: !!localStorage.getItem('baiduPanAccessToken'),
          tokenLength: localStorage.getItem('baiduPanAccessToken') ? localStorage.getItem('baiduPanAccessToken').length : 0,
          hasProxy: !!localStorage.getItem('baiduPanCorsProxy'),
          proxyUrl: localStorage.getItem('baiduPanCorsProxy') || '未配置'
        },
        
        // 就绪状态
        isReady: this.isAuthenticated() && !!this.CORS_PROXY,
        
        // 时间戳
        timestamp: new Date().toISOString()
      };
      
      console.log('[BaiduPan][getDebugInfo] ===== 完整调试信息 =====');
      console.log('[BaiduPan][getDebugInfo] 认证状态:', {
        hasToken: debugInfo.hasToken,
        tokenLength: debugInfo.tokenLength
      });
      console.log('[BaiduPan][getDebugInfo] 代理状态:', {
        hasCorsProxy: debugInfo.hasCorsProxy,
        corsProxy: debugInfo.corsProxy
      });
      console.log('[BaiduPan][getDebugInfo] 应用配置:', {
        appId: debugInfo.appId,
        appKey: debugInfo.appKey
      });
      console.log('[BaiduPan][getDebugInfo] LocalStorage状态:', debugInfo.localStorage);
      console.log('[BaiduPan][getDebugInfo] 就绪状态:', debugInfo.isReady);
      console.log('[BaiduPan][getDebugInfo] 完整对象:', debugInfo);
      console.log('========== getDebugInfo() 结束 ==========\n');
      
      return debugInfo;
    }
  }
  
  // 导出单例
  window.BaiduPanAPI = BaiduPanAPI;
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       百度网盘 API 模块已加载 (增强调试版本)              ║');
  console.log('║       BaiduPan API Module Loaded (Enhanced Debug)         ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('[BaiduPan] 使用方法:');
  console.log('[BaiduPan]   const api = new BaiduPanAPI();');
  console.log('[BaiduPan]   api.getDebugInfo(); // 查看调试信息');
  console.log('');
  