# 02 · UI/UX Design System

**ລະບົບອອກແບບ / Design System** — PhotoShop Enterprise DAMS v2.0

| | |
|---|---|
| ສະຖານະ / Status | 🟢 IMPLEMENTED |
| ອ້າງອີງ / Based on | `app-v2/src/client/css/style.html`, `design-preview.html` |

---

## 1. Style
Glassmorphism · Rounded XL (18px) · Soft shadow · Gradient · **Dark/Light mode** · Responsive · Bilingual (ລາວ/English).

## 2. Design tokens (CSS variables)
| Token | ໜ້າທີ່ |
|---|---|
| `--radius` / `--radius-sm` | 18px / 12px |
| `--gap` | 20px |
| `--font` | "Noto Sans Lao", "Segoe UI", system-ui |
| `--shadow` / `--shadow-sm` | elevation |
| `--blur` | 14px (glass) |
| `--bg` `--bg2` `--panel` `--panel-solid` | surfaces |
| `--line` | borders |
| `--text` `--muted` | text |
| `--accent` `--accent2` `--accent3` | blue / green / purple |
| `--grad` | brand gradient |

Themes via `[data-theme="dark"]` / `[data-theme="light"]` on `<html>`; toggle button swaps 🌙/☀️.

## 3. App shell
```
.sidebar (250px, bilingual nav)  |  .main
                                     .topbar (search + theme + notif + avatar)
                                     .content (page-head + views)
```
Sidebar item = icon + `<span class="lbl"><b>English</b><small>ລາວ</small></span>` (stacked bilingual).

## 4. Components (in use)
`.glass` · `.kpi` (KPI card) · `.card` · `.qa` (quick-action/button) · `.chip` (badge/status) · `.timeline`/`.tl` (activity) · table styles · form `input`/`select` · `.skeleton` (loading).

## 5. Colors — semantic
- KPI badges: `.b-blue` `.b-green` `.b-purple` `.b-amber`
- status up = `--accent2`, down = `#ff6b6b`

## 6. Responsive
`.kpis` auto-fill grid (min 210px); `.cols` 2-col → 1-col ≤900px.

## 7. Preview
Live: `app-v2/design-preview.html` (self-contained, mock data) — GitHub Pages viewable.

---
*ຕໍ່ໄປ / Next:* [03 · Database & Sheets Schema](03_database_sheets_schema.md)
