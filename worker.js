/**
 * Cloudflare Worker - 百度网盘 API CORS 代理
 * 用于解决浏览器跨域访问百度网盘API的问题
 */

export default {
  async fetch(request, env, ctx) {
    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }

    const url = new URL(request.url);
    
    // 从查询参数中获取目标URL
    const targetUrl = url.searchParams.get('url');
    
    if (!targetUrl) {
      return new Response('Missing url parameter', { 
        status: 400,
        headers: corsHeaders()
      });
    }

    try {
      // 验证目标URL是百度网盘域名
      const target = new URL(targetUrl);
      if (!target.hostname.includes('baidu.com')) {
        return new Response('Invalid target domain', { 
          status: 403,
          headers: corsHeaders()
        });
      }

      // 转发请求到百度网盘API
      const response = await fetch(targetUrl, {
        method: request.method,
        headers: {
          'User-Agent': request.headers.get('User-Agent') || 'Mozilla/5.0'
        }
      });

      // 获取响应内容
      const responseBody = await response.text();
      
      // 返回响应并添加CORS头
      return new Response(responseBody, {
        status: response.status,
        headers: {
          ...corsHeaders(),
          'Content-Type': response.headers.get('Content-Type') || 'application/json'
        }
      });

    } catch (error) {
      return new Response(JSON.stringify({ 
        error: error.message 
      }), {
        status: 500,
        headers: {
          ...corsHeaders(),
          'Content-Type': 'application/json'
        }
      });
    }
  }
};

// CORS 头设置（最宽松配置）
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Max-Age': '86400',
  };
}

// 处理 OPTIONS 预检请求
function handleOptions(request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders()
  });
}

