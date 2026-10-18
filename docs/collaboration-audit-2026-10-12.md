# Solo Voyager 共同編輯檢查與整合設計（2026-10-12）

本次不變更資料表、不執行資料遷移、不改 Sites 入口名單、不批次修改既有成員角色，也不在正式資料庫執行測試寫入。正式資料庫筆數及內容尚未透過管理介面核對；保留資料的依據是本次部署只有應用程式變更，沒有清空、轉換或自動修復程序。

## 原始實作與此次補強

| 項目 | 原始實作 | 此次補強／剩餘限制 |
| --- | --- | --- |
| 儲存 | Cloudflare D1 的 records 與 members；records.data 是 JSON 文字，version 是整數。R2 儲存附件。 | 沿用資料表與綁定。未建立正式資料庫完整備份。 |
| 同一旅程共享 | members.trip 對應 records.kind=trip；ChatGPT 身分透過 Sites 提供的受信任標頭取得。 | 確認 role 只能指向真正旅程。網站入口仍只開給擁有者，外部成員需另獲入口授權。 |
| 權限 | owner/editor/contributor/viewer；後端做成員、所有權及私人帳目判斷。 | 防重複有效邀請、接受邀請條件式寫入、成員狀態比較、一般儲存及刪除在寫入當下再次比對角色；撤權後禁止讀附件；禁止連結他人上傳的附件。 |
| 收藏匯入 | 同名／國家／城市／區域／地址正規化比對；跳過重複或只補空白；模糊多筆不合併。 | 伺服器限制請求大小、真實日期檢查、決定性匯入 ID 防同時重試重複新增；補空白時再檢查原始識別欄位，保留同時修改的非空白值。不能覆寫既有非空白欄位。 |
| 機酒匯入 | 前端逐筆儲存；同名同日比對；可能部分完成、同日航段誤判。 | 新增登入限定 importBookings 操作：先驗證全部，再以 D1 batch 交易新增；同日不同航班或時間分開記錄；自己的重複預訂跳過；不比對他人的私人訂位編號。 |
| 衝突 | 一般更新以 version 做 compare-and-swap，過期版本回 409。 | 刪除也檢查實際影響筆數；刪除後的舊 ID 不得當成新增；成員操作支援 expected 快照；前端每 15 秒及回到視窗時更新，保留編輯草稿。沒有 WebSocket 即時同步或自動欄位合併。 |
| 外部整合 | 有登入限定 /api/data；沒有 MCP 宣告或對外穩定工具契約。 | 本次提供下述設計，尚未啟用 MCP／產生 API 金鑰。 |

## 權限現況（保留原有角色）

- 擁有者：管理旅程與成員、共同候選地點／行程／待辦；私人收藏仍僅本人可存取。可管理非私人支出；不能任意修改別人的預訂或私人支出。
- 編輯者：修改旅程及共同候選地點／行程／待辦；建立自己的機酒預訂與帳目，不能管理成員。
- 協作者：提出及修改自己的候選地點、投票、支出、還款；可完成指派給自己的待辦；不能改旅程或每日行程，也不能匯入預訂。
- 檢視者：查看授權範圍內行程與候選地點；不得寫入，沒有共同帳本權限。未共享預訂的編號、票號及附件不提供給其他成員。
- Sites 入口授權與旅程成員授權是兩道檢查。單純收到旅程邀請不會取得網站入口權限；本次保持 owner-only 入口，不自行添加朋友。

## JSON 驗證与重複範圍

收藏：最多 200 筆、請求 2MiB；支援原有包裝及別名，HTTP/S 網址、欄位文字、照片定位 0～100、有效 checked 日期。機酒：最多 50 筆、請求 2MiB；航段當地日期時間與 IANA 時區、住宿入住退房日期；預訂編號／票號需字串、布林需 true/false、participants 須為授權成員 ID。附件與內部識別欄位不能由匯入檔案指定。

機票識別：type/name/depart/arrive/from/to/flight；住宿識別：type/name/date/endDate/address。全部使用 NFKC、前後空白與大小寫正規化；識別範圍限本帳號／本旅程。同一預訂若名稱或地址不同，仍可能新增；不靠預訂編號跨帳號合併，也不自動覆寫修訂內容。

同時提交相同匯入會使用 scope + 正規化識別的 SHA-256 決定性 ID 與 INSERT OR IGNORE。既有 ID 不重寫。一般手動新增仍允許名稱相同的資料，並無全資料庫自然鍵唯一限制。

## ChatGPT 直接新增或修改景點：下一階段契約

採 Sites 原生 MCP 與 OAuth，公開 `/mcp` 的 discover/list/call；由 Sites 驗證登入及入口權限，再沿用本網站的角色、所有權、版本與欄位驗證。不要使用共用永久 API 金鑰、URL token 或把身份交由模型自行填寫。此設計尚未部署 MCP。

建議工具：

| 工具 | 作用／限制 |
| --- | --- |
| list_trips | 僅列本人可看的旅行及有效角色，不返回私人預訂或帳目。 |
| search_places | 僅搜尋本人收藏，或明確指定的可見旅程候選地點。 |
| preview_place_changes | 最多 200 筆，明確 scope=library 或 trip；回傳新增、補空白、更新欄位、重複及衝突預覽，不寫入。 |
| apply_place_changes | 使用經確認的預覽 digest、requestId、每筆 expectedVersion；伺服器重驗身份／角色／內容，交易提交；過期版本或權限變動回衝突。不得改 owner/trip/role 或刪除。 |

新增傳入規範化地點欄位；修改採欄位 patch，未出現欄位保持原值；空字串清除欄位要在預覽中明示。回傳 id/version、各筆結果與衝突。寫入工具標記 readOnlyHint=false，要求具體變更確認；預览工具 readOnlyHint=true。預覽內容由伺服器重新算 digest 與成員範圍，不能信任客戶端宣称已確認。

requestId 的永久冪等性、不可變更的操作紀錄、預覽憑證有效期限需要持久紀錄，可能需要新增 integration_operations 表。實作前先依下述備份與遷移程序提出欄位／保留期限；此輪不增加資料表。不要假設原有 log 表已是完整不可竄改稽核紀錄。

## 未來資料庫備份與遷移方案（未執行）

1. 記錄正在使用的 source commit、Sites 版本與 D1/R2 綁定；暫停或鎖定寫入窗口，避免備份過程資料改變。
2. 由具權限的管理介面匯出 D1 完整 SQL（records/members 及結構，包含角色、版本、待接受邀請），並複製 R2 物件與 owner/trip/contentType metadata。既有網站匯出只含可見旅程資料，不是完整資料庫備份。
3. 備份加密存放、限制本人存取；邀請 token、訂位編號、私人帳目不可寫進公開 repo。記錄 SHA-256、表筆數、物件筆數、備份時間；在隔離資料庫與 bucket 實際還原並核對。
4. 提供逐步 migration SQL，只採 additive 變更；新表／欄位可空或有安全預設。先以還原副本驗證舊版／新版兼容及角色、版本、照片、附件引用保持不變。
5. 寫入暫停後套用遷移，比對筆數、外鍵邏輯與會員角色，部署新版本，驗證後恢復寫入。失敗先切回舊應用；如果是相容 additive migration，先保留新表避免損失新寫入資料。需要資料庫還原時再次停寫、保存失敗後新增資料，再從驗證過的備份回復。
6. 任何移除欄位、合併會員或改自然鍵唯一限制都要先列出既有衝突，不自動改權限或刪資料。

## 測試環境與限制

scripts/test-access.mjs 使用隔離記憶體 SQLite、模擬 Sites 登入身份及 R2；涵蓋真正 route handler 與 SQL。batch 模擬 BEGIN/COMMIT/ROLLBACK，包含插入／刪除／撤權競爭注入。不是正式 D1 網路併發壓力測試，也沒有使用真正多帳號登入正式站進行 UI 驗證。

scripts/test-import.mjs：包裝、別名、缺漏欄位、日期／時間、時區、型別、URL、敏感 metadata。
scripts/test-place-browser.mjs：分類／搜尋／封面／挑選器、跨篩選多選、已加入狀態及 SSR 標記。
TypeScript 檢查與正式 framework build 另行執行。

剩餘風險：網站入口尚未開放旅伴；15 秒同步有延遲；沒有完整不可變更操作稽核或自動備份；既有成員重複行／孤兒資料未自動清理；金融交易等跨資料列的累計檢查尚非完整序列化交易；大規模資料查詢未做索引與分頁優化。這些項目不在本輪偷偷遷移或改既有權限。

### 建議請求格式（設計稿，尚不可直接呼叫）

preview_place_changes：`{scope:"trip", tripId:"…", changes:[{op:"add", fields:{name:"…",type:"景點",country:"日本",city:"東京"}}, {op:"patch", id:"…",expectedVersion:3,fields:{hours:"10:00–18:00"}}]}`。library scope 不接受 tripId；trip scope 只能處理 candidate。所有欄位沿用 placeFields 白名單，metadata 不能由 fields 改寫。

apply_place_changes：`{requestId:"UUID", previewToken:"伺服器簽署且有期限的憑證"}`。憑證綁定登入者、scope、完整變更 digest 與 expectedVersion；重複 requestId 只能回傳同一結果，不得套用不同內容。預覽時與套用時都重新驗證權限；寫入結果回 `{added,updated,skipped,records:[{id,version}],conflicts:[]}`。採整批全成功／全失敗，衝突不強制覆寫。簽署金鑰只放伺服器 runtime secrets，不能放前端、JSON 匯出或 repo。

### 本輪已執行結果

- `node scripts/test-access.mjs`：通過，包含原有記帳／連動／權限回歸，以及批次匯入 rollback、競爭提交、刪除競爭、撤權期間儲存、撤權後附件。
- `node scripts/test-import.mjs`：通過，包含型別、真實日期、當地時間、時區、metadata、URL 與前導零。
- `node scripts/test-place-browser.mjs`：通過，包含原有分類頁與收藏選擇器的 SSR／純邏輯測試。
- `npx tsc --noEmit --incremental false` 與 `git diff --check`：通過。
- 正式 build 與部署結果由 Sites 發布流程確認；沒有手機或多帳號正式站實機驗證。
