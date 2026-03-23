<div align="center">

# 🚗 週末逃離計畫

**選一個城市，一眼看清你的出行範圍**

[![線上體驗](https://img.shields.io/badge/線上體驗-drive--escape.pomodiary.com-1a6e5c?style=for-the-badge)](https://drive-escape.pomodiary.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)
[![Stars](https://img.shields.io/github/stars/Azure-Fisher/drive-escape?style=flat-square&color=yellow)](https://github.com/Azure-Fisher/drive-escape/stargazers)


</div>

---

## ✨ 功能亮點

| 功能 | 描述 |
|:----:|------|
| 🔍 **智慧搜尋** | 搜尋任意城市或地址，自動定位 |
| 🚗🚄🚴 **多出行方式** | 支援駕車、高鐵、騎行三種模式 |
| 🗺️ **熱力地圖** | 區縣級精度，10檔色階視覺化 |
| ⏱️ **真實時間** | OSRM 駕車時間 + 智慧估算 |
| 🌏 **全球支援** | 國內城市 + 海外城市全覆蓋 |
| 📱 **響應式設計** | 完美適配手機和桌面端 |
| 🌐 **多語言** | 簡中 / 繁中 / English / 日本語 |

---

## 🛠️ 技術棧

<table>
<tr>
<td width="50%">

### 前端
- **地圖引擎**: Leaflet.js
- **地圖資料**: OpenStreetMap
- **UI設計**: Material Design 3

</td>
<td width="50%">

### 資料來源
- **中國區劃**: DataV GeoJSON API
- **海外區劃**: Overpass API
- **駕車時間**: OSRM Table API
- **地理搜尋**: Nominatim API

</td>
</tr>
</table>

**部署**: Cloudflare Pages + Functions

> 💡 全部使用開源免費 API，無任何付費介面

---

## 🚀 快速開始

### 本地運行

```bash
# 方式一：直接開啟
open index.html

# 方式二：本地伺器
python3 -m http.server 8080
# 訪問 http://localhost:8080
```

### 部署到 Cloudflare Pages

```bash
# 安裝 wrangler
npm install -g wrangler

# 部署
wrangler pages deploy . --project-name drive-escape
```

---

## 📖 多語言文檔

| Language | Link |
|:--------:|------|
| 简体中文 | [README.md](./README.md) |
| 繁體中文 | [README_TW.md](./README_TW.md) |
| English | [README_EN.md](./README_EN.md) |
| 日本語 | [README_JA.md](./README_JA.md) |

---

## 🤝 致謝

- 原作者: [@benshandebiao](https://x.com/benshandebiao)
- Fork 自: [qiaoshouqing/drive-escape](https://github.com/qiaoshouqing/drive-escape)

---

## 📄 開源協議

[MIT](LICENSE) © 2024
