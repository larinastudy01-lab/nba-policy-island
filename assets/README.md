# NBA 政策島素材

目前首頁使用 `island-map.svg`，為本專案原創的 2.5D 籃球島向量素材，無外部圖片、字型或 CDN 依賴。它包含海洋、海岸、岩壁、河流、橋梁、中央廣場、道路、碼頭、樹木與街區；不沿用其他遊戲的島形或素材。

- viewBox：`0 0 1200 800`。
- 8 座球館與 15 座球場由 `script.js` 繪製成內含 SVG 的 HTML 按鈕，座標來自 `island-core.js`。以背景 1200 × 800 座標換算 absolute 百分比位置及尺寸，圖形、文字及點擊區一起縮放。
- NBA 主場採有屋頂的立體球館；公共球場可看見球線與籃框，屋頂球場加上建築立面。
- `island-core.js`：兩類地標、主客場模擬、投籃與房間規則模型。
- `policy-core.js` / `policy.css`：保留的勇士門票挑戰與原有進度儲存鍵。
- `online.js`：原生 fetch 的 Supabase Auth / RPC 介面。
- `supabase-config.js`：預設留空的公開連線設定，不能填入服務端金鑰。

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
