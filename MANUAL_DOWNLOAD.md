# 仍需人工取得的指定素材

目前使用專案內已驗證的 **36 個 GLB**。七款跑車與兩款城市交通車均已取得，以下檔案不是啟動網站的必要條件。若要補入指定完整包或 McLaren 候選，才需要人工處理；沒有將部分 ZIP 或錯誤頁當成模型匯入。

| 素材／下載頁 | 本次實際結果 | 人工取得格式與存放位置 |
|---|---|---|
| [Universal Base Characters 免費 Standard](https://quaternius.itch.io/universal-base-characters) | 已走匿名免費下載流程；ZIP 中斷，確認 Range 後續傳，之後 HTTP 403。未匯入。 | Standard ZIP 的 GLTF、BIN、貼圖；`assets/models/incoming/universal-base-characters/` |
| [Downtown City MegaKit 免費 Standard](https://quaternius.itch.io/downtown-city-megakit) | 已走匿名免費下載流程；分段下載期間 HTTP 403，未取得完整 ZIP，未匯入。 | Standard ZIP 的 GLTF、BIN、貼圖；`assets/models/incoming/downtown-city/` |
| [Kenney City Kit Commercial](https://kenney.nl/assets/city-kit-commercial) | 官方下載端點 HTTP 403。已有 Kenney CC0 單體建築。 | ZIP 中的 GLB／GLTF；`assets/models/incoming/kenney-commercial/` |
| [Kenney City Kit Suburban](https://kenney.nl/assets/city-kit-suburban) | 官方下載端點 HTTP 403。 | GLB／GLTF；`assets/models/incoming/kenney-suburban/` |
| [Kenney City Kit Roads](https://kenney.nl/assets/city-kit-roads) | 官方下載端點 HTTP 403。已有本地道路與共用橋梁模組。 | GLB／GLTF；`assets/models/incoming/kenney-roads/` |
| [Kenney Racing Kit](https://kenney.nl/assets/racing-kit) | 官方下載端點 HTTP 403。已有七款不同跑車。 | GLB／GLTF；`assets/models/incoming/kenney-racing/` |
| [Kenney Car Kit](https://kenney.nl/assets/car-kit) | 官方下載端點 HTTP 403。已有城市 SUV、計程車與餐車。 | GLB／GLTF；`assets/models/incoming/kenney-cars/` |
| [Quaternius Cars 完整包](https://quaternius.com/packs/cars.html) | 官方頁轉往 Google Drive 資料夾，未取得完整包；所需個別車輛已由作者 Poly Pizza 公開頁取得。 | GLTF；`assets/models/incoming/quaternius-cars/` |
| [McLaren 765LT 候選](https://sketchfab.com/3d-models/mclaren-765lt-with-windows-v2-cc1876d0179b42aeb31e004c01a857da) | 公開 API 確認 CC BY 4.0、可下載，約 195 萬三角形；下載 API 回傳 HTTP 401。未取得或匯入，未以其他車款冒稱 McLaren。 | 登入後下載 GLB／GLTF 並保留作者署名；須大幅減面與美術審查，`assets/models/incoming/mclaren-765lt/` |

取得後保留包內授權與作者資料，讓 GLTF、BIN、貼圖維持相對位置，再加入 `assets/models/sources.json`，以 `scripts/optimize-models.mjs` 最佳化成自含 GLB。通過 GLTFLoader、實際 WebGL 畫面與授權核對後才加入正式目錄。不要放入付費 Source 版本、登入憑證或帶期限的下載連結。

取得紀錄：`assets/models/acquisition-v2.json`、`assets/models/quaternius-v2.json`。成功素材來源與雜湊見 `ASSET_LICENSES.md` 及 `assets/models/manifest.json`。
