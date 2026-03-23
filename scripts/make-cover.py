#!/usr/bin/env python3
"""生成封面：地图铺满背景 + 底部渐变蒙层 + 统一字号白色文字"""

from PIL import Image, ImageDraw, ImageFont
import os, subprocess

MAP_IMG = "/Users/staff001/.openclaw/media/browser/7e770b9d-4dc7-4321-b985-8def8ec3cbb1.png"
OUT = "/Users/staff001/.openclaw/workspace/2026-03-22-cover-final.png"

W, H = 1080, 1440  # 3:4

# 1. 加载地图，铺满整个画布
img = Image.open(MAP_IMG).convert("RGBA")
img = img.resize((W, H), Image.LANCZOS)

# 2. 渐变蒙层（从底部往上，深绿渐变到透明）
overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
draw_ov = ImageDraw.Draw(overlay)
overlay_h = int(H * 0.65)  # 蒙层覆盖下方65%
for y in range(H - overlay_h, H):
    t = (y - (H - overlay_h)) / overlay_h  # 0 -> 1
    alpha = int(220 * (t ** 0.6))
    r, g, b = 20, 58, 46  # #1a3a2e 深绿
    draw_ov.line([(0, y), (W, y)], fill=(r, g, b, alpha))

img = Image.alpha_composite(img, overlay)

# 3. 文字
draw = ImageDraw.Draw(img)

LINE1 = "我 vibe coding 了一个"
LINE2 = "周末自驾逃离计划"

# 尝试找系统中文字体
font_paths = [
    "/System/Library/Fonts/PingFang.ttc",
    "/System/Library/Fonts/Hiragino Sans GB.ttc",
    "/Library/Fonts/Arial Unicode MS.ttf",
    "/System/Library/Fonts/STHeiti Medium.ttc",
]
font = None
for fp in font_paths:
    if os.path.exists(fp):
        try:
            font = ImageFont.truetype(fp, 80)
            print(f"使用字体: {fp}")
            break
        except: pass

if not font:
    font = ImageFont.load_default()
    print("使用默认字体")

# 文字位置：底部居中，统一字号
text_color = (255, 255, 255, 255)
padding_bottom = 120
line_spacing = 20

bbox1 = draw.textbbox((0, 0), LINE1, font=font)
bbox2 = draw.textbbox((0, 0), LINE2, font=font)
w1 = bbox1[2] - bbox1[0]
w2 = bbox2[2] - bbox2[0]
lh = bbox1[3] - bbox1[1]

total_h = lh * 2 + line_spacing
y_start = H - padding_bottom - total_h

x1 = (W - w1) // 2
x2 = (W - w2) // 2

# 文字描边（增强可读性）
shadow_color = (0, 0, 0, 180)
for dx, dy in [(-2,-2),(2,-2),(-2,2),(2,2)]:
    draw.text((x1+dx, y_start+dy), LINE1, font=font, fill=shadow_color)
    draw.text((x2+dx, y_start+lh+line_spacing+dy), LINE2, font=font, fill=shadow_color)

draw.text((x1, y_start), LINE1, font=font, fill=text_color)
draw.text((x2, y_start + lh + line_spacing), LINE2, font=font, fill=text_color)

# 保存
img = img.convert("RGB")
img.save(OUT, quality=95)
print(f"MEDIA:{OUT}")
