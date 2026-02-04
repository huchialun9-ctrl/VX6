# 🚀 SentinelTicket 部署指南

## 📋 已配置信息

### Discord 應用程序配置
- **Client ID**: `1468065912451239978`
- **Client Secret**: `-onGiopSftaiIA88Jm1_p-h8UHT2gRAQQ`
- **Bot Token**: `MTQ2ODA2NTkxMjQ1MTIzOTk3OA.GTND8T.vHYQHxV6T5J3E50DDN0euQeciLpMpRhJMRO_Uk`
- **重定向 URL**: `https://vx6-production.up.railway.app/callback`

### Railway 部署配置
- **部署 URL**: `https://vx6-production.up.railway.app`
- **環境**: Production
- **資料庫**: SQLite (自動創建)

## 🔧 部署步驟

### 1. Railway 部署 (已配置)
系統已配置為在 Railway 上運行：

```bash
# 環境變數已設置：
DISCORD_BOT_TOKEN=MTQ2ODA2NTkxMjQ1MTIzOTk3OA.GTND8T.vHYQHxV6T5J3E50DDN0euQeciLpMpRhJMRO_Uk
DISCORD_CLIENT_ID=1468065912451239978
DISCORD_CLIENT_SECRET=-onGiopSftaiIA88Jm1_p-h8UHT2gRAQQ
DISCORD_REDIRECT_URI=https://vx6-production.up.railway.app/callback
NODE_ENV=production
```

### 2. Discord Developer Portal 設置

#### OAuth2 設置
1. 前往 [Discord Developer Portal](https://discord.com/developers/applications/1468065912451239978)
2. 在 "OAuth2" > "General" 中確認重定向 URI：
   ```
   https://vx6-production.up.railway.app/callback
   ```

#### Bot 權限設置
確保 Bot 有以下權限：
- ✅ `Manage Channels` (管理頻道)
- ✅ `Manage Roles` (管理身份組)  
- ✅ `View Channels` (查看頻道)
- ✅ `Send Messages` (發送訊息)
- ✅ `Manage Messages` (管理訊息)
- ✅ `Embed Links` (嵌入連結)
- ✅ `Read Message History` (讀取訊息歷史)
- ✅ `Use Slash Commands` (使用斜線指令)

#### 邀請 Bot 到伺服器
使用此鏈接邀請 Bot：
```
https://discord.com/api/oauth2/authorize?client_id=1468065912451239978&permissions=268446736&scope=bot%20applications.commands
```

### 3. 系統初始化

#### 在 Discord 中執行初始化
1. 邀請 Bot 到你的伺服器
2. 在伺服器中執行：
   ```
   /setup
   ```
3. 創建工單面板：
   ```
   /panel
   ```

#### Web 面板訪問
1. 訪問：`https://vx6-production.up.railway.app`
2. 點擊 "Discord 登入" 進行授權
3. 完成登入後即可使用管理面板

## 🎯 功能測試

### 測試 Discord OAuth2 登入
1. 訪問 Web 面板
2. 點擊 "Discord 登入"
3. 完成 Discord 授權
4. 確認用戶信息正確顯示

### 測試工單系統
1. 在 Discord 中使用 `/setup` 初始化
2. 使用 `/panel` 創建工單面板
3. 測試用戶創建工單流程
4. 測試管理員處理工單流程

### 測試 Web 面板功能
1. 儀表板數據顯示
2. 工單列表和管理
3. 統計數據更新
4. 文檔和指令說明頁面

## 🔍 故障排除

### Bot 無法連接
- 檢查 `DISCORD_BOT_TOKEN` 是否正確
- 確認 Bot 已邀請到伺服器
- 檢查 Bot 權限設置

### OAuth2 登入失敗
- 確認重定向 URI 設置正確
- 檢查 `DISCORD_CLIENT_SECRET` 是否正確
- 確保 HTTPS 連接正常

### 工單功能異常
- 確認 Bot 有 "Manage Channels" 權限
- 檢查 Bot 身份組位置是否正確
- 確認資料庫連接正常

### Web 面板問題
- 檢查環境變數設置
- 確認 Railway 部署狀態
- 查看應用程序日誌

## 📊 監控和維護

### 日誌查看
在 Railway Dashboard 中查看應用程序日誌：
1. 前往 Railway 專案頁面
2. 點擊 "Deployments"
3. 查看最新部署的日誌

### 資料庫管理
SQLite 資料庫會自動創建和管理：
- 工單數據自動保存
- 用戶信息自動同步
- 統計數據實時更新

### 效能監控
- 監控記憶體使用量
- 檢查回應時間
- 追蹤工單處理效率

## 🎉 部署完成

系統現在已完全配置並可以使用：

### 🌐 Web 面板
- **URL**: https://vx6-production.up.railway.app
- **功能**: 完整的工單管理儀表板

### 🤖 Discord Bot
- **狀態**: 已連接並運行
- **指令**: 完整的斜線指令系統

### 📊 功能特色
- Discord OAuth2 登入
- 即時工單管理
- 統計數據追蹤
- 完整的文檔系統

---

**SentinelTicket** 現在已準備好為你的 Discord 社群提供專業的工單支援服務！