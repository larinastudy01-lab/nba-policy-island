# NBA 政策島｜美國客場巡迴

以美國本土 48 州地圖探索 NBA 球隊站點的原生前端專案。第一版開放金州勇士站，預設展示進行中的模擬賽事。

線上網站：[開啟 NBA 政策島｜美國客場巡迴](https://larinastudy01-lab.github.io/nba-policy-island/)

## 本機開啟

直接以瀏覽器開啟 `index.html`，無須安裝套件、啟動伺服器或提供 API Key。

在 VS Code 的檔案總管右鍵 `index.html` →「在檔案總管中顯示」，再雙擊檔案即可。

## 功能

- 美國本土 48 州本地 SVG 地圖，勇士站依舊金山灣區座標定位。
- 藍金籃球按鈕支援滑鼠、觸控、Tab、Enter、Space，資訊卡支援 Escape 收合。
- 「模擬賽事」可切換今日無賽事、尚未開打、比賽進行中及比賽結束。
- 地圖記分牌與站點資訊卡共用同一份資料；僅進行中狀態啟用脈動光暈。
- 桌機資訊卡位於地圖旁，手機改為地圖下方；支援 `prefers-reduced-motion`。
- 所有賽事及比分皆為本地模擬資料，非 NBA 即時資訊；時間以台灣時間（UTC+8）表示。

## 檔案

| 檔案 | 用途 |
| --- | --- |
| `index.html` | 繁體中文頁面與無障礙結構 |
| `style.css` | 深色版面、響應式配置與動畫 |
| `script.js` | 站點與賽事資料、事件綁定、同步更新 |
| `assets/us-map.svg` | 可離線使用的美國 48 州地圖 |
| `assets/README.md` | 地圖資料來源與投影說明 |
| `assets/us-states.source.json` | 原始州界資料備份 |
| `.nojekyll` | 讓 GitHub Pages 直接提供靜態檔案 |

## GitHub Pages

此專案可直接由 GitHub Pages 發佈。儲存庫設定使用 **Settings → Pages → Deploy from a branch → main → / (root)**，不需建置流程。

後續修改檔案並推送至 `main` 後，GitHub Pages 會更新網站。

## 後續擴充

站點名稱、座標與四種模擬情境集中在 `script.js` 的 `TOUR_DATA`。目前尚未整合 W12 觀賽購物車。
