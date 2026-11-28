# 需手動取得的完整素材包

本輪已自動取得、解壓／分類並優化 **24 個 GLB**，不需要你逐一下載。下表只列本輪實際嘗試、原站公開下載端點回傳 **HTTP 403** 的完整包；未列未查核的候選或已成功下載的模型。

網站現有整合已使用自動取得的替代模型，**不必先完成此表才能運行**。若要補齊這些原站完整包，才需要手動取得。

| 素材名稱／作者 | 直接下載頁面 | 格式 | 解壓後存放路徑 | 本輪結果 |
|---|---|---|---|---|
| City Kit (Roads)／Kenney | [官方下載頁](https://kenney.nl/assets/city-kit-roads) | ZIP；優先選包內 GLB／glTF，其他格式以實際內容為準 | `assets/models/incoming/kenney-city-kit-roads/` | `download-link` 公開端點 403；舊 ZIP URL 回傳 HTML，已拒絕當模型匯入。已有 Quaternius Street Straight 替代。 |
| City Kit (Commercial)／Kenney | [官方下載頁](https://kenney.nl/assets/city-kit-commercial) | ZIP；優先 GLB／glTF | `assets/models/incoming/kenney-city-kit-commercial/` | `download-link` 403。已透過 Poly Pizza 取得 Kenney 的 CC0 Large Building。 |
| Racing Kit／Kenney | [官方下載頁](https://kenney.nl/assets/racing-kit) | ZIP；優先 GLB／glTF | `assets/models/incoming/kenney-racing-kit/` | `download-link` 403。現有 Quaternius Sports Car 與新 Vinish Wedge Supercar 可用。 |

下載後保留原包內 LICENSE，避免把 HTML 錯誤頁改名成 ZIP／GLB。這些 `incoming` 路徑不會自動被網站載入；須核對授權、執行優化、更新 manifest 並通過 GLTFLoader／瀏覽器測試後才加入場景。

Poly Pizza 三個地標、Vinish 籃球包及人物／棕櫚／跑車、Innerscene Arena、Poly Haven Bench，以及透過 Poly Pizza 取得的 Kenney／Quaternius 單體模型均已成功下載，沒有再列成手動工作。Quaternius 新版角色整包有免費／付費區分，本版使用已核對 CC0 的 Animated Human，不要求購買或登入。

實際取得結果見 `assets/models/acquisition-log.json`；全部模型與雜湊見 `assets/models/manifest.json`。
