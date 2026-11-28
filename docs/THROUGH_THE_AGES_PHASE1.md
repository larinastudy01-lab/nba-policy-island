# 夢回 NBA：穿越籃球時光｜第一階段

版本：`through-ages-v1`，2026-11-29。整合分支 `integration/through-ages-v1`；基準 `44c00d4`，保留 `backup/pre-through-ages-44c00d4`。本階段沿用三十隊地理群島及現有玩法，沒有新增公共球場、強制後端或執行遠端 SQL。

## 本版改動

| 範圍 | 已實作 | 主要檔案 |
|---|---|---|
| 電影開場 | 十秒原創 3D 籃球落地、聚光燈、年代時間軸、紀念獎盃、城市剪影與群島，最後呈現「夢回 NBA」。可略過、記住進站狀態、設定中重播；減少動態直接呈現開始畫面 | `journey-ui.js`、`three-map/opening.js`、`journey.css` |
| 音效 | 本地原創兩秒合成落地聲；預設靜音，按音效按鈕後才播放。離開開場或切到背景時停止 | `assets/audio/journey-bounce.wav` |
| 年代架構 | 起源、文化、Showtime、Jordan、Kobe、三分革命、新世代七種可切換配置；實際套用環境光、日光、材質粗糙度及介面重點色 | `journey-core.js`、`themes/eras.json`、`three-map/main.js`、`world.js` |
| 日夜 | 白天／黃昏／夜晚，黃昏點燈且使用暖色環境光。路燈與車燈獨立於模擬 LIVE，完賽不關閉夜景照明 | `journey-core.js`、`world.js`、`map-controller.js` |
| 地理與 HUD | 沿用 Natural Earth 城市投影、三十座島與連通路網；總覽加入低對比水面分區標籤。精簡常駐操作，購物／記憶簿／年代／重播收進設定，選功能後自動收起選單 | `three-map/main.js`、`journey.css` |
| 漸進教學 | 三步探索提示，可略過、記住完成狀態及重看，不一次遮住全部地圖 | `journey-ui.js` |
| 跨裝置輸入 | Pointer Events 統一滑鼠／觸控／筆；保留鍵盤與原生輔具 click。修正隊徽起始的雙指縮放、手勢取消、原點擊目標及去重；遊戲保留 WASD／方向鍵、選項、出手和 range | `input-manager.js`、`games-ui.js`、`script.js` |
| 遊戲呈現 | 仍是原十五款遊戲，維持相同時間／種子／計分；3D 圖像改用獨立動畫迴圈，顯示 FPS 與主地圖分開量測；離場、重開、背景時清理或暫停 | `three-map/visuals.js` |
| 向量備援 | WebGL 啟動失敗、`?map=2d` 或 `file://` 改用平滑 SVG 群島。球館、球場、景點、商店、角色、拍照仍接同一控制器；不再掛載像素底圖 | `vector-map.js`、`vector-art.js`、`map-bootstrap.js` |
| 畫質 | 自動及低／中／高；限制 DPR、陰影、目標幀率及細節快取。自動模式在暖機後持續低 FPS 時降級；不刻意像素化 | `journey-core.js`、`three-map/main.js` |

上表未帶目錄的檔案均在 `assets/`。年代的材質與布局文字是擴充配置，本階段沒有為七個年代分別建造完整城市或音樂包；也沒有把配置標籤當成已完成的歷史事件。JSON 與 JS 配置保持同步，JS 版本讓直接開檔的備援不依賴 Fetch；未提前實作課程資料庫或未公布作業。

## 美術、素材與資料保護

沿用已取得、驗證與最佳化的 **36 個本地 GLB**、七種跑車及兩種城市交通，不更換使用者隊徽。模型來源、作者與 CC0／CC BY 見 [ASSET_LICENSES.md](../ASSET_LICENSES.md)及網站素材作者頁。新開場道具、向量繪圖與落地聲是本專案程序創作，沒有新增來源不明的球員或轉播素材。

正式預設、備援、新合影、商店、球迷與遊戲採非像素顯示。舊像素檔與舊藝術版本只留在相容程式／測試，未刪除收藏。舊照片在介面中可依原造型、地點、姿勢及日期重建平滑畫面，原儲存紀錄不覆寫。新照片只增加可選 `era`／`dayPhase`，舊紀錄沒有這兩欄仍可讀取。

原有球隊、地標、球場、邀請 ID 及進度鍵保留；新增的開場／教學／年代偏好使用獨立 `nba-policy-island:opening:v1`、`tutorial:v1`、`journey:v1`。沿用 `mapview:v2` 保留位置與日夜偏好，不清空政策、島幣、購物或合影資料。沒有更改 Supabase URL、公開金鑰、SQL 或服務設定。

## 實際驗證

- `node --test tests/*.test.cjs`：**299 通過、0 失敗**，含七種年代／三種光照、畫質邊界、同世界座標、舊新照片、去重、指標取消、原十五玩法與好友房間替身測試。
- `python tests/check-static.py` 與 JavaScript 語法檢查：通過。靜態報告仍檢查保留的舊素材，不能因此解讀成正式版還在顯示像素素材。
- [原功能實際 Chrome 回歸](./through-ages-preview/regression/browser-report.json)：19 組通過，包含三方案／60 席、跨島購物／失敗及成功結帳、造型、舊照與新 PNG、每日偶遇、三十隊、真正三十秒投籃結算／重開、其他十四場控制抽測、手機模擬及強制 WebGL 失敗後的向量備援，無頁面錯誤或 404。
- [第一階段場景與尺寸紀錄](./through-ages-preview/browser-report.json)：記錄十秒開場、靜音、年代／光照／畫質、PNG，以及十五場 × 六尺寸。尺寸為 360×800、390×844、844×390、768×1024、1024×768、1920×1080。
- [觸控紀錄](./through-ages-preview/touch-report.json)：另記錄 Chrome CDP 觸控、雙指縮放、手機／平板、混合鍵盤、長按重複事件、旋轉不重設及離場清理。這些是桌面 Chrome 的觸控模擬，不是 iPhone、Android 或 iPad 實機。

九十組是**開局、控制抽測、畫面、橫向溢出、離場**的基礎檢查，不是九十場完整終局，也不是已完成十五款歷史重構。各遊戲終局、勝負與平手仍由邏輯測試覆蓋；實際完整三十秒投籃另有瀏覽器紀錄。

## 效能實測

Windows Chrome／NVIDIA RTX 5060 Laptop，同一桌面 GPU。數據見 [效能 JSON](./through-ages-preview/performance/performance-report.json)。

| 場景 | FPS | Draw Calls | 備註 |
|---|---:|---:|---|
| 勇士桌面 | 60.00 | 618 | 中畫質／自動，6.5 秒近景窗口 |
| 湖人桌面 | 60.00 | 294 | 同一環境 |
| 公牛桌面 | 60.01 | 198 | 同一環境 |
| 勇士手機模擬冷啟動 | 27.66 | 296 | 390×844，低畫質；未達穩定 30 FPS |
| 勇士手機模擬暖機後 | 30.00 | 296 | 同一桌面 GPU，不能替代實體手機 |

主地圖第一幀桌面約 1.98 秒、手機模擬約 1.39 秒；詳細模型首次就緒約 5.05／3.94 秒（頁面 `performance.now()` 讀值）。三輪勇士／湖人／公牛切換後，幾何 729、貼圖 33 保持穩定，細節快取不超過兩座。JS heap 約 89–114 MB，這不是 GPU 記憶體。總覽靜止、面板及背景會停主地圖更新；開場道具在結束後釋放，可重播時重建。遊戲呈現 FPS 另外保留於場景／觸控報告，不以主地圖 60 FPS 代替。

## 畫面對照與手動驗收

改版前畫面沿用前一版 `geographic-stylized-v2` 的實際 Chrome 紀錄；改版後是本次本機整合分支的 Chrome 擷取。

| 畫面 | 連結 |
|---|---|
| 全島前／後 | [前](./through-ages-preview/before-overview.png) · [後](./through-ages-preview/overview-day.png) |
| 勇士近景前／後 | [前](./through-ages-preview/before-warriors.png) · [白天](./through-ages-preview/warriors-day.png) |
| 開場與日夜 | [開場](./through-ages-preview/opening.png) · [黃昏](./through-ages-preview/warriors-dusk.png) · [夜晚](./through-ages-preview/warriors-night.png) |
| 合影與備援 | [PNG](./through-ages-preview/home-photo.png) · [手機向量](./through-ages-preview/vector-fallback.png) |

建議手動走一次：首次開場／略過／重播 → 選勇士島 → 在設定切七年代及黃昏／夜晚 → 勇士售票保留席 2,400 → 原球場練習與結算 → 商店收藏 → 合影 PNG → `?map=2d` 用向量圖點球館與球場。手機另試雙指縮放、轉橫向、清單、兩種不同玩法，確認無橫向捲動。

## 尚待確認與下一階段

實體 Windows 觸控筆電、macOS、iPhone／Android、iPad／Android 平板、系統 PNG 儲存、音效聽感、長時間溫度及 GPU 記憶體待實機確認。手機模擬冷啟動仍有低於 30 FPS 的窗口。Supabase 仍未配置，真人雙裝置 PK 待驗；房間替身測試不當作真人測試。

本階段不提前完成四十二組歷史主題、三十座完整歷史館或十五款歷史玩法重構；這些仍依 [歷史旅程修訂計畫](./NBA_HISTORY_JOURNEY_PLAN.md)進行。保留原十六位固定主場代表球星，不宣稱已有三十位主場合影。年代目前是可測的美術與配置架構，後續可接 JSON／Fetch、歷史任務及既有即時房間介面。
