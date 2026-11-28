# NBA Policy Island — NBA History Journey

修訂：2026-11-29。這是**待實作與待史料查核的開發計畫**，不是功能完成清單。保留原四十二組主題、三十隊展區與紀念公園要求；依後續指示取消額外十款／十座場地，改造既有十五場。歷史主題的年份、數據與人物敘述須逐項查核後才能公開為網站內容。本版尚未宣稱完成四十二組史料或歷史玩法。

跨裝置操作是全部十五款的必要條件，詳見 [共用輸入與 RWD 規格](./CROSS_PLATFORM_REQUIREMENTS.md)及 [90 組驗收紀錄](./CROSS_PLATFORM_TEST_REPORT.md)。目前歷史版本為 0／90 組通過；原有遊戲的邏輯／瀏覽器抽測不可替代。

## 一、專案目標

正式網站：
https://larinastudy01-lab.github.io/nba-policy-island/

Three.js 原型：
https://larinastudy01-lab.github.io/nba-policy-island/prototype/three-islands/

請延續目前 NBA Policy Island 的 Three.js 正式整合計畫，將網站發展為結合 NBA 球隊、城市探索、籃球歷史、文化教育、球迷收藏及遊戲互動的完整 3D 世界。

本次新增 NBA History Journey（NBA 歷史探索之旅）。

所有以下列出的歷史主題都必須納入，不可僅完成部分示範事件。

核心要求：

- 30 支球隊皆具備專屬歷史場景。
- 完成全部 42 組歷史主題。
- 建立 Kobe Bryant 專屬紀念公園。
- 將既有 15 座公共球場及其遊戲重構為 15 款主要歷史挑戰，不新增公共球場。
- 擴充原有球迷記憶簿為 NBA 歷史圖鑑。
- 建立冠軍獎盃、紀念雕像、球衣及歷史展覽。
- 全面採用非像素風 Stylized 3D 美術。
- 保留美國地理形狀的30隊群島規劃。
- 保留既有功能及使用者資料。

## 二、東區15支球隊歷史場景

### 01. 波士頓塞爾提克 — Celtics Dynasty Museum

歷史事件：1959–1966年八連霸。

製作：

- 八座冠軍獎盃及冠軍旗幟。
- Bill Russell 紀念區。
- 綠白色王朝博物館。
- 各冠軍年份的展示櫃。
- 2024年冠軍延伸展區。

### 02. 布魯克林籃網 — Nets Eastern Champions Hall

歷史事件：2002年，紐澤西籃網時期首次晉級 NBA 總決賽。

製作：

- 東區冠軍獎盃。
- Jason Kidd 傳奇展區。
- 紐澤西至布魯克林的隊史時間軸。
- 黑白色現代化紀念館。

### 03. 紐約尼克 — Knicks Championship Plaza

待史料查核：原提案的「2026年獲得總冠軍」敘述尚未取得官方證據，不可當成已確認史實公開；查核後再決定是否保留。1970、1973年冠軍展區亦需列出正式來源。

製作：

- 1970、1973年冠軍展示；2026年內容僅於官方查核通過後納入。
- 紐約街頭冠軍遊行廣場。
- Jalen Brunson 等相關球員的歷史展區。
- 橘藍色城市慶典裝飾。

### 04. 費城76人 — Philadelphia Legends Hall

歷史事件：1983年總冠軍。

製作：

- Julius Erving 與 Moses Malone 展區。
- 1983年冠軍獎盃。
- 費城籃球歷史牆。
- 傳奇球員紀念雕像。

### 05. 多倫多暴龍 — Raptors First Championship Plaza

歷史事件：2019年隊史首冠。

製作：

- 2019年冠軍獎盃。
- Kawhi Leonard 紀念區。
- 加拿大城市慶典廣場。
- 冠軍遊行及球迷旗幟。

### 06. 芝加哥公牛 — Bulls Dynasty Museum

歷史事件：1991–1998年兩次三連霸，共六座冠軍。

製作：

- 六座冠軍獎盃及對應年份。
- Michael Jordan、Scottie Pippen 等代表球員展區。
- 紅黑色王朝博物館。
- 傳奇23號球衣展示。
- 經典總決賽時間軸。

### 07. 克里夫蘭騎士 — Cleveland Comeback Museum

歷史事件：2016年總決賽從1比3落後逆轉勇士並奪冠。

製作：

- 1比3逆轉系列賽記分板。
- LeBron James 與 Kyrie Irving 展區。
- 2016年冠軍獎盃。
- 經典追帽及致勝三分重現入口。

### 08. 底特律活塞 — Bad Boys Defense Arena

歷史事件：1989、1990年二連霸。

製作：

- 兩座冠軍獎盃。
- Bad Boys 王朝歷史牆。
- Isiah Thomas、Dennis Rodman 等代表球員展區。
- 防守訓練場。
- 2004年冠軍延伸展區。

### 09. 印第安那溜馬 — Pacers Legends Court

歷史事件：2000年晉級 NBA 總決賽。

製作：

- Reggie Miller 傳奇射手紀念區。
- 東區冠軍展覽。
- 經典三分球球場。
- 2025年總決賽歷史延伸展區。

必須區分 ABA 冠軍與 NBA 冠軍，不得混為一談。

### 10. 密爾瓦基公鹿 — Bucks Championship Plaza

歷史事件：2021年奪冠，結束50年冠軍等待。

製作：

- 1971及2021年冠軍獎盃。
- Giannis Antetokounmpo 紀念區。
- 2021年總決賽展示。
- 綠色冠軍廣場。

### 11. 亞特蘭大老鷹 — Hawks Teamwork Hall

歷史事件：2014–15賽季取得隊史60勝。

製作：

- 60勝22敗紀念記分板。
- 球隊合作及團隊籃球介紹。
- 戰術展覽館。
- 球隊歷史冠軍資料。

1958年冠軍應正確標示為聖路易老鷹時期。

### 12. 夏洛特黃蜂 — Hornets Historic Court

歷史事件：1993年首次獲得季後賽系列賽勝利。

製作：

- Alonzo Mourning 關鍵投籃紀念區。
- 首次季後賽突破時間軸。
- 紫色及青綠色公共球場。

### 13. 邁阿密熱火 — Miami Big Three Museum

歷史事件：2012、2013年二連霸。

製作：

- LeBron James、Dwyane Wade、Chris Bosh 三巨頭展區。
- 冠軍獎盃及旗幟。
- 2013年總決賽歷史牆。
- 海濱冠軍廣場。
- 2006年首次奪冠延伸展區。

### 14. 奧蘭多魔術 — Magic Legends Hall

歷史事件：1995年首次晉級 NBA 總決賽。

製作：

- Shaquille O’Neal 及 Penny Hardaway 展區。
- 經典魔術球衣。
- 藍白色星光紀念館。
- 2009年總決賽延伸展區。

### 15. 華盛頓巫師 — Washington Basketball History Museum

歷史事件：1978年華盛頓子彈隊獲得 NBA 冠軍。

製作：

- 1978年冠軍獎盃。
- Wes Unseld 與 Elvin Hayes 展區。
- 子彈隊至巫師隊的歷史時間軸。
- 華盛頓首都風格紀念館。

## 三、西區15支球隊歷史場景

### 16. 金州勇士 — Warriors Dynasty Museum

歷史事件：2015、2017、2018、2022年四座冠軍。

製作：

- 四座冠軍獎盃及旗幟。
- Stephen Curry、Klay Thompson、Draymond Green 等代表球員展區。
- Kevin Durant 於相關冠軍賽季的歷史展示。
- Splash Brothers 專區。
- 藍金色現代化博物館。
- 勇士隊完整冠軍歷史時間軸。

### 17. 洛杉磯湖人 — Lakers Championship Palace

歷史事件：2000–2002年 Kobe Bryant 與 Shaquille O’Neal 三連霸。

製作：

- 湖人冠軍獎盃展示。
- Kobe 與 Shaq 王朝紀念館。
- Magic Johnson 等湖人傳奇球員展區。
- 2009、2010及2020年冠軍歷史延伸展示。
- 紫金色冠軍大道。

### 18. 洛杉磯快艇 — Clippers Breakthrough Hall

歷史事件：2021年隊史首次晉級西區決賽。

製作：

- 季後賽突破展覽。
- Terance Mann 關鍵比賽紀念區。
- 球隊發展歷史牆。
- 現代化運動展示館。

### 19. 鳳凰城太陽 — Suns Finals Journey

歷史事件：2021年重返 NBA 總決賽。

製作：

- Chris Paul 與 Devin Booker 展區。
- 西區冠軍展示。
- 1993年及2021年總決賽時間軸。
- 沙漠橘紫色籃球紀念館。

### 20. 沙加緬度國王 — Kings Classic Arena

歷史事件：2001–02賽季取得61勝，晉級西區決賽。

製作：

- 61勝紀念記分板。
- Chris Webber、Vlade Divac 等球員展區。
- 經典國王球場。
- 1951年羅徹斯特皇家隊冠軍歷史展示。

### 21. 丹佛金塊 — Nuggets First Championship Museum

歷史事件：2023年隊史首次獲得總冠軍。

製作：

- 2023年冠軍獎盃。
- Nikola Jokić 與 Jamal Murray 展區。
- 洛磯山風格冠軍廣場。
- 傳球及團隊戰術介紹。

### 22. 明尼蘇達灰狼 — Garnett Legacy Hall

歷史事件：2004年隊史首次晉級西區決賽。

製作：

- Kevin Garnett 紀念區。
- 2004年 MVP 展示。
- 森林風格籃球紀念館。
- 球隊季後賽時間軸。

### 23. 奧克拉荷馬雷霆 — Thunder Championship Plaza

歷史事件：2025年獲得奧克拉荷馬城時期首座總冠軍。

製作：

- 2025年冠軍獎盃。
- Shai Gilgeous-Alexander 展區。
- 藍橘色冠軍廣場。
- 雷霆球隊發展時間軸。

1979年西雅圖超音速隊冠軍應另外標示，不可混稱為奧克拉荷馬城冠軍。

### 24. 波特蘭拓荒者 — Portland Legends Museum

歷史事件：1977年獲得 NBA 總冠軍。

製作：

- Bill Walton 紀念區。
- 1977年冠軍獎盃。
- Damian Lillard 經典絕殺展示。
- 2014及2019年季後賽重要時刻。

### 25. 猶他爵士 — Jazz Pick and Roll Museum

歷史事件：1997、1998年連續晉級總決賽。

製作：

- John Stockton 與 Karl Malone 展區。
- 擋拆戰術展示。
- 兩年西區冠軍紀錄。
- 山區風格籃球博物館。

### 26. 達拉斯獨行俠 — Dirk Championship Plaza

歷史事件：2011年隊史首次獲得總冠軍。

製作：

- Dirk Nowitzki 紀念雕像。
- 2011年冠軍獎盃。
- 經典單腳後仰投籃訓練區。
- 達拉斯冠軍廣場。

### 27. 休士頓火箭 — Houston Dream Dynasty

歷史事件：1994、1995年二連霸。

製作：

- Hakeem Olajuwon 傳奇展區。
- 兩座冠軍獎盃。
- Dream Shake 腳步展示。
- 太空及火箭主題紀念館。
- 姚明時代歷史展區。

### 28. 曼菲斯灰熊 — Grit and Grind Arena

歷史事件：2013年首次晉級西區決賽。

製作：

- Marc Gasol、Zach Randolph、Mike Conley、Tony Allen 展區。
- 鐵血防守紀念牆。
- 防守訓練設施。
- 曼菲斯城市文化背景。

### 29. 紐奧良鵜鶘 — Pelicans Playoff Breakthrough

歷史事件：2018年以4比0橫掃拓荒者。

製作：

- Anthony Davis 與 Jrue Holiday 紀念展區。
- 季後賽4比0記分板。
- 紐奧良音樂城市風格廣場。
- 經典季後賽時間軸。

### 30. 聖安東尼奧馬刺 — Spurs Dynasty Museum

歷史事件：1999、2003、2005、2007、2014年五座總冠軍。

製作：

- 五座冠軍獎盃。
- Tim Duncan、Tony Parker、Manu Ginóbili 傳奇三人組。
- Gregg Popovich 戰術紀念區。
- 團隊籃球傳球展示。
- 黑銀色王朝紀念館。

## 四、Kobe Bryant 專屬紀念公園

在洛杉磯湖人島建立：

Mamba Memorial Park

曼巴紀念公園須具有獨立空間，不可與一般遊戲挑戰或購物區混在一起。

### 31. Kobe 81分紀念區

時間：2006年1月22日。

內容：

- 單場81分歷史介紹。
- 湖人對暴龍的歷史記分板。
- Kobe 生涯紀念展示。
- Mamba 81 投籃挑戰入口。

### 32. Kobe 60分退休之戰

時間：2016年4月13日。

內容：

- 生涯最後一戰的歷史介紹。
- 60分紀念記分板。
- 退休之戰球場背景。
- 告別賽投籃情境重現。

### 33. 8號與24號球衣退休

時間：2017年12月18日。

內容：

- 懸掛8號及24號球衣。
- Kobe 生涯不同時期的紀念展區。
- 五次奪冠紀錄。
- 生涯歷史時間軸。

### 34. Kobe 與 Gianna 紀念公園

時間：2020年1月26日。

紀念 Kobe Bryant、Gianna Bryant 及另外七位事故罹難者。

場景包含：

- 原創紀念雕像或剪影。
- 九顆紀念星。
- 紫金色花卉。
- 8號與24號安靜紀念牆。
- 紀念文字及生涯介紹。
- 夜間柔和燈光。
- 可選擇獻花及閱讀。

禁止：

- 重現直升機事故。
- 把事故設計成競賽或闖關。
- 以罹難人數計分。
- 因獻花或閱讀悲劇事件發放島幣或獎勵。
- 加入不尊重的娛樂化動畫。

### 35. Kobe Bryant All-Star MVP Award

時間：2020年2月16日全明星賽正式頒發以 Kobe 命名的 MVP 獎項。

製作：

- 全明星賽紀念展示。
- Kobe Bryant MVP 獎盃。
- 聯盟紀念歷史時間軸。

另將2020年1月26日暴龍與馬刺以24秒進攻違例致意的事件，製作為跨島共用紀念資訊。

同一事件只使用一個歷史事件 ID，避免重複收藏。

## 五、NBA其他經典歷史事件

### 36. Wilt Chamberlain 單場100分

時間：1962年3月2日。

- 100分紀念記分板。
- 經典比賽展示。
- 100-Point Challenge。
- 主展區設於勇士島，費城島設立跨島入口。

必須標明當時所屬球隊為費城勇士，而非費城76人。

### 37. Michael Jordan — The Last Shot

時間：1998年 NBA 總決賽第六戰。

- 關鍵抄截及致勝跳投介紹。
- 公牛與爵士比賽記分板。
- 最後一投情境挑戰。
- 公牛王朝紀念連結。

### 38. Ray Allen — The Corner Three

時間：2013年 NBA 總決賽第六戰。

- 關鍵底角三分球介紹。
- 熱火與馬刺歷史記分板。
- 底角三分投籃挑戰。
- 2013年冠軍歷史連結。

### 39. Warriors 73 Wins

時間：2015–16賽季。

- 73勝9敗紀念記分板。
- 球隊例行賽紀錄展示。
- Stephen Curry 全票 MVP 介紹。
- 勇士73勝紀念廣場。

必須清楚區分例行賽紀錄與該年度總冠軍結果。

### 40. Kawhi Leonard — The Four Bounces

時間：2019年東區準決賽第七戰。

- 暴龍對76人歷史事件。
- 四次彈框絕殺重現。
- 專屬投籃情境挑戰。
- 暴龍首冠歷史連結。

### 41. Stephen Curry — Three-Point King

時間：2021年12月14日。

- 打破 Ray Allen 生涯三分球命中紀錄。
- 2,974顆三分球歷史突破記分板。
- 三分球紀念館。
- 五點三分投籃挑戰。

歷史紀錄應使用當日突破數據，不可將其誤稱為目前生涯總數。

### 42. Bill Russell — No. 6 Legacy

時間：2022年8月11日。

- NBA 宣布全聯盟退休6號球衣。
- Bill Russell 生涯11座冠軍介紹。
- 籃球平權與傳承歷史展示。
- 6號球衣紀念牆。

以尊重、教育及歷史傳承為主要呈現方式。

## 六、十五座既有球場的整合式歷史挑戰

維持三十座球隊島、十五座公共球場與十五款主要遊戲。沿用以下 court ID 和現有邀請網址，不建立另一套互不相連的歷史遊戲。可以擴充舊核心，但不可只改名稱。下列歷史背景為需求題材，日期與結果須經官方來源查核。

| 原球場 ID | 名稱 | 歷史背景 | 必須有的玩法差異與結算 |
|---|---|---|---|
| harbor-01 | Mamba 81 曼巴得分挑戰 | Kobe 2006 單場 81 分 | 限時投籃累計得分，獨立得分目標與歷史記分板 |
| harbor-02 | Three-Point King 三分之王 | Curry 2021 打破生涯三分紀錄 | 五點三分巡投，各點投進後推進，不只使用舊名稱 |
| harbor-03 | The Four Bounces 命運四彈 | Kawhi 2019 搶七絕殺 | 拖曳角度／力度、拋物線及籃框碰撞／四彈效果 |
| harbor-04 | CP3 Clutch Shot 關鍵擦板 | Chris Paul 2015 對馬刺搶七 | 出手方向、擦板區域與出手時機共同判定 |
| harbor-05 | The Last Shot 最後一投 | Jordan 1998 總決賽 | 倒數、移動創造進攻空間與關鍵跳投 |
| park-01 | Mamba Farewell 曼巴告別戰 | Kobe 2016 告別戰 60 分 | 運球突破後出手得分，不只比繞樁時間 |
| park-02 | Jokić Vision 傳球大師 | 金塊 2023 首冠 | 辨識空檔與傳球，呈現隊友／防守路線 |
| park-03 | The Big Ticket 狼王禁區 | Garnett 2004 季後賽 | 卡位、移動到反彈落點並搶籃板 |
| park-04 | Bad Boys Defense 鐵血防守 | 活塞 1989、1990 二連霸 | 輪流進攻／防守選招、收齊後揭曉，電腦對手清楚標示 |
| park-05 | Stockton & Malone 擋拆傳奇 | 爵士 1997、1998 總決賽 | 記憶並重現擋拆跑位／傳球順序 |
| roof-01 | Showtime Connection 紫金連線 | Kobe／Shaq 2000 空中接力 | 快攻、選空檔傳球與接力出手的連續步驟 |
| roof-02 | Dame Time 利拉德時刻 | Lillard 2019 季後賽絕殺 | 節奏交替運球後超遠三分，含出手判定 |
| roof-03 | The Block 世紀追帽 | LeBron 2016 總決賽 | 對手快攻上籃、追趕與真出手封阻反應 |
| roof-04 | Dream Shake 大夢腳步 | Olajuwon 1994、1995 二連霸 | 禁區腳步、轉身及假動作後出手，不能以一般跑酷代替 |
| roof-05 | Championship Journey 冠軍全能挑戰 | Giannis 2021 奪冠 | 串接投籃、傳球、防守；分項成績與總場勝分 |

每場有專屬非像素背景、隊色、歷史記分板、技術、目標、操作及結算。進場先提供簡短情境卡：事件、年份、球隊、球員、真實結果與遊戲目標；玩家按開始才正式計時，不強制等待動畫。明確區分歷史記分板與今日模擬賽況。

同一球場提供延伸情境，不增加場地：Mamba 81 可延伸 Wilt 100 分；最後一投延伸 Dirk 單腳後仰；三分之王延伸 Ray Allen 2013 底角三分。各情境分開保存最佳成績與次數，共用原球場路網與邀請入口。

歷史事件以 relatedCourtIds 連接球場。公牛最後一投 → harbor-05；騎士 2016 → roof-03；勇士三分紀錄 → harbor-02；湖人 81 分／60 分 → harbor-01／park-01。多入口仍共用同一事件 ID。閱讀後可查看規則、定位、沿路前往並開啟重現，結束回到先前位置。

保存狀態分開為：已閱讀、已參與、最佳成績、挑戰次數及遊戲完成。保留舊記憶簿閱讀紀錄、原遊戲成績與邀請 ID，遷移不可覆蓋使用者資料。紀念事件不得掛接競賽或獎勵。

全部十五款均須採共用 InputManager、時間差／固定步進、同一世界座標及跨裝置公平規則；逐一完成六尺寸共九十組驗收。詳見跨裝置規格及報告。這項驗收不是將桌面畫面縮小即可通過。

所有遊戲須包含：

- 歷史背景介紹。
- 操作說明。
- 練習模式。
- 正式挑戰。
- 成績結算。
- 重新挑戰。
- 返回原本地圖位置。
- 電腦及手機操作支援。

所有關卡必須清楚標示為遊戲化歷史情境重現，不可讓玩家誤以為能改變真實歷史。

Kobe 60分退休戰是 park-01 的主要情境，可共用投籃元件但必須具備運球突破與60分目標。事故紀念區不設遊戲或分數。

## 七、NBA歷史圖鑑

擴充原有球迷記憶簿，建立 NBA History Collection。

不得刪除原有閱讀紀錄或重複建立已存在的歷史事件。

### 圖鑑分類

1. 冠軍榮耀。
2. 王朝時代。
3. 經典比賽。
4. 傳奇球員。
5. 歷史紀念。
6. 球隊發展。
7. 城市文化。

### 圖鑑操作

- 顯示30支球隊的歷史探索進度。
- 顯示42組主要歷史主題的閱讀狀態。
- 支援依球隊、年份、分區及事件類型篩選。
- 支援關鍵字搜尋。
- 顯示已探索及未探索事件。
- 可重新閱讀歷史資料。
- 可直接定位到對應島嶼及紀念場景。
- 分開顯示史料閱讀紀錄與遊戲挑戰成績。
- 既有LocalStorage資料必須能正常讀取。

歷史紀念類事件不得使用獎盃、島幣、排行榜或競爭式完成度作為紀念誘因。

## 八、歷史資料結構

建立集中管理的歷史事件資料庫，避免將42組事件全部寫死在 HTML 中。

建議新增：

- `assets/history/history-events.json`
- `assets/history/history-core.js`
- `assets/history/history-ui.js`
- `assets/history/history-scene.js`
- `assets/history/history.css`
- `assets/history/models/`
- `assets/history/textures/`
- `docs/NBA_HISTORY_SOURCES.md`

每則歷史資料至少包含：

```json
{
  "id": "history-warriors-2022-championship",
  "title": "勇士2022年總冠軍",
  "titleEn": "Golden State Warriors 2022 Championship",
  "teamIds": ["warriors"],
  "year": 2022,
  "date": null,
  "category": "championship",
  "players": [],
  "location": "",
  "opponent": "",
  "result": "",
  "summary": "",
  "historicalSignificance": "",
  "sceneId": "",
  "modelIds": [],
  "sourceUrls": [],
  "interactionType": "exhibition",
  "gameId": null,
  "rewardEnabled": false
}
```

上述為資料格式示意，實際ID須與原有專案一致。

若有多座球隊島共用同一歷史事件，應使用相同事件ID及多個入口，而不是重複建立相同歷史資料。

將既有球迷記憶簿已存在的歷史事件合併或建立相容ID，保留舊版收藏狀態。

## 九、完整歷史來源及查核

優先使用 NBA 官方及各球隊官方史料。

歷年球隊總冠軍：
https://api-hub.nba.com/news/history-nba-champions

歷年賽季回顧：
https://www.nba.com/news/history-season-recaps-index

NBA歷史總覽：
https://www.nba.com/history

NBA總決賽經典時刻：
https://www.nba.com/news/history-finals-moments-index

Kobe Bryant 官方紀念：
https://www.nba.com/kobe-bryant-tribute

Kobe 球衣退休及生涯數據：
https://pr.nba.com/kobe-bryant-jersey-retirement-numbers/

Kobe 逝世官方公告：
https://pr.nba.com/nba-commissioner-adam-silver-statement-regarding-the-passing-of-kobe-bryant/

Kobe 全明星MVP獎項：
https://www.nba.com/news/kia-all-star-mvp-award-kobe-bryant

Jordan 最後一投：
https://www.nba.com/news/history-finals-moments-michael-jordan-last-shot-1998

Ray Allen 關鍵三分球：
https://www.nba.com/news/history-top-moments-ray-allen-3-pointer-2013-finals

勇士73勝：
https://www.nba.com/news/history-top-moments-warriors-win-record-73-games

Curry 三分球紀錄：
https://www.nba.com/warriors/news/curry-nba-3point-leader-20211214

Wilt Chamberlain 100分：
https://www.nba.com/news/history-top-moments-wilt-chamberlain-scores-100

經典搶七比賽：
https://cms.nba.com/pr/wp-content/uploads/sites/46/2021/06/NBA-Game-7-Information-Guide.pdf

Bill Russell 6號球衣退休：
https://api-hub.nba.com/news/bill-russells-no-6-jersey-to-be-retired-throughout-nba

正式加入每個事件前，必須：

- 查核日期。
- 查核球員姓名。
- 查核球隊名稱與當時所屬城市。
- 查核比賽結果。
- 查核冠軍年份。
- 查核歷史紀錄的正確定義。
- 記錄可供使用者閱讀的原始來源。

不得捏造比賽、歷史事件或來源連結。

不得擅自複製完整官方文章、轉播影片及受保護圖片。

## 十、3D歷史場景與素材

全站採用 Stylized 3D 非像素風美術。

優先製作及取得以下共用模型：

- 冠軍獎盃。
- 東區及西區冠軍獎盃。
- 冠軍旗幟。
- 球衣展示架。
- 玻璃展示櫃。
- 傳奇紀念雕像。
- 電子記分板。
- 大型歷史紀念牆。
- 紀念花卉。
- 3D籃球。
- 立體籃框。
- 觀眾席。
- 博物館建築。
- 冠軍遊行入口。
- 資訊展示互動點。

優先從 Poly Pizza、Kenney、Quaternius、Vinish 等授權明確的素材庫取得適合模型。

無法取得的模型可使用 Three.js 程序建模或自行建立原創 GLB 模型。

不要擅自下載來源不明的 NBA 2K 模型、球員掃描模型或其他遊戲素材。

球員肖像、官方標誌、球衣及紀念雕像須注意相應授權，不得宣稱為 NBA 官方授權作品。

不得使用像素角色、Voxel 人物、像素化獎盃或低解析度像素背景。

更新 `ASSET_LICENSES.md`，記錄所有外部素材的作者、來源及授權。

## 十一、歷史場景與球隊島整合

沿用先前美國地理群島設計：

- 美國本土輪廓。
- 30支球隊的相對地理位置。
- 加拿大多倫多暴龍島。
- 跨島橋梁及道路。
- 各城市特色地標。
- 3D跑車及城市交通。

每座島至少區分：

1. 主場球館。
2. 歷史紀念或博物館區。
3. 城市探索區。
4. 道路及玩家行走區。
5. 具備適用功能的球場、商店或觀景區。

歷史場景需具備明確入口及道路，避免所有紀念館、球館及裝飾物互相重疊。

玩家必須能步行抵達歷史場景。

如果場景位於其他島嶼，應支援：

- 地圖定位。
- 跨島尋路。
- 跟隨攝影機。
- 地圖返回及位置保留。

## 十二、歷史時間軸

新增 NBA Timeline。

將42組主要歷史事件按照時間排列，並可延伸展示已查核的球隊冠軍資料。

至少提供以下年代篩選：

- 1940–1950年代。
- 1960年代。
- 1970年代。
- 1980年代。
- 1990年代。
- 2000年代。
- 2010年代。
- 2020年代。

玩家點選時間軸事件後，可以查看史料或直接定位至對應球隊島。

歷史展覽內容與當前模擬 NBA 賽況必須分離，避免誤以為歷史比分是今日即時比分。

## 十三、歷史事件呈現規範

依不同事件使用不同呈現方式：

冠軍事件：

- 冠軍獎盃。
- 冠軍旗幟。
- 球隊歷史展示。
- 適度的慶祝動畫。

經典比賽：

- 歷史記分板。
- 比賽情境重現。
- 可選擇的互動挑戰。

傳奇球員：

- 生涯時間軸。
- 球衣。
- 代表性紀錄。
- 紀念區。

悲劇及紀念事件：

- 恆定柔和燈光。
- 靜態紀念物。
- 莊重的文字與背景音樂。
- 自主閱讀及致意。
- 不設競爭、排名或遊戲獎勵。

## 十四、效能最佳化

不得因為新增42組歷史事件而一次載入42座高精度場景。

必須使用：

- GLTFLoader。
- InstancedMesh。
- LOD。
- 模型快取。
- 材質共用。
- 延遲載入。
- 視野裁切。
- 距離分級載入。
- 場景離開後資源清理。
- 手機省電模式。

同類獎盃、展示櫃、紀念館及路燈應共用模型。

遠距離總覽時僅保留簡化建築。

接近歷史場景時才載入高細節模型、資料及動畫。

## 十五、保留既有功能

本次為擴充，不是重新開發整個網站。

不得刪除：

- 原有30支NBA球隊。
- 原有15座公共球場。
- 原有15款小遊戲。
- 勇士售票政策挑戰。
- 球星偶遇。
- 球星合影。
- 球迷客製化。
- 球迷記憶簿既有資料。
- 商店及購物車。
- 島幣與購物紀錄。
- 模擬賽事及球館發光。
- 好友PK。
- 日夜切換。
- 3D跑車與城市交通。
- 原有使用者LocalStorage資料。

正式版使用Three.js地圖及統一的既有功能控制器。

不要長期透過載入完整舊版首頁的iframe方式維持遊戲功能。

## 十六、實作階段

本次採分階段實作，但最終交付必須涵蓋全部內容，不可停在15項示範。

第一階段：

- 查核42組歷史事件資料。
- 建立歷史資料庫。
- 整合原有球迷記憶簿。

第二階段：

- 建立冠軍獎盃及歷史展示的共用3D模型。
- 完成30座球隊島的歷史入口及展區。

第三階段：

- 完成Kobe專屬紀念公園。
- 完成其餘經典事件場景。
- 建立跨島共用歷史入口。

第四階段：

- 完成十五座原球場的歷史情境玩法重構及同場延伸模式。
- 完成共用 InputManager、觸控、旋轉與公平計時，逐場執行六尺寸驗收。
- 建立成績及歷史資料的獨立儲存。

第五階段：

- 完成NBA歷史圖鑑。
- 完成歷史時間軸。
- 完美整合3D地圖定位、道路及玩家移動。

第六階段：

- 全部42組主題功能驗收。
- 全部30隊歷史場景目視檢查。
- 完成十五款 × 六尺寸的九十組瀏覽器驗收，並另測真實手機、平板、macOS、觸控筆電；不能以模擬器代替真實裝置。
- 記錄多點觸控、旋轉、pointercancel、重複輸入、背景恢復、離場清理與跨裝置 PK，未測明列待驗。
- 測試首次載入速度及場景切換效能。
- 測試舊版資料相容性。
- 完成GitHub Pages部署前驗收。

## 十七、最終交付

必須提供：

1. 42組主要歷史主題的完成清單。
2. 30支球隊歷史場景對照表。
3. 15款整合式歷史挑戰及90組跨裝置測試紀錄，分開標示模擬器／瀏覽器／真實裝置。
4. Kobe專屬紀念公園畫面。
5. NBA歷史圖鑑畫面。
6. NBA歷史時間軸畫面。
7. 歷史史料及引用來源清單。
8. 3D素材授權清單。
9. 無法自動下載的素材清單。
10. 更新前後畫面比較。
11. 實際瀏覽器功能測試與效能報告。
12. 完整程式碼及版本編號。
13. Git Commit及更新紀錄。
14. 納入新版歷史系統的UML設計圖更新。

不得以只有文字、尚未完成的入口、空白模型、外部連結或未實測的畫面宣稱歷史場景已完成。

請先盤點現有專案狀態，建立整合分支，依照上述階段持續完成全部需求。若遇到素材下載限制，先完成其他可實作功能，並記錄確實需要我手動處理的項目。

完成測試與驗收後，再依既有部署授權流程更新正式網站。
