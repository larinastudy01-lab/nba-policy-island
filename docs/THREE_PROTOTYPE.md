# Three.js 第一階段：架構、可行性與獨立原型

查核：2026-11-28。正式版本基準：`2399e7c7dba878c5eb73b50f82b5ce3b2095d4e3`。第一階段只新增原型、測試及文件，沒有替換正式地圖、執行遠端 SQL 或變更 Supabase 設定。後續使用者已授權發布，原型維持獨立路徑：[線上 Three.js 試驗場](https://larinastudy01-lab.github.io/nba-policy-island/prototype/three-islands/)，正式首頁仍保留原地圖。

## 判斷

適合採取 **Three.js 場景＋既有 DOM 功能的混合方案**，不適合直接重寫整站。現有的座標、路網、政策運算、遊戲規則和儲存模型已可重用；3D 先替換呈現層即可。WebGL 2 失敗時保留原站入口。

目前僅完成原型程式與終端機驗證；**尚未進行瀏覽器目視、真實 GPU／手機、PNG 或雙裝置驗收，不能判定品質與效能已通過，也不建議立即取代正式地圖**。本次未開啟瀏覽器、無頭瀏覽器或桌面控制。

## 現有架構盤點

| 範圍 | 現況／檔案 | 保護方式 |
|---|---|---|
| 首頁／部署 | 根目錄 `index.html`、`style.css`、`script.js`，無建置流程；GitHub Pages 使用 main 分支根目錄（legacy），目前已發布 | 不改入口或部署設定；新增 `/prototype/three-islands/`，全部相對路徑 |
| 正式地圖 | DOM 按鈕、分層 SVG／PNG，CSS transform 控制鏡頭；非 Three.js、非 Canvas 地圖 | 保留原圖層及所有 ID；原型只讀資料 |
| 30 島／街區 | `assets/archipelago-core.js`，3600×2250 世界座標、獨立岸線、入口、路網與車道 | Three 座標為 `(x×0.1, 2.2, y×0.1)`；沿用原路網，不重新配置主場 |
| 鏡頭／移動 | `explorer-core.js` 純模型；`explorer-ui.js` 處理 DOM、路人與車流 | 原型使用同一 walker、尋路、抵達與取消 token；正交攝影機只影響畫面 |
| 30 隊／15 球場 | `island-core.js` 與 `games-core.js`；15 種獨立規則 | 所有清單入口保留；本階段只有 3 島細節場景 |
| 模擬賽況 | 同場主客隊共用資料；四狀態、LIVE 只在主場 | 直接讀 `gameForTeam()`，不另造比分 |
| 球迷／合影 | `fan-core.js`、`fan-ui.js`，16 個已開放主場合影點、3 偶遇點、台灣日期輪替、SVG→Canvas→PNG | 原型讀既有 avatar，不改照片、收藏、政策 key；完整拍照在原介面操作 |
| 政策 | `policy-core.js`、`script.js`，3 方案、60 席座位圖與完成進度 | 原計算及事件全部保留 |
| 商店 | `shop-core.js`／`shop-ui.js`，勇士與湖人兩店、8 項商品、同一購物車／島幣／收藏快照 | 同源原介面沿用原儲存，不另建 3D 錢包 |
| 記憶簿 | `memory-core.js`，5 個公開事件、共用事件 ID；未公開預留點不展示史料 | 原事件入口／閱讀紀錄不變 |
| 好友房 | `online.js`、`supabase-config.js`、既有 SQL | 設定 URL/key 皆空；不假造連線；遠端同步待驗 |
| 事件 | `click/change/submit/keydown` 均使用 addEventListener；場館／購物 UI 在 closure 內 | 先透過原按鈕進入，避免侵入私有狀態與重綁事件 |

## 原型範圍與使用

依 [原型 README](../prototype/three-islands/README.md) 啟動本機靜態 HTTP。原型不需要 npm、CDN 或 API key；因 ES Modules 安全限制，**原型不支援 file://**，原正式首頁的直接開檔能力不變。

勇士島包含立體岸壁、海面、橋墩與跨海步道、紅色車道橋、橢圓球館、入口階梯與廣場、黃棚店面、半場籃框／圍網、木棧道、小船、停車區、燈／長椅、GLB 樹與車、10 位簡化路人。湖人使用低模圓頂、公牛使用磚牆及階梯式屋頂，兩者為簡化測試島。其他 27 島只做岸線與低精度球館，不載入完整城市。

固定正交斜上視角、限色色盤、平面 Lambert 材質、硬陰影及像素化 canvas。日夜分別調整環境光、窗光、路燈地面亮區及巡遊車光束；LIVE 金色環獨立控制。這是 Voxel／Low-poly 混合呈現，未宣稱全部資產已轉成原版逐像素精靈。

技術依據採官方文件：[GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html)、[InstancedMesh](https://threejs.org/docs/pages/InstancedMesh.html)、[LOD](https://threejs.org/docs/pages/LOD.html)，版本固定於 [r187](https://github.com/mrdoob/three.js/tree/r187)，避免執行時依賴會變動的 CDN latest。模組載入順序依 [HTML script 規範](https://html.spec.whatwg.org/multipage/scripting.html)。

隊徽按鈕及 30 隊搜尋可用鍵盤。點設施後沿道路抵達；再次點選取消舊路線。回全島保留角色位置。原版功能透過同源、延後建立的 iframe 開啟；對話框開啟時停止 3D 更新，關閉時卸載 iframe，讀回球迷並保留 3D 位置。正式 `openLandmark()` 沒有被公開或改寫。

此橋接是第一階段的功能保護措施；會額外載入完整原版頁面，尚非最終產品側欄。原版頁面的鏡頭與 3D 鏡頭各自獨立，不能宣稱兩者已共用單一即時狀態。原型的日夜和停留點只寫獨立 key `nba-policy-island:prototype3d:v1`。

## 素材

實際取得 **2 個 CC0 GLB**（Quaternius Sports Car、Trees 的單樹衍生），合計 477,392 bytes；Three.js r187 已本地封裝。30 個 64×64 隊徽副本合計 198,596 bytes，原始素材不變。不是整合了所有候選素材包。

完整來源、作者、授權、日期、尚未下載的來源、下載障礙及手動匯入步驟見 [ASSET_LICENSES.md](../ASSET_LICENSES.md)。Kenney 端點本次 HTTP 403，因此兩包未匯入；Quaternius 整包、ZaddyFi 包也未下載。Poly Pizza 須逐模型核對，不是全站統一 CC0。

## 效能設計及量測界線

| 技術 | 本版狀態 |
|---|---|
| GLTFLoader | 實際解析兩個本地 GLB；共用 Promise 快取，材質改 Lambert |
| InstancedMesh | 共用道路、橋欄、海面短紋、樹木與路人人體；靜態建築依材質合併幾何 |
| LOD／裁切 | 30 座簡化球館具兩級 LOD，鏡頭距離控制可見細節；使用 Three 內建視錐裁切及計算過 bounds 的 instance |
| 分級載入 | 全島不載細節；選入勇士／湖人／公牛才建立細節。只一島可見，標準最多快取 2 島、省電最多 1 島；超額釋放幾何、招牌紋理及 instance 資源 |
| 模型快取 | 兩個原始 GLB 共用幾何／材質，不因換島再次下載；錯誤顯示在儀表板，保留程序建築 |
| 動畫 | 單一 rAF；背景頁、地圖離開 viewport、原版對話框時停止；全島靜態，減少動態直接抵達 |
| 手機 | 自動省電（viewport <760）：DPR 0.75、30 FPS 上限、取消陰影貼圖、細節快取 1 島；可手動切換 |
| Draco／Meshopt | 未導入；目前 GLB <0.5 MB，不先增加 decoder 成本；後續依量測決定 |

**目前可交付的是終端機資產體積／幾何解析數據及執行時計數器，非已取得真實裝置的效能成績。**

靜態比較輸出為 [三維原型稽核 JSON](three-prototype-audit.json)，由 `node prototype/three-islands/audit.cjs` 重建。HTML 明列的檔案體積不等於首次網路傳輸：它未包含動態載入全部像素圖、CSS 選擇性資源或 HTTP 壓縮／快取。

| 指標 | 原版 DOM／SVG 地圖 | Three.js 原型 |
|---|---|---|
| 執行時首次載入 ms | **待手動量測**，包覆頁可匯出 Navigation/Paint | **待手動量測**，儀表板分首次繪製及首次細節模型就緒 |
| 外部 GLB 模型數 | 0 | 實際 2 檔；幾何解析與雜湊已驗證 |
| Draw calls | 不適用（DOM／SVG 合成不是 WebGL） | 待實測，讀 `renderer.info.render.calls`，不可用靜態 mesh 數冒充 |
| FPS | 待手動 DevTools 量測；包覆頁只量 rAF 間隔 | 待實測，依實際 render callback 估算；停更時不解讀為低 FPS |
| 記憶體 | 待實測，JS heap 如瀏覽器有提供 | 待實測，JS heap 與幾何／紋理計數；**不是 GPU bytes** |
| 真實手機、Pages | 本次未重測 | 原型獨立發布；HTTP 可用性與相對路徑檢查不能取代真實手機、目視及效能驗收 |

原版 [量測包覆頁](../prototype/three-islands/baseline.html) 只增加旁觀計數器，不改原站。測量時一次開一個頁面、相同 viewport／硬體／日夜／場景／畫質，關其他 GPU 分頁；冷載重複 3 次並記錄中位數。兩頁各停留灣區 10 秒匯出 JSON；另用 DevTools Performance 記錄兩頁實際 Paint／frame，不能把 baseline 的 rAF refresh rate 直接等同渲染 FPS。

本次靜態比較：原版 HTML 明列的 49 檔為 1,089,971 bytes；原型入口與模組約 2.54 MB（gzip 估算約 0.55 MB，不代表伺服器會壓縮），另加 0.48 MB GLB、0.20 MB 縮圖。原版隊徽原圖總計 26,332,943 bytes，但不能據此推論它們必然全部在首屏傳輸。模型實際解析為車 3,148 三角形／11 primitives、單樹 8,520 三角形／2 primitives；instance 數會乘上可見實例，primitives 不是實測 draw calls。

建議正式整合門檻（目標，非已通過）：標準桌機灣區穩定 ≥50 FPS、省電手機 ≥28 FPS、冷載至可操作 <3 秒（明記測試網路）、近景 ≤150 draw calls、連續換島後幾何／紋理數無單調攀升；原版全部玩法與進度驗收通過。若任一未達標，原型保持獨立。

## 終端機驗證

實際執行指令及最終筆數見本文件末尾驗收紀錄。新增測試用 Node 24 原生 ES Modules 載入真正 Three.js／GLTFLoader，不建立瀏覽器或 WebGL context。測試圖形幾何可建立、GLB 可解析，**不證明 shader 編譯、像素品質或手勢可用**。

```powershell
node --test tests/*.test.cjs
python tests/check-static.py
node prototype/three-islands/audit.cjs
```

新測試涵蓋 30 隊／15 球場入口、跨島路線及最新點選取消、座標往返、鏡頭不改位置、獨立儲存與損壞回退、主客場比分、手機上限、動畫暫停條件、GLB 雜湊及內嵌 buffer、真正 loader 解析、縮放至地面、instance 共用、細節 LRU、日夜／LIVE 獨立及 iframe UI 指令／關閉卸載。既有測試繼續驗政策三方案、15 款玩法、造型、舊相簿、台灣日期、購物交易及房間規則。

## 手動驗收動線（全部待驗）

1. 依 README 開本機 HTTP，先看全島；鍵盤搜尋 30 隊，逐一選取。測近景、縮放、Home／全島；其餘 27 島應清楚標示低精度。
2. 勇士入口 → 店面 → 半場 → 木碼頭；確認人行道、車道分流、場館和物件不穿透、標誌不遮入口。跨橋去湖人，再選公牛；全島返回不改角色位置。連續點目的地只到最新位置。
3. 點勇士政策：學生保留席應 20／40 人、2,400 點；原價 2,700、抽籤 1,800。關閉原版功能，3D 人物仍在入口。
4. 勇士店加入商品，關閉跨島到湖人店再加入。驗共享購物車、刪除／修改、餘額不足及成功結帳，重新整理保留原資料。
5. 我的球迷儲存 → 主場尋星／偶遇 → 收藏／下載 PNG；原型關閉對話框後讀回造型，舊照片不變。完整造型視覺與 PNG 在原介面驗證。
6. 港邊半場開原版 30 秒遊戲，完成試投、正式局、重開、回場地。手機另測節奏、方向或選項玩法，確認觸控及虛擬鍵盤不遮必要按鈕。
7. 勇士客場打湖人時，只湖人主場 LIVE；改勇士主場後換亮燈。切完賽停止脈動但保留分數；夜景路燈／窗光／車燈持續。
8. 切背景頁、捲離地圖、開原版對話框，檢查計數器停止；返回恢復。切減少動態、省電模式、連續選三島，檢查快取上限與資源數。
9. 相同裝置各開 baseline 與原型，下載效能 JSON。手機真機、WebGL 2 失敗回退、Pages 子路徑與圖片網路錯誤另驗。
10. Supabase 目前未配置：雙裝置 PK 不列通過。日後由使用者配置既有 SQL／公開 key 後，再驗開房、邀請、兩人上限、就緒、同 seed／局數、自己成績權限、結算及重開。禁止用假玩家代測。

## 後續整合及回退

1. **本階段**：獨立原型＋完整原版回退。先收集以上畫面、真機效能及原版 UI 桥接驗收，不預設品質已達標。
2. **接口階段**：將正式 closure 的「選站／抵達／開功能」整理成窄介面，兩個 renderer 共用控制器；先加回歸測試，不改政策、購物、收藏資料結構。以 feature flag 選 DOM 或 Three，避免 iframe 長期重載成本。
3. **單島試營運**：只讓勇士使用 3D，正式其餘 29 島仍低精度或 DOM；逐項對照互動、遮擋、無障礙及儲存。先完成完整角色／裝備圖層與合影視覺一致性，再增島。
4. **擴充**：湖人／公牛通過後按區分包、背景預取最多鄰島；以共用模組、LOD 及低面數預算擴至 30，不能一次載 30 座完整城市。再依實測選 Meshopt／Draco。
5. **正式切換**：須使用者確認目視、效能、功能及 Pages 路徑通過後，才另行授權部署。保留 DOM 開關至少一版；任何 context／載入失敗回原圖。資料不遷移，刪除 prototype 目錄即可回退本階段。

## 九週課堂對照

| 週次 | 對應功能 | 檔案位置 | 展示方式 |
|---|---|---|---|
| W02 | 導覽、球隊清單及資訊 | 原型 `index.html`、`app.js` | 搜尋球隊、回全島及回原版 |
| W03 | 隊徽、模型與政策比較 | `assets/team/`、`asset-library.js`；原版政策表 | 選島、看來源模型、試算 |
| W04 | 本地音效保留 | 原版 `index.html`、`assets/shot-hit.wav` | 從半場開原遊戲並開音效 |
| W05 | 搜尋／畫質／賽況表單、商店 | 原型 HTML；原版 `shop-ui.js` | 切狀態、跨店購物 |
| W07 | 限色色盤及文字層級 | `core.js`、`prototype.css` | 白天／夜晚、清單與比分 |
| W08 | 正交相機、地形／建築層次 | `scene.js`、`app.js` | 近遠景、入口及陰影 |
| W09 | 世界換算、路線及原運算 | `core.js`、原 `explorer-core.js`／政策與遊戲 core | 跨島、2,400 點及投籃結算 |
| W11 | 物件、GLB 快取及 DOM | `asset-library.js`、`app.js` | 換島、儀表板、原造型資料 |
| W12 | 事件、單一動畫與清理 | `app.js`、`legacy-bridge.js` | 點選、開關面板、背景暫停 |

## 驗收紀錄

已執行 `node prototype/three-islands/validate.cjs`：**275／275 項通過、0 失敗、0 跳過**（原有 264 項＋新增 11 項），**67 個 JS／CJS 語法檢查通過**；原版 HTML／SVG／PNG／WAV／CSS 靜態檢查通過。完整指令、環境與結果存於 [validation JSON](three-prototype-validation.json)。新增事件測試使用桌機 1000 與手機 390 寬度的 DOM／renderer 替身，不是實際手機畫面驗收。

另以 Pillow 核對 30 張縮圖都是 64×64 RGBA，保留透明背景；6 個 vendored 套件檔與釘選 npm 原始壓縮檔逐位元相同。第一階段驗收時，唯讀 GitHub API 確認正式 Pages 為 main 分支根目錄、狀態 built，遠端 main 為上述基準 SHA。後續依使用者要求發布新增原型；部署 SHA 以 GitHub 的 Pages 部署紀錄為準。

`git diff --exit-code HEAD -- index.html style.css script.js assets .github` 通過，正式程式、圖層和設定沒有變更。瀏覽器目視、FPS、GPU、真實手機、PNG 與雙裝置 PK 均保持「待驗」；原型發布及 HTTP 檔案檢查不計為這些項目的通過證明。

## 新增檔案

| 路徑 | 內容 |
|---|---|
| `prototype/three-islands/index.html`、`prototype.css`、`app.js` | 獨立原型、操作介面、相機、事件、移動、日夜與儀表板 |
| `prototype/three-islands/core.js`、`scene.js`、`asset-library.js`、`legacy-bridge.js` | 共用資料適配、程序場景、GLB 快取與原版功能橋接 |
| `prototype/three-islands/assets/models/` | 2 個實際 GLB、來源／雜湊 manifest、作者紀錄 |
| `prototype/three-islands/assets/team/`、`prepare-assets.py` | 30 張隊徽縮圖、manifest 與可重建腳本；原圖不變 |
| `prototype/three-islands/vendor/three-r187/` | 5 個必要套件 JS、MIT LICENSE 與來源版本紀錄 |
| `prototype/three-islands/baseline.html`、`baseline.js` | 原版只讀量測包覆頁，手動匯出基準 JSON |
| `prototype/three-islands/audit.cjs`、`validate.cjs`、`README.md` | 靜態體積稽核、終端機驗證、啟動方式 |
| `tests/three-prototype.test.cjs`、`three-ui-harness.cjs` | 新增邏輯／真實模型解析及 DOM 事件替身測試 |
| `ASSET_LICENSES.md`、本文件及兩個 `docs/three-prototype-*.json` | 授權表、架構／整合計畫、實際驗證與靜態比較記錄 |

原型目錄共 55 個檔案（含 vendor 與二進位素材）；既有檔案沒有被覆寫。
