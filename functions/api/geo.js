export async function onRequest(context) {
  const url = new URL(context.request.url);
  const code = url.searchParams.get('code');
  
  // 参数校验
  if (!code || !/^\d+$/.test(code)) {
    return new Response(JSON.stringify({ error: 'invalid code' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const target = `https://geo.datav.aliyun.com/areas_v3/bound/${code}_full.json`;
  
  try {
    // 增加超时控制
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    const r = await fetch(target, {
      signal: controller.signal,
      headers: { 
        'Referer': 'https://datav.aliyun.com/', 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    clearTimeout(timeout);
    
    if (!r.ok) {
      return new Response(JSON.stringify({ error: `HTTP ${r.status}` }), { 
        status: r.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const data = await r.text();
    
    return new Response(data, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch(e) {
    // 区分超时和其他错误
    const errorMsg = e.name === 'AbortError' ? 'Request timeout' : e.message;
    return new Response(JSON.stringify({ error: errorMsg }), { 
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}