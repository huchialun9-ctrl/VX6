const express = require('express');
const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Discord Bot 設定
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// 中間件設定
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://vx6-production.up.railway.app', 'https://discord.com']
        : ['http://localhost:3000', 'https://discord.com'],
    credentials: true
}));
app.use(bodyParser.json());
app.use(express.static('public'));

// Session 設定
app.use(session({
    secret: process.env.SESSION_SECRET || 'sentinel-ticket-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    }
}));

// 資料庫初始化
const dbPath = path.join(__dirname, 'tickets.db');
const db = new sqlite3.Database(dbPath);

// 創建資料表
db.serialize(() => {
    // 用戶表
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        discriminator TEXT,
        avatar TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // 工單表
    db.run(`CREATE TABLE IF NOT EXISTS tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        channel_id TEXT UNIQUE,
        user_id TEXT NOT NULL,
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        status TEXT DEFAULT 'open',
        assignee_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        closed_at DATETIME,
        transcript TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`);
    
    // 分類表
    db.run(`CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        name TEXT NOT NULL,
        emoji TEXT,
        color TEXT,
        role_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // 管理員表
    db.run(`CREATE TABLE IF NOT EXISTS staff (
        user_id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        role TEXT DEFAULT 'moderator',
        permissions TEXT,
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`);
    
    // 黑名單表
    db.run(`CREATE TABLE IF NOT EXISTS blacklist (
        user_id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        reason TEXT,
        added_by TEXT,
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`);
    
    console.log('✅ 資料庫初始化完成');
});

// Discord OAuth2 設定
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || 'http://localhost:3000/callback';

// OAuth2 相關路由
app.get('/auth/discord', (req, res) => {
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&response_type=code&scope=identify%20guilds`;
    res.redirect(discordAuthUrl);
});

app.get('/callback', async (req, res) => {
    const { code } = req.query;
    
    if (!code) {
        return res.redirect('/?error=no_code');
    }
    
    try {
        // 交換 access token
        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: DISCORD_CLIENT_ID,
            client_secret: DISCORD_CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: DISCORD_REDIRECT_URI
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        
        const { access_token } = tokenResponse.data;
        
        // 獲取用戶信息
        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        });
        
        // 獲取用戶的伺服器列表
        const guildsResponse = await axios.get('https://discord.com/api/users/@me/guilds', {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        });
        
        // 存儲用戶信息到 session
        req.session.user = {
            id: userResponse.data.id,
            username: userResponse.data.username,
            discriminator: userResponse.data.discriminator,
            avatar: userResponse.data.avatar,
            guilds: guildsResponse.data,
            access_token: access_token
        };
        
        res.redirect('/?login=success');
        
    } catch (error) {
        console.error('Discord OAuth2 錯誤:', error.response?.data || error.message);
        res.redirect('/?error=oauth_failed');
    }
});

// 登出路由
app.get('/auth/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// 獲取當前用戶信息
app.get('/api/user', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: '未登入' });
    }
    
    res.json(req.session.user);
});

// Discord Bot 事件處理
client.once('ready', async () => {
    console.log(`🛡️ SentinelTicket Bot 已登入: ${client.user.tag}`);
    
    // 設置 Bot 狀態
    client.user.setActivity('工單系統 | /help', { type: 'WATCHING' });
    
    // 註冊斜線指令
    await registerSlashCommands();
});

// 註冊斜線指令
async function registerSlashCommands() {
    const commands = [
        {
            name: 'setup',
            description: '初始化工單系統',
            defaultMemberPermissions: '0x0000000000000008' // ADMINISTRATOR
        },
        {
            name: 'panel',
            description: '創建工單面板',
            defaultMemberPermissions: '0x0000000000000008', // ADMINISTRATOR
            options: [
                {
                    name: '標題',
                    description: '面板標題',
                    type: 3, // STRING
                    required: false
                },
                {
                    name: '描述',
                    description: '面板描述',
                    type: 3, // STRING
                    required: false
                }
            ]
        },
        {
            name: 'add',
            description: '添加管理員',
            defaultMemberPermissions: '0x0000000000000008', // ADMINISTRATOR
            options: [
                {
                    name: '用戶',
                    description: '要添加的用戶',
                    type: 6, // USER
                    required: true
                },
                {
                    name: '角色',
                    description: '管理員角色',
                    type: 3, // STRING
                    required: false,
                    choices: [
                        { name: '系統管理員', value: 'admin' },
                        { name: '一般管理員', value: 'moderator' },
                        { name: '客服人員', value: 'support' }
                    ]
                }
            ]
        },
        {
            name: 'remove',
            description: '移除管理員',
            defaultMemberPermissions: '0x0000000000000008', // ADMINISTRATOR
            options: [
                {
                    name: '用戶',
                    description: '要移除的用戶',
                    type: 6, // USER
                    required: true
                }
            ]
        },
        {
            name: 'blacklist',
            description: '將用戶加入黑名單',
            defaultMemberPermissions: '0x0000000000000008', // ADMINISTRATOR
            options: [
                {
                    name: '用戶',
                    description: '要封鎖的用戶',
                    type: 6, // USER
                    required: true
                },
                {
                    name: '原因',
                    description: '封鎖原因',
                    type: 3, // STRING
                    required: false
                },
                {
                    name: '時間',
                    description: '封鎖時長 (例: 1d, 1w, 1m)',
                    type: 3, // STRING
                    required: false
                }
            ]
        },
        {
            name: 'unblacklist',
            description: '將用戶從黑名單移除',
            defaultMemberPermissions: '0x0000000000000008', // ADMINISTRATOR
            options: [
                {
                    name: '用戶',
                    description: '要解除封鎖的用戶',
                    type: 6, // USER
                    required: true
                }
            ]
        },
        {
            name: 'close',
            description: '關閉工單',
            options: [
                {
                    name: '原因',
                    description: '關閉原因',
                    type: 3, // STRING
                    required: false
                }
            ]
        },
        {
            name: 'claim',
            description: '領取工單'
        },
        {
            name: 'unclaim',
            description: '取消領取工單'
        },
        {
            name: 'rename',
            description: '重新命名工單頻道',
            options: [
                {
                    name: '新名稱',
                    description: '新的頻道名稱',
                    type: 3, // STRING
                    required: true
                }
            ]
        },
        {
            name: 'help',
            description: '顯示幫助信息',
            options: [
                {
                    name: '指令名稱',
                    description: '特定指令的幫助',
                    type: 3, // STRING
                    required: false
                }
            ]
        },
        {
            name: 'stats',
            description: '顯示統計信息',
            options: [
                {
                    name: '時間範圍',
                    description: '統計時間範圍',
                    type: 3, // STRING
                    required: false,
                    choices: [
                        { name: '今天', value: 'today' },
                        { name: '本週', value: 'week' },
                        { name: '本月', value: 'month' },
                        { name: '全部', value: 'all' }
                    ]
                }
            ]
        },
        {
            name: 'info',
            description: '顯示系統信息'
        }
    ];

    try {
        console.log('🔄 開始註冊斜線指令...');
        
        // 註冊全域指令
        await client.application.commands.set(commands);
        
        console.log('✅ 斜線指令註冊完成');
    } catch (error) {
        console.error('❌ 註冊斜線指令失敗:', error);
    }
}

// 按鈕互動處理
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;
    
    try {
        if (interaction.customId === 'create_ticket') {
            await handleCreateTicket(interaction);
        } else if (interaction.customId === 'close_ticket') {
            await handleCloseTicket(interaction);
        } else if (interaction.customId === 'claim_ticket') {
            await handleClaimTicket(interaction);
        } else if (interaction.customId.startsWith('category_')) {
            await handleCategorySelection(interaction);
        }
    } catch (error) {
        console.error('互動處理錯誤:', error);
        if (!interaction.replied) {
            await interaction.reply({ content: '處理請求時發生錯誤', ephemeral: true });
        }
    }
});

// 斜線指令處理
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    
    const { commandName } = interaction;
    
    try {
        switch (commandName) {
            case 'setup':
                await handleSetupCommand(interaction);
                break;
            case 'panel':
                await handlePanelCommand(interaction);
                break;
            case 'close':
                await handleCloseCommand(interaction);
                break;
            case 'add':
                await handleAddCommand(interaction);
                break;
            case 'remove':
                await handleRemoveCommand(interaction);
                break;
            case 'blacklist':
                await handleBlacklistCommand(interaction);
                break;
            case 'unblacklist':
                await handleUnblacklistCommand(interaction);
                break;
            case 'claim':
                await handleClaimCommand(interaction);
                break;
            case 'unclaim':
                await handleUnclaimCommand(interaction);
                break;
            case 'rename':
                await handleRenameCommand(interaction);
                break;
            case 'help':
                await handleHelpCommand(interaction);
                break;
            case 'stats':
                await handleStatsCommand(interaction);
                break;
            case 'info':
                await handleInfoCommand(interaction);
                break;
            default:
                await interaction.reply({ content: '未知指令', ephemeral: true });
        }
    } catch (error) {
        console.error('指令處理錯誤:', error);
        if (!interaction.replied) {
            await interaction.reply({ content: '執行指令時發生錯誤', ephemeral: true });
        }
    }
});

// 工單創建處理
async function handleCreateTicket(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;
    
    // 檢查黑名單
    const isBlacklisted = await checkBlacklist(userId, guildId);
    if (isBlacklisted) {
        return await interaction.reply({
            content: '❌ 您已被限制使用工單系統',
            ephemeral: true
        });
    }
    
    // 檢查現有工單數量
    const existingTickets = await getActiveTickets(userId, guildId);
    if (existingTickets.length >= 3) {
        return await interaction.reply({
            content: '❌ 您已達到同時開啟工單的上限 (3個)',
            ephemeral: true
        });
    }
    
    // 顯示分類選擇選單
    const categories = await getCategories(guildId);
    if (categories.length === 0) {
        return await interaction.reply({
            content: '❌ 尚未設置工單分類，請聯繫管理員',
            ephemeral: true
        });
    }
    
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('category_select')
        .setPlaceholder('請選擇工單類型')
        .addOptions(
            categories.map(cat => ({
                label: cat.name,
                value: cat.id,
                emoji: cat.emoji || '📋',
                description: `選擇 ${cat.name} 類型的工單`
            }))
        );
    
    const row = new ActionRowBuilder().addComponents(selectMenu);
    
    await interaction.reply({
        content: '請選擇您的工單類型：',
        components: [row],
        ephemeral: true
    });
}

// 分類選擇處理
async function handleCategorySelection(interaction) {
    const categoryId = interaction.values[0];
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;
    const guild = interaction.guild;
    
    try {
        // 獲取分類信息
        const category = await getCategory(categoryId, guildId);
        if (!category) {
            return await interaction.reply({
                content: '❌ 找不到該分類',
                ephemeral: true
            });
        }
        
        // 創建工單頻道
        const ticketNumber = await getNextTicketNumber(guildId);
        const channelName = `ticket-${ticketNumber.toString().padStart(4, '0')}`;
        
        const ticketChannel = await guild.channels.create({
            name: channelName,
            type: 0, // GUILD_TEXT
            parent: process.env.TICKET_CATEGORY_ID || null,
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: [PermissionsBitField.Flags.ViewChannel]
                },
                {
                    id: userId,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.ReadMessageHistory
                    ]
                }
            ]
        });
        
        // 添加管理員權限
        const staffRole = category.role_id || process.env.STAFF_ROLE_ID;
        if (staffRole) {
            await ticketChannel.permissionOverwrites.create(staffRole, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true,
                ManageMessages: true
            });
        }
        
        // 創建工單嵌入訊息
        const ticketEmbed = new EmbedBuilder()
            .setTitle(`🎫 工單 #${ticketNumber}`)
            .setDescription(`**分類：** ${category.name}\n**建立者：** <@${userId}>\n**狀態：** 🟢 進行中`)
            .setColor(category.color || '#3b82f6')
            .setTimestamp()
            .setFooter({ text: 'SentinelTicket 工單系統' });
        
        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('claim_ticket')
                    .setLabel('領取工單')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('👋'),
                new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('關閉工單')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🔒')
            );
        
        await ticketChannel.send({
            content: `<@${userId}> 歡迎使用工單系統！\n管理員將盡快為您處理。`,
            embeds: [ticketEmbed],
            components: [actionRow]
        });
        
        // 保存工單到資料庫
        await saveTicket({
            guild_id: guildId,
            channel_id: ticketChannel.id,
            user_id: userId,
            category: categoryId,
            title: `${category.name} - ${interaction.user.username}`,
            status: 'open'
        });
        
        await interaction.update({
            content: `✅ 工單已建立！請前往 <#${ticketChannel.id}>`,
            components: []
        });
        
    } catch (error) {
        console.error('創建工單錯誤:', error);
        await interaction.reply({
            content: '❌ 創建工單時發生錯誤',
            ephemeral: true
        });
    }
}

// 工單關閉處理
async function handleCloseTicket(interaction) {
    const channelId = interaction.channel.id;
    const userId = interaction.user.id;
    
    try {
        const ticket = await getTicketByChannel(channelId);
        if (!ticket) {
            return await interaction.reply({
                content: '❌ 這不是一個工單頻道',
                ephemeral: true
            });
        }
        
        // 檢查權限
        const isOwner = ticket.user_id === userId;
        const isStaff = await checkStaffPermission(userId, interaction.guild.id);
        
        if (!isOwner && !isStaff) {
            return await interaction.reply({
                content: '❌ 您沒有權限關閉此工單',
                ephemeral: true
            });
        }
        
        // 生成對話記錄
        const transcript = await generateTranscript(interaction.channel);
        
        // 更新資料庫
        await closeTicket(ticket.id, userId, transcript);
        
        // 發送關閉確認
        const closeEmbed = new EmbedBuilder()
            .setTitle('🔒 工單已關閉')
            .setDescription(`工單已由 <@${userId}> 關閉`)
            .setColor('#ef4444')
            .setTimestamp();
        
        await interaction.reply({
            embeds: [closeEmbed]
        });
        
        // 5秒後刪除頻道
        setTimeout(async () => {
            try {
                await interaction.channel.delete();
            } catch (error) {
                console.error('刪除頻道錯誤:', error);
            }
        }, 5000);
        
    } catch (error) {
        console.error('關閉工單錯誤:', error);
        await interaction.reply({
            content: '❌ 關閉工單時發生錯誤',
            ephemeral: true
        });
    }
}

// 工單領取處理
async function handleClaimTicket(interaction) {
    const channelId = interaction.channel.id;
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;
    
    try {
        // 檢查管理員權限
        const isStaff = await checkStaffPermission(userId, guildId);
        if (!isStaff) {
            return await interaction.reply({
                content: '❌ 只有管理員可以領取工單',
                ephemeral: true
            });
        }
        
        const ticket = await getTicketByChannel(channelId);
        if (!ticket) {
            return await interaction.reply({
                content: '❌ 這不是一個工單頻道',
                ephemeral: true
            });
        }
        
        // 更新工單負責人
        await claimTicket(ticket.id, userId);
        
        const claimEmbed = new EmbedBuilder()
            .setTitle('👋 工單已被領取')
            .setDescription(`此工單現在由 <@${userId}> 負責處理`)
            .setColor('#10b981')
            .setTimestamp();
        
        await interaction.reply({
            embeds: [claimEmbed]
        });
        
    } catch (error) {
        console.error('領取工單錯誤:', error);
        await interaction.reply({
            content: '❌ 領取工單時發生錯誤',
            ephemeral: true
        });
    }
}

// 資料庫操作函數
function saveTicket(ticketData) {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare(`
            INSERT INTO tickets (guild_id, channel_id, user_id, category, title, status)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run([
            ticketData.guild_id,
            ticketData.channel_id,
            ticketData.user_id,
            ticketData.category,
            ticketData.title,
            ticketData.status
        ], function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
        });
        
        stmt.finalize();
    });
}

function getActiveTickets(userId, guildId) {
    return new Promise((resolve, reject) => {
        db.all(
            'SELECT * FROM tickets WHERE user_id = ? AND guild_id = ? AND status != "closed"',
            [userId, guildId],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            }
        );
    });
}

function getTicketByChannel(channelId) {
    return new Promise((resolve, reject) => {
        db.get(
            'SELECT * FROM tickets WHERE channel_id = ?',
            [channelId],
            (err, row) => {
                if (err) reject(err);
                else resolve(row);
            }
        );
    });
}

function closeTicket(ticketId, closedBy, transcript) {
    return new Promise((resolve, reject) => {
        db.run(
            'UPDATE tickets SET status = "closed", closed_at = CURRENT_TIMESTAMP, transcript = ? WHERE id = ?',
            [transcript, ticketId],
            (err) => {
                if (err) reject(err);
                else resolve();
            }
        );
    });
}

function claimTicket(ticketId, assigneeId) {
    return new Promise((resolve, reject) => {
        db.run(
            'UPDATE tickets SET assignee_id = ? WHERE id = ?',
            [assigneeId, ticketId],
            (err) => {
                if (err) reject(err);
                else resolve();
            }
        );
    });
}

// 輔助函數
async function checkBlacklist(userId, guildId) {
    return new Promise((resolve, reject) => {
        db.get(
            'SELECT * FROM blacklist WHERE user_id = ? AND guild_id = ? AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)',
            [userId, guildId],
            (err, row) => {
                if (err) reject(err);
                else resolve(!!row);
            }
        );
    });
}

async function checkStaffPermission(userId, guildId) {
    return new Promise((resolve, reject) => {
        db.get(
            'SELECT * FROM staff WHERE user_id = ? AND guild_id = ?',
            [userId, guildId],
            (err, row) => {
                if (err) reject(err);
                else resolve(!!row);
            }
        );
    });
}

async function getCategories(guildId) {
    return new Promise((resolve, reject) => {
        db.all(
            'SELECT * FROM categories WHERE guild_id = ?',
            [guildId],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            }
        );
    });
}

async function getCategory(categoryId, guildId) {
    return new Promise((resolve, reject) => {
        db.get(
            'SELECT * FROM categories WHERE id = ? AND guild_id = ?',
            [categoryId, guildId],
            (err, row) => {
                if (err) reject(err);
                else resolve(row);
            }
        );
    });
}

async function getNextTicketNumber(guildId) {
    return new Promise((resolve, reject) => {
        db.get(
            'SELECT COUNT(*) as count FROM tickets WHERE guild_id = ?',
            [guildId],
            (err, row) => {
                if (err) reject(err);
                else resolve((row.count || 0) + 1);
            }
        );
    });
}

async function generateTranscript(channel) {
    try {
        const messages = await channel.messages.fetch({ limit: 100 });
        const transcript = messages.reverse().map(msg => {
            return `[${msg.createdAt.toISOString()}] ${msg.author.tag}: ${msg.content}`;
        }).join('\n');
        
        return transcript;
    } catch (error) {
        console.error('生成對話記錄錯誤:', error);
        return '無法生成對話記錄';
    }
}

// Web API 路由
app.get('/api/tickets', async (req, res) => {
    try {
        const guildId = req.query.guild_id;
        if (!guildId) {
            return res.status(400).json({ error: '缺少 guild_id 參數' });
        }
        
        db.all(
            `SELECT 
                t.*,
                u.username as user_name,
                u.avatar as user_avatar
            FROM tickets t
            LEFT JOIN users u ON t.user_id = u.id
            WHERE t.guild_id = ? 
            ORDER BY t.created_at DESC`,
            [guildId],
            (err, rows) => {
                if (err) {
                    console.error('獲取工單錯誤:', err);
                    res.status(500).json({ error: '獲取工單失敗' });
                } else {
                    // 格式化工單數據
                    const formattedTickets = rows.map(ticket => ({
                        id: ticket.id,
                        title: ticket.title,
                        user: {
                            id: ticket.user_id,
                            name: ticket.user_name || 'Unknown User',
                            avatar: ticket.user_avatar ? 
                                `https://cdn.discordapp.com/avatars/${ticket.user_id}/${ticket.user_avatar}.png` :
                                'https://cdn.discordapp.com/embed/avatars/0.png'
                        },
                        category: ticket.category,
                        status: ticket.status,
                        assignee: ticket.assignee_id,
                        createdAt: ticket.created_at,
                        closedAt: ticket.closed_at
                    }));
                    
                    res.json(formattedTickets);
                }
            }
        );
    } catch (error) {
        console.error('API 錯誤:', error);
        res.status(500).json({ error: '伺服器錯誤' });
    }
});

app.get('/api/stats', async (req, res) => {
    try {
        const guildId = req.query.guild_id;
        if (!guildId) {
            return res.status(400).json({ error: '缺少 guild_id 參數' });
        }
        
        // 獲取統計數據
        const stats = await new Promise((resolve, reject) => {
            db.all(`
                SELECT 
                    status,
                    COUNT(*) as count
                FROM tickets 
                WHERE guild_id = ? 
                GROUP BY status
            `, [guildId], (err, rows) => {
                if (err) reject(err);
                else {
                    const result = {
                        open: 0,
                        pending: 0,
                        closed: 0,
                        total: 0
                    };
                    
                    rows.forEach(row => {
                        result[row.status] = row.count;
                        result.total += row.count;
                    });
                    
                    resolve(result);
                }
            });
        });
        
        res.json(stats);
    } catch (error) {
        console.error('獲取統計錯誤:', error);
        res.status(500).json({ error: '獲取統計失敗' });
    }
});

// 獲取伺服器信息
app.get('/api/guild/:guildId', async (req, res) => {
    try {
        const { guildId } = req.params;
        
        if (!client.guilds.cache.has(guildId)) {
            return res.status(404).json({ error: '找不到伺服器或Bot不在該伺服器中' });
        }
        
        const guild = client.guilds.cache.get(guildId);
        
        res.json({
            id: guild.id,
            name: guild.name,
            icon: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : null,
            memberCount: guild.memberCount,
            online: guild.presences.cache.size
        });
        
    } catch (error) {
        console.error('獲取伺服器信息錯誤:', error);
        res.status(500).json({ error: '獲取伺服器信息失敗' });
    }
});

// 創建工單面板API
app.post('/api/panel', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: '未登入' });
        }
        
        const { guildId, channelId, title, description } = req.body;
        
        // 檢查用戶權限
        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            return res.status(404).json({ error: '找不到伺服器' });
        }
        
        const member = await guild.members.fetch(req.session.user.id);
        if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return res.status(403).json({ error: '需要管理員權限' });
        }
        
        // 這裡可以通過Discord API創建工單面板
        // 目前返回成功響應
        res.json({ 
            success: true, 
            message: '請使用Discord中的 /panel 指令創建工單面板' 
        });
        
    } catch (error) {
        console.error('創建面板API錯誤:', error);
        res.status(500).json({ error: '創建面板失敗' });
    }
});

// Discord Bot 登入
if (process.env.DISCORD_BOT_TOKEN) {
    client.login(process.env.DISCORD_BOT_TOKEN);
} else {
    console.warn('⚠️ 未設置 DISCORD_BOT_TOKEN，Bot 功能將無法使用');
}

// 啟動伺服器
app.listen(port, () => {
    console.log(`🚀 SentinelTicket 伺服器運行在 http://localhost:${port}`);
    console.log('🛡️ 專業化社群工單支援系統已啟動');
});// 指令處理函數


// 系統初始化指令
async function handleSetupCommand(interaction) {
    try {
        const guildId = interaction.guild.id;
        
        // 創建預設分類
        const defaultCategories = [
            { id: 'support', name: '技術支援', emoji: '🔧', color: '#3b82f6' },
            { id: 'report', name: '申訴檢舉', emoji: '⚠️', color: '#ef4444' },
            { id: 'business', name: '商業合作', emoji: '💼', color: '#10b981' }
        ];
        
        for (const category of defaultCategories) {
            await saveCategory(guildId, category);
        }
        
        const setupEmbed = new EmbedBuilder()
            .setTitle('🛡️ SentinelTicket 系統初始化完成')
            .setDescription('系統已成功初始化，包含以下功能：')
            .addFields(
                { name: '📋 預設分類', value: '技術支援、申訴檢舉、商業合作', inline: true },
                { name: '🎫 工單系統', value: '自動頻道創建和權限管理', inline: true },
                { name: '📊 統計功能', value: '完整的數據追蹤和分析', inline: true }
            )
            .setColor('#10b981')
            .setTimestamp()
            .setFooter({ text: 'SentinelTicket 工單系統' });
        
        await interaction.reply({ embeds: [setupEmbed] });
        
    } catch (error) {
        console.error('系統初始化錯誤:', error);
        await interaction.reply({
            content: '❌ 系統初始化失敗',
            ephemeral: true
        });
    }
}

// 創建工單面板指令
async function handlePanelCommand(interaction) {
    try {
        const title = interaction.options.getString('標題') || '🎫 工單支援系統';
        const description = interaction.options.getString('描述') || '需要幫助嗎？點擊下方按鈕創建工單，我們的團隊將盡快為您處理。';
        
        const panelEmbed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .addFields(
                { name: '📋 如何使用', value: '1. 點擊「建立工單」按鈕\n2. 選擇問題類型\n3. 在專屬頻道中描述問題\n4. 等待管理員回覆', inline: false },
                { name: '⏰ 回應時間', value: '我們通常在 24 小時內回覆', inline: true },
                { name: '🔒 隱私保護', value: '每個工單都有獨立的私人頻道', inline: true }
            )
            .setColor('#5865f2')
            .setTimestamp()
            .setFooter({ text: 'SentinelTicket 工單系統' });
        
        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('create_ticket')
                    .setLabel('建立工單')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🎫')
            );
        
        await interaction.reply({
            embeds: [panelEmbed],
            components: [actionRow]
        });
        
    } catch (error) {
        console.error('創建面板錯誤:', error);
        await interaction.reply({
            content: '❌ 創建工單面板失敗',
            ephemeral: true
        });
    }
}

// 添加管理員指令
async function handleAddCommand(interaction) {
    try {
        const user = interaction.options.getUser('用戶');
        const role = interaction.options.getString('角色') || 'moderator';
        const guildId = interaction.guild.id;
        
        await addStaff(user.id, guildId, role);
        
        const addEmbed = new EmbedBuilder()
            .setTitle('✅ 管理員已添加')
            .setDescription(`<@${user.id}> 已被添加為 **${getRoleName(role)}**`)
            .setColor('#10b981')
            .setTimestamp();
        
        await interaction.reply({ embeds: [addEmbed] });
        
    } catch (error) {
        console.error('添加管理員錯誤:', error);
        await interaction.reply({
            content: '❌ 添加管理員失敗',
            ephemeral: true
        });
    }
}

// 移除管理員指令
async function handleRemoveCommand(interaction) {
    try {
        const user = interaction.options.getUser('用戶');
        const guildId = interaction.guild.id;
        
        await removeStaff(user.id, guildId);
        
        const removeEmbed = new EmbedBuilder()
            .setTitle('✅ 管理員已移除')
            .setDescription(`<@${user.id}> 已從管理員列表中移除`)
            .setColor('#ef4444')
            .setTimestamp();
        
        await interaction.reply({ embeds: [removeEmbed] });
        
    } catch (error) {
        console.error('移除管理員錯誤:', error);
        await interaction.reply({
            content: '❌ 移除管理員失敗',
            ephemeral: true
        });
    }
}

// 黑名單指令
async function handleBlacklistCommand(interaction) {
    try {
        const user = interaction.options.getUser('用戶');
        const reason = interaction.options.getString('原因') || '違反工單使用規則';
        const duration = interaction.options.getString('時間');
        const guildId = interaction.guild.id;
        
        let expiresAt = null;
        if (duration) {
            expiresAt = parseDuration(duration);
        }
        
        await addToBlacklist(user.id, guildId, reason, interaction.user.id, expiresAt);
        
        const blacklistEmbed = new EmbedBuilder()
            .setTitle('🚫 用戶已加入黑名單')
            .setDescription(`<@${user.id}> 已被禁止使用工單系統`)
            .addFields(
                { name: '原因', value: reason, inline: true },
                { name: '時長', value: duration || '永久', inline: true }
            )
            .setColor('#ef4444')
            .setTimestamp();
        
        await interaction.reply({ embeds: [blacklistEmbed] });
        
    } catch (error) {
        console.error('黑名單操作錯誤:', error);
        await interaction.reply({
            content: '❌ 黑名單操作失敗',
            ephemeral: true
        });
    }
}

// 解除黑名單指令
async function handleUnblacklistCommand(interaction) {
    try {
        const user = interaction.options.getUser('用戶');
        const guildId = interaction.guild.id;
        
        await removeFromBlacklist(user.id, guildId);
        
        const unblacklistEmbed = new EmbedBuilder()
            .setTitle('✅ 用戶已解除黑名單')
            .setDescription(`<@${user.id}> 現在可以正常使用工單系統`)
            .setColor('#10b981')
            .setTimestamp();
        
        await interaction.reply({ embeds: [unblacklistEmbed] });
        
    } catch (error) {
        console.error('解除黑名單錯誤:', error);
        await interaction.reply({
            content: '❌ 解除黑名單失敗',
            ephemeral: true
        });
    }
}

// 關閉工單指令
async function handleCloseCommand(interaction) {
    const reason = interaction.options.getString('原因') || '工單已處理完成';
    await handleCloseTicket(interaction, reason);
}

// 領取工單指令
async function handleClaimCommand(interaction) {
    await handleClaimTicket(interaction);
}

// 取消領取工單指令
async function handleUnclaimCommand(interaction) {
    try {
        const channelId = interaction.channel.id;
        const ticket = await getTicketByChannel(channelId);
        
        if (!ticket) {
            return await interaction.reply({
                content: '❌ 這不是一個工單頻道',
                ephemeral: true
            });
        }
        
        await unclaimTicket(ticket.id);
        
        const unclaimEmbed = new EmbedBuilder()
            .setTitle('📤 工單已釋放')
            .setDescription('此工單現在可以被其他管理員領取')
            .setColor('#f59e0b')
            .setTimestamp();
        
        await interaction.reply({ embeds: [unclaimEmbed] });
        
    } catch (error) {
        console.error('取消領取工單錯誤:', error);
        await interaction.reply({
            content: '❌ 取消領取工單失敗',
            ephemeral: true
        });
    }
}

// 重命名工單指令
async function handleRenameCommand(interaction) {
    try {
        const newName = interaction.options.getString('新名稱');
        const channelId = interaction.channel.id;
        
        const ticket = await getTicketByChannel(channelId);
        if (!ticket) {
            return await interaction.reply({
                content: '❌ 這不是一個工單頻道',
                ephemeral: true
            });
        }
        
        await interaction.channel.setName(newName);
        
        const renameEmbed = new EmbedBuilder()
            .setTitle('✏️ 頻道已重命名')
            .setDescription(`頻道名稱已更改為: **${newName}**`)
            .setColor('#3b82f6')
            .setTimestamp();
        
        await interaction.reply({ embeds: [renameEmbed] });
        
    } catch (error) {
        console.error('重命名頻道錯誤:', error);
        await interaction.reply({
            content: '❌ 重命名頻道失敗',
            ephemeral: true
        });
    }
}

// 幫助指令
async function handleHelpCommand(interaction) {
    const commandName = interaction.options.getString('指令名稱');
    
    if (commandName) {
        // 顯示特定指令的幫助
        const helpEmbed = getCommandHelp(commandName);
        await interaction.reply({ embeds: [helpEmbed], ephemeral: true });
    } else {
        // 顯示所有指令列表
        const helpEmbed = new EmbedBuilder()
            .setTitle('🛡️ SentinelTicket 指令幫助')
            .setDescription('以下是所有可用的指令：')
            .addFields(
                { name: '👑 管理員指令', value: '`/setup` - 初始化系統\n`/panel` - 創建工單面板\n`/add` - 添加管理員\n`/remove` - 移除管理員\n`/blacklist` - 加入黑名單', inline: false },
                { name: '🎫 工單指令', value: '`/close` - 關閉工單\n`/claim` - 領取工單\n`/unclaim` - 取消領取\n`/rename` - 重命名頻道', inline: false },
                { name: '📊 資訊指令', value: '`/stats` - 查看統計\n`/info` - 系統信息\n`/help` - 顯示幫助', inline: false }
            )
            .setColor('#5865f2')
            .setTimestamp()
            .setFooter({ text: '使用 /help [指令名稱] 查看詳細說明' });
        
        await interaction.reply({ embeds: [helpEmbed], ephemeral: true });
    }
}

// 統計指令
async function handleStatsCommand(interaction) {
    try {
        const timeRange = interaction.options.getString('時間範圍') || 'all';
        const guildId = interaction.guild.id;
        
        const stats = await getTicketStats(guildId, timeRange);
        
        const statsEmbed = new EmbedBuilder()
            .setTitle('📊 工單系統統計')
            .setDescription(`統計時間範圍: **${getTimeRangeName(timeRange)}**`)
            .addFields(
                { name: '🟢 進行中', value: stats.open.toString(), inline: true },
                { name: '🟡 待處理', value: stats.pending.toString(), inline: true },
                { name: '🔴 已關閉', value: stats.closed.toString(), inline: true },
                { name: '📈 總計', value: stats.total.toString(), inline: true },
                { name: '⏱️ 平均處理時間', value: stats.avgResponseTime || 'N/A', inline: true },
                { name: '👥 活躍管理員', value: stats.activeStaff.toString(), inline: true }
            )
            .setColor('#3b82f6')
            .setTimestamp();
        
        await interaction.reply({ embeds: [statsEmbed] });
        
    } catch (error) {
        console.error('獲取統計錯誤:', error);
        await interaction.reply({
            content: '❌ 獲取統計信息失敗',
            ephemeral: true
        });
    }
}

// 系統信息指令
async function handleInfoCommand(interaction) {
    const infoEmbed = new EmbedBuilder()
        .setTitle('🛡️ SentinelTicket 系統信息')
        .setDescription('專業化社群工單支援系統')
        .addFields(
            { name: '📦 版本', value: '1.0.0', inline: true },
            { name: '🤖 Bot 延遲', value: `${client.ws.ping}ms`, inline: true },
            { name: '⏰ 運行時間', value: formatUptime(process.uptime()), inline: true },
            { name: '💾 記憶體使用', value: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`, inline: true },
            { name: '🌐 Web 面板', value: process.env.WEB_URL || 'http://localhost:3000', inline: true },
            { name: '📚 文檔', value: '[使用指南](https://github.com/sentinel-ticket)', inline: true }
        )
        .setColor('#5865f2')
        .setTimestamp()
        .setFooter({ text: 'SentinelTicket - 讓客服更專業' });
    
    await interaction.reply({ embeds: [infoEmbed] });
}

// 輔助函數
function getRoleName(role) {
    const roleNames = {
        'admin': '系統管理員',
        'moderator': '一般管理員',
        'support': '客服人員'
    };
    return roleNames[role] || role;
}

function getTimeRangeName(range) {
    const rangeNames = {
        'today': '今天',
        'week': '本週',
        'month': '本月',
        'all': '全部時間'
    };
    return rangeNames[range] || range;
}

function parseDuration(duration) {
    const match = duration.match(/^(\d+)([dwmy])$/);
    if (!match) return null;
    
    const value = parseInt(match[1]);
    const unit = match[2];
    const now = new Date();
    
    switch (unit) {
        case 'd': return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
        case 'w': return new Date(now.getTime() + value * 7 * 24 * 60 * 60 * 1000);
        case 'm': return new Date(now.getTime() + value * 30 * 24 * 60 * 60 * 1000);
        case 'y': return new Date(now.getTime() + value * 365 * 24 * 60 * 60 * 1000);
        default: return null;
    }
}

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}天 ${hours}小時`;
    if (hours > 0) return `${hours}小時 ${minutes}分鐘`;
    return `${minutes}分鐘`;
}

function getCommandHelp(commandName) {
    const helpData = {
        'setup': {
            title: '/setup - 系統初始化',
            description: '初始化工單系統，創建預設分類和基本配置',
            usage: '/setup',
            permissions: '需要管理員權限'
        },
        'panel': {
            title: '/panel - 創建工單面板',
            description: '在當前頻道創建工單面板，用戶可點擊按鈕開票',
            usage: '/panel [標題] [描述]',
            permissions: '需要管理員權限'
        }
        // 可以添加更多指令的詳細幫助
    };
    
    const help = helpData[commandName];
    if (!help) {
        return new EmbedBuilder()
            .setTitle('❌ 找不到指令')
            .setDescription(`指令 \`${commandName}\` 不存在`)
            .setColor('#ef4444');
    }
    
    return new EmbedBuilder()
        .setTitle(help.title)
        .setDescription(help.description)
        .addFields(
            { name: '用法', value: `\`${help.usage}\``, inline: false },
            { name: '權限要求', value: help.permissions, inline: false }
        )
        .setColor('#5865f2');
}

// 資料庫操作函數 (新增)
function saveCategory(guildId, category) {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare(`
            INSERT OR REPLACE INTO categories (id, guild_id, name, emoji, color)
            VALUES (?, ?, ?, ?, ?)
        `);
        
        stmt.run([
            category.id,
            guildId,
            category.name,
            category.emoji,
            category.color
        ], function(err) {
            if (err) reject(err);
            else resolve();
        });
        
        stmt.finalize();
    });
}

function addStaff(userId, guildId, role) {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare(`
            INSERT OR REPLACE INTO staff (user_id, guild_id, role)
            VALUES (?, ?, ?)
        `);
        
        stmt.run([userId, guildId, role], function(err) {
            if (err) reject(err);
            else resolve();
        });
        
        stmt.finalize();
    });
}

function removeStaff(userId, guildId) {
    return new Promise((resolve, reject) => {
        db.run(
            'DELETE FROM staff WHERE user_id = ? AND guild_id = ?',
            [userId, guildId],
            (err) => {
                if (err) reject(err);
                else resolve();
            }
        );
    });
}

function addToBlacklist(userId, guildId, reason, addedBy, expiresAt) {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare(`
            INSERT OR REPLACE INTO blacklist (user_id, guild_id, reason, added_by, expires_at)
            VALUES (?, ?, ?, ?, ?)
        `);
        
        stmt.run([userId, guildId, reason, addedBy, expiresAt], function(err) {
            if (err) reject(err);
            else resolve();
        });
        
        stmt.finalize();
    });
}

function removeFromBlacklist(userId, guildId) {
    return new Promise((resolve, reject) => {
        db.run(
            'DELETE FROM blacklist WHERE user_id = ? AND guild_id = ?',
            [userId, guildId],
            (err) => {
                if (err) reject(err);
                else resolve();
            }
        );
    });
}

function unclaimTicket(ticketId) {
    return new Promise((resolve, reject) => {
        db.run(
            'UPDATE tickets SET assignee_id = NULL WHERE id = ?',
            [ticketId],
            (err) => {
                if (err) reject(err);
                else resolve();
            }
        );
    });
}

function getTicketStats(guildId, timeRange) {
    return new Promise((resolve, reject) => {
        let whereClause = 'WHERE guild_id = ?';
        const params = [guildId];
        
        if (timeRange !== 'all') {
            const timeConditions = {
                'today': "AND DATE(created_at) = DATE('now')",
                'week': "AND created_at >= DATE('now', '-7 days')",
                'month': "AND created_at >= DATE('now', '-1 month')"
            };
            
            whereClause += ` ${timeConditions[timeRange] || ''}`;
        }
        
        db.all(`
            SELECT 
                status,
                COUNT(*) as count
            FROM tickets 
            ${whereClause}
            GROUP BY status
        `, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                const stats = {
                    open: 0,
                    pending: 0,
                    closed: 0,
                    total: 0,
                    avgResponseTime: 'N/A',
                    activeStaff: 0
                };
                
                rows.forEach(row => {
                    stats[row.status] = row.count;
                    stats.total += row.count;
                });
                
                resolve(stats);
            }
        });
    });
}