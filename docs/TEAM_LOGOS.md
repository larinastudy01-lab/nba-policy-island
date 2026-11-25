# 30 隊隊徽接入與核對

已逐張查看使用者提供的 30 張素材，30 隊各有一個獨立圖源，沒有缺漏。隊伍 ID、開放狀態、路網、店鋪入口及本機儲存鍵皆沿用原設定；球衣未更動。

## 原檔與網站路徑

`assets/team/` 中 30 個 `.webp` 的實際檔案內容都是 **RGBA PNG**。保留所有中文原檔與透明背景，不覆寫、不裁切、不改色、不重新編碼；網站使用 `assets/team/logos/{球隊縮寫}.png`，內容與原檔逐位元組相同。

既有 `assets/island-core.js` 的每筆隊伍資料提供 `logoSource`（原檔）及 `logo`（網站路徑），清單、球館、記分板、商店與記憶簿都透過 `NBAIsland.TEAMS` 讀取。同一份資料不複製到商店或事件紀錄。

| 球隊 ID | 縮寫／網站檔名 | 保留的原檔名 |
| --- | --- | --- |
| warriors | GSW.png | 金州勇士隊.webp |
| lakers | LAL.png | 洛杉磯湖人隊.webp |
| clippers | LAC.png | 洛杉磯快艇隊.webp |
| nuggets | DEN.png | 丹佛金塊隊.webp |
| mavericks | DAL.png | 達拉斯獨行俠隊.webp |
| bulls | CHI.png | 芝加哥公牛.webp |
| celtics | BOS.png | 波士頓塞爾提克隊.webp |
| knicks | NYK.png | 紐約尼克隊.webp |
| spurs | SAS.png | 聖安東尼奧馬刺隊.webp |
| thunder | OKC.png | 奧克拉荷馬城雷霆隊.webp |
| suns | PHX.png | 鳳凰城太陽隊.webp |
| timberwolves | MIN.png | 明尼蘇達灰狼隊.webp |
| bucks | MIL.png | 密爾瓦基公鹿隊.webp |
| sixers | PHI.png | 費城 76 人隊.webp |
| heat | MIA.png | 邁阿密熱火隊.webp |
| raptors | TOR.png | 多倫多暴龍隊.webp |
| nets | BKN.png | 籃網.webp |
| cavaliers | CLE.png | 芝加哥公牛隊.webp |
| jazz | UTA.png | 猶他爵士隊.webp |
| rockets | HOU.png | 休士頓火箭隊.webp |
| blazers | POR.png | 波特蘭拓荒者隊.webp |
| kings | SAC.png | 沙加緬度國王隊.webp |
| grizzlies | MEM.png | 曼菲斯灰熊隊.webp |
| pelicans | NOP.png | 紐奧良鵜鶘隊.webp |
| pistons | DET.png | 底特律活塞隊.webp |
| pacers | IND.png | 印第安納溜馬隊.webp |
| wizards | WAS.png | 華盛頓巫師隊.webp |
| hawks | ATL.png | 亞特蘭大老鷹隊.webp |
| hornets | CHA.png | 夏洛特黃蜂隊.webp |
| magic | ORL.png | 奧蘭多魔術.webp |

核對重點：`芝加哥公牛.webp` 是紅色牛頭（CHI）；`芝加哥公牛隊.webp` 是金邊酒紅 C（CLE），依圖案而非檔名綁定。湖人是紫金字樣與籃球，快艇是 LAC／CLIPPERS 字樣；尼克是橘色 KNICKS，籃網是黑白 NETS 盾牌。爵士是黑色音符，使用小型淺底承托，不修改素材。所有素材均採使用者提供的版本，沒有改抓其他圖源。

`assets/team/logo-manifest.json` 記錄原檔、網站檔名、尺寸、格式、透明通道與 SHA-256。重建副本可執行 `python assets/prepare_team_logos.py`（只用 Python 標準函式庫及專案既有 Node，不安裝套件）。

## 顯示與互動

- 清單／搜尋：固定尺寸圖框，`object-fit: contain` 與置中，不裁切。清單保留 DOM 節點，搜尋或切賽況不反覆重建圖片；使用原生延遲載入。
- 全島：維持原有道路、區名與隊名；不顯示球館隊徽招牌。只有當前球隊資訊卡／主客隊記分板顯示相關隊徽。
- 球隊島：只在當前島的球館招牌掛上小圖，與既有地圖座標一同縮放。第一次靠近才建立該島的圖片；標示不攔截滑鼠、觸控或鍵盤操作。
- 球館／賽況：本隊抬頭與主、客隊各讀自己的 ID，勇士客場打湖人時顯示 LAL 主隊、GSW 客隊。賽況光暈及最終比分邏輯不變。
- 商店：兩店抬頭顯示各自隊徽，跨島購物車列保留各商品所屬隊徽。共用購物車抬頭不殘留上一間店的隊徽。
- 記憶簿：事件清單和閱讀畫面的相關球隊欄位共用相同渲染器，閱讀紀錄不變。
- 隊徽已有鄰近隊名，因此設 `alt=""` 和 `aria-hidden="true"`；載入失敗改顯示縮寫。圖片載入前後維持固定圖框，不因圖片尺寸改變而跳版。

## 修改檔案

| 檔案 | 變更 |
| --- | --- |
| assets/island-core.js | 30 隊原檔與網站隊徽路徑 |
| assets/team-logo-ui.js、team-logo.css | 共用顯示、縮寫備援、尺寸、置中、手機樣式 |
| assets/prepare_team_logos.py、team/logos/、team/logo-manifest.json | 30 份無損副本及原圖核對資料 |
| index.html、script.js | 載入程式、清單、主場資訊及主客隊記分板 |
| assets/explorer-ui.js | 當前島小招牌與全島隱藏規則 |
| assets/shop-ui.js、memory-ui.js | 商店、購物列、記憶簿抬頭 |
| tests/team-logo.test.cjs、ui.test.cjs、check-static.py | 素材、路徑、對應、顯示狀態及互動回歸 |
| docs/CLASSROOM.md、README.md | 素材使用及展示入口 |

## 已執行的終端機測試

- `node --test tests/*.test.cjs`：**248 項通過、0 失敗**。含新增 3 項隊徽資料／素材測試、5 項 DOM 互動測試，既有 240 項回歸保留。
- `node --check`：33 份專案 JavaScript／CJS 語法通過。
- `python tests/check-static.py`：346 個唯一 HTML ID、12 份 CSS、既有素材，以及 30 組隊徽原檔／副本的 PNG CRC、尺寸、透明格式、SHA-256 與 Pages 子路徑通過。
- 使用本機 Python 3.14／Pillow 實際解碼全部 30 張圖片，確認 RGBA、存在透明像素，且副本透明通道與原檔完全相同；魔術原檔最高 alpha 為 254，亦原樣保留，沒有強制改為 255。
- 已測全部 30 隊的清單、選取卡與主客隊隊徽；切換四種賽況／交換灣區主客場、全島隱藏招牌、當前島顯示招牌、商店／購物列／記憶簿共用對應，以及圖片失敗縮寫備援。
- 上述為檔案與 DOM 事件替身檢查；沒有執行真實瀏覽器或手機排版測試，也沒有向正式站部署新素材。

## 手動預覽項目

1. 本機開 `index.html`；打開清單，搜尋公牛／騎士、LAL／LAC、NYK／BKN，檢查每列名稱與隊徽相符。爵士黑色音符應完整可見。
2. 全島沒有 30 張隊徽覆蓋地圖。選勇士島，再選湖人島，確認只顯示當前球館小招牌；入口、人物、橋與點擊範圍保持清楚。回全島保留角色位置且隱藏招牌。
3. 進湖人或勇士主場，確認抬頭與主客隊隊徽；切四種模擬賽況、交換灣區主客場，確認比分及亮燈仍正確。
4. 開兩店，購物車同時加入勇士帽與湖人籃球，檢查兩列隊徽。再查看公牛、湖人記憶簿事件。
5. 手機直向／橫向與 200% 縮放：確認圖案置中、沒有拉伸／裁切，隊名與比分可讀；使用 Tab、Enter、空白鍵仍能走到主場與商店。
6. 後續經授權部署至 `/nba-policy-island/` 後，在瀏覽器網路面板檢查 `assets/team/logos/*.png` 無 404、無大小寫錯誤。此次未部署，正式站新增圖片的 HTTP 結果尚待驗證。

本次僅使用專案檔案／終端機與本地素材查看，未開啟瀏覽器、無頭瀏覽器、VS Code 預覽，亦未 push、部署或修改 Supabase。終端機 DOM 測試不等於手機或實際瀏覽器排版驗收。
