# 我的球迷、16 站尋星與島上偶遇

沿用既有島圖、球迷造型、勇士售票政策、15 座公共球場及好友邀戰入口；擴建至 16 隊，加入 3 個島上偶遇地點。只改本機專案，未開啟瀏覽器、推送、部署、執行遠端 SQL 或變更 Supabase。

新版角色會沿道路／橋行走，到達後才可揭曉偶遇球星；視角與日夜操作、取消路線及四條地圖驗收見 [EXPLORER.md](./EXPLORER.md)。全島按鈕只調鏡頭。啟用減少動態效果可直接定位，原有相冊與造型儲存資料保持相容。

## 操作動線

1. 工具列按「我的球迷」。桌機開啟右側試衣間，手機開啟全螢幕面板。填暱稱、背號，調整膚色、頭髮、表情、球衣／球鞋及配件。隨機、重設只改預覽；**儲存**後才套用。
2. 關閉試衣間，點勇士主場或從 NBA 清單選勇士。「我」會移到該場館附近。勇士的政策入口仍可使用。
3. 按「尋找球星」，在原創勇士場館中閱讀「球員通道旁」線索。點柯瑞地標（或 Tab 選取後 Enter），才進入拍照畫面。
4. 選「站姿／舉球」與背景。勇士本場為客隊，仍可隨時一般合影；湖人主場在 LIVE 時可選夜場。球星都是隊史致敬插畫，不是現役名單。
5. 按拍照，預覽定格，日期以台灣時間顯示。按收藏：「主場」合影冊 1／16，勇士主場出現青色相機標記。它與金色政策勾號、主場賽況光圈分別顯示。
6. 按下載 PNG。輸出 960 × 640，應包含你的角色、球星、場館、暱稱、隊名、日期與隊史標示。若未自動儲存，使用「另存 PNG」；手機依瀏覽器提示儲存。
7. 關閉合影，回「我的球迷」換衣服並儲存。切合影冊的「主場」頁查看勇士照片，舊造型不變。重拍使用目前已儲存造型；再按收藏才會取代同隊舊照片，站數仍 1／16。
8. 重新整理後查看造型與合影冊。儲存被拒絕時有提示，僅保留本次頁面，仍可拍照和下載。清除瀏覽器網站資料會清除這些本機紀錄。

## 16 個尋星站

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
| spurs | 提姆・鄧肯 | 銀黑基石球館 | 銀色旗幟旁 | assets/stars/duncan.svg |
| thunder | 羅素・衛斯布魯克 | 雷鳴動力球館 | 閃電看台前 | assets/stars/westbrook.svg |
| suns | 史蒂夫・奈許 | 紫橘日光球館 | 日光入口旁 | assets/stars/nash.svg |
| timberwolves | 凱文・賈奈特 | 森林狼影球館 | 森林看台下 | assets/stars/garnett.svg |
| bucks | 卡里姆・阿布都賈霸 | 綠鹿經典球館 | 經典球衣牆前 | assets/stars/kareem.svg |
| sixers | 艾倫・艾佛森 | 費城答案球館 | 藍紅通道旁 | assets/stars/iverson.svg |
| heat | 德韋恩・韋德 | 南灣熱浪球館 | 暖身球框旁 | assets/stars/wade.svg |
| raptors | 文斯・卡特 | 北境飛翔球館 | 北境旗幟下 | assets/stars/carter.svg |

場館背景在 `assets/arenas/<teamId>.svg`。`island-core.js` 的 `TEAMS` 集中管理隊伍、隊色、島上位置與 `arenaId`；`fan-core.js` 的 `STATIONS` 管理 `home-photo-<teamId>`、球星 ID、插畫／背景、合影點與場景座標。擴充時加入這兩份資料及素材即可沿用介面，隊伍計數與相冊分母會自動更新。16 主場按城市大致方位分布於西岸、西南沙漠、內陸、五大湖、東岸及南端海濱。

## 島上偶遇

| 地點 ID | 名稱 | 背景 |
| --- | --- | --- |
| meet-pier | 西岸碼頭步道 | assets/encounters/meet-pier.svg |
| meet-plaza | 中央廣場 | assets/encounters/meet-plaza.svg |
| meet-garden | 五大湖畔公園 | assets/encounters/meet-garden.svg |

三處都有地圖按鈕與「島上偶遇」分類清單入口，與 NBA／公共球場分開管理。先前往地點才會看到當天是否有人；有人的地點顯示「附近有熟悉的身影」，點剪影揭曉代表球星及遊戲招呼，再按「一起拍照」。使用已儲存造型、該球星插畫及地點背景，可選站姿／舉球、收藏、下載。

排程只取 **Asia/Taipei** 日期，以 2026-01-01 為輪替基準。相同日期固定同一組；現在每 16 天輪完所有代表球星、每 48 天輪完每人三個地點，沒有隨機遺漏。每 30 秒與頁面恢復時檢查跨日。NBA 賽況不影響偶遇；所有主場合影點仍隨時可進入。

本機 `file://`、`localhost`、`127.0.0.1` 或 `[::1]` 才顯示日期測試表單，可指定日期。也可自行把本機網址改成 `file:///…/index.html?encounterDate=2026-01-01`；日期參數可保留在網址供重整驗證。若瀏覽器不允許 file 頁面更新網址，手動加入參數即可。公開 GitHub Pages 忽略該參數，不提供測試控制。

| 測試日期 | 球星 | 地點 |
| --- | --- | --- |
| 2026-01-01 | 柯瑞 | 西岸碼頭步道 |
| 2026-01-02 | 魔術強森 | 中央廣場 |
| 2026-01-03 | 保羅 | 五大湖畔公園 |
| 2026-01-17 | 柯瑞 | 中央廣場 |

拍下第一張柯瑞偶遇照後，再用 1 月 17 日拍攝並收藏，偶遇仍只計一位球星；主場勇士照片保留。已收藏快照可在任意日期查看與下載。若在未拍照時跨日，拍照會停用並提示重新前往當天地點；已定格或已收藏照片不受影響。

## 資料與匯出

- 角色鍵：`nba-policy-island:fan:v1`。已儲存造型與編輯草稿分開，舊政策儲存鍵保留。
- 相冊鍵繼續使用 `nba-policy-island:photos:v1`。舊版 `{version:1, photos:[…]}` 讀入「主場」；下次收藏改寫為 `{version:2, photos:[…], encounters:[…]}`，保留原有內容。
- 主場每隊一筆；偶遇每個 `starId` 一筆，互不覆寫。偶遇記錄含 `teamId`、`starId`、`locationId`、背景 ID、當日排程日期、當時造型、姿勢及 ISO 拍攝時間。讀寫傳回深拷貝，換裝／換日期不改寫舊照片。不存大型 PNG。
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
node --check assets/generate_bay_assets.cjs
node --test tests/*.test.cjs
python tests/check-static.py
git diff --check
```

Node 共 **163 項通過、0 項失敗**。涵蓋 16 個唯一球隊 ID、15 公共球場、16 個合影點與 3 偶遇地點；同日重整、台灣午夜、48 天完整輪替、本機測試日期限制；舊收藏遷移、兩類同人照片並存、重拍不重複計數、換裝／隔天後舊照片不變。造型草稿／儲存／讀回、湖人主場夜場、標記獨立、政策三方案與 30 秒投籃回歸亦通過。

35 個 SVG 素材與 20 種合影 XML 可解析，合影各有兩個人物、沒有外部 image／foreignObject；HTML 257 個 ID 唯一、素材與錨點均使用相對路徑。六個 CSS 檔案做括號檢查，未做瀏覽器排版驗證。

PNG 測試驗證 SVG 構圖、Canvas 尺寸／繪製／PNG 輸出協定、錯誤處理及下載事件，使用純 Node 的 Image／Canvas／DOM 替身，**未實際在瀏覽器光柵化或下載 PNG**。未執行真人連線或遠端 SQL。

## 由你手動預覽

- 完整驗收動線：**建立造型 → 勇士主場 → 找到柯瑞 → 拍照收藏 → 下載 PNG → 換裝後回合影冊看舊照片**。
- 桌機右側試衣間、手機全螢幕、表單與相機標記在窄螢幕／200% 縮放下是否清楚可讀。
- Tab／Enter／Space、select 方向鍵、觸控球星地標、Escape 關閉與焦點返回；手機由清單進主場是否可完整操作。
- 實際 PNG 是否 960 × 640、兩個角色與背景完整、中文字正常、日期與暱稱正確；從本機檔案及未來 Pages 子路徑各下載一次。
- 湖人 LIVE 可選夜場、完賽新拍照不能選夜場；已收藏夜場仍保留原背景。勇士任何狀態均可一般合影。
- 同隊更新主場仍 1／16；同球星更新偶遇仍 1／16。換裝後舊照片、重新整理後造型／兩類合影與勇士政策完成紀錄都保留。
- 核對16 座球館的建築、名稱、清單入口、代表球星及固定合影點。16／30 和相冊分母均顯示 16。
- 本機指定 1 月 1 日 → 西岸碼頭步道 → 點剪影揭曉柯瑞 → 拍照收藏／下載 → 在主場及偶遇兩頁查看柯瑞 → 換裝、改 1 月 2 日 → 查看舊照。確認場景、文字、PNG、兩類進度與跨日提示。
- 勇士學生保留席仍為 20／40 人、2,400 點；公共球場仍能投進一球並完成 30 秒結算，結算顯示已儲存角色。

舊版偶遇照片沒有 sceneVersion 時保留 v1 背景與舊地點名稱，新拍照用 v2 湖岸場景；主場收藏透過 arenaId 索引，原 teamId 收藏仍可讀回。15 場單人玩法與好友 PK 改動見 README 與 MULTIPLAYER.md。
