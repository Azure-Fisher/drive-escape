#!/usr/bin/env node
// 预生成城市数据脚本
// 用法: node scripts/generate-preset.js <cityName> <lng> <lat> <outputFile>
// 例如: node scripts/generate-preset.js 上海 121.47 31.23 data/shanghai.json

const https = require('https');
const fs = require('fs');
const path = require('path');

const [,, cityName, lngStr, latStr, outputFile] = process.argv;
if (!cityName || !lngStr || !latStr || !outputFile) {
  console.error('Usage: node generate-preset.js <cityName> <lng> <lat> <outputFile>');
  process.exit(1);
}
const originLng = parseFloat(lngStr);
const originLat = parseFloat(latStr);

function fetch(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'DriveEscape/1.0' } }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { reject(new Error('JSON parse error: ' + data.slice(0, 100))); }
      });
    });
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('timeout: ' + url)); });
  });
}

function haversine(lng1, lat1, lng2, lat2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function estimateDriveTime(lng, lat) {
  const dist = haversine(originLng, originLat, lng, lat);
  const roadDist = Math.round(dist * 1.35);
  const time = Math.round(roadDist / 85 * 10) / 10;
  return { time, dist: roadDist };
}

const PROVINCES = [
  { code: 110000, center: [116.41, 39.92] },
  { code: 120000, center: [117.19, 39.13] },
  { code: 130000, center: [114.50, 38.04] },
  { code: 140000, center: [112.57, 37.87] },
  { code: 150000, center: [111.77, 40.82] },
  { code: 210000, center: [123.43, 41.80] },
  { code: 220000, center: [125.33, 43.90] },
  { code: 230000, center: [126.64, 45.76] },
  { code: 310000, center: [121.47, 31.23] },
  { code: 320000, center: [118.76, 32.07] },
  { code: 330000, center: [120.15, 30.26] },
  { code: 340000, center: [117.28, 31.86] },
  { code: 350000, center: [119.30, 26.08] },
  { code: 360000, center: [115.89, 28.68] },
  { code: 370000, center: [117.00, 36.67] },
  { code: 410000, center: [113.66, 34.76] },
  { code: 420000, center: [114.31, 30.52] },
  { code: 430000, center: [112.98, 28.11] },
  { code: 440000, center: [113.26, 23.13] },
  { code: 450000, center: [108.37, 22.82] },
  { code: 460000, center: [110.35, 20.02] },
  { code: 500000, center: [106.55, 29.56] },
  { code: 510000, center: [104.07, 30.67] },
  { code: 520000, center: [106.71, 26.57] },
  { code: 530000, center: [102.71, 25.05] },
  { code: 540000, center: [91.13, 29.66] },
  { code: 610000, center: [108.95, 34.27] },
  { code: 620000, center: [103.82, 36.06] },
  { code: 630000, center: [101.78, 36.62] },
  { code: 640000, center: [106.27, 38.47] },
  { code: 650000, center: [87.62, 43.79] },
];

const DIRECT = new Set([110000, 120000, 310000, 500000]);

async function loadCity(code) {
  const url = `https://geo.datav.aliyun.com/areas_v3/bound/${code}_full.json`;
  try {
    return await fetch(url);
  } catch(e) {
    console.warn(`  warn: failed to load ${code}: ${e.message}`);
    return null;
  }
}

async function fetchOSRM(destinations) {
  const batchSize = 50;
  const results = {};
  for (let i = 0; i < destinations.length; i += batchSize) {
    const batch = destinations.slice(i, i + batchSize);
    const coords = `${originLng},${originLat};` + batch.map(d => `${d.lng},${d.lat}`).join(';');
    const destIdx = batch.map((_,j) => j+1).join(';');
    const url = `https://router.project-osrm.org/table/v1/driving/${coords}?sources=0&destinations=${destIdx}&annotations=duration,distance`;
    try {
      const data = await fetch(url);
      if (data.code === 'Ok') {
        batch.forEach((d, j) => {
          const t = data.durations[0][j];
          const dist = data.distances[0][j];
          if (t != null && t > 0) {
            results[d.adcode] = { name: d.name, time: Math.round(t/360)/10, dist: Math.round(dist/1000), estimated: false };
          }
        });
      }
    } catch(e) {
      console.warn(`  OSRM batch failed: ${e.message}`);
    }
    process.stdout.write(`  OSRM: ${Math.min(i+batchSize, destinations.length)}/${destinations.length}\r`);
  }
  console.log('');
  return results;
}

async function main() {
  console.log(`生成 ${cityName} (${originLng}, ${originLat}) 的预设数据...`);
  
  const allFeatures = [];
  const driveDataMap = {};

  // 找附近省份
  const nearProvinces = PROVINCES.filter(p => haversine(originLng, originLat, p.center[0], p.center[1]) < 800);
  console.log(`附近省份: ${nearProvinces.map(p=>p.code).join(', ')}`);

  for (const prov of nearProvinces) {
    process.stdout.write(`加载省 ${prov.code}...`);
    const json = await loadCity(prov.code);
    if (!json) continue;
    const features = json.features || [];
    const cities = features.filter(f => Number(f?.properties?.adcode) !== prov.code);

    if (DIRECT.has(prov.code)) {
      for (const f of features) {
        const code = String(f?.properties?.adcode || '');
        if (code === String(prov.code)) continue;
        const center = f?.properties?.centroid || f?.properties?.center;
        if (!center) continue;
        const est = estimateDriveTime(center[0], center[1]);
        allFeatures.push(f);
        driveDataMap[code] = { name: f?.properties?.name || '', ...est, estimated: true };
      }
    } else {
      for (const city of cities) {
        const cityCode = city?.properties?.adcode;
        if (!cityCode) continue;
        const cityJson = await loadCity(cityCode);
        if (!cityJson) continue;
        const counties = (cityJson.features || []).filter(f => Number(f?.properties?.adcode) !== cityCode);
        const toAdd = counties.length > 0 ? counties : [city];
        for (const f of toAdd) {
          const code = String(f?.properties?.adcode || '');
          const center = f?.properties?.centroid || f?.properties?.center;
          if (!center) continue;
          const est = estimateDriveTime(center[0], center[1]);
          allFeatures.push(f);
          driveDataMap[code] = { name: f?.properties?.name || '', ...est, estimated: true };
        }
      }
    }
    console.log(` ✓ (${allFeatures.length} features so far)`);
  }

  console.log(`总区划: ${allFeatures.length}，开始 OSRM 计算...`);

  // 过滤出可能到达的目的地（5小时内估算）
  const destinations = allFeatures
    .filter(f => {
      const d = driveDataMap[String(f?.properties?.adcode || '')];
      return d && d.time <= 5;
    })
    .map(f => ({
      adcode: String(f.properties.adcode),
      lng: (f.properties.centroid || f.properties.center)[0],
      lat: (f.properties.centroid || f.properties.center)[1],
      name: f.properties.name || ''
    }));

  console.log(`需要 OSRM 计算: ${destinations.length} 个`);
  const osrmData = await fetchOSRM(destinations);
  
  // 合并 OSRM 结果
  Object.assign(driveDataMap, osrmData);

  const output = { features: allFeatures, driveData: driveDataMap };
  const outPath = path.resolve(outputFile);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(output));
  console.log(`✅ 已保存到 ${outPath} (${(fs.statSync(outPath).size/1024/1024).toFixed(1)}MB)`);
}

main().catch(e => { console.error(e); process.exit(1); });
