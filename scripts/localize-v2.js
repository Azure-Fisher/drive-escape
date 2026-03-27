#!/usr/bin/env node
/**
 * 精确本地化改造脚本 v2
 * 使用字符串分割和替换，避免正则问题
 */

const fs = require('fs');
const path = require('path');

const INDEX_FILE = path.join(__dirname, '..', 'index.html');
let content = fs.readFileSync(INDEX_FILE, 'utf-8');

console.log('开始精确修改...\n');

// ============================================
// 1. 替换 fetchGeoJSON 函数
// ============================================
console.log('1. 替换 fetchGeoJSON 函数...');

const newFetchGeoJSON = `// 本地化：从本地 data/geo 目录加载行政区划数据
const geoDataCache = {};

async function fetchGeoJSON(code, timeoutMs = 10000) {
  const codeStr = String(code);
  
  // 检查缓存
  if (geoDataCache[codeStr]) {
    return geoDataCache[codeStr];
  }
  
  // 省级代码
  const provCode = codeStr.substring(0, 2) + '0000';
  const localUrl = \`data/geo/\${provCode}/counties.json\`;
  
  try {
    const res = await fetch(localUrl);
    if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
    const data = await res.json();
    
    // 缓存整个省份数据
    geoDataCache[provCode] = data;
    
    // 如果请求的是省级数据
    if (codeStr.endsWith('0000')) {
      return data;
    }
    
    // 请求的是市级数据，过滤出该市的区县
    const cityFeatures = (data.features || []).filter(f => {
      const parent = f?.properties?.parent?.adcode;
      return String(parent) === codeStr || String(f?.properties?.adcode).startsWith(codeStr.substring(0, 4));
    });
    
    return { type: 'FeatureCollection', features: cityFeatures };
  } catch (e) {
    console.warn(\`本地数据加载失败 (code=\${code})，尝试在线API...\`, e.message);
    
    // 降级：尝试在线 API
    try {
      if (typeof geoURL === 'function') {
        return await fetchJSON(geoURL(code), timeoutMs);
      }
    } catch (e2) {
      console.error(\`在线API也失败\`, e2.message);
    }
    return { type: 'FeatureCollection', features: [] };
  }
}`;

// 找到旧函数的开始和结束标记
const startMarker = '// 带降级的 GeoJSON 获取（代理失败时尝试直连）';
const endMarker = '// // 并发控制：最多同时 N 个请求';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + newFetchGeoJSON + '\n\n' + content.substring(endIndex);
  console.log('   ✓ fetchGeoJSON 已替换');
} else {
  console.log('   ✗ 未找到 fetchGeoJSON 函数标记');
}

// ============================================
// 2. 增强估算算法
// ============================================
console.log('2. 增强估算算法...');

const newEstimate = `function estimateDriveTime(lng, lat, mode = currentTransportMode) {
  const straightDist = haversine(currentOrigin[0], currentOrigin[1], lng, lat);
  const config = TRANSPORT_CONFIG[mode] || TRANSPORT_CONFIG.car;

  // 根据距离动态调整道路系数
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

  // 根据经纬度判断是否山区（道路更曲折）
  const avgLat = (lat + currentOrigin[1]) / 2;
  const isMountainous = (avgLat > 25 && avgLat < 45 && 
    (lng > 100 && lng < 112)) || // 西南山区
    (lng > 105 && lng < 115 && avgLat > 30 && avgLat < 40); // 秦岭
  
  if (isMountainous && mode !== 'highspeed') {
    roadFactor *= 1.12;
  }

  let time, dist;

  switch (mode) {
    case 'car':
    case 'roundtrip':
      dist = Math.round(straightDist * roadFactor);
      // 根据距离调整平均速度
      let avgSpeed;
      if (straightDist < 30) avgSpeed = 42; // 城市拥堵
      else if (straightDist < 100) avgSpeed = 62; // 混合
      else if (straightDist < 300) avgSpeed = 78; // 高速为主
      else avgSpeed = 92; // 长途高速
      time = Math.round(dist / avgSpeed * 10) / 10;
      break;

    case 'motorcycle':
      dist = Math.round(straightDist * roadFactor);
      const motoSpeed = straightDist < 50 ? 38 : straightDist < 150 ? 52 : 62;
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

// 找到旧估算函数
const estStartMarker = 'function estimateDriveTime(lng, lat, mode = currentTransportMode)';
const estEndMarker = 'return { time, dist }';

const estStartIndex = content.indexOf(estStartMarker);
let estEndIndex = content.indexOf(estEndMarker, estStartIndex);

if (estStartIndex !== -1 && estEndIndex !== -1) {
  // 找到函数结束的 }
  estEndIndex = content.indexOf('}', estEndIndex + estEndMarker.length);
  
  content = content.substring(0, estStartIndex) + newEstimate + '\n' + content.substring(estEndIndex + 1);
  console.log('   ✓ estimateDriveTime 已替换');
} else {
  console.log('   ✗ 未找到 estimateDriveTime 函数');
}

// ============================================
// 3. 移除 OSRM 批量计算
// ============================================
console.log('3. 移除 OSRM 批量计算...');

// 找到 OSRM 调用部分
const osrmStartMarker = '// 9. OSRM 批量计算真实驾车时间';
const osrmEndMarker = 'localStorage.setItem(cacheKey, JSON.stringify(cacheData));';

const osrmStartIndex = content.indexOf(osrmStartMarker);
const osrmEndIndex = content.indexOf(osrmEndMarker, osrmStartIndex);

if (osrmStartIndex !== -1 && osrmEndIndex !== -1) {
  // 找到完整的代码块结束位置
  let braceCount = 0;
  let i = osrmEndIndex + osrmEndMarker.length;
  let foundEnd = false;
  
  // 查找结束的 }
  while (i < content.length) {
    if (content[i] === '{') braceCount++;
    if (content[i] === '}') {
      if (braceCount === 0) {
        foundEnd = true;
        break;
      }
      braceCount--;
    }
    i++;
  }
  
  const osrmReplacement = `// 本地化：跳过 OSRM，直接使用估算结果
    console.log(\`使用本地估算完成，共 \${Object.keys(driveDataMap).length} 个区县\`);
    
    // 缓存估算结果
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
    } catch(e) {}`;
  
  if (foundEnd) {
    content = content.substring(0, osrmStartIndex) + osrmReplacement + content.substring(i + 1);
    console.log('   ✓ OSRM 批量计算已移除');
  }
} else {
  console.log('   ✗ 未找到 OSRM 批量计算代码');
}

// ============================================
// 4. 注释掉 fetchOSRMBatch 函数
// ============================================
console.log('4. 注释 fetchOSRMBatch 函数...');

const osrmFuncStart = 'async function fetchOSRMBatch';
const osrmFuncEnd = '// ── 渲染地图 ──';

const funcStartIndex = content.indexOf(osrmFuncStart);
const funcEndIndex = content.indexOf(osrmFuncEnd);

if (funcStartIndex !== -1 && funcEndIndex !== -1) {
  const funcContent = content.substring(funcStartIndex, funcEndIndex);
  const commentedFunc = '// 已禁用（本地化）:\n/*\n' + funcContent + '\n*/\n\n';
  content = content.substring(0, funcStartIndex) + commentedFunc + content.substring(funcEndIndex);
  console.log('   ✓ fetchOSRMBatch 已注释');
}

// 写回文件
fs.writeFileSync(INDEX_FILE, content, 'utf-8');

console.log('\n✓ 本地化改造完成！');
console.log('\n下一步: node scripts/prepare-geo-data.js');