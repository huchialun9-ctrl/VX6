# 🚀 快速部署指南

## ✅ 你的配置信息

已配置的信息：
- **Discord Client ID**: `1468065912451239978` ✓
- **Discord Client Secret**: `MJqI9aHD5Bbt_x9S_yjInGQQ33hirOow` ✓
- **Discord Guild ID**: `1467745594041831540` ✓
- **Owner User ID**: `1467744784578777119` ✓

## 🔑 還需要的信息

**只需要獲取 Discord Bot Token：**
1. 前往 [Discord Developer Portal](https://discord.com/developers/applications/1468065912451239978)
2. 點擊左側 "Bot"
3. 如果沒有 Bot，點擊 "Add Bot"
4. 複製 "Token"
5. 更新 `.env` 文件中的 `DISCORD_BOT_TOKEN`

## 🤖 Bot 權限設置

確保你的 Bot 有以下權限：
- ✅ `Manage Roles` (管理身份組)
- ✅ `View Channels` (查看頻道)
- ✅ `Send Messages` (發送消息)
- ✅ `Read Message History` (讀取消息歷史)

## 🔗 邀請 Bot 到伺服器

使用這個鏈接邀請 Bot：
```
https://discord.com/api/oauth2/authorize?client_id=1468065912451239978&permissions=268435456&scope=bot
```

## 🌐 部署選項

### 選項 1: Vercel (推薦)
```bash
# 安裝 Vercel CLI
npm install -g vercel

# 登入
vercel login

# 部署
vercel --prod
```

**在 Vercel Dashboard 設置環境變數：**
- `DISCORD_BOT_TOKEN`: [你的 Bot Token]
- `DISCORD_CLIENT_ID`: `1468065912451239978`
- `DISCORD_CLIENT_SECRET`: `MJqI9aHD5Bbt_x9S_yjInGQQ33hirOow`
- `DISCORD_GUILD_ID`: `1467745594041831540`
- `OWNER_USER_ID`: `1467744784578777119`
- `SESSION_SECRET`: `discord-boost-benefits-super-secret-key-2024`
- `DISCORD_REDIRECT_URI`: `https://你的域名.vercel.app/auth/discord/callback`

### 選項 2: Railway
1. 前往 [Railway.app](https://railway.app)
2. 點擊 "Deploy from GitHub repo"
3. 連接你的倉庫
4. 設置相同的環境變數
5. 部署

### 選項 3: 本地測試
```bash
# 安裝依賴
npm install

# 啟動開發服務器
npm run dev
```

## 📋 部署後設置

### 1. 更新 Discord OAuth2 重定向 URI
前往 [Discord Developer Portal](https://discord.com/developers/applications/1468065912451239978/oauth2/general)
添加重定向 URI：
- 開發環境: `http://localhost:3000/auth/discord/callback`
- 生產環境: `https://你的域名/auth/discord/callback`

### 2. 測試功能
- [ ] 訪問網站
- [ ] Discord OAuth2 登入
- [ ] 檢查加成成員狀態
- [ ] 測試身份組創建 (如果是加成成員)
- [ ] 測試藝術牆上傳 (站主功能)

## 🎯 一鍵部署腳本

```bash
# 使用部署腳本
./deploy.sh
```

## 🚨 常見問題

### Bot 無法連接
- 確認 `DISCORD_BOT_TOKEN` 已正確設置
- 檢查 Bot 是否已邀請到伺服器

### OAuth2 失敗
- 確認重定向 URI 在 Discord Developer Portal 中已設置
- 檢查域名是否匹配

### 權限錯誤
- 確認 Bot 有 "Manage Roles" 權限
- 檢查 Bot 的身份組位置是否高於要管理的身份組

## 🎉 部署完成！

部署成功後，你的 Discord 加成成員福利中心就可以使用了！

**功能包括：**
- 🎨 現代化黑色主題界面
- 🔐 Discord OAuth2 登入
- 🎭 自定義身份組創建和顏色修改
- 🖼️ 藝術牆展示和管理
- 📱 完全響應式設計

需要幫助？檢查 `DEPLOYMENT.md` 獲取詳細說明！