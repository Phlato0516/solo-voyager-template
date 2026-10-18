# JSON 匯入規格

以最外層 JSON 陣列作為跨網站交換的標準格式。現有解析器也容許部分包裝／別名，但輸出端建議固定使用以下欄位。

## 收藏地點

一批最多 200 筆。`name` 必填；`type` 建議使用景點、餐廳、購物、活動、咖啡廳。省略 type 時預設景點。所有列出的欄位均使用文字，包含圖片位置數值。

```json
[
  {
    "name": "範例景點",
    "localName": "Sample place",
    "country": "日本",
    "city": "大阪",
    "district": "中央區",
    "type": "景點",
    "address": "",
    "map": "",
    "naver": "",
    "otherMap": "",
    "photo": "https://example.com/cover.jpg",
    "photoFit": "cover",
    "photoX": "50",
    "photoY": "50",
    "hours": "",
    "source": "",
    "checked": "2026-10-18",
    "note": ""
  }
]
```

網址欄位有值時須使用 HTTP/S。photoFit 可填 cover 或 contain；photoX／photoY 為 0–100 的文字。checked 有值時須為真實 YYYY-MM-DD 日期。重複比對依名稱、國家、城市、區域、地址正規化；補齊模式只填既有空白欄位，不覆蓋非空白內容。

實作：`app/place-import.ts`、`app/api/data/route.ts`。

## 機票住宿

一批最多 50 筆，每個航段或住宿各一筆。name 與 type 必填；標準 type 為機票或住宿。

```json
[
  {
    "name": "範例航段",
    "type": "機票",
    "flight": "XX123",
    "from": "TPE",
    "to": "KIX",
    "depart": "2026-11-04T09:00",
    "arrive": "2026-11-04T12:30",
    "timezoneFrom": "Asia/Taipei",
    "timezoneTo": "Asia/Tokyo",
    "bookingNumber": "",
    "ticketNumber": "",
    "syncItinerary": true,
    "shared": false
  },
  {
    "name": "範例飯店",
    "type": "住宿",
    "date": "2026-11-04",
    "endDate": "2026-11-08",
    "address": "",
    "map": "",
    "checkInTime": "15:00",
    "checkOutTime": "11:00",
    "bookingNumber": "",
    "note": ""
  }
]
```

日期時間使用當地時間 YYYY-MM-DDTHH:mm，不加 Z 或 UTC 位移。日本時區使用 Asia/Tokyo。預訂編號、電子票號需為文字，以保留前導零；布林欄位使用真正的 true／false。participants 若提供，必須為該旅程的成員 ID。不要在交換檔案指定內部 ID、owner、version、附件 ID 或預訂連動欄位。

伺服器先整批驗證再新增；重複預訂跳過，不覆寫既有預訂。實作：`app/import-bookings.ts`、`app/data-validation.ts`、`app/api/data/route.ts`。

以上僅為測試範例，不是真實預訂。這兩種匯入格式不等於完整資料庫備份；旅程匯出的完整紀錄目前也不代表可一鍵還原所有資料。
