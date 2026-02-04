const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
const path = require('path');
const cors = require('cors');
const axios = require('axios'); // 記得確認 package.json 有 axios

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Discord OAuth2 設定 (從 Railway Variables 讀取) ---
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;

// 1. 處理登入請求：跳轉到 Discord 授權頁面
app.get('/auth/discord', (req, res) => {
    const url = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify%20guilds`;
    res.redirect(url);
});

// 2. 處理回傳 (Callback)：Discord 授權完後會回到這裡
app.get('/auth/discord/callback', async (req, res) => {
    const { code } = req.query;
    if (code) {
        try {
            // 拿 Code 換 Access Token (這部分通常在 script.js 處理，或者這裡處理後給前端)
            res.send("授權成功！請回到控制台。");
        } catch (err) {
            res.status(500).send("授權失敗");
        }
    }
});

// 健康檢查與路由
app.get('/health', (req, res) => res.status(200).send('OK'));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 控制台運行於埠號 ${PORT}`);
});

client.login(process.env.DISCORD_BOT_TOKEN);app.listen(PORT, '0.0.0.0', () => {
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
