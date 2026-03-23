<div align="center">

# 🚗 週末脱出計画

**都市を選んで、移動範囲を一目で確認**

[![Live Demo](https://img.shields.io/badge/デモ-drive--escape.pomodiary.com-1a6e5c?style=for-the-badge)](https://drive-escape.pomodiary.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)
[![Stars](https://img.shields.io/github/stars/Azure-Fisher/drive-escape?style=flat-square&color=yellow)](https://github.com/Azure-Fisher/drive-escape/stargazers)

<img src="assets/screenshot.png" alt="週末脱出計画スクリーンショット" width="80%">

</div>

---

## ✨ 機能

| 機能 | 説明 |
|:----:|------|
| 🔍 **スマート検索** | 都市や住所を検索、自動で位置特定 |
| 🚗🚄🚴 **複数移動手段** | 車・新幹線・自転車の3モード対応 |
| 🗺️ **ヒートマップ** | 区県レベル、10段階カラースケール |
| ⏱️ **実時間** | OSRM運転時間 + スマート推定 |
| 🌏 **グローバル対応** | 中国 + 海外都市をサポート |
| 📱 **レスポンシブ** | モバイル・デスクトップ対応 |
| 🌐 **多言語** | EN / ZH-CN / ZH-TW / JA |

---

## 🛠️ 技術スタック

<table>
<tr>
<td width="50%">

### フロントエンド
- **地図エンジン**: Leaflet.js
- **地図データ**: OpenStreetMap
- **UIデザイン**: Material Design 3

</td>
<td width="50%">

### データソース
- **中国行政区画**: DataV GeoJSON API
- **海外**: Overpass API
- **運転時間**: OSRM Table API
- **ジオコーディング**: Nominatim API

</td>
</tr>
</table>

**ホスティング**: Cloudflare Pages + Functions

> 💡 すべて無料のオープンソースAPI、有料サービスなし

---

## 🚀 クイックスタート

### ローカル実行

```bash
# 方法1：直接開く
open index.html

# 方法2：ローカルサーバー
python3 -m http.server 8080
# http://localhost:8080 にアクセス
```

### Cloudflare Pagesにデプロイ

```bash
# wranglerをインストール
npm install -g wrangler

# デプロイ
wrangler pages deploy . --project-name drive-escape
```

---

## 📖 ドキュメント

| Language | Link |
|:--------:|------|
| 简体中文 | [README.md](./README.md) |
| 繁體中文 | [README_TW.md](./README_TW.md) |
| English | [README_EN.md](./README_EN.md) |
| 日本語 | [README_JA.md](./README_JA.md) |

---

## 🤝 クレジット

- 原作者: [@benshandebiao](https://x.com/benshandebiao)
- Fork元: [qiaoshouqing/drive-escape](https://github.com/qiaoshouqing/drive-escape)

---

## 📄 ライセンス

[MIT](LICENSE) © 2024
