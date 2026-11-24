# 九週課堂功能與展示

目前是 16 主場、16 主場合影點、3 偶遇點、15 球場／15 遊戲的原生 HTML／CSS／JavaScript 專案。可直接開啟 index.html，使用相對路徑並支援 `/nba-policy-island/`。本次未開啟瀏覽器、push、部署、套用 SQL 或修改 Supabase。

目前為等距像素版：6 種球館、3 套球場、20 景點、6 款跑車、8 種路人、9 種小物與八方向中性球迷。保留 4 個觀景拍照點、兩條巡遊線及全部互動 ID。188 項測試與球衣圖格規格、離線日夜比對圖見 [PIXEL_ART.md](./PIXEL_ART.md)；景點位置與車款見 [SCENERY.md](./SCENERY.md)。

| 週次 | 對應功能 | 檔案位置 | 展示方式 |
| --- | --- | --- | --- |
| W02 CH03 | a 導覽、分類清單、dl 球隊、time 開賽時間、ol 步驟 | index.html、script.js | 常駐清單到西岸；選站抵達後看球隊／開賽資訊 |
| W03 CH04 | figure／alt／figcaption、原創像素 PNG／SVG、60 席比較表 | index.html、pixel/、pixel-core.js、policy-core.js | 比較六種球館與三類球場；拍景點照；保留席 2,400 點 |
| W04 CH05 | audio 本地進球／終場聲、noscript 簡版指南 | index.html、shot-hit.wav、round-end.wav、script.js | 勾音效，完成一球與結算；關閉後仍有文字回饋 |
| W05 CH06 | 政策 radio、場地 select／optgroup、造型／暱稱表單 | index.html、fan-ui.js、games-ui.js | 更改暱稱／膚色後儲存；玩家穿中性上衣，球衣僅預留 |
| W07 CH08 | 隊色、像素材質、窗光／路燈／車燈、LIVE 與等寬比分 | pixel.css、pixel-core.js、island-core.js | 全島日夜比對；完賽停止脈動但保留街道照明 |
| W08 CH09 | 共用 world、像素格、absolute、人物分層與鏡頭熱區 | pixel.css、explorer-ui.js、pixel/player/ | 拉近場館入口；換街區與回全島保持人物原位 |
| W09 CH12 | 整數格繪圖、方向判斷、插值、政策／遊戲運算 | pixel-core.js、explorer-core.js、policy-core.js、games-core.js | 人物八方向走路；學生保留席 2,400；不同遊戲結算 |
| W11 CH13 | 16 隊模型對應、身體／上衣、相片版本及 DOM | pixel-core.js、fan-core.js、fan-ui.js、script.js | 舊相片維持原畫風，新照片為像素快照 |
| W12 CH14 | 事件、150ms 精靈幀、共用動畫 interval、清理 | explorer-ui.js、bay-scene.js、script.js | 移動停止回 idle；背景暫停；減少動態直接抵達 |

表格中的檔案除 index.html、script.js、style.css 外均位於 assets。完整球迷／照片動線見 [FAN_GUIDE.md](./FAN_GUIDE.md)，15 款規則見 [README](../README.md)，好友設定與兩裝置步驟見 [MULTIPLAYER.md](./MULTIPLAYER.md)。

本版以 [FINAL_ACCEPTANCE.md](./FINAL_ACCEPTANCE.md) 的五條灣區／座位／試玩／雙裝置動線為準；一般鏡頭操作見 [EXPLORER.md](./EXPLORER.md)，下方原有政策、合影、遊戲示範也持續可用。

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

本次最終結果：**188 項 Node 測試通過，0 失敗**。21 份 JavaScript 與兩支 Python 語法通過。270 個 HTML ID 唯一、8 份 CSS 及所有相對路徑通過；130 組像素 PNG／SVG 檢查原始尺寸、PNG CRC／解壓資料及整數格；另含 16 位像素球星與 16 場館室內 SVG。六種球館、六款車、八種路人的輪廓有實際差異，八方向各四個走路幀。完整路網及原有 34 站 ID／座標／球場遊戲配對與 Git 上一版相同。

範圍包括城市相對方位、34 熱區矩形在 viewBox 內且不互相覆蓋；16 主場合影點／15 遊戲／3 偶遇點；台灣跨日、同日一致、舊照讀取與兩類並存；15 款開始、有效操作、計分、勝負／平手、截止與重開；單次事件綁定、換場／離場清理；原有角色、政策、賽況及主場亮燈。

房間測試使用 Node 的資料形狀替身，驗證局數／共同種子／結構化成績、v2 能力檢查、猜招不產生假對手且只揭曉後端已完成回合。SQL 僅做 RPC／權限與封存條件的結構契約，**沒有 PostgreSQL 執行、RLS／並行交易或兩台真人裝置實測**。

照片 PNG 測試用 Image／Canvas／DOM 替身驗證自包含 SVG、匯出尺寸及按鈕協定，**沒有實際瀏覽器光柵化／下載或手機存檔測試**。另已用本機程式離線合成並檢視全島日／夜、灣區近景、模型一覽與球迷精靈表；這些是美術比對圖，不是瀏覽器或螢幕截圖。

## 由你手動確認

- 地圖四面環海、立體球館與露天球場可辨識，西岸／沙漠／高地／五大湖／東岸與南端的相對方位清楚；34 地標的名稱、熱區及建築在桌機、手機、200% 縮放下對齊。矩形檢查不能取代實際排版。
- 手機清單選站、Tab／Enter／Space、方向鍵、1／2／3、range 拖曳及所有按鈕觸控。記憶播放期不能輸入，猜招選定後鎖定，節拍／真出手提示可讀。
- 15 款逐一完成、重玩與回場，檢查音效、罰秒、倒數、截止、連擊、同分與全能賽各項分數；切場後舊操作不再計分。
- 勇士三方案、既有政策勾號、角色／照片儲存、湖人夜場／完賽關燈與減少動態效果。
- 主場與偶遇實際拍照、PNG 的人物／背景／中文字／日期，手機下載或「另存 PNG」；換裝／隔日後舊照維持原樣。
- 由你手動套用原始＋增量 SQL 並配置公開金鑰後，依 MULTIPLAYER.md 驗證兩裝置同題、封存猜招、重複／第三人、舊局重送、權限及斷線。
