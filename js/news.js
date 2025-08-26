// Страница новостей
(function() {
    'use strict';

    let isDark = localStorage.getItem('theme') === 'dark';

    // Theme functionality
    function updateTheme() {
        document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
        
        const updateIcons = (moonClass, sunClass) => {
            const moonIcons = document.querySelectorAll(moonClass);
            const sunIcons = document.querySelectorAll(sunClass);
            
            moonIcons.forEach(icon => {
                icon.style.display = isDark ? 'none' : 'block';
            });
            
            sunIcons.forEach(icon => {
                icon.style.display = isDark ? 'block' : 'none';
            });
        };
        
        updateIcons('.moon-icon', '.sun-icon');
        updateIcons('.mobile-moon-icon', '.mobile-sun-icon');
        
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }

    function toggleTheme() {
        isDark = !isDark;
        updateTheme();
    }

    // Language functionality
    function updateLanguage(lang) {
        localStorage.setItem('language', lang);
        
        const langSwitch = document.getElementById('langSwitch');
        const mobileLangSwitch = document.getElementById('mobileLangSwitch');
        
        if (langSwitch) langSwitch.value = lang;
        if (mobileLangSwitch) mobileLangSwitch.value = lang;
        
        // Применяем переводы
        if (window.LanguageSystem) {
            window.LanguageSystem.updateLanguage(lang);
        }
    }

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
            
            if (typeof showNotification === 'function') {
                showNotification('Вы успешно вышли из системы', 'success');
            }
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
                alert('Каталог пуст. Добавьте тайтлы через админку!');
            }
        } else {
            alert('Система данных не загружена');
        }
    }

    // Time formatting
    function formatTime(date) {
        const now = new Date();
        const time = new Date(date);
        const diff = Math.floor((now - time) / 1000);

        if (diff < 60) return 'только что';
        if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
        if (diff < 604800) return `${Math.floor(diff / 86400)} дн назад`;
        
        return time.toLocaleDateString('ru-RU');
    }

    // Получение новостей
    async function getNewsData() {
        try {
            if (window.supabase) {
                const { data, error } = await window.supabase
                    .from('news')
                    .select('*')
                    .eq('is_published', true)
                    .order('created_at', { ascending: false });

                if (!error && data) {
                    return data;
                }
            }
            
            // Fallback к локальным новостям
            return [
                {
                    id: 1,
                    title: 'Добро пожаловать в Light Fox Manga!',
                    excerpt: 'Мы рады представить вам нашу платформу для чтения манги и просмотра аниме. Здесь вы найдете тысячи тайтлов на любой вкус.',
                    content: 'Полная версия новости о запуске платформы...',
                    category: 'Анонс',
                    image_url: 'https://images.pexels.com/photos/1591056/pexels-photo-1591056.jpeg',
                    created_at: new Date().toISOString()
                },
                {
                    id: 2,
                    title: 'Новые тайтлы в каталоге',
                    excerpt: 'Добавлены популярные тайтлы: Атака титанов, Наруто, Ван Пис и другие. Начинайте читать прямо сейчас!',
                    content: 'Подробности о новых тайтлах...',
                    category: 'Каталог',
                    image_url: 'https://images.pexels.com/photos/1591062/pexels-photo-1591062.jpeg',
                    created_at: new Date(Date.now() - 86400000).toISOString()
                },
                {
                    id: 3,
                    title: 'Система донатов запущена',
                    excerpt: 'Теперь вы можете поддерживать любимые проекты и ускорять выход новых серий. Каждый донат приближает релиз!',
                    content: 'Как работает система донатов...',
                    category: 'Функции',
                    image_url: 'https://images.pexels.com/photos/1591447/pexels-photo-1591447.jpeg',
                    created_at: new Date(Date.now() - 172800000).toISOString()
                },
                {
                    id: 4,
                    title: 'Премиум подписки доступны',
                    excerpt: 'Оформите подписку и получите доступ к эксклюзивному контенту, раннему доступу и другим привилегиям.',
                    content: 'Подробности о подписках...',
                    category: 'Подписки',
                    image_url: 'https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg',
                    created_at: new Date(Date.now() - 259200000).toISOString()
                }
            ];
        } catch (error) {
            console.error('Error loading news:', error);
            return [];
        }
    }

    // Загрузка новостей
    async function loadNews() {
        const grid = document.getElementById('newsGrid');
        if (!grid) return;
        
        try {
            const newsData = await getNewsData();
            
            if (newsData.length === 0) {
                grid.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">📰</div>
                        <div class="empty-title">Новостей пока нет</div>
                        <div class="empty-text">Следите за обновлениями!</div>
                    </div>
                `;
                return;
            }
            
            grid.innerHTML = newsData.map(news => `
                <div class="news-card" onclick="openNewsDetail(${news.id})">
                    ${news.image_url ? `
                        <div class="news-image">
                            <img src="${news.image_url}" alt="${news.title}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px 8px 0 0;">
                        </div>
                    ` : ''}
                    <div class="news-content">
                        <h3 class="news-title">${news.title}</h3>
                        <p class="news-excerpt">${news.excerpt}</p>
                        <div class="news-meta">
                            <span class="news-tag">${news.category}</span>
                            <span>${formatTime(news.created_at)}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Load news error:', error);
            grid.innerHTML = '<div class="loading">Ошибка загрузки новостей</div>';
        }
    }

    // Открытие детальной новости
    function openNewsDetail(newsId) {
        // В будущем можно сделать отдельную страницу для новости
        console.log('Opening news:', newsId);
    }

    // Notification function
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
        console.log('📰 Новости: DOM загружен');
        
        // Theme toggles
        const themeToggle = document.getElementById('themeToggle');
        const mobileThemeToggle = document.getElementById('mobileThemeToggle');
        
        if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
        if (mobileThemeToggle) mobileThemeToggle.addEventListener('click', toggleTheme);

        // Language switches
        const langSwitch = document.getElementById('langSwitch');
        const mobileLangSwitch = document.getElementById('mobileLangSwitch');
        
        if (langSwitch) {
            langSwitch.addEventListener('change', (e) => updateLanguage(e.target.value));
        }
        if (mobileLangSwitch) {
            mobileLangSwitch.addEventListener('change', (e) => updateLanguage(e.target.value));
        }

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
        updateTheme();
        updateAuthState();
        
        // Load saved language
        const savedLang = localStorage.getItem('language') || 'ru';
        updateLanguage(savedLang);

        // Load news
        loadNews();
    });

    // Export functions globally
    window.toggleTheme = toggleTheme;
    window.updateTheme = updateTheme;
    window.updateLanguage = updateLanguage;
    window.toggleMenu = toggleMenu;
    window.closeMenu = closeMenu;
    window.login = login;
    window.logout = logout;
    window.openRandomManga = openRandomManga;
    window.updateAuthState = updateAuthState;
    window.showNotification = showNotification;
    window.openNewsDetail = openNewsDetail;

    console.log('📰 Страница новостей загружена');

})();