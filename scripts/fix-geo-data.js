#!/usr/bin/env node
/**
 * 修复行政区划数据
 * 从省级 province.json 中提取所有区县级数据
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const DATA_DIR = path.join(__dirname, '..', 'data', 'geo');
const BASE_URL = 'https://geo.datav.aliyun.com/areas_v3/bound';

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fixProvince(provCode) {
  const provDir = path.join(DATA_DIR, String(provCode));
  const countFile = path.join(provDir, 'counties.json');
  const provFile = path.join(provDir, 'province.json');
  
  // 如果已经有 counties.json 且大小合理，跳过
  if (fs.existsSync(countFile)) {
    const stat = fs.statSync(countFile);
    if (stat.size > 50000) {
      console.log(`[跳过] ${provCode} 已有完整数据`);
      return true;
    }
  }
  
  console.log(`处理省份 ${provCode}...`);
  
  try {
    // 读取省级数据
    let provData;
    if (fs.existsSync(provFile)) {
      provData = JSON.parse(fs.readFileSync(provFile, 'utf-8'));
    } else {
      // 下载省级数据
      provData = await fetchJSON(`${BASE_URL}/${provCode}_full.json`);
      fs.writeFileSync(provFile, JSON.stringify(provData));
      await sleep(300);
    }
    
    const features = provData.features || [];
    
    // 直辖市：直接过滤区县级
    if ([110000, 120000, 310000, 500000].includes(provCode)) {
      const counties = features.filter(f => f.properties?.level === 'district');
      const result = { type: 'FeatureCollection', features: counties };
      fs.writeFileSync(countFile, JSON.stringify(result));
      console.log(`  ✓ 直辖市: ${counties.length} 个区县`);
      return true;
    }
    
    // 找出所有城市
    const cities = features.filter(f => 
      f.properties?.level === 'city' || f.properties?.level === 'district'
    );
    
    console.log(`  发现 ${cities.length} 个城市/区`);
    
    let allCounties = [];
    
    for (const city of cities) {
      const cityCode = city.properties.adcode;
      const cityName = city.properties.name;
      
      // 如果已经是区县级（如东莞、中山）
      if (city.properties.level === 'district') {
        allCounties.push(city);
        continue;
      }
      
      try {
        await sleep(200);
        const cityData = await fetchJSON(`${BASE_URL}/${cityCode}_full.json`);
        const counties = (cityData.features || []).filter(f => 
          f.properties?.level === 'district'
        );
        allCounties = allCounties.concat(counties);
        console.log(`  ${cityName}: ${counties.length} 个区县`);
      } catch (e) {
        console.log(`  ${cityName}: 下载失败 - ${e.message}`);
      }
    }
    
    // 保存结果
    const result = { type: 'FeatureCollection', features: allCounties };
    fs.writeFileSync(countFile, JSON.stringify(result));
    console.log(`  ✓ 共 ${allCounties.length} 个区县`);
    return true;
  } catch (e) {
    console.log(`  ✗ 失败: ${e.message}`);
    return false;
  }
}

async function main() {
  console.log('=== 修复行政区划数据 ===\n');
  
  // 获取所有省份目录
  const dirs = fs.readdirSync(DATA_DIR)
    .filter(f => {
      const stat = fs.statSync(path.join(DATA_DIR, f));
      return stat.isDirectory() && /^\d{6}$/.test(f);
    })
    .map(f => parseInt(f));
  
  console.log(`发现 ${dirs.length} 个省份目录\n`);
  
  for (const code of dirs) {
    await fixProvince(code);
  }
  
  // 重新生成索引
  console.log('\n生成索引...');
  const provinces = dirs.map(code => {
    const countFile = path.join(DATA_DIR, String(code), 'counties.json');
    try {
      const data = JSON.parse(fs.readFileSync(countFile, 'utf-8'));
      return { code, countyCount: data.features?.length || 0 };
    } catch (e) {
      return { code, countyCount: 0 };
    }
  }).filter(p => p.countyCount > 0);
  
  const index = { provinces, generated: new Date().toISOString() };
  fs.writeFileSync(path.join(DATA_DIR, 'index.json'), JSON.stringify(index, null, 2));
  
  console.log(`✓ 完成: ${provinces.length} 个省份`);
}

main().catch(console.error);