# 跨裝置操作與 RWD 必要驗收規格

本文件是 NBA History Journey 的交付門檻，**不是已完成測試的聲明**。2026-11-29 的地理群島版本仍使用原有十五款遊戲；歷史玩法改造與共用 InputManager 尚待實作。結果記錄於 [CROSS_PLATFORM_TEST_REPORT.md](./CROSS_PLATFORM_TEST_REPORT.md)。

## 共用輸入與世界座標

建立 InputManager，以 Pointer Events 統一滑鼠、手指及觸控筆，另處理 Keyboard、虛擬搖桿和遊戲按鈕。混合裝置允許鍵盤與觸控同時使用；同一次操作不可因 pointer/click/touch 的重複監聽而重複計分。忽略按住鍵盤造成的 repeat。以 pointerId 分開管理移動與出手，支援多點觸控及 pointer capture；在 pointercancel、失焦、離場與重新開局時釋放所有按住狀態及事件。

所有裝置採相同遊戲世界座標、命中區、碰撞、種子、物理與難度。使用時間差或固定步進，不依 FPS 計算速度。螢幕座標先換算成世界座標，再判定出手或碰撞。旋轉與 resize 只更新攝影機、Canvas、HUD 和控制區，不重設分數、進度或剩餘時間。切到背景的計時／恢復規則必須明確且對 PK 雙方一致。

## 十五款必要控制

| 球場 | 歷史玩法 | 電腦 | 手機／平板／觸控筆 |
|---|---|---|---|
| harbor-01 | Mamba 81 | Space 或滑鼠出手 | 投籃按鈕 |
| harbor-02 | Three-Point King | Space 或滑鼠出手 | 投籃按鈕 |
| harbor-03 | The Four Bounces | 拖曳調整角度與力度 | 手指／筆拖曳 |
| harbor-04 | CP3 Clutch Shot | 點選擦板區域 | 觸控擦板區域 |
| harbor-05 | The Last Shot | 方向鍵、Space | 方向控制、投籃 |
| park-01 | Mamba Farewell | WASD、Space | 虛擬搖桿、投籃 |
| park-02 | Jokić Vision | 點選傳球隊友 | 觸控隊友 |
| park-03 | The Big Ticket | 左右方向鍵、Space | 左右控制、搶籃板 |
| park-04 | Bad Boys Defense | 鍵盤／滑鼠選招式 | 觸控招式 |
| park-05 | Stockton & Malone | 點選戰術順序 | 觸控戰術圖示 |
| roof-01 | Showtime Connection | 方向鍵、傳球鍵、出手鍵 | 方向、傳球、投籃 |
| roof-02 | Dame Time | A／D 交替、Space | 左右運球、投籃 |
| roof-03 | The Block | Space 封阻 | 大型封阻按鈕 |
| roof-04 | Dream Shake | WASD、假動作鍵、出手鍵 | 虛擬搖桿、假動作、投籃 |
| roof-05 | Championship Journey | 隨投籃／傳球／防守切換 | 隨階段切換必要控制 |

## 觸控、安全區與畫面

操作按鈕至少 48 × 48 CSS px，移動區在左下，主要動作在右下；支援同時移動及出手。不使用的按鈕隱藏。控制區必須避開人物、籃框、計時器、重要場景及系統安全區。遊戲控制區的拖曳不捲動頁面，結束或離開後恢復正常捲動。直向與橫向均須重新排版，不能只等比縮小桌面畫面。

3D 地圖也必須支援滑鼠／觸控拖曳、滾輪／雙指縮放、點島、球館／商店／歷史入口、玩家跨島尋路、回到原先位置、收合隊伍清單與手機資訊面板。地圖手勢與設施點擊須有移動門檻，避免拖曳結束誤開設施。

## 效能與資源

Three.js 使用自動畫質、陰影等級、DPR 上限、低面數、延遲載入、LOD、不可見停止更新與離場釋放資源；降低畫質仍維持非像素風。桌面目標 50–60 FPS、平板 30–60 FPS、手機至少 30 FPS。必須分別量測主地圖與實際遊戲呈現，不能用主地圖 FPS 代表遊戲 FPS。

## 90 組基本驗收及延伸檢查

每款遊戲在 360×800、390×844、844×390、768×1024、1024×768、1920×1080 各完整測試一次，共 90 組。每組包括開始、全部操作、計時／計分、結算、重玩及回地圖。另測多點觸控、旋轉保留進度、背景返回、pointercancel、重複事件、混合鍵盤觸控、瞄準座標與好友 PK。

報告分開標記：邏輯／模擬器／真實瀏覽器／真實裝置。瀏覽器縮放與 Playwright 手機模擬不能算作實體手機或平板。Windows、macOS、iPhone、Android、iPad、Android 平板及觸控筆電均需有實測紀錄。Supabase 未配置時，真人跨裝置 PK 只能列為待驗；不得以電腦對手、假玩家或假比分代替。
