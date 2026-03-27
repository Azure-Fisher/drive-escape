#!/usr/bin/env node
/**
 * 下载全国行政区划数据到本地
 * 使用方法: node scripts/prepare-geo-data.js
 * 
 * 数据来源: DataV GeoJSON API (阿里云)
 * 输出: data/geo/{省份adcode}/counties.json
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const DATA_DIR = path.join(__dirname, '..', 'data', 'geo');
const BASE_URL = 'https://geo.datav.aliyun.com/areas_v3/bound';

// 省级行政区划代码
const PROVINCES = [
  { code: 110000, name: '北京市' },
  { code: 120000, name: '天津市' },
  { code: 130000, name: '河北省' },
  { code: 140000, name: '山西省' },
  { code: 150000, name: '内蒙古' },
  { code: 210000, name: '辽宁省' },
  { code: 220000, name: '吉林省' },
  { code: 230000, name: '黑龙江省' },
  { code: 310000, name: '上海市' },
  { code: 320000, name: '江苏省' },
  { code: 330000, name: '浙江省' },
  { code: 340000, name: '安徽省' },
  { code: 350000, name: '福建省' },
  { code: 360000, name: '江西省' },
  { code: 370000, name: '山东省' },
  { code: 410000, name: '河南省' },
  { code: 420000, name: '湖北省' },
  { code: 430000, name: '湖南省' },
  { code: 440000, name: '广东省' },
  { code: 450000, name: '广西' },
  { code: 460000, name: '海南省' },
  { code: 500000, name: '重庆市' },
  { code: 510000, name: '四川省' },
  { code: 520000, name: '贵州省' },
  { code: 530000, name: '云南省' },
  { code: 540000, name: '西藏' },
  { code: 610000, name: '陕西省' },
  { code: 620000, name: '甘肃省' },
  { code: 630000, name: '青海省' },
  { code: 640000, name: '宁夏' },
  { code: 650000, name: '新疆' },
  { code: 710000, name: '台湾省' },
  { code: 810000, name: '香港' },
  { code: 820000, name: '澳门' }
];

// 直辖市（省级 _full 直接返回区级）
const DIRECT_MUNICIPALITIES = new Set([110000, 120000, 310000, 500000]);

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Timeout'));
    }, 30000);

    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://datav.aliyun.com/'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        clearTimeout(timeout);
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', (e) => {
      clearTimeout(timeout);
      reject(e);
    });
  });
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function downloadProvince(prov) {
  const provDir = path.join(DATA_DIR, String(prov.code));
  
  // 检查是否已存在
  const countFile = path.join(provDir, 'counties.json');
  if (fs.existsSync(countFile)) {
    const stat = fs.statSync(countFile);
    if (stat.size > 10000) {
      console.log(`[跳过] ${prov.name} 已存在`);
      return;
    }
  }

  console.log(`[下载] ${prov.name} (${prov.code})...`);
  
  try {
    // 创建目录
    if (!fs.existsSync(provDir)) {
      fs.mkdirSync(provDir, { recursive: true });
    }

    if (DIRECT_MUNICIPALITIES.has(prov.code)) {
      // 直辖市：直接下载 _full.json
      const url = `${BASE_URL}/${prov.code}_full.json`;
      const data = await fetchJSON(url);
      
      // 提取区县数据
      const counties = {
        type: 'FeatureCollection',
        features: data.features || []
      };
      
      fs.writeFileSync(countFile, JSON.stringify(counties));
      console.log(`  ✓ ${prov.name}: ${counties.features.length} 个区县`);
    } else {
      // 普通省份：下载省级数据获取市级列表
      const provUrl = `${BASE_URL}/${prov.code}_full.json`;
      const provData = await fetchJSON(provUrl);
      
      if (!provData.features || provData.features.length === 0) {
        console.log(`  ✗ ${prov.name}: 无数据`);
        return;
      }

      // 过滤出市级（level === 'city' 或 'district' 但 parent 是省级）
      const cities = provData.features.filter(f => {
        const level = f.properties?.level;
        return level === 'city' || level === 'district';
      });

      console.log(`  发现 ${cities.length} 个城市，开始下载区县...`);

      // 保存省级边界
      fs.writeFileSync(path.join(provDir, 'province.json'), JSON.stringify(provData));

      // 收集所有区县
      let allCounties = [];
      
      for (let i = 0; i < cities.length; i++) {
        const city = cities[i];
        const cityCode = city.properties.adcode;
        const cityName = city.properties.name;
        
        // 如果市级本身就是区县级（如东莞、中山），直接使用
        if (city.properties.level === 'district') {
          allCounties.push(city);
          continue;
        }

        try {
          await sleep(200); // 避免请求过快
          
          const cityUrl = `${BASE_URL}/${cityCode}_full.json`;
          const cityData = await fetchJSON(cityUrl);
          
          if (cityData.features) {
            const counties = cityData.features.filter(f => 
              f.properties?.level === 'district'
            );
            allCounties = allCounties.concat(counties);
            console.log(`    ${cityName}: ${counties.length} 个区县 (${i+1}/${cities.length})`);
          }
        } catch (e) {
          console.log(`    ${cityName}: 下载失败 - ${e.message}`);
        }
      }

      // 保存所有区县
      const countiesCollection = {
        type: 'FeatureCollection',
        features: allCounties
      };
      
      fs.writeFileSync(countFile, JSON.stringify(countiesCollection));
      console.log(`  ✓ ${prov.name}: 共 ${allCounties.length} 个区县`);
    }
  } catch (e) {
    console.log(`  ✗ ${prov.name}: ${e.message}`);
  }
}

async function generateIndex() {
  console.log('\n[生成索引文件]');
  
  const index = {
    provinces: [],
    generated: new Date().toISOString()
  };

  for (const prov of PROVINCES) {
    const provDir = path.join(DATA_DIR, String(prov.code));
    const countFile = path.join(provDir, 'counties.json');
    
    if (fs.existsSync(countFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(countFile, 'utf-8'));
        index.provinces.push({
          code: prov.code,
          name: prov.name,
          countyCount: data.features?.length || 0
        });
      } catch (e) {}
    }
  }

  fs.writeFileSync(
    path.join(DATA_DIR, 'index.json'),
    JSON.stringify(index, null, 2)
  );

  console.log(`✓ 索引已生成: ${index.provinces.length} 个省份`);
}

async function main() {
  console.log('=== 行政区划数据下载工具 ===\n');
  console.log(`数据目录: ${DATA_DIR}\n`);

  // 创建数据目录
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // 下载所有省份
  for (const prov of PROVINCES) {
    await downloadProvince(prov);
    await sleep(500); // 省份间间隔
  }

  // 生成索引
  await generateIndex();

  console.log('\n=== 完成 ===');
}

main().catch(console.error);