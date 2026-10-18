# Solo Voyager｜Sites 分享版（實驗版）

建立自己的旅行手帳：收藏地點、國家／城市分類、每日行程、機票住宿、旅費及多人共編。每位架設者建立獨立的 Sites 網站、D1 資料庫與 R2 儲存空間。

本版保留既有應用程式功能，未附帶原站身分、旅程、成員、照片附件或登入憑證。範例均為虛構，不會自動寫入資料庫。

**實驗版：已完成獨立私人驗收站部署，並由擁有者實測旅程建立、照片上傳、收藏 JSON 匯出再匯入、機酒連動、每日行程拖曳儲存及重新登入後的資料保存。多人權限尚未完成跨帳號實測，朋友帳號獨立架站亦未驗證。** 支援目標為 Sites；不是 GitHub Pages 靜態網站，也未提供任意 Cloudflare 帳號的一鍵部署。Sites 使用資格、工具及費用由平台決定。

## 開始使用

1. 閱讀 [Sites 架設指南](docs/setup-sites.md)，在可使用 Sites 的 ChatGPT 工作環境建立新網站。
2. 使用全新的 Site ID；`.openai/hosting.json` 刻意沒有 `project_id`。
3. 發布時由 Sites 建立新 D1／R2，套用既有 `drizzle/` 結構遷移，保留 Sites 登入及伺服器端旅程權限驗證。
4. 登入後建立第一趟旅程，再選擇是否匯入 [範例收藏](examples/places.json) 與 [範例機酒](examples/bookings.json)。

本儲存庫使用獨立 Git 歷史，沒有匯入原站維護歷史。分享範圍為程式、文件與虛構範例；不包含原站旅行資料或網站存取權。實驗版仍有未完成的驗證，詳見 [分享與限制](docs/sharing.md)。

## 安裝與檢查

Node.js 建議 24，套件管理版本依 `package.json`，依鎖定檔安裝：

```bash
corepack pnpm install --frozen-lockfile
npm run test:template
npm test
npx tsc --noEmit --incremental false
npm run build
```

`test:template` 檢查分享檔案不含 Site ID 或正式網址、範例可被實際解析器接受，並在記憶體 SQLite 套用初始 SQL 後驗證空白資料表。新站註冊後含自己的 ID，不應再把該站工作目錄作為乾淨範本發布。

既有測試使用記憶體資料庫、R2 替身與部分 hook／DOM 替身，不會接觸正式資料，也不等於雲端登入或真實瀏覽器驗收。

## 功能與限制

- 旅程封面圖片、收藏分類、JSON 批次匯入匯出與補齊空白欄位。
- 每日行程牌卡、時間軸、經典清單；時間調整預覽、確認、復原與版本衝突保護。
- 航班及住宿行程連動、成員角色、待辦與旅費。
- 沒有已啟用的 ChatGPT MCP App，也沒有新增外部寫入 API。
- 新站不繼承原站帳號 ID、成員權限或資料。網站入口政策與旅程成員權限是兩層設定，均需檢查。
- JSON 匯出不是完整 D1／R2 備份；目前未提供完整資料庫一鍵遷移。

## 文件及授權

- [驗收結果與限制](docs/template-validation.md)
- [JSON 欄位規格](docs/json-import.md)
- [版面回退](docs/planner-rollback.md)
- [原始 starter 說明](docs/sites-starter.md)

原創與新增部分採 [MIT License](LICENSE)，第三方程式仍依各自授權。見 [第三方聲明](THIRD_PARTY_NOTICES.md)。不要將正式備份、個人照片或他人的旅遊資料放入公開儲存庫。
