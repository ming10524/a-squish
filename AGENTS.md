# A SQUISH — 開發交接（2026-11-24）

## 專案定位
DARK ZOO 暗黑動物區旗下的網頁紓壓遊戲「A SQUISH：今天捏誰？」；與 Unreal 遊戲 A HEROS 共用角色，但為獨立專案。無分數、無時間限制，手機優先，繁體中文（台灣）。
部署：https://ming10524.github.io/a-squish/ （GitHub Pages，main 根目錄）。

## 接手須知
- 先閱讀 index.html、duck3d.js、README.md，檢查 git status，不覆蓋使用者本機修改。
- V0.1：SVG 8 角色、6 操作、彈性動畫、雙指縮放、合成音效及開關。
- V0.2：commit 56cf684f913426ea5df41125ff5e36d7133081e6；Three.js 0.170.0 CDN，程式生成鴨董、旋轉、整體縮放回彈、呼吸、簡單接觸反應；其餘角色仍是 SVG。程式已提交，但尚未完成瀏覽器驗證。不要將原型稱為真正局部軟體物理。
- 目前遠端沒有正式角色 GLB。使用者表示 8 個 GLB 都在本機；請先詢問或確認本機素材位置，不假設檔案已存在。不要自行下載私人工作區或公開 A HERO 私有專案。
- A SQUISH 是公開 repo，正式素材上傳前確認使用者同意公開；優先使用網頁最佳化副本，保留原始素材，不提交憑證。

## V0.3 待辦（依序執行）
- [ ] P0：本機啟動 HTTP server（例如 python -m http.server 8000），驗證 V0.2 桌面及手機操作、控制台錯誤、CDN 載入、角色切換及 SVG fallback。修正旋轉模式與舊 SVG pointer handlers 互相干擾、重複反應及 pointer capture 問題。
- [ ] P0：盤點本機 GLB，記錄大小、三角面數、貼圖、骨架、動畫、Morph Targets、模型朝向及授權。必要時使用 Blender/glTF 工具最佳化副本；目標每角色約 5 MB 以下（非硬性規格），不得無故降低品質。
- [ ] P1：以 GLTFLoader 導入鴨董正式模型，使用與 Three.js 相同版本及正確 import map；自動置中、落地、相機取景、材質及光照，保留 2D fallback、載入進度與錯誤提示。
- [ ] P1：建立共用角色設定及按需載入機制，處理快速切換競態、快取與 GPU 資源釋放；完成八角色。
- [ ] P1：建立統一 pointer/touch 互動控制器，raycast 命中模型表面，支援旋轉、雙指、取消事件、放手回彈；不應點空白也觸發角色。
- [ ] P2：先驗證鴨董局部變形，再擴展其餘角色。依模型結構選擇 Morph Targets、骨架或局部頂點變形；保留原始頂點，平滑距離衰減與阻尼回復，避免破面、貼圖接縫及骨架衝突。低效能裝置可退回整體縮放。
- [ ] P2：捏捏＝局部收縮；擠壓＝壓扁與側向膨脹；撫摸＝輕晃；拉扯＝局部跟隨；搔癢＝抖動；戳戳＝接觸凹陷。表情與聲音依可用素材實作，不宣稱已有配音。
- [ ] P3：驗證桌面 Chrome/Edge、手機觸控及 GitHub Pages 相對路徑；記錄測試結果、已知問題及效能；更新 README 和版本號。

## 素材命名（建議，非現有檔案）
assets/models/duck.glb — 鴨董
assets/models/turtle.glb — 海龜
assets/models/octopus.glb — 章魚
assets/models/sheep.glb — 綿羊
assets/models/rabbit.glb — 兔子
assets/models/cat.glb — 粉紅貓
assets/models/goldfish.glb — 金魚
assets/models/vegetable.glb — 青菜人

## UI 約束
上方角色展示；下方六操作按鈕 3 欄 × 2 列；再下方八角色選擇 4 欄 × 2 列；最後音效開關。保留現有暖色療癒風格，旋轉為獨立操作，不改成計分遊戲。

## 驗收
八角色能正確顯示、切換及回退；六操作可用且放手復原；旋轉不誤觸變形；音效開關有效；手機無頁面拖曳衝突；載入失敗不白屏。正式局部變形需實測後才勾選完成。

## 後續方向（尚未實作）
V0.4 專屬表情、配音及 ASMR；V0.5 場景、光影及震動；V1.0 PWA。先完成 V0.3，不擴大範圍。
每次完成工作更新本文件的勾選狀態與測試紀錄，讓下一位開發者能接續。未測試事項明確標示；小步提交，避免破壞現有部署。

## V0.3 海龜試作交接（2026-11-24）

使用者已指定「先用海龜試做看看」，本輪優先完成單角色本機驗證；上方八角色整體待辦仍未完成，不勾選全部完成。

- [x] 本機海龜素材確認：`D:/a_hero/角色/海龜/base_basic_pbr.glb`，複製至 `assets/models/turtle.glb`，原檔未修改。
- [x] 海龜盤點：11,355,940 bytes（10.83 MiB）、100,000 三角面、單一 mesh；三張內嵌 2048×2048 PNG（diffuse / normal / metallic-roughness）；沒有骨架、動畫、Morph Targets 或壓縮擴充。Y 向上、正面朝 +Z，已由渲染截圖確認。
- [x] Three.js / GLTFLoader 統一 0.170.0 import map；按需載入海龜、快取單一模型、載入進度／錯誤提示、自動置中落地與窄螢幕取景。其他角色保留 SVG，鴨董保留程式生成的 3D 原型。
- [x] 海龜局部頂點變形試作：六種操作、平滑距離衰減、阻尼復原；raycast 命中後才擷取 pointer，3D 控制器以 capture 階段攔截舊 SVG handlers。支援旋轉、雙指整體縮放、取消／失焦復原，及手動關閉局部變形改用整體縮放。
- [x] CLI Playwright + 本機 Chrome headless 桌面／iPhone 13 尺寸觸控模擬：GLB 和貼圖載入、六操作事件、旋轉不改訊息、空白處不觸發、角色切換、音效開關、模型載入失敗與 CDN 失敗時 SVG fallback。正常載入無 pageerror。
- [x] 戳戳按住前後的 canvas 截圖不同，放手及雙指 touchCancel 後 canvas 與原始截圖逐位元一致；桌面與手機模擬皆通過。已檢視海龜正面與戳戳截圖，未見明顯破面。
- [ ] 真手機、Edge、GitHub Pages 實際部署與低階裝置效能尚未驗證；其他五種局部操作的手感仍需使用者試玩。尚未實作表情／配音、碰撞或真正軟體物理；變形沿用原始法線，大變形的光照準確性仍需改進。
- [ ] GLB 最佳化及公開素材授權未完成。此輪保留完整 PBR 品質；`.gitignore` 排除 `assets/models/*.glb`，不得強制加入或上傳。公開 repo 沒有海龜模型時會回退 SVG。

本機試玩：`node tools/serve.cjs` → `http://127.0.0.1:8001` → 選海龜。開發測試：`npm.cmd install` 後 `npm.cmd test`（使用已安裝的 Chrome，需要網路載入 Three.js CDN）；`node tools/inspect-glb.cjs assets/models/turtle.glb` 可重查素材。測試截圖存放於忽略的 `.local/`。

接續順序：先讓使用者試玩海龜並調整手感／效能，再處理最佳化及公開授權，最後擴展其餘七角色。鴨董、章魚、兔子已確認有 `D:/a_hero/a_hero/Art/<角色>/` 下的 FBX 與 .blend，尚未轉換。
