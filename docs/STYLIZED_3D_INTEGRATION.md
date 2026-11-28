# Stylized 3D 正式整合驗收

版本：`stylized-3d-v1`。日期：2026-11-28。工作分支：`integration/stylized-three-v1`。

原正式版基準：`8cccaa4c0b25d2e464990ac404216f5e2ac84215`，另保留本機分支 `backup/pre-stylized-8cccaa4`。本次沒有 push、部署、執行遠端 SQL 或修改 Supabase。GitHub Pages 正式首頁仍是原版；整合分支的本機首頁已使用 Three.js。

## 正式首頁如何整合

`index.html` → `assets/map-bootstrap.js` → `assets/three-map/main.js`。Three.js、GLTFLoader 與 addons 都使用本地 r187，不依賴 CDN、套件安裝或 API key。

首頁只有一個活動渲染器。舊 SVG／PNG 地圖的 markup 放在 inert template；3D 模式僅建立原面板需要的隱藏 DOM 狀態節點，不載入舊地圖圖片、不啟動舊動畫迴圈。使用 `?map=2d`、直接開啟 `file://`，或 WebGL 初始化失敗時，才展開完整舊地圖。執行中若失去 WebGL context，停止場景、釋放資源並顯示 2D 恢復連結。

`assets/map-controller.js` 共用既有 `explorer-core.js` 的鏡頭、入口、路網、最新目的地取消與抵達判斷。3D 僅把原座標乘以 0.1 轉成 X/Z；沒有移動球隊／球場 ID，也沒有複製玩法。點擊模型、隊徽、清單與 HUD 最後都呼叫既有 `script.js` 的控制器與面板。記憶點另轉給既有 `memoryUI.navigate`，抵達後才閱讀。正式首頁沒有 iframe；歷史原型資料夾保留供比較。

## 美術與載入範圍

| 範圍 | 本版狀態 |
|---|---|
| 30 座島、球館、隊徽、道路、城市特色 | 全部由原資料產生，可選取及沿路網抵達；總覽使用簡化 LOD。 |
| 勇士詳細樣板 | 藍金橢圓玻璃球館、階梯／入口、海灣碼頭、小船、現代店面、半場、紅色吊橋、樹木與巡遊車。 |
| 湖人詳細樣板 | 紫金圓頂球館、玻璃入口、棕櫚大道、洛城低樓與 HOLLYWOOD 招牌。 |
| 公牛詳細樣板 | 紅黑球館、紅磚立面、階梯式天際線與湖岸廣場。 |
| 其餘 27 島 | 共用簡化模組與城市特色；尚未達三個樣板的個別精修密度。 |
| 15 球場／15 玩法、20 街景、3 偶遇點、2 商店、5 記憶事件 | 接回原 ID／入口；玩法、房間及閱讀程式不重寫。 |
| 球星合影 | 沿用原有 16 位代表球星與站點，沒有虛稱新增至 30 位。 |
| NPC／玩家 | 圓潤頭部、服裝與肢體；勇士近景使用原人流路線與賽況判斷。 |

新模型使用圓角、曲線、平滑 Standard 材質、限色調色盤與 ACES；標準模式啟用抗鋸齒、PCFSoftShadowMap。玻璃為風格化有色立面；隊徽是貼在建築上的透明招牌。海面使用漸層／波紋 shader。日夜窗光、路燈、車燈與賽事主場光圈分開控制。歷史照片、記憶簿史料插畫與原版備援仍可保留像素畫；3D 主畫面覆寫 `image-rendering`，不刻意降低解析度製造像素效果。

使用 GLTFLoader 載入的外部模型只有原先取得的 Quaternius 車與樹兩個 CC0 GLB。沒有把未下載的 Kenney／Quaternius 整包或 Poly Haven 寫實模型列為已匯入。來源、作者、日期與修改見 [ASSET_LICENSES.md](../ASSET_LICENSES.md)。

## 功能與資料保護

- 遊戲、售票、商店、島幣、房間、模擬賽況仍使用原 core/UI；30 球隊清單與 15 玩法保留。
- Avatar／album／policy／shop／memory 的 localStorage key 不變。新增視角儲存獨立使用 `nba-policy-island:mapview:v2`，不覆寫舊進度。
- 舊照片的 `pixel-v1` 或未標版本仍走舊重建器。新照片記錄 `stylized-3d-v1`，使用拍攝當下造型與場景產生 960×640 PNG；換裝不改舊紀錄。
- 新 PNG 透過同一個 WebGLRenderer 的離屏 render target 產生，包含 3D 人物、場館／景點與 Canvas 中文文字。照片快取最多 10 筆，輸出後釋放 render target；2D 備援可顯示相容向量預覽。
- Supabase 設定目前 URL／公開 key 都留空，好友入口維持明示未配置；不建立假房間或假比分，沒有改動 SQL／權限程式。

## 效能策略與重現

道路／NPC／樹木使用 InstancedMesh；建築按材質合併幾何，保留可點擊熱區。全島 30 座只載入簡化建築；僅選中勇士／湖人／公牛才建立詳細場景，同時只顯示一座，標準 LRU 最多兩座、省電一座。兩個 GLB 使用共用 promise／模型快取。LOD、視野裁切、距離分級及離屏／頁面背景／彈出面板暫停保留。離島與 pagehide 釋放實例、貼圖、合併幾何及 renderer。

標準畫質限制 60 FPS，DPR 上限 1.6；省電畫質限制 30 FPS、DPR 上限 1，關閉即時陰影，仍啟用抗鋸齒。Draco／Meshopt 未啟用：目前兩個 GLB 合計 477,392 bytes，沒有壓縮擴充需求，避免無效 decoder 負擔。

功能實測檔案：[browser-report.json](./stylized-3d-preview/browser-report.json)；修正靜止總覽等待時間混入 FPS 後，重新量測的效能檔案為 [performance-report.json](./stylized-3d-preview/performance-report.json)。每筆包含首次呈現與詳細模型就緒時間、平均 FPS、P95 frame time、draw calls、三角形、WebGL geometry／texture 數量、JS heap、GPU 字串、品質及畫布尺寸。首次呈現由 navigation time origin 計算；本機冷 HTTP 頁面不代表公網下載速度。模型就緒時間也是 navigation-relative，包含測試刻意停留總覽的時間，不能當成純模型下載時間。JS heap 是 Chrome 可取得的 JS 數值，**不是 GPU VRAM**。

本次 GPU：NVIDIA GeForce RTX 5060 Laptop GPU，ANGLE／Direct3D11，真實 Chrome。穩定近景採樣 6.5 秒，標準上限 60、省電上限 30。

| 實際場景 | 平均 FPS | P95 frame ms | Draw calls | 三角形 | JS heap 約 MiB |
|---|---:|---:|---:|---:|---:|
| 勇士／桌面標準 | 60.01 | 18.3 | 272 | 323,446 | 60.7 |
| 湖人／桌面標準 | 60.01 | 18.3 | 213 | 326,094 | 60.0 |
| 公牛／桌面標準 | 60.00 | 18.3 | 184 | 229,622 | 58.7 |
| 勇士／390×844 手機模擬省電 | 30.00 | 36.5 | 200 | 208,252 | 69.3 |

桌面首次呈現約 1.96 秒，手機模擬約 1.20 秒。兩個 GLB 共 477,392 bytes。連續三輪勇士→湖人→公牛後，快取始終不超過兩座詳細島；相同終點的 WebGL geometry 維持 413、texture 維持 28，未持續增長。這是短期測試，不能替代實機五分鐘以上的記憶體／溫度檢查。

```powershell
node --test tests/*.test.cjs
python tests/check-static.py
node tests/stylized-browser.cjs
node tests/stylized-performance.cjs
```

瀏覽器驗收程式使用獨立 Chrome profile、自行建立並關閉本機 HTTP 伺服器，以 `/nba-policy-island/` 前綴提供檔案；只允許該 localhost 來源。Playwright 路徑可用 `PLAYWRIGHT_MODULE` 指定。測試結束會關閉 Chrome、HTTP 伺服器，不會操作使用者的 Chrome 分頁。

Node／靜態檢查不是畫面通過證據；真實 Chrome 的截圖與 PNG 另存在下方資料夾。手機瀏覽器模擬使用桌面 GPU，**不能據此認定實體手機已達 28–30 FPS**。

## 本次實際測試結果與畫面

- `node --test tests/*.test.cjs`：281 項通過、0 失敗；包含原 275 項與新增 6 項 controller／模型／資料相容測試。
- `python tests/check-static.py`、所有 assets JavaScript 的 `node --check`、`script.js` 及瀏覽器驗收程式語法：通過。靜態檢查中的像素材數是保留的歷史／備援素材，不表示 3D 同時載入它們。
- 真實 Chrome 功能驗收 19 組：30 隊選取、實體球館 raycast、政策三方案／座位圖、跨島購物車／不足額／刪除／結帳、造型保存、新 3D PNG、舊像素合影、每日偶遇、金門大橋 PNG、完整 30 秒投籃結算／重開、其餘 14 遊戲開啟與離場、閱讀記憶簿、重新整理，以及兩種 2D 備援。沒有 runtime／shader 錯誤或 HTTP 404。
- 其餘 14 遊戲在瀏覽器抽按當時可用的控制項，**沒有逐款玩到終局**；各遊戲完整計分、平手與終局由既有 Node 邏輯測試覆蓋，實機逐局操作仍須人工驗收。
- 第二輪真實 Chrome 效能／場景驗收 6 組：桌面與手機模擬靜止總覽停止渲染、勇士客場僅湖人亮燈、完賽關閉 LIVE 且保留夜間車燈、三輪詳細場景快取與資源有界、無瀏覽器錯誤。
- 親自檢視已輸出的全島日／夜、三座近景、手機地圖／節奏遊戲、主場與景點 PNG；不是只依 Node 結果判定畫面。

畫面：[全島白天](./stylized-3d-preview/overview-day.png)、[全島夜晚](./stylized-3d-preview/overview-night.png)、[勇士](./stylized-3d-preview/warriors-day.png)、[湖人](./stylized-3d-preview/lakers-day.png)、[公牛](./stylized-3d-preview/bulls-day.png)、[勇士夜場](./stylized-3d-preview/warriors-night.png)、[完賽夜景](./stylized-3d-preview/warriors-final-night.png)、[手機地圖](./stylized-3d-preview/mobile-warriors.png)、[手機遊戲](./stylized-3d-preview/mobile-rhythm.png)。實際下載：[主場合影](./stylized-3d-preview/warriors-photo.png)、[金門大橋旅行照](./stylized-3d-preview/golden-gate-photo.png)。

## 修改檔案

| 檔案 | 用途 |
|---|---|
| `index.html`、`script.js` | 原首頁啟動路由、共用入口／面板、惰性 2D template。 |
| `assets/map-bootstrap.js`、`map-controller.js` | 單一渲染器選擇、WebGL 失敗備援、共用行走／鏡頭與暫停。 |
| `assets/three-map/main.js`、`world.js`、`models.js`、`hud.css` | 3D 主場景、HUD、模型、日夜、點擊、相機與按需載入。 |
| `assets/three-map/photo.js`、`version.json`、`assets/stylized-art.js` | 真 3D PNG、版本、相容向量預覽。 |
| `assets/fan-core.js`、`fan-ui.js` | 保存新照片版本、舊照讀回、共用造型與 3D 匯出。 |
| `assets/memory-ui.js`、`shop-ui.js`、`team-logo-ui.js` | 共用既有功能，停用隱藏的舊地圖插畫載入，使用輕量隊徽。 |
| `prototype/three-islands/vendor/three-r187/addons/geometries/RoundedBoxGeometry.js` | 同版本 MIT 圓角 addon，原檔複製。 |
| `tests/stylized-integration.test.cjs`、`stylized-browser.cjs`、`stylized-performance.cjs` | 純邏輯／真實 Chrome 功能／效能驗收。 |
| `README.md`、`ASSET_LICENSES.md`、`docs/CLASSROOM.md`、本報告與 `stylized-3d-preview/` | 版本、更新紀錄、素材授權、九週對照、實際輸出。 |

## 本機預覽與手動驗收

在專案根目錄執行 `python -m http.server 8000`，手動開啟 `http://localhost:8000/`。停用 WebGL／加入 `?map=2d` 可驗證備援；直接雙擊 index.html 會使用 2D。正式 `/nba-policy-island/` 子路徑由瀏覽器測試的 HTTP 前綴驗證，不代表已部署上線。

1. 全島點勇士隊徽 → 查看玻璃球館、橋、碼頭與半場；沿路去湖人／公牛，點實體球館開面板，回全島應保留玩家位置。
2. 勇士試算學生保留席：20／40、2,400 點；查看 60 席圖並確認決策。另切原價、抽籤，確認 2,700／1,800。
3. 勇士店加帽子 → 湖人店加圍巾 → 共用購物車改量、刪除、測不足額及結帳；重新整理確認收藏與島幣。
4. 儲存造型 → 勇士找球星 → 拍照／收藏／下載；換裝後回合影冊查看舊照，再走到當日偶遇點及金門大橋拍照。
5. 潮汐一號完成 30 秒遊戲、重開、回場；手機再選另一款遊戲。檢查觸控、鍵盤及音效。
6. 同一構圖切日夜；勇士客場打湖人時僅湖人主場賽事光圈亮，完賽停止脈動但保留夜景照明。開啟省電模式與減少動態後再走一次。
7. 用實體 Android／iPhone 測 5 分鐘移動／玩遊戲／下載 PNG、畫面旋轉、溫度與 FPS。這項尚待驗。
8. 好友 PK 需依既有 [MULTIPLAYER.md](./MULTIPLAYER.md) 先自行配置；再以兩個真實裝置驗證開房、加入、就緒、15 遊戲成績／猜招封存、結算、重開和舊局拒絕。目前未連線，不列為通過。

## 後續上線門檻

本地三樣板與功能驗收後，保留此分支供美術審查。其他 27 島的獨立細節、實體手機 FPS／下載、連線雙裝置仍須驗收。通過後才建立合併審查與 GitHub Pages 切換；目前不變更 main。必要時以原 main／備份分支恢復，或在整合版使用 `?map=2d`。

更新紀錄：新增正式 3D bootstrap／共用 controller、平滑城市模型／HUD、按需載入與釋放、新照片版本／舊照相容、真實 Chrome 驗收與效能輸出。沒有改寫原 15 遊戲或資料庫架構。
