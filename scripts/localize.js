#!/usr/bin/env node
/**
 * 本地化改造脚本
 * 将 drive-escape 改为完全离线运行
 * 
 * 用法: node scripts/localize.js
 */

const fs = require('fs');
const path = require('path');

const INDEX_FILE = path.join(__dirname, '..', 'index.html');

// 读取原始文件
let content = fs.readFileSync(INDEX_FILE, 'utf-8');

// ============================================
// 1. 替换 fetchGeoJSON 函数为本地加载
// ============================================
const oldFetchGeoJSON = `async function fetchGeoJSON(code, timeoutMs = 10000) {
  // 本地开发：直连
  if (!useProxy()) {
    return fetchJSON(geoURL(code), timeoutMs);
  }
  
  // 线上：先尝试代理，失败则降级直连
  try {
    return await fetchJSON(proxyURL(code), timeoutMs);
  } catch (proxyError) {
    console.warn(\`代理请求失败 (code=\${code})，尝试直连...\`, proxyError.message);
    try {
      const data = await fetchJSON(geoURL(code), timeoutMs);
      console.log(\`直连成功 (code=\${code})\`);
      return data;
    } catch (directError) {
      console.error(\`直连也失败了 (code=\${code})\`, directError.message);
      throw directError;
    }
  }
}`;

const newFetchGeoJSON = `// 本地化：从本地 data/geo 目录加载行政区划数据
const geoDataCache = {};

async function fetchGeoJSON(code, timeoutMs = 10000) {
  const codeStr = String(code);
  
  // 检查缓存
  if (geoDataCache[codeStr]) {
    return geoDataCache[codeStr];
  }
  
  // 从本地加载
  const provCode = codeStr.substring(0, 2) + '0000';
  const url = \`data/geo/\${provCode}/counties.json\`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
    const data = await res.json();
    
    // 缓存整个省份数据
    geoDataCache[provCode] = data;
    
    // 如果请求的是省级数据，需要构建返回结构
    if (codeStr.endsWith('0000')) {
      // 返回省级数据，包含所有子级
      return data;
    }
    
    // 请求的是市级数据，过滤出该市的区县
    const cityFeatures = (data.features || []).filter(f => {
      const parent = f?.properties?.parent?.adcode;
      return String(parent) === codeStr || f?.properties?.adcode === codeStr;
    });
    
    return { type: 'FeatureCollection', features: cityFeatures };
  } catch (e) {
    console.warn(\`本地数据加载失败 (code=\${code})，尝试在线API...\`, e.message);
    
    // 降级：尝试在线 API
    try {
      const data = await fetchJSON(geoURL(code), timeoutMs);
      return data;
    } catch (e2) {
      console.error(\`在线API也失败\`, e2.message);
      return { type: 'FeatureCollection', features: [] };
    }
  }
}`;

// ============================================
// 2. 改进估算算法（更准确的道路系数）
// ============================================
const oldEstimate = `function estimateDriveTime(lng, lat, mode = currentTransportMode) {

  const straightDist = haversine(currentOrigin[0], currentOrigin[1], lng, lat);
  const config = TRANSPORT_CONFIG[mode] || TRANSPORT_CONFIG.car;



  let time, dist;



  switch (mode) {



    case 'car':



    case 'roundtrip':



      // 自驾：使用 OSRM 或估算



      dist = Math.round(straightDist * 1.35); // 道路系数



      time = Math.round(dist / 85 * 10) / 10; // 平均时速85km/h



      break;



    case 'motorcycle':



      // 摩托车：基于汽车时间×1.2（速度约为汽车80%）



      dist = Math.round(straightDist * 1.35);



      time = Math.round(dist / 70 * 10) / 10; // 平均时速70km/h



      break;



    case 'highspeed':



      // 高铁：直线距离/速度 + 出入站时间



      dist = Math.round(straightDist);



      time = Math.round(straightDist / config.avgSpeed * 10) / 10 + config.entryExitTime;



      break;



    case 'metro':



      // 地铁：直线距离×1.3（地铁线路不是直线）/速度



      dist = Math.round(straightDist * 1.3);



      time = Math.round(dist / config.avgSpeed * 10) / 10;



      break;



    case 'bicycle':



      // 自行车：直线距离×1.4（小路更多）/速度 + 休息时间



      dist = Math.round(straightDist * 1.4);



      const rideTime = dist / config.avgSpeed;



      const restTime = Math.floor(rideTime) * config.restTimePerHour;



      time = Math.round((rideTime + restTime) * 10) / 10;



      break;



    default:



      dist = Math.round(straightDist * 1.35);



      time = Math.round(dist / 85 * 10) / 10;



  }



  return { time, dist };



}`;

const newEstimate = `// 本地化估算算法（考虑地形、道路密度等因素）
function estimateDriveTime(lng, lat, mode = currentTransportMode) {
  const straightDist = haversine(currentOrigin[0], currentOrigin[1], lng, lat);
  const config = TRANSPORT_CONFIG[mode] || TRANSPORT_CONFIG.car;

  // 根据距离动态调整道路系数
  // 短距离：城市道路多，系数高
  // 长距离：高速比例大，系数低
  let roadFactor;
  if (straightDist < 50) {
    roadFactor = 1.45; // 城市道路，曲折多
  } else if (straightDist < 150) {
    roadFactor = 1.35; // 混合道路
  } else if (straightDist < 400) {
    roadFactor = 1.25; // 高速为主
  } else {
    roadFactor = 1.18; // 长途高速直线化
  }

  // 根据纬度调整（山区道路更曲折）
  const avgLat = (lat + currentOrigin[1]) / 2;
  const isMountainous = (avgLat > 25 && avgLat < 45 && 
    (lng > 100 && lng < 112 || // 西南山区
     lng > 105 && lng < 115 && avgLat > 30 && avgLat < 40)); // 秦岭山区
  
  if (isMountainous) {
    roadFactor *= 1.15; // 山区道路系数增加
  }

  let time, dist;

  switch (mode) {
    case 'car':
    case 'roundtrip':
      dist = Math.round(straightDist * roadFactor);
      // 根据距离调整平均速度
      let avgSpeed;
      if (straightDist < 30) avgSpeed = 45; // 城市拥堵
      else if (straightDist < 100) avgSpeed = 65; // 混合
      else if (straightDist < 300) avgSpeed = 80; // 高速为主
      else avgSpeed = 95; // 长途高速
      time = Math.round(dist / avgSpeed * 10) / 10;
      break;

    case 'motorcycle':
      dist = Math.round(straightDist * roadFactor);
      const motoSpeed = straightDist < 50 ? 40 : straightDist < 150 ? 55 : 65;
      time = Math.round(dist / motoSpeed * 10) / 10;
      break;

    case 'highspeed':
      dist = Math.round(straightDist);
      time = Math.round(straightDist / config.avgSpeed * 10) / 10 + config.entryExitTime;
      break;

    case 'metro':
      dist = Math.round(straightDist * 1.3);
      time = Math.round(dist / config.avgSpeed * 10) / 10;
      break;

    case 'bicycle':
      dist = Math.round(straightDist * 1.5);
      const rideTime = dist / config.avgSpeed;
      const restTime = Math.floor(rideTime) * config.restTimePerHour;
      time = Math.round((rideTime + restTime) * 10) / 10;
      break;

    default:
      dist = Math.round(straightDist * roadFactor);
      time = Math.round(dist / 70 * 10) / 10;
  }

  return { time, dist, estimated: true };
}`;

// ============================================
// 3. 移除 OSRM 调用逻辑
// ============================================
// 找到并删除 OSRM 批量计算的代码块

// 先替换 fetchGeoJSON
content = content.replace(oldFetchGeoJSON, newFetchGeoJSON);

// 替换估算函数
content = content.replace(oldEstimate, newEstimate);

// 移除 OSRM 相关代码（在 switchCity 函数中）
// 查找并删除 OSRM 批量计算部分
const osrmPattern = /\/\/ 9\. OSRM 批量计算真实驾车时间[\s\S]*?localStorage\.setItem\(cacheKey, JSON\.stringify\(cacheData\)\);[\s\S]*?\} catch\(e\) \{\}/;

content = content.replace(osrmPattern, `// 本地化：不调用 OSRM，直接使用估算结果
    // 估算结果已经在上面计算完成，无需额外请求
    console.log(\`使用本地估算，共 \${Object.keys(driveDataMap).length} 个区县\`);
    
    // 可选：缓存估算结果
    try {
      const cacheData = {
        data: Object.fromEntries(
          Object.entries(driveDataMap).map(([k, v]) => [k, { name: v.name, time: v.time, dist: v.dist }])
        ),
        timestamp: Date.now(),
        mode: currentTransportMode,
        estimated: true
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch(e) {}`);

// 写回文件
fs.writeFileSync(INDEX_FILE, content, 'utf-8');

console.log('✓ 本地化改造完成！');
console.log('  - fetchGeoJSON: 改为本地 data/geo 加载');
console.log('  - estimateDriveTime: 增强估算算法');
console.log('  - OSRM: 已移除调用');
console.log('');
console.log('下一步：运行 node scripts/prepare-geo-data.js 下载数据');