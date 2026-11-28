# 獨立 Three.js 群島原型

正式 `index.html`、原版圖層及儲存格式沒有被替換。本目錄可整個移除回退，不影響正式網站。

從專案根目錄執行：

```powershell
python -m http.server 8080
```

手動開啟 `http://localhost:8080/prototype/three-islands/`。結束在終端機按 Ctrl+C。ES Modules 及 GLB 載入需要 HTTP；原版的直接開檔能力保持不變。

獨立原型的 GitHub Pages 入口：[開啟 Three.js 試驗場](https://larinastudy01-lab.github.io/nba-policy-island/prototype/three-islands/)。正式首頁仍使用原版地圖。這是使用者在第一階段完成後授權的原型發布；HTTP 檔案可用不代表畫面、FPS、手機或雙裝置驗收已通過。

- 勇士：程序生成低矮球館、黃棚商店、橘色半場、木碼頭與紅橋。
- 湖人／公牛：簡化球館與街景測試島。
- 其餘 27 隊：僅岸線、低精度球館及清單；保留原功能入口，不宣稱完成精細 3D。
- 點隊徽／搜尋清單選島，點設施或右側入口沿原路網移動。抵達後以同源 iframe 開啟未修改的原版功能；關閉後回 3D 原位。
- 所有圖片、模型和 Three.js 都是本地相對路徑；執行不需要 CDN、API key 或 npm 安裝。好友連線仍依原 Supabase 設定，空白時僅提供原有單機功能。
- 我的球迷讀取既有儲存；3D 暫以中性方塊人對應膚色／髮色，完整髮型／表情／配件仍由原版換裝與拍照介面呈現，不能視為已完成等價 3D 角色。
- 儀表板可匯出真實執行時的 FPS、draw calls、三角形、幾何／紋理數、JS heap 及載入計時。無支援欄位顯示空值，不推估 GPU bytes。
- [原版量測包覆頁](baseline.html) 用相同裝置量測正式地圖，不修改其程式。

詳見 [架構、驗收及整合計畫](../../docs/THREE_PROTOTYPE.md)、[授權紀錄](../../ASSET_LICENSES.md)。

完整終端機驗證（目前 Node 24／Python 環境）：

```powershell
node prototype/three-islands/validate.cjs
```

不會啟動瀏覽器或伺服器；會更新 `docs/three-prototype-validation.json` 及靜態體積比較。重建隊徽縮圖才需要 Pillow，網站執行不需要 Python／Pillow。
