# 美國地理群島與非像素 3D 重構

版本：`geographic-stylized-v2`。開發分支：`integration/geographic-stylized-v2`。前版：`ab0591d`。沒有修改 Supabase 或執行遠端 SQL。

## 地理與動線

30 隊城市錨點取自 Natural Earth 的 populated places，並保留原始經緯度。美國本土、加拿大南部及五大湖取自同一套公開地理資料，採 Albers 等積投影。這版選用 Natural Earth 統一處理跨國範圍，未宣稱使用 Census 資料。資料來源與處理紀錄見 `assets/geography/sources.json`、`cities.json` 及 `ASSET_LICENSES.md`。

投影後以確定性的島間距調整消除密集城市重疊；洛城與紐約兩組同城球隊保留相鄰獨立島，並另外維持東岸南北順序、費城在紐約西南、灰狼在公鹿以北。海底的低對比美國輪廓作為地理參照，升起的三十座島仍各有完整岸線與水面間隔。多倫多保留加拿大城市座標與湖岸地景。這是遊戲化地理群島，不是量測用 GIS。

`assets/geography/layout.js` 在既有資料初始化前更新共用座標與道路；保留球隊、球場、商店、記憶簿、偶遇及觀景點 ID。所有原有入口均可從勇士島經新橋路網抵達。玩家沿路移動，連續選站以最新目的地為準；回總覽保留位置。灣區路人的舊路線也轉入新座標。車道與人行路網分開，灣岸橋旁保留行人側道。

## 正式顯示與相容層

- 主地圖、角色、球星、NPC、球館、城市與地標使用平滑的風格化 3D；抗鋸齒、標準材質、柔和光影與原生顯示解析度保留。
- 換裝預覽、十六位既有代表球星、球館內部、偶遇場景、記憶簿與八項商店商品由共用 WebGL renderer 產生 3D 圖像。人物預覽含透明背景，可與球館場景組合。
- 15 款小遊戲共用新的 3D 球場與圓潤人物，依既有遊戲狀態更新障礙、落點、隊友、防守者、記憶亮點與出手。按鈕、鍵盤、時機條、計分及公平種子繼續使用原規則。
- 新照片標記 `geographic-stylized-v2`；舊像素、第一版 3D、已下載模型版照片的美術標記、儲存鍵與造型快照仍可讀取。舊照片不改寫成新照片。
- `?map=2d` 或直接從檔案開啟保留舊座標與 2D 相容地圖。WebGL 建立失敗時重新進入這個備援，避免把新座標放到舊底圖上。
- 原型網址預設導向已整合的正式首頁；舊原型只留在明確的 `?compatibility=1` 相容入口，正式操作不使用 iframe。
- 使用者提供的 30 隊隊徽檔案未更動。

目前仍是原有 **16 個代表球星固定合影點**，不把 30 隊選取說成 30 個已完成的球星合影。原有好友房間程式、邀請 ID 與權限流程保留；Supabase 設定空白，沒有假玩家或假連線狀態。

## 車輛與素材

在原 24 個本地模型上增加 12 個驗證模型，共 **36 個 GLB**。新增包含七款跑車、SUV、計程車、餐車及兩項籃球設備；展示介面列出七款跑車與兩款城市交通車。Ferrari F40、GT-R、Lamborghini 風格、三款 Quaternius 跑車及耐力賽車各有獨立幾何，並非同車換色。

「設定 → 跑車與城市交通展示」可看九款實際 WebGL 圖像。勇士海灣設停車展示平台，金門橋旁及沙漠車道各有封閉巡遊路線。車輛轉彎減速、平滑轉向、輪圈轉動，夜間光束及路面亮區跟隨車頭；停放車不亮行進頭燈。同路線以車距控制跟車速度，避免追撞。這是固定路線的基本避碰，不是自由交通物理模擬。

鏡頭遠離、頁面背景、面板遊戲開啟時停止主場景更新；減少動態時車流靜止。手機省電模式只顯示前三台停放車並降低附加輪圈細節，九款完整展示仍可開啟。沒有刻意像素化或縮低畫布到非原生解析度。

GLTFLoader、InstancedMesh、LOD、模型快取與最多兩座詳細島／手機一座的快取限制沿用。30 隊都能進入近景，詳細場景按需建構；不會開頁就載入三十座完整城市。每隊保留球館、隊徽及原有城市特色，再依西南、山區、平原、湖區、東北、海濱配置共用地景。

下載失敗的完整包、匿名下載中斷／403、McLaren 下載 API 的 401 與約 195 萬三角形限制均有紀錄。沒有把未取得模型算入 36 個；見 [MANUAL_DOWNLOAD.md](../MANUAL_DOWNLOAD.md)。

## 實際驗證與畫面

- 終端機：291 項測試通過，包含原有玩法、儲存、舊照片，以及新增地理位置、30 隊可達路網、相機換算、取消舊路線、九車目錄、跟車停止與方向計算。
- 靜態素材／HTML／JavaScript 檢查通過。36 個 GLB 的雜湊、內嵌資源、幾何、骨架與動畫以實際 GLTFLoader 解析。
- 真實 Chrome：原功能回歸包含 30 隊選取、球館射線點擊、三方案與 60 席座位圖、跨島購物車、餘額不足與成功結帳、造型、收藏、實際 PNG 下載、偶遇、實際 30 秒投籃結算與重開、其餘十四款遊戲控制抽測、舊資料重讀、記憶簿、手機觸控及兩種備援。
- 新版畫面測試另外確認九車展示、15 款遊戲均建立 3D 畫布、六座島鏡頭、主場合影、日夜及素材無 404。幾何與貼圖在三輪島嶼切換後維持穩定；完整數據見 JSON。
- 瀏覽器報告：[原功能回歸](./geographic-v2-preview/regression/browser-report.json)、[新版場景](./geographic-v2-preview/browser-report.json)、[效能原始數據](./geographic-v2-preview/regression/performance-report.json)。手機數據為桌面 GPU 上的 Chrome 手機模擬，不能當作實體手機結果。

本次 RTX 5060 Laptop／Chrome 量測：勇士、湖人、公牛桌面近景約 **60 FPS**；勇士手機模擬首次載入窗口 **27.94 FPS**，模型與貼圖暖機後重新量測 **30.00 FPS**。手機畫質為原生 CSS 解析度、DPR 1，未刻意像素化。暖機結果通過約 30 FPS 目標；初次載入期間仍有短暫低於 28 FPS 的窗口，不能回報為全程達標。完整初幀、模型就緒時間、Draw Calls、三角形、幾何／貼圖及 JS heap 均保留於原始 JSON，JS heap 不是 GPU 記憶體。

| 比對項目 | 實際瀏覽器畫面 |
|---|---|
| 改版前全島 | [原正式版全島](./geographic-v2-preview/before-overview-day.png) |
| 地理群島白天／夜晚 | [白天](./geographic-v2-preview/overview-day.png) · [夜晚](./geographic-v2-preview/overview-night.png) |
| 勇士球館近景 | [前版](./downloaded-models-preview/island-warriors.png) · [新版白天](./geographic-v2-preview/warriors-day.png) · [新版夜晚](./geographic-v2-preview/warriors-night.png) |
| 換裝、球館內部、合影 | [3D 試衣間](./geographic-v2-preview/wardrobe.png) · [主場尋星](./geographic-v2-preview/arena-interior.png) · [實際 PNG](./geographic-v2-preview/home-photo.png) |
| 車展 | [九種本地 3D 車輛](./geographic-v2-preview/showroom.png) |
| 遊戲 | [投籃](./geographic-v2-preview/game-harbor-01.png) · [繞樁](./geographic-v2-preview/game-park-01.png) · [鬥牛](./geographic-v2-preview/game-park-04.png) · [節奏](./geographic-v2-preview/game-roof-02.png) · [禁區](./geographic-v2-preview/game-roof-04.png) |

## 手動驗收與待驗

1. 總覽搜尋 30 隊；勇士 → 湖人、尼克 → 籃網、舊島 → 火箭。確認橋側行走、入口提示與回全島保留位置。
2. 勇士售票試算學生保留席，檢查 20／40 席、2,400 點；切模擬主客賽況與完賽，確認僅主場 LIVE 光暈改變。
3. 試衣間儲存 → 尋找柯瑞 → 拍照收藏 → PNG；換裝後回看舊照。到當日偶遇地點抵達再揭曉。
4. 打開車展；海灣與沙漠切日夜，觀察轉向、輪圈、車距及頭燈；手機清單換一個不同遊戲，試玩、重開、回場。
5. 兩家商店跨島加入商品、結帳與重整；記憶簿自主閱讀，紀念點維持靜態。

實體 Android／iPhone 的手勢、PNG 系統下載、長時間效能與溫度待實機驗證。其餘十四款遊戲未逐一在瀏覽器完整玩至終局，終局、勝負、平手與重開已由終端機邏輯測試覆蓋。真人 PK 的雙裝置測試待配置公開 Supabase 設定並由使用者手動套用既有 SQL；本次未變更遠端服務。

## 九週課堂對照

| 週次 | 對應功能 | 檔案位置 | 展示方式 |
|---|---|---|---|
| W02 | 導覽、分類與城市搜尋 | `index.html`、`script.js` | 清單搜尋球隊，再跨島抵達 |
| W03 | 3D 圖像、圖說、政策表格 | `visuals.js`、`photo.js`、`index.html` | 尋星、PNG 與政策比較表 |
| W04 | 本地進球／終場音效 | `script.js`、`assets/audio/` | 遊戲中開關音效 |
| W05 | 換裝、政策、場地、購物表單 | `fan-ui.js`、`shop-ui.js` | 儲存造型、submit 結帳與驗證 |
| W07 | 隊色、對比、比分文字 | `hud.css`、`models.js` | 隊徽與日夜、等寬比分 |
| W08 | 地理座標、鏡頭與圖層 | `geography/layout.js`、`three-map/main.js` | 總覽拉近球館，再返回 |
| W09 | 計分、票房、投影及車距 | `games-core.js`、`policy-core.js`、`vehicle-core.js` | 政策 2,400、遊戲結算與車流 |
| W11 | 物件資料、共用控制器與 DOM | `map-controller.js`、`visuals.js` | 同一 ID 連動清單、地圖與面板 |
| W12 | 事件、計時、購物車委派 | `script.js`、`games-ui.js`、`shop-ui.js` | 鍵盤遊戲、重開、修改／刪除購物車 |

表內未帶目錄的 JS／CSS 均位於 `assets/` 或 `assets/three-map/`。原九週詳細教材對照仍保留於 [CLASSROOM.md](./CLASSROOM.md)。
