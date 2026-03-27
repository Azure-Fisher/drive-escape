# 🚗 周末出行计划

**Fork 自** → [qiaoshouqing/drive-escape](https://github.com/qiaoshouqing/drive-escape)

**原作者** → [@benshandebiao](https://x.com/benshandebiao)

🌐 [简体中文](./README_ZH.md) | [繁體中文](./README_TW.md) | [日本語](./README_JA.md)

---

## ✨ 功能特性

- 🔍 搜索全球任意城市，即时生成出行时间热力图
- 🗺️ 区县级别边界，10 级色阶（绿 → 红）
- 🏷️ 每个区县标注名称、时间、距离
- ⏱️ 本地估算算法 + 离线可用
- 🌏 国际支持（日本、欧洲、澳洲、台湾等）
- 📱 移动端友好，多语言支持

## 🚀 多种出行方式

| 方式 | 时长 | 计算方式 |
|------|------|----------|
| 🚗 自驾 | 5 小时 | 本地估算算法 |
| 🏍️ 摩托车 | 4 小时 | 道路时间 × 1.2 |
| 🚄 高铁 | 5 小时 | 直线距离 / 250km/h + 1h 出入站 |
| 🚇 地铁 | 3 小时 | 仅限有地铁城市 |
| 🚲 自行车 | 4 小时 | 15km/h + 每小时 15 分钟休息 |
| 🔄 往返 | 单程 4 小时 | 自驾往返模式 |

## 🛠️ 技术栈

| 组件 | 方案 |
|------|------|
| 地图渲染 | Leaflet + OpenStreetMap |
| 中国边界 | 本地 GeoJSON 数据 |
| 国际边界 | Overpass API |
| 驾车时间 | 本地估算算法 |
| 城市搜索 | Nominatim API |
| 托管 | Cloudflare Pages |

**零付费 API，完全开源，支持离线运行。**

## 📦 本地运行

```bash
git clone https://github.com/Azure-Fisher/drive-escape.git
cd drive-escape
python3 -m http.server 8080
# 打开 http://localhost:8080
```

## 🚀 部署

```bash
wrangler pages deploy . --project-name drive-escape
```

## 📋 版本记录

| 版本 | Commit | 说明 |
|------|--------|------|
| v3.0 | `d4baea4` | 本地化改造：行政区划本地化 + 估算算法优化 |
| v2.0 | `27fbbf6` | MD3 设计风格 + 多出行方式 |
| v1.1 | `8f1cf9b` | 多出行方式 + 代理降级机制 |
| v1.0 | 原版 | 基础自驾功能 |

### v3.0 更新详情

**行政区划本地化**
- 预置 20 个省份、约 1600 个区县的边界数据
- 从本地 `data/geo/` 目录加载，无需网络请求
- 加载速度从 5-15s 降至 <100ms

**本地估算算法**
- 根据距离动态调整道路系数（城市 1.45 / 长途 1.18）
- 考虑山区地形因素（西南、秦岭区域自动调整）
- 根据距离调整平均速度（城市拥堵 42km/h / 长途高速 92km/h）

**完全离线可用**
- 移除 OSRM API 依赖
- 移除 DataV API 依赖
- 仅城市搜索需要网络（可预置热门城市）

## 🎨 设计规范

本项目采用 [Material Design 3](https://m3.material.io/) 设计规范：
- 语义化颜色系统 + 深色模式支持
- MD3 标准形状（圆角）
- 5 级阴影系统
- 弹性动效曲线
- MD3 组件风格（Card、Select、Chip 等）

## 📄 许可证

MIT
