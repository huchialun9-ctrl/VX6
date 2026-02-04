const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
const path = require('path');
const cors = require('cors');

const app = express();
// 自動讀取 Railway Variables 裡的 PORT，若沒設定則預設 8000
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// 確保指向 public 資料夾，讓網頁能顯示
app.use(express.static(path.join(__dirname, 'public')));

// 根目錄路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 健康檢查路由：讓 Railway 知道程式還活著 (解決 Healthcheck failed)
app.get('/health', (req, res) => res.status(200).send('OK'));

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent // 你已經開好的權限
    ]
});

client.on('ready', () => {
    console.log(`✅ 機器人已成功上線：${client.user.tag}`);
});

// 啟動伺服器：必須監聽 0.0.0.0
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 伺服器運行於埠號 ${PORT}`);
});

// 安全登入：從 Railway Variables 讀取，不要寫死 Token 字串
const TOKEN = process.env.DISCORD_BOT_TOKEN;

if (TOKEN) {
    client.login(TOKEN).catch(err => {
        console.error("❌ 登入失敗：", err.message);
    });
} else {
    console.error("❌ 尚未在 Railway 設定 DISCORD_BOT_TOKEN 環境變數");
}
