<div align="center">

# 🚗 Weekend Escape Plan

**Pick a city, see your travel range at a glance**

[![Live Demo](https://img.shields.io/badge/Live_Demo-drive--escape.pomodiary.com-1a6e5c?style=for-the-badge)](https://drive-escape.pomodiary.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)
[![Stars](https://img.shields.io/github/stars/Azure-Fisher/drive-escape?style=flat-square&color=yellow)](https://github.com/Azure-Fisher/drive-escape/stargazers)


</div>

---

## ✨ Features

| Feature | Description |
|:-------:|-------------|
| 🔍 **Smart Search** | Search any city or address, auto-locate |
| 🚗🚄🚴 **Multi-Mode** | Driving, high-speed rail, and cycling modes |
| 🗺️ **Heatmap** | District-level precision, 10-tier color scale |
| ⏱️ **Real Time** | OSRM driving time + smart estimation |
| 🌏 **Global** | China + international cities supported |
| 📱 **Responsive** | Mobile and desktop friendly |
| 🌐 **i18n** | EN / ZH-CN / ZH-TW / JA |

---

## 🛠️ Tech Stack

<table>
<tr>
<td width="50%">

### Frontend
- **Map Engine**: Leaflet.js
- **Map Data**: OpenStreetMap
- **UI Design**: Material Design 3

</td>
<td width="50%">

### Data Sources
- **China Boundaries**: DataV GeoJSON API
- **International**: Overpass API
- **Driving Time**: OSRM Table API
- **Geocoding**: Nominatim API

</td>
</tr>
</table>

**Hosting**: Cloudflare Pages + Functions

> 💡 All APIs are free and open source, no paid services

---

## 🚀 Quick Start

### Run Locally

```bash
# Option 1: Direct open
open index.html

# Option 2: Local server
python3 -m http.server 8080
# Visit http://localhost:8080
```

### Deploy to Cloudflare Pages

```bash
# Install wrangler
npm install -g wrangler

# Deploy
wrangler pages deploy . --project-name drive-escape
```

---

## 📖 Documentation

| Language | Link |
|:--------:|------|
| 简体中文 | [README.md](./README.md) |
| 繁體中文 | [README_TW.md](./README_TW.md) |
| English | [README_EN.md](./README_EN.md) |
| 日本語 | [README_JA.md](./README_JA.md) |

---

## 🤝 Credits

- Original Author: [@benshandebiao](https://x.com/benshandebiao)
- Forked from: [qiaoshouqing/drive-escape](https://github.com/qiaoshouqing/drive-escape)

---

## 📄 License

[MIT](LICENSE) © 2024
