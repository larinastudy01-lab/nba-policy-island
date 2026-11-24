# 我的球迷與主場尋星

沿用既有島圖、8 隊模擬賽況、勇士售票政策、15 座公共球場及好友邀戰入口。本次只改本機專案，未開啟瀏覽器、推送、部署、執行遠端 SQL 或變更 Supabase。

## 操作動線

1. 工具列按「我的球迷」。桌機開啟右側試衣間，手機開啟全螢幕面板。填暱稱、背號，調整膚色、頭髮、表情、球衣／球鞋及配件。隨機、重設只改預覽；**儲存**後才套用。
2. 關閉試衣間，點勇士主場或從 NBA 清單選勇士。「我」會移到該場館附近。勇士的政策入口仍可使用。
3. 按「尋找球星」，在原創勇士場館中閱讀「球員通道旁」線索。點柯瑞地標（或 Tab 選取後 Enter），才進入拍照畫面。
4. 選「站姿／舉球」與背景。勇士本場為客隊，仍可隨時一般合影；湖人主場在 LIVE 時可選夜場。球星都是隊史致敬插畫，不是現役名單。
5. 按拍照，預覽定格，日期以台灣時間顯示。按收藏：合影冊 1／8，勇士主場出現青色相機標記。它與金色政策勾號、主場賽況光圈分別顯示。
6. 按下載 PNG。輸出 960 × 640，應包含你的角色、球星、場館、暱稱、隊名、日期與隊史標示。若未自動儲存，使用「另存 PNG」；手機依瀏覽器提示儲存。
7. 關閉合影，回「我的球迷」換衣服並儲存。切合影冊查看勇士照片，舊造型不變。重拍使用目前已儲存造型；再按收藏才會取代同隊舊照片，站數仍 1／8。
8. 重新整理後查看造型與合影冊。儲存被拒絕時有提示，僅保留本次頁面，仍可拍照和下載。清除瀏覽器網站資料會清除這些本機紀錄。

## 8 個尋星站

| 球隊 ID | 代表球星（全部為隊史致敬） | 遊戲內場館 | 合影點 | 插畫 |
| --- | --- | --- | --- | --- |
| warriors | 史蒂芬・柯瑞 | 灣岸勇士球館 | 球員通道旁 | assets/stars/curry.svg |
| lakers | 魔術強森 | 紫金星光球館 | 記分板下方 | assets/stars/magic.svg |
| clippers | 克里斯・保羅 | 海岸快艇球館 | 場邊熱身區 | assets/stars/paul.svg |
| nuggets | 尼古拉・約基奇 | 高地金塊球館 | 山形看台前 | assets/stars/jokic.svg |
| mavericks | 德克・諾威斯基 | 藍色天際球館 | 主場隊徽旁 | assets/stars/dirk.svg |
| bulls | 麥可・喬丹 | 紅色傳奇球館 | 冠軍旗幟下 | assets/stars/jordan.svg |
| celtics | 賴瑞・柏德 | 綠衫經典球館 | 木地板中線 | assets/stars/bird.svg |
| knicks | 派屈克・尤因 | 都會橘藍球館 | 球員席旁 | assets/stars/ewing.svg |

場館背景在 `assets/arenas/<teamId>.svg`。`fan-core.js` 的 `STATIONS` 集中管理 ID、球星、插畫／背景路徑、合影點名稱與座標。擴充球隊時先加入既有 `TEAMS`，再新增 `STATIONS` 與對應素材，即可共用試衣間、場景、合影及合影冊。

## 資料與匯出

- 角色鍵：`nba-policy-island:fan:v1`。已儲存造型與編輯草稿分開，舊政策儲存鍵保留。
- 相冊鍵：`nba-policy-island:photos:v1`。每隊一筆，內容為球隊／球星 ID、當時造型、姿勢、背景與 ISO 拍攝時間；不存大型 PNG。讀寫傳回深拷貝，換裝不會改寫舊照片。
- 暱稱為純文字，SVG XML 會轉義；造型只能採預設選項。非法站點或照片紀錄會被拒絕／略過。
- 桌機與手機共用原生 dialog，支援鍵盤焦點與 Escape。15 座公共球場沒有尋星入口；真人房間尚未同步角色。
- PNG 用同一份向量來源嵌入背景、角色與球星，組成無外部圖片引用的 SVG data URL，再經 Image → Canvas → PNG Blob。無須 fetch，也不依賴 CDN，可從本機檔案及 `/nba-policy-island/` 使用。

## 課堂對應

| 週次 | 功能 | 檔案位置 | 操作展示 |
| --- | --- | --- | --- |
| W03 CH04 | 圖片 alt、SVG title／desc、場館／照片 figcaption | index.html、fan-core.js、stars/*.svg、arenas/*.svg | 查看角色圖說、尋星場館與合影文字 |
| W05 CH06 | 有 label 的暱稱、背號、造型 select 與 fieldset 表單 | index.html、fan-ui.js | 編輯、隨機、重設、送出儲存 |
| W08 CH09 | 分層 SVG、地圖「我」、合影點 absolute、桌機側欄／手機全螢幕 | fan.css、script.js、fan-core.js | 變更視窗、選場移動、進入球館尋星 |
| W11 CH13 | 造型／球星／相冊物件、DOM 即時預覽、拍照快照 | fan-core.js、fan-ui.js | 草稿不套用、儲存才套用、換裝後看舊照片 |
| W12 CH14 | addEventListener、表單 preventDefault、拍照／重拍／收藏／下載事件 | fan-ui.js、script.js | 完整走一次建立造型到下載與回看流程 |

## 本次終端機驗證與界線

```powershell
node --check script.js
Get-ChildItem assets -Filter *.js | ForEach-Object { node --check $_.FullName }
node --check assets/generate_fan_assets.cjs
node --test tests/policy.test.cjs tests/island.test.cjs tests/ui.test.cjs tests/fan.test.cjs
python tests/check-static.py
git diff --check
```

Node 共 **62 項通過、0 項失敗**。涵蓋造型草稿／儲存／讀回、儲存拒絕、8 隊與合影點、同隊更新、舊照片不隨換裝變動、湖人主場夜場、三種地圖標記獨立、共享單機結算角色，並保留售票三方案與 30 秒投籃回歸。

新增 16 個 SVG 素材與 9 種合影 XML 可解析，合影各有兩個人物、沒有外部 image／foreignObject；HTML 172 個 ID 唯一、素材與錨點均使用相對路徑。三個 CSS 檔案做括號檢查，未做瀏覽器排版驗證。

PNG 測試驗證 SVG 構圖、Canvas 尺寸／繪製／PNG 輸出協定、錯誤處理及下載事件，使用純 Node 的 Image／Canvas／DOM 替身，**未實際在瀏覽器光柵化或下載 PNG**。未執行真人連線或遠端 SQL。

## 由你手動預覽

- 完整驗收動線：**建立造型 → 勇士主場 → 找到柯瑞 → 拍照收藏 → 下載 PNG → 換裝後回合影冊看舊照片**。
- 桌機右側試衣間、手機全螢幕、表單與相機標記在窄螢幕／200% 縮放下是否清楚可讀。
- Tab／Enter／Space、select 方向鍵、觸控球星地標、Escape 關閉與焦點返回；手機由清單進主場是否可完整操作。
- 實際 PNG 是否 960 × 640、兩個角色與背景完整、中文字正常、日期與暱稱正確；從本機檔案及未來 Pages 子路徑各下載一次。
- 湖人 LIVE 可選夜場、完賽新拍照不能選夜場；已收藏夜場仍保留原背景。勇士任何狀態均可一般合影。
- 同隊更新仍 1／8；換裝後舊照片、重新整理後造型／合影與勇士政策完成紀錄都保留。
- 勇士學生保留席仍為 20／40 人、2,400 點；公共球場仍能投進一球並完成 30 秒結算，結算顯示已儲存角色。
