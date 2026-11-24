# 球迷記憶簿

本機新版「一隊一島」新增五段歷史策展。從島圖工具列開啟「球迷記憶簿」，以「前往島上」沿既有橋梁／道路抵達，再自主點擊場景的「讀」提示。全島總覽不顯示歷史提示；當前球隊島、距入口 82 世界單位內才展開。Tab 可聚焦歷史入口、帶鏡頭到該島，Enter／空白鍵前往；按住不會重複啟動。

島上的展點是原創遊戲場景，不是實際紀念設施或原比賽場地。文字由本專案重新撰寫，官方來源在每筆閱讀頁底部。所有素材皆為本地原創像素 SVG，沒有遠端影音或圖片。

| 事件 ID | 球隊島／事件當地日期 | 場景入口／呈現形式 | 官方來源 |
| --- | --- | --- | --- |
| memory-lakers-2020 | island-lakers／2020-01-26 | 湖人紀念廣場：九束靜態花、紀念牆，自主閱讀，沒有動畫、聲音、得分或過關 | [NBA 致敬專頁](https://www.nba.com/kobe-bryant-tribute) |
| memory-bulls-1998 | island-bulls／1998-06-14 | 環島花園球場的粉筆投籃點；可選一球重現，原有戰術記憶小遊戲保留 | [NBA 關鍵跳投回顧](https://www.nba.com/news/history-finals-moments-michael-jordan-last-shot-1998) |
| memory-warriors-2015 | island-warriors／2015-06-16 | 勇士廣場冠軍記分板；歷史比分與模擬賽況獨立 | [勇士官方回顧](https://www.nba.com/warriors/gameday/20150616/recap)、[NBA 比賽資料](https://www.nba.com/game/gsw-vs-cle-0041400406) |
| memory-knicks-1970 | island-knicks／1970-05-08 | 街角舊報紙亭；原創編排，非歷史報紙原件 | [NBA Willis Reed 回顧](https://www.nba.com/news/history-finals-moments-hobbled-willis-reed-inspires-knicks-victory-in-game-7) |
| memory-raptors-2019 | island-raptors／2019-05-12 | 屋頂邊線投籃點；可選一球及四次彈框像素重現 | [NBA 比賽回顧](https://www.nba.com/watch/video/game-recap-raptors-92-sixers-90)、[NBA 決勝球](https://www.nba.com/watch/video/2019-east-semis-game-7-kawhis-shot-vs-76ers?plsrc=nba) |

湖人短文同時悼念 Kobe、Gianna 及同場罹難的另外七人。九束花固定不動；無需點擊、投籃或完成任何活動才能離開。

## 操作及紀錄

- 只造訪、開啟閱讀、出手都不會自動寫入閱讀紀錄；按「標記已閱讀・收進記憶簿」才保存。進度為已讀事件數／五筆資料總數。
- 已讀項目會出現「回看」，可在任何位置閱讀，不移動角色。同筆只計一次；保留第一次標記時間。
- 使用新鍵 `nba-policy-island:memories:v1`，格式 `{version:1,read:[{eventId,readAt}]}`；不修改球迷造型、主場／偶遇照片、售票政策或房間紀錄。未知 ID、無效日期、重複項、壞 JSON 不會阻擋本次閱讀。儲存被阻擋時顯示提示，本頁仍可標記與回看。
- 公牛／暴龍的「開始／再試一球」完全自選，每次 8 秒、一球。金色 40–60% 命中；滑鼠、觸控按「出手」或在操作區按空白鍵。歷史比分固定，不與公共球場／真人對局互傳成績。
- 開啟減少動態效果時改用靜態滑桿調整，保留同一命中區，不顯示飛球動畫。關閉、回記憶簿、離頁／背景、切換動態設定均清除出手計時。重新開始不帶入前次結果。
- 外部官方來源須連網查閱，會由使用者點擊開啟新頁。本機閱讀和所有遊戲不需要網路。

## 實作檔案

| 檔案 | 用途 |
| --- | --- |
| assets/memory-core.js | 五事件的 ID、島、日期／賽季、文字、點位、形式、官方來源；獨立閱讀儲存、鄰近判斷、單球邏輯 |
| assets/archipelago-core.js | 五個場景物件位置、入口及島內路網支線；原 ID／邀請連結保留 |
| assets/memory-art.js、generate-memory-assets.cjs | 與全島共用 Tile、2:1 投影及左上光源，生成五場景＋五物件 SVG |
| assets/memories/ | 十份本地 SVG；閱讀場景與地圖物件外形分開 |
| assets/memory-ui.js、memory.css、index.html | 場景提示、可鍵盤操作的原生 dialog、記憶簿／閱讀、可選投籃及手機版 |
| script.js、explorer-core.js、explorer-ui.js、fan-ui.js | 接回選站／路網／抵達／鏡頭／角色，保留原操作流程 |
| tests/memory.test.cjs、ui.test.cjs、check-static.py | 純邏輯、元素事件替身及素材／相對路徑檢查，不使用瀏覽器 |

重建素材：`node assets/generate-memory-assets.cjs`。新增事件需同步加入事件資料與 `MEMORY_PLACES`，再生成素材；不要重用 NBA 主場或社區球場 ID。

## 手動驗收（尚待目視）

1. 本機直接開 `index.html`。全島應以隊名、主場、橋梁為主，不見歷史提示牌。工具列開記憶簿，五項皆可「前往島上」。
2. 選湖人前往紀念廣場。沿道路抵達後才看到小提示，點紀念牆閱讀。確認九束花不動、沒有聲音／投籃／分數；文字提到另外七人。按標記、關閉、重整，回看仍在且只計一筆。
3. 選公牛前往街頭球場。確認既有環島花園入口和戰術記憶仍可用；歷史粉筆點可用鍵盤 Enter／空白鍵打開。開始可選一球，出手／逾時／重試，歷史 87：86 不變。減少動態時用滑桿到 50% 出手。
4. 勇士廣場看固定冠軍比分；另切四種模擬賽況，只有模擬主隊 LIVE 光暈隨之更新。從勇士主場試算保留席 2,400 點，再回記憶簿，兩種進度互不影響。
5. 尼克報紙亭與暴龍投籃點都能從橋走到。確認「像素重現／非歷史影像／非報紙原件」標示；暴龍自選命中有四次簡化彈框，減少動態則靜態結果。
6. 手機直／橫向、200% 放大：提示不遮入口和角色、閱讀可捲動、按鈕觸控足夠；桌機 Tab／Shift+Tab／Escape 操作、關閉後焦點返回入口。這些為手動項目，Node 替身不能驗證實際排版、瀏覽器焦點及觸控。
7. 關閱讀後回全島，角色留原地；接著單人小遊戲、每日偶遇、合影／PNG 及既有邀請入口仍可操作。真人房間設定仍空白，未進行雙裝置連線驗證。

以上流程尚未開瀏覽器實測。本次不推送、不部署，不更動 Supabase。

## 本次終端機驗證

- `node --test tests/*.test.cjs`：209 項通過、0 失敗，包含 7 項記憶簿核心測試、4 項新增介面事件測試，以及原有跨島／賽況／政策／造型／合影／15 款遊戲／房間資料替身測試。
- `node --check`：27 份專案 JavaScript／CJS 語法通過。
- `python tests/check-static.py`：303 個 HTML ID 唯一；10 份 CSS 大括號平衡；素材、來源圖說、相對路徑與 Pages 子路徑通過；五份場景＋五份入口 SVG 的 XML／整數像素格通過。
- `git diff --check`：無空白錯誤。未使用瀏覽器或無頭瀏覽器；以上不等於已完成目視或雙裝置驗證。
