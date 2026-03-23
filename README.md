# 🚗 Drive Escape — Weekend Self-Driving Map

Pick a city, see how far you can drive in 5 hours.

**Live Demo** → [drive-escape.pomodiary.com](https://drive-escape.pomodiary.com)

**Author** → [@benshandebiao](https://x.com/benshandebiao)

🌐 [简体中文](./README_ZH.md) | [繁體中文](./README_TW.md) | [日本語](./README_JA.md)

---

## Features

- 🔍 Search any city worldwide — instantly generates a driving time heatmap
- 🗺️ District-level boundaries with 10-tier color scale (green → red)
- 🏷️ Each district labeled with name, drive time, and distance
- ⏱️ Real driving time via OSRM + local cache for instant reload
- 🌏 International support (Japan, Europe, Australia, Taiwan, and more)
- 📱 Mobile friendly, multi-language (EN / 简体 / 繁體 / 日本語)

## Tech Stack

| Component | Solution |
|-----------|----------|
| Map rendering | Leaflet + OpenStreetMap |
| China boundaries | DataV GeoJSON API |
| International boundaries | Overpass API |
| Driving time | OSRM Table API |
| City search | Nominatim API |
| Hosting | Cloudflare Pages + Functions |

No paid APIs. Fully open source.

## Run Locally

```bash
git clone https://github.com/qiaoshouqing/drive-escape.git
cd drive-escape
python3 -m http.server 8080
# open http://localhost:8080
```

## Deploy

```bash
wrangler pages deploy . --project-name drive-escape
```

## License

MIT
