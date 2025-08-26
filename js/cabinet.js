// Личный кабинет с отображением подписок
(function() {
    'use strict';

    let currentSection = null;
    let userLists = {
        favorites: [],
        watching: [],
        wantToWatch: [],
        completed: []
    };

    // Authentication functionality
    function updateAuthState() {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        
        const authSection = document.getElementById('authSection');
        const userSection = document.getElementById('userSection');
        const logoutBtn = document.getElementById('logoutBtn');
        
        if (isLoggedIn && currentUser) {
            if (authSection) authSection.style.display = 'none';
            if (userSection) userSection.style.display = 'block';
            if (logoutBtn) logoutBtn.style.display = 'block';
            
            const userName = document.getElementById('userName');
            const userEmail = document.getElementById('userEmail');
            
            if (userName) userName.textContent = currentUser.name || currentUser.username || 'Пользователь';
            if (userEmail) userEmail.textContent = currentUser.email || 'user@example.com';
        } else {
            if (authSection) authSection.style.display = 'block';
            if (userSection) userSection.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'none';
        }
    }

    function login() {
        if (typeof window.showAuthModal === 'function') {
            window.showAuthModal('login');
        } else {
            window.location.href = 'registr.html';
        }
    }

    function logout() {
        if (confirm('Вы уверены, что хотите выйти?')) {
            if (window.supabase && window.supabase.auth.signOut) {
                window.supabase.auth.signOut();
            }
            
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('currentUser');
            
            updateAuthState();
            closeMenu();
            
            showNotification('Вы успешно вышли из системы', 'success');
        }
    }

    // Menu functionality
    function toggleMenu() {
        const sideMenu = document.getElementById('sideMenu');
        const menuOverlay = document.getElementById('menuOverlay');
        
        if (sideMenu && menuOverlay) {
            sideMenu.classList.toggle('open');
            menuOverlay.classList.toggle('show');
        }
    }

    function closeMenu() {
        const sideMenu = document.getElementById('sideMenu');
        const menuOverlay = document.getElementById('menuOverlay');
        
        if (sideMenu && menuOverlay) {
            sideMenu.classList.remove('open');
            menuOverlay.classList.remove('show');
        }
    }

    // Random manga functionality
    function openRandomManga() {
        if (window.MangaAPI) {
            const allManga = window.MangaAPI.getAllManga();
            if (allManga.length > 0) {
                const randomManga = allManga[Math.floor(Math.random() * allManga.length)];
                window.location.href = `player.html?id=${randomManga.id}`;
            } else {
                showNotification('Каталог пуст', 'error');
            }
        } else {
            showNotification('Система данных не загружена', 'error');
        }
    }

    // Initialize cabinet
    function initializeCabinet() {
        console.log('🏠 Инициализация личного кабинета...');
        
        loadUserLists();
        updateCounts();
        updateSubscriptionStatus();
        
        console.log('✅ Личный кабинет инициализирован');
    }

    // Load user lists from localStorage and Supabase
    async function loadUserLists() {
        try {
            if (window.supabase) {
                const { data: { user } } = await window.supabase.auth.getUser();
                
                if (user) {
                    // Загружаем из Supabase
                    const { data: lists } = await window.supabase
                        .from('user_lists')
                        .select(`
                            *,
                            manga:manga(*)
                        `)
                        .eq('user_id', user.id);

                    if (lists) {
                        // Группируем по типам списков
                        userLists.favorites = lists.filter(item => item.list_type === 'favorites');
                        userLists.watching = lists.filter(item => item.list_type === 'watching');
                        userLists.wantToWatch = lists.filter(item => item.list_type === 'want_to_watch');
                        userLists.completed = lists.filter(item => item.list_type === 'completed');
                    }
                }
            } else {
                // Fallback к localStorage
                Object.keys(userLists).forEach(listName => {
                    const saved = localStorage.getItem(listName);
                    if (saved) {
                        try {
                            userLists[listName] = JSON.parse(saved);
                        } catch (e) {
                            console.error(`Error loading ${listName}:`, e);
                            userLists[listName] = [];
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Load user lists error:', error);
        }
    }

    // Update section counts
    function updateCounts() {
        Object.keys(userLists).forEach(listName => {
            const countElement = document.getElementById(listName + 'Count');
            if (countElement) {
                countElement.textContent = userLists[listName].length;
            }
        });
    }

    // Update subscription status
    async function updateSubscriptionStatus() {
        try {
            let subscription = null;
            
            if (window.supabase) {
                const { data: { user } } = await window.supabase.auth.getUser();
                
                if (user) {
                    const { data: profile } = await window.supabase
                        .from('users')
                        .select('subscription_tier, subscription_expires_at')
                        .eq('id', user.id)
                        .single();

                    if (profile && profile.subscription_expires_at && new Date(profile.subscription_expires_at) > new Date()) {
                        subscription = {
                            planType: profile.subscription_tier,
                            expiresAt: profile.subscription_expires_at
                        };
                    }
                }
            } else {
                // Fallback к localStorage
                subscription = JSON.parse(localStorage.getItem('userSubscription') || 'null');
            }
            
            const statusElement = document.getElementById('subscriptionStatus');
            const descriptionElement = document.getElementById('subscriptionDescription');
            
            if (!statusElement || !descriptionElement) return;
            
            if (subscription && new Date(subscription.expiresAt) > new Date()) {
                const planNames = {
                    'free': 'Любители Манги',
                    'basic': 'Любители Пика',
                    'premium': 'Орден Шейхов',
                    'vip': 'Лисямбы'
                };
                
                statusElement.textContent = planNames[subscription.planType] || subscription.planType;
                statusElement.classList.add('active');
                
                const daysLeft = Math.ceil((new Date(subscription.expiresAt) - new Date()) / (1000 * 60 * 60 * 24));
                descriptionElement.textContent = `Активна до ${new Date(subscription.expiresAt).toLocaleDateString('ru-RU')} (${daysLeft} дней)`;
            } else {
                statusElement.textContent = 'Не активна';
                statusElement.classList.remove('active');
                descriptionElement.textContent = 'Оформите подписку для доступа к премиум контенту';
            }
        } catch (error) {
            console.error('Update subscription status error:', error);
        }
    }

    // Section navigation
    function openSection(sectionName) {
        currentSection = sectionName;
        
        const dashboardView = document.getElementById('dashboard-view');
        const sectionDetail = document.getElementById('section-detail');
        
        if (dashboardView) dashboardView.style.display = 'none';
        if (sectionDetail) sectionDetail.classList.add('active');
        
        const titles = {
            favorites: 'Избранное',
            watching: 'Смотрю',
            wantToWatch: 'Хочу посмотреть',
            completed: 'Досмотрел',
            subscription: 'Моя подписка',
            notifications: 'Уведомления'
        };
        
        const sectionTitle = document.getElementById('sectionTitle');
        if (sectionTitle) {
            sectionTitle.textContent = titles[sectionName] || sectionName;
        }
        
        loadSectionContent(sectionName);
    }

    function backToDashboard() {
        const dashboardView = document.getElementById('dashboard-view');
        const sectionDetail = document.getElementById('section-detail');
        
        if (dashboardView) dashboardView.style.display = 'block';
        if (sectionDetail) sectionDetail.classList.remove('active');
        
        currentSection = null;
    }

    // Load section content
    function loadSectionContent(sectionName) {
        const container = document.getElementById('sectionContent');
        if (!container) return;
        
        if (sectionName === 'subscription') {
            loadSubscriptionContent(container);
            return;
        }
        
        if (sectionName === 'notifications') {
            loadNotifications(container);
            return;
        }
        
        const items = userLists[sectionName] || [];

        if (items.length === 0) {
            const emptyStates = {
                favorites: {
                    icon: '❤️',
                    title: 'Нет избранных тайтлов',
                    text: 'Добавляйте тайтлы в избранное из каталога или плеера'
                },
                watching: {
                    icon: '▶️',
                    title: 'Не читаете тайтлы',
                    text: 'Начните читать тайтлы и они появятся здесь'
                },
                wantToWatch: {
                    icon: '📚',
                    title: 'Список пуст',
                    text: 'Добавляйте интересные тайтлы в планы'
                },
                completed: {
                    icon: '✅',
                    title: 'Нет завершенных',
                    text: 'Прочитанные тайтлы будут отображаться здесь'
                }
            };

            const state = emptyStates[sectionName];
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">${state.icon}</div>
                    <div class="empty-title">${state.title}</div>
                    <div class="empty-text">${state.text}</div>
                    <a href="catalog.html" class="empty-action">
                        <span>🔍</span>
                        Открыть каталог
                    </a>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="manga-grid">
                ${items.map(item => renderMangaCard(item)).join('')}
            </div>
        `;
    }

    // Load subscription content
    async function loadSubscriptionContent(container) {
        try {
            let subscription = null;
            
            if (window.supabase) {
                const { data: { user } } = await window.supabase.auth.getUser();
                
                if (user) {
                    const { data: profile } = await window.supabase
                        .from('users')
                        .select('subscription_tier, subscription_expires_at')
                        .eq('id', user.id)
                        .single();

                    if (profile && profile.subscription_expires_at && new Date(profile.subscription_expires_at) > new Date()) {
                        subscription = {
                            planType: profile.subscription_tier,
                            expiresAt: profile.subscription_expires_at
                        };
                    }
                }
            } else {
                subscription = JSON.parse(localStorage.getItem('userSubscription') || 'null');
            }
            
            if (!subscription || new Date(subscription.expiresAt) <= new Date()) {
                container.innerHTML = `
                    <div class="subscription-inactive">
                        <div class="subscription-icon">💎</div>
                        <h3>Подписка не активна</h3>
                        <p>Оформите подписку для доступа к премиум контенту и эксклюзивным тайтлам</p>
                        <a href="subscriptions.html" class="subscription-btn">
                            <span>🚀</span>
                            Выбрать подписку
                        </a>
                    </div>
                `;
                return;
            }
            
            const planNames = {
                'free': 'Любители Манги',
                'basic': 'Любители Пика', 
                'premium': 'Орден Шейхов',
                'vip': 'Лисямбы'
            };

            const planIcons = {
                'free': '📖',
                'basic': '🎯',
                'premium': '👑',
                'vip': '🌟'
            };

            const planFeatures = {
                'free': ['3 главы в день', 'Базовое качество', 'С рекламой'],
                'basic': ['10 глав в день', 'HD качество', 'Без рекламы'],
                'premium': ['Безлимитные главы', '4K качество', 'Ранний доступ', 'Офлайн чтение'],
                'vip': ['Все функции Premium', 'Эксклюзивный контент', 'VIP значок', 'Голосование']
            };
            
            const daysLeft = Math.ceil((new Date(subscription.expiresAt) - new Date()) / (1000 * 60 * 60 * 24));
            const isExpiringSoon = daysLeft <= 7;
            
            container.innerHTML = `
                <div class="subscription-active">
                    <div class="subscription-card">
                        <div class="subscription-header">
                            <div class="subscription-plan">
                                <span class="plan-icon">${planIcons[subscription.planType] || '💎'}</span>
                                <div>
                                    <h3>${planNames[subscription.planType] || subscription.planType}</h3>
                                    <p class="plan-tier">${subscription.planType.charAt(0).toUpperCase() + subscription.planType.slice(1)}</p>
                                </div>
                            </div>
                            <div class="subscription-status ${isExpiringSoon ? 'expiring' : 'active'}">
                                ${isExpiringSoon ? '⚠️ Истекает' : '✅ Активна'}
                            </div>
                        </div>
                        
                        <div class="subscription-details">
                            <div class="detail-row">
                                <span>Действует до:</span>
                                <span class="expiry-date ${isExpiringSoon ? 'expiring' : ''}">${new Date(subscription.expiresAt).toLocaleDateString('ru-RU')}</span>
                            </div>
                            <div class="detail-row">
                                <span>Осталось дней:</span>
                                <span class="${isExpiringSoon ? 'expiring' : ''}">${daysLeft}</span>
                            </div>
                            <div class="detail-row">
                                <span>Тип подписки:</span>
                                <span>${planNames[subscription.planType] || subscription.planType}</span>
                            </div>
                        </div>
                        
                        <div class="subscription-features">
                            <h4>Ваши привилегии:</h4>
                            <ul>
                                ${(planFeatures[subscription.planType] || []).map(feature => `<li>✅ ${feature}</li>`).join('')}
                            </ul>
                        </div>
                        
                        <div class="subscription-actions">
                            <a href="subscriptions.html" class="subscription-btn primary">
                                <span>🔄</span>
                                Продлить подписку
                            </a>
                            <button class="subscription-btn secondary" onclick="cancelSubscription()">
                                <span>❌</span>
                                Отменить подписку
                            </button>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Load subscription content error:', error);
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">❌</div>
                    <div class="empty-title">Ошибка загрузки подписки</div>
                    <div class="empty-text">Попробуйте перезагрузить страницу</div>
                </div>
            `;
        }
    }

    // Load notifications
    function loadNotifications(container) {
        const notifications = window.NotificationSystem ? window.NotificationSystem.getUserNotifications() : [];
        const unreadCount = window.NotificationSystem ? window.NotificationSystem.getUnreadNotifications().length : 0;

        if (notifications.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔔</div>
                    <div class="empty-title">Нет уведомлений</div>
                    <div class="empty-text">Подпишитесь на тайтлы, чтобы получать уведомления о новых сериях</div>
                    <a href="catalog.html" class="empty-action">
                        <span>🔍</span>
                        Открыть каталог
                    </a>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="notifications-header">
                <div class="notifications-stats">
                    <span>Всего: ${notifications.length}</span>
                    ${unreadCount > 0 ? `<span class="unread-count">Новых: ${unreadCount}</span>` : ''}
                </div>
                ${unreadCount > 0 ? `
                    <button class="btn btn-secondary" onclick="markAllNotificationsRead()">
                        Отметить все как прочитанные
                    </button>
                ` : ''}
            </div>
            
            <div class="notifications-list">
                ${notifications.map(notification => renderNotificationItem(notification)).join('')}
            </div>
        `;

        // Отмечаем уведомления как прочитанные при просмотре
        setTimeout(() => {
            if (window.NotificationSystem) {
                window.NotificationSystem.markAllAsRead();
            }
        }, 1000);
    }

    function renderNotificationItem(notification) {
        const timeAgo = window.formatTime ? window.formatTime(notification.created_at || notification.createdAt) : 'недавно';
        const isUnread = !notification.read && !notification.is_read;
        
        return `
            <div class="notification-item ${isUnread ? 'unread' : ''}" onclick="openNotificationManga('${notification.manga_id || notification.mangaId}', '${notification.id}')">
                <div class="notification-content">
                    <div class="notification-header">
                        <img src="${notification.manga?.cover_url || notification.mangaImage || 'https://images.pexels.com/photos/1591056/pexels-photo-1591056.jpeg'}" 
                             alt="${notification.manga?.title || notification.mangaTitle}" 
                             class="notification-manga-image"
                             onerror="this.src='https://images.pexels.com/photos/1591062/pexels-photo-1591062.jpeg'">
                        <div class="notification-info">
                            <div class="notification-title">${notification.title}</div>
                            <div class="notification-message">${notification.message}</div>
                            <div class="notification-time">${timeAgo}</div>
                        </div>
                        ${isUnread ? '<div class="unread-indicator"></div>' : ''}
                    </div>
                </div>
                <button class="notification-delete" onclick="event.stopPropagation(); deleteNotification('${notification.id}')">
                    ✕
                </button>
            </div>
        `;
    }

    function openNotificationManga(mangaId, notificationId) {
        if (window.NotificationSystem) {
            window.NotificationSystem.markAsRead(notificationId);
        }
        window.location.href = `player.html?id=${mangaId}`;
    }

    function deleteNotification(notificationId) {
        if (window.NotificationSystem) {
            window.NotificationSystem.deleteNotification(notificationId);
            loadSectionContent('notifications');
            showNotification('Уведомление удалено', 'success');
        }
    }

    function markAllNotificationsRead() {
        if (window.NotificationSystem) {
            window.NotificationSystem.markAllAsRead();
            loadSectionContent('notifications');
            showNotification('Все уведомления отмечены как прочитанные', 'success');
        }
    }

    // Render manga card for lists
    function renderMangaCard(item) {
        let manga = item.manga || item;
        const mangaId = manga.id || item.manga_id;
        const itemId = item.id;

        return `
            <div class="manga-card" onclick="openManga('${mangaId}')">
                <div class="manga-poster-container">
                    <img src="${manga.cover_url || manga.image || 'https://images.pexels.com/photos/1591056/pexels-photo-1591056.jpeg'}" 
                         alt="${manga.title}" class="manga-poster"
                         onerror="this.src='https://images.pexels.com/photos/1591062/pexels-photo-1591062.jpeg'">
                    ${item.current_episode ? `<div class="manga-badge">Серия ${item.current_episode}</div>` : ''}
                </div>
                
                <div class="manga-info">
                    <div class="manga-title">${manga.title}</div>
                    <div class="manga-meta">
                        ${manga.type || 'Манга'} • ⭐ ${manga.rating || 'N/A'}
                    </div>
                    
                    <div class="manga-actions">
                        <button class="action-btn primary" onclick="event.stopPropagation(); openManga('${mangaId}')">
                            Читать
                        </button>
                        <button class="action-btn" onclick="event.stopPropagation(); removeFromList('${currentSection}', '${itemId}')">
                            Удалить
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // User actions
    function openManga(mangaId) {
        if (mangaId && mangaId !== 'undefined') {
            window.location.href = `player.html?id=${mangaId}`;
        } else {
            showNotification('Тайтл не найден', 'error');
        }
    }

    async function removeFromList(listName, itemId) {
        try {
            if (window.supabase) {
                const { error } = await window.supabase
                    .from('user_lists')
                    .delete()
                    .eq('id', itemId);

                if (error) throw error;
            }
            
            // Обновляем локальные данные
            const list = userLists[listName];
            if (list) {
                const index = list.findIndex(item => item.id === itemId);
                if (index !== -1) {
                    list.splice(index, 1);
                }
            }
            
            updateCounts();
            
            if (currentSection === listName) {
                loadSectionContent(listName);
            }
            
            showNotification('Удалено из списка', 'success');
        } catch (error) {
            console.error('Remove from list error:', error);
            showNotification('Ошибка удаления', 'error');
        }
    }

    // Cancel subscription
    async function cancelSubscription() {
        if (confirm('Вы уверены, что хотите отменить подписку? Доступ к премиум контенту будет ограничен.')) {
            try {
                if (window.supabase) {
                    const { data: { user } } = await window.supabase.auth.getUser();
                    
                    if (user) {
                        await window.supabase
                            .from('users')
                            .update({
                                subscription_tier: 'free',
                                subscription_expires_at: null
                            })
                            .eq('id', user.id);
                    }
                }
                
                localStorage.removeItem('userSubscription');
                updateSubscriptionStatus();
                loadSectionContent('subscription');
                showNotification('Подписка отменена', 'warning');
            } catch (error) {
                console.error('Cancel subscription error:', error);
                showNotification('Ошибка отмены подписки', 'error');
            }
        }
    }

    // Notifications functionality
    function openNotifications() {
        openSection('notifications');
    }

    // Utility functions
    function showNotification(message, type = 'success') {
        let notification = document.getElementById('notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'notification';
            notification.className = 'notification';
            notification.style.cssText = `
                position: fixed;
                top: 80px;
                right: 20px;
                padding: 12px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 2000;
                transform: translateX(100%);
                transition: transform 0.3s ease;
                max-width: 300px;
                font-weight: 500;
            `;
            document.body.appendChild(notification);
        }
        
        const colors = {
            success: { bg: '#10b981', color: 'white' },
            error: { bg: '#ef4444', color: 'white' },
            warning: { bg: '#f59e0b', color: 'white' },
            info: { bg: '#3b82f6', color: 'white' }
        };
        
        const style = colors[type] || colors.success;
        notification.style.background = style.bg;
        notification.style.color = style.color;
        notification.textContent = message;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    // Event listeners
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🏠 Кабинет: DOM загружен');
        
        // Profile buttons
        const profileBtn = document.getElementById('profileBtn');
        const mobileProfileBtn = document.getElementById('mobileProfileBtn');
        
        if (profileBtn) profileBtn.addEventListener('click', toggleMenu);
        if (mobileProfileBtn) {
            mobileProfileBtn.addEventListener('click', (e) => {
                e.preventDefault();
                toggleMenu();
            });
        }

        // Menu overlay
        const menuOverlay = document.getElementById('menuOverlay');
        if (menuOverlay) menuOverlay.addEventListener('click', closeMenu);

        // Initialize
        updateAuthState();
        initializeCabinet();
    });

    // Export functions globally
    window.toggleMenu = toggleMenu;
    window.closeMenu = closeMenu;
    window.login = login;
    window.logout = logout;
    window.openRandomManga = openRandomManga;
    window.openSection = openSection;
    window.backToDashboard = backToDashboard;
    window.openManga = openManga;
    window.removeFromList = removeFromList;
    window.cancelSubscription = cancelSubscription;
    window.openNotifications = openNotifications;
    window.openNotificationManga = openNotificationManga;
    window.deleteNotification = deleteNotification;
    window.markAllNotificationsRead = markAllNotificationsRead;
    window.showNotification = showNotification;
    window.updateAuthState = updateAuthState;

    console.log('🏠 Личный кабинет загружен');

})();