const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const { randomBytes } = require('crypto');
const mime = require('mime-types');
const { fileTypeFromBuffer } = require('file-type');
const axios = require('axios');

// Initialize Express app
const app = express();

// Enable JSON body parsing
app.use(express.json());

// CORS Configuration
const corsOptions = {
  origin: true,
  methods: ['GET', 'POST']
};
app.use(cors(corsOptions));

// API Key Authentication Middleware
const apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }
 
  if (apiKey !== process.env.LANGYA_SECRET_KEY) {
    return res.status(403).json({ error: 'Invalid API key' });
  }
  
  next();
};

// 根据百度网盘分类转换为 MIME 类型
function getMimeTypeFromBaiduCategory(category, isDir, filename) {
  // 如果是文件夹
  if (isDir === 1) {
    return 'application/vnd.google-apps.folder';
  }
  
  // 根据百度网盘的 category 分类
  const categoryMap = {
    1: 'video/mp4',      // 视频
    2: 'audio/mpeg',     // 音频
    3: 'image/jpeg',     // 图片
    4: 'application/pdf', // 文档
    5: 'application/vnd.android.package-archive', // APP
    6: 'application/octet-stream', // 其他
    7: 'application/x-bittorrent' // bt种子
  };
  
  // 如果有文件名，尝试通过扩展名获取更精确的 MIME 类型
  if (filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const extMap = {
      // 视频
      'mp4': 'video/mp4', 'avi': 'video/x-msvideo', 'mkv': 'video/x-matroska',
      'mov': 'video/quicktime', 'wmv': 'video/x-ms-wmv', 'flv': 'video/x-flv',
      // 音频
      'mp3': 'audio/mpeg', 'wav': 'audio/wav', 'flac': 'audio/flac',
      'm4a': 'audio/mp4', 'aac': 'audio/aac',
      // 图片
      'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png',
      'gif': 'image/gif', 'bmp': 'image/bmp', 'webp': 'image/webp',
      // 文档
      'pdf': 'application/pdf', 'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'txt': 'text/plain',
      // 其他
      'zip': 'application/zip', 'rar': 'application/x-rar-compressed',
      '7z': 'application/x-7z-compressed'
    };
    
    if (extMap[ext]) {
      return extMap[ext];
    }
  }
  
  // 使用默认分类映射
  return categoryMap[category] || 'application/octet-stream';
}

app.post('/folder-stats', apiKeyAuth, async (req, res) => {
  try {
    const { baseUrl, userId, folderId, sourceMode, accessToken, folderPath} = req.body;
    let response;
    let files = [];
    
    if (!folderId && !folderPath) {
      return res.status(400).json({ 
        error: 'folderId or folderPath is required' 
      });
    }
    
    // 处理百度网盘请求
    if (sourceMode === 'baidupan') {
      if (!accessToken) {
        return res.status(400).json({ 
          error: 'accessToken is required for Baidu Pan' 
        });
      }
      
      try {
        const baiduPath = folderPath || '/';
        const baiduApiUrl = `https://pan.baidu.com/rest/2.0/xpan/file?method=list&dir=${encodeURIComponent(baiduPath)}&access_token=${accessToken}`;
        
        const baiduResponse = await axios.get(baiduApiUrl);
        
        if (baiduResponse.data.errno !== 0) {
          return res.status(400).json({ 
            error: 'Baidu Pan API error',
            errno: baiduResponse.data.errno,
            errmsg: baiduResponse.data.errmsg
          });
        }
        
        // 转换百度网盘格式到统一格式
        files = baiduResponse.data.list.map(file => ({
          id: file.fs_id.toString(),
          name: file.server_filename,
          mimeType: getMimeTypeFromBaiduCategory(file.category, file.isdir, file.server_filename),
          size: file.size,
          isDir: file.isdir === 1,
          path: file.path,
          md5: file.md5 || '',
          modifiedTime: file.server_mtime * 1000, // 转换为毫秒
          category: file.category
        }));
      } catch (error) {
        console.error('Baidu Pan API Error:', error);
        return res.status(500).json({ 
          error: 'Failed to fetch from Baidu Pan',
          details: error.message 
        });
      }
    } 
    // 处理其他网盘请求
    else if (sourceMode === 'premiumd' || sourceMode === 'premiumod'){
        response = await axios.post(`${baseUrl}/files`, {
        userId,
        folderId
        }, {
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': req.headers['x-api-key']
        }
        });
        files = response.data.files;
    } else {
        response = await axios.post(`${baseUrl}/files`, {
        userId,
        folderPath: folderId
        }, {
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': req.headers['x-api-key']
        }
        });
        files = response.data.files;
    }
    
    // Calculate statistics
    const stats = {
      folderId: folderId || folderPath,
      folderPath: folderPath || folderId,
      totalFiles: files.length,
      fileTypes: {},
      totalSize: 0,
      files: [],
      folders: [],
      calculatedCost: files.length * 2.067 // Placeholder for real value
    };

    files.forEach(file => {
      // 处理文件夹和文件分类
      if (file.isDir) {
        stats.folders.push({
          id: file.id,
          name: file.name,
          path: file.path,
          modifiedTime: file.modifiedTime
        });
      } else {
        // Count by file type
        const type = file.mimeType.split('/')[0]; // e.g., 'image', 'application'
        stats.fileTypes[type] = (stats.fileTypes[type] || 0) + 1;
        
        // Sum file sizes (convert to MB)
        if (file.size) {
          stats.totalSize += parseInt(file.size);
        }
       
        // Collect basic file info
        stats.files.push({
          id: file.id,
          name: file.name,
          type: file.mimeType,
          size: file.size ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : 'unknown',
          path: file.path,
          md5: file.md5,
          category: file.category
        });
      }
    });

    // Convert total size to MB
    stats.totalSize = `${(stats.totalSize / (1024 * 1024)).toFixed(2)} MB`;
    stats.totalFolders = stats.folders.length;
    stats.totalFilesOnly = stats.files.length;

    // return the stats to the frontend
    res.json(stats);

  } catch (error) {
    console.error('Folder Stats Error:', error);
    res.status(500).json({ 
      error: 'Failed to get folder statistics',
      details: error.response?.data || error.message 
    });
  }
});

exports.getFolderInfo = onRequest(
  { 
    secrets: ['LANGYA_SECRET_KEY'],
    cors: true,
    memory: '4GiB',
    timeoutSeconds: 540
  }, 
  app
);