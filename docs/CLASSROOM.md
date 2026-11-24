# 九週課堂功能與展示

直接用瀏覽器開啟專案 `index.html` 即可離線使用。所有執行素材均為相對路徑，支援 GitHub Pages `/nba-policy-island/`。本次未操作瀏覽器、推送、部署、執行遠端 SQL 或變更服務設定。

| 週次 | 對應功能 | 檔案位置 | 如何操作展示 |
| --- | --- | --- | --- |
| W02 CH03 | `<a>` 區內導航、`<dl>` 球隊城市／縮寫／區域、`<time>` 開賽時間、`<ol>` 投籃步驟 | `index.html`；`script.js` 的 `renderScoreboard`、`renderPanel` | 點探索島嶼；選湖人，切待開打看 11:00 台灣時間；進公共球場查看三步驟 |
| W03 CH04 | `<figure>`、背景圖片 `alt`、`<figcaption>`；政策 `<table>`、`<caption>`、`<th scope>` | `index.html`；`assets/island-map.svg`；`script.js` 的 `renderComparison`；`assets/policy.css` | 看島圖圖例；勇士試算後比較三方案，手機看逐方案卡片 |
| W04 CH05 | 本地 `<audio>` 進球／終場聲，`<noscript>` 簡版 23 站指南 | `index.html`；`assets/shot-hit.wav`、`round-end.wav`、`generate_audio.py`；`script.js` 的 `playSound` | 開始單機，勾音效後命中並等終場；關閉 JavaScript 查看簡版場地資訊 |
| W05 CH06 | 政策 radio 表單、`fieldset`／`legend`、重設；暱稱開房表單；三組球場 `select`／`optgroup` | `index.html`；`script.js`；`assets/policy-core.js` | 換售票方案後重新試算、重設；公共球場下拉切港邊／公園／屋頂；連線後輸入暱稱開房 |
| W07 CH08 | 隊色、主客標籤、圖例、LIVE／模擬、等寬數字比分 | `style.css`；`assets/island-core.js`；`assets/policy.css` | 比較湖人紫金與勇士藍金；切四種賽況，閱讀主客分數及狀態 |
| W08 CH09 | 島圖 relative、地標 absolute 百分比座標、地圖／地標／記分板 z-index；面板 padding／border／max-width | `style.css`；`script.js` 的 `buildLandmarks` | 改變視窗大小與縮放，確認建築與點擊區對齊；桌機側欄、手機下方面板 |
| W09 CH12 | 常數、算術與邏輯判斷：票房、兩目標、命中區、勝負／平手 | `assets/policy-core.js`；`assets/island-core.js` | 學生保留席算出 2,400 點、兩目標通過；投籃命中加分，好友局同分平手 |
| W11 CH13 | 隊伍／比賽／球場／房間物件，共用 DOM 面板及 `textContent` 更新 | `assets/island-core.js`；`assets/online.js`；`script.js` | 在勇士／湖人切換看同一場比分，透過地圖、清單與 select 選同一球場 |
| W12 CH14 | `addEventListener` 的 click／change／submit／keydown；`preventDefault`；`setInterval`／`clearInterval` | `script.js`；`tests/ui.test.cjs` | 送出政策不換頁；按空白鍵／觸控投籃；按住不連發，終場停止，重開或離場清理計時 |

## 三段展示動線

1. **湖人球館 → 模擬賽況。** 預設進行中，點湖人，應看到主隊湖人 74、客隊勇士 78，第 3 節與「模擬賽事」。本場只有湖人球館脈動，勇士不亮。切無賽事／待開打／進行中／已完賽，完賽為湖人 101：108 勇士且無脈動。其他三場的主隊依各場狀態亮燈。切回進行中再到下一站。
2. **勇士站 → 2,400 點。** 點勇士「門票怎麼分？」→「學生保留席」→「試算」，應為學生 20 人、一般球迷 40 人、總入場 60 人、收入 2,400 點，兩目標通過。表格標出本次方案；比較原價 0／60／2,700，抽籤期望值 15／45／1,800。換方案提示重算，重設清空本次選項與結果。重新試算保留席並確認，島圖出現完成勾號與 1／1；重整應保留。
3. **潮汐一號 → 命中一球 → 終場。** 點「找人 PK」或港邊潮汐一號 → 開始單機練習 → 倒數後在金色區出手（點按鈕或聚焦投籃區按空白鍵）。命中 +1，等 30 秒結束，應看到自己的結算及明確單機標示。開啟／關閉音效、長按空白鍵、終場後出手、重開及離場各測一次。

## 終端機實測

```powershell
node --test tests/policy.test.cjs tests/island.test.cjs tests/ui.test.cjs
node --check script.js
Get-ChildItem assets -Filter *.js | ForEach-Object { node --check $_.FullName }
python tests/check-static.py
git diff --check
```

2026-11-24 實際結果：Node 共 **43 項通過、0 項失敗**；5 個執行用 JavaScript 語法通過；104 個 HTML ID 唯一，區內錨點與本地資產路徑可解析，符合 `/nba-policy-island/` 子路徑。SVG XML／viewBox／引用、兩份 CSS 括號、課堂標籤與三個 optgroup 通過。兩個 WAV 為有效單聲道 PCM16／22,050 Hz，分別 0.36 與 0.68 秒，沒有 autoplay。`git diff --check` 通過。

測試範圍：8 個唯一球隊 ID、15 個唯一公共球場 ID、三區各 5 場、23 站分流、三種選場方式同步、四賽況主客比分與亮燈、舊進度保留、政策三方案與重設、投籃命中／時間限制／重開／清理、音效開關與拒播後回饋，以及重複／第三人加入的模型與 SQL 契約。

`tests/ui.test.cjs` 使用 Node 元素替身與虛擬時鐘，沒有啟動瀏覽器。好友房間測試使用後端資料形狀的測試替身，**不是兩台真人裝置同步實測**。SQL 僅檢查 RPC 與權限結構，沒有執行資料庫。音效格式測試不代表已聽過聲音。

## 手動預覽待驗

- 島圖立體地景、23 建築名稱與點擊區；200% 縮放，320／375／768／1440 像素附近的面板、表格／卡片與比分可讀性。
- Tab／Enter／Space、radio 方向鍵、select 方向鍵、焦點輪廓、觸控；三個選場入口是否一致。
- 四賽況、主場脈動、完賽關燈；系統「減少動態效果」啟用後保留靜態光圈。
- 音效實際聽感與播放許可，關閉後仍保留畫面提示；時間截止、重開與離場是否符合操作直覺。
- 關閉 JavaScript 時簡版指南仍可讀；舊版完成紀錄在重新整理後可讀取。
- Supabase 設定、SQL 執行、RLS、並行入房、實際網路延遲與雙裝置勝負／平手均待驗。

## 兩台裝置好友邀戰

完整步驟與安全驗證在 [MULTIPLAYER.md](./MULTIPLAYER.md)。目前公開設定留空，開房／加入停用且不發出網路請求。

1. 由你手動啟用 Supabase 匿名登入、套用 `supabase/schema.sql`，填入 `assets/supabase-config.js` 的公開 Project URL／publishable 或 anon key；不要填服務端金鑰。
2. 由你提供兩台裝置都能讀取的相同新版網站；本機 file 連結不能跨裝置分享。A、B 使用獨立匿名身分，兩邊都確認「已連線」。
3. A 選潮汐一號、輸入暱稱開房並分享完整加入連結。B 開連結定位同球場、輸入暱稱加入；雙方看見相同兩名真人。
4. 同一人再加入應拒絕；第三個獨立身分加入應顯示已滿。只一人就緒不能開始；兩人就緒後由房主開始。
5. 等 5 秒倒數，各投 30 秒，測不同命中數的勝負，以及雙方不投球的 0：0 平手。終場後不得計分，房主重開須雙方重新就緒。
6. 驗證只能提交自己的成績、重送不能覆寫、錯誤局數被拒絕；測第三人同時加入、斷線、15 秒提交寬限，以及同球場多房互不干擾。
