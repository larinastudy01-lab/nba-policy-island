# 自動下載 3D 素材整合紀錄

版本：`stylized-3d-assets-v1`。取得日期：2026-11-28；完成驗證：2026-11-29。沿用 `integration/stylized-three-v1` 分支，未推送或部署。

本輪實際下載並整合 **24 個 GLB**，不是僅放下載連結。原檔合計 **17,681,999 bytes**，本地優化後 **4,893,304 bytes**，約減少 **72.3%**。原有 Quaternius 車與樹兩個 GLB 另外保留，沒有重複計入新 24 個。

| 類別 | 本輪實際取得 | 使用位置 |
|---|---|---|
| 籃球設施 12 件 | Arena／Street／Youth Hoop、Two Tone Basketball、Ball Rack、Half Court、LED／Flip Scoreboard、Portable Shot Clock、Scorer’s Table、Team Bench、Bleachers | 勇士、湖人、公牛、尼克近景球場；仍開啟原球場 ID 的遊戲，場邊模型上的固定數字是裝飾，不代表 NBA 或真人對局成績。 |
| 美國地標 3 件 | Golden Gate bridge、Lady Liberty、Empire State Building | 金門大橋、尼克島岸邊自由女神及後方天際線；原觀景點與路線 ID 不變。 |
| 現代球館 1 件 | Innerscene Arena | 勇士玻璃／金屬球館，另接本隊入口招牌與原售票面板。 |
| 人物 2 件 | Quaternius Animated Human、Vinish Security Guard | 湖人廣場與勇士入口的模擬 NPC；使用實際骨架及 Idle 動畫，不計入真人房間。 |
| 植栽 2 件 | Quaternius Palm Tree、Vinish Coconut Palm | 湖人棕櫚街景。 |
| 跑車 1 件 | Vinish Wedge Supercar | 勇士停車展示區；原跨橋巡遊車仍沿既有路線。 |
| 城市／道路／小物 3 件 | Kenney Large Building、Quaternius Street Straight、Poly Haven Painted Wooden Bench | 洛城／公牛／尼克街景、洛城步道支線、海灣長椅。 |

授權：6 個 CC0、3 個 CC BY 3.0、15 個 CC BY 4.0。逐模型作者、來源、授權及修改見 [ASSET_LICENSES.md](../ASSET_LICENSES.md)。網站「設定 → 3D 素材作者與授權」可開啟實際署名頁；GLB 內嵌 copyright，地標 PNG 另印作者與 CC BY 3.0。

## 下載與優化流程

- `scripts/acquire-models.py`：公開來源下載、GLB magic／長度驗證、安全 ZIP 解壓、分類、命名、雜湊及失敗紀錄。單一來源失敗不會中止其他來源。
- `scripts/optimize-models.mjs`：去除寫實法線／粗糙度／反射貼圖，保留網、臉、樹葉 alpha 及非寫實調色 atlas；加入人物服裝頂點色。焊接、去重、靜態合併、限制誤差精簡、位置 14-bit／法線 10-bit 量化，保留骨架與動畫。
- 移除不需要的物理透射 extension，避免玻璃額外重繪整個世界；保留 Standard 材質與本版色盤。沒有新增 Draco／Meshopt 瀏覽器 decoder。
- Poly Haven 只下載長椅的 glTF／BIN 幾何，再轉為暖木色自包含 GLB；未下載其寫實高解析 PBR 貼圖。
- Kenney 原站三個完整包的公開下載端點 403，另取得 Poly Pizza 明列 CC0 的 Kenney 建築與 Quaternius 道路等單體。只在 [MANUAL_DOWNLOAD.md](../MANUAL_DOWNLOAD.md) 列這三個已確認失敗的原站包；現有版本不依賴它們。

工具只在忽略提交的 `node_modules/model-tools/`，不是網站執行依賴。重建素材時才需要：

```powershell
npm install --prefix node_modules/model-tools --no-audit --no-fund --ignore-scripts @gltf-transform/core@4.2.1 @gltf-transform/functions@4.2.1 @gltf-transform/extensions@4.2.1 meshoptimizer@0.23.0
python scripts/acquire-models.py
node scripts/optimize-models.mjs
```

網站執行仍不需 npm。模型都從 `assets/models/` 相對路徑載入，支援 `/nba-policy-island/` 子路徑。

## 與既有功能的連接

`downloaded-assets.js` 提供白名單、GLTFLoader、本地快取、骨架 clone、統一落地與動畫。`imported-scene.js` 使用既有隊伍、球場、地標座標和入口，把素材放進近景；模型失敗保留程式生成備援。全島仍是簡化 LOD，進入勇士／湖人／公牛／尼克才按需載入，一次只顯示一座詳細島。

`world.js` 在離島／關頁停止 mixer、清理骨架貼圖及場景；背景／面板開啟時沿用原暫停控制。跑車、NPC 和場邊模型不攔截既有點擊熱區。30 隊、15 遊戲、政策、商店、房間與資料 ID 都未變更。

新照片使用 `stylized-3d-assets-v1`。舊像素及上一版 `stylized-3d-v1` 照片仍按各自原美術重建，不會因球館換成下載模型而改變舊收藏。

## 實際驗證

1. `tests/downloaded-models.test.cjs` 檢查 24 個檔案的 SHA-256、GLB header／長度、自包含 buffer／image、授權、尺寸、幾何、動畫／骨架與三代合影存檔相容。Node 紋理解碼使用替身；不拿這項宣稱貼圖已正確顯示。
2. `tests/downloaded-models-browser.cjs` 使用獨立的真實 Chrome 與桌面 GPU，24 件逐一經 GLTFLoader、真正圖片解碼、WebGL 渲染並輸出 PNG。另實際選四島、點原球館／試算 2,400 點、拍照下載、切夜景及手機模擬。沒有 runtime／shader／texture 錯誤或 404，所有模型請求均為 localhost 專案路徑。
3. 原有回歸測試、JavaScript 語法與 `tests/check-static.py` 另跑；測試總數與本輪結果以下方最終紀錄為準。

最終終端機紀錄：`node --test tests/*.test.cjs` **285 項通過、0 失敗**；JavaScript 語法與靜態素材／相對路徑檢查通過。新增測試亦實際解析全部 24 GLB、保留人物動畫，並驗證像素／前版 3D／本版素材合影可同時讀回。

真實 Chrome 測試 GPU：NVIDIA GeForce RTX 5060 Laptop GPU／ANGLE Direct3D11。四座桌面近景平均約 60 FPS；390×844 手機模擬省電平均約 28.4 FPS。這是桌面 GPU 上的模擬，**不等於實體手機通過**。

結果 JSON：[validation.json](./downloaded-models-preview/validation.json)。模型逐件渲染：[24 件總覽](./downloaded-models-preview/model-sheet.png)。場景：[勇士](./downloaded-models-preview/island-warriors.png)、[湖人](./downloaded-models-preview/island-lakers.png)、[公牛](./downloaded-models-preview/island-bulls.png)、[尼克](./downloaded-models-preview/island-knicks.png)、[夜景](./downloaded-models-preview/warriors-night.png)、[手機模擬](./downloaded-models-preview/mobile-warriors.png)。實際下載：[球館 PNG](./downloaded-models-preview/home-photo.png)、[金門大橋 PNG](./downloaded-models-preview/bridge-photo.png)。

## 尚待人工確認

實體手機觸控、長時間 FPS／溫度、PNG 儲存與各設施遮擋；15 款遊戲逐款完整遊玩；Supabase 配置後的雙裝置 PK。沒有用模擬玩家或測試替身冒充真人連線。正式 GitHub Pages 仍未變更。

## 修改檔案

`assets/models/` 的 24 個 GLB、manifest／sources／acquisition log、授權文字與署名頁；`assets/three-map/downloaded-assets.js`、`imported-scene.js`、`model-catalog.js`、`world.js`、`main.js`、`photo.js`、`version.json`；`assets/fan-core.js`、`fan-ui.js` 的照片版本相容；兩支下載／優化工具、兩支新測試、素材授權、手動下載文件與本報告／預覽。
