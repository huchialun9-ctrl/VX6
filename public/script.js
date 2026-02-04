// SentinelTicket - 專業化工單系統前端邏輯

// 全域變數
let currentUser = null;
let currentGuild = null;
let userGuilds = [];
let tickets = [];
let categories = [];
let staffMembers = [];
let isLoggedIn = false;

// DOM 元素
const sidebar = document.getElementById('sidebar');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const sidebarToggle = document.getElementById('sidebarToggle');
const pageTitle = document.getElementById('pageTitle');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const refreshBtn = document.getElementById('refreshBtn');
const loadingOverlay = document.getElementById('loadingOverlay');
const notification = document.getElementById('notification');

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadDashboardData();
});

// 應用程序初始化
function initializeApp() {
    console.log('🛡️ SentinelTicket 系統初始化中...');
    
    // 檢查登入狀態
    checkLoginStatus();
    
    // 設置默認頁面
    showPage('dashboard');
    
    // 載入模擬數據
    loadMockData();
    
    console.log('✅ 系統初始化完成');
}

// 設置事件監聽器
function setupEventListeners() {
    // 側邊欄切換
    mobileMenuBtn.addEventListener('click', toggleSidebar);
    sidebarToggle.addEventListener('click', toggleSidebar);
    
    // 導航選單
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.dataset.page;
            if (page) {
                setActiveNavItem(this);
                showPage(page);
            }
        });
    });
    
    // 頂部按鈕
    loginBtn.addEventListener('click', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);
    refreshBtn.addEventListener('click', refreshCurrentPage);
    
    // 點擊外部關閉側邊欄 (移動端)
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 1024) {
            if (!sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        }
    });
    
    // 響應式處理
    window.addEventListener('resize', handleResize);
}

// 切換側邊欄
function toggleSidebar() {
    sidebar.classList.toggle('open');
}

// 設置活動導航項目
function setActiveNavItem(activeItem) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    activeItem.classList.add('active');
}

// 顯示頁面
function showPage(pageName) {
    // 隱藏所有頁面
    document.querySelectorAll('.page').forEach(page => {
        page.style.display = 'none';
    });
    
    // 顯示目標頁面
    const targetPage = document.getElementById(pageName + 'Page');
    if (targetPage) {
        targetPage.style.display = 'block';
        
        // 更新頁面標題
        const titles = {
            'dashboard': '儀表板',
            'tickets': '工單管理',
            'categories': '分類設定',
            'staff': '管理員管理',
            'analytics': '數據分析',
            'settings': '系統設定',
            'docs': '使用文檔',
            'commands': '指令說明'
        };
        
        pageTitle.textContent = titles[pageName] || '未知頁面';
        
        // 載入頁面特定數據
        loadPageData(pageName);
    }
    
    // 移動端自動關閉側邊欄
    if (window.innerWidth <= 1024) {
        sidebar.classList.remove('open');
    }
}

// 載入頁面數據
function loadPageData(pageName) {
    switch (pageName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'tickets':
            loadTicketsData();
            break;
        case 'categories':
            loadCategoriesData();
            break;
        case 'staff':
            loadStaffData();
            break;
        case 'analytics':
            loadAnalyticsData();
            break;
        case 'settings':
            loadSettingsData();
            break;
        case 'docs':
            loadDocsData();
            break;
        case 'commands':
            loadCommandsData();
            break;
    }
}

// 載入儀表板數據
function loadDashboardData() {
    // 更新統計卡片
    document.getElementById('activeTickets').textContent = tickets.filter(t => t.status === 'open').length;
    document.getElementById('pendingTickets').textContent = tickets.filter(t => t.status === 'pending').length;
    document.getElementById('closedTickets').textContent = tickets.filter(t => t.status === 'closed').length;
    document.getElementById('onlineStaff').textContent = staffMembers.filter(s => s.online).length;
    
    // 更新工單徽章
    const ticketBadge = document.getElementById('ticketBadge');
    const activeCount = tickets.filter(t => t.status === 'open' || t.status === 'pending').length;
    ticketBadge.textContent = activeCount;
    
    // 載入最近活動
    loadRecentActivity();
}

// 載入最近活動
function loadRecentActivity() {
    const activityList = document.getElementById('activityList');
    const activities = [
        {
            icon: 'fas fa-ticket-alt',
            text: '新工單 #1001 已建立',
            time: '5 分鐘前',
            type: 'ticket'
        },
        {
            icon: 'fas fa-user-check',
            text: '管理員 Admin 已上線',
            time: '10 分鐘前',
            type: 'staff'
        },
        {
            icon: 'fas fa-check-circle',
            text: '工單 #1000 已結案',
            time: '15 分鐘前',
            type: 'close'
        }
    ];
    
    activityList.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="${activity.icon}"></i>
            </div>
            <div class="activity-content">
                <p>${activity.text}</p>
                <span class="activity-time">${activity.time}</span>
            </div>
        </div>
    `).join('');
}

// 載入工單數據
function loadTicketsData() {
    const tableBody = document.getElementById('ticketsTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = tickets.map(ticket => `
        <tr>
            <td>#${ticket.id}</td>
            <td>${ticket.title}</td>
            <td>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <img src="${ticket.user.avatar}" alt="${ticket.user.name}" 
                         style="width: 24px; height: 24px; border-radius: 50%;" 
                         onerror="this.style.display='none'">
                    ${ticket.user.name}
                </div>
            </td>
            <td>
                <span class="category-badge category-${ticket.category}">
                    ${getCategoryName(ticket.category)}
                </span>
            </td>
            <td>
                <span class="status-badge status-${ticket.status}">
                    ${getStatusName(ticket.status)}
                </span>
            </td>
            <td>${ticket.assignee || '未分配'}</td>
            <td>${formatDate(ticket.createdAt)}</td>
            <td>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn-small btn-primary" onclick="viewTicket(${ticket.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-small btn-secondary" onclick="editTicket(${ticket.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// 載入模擬數據
function loadMockData() {
    // 模擬工單數據
    tickets = [
        {
            id: 1001,
            title: '無法登入帳戶',
            user: {
                name: 'User123',
                avatar: 'https://cdn.discordapp.com/embed/avatars/0.png'
            },
            category: 'support',
            status: 'open',
            assignee: null,
            createdAt: new Date(Date.now() - 300000), // 5分鐘前
            messages: []
        },
        {
            id: 1000,
            title: '檢舉不當行為',
            user: {
                name: 'Reporter456',
                avatar: 'https://cdn.discordapp.com/embed/avatars/1.png'
            },
            category: 'report',
            status: 'closed',
            assignee: 'Admin',
            createdAt: new Date(Date.now() - 900000), // 15分鐘前
            messages: []
        }
    ];
    
    // 模擬分類數據
    categories = [
        { id: 'support', name: '技術支援', color: '#3b82f6', emoji: '🔧' },
        { id: 'report', name: '申訴檢舉', color: '#ef4444', emoji: '⚠️' },
        { id: 'business', name: '商業合作', color: '#10b981', emoji: '💼' }
    ];
    
    // 模擬管理員數據
    staffMembers = [
        {
            id: '123456789',
            name: 'Admin',
            role: '系統管理員',
            online: true,
            avatar: 'https://cdn.discordapp.com/embed/avatars/2.png'
        }
    ];
}

// 工具函數
function getCategoryName(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : categoryId;
}

function getStatusName(status) {
    const statusNames = {
        'open': '進行中',
        'pending': '待處理',
        'closed': '已關閉'
    };
    return statusNames[status] || status;
}

function formatDate(date) {
    return new Intl.DateTimeFormat('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(date));
}

// 登入處理
function handleLogin() {
    // 重定向到Discord OAuth2授權頁面
    window.location.href = '/auth/discord';
}

// 登出處理
async function handleLogout() {
    try {
        await fetch('/auth/logout');
        
        currentUser = null;
        isLoggedIn = false;
        updateUserInterface();
        showNotification('已登出', 'info');
        
        // 重新載入頁面以清除所有數據
        setTimeout(() => {
            window.location.reload();
        }, 1000);
        
    } catch (error) {
        console.error('登出錯誤:', error);
        showNotification('登出失敗', 'error');
    }
}

// 更新用戶界面
function updateUserInterface() {
    const userInfo = document.getElementById('userInfo');
    const userAvatar = userInfo.querySelector('.user-avatar');
    const userName = userInfo.querySelector('.user-name');
    const userRole = userInfo.querySelector('.user-role');
    
    if (isLoggedIn && currentUser) {
        // 更新用戶信息
        if (currentUser.avatar) {
            userAvatar.innerHTML = `<img src="https://cdn.discordapp.com/avatars/${currentUser.id}/${currentUser.avatar}.png" alt="${currentUser.username}">`;
        }
        userName.textContent = currentUser.username;
        userRole.textContent = '系統管理員';
        
        // 顯示/隱藏按鈕
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'block';
    } else {
        // 重置為未登入狀態
        userAvatar.innerHTML = '<i class="fas fa-user-circle"></i>';
        userName.textContent = '未登入';
        userRole.textContent = '訪客';
        
        loginBtn.style.display = 'flex';
        logoutBtn.style.display = 'none';
    }
}

// 檢查登入狀態
function checkLoginStatus() {
    // 檢查URL參數
    const urlParams = new URLSearchParams(window.location.search);
    const loginStatus = urlParams.get('login');
    const error = urlParams.get('error');
    
    if (loginStatus === 'success') {
        showNotification('🎉 Discord 登入成功！', 'success');
        // 清除URL參數
        window.history.replaceState({}, document.title, window.location.pathname);
        // 載入用戶資訊
        loadUserInfo();
    } else if (error) {
        let errorMessage = '登入失敗';
        switch (error) {
            case 'no_code':
                errorMessage = '授權碼缺失，請重新登入';
                break;
            case 'oauth_failed':
                errorMessage = 'Discord 授權失敗，請稍後再試';
                break;
        }
        showNotification(errorMessage, 'error');
        window.history.replaceState({}, document.title, window.location.pathname);
    } else {
        // 檢查是否已有session
        loadUserInfo();
    }
}

// 載入用戶資訊
async function loadUserInfo() {
    try {
        const response = await fetch('/api/user');
        if (response.ok) {
            const userData = await response.json();
            currentUser = userData;
            userGuilds = userData.guilds || [];
            isLoggedIn = true;
            updateUserInterface();
            
            // 顯示伺服器選擇器
            if (userGuilds.length > 0) {
                showServerSelector();
            } else {
                showNotification('未找到可管理的伺服器', 'warning');
            }
        }
    } catch (error) {
        console.log('用戶未登入或session已過期');
    }
}

// 重新整理當前頁面
function refreshCurrentPage() {
    const activePage = document.querySelector('.nav-item.active');
    if (activePage) {
        const pageName = activePage.dataset.page;
        loadPageData(pageName);
        showNotification('頁面已重新整理', 'success');
    }
}

// 響應式處理
function handleResize() {
    if (window.innerWidth > 1024) {
        sidebar.classList.remove('open');
    }
}

// 載入其他頁面數據的佔位符函數
function loadCategoriesData() {
    console.log('載入分類數據...');
}

function loadStaffData() {
    console.log('載入管理員數據...');
}

function loadAnalyticsData() {
    console.log('載入分析數據...');
}

function loadSettingsData() {
    console.log('載入設定數據...');
}

// 快速操作函數
function createTicketPanel() {
    showNotification('建立工單面板功能開發中...', 'info');
}

function viewActiveTickets() {
    setActiveNavItem(document.querySelector('[data-page="tickets"]'));
    showPage('tickets');
}

function manageCategories() {
    setActiveNavItem(document.querySelector('[data-page="categories"]'));
    showPage('categories');
}

function viewAnalytics() {
    setActiveNavItem(document.querySelector('[data-page="analytics"]'));
    showPage('analytics');
}

// 工單操作函數
function viewTicket(ticketId) {
    showNotification(`查看工單 #${ticketId}`, 'info');
}

function editTicket(ticketId) {
    showNotification(`編輯工單 #${ticketId}`, 'info');
}

function refreshTickets() {
    loadTicketsData();
    showNotification('工單列表已重新整理', 'success');
}

// 載入動畫
function showLoading(show) {
    loadingOverlay.style.display = show ? 'flex' : 'none';
}

// 通知系統
function showNotification(message, type = 'info') {
    const notificationIcon = notification.querySelector('.notification-icon');
    const notificationText = notification.querySelector('.notification-text');
    
    // 設置圖標
    const icons = {
        'success': 'fas fa-check-circle',
        'error': 'fas fa-exclamation-circle',
        'warning': 'fas fa-exclamation-triangle',
        'info': 'fas fa-info-circle'
    };
    
    notificationIcon.className = `notification-icon ${icons[type] || icons.info}`;
    notificationText.textContent = message;
    
    // 設置樣式
    notification.className = `notification ${type}`;
    notification.style.display = 'flex';
    
    // 自動隱藏
    setTimeout(() => {
        hideNotification();
    }, 4000);
}

function hideNotification() {
    notification.style.display = 'none';
}

// 全域函數
window.createTicketPanel = createTicketPanel;
window.viewActiveTickets = viewActiveTickets;
window.manageCategories = manageCategories;
window.viewAnalytics = viewAnalytics;
window.viewTicket = viewTicket;
window.editTicket = editTicket;
window.refreshTickets = refreshTickets;
window.hideNotification = hideNotification;

// 初始化完成日誌
console.log('🛡️ SentinelTicket 前端系統載入完成');// 文檔和指令頁面
相關函數

// 載入文檔頁面數據
function loadDocsData() {
    console.log('載入文檔數據...');
    
    // 設置FAQ互動
    setupFAQInteraction();
}

// 載入指令頁面數據
function loadCommandsData() {
    console.log('載入指令數據...');
    
    // 可以在這裡添加動態載入指令數據的邏輯
    // 例如從API獲取最新的指令列表
}

// 設置FAQ互動功能
function setupFAQInteraction() {
    // 等待DOM載入完成後再設置事件監聽器
    setTimeout(() => {
        const faqItems = document.querySelectorAll('.faq-item');
        
        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            if (question) {
                question.addEventListener('click', function() {
                    // 切換當前項目的展開狀態
                    item.classList.toggle('active');
                    
                    // 關閉其他展開的項目
                    faqItems.forEach(otherItem => {
                        if (otherItem !== item) {
                            otherItem.classList.remove('active');
                        }
                    });
                });
            }
        });
    }, 100);
}

// 複製指令到剪貼板
function copyCommand(command) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(command).then(() => {
            showNotification(`已複製指令: ${command}`, 'success');
        }).catch(err => {
            console.error('複製失敗:', err);
            fallbackCopyCommand(command);
        });
    } else {
        fallbackCopyCommand(command);
    }
}

// 備用複製方法
function fallbackCopyCommand(command) {
    const textArea = document.createElement('textarea');
    textArea.value = command;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showNotification(`已複製指令: ${command}`, 'success');
    } catch (err) {
        console.error('複製失敗:', err);
        showNotification('複製失敗，請手動複製', 'error');
    }
    
    document.body.removeChild(textArea);
}

// 搜尋指令功能
function searchCommands(query) {
    const commandCards = document.querySelectorAll('.command-card');
    const searchQuery = query.toLowerCase();
    
    commandCards.forEach(card => {
        const commandName = card.querySelector('h4').textContent.toLowerCase();
        const commandDesc = card.querySelector('.command-description').textContent.toLowerCase();
        
        if (commandName.includes(searchQuery) || commandDesc.includes(searchQuery)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// 過濾指令按權限
function filterCommandsByPermission(permission) {
    const commandCards = document.querySelectorAll('.command-card');
    
    commandCards.forEach(card => {
        const badge = card.querySelector('.command-badge');
        if (badge) {
            if (permission === 'all' || badge.classList.contains(permission)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        }
    });
}

// 顯示指令詳細信息
function showCommandDetails(commandName) {
    // 這裡可以實現顯示指令詳細信息的模態框
    showNotification(`顯示 ${commandName} 詳細信息`, 'info');
}

// 導出指令列表
function exportCommands() {
    const commands = [];
    const commandCards = document.querySelectorAll('.command-card');
    
    commandCards.forEach(card => {
        const name = card.querySelector('h4').textContent;
        const description = card.querySelector('.command-description').textContent;
        const usage = card.querySelector('.command-usage code')?.textContent || '';
        const permission = card.querySelector('.command-badge').textContent;
        
        commands.push({
            name,
            description,
            usage,
            permission
        });
    });
    
    const dataStr = JSON.stringify(commands, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sentinel-ticket-commands.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    showNotification('指令列表已導出', 'success');
}

// 全域函數
window.copyCommand = copyCommand;
window.searchCommands = searchCommands;
window.filterCommandsByPermission = filterCommandsByPermission;
window.showCommandDetails = showCommandDetails;
window.exportCommands = exportCommands;

// 載入指定伺服器的工單數據
async function loadTicketsForGuild(guildId) {
    try {
        const response = await fetch(`/api/tickets?guild_id=${guildId}`);
        if (response.ok) {
            const ticketData = await response.json();
            tickets = ticketData;
            
            // 更新儀表板數據
            loadDashboardData();
            
            // 如果當前在工單頁面，更新工單列表
            const currentPage = document.querySelector('.nav-item.active')?.dataset.page;
            if (currentPage === 'tickets') {
                loadTicketsData();
            }
        }
    } catch (error) {
        console.error('載入工單數據錯誤:', error);
    }
}

// 載入伺服器統計數據
async function loadServerStats(guildId) {
    try {
        const response = await fetch(`/api/stats?guild_id=${guildId}`);
        if (response.ok) {
            const stats = await response.json();
            
            // 更新統計卡片
            document.getElementById('activeTickets').textContent = stats.open || 0;
            document.getElementById('pendingTickets').textContent = stats.pending || 0;
            document.getElementById('closedTickets').textContent = stats.closed || 0;
            
            // 更新工單徽章
            const ticketBadge = document.getElementById('ticketBadge');
            const activeCount = (stats.open || 0) + (stats.pending || 0);
            ticketBadge.textContent = activeCount;
        }
    } catch (error) {
        console.error('載入統計數據錯誤:', error);
    }
}

// 創建工單面板 (通過API)
async function createTicketPanelAPI() {
    if (!isLoggedIn) {
        showNotification('請先登入', 'warning');
        return;
    }
    
    try {
        showLoading(true);
        
        // 這裡可以調用Discord Bot的API來創建工單面板
        // 目前顯示提示信息
        showNotification('請在Discord中使用 /panel 指令創建工單面板', 'info');
        
    } catch (error) {
        console.error('創建工單面板錯誤:', error);
        showNotification('創建工單面板失敗', 'error');
    } finally {
        showLoading(false);
    }
}

// 更新用戶界面以顯示真實用戶信息
function updateUserInterface() {
    const userInfo = document.getElementById('userInfo');
    const userAvatar = userInfo.querySelector('.user-avatar');
    const userName = userInfo.querySelector('.user-name');
    const userRole = userInfo.querySelector('.user-role');
    
    if (isLoggedIn && currentUser) {
        // 更新用戶信息
        if (currentUser.avatar) {
            const avatarUrl = `https://cdn.discordapp.com/avatars/${currentUser.id}/${currentUser.avatar}.png?size=64`;
            userAvatar.innerHTML = `<img src="${avatarUrl}" alt="${currentUser.username}">`;
        } else {
            // 使用默認頭像
            const defaultAvatar = parseInt(currentUser.discriminator) % 5;
            userAvatar.innerHTML = `<img src="https://cdn.discordapp.com/embed/avatars/${defaultAvatar}.png" alt="${currentUser.username}">`;
        }
        
        userName.textContent = currentUser.username;
        
        // 檢查用戶是否為管理員
        const isOwner = currentUser.id === process.env.OWNER_USER_ID;
        userRole.textContent = isOwner ? '系統管理員' : '用戶';
        
        // 顯示/隱藏按鈕
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'block';
        
        // 載入用戶相關數據
        if (currentUser.guilds && currentUser.guilds.length > 0) {
            const targetGuildId = process.env.DISCORD_GUILD_ID || currentUser.guilds[0].id;
            loadServerStats(targetGuildId);
        }
        
    } else {
        // 重置為未登入狀態
        userAvatar.innerHTML = '<i class="fas fa-user-circle"></i>';
        userName.textContent = '未登入';
        userRole.textContent = '訪客';
        
        loginBtn.style.display = 'flex';
        logoutBtn.style.display = 'none';
    }
}

// 初始化時檢查登入狀態
document.addEventListener('DOMContentLoaded', function() {
    // 原有的初始化代碼...
    checkLoginStatus();
});

// 更新快速操作函數
function createTicketPanel() {
    createTicketPanelAPI();
}

// 重新定義全域函數
window.loadTicketsForGuild = loadTicketsForGuild;
window.loadServerStats = loadServerStats;
window.createTicketPanelAPI = createTicketPanelAPI;// 伺服器選擇相
關函數

// 顯示伺服器選擇器
function showServerSelector() {
    const serverSelector = document.getElementById('serverSelector');
    const serverGrid = document.getElementById('serverGrid');
    
    if (!serverSelector || !serverGrid) return;
    
    // 清空現有內容
    serverGrid.innerHTML = '';
    
    // 過濾出用戶有管理權限的伺服器
    const manageableGuilds = userGuilds.filter(guild => {
        // 檢查用戶是否有管理員權限 (ADMINISTRATOR 或 MANAGE_GUILD)
        return (guild.permissions & 0x8) === 0x8 || (guild.permissions & 0x20) === 0x20;
    });
    
    if (manageableGuilds.length === 0) {
        serverGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-secondary);">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem; color: var(--secondary-gradient);"></i>
                <h3>沒有可管理的伺服器</h3>
                <p>您需要在伺服器中擁有管理員權限才能使用工單系統</p>
            </div>
        `;
        serverSelector.style.display = 'block';
        return;
    }
    
    // 創建伺服器卡片
    manageableGuilds.forEach(guild => {
        const serverCard = createServerCard(guild);
        serverGrid.appendChild(serverCard);
    });
    
    serverSelector.style.display = 'block';
}

// 創建伺服器卡片
function createServerCard(guild) {
    const card = document.createElement('div');
    card.className = 'server-card nft-glow';
    card.dataset.guildId = guild.id;
    
    const iconUrl = guild.icon 
        ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=128`
        : null;
    
    card.innerHTML = `
        <div class="server-icon">
            ${iconUrl 
                ? `<img src="${iconUrl}" alt="${guild.name}" onerror="this.style.display='none'; this.parentElement.textContent='${guild.name.charAt(0).toUpperCase()}';">`
                : guild.name.charAt(0).toUpperCase()
            }
        </div>
        <div class="server-name">${guild.name}</div>
        <div class="server-info">
            <i class="fas fa-crown"></i> 管理員權限
        </div>
    `;
    
    card.addEventListener('click', () => selectServer(guild));
    
    return card;
}

// 選擇伺服器
async function selectServer(guild) {
    try {
        showLoading(true);
        
        // 移除其他選中狀態
        document.querySelectorAll('.server-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // 選中當前伺服器
        const selectedCard = document.querySelector(`[data-guild-id="${guild.id}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
        }
        
        currentGuild = guild;
        
        // 更新當前伺服器信息
        updateCurrentServerInfo(guild);
        
        // 載入伺服器數據
        await loadServerData(guild.id);
        
        // 隱藏伺服器選擇器，顯示儀表板
        document.getElementById('serverSelector').style.display = 'none';
        document.getElementById('currentServerInfo').style.display = 'block';
        
        showNotification(`已選擇伺服器: ${guild.name}`, 'success');
        
    } catch (error) {
        console.error('選擇伺服器錯誤:', error);
        showNotification('選擇伺服器失敗', 'error');
    } finally {
        showLoading(false);
    }
}

// 更新當前伺服器信息
function updateCurrentServerInfo(guild) {
    const serverName = document.getElementById('currentServerName');
    const serverStats = document.getElementById('currentServerStats');
    const serverAvatar = document.querySelector('.server-avatar');
    
    if (serverName) serverName.textContent = guild.name;
    if (serverStats) serverStats.textContent = `ID: ${guild.id}`;
    
    if (serverAvatar) {
        const iconUrl = guild.icon 
            ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=128`
            : null;
        
        if (iconUrl) {
            serverAvatar.innerHTML = `<img src="${iconUrl}" alt="${guild.name}">`;
        } else {
            serverAvatar.innerHTML = guild.name.charAt(0).toUpperCase();
        }
    }
}

// 載入伺服器數據
async function loadServerData(guildId) {
    try {
        // 載入工單數據
        await loadTicketsForGuild(guildId);
        
        // 載入統計數據
        await loadServerStats(guildId);
        
        // 載入伺服器詳細信息
        const guildResponse = await fetch(`/api/guild/${guildId}`);
        if (guildResponse.ok) {
            const guildData = await guildResponse.json();
            
            // 更新線上管理員數量
            document.getElementById('onlineStaff').textContent = guildData.online || 0;
            
            // 更新伺服器統計
            const serverStats = document.getElementById('currentServerStats');
            if (serverStats) {
                serverStats.textContent = `成員: ${guildData.memberCount} | 線上: ${guildData.online}`;
            }
        }
        
    } catch (error) {
        console.error('載入伺服器數據錯誤:', error);
        showNotification('載入伺服器數據失敗', 'error');
    }
}

// 顯示伺服器選擇器 (從儀表板)
function showServerSelector() {
    const serverSelector = document.getElementById('serverSelector');
    const currentServerInfo = document.getElementById('currentServerInfo');
    
    if (serverSelector) {
        serverSelector.style.display = 'block';
    }
    
    if (currentServerInfo) {
        currentServerInfo.style.display = 'none';
    }
    
    // 重新載入伺服器列表
    if (userGuilds.length > 0) {
        const serverGrid = document.getElementById('serverGrid');
        if (serverGrid) {
            serverGrid.innerHTML = '';
            
            const manageableGuilds = userGuilds.filter(guild => {
                return (guild.permissions & 0x8) === 0x8 || (guild.permissions & 0x20) === 0x20;
            });
            
            manageableGuilds.forEach(guild => {
                const serverCard = createServerCard(guild);
                serverGrid.appendChild(serverCard);
            });
        }
    }
}

// 更新用戶界面以支持伺服器信息
function updateUserInterface() {
    const userInfo = document.getElementById('userInfo');
    const userAvatar = userInfo.querySelector('.user-avatar');
    const userName = userInfo.querySelector('.user-name');
    const userRole = userInfo.querySelector('.user-role');
    
    if (isLoggedIn && currentUser) {
        // 更新用戶信息
        if (currentUser.avatar) {
            const avatarUrl = `https://cdn.discordapp.com/avatars/${currentUser.id}/${currentUser.avatar}.png?size=64`;
            userAvatar.innerHTML = `<img src="${avatarUrl}" alt="${currentUser.username}">`;
        } else {
            const defaultAvatar = parseInt(currentUser.discriminator || '0') % 5;
            userAvatar.innerHTML = `<img src="https://cdn.discordapp.com/embed/avatars/${defaultAvatar}.png" alt="${currentUser.username}">`;
        }
        
        userName.textContent = currentUser.username;
        userRole.textContent = `${userGuilds.length} 個伺服器`;
        
        // 顯示/隱藏按鈕
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'block';
        
    } else {
        // 重置為未登入狀態
        userAvatar.innerHTML = '<i class="fas fa-user-circle"></i>';
        userName.textContent = '未登入';
        userRole.textContent = 'NFT 訪客';
        
        loginBtn.style.display = 'flex';
        logoutBtn.style.display = 'none';
        
        // 隱藏伺服器相關元素
        document.getElementById('serverSelector').style.display = 'none';
        document.getElementById('currentServerInfo').style.display = 'none';
    }
}

// 重新整理當前頁面 (增強版)
function refreshCurrentPage() {
    const activePage = document.querySelector('.nav-item.active');
    if (activePage) {
        const pageName = activePage.dataset.page;
        
        // 如果有選中的伺服器，重新載入數據
        if (currentGuild && pageName === 'dashboard') {
            loadServerData(currentGuild.id);
        } else {
            loadPageData(pageName);
        }
        
        showNotification('頁面已重新整理', 'success');
    }
}

// 全域函數
window.showServerSelector = showServerSelector;
window.selectServer = selectServer;
window.loadServerData = loadServerData;
// 分類管
理功能
let currentEditingCategory = null;

function loadCategoriesData() {
    console.log('載入分類數據...');
    
    const categoriesGrid = document.getElementById('categoriesGrid');
    if (!categoriesGrid) return;
    
    categoriesGrid.innerHTML = categories.map(category => `
        <div class="category-card">
            <div class="category-header">
                <span class="category-emoji">${category.emoji || '📋'}</span>
                <span class="category-name">${category.name}</span>
            </div>
            <div class="category-stats">
                <div class="category-stat">
                    <div class="category-stat-value">${getTicketCountByCategory(category.id)}</div>
                    <div class="category-stat-label">工單數</div>
                </div>
                <div class="category-stat">
                    <div class="category-stat-value">${getActiveTicketCountByCategory(category.id)}</div>
                    <div class="category-stat-label">進行中</div>
                </div>
            </div>
            <div class="category-actions">
                <button class="btn-small btn-primary" onclick="editCategory('${category.id}')">
                    <i class="fas fa-edit"></i> 編輯
                </button>
                <button class="btn-small btn-danger" onclick="deleteCategory('${category.id}')">
                    <i class="fas fa-trash"></i> 刪除
                </button>
            </div>
        </div>
    `).join('');
}

function getTicketCountByCategory(categoryId) {
    return tickets.filter(ticket => ticket.category === categoryId).length;
}

function getActiveTicketCountByCategory(categoryId) {
    return tickets.filter(ticket => ticket.category === categoryId && ticket.status !== 'closed').length;
}

function addCategory() {
    currentEditingCategory = null;
    document.getElementById('categoryModalTitle').textContent = '新增分類';
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryModal').style.display = 'flex';
}

function editCategory(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;
    
    currentEditingCategory = categoryId;
    document.getElementById('categoryModalTitle').textContent = '編輯分類';
    document.getElementById('categoryName').value = category.name;
    document.getElementById('categoryEmoji').value = category.emoji || '';
    document.getElementById('categoryColor').value = category.color || '#3b82f6';
    document.getElementById('categoryRole').value = category.role_id || '';
    document.getElementById('categoryModal').style.display = 'flex';
}

function saveCategory() {
    const name = document.getElementById('categoryName').value.trim();
    const emoji = document.getElementById('categoryEmoji').value.trim();
    const color = document.getElementById('categoryColor').value;
    const roleId = document.getElementById('categoryRole').value.trim();
    
    if (!name) {
        showNotification('請輸入分類名稱', 'error');
        return;
    }
    
    const categoryData = {
        name,
        emoji: emoji || '📋',
        color,
        role_id: roleId || null
    };
    
    if (currentEditingCategory) {
        // 編輯現有分類
        const categoryIndex = categories.findIndex(c => c.id === currentEditingCategory);
        if (categoryIndex !== -1) {
            categories[categoryIndex] = { ...categories[categoryIndex], ...categoryData };
            showNotification('分類已更新', 'success');
        }
    } else {
        // 新增分類
        const newCategory = {
            id: 'category_' + Date.now(),
            ...categoryData
        };
        categories.push(newCategory);
        showNotification('分類已新增', 'success');
    }
    
    closeCategoryModal();
    loadCategoriesData();
}

function deleteCategory(categoryId) {
    if (confirm('確定要刪除此分類嗎？此操作無法復原。')) {
        const categoryIndex = categories.findIndex(c => c.id === categoryId);
        if (categoryIndex !== -1) {
            categories.splice(categoryIndex, 1);
            showNotification('分類已刪除', 'success');
            loadCategoriesData();
        }
    }
}

function closeCategoryModal() {
    document.getElementById('categoryModal').style.display = 'none';
    currentEditingCategory = null;
}

// 管理員管理功能
function loadStaffData() {
    console.log('載入管理員數據...');
    
    const staffTableBody = document.getElementById('staffTableBody');
    if (!staffTableBody) return;
    
    staffTableBody.innerHTML = staffMembers.map(staff => `
        <tr>
            <td>
                <div class="staff-user">
                    <div class="staff-avatar">
                        ${staff.avatar ? 
                            `<img src="${staff.avatar}" alt="${staff.name}">` : 
                            staff.name.charAt(0).toUpperCase()
                        }
                    </div>
                    <div class="staff-info">
                        <div class="staff-name">${staff.name}</div>
                        <div class="staff-id">${staff.id}</div>
                    </div>
                </div>
            </td>
            <td>
                <span class="role-badge ${staff.role}">${getRoleName(staff.role)}</span>
            </td>
            <td>
                <div class="status-indicator">
                    <div class="status-dot ${staff.online ? 'online' : 'offline'}"></div>
                    <span>${staff.online ? '線上' : '離線'}</span>
                </div>
            </td>
            <td>${formatDate(staff.added_at || new Date())}</td>
            <td>${getStaffTicketCount(staff.id)}</td>
            <td>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn-small btn-secondary" onclick="editStaffMember('${staff.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-small btn-danger" onclick="removeStaffMember('${staff.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function getStaffTicketCount(staffId) {
    return tickets.filter(ticket => ticket.assignee_id === staffId).length;
}

function addStaffMember() {
    document.getElementById('staffForm').reset();
    document.getElementById('staffModal').style.display = 'flex';
}

function saveStaffMember() {
    const userId = document.getElementById('staffUserId').value.trim();
    const role = document.getElementById('staffRole').value;
    
    if (!userId) {
        showNotification('請輸入用戶 ID', 'error');
        return;
    }
    
    // 檢查是否已存在
    if (staffMembers.find(s => s.id === userId)) {
        showNotification('此用戶已是管理員', 'error');
        return;
    }
    
    const newStaff = {
        id: userId,
        name: `User_${userId.slice(-4)}`,
        role,
        online: Math.random() > 0.5,
        added_at: new Date(),
        avatar: null
    };
    
    staffMembers.push(newStaff);
    showNotification('管理員已新增', 'success');
    closeStaffModal();
    loadStaffData();
}

function editStaffMember(staffId) {
    const staff = staffMembers.find(s => s.id === staffId);
    if (!staff) return;
    
    document.getElementById('staffUserId').value = staff.id;
    document.getElementById('staffRole').value = staff.role;
    document.getElementById('staffModal').style.display = 'flex';
}

function removeStaffMember(staffId) {
    if (confirm('確定要移除此管理員嗎？')) {
        const staffIndex = staffMembers.findIndex(s => s.id === staffId);
        if (staffIndex !== -1) {
            staffMembers.splice(staffIndex, 1);
            showNotification('管理員已移除', 'success');
            loadStaffData();
        }
    }
}

function closeStaffModal() {
    document.getElementById('staffModal').style.display = 'none';
}

// 數據分析功能
function loadAnalyticsData() {
    console.log('載入分析數據...');
    
    updateAnalyticsOverview();
    updateAnalyticsCharts();
    updateDetailedStats();
}

function updateAnalyticsOverview() {
    const totalTickets = tickets.length;
    const avgResponseTime = calculateAverageResponseTime();
    const resolutionRate = calculateResolutionRate();
    const satisfactionRate = 4.8; // 模擬數據
    
    document.getElementById('totalTicketsAnalytics').textContent = totalTickets;
    document.getElementById('avgResponseTime').textContent = avgResponseTime;
    document.getElementById('resolutionRate').textContent = `${resolutionRate}%`;
    document.getElementById('satisfactionRate').textContent = satisfactionRate;
    
    // 更新變化百分比（模擬數據）
    document.getElementById('ticketsChange').textContent = '+12%';
    document.getElementById('responseTimeChange').textContent = '-8%';
    document.getElementById('resolutionChange').textContent = '+3%';
    document.getElementById('satisfactionChange').textContent = '+0.2';
}

function calculateAverageResponseTime() {
    // 模擬計算平均回應時間
    const responseTimes = [1.5, 2.0, 3.2, 1.8, 2.5, 4.1, 1.2];
    const avg = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    return `${avg.toFixed(1)}h`;
}

function calculateResolutionRate() {
    const closedTickets = tickets.filter(t => t.status === 'closed').length;
    const totalTickets = tickets.length;
    return totalTickets > 0 ? Math.round((closedTickets / totalTickets) * 100) : 0;
}

function updateAnalyticsCharts() {
    // 簡單的圖表實現（使用 Canvas）
    drawTicketTrendChart();
    drawCategoryChart();
}

function drawTicketTrendChart() {
    const canvas = document.getElementById('trendCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // 清除畫布
    ctx.clearRect(0, 0, width, height);
    
    // 模擬數據
    const data = [12, 19, 15, 25, 22, 30, 28];
    const labels = ['週一', '週二', '週三', '週四', '週五', '週六', '週日'];
    
    // 設置樣式
    ctx.strokeStyle = '#00d4ff';
    ctx.fillStyle = 'rgba(0, 212, 255, 0.2)';
    ctx.lineWidth = 3;
    
    // 繪製線條
    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
        const x = (i / (data.length - 1)) * (width - 40) + 20;
        const y = height - 40 - (data[i] / 35) * (height - 80);
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();
    
    // 繪製點
    ctx.fillStyle = '#00d4ff';
    for (let i = 0; i < data.length; i++) {
        const x = (i / (data.length - 1)) * (width - 40) + 20;
        const y = height - 40 - (data[i] / 35) * (height - 80);
        
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
    }
}

function drawCategoryChart() {
    const canvas = document.getElementById('categoryCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // 清除畫布
    ctx.clearRect(0, 0, width, height);
    
    // 模擬數據
    const data = [
        { label: '技術支援', value: 45, color: '#3b82f6' },
        { label: '申訴檢舉', value: 30, color: '#ef4444' },
        { label: '商業合作', value: 25, color: '#10b981' }
    ];
    
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;
    
    let currentAngle = -Math.PI / 2;
    
    data.forEach(item => {
        const sliceAngle = (item.value / total) * 2 * Math.PI;
        
        // 繪製扇形
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.closePath();
        ctx.fillStyle = item.color;
        ctx.fill();
        
        // 繪製標籤
        const labelAngle = currentAngle + sliceAngle / 2;
        const labelX = centerX + Math.cos(labelAngle) * (radius + 20);
        const labelY = centerY + Math.sin(labelAngle) * (radius + 20);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(`${item.label} (${item.value}%)`, labelX, labelY);
        
        currentAngle += sliceAngle;
    });
}

function updateDetailedStats() {
    // 更新管理員效能
    const staffPerformance = document.getElementById('staffPerformance');
    if (staffPerformance) {
        staffPerformance.innerHTML = staffMembers.map(staff => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid rgba(0, 212, 255, 0.1);">
                <span style="color: var(--text-primary);">${staff.name}</span>
                <span style="color: var(--text-secondary);">${getStaffTicketCount(staff.id)} 工單</span>
            </div>
        `).join('');
    }
    
    // 更新熱門問題
    const popularIssues = document.getElementById('popularIssues');
    if (popularIssues) {
        const issues = [
            { title: '登入問題', count: 15 },
            { title: '帳號被盜', count: 12 },
            { title: '付款失敗', count: 8 },
            { title: '功能建議', count: 6 }
        ];
        
        popularIssues.innerHTML = issues.map(issue => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid rgba(0, 212, 255, 0.1);">
                <span style="color: var(--text-primary);">${issue.title}</span>
                <span style="color: var(--text-secondary);">${issue.count} 次</span>
            </div>
        `).join('');
    }
}

function updateAnalytics() {
    const timeRange = document.getElementById('analyticsTimeRange').value;
    console.log('更新分析數據，時間範圍:', timeRange);
    loadAnalyticsData();
}

function exportAnalytics() {
    const analyticsData = {
        overview: {
            totalTickets: tickets.length,
            avgResponseTime: calculateAverageResponseTime(),
            resolutionRate: calculateResolutionRate(),
            satisfactionRate: 4.8
        },
        tickets: tickets,
        categories: categories,
        staff: staffMembers,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(analyticsData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    showNotification('分析報告已匯出', 'success');
}

// 系統設定功能
function loadSettingsData() {
    console.log('載入設定數據...');
    
    // 載入設定值（從 localStorage 或使用預設值）
    const settings = getSettings();
    
    document.getElementById('maxTicketsPerUser').value = settings.maxTicketsPerUser || 3;
    document.getElementById('autoCloseTime').value = settings.autoCloseTime || 48;
    document.getElementById('ticketCategoryId').value = settings.ticketCategoryId || '';
    document.getElementById('logChannelId').value = settings.logChannelId || '';
    
    document.getElementById('enableNewTicketNotification').checked = settings.enableNewTicketNotification !== false;
    document.getElementById('enableCloseTicketNotification').checked = settings.enableCloseTicketNotification !== false;
    document.getElementById('enableInactivityWarning').checked = settings.enableInactivityWarning !== false;
    document.getElementById('notificationRoleId').value = settings.notificationRoleId || '';
    
    document.getElementById('enableRateLimit').checked = settings.enableRateLimit !== false;
    document.getElementById('rateLimitCount').value = settings.rateLimitCount || 5;
    document.getElementById('rateLimitWindow').value = settings.rateLimitWindow || 10;
    document.getElementById('enableAutoBlacklist').checked = settings.enableAutoBlacklist || false;
    
    document.getElementById('embedColor').value = settings.embedColor || '#3b82f6';
    document.getElementById('botStatus').value = settings.botStatus || '工單系統 | /help';
    document.getElementById('welcomeMessage').value = settings.welcomeMessage || '歡迎使用工單系統！請描述您的問題，我們將盡快為您處理。';
}

function getSettings() {
    const defaultSettings = {
        maxTicketsPerUser: 3,
        autoCloseTime: 48,
        ticketCategoryId: '',
        logChannelId: '',
        enableNewTicketNotification: true,
        enableCloseTicketNotification: true,
        enableInactivityWarning: true,
        notificationRoleId: '',
        enableRateLimit: true,
        rateLimitCount: 5,
        rateLimitWindow: 10,
        enableAutoBlacklist: false,
        embedColor: '#3b82f6',
        botStatus: '工單系統 | /help',
        welcomeMessage: '歡迎使用工單系統！請描述您的問題，我們將盡快為您處理。'
    };
    
    try {
        const saved = localStorage.getItem('ticketSystemSettings');
        return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch (error) {
        console.error('載入設定錯誤:', error);
        return defaultSettings;
    }
}

function saveSettings(settings) {
    try {
        localStorage.setItem('ticketSystemSettings', JSON.stringify(settings));
        return true;
    } catch (error) {
        console.error('儲存設定錯誤:', error);
        return false;
    }
}

function saveAllSettings() {
    const settings = {
        maxTicketsPerUser: parseInt(document.getElementById('maxTicketsPerUser').value),
        autoCloseTime: parseInt(document.getElementById('autoCloseTime').value),
        ticketCategoryId: document.getElementById('ticketCategoryId').value.trim(),
        logChannelId: document.getElementById('logChannelId').value.trim(),
        
        enableNewTicketNotification: document.getElementById('enableNewTicketNotification').checked,
        enableCloseTicketNotification: document.getElementById('enableCloseTicketNotification').checked,
        enableInactivityWarning: document.getElementById('enableInactivityWarning').checked,
        notificationRoleId: document.getElementById('notificationRoleId').value.trim(),
        
        enableRateLimit: document.getElementById('enableRateLimit').checked,
        rateLimitCount: parseInt(document.getElementById('rateLimitCount').value),
        rateLimitWindow: parseInt(document.getElementById('rateLimitWindow').value),
        enableAutoBlacklist: document.getElementById('enableAutoBlacklist').checked,
        
        embedColor: document.getElementById('embedColor').value,
        botStatus: document.getElementById('botStatus').value.trim(),
        welcomeMessage: document.getElementById('welcomeMessage').value.trim()
    };
    
    if (saveSettings(settings)) {
        showNotification('設定已儲存', 'success');
    } else {
        showNotification('儲存設定失敗', 'error');
    }
}

function exportSettings() {
    const settings = getSettings();
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `ticket-system-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    showNotification('設定已匯出', 'success');
}

function importSettings() {
    document.getElementById('settingsFileInput').click();
}

function handleSettingsImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const settings = JSON.parse(e.target.result);
            
            // 驗證設定格式
            if (typeof settings === 'object' && settings !== null) {
                if (saveSettings(settings)) {
                    loadSettingsData();
                    showNotification('設定已匯入', 'success');
                } else {
                    showNotification('匯入設定失敗', 'error');
                }
            } else {
                showNotification('無效的設定檔案', 'error');
            }
        } catch (error) {
            console.error('匯入設定錯誤:', error);
            showNotification('設定檔案格式錯誤', 'error');
        }
    };
    
    reader.readAsText(file);
    event.target.value = ''; // 清除檔案選擇
}

function resetSettings() {
    if (confirm('確定要重置所有設定為預設值嗎？此操作無法復原。')) {
        localStorage.removeItem('ticketSystemSettings');
        loadSettingsData();
        showNotification('設定已重置為預設值', 'success');
    }
}

// 增強的工單過濾功能
function filterTickets() {
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';
    const categoryFilter = document.getElementById('categoryFilter')?.value || 'all';
    
    let filteredTickets = [...tickets];
    
    if (statusFilter !== 'all') {
        filteredTickets = filteredTickets.filter(ticket => ticket.status === statusFilter);
    }
    
    if (categoryFilter !== 'all') {
        filteredTickets = filteredTickets.filter(ticket => ticket.category === categoryFilter);
    }
    
    displayFilteredTickets(filteredTickets);
}

function displayFilteredTickets(filteredTickets) {
    const tableBody = document.getElementById('ticketsTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = filteredTickets.map(ticket => `
        <tr>
            <td>#${ticket.id}</td>
            <td>${ticket.title}</td>
            <td>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <img src="${ticket.user.avatar}" alt="${ticket.user.name}" 
                         style="width: 24px; height: 24px; border-radius: 50%;" 
                         onerror="this.style.display='none'">
                    ${ticket.user.name}
                </div>
            </td>
            <td>
                <span class="category-badge category-${ticket.category}">
                    ${getCategoryName(ticket.category)}
                </span>
            </td>
            <td>
                <span class="status-badge status-${ticket.status}">
                    ${getStatusName(ticket.status)}
                </span>
            </td>
            <td>${ticket.assignee || '未分配'}</td>
            <td>${formatDate(ticket.createdAt)}</td>
            <td>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn-small btn-primary" onclick="viewTicket(${ticket.id})" title="查看">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-small btn-secondary" onclick="editTicket(${ticket.id})" title="編輯">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-small btn-danger" onclick="closeTicketFromList(${ticket.id})" title="關閉">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function closeTicketFromList(ticketId) {
    if (confirm('確定要關閉此工單嗎？')) {
        const ticketIndex = tickets.findIndex(t => t.id === ticketId);
        if (ticketIndex !== -1) {
            tickets[ticketIndex].status = 'closed';
            tickets[ticketIndex].closedAt = new Date();
            showNotification(`工單 #${ticketId} 已關閉`, 'success');
            loadTicketsData();
            loadDashboardData();
        }
    }
}

// 設置過濾器事件監聽器
document.addEventListener('DOMContentLoaded', function() {
    // 原有的初始化代碼...
    
    // 添加過濾器事件監聽器
    setTimeout(() => {
        const statusFilter = document.getElementById('statusFilter');
        const categoryFilter = document.getElementById('categoryFilter');
        
        if (statusFilter) {
            statusFilter.addEventListener('change', filterTickets);
        }
        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', filterTickets);
        }
    }, 1000);
});

// 全域函數導出
window.addCategory = addCategory;
window.editCategory = editCategory;
window.saveCategory = saveCategory;
window.deleteCategory = deleteCategory;
window.closeCategoryModal = closeCategoryModal;

window.addStaffMember = addStaffMember;
window.editStaffMember = editStaffMember;
window.saveStaffMember = saveStaffMember;
window.removeStaffMember = removeStaffMember;
window.closeStaffModal = closeStaffModal;

window.updateAnalytics = updateAnalytics;
window.exportAnalytics = exportAnalytics;

window.saveAllSettings = saveAllSettings;
window.exportSettings = exportSettings;
window.importSettings = importSettings;
window.handleSettingsImport = handleSettingsImport;
window.resetSettings = resetSettings;

window.filterTickets = filterTickets;
window.closeTicketFromList = closeTicketFromList;