# 跨裝置驗收紀錄

更新：2026-11-29。版本：`geographic-stylized-v2`。

**歷史主題重構、InputManager 及 90 組驗收尚未完成。** 下表是必要測試矩陣，不將原有遊戲的邏輯或開啟測試計入歷史版本通過。驗收規則見 [CROSS_PLATFORM_REQUIREMENTS.md](./CROSS_PLATFORM_REQUIREMENTS.md)。

## 已有證據的範圍

| 類型 | 環境與實際執行 | 結果及限制 |
|---|---|---|
| 終端機邏輯 | Node.js：原十五款遊戲、終局／平手／重開、種子及舊資料；全專案 291 項 | 通過；不代表手機操作或畫面驗收 |
| 真實瀏覽器 | Windows Chrome／RTX 5060 Laptop，1440×1000；30 隊、政策、商店、合影 PNG、30 秒投籃完成及其他遊戲控制抽測 | 原功能回歸通過；不是 1920×1080 的完整十五場測試 |
| 瀏覽器手機模擬 | 同一桌面 GPU，390×844，觸控節奏遊戲與地圖／面板操作 | 抽測通過；不是實體手機，也不是全部十五場終局測試 |
| 主地圖效能 | 勇士／湖人／公牛桌面約 60 FPS；勇士手機模擬冷啟動 27.94 FPS，暖機後 30.00 FPS | 冷啟動窗口未達標；不可推論實體手機或遊戲 FPS |
| 遊戲呈現效能 | 目前 3D 遊戲預覽仍採約 90ms 的圖像更新間隔 | 尚未達到每秒 30 幀呈現門檻，需後續改造 |
| 真實裝置 | iPhone、Android、iPad、Android 平板、觸控筆電、macOS | 未執行，待驗 |
| 真人跨裝置 PK | Supabase URL／公開金鑰未配置 | 待驗；未以假玩家代替 |

原始紀錄：[瀏覽器回歸](./geographic-v2-preview/regression/browser-report.json)、[場景檢查](./geographic-v2-preview/browser-report.json)、[效能](./geographic-v2-preview/regression/performance-report.json)。這些測試屬既有遊戲及地理群島版本。

## 歷史版本 90 組矩陣

「待」表示尚未完成該尺寸完整實際瀏覽器驗收，且不代表實體裝置已測。共 0／90 組通過。

| 球場／歷史挑戰 | 360×800 | 390×844 | 844×390 | 768×1024 | 1024×768 | 1920×1080 |
|---|---|---|---|---|---|---|
| harbor-01 Mamba 81 | 待 | 待 | 待 | 待 | 待 | 待 |
| harbor-02 Three-Point King | 待 | 待 | 待 | 待 | 待 | 待 |
| harbor-03 The Four Bounces | 待 | 待 | 待 | 待 | 待 | 待 |
| harbor-04 CP3 Clutch Shot | 待 | 待 | 待 | 待 | 待 | 待 |
| harbor-05 The Last Shot | 待 | 待 | 待 | 待 | 待 | 待 |
| park-01 Mamba Farewell | 待 | 待 | 待 | 待 | 待 | 待 |
| park-02 Jokić Vision | 待 | 待 | 待 | 待 | 待 | 待 |
| park-03 The Big Ticket | 待 | 待 | 待 | 待 | 待 | 待 |
| park-04 Bad Boys Defense | 待 | 待 | 待 | 待 | 待 | 待 |
| park-05 Stockton & Malone | 待 | 待 | 待 | 待 | 待 | 待 |
| roof-01 Showtime Connection | 待 | 待 | 待 | 待 | 待 | 待 |
| roof-02 Dame Time | 待 | 待 | 待 | 待 | 待 | 待 |
| roof-03 The Block | 待 | 待 | 待 | 待 | 待 | 待 |
| roof-04 Dream Shake | 待 | 待 | 待 | 待 | 待 | 待 |
| roof-05 Championship Journey | 待 | 待 | 待 | 待 | 待 | 待 |

## 執行時需填寫

每次記錄版本／提交、日期、作業系統、瀏覽器版本、裝置型號、實體或模擬、尺寸／DPR、控制方式、遊戲 ID、操作步驟、預期／實際、FPS 與失敗證據。另記錄多點觸控、旋轉、失焦／背景、取消事件、重複出手、離場清理與公平種子。尚未測到的欄位保持待驗。

真人 PK 需配置後以兩台真實裝置：同一球場開房 → 分享既有邀請網址 → 第二人加入 → 雙方就緒 → 共用局數／開始時間／種子 → 各自操作 → 核對雙方結果 → 重開 → 嘗試重送舊成績、重複加入及第三人加入。鬥牛猜招需另確認提前送出不會洩露招式。本次未執行遠端 SQL 或修改 Supabase。
