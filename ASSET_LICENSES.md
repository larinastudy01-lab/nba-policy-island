# Three.js 原型素材與授權紀錄

查核／取得日期：2026-11-28（Asia/Taipei）。本表只說明本次新增原型；既有 NBA 隊徽、球星名稱及商標不因導入 Three.js 而取得新的授權。未下載的候選素材沒有列為已匯入。

## 已納入專案

| 素材／程式 | 作者 | 授權與來源 | 本地位置及處理 |
|---|---|---|---|
| Three.js 0.187.0 / r187、GLTFLoader、BufferGeometryUtils、SkeletonUtils | three.js authors | [MIT 原始專案](https://github.com/mrdoob/three.js/tree/r187)，[npm 版本](https://www.npmjs.com/package/three/v/0.187.0) | `prototype/three-islands/vendor/three-r187/`。保留原始 LICENSE；僅複製實際使用的 ES Modules，未修改套件程式。 |
| Sports Car | Quaternius | 模型頁明列 [CC0](https://poly.pizza/m/1mkmFkAz5v) | `assets/models/quaternius-sports-car.glb`（路徑相對原型）。175,100 bytes。原始幾何完整保留，執行時改平面 Lambert 材質；不是 Ferrari／McLaren 指定車款。 |
| Trees → NormalTree_1 | Quaternius | 模型頁明列 [CC0](https://poly.pizza/m/etFGNvsiFv) | `assets/models/quaternius-tree.glb`，302,292 bytes。由五棵樹的原檔只保留一棵；保留幾何及階層轉換，移除貼圖、UV、法線貼圖與其餘樹，改為樹幹／樹葉限色材質。 |
| 島嶼、橋、球館、半場、店面、燈、長椅、中性方塊人物 | 本專案原創 | 程式生成，無外部模型 | `prototype/three-islands/scene.js`、`app.js`。不宣稱為其他素材包內容。 |
| 30 張 64×64 隊徽衍生縮圖 | 既有使用者提供素材；各隊商標權利人 | 沿用既有 `assets/team/logo-manifest.json`，**非 CC0**；本次沒有重新授權 | `prototype/three-islands/assets/team/`。等比縮小、透明留白，不改原圖。只供本專案原型沿用；其他用途需另核權利。 |

兩個模型的模型頁、下載網址、作者、修改、原始與匯入檔 SHA-256，逐一存於 [模型 manifest](prototype/three-islands/assets/models/manifest.json)。CC0 條款：[CC0 1.0 法律文字](https://creativecommons.org/publicdomain/zero/1.0/legalcode.en)。雖 CC0 不強制署名，仍保留作者及來源。

下載網址以 `.glb.br` 結尾，但本次 CDN 回傳的內容已是 `glTF` 開頭的未壓縮 GLB，已檢查標頭與長度後才存為 `.glb`，沒有把 HTML 錯誤頁當模型使用。兩檔皆無外部圖片或網路依賴。

## 已調查但未匯入

| 候選素材／作者 | 查核結果 | 所需格式／預定用途 | 取得狀態與下一步 |
|---|---|---|---|
| [City Kit Roads / Kenney](https://kenney.nl/assets/city-kit-roads) | 官網列 CC0；90 個檔案 | 優先 GLB/glTF；道路、路口、橋頭模組 | **未下載、未匯入**。本次簽名下載端點回傳 HTTP 403，舊直連回傳 HTML。請手動從官網下載 ZIP，核對內附 license，挑選與原路網寬度相符的模組後轉 GLB。 |
| [Racing Kit / Kenney](https://kenney.nl/assets/racing-kit) | 官網列 CC0；110 個檔案 | GLB/glTF；車輛、護欄、停車物件 | **未下載、未匯入**，同樣遇下載端點 403。手動 ZIP 解壓後挑選少量車型，不整包載入。 |
| [Ultimate Stylized Nature / Quaternius](https://quaternius.com/packs/ultimatestylizednature.html) | 作者列 CC0；63 個模型；提供 FBX、OBJ、Blend、glTF | 優先 glTF/GLB；樹、岩石、草地點綴 | **整包未下載**。從官網的 Google Drive 下載；不要與本次從 Poly Pizza 單獨取得的 Trees 模型混稱。移除寫實貼圖、選擇少量樹後再套共同色盤。 |
| [Voxel Modern City & Vehicles / ZaddyFi](https://zaddyfi.itch.io/city-vehicles) | 免費包 125 個模型列 CC0；另有付費 32 個擴充模型採作者自訂授權，**不可將付費包當 CC0**。作者頁有 AI 輔助製作揭露。 | GLB 優先；VOX／OBJ+MTL／FBX 可離線轉檔；街屋、車 | **未下載、未匯入**。手動選免費版，保留該次下載附帶授權及版本證據，核對每個物件頂點量，縮減材質。付費內容需另核條件。 |
| [Poly Pizza](https://poly.pizza/explore) | 平台素材授權混合，須逐模型查核；不能一概認作 CC0 | 逐件 GLB；補樹木、長椅、低模車 | **僅上表兩個 Quaternius CC0 模型已取得**。其他模型未匯入。若用 CC-BY 模型，需另記作者、授權版本、修改與署名。 |

## 日後匯入步驟

1. 從上表來源頁取得檔案及授權證據，將下載日期、作者、來源、授權版本加入本表。拒絕僅有圖片預覽、缺乏下載權限或授權不明的素材。
2. 優先單檔 GLB，先檢查 `glTF` 標頭；若為 OBJ／FBX／VOX，使用離線工具轉 glTF 2.0。統一 Y 向上、地面原點、車身前向和場景比例。
3. 去除不需要的動畫、燈、相機、大貼圖及 PBR 法線；以 Lambert 限色材質測試。每件目標小於 500 KiB、單島材質共用；超過時先簡化。
4. 放進原型 `assets/models/`，更新 manifest 的 bytes、SHA-256、修改記錄，加入 `AssetLibrary` 白名單；先單島按需載入，不能將下載 ZIP 直接放進首頁。
5. 跑終端機解析、路徑及回歸測試，再手動檢查陰影、朝向、遮擋、近遠景和效能。通過後才提正式整合。

Draco／Meshopt 尚未採用：本次兩個 GLB 合計 477,392 bytes，不引入額外 decoder 成本。日後確有體積瓶頸才導入，並同時附 decoder 檔、授權和未壓縮回退策略。
