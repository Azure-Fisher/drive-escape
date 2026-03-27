# 🚗 Drive Escape — 周末出行地图

**🌐 在线预览** → [escape.blucy.top](https://escape.blucy.top)

选择城市，看看你能走多远。

**Forked from** → [qiaoshouqing/drive-escape](https://github.com/qiaoshouqing/drive-escape)

**Author** → [@benshandebiao](https://x.com/benshandebiao)

🌐 [简体中文](./README_ZH.md) | [繁體中文](./README_TW.md) | [日本語](./README_JA.md)

---

## ✨ 功能特性

- 🔍 搜索全球任意城市，即时生成出行时间热力图
- 🗺️ 区县级别边界，10 级色阶（绿 → 红）
- 🏷️ 每个区县标注名称、时间、距离
- ⏱️ 真实出行时间计算 + 本地缓存秒开
- 🌏 国际支持（日本、欧洲、澳洲、台湾等）
- 📱 移动端友好，多语言支持

## 🚀 多种出行方式

| 方式 | 时长 | 计算方式 |
|------|------|----------|
| 🚗 自驾 | 5 小时 | OSRM 道路时间 |
| 🏍️ 摩托车 | 4 小时 | 道路时间 × 1.2 |
| 🚄 高铁 | 5 小时 | 直线距离 / 250km/h + 1h 出入站 |
| 🚇 地铁 | 3 小时 | 仅限有地铁城市 |
| 🚲 自行车 | 4 小时 | 15km/h + 每小时 15 分钟休息 |
| 🔄 往返 | 单程 4 小时 | 自驾往返模式 |

## 🛠️ 技术栈

| 组件 | 方案 |
|------|------|
| 地图渲染 | Leaflet + OpenStreetMap |
| 中国边界 | DataV GeoJSON API |
| 国际边界 | Overpass API |
| 驾车时间 | OSRM Table API |
| 城市搜索 | Nominatim API |
| 托管 | Cloudflare Pages + Functions |

零付费 API，完全开源。

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
| v2.0 | `27fbbf6` | MD3 设计风格 + 多出行方式 |
| v1.1 | `8f1cf9b` | 多出行方式 + 代理降级机制 |
| v1.0 | 原版 | 基础自驾功能 |

## 🎨 设计规范

本项目采用 [Material Design 3](https://m3.material.io/) 设计规范：
- 语义化颜色系统 + 深色模式支持
- MD3 标准形状（圆角）
- 5 级阴影系统
- 弹性动效曲线
- MD3 组件风格（Card、Select、Chip 等）

## 📄 许可证

MIT