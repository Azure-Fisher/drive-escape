#!/bin/bash
# 下载全国行政区划数据
# 用法: bash scripts/download-geo.sh

DATA_DIR="data/geo"
BASE_URL="https://geo.datav.aliyun.com/areas_v3/bound"

# 直辖市（省级 _full 直接返回区县）
DIRECT_MUNICIPALITIES="110000 120000 310000 500000"

mkdir -p "$DATA_DIR"

echo "=== 开始下载行政区划数据 ==="
echo "数据目录: $DATA_DIR"
echo ""

# 直辖市
for code in $DIRECT_MUNICIPALITIES; do
    dir="$DATA_DIR/$code"
    file="$dir/counties.json"
    
    if [ -f "$file" ] && [ $(wc -c < "$file") -gt 10000 ]; then
        echo "[跳过] $code 直辖市数据已存在"
        continue
    fi
    
    mkdir -p "$dir"
    echo -n "下载直辖市 $code... "
    curl -s "$BASE_URL/${code}_full.json" -H "User-Agent: Mozilla/5.0" -o "$file"
    if [ -f "$file" ] && [ $(wc -c < "$file") -gt 1000 ]; then
        echo "✓ ($(wc -c < "$file") bytes)"
    else
        echo "✗ 失败"
    fi
    sleep 0.5
done

# 普通省份列表
PROVINCES="
330000:浙江
340000:安徽
350000:福建
360000:江西
370000:山东
410000:河南
420000:湖北
430000:湖南
440000:广东
450000:广西
460000:海南
510000:四川
520000:贵州
530000:云南
610000:陕西
"

# 下载普通省份
for entry in $PROVINCES; do
    code=$(echo $entry | cut -d: -f1)
    name=$(echo $entry | cut -d: -f2)
    
    dir="$DATA_DIR/$code"
    file="$dir/counties.json"
    
    if [ -f "$file" ] && [ $(wc -c < "$file") -gt 500000 ]; then
        echo "[跳过] $name 数据已存在"
        continue
    fi
    
    mkdir -p "$dir"
    echo "处理省份: $name ($code)"
    
    # 1. 下载省级数据获取城市列表
    prov_file="$dir/province.json"
    curl -s "$BASE_URL/${code}_full.json" -H "User-Agent: Mozilla/5.0" -o "$prov_file"
    sleep 0.3
    
    if [ ! -f "$prov_file" ] || [ $(wc -c < "$prov_file") -lt 1000 ]; then
        echo "  ✗ 省级数据下载失败"
        continue
    fi
    
    # 2. 提取城市代码列表 (使用 node 处理 JSON)
    city_codes=$(node -e "
        const fs = require('fs');
        const data = JSON.parse(fs.readFileSync('$prov_file', 'utf-8'));
        const cities = (data.features || [])
            .filter(f => f.properties.level === 'city' || f.properties.level === 'district')
            .map(f => f.properties.adcode);
        console.log(cities.join(' '));
    " 2>/dev/null)
    
    if [ -z "$city_codes" ]; then
        echo "  ✗ 无法提取城市列表"
        continue
    fi
    
    echo "  发现 $(echo $city_codes | wc -w) 个城市"
    
    # 3. 下载每个城市的区县数据并合并
    all_counties="[]"
    city_count=0
    
    for city_code in $city_codes; do
        city_file="$dir/city_${city_code}.json"
        
        # 检查是否是区县级（如东莞、中山）
        city_level=$(node -e "
            const fs = require('fs');
            try {
                const data = JSON.parse(fs.readFileSync('$prov_file', 'utf-8'));
                const city = data.features.find(f => f.properties.adcode === $city_code);
                console.log(city?.properties?.level || 'city');
            } catch(e) { console.log('city'); }
        " 2>/dev/null)
        
        if [ "$city_level" = "district" ]; then
            # 直接是区县级，从省级数据提取
            county=$(node -e "
                const fs = require('fs');
                const data = JSON.parse(fs.readFileSync('$prov_file', 'utf-8'));
                const f = data.features.find(f => f.properties.adcode === $city_code);
                if (f) console.log(JSON.stringify(f));
            " 2>/dev/null)
            
            if [ -n "$county" ]; then
                all_counties=$(node -e "
                    const arr = $all_counties;
                    arr.push($county);
                    console.log(JSON.stringify(arr));
                " 2>/dev/null)
                city_count=$((city_count + 1))
            fi
            continue
        fi
        
        # 下载城市数据
        curl -s "$BASE_URL/${city_code}_full.json" -H "User-Agent: Mozilla/5.0" -o "$city_file" 2>/dev/null
        sleep 0.2
        
        if [ -f "$city_file" ] && [ $(wc -c < "$city_file") -gt 1000 ]; then
            # 提取区县
            counties=$(node -e "
                const fs = require('fs');
                try {
                    const data = JSON.parse(fs.readFileSync('$city_file', 'utf-8'));
                    const counties = (data.features || []).filter(f => f.properties.level === 'district');
                    console.log(JSON.stringify(counties));
                } catch(e) { console.log('[]'); }
            " 2>/dev/null)
            
            if [ "$counties" != "[]" ] && [ -n "$counties" ]; then
                all_counties=$(node -e "
                    const arr = $all_counties;
                    const newCounties = $counties;
                    console.log(JSON.stringify(arr.concat(newCounties)));
                " 2>/dev/null)
                city_count=$((city_count + 1))
            fi
        fi
        
        rm -f "$city_file"
        
        # 进度
        if [ $((city_count % 5)) -eq 0 ]; then
            echo -n "."
        fi
    done
    
    echo ""
    
    # 4. 保存合并后的区县数据
    node -e "
        const fs = require('fs');
        const counties = $all_counties;
        const result = { type: 'FeatureCollection', features: counties };
        fs.writeFileSync('$file', JSON.stringify(result));
        console.log('  ✓ 保存 ' + counties.length + ' 个区县');
    " 2>/dev/null
    
    # 清理临时文件
    rm -f "$dir/city_"*.json
    
    echo ""
    sleep 1
done

# 生成索引
echo "生成索引文件..."
node -e "
    const fs = require('fs');
    const path = require('path');
    const dir = '$DATA_DIR';
    const provinces = fs.readdirSync(dir)
        .filter(f => fs.statSync(path.join(dir, f)).isDirectory())
        .map(code => {
            const file = path.join(dir, code, 'counties.json');
            try {
                const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
                return { code: parseInt(code), countyCount: data.features?.length || 0 };
            } catch(e) {
                return null;
            }
        })
        .filter(Boolean);
    
    const index = { provinces, generated: new Date().toISOString() };
    fs.writeFileSync(path.join(dir, 'index.json'), JSON.stringify(index, null, 2));
    console.log('✓ 索引已生成: ' + provinces.length + ' 个省份');
"

echo ""
echo "=== 下载完成 ==="
echo "数据位于: $DATA_DIR"