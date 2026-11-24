# 一隊一島：布局與驗收

本次只更新工作區，沒有推送、部署、操作瀏覽器或更改 Supabase。舊的地標、球場、遊戲、場館 ID 與 localStorage 鍵不變；地標座標和路線已按群島重排。

## 修改檔案

| 類別 | 檔案 |
| --- | --- |
| 新增布局與美術 | `assets/archipelago-core.js`、`archipelago-art.cjs`、`archipelago.css` |
| 首頁與資料接線 | `index.html`、`script.js`、`assets/island-core.js`、`sights-core.js`、`traffic-core.js` |
| 鏡頭／路人 | `assets/explorer-core.js`、`explorer-ui.js`、`bay-scene.js` |
| 素材生成 | `assets/generate_pixel_assets.cjs`、`generate_pixels.py`、`pixel-tiles.js`，以及 `assets/pixel/` 的地形／道路／景點與 manifest |
| 測試 | 新增 `tests/archipelago.test.cjs`，調整 `explorer.test.cjs`、`scenery.test.cjs`、`ui.test.cjs`、`check-static.py` |
| 文件／預覽 | `README.md`、`assets/README.md`、`docs/CLASSROOM.md`、`EXPLORER.md`、`PIXEL_ART.md`、本文件及 `docs/pixel-preview/` |

## 布局與來源

- 共用世界為 **2560 × 1600**，每個美術像素為 2 × 2 世界單位。16 座不相接的球隊島，每座只有一座 NBA 主場；相鄰島間留海面。
- `assets/archipelago-core.js` 集中管理島岸、球隊島歸屬、入口、島內街道、海上主幹道、短橋及兩條巡遊車道。舊有 8 個地理區域仍供選單定位，總覽改用 16 個隊名按鈕。
- 西側海上幹道串起勇士、湖人、快艇、金塊與太陽；橫向橋接到內陸幹道，再通往五大湖及東岸。湖人／快艇各自獨島，兩個短橋共用一個洛城海上交會點。
- 勇士島有藍金橢圓館、木碼頭與灣景；湖人島有圓頂館、洛城沙色街道及碼頭；公牛島有紅磚館、湖岸廣場與雲門；尼克島有玻璃館、都市街角、斑馬線及岸邊觀景入口。其他隊沿用六類場館及地區材質。
- 15 座球場、20 處街景、4 個觀景拍照入口與 3 個偶遇點重新分配到各島，仍使用原來的清單、遊戲與照片功能。非拍照街景維持只查看名稱／資訊，不移動玩家。
- `assets/archipelago-art.cjs` 依相同資料產生分層像素岸壁、廣場、商店、路燈及橋墩。海域與幹道端點保留延伸空間，未開放球隊沒有假球館。

## 鏡頭與操作

1. 初始全島看完整群島、海上道路、隊名與小型模擬 LIVE。點隊名或「球隊島／區域」選單，只移動鏡頭。
2. 球隊島視角框住球館、主要步道與入島橋頭。其他島不接受地圖點選；球場入口可見，次要景點／問號在接近或選取、鍵盤聚焦時展開。完整清單始終可用。
3. 點場館或從清單選站，玩家沿可見路網走到入口後才開面板。途中改選會取消舊路線。關閉場館回同一球隊島，回全島只改鏡頭。
4. 玩家名牌是小型深色標籤，縮放時保持字體可讀，與球館入口、定位圈分開。選取只用一圈亮框；照片、政策與 LIVE 各有標記。
5. 夜間道路、商店、碼頭、球場與車燈獨立於賽事；只有 LIVE 主場脈動。背景頁面、遠景及減少動態的暫停沿用原有共用動畫迴圈。

## 本機產生的三張畫面

- [全島白天](./pixel-preview/island-day.png)
- [全島夜晚](./pixel-preview/island-night.png)
- [勇士島近景](./pixel-preview/warriors-close-day.png)

這些是以同一組像素層、模型與座標合成的 PNG，**不是瀏覽器截圖**。圖內以英文隊縮寫辨識球隊；實際網頁的隊名、操作及資訊仍為繁體中文。PNG 可檢查輪廓、材質和動線，但不代表 DOM、觸控或實際 Canvas 下載已目視驗證。

重建：先執行 `python assets/generate_pixels.py`，再執行 `node assets/generate_fan_assets.cjs`。原始向量素材保留，供舊照片及素材來源使用；首頁採用新生成的 pixel 圖層。

## 終端機與手動驗收

執行 `node --test tests/*.test.cjs`、`python tests/check-static.py`，另用 `node --check` 檢查 JS／CJS。新增測試涵蓋 16 個互不重疊島岸、每島一主場、活動歸屬、全路網連通、島內街道不穿海、勇士到湖人的指定橋段、鏡頭／返回位置、次要熱區展開及日夜／LIVE 獨立。

本次實測：198 項測試通過；34 個 JS／CJS 檔語法通過；靜態檢查通過 270 個 HTML ID、9 份 CSS、130 組像素 PNG／SVG（含原生格、PNG CRC、資料列）、本地音效及 Pages 相對路徑。UI 事件使用 Node 元素替身；真人後端測試使用 fixture，並非真實雙裝置結果。

手動預覽根目錄 `index.html`：

1. 全島點「勇士島」→ 點勇士主場 → 清單選湖人 → 看角色經橋頭與海上幹道抵達湖人 → 進館找球星 → 關閉面板回湖人島 → 回全島，確認角色停留湖人。
2. 同一構圖切白天／夜晚，模擬賽況由進行中切完賽。確認道路仍亮、僅賽事脈動停止，主客隊保留 101：108。
3. 勇士售票挑戰選學生保留席，試算 20／40 人、2,400 點與 60 席圖。
4. 清單選潮汐一號完成試玩與正式局；另選屋頂球場，確認正確遊戲與所在隊島。Tab／Enter／空白鍵和手機觸控仍需實機確認。
5. 本機 `index.html?encounterDate=2026-01-01` 到勇士島西岸碼頭步道，抵達才揭曉柯瑞；再試金門橋觀景、拍照及 PNG 下載。確認原有兩類相簿與舊造型仍可讀取。

Supabase 設定仍未配置，沒有替代玩家或假房間；雙裝置真人 PK、真實 PNG 儲存與頁面排版列為待驗。

## 玩家球衣圖層

中性運動服沿用獨立 `body-sheet`／`top-neutral-sheet`。每格 16 × 24 px；整張 80 × 192 px；方向列為 e、se、s、sw、w、nw、n、ne；欄為 idle 加四個走路幀，每幀 150ms。腳底 `(8,22)`、上衣左上 `(4,10)`、上身 9 × 7 px、胸前 `(8,13)`。詳見 [PIXEL_ART.md](./PIXEL_ART.md)。
