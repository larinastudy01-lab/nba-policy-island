# 夢回 NBA｜NBA Through the Ages

版本：**journey-franchise-v2**。副標：**穿越籃球歷史，打造屬於你的傳奇**。日期：2026-11-29（台灣）。

開發以 GitHub `main` 最新提交 `4904d720ba12f055bb5e9831f32ba849395b1c9e` 為基礎，先核對遠端與工作區相同，再建立 `backup/pre-franchise-4904d72` 與 `integration/franchise-journey-v2`。沿用 Repository 名稱、Pages 子路徑與原資料鍵，測試通過後以原 main/root Pages 流程發布。下方測試均分別記錄本機／公開版，不將 Node 測試當成畫面驗證。

## 已完成的可操作範圍

| 功能 | 實作與限制 | 主要檔案 |
| --- | --- | --- |
| 正式更名與開場 | 頁名、描述、HUD、原導覽、片頭、合影及素材署名頁使用新名稱；十秒原創 3D 開場、略過、開始旅程、繼續遊戲，第二次不強制播放；音效需互動 | `index.html`、`journey-ui.js`、`three-map/main.js` |
| 七項主選單 | Explore／Time Machine／My Franchise／My Island／Championship／Collection／Settings；收藏連到原試衣間、合影、記憶簿與購物車 | `franchise-ui.js`、`franchise.css` |
| 美國地理與城市差異 | 原 Natural Earth 城市經緯度／Albers 群島保留；多倫多在加拿大、同城球隊維持相鄰獨立島。30 城市各一份特色配置，29 組新增程序模型，勇士沿用既有金門大橋。海岸有受限的形狀變化，不改主場、球場或景點 ID | `city-landmarks.js`、`three-map/cities.js`、`archipelago-core.js` |
| 自創第 31 隊 | 中文／英文名、縮寫、虛構城市、三種原創幾何隊徽、隊色、主客球衣色、球館、理念及五名自訂球員。即時預覽、驗證、儲存與讀回。未儲存不套用 | `franchise-core.js`、`franchise-ui.js` |
| 專屬島嶼 | 基礎球場、辦公室、訓練小館、隊徽看板與道路；經西岸外側短橋接入舊路網，橋路避開勇士球場與碼頭障礙。初始建築可觀看，升級功能標示開發中 | `franchise-world.js`、`three-map/cities.js`、`vector-map.js` |
| 快速對戰 MVP | 從現實 30 隊選對手、3–5 人陣容、進攻與防守戰術。四個關鍵回合各最多 6.5 秒：投籃時機兩次、真正出手時封阻兩次。能力／戰術／種子產生基礎比分，投中 +3、封阻使對手 −4。結算勝負／平手、資金、戰績；可暫離續玩，重新整理仍保留倒數基準 | `franchise-core.js`、`franchise-ui.js`、`franchise.css` |
| 三層觀看與角色操作 | 世界、城市、角色視角；WASD／方向鍵／Pointer Event 搖桿沿路網移動。鬆開、中斷、背景、離頁清理輸入。選站仍使用舊路網與入口。角色視角鏡頭跟隨 | `explore-controls.js`、`map-controller.js`、`three-map/main.js` |
| 車輛／NPC | 沿用七款跑車與兩款交通車。勇士近景可進行封閉車道試駕：向上／W 油門、鬆開煞車、路線自動轉向，維持車距、車輪與夜間頭燈；下車回原停留點。點灣區場景 NPC 可閱讀原創指路對話，與真人房間分開 | `three-map/vehicles.js`、`main.js`、`explore-controls.js` |
| 未來契約 | 六城市指標、四種初始／八種未開放建設、42 個保留歷史槽、七年代配置。未查核歷史內容不發布，追思點不連小遊戲 | `franchise-core.js`、`history-contract.js`、`FRANCHISE_ROADMAP.md` |

對戰是**離線遊戲模擬**，不是 NBA 即時賽果、預測或真人連線。初始球員能力為遊戲自訂，對手依 ID 產生穩定的遊戲平衡配置，並非真實球員評分或球隊戰力排名。球隊資金初始 1,000，勝／平／負獎勵 120／70／40；它與舊商店島幣分開，既有餘額不變。同一對戰 ID 不重複發獎。

## 資料保護與美術

新資料獨立保存於 `nba-policy-island:franchise:v1`；原球隊、球場、地標、造型、政策、合影、購物和邀請鍵不改名。真實隊伍陣列維持 30 筆；虛構隊伍／島分別為 `my-franchise`／`island-my-franchise`，不混入 NBA 模擬賽事資料。修改球隊後，已完成或進行中的比賽保留建立當時快照。儲存遭拒時，本頁仍可操作並提示無法跨重新整理保存。

正式 3D、角色、照片、15 原遊戲與向量備援繼續使用前版平滑非像素美術，標準畫質保持抗鋸齒。舊像素素材只留作舊資料相容和回歸檢查，未重新設為預設。30 張使用者隊徽未刪除或替換；36 個本地 GLB 與署名沿用，本次城市模型、隊徽模板和基地為原創程序幾何。詳見 [素材授權](../ASSET_LICENSES.md)。

## 實際測試

| 執行內容 | 結果／證據 | 範圍 |
| --- | --- | --- |
| `node --test tests/*.test.cjs` | **311／311 通過** | 原 299 項加 12 項：球隊驗證／存讀、阻擋儲存、30 城市對應、陣容與戰術、固定時計、四回合、勝負平手、重複發獎、快照、42 槽、專屬島尋路與橋段碰撞清理 |
| `python tests/check-static.py`、`node --check` | 通過 | HTML ID／ARIA 關聯、相對路徑、SVG、素材、30 隊徽、模組語法；舊像素素材檢查為相容性驗證，不代表正式顯示它們 |
| `node tests/franchise-browser.cjs` | **7 組流程＋6 尺寸通過，無 page error／404** | 實際 Chrome：建立、拒絕重複背號、預覽／儲存、專屬島、四次成功操作、獎勵、編輯／讀回、年代、步行、試駕、向量備援、逾時；六種版面各測建立／操作／旋轉 |
| `node tests/franchise-opening.cjs` | **4 組通過** | 實際十秒開場、預設靜音、開始旅程、再次進站略過、減少動態重播與繼續 |
| `node tests/stylized-browser.cjs` | **19 組原功能回歸通過** | 30 隊、三樣板、主場 raycast、售票 2700／2400／1800、跨島購物、收藏／PNG、每日偶遇、真正 30 秒投籃結束／重開、其餘 14 場操作／離場、舊資料、記憶簿、手機模擬及實際 WebGL 建立失敗備援 |
| `node tests/stylized-performance.cjs` | 6 項檢查通過，見下表 | 同一實際 Chrome／RTX 5060 Laptop GPU，靜止總覽停止重繪、主客場亮燈、完賽關圈但保留夜燈、三輪 LRU／資源穩定 |

瀏覽器測試以本機 HTTP 的 **`/nba-policy-island/`** 路徑提供檔案。六種視窗：360×800、390×844、844×390、768×1024、1024×768、1920×1080。觸控使用 Chrome touch／pointer 模擬；**不是實體手機、iPad、Android 或 macOS Safari 測試**。原 15 款遊戲仍為既有規則，不能把本次抽測宣稱為 15 款歷史改造及 90 組完整真機驗收。

## 效能實測

| 情境 | FPS | Draw Calls | 畫質／說明 |
| --- | ---: | ---: | --- |
| 桌面勇士 | 60.00 | 614 | 中畫質 |
| 桌面湖人 | 60.00 | 303 | 中畫質 |
| 桌面公牛 | 60.00 | 194 | 中畫質 |
| 390×844 手機模擬，初次近景 | 28.07 | 291 | 低畫質，載入／暖機中，未達 30 目標 |
| 同一手機模擬，暖機後 | 30.00 | 291 | 低畫質、平滑非像素，無真機效能結論 |

首個繪製約桌面 2.23 秒／手機模擬 1.46 秒；首批近景模型就緒約 5.27／3.87 秒（本機 HTTP 與目前硬體，非公開網路保證）。三輪勇士→湖人→公牛後為 835 幾何、34 貼圖，詳細島快取不超過 2；JS heap 約 89–117 MB 波動，並非 GPU 記憶體量。手機低畫質快取為 1。按需模型、實例化、LOD、共用材質、視野裁切與不可見暫停保留；沒有同時載入 30 座高細節城市。

原始報告：[新流程](./franchise-preview/browser-report.json)、[開場](./franchise-preview/opening-report.json)、[原功能](./franchise-preview/regression/browser-report.json)、[效能](./franchise-preview/performance/performance-report.json)。

## 畫面對照與手動動線

舊版為先前實際瀏覽器截圖，沒有重新製造「改版前」畫面：[前版全島](./through-ages-preview/overview-day.png)、[前版勇士](./through-ages-preview/warriors-day.png)。本版實際截圖：[開場](./franchise-preview/opening.png)、[全島白天](./franchise-preview/world-day.png)、[全島夜晚](./franchise-preview/performance/overview-night.png)、[勇士白天](./franchise-preview/warriors-city-day.png)、[勇士夜晚](./franchise-preview/warriors-city-night.png)、[球隊編輯](./franchise-preview/franchise-desktop.png)、[專屬島](./franchise-preview/my-island.png)、[快速對戰結算](./franchise-preview/championship-result.png)、[手機操作](./franchise-preview/championship-mobile.png)。

1. 右上主選單 → 我的球隊 → 改隊名、隊徽、球衣與球員 → 儲存。修改後先不儲存，確認預覽不會套用到島上。
2. 我的城市 → 前往專屬島。看基礎球場、辦公室、訓練小館與隊徽；按世界總覽，角色位置不變。再由清單進勇士或湖人，確認舊入口仍可操作。
3. 冠軍挑戰 → 選對手、陣容、戰術 → 開始。金色區投籃、等真正出手再封阻；看結果與資金，重新整理後回看戰績。途中關閉再回來，倒數不會因暫離重設。
4. 勇士近景 → 角色視角 → WASD／搖桿走路；試駕後向上加速、鬆開煞車，下車回原位置。切夜景及完賽，確認道路／頭燈保留，LIVE 脈動停止。
5. 收藏中心 → 換裝、舊合影、球星偶遇、景點 PNG、購物車；驗證自己的舊存檔。選公共球場測原小遊戲並返回。

仍待：實體 iPhone／Android／iPad、macOS Safari、觸控筆電多輸入與長時間效能；不同 GPU／弱網載入；全部城市美術逐一目視精修。Supabase 設定目前為空，真人跨裝置 PK **待驗**，沒有假玩家測試。這版不提供自由轉向開車、完整賽季、球員交易、城市建設消費、42 筆完整史實或五對五即時籃球；後續範圍見 [開發計畫](./FRANCHISE_ROADMAP.md)。

## 九週課堂對應

| 週次 | 對應功能 | 檔案位置 | 展示方式 |
| --- | --- | --- | --- |
| W02 | 主選單、場地清單、語意導覽 | `index.html`、`franchise-ui.js` | 七項選單 → 城市 → 球場 |
| W03 | SVG 隊徽、原隊徽、政策比較表 | `franchise-core.js`、`index.html` | 切隊徽模板；勇士三方案比較 |
| W04 | 互動後音效與原遊戲音效 | `journey-ui.js`、`assets/audio/` | 開場按音效；球場進球／終場 |
| W05 | 球隊／球員／陣容／戰術表單 | `franchise-ui.js` | 重複背號錯誤 → 修正並儲存 |
| W07 | 隊色、可讀文字、對比分數 | `franchise.css`、`three-map/hud.css` | 配色預覽、手機結算 |
| W08 | HUD、模態面板、鏡頭及圖層 | `three-map/main.js`、`cities.js` | 世界 → 城市 → 角色，旋轉裝置 |
| W09 | 能力／戰術／命中／勝負／獎勵運算 | `franchise-core.js` | 四回合操作，查看結算 |
| W11 | 物件、快照、localStorage、DOM | `franchise-core.js`、`franchise-ui.js` | 編輯不改舊戰績；重新整理讀回 |
| W12 | 委派、submit、Pointer、鍵盤與計時 | `franchise-ui.js`、`explore-controls.js`、`input-manager.js` | 觸控投籃、搖桿取消、逾時計算 |
