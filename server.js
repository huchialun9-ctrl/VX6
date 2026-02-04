const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// 1. 確保對齊 public 資料夾
app.use(express.static(path.join(__dirname, 'public')));

// 2. 根目錄路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 3. 關鍵：健康檢查路由（解決 Healthcheck failed）
app.get('/health', (req, res) => res.status(200).send('OK'));

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent 
    ]
});

client.on('ready', () => {
    console.log(`✅ 機器人上線：${client.user.tag}`);
});

// 4. 啟動監聽 (必須監聽 0.0.0.0)
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 伺服器運行於埠號 ${PORT}`);
});

// 5. 登入邏輯（只使用變數，絕不寫死 Token）
const TOKEN = process.env.DISCORD_BOT_TOKEN;
if (TOKEN) {
    client.login(TOKEN).catch(err => {
        console.error("❌ 登入失敗：", err.message);
    });
} else {
    console.error("❌ 找不到變數 DISCORD_BOT_TOKEN");
}    console.log(`🚀 專業控制台運行於 http://0.0.0.0:${PORT}`);
});

// 安全登入：從 Railway 的 Variables 讀取
client.login(process.env.DISCORD_BOT_TOKEN).catch(err => {
    console.error("❌ 登入失敗：", err.message);
});// --- 啟動伺服器 ---
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 專業控制台運行於 http://0.0.0.0:${PORT}`);
});

// --- 安全登入：從環境變數讀取 ---
// 請在 Railway 的 Variables 頁面設定 DISCORD_BOT_TOKEN
const TOKEN = process.env.DISCORD_BOT_TOKEN;

if (TOKEN) {
    client.login(TOKEN).catch(err => {
        console.error("❌ 登入失敗：", err.message);
    });
} else {
    console.error("❌ 尚未在 Railway 設定 DISCORD_BOT_TOKEN 環境變數");
}
