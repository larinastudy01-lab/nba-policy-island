# 地理群島版本發佈紀錄

版本：`geographic-stylized-v2`；日期：2026-11-29。發佈至現有 GitHub Pages `main` 根目錄，沿用現有服務設定。

## 本次上線範圍

- Natural Earth 地理資料及三十隊群島、連通的跨島路網與鏡頭。
- 36 個本地授權 GLB，七種跑車及兩種城市交通展示，灣岸／沙漠巡遊道路。
- 既有角色、合影、商店、記憶簿與十五款原遊戲的非像素 3D 顯示。
- 保留政策、購物、舊照片、儲存鍵、房間入口、使用者隊徽及 `?map=2d` 備援。
- 新增歷史旅程修訂計畫與跨裝置必要驗收規格，明列尚未實作或未測項目。

詳細變更與既有驗證見 [GEOGRAPHIC_STYLIZED_V2.md](./GEOGRAPHIC_STYLIZED_V2.md)。前版 `ab0591d` 保留於 `backup/pre-geographic-ab0591d`；整合來源為 `integration/geographic-stylized-v2`。

## 尚未完成，不能視為本次交付成功

42 組歷史主題資料查核、三十隊完整歷史展區、十五款歷史專屬玩法重構、歷史圖鑑／時間軸、共用 InputManager 及 90 組裝置驗收尚待後續開發。既有十六位球星固定合影點維持原數量。Supabase 未配置，真人雙裝置 PK 待驗。實體手機／平板及 macOS 未驗證；手機模擬冷啟動效能亦有未達標窗口。

歷史需求的原「新增十款」已由 [NBA_HISTORY_JOURNEY_PLAN.md](./NBA_HISTORY_JOURNEY_PLAN.md) 改為十五座既有球場整合，沒有新增球場或改動舊邀請 ID。跨裝置結果分開記於 [CROSS_PLATFORM_TEST_REPORT.md](./CROSS_PLATFORM_TEST_REPORT.md)。

## 發佈驗證

發佈後以 GitHub Pages 建置狀態、公開 `version.json`、正式入口／模型雜湊、Chrome 的實際主地圖與政策操作確認。本檔記錄版本範圍；最後上線提交與結果由完成回覆及本地部署驗證 JSON 記錄，不預先聲稱部署成功。
