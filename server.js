const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// --- 靜態檔案路徑：精確指向你的 public 資料夾 ---
app.use(express.static(path.join(__dirname, 'public')));

// 根目錄路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 健康檢查路徑 (Railway 專用)
app.get('/health', (req, res) => res.status(200).send('OK'));

// --- Discord 機器人：已啟用 MessageContent 意圖 ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent 
    ]
});

client.on('ready', () => {
    console.log(`✅ 機器人已成功上線：${client.user.tag}`);
});

// --- 啟動 Web 伺服器 ---
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 專業控制台運行於 http://0.0.0.0:${PORT}`);
});

// --- 安全登入：使用環境變數 ---
const TOKEN = process.env.DISCORD_BOT_TOKEN;
if (TOKEN) {
    client.login(TOKEN).catch(err => {
        console.error("❌ 登入失敗：", err.message);
    });
} else {
    console.error("❌ 尚未在 Railway 設定 DISCORD_BOT_TOKEN 變數");
}
