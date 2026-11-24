# 美國本土 48 州地圖

`us-map.svg` 由 PublicaMundi 的美國州界 GeoJSON 轉為本地 SVG，採 Albers 等積投影，僅保留本土 48 州。加州稍加亮以協助定位；非導航用途。

- 原始資料：https://github.com/PublicaMundi/MappingAPI/blob/master/data/geojson/us-states.json
- 上游原始 GeoJSON 備份：`us-states.source.json`
- viewBox：`0 0 1000 620`
- 投影參數：中央經線 -96°、原點緯度 37.5°、標準緯線 29.5° / 45.5°。
- 以所有州投影後的邊界等比例置中，四邊至少留 28 個 viewBox 單位。
- 舊金山（-122.4194°, 37.7749°）對應 `x=61.1088, y=267.3317`，與 `script.js` 的站點座標一致。

地圖已儲存在專案內，網頁不需存取上述來源即可使用。隊徽是本專案繪製的灣區橋梁示意，非官方隊徽素材。
