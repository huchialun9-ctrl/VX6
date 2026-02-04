const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
const path = require('path');
const cors = require('cors');

const app = express();
// Railway 會自動注入 PORT 變數，若無則預設使用 8000
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// --- 靜態檔案路徑：指向你的 public 資料夾 ---
app.use(express.static(path.join(__dirname, 'public')));

// 根目錄路由：直接送出 public 裡的 index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 健康檢查路由：確保 Railway 部署綠燈
app.get('/health', (req, res) => res.status(200).send('OK'));

// --- Discord 機器人部分 ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent // 確保你已在後台開啟此開關
    ]
});

client.on('ready', () => {
    console.log(`✅ 機器人已成功上線：${client.user.tag}`);
});

// --- 啟動伺服器 ---
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
