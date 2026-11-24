# NBA 政策島素材

目前首頁使用 `island-map.svg`，為本專案原創的 2.5D 籃球島向量素材，無外部圖片、字型或 CDN 依賴。它包含海洋、海岸、岩壁、河流、橋梁、中央廣場、道路、碼頭、樹木與街區；不沿用其他遊戲的島形或素材。

- viewBox：`0 0 1200 800`。
- 8 座球館與 15 座球場由 `script.js` 繪製成內含 SVG 的 HTML 按鈕，座標來自 `island-core.js`。以背景 1200 × 800 座標換算 absolute 百分比位置及尺寸，圖形、文字及點擊區一起縮放。
- NBA 主場採有屋頂的立體球館；公共球場可看見球線與籃框，屋頂球場加上建築立面。
- `island-core.js`：兩類地標、主客場模擬、投籃與房間規則模型。
- `policy-core.js` / `policy.css`：保留的勇士門票挑戰與原有進度儲存鍵。
- `online.js`：原生 fetch 的 Supabase Auth / RPC 介面。
- `supabase-config.js`：預設留空的公開連線設定，不能填入服務端金鑰。

## 球迷角色、隊史 Q 版球星與球館

- `fan-core.js` 的分層 SVG 渲染器提供陰影、腿、球鞋、手臂、球衣、臉、髮型、配件與籃球圖層。試衣間、島圖「我」、場館、合影及單機結算共用同一渲染器。
- `stars/`：`curry.svg`、`magic.svg`、`paul.svg`、`jokic.svg`、`dirk.svg`、`jordan.svg`、`bird.svg`、`ewing.svg`，共 8 張原創 Q 版隊史致敬插畫。以抽象比例、球衣配色、背號與髮型表現，沒有官方照片、隊徽或外部取樣。**不代表現役名單**。
- `arenas/`：`warriors.svg`、`lakers.svg`、`clippers.svg`、`nuggets.svg`、`mavericks.svg`、`bulls.svg`、`celtics.svg`、`knicks.svg`，共 8 個原創自訂場館。共用結構，依隊色、看台與記分板呈現各站；場館名稱為遊戲內設計。
- 從根目錄執行 `node assets/generate_fan_assets.cjs` 可重建全部 16 個 SVG。產生器與合影共用 `fan-core.js` 圖形來源，測試會確認檔案相符。
- 合影轉 PNG 時把相同向量圖層直接組成一個自包含 SVG，不透過 fetch 讀 file:// 素材，不含外部 image、foreignObject 或字型下載。SVG `<text>` 含暱稱、球星、隊名、場館與日期，隨 Canvas 一起匯出。
- 各頁圖片提供 alt、SVG title／desc 及場館圖說。像素品質、字型與觸控下載行為仍需手動驗收。

## 本地原創音效

- `shot-hit.wav`：0.36 秒，籃網沙沙聲與上行音符，用於命中。
- `round-end.wav`：0.68 秒，兩段柔和終場提示。
- 兩者均由本專案 `generate_audio.py` 以標準函式庫合成，22,050 Hz、單聲道、16 位元 PCM WAV，無外部取樣、版權音樂、影片或 CDN。
- 從專案根目錄執行 `python assets/generate_audio.py` 可重建。HTML `<audio>` 使用相對路徑與 `preload="none"`，沒有 autoplay；預設關閉，由玩家互動後自行勾選音效。
- 實際音量、聽感及裝置播放許可仍需手動確認。

## 保留的舊版地理素材

以下素材保留作為原始版本備份，目前首頁沒有載入，也不代表島上真實地理位置。

`us-map.svg` 由 PublicaMundi 的美國州界 GeoJSON 轉為本地 SVG，採 Albers 等積投影，僅保留本土 48 州。加州稍加亮以協助定位；非導航用途。

- 原始資料：https://github.com/PublicaMundi/MappingAPI/blob/master/data/geojson/us-states.json
- 上游原始 GeoJSON 備份：`us-states.source.json`
- viewBox：`0 0 1000 620`
- 投影參數：中央經線 -96°、原點緯度 37.5°、標準緯線 29.5° / 45.5°。
- 以所有州投影後的邊界等比例置中，四邊至少留 28 個 viewBox 單位。
- 舊金山（-122.4194°, 37.7749°）在舊地圖對應 `x=61.1088, y=267.3317`；目前島圖使用原創座標。

地圖已儲存在專案內，網頁不需存取上述來源即可使用。隊徽是本專案繪製的灣區橋梁示意，非官方隊徽素材。
