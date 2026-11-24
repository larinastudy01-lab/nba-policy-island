# 九週課堂功能與展示

目前是 16 主場、16 主場合影點、3 偶遇點、15 球場／15 遊戲的原生 HTML／CSS／JavaScript 專案。可直接開啟 index.html，使用相對路徑並支援 `/nba-policy-island/`。本次未開啟瀏覽器、push、部署、套用 SQL 或修改 Supabase。

另已加入 20 個美國街景、4 個步行拍照點、6 款獨立跑車與 2 條巡遊環線。地標與車輛沿用同一 world／鏡頭；操作、177 項測試與待手動項目見 [SCENERY.md](./SCENERY.md)。

| 週次 | 對應功能 | 檔案位置 | 展示方式 |
| --- | --- | --- | --- |
| W02 CH03 | a 導覽、分類清單、dl 球隊、time 開賽時間、ol 步驟 | index.html、script.js | 常駐清單到西岸；選站抵達後看球隊／開賽資訊 |
| W03 CH04 | figure／alt／figcaption、景點／六車分層 SVG、60 席比較表 | index.html、sights/、cars/、sights-core.js、policy-core.js | 看金門橋與車款；拍景點照；保留席 2,400 點 |
| W04 CH05 | audio 本地進球／終場聲、noscript 簡版指南 | index.html、shot-hit.wav、round-end.wav、script.js | 勾音效，完成一球與結算；關閉後仍有文字回饋 |
| W05 CH06 | 政策 radio、場地 select／optgroup、label、fieldset、range、造型／暱稱表單 | index.html、fan-ui.js、games-ui.js | 試三方案、換裝儲存；下拉選屋頂球場與試玩 |
| W07 CH08 | 隊色、夜景／車頭光束、LIVE、席位圖例與等寬比分 | scenery.css、bay.css、island-core.js | 日夜切換；完賽停止脈動但保留車燈／道路照明 |
| W08 CH09 | 共用 world、absolute、按 y 排序、鏡頭與分流熱區 | scenery.css、bay.css、explorer-ui.js | 拉近橋面；人物走側道，車走車道；關閉回街區 |
| W09 CH12 | 路徑、轉向／圓弧減速、NPC 插值、政策與勝負計算 | traffic-core.js、explorer-core.js、policy-core.js、games-core.js | 720S 過橋轉彎；途中改道；保留席 2,400 點 |
| W11 CH13 | 景點／六車／球隊／造型／相片／遊戲的獨立物件與 DOM | sights-core.js、traffic-core.js、explorer-ui.js、fan-core.js | 地圖清單同站；景點照與兩冊球星照互不影響 |
| W12 CH14 | addEventListener、preventDefault、車／人共用 interval、清理 | explorer-ui.js、script.js、fan-ui.js | 背景／全島暫停車流，減少動態靜止；拍照下載 |

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

本次最終結果：**177 項 Node 測試通過，0 失敗**。15 個執行用 JS 與三個素材產生器語法通過。269 個靜態 HTML ID 唯一，錨點與素材支援本機／Pages 子路徑；原有素材與 40 份景點日夜圖、18 份車圖、8 種景點照片 XML、7 份 CSS 括號及兩個本地 PCM WAV 通過。

範圍包括城市相對方位、34 熱區矩形在 viewBox 內且不互相覆蓋；16 主場合影點／15 遊戲／3 偶遇點；台灣跨日、同日一致、舊照讀取與兩類並存；15 款開始、有效操作、計分、勝負／平手、截止與重開；單次事件綁定、換場／離場清理；原有角色、政策、賽況及主場亮燈。

房間測試使用 Node 的資料形狀替身，驗證局數／共同種子／結構化成績、v2 能力檢查、猜招不產生假對手且只揭曉後端已完成回合。SQL 僅做 RPC／權限與封存條件的結構契約，**沒有 PostgreSQL 執行、RLS／並行交易或兩台真人裝置實測**。

PNG 測試用 Image／Canvas／DOM 替身驗證自包含 SVG、匯出尺寸及按鈕協定，**沒有實際瀏覽器光柵化／下載或手機存檔測試**。

## 由你手動確認

- 地圖四面環海、立體球館與露天球場可辨識，西岸／沙漠／高地／五大湖／東岸與南端的相對方位清楚；34 地標的名稱、熱區及建築在桌機、手機、200% 縮放下對齊。矩形檢查不能取代實際排版。
- 手機清單選站、Tab／Enter／Space、方向鍵、1／2／3、range 拖曳及所有按鈕觸控。記憶播放期不能輸入，猜招選定後鎖定，節拍／真出手提示可讀。
- 15 款逐一完成、重玩與回場，檢查音效、罰秒、倒數、截止、連擊、同分與全能賽各項分數；切場後舊操作不再計分。
- 勇士三方案、既有政策勾號、角色／照片儲存、湖人夜場／完賽關燈與減少動態效果。
- 主場與偶遇實際拍照、PNG 的人物／背景／中文字／日期，手機下載或「另存 PNG」；換裝／隔日後舊照維持原樣。
- 由你手動套用原始＋增量 SQL 並配置公開金鑰後，依 MULTIPLAYER.md 驗證兩裝置同題、封存猜招、重複／第三人、舊局重送、權限及斷線。
