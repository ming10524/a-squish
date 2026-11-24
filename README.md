# A SQUISH

DARK ZOO 暗黑動物區 — 今天捏誰？

V0.3 海龜本機試作：正式 GLB、六種局部變形、拖曳旋轉、雙指縮放與放手復原；鴨董仍為 3D 程式原型，其餘角色保留 SVG。

使用 Node.js 啟動：

```sh
node tools/serve.cjs
```

開啟 http://127.0.0.1:8001 並選擇海龜。3D 模組從 CDN 載入，需要網路，請透過 HTTP 開啟。

海龜模型是本機素材，尚未取得公開提交授權，已排除於 Git。此電腦使用 `D:/a_hero/角色/海龜/base_basic_pbr.glb` 的副本 `assets/models/turtle.glb`；其他電腦缺少模型時會顯示提示並回退 2D。

六操作作用於接觸附近；「旋轉角色」切換為拖曳旋轉，兩指可整體縮放。「局部變形：關」可改用整體縮放以減少運算。這是頂點變形試作，沒有實體軟體物理或正式配音。

開發驗證：`npm.cmd install` 後執行 `npm.cmd test`（Playwright，使用已安裝的 Chrome）；素材盤點執行 `node tools/inspect-glb.cjs assets/models/turtle.glb`。已通過桌面及手機尺寸／觸控模擬，真手機和低階裝置仍待實測。詳細進度見 AGENTS.md。
