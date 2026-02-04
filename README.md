# 🛡️ SentinelTicket - 專業化社群工單支援系統

一個功能完整的 Discord 工單管理系統，提供專業的客服支援解決方案。

## ✨ 核心功能

### 🎫 智慧工單管理
- **一鍵開票**：按鈕式工單創建，支援分類選擇
- **自動權限**：自動建立專屬頻道並設置權限
- **工單限制**：防止濫用，每用戶最多3個同時工單
- **智慧分配**：根據分類自動分配給對應管理組

### 👥 管理員工具
- **工單領取**：管理員可領取並處理工單
- **快速結案**：自動生成對話記錄並存檔
- **黑名單系統**：封鎖濫用用戶的開票權限
- **自動超時**：24小時無回覆自動關閉

### 📊 數據面板
- **即時統計**：工單數量、狀態分布、處理時間
- **活動記錄**：系統操作日誌和最近活動
- **管理界面**：Web 儀表板管理所有工單
- **數據分析**：客服效率和滿意度統計

## 🚀 快速開始

### 1. 環境準備
```bash
# 克隆專案
git clone <repository-url>
cd sentinel-ticket

# 安裝依賴
npm install
```

### 2. 環境設定
```bash
# 複製環境變數範例
cp .env.example .env

# 編輯 .env 文件，填入以下資訊：
DISCORD_BOT_TOKEN=你的_bot_token
DISCORD_CLIENT_ID=你的_client_id
DISCORD_CLIENT_SECRET=你的_client_secret
STAFF_ROLE_ID=管理員_角色_id
TICKET_CATEGORY_ID=工單_分類_id
```

### 3. Discord Bot 設定

#### 創建 Discord 應用程序
1. 前往 [Discord Developer Portal](https://discord.com/developers/applications)
2. 點擊 "New Application" 創建新應用程序
3. 在 "Bot" 頁面創建 Bot 並獲取 Token

#### 設定 Bot 權限
Bot 需要以下權限：
- ✅ `Manage Channels` (管理頻道)
- ✅ `Manage Roles` (管理身份組)
- ✅ `View Channels` (查看頻道)
- ✅ `Send Messages` (發送訊息)
- ✅ `Manage Messages` (管理訊息)
- ✅ `Embed Links` (嵌入連結)
- ✅ `Read Message History` (讀取訊息歷史)
- ✅ `Use Slash Commands` (使用斜線指令)

#### 邀請 Bot 到伺服器
```
https://discord.com/api/oauth2/authorize?client_id=你的_CLIENT_ID&permissions=268446736&scope=bot%20applications.commands
```

### 4. 啟動系統
```bash
# 開發模式
npm run dev

# 生產模式
npm start
```

### 5. 初始化設定
在 Discord 伺服器中使用以下指令：

```
/setup
```

這將創建必要的分類和設定基本配置。

## 🎛️ 使用指南

### 管理員指令

#### `/panel` - 創建工單面板
在指定頻道創建工單按鈕，用戶點擊即可開票。

#### `/setup` - 系統初始化
設定工單分類、管理員角色等基本配置。

#### `/close` - 關閉工單
在工單頻道中使用，關閉當前工單並生成記錄。

#### `/add <用戶>` - 添加管理員
將用戶添加到管理員列表。

#### `/remove <用戶>` - 移除管理員
從管理員列表中移除用戶。

### 用戶操作

#### 創建工單
1. 點擊工單面板的 "建立工單" 按鈕
2. 選擇工單分類
3. 系統自動創建專屬頻道
4. 在頻道中描述問題

#### 關閉工單
- 點擊工單頻道中的 "關閉工單" 按鈕
- 或使用 `/close` 指令

## 🌐 Web 儀表板

訪問 `http://localhost:3000` 使用 Web 管理界面：

### 功能特色
- **即時儀表板**：統計數據和系統狀態
- **工單管理**：查看、編輯、關閉工單
- **分類設定**：管理工單分類和權限
- **管理員管理**：添加/移除管理員
- **數據分析**：詳細的統計報告
- **系統設定**：配置系統參數

### 頁面導覽
- 📊 **儀表板**：系統概覽和快速操作
- 🎫 **工單管理**：所有工單的詳細列表
- 🏷️ **分類設定**：工單分類配置
- 👥 **管理員**：管理員權限設定
- 📈 **數據分析**：統計圖表和報告
- ⚙️ **系統設定**：全域配置選項

## 🗄️ 資料庫結構

系統使用 SQLite 資料庫，包含以下表格：

### tickets (工單表)
- `id`: 工單 ID
- `guild_id`: 伺服器 ID
- `channel_id`: 頻道 ID
- `user_id`: 用戶 ID
- `category`: 分類
- `title`: 標題
- `status`: 狀態 (open/pending/closed)
- `assignee_id`: 負責人 ID
- `created_at`: 建立時間
- `closed_at`: 關閉時間
- `transcript`: 對話記錄

### categories (分類表)
- `id`: 分類 ID
- `guild_id`: 伺服器 ID
- `name`: 分類名稱
- `emoji`: 表情符號
- `color`: 顏色
- `role_id`: 對應角色 ID

### staff (管理員表)
- `user_id`: 用戶 ID
- `guild_id`: 伺服器 ID
- `role`: 角色 (admin/moderator)
- `permissions`: 權限設定

### blacklist (黑名單表)
- `user_id`: 用戶 ID
- `guild_id`: 伺服器 ID
- `reason`: 封鎖原因
- `expires_at`: 到期時間

## 🔧 API 端點

### GET `/api/tickets`
獲取工單列表
```javascript
// 參數
?guild_id=伺服器ID

// 回應
{
  "tickets": [
    {
      "id": 1,
      "title": "技術支援",
      "status": "open",
      "user_id": "123456789",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### GET `/api/stats`
獲取統計數據
```javascript
// 回應
{
  "open": 5,
  "pending": 2,
  "closed": 15,
  "total": 22
}
```

## 🎨 自定義配置

### 工單分類設定
```javascript
// 在資料庫中添加分類
{
  "id": "support",
  "name": "技術支援",
  "emoji": "🔧",
  "color": "#3b82f6",
  "role_id": "管理員角色ID"
}
```

### 權限配置
```javascript
// 管理員權限等級
{
  "admin": ["manage_tickets", "manage_staff", "manage_settings"],
  "moderator": ["manage_tickets", "view_stats"],
  "support": ["view_tickets", "respond_tickets"]
}
```

## 🚨 故障排除

### 常見問題

#### Bot 無法創建頻道
- 檢查 Bot 是否有 "Manage Channels" 權限
- 確認 Bot 角色位置高於 @everyone

#### 工單按鈕無反應
- 檢查 Bot 是否在線
- 確認 Bot 有 "Use Slash Commands" 權限

#### 資料庫錯誤
- 檢查 `tickets.db` 文件權限
- 確認磁盤空間充足

### 日誌查看
```bash
# 查看系統日誌
tail -f logs/system.log

# 查看錯誤日誌
tail -f logs/error.log
```

## 📈 效能優化

### 建議配置
- **記憶體**：最少 512MB RAM
- **儲存空間**：最少 1GB 可用空間
- **網路**：穩定的網路連接

### 效能監控
- 使用 `pm2` 進行程序管理
- 設定日誌輪轉避免磁盤滿載
- 定期備份資料庫

## 🤝 貢獻指南

歡迎提交 Issue 和 Pull Request！

### 開發環境設定
```bash
# 安裝開發依賴
npm install --dev

# 執行測試
npm test

# 程式碼格式化
npm run format
```

## 📄 授權條款

MIT License - 詳見 [LICENSE](LICENSE) 文件

## 🆘 技術支援

- 📧 Email: support@sentinelticket.com
- 💬 Discord: [支援伺服器](https://discord.gg/support)
- 📖 文檔: [完整文檔](https://docs.sentinelticket.com)

---

**SentinelTicket** - 讓您的 Discord 社群客服更專業、更高效！