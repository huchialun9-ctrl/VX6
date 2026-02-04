const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// --- 關鍵：讓伺服器知道 HTML 在 public 資料夾裡 ---
// 這行讓瀏覽器能抓到 public/script.js 和 public/styles.css
app.use(express.static(path.join(__dirname, 'public')));

// 根目錄路由：直接送出 index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 健康檢查路由 (給 Railway 偵測用)
app.get('/health', (req, res) => res.status(200).send('OK'));

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent 
    ]
});

client.on('ready', () => {
    console.log(`✅ 機器人已上線：${client.user.tag}`);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 專業控制台運行於 http://0.0.0.0:${PORT}`);
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
