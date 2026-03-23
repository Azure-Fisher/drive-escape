<div align="center">

# 🚗 周末逃离计划

**选一个城市，一眼看清你的出行范围**

[![Live Demo](https://img.shields.io/badge/在线体验-drive--escape.pomodiary.com-1a6e5c?style=for-the-badge)](https://drive-escape.pomodiary.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)
[![Stars](https://img.shields.io/github/stars/Azure-Fisher/drive-escape?style=flat-square&color=yellow)](https://github.com/Azure-Fisher/drive-escape/stargazers)


</div>

---

## ✨ 功能亮点

| 功能 | 描述 |
|:----:|------|
| 🔍 **智能搜索** | 搜索任意城市或地址，自动定位 |
| 🚗🚄🚴 **多出行方式** | 支持驾车、高铁、骑行三种模式 |
| 🗺️ **热力地图** | 区县级精度，10档色阶可视化 |
| ⏱️ **真实时间** | OSRM 驾车时间 + 智能估算 |
| 🌏 **全球支持** | 国内城市 + 海外城市全覆盖 |
| 📱 **响应式设计** | 完美适配手机和桌面端 |
| 🌐 **多语言** | 简中 / 繁中 / English / 日本語 |

---

## 🛠️ 技术栈

<table>
<tr>
<td width="50%">

### 前端
- **地图引擎**: Leaflet.js
- **地图数据**: OpenStreetMap
- **UI设计**: Material Design 3

</td>
<td width="50%">

### 数据源
- **中国区划**: DataV GeoJSON API
- **海外区划**: Overpass API
- **驾车时间**: OSRM Table API
- **地理搜索**: Nominatim API

</td>
</tr>
</table>

**部署**: Cloudflare Pages + Functions

> 💡 全部使用开源免费 API，无任何付费接口

---

## 🚀 快速开始

### 本地运行

```bash
# 方式一：直接打开
open index.html

# 方式二：本地服务器
python3 -m http.server 8080
# 访问 http://localhost:8080
```

### 部署到 Cloudflare Pages

```bash
# 安装 wrangler
npm install -g wrangler

# 部署
wrangler pages deploy . --project-name drive-escape
```

---

## 📖 多语言文档

| Language | Link |
|:--------:|------|
| 简体中文 | [README.md](./README.md) |
| 繁體中文 | [README_TW.md](./README_TW.md) |
| English | [README_EN.md](./README_EN.md) |
| 日本語 | [README_JA.md](./README_JA.md) |

---

## 🤝 致谢

- 原作者: [@benshandebiao](https://x.com/benshandebiao)
- Fork 自: [qiaoshouqing/drive-escape](https://github.com/qiaoshouqing/drive-escape)

---

## 📄 开源协议

[MIT](LICENSE) © 2024
