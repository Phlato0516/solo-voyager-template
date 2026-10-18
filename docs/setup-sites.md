# 建立獨立 Sites 網站

限具備 Sites 工具的 ChatGPT 工作環境；一般 GitHub 帳號或一般 ChatGPT 對話不保證具備這些工具。原站登入無法移植到任意主機。

## 給架設者

1. 取得乾淨分享版原始碼（不含 Git 歷史），閱讀 README 與授權。
2. 在可使用 Sites 的工作環境交付原始碼，要求以「保留範本建立全新私人網站」處理。不得使用原站 ID、儲存空間或憑證。
3. 新站部署後以自己的 ChatGPT 帳號登入，確認收藏、旅程及附件為空，再建立自己的資料。
4. 邀請他人之前，同時設定新網站入口允許名單與旅程成員角色。範本不會自行開放公開存取。

可交付的指示：

> 使用這份 Solo Voyager Sites 分享版建立全新的私人 Sites 網站。保留 Sites 登入及伺服器端權限驗證，建立獨立 D1 和 R2；不得連接任何現有正式網站或資料庫。先檢查乾淨範本，保留第三方授權，依 Sites skill 完成註冊、建置、發布與新站驗收；回報實際完成項目及限制。

## 給執行 Sites 工具的開發者

先讀取當前 Sites skill，使用其當前安裝位置的 helper，不要把作者機器路徑寫死在指令中。

1. 範本根目錄執行 `npm run test:template`；註冊之前 `.openai/hosting.json` 應只有 `d1: "DB"` 與 `r2: "BUCKET"`。
2. 建立新的空白工作目錄，使用 Sites 的 `project-setup.mjs --template-source <乾淨範本絕對路徑>`。排除 Git、node_modules、dist、.wrangler、.sites-runtime、備份及環境檔。
3. 呼叫 `create_site` 一次，立即用 `set-project-id.mjs --project-id <回傳的原樣ID>` 持久化。結果不明時先查核，不要重複建立。新站保持私人。
4. 保留 DB／BUCKET 邏輯綁定；由 Sites 為新站配置資源，不要指定原站 database_id 或 bucket。
5. 依鎖定檔安裝，執行既有測試與 TypeScript 檢查。透過 Sites source helper 建置、同步並打包同一個 commit，再存版及私人發布。
6. 保留 `drizzle/0000_sleepy_gideon.sql` 與 metadata；Sites 發布流程套用遷移。不要在 request handler 建表，也不要自動 seed。
7. 確認部署終態成功，再測試真實登入、空白狀態、建立／修改、照片上傳與讀取、重登入持久化、不同帳號權限及版本衝突。

## 本機與安全界線

`npm run dev` 的本機 mock 身分只用於開發，不能作為正式驗證。正式環境必須維持 Sites 受信任登入入口；不要直接暴露會接受客戶端偽造 `oai-authenticated-user-*` 標頭的 Worker。

不需要將 OAuth token 或管理員 API Key 貼入範本。新站 ID 不是密鑰，但每個新站都必須由平台回傳自己的 ID；不同 Site 的使用者 ID 不可直接複製。

範本不是完整備份或還原工具。另行備份新站 D1、R2 物件與 metadata，實際隔離還原通過後才能宣稱具有復原能力。
