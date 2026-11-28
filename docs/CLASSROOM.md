# 九週課堂功能與展示

本次最新版為 **`journey-franchise-v2`｜夢回 NBA**。新增七項主選單、自創第 31 隊表單／SVG 隊徽、專屬島嶼、快速對戰、角色道路操作與 30 城市特色。原 30 隊、15 場與資料進度沿用。最新九週表、實際測試、畫面與未完成範圍見 [本版報告](./FRANCHISE_JOURNEY_V2.md)，後續課程尚未公布的任務見 [擴充計畫](./FRANCHISE_ROADMAP.md)。以下為歷次紀錄。

目前第一階段為 **`through-ages-v1`「夢回 NBA：穿越籃球時光」**。新增十秒可略過開場、七年代、黃昏、三級畫質、漸進教學與平滑向量備援；30 隊、15 場原玩法、商店與進度沿用。[完整修改、畫面、299 項測試與效能](./THROUGH_THE_AGES_PHASE1.md)。新輸入模組涵蓋 Pointer Events、雙指縮放與既有遊戲按鈕；歷史版虛擬搖桿等後續工作仍另列待辦。下方保留各版原始紀錄，請以第一階段報告的範圍與待驗項目為準。

歷史旅程與跨裝置需求已納入 [修訂計畫](./NBA_HISTORY_JOURNEY_PLAN.md)及 [跨裝置必要驗收規格](./CROSS_PLATFORM_REQUIREMENTS.md)。目前十五款歷史專屬玩法與共用 InputManager 尚待開發；[九十組測試報告](./CROSS_PLATFORM_TEST_REPORT.md)未把原遊戲抽測列為歷史版本通過。

目前最新為 **`geographic-stylized-v2` 美國地理群島與非像素 3D 版**：30 隊城市投影、同 ID 的橋路網、七款跑車／兩款城市車、3D 換裝／尋星／記憶簿／商品，以及 15 款遊戲的 3D 視覺。291 項終端機測試與實際 Chrome、PNG、手機模擬測試已完成。最新九週表、畫面與待驗範圍見 [地理群島報告](./GEOGRAPHIC_STYLIZED_V2.md)。下方為歷代課堂與測試紀錄，不代表新版本仍以像素風為預設；原球衣規格與舊合影仍保留相容性。

隊徽總覽已改為 **30 枚常駐屋頂標記**（22 px／窄地圖 20 px），近景沿用同一枚作球館招牌。可展示 W08 球館圖格錨點、反向縮放與水面小標籤；W09 在九種寬度檢查隊徽矩形與入口／橋頭座標；W11 共用圖源和主場 LIVE 資料；W12 指向／聚焦名稱、鍵盤進館、容器 resize 觀察及離頁清理。展示「全島 → 湖人／快艇 → 勇士正門 → 回全島 → 夜晚／完賽」，完整規則與手動項目見 [隊徽指南](./TEAM_LOGOS.md)。

新增 [30 隊隊徽接入](./TEAM_LOGOS.md)：使用者提供的 30 張素材已逐張核對，公牛紅牛頭與騎士金邊 C 依圖案綁定。清單搜尋 → 球隊島招牌 → 主場抬頭／主客隊記分板 → 商店購物列／記憶簿共用隊伍資料。可展示 W03 圖片自然比例與裝飾圖替代文字、W08 圖框與場景定位、W11 物件／DOM、W12 載入失敗縮寫備援；原檔保留，網站用內容相同且副檔名正確的 PNG 副本。手機排版與部署後新增隊徽 HTTP 請求仍待手動確認。

最新屋頂隊徽版驗證為 **254 項測試通過、0 失敗**，33 份專案 JavaScript／CJS 語法、347 個唯一 HTML ID、12 份 CSS 與素材路徑通過。九種寬度的隊徽矩形、入口／橋頭座標、LIVE 主客場、近景招牌與觀察器清理已測；30 張圖片維持上一版解碼及透明通道核對過的原圖副本。實際手機構圖與人物遮擋仍待目視。下方保留商店與群島版本的測試紀錄。

最新加入 [W12 球隊商店與共用購物車](./SHOPPING.md)：勇士店加入帽子 → 跨橋到湖人店加迷你籃球 → 總額 280 → 事件委派刪除／改數量 → submit 驗證不足餘額 → 成功後收藏、餘額 920 與清車 → 重新整理仍保留。每店四商品，預設首次 1,200 測試島幣；本版不自動裝備，球衣素材由使用者後續製作。動態購物列只在容器綁一次事件，檔案為 `assets/shop-ui.js`，交易運算／本機快照為 `assets/shop-core.js`。

目前工作區已開放 **30／30 座球隊島**，以分區總覽、區內隊名、可搜尋清單、短橋與跨海主幹道探索。新增 14 套城市像素場景與主場，完整路線／範圍見 [30 隊群島](./THIRTY_ISLANDS.md)。原 16 個固定球星合影點與合影冊、15 款遊戲、造型／政策儲存不變；新增 14 隊合影入口明確標為尚未開放。可用 W05 搜尋表單、W08 地圖分層、W09 路徑與搜尋、W11 球隊／共用事件資料、W12 導覽與抵達作展示。以下保留原版本課堂說明，舊測試數量是該版紀錄，本版以新指南為準。

本次商店版終端機結果為 **240 項測試通過、0 失敗**，含新增 12 項購物交易測試與 7 項 DOM 事件測試；32 份專案 JavaScript／CJS 語法、344 個唯一 HTML ID、11 份 CSS、186 組像素 PNG／SVG、12 份商店 SVG 與相對路徑通過。跨島購物、刪除、數量驗證、餘額不足、成功結帳、儲存失敗不扣幣與重新載入已測試。先前 30 島版為 221 項測試；尼克短橋到籃網、勇士跨區到火箭及回總覽保留位置的路網與 DOM 事件替身測試亦保留。實際手機、商店排版、鍵盤走訪與 PNG 下載仍待手動預覽。

最新加入 [球迷記憶簿](./MEMORIES.md)：五個原創像素歷史展點、官方史料連結、自主標記／回看與獨立儲存。湖人用靜態紀念牆、公牛用可選投籃點，沿原跨島路網探索。可展示 W02 導覽／time／來源清單、W03 圖說、W05 靜態瞄準滑桿、W08 接近提示與原生 dialog、W09 命中判斷、W11 事件資料／DOM／localStorage、W12 抵達／鍵盤／計時清理。新測試見 `tests/memory.test.cjs` 及 `tests/ui.test.cjs`；畫面、觸控與真人連線仍須手動驗證。

布局為「一支球隊一座島」：30 座獨立島岸、跨海主幹道、島內入口路網與分級熱區。資料在 `assets/archipelago-core.js`，像素地景生成在 `assets/archipelago-art.cjs`；新版本入口與跨島驗收見 [THIRTY_ISLANDS.md](./THIRTY_ISLANDS.md)。可接在 W08 定位／圖層、W09 路徑運算、W11 資料與 DOM、W12 導覽／動畫事件展示。

目前是 30 主場、16 個已開放球星合影點、3 偶遇點、15 球場／15 遊戲的原生 HTML／CSS／JavaScript 專案。可直接開啟 index.html，使用相對路徑並支援 `/nba-policy-island/`。本次未開啟瀏覽器、push、部署、套用 SQL 或修改 Supabase。

目前為等距像素版：6 種球館、3 套球場、20 景點、6 款跑車、8 種路人、9 種小物與八方向中性球迷。保留 4 個觀景拍照點、兩條巡遊線及全部互動 ID。188 項測試與球衣圖格規格、離線日夜比對圖見 [PIXEL_ART.md](./PIXEL_ART.md)；景點位置與車款見 [SCENERY.md](./SCENERY.md)。

| 週次 | 對應功能 | 檔案位置 | 展示方式 |
| --- | --- | --- | --- |
| W02 CH03 | a 導覽、分類清單、dl 球隊、time 開賽時間、ol 步驟 | index.html、script.js | 常駐清單到西岸；選站抵達後看球隊／開賽資訊 |
| W03 CH04 | figure／alt／figcaption、原創像素 PNG／SVG、60 席比較表 | index.html、pixel/、pixel-core.js、policy-core.js | 比較六種球館與三類球場；拍景點照；保留席 2,400 點 |
| W04 CH05 | audio 本地進球／終場聲、noscript 簡版指南 | index.html、shot-hit.wav、round-end.wav、script.js | 勾音效，完成一球與結算；關閉後仍有文字回饋 |
| W05 CH06 | 30 隊搜尋、政策 radio、場地 select／optgroup、造型表單 | index.html、script.js、fan-ui.js、games-ui.js | 搜尋 BKN／Houston；更改暱稱後儲存；球衣僅預留 |
| W07 CH08 | 隊色、像素材質、窗光／路燈／車燈、LIVE 與等寬比分 | pixel.css、pixel-core.js、island-core.js | 全島日夜比對；完賽停止脈動但保留街道照明 |
| W08 CH09 | 共用 world、像素格、absolute、人物分層與鏡頭熱區 | pixel.css、explorer-ui.js、pixel/player/ | 拉近場館入口；換街區與回全島保持人物原位 |
| W09 CH12 | 整數格繪圖、方向判斷、插值、政策／遊戲運算 | pixel-core.js、explorer-core.js、policy-core.js、games-core.js | 人物八方向走路；學生保留席 2,400；不同遊戲結算 |
| W11 CH13 | 30 隊／14 城市模型、16 球星、共用事件／多入口、DOM | city-art.cjs、memory-core.js、fan-core.js、script.js | 搜尋新島；原合影不變；同事件多入口只算一筆閱讀 |
| W12 CH14 | 購物車事件委派、submit／preventDefault、動畫／計時清理 | shop-ui.js、shop-core.js、explorer-ui.js、script.js | 點動態刪除按鈕內文字；修改數量；不足與成功結帳；跨島及重整保留 |

表格中的檔案除 index.html、script.js、style.css 外均位於 assets。完整球迷／照片動線見 [FAN_GUIDE.md](./FAN_GUIDE.md)，15 款規則見 [README](../README.md)，好友設定與兩裝置步驟見 [MULTIPLAYER.md](./MULTIPLAYER.md)。

本版以 [FINAL_ACCEPTANCE.md](./FINAL_ACCEPTANCE.md) 的五條灣區／座位／試玩／雙裝置動線為準；一般鏡頭操作見 [EXPLORER.md](./EXPLORER.md)，下方原有政策、合影、遊戲示範也持續可用。

## Stylized 3D 整合版補充

本機整合分支 `integration/stylized-three-v1` 的功能、實際 Chrome 測試、畫面與待驗範圍見 [STYLIZED_3D_INTEGRATION.md](./STYLIZED_3D_INTEGRATION.md)。以下舊版測試數字不是本版結果。

| 週次 | 對應功能 | 檔案位置 | 展示方式 |
|---|---|---|---|
| W02 | 導覽、清單、場館資料 | `index.html`、`script.js` | 收合清單，搜尋 30 隊，查看開賽時間。 |
| W03 | 圖像、政策表格 | `assets/three-map/photo.js`、`index.html` | 下載合影 PNG，對照三政策表與座位圖。 |
| W04 | 本地音效 | `script.js`、`assets/shot-hit.wav`、`assets/round-end.wav` | 遊戲開始操作後開音效，投進與終場。 |
| W05 | 表單驗證 | `assets/shop-ui.js`、`assets/fan-ui.js` | 換裝儲存、商品正整數數量及模擬結帳。 |
| W07 | 色彩、文字與隊色 | `assets/three-map/models.js`、`hud.css` | 比較勇士／湖人／公牛與日夜照明。 |
| W08 | 定位、圖層與鏡頭 | `assets/map-controller.js`、`assets/three-map/main.js` | 全島 → 近景 → 實體入口；HUD 不擋互動。 |
| W09 | 運算與判斷 | `assets/policy-core.js`、`assets/games-core.js` | 試算 2,400 點、遊戲計分與平手。 |
| W11 | 物件、DOM 與共用資料 | `script.js`、`assets/three-map/world.js` | 同一 ID 同時驅動清單、3D 地標與面板。 |
| W12 | 事件、委派與計時 | `assets/shop-ui.js`、`assets/three-map/main.js` | 購物車動態按鈕、30 秒遊戲、離場／對話框暫停。 |

## 建議展示動線

1. 湖人看模擬 LIVE（勇士客隊不亮），切完賽保留 101：108 並關燈。
2. 勇士「門票怎麼分？」選學生保留席，試算 20／40 人、2,400 點，確認進度保留。其他兩方案仍為 0／60／2,700 與期望值 15／45／1,800。
3. 我的球迷儲存造型 → 勇士找柯瑞 → 主場合影收藏／下載 PNG。指定本機 2026-01-01 → 西岸碼頭步道揭曉柯瑞 → 偶遇合影收藏／下載。換裝、改日期後從兩個分頁看舊照。
4. 潮汐投籃 → 榕樹繞樁 → 中央草地電腦猜招 → 霓虹節奏，示範四種操作。再依 README 場地表進入其餘十一款，最後展示星光屋頂的三項全能賽。
5. 每場先讀操作／勝負／上限，再單人練習、有效操作、結算、重玩、回球場。單人猜招標「電腦」，其他場沒有假對手。

## 終端機實測

```powershell
node --check script.js
Get-ChildItem assets -Filter *.js | ForEach-Object { node --check $_.FullName }
node --check assets/generate_fan_assets.cjs
node --check assets/generate_bay_assets.cjs
node --test tests/*.test.cjs
python tests/check-static.py
git diff --check
```

先前像素版的測試紀錄為 **188 項通過**，不是本版結果。30 島版的測試與手動項目統一列於 [THIRTY_ISLANDS.md](./THIRTY_ISLANDS.md)：素材現為 186 組 PNG／SVG；原 16 位像素球星與 16 場館室內 SVG 保留。原站點 ID／球場遊戲配對保留，東岸部分座標隨擴建更新。

範圍包括城市相對方位、34 熱區矩形在 viewBox 內且不互相覆蓋；16 主場合影點／15 遊戲／3 偶遇點；台灣跨日、同日一致、舊照讀取與兩類並存；15 款開始、有效操作、計分、勝負／平手、截止與重開；單次事件綁定、換場／離場清理；原有角色、政策、賽況及主場亮燈。

房間測試使用 Node 的資料形狀替身，驗證局數／共同種子／結構化成績、v2 能力檢查、猜招不產生假對手且只揭曉後端已完成回合。SQL 僅做 RPC／權限與封存條件的結構契約，**沒有 PostgreSQL 執行、RLS／並行交易或兩台真人裝置實測**。

照片 PNG 測試用 Image／Canvas／DOM 替身驗證自包含 SVG、匯出尺寸及按鈕協定，**沒有實際瀏覽器光柵化／下載或手機存檔測試**。另已用本機程式離線合成並檢視全島日／夜、灣區近景、模型一覽與球迷精靈表；這些是美術比對圖，不是瀏覽器或螢幕截圖。

## 由你手動確認

勇士海灣改版的實際前後截圖、路網／碰撞／NPC 檢查與本機頁面驗收，另見 [WARRIORS_BAY.md](./WARRIORS_BAY.md)。本次 W08 展示獨立鋪面、物件輪廓與多邊形熱區；W09 展示腳底距離與最近目標；W11／W12 展示共用場景資料、抵達提示、鍵盤與單一動畫迴圈。以下早期版本紀錄不代表這次的畫面驗證結果。

- 地圖四面環海、立體球館與露天球場可辨識，西岸／沙漠／高地／五大湖／東岸與南端的相對方位清楚；34 地標的名稱、熱區及建築在桌機、手機、200% 縮放下對齊。矩形檢查不能取代實際排版。
- 手機清單選站、Tab／Enter／Space、方向鍵、1／2／3、range 拖曳及所有按鈕觸控。記憶播放期不能輸入，猜招選定後鎖定，節拍／真出手提示可讀。
- 15 款逐一完成、重玩與回場，檢查音效、罰秒、倒數、截止、連擊、同分與全能賽各項分數；切場後舊操作不再計分。
- 勇士三方案、既有政策勾號、角色／照片儲存、湖人夜場／完賽關燈與減少動態效果。
- 主場與偶遇實際拍照、PNG 的人物／背景／中文字／日期，手機下載或「另存 PNG」；換裝／隔日後舊照維持原樣。
- 由你手動套用原始＋增量 SQL 並配置公開金鑰後，依 MULTIPLAYER.md 驗證兩裝置同題、封存猜招、重複／第三人、舊局重送、權限及斷線。
